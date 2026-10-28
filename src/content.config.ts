import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Case studies. The file name is the URL: src/content/work/foo.mdx → /work/foo
const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    // Short label used on the homepage system graph
    short: z.string(),
    summary: z.string(),
    company: z.enum(['Dentsu', 'Celebal Technologies', 'Freelance']),
    role: z.string(),
    period: z.string().optional(),
    order: z.number(),
    featured: z.boolean().default(false),
    stack: z.array(z.string()),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // Drafts are visible in `npm run dev` only
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, writing };
