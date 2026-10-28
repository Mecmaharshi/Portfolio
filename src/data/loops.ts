// Each loop is a self-contained animated SVG in public/loops/<id>.svg, so it keeps playing when
// embedded as an image elsewhere (GitHub PRs, issues, READMEs). Add a loop by adding the file and an entry.
export const loops = [
  {
    id: 'gateway-timeout',
    title: '504 Gateway Timeout',
    caption: 'The job finished. Nobody was listening.',
    use: 'for any PR that touches a timeout',
  },
  {
    id: 'llm-fallback',
    title: 'LLM fallback chain',
    caption: 'Tier 1 is rate-limited, tier 2 times out, tier 3 answers. The user never knew.',
    use: 'for “why do we need three providers?”',
  },
  {
    id: 'exponential-backoff',
    title: 'Exponential backoff',
    caption: 'Wait 1s, then 2s, then 4s. Give the server room to recover instead of hammering it.',
    use: 'for retry logic reviews',
  },
  {
    id: 'thundering-herd',
    title: 'Thundering herd',
    caption: 'One cache key expires, eight clients miss at once, and the database feels all of it.',
    use: 'for “just add a TTL”',
  },
  {
    id: 'race-condition',
    title: 'Race condition',
    caption: 'Both writers read 100. Both write. One update quietly disappears.',
    use: 'for read-modify-write code',
  },
];
