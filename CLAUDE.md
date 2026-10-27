# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio of Maharshi Ishu Jasraj (Backend Engineer, AI/LLM), deployed on Netlify's free tier at https://maharshiishujasraj.netlify.app. It is a static Astro site: no server rendering, no Netlify Functions. Keep it static so it stays within the free tier.

The `revamp` branch replaces the old jQuery template that is still live on `main`. Planned phases: 1. foundation (done); 2. launch set: Work index, 2 flagship case studies with interactive architecture diagrams, Resume, Contact (Netlify Forms), then merge to `main`; 3. remaining case studies, About page, Writing; 4. Loops gallery (looping animations of backend/AI concepts), hidden extras, link-preview images.

## Commands

```sh
npm run dev       # dev server at http://localhost:4321 (astro dev --background runs it detached)
npm run build     # static build into dist/
npm run preview   # serve dist/
npm run check     # astro check: type-check .astro/.ts/.tsx (the only automated check; no tests)
npm run format    # prettier with the Astro plugin
```

Node >= 22.23.4 (Astro 7). Netlify builds with Node 24 via `netlify.toml`.

## Architecture

- **Stack:** Astro 7, Tailwind CSS 4 (Vite plugin, configured in CSS, no tailwind.config), MDX, React 19 only for interactive islands, self-hosted fonts from `@fontsource-variable` (Bricolage Grotesque for display, Geist for body, Geist Mono). Motion and GSAP are installed for upcoming animation work.
- **Single layout:** every page uses `src/layouts/BaseLayout.astro`, which holds SEO/OG meta, the theme bootstrap script, `<ClientRouter />` (client-side navigation with view transitions), the header and footer, and the command palette island.
- **Client-side navigation:** because of `ClientRouter`, bundled `<script>`s run once per visit, not once per page. Per-page setup must run inside `document.addEventListener('astro:page-load', ...)`. Global click handling in `src/scripts/ui.ts` uses event delegation on `document` with data attributes (`data-theme-toggle`, `data-palette-open`) for this reason.
- **Theming:** color tokens are CSS variables in `src/styles/global.css`, defined for light (`:root`), dark (`[data-theme="dark"]`) and a no-JS `prefers-color-scheme` fallback (keep all three in sync). They are exposed to Tailwind through `@theme inline` (`bg-bg`, `text-muted`, `text-accent-ink`, etc.). Dark mode is the custom `dark:` variant keyed on `data-theme`. The inline script in BaseLayout sets `data-theme` before paint and on `astro:before-swap`. `src/scripts/theme.ts` toggles with a circular view-transition reveal.
- **Command palette:** `src/components/CommandPalette.tsx` (cmdk + Radix Dialog), mounted `client:idle` with `transition:persist`. It opens on ⌘K/Ctrl+K or the `palette:open` window event.
- **Site data:** `src/data/site.ts` holds identity, email, social links and `nav`. A page appears in the header and palette only once its `nav` entry is `ready: true`, so unbuilt pages are never linked. Flip the flag when a page ships.
- **Motion rules:** every animation must respect `prefers-reduced-motion` (a global rule in `global.css` shortens CSS animations; JS animations check `matchMedia` themselves, as `src/scripts/count-up.ts` does), and server-rendered text must already be the final state so no-JS visitors see correct content.

## Content rules

- Employers Dentsu and Celebal Technologies may be named and their systems described in detail. The 3 client brands at Dentsu must never be named (client policy); write "3 global brands".
- The public email is `maharshi.jasraj@gmail.com`; contact-form notifications go to it and to `mecmaharshi9@gmail.com`. Never publish the phone number.
- `/Resume.pdf` at the repo root is the private copy (it has the phone number) and is gitignored. Publish a redacted copy under `public/` instead.
- Every claim should be backed by evidence (metrics, diagrams, links). The numbers on the homepage come from the resume; keep them in sync with it.

## Verifying UI changes

There is no browser test suite. To check a change visually, build, run `npm run preview`, and drive Microsoft Edge (installed on this machine) with `playwright-core` (`chromium.launch({ channel: 'msedge' })`), kept outside the repo. Plain `msedge --headless --screenshot` can't render windows narrower than about 500px, so use Playwright device emulation for mobile.
