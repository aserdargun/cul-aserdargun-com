import { useState } from 'react';
import { ArrowRightLeft, Download } from 'lucide-react';
import type { ExperimentRun, Lang, ScenarioId, Faults } from '../engine/types';
import { scenarios } from '../content/scenarios';
import { createRun, runToEnd, metrics, decideApproval } from '../engine/engine';
import { t, label, explain } from '../content/i18n';
import { downloadRun } from './Player';
export function Comparison({
  lang,
  scenarioId,
  faults,
}: {
  lang: Lang;
  scenarioId: ScenarioId;
  faults: Faults;
}) {
  const [id, setId] = useState(scenarioId);
  const [pair, setPair] = useState<ExperimentRun[]>([]);
  const selected = scenarios.find((x) => x.id === id)!;
  function runPair() {
    setPair(
      (['coordinate', 'semantic'] as const).map((strategy) =>
        runToEnd(createRun(selected, strategy, `comparison-${strategy}`, faults)),
      ),
    );
  }
  return (
    <main className="comparison-page">
      <div className="page-intro">
        <ArrowRightLeft size={28} />
        <h1>{t('compare', lang)}</h1>
        <p>{t('comparisonIntro', lang)}</p>
      </div>
      <div className="compare-tools">
        <label>
          {t('library', lang)}
          <select
            value={id}
            onChange={(x) => {
              setId(x.target.value as ScenarioId);
              setPair([]);
            }}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title[lang]}
              </option>
            ))}
          </select>
        </label>
        <button className="primary" onClick={runPair}>
          <ArrowRightLeft size={17} />
          {t('runPair', lang)}
        </button>
      </div>
      <p>{selected.lesson[lang]}</p>
      <p className="micro">
        {t('enabled', lang)}: {t(faults.enabled ? 'yes' : 'no', lang)} · {t('permanent', lang)}:{' '}
        {t(faults.permanentBlock ? 'yes' : 'no', lang)} · {t('missingLabel', lang)}:{' '}
        {t(faults.missingLabel ? 'yes' : 'no', lang)}
      </p>
      {!pair.length ? (
        <div className="empty-comparison panel">
          <ArrowRightLeft size={40} />
          <p>{t('noPair', lang)}</p>
        </div>
      ) : (
        <>
          <div className="comparison-grid">
            {pair.map((r, i) => {
              const m = metrics(r);
              return (
                <section className="comparison-result panel" key={r.strategy}>
                  <div className="comparison-heading">
                    <h2>{t(r.strategy, lang)}</h2>
                    <span className="micro">{label(r.status, lang)}</span>
                  </div>
                  <div className="metric-main">
                    <strong>
                      {m.verified ? '✓' : r.status === 'awaiting-approval' ? '…' : '—'}
                    </strong>
                    <span>
                      {t('result', lang)}
                      <b>{label(r.status, lang)}</b>
                    </span>
                  </div>
                  <dl>
                    {(
                      [
                        'actions',
                        'observations',
                        'targetFailures',
                        'retries',
                        'recoveries',
                        'duplicates',
                        'scopeBlocked',
                      ] as const
                    ).map((k) => (
                      <div className="dl-row" key={k}>
                        <dt>
                          {t(k === 'retries' ? 'retry' : k === 'recoveries' ? 'recovery' : k, lang)}
                        </dt>
                        <dd>{typeof m[k] === 'boolean' ? t(m[k] ? 'yes' : 'no', lang) : m[k]}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="internal-caption">{t('internal', lang)}</p>
                  {r.status === 'awaiting-approval' && (
                    <div className="approval-box">
                      <p>{t('pairNote', lang)}</p>
                      <div className="button-row">
                        {[true, false].map((yes) => (
                          <button
                            key={String(yes)}
                            className={yes ? 'primary' : ''}
                            onClick={() =>
                              setPair(
                                pair.map((p, j) =>
                                  i === j ? runToEnd(decideApproval(p, yes)) : p,
                                ),
                              )
                            }
                          >
                            {t(yes ? 'approve' : 'reject', lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <details open>
                    <summary>{t('timeline', lang)}</summary>
                    <ol className="comparison-trace">
                      {r.events
                        .filter((e) =>
                          [
                            'stale',
                            'ambiguous',
                            'unavailable',
                            'scope-blocked',
                            'receipt-missing',
                            'verified',
                            'completed',
                            'budget-exhausted',
                            'rejected',
                            'approved',
                          ].includes(e.code),
                        )
                        .map((e) => (
                          <li key={e.seq}>
                            <span className="micro">{e.seq.toString().padStart(2, '0')}</span>{' '}
                            {explain(e.code, lang)}
                          </li>
                        ))}
                    </ol>
                  </details>
                  <button onClick={() => downloadRun(r)}>
                    <Download size={15} />
                    {t('export', lang)}
                  </button>
                </section>
              );
            })}
          </div>
          <p>{t('syntheticSteps', lang)}</p>
        </>
      )}
    </main>
  );
}
