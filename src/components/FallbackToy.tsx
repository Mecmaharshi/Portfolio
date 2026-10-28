import { useState } from 'react';

const TIERS = 3;
const REQUESTS = 24;

// Outcome per request: the tier that answered (1..3), or 0 if every tier failed
type Outcome = number;

const colors = ['var(--danger)', 'var(--ok)', 'var(--accent)', 'var(--signal)'];
const labels = ['all tiers failed', 'answered by tier 1', 'answered by tier 2', 'answered by tier 3'];

// About-page toy: how a 3-tier LLM fallback turns an unreliable provider into a reliable service.
export default function FallbackToy() {
  const [chaos, setChaos] = useState(40);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [round, setRound] = useState(0);

  const send = () => {
    const p = chaos / 100;
    const next = Array.from({ length: REQUESTS }, () => {
      for (let tier = 1; tier <= TIERS; tier++) if (Math.random() >= p) return tier;
      return 0;
    });
    setOutcomes(next);
    setRound((r) => r + 1);
  };

  const p = chaos / 100;
  const counts = [0, 1, 2, 3].map((o) => outcomes.filter((x) => x === o).length);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <label className="block text-sm font-medium" htmlFor="chaos">
        Chance any one model call fails: <span className="font-mono text-accent-ink">{chaos}%</span>
      </label>
      <input
        id="chaos"
        type="range"
        min={0}
        max={90}
        step={5}
        value={chaos}
        onChange={(e) => setChaos(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--accent)]"
      />

      <div className="mt-4 grid gap-3 font-mono text-xs sm:grid-cols-2">
        <p className="rounded-lg bg-bg p-3">
          one model: <span className="text-danger">{Math.round(p * 100)}%</span> of requests fail
        </p>
        <p className="rounded-lg bg-bg p-3">
          3-tier fallback: <span className="text-ok">{(Math.pow(p, TIERS) * 100).toFixed(1)}%</span> fail
        </p>
      </div>

      <button
        type="button"
        onClick={send}
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-text px-4 text-sm font-medium text-bg transition hover:-translate-y-0.5"
      >
        Send {REQUESTS} requests
      </button>

      <div className="mt-5 grid grid-cols-8 gap-1.5 sm:grid-cols-12" aria-hidden="true">
        {Array.from({ length: REQUESTS }, (_, i) => (
          <span
            key={`${round}-${i}`}
            className="toy-cell aspect-square rounded-md"
            style={{
              background: outcomes.length ? colors[outcomes[i]] : 'var(--surface-2)',
              animationDelay: `${i * 35}ms`,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 grid gap-1 text-xs text-muted sm:grid-cols-2" aria-live="polite">
        {[1, 2, 3, 0].map((o) => (
          <li key={o} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: colors[o] }} aria-hidden="true" />
            {labels[o]}
            {outcomes.length > 0 && <span className="font-mono text-text">× {counts[o]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
