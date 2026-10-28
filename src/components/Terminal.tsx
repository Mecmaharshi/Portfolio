import { navigate } from 'astro:transitions/client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { resumePdf, site, social } from '../data/site';
import type { SiteIndex } from '../lib/nav';
import { releaseChaos } from '../scripts/chaos';
import { isSoundOn, play, setSound } from '../scripts/sound';
import { getTheme, toggleTheme } from '../scripts/theme';
import { toast } from '../scripts/toast';

type Line = { kind: 'in' | 'out' | 'err'; text: ReactNode };

const COMMANDS = [
  'help',
  'whoami',
  'ls',
  'cd',
  'open',
  'cat',
  'resume',
  'email',
  'theme',
  'sound',
  'chaos',
  'socials',
  'clear',
  'exit',
  'sudo',
];

const banner: Line[] = [
  { kind: 'out', text: `${site.name.toLowerCase().replaceAll(' ', '-')} — interactive shell` },
  { kind: 'out', text: "type 'help' to see what's possible. esc closes." },
];

// A small easter-egg shell over the site, opened with the backtick key or from the command palette.
export default function Terminal({ index }: { index: SiteIndex }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(banner);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest('input, textarea, select, [contenteditable="true"]');
      if (e.key === '`' && !typing) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('terminal:open', onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('terminal:open', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const pageSlug = (href: string) => (href === '/' ? '~' : href.slice(1));
  const workSlug = (href: string) => href.split('/').pop()!;

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const execute = (raw: string): Line[] | 'clear' => {
    const [cmd = '', ...args] = raw.trim().split(/\s+/);
    const arg = args.join(' ');
    switch (cmd) {
      case '':
        return [];
      case 'help':
        return [
          'whoami            who is this',
          'ls [work]         list pages, or case studies',
          'cd <page>         go to a page (cd work, cd about…)',
          'open <project>    open a case study (tab completes)',
          'cat resume        the short version',
          'resume            download the PDF',
          'email             copy my email address',
          'socials           where else to find me',
          'theme [light|dark] switch theme',
          'sound [on|off]    sound effects',
          'chaos             release the chaos monkey',
          'clear / exit',
        ].map((text) => ({ kind: 'out', text }));
      case 'whoami':
        return [
          { kind: 'out', text: `${site.name}, ${site.role}.` },
          { kind: 'out', text: 'Builds production AI systems in Python on Azure. Answers to "Dhawal" at home.' },
        ];
      case 'ls':
        if (arg === 'work') return index.work.map((w) => ({ kind: 'out', text: workSlug(w.href) }));
        return [{ kind: 'out', text: index.pages.map((p) => pageSlug(p.href)).join('  ') + '  work/' }];
      case 'cd': {
        if (!arg || arg === '~' || arg === '/') {
          go('/');
          return [];
        }
        const page = index.pages.find((p) => pageSlug(p.href) === arg.replace(/^\/|\/$/g, ''));
        if (page) {
          go(page.href);
          return [];
        }
        return [{ kind: 'err', text: `cd: no such page: ${arg}` }];
      }
      case 'open': {
        const project = index.work.find((w) => workSlug(w.href).startsWith(arg) && arg);
        if (project) {
          go(project.href);
          return [];
        }
        return [{ kind: 'err', text: `open: no case study matches "${arg}". try 'ls work'` }];
      }
      case 'cat':
        if (arg === 'resume' || arg === 'resume.txt')
          return [
            'Backend Engineer (AI/LLM), 4+ years · Python · Azure · GenAI',
            'Dentsu (Nov 2025 – now): multi-tenant GenAI creative platform, 65+ Durable Functions',
            'Celebal Technologies (Sep 2022 – Nov 2025): document AI, call analytics, ML SaaS at 1M+ req/day',
            'Freelance: multi-source agentic RAG with RBAC, guardrails and evals',
            "B.Tech ECE, Techno Main Salt Lake · AZ-900 · AI-900   (run 'resume' for the PDF)",
          ].map((text) => ({ kind: 'out', text }));
        return [{ kind: 'err', text: `cat: ${arg || 'missing file'}: no such file` }];
      case 'resume':
        window.open(resumePdf, '_blank');
        return [{ kind: 'out', text: 'opening resume PDF…' }];
      case 'email':
        navigator.clipboard?.writeText(site.email).catch(() => {});
        toast('Email copied');
        return [{ kind: 'out', text: `${site.email} (copied)` }];
      case 'socials':
        return social.map((s) => ({
          kind: 'out',
          text: (
            <a className="underline decoration-dotted" href={s.href} target="_blank" rel="noopener">
              {s.label.toLowerCase()}: {s.href.replace('https://', '')}
            </a>
          ),
        }));
      case 'theme': {
        if (arg && arg !== 'light' && arg !== 'dark') return [{ kind: 'err', text: 'usage: theme [light|dark]' }];
        // Read before toggling: with view transitions the switch itself happens asynchronously
        const current = getTheme();
        const next = arg || (current === 'dark' ? 'light' : 'dark');
        if (next !== current) toggleTheme();
        return [{ kind: 'out', text: `theme: ${next}` }];
      }
      case 'sound': {
        if (arg && arg !== 'on' && arg !== 'off') return [{ kind: 'err', text: 'usage: sound [on|off]' }];
        const on = arg ? arg === 'on' : !isSoundOn();
        setSound(on);
        return [{ kind: 'out', text: `sound: ${on ? 'on' : 'off'}` }];
      }
      case 'chaos':
        setOpen(false);
        // Let the terminal close first so the page is what gets knocked around
        setTimeout(releaseChaos, 150);
        return [];
      case 'sudo':
        if (/hire/.test(arg)) {
          play('chime');
          setTimeout(() => go('/contact'), 1200);
          return [
            { kind: 'out', text: '[sudo] password for recruiter: ********' },
            { kind: 'out', text: 'permission granted. opening /contact…' },
          ];
        }
        return [{ kind: 'err', text: `${arg || 'you'} is not in the sudoers file. try 'sudo hire-me'` }];
      case 'rm':
        return [{ kind: 'err', text: 'nice try. this site is static, there is nothing to delete.' }];
      case 'clear':
        return 'clear';
      case 'exit':
        setOpen(false);
        return [];
      default:
        return [{ kind: 'err', text: `command not found: ${cmd}. try 'help'` }];
    }
  };

  const submit = () => {
    const result = execute(input);
    if (input.trim()) setHistory((h) => [...h, input]);
    setCursor(-1);
    if (result !== 'clear') play(result.some((line) => line.kind === 'err') ? 'error' : 'tick');
    setLines((prev) => (result === 'clear' ? [] : [...prev, { kind: 'in', text: input }, ...result]));
    setInput('');
  };

  const complete = () => {
    const [cmd, ...rest] = input.split(' ');
    if (rest.length === 0) {
      const match = COMMANDS.filter((c) => c.startsWith(cmd));
      if (match.length === 1) setInput(`${match[0]} `);
      return;
    }
    const partial = rest.join(' ');
    const pool = cmd === 'open' ? index.work.map((w) => workSlug(w.href)) : index.pages.map((p) => pageSlug(p.href));
    const match = pool.filter((p) => p.startsWith(partial));
    if (match.length === 1) setInput(`${cmd} ${match[0]}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1) play('key');
    if (e.key === 'Enter') submit();
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
    } else if (e.key === 'ArrowDown' && cursor >= 0) {
      e.preventDefault();
      const next = cursor + 1;
      setCursor(next >= history.length ? -1 : next);
      setInput(next >= history.length ? '' : history[next]);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Terminal"
      className="terminal fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-[#0d0e12] text-[#e6e4dd] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-xs text-white/50">guest@{site.shortName.toLowerCase()}: ~</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto font-mono text-xs text-white/50 hover:text-white"
            aria-label="Close terminal"
          >
            esc
          </button>
        </div>
        <div
          ref={bodyRef}
          className="h-72 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-6"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={line.kind === 'err' ? 'text-[#ff8a80]' : line.kind === 'in' ? 'text-white' : 'text-white/70'}
            >
              {line.kind === 'in' && <span className="text-[#ff7448]">❯ </span>}
              {line.text}
            </div>
          ))}
          <div className="flex items-center">
            <span className="text-[#ff7448]">❯&nbsp;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 bg-transparent text-white caret-[#ff7448] outline-none"
              aria-label="Terminal command"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
