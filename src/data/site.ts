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

// Pages appear in the header and command palette only once `ready` is true,
// so the live site never links to a page that doesn't exist yet.
export const nav = [
  { label: 'Home', href: '/', ready: true },
  { label: 'Work', href: '/work', ready: false },
  { label: 'Writing', href: '/writing', ready: false },
  { label: 'About', href: '/about', ready: false },
  { label: 'Loops', href: '/loops', ready: false },
  { label: 'Resume', href: '/resume', ready: false },
  { label: 'Contact', href: '/contact', ready: false },
];

export const liveNav = nav.filter((item) => item.ready);
