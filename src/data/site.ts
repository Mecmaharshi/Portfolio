export const site = {
  name: 'Maharshi Ishu Jasraj',
  shortName: 'Maharshi',
  role: 'Backend Engineer (AI/LLM)',
  description:
    'Maharshi Ishu Jasraj is a backend engineer building production AI systems: LLM pipelines, RAG, AI agents and event-driven serverless backends on Azure.',
  url: 'https://maharshiishujasraj.netlify.app',
  email: 'maharshi.jasraj@gmail.com',
  location: 'Gurugram, India',
  current: { company: 'Dentsu', doing: 'building GenAI platforms' },
};

export const social = [
  { label: 'GitHub', href: 'https://github.com/Mecmaharshi' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/maharshi-ishu-jasraj-729aa4203' },
  { label: 'LeetCode', href: 'https://leetcode.com/Mecmaharshi' },
];

export const resumePdf = '/maharshi-ishu-jasraj-resume.pdf';

// Header and command palette pages. Writing only appears once a post is published
// (see lib/nav.ts), so the site never links to an empty section.
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/work' },
  { label: 'Writing', href: '/writing', requiresPosts: true },
  { label: 'About', href: '/about' },
  { label: 'Loops', href: '/loops' },
  { label: 'Resume', href: '/resume' },
  { label: 'Contact', href: '/contact' },
];
