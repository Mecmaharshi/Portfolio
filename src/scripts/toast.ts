// A single small confirmation pill at the bottom of the screen ("Copied", "Link copied").
let timer: number | undefined;

export function toast(message: string) {
  let el = document.getElementById('toast');
  if (!el) {
    // Recreated after client-side navigations, which replace <body>
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.remove('toast-show');
  void el.offsetWidth; // restart the entrance when toasts fire back to back
  el.classList.add('toast-show');
  clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove('toast-show'), 1800);
}
