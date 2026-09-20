# CUL — Computer Use Laboratory

**Gözlemle. Eyleme geç. Doğrula. / Observe. Act. Verify.**

Bilgisayar Kullanımı Laboratuvarı: React + TypeScript ile TR/EN, tarayıcı içinde çalışan kontrollü ve deterministik deney ortamı. Tüm Atlas kayıtları sentetiktir. API anahtarı, kullanıcı hesabı, backend, gerçek model veya OCR gerekmez. Gerçek masaüstü, dosya, hesap, e-posta ya da başka sekmelere erişmez.

Planlanan özel alan adı `cul.aserdargun.com`; bu alan adı henüz bağlı değildir. Azure yayını, Free Static Web Apps ve Azure tarafından üretilen adres üzerinden yapılır; ayrıntılar [dağıtım belgesinde](docs/DEPLOYMENT.md). HNS, ARL, DPL, SEC ve EVL ile ilişkiler yalnızca kavramsaldır.

## Çalıştırma

Node.js 22.12+ ve npm:

```sh
npm ci
npm start
```

Yerel önizleme: http://127.0.0.1:8036

- `npm start`: yalnız bu depoya ait, arka planda yönetilen Vite süreci. `.local/server.log` ve `.local/server.json` oluşturur. Port doluysa başka süreci kapatmaz.
- `npm stop`: kaydedilmiş PID'nin **cwd ve Vite komutunu** doğrulayarak yalnız bu depoyu durdurur.
- `npm run dev`: ön planda geliştirme; `Ctrl+C` ile durur.
- `npm run build`: TypeScript kontrolü ve `dist/` statik dağıtımı.
- `npm run preview`: derlenmiş uygulama, http://127.0.0.1:8037; `Ctrl+C` ile durur.
- `npm test`: tipli motorun alan testleri.
- `npm run test:ui`: Chromium ile gerçek arayüz testleri. İlk kurulumda gerekirse `npx playwright install chromium`.
- `CUL_PREVIEW=1 npx playwright test -g 'Kararlı arayüz /'`: derlenmiş dağıtımda iki stratejinin temel akışı.
- `npm run validate`: derleme + alan testleri + tarayıcı testleri. 8036'da bu proje çalışmıyorsa testi başlatmadan portu değiştirin; yabancı servisi kapatmayın.

Fontlar yerel pakete dahildir. Ürün çalışırken dış ağ isteğine ihtiyaç duymaz; kaynak bağlantıları kullanıcı açarsa harici sitelere gider.

## Kullanım

1. **İlk deneyi başlat**: Yörünge notları → Not = İncelendi → Kaydet → iç durumdan doğrulama.
2. **Sıfırla**, ardından senaryo veya strateji seçin. Ayar değişikliği yeni koşu oluşturur.
3. **Adımla** ile gözlem, hedef, ön koşul, eylem ve doğrulamayı ayrı inceleyin. **Oynat / Duraklat** aynı motoru kullanır.
4. Atlas içinde liste sırasını, aramayı, filtreyi, kaydırmayı, notu veya üst katmanı değiştirin. Ortam sürümü artar, eski gözlem görünür olur.
5. Onay senaryosunda sağ panelde **Onayla / Reddet**. Diyalogdaki içerik değiştirilirse öneri yeniden oluşturulur; eski onay geçersizdir.
6. **Karşılaştırma** aynı senaryoyu, başlangıç durumunu ve hata ayarlarını iki stratejide yürütür. Onaylar otomatik verilmez.
7. Olay kartına tıklamak yalnız kayıtlı gözlem ve eylemi inceler. Ortam geçmişe döndürülmez, eylemler tekrar uygulanmaz.
8. **JSON indir** koşunun başlangıç durumunu, koşullarını, olaylarını ve sonucunu `schemaVersion: "1.0"` ile dışa aktarır.

## Altı senaryo

| Senaryo               | Deney davranışı                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Kararlı arayüz        | İki politika da doğru kaydı bir kez günceller.                                                                       |
| Değişen yerleşim      | İlk gözlem sonrası sıra ters çevrilir. Eski koordinat durdurulur, yeniden gözlem ve gerekirse kaydırma yapılır.      |
| Belirsiz hedef        | Aynı adlı iki kayıt sessizce seçilmez; görevdeki grup bağlamıyla daraltılır.                                         |
| Engellenmiş etkileşim | Kaydet iki sentetik bekleme sonrası açılır; kalıcı engel sınırlı denemeden sonra kullanıcıya devreder.               |
| Belirsiz sonuç        | Bildirim görünmese de kaydetme durumu doğrulanır; kör tekrar kontrollü olarak ikinci yazmayı gösterir.               |
| Onay sınırı           | Güvenilmeyen kapsam dışı metin reddedilir. Arşivleme koşu, eylem, hedef ve içeriğe bağlı tek kullanımlık onay ister. |

## Sınırlar / Boundaries

Koordinat politikası gerçek görüntü anlama yapmaz. Sabit **640 × 480** mantıksal ortamın sentetik metin/bağlam/sınır gözlemini kullanır. Anlamsal politika rol/ad/bağlam kullanır. Doğrulayıcı iç kayıt durumunu kontrol eder; bu veri ekrandan okunmuş veya OCR ile çıkarılmış kanıt olarak sunulmaz. Beklemeler sentetik adımlardır; gerçek gecikme, token maliyeti veya model benchmark'ı değildir.

Motor ortam modelindeki kontrolleri uygular; tarayıcı DOM'una sistem düzeyinde tıklama göndermez. Kullanıcı kontrolleri ve ajan eylemleri aynı uygulama durumunu değiştirir. Bu bir eğitim simülasyonudur, üretim güvenlik sistemi değildir. Veriler RAM'dedir; sayfa yenilemede sıfırlanır. Saklamak için JSON indirin. Dışa aktarılan dosyayı yeniden içe alma bu sürümde yoktur.

See [architecture and scope](docs/ARCHITECTURE.md), [validation evidence](docs/VALIDATION.md), and [design notes](docs/DESIGN.md). Source records with publishers, URLs and access dates are in `src/content/sources.ts` and the bilingual Methods view.
