import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';

// Azure may briefly serve the previous release after its upload step succeeds.
// Only a valid CUL manifest with a stale commit is retried; other failures stay fatal.
export async function waitForRelease(
  readRelease,
  expected,
  {
    attempts = 13,
    intervalMs = 5000,
    wait = sleep,
    onRetry = ({ attempt, attempts, commit }) =>
      console.log(`Waiting for release propagation (${attempt}/${attempts}); observed ${commit}.`),
  } = {},
) {
  assert(/^[a-f0-9]{40}$/.test(expected || ''), 'Expected commit SHA required.');
  assert(Number.isInteger(attempts) && attempts > 0, 'A finite attempt budget is required.');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const release = await readRelease();
    assert.equal(release.application, 'CUL', 'Unexpected application in release metadata.');
    assert(/^[a-f0-9]{40}$/.test(release.commit || ''), 'Invalid live commit SHA.');
    if (release.commit === expected) return release;
    assert.notEqual(attempt, attempts, 'Live release SHA did not converge to the pushed commit.');
    onRetry({ attempt, attempts, commit: release.commit });
    await wait(intervalMs);
  }
}
