import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForRelease } from './wait-for-release.mjs';

const expected = 'b'.repeat(40);
const stale = { application: 'CUL', commit: 'a'.repeat(40) };
const current = { application: 'CUL', commit: expected };
const quiet = { onRetry() {} };

test('a current release passes without waiting', async () => {
  assert.equal(
    await waitForRelease(async () => current, expected, {
      ...quiet,
      wait() {
        assert.fail('Current release must not wait.');
      },
    }),
    current,
  );
});

test('a stale release is re-read until the exact uploaded commit appears', async () => {
  const responses = [stale, stale, current];
  const waits = [];
  const retries = [];
  const result = await waitForRelease(async () => responses.shift(), expected, {
    wait: async (ms) => waits.push(ms),
    onRetry: (event) => retries.push(event),
  });
  assert.equal(result, current);
  assert.deepEqual(waits, [5000, 5000]);
  assert.equal(retries.length, 2);
  assert.equal(responses.length, 0);
});

test('a permanently stale release fails after the finite budget', async () => {
  let reads = 0;
  let waits = 0;
  await assert.rejects(
    waitForRelease(
      async () => {
        reads++;
        return stale;
      },
      expected,
      {
        ...quiet,
        wait: async () => {
          waits++;
        },
      },
    ),
    /did not converge/,
  );
  assert.equal(reads, 13);
  assert.equal(waits, 12);
});

test('another application or malformed commit is never treated as propagation', async () => {
  for (const invalid of [
    { ...current, application: 'OTHER' },
    { ...current, commit: 'invalid' },
  ]) {
    await assert.rejects(
      waitForRelease(async () => invalid, expected, {
        ...quiet,
        wait() {
          assert.fail('Invalid metadata must fail immediately.');
        },
      }),
    );
  }
});

test('HTTP and metadata validation errors are not swallowed', async () => {
  const error = new Error('Invalid response headers');
  await assert.rejects(
    waitForRelease(
      async () => {
        throw error;
      },
      expected,
      {
        ...quiet,
        wait() {
          assert.fail('Read failures must remain fatal.');
        },
      },
    ),
    error,
  );
});
