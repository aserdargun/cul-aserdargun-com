import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
assert(
  html.includes('<title>CUL — Bilgisayar Kullanımı Laboratuvarı</title>'),
  'Missing CUL page identity.',
);
assert(!html.includes('/src/main.tsx'), 'Unbuilt source entry found.');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((m) => m[1]);
assert(
  assets.some((x) => x.endsWith('.js')) && assets.some((x) => x.endsWith('.css')),
  'JS and CSS assets required.',
);
for (const asset of assets) assert(existsSync(`dist${asset}`), `Missing asset ${asset}`);
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
  `Static artifact verified: ${assets.length} entry assets, local fonts, cache policy and release SHA.`,
);
