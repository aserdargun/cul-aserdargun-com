export const sources = [
  {
    title: 'Computer use tool',
    publisher: 'Anthropic',
    url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool',
    accessed: '2026-09-21',
    published: null,
    note: {
      tr: 'Ekran gözlemi ve eylem araçlarının döngüsü; güvenilmeyen içerik riskleri. CUL bu aracı veya bir Claude modelini çalıştırmaz.',
      en: 'Screen observation and action-tool loops; untrusted content risks. CUL does not run this tool or a Claude model.',
    },
  },
  {
    title: 'Locators',
    publisher: 'Microsoft / Playwright',
    url: 'https://playwright.dev/docs/locators',
    accessed: '2026-09-21',
    published: null,
    note: {
      tr: 'Rol, ad, etiket ve bağlamla öğe bulma; tekil eşleşme. CUL politikası bundan esinlenen ayrı bir sentetik modeldir.',
      en: 'Finding elements by role, name, label and context; unique matching. CUL uses a separate synthetic policy inspired by these ideas.',
    },
  },
  {
    title: 'Auto-waiting',
    publisher: 'Microsoft / Playwright',
    url: 'https://playwright.dev/docs/actionability',
    accessed: '2026-09-21',
    published: null,
    note: {
      tr: 'Görünürlük, kararlılık, etkinlik ve olay alabilirlik denetimleri. CUL sentetik adım bütçesi kullanır; gerçek süre ölçmez.',
      en: 'Visibility, stability, enabled state and event-receiving checks. CUL uses a synthetic step budget; it does not measure real latency.',
    },
  },
];
