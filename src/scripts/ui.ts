import { initCountUp } from './count-up';
import { isSoundOn, play, toggleSound } from './sound';
import { toggleTheme } from './theme';
import { toast } from './toast';

// Bundled scripts run once per visit, so listen on document and match by data attribute:
// this keeps working after client-side navigations swap the page content.
document.addEventListener('click', (e) => {
  const target = e.target as Element;

  const themeButton = target.closest('[data-theme-toggle]');
  if (themeButton) {
    const rect = themeButton.getBoundingClientRect();
    toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    play('switch');
  }

  if (target.closest('[data-sound-toggle]')) toggleSound();

  if (target.closest('[data-palette-open]')) {
    window.dispatchEvent(new Event('palette:open'));
  }
});

// Card spotlight: feed the pointer position to .spotlight elements as CSS variables
document.addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = (e.target as Element).closest?.<HTMLElement>('.spotlight');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  },
  { passive: true },
);

// Header hides while scrolling down and returns on the way up; reading progress follows the article
let lastY = scrollY;
let ticking = false;
addEventListener(
  'scroll',
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      const header = document.querySelector('[data-site-header]');
      if (header && Math.abs(y - lastY) > 4) {
        header.classList.toggle('header-hidden', y > lastY && y > 160);
        lastY = y;
      }
      updateProgress();
    });
  },
  { passive: true },
);

function updateProgress() {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const article = document.querySelector('article');
  if (!bar || !article) return;
  const rect = article.getBoundingClientRect();
  const total = rect.height - innerHeight;
  const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
  bar.style.transform = `scaleX(${progress})`;
}

let revealObserver: IntersectionObserver | undefined;

function initReveal() {
  revealObserver?.disconnect();
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      const el = child as HTMLElement;
      el.dataset.reveal = '';
      el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 80}ms`);
    });
  });
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('revealed');
        revealObserver!.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el) => revealObserver!.observe(el));
}

// Long-form pages: "#" links on headings, copy buttons on code blocks
function initProse() {
  document.querySelectorAll<HTMLElement>('.prose-site :is(h2, h3)[id]').forEach((heading) => {
    if (heading.querySelector('.heading-anchor')) return;
    const anchor = document.createElement('a');
    anchor.href = `#${heading.id}`;
    anchor.className = 'heading-anchor';
    anchor.textContent = '#';
    anchor.setAttribute('aria-label', `Link to section: ${heading.textContent}`);
    anchor.addEventListener('click', () => {
      navigator.clipboard?.writeText(`${location.origin}${location.pathname}#${heading.id}`).then(
        () => toast('Link copied'),
        () => {},
      );
    });
    heading.append(anchor);
  });

  document.querySelectorAll<HTMLElement>('.prose-site pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.replaceWith(wrap);
    wrap.append(pre);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'copy';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        button.textContent = 'copied ✓';
        toast('Code copied');
        play('chime');
      } catch {
        button.textContent = 'copy failed';
      }
      setTimeout(() => (button.textContent = 'copy'), 1500);
    });
    wrap.append(button);
  });
}

document.addEventListener('astro:page-load', () => {
  if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
    document.querySelectorAll('[data-mod-key]').forEach((el) => (el.textContent = '⌘'));
  }
  lastY = scrollY;
  initCountUp();
  initReveal();
  initProse();
  updateProgress();
  syncSoundToggles();
});

function syncSoundToggles() {
  document
    .querySelectorAll('[data-sound-toggle]')
    .forEach((el) => el.setAttribute('aria-pressed', String(isSoundOn())));
}
window.addEventListener('sound:change', syncSoundToggles);
