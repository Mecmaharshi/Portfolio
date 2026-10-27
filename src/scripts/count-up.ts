// Animates [data-count-to] elements from 0 up to their value the first time they scroll into view,
// then restores the server-rendered text (e.g. "30k+"), so no-JS and reduced-motion visitors
// simply see the final value.
const format = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function initCountUp() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        animate(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );

  document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => observer.observe(el));
}

function animate(el: HTMLElement) {
  const target = Number(el.dataset.countTo);
  const finalText = el.textContent;
  const duration = 1400;
  const start = performance.now();

  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = format.format(target * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  };
  requestAnimationFrame(tick);
}
