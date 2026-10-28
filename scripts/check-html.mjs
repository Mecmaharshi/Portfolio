// Scans the built site for whitespace bugs that formatters can introduce around inline elements:
//   "case study ."  (a line break between </a> and punctuation renders as a space)
//   "meDhawal"      (a word glued to the next inline element)
// Usage: npm run build && npm run check:html
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = readdirSync('dist', { recursive: true })
  .filter((f) => f.endsWith('.html'))
  .map((f) => join('dist', f));

const problems = [];
for (const file of files) {
  const html = readFileSync(file, 'utf8').replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, ' ');
  for (const m of html.matchAll(/<\/(a|span|strong|em|time)>(\s+)([.,;:!?])/g))
    problems.push(
      `${file}: space before "${m[3]}" … ${html.slice(Math.max(0, m.index - 40), m.index + m[0].length).trim()}`,
    );
  for (const m of html.matchAll(/([A-Za-z]{2,})<(a|span|strong|em)\b[^>]*>\s*([A-Za-z][^<]{0,20})/g))
    problems.push(`${file}: "${m[1]}" glued to "${m[3]}"`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`check:html ok (${files.length} pages)`);
