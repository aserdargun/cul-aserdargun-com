import { describe, it, expect } from 'vitest';
import {
  createRun,
  advance,
  runToEnd,
  decideApproval,
  execute,
  intervene,
  metrics,
  replay,
  terminal,
  DISABLED_RETRIES,
} from '../src/engine/engine';
import { scenarios } from '../src/content/scenarios';
import { lessons } from '../src/components/Method';
import { eventText } from '../src/content/i18n';
import { observe } from '../src/engine/observation';
import { selectTarget } from '../src/engine/strategies';
import type { ExperimentRun, ScenarioId, Strategy } from '../src/engine/types';
const make = (id: ScenarioId = 'stable', strategy: Strategy = 'coordinate') =>
  createRun(
    scenarios.find((s) => s.id === id)!,
    strategy,
  );
function until(r: ExperimentRun, p: (r: ExperimentRun) => boolean) {
  for (let i = 0; i < 80 && !p(r); i++) r = advance(r);
  return r;
}
describe('complete deterministic experiments', () => {
  for (const strategy of ['coordinate', 'semantic'] as const)
    for (const id of ['stable', 'shift', 'ambiguous', 'blocked', 'uncertain'] as const) {
      it(`${strategy} completes ${id} with one verified write`, () => {
        const r = runToEnd(make(id, strategy));
        expect(r.status).toBe('completed');
        expect(r.verification?.passed).toBe(true);
        expect(r.environment.records[0].commits).toBe(1);
        expect(r.retries).toBeLessThanOrEqual(3);
      });
    }
  it('identical conditions produce identical full event streams', () =>
    expect(runToEnd(make('shift'))).toEqual(runToEnd(make('shift'))));
  it('stale coordinate is blocked before applying to a different record', () => {
    let r = until(make(), (r) => r.status === 'acting');
    r = intervene(r, { type: 'sort' });
    r = advance(r);
    expect(r.lastResult?.code).toBe('stale');
    expect(r.environment.selected).toBeNull();
    expect(runToEnd(r).status).toBe('completed');
  });
  it('semantic ambiguity narrows context without first-match side effects', () => {
    const r = until(make('ambiguous', 'semantic'), (r) => r.status === 'recovering');
    expect(r.environment.selected).toBeNull();
    expect(r.events.at(-1)?.code).toBe('ambiguous');
    expect(runToEnd(r).environment.selected).toBe('CUL-104');
  });
  it('covered target does not receive actions and retry budget is bounded', () => {
    let r = intervene(make(), { type: 'overlay' });
    r = runToEnd(r);
    expect(r.status).toBe('handed-off');
    expect(r.retries).toBe(3);
    expect(metrics(r).actions).toBe(0);
  });
  it('disabled target never writes during permanent blocking', () => {
    const r = runToEnd(createRun(scenarios[3], 'semantic', 'permanent', { permanentBlock: true }));
    expect(r.status).toBe('handed-off');
    expect(r.environment.records[0].commits).toBe(0);
    expect(r.retries).toBe(3);
  });
  it('missing labels force handoff for both strategies', () => {
    for (const strategy of ['coordinate', 'semantic'] as const) {
      const r = runToEnd(createRun(scenarios[0], strategy, 'missing', { missingLabel: true }));
      expect(r.status).toBe('handed-off');
      expect(r.environment.records[0].commits).toBe(0);
    }
  });
  it('scope escalation is denied by the engine', () => {
    const r = until(make('stable', 'semantic'), (r) => r.status === 'acting');
    const p = { ...r.proposal!, operation: 'archive' as const, requiresApproval: false };
    expect(execute(r, p).code).toBe('scope-blocked');
    expect(r.environment.records.every((x) => !x.archived)).toBe(true);
  });
  it('uncertain outcome is checked without repeating, blind repeat is measurable', () => {
    let r = runToEnd(make('uncertain'));
    expect(r.environment.receipt).toBe(false);
    expect(r.environment.records[0].commits).toBe(1);
    expect(r.events.some((e) => e.code === 'receipt-missing')).toBe(true);
    r = intervene(r, { type: 'blind-repeat' });
    expect(metrics(r).duplicates).toBe(true);
    expect(r.environment.records[0].commits).toBe(2);
  });
  it('old delayed step cannot modify reset run', () => {
    const old = until(make(), (r) => r.status === 'acting');
    const fresh = createRun(scenarios[0], 'coordinate', 'new-run');
    expect(advance(fresh, old.id)).toBe(fresh);
  });
  it('history replay is pure and detached', () => {
    const r = runToEnd(make());
    const before = JSON.stringify(r);
    const history = replay(r, 4);
    history[0].code = 'tamper';
    expect(JSON.stringify(r)).toBe(before);
    expect(r.environment.records[0].commits).toBe(1);
  });
  it('observation does not leak private IDs, semantic geometry or coordinate roles', () => {
    const e = make().environment;
    const c = observe(e, 'coordinate', 'c'),
      s = observe(e, 'semantic', 's');
    expect(JSON.stringify(c)).not.toContain('CUL-104');
    expect(JSON.stringify(s)).not.toContain('CUL-104');
    expect(s.coordinate).toBeUndefined();
    expect(c.semantic).toBeUndefined();
    expect(JSON.stringify(c)).not.toContain('role');
    expect(JSON.stringify(s)).not.toContain('rect');
    expect(selectTarget(c, scenarios[0].goal, 0, false, 'a').proposal?.target.point).toBeDefined();
    expect(
      selectTarget(s, scenarios[0].goal, 0, false, 'b').proposal?.target.point,
    ).toBeUndefined();
  });
  it('step budget hands off instead of running forever, and it is the budget the panel publishes', () => {
    /* docs/ARCHITECTURE.md publishes the budget as the contract:
     *
     *   "Failure -> Recovering -> Observing, up to 3 retries; persistent failure
     *    -> Handed off. Total budget: 64 synthetic steps."
     *
     * and the Methods panel repeats those same two numbers to the reader in
     * both locales ("En fazla 3 yeniden deneme ve 64 adim" / "At most 3 retries
     * and 64 steps"), while the Player renders recovery.maxSteps live as the
     * denominator beside the step counter.
     *
     * The guard is three lines in engine.ts, and no scenario legitimately burns
     * 64 steps: the retry budget always hands off first. So deleting the guard,
     * turning `>` into `>=`, or editing 64 in scenarios.ts would change nothing
     * any other test observes - the step budget is a safety net no scenario
     * reaches, which is exactly why it needs its own test. A one-step budget
     * makes the boundary reachable: the first advance is inside it, the second
     * is one past it.
     */
    const budget = scenarios[0].recovery;
    const inside = { ...scenarios[0], recovery: { ...budget, maxSteps: 1 } };
    const first = advance(createRun(inside, 'coordinate', 'budget-1'));
    expect(first.steps).toBe(1);
    expect(terminal(first.status), 'one step is still inside the budget').toBe(false);

    const over = advance(first);
    expect(over.steps).toBe(2);
    expect(over.status).toBe('handed-off');
    expect(over.events.at(-1)?.code).toBe('step-budget');
    expect(terminal(over.status), 'exhaustion stops the run, it does not flag it').toBe(true);
    /* Exhaustion is terminal, so no further action may be produced after it. */
    expect(over.environment.records[0].commits).toBe(0);

    /* The sentence the reader sees must state the policy the engine runs, so
     * compare the integers in the prose against the enforced budget rather than
     * pinning wording: rewording stays free, a changed number does not. */
    const [, , , tr, en] = lessons.find(([id]) => id === 'blocked')!;
    const numbers = (s: string) =>
      [...s.matchAll(/\d+/g)]
        .map((m) => Number(m[0]))
        .sort((a, b) => a - b);
    const enforced = [budget.maxRetries, budget.maxSteps].sort((a, b) => a - b);
    expect(numbers(tr), 'Turkish panel copy vs enforced budget').toEqual(enforced);
    expect(numbers(en), 'English panel copy vs enforced budget').toEqual(enforced);
    /* Every scenario the reader can pick carries the same budget the copy claims. */
    for (const s of scenarios) expect(s.recovery).toEqual(budget);
  });

  it('the disabled window the reader is promised is the window the engine runs', () => {
    /* The blocked scenario publishes how long Save stays disabled: the lesson
       on the scenario card, and the "available" event the reader sees when the
       button comes back. The engine held that window as a bare literal, so
       nothing connected the prose to it — changing the number in the engine
       left the published claim wrong and every test green. The step budget got
       this guard; this number did not. */
    const blocked = scenarios.find((s) => s.id === 'blocked')!;
    const numberWords: Record<string, number> = {
      bir: 1, one: 1, iki: 2, two: 2, üç: 3, three: 3, dört: 4, four: 4,
      beş: 5, five: 5, altı: 6, six: 6, yedi: 7, seven: 7, sekiz: 8, eight: 8,
      dokuz: 9, nine: 9, on: 10, ten: 10,
    };
    /* The prose spells small numbers out, so the binding has to read words as
       well as digits: rewording stays free, a changed number does not.
       "İ" lowercases to two characters, so it is folded to a plain "i"
       before the text is tokenised. */
    const numbers = (s: string) =>
      (s.replace(/İ/g, 'i').toLowerCase().match(/\d+|[a-zçğıöşü]+/g) ?? [])
        .map((token) => (/^\d+$/.test(token) ? Number(token) : numberWords[token]))
        .filter((n): n is number => n !== undefined);

    for (const text of [blocked.lesson.tr, blocked.lesson.en]) {
      expect(numbers(text), 'published lesson vs enforced window').toContain(
        DISABLED_RETRIES,
      );
    }
    for (const text of [eventText.available[0], eventText.available[1]]) {
      expect(numbers(text), 'published event text vs enforced window').toContain(
        DISABLED_RETRIES,
      );
    }

    /* And the engine must really keep the button disabled for exactly that
       many retries: it comes back on the retry the prose names, not earlier. */
    let r = createRun(blocked, 'semantic', 'disabled-window');
    let blockedAt: number | null = null;
    let availableAt: number | null = null;
    for (let i = 0; i < 40 && r.status !== 'completed' && r.status !== 'handed-off'; i++) {
      r = advance(r);
      const code = r.events.at(-1)?.code;
      if (code === 'disabled' && blockedAt === null) blockedAt = r.retries;
      if (code === 'available' && availableAt === null) availableAt = r.retries;
    }
    expect(blockedAt, 'the block is added before any retry is spent').toBe(0);
    expect(
      availableAt,
      'the button comes back on the retry the prose names',
    ).toBe(DISABLED_RETRIES);
    expect(r.status).toBe('completed');
  });
});
describe('bound single-use approval', () => {
  for (const strategy of ['coordinate', 'semantic'] as const) {
    it(`requires and consumes approval (${strategy})`, () => {
      let r = runToEnd(make('approval', strategy));
      expect(r.status).toBe('awaiting-approval');
      expect(r.environment.records[0].archived).toBe(false);
      expect(execute(r, r.proposal!).code).toBe('approval-invalid');
      r = runToEnd(decideApproval(r, true));
      expect(r.status).toBe('completed');
      expect(r.approval?.used).toBe(true);
      expect(r.environment.records[0].archiveCount).toBe(1);
      expect(metrics(r).scopeBlocked).toBe(1);
      expect(execute(r, r.proposal!).applied).toBe(false);
    });
  }
  it('rejection blocks without mutation', () => {
    const r = decideApproval(runToEnd(make('approval')), false);
    expect(r.status).toBe('blocked');
    expect(r.environment.records[0].archived).toBe(false);
  });
  it('content edit invalidates approved operation', () => {
    let r = decideApproval(runToEnd(make('approval', 'semantic')), true);
    r = intervene(r, { type: 'draft', value: 'changed' });
    expect(r.approval).toBeUndefined();
    r = runToEnd(r);
    expect(r.status).toBe('awaiting-approval');
    expect(r.environment.records[0].archived).toBe(false);
    expect(r.proposal?.content).toBe('changed');
  });
  it('changing target invalidates approval and scope', () => {
    let r = decideApproval(runToEnd(make('approval', 'semantic')), true);
    const proposal = r.proposal!;
    r = intervene(r, { type: 'open', value: 'CUL-105' });
    expect(r.approval).toBeUndefined();
    expect(execute(r, proposal).applied).toBe(false);
    expect(r.environment.records.every((x) => !x.archived)).toBe(true);
  });
  it('approval from another run is not valid', () => {
    const a = decideApproval(runToEnd(make('approval', 'semantic')), true);
    const b = runToEnd(createRun(scenarios[5], 'semantic', 'another'));
    b.approval = a.approval;
    expect(execute(b, b.proposal!).code).toBe('approval-invalid');
  });
});
