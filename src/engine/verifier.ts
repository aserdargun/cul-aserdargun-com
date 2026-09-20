import type { EnvironmentState, TaskGoal, VerificationResult } from './types';
export function verify(e: EnvironmentState, goal: TaskGoal, final: boolean): VerificationResult {
  const r = e.records.find((r) => r.title === goal.title && r.group === goal.group);
  const passed =
    !!r &&
    (final
      ? goal.operation === 'archive'
        ? r.archived
        : r.value === goal.value
      : e.selected === r.id);
  return {
    passed,
    source: 'environment-state',
    expected: final ? (goal.operation === 'archive' ? 'archived' : goal.value) : goal.title,
    actual: final
      ? goal.operation === 'archive'
        ? r?.archived
          ? 'archived'
          : 'active'
        : (r?.value ?? 'missing')
      : (e.records.find((x) => x.id === e.selected)?.title ?? 'none'),
    duplicate: !!r && (r.commits > 1 || r.archiveCount > 1),
    code: passed ? 'verified' : 'not-verified',
  };
}
