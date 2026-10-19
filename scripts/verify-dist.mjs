import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
assert(
  html.includes('<title>CUL — Computer Use Laboratory</title>'),
  'Missing CUL page identity.',
);
assert(!html.includes('/src/main.tsx'), 'Unbuilt source entry found.');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((m) => m[1]);
assert(
  assets.some((x) => x.endsWith('.js')) && assets.some((x) => x.endsWith('.css')),
  'JS and CSS assets required.',
);
for (const asset of assets) assert(existsSync(`dist${asset}`), `Missing asset ${asset}`);
/* "At least one .woff2 exists" only proves the directory is not empty. Fonts are
 * requested from inside the stylesheet, not from index.html, so nothing above
 * ever looks at them: deleting two of the six subsets this build emits still
 * passed, and the live page then silently falls back to a system face while
 * every gate stays green. Each url() target is resolved instead, and each one
 * is required to be on disk. */
const cssAssets = [...new Set(assets.filter((x) => x.endsWith('.css')))];
assert(cssAssets.length > 0, 'Stylesheet required to resolve font assets.');
const fontReferences = new Map();
for (const css of cssAssets) {
  const sheet = readFileSync(`dist${css}`, 'utf8');
  for (const [, url] of sheet.matchAll(/url\(\s*['"]?(\/[^)'"\s]+)/g)) {
    fontReferences.set(url, css);
  }
}
assert(fontReferences.size > 0, 'Locally bundled fonts required.');
for (const [url, css] of fontReferences) {
  assert(existsSync(`dist${url}`), `${url} is requested by ${css} but missing from the artifact`);
}
assert(
  readdirSync('dist/assets').some((x) => x.endsWith('.woff2')),
  'Locally bundled fonts required.',
);
assert(
  !readdirSync('dist').some((x) => ['.env', '.git', 'node_modules'].includes(x)),
  'Private build inputs must not be shipped.',
);
const config = JSON.parse(readFileSync('dist/staticwebapp.config.json', 'utf8'));
assert(
  config.routes.find((r) => r.route === '/release.json')?.headers['Cache-Control'] === 'no-store',
);
const release = JSON.parse(readFileSync('dist/release.json', 'utf8'));
assert(release.application === 'CUL' && /^[a-f0-9]{40}$/.test(release.commit));
console.log(
  `Static artifact verified: ${assets.length} entry assets, ${fontReferences.size} referenced fonts, cache policy and release SHA.`,
);
