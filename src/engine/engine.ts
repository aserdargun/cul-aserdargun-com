import {
  initialEnvironment,
  mutateEnvironment,
  surface,
  visibleRecords,
  type Mutation,
} from '../environment/model';
import { observe } from './observation';
import { selectTarget } from './strategies';
import { verify } from './verifier';
import type {
  ActionProposal,
  ActionResult,
  ExperimentRun,
  Faults,
  RunEvent,
  Scenario,
  Status,
  Strategy,
} from './types';
export const terminal = (s: Status) => ['completed', 'failed', 'blocked', 'handed-off'].includes(s);
export function createRun(
  scenario: Scenario,
  strategy: Strategy,
  id = 'run-001',
  faults: Partial<Faults> = {},
): ExperimentRun {
  const environment = initialEnvironment(scenario);
  const f = { enabled: true, permanentBlock: false, missingLabel: false, ...faults };
  if (!f.enabled && scenario.id === 'ambiguous') environment.records[4].title = 'signal';
  environment.missingLabel = f.missingLabel;
  return {
    schemaVersion: '1.0',
    id,
    scenario,
    strategy,
    faults: f,
    initialState: structuredClone(environment),
    environment,
    status: 'ready',
    progress: 0,
    steps: 0,
    retries: 0,
    recoveries: 0,
    scoped: false,
    injected: false,
    events: [],
  };
}
function event(r: ExperimentRun, code: string, extra: Partial<RunEvent> = {}) {
  r.events.push({
    seq: r.events.length + 1,
    code,
    status: r.status,
    version: r.environment.version,
    observationId: r.observation?.id,
    actionId: r.proposal?.id,
    ...extra,
  });
}
function recover(r: ExperimentRun, code: string) {
  if (r.retries >= r.scenario.recovery.maxRetries) {
    r.status = 'handed-off';
  } else {
    r.retries++;
    r.recoveries++;
    r.status = 'recovering';
  }
  event(r, code);
  if (r.status === 'handed-off') event(r, 'budget-exhausted');
}
export function approvalMatches(r: ExperimentRun, p: ActionProposal) {
  return (
    !!r.approval &&
    !r.approval.used &&
    r.approval.runId === r.id &&
    r.approval.actionId === p.id &&
    r.approval.target === r.environment.selected &&
    r.approval.content === r.environment.draft &&
    p.content === r.environment.draft
  );
}
// The actuator resolves a public descriptor against the current isolated surface only.
export function execute(r: ExperimentRun, p: ActionProposal): ActionResult {
  const e = r.environment;
  const goal = r.scenario.goal;
  const no = (code: string): ActionResult => ({
    applied: false,
    correctTarget: false,
    submitted: false,
    code,
  });
  if (p.observationId !== r.observation?.id || p.version !== r.observation.version)
    return no('invalid-observation');
  if (p.operation === 'archive' && goal.operation !== 'archive') return no('scope-blocked');
  if (p.operation === 'request-archive' && goal.operation !== 'archive') return no('scope-blocked');
  if ((p.operation === 'fill' || p.operation === 'save') && goal.operation !== 'edit')
    return no('scope-blocked');
  if (r.strategy === 'coordinate' && p.version !== e.version) return no('stale');
  if (e.overlay) return no('unavailable');
  if (p.operation === 'scroll') {
    e.scroll = Math.max(0, Math.min(visibleRecords(e).length * 52 - 276, Number(p.value)));
    e.version++;
    return { applied: true, correctTarget: true, submitted: false, code: 'scrolled' };
  }
  const elements = surface(e);
  const matches = p.target.point
    ? elements.filter((x) => {
        const a = p.target.point!,
          b = x.rect;
        return a.x >= b.x && a.x <= b.x + b.w && a.y >= b.y && a.y <= b.y + b.h;
      })
    : elements.filter(
        (x) =>
          x.role === p.target.role &&
          x.name === p.target.name &&
          (!p.target.context || x.context === p.target.context),
      );
  if (matches.length !== 1) return no(matches.length ? 'ambiguous' : 'missing');
  const t = matches[0];
  if (!t.visible || !t.enabled) return no('unavailable');
  if (t.operation !== p.operation) return no('wrong-target');
  if (t.operation === 'open') {
    const record = e.records.find((x) => x.id === t.record)!;
    if (record.title !== goal.title || record.group !== goal.group) return no('wrong-target');
    e.selected = record.id;
    e.draft = record.value;
  } else {
    const record = e.records.find((x) => x.id === e.selected);
    if (!record || record.title !== goal.title || record.group !== goal.group)
      return no('scope-blocked');
    if (t.operation === 'fill') {
      if (p.value !== goal.value) return no('scope-blocked');
      e.draft = p.value;
    }
    if (t.operation === 'save') {
      if (e.draft !== goal.value) return no('content-changed');
      record.value = e.draft;
      record.commits++;
      e.receipt = !(r.scenario.id === 'uncertain' && r.faults.enabled);
    }
    if (t.operation === 'request-archive') e.dialog = true;
    if (t.operation === 'archive') {
      if (!approvalMatches(r, p)) return no('approval-invalid');
      record.archived = true;
      record.archiveCount++;
      e.dialog = false;
      r.approval!.used = true;
      e.receipt = true;
    }
  }
  e.version++;
  return {
    applied: true,
    correctTarget: true,
    submitted: t.operation === 'save' || t.operation === 'archive',
    code: t.operation === 'save' && !e.receipt ? 'receipt-missing' : 'applied',
  };
}
export function advance(input: ExperimentRun, runId = input.id): ExperimentRun {
  if (input.id !== runId || terminal(input.status) || input.status === 'awaiting-approval')
    return input;
  const r = structuredClone(input);
  r.steps++;
  if (r.steps > r.scenario.recovery.maxSteps) {
    r.status = 'handed-off';
    event(r, 'step-budget');
    return r;
  }
  switch (r.status) {
    case 'ready':
    case 'recovering':
      r.status = 'observing';
      event(r, 'observe-start');
      break;
    case 'observing': {
      r.observation = observe(
        r.environment,
        r.strategy,
        `${r.id}:o${r.events.filter((e) => e.code === 'observed').length + 1}`,
      );
      r.status = 'targeting';
      event(r, 'observed', { observation: structuredClone(r.observation) });
      if (r.faults.enabled && !r.injected && r.scenario.id === 'shift') {
        r.environment = mutateEnvironment(r.environment, { type: 'sort' });
        r.injected = true;
        event(r, 'layout-changed');
      }
      if (r.observation.untrusted && !r.events.some((e) => e.code === 'scope-blocked'))
        event(r, 'scope-blocked');
      break;
    }
    case 'targeting': {
      const selection = selectTarget(
        r.observation!,
        r.scenario.goal,
        r.progress,
        r.scoped,
        `${r.id}:a${r.steps}`,
      );
      if (!selection.proposal) {
        if (selection.code === 'ambiguous') r.scoped = true;
        recover(r, selection.code);
        break;
      }
      r.proposal = selection.proposal;
      r.status = 'action-ready';
      event(r, 'target-selected', { action: structuredClone(r.proposal) });
      break;
    }
    case 'action-ready': {
      if (r.proposal!.requiresApproval && !approvalMatches(r, r.proposal!)) {
        r.status = 'awaiting-approval';
        event(r, 'approval-required');
        break;
      }
      r.status = 'acting';
      event(r, 'preconditions');
      break;
    }
    case 'acting': {
      const result = execute(r, r.proposal!);
      r.lastResult = result;
      event(r, result.code, {
        result: structuredClone(result),
        action: structuredClone(r.proposal),
      });
      if (!result.applied) {
        if (result.code === 'approval-invalid') {
          r.approval = undefined;
        }
        recover(r, result.code);
        break;
      }
      if (r.proposal!.operation === 'scroll') {
        r.status = 'observing';
        break;
      }
      r.observation = observe(
        r.environment,
        r.strategy,
        `${r.id}:o${r.events.filter((e) => e.code === 'observed').length + 1}`,
      );
      event(r, 'observed', { observation: structuredClone(r.observation) });
      r.status = 'verifying';
      break;
    }
    case 'verifying': {
      const final = r.progress === 2;
      r.verification = verify(r.environment, r.scenario.goal, final);
      if (r.progress === 1) {
        r.verification.passed =
          r.scenario.goal.operation === 'archive'
            ? r.environment.dialog
            : r.environment.draft === r.scenario.goal.value;
        r.verification.expected =
          r.scenario.goal.operation === 'archive' ? 'dialog' : r.scenario.goal.value;
        r.verification.actual =
          r.scenario.goal.operation === 'archive'
            ? r.environment.dialog
              ? 'dialog'
              : 'none'
            : r.environment.draft;
      }
      r.verification.code = r.verification.passed ? 'verified' : 'not-verified';
      event(r, r.verification.code, { verification: structuredClone(r.verification) });
      if (!r.verification.passed) {
        recover(r, 'verification-failed');
        break;
      }
      if (final) {
        r.status = 'completed';
        event(r, 'completed');
        break;
      }
      r.progress++;
      r.status = 'observing';
      r.proposal = undefined;
      if (r.faults.enabled && r.scenario.id === 'blocked' && r.progress === 2) {
        r.environment.disabled = true;
        r.environment.version++;
        event(r, 'disabled');
      }
      if (r.faults.enabled && r.scenario.id === 'approval' && r.progress === 1) {
        r.environment.notice = true;
        r.environment.version++;
      }
      break;
    }
  }
  if (
    (r.status as Status) === 'recovering' &&
    r.scenario.id === 'blocked' &&
    r.retries >= 2 &&
    !r.faults.permanentBlock &&
    r.environment.disabled
  ) {
    r.environment.disabled = false;
    r.environment.version++;
    event(r, 'available');
  }
  return r;
}
export function intervene(input: ExperimentRun, m: Mutation): ExperimentRun {
  const r = structuredClone(input);
  r.environment = mutateEnvironment(r.environment, m);
  if (r.approval && !r.approval.used) {
    r.approval = undefined;
    r.status = 'observing';
    r.proposal = undefined;
    event(r, 'approval-invalid');
  }
  if (r.status === 'awaiting-approval') {
    r.status = 'observing';
    r.proposal = undefined;
  }
  event(r, m.type === 'blind-repeat' ? 'blind-repeat' : 'intervention', { detail: m.type });
  if (terminal(r.status) && r.verification)
    r.verification = verify(r.environment, r.scenario.goal, true);
  return r;
}
export function decideApproval(input: ExperimentRun, approved: boolean): ExperimentRun {
  if (input.status !== 'awaiting-approval' || !input.proposal) return input;
  const r = structuredClone(input);
  if (!approved) {
    r.status = 'blocked';
    event(r, 'rejected');
    return r;
  }
  if (r.proposal!.content !== r.environment.draft || !r.environment.dialog) {
    r.status = 'observing';
    event(r, 'approval-invalid');
    return r;
  }
  r.approval = {
    runId: r.id,
    actionId: r.proposal!.id,
    target: r.environment.selected!,
    content: r.environment.draft,
    used: false,
  };
  r.status = 'action-ready';
  event(r, 'approved');
  return r;
}
export function metrics(r: ExperimentRun) {
  return {
    actions: r.events.filter((e) => e.result?.applied).length,
    observations: r.events.filter((e) => e.code === 'observed').length,
    targetFailures: r.events.filter(
      (e) =>
        ['ambiguous', 'missing', 'stale', 'wrong-target', 'unavailable'].includes(e.code) &&
        !e.result,
    ).length,
    retries: r.retries,
    recoveries: r.recoveries,
    verified: r.verification?.passed && r.status === 'completed',
    duplicates: r.environment.records.some((x) => x.commits > 1 || x.archiveCount > 1),
    scopeBlocked: r.events.filter((e) => e.code === 'scope-blocked').length,
  };
}
export function replay(r: ExperimentRun, index: number) {
  return structuredClone(r.events.slice(0, index + 1));
}
export function runToEnd(r: ExperimentRun): ExperimentRun {
  let n = r;
  for (let i = 0; i < 100 && !terminal(n.status) && n.status !== 'awaiting-approval'; i++)
    n = advance(n);
  return n;
}
