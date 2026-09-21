import type { Scenario, Text } from '../engine/types';
const tx = (tr: string, en: string): Text => ({ tr, en });
export const scenarios: Scenario[] = [
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
].map(
  ([id, title, subtitle, lesson]) =>
    ({
      id,
      title,
      subtitle,
      lesson,
      goal: {
        title: 'orbit',
        group: 'astronomy',
        value: 'reviewed',
        operation: id === 'approval' ? 'archive' : 'edit',
      },
      recovery: { maxRetries: 3, maxSteps: 64 },
    }) as Scenario,
);
