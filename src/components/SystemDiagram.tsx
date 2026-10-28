import { useEffect, useMemo, useRef, useState } from 'react';
import { diagrams, type DiagramId, type DiagramNode, type Status } from '../data/diagrams';

const NODE_H = 54;
const DEFAULT_W = 150;
const PACKET_MS = 650;

const statusColor: Record<Status, string> = {
  ok: 'var(--ok)',
  fail: 'var(--danger)',
  blocked: 'var(--danger)',
  fallback: 'var(--accent)',
};
const packetColor = (status: Status) => (status === 'ok' ? 'var(--signal)' : statusColor[status]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays a request through an architecture diagram: a packet travels each step's edge,
// nodes take the step's status, and a trace log fills in. "Break it" scenarios show failure handling.
// Server-rendered idle state plus a screen-reader list of steps keeps it readable without JS.
export default function SystemDiagram({ id, initial = 0 }: { id: DiagramId; initial?: number }) {
  const diagram = diagrams[id];
  const nodes = useMemo(() => new Map(diagram.nodes.map((n) => [n.id, n])), [diagram]);
  const [scenarioIndex, setScenarioIndex] = useState(initial);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [packet, setPacket] = useState<{ x: number; y: number; status: Status } | null>(null);
  const run = useRef(0);
  const root = useRef<HTMLElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const scenario = diagram.scenarios[scenarioIndex];

  const travel = (a: DiagramNode, b: DiagramNode, status: Status, token: number) =>
    new Promise<void>((resolve) => {
      const start = performance.now();
      const frame = (now: number) => {
        if (run.current !== token) return resolve();
        const t = Math.min((now - start) / PACKET_MS, 1);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setPacket({ x: a.x + (b.x - a.x) * eased, y: a.y + (b.y - a.y) * eased, status });
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

  const play = async (index: number) => {
    const token = ++run.current;
    const steps = diagram.scenarios[index].steps;
    setPacket(null);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(steps.length);
      return;
    }
    setDone(0);
    setRunning(true);
    for (const [i, step] of steps.entries()) {
      if (step.from) await travel(nodes.get(step.from)!, nodes.get(step.to)!, step.status ?? 'ok', token);
      else await wait(350);
      if (run.current !== token) return;
      setDone(i + 1);
      await wait(260);
    }
    if (run.current === token) {
      setPacket(null);
      setRunning(false);
    }
  };

  // Autoplay the first scenario the first time the diagram is mostly on screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          play(initial);
        }
      },
      { threshold: 0.5 },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      run.current++;
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [done]);

  const choose = (index: number) => {
    setScenarioIndex(index);
    play(index);
  };

  // Status of each node and edge after the completed steps (later steps win)
  const nodeStatus = new Map<string, Status>();
  const edgeStatus = new Map<string, Status>();
  for (const step of scenario.steps.slice(0, done)) {
    const status = step.status ?? 'ok';
    nodeStatus.set(step.to, status);
    if (step.from) edgeStatus.set([step.from, step.to].sort().join('|'), status);
  }

  return (
    <figure
      ref={root}
      className="not-prose my-10 overflow-hidden lg:-mx-24 rounded-2xl border border-border bg-surface"
      aria-label={`${diagram.title}: interactive architecture diagram`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <span className="mr-auto font-mono text-xs text-muted">// {diagram.title.toLowerCase()}</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Scenarios">
          {diagram.scenarios.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={i === scenarioIndex}
              onClick={() => choose(i)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-text aria-pressed:border-text aria-pressed:bg-text aria-pressed:text-bg"
            >
              <span className={`size-1.5 rounded-full ${s.failure ? 'bg-danger' : 'bg-ok'}`} aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          className="block w-full min-w-[640px]"
          aria-hidden="true"
        >
          {diagram.edges.map((edge) => {
            const a = nodes.get(edge.from)!;
            const b = nodes.get(edge.to)!;
            const status = edgeStatus.get([edge.from, edge.to].sort().join('|'));
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={status ? statusColor[status] : 'var(--border)'}
                strokeWidth={status ? 2 : 1.5}
                strokeDasharray={edge.dashed ? '5 5' : undefined}
                style={{ transition: 'stroke 300ms' }}
              />
            );
          })}

          {diagram.nodes.map((node) => {
            const w = node.w ?? DEFAULT_W;
            const status = nodeStatus.get(node.id);
            return (
              <g key={node.id} transform={`translate(${node.x - w / 2} ${node.y - NODE_H / 2})`}>
                <rect
                  width={w}
                  height={NODE_H}
                  rx={10}
                  fill="var(--surface)"
                  stroke={status ? statusColor[status] : 'var(--border)'}
                  strokeWidth={status ? 2 : 1.5}
                  style={{ transition: 'stroke 300ms' }}
                />
                <text
                  x={w / 2}
                  y={node.sub ? 23 : 32}
                  textAnchor="middle"
                  fill="var(--text)"
                  style={{ font: '600 13.5px var(--font-sans)' }}
                >
                  {node.label}
                </text>
                {node.sub && (
                  <text
                    x={w / 2}
                    y={40}
                    textAnchor="middle"
                    fill="var(--muted)"
                    style={{ font: '400 10.5px var(--font-mono)' }}
                  >
                    {node.sub}
                  </text>
                )}
                {status && <circle cx={w - 8} cy={8} r={4.5} fill={statusColor[status]} />}
              </g>
            );
          })}

          {packet && (
            <g>
              <circle cx={packet.x} cy={packet.y} r={13} fill={packetColor(packet.status)} opacity={0.18} />
              <circle cx={packet.x} cy={packet.y} r={6} fill={packetColor(packet.status)} />
            </g>
          )}
        </svg>
      </div>

      <div className="border-t border-border bg-bg/40">
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="font-mono text-[0.7rem] tracking-wider text-muted uppercase">Trace</span>
          <button
            type="button"
            onClick={() => play(scenarioIndex)}
            className="font-mono text-xs text-accent-ink hover:underline"
          >
            {running ? '↻ restart' : done ? '↻ replay' : '▶ play'}
          </button>
        </div>
        <ol ref={log} className="h-40 overflow-y-auto px-4 py-2 font-mono text-xs leading-6" aria-hidden="true">
          {done === 0 && <li className="text-muted">waiting for a request…</li>}
          {scenario.steps.slice(0, done).map((step, i) => {
            const status = step.status ?? 'ok';
            return (
              <li key={i} className="flex gap-3">
                <span className="text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span style={{ color: status === 'ok' ? undefined : statusColor[status] }}>{step.log}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <figcaption className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted">
        {scenario.caption}
      </figcaption>

      <div className="sr-only">
        {diagram.scenarios.map((s) => (
          <div key={s.label}>
            <p>
              Scenario: {s.label}. {s.caption}
            </p>
            <ol>
              {s.steps.map((step, i) => (
                <li key={i}>{step.log}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </figure>
  );
}
