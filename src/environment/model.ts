import { label } from '../content/i18n';
import type { EnvironmentState, Scenario, SurfaceElement } from '../engine/types';
export function initialEnvironment(scenario: Scenario): EnvironmentState {
  return {
    version: 1,
    records: [
      { id: 'CUL-104', title: 'orbit', group: 'astronomy' },
      { id: 'CUL-105', title: 'spectrum', group: 'optics' },
      { id: 'CUL-106', title: 'lens', group: 'optics' },
      { id: 'CUL-107', title: 'surface', group: 'geology' },
      { id: 'CUL-108', title: scenario.id === 'ambiguous' ? 'orbit' : 'signal', group: 'geology' },
      { id: 'CUL-109', title: 'sample', group: 'astronomy' },
      { id: 'CUL-110', title: 'horizon', group: 'geology' },
      { id: 'CUL-111', title: 'calibration', group: 'optics' },
    ].map((r) => ({ ...r, value: 'draft', archived: false, commits: 0, archiveCount: 0 })),
    selected: null,
    draft: 'draft',
    search: '',
    filter: 'all',
    reversed: false,
    scroll: 0,
    overlay: false,
    dialog: false,
    disabled: false,
    notice: false,
    missingLabel: false,
    receipt: false,
  };
}
export function visibleRecords(e: EnvironmentState) {
  const rows = e.records.filter(
    (r) =>
      (!e.search ||
        `${r.id} ${r.title} ${label(r.title, 'tr')} ${label(r.title, 'en')}`
          .toLocaleLowerCase('tr')
          .includes(e.search.toLocaleLowerCase('tr'))) &&
      (e.filter === 'all' || (e.filter === 'archived' ? r.archived : !r.archived)),
  );
  return e.reversed ? [...rows].reverse() : rows;
}
export function surface(e: EnvironmentState): SurfaceElement[] {
  const element = (
    key: string,
    name: string,
    operation: SurfaceElement['operation'],
    rect: SurfaceElement['rect'],
    role: SurfaceElement['role'] = 'button',
  ): SurfaceElement => ({
    key,
    name,
    role,
    operation,
    rect,
    context: e.selected ? e.records.find((r) => r.id === e.selected)!.group : '',
    visible: true,
    enabled: !e.overlay,
  });
  if (!e.selected)
    return visibleRecords(e).map((r, i) => ({
      key: r.id,
      role: 'button',
      name: r.title,
      context: r.group,
      rect: { x: 20, y: 156 + i * 52 - e.scroll, w: 600, h: 48 },
      enabled: !e.overlay,
      visible: 156 + i * 52 - e.scroll >= 156 && 204 + i * 52 - e.scroll <= 432,
      operation: 'open',
      record: r.id,
    }));
  if (e.dialog)
    return [element('confirm', 'confirm', 'archive', { x: 348, y: 322, w: 228, h: 42 })];
  return [
    element(
      'note',
      e.missingLabel ? '' : 'note',
      'fill',
      { x: 24, y: 192, w: 592, h: 80 },
      'textbox',
    ),
    {
      ...element('save', 'save', 'save', { x: 24, y: 306, w: 160, h: 42 }),
      enabled: !e.disabled && !e.overlay,
    },
    element('archive', 'archive', 'request-archive', { x: 200, y: 306, w: 190, h: 42 }),
  ];
}
export type Mutation =
  | {
      type:
        | 'sort'
        | 'overlay'
        | 'back'
        | 'close-dialog'
        | 'manual-save'
        | 'blind-repeat'
        | 'request-archive';
      value?: never;
    }
  | { type: 'search' | 'draft'; value: string }
  | { type: 'scroll'; value: number }
  | { type: 'filter'; value: EnvironmentState['filter'] }
  | { type: 'open'; value: string };
export function mutateEnvironment(e: EnvironmentState, m: Mutation): EnvironmentState {
  const n = structuredClone(e);
  n.version++;
  n.receipt = false;
  switch (m.type) {
    case 'sort':
      n.reversed = !n.reversed;
      break;
    case 'overlay':
      n.overlay = !n.overlay;
      break;
    case 'search':
      n.search = m.value;
      n.scroll = 0;
      break;
    case 'filter':
      n.filter = m.value;
      n.scroll = 0;
      break;
    case 'scroll':
      n.scroll = Math.max(0, Math.min(Math.max(0, visibleRecords(n).length * 52 - 276), m.value));
      break;
    case 'draft':
      n.draft = m.value;
      break;
    case 'open':
      if (n.records.some((r) => r.id === m.value)) {
        n.selected = m.value;
        n.draft = n.records.find((r) => r.id === m.value)!.value;
      }
      break;
    case 'back':
      n.selected = null;
      n.dialog = false;
      break;
    case 'close-dialog':
      n.dialog = false;
      break;
    case 'request-archive':
      n.dialog = true;
      break;
    case 'manual-save':
    case 'blind-repeat': {
      const r = n.records.find((r) => r.id === n.selected);
      if (r && !n.disabled && !n.overlay && !n.dialog) {
        r.value = n.draft;
        r.commits++;
        n.receipt = m.type === 'manual-save';
      }
      break;
    }
  }
  return n;
}
