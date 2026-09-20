import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const commit =
  process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('A complete commit SHA is required.');
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
writeFileSync(
  'dist/release.json',
  JSON.stringify(
    {
      application: 'CUL',
      version,
      commit,
      builtAt: new Date().toISOString(),
      source: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local-build',
    },
    null,
    2,
  ) + '\n',
);
console.log(`Release metadata: CUL ${version}, commit ${commit}`);
