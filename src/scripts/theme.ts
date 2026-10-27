export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // storage blocked (private mode); the theme still applies for this page view
  }
}

// Switches theme with a circular reveal growing from `origin` (e.g. the clicked button).
// Falls back to an instant swap without View Transitions support or with reduced motion.
export function toggleTheme(origin?: { x: number; y: number }) {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) {
    setTheme(next);
    return;
  }

  const x = origin?.x ?? innerWidth / 2;
  const y = origin?.y ?? 0;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const root = document.documentElement;
  root.classList.add('theme-switching');

  const transition = document.startViewTransition(() => setTheme(next));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  });
  transition.finished.finally(() => root.classList.remove('theme-switching'));
}
