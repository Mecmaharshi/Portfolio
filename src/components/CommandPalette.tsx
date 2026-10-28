import * as Dialog from '@radix-ui/react-dialog';
import { navigate } from 'astro:transitions/client';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { resumePdf, site, social } from '../data/site';
import type { SiteIndex } from '../lib/nav';
import { isSoundOn, play, toggleSound } from '../scripts/sound';
import { toggleTheme } from '../scripts/theme';

// Opened with ⌘K / Ctrl+K, or by any element with [data-palette-open] (see scripts/ui.ts,
// which dispatches the 'palette:open' window event).
export default function CommandPalette({ index }: { index: SiteIndex }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    const onSound = () => setSoundOn(isSoundOn());
    onSound();
    document.addEventListener('keydown', onKey);
    window.addEventListener('palette:open', onOpen);
    window.addEventListener('sound:change', onSound);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('palette:open', onOpen);
      window.removeEventListener('sound:change', onSound);
    };
  }, []);

  useEffect(() => {
    if (open) play('pop');
  }, [open]);

  const run = (action: () => void) => {
    play('select');
    setOpen(false);
    action();
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 900);
    } catch {
      run(() => (location.href = `mailto:${site.email}`));
    }
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command menu" loop>
      <Dialog.Title className="sr-only">Command menu</Dialog.Title>
      <Dialog.Description className="sr-only">Search pages, case studies and actions</Dialog.Description>
      <Command.Input placeholder="Where to? Type a page, a project or an action…" />
      <Command.List>
        <Command.Empty>Nothing matches. Try “rag”, “email” or “theme”.</Command.Empty>
        <Command.Group heading="Pages">
          {index.pages.map((item) => (
            <Item key={item.href} label={item.label} hint={item.href} onSelect={() => run(() => navigate(item.href))} />
          ))}
        </Command.Group>
        <Command.Group heading="Case studies">
          {index.work.map((item) => (
            <Item key={item.href} label={item.label} onSelect={() => run(() => navigate(item.href))} />
          ))}
        </Command.Group>
        {index.posts.length > 0 && (
          <Command.Group heading="Writing">
            {index.posts.map((item) => (
              <Item key={item.href} label={item.label} onSelect={() => run(() => navigate(item.href))} />
            ))}
          </Command.Group>
        )}
        <Command.Group heading="Actions">
          <Item
            label={copied ? 'Copied to clipboard ✓' : 'Copy email address'}
            hint={site.email}
            keywords={['contact', 'mail']}
            onSelect={copyEmail}
          />
          <Item
            label="Download resume (PDF)"
            keywords={['cv', 'resume', 'pdf']}
            onSelect={() => run(() => window.open(resumePdf, '_blank'))}
          />
          <Item
            label="Toggle light / dark theme"
            keywords={['dark', 'light', 'mode', 'theme']}
            onSelect={() => run(() => toggleTheme())}
          />
          <Item
            label={soundOn ? 'Turn sound effects off' : 'Turn sound effects on'}
            keywords={['sound', 'audio', 'mute', 'sfx']}
            onSelect={() => run(toggleSound)}
          />
          <Item
            label="Open the terminal"
            hint="`"
            keywords={['shell', 'console', 'cli', 'secret']}
            onSelect={() => run(() => window.dispatchEvent(new Event('terminal:open')))}
          />
        </Command.Group>
        <Command.Group heading="Elsewhere">
          {social.map((link) => (
            <Item
              key={link.href}
              label={link.label}
              hint="↗"
              onSelect={() => run(() => window.open(link.href, '_blank', 'noopener'))}
            />
          ))}
        </Command.Group>
      </Command.List>
      <div className="flex gap-4 border-t border-border px-4 py-2.5 font-mono text-[0.7rem] text-muted">
        <span>↑↓ move</span>
        <span>↵ select</span>
        <span>esc close</span>
      </div>
    </Command.Dialog>
  );
}

interface ItemProps {
  label: string;
  hint?: string;
  keywords?: string[];
  onSelect: () => void;
}

function Item({ label, hint, keywords, onSelect }: ItemProps) {
  return (
    <Command.Item value={label} keywords={keywords} onSelect={onSelect}>
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="hidden truncate font-mono text-xs text-muted sm:inline">{hint}</span>}
      <span className="cmdk-arrow -translate-x-1 text-accent opacity-0 transition" aria-hidden="true">
        →
      </span>
    </Command.Item>
  );
}
