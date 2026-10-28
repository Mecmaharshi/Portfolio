import { initCountUp } from './count-up';
import { isSoundOn, play, toggleSound } from './sound';
import { toggleTheme } from './theme';

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

document.addEventListener('astro:page-load', () => {
  if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
    document.querySelectorAll('[data-mod-key]').forEach((el) => (el.textContent = '⌘'));
  }
  initCountUp();
  syncSoundToggles();
});

function syncSoundToggles() {
  document
    .querySelectorAll('[data-sound-toggle]')
    .forEach((el) => el.setAttribute('aria-pressed', String(isSoundOn())));
}
window.addEventListener('sound:change', syncSoundToggles);
