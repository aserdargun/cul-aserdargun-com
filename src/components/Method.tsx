import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import type { Lang, ScenarioId } from '../engine/types';
import { t } from '../content/i18n';
import { sources } from '../content/sources';
const lessons: [ScenarioId, string, string, string, string][] = [
  [
    'shift',
    'Gözlem neden eskir?',
    'Why do observations become stale?',
    'Kaydırma, sıralama veya bir katman, gözlem ile eylem arasında ortamı değiştirir. Her gözlem ortam sürümünü taşır.',
    'Scrolling, sorting or an overlay changes the environment between observation and action. Each observation carries its environment version.',
  ],
  [
    'stable',
    'Koordinat ve anlam',
    'Coordinates and semantics',
    'Koordinat politikası sentetik görünen metin, bağlam ve sınırları alır; rol veya kayıt kimliği almaz. Anlamsal politika rol, sabit ad ve bağlamı alır; koordinat almaz. İkisi de gizli cevap anahtarını görmez.',
    'The coordinate policy receives synthetic display text, context and bounds, but no roles or record IDs. The semantic policy receives roles, stable names and context, but no coordinates. Neither sees a hidden answer key.',
  ],
  [
    'stable',
    'Tıklama ≠ görev başarısı',
    'A click ≠ task success',
    'Bir tıklama uygulanabilir, fakat kayıt değişmemiş olabilir. CUL uygulanan eylemi, doğru hedefi, gönderimi ve iç durumdan doğrulanan görevi ayrı gösterir.',
    'A click can be applied without changing a record. CUL separates action application, correct targeting, submission and task verification from internal state.',
  ],
  [
    'blocked',
    'Bekle, yeniden gözlemle, dur',
    'Wait, observe again, stop',
    'En fazla 3 yeniden deneme ve 64 adım. Bütçe aşılınca kullanıcıya devir. Duraklatma yeni eylemleri durdurur; sıfırlama önceki koşunun zamanlayıcısını iptal eder.',
    'At most 3 retries and 64 steps. Exhaustion hands off to the user. Pause stops new actions; reset cancels the previous run’s timer.',
  ],
  [
    'uncertain',
    'Bildirim yok, sonuç var',
    'No receipt, but a result',
    'Bildirim eksikliği başarısızlık kanıtı değildir. Ortam durumunu doğrulamadan yeniden kaydetmek ikinci bir yazma oluşturabilir. Bu iç durum kanıtıdır; OCR değildir.',
    'A missing receipt is not proof of failure. Saving again before verifying state can create a second write. This is internal-state evidence, not OCR.',
  ],
  [
    'approval',
    'Güvenilmeyen ekran içeriği',
    'Untrusted screen content',
    'Kayıt metni görevi veya yetkiyi genişletemez. Motor yalnızca görevdeki hedef ve işlem türünü kabul eder. Kapsam dışı metnin reddi olay izine yazılır.',
    'Record text cannot broaden the task or authority. The engine accepts only the task’s target and operation. Rejection of out-of-scope content is recorded in the trace.',
  ],
  [
    'approval',
    'Onay neye bağlı?',
    'What does approval bind to?',
    'Onay koşu, eylem, hedef ve taslak içeriğine bağlıdır, bir kez kullanılır. Hedef veya içerik değişirse yeniden onay gerekir. Bu yerel eğitim örneği üretim güvenliği sağlamaz.',
    'Approval binds to a run, action, target and draft, and is consumed once. Target or content changes require fresh approval. This local educational example does not provide production security.',
  ],
];
export function Method({ lang, onOpen }: { lang: Lang; onOpen: (id: ScenarioId) => void }) {
  return (
    <main className="method-page">
      <div className="page-intro">
        <BookOpen size={28} />
        <h1>{t('method', lang)}</h1>
        <p>{t('methodIntro', lang)}</p>
      </div>
      <p className="method-boundary">{t('methodBoundary', lang)}</p>
      <section className="cycle panel">
        <h2>{t('loop', lang)}</h2>
        <div className="cycle-nodes">
          {(['task', 'observation', 'target', 'action', 'verification'] as const).map((k, i) => (
            <div key={k}>
              <span>{t(k, lang)}</span>
              {i < 4 && <ArrowRight aria-hidden size={20} />}
            </div>
          ))}
        </div>
        <p>{t('recoverText', lang)}</p>
        <small>{t('loopText', lang)}</small>
      </section>
      <div className="lessons">
        {lessons.map(([id, tr, en, bodyTr, bodyEn], i) => (
          <article key={i}>
            <span className="lesson-index">0{i + 1}</span>
            <div>
              <h2>{lang === 'tr' ? tr : en}</h2>
              <p>{lang === 'tr' ? bodyTr : bodyEn}</p>
              <button className="subtle" onClick={() => onOpen(id)}>
                {t('openLesson', lang)}
                <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <section className="sources">
        <h2>{t('sources', lang)}</h2>
        {sources.map((s) => (
          <article key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
              <ExternalLink size={16} />
            </a>
            <p>{s.note[lang]}</p>
            <small>
              {s.publisher} · {t('undated', lang)} · {t('accessed', lang)}: {s.accessed}
            </small>
          </article>
        ))}
      </section>
      <section className="ecosystem">
        <h2>{t('ecosystem', lang)}</h2>
        <p>{t('ecosystemText', lang)}</p>
        <p>{t('domain', lang)}</p>
      </section>
    </main>
  );
}
