# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio of Maharshi Ishu Jasraj (Backend Engineer, AI/LLM), deployed on Netlify's free tier at https://maharshiishujasraj.netlify.app. It is a static Astro site: no server rendering, no Netlify Functions. Keep it static so it stays within the free tier.

The `revamp` branch replaces the old jQuery template that is still live on `main`. Deferred until the owner asks: an "ask about my work" AI assistant, and featuring GitHub prominently.

## Commands

```sh
npm run dev          # dev server at http://localhost:4321 (shows draft posts)
npm run build        # static build into dist/ (also renders /og/*.png link-preview images)
npm run preview      # serve dist/ (Astro allows one preview per project: `npx astro preview stop`)
npm run check        # astro check: type-check .astro/.ts/.tsx (the only automated check; no tests)
npm run format       # prettier with the Astro plugin
npm run resume:pdf   # after a build: prints /resume to public/maharshi-ishu-jasraj-resume.pdf via local Edge
npm run check:html   # after a build: fails on whitespace bugs around inline elements (see below)
```

Node >= 22.23.4 (Astro 7). Netlify builds with Node 24 via `netlify.toml`.

## Architecture

- **Stack:** Astro 7, Tailwind CSS 4 (Vite plugin, configured in CSS, no tailwind.config) with the typography plugin, MDX, React 19 only for interactive islands, self-hosted fonts from `@fontsource-variable` (Bricolage Grotesque display, Geist body, Geist Mono).
- **Content:** `src/content.config.ts` defines `work` (case studies) and `writing` (posts), both MDX. The file name is the URL. Always read them through `src/lib/content.ts` (`getWork`, `getPosts`), which sorts and hides `draft: true` entries outside `npm run dev`.
- **Navigation is data-driven:** `src/data/site.ts` holds identity, links and `nav`. `src/lib/nav.ts` builds the site index (pages, case studies, posts) once per page in `BaseLayout` and passes it to the header, the ⌘K palette and the terminal. Writing only appears once a non-draft post exists, so the site never links to an empty section.
- **Single layout:** every page uses `src/layouts/BaseLayout.astro` (SEO and OG meta via the `og` prop, theme bootstrap, `<ClientRouter />`, header, footer, and the `CommandPalette` and `Terminal` islands, both `client:idle` + `transition:persist`).
- **Client-side navigation:** because of `ClientRouter`, bundled `<script>`s run once per visit, not once per page. Per-page setup must run inside `document.addEventListener('astro:page-load', ...)`. Global click handling in `src/scripts/ui.ts` uses event delegation with data attributes (`data-theme-toggle`, `data-palette-open`). Islands talk to each other through window events (`palette:open`, `terminal:open`).
- **Architecture diagrams:** `src/components/SystemDiagram.tsx` renders entries from `src/data/diagrams.ts` (nodes, edges, scenarios with steps). MDX embeds them as `<SystemDiagram client:visible id="..." />` (optional `initial` scenario index). Scenarios marked `failure` are the "break it" buttons. Step `log` text is shown as evidence, so it must match the resume or case study, with no invented numbers or timings.
- **Loops:** each loop is a self-contained animated SVG in `public/loops/` (inline `<style>`, system fonts, its own dark card background, a `prefers-reduced-motion` rule), listed in `src/data/loops.ts`. They must work as plain `<img>`s embedded elsewhere (GitHub PRs), so no external CSS, fonts or scripts.
- **Link previews:** `src/pages/og/[...slug].png.ts` renders 1200×630 PNGs at build time with satori + resvg, using the non-variable `@fontsource` WOFF files (satori can't read WOFF2). Add new pages to its `getStaticPaths` list and pass `og="<slug>"` to `BaseLayout`.
- **Resume:** `src/data/resume.ts` is the single source. `/resume` renders it, and its print styles make it a one-page A4 PDF. After changing it, rebuild and run `npm run resume:pdf`, check that it is still one page, and commit the PDF.
- **Contact:** `src/pages/contact/index.astro` is a Netlify Form (detected at deploy from the static HTML), submitted with `fetch`. It carries `data-astro-reload` so client-side routing doesn't intercept it, and falls back to `/contact/thanks` without JS. Submitting can't work under `astro preview`; the error message appearing locally is expected.
- **Theming:** color tokens are CSS variables in `src/styles/global.css`, defined for light (`:root`), dark (`[data-theme="dark"]`), a no-JS `prefers-color-scheme` fallback (keep all three in sync) and print. They are exposed to Tailwind through `@theme inline` (`bg-bg`, `text-muted`, `text-accent-ink`, `text-danger`, etc.). `.prose-site` maps the typography plugin onto the tokens. Shiki emits both themes, and the dark one is applied under `[data-theme="dark"]`. Elements hidden when printing use `data-no-print`.
- **Sound effects:** off by default. `src/scripts/sound.ts` synthesizes them with the Web Audio API (no audio files). Call `play('<name>')` anywhere; it does nothing unless the visitor turned sound on with the header toggle, the palette or the terminal's `sound` command. The preference is in localStorage and on `<html data-sound>` (set before paint like the theme), and the toggle's icons use the `sound-on:` variant.
- **Motion system** (CSS in `global.css`, behavior in `scripts/ui.ts`), opted into with attributes and classes:
  - `data-reveal` fades an element up when it scrolls into view; `data-reveal-group` does the same for each child, staggered. Content is only hidden under `html.js` (set by the BaseLayout head script), so no-JS visitors and print see everything. Don't put it on above-the-fold hero content, and don't put it on React island roots.
  - `.spotlight` adds a pointer-following glow (the element must not need another `position`); `.ulink` draws the underline in on hover; `.arrow` / `.arrow-ne` / `.arrow-down` spans nudge when their link is hovered; `.btn` makes an anchor press in like a button (real `<button>`s do this already).
  - `toast('…')` from `scripts/toast.ts` shows the small confirmation pill (copying, downloads).
  - `<ReadingProgress />` adds the top progress bar for the page's `<article>`. The header hides on scroll down via `[data-site-header]`, and the active nav underline slides between pages through `transition:name="nav-indicator"`.
  - Prose pages automatically get `#` heading anchors and copy buttons on code blocks.
  - Tailwind v4 `translate-*`/`scale-*` utilities use the separate `translate`/`scale` CSS properties, so they combine with these `transform` animations instead of overriding them.
- **Motion rules:** every animation must respect `prefers-reduced-motion`. A global rule shortens CSS animations; JS animations check `matchMedia` themselves (count-up, SystemDiagram, the hero graph pauses its SMIL). Server-rendered output must already be the final state, so no-JS visitors see correct content.
- **Whitespace gotcha:** a line break between an inline element and the text around it changes what renders. `calls me` + newline + `<span>` can render as "meDhawal", and `</a>` + newline + `.` renders as "case study .". Prettier's Astro plugin reflows markup into exactly these shapes (it ignores `htmlWhitespaceSensitivity`), so after formatting, run `npm run build && npm run check:html`. Fix with `{' '}`, or by rewording so a sentence doesn't end in punctuation right after a link.

## Content rules

- Employers Dentsu and Celebal Technologies may be named and their systems described in detail. The 3 client brands at Dentsu must never be named (client policy); write "3 global brands".
- The public email is `maharshi.jasraj@gmail.com`; contact-form notifications go to it and to `mecmaharshi9@gmail.com` (set in the Netlify UI). Never publish the phone number.
- `/Resume.pdf` at the repo root is the private copy (it has the phone number) and is gitignored. The public copy is generated from `src/data/resume.ts`.
- Every claim should be backed by the resume or by the owner. Don't invent metrics, timings, personal facts or reasons for past decisions. The homepage numbers come from the resume; keep them in sync with it.

## Verifying UI changes

There is no browser test suite. To check a change visually, build, run the preview, and drive Microsoft Edge (installed on this machine) with `playwright-core` (`chromium.launch({ channel: 'msedge' })`) against `http://127.0.0.1:4321` (Node's `fetch` may resolve `localhost` to IPv6). Keep test scripts outside the repo. Use Playwright device emulation for mobile, because plain `msedge --headless` can't render narrower than about 500px. The hero graph drifts with the cursor, so Playwright's stability check fails on `hover`; use real `mouse.move` steps.
