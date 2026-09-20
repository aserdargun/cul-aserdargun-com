import { Eye, Crosshair, MousePointer2, CircleCheck, FileSearch, ShieldCheck } from 'lucide-react';
import type { ExperimentRun, Lang } from '../engine/types';
import { t, label, explain } from '../content/i18n';
export function Inspector({
  run,
  lang,
  onApproval,
  history,
}: {
  run: ExperimentRun;
  lang: Lang;
  onApproval: (yes: boolean) => void;
  history: number | null;
}) {
  const ev = history === null ? undefined : run.events[history];
  const o =
    ev?.observation ??
    (history !== null
      ? [...run.events.slice(0, history + 1)].reverse().find((x) => x.observation)?.observation
      : run.observation);
  const p =
    ev?.action ??
    (history !== null
      ? [...run.events.slice(0, history + 1)].reverse().find((x) => x.action)?.action
      : run.proposal);
  const a = history === null ? run.lastResult : ev?.result;
  const v = history === null ? run.verification : ev?.verification;
  return (
    <aside className="inspector panel">
      <div className="panel-heading">
        <h2>
          <FileSearch size={19} />
          {t('inspector', lang)}
        </h2>
      </div>
      {history !== null && <p className="history-notice">{t('history', lang)}</p>}
      <section>
        <h3>
          <span>01</span>
          <Eye size={18} />
          {t('observation', lang)}
        </h3>
        {o ? (
          <>
            <div className={`freshness ${o.version === run.environment.version ? 'fresh' : 'old'}`}>
              {t(o.version === run.environment.version ? 'fresh' : 'stale', lang)}
            </div>
            <dl>
              <dt>{t('snapshot', lang)}</dt>
              <dd>
                v{o.version} / {o.id.split(':').pop()}
              </dd>
              <dt>{t('current', lang)}</dt>
              <dd>v{run.environment.version}</dd>
            </dl>
            <details>
              <summary>{t('observedItems', lang)}</summary>
              <ul className="snapshot-list">
                {(o.coordinate ?? o.semantic ?? []).map((x, i) => (
                  <li key={i}>
                    {label('text' in x ? x.text : x.name, lang)} · {label(x.context, lang)}{' '}
                    {'rect' in x ? `[${x.rect.x},${x.rect.y}]` : label(x.role, lang)}
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <p>{t('noObservation', lang)}</p>
        )}
      </section>
      <section>
        <h3>
          <span>02</span>
          <Crosshair size={18} />
          {t('target', lang)}
        </h3>
        {p ? (
          <>
            <strong className="target-name">{label(p.target.name, lang)}</strong>
            <dl>
              <dt>{t('strategy', lang)}</dt>
              <dd>{t(run.strategy, lang)}</dd>
              {p.target.context && (
                <>
                  <dt>{t('group', lang)}</dt>
                  <dd>{label(p.target.context, lang)}</dd>
                </>
              )}
              {p.target.point && (
                <>
                  <dt>x / y</dt>
                  <dd>
                    {p.target.point.x} / {p.target.point.y}
                  </dd>
                </>
              )}
              <dt>{t('snapshot', lang)}</dt>
              <dd>{p.observationId.split(':').pop()}</dd>
            </dl>
          </>
        ) : (
          <p>{t('noTarget', lang)}</p>
        )}
      </section>
      <section>
        <h3>
          <span>03</span>
          <MousePointer2 size={18} />
          {t('action', lang)}
        </h3>
        {p && (
          <p>
            {label(p.operation, lang)}
            {p.value ? ` → ${label(p.value, lang)}` : ''}
          </p>
        )}
        {a ? (
          <>
            <p>{explain(a.code, lang)}</p>
            <dl>
              {(['applied', 'correctTarget', 'submitted'] as const).map((k, i) => (
                <div className="dl-row" key={k}>
                  <dt>
                    {t((['appliedLabel', 'correctLabel', 'submittedLabel'] as const)[i], lang)}
                  </dt>
                  <dd>{t(a[k] ? 'yes' : 'no', lang)}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p>{t('noAction', lang)}</p>
        )}
      </section>
      <section>
        <h3>
          <span>04</span>
          <CircleCheck size={18} />
          {t('verification', lang)}
        </h3>
        {v ? (
          <>
            <div className={v.passed ? 'good' : 'warning'}>{explain(v.code, lang)}</div>
            <dl>
              <dt>{t('expected', lang)}</dt>
              <dd>{label(v.expected, lang)}</dd>
              <dt>{t('actual', lang)}</dt>
              <dd>{label(v.actual, lang)}</dd>
              <dt>{t('verifiedLabel', lang)}</dt>
              <dd>{t(run.status === 'completed' && v.passed ? 'yes' : 'no', lang)}</dd>
              <dt>{t('duplicates', lang)}</dt>
              <dd>{t(v.duplicate ? 'yes' : 'no', lang)}</dd>
            </dl>
          </>
        ) : (
          <p>{t('noVerification', lang)}</p>
        )}
        <small>{t('internal', lang)}</small>
      </section>
      {run.status === 'awaiting-approval' && history === null && (
        <section className="approval-box">
          <h3>
            <ShieldCheck size={20} />
            {t('approvalTitle', lang)}
          </h3>
          <p>
            {run.environment.selected} · {label(run.proposal?.content ?? '', lang)}
          </p>
          <small>{t('approvalBody', lang)}</small>
          <div className="button-row">
            <button className="primary" onClick={() => onApproval(true)}>
              {t('approve', lang)}
            </button>
            <button onClick={() => onApproval(false)}>{t('reject', lang)}</button>
          </div>
        </section>
      )}
    </aside>
  );
}
