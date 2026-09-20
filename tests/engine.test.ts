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
} from '../src/engine/engine';
import { scenarios } from '../src/content/scenarios';
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
    let a = decideApproval(runToEnd(make('approval', 'semantic')), true);
    let b = runToEnd(createRun(scenarios[5], 'semantic', 'another'));
    b.approval = a.approval;
    expect(execute(b, b.proposal!).code).toBe('approval-invalid');
  });
});
