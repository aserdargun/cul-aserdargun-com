import { BookOpen, SlidersHorizontal, ClipboardList } from 'lucide-react';
import { scenarios } from '../content/scenarios';
import { t } from '../content/i18n';
import type { ExperimentRun, Lang, Strategy, ScenarioId, Faults } from '../engine/types';
export function Sidebar({
  run,
  lang,
  onChange,
}: {
  run: ExperimentRun;
  lang: Lang;
  onChange: (id: ScenarioId, strategy: Strategy, faults: Faults) => void;
}) {
  return (
    <aside className="sidebar panel">
      <div className="panel-heading">
        <h2>
          <BookOpen size={19} />
          {t('library', lang)}
        </h2>
      </div>
      <div className="scenario-list">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            aria-pressed={run.scenario.id === s.id}
            onClick={() => onChange(s.id, run.strategy, run.faults)}
          >
            <span className="scenario-number">0{i + 1}</span>
            <span>
              {s.title[lang]}
              <small>{s.subtitle[lang]}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        <h3>{t('strategy', lang)}</h3>
        <div className="segmented">
          {(['coordinate', 'semantic'] as const).map((s) => (
            <button
              key={s}
              aria-pressed={run.strategy === s}
              onClick={() => onChange(run.scenario.id, s, run.faults)}
            >
              {t(s, lang)}
            </button>
          ))}
        </div>
        <h3>
          <ClipboardList size={16} />
          {t('task', lang)}
        </h3>
        <p className="task-text">
          {t(run.scenario.goal.operation === 'edit' ? 'taskEdit' : 'taskArchive', lang)}
        </p>
        <details className="fault-settings">
          <summary>
            <SlidersHorizontal size={16} />
            {t('faults', lang)}
          </summary>
          {(['enabled', 'permanentBlock', 'missingLabel'] as const).map((f, i) => (
            <label className="check" key={f}>
              <input
                type="checkbox"
                checked={run.faults[f]}
                onChange={(x) =>
                  onChange(run.scenario.id, run.strategy, { ...run.faults, [f]: x.target.checked })
                }
              />
              {t((['enabled', 'permanent', 'missingLabel'] as const)[i], lang)}
            </label>
          ))}
        </details>
      </div>
    </aside>
  );
}
