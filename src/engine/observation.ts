import { surface } from '../environment/model';
import type { EnvironmentState, Observation, Strategy } from './types';
export function observe(e: EnvironmentState, strategy: Strategy, id: string): Observation {
  const elements = surface(e);
  const selected = e.records.find((r) => r.id === e.selected);
  const common = {
    id,
    version: e.version,
    strategy,
    scroll: e.scroll,
    selectedTitle: selected?.title ?? null,
    selectedGroup: selected?.group ?? null,
    draft: e.draft,
    dialog: e.dialog,
    overlay: e.overlay,
    untrusted: e.notice,
  };
  return strategy === 'coordinate'
    ? {
        ...common,
        coordinate: elements.map((x) => ({
          text: x.name,
          context: x.context,
          rect: x.rect,
          enabled: x.enabled,
          visible: x.visible,
        })),
      }
    : {
        ...common,
        semantic: elements.map((x) => ({
          role: x.role,
          name: x.name,
          context: x.context,
          enabled: x.enabled,
          visible: x.visible,
        })),
      };
}
