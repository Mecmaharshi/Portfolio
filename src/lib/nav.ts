import { nav } from '../data/site';
import { getPosts, getWork } from './content';

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteIndex {
  pages: NavLink[];
  work: NavLink[];
  posts: NavLink[];
}

// Everything the header and command palette can link to, computed once per page build.
export async function getSiteIndex(): Promise<SiteIndex> {
  const [work, posts] = await Promise.all([getWork(), getPosts()]);
  return {
    pages: nav.filter((item) => !item.requiresPosts || posts.length > 0).map(({ label, href }) => ({ label, href })),
    work: work.map((entry) => ({ label: entry.data.title, href: `/work/${entry.id}` })),
    posts: posts.map((entry) => ({ label: entry.data.title, href: `/writing/${entry.id}` })),
  };
}
