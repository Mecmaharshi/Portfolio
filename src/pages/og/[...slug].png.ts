// Link-preview images (1200×630), rendered at build time for every page.
// BaseLayout points og:image at /og/<slug>.png; pages pass their slug through the `og` prop.
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { site } from '../../data/site';
import { getPosts, getWork } from '../../lib/content';

// A type alias (not an interface) so it satisfies GetStaticPaths' Record-shaped props
type Card = {
  slug: string;
  eyebrow: string;
  title: string;
};

export const getStaticPaths = (async () => {
  const [work, posts] = await Promise.all([getWork(), getPosts()]);
  const cards: Card[] = [
    { slug: 'home', eyebrow: site.role, title: 'I build production AI systems that don’t fall over.' },
    { slug: 'work', eyebrow: 'Work', title: 'Systems I’ve designed and shipped.' },
    { slug: 'writing', eyebrow: 'Writing', title: 'Notes from production.' },
    { slug: 'about', eyebrow: 'About', title: 'Hi, I’m Maharshi.' },
    { slug: 'loops', eyebrow: 'Loops', title: 'Backend ideas, on a loop.' },
    { slug: 'resume', eyebrow: 'Resume', title: `${site.name}, ${site.role}` },
    { slug: 'contact', eyebrow: 'Contact', title: 'Let’s build something that doesn’t fall over.' },
    ...work.map((entry) => ({
      slug: `work/${entry.id}`,
      eyebrow: `Case study · ${entry.data.company}`,
      title: entry.data.title,
    })),
    ...posts.map((post) => ({ slug: `writing/${post.id}`, eyebrow: 'Writing', title: post.data.title })),
  ];
  return cards.map((card) => ({ params: { slug: card.slug }, props: card }));
}) satisfies GetStaticPaths;

const fontDir = join(process.cwd(), 'node_modules/@fontsource');
const fonts = Promise.all([
  readFile(join(fontDir, 'bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff')),
  readFile(join(fontDir, 'geist/files/geist-latin-400-normal.woff')),
  readFile(join(fontDir, 'geist/files/geist-latin-500-normal.woff')),
]);
const logo = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#ff7448"/><path d="M10 10 22 16 10 22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="3" fill="#fff"/><circle cx="10" cy="22" r="3" fill="#fff"/><circle cx="22" cy="16" r="3.4" fill="#fff"/></svg>',
).toString('base64')}`;

// satori takes React-element-shaped objects; this keeps the endpoint free of JSX
const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

export const GET: APIRoute = async ({ props }) => {
  const { eyebrow, title } = props as Card;
  const [display, regular, medium] = await fonts;

  const svg = await satori(
    h(
      'div',
      {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: '#0d0e12',
        backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,116,72,0.22), transparent 45%)',
        color: '#ecebe6',
        fontFamily: 'Geist',
      },
      [
        h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
          { type: 'img', props: { src: logo, width: 56, height: 56 } },
          h('div', { fontSize: 28, fontWeight: 500 }, site.name),
        ]),
        h('div', { display: 'flex', flexDirection: 'column', gap: 18 }, [
          h('div', { fontSize: 26, color: '#ff8f6a' }, eyebrow),
          h(
            'div',
            {
              fontFamily: 'Bricolage Grotesque',
              fontSize: title.length > 60 ? 58 : 72,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: 1000,
            },
            title,
          ),
        ]),
        h('div', { display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#9b978d' }, [
          h('div', {}, site.role),
          h('div', {}, site.url.replace('https://', '')),
        ]),
      ],
    ) as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Bricolage Grotesque', data: display, weight: 600, style: 'normal' },
        { name: 'Geist', data: regular, weight: 400, style: 'normal' },
        { name: 'Geist', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );

  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
