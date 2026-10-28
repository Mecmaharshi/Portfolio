import { play } from './sound';
import { toast } from './toast';

// Easter egg (terminal `chaos`, or the ⌘K palette): a chaos monkey knocks what's on screen
// out of place, then everything recovers. Uses the Web Animations API on the individual
// `translate`/`rotate` properties, so it never restarts the CSS reveal animations.
let running = false;

export function releaseChaos() {
  if (running) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toast('Chaos skipped: reduced motion is on', 'warn');
    return;
  }
  running = true;

  const targets = [
    ...document.querySelectorAll<HTMLElement>('main :is(h1, h2, h3, p, img, svg, a.btn, .spotlight, li)'),
  ]
    // Only what's on screen, and never an element inside one that already moves
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
    })
    .filter((el, _, all) => !all.some((other) => other !== el && other.contains(el)))
    .slice(0, 40);

  const rand = (max: number) => (Math.random() * 2 - 1) * max;
  const duration = 2600;
  for (const el of targets) {
    const off = { translate: `${rand(14)}px ${rand(10)}px`, rotate: `${rand(7)}deg` };
    el.animate(
      [
        { translate: '0 0', rotate: '0deg', opacity: 1 },
        { ...off, opacity: 1, offset: 0.1 },
        { ...off, opacity: 0.25, offset: 0.16 },
        { ...off, opacity: 1, offset: 0.22, easing: 'steps(1)' },
        { ...off, opacity: 1, offset: 0.68, easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)' },
        { translate: '0 0', rotate: '0deg', opacity: 1 },
      ],
      { duration, delay: Math.random() * 250, easing: 'ease-out' },
    );
  }

  play('fail');
  toast('Chaos monkey released: injecting failures…', 'warn');
  setTimeout(() => {
    play('ok');
    toast('All systems recovered');
  }, duration * 0.72);
  setTimeout(() => (running = false), duration + 300);
}
