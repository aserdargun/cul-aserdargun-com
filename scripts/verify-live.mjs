import assert from 'node:assert/strict';
const base = new URL(process.env.CUL_BASE_URL || process.argv[2]);
const expected = process.env.EXPECTED_COMMIT || process.argv[3];
assert(base.protocol === 'https:', 'Production checks require HTTPS.');
assert(/^[a-f0-9]{40}$/.test(expected || ''), 'Expected commit SHA required.');
async function read(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
  const body = await response.text();
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return { response, body };
}
const { response: releaseResponse, body: releaseBody } = await read('/release.json');
assert(releaseResponse.headers.get('content-type')?.includes('application/json'));
assert(releaseResponse.headers.get('cache-control')?.includes('no-store'));
const release = JSON.parse(releaseBody);
assert.equal(release.application, 'CUL');
assert.equal(release.commit, expected, 'Live release SHA does not match the pushed commit.');
const { response, body } = await read('/');
assert(response.headers.get('content-type')?.includes('text/html'));
assert(body.includes('CUL — Computer Use Laboratory'));
assert(response.headers.get('x-content-type-options') === 'nosniff');
assert(response.headers.get('content-security-policy')?.includes("script-src 'self'"));
const assets = [...body.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((m) => m[1]);
assert(assets.some((x) => x.endsWith('.js')) && assets.some((x) => x.endsWith('.css')));
await Promise.all(
  assets.map(async (path) => {
    const { response: asset, body: content } = await read(path);
    assert(
      asset.headers
        .get('content-type')
        ?.includes(path.endsWith('.css') ? 'text/css' : 'javascript'),
    );
    assert(asset.headers.get('cache-control')?.includes('immutable'));
    assert(content.length > 0);
  }),
);
console.log(
  JSON.stringify(
    {
      url: base.origin,
      commit: release.commit,
      builtAt: release.builtAt,
      assets: assets.length,
      verifiedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
