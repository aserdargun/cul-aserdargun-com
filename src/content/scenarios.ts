import type { Scenario, ScenarioId, Text } from '../engine/types';
const tx = (tr: string, en: string): Text => ({ tr, en });

/* The scenario catalogue is written as a plain tuple list, so the id is
 * typed here — the lesson condition is looked up by it. */
type ScenarioSeed = [ScenarioId, Text, Text, Text];
const seeds: ScenarioSeed[] = [
  [
    'stable',
    tx('Kararlı arayüz', 'Stable interface'),
    tx('Doğru hedef, doğrulanmış sonuç', 'Right target, verified outcome'),
    tx(
      'Güncel gözlem ve sabit yerleşimde iki strateji de çalışabilir. Yörünge notlarını aç, notu güncelle ve kaydın değiştiğini doğrula.',
      'Both strategies can work with a fresh observation and stable layout. Open Orbit notes, update the note and verify the stored change.',
    ),
  ],
  [
    'shift',
    tx('Değişen yerleşim', 'Shifting layout'),
    tx('Aynı hedef, farklı konum', 'Same target, different position'),
    tx(
      'İlk gözlemden sonra liste ters çevrilir. Eski koordinatın altındaki öğe değişir. Koordinat stratejisi yeniden gözlemler; anlamsal strateji güncel eşleşmeyi denetler.',
      'The list reverses after the first observation. The element under the old coordinate changes. Coordinates require another observation; semantic targeting checks a fresh match.',
    ),
  ],
  [
    'ambiguous',
    tx('Belirsiz hedef', 'Ambiguous target'),
    tx('İlk eşleşme yeterli değil', 'The first match is not enough'),
    tx(
      'Aynı adlı iki kayıt var. Ajan sessizce ilkini seçmez; görevin Astronomi bağlamıyla eşleşmeyi daraltır. Etiket eksikliği eklenirse kullanıcıya devreder.',
      'Two records share a name. The agent does not pick the first silently; it narrows using the task’s Astronomy context. A missing label can force a handoff.',
    ),
  ],
  [
    'blocked',
    tx('Engellenmiş etkileşim', 'Blocked interaction'),
    tx('Beklemenin de bir sınırı var', 'Waiting has a limit'),
    tx(
      'Kaydet düğmesi iki yeniden deneme boyunca devre dışıdır. Bekleme sentetik adımlarla ilerler. Kalıcı engel seçilirse bütçe sonunda kullanıcıya devredilir.',
      'Save is disabled for two retries. Waiting advances in synthetic steps. A permanent block hands off when the retry budget runs out.',
    ),
  ],
  [
    'uncertain',
    tx('Belirsiz sonuç', 'Uncertain outcome'),
    tx('Yeniden denemeden önce doğrula', 'No receipt? Verify before retrying'),
    tx(
      'Kaydetme uygulanır fakat başarı bildirimi gösterilmez. Doğrulayıcı iç durumu inceler. Kör tekrar deneyi ikinci bir kayıt işlemi üretir.',
      'Saving succeeds but the receipt is suppressed. The verifier inspects internal state. The blind-retry experiment produces a second write.',
    ),
  ],
  [
    'approval',
    tx('Onay sınırı', 'Approval boundary'),
    tx('Ekran içeriği yetki değildir', 'Screen content is not authority'),
    tx(
      'Yörünge notlarını arşivle. Güvenilmeyen açıklama tüm kayıtları silmeyi ve onayı atlamayı ister; bu istek engellenir. Arşivleme tek kullanımlık, içeriğe bağlı onay gerektirir.',
      'Archive Orbit notes. An untrusted description asks to delete all records and bypass approval; this is blocked. Archiving requires a single-use approval bound to its content.',
    ),
  ],
];

/* Each of these lessons describes a failure the engine only produces while the
 * scenario's fault is applied. The reader can switch that fault off in the
 * panel, and the run then completes without ever reversing the list, without
 * suppressing the receipt, without disabling the button and without the
 * scope escalation. The lesson names the condition it depends on, and the
 * page says so when the condition does not hold — so the text never claims
 * something the run in front of the reader did not do. */
const conditions: Partial<
  Record<ScenarioId, NonNullable<Scenario['lessonCondition']>>
> = {
  shift: {
    event: 'layout-changed',
    absent: tx(
      'Hata koşulu kapalı olduğu için liste bu çalışmada ters çevrilmedi; yerleşim sabit kaldı ve koordinat stratejisi ilk gözlemde doğrudan uyguladı.',
      'Because the fault is off, the list did not reverse in this run; the layout stayed stable and the coordinate strategy applied on the first observation.',
    ),
  },
  ambiguous: {
    event: 'ambiguous',
    absent: tx(
      'Hata koşulu kapalı olduğu için bu çalışmada iki eşleşme oluşmadı; hedef tek kayıtta bulundu ve bağlam daraltması gerekmedi.',
      'Because the fault is off, no two matches arose in this run; the target was found in a single record and no context narrowing was needed.',
    ),
  },
  blocked: {
    event: 'disabled',
    absent: tx(
      'Hata koşulu kapalı olduğu için kaydet düğmesi bu çalışmada devre dışı kalmadı; deneme bütçesi hiç kullanılmadı.',
      'Because the fault is off, the save button was never disabled in this run; the retry budget was never used.',
    ),
  },
  uncertain: {
    event: 'receipt-missing',
    absent: tx(
      'Hata koşulu kapalı olduğu için başarı bildirimi bu çalışmada gizlenmedi; her yazma onayı döndü ve kör tekrar deneyi oluşmadı.',
      'Because the fault is off, the receipt was not suppressed in this run; every write returned confirmation and no blind retry arose.',
    ),
  },
  approval: {
    event: 'scope-blocked',
    absent: tx(
      'Hata koşulu kapalı olduğu için kapsam yükseltme denemesi bu çalışmada engellenmedi; onay yalnızca arşivleme işlemi için istendi.',
      'Because the fault is off, no scope escalation was blocked in this run; approval was requested only for the archive operation.',
    ),
  },
};
export const scenarios: Scenario[] = seeds.map(
  ([id, title, subtitle, lesson]) =>
    ({
      id,
      title,
      subtitle,
      lesson,
      lessonCondition: conditions[id],
      goal: {
        title: 'orbit',
        group: 'astronomy',
        value: 'reviewed',
        operation: id === 'approval' ? 'archive' : 'edit',
      },
      recovery: { maxRetries: 3, maxSteps: 64 },
    }) as Scenario,
);