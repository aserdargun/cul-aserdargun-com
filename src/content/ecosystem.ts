import type { Text } from '../engine/types';

export const ecosystem: { code: string; url: string; title: Text; purpose: Text }[] = [
  {
    code: 'HNS',
    url: 'https://hns.aserdargun.com/',
    title: { tr: 'Harness Engineering Observatory', en: 'Harness Engineering Observatory' },
    purpose: {
      tr: 'CUL’ün bağlı olduğu araştırma ailesi: ajanı çevreleyen yürütme, doğrulama ve gözlemlenebilirlik katmanlarını incele.',
      en: 'CUL’s research family: explore the execution, verification and observability layers around an agent.',
    },
  },
  {
    code: 'ARL',
    url: 'https://arl.aserdargun.com/',
    title: { tr: 'Ajan Çalışma Zamanı Laboratuvarı', en: 'Agent Runtime Laboratory' },
    purpose: {
      tr: 'Arayüz eylemini daha geniş ajan döngüsüne yerleştir; araç kullanımı, bağlam ve yürütme izini simülasyonda incele.',
      en: 'Place interface actions within the wider agent loop; inspect simulated tool use, context and execution traces.',
    },
  },
  {
    code: 'DPL',
    url: 'https://dpl.aserdargun.com/',
    title: { tr: 'Karar Düzlemi Laboratuvarı', en: 'Decision Plane Laboratory' },
    purpose: {
      tr: 'Eylemden önceki kararı incele: hızlı yanıt ile daha kapsamlı değerlendirme arasındaki yönlendirmeyi keşfet.',
      en: 'Explore the decision before an action: routing between a fast response and more extensive evaluation.',
    },
  },
  {
    code: 'SEC',
    url: 'https://sec.aserdargun.com/',
    title: { tr: 'AI Sistemleri Güvenlik Gözlemevi', en: 'AI Systems Security Observatory' },
    purpose: {
      tr: 'Onay senaryosunu kimlik, yetkilendirme, sınırlı eylem ve güvenilmeyen içerik bağlamında değerlendir.',
      en: 'Connect the approval scenario to identity, authorization, constrained actions and untrusted content.',
    },
  },
  {
    code: 'EVL',
    url: 'https://evl.aserdargun.com/',
    title: {
      tr: 'AI Değerlendirme ve Güvenilirlik Laboratuvarı',
      en: 'AI Evaluation & Reliability Lab',
    },
    purpose: {
      tr: 'Tıklama, izlenen yol ve görev sonucunu ayrı değerlendir; kanıt ve kabul ölçütleriyle düşün.',
      en: 'Evaluate clicks, trajectories and task outcomes separately using evidence and acceptance criteria.',
    },
  },
];

export const portfolioUrl = (lang: 'tr' | 'en') =>
  lang === 'tr' ? 'https://aserdargun.com/tr/' : 'https://aserdargun.com/';
