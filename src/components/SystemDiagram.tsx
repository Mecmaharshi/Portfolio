import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { play as playSound } from '../scripts/sound';
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
const edgeKey = (a: string, b: string) => [a, b].sort().join('|');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays a request through an architecture diagram: a packet travels each step's edge,
// nodes take the step's status, and a trace log fills in. "Break it" scenarios show failure handling.
// Hovering a node highlights its connections; hovering a trace line highlights the nodes it involves.
// Server-rendered idle state plus a screen-reader list of steps keeps it readable without JS.
export default function SystemDiagram({ id, initial = 0 }: { id: DiagramId; initial?: number }) {
  const diagram = diagrams[id];
  const nodes = useMemo(() => new Map(diagram.nodes.map((n) => [n.id, n])), [diagram]);
  const [scenarioIndex, setScenarioIndex] = useState(initial);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [packet, setPacket] = useState<{ x: number; y: number; status: Status } | null>(null);
  const [focus, setFocus] = useState<{ nodes: Set<string>; edges: Set<string> } | null>(null);
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const run = useRef(0);
  const root = useRef<HTMLElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
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
      const status = step.status ?? 'ok';
      playSound(status === 'ok' ? 'ok' : status === 'fallback' ? 'fallback' : 'fail', { step: i });
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
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [done]);

  // Sliding highlight behind the selected scenario button (buttons may wrap onto several rows)
  useLayoutEffect(() => {
    const measure = () => {
      const button = tabs.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (button)
        setPill({
          left: button.offsetLeft,
          top: button.offsetTop,
          width: button.offsetWidth,
          height: button.offsetHeight,
        });
    };
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, [scenarioIndex]);

  const choose = (index: number) => {
    setScenarioIndex(index);
    play(index);
  };

  const focusNode = (nodeId: string) => {
    const edges = diagram.edges.filter((e) => e.from === nodeId || e.to === nodeId);
    setFocus({
      nodes: new Set([nodeId, ...edges.flatMap((e) => [e.from, e.to])]),
      edges: new Set(edges.map((e) => edgeKey(e.from, e.to))),
    });
  };
  const focusStep = (from: string | undefined, to: string) =>
    setFocus({
      nodes: new Set(from ? [from, to] : [to]),
      edges: new Set(from ? [edgeKey(from, to)] : []),
    });

  // Status of each node and edge after the completed steps (later steps win)
  const nodeStatus = new Map<string, Status>();
  const edgeStatus = new Map<string, Status>();
  for (const step of scenario.steps.slice(0, done)) {
    const status = step.status ?? 'ok';
    nodeStatus.set(step.to, status);
    if (step.from) edgeStatus.set(edgeKey(step.from, step.to), status);
  }
  const lastReached = done > 0 ? scenario.steps[done - 1].to : null;

  return (
    <figure
      ref={root}
      className="not-prose my-10 overflow-hidden rounded-2xl border border-border bg-surface lg:-mx-24"
      aria-label={`${diagram.title}: interactive architecture diagram`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <span className="mr-auto font-mono text-xs text-muted">// {diagram.title.toLowerCase()}</span>
        <div
          ref={tabs}
          className="group relative flex flex-wrap gap-1.5"
          data-ready={pill ? '' : undefined}
          role="group"
          aria-label="Scenarios"
        >
          {pill && (
            <span
              className="absolute rounded-full bg-text transition-all duration-300 ease-out"
              style={pill}
              aria-hidden="true"
            />
          )}
          {diagram.scenarios.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={i === scenarioIndex}
              onClick={() => choose(i)}
              className="relative inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-text aria-pressed:border-text aria-pressed:bg-text aria-pressed:text-bg group-data-ready:aria-pressed:bg-transparent"
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
          onMouseLeave={() => setFocus(null)}
        >
          {diagram.edges.map((edge) => {
            const a = nodes.get(edge.from)!;
            const b = nodes.get(edge.to)!;
            const key = edgeKey(edge.from, edge.to);
            const status = edgeStatus.get(key);
            const focused = focus?.edges.has(key);
            return (
              <line
                key={key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={status ? statusColor[status] : focused ? 'var(--text)' : 'var(--border)'}
                strokeWidth={status || focused ? 2 : 1.5}
                strokeDasharray={edge.dashed ? '5 5' : undefined}
                opacity={focus && !focused ? 0.3 : 1}
                style={{ transition: 'stroke 300ms, opacity 200ms' }}
              />
            );
          })}

          {diagram.nodes.map((node) => {
            const w = node.w ?? DEFAULT_W;
            const status = nodeStatus.get(node.id);
            const dimmed = focus && !focus.nodes.has(node.id);
            return (
              <g
                key={node.id}
                transform={`translate(${node.x - w / 2} ${node.y - NODE_H / 2})`}
                opacity={dimmed ? 0.35 : 1}
                style={{ transition: 'opacity 200ms' }}
                onMouseEnter={() => focusNode(node.id)}
              >
                {node.id === lastReached && (
                  <rect
                    key={done}
                    className="node-ping"
                    width={w}
                    height={NODE_H}
                    rx={10}
                    fill="none"
                    stroke={statusColor[status ?? 'ok']}
                    strokeWidth={2}
                  />
                )}
                <rect
                  width={w}
                  height={NODE_H}
                  rx={10}
                  fill="var(--surface)"
                  stroke={status ? statusColor[status] : focus?.nodes.has(node.id) ? 'var(--text)' : 'var(--border)'}
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
          <button type="button" onClick={() => play(scenarioIndex)} className="ulink font-mono text-xs text-accent-ink">
            {running ? '↻ restart' : done ? '↻ replay' : '▶ play'}
          </button>
        </div>
        <ol
          ref={log}
          className="h-40 overflow-y-auto px-4 py-2 font-mono text-xs leading-6"
          aria-hidden="true"
          onMouseLeave={() => setFocus(null)}
        >
          {done === 0 && <li className="text-muted">waiting for a request…</li>}
          {scenario.steps.slice(0, done).map((step, i) => {
            const status = step.status ?? 'ok';
            const involved = focus?.nodes.has(step.to) && (!step.from || focus.nodes.has(step.from));
            return (
              <li
                key={`${scenarioIndex}-${i}`}
                className={`log-line -mx-1.5 flex gap-3 rounded px-1.5 transition-colors ${involved ? 'bg-surface-2' : ''}`}
                onMouseEnter={() => focusStep(step.from, step.to)}
              >
                <span className="text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span style={{ color: status === 'ok' ? undefined : statusColor[status] }}>{step.log}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <figcaption
        key={scenarioIndex}
        className="log-line border-t border-border px-4 py-3 text-sm leading-relaxed text-muted"
      >
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
