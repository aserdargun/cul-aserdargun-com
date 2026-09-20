import type { ActionProposal, Observation, TaskGoal } from './types';
export type Selection = { code: string; proposal?: ActionProposal };
// Policy input deliberately excludes environment, record IDs and verifier state.
export function selectTarget(
  o: Observation,
  goal: TaskGoal,
  progress: number,
  scoped: boolean,
  actionId: string,
): Selection {
  const operation =
    progress === 0
      ? 'open'
      : goal.operation === 'archive'
        ? progress === 1
          ? 'request-archive'
          : 'archive'
        : progress === 1
          ? 'fill'
          : 'save';
  const name =
    operation === 'open'
      ? goal.title
      : operation === 'fill'
        ? 'note'
        : operation === 'request-archive'
          ? 'archive'
          : operation === 'archive'
            ? 'confirm'
            : 'save';
  const role = operation === 'fill' ? 'textbox' : 'button';
  const items =
    o.coordinate?.map((x) => ({ ...x, name: x.text, role: undefined })) ?? o.semantic ?? [];
  let matches = items.filter(
    (x) =>
      x.name === name &&
      (!('role' in x) || !x.role || x.role === role) &&
      (!scoped || operation !== 'open' || x.context === goal.group),
  );
  if (matches.length > 1) return { code: 'ambiguous' };
  if (matches.length === 0) return { code: 'missing' };
  if (!matches[0].visible) {
    return {
      code: 'selected',
      proposal: {
        id: actionId,
        observationId: o.id,
        version: o.version,
        operation: 'scroll',
        target: { name: 'scroll' },
        value: String(o.scroll < 80 ? 160 : 0),
        requiresApproval: false,
        content: '',
      },
    };
  }
  const m = matches[0];
  if (!m.enabled || o.overlay) return { code: 'unavailable' };
  const rect = 'rect' in m ? m.rect : undefined;
  const target = {
    name,
    context: scoped || operation !== 'open' ? m.context : undefined,
    ...(rect
      ? { point: { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }, bounds: rect }
      : { role }),
  };
  return {
    code: 'selected',
    proposal: {
      id: actionId,
      observationId: o.id,
      version: o.version,
      operation,
      target,
      value: operation === 'fill' ? goal.value : undefined,
      requiresApproval: operation === 'archive',
      content: operation === 'archive' ? o.draft : operation === 'fill' ? goal.value : '',
    },
  };
}
