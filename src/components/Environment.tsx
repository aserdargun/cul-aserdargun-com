import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownUp,
  ArrowLeft,
  ChevronRight,
  FileText,
  Layers,
  Monitor,
  Search,
  X,
  Crosshair,
} from 'lucide-react';
import type { ExperimentRun, Lang } from '../engine/types';
import { visibleRecords, type Mutation } from '../environment/model';
import { approvalMatches } from '../engine/engine';
import { t, label } from '../content/i18n';
export function Environment({
  run,
  lang,
  onMutate,
  onConfirm,
}: {
  run: ExperimentRun;
  lang: Lang;
  onMutate: (m: Mutation) => void;
  onConfirm: () => void;
}) {
  const e = run.environment;
  const selected = e.records.find((x) => x.id === e.selected);
  const list = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (list.current && Math.abs(list.current.scrollTop - e.scroll) > 1)
      list.current.scrollTop = e.scroll;
  }, [e.scroll, e.selected]);
  useEffect(() => {
    if (frame.current) frame.current.scrollLeft = 0;
    setZoom(1);
  }, [run.id]);
  const target = run.proposal?.target.bounds;
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    if (!e.search) {
      setSearchText('');
    }
  }, [e.search]);
  function search(value: string) {
    setSearchText(value);
    onMutate({ type: 'search', value });
  }
  return (
    <section className="environment panel" aria-label={t('environment', lang)}>
      <div className="panel-heading">
        <h2>
          <Monitor size={19} />
          {t('environment', lang)}
        </h2>
        <span className="micro">{t('isolated', lang)}</span>
      </div>
      <div className="env-toolbar">
        <span>
          <span className="dot lime" /> ATLAS <span className="muted">/ {t('records', lang)}</span>
        </span>
        <button className="subtle" onClick={() => onMutate({ type: 'overlay' })}>
          <Layers size={15} />
          {t('overlay', lang)}
        </button>
      </div>
      <div
        className="environment-scroll"
        ref={frame}
        tabIndex={0}
        aria-label={t('logicalHint', lang)}
      >
        <div style={{ width: 640 * zoom, height: 480 * zoom }}>
          <div className="stage" style={{ transform: `scale(${zoom})` }} data-testid="stage">
            <div className="atlas-heading">
              <div>
                <h3>{selected ? label(selected.title, lang) : t('records', lang)}</h3>
                <p>
                  {selected
                    ? `${selected.id} · ${label(selected.group, lang)}`
                    : t('synthetic', lang)}
                </p>
              </div>
              {selected && (
                <button onClick={() => onMutate({ type: 'back' })}>
                  <ArrowLeft size={15} />
                  {t('back', lang)}
                </button>
              )}
            </div>
            {!selected ? (
              <>
                <div className="record-tools">
                  <label className="searchbox">
                    <Search size={16} />
                    <span className="sr-only">{t('search', lang)}</span>
                    <input
                      value={searchText}
                      onChange={(x) => search(x.target.value)}
                      placeholder={t('search', lang)}
                    />
                  </label>
                  <button onClick={() => onMutate({ type: 'sort' })} aria-label={t('sort', lang)}>
                    <ArrowDownUp size={16} />
                  </button>
                  <label>
                    <span className="sr-only">{t('filter', lang)}</span>
                    <select
                      value={e.filter}
                      onChange={(x) =>
                        onMutate({ type: 'filter', value: x.target.value as typeof e.filter })
                      }
                    >
                      <option value="all">{t('all', lang)}</option>
                      <option value="active">{t('active', lang)}</option>
                      <option value="archived">{t('archived', lang)}</option>
                    </select>
                  </label>
                </div>
                <div className="table-labels">
                  <span>{t('records', lang)}</span>
                  <span>{t('group', lang)}</span>
                  <span>{t('state', lang)}</span>
                </div>
                <div
                  className="record-list"
                  ref={list}
                  onScroll={(x) => {
                    const scroll = Math.round(x.currentTarget.scrollTop);
                    if (scroll !== e.scroll) onMutate({ type: 'scroll', value: scroll });
                  }}
                  tabIndex={0}
                  aria-label={t('records', lang)}
                >
                  <div style={{ height: visibleRecords(e).length * 52, position: 'relative' }}>
                    {visibleRecords(e).map((r, i) => (
                      <button
                        key={r.id}
                        className={`record-row ${run.proposal?.target.name === r.title ? 'target-row' : ''}`}
                        style={{ top: i * 52 }}
                        onClick={() => onMutate({ type: 'open', value: r.id })}
                        aria-label={`${t('open', lang)}: ${label(r.title, lang)} · ${label(r.group, lang)}`}
                      >
                        <span className="record-name">
                          <FileText size={22} />
                          <span>
                            {label(r.title, lang)}
                            <small>{r.id}</small>
                          </span>
                        </span>
                        <span>{label(r.group, lang)}</span>
                        <span className="record-status">
                          <i className={`dot ${r.archived ? 'cyan' : ''}`} />
                          {label(r.archived ? 'archived' : r.value, lang)}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  {!visibleRecords(e).length && <p>{t('noRecords', lang)}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="detail-meta">
                  <span>{label(selected.archived ? 'archived' : 'active', lang)}</span>
                  <span>
                    {t('writes', lang)}: <strong data-testid="writes">{selected.commits}</strong>
                  </span>
                </div>
                <label
                  className="note-label"
                  htmlFor={e.missingLabel ? undefined : 'record-note'}
                  aria-hidden={e.missingLabel || undefined}
                >
                  {e.missingLabel ? '—' : t('note', lang)}
                </label>
                <textarea
                  id="record-note"
                  className="record-note"
                  aria-label={e.missingLabel ? undefined : t('note', lang)}
                  value={label(e.draft, lang)}
                  onChange={(x) =>
                    onMutate({
                      type: 'draft',
                      value:
                        x.target.value === label('reviewed', lang) ? 'reviewed' : x.target.value,
                    })
                  }
                />
                <button
                  className="save-button primary"
                  disabled={e.disabled || e.overlay || e.dialog}
                  onClick={() => onMutate({ type: 'manual-save' })}
                >
                  {t('save', lang)}
                  {e.disabled ? ' …' : ''}
                </button>
                <button
                  className="archive-button"
                  disabled={e.overlay || e.dialog || run.scenario.goal.operation !== 'archive'}
                  onClick={() => onMutate({ type: 'request-archive' })}
                >
                  {t('archive', lang)}
                </button>
                {e.notice ? (
                  <div className="untrusted">
                    <p>{t('notice', lang)}</p>
                    <small>{t('noticeCaption', lang)}</small>
                  </div>
                ) : (
                  <p className="receipt" role="status">
                    {e.receipt
                      ? t('saved', lang)
                      : run.lastResult?.code === 'receipt-missing'
                        ? t('noReceipt', lang)
                        : ''}
                  </p>
                )}
              </>
            )}
            {e.dialog && (
              <div className="dialog-shade">
                <div
                  className="archive-dialog"
                  role="dialog"
                  aria-label={t('approvalTitle', lang)}
                  aria-modal="false"
                >
                  <h3>{t('approvalTitle', lang)}</h3>
                  <p>{t('approvalBody', lang)}</p>
                  <strong>
                    {selected?.id} · {label(selected?.title ?? '', lang)}
                  </strong>
                  <label>
                    {t('approvalContent', lang)}
                    <input
                      value={label(e.draft, lang)}
                      onChange={(x) => onMutate({ type: 'draft', value: x.target.value })}
                    />
                  </label>
                  <button
                    className="dialog-cancel"
                    onClick={() => onMutate({ type: 'close-dialog' })}
                  >
                    {t('close', lang)}
                  </button>
                  <button
                    className="dialog-confirm primary"
                    disabled={!run.proposal || !approvalMatches(run, run.proposal)}
                    onClick={onConfirm}
                  >
                    {t('confirm', lang)}
                  </button>
                </div>
              </div>
            )}
            {target && run.proposal?.version === e.version && !e.overlay && (
              <div
                className="target-outline"
                style={{ left: target.x, top: target.y, width: target.w, height: target.h }}
              >
                <Crosshair size={16} />
                <span>
                  {Math.round(target.x + target.w / 2)}, {Math.round(target.y + target.h / 2)}
                </span>
              </div>
            )}
            {e.overlay && (
              <div className="blocking-overlay">
                <Layers size={30} />
                <h3>{t('overlayTitle', lang)}</h3>
                <p>{t('scope', lang)}</p>
                <button onClick={() => onMutate({ type: 'overlay' })}>
                  <X size={15} />
                  {t('close', lang)}
                </button>
              </div>
            )}
            <div className="stage-footer">
              <span>ATLAS / {t('synthetic', lang)}</span>
              <span>640 × 480</span>
            </div>
          </div>
        </div>
      </div>
      <div className="env-footer">
        <span className="micro">
          v{e.version} · {t('scroll', lang)} {e.scroll}px
        </span>
        <label className="micro">
          {t('coordinates', lang)}{' '}
          <select
            aria-label={t('coordinates', lang)}
            value={zoom}
            onChange={(x) => setZoom(Number(x.target.value))}
          >
            <option value={1}>100%</option>
            <option value={0.85}>85%</option>
            <option value={1.15}>115%</option>
          </select>
        </label>
      </div>
      <p className="environment-hint">{t('logicalHint', lang)}</p>
      {run.scenario.id === 'uncertain' && run.status === 'completed' && (
        <div className="blind-box">
          <button onClick={() => onMutate({ type: 'blind-repeat' })}>{t('blind', lang)}</button>
          <small>{t('blindHelp', lang)}</small>
        </div>
      )}
    </section>
  );
}
