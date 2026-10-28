import { initCountUp } from './count-up';
import { toggleTheme } from './theme';

// Bundled scripts run once per visit, so listen on document and match by data attribute:
// this keeps working after client-side navigations swap the page content.
document.addEventListener('click', (e) => {
  const target = e.target as Element;

  const themeButton = target.closest('[data-theme-toggle]');
  if (themeButton) {
    const rect = themeButton.getBoundingClientRect();
    toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }

  if (target.closest('[data-palette-open]')) {
    window.dispatchEvent(new Event('palette:open'));
  }
});

document.addEventListener('astro:page-load', () => {
  if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
    document.querySelectorAll('[data-mod-key]').forEach((el) => (el.textContent = '⌘'));
  }
  initCountUp();
});
