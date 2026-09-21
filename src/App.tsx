import { useEffect, useRef, useState } from 'react';
import { MousePointer2, Play, ArrowUpRight } from 'lucide-react';
import type { Faults, Lang, ScenarioId, Strategy } from './engine/types';
import { createRun, advance, decideApproval, intervene, terminal } from './engine/engine';
import { scenarios } from './content/scenarios';
import { t } from './content/i18n';
import { portfolioUrl } from './content/ecosystem';
import { Environment } from './components/Environment';
import { Sidebar } from './components/Sidebar';
import { Inspector } from './components/Inspector';
import { Player } from './components/Player';
import { Comparison } from './components/Comparison';
import { Method } from './components/Method';
export default function App() {
  const [lang, setLang] = useState<Lang>('tr');
  const [page, setPage] = useState<'lab' | 'compare' | 'method'>('lab');
  const counter = useRef(1);
  const [run, setRun] = useState(() => createRun(scenarios[0], 'coordinate'));
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<number | null>(null);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `CUL — ${lang === 'tr' ? 'Bilgisayar Kullanımı Laboratuvarı' : 'Computer Use Laboratory'}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        lang === 'tr'
          ? 'CUL — aserdargun.com öğrenme sisteminde HNS ailesinin bilgisayar kullanımı laboratuvarı. Altı sentetik senaryoda hedefleme, onay ve sonuç doğrulama; gerçek model veya masaüstü erişimi yoktur.'
          : 'CUL — the HNS family’s computer use laboratory in the aserdargun.com learning system. Targeting, approval and outcome verification in six synthetic scenarios; no live model or desktop access.',
      );
  }, [lang]);
  useEffect(() => {
    if (!playing || terminal(run.status) || run.status === 'awaiting-approval') {
      if (playing) setPlaying(false);
      return;
    }
    const id = run.id;
    const timer = setTimeout(() => setRun((r) => advance(r, id)), 380);
    return () => clearTimeout(timer);
  }, [playing, run]);
  function reset(
    id: ScenarioId = run.scenario.id,
    strategy: Strategy = run.strategy,
    faults: Faults = run.faults,
  ) {
    setPlaying(false);
    setHistory(null);
    counter.current++;
    setRun(
      createRun(
        scenarios.find((s) => s.id === id)!,
        strategy,
        `run-${String(counter.current).padStart(3, '0')}`,
        faults,
      ),
    );
  }
  function open(id: ScenarioId) {
    reset(id);
    setPage('lab');
    window.scrollTo({ top: 0 });
  }
  function approve(yes: boolean) {
    setRun((r) => decideApproval(r, yes));
    if (yes) setPlaying(true);
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {lang === 'tr' ? 'İçeriğe geç' : 'Skip to content'}
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage('lab');
          }}
        >
          <MousePointer2 size={27} />
          <strong>CUL</strong>
          <span>Computer Use Laboratory</span>
        </a>
        <nav aria-label={lang === 'tr' ? 'Ana menü' : 'Main navigation'}>
          {(['lab', 'compare', 'method'] as const).map((p) => (
            <button
              key={p}
              aria-current={page === p ? 'page' : undefined}
              onClick={() => {
                setPage(p);
                setPlaying(false);
              }}
            >
              {t(p, lang)}
            </button>
          ))}
        </nav>
        <div className="languages">
          {(['tr', 'en'] as const).map((l) => (
            <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <div id="main" tabIndex={-1}>
        {page === 'lab' ? (
          <main className="lab-page">
            <section className="intro">
              <div>
                <h1>
                  {t('tagline', lang)} <span>{t('verifyTitle', lang)}</span>
                </h1>
                <p>{t('intro', lang)}</p>
              </div>
              <div className="intro-action">
                <small>{t('boundary', lang)}</small>
                <button
                  className="primary start-button"
                  onClick={() => {
                    reset('stable', 'coordinate', {
                      enabled: true,
                      permanentBlock: false,
                      missingLabel: false,
                    });
                    setPlaying(true);
                  }}
                >
                  <Play size={18} fill="currentColor" />
                  {t('start', lang)}
                </button>
              </div>
            </section>
            <div className="workbench">
              <Sidebar run={run} lang={lang} onChange={reset} />
              <div className="workspace-column">
                <Environment
                  run={run}
                  lang={lang}
                  onMutate={(m) => setRun((r) => intervene(r, m))}
                  onConfirm={() =>
                    setRun((r) => {
                      let n = r;
                      if (n.status === 'action-ready') n = advance(n);
                      if (n.status === 'acting') n = advance(n);
                      return n;
                    })
                  }
                />
                <div className="lesson-inline">
                  <span className="micro">
                    0{scenarios.findIndex((x) => x.id === run.scenario.id) + 1} / CUL
                  </span>
                  <p>{run.scenario.lesson[lang]}</p>
                  <button
                    className="subtle"
                    onClick={() => {
                      setPage('method');
                      setPlaying(false);
                    }}
                  >
                    {t('method', lang)}
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
              <Inspector run={run} lang={lang} onApproval={approve} history={history} />
            </div>
            <Player
              run={run}
              lang={lang}
              playing={playing}
              onPlay={() => {
                setHistory(null);
                setPlaying((p) => !p);
              }}
              onStep={() => setRun((r) => advance(r))}
              onReset={() => reset()}
              history={history}
              onHistory={(n) => {
                setPlaying(false);
                setHistory(n);
              }}
            />
          </main>
        ) : page === 'compare' ? (
          <Comparison lang={lang} scenarioId={run.scenario.id} faults={run.faults} />
        ) : (
          <Method lang={lang} onOpen={open} />
        )}
      </div>
      <footer className="site-footer">
        <span>
          <b>CUL</b> <span>Computer Use Laboratory</span>
        </span>
        <p>{t('boundary', lang)}</p>
        <small>
          <a href={portfolioUrl(lang)} target="_blank" rel="noreferrer">
            aserdargun.com · {t('portfolio', lang)} <ArrowUpRight size={14} aria-hidden />
          </a>
        </small>
      </footer>
    </>
  );
}
