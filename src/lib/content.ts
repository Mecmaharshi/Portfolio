import { getCollection } from 'astro:content';

// Drafts show up while developing so they can be previewed, never in production builds.
const visible = (entry: { data: { draft: boolean } }) => import.meta.env.DEV || !entry.data.draft;

export async function getWork() {
  const entries = await getCollection('work', visible);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function getPosts() {
  const entries = await getCollection('writing', visible);
  return entries.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
