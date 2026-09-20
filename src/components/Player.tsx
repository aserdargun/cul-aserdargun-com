import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  ArrowRight,
  Check,
  Eye,
  MousePointer2,
} from 'lucide-react';
import type { ExperimentRun, Lang } from '../engine/types';
import { terminal } from '../engine/engine';
import { t, label, explain } from '../content/i18n';
export function downloadRun(run: ExperimentRun) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          ...run,
          exportNote:
            'Synthetic deterministic experiment. Verification uses internal state. No real model or OCR.',
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cul-${run.scenario.id}-${run.strategy}-${run.id}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Player({
  run,
  lang,
  playing,
  onPlay,
  onStep,
  onReset,
  history,
  onHistory,
}: {
  run: ExperimentRun;
  lang: Lang;
  playing: boolean;
  onPlay: () => void;
  onStep: () => void;
  onReset: () => void;
  history: number | null;
  onHistory: (n: number | null) => void;
}) {
  return (
    <section className="player panel">
      <div className="playback">
        <div>
          <h2>
            <Play size={17} />
            {t('player', lang)}
          </h2>
          <span
            className={`run-status ${run.status === 'completed' ? 'good' : ''}`}
            role="status"
            data-testid="run-status"
          >
            {label(run.status, lang)}
            {!playing &&
            !terminal(run.status) &&
            run.steps > 0 &&
            run.status !== 'awaiting-approval'
              ? ` · ${t('paused', lang)}`
              : ''}
          </span>
        </div>
        <div className="button-row">
          <button
            className="primary"
            onClick={onPlay}
            disabled={
              terminal(run.status) || run.status === 'awaiting-approval' || history !== null
            }
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
            {t(playing ? 'pause' : 'play', lang)}
          </button>
          <button
            onClick={onStep}
            disabled={
              playing ||
              terminal(run.status) ||
              run.status === 'awaiting-approval' ||
              history !== null
            }
          >
            <SkipForward size={16} />
            {t('step', lang)}
          </button>
          <button onClick={onReset}>
            <RotateCcw size={16} />
            {t('reset', lang)}
          </button>
          <button onClick={() => downloadRun(run)}>
            <Download size={16} />
            {t('export', lang)}
          </button>
        </div>
      </div>
      <div className="loop-compact" aria-label={t('loopText', lang)}>
        {[
          [Eye, 'observation'],
          [MousePointer2, 'target'],
          [ArrowRight, 'action'],
          [Check, 'verification'],
        ].map(([Icon, key], i) => {
          const C = Icon as typeof Eye;
          return (
            <div
              key={String(key)}
              className={
                run.status === 'completed' ||
                (i === 0 && run.status === 'observing') ||
                (i === 1 && run.status === 'targeting') ||
                (i === 2 && run.status === 'acting') ||
                (i === 3 && run.status === 'verifying')
                  ? 'active'
                  : ''
              }
            >
              <span>
                <C size={16} />
              </span>
              <small>{t(key as 'observation', lang)}</small>
            </div>
          );
        })}
        <p>{t('recoverText', lang)}</p>
      </div>
      <div className="trace-heading">
        <h3>{t('timeline', lang)}</h3>
        <span className="micro">
          {t('steps', lang)} {run.steps}/{run.scenario.recovery.maxSteps} · {t('retry', lang)}{' '}
          {run.retries}/{run.scenario.recovery.maxRetries}
          {history !== null && <button onClick={() => onHistory(null)}>{t('live', lang)}</button>}
        </span>
      </div>
      <div className="timeline">
        {run.events.length ? (
          run.events.map((e, i) => (
            <button
              key={e.seq}
              aria-label={`${t('replay', lang)} ${e.seq}: ${explain(e.code, lang)}`}
              className={history === i ? 'selected' : ''}
              onClick={() => onHistory(i)}
            >
              <span className="micro">
                {String(e.seq).padStart(2, '0')} / v{e.version}
              </span>
              <strong>{explain(e.code, lang)}</strong>
              {e.observationId && <small>{e.observationId.split(':').pop()}</small>}
            </button>
          ))
        ) : (
          <p>{t('emptyTrace', lang)}</p>
        )}
      </div>
    </section>
  );
}
