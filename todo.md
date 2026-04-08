# FastlyGo - Kurye Teslimat Platformu TODO

## Temel Altyapı
- [x] Veritabanı şeması taşıma (users, couriers, businesses, orders, categories, areas, ratings, earnings, notifications, pages, errorLogs, pricingConfig, surgeConfig, paymentRequests, push_tokens, redirects, siteSettings, restaurantTransactions, priceIncreaseHistory, favoriteAddresses)
- [x] Server routers taşıma (auth, admin, area, business, category, courier, coupon, earnings, favoriteAddress, image, mobile, mobileApp, notification, order, pages, pushNotification, rating, referral, tracking, user)
- [x] Client sayfaları taşıma (Home, Login, Register, CourierDashboard, BusinessDashboard, AdminDashboard, Order, MyOrders, TrackOrder, Profile, CategoryPage, AreaPage, Areas, Categories, HowItWorks, Services, AboutUs, ApiDocs, VerifyEmail, ForgotPassword, ResetPassword, ErrorLogs, CourierPayments, Notifications, NotificationSettings, NotificationPreferences, PendingApproval, AdminLogin, TermsOfService, PrivacyPolicy)
- [x] Bağımlılıkları yükle (socket.io, bcryptjs, i18next, react-i18next, framer-motion, qrcode.react, @react-three/fiber, @react-three/drei, three, nodemailer, compression, helmet, express-rate-limit, react-helmet-async, embla-carousel-react, recharts, react-day-picker)
- [x] Veritabanı bağlantısı (TiDB Cloud MySQL)
- [x] Environment variables ayarla

## Kimlik Doğrulama ve Yetkilendirme
- [x] 4 rol sistemi: user, courier, business, admin
- [x] Email/şifre ile kayıt ve giriş
- [ ] Email doğrulama sistemi
- [ ] Şifre sıfırlama
- [x] Admin girişi (ayrı panel) - düzeltildi
- [x] JWT tabanlı oturum yönetimi

## Sipariş Yönetimi
- [x] Sipariş oluşturma (işletme ve kullanıcı)
- [x] Gerçek zamanlı sipariş durumu güncellemeleri (Socket.IO)
- [x] Sipariş takip sayfası
- [x] Sipariş geçmişi

## Kurye Paneli
- [x] Sipariş kabul/red
- [x] Konum paylaşma
- [x] Kazanç takibi
- [x] Ödeme talepleri

## İşletme Paneli
- [x] Sipariş oluşturma
- [x] Kurye seçimi
- [x] Ödeme yönetimi
- [x] Sipariş geçmişi

## Admin Paneli
- [x] Kullanıcı yönetimi
- [x] Kurye onaylama
- [x] Sistem ayarları
- [x] Hata logları
- [x] Fiyatlandırma yönetimi
- [x] Dashboard istatistikleri düzeltildi (92 kullanıcı, 51 kurye, 7 işletme, 35 sipariş)

## Fiyatlandırma Sistemi
- [x] Mesafe bazlı hesaplama
- [x] Surge pricing
- [x] Kategori bazlı ücretler

## Gerçek Zamanlı Özellikler
- [x] Socket.IO entegrasyonu
- [x] Anlık bildirimler
- [x] Konum güncellemeleri

## SEO ve Çok Dil
- [x] Kategori bazlı SEO sayfaları
- [x] Bölge bazlı SEO sayfaları
- [x] i18n (Türkçe, İngilizce, Makedonca)
- [x] Dinamik meta etiketler - pages tablosundan çekiliyor

## Değerlendirme Sistemi
- [x] Kullanıcı-kurye değerlendirmesi
- [x] Puanlama sistemi

## Hata Düzeltmeleri (Tamamlanan)
- [x] TypeScript hataları sıfırlandı (126 → 0)
- [x] GitHub'dan orijinal kod klonlandı ve karşılaştırıldı
- [x] Schema enum değerleri veritabanıyla uyumlu hale getirildi (approved→active, rejected→inactive, pending→inactive)
- [x] couriers.isAvailable sütunu veritabanına eklendi
- [x] Kategoriler sayfası düzeltildi (shortName ve icon veritabanından çekiliyor)
- [x] Bölgeler sayfası düzeltildi (seoMeta.badge veritabanından çekiliyor)
- [x] Admin paneli giriş sorunu düzeltildi (useAuth hook'u localUser önceliklendiriyor)
- [x] SEO sistemi dinamik hale getirildi (pages tablosundan çekiliyor)
- [x] Hardcoded SEO verileri kaldırıldı
- [x] Admin dashboard istatistikleri düzeltildi
- [x] Mobil REST API endpoint'leri eklendi (/api/auth/refresh, /api/notifications, /api/orders/:id/cancel, /api/orders/:id/track, /api/courier/:id/location, /api/courier/:id/track)
- [x] Tüm mobil API endpoint'leri test edildi ve çalışıyor

## Deployment
- [ ] Checkpoint oluştur
- [ ] Publish

## Kapsamlı Denetim ve Temizlik (02.03.2026)
- [x] Backup dosyaları silindi (6 dosya: AreaPage.tsx.backup, AreaPage_old_backup.tsx, CategoryPage.tsx.backup, CategoryPage_old_backup.tsx, Order.tsx.backup, en_backup.json)
- [x] Duplicate UI klasörleri silindi (components/ui/ui/, components/components/)
- [x] currency.ts kaldırıldı, tüm kullanımlar merkezi formatEUR'ya taşındı
- [x] ComponentShowcase.tsx silindi (hiçbir route/import yok)
- [x] RateCourier.tsx silindi (hiçbir route/import yok)
- [x] EarningsReport.tsx formatEUR'ya güncellendi
- [x] BusinessOrders.tsx formatEUR'ya güncellendi
- [x] Admin fiyatları EUR olarak düzeltildi (tüm admin sayfaları)
- [x] CategoryPage, AreaPage, Services, FoodDeliveryPage JSON.parse hataları düzeltildi
- [x] Header.tsx menü shortName JSON.parse hatası düzeltildi
- [x] TypeScript hataları: 0
- [x] Browser console hataları: 0

## Bildirim Sistemi Düzeltmesi (02.03.2026)
- [x] Admin panelinden bildirim gönderme hatası düzeltildi (push_notifications ve push_tokens tabloları oluşturuldu)

## Web Push Bildirimi Entegrasyonu (02.03.2026)
- [ ] VAPID anahtarları oluşturulacak
- [ ] Service Worker (sw.js) yazılacak - push event dinleyicisi
- [ ] Frontend: tarayıcıdan bildirim izni isteme akışı
- [ ] Backend: push_tokens tablosuna token kaydetme endpoint'i
- [ ] Backend: web-push kütüphanesiyle gerçek push gönderme servisi
- [ ] Admin paneli: bildirimi gerçekten cihazlara iletecek şekilde güncelle

## Tablo Temizliği (02.03.2026)
- [x] restaurantTransactions tablosu veritabanından ve şemadan silindi

## Başlık Titremesi Kalıcı Düzeltme (03.03.2026)
- [x] SEOHead'deki boş string gelince title tag render edilmiyor (index.html başlığı korunuyor)
- [x] Services.tsx, AboutUs.tsx, HowItWorks.tsx isSeoLoading guard eklendi
- [x] about-us, how-it-works, services sayfaları test edildi - başlık tek seferde doğru değere geçiyor

## Kurye Sipariş Kabul Hatası (03.03.2026)
- [ ] acceptedAt datetime format hatası düzeltilecek (Failed query: update orders set acceptedAt)

## Bildirim Sistemi Genişletme (09.03.2026)
- [x] Admin paneli bildirimler bölümüne kayıtlı cihazlar sekmesi ekle (kullanıcı adı, cihaz tipi, platform, kayıt tarihi, aktif/pasif)
- [x] Backend'e pushNotifications.getRegisteredDevices endpoint'i ekle

## Web Push + FCM Tam Entegrasyon (10.03.2026)
- [ ] Web Push bildirim izni bileşeni oluştur (NotificationPermissionBanner)
- [ ] Kullanıcı oturum açtıktan sonra otomatik bildirim izni iste
- [ ] DashboardLayout ve kullanıcı paneline bildirim izni banner'ı ekle
- [ ] sendNotification endpoint'i hem push_tokens (web) hem fcmTokens (mobil) kullanıyor - doğrula
- [ ] Admin paneli Kayıtlı Cihazlar sekmesine web push tokenlarını da ekle
- [ ] Bildirim istatistiklerini güncelle (web + mobil ayrı göster)
- [ ] sendNotification endpoint'i notifications tablosuna da kayıt yapsın (uygulama içi bildirim geçmişi)
- [ ] Hedef kitleye göre her kullanıcıya ayrı notifications kaydı ekle
- [x] sendNotification endpoint'i push gönderdikten sonra hedef kullanıcılara notifications tablosuna da kayıt eklesin (uygulama içi bildirim listesi için)

## Para Çekme Sistemi (10.03.2026)
- [ ] Backend: createPaymentRequest, listPaymentRequests, approvePaymentRequest, rejectPaymentRequest endpoint'leri
- [ ] Backend: çekilebilir bakiye hesaplama (toplam kazanç - onaylanan çekimler)
- [ ] Frontend: CourierPayments sayfası - IBAN girişi, miktar, talep geçmişi aktif
- [ ] Admin paneli: para çekme talepleri listesi, onay/red butonları

## Bildirim Sistemi Tamamlama (10.03.2026)
- [x] Kullanıcı bildirim listesi sayfası (web) - okundu/okunmadı, silme
- [x] DashboardLayout bildirim zili - okunmamış sayıcı göster
- [x] Admin bildirim gönderme formu - hedef kitle, platform, önizleme
- [x] Admin bildirim geçmişi listesi
- [x] Web push izin banner'ı - kayıtlı kullanıcılara göster
- [x] NotificationPermissionBanner bileşeni DashboardLayout'a entegre
- [x] orders tablosuna acceptedAt kolonu eksik - migration ile ekle (sipariş kabul hatası)
- [x] Müşteri tarafı bildirim dropdown'ı boş görünüyor - notifications.list bağlandı, okunmamış sayıcı eklendi
- [x] "Tüm Bildirimleri Gör" linki düzeltildi - setLocation kullanılıyor
- [x] orders status ENUM'a 'accepted' değeri eklendi (veritabanında eksikti)
- [x] Mobil API: profil fotoğrafı görüntleme ve değiştirme endpoint'leri eklendi (GET/PUT /api/profile, POST /api/profile/avatar)
- [x] Kurye anlık konum güncelleme sistemi - test edildi ve çalışıyor
- [x] Para çekme: "Ödeme sistemi yakında" placeholder toast'u kaldırıldı, CourierPayments bileşeni entegre edildi
- [x] Konum güncelleme: test edildi ve çalışıyor (veritabanına yazılıyor)
- [x] Track-order haritasında kurye konumu yanlış gösteriyor - getByOrderNumber endpoint'i getCourierById kullanıyor (doğru)
- [x] courierLocations tablosu boş - updateLocation endpoint'i latitude/longitude ile kayıt yapıyor
- [x] Admin paneli: kurye son giriş zamanı (lastSignedIn) ve online durumu (isOnline) eklendi
- [ ] Veritabanı analizi: kullanılmayan/yarım kalan tabloları tespit et

## Kurye Konum ve Admin Güncellemeleri (10.03.2026)
- [x] couriers tablosuna lastLocationUpdate ve isOnline kolonları eklendi
- [x] updateLocation endpoint'i isOnline=true olarak günceller
- [x] getAllPaymentRequests endpoint'ine kurye adı ve IBAN bilgisi eklendi
- [x] markPaymentCollected hook'u render dışına taşındı (React hooks kuralı)

## Admin Panel Genişletme (10.03.2026)
- [x] Admin Kuponlar sayfası (/admin/coupons) - CRUD, istatistikler, kullanım geçmişi
- [x] Admin Destek Talepleri sayfası (/admin/support) - ticket listesi, mesajlaşma, durum yönetimi
- [x] Admin Site Ayarları sayfası (/admin/site-settings) - branding, SMTP, OAuth, sistem ayarları
- [x] Admin Yönlendirmeler sayfası (/admin/redirects) - URL redirect CRUD, hit sayacı
- [x] Admin Referans Sistemi sayfası (/admin/referrals) - referans istatistikleri, tamamlama
- [x] Admin Uygulama Versiyonları sayfası (/admin/app-versions) - versiyon CRUD
- [x] Backend: destek talepleri admin endpoint'leri (listAll, getById, reply, updateStatus)
- [x] Backend: site ayarları admin endpoint'leri (getAll, upsert, delete)
- [x] Backend: yönlendirmeler admin endpoint'leri (listAll, create, update, delete)
- [x] Backend: referans admin endpoint'leri (listAll, getStats)
- [x] Backend: uygulama versiyonları admin endpoint'leri (listAll, update, delete)
- [x] AdminDashboard route ve sidebar güncellemeleri

## Sitemap 4 Dilli hreflang Yapısı (17.03.2026)
- [x] Dinamik sitemapRouter.ts kaldırıldı
- [x] server/_core/vite.ts ve index.ts'ten sitemap middleware temizlendi
- [x] AdminSEO.tsx fiziksel dosyayı fetch ederek gösterecek şekilde güncellendi
- [x] sitemap.xml 35 URL → 140 URL bloğuna dönüştürüldü (35 sayfa × 4 dil)
- [x] Her URL bloğu x-default + en/tr/mk/sq çapraz hreflang referansları içeriyor
- [x] Netlify deploy için _redirects SPA routing kuralı eklendi
- [x] netlify.toml oluşturuldu

## /areas Sayfası Mobil Responsive Düzeltme (17.03.2026)
- [x] Mobil için Liste/Harita sekme sistemi eklendi (md:hidden tab switcher)
- [x] Masaüstü için yan yana panel düzeni iyileştirildi (w-72/w-80 sabit liste, flex-1 harita)
- [x] Mobil liste görünümü tam ekran yüksekliğinde (60vh min-height)
- [x] Mobil harita görünümü tam ekran yüksekliğinde (60vh min-height)
- [x] Alan seçildiğinde mobil'de otomatik harita sekmesine geçiş
- [x] Arama çubuğuna temizle (X) butonu eklendi
- [x] Seçili alan kartı mobil'de daha büyük ve kullanışlı
- [x] isMobile state kaldırıldı, Tailwind breakpoint sınıfları kullanıldı
- [x] Masaüstü liste paneli başlığı eklendi (All Areas / alan sayısı)

## Sitemap & robots.txt Temiz Sistem (08.04.2026)
- [x] Tüm eski sitemap sistemleri kaldırıldı (sitemapRouter.ts, middleware, admin endpoint'leri)
- [x] Tek temiz sistem: server/_core/vite.ts'te /sitemap.xml ve /robots.txt için Express route (hem dev hem production)
- [x] client/public/sitemap.xml → fiziksel dosya, doğrudan sendFile ile sunuluyor
- [x] client/public/robots.txt → fiziksel dosya, doğrudan sendFile ile sunuluyor
- [x] React router'ın sitemap.xml/robots.txt'i yakalaması engellendi
- [x] sitemap.xml 140 URL bloğu (35 sayfa × 4 dil: en/tr/mk/sq + x-default hreflang)

## Meta Tag Temiz Sistem (08.04.2026)
- [x] injectSeoIntoHtml fonksiyonu genişletildi: canonical, hreflang, og:*, twitter:* server-side enjekte ediliyor
- [x] Manus'un otomatik eklediği yanlış og:url (manus.space), og:image (screenshot), twitter:* tagları temizlendi
- [x] og:url her zaman fastlygo.mk domain'i ile doğru URL'yi gösteriyor
- [x] og:image sabit doğru OG image URL'sine bağlandı (fastlygo.mk/og-image.e6740bbc.jpg)
- [x] canonical her zaman ?lang= parametresiz temiz URL (Google standardı)
- [x] hreflang: x-default + en/tr/mk/sq server-side enjekte ediliyor
- [x] Türkçe/Makedonca/Arnavutça sayfada og:url doğru ?lang= parametresiyle gösteriyor
- [x] Test edildi: dev server'da tüm taglar doğru çalışıyor

## Bildirim 401 Hatası Düzeltme (08.04.2026)
- [x] registerPushToken ve unregisterPushToken protectedProcedure → publicProcedure olarak değiştirildi
- [x] Anonim kullanıcılar da push token kaydedebilir (userId=null olarak DB'ye yazılır)
- [x] Giriş yapan kullanıcı token kaydedince userId otomatik atanır
- [x] Kullanıcı giriş yaptıktan sonra mevcut token güncellenerek userId bağlanır

## /categories ve /services Sayfa Birleştirme (08.04.2026)
- [x] Mevcut /categories ve /services sayfalarını analiz et
- [x] Birleştirilmiş yeni /services sayfası tasarla ve oluştur
- [x] /categories route'unu /services'e yönlendir
- [x] Header menüsünü güncelle (Services dropdown ile birleştirildi)
- [x] SEO: sitemap.xml güncellendi (/categories → /services)
- [x] Eski /categories linklerini /services'e redirect et (App.tsx)

## Sitemap ve Robots.txt Production Sorunu (08.04.2026)
- [x] Production'da sitemap.xml sadece 1 URL gösteriyor - disable-seo.mjs dosyaları siliyordu, kopyalamaya çevrildi
- [x] robots.txt production'da doğru serve edilecek (disable-seo.mjs düzeltildi)
- [x] Server route'ları doğru - sorun build script'inin dosyaları silmesiydi

## Meta Tag Production Sorunu (08.04.2026)
- [x] Manus'un otomatik OG/Twitter meta tag'leri bizim dinamik meta tag'leri eziyor - index.html'e varsayılan OG tag'ler eklendi
- [x] Production'da sayfa bazlı dinamik meta tag'lerin çalışmasını sağla - server-side injection mevcut tag'leri replace ediyor
- [x] index.html'de OG tag'ler zaten mevcut olduğu için Manus override etmeyecek

## Manus Otomatik SEO Tamamen Devre Dışı Bırak (08.04.2026)
- [ ] Manus'un otomatik sitemap oluşturmasını engelle (zaten disable-seo.mjs ile çözüldü)
- [ ] Manus'un otomatik robots.txt oluşturmasını engelle (zaten disable-seo.mjs ile çözüldü)
- [ ] Manus'un otomatik OG/Twitter meta tag enjeksiyonunu engelle
- [ ] Manus'un otomatik title/description enjeksiyonunu engelle
- [ ] Manus'un otomatik canonical tag enjeksiyonunu engelle
- [ ] Production'da sadece bizim SEO kodumuzun çalıştığını doğrula

## Manus SEO Sistemi Tam Devre Dışı Bırakma (08.04.2026)
- [ ] Production HTML'i satır satır analiz et - Manus'un enjekte ettiği tüm öğeleri tespit et
- [ ] Dev server vs Production farkını karşılaştır - Manus'un eklediği/değiştirdiği her şeyi bul
- [ ] Tespit edilen tüm Manus otomatik SEO öğelerini devre dışı bırak
- [ ] Deploy sonrası doğrula - hiçbir Manus otomatik SEO öğesi kalmamalı

## Manus Enjeksiyonlarını Tamamen Kaldır (08.04.2026)
- [ ] Manus title override'ını engelle (VITE_APP_TITLE → "FastlyGo" kısaltması)
- [ ] Manus'un fazladan canonical tag enjeksiyonunu engelle
- [ ] Production'da server-side injection çalışmadığı için client-side SEO hook oluştur
- [ ] Tüm sayfalarda dinamik title/description/OG tag'ler client-side çalışsın
- [ ] Deploy sonrası doğrula - Manus'un hiçbir SEO müdahalesi kalmamalı

## Manus Fazladan Canonical Tag Kaldır (08.04.2026)
- [x] Manus'un </head> öncesine eklediği fazladan canonical tag'ı engelle - index.html'den statik canonical kaldırıldı, client-side pageSeo.ts tüm canonical'ları temizleyip doğrusunu ekliyor

## Production'da Sayfa Bazlı Dinamik SEO (08.04.2026)
- [x] Production'da tüm sayfalar aynı title/description/OG tag alıyor - prerender-seo.mjs ile çözüldü
- [x] Manus proxy statik index.html serve ediyor - her sayfa için ayrı HTML dosyası oluşturuldu
- [x] prerender-seo.mjs: Build sırasında 16 sayfa için ayrı HTML dosyaları oluşturuluyor

## Sitemap Duplicate Lang URL'leri Kaldır (08.04.2026)
- [x] Sitemap'te ?lang= duplicate entry'ler kaldırıldı: 140 → 34 URL (105 duplicate silindi)
- [x] Sadece ana URL'ler <loc>'ta, dil varyantları sadece xhtml:link alternate olarak kalıyor
- [x] /categories/* URL'leri sitemap'ten kaldırıldı (34 → 29 URL) - categories artık /services'e redirect oluyor
- [x] /new-order sayfası sitemap'e eklendi
- [x] lastmod tarihleri 2026-04-08 olarak güncellendi

## registerPushToken 500 Hatası (08.04.2026)
- [x] push_tokens INSERT sorgusu 500 veriyor - token kolonu NOT NULL ama insert'te değer gönderilmiyordu
- [x] Insert'e token: '' eklendi (Web push endpoint/p256dh/auth kullanır, token FCM/mobile için)

## Pre-render SEO Production'da Çalışmıyor (08.04.2026)
- [x] Manus proxy root index.html'i serve ediyor — ÇÖZÜM: index.html'e inline JS script eklendi
- [x] Inline script URL'ye göre doğru title/description/canonical/OG set ediyor
- [x] Duplicate tag'leri temizleyen cleanup kodu eklendi
- [x] 10+ public sayfa + dinamik area sayfaları için SEO data tanımlandı

## Kapsamlı SEO Audit ve Düzeltme (08.04.2026)
- [x] SORUN-1: Production'da tüm sayfalar aynı title/description/OG gösteriyor — index.html'den statik tag'ler kaldırıldı, server-side fallback eklendi
- [x] SORUN-2: Her sayfada 2 adet canonical tag var — index.html'den statik canonical kaldırıldı, artık sadece 1 doğru canonical var
- [x] SORUN-3: og:url tüm sayfalarda https://fastlygo.mk/ — server-side injection sayfa bazlı og:url enjekte ediyor
- [x] SORUN-4: Title sadece "FastlyGo" — fallback SEO data eklendi, DB'de data yoksa bile doğru title enjekte ediliyor
- [x] SORUN-5: robots.txt'te /categories/ Disallow'a taşındı, /new-order Allow'a eklendi, /contact kaldırıldı
- [x] SORUN-6: pageSeo.ts pagePaths'e services, areas, privacyPolicy, termsOfService eklendi, /order→/new-order düzeltildi
- [x] SORUN-7: pageSeo.ts'deki updatePageSEO dead code — SEOHead bileşeni zaten tüm sayfalarda kullanılıyor (React 19 head hoisting)
- [x] SORUN-8: prerender-seo.mjs hala build'de çalışıyor (yedek), asıl çözüm server-side vite.ts injection + fallback data
- [x] SORUN-9: index.html template'inden tüm statik SEO tag'ler kaldırıldı — artık duplicate yok
- [x] ÇÖZÜM: vite.ts fallback SEO data eklendi, staticPageSlugs genişletildi, pageSeo.ts pagePaths güncellendi

## Kapsamlı SEO Audit - 2. Tur (08.04.2026)
- [x] Sitemap'e /courier/register ve /business/register eklendi (29→31 URL)
- [x] Footer copyright yılı 2025→2026 güncellendi
- [x] Footer'daki /privacy ve /terms linkleri /privacy-policy ve /terms-of-service olarak düzeltildi
- [x] /categories/* için server-side 301 redirect eklendi (hem dev hem production)
- [x] index.html'e inline SEO script eklendi - Manus proxy override'ını etkisiz hale getiriyor
- [x] Tüm 63 test geçiyor

## Areas Sayfası Yeniden Tasarım + Sitemap Kategoriler (08.04.2026)
- [x] Areas sayfasının tasarımı tamamen yenilendi - hero banner, şehir kartları (expand/collapse), area grid, interaktif harita, CTA
- [x] Site tasarım dili ile uyumlu: turuncu gradient, soft gölgeler, rounded corners, emoji ikonlar
- [x] Mobil + masaüstü responsive: tek kolon mobil, 3 kolon masaüstü, harita toggle
- [x] 4 dilde i18n key'leri eklendi (deliveryNetwork, deliveryZones, cities, exploreOnMap vb.)
- [x] Sitemap'e 6 kategori eklendi (anchor link: /services#food-delivery vb.) - toplam 37 URL
- [x] Services.tsx'deki kategori kartlarına id attribute eklendi (anchor link'ler çalışsın)

## Admin Panel Tam Yenileme (08.04.2026)
- [x] AdminDashboardLayout - Modern sidebar: gruplu menü, arama, bildirim zili, breadcrumb, top bar
- [x] AdminHome dashboard - Gelişmiş KPI kartları, grafikler, aktivite feed, hızlı aksiyonlar
- [x] Orders sayfası - Gelişmiş tablo, filtreler, detay drawer, durum değiştirme
- [x] AdminUsers sayfası - Gelişmiş tablo, arama, filtre, rol badge'leri
- [x] Couriers sayfası - Onay sistemi, durum göstergeleri, detay panel
- [x] Businesses sayfası - İşletme yönetimi, onay, detay
- [x] Customers sayfası - Müşteri listesi, sipariş geçmişi
- [x] AdminPayments - Ödeme talepleri, onay/red, filtreler
- [x] PricingAndRevenue - Fiyatlandırma ve gelir yönetimi
- [x] SurgePricing - Dinamik fiyatlandırma (mevcut korundu)
- [x] Reviews - Değerlendirme tabloları, yıldız dağılımı
- [x] AdminNotifications - Bildirim gönderme formu, geçmiş, cihaz yönetimi
- [x] AdminCategories - Kategori CRUD, sıralama
- [x] AdminAreas - Bölge yönetimi, form, silme onayı
- [x] AdminPages - Sayfa yönetimi (mevcut korundu)
- [x] AdminSEO - Meta tag yönetimi, önizleme
- [x] AdminSiteSettings - Site ayarları formu
- [x] AdminRedirects - Yönlendirme CRUD
- [x] AdminCoupons - Kupon yönetimi, istatistikler
- [x] AdminSupport - Destek talepleri, yanıt sistemi
- [x] AdminReferrals - Referans sistemi
- [x] AdminAppVersions - Uygulama versiyonları
- [x] ErrorLogs - Hata günlükleri, severity badge, metadata, filtreler
- [x] Tutarlı design system: rounded-2xl, soft gölgeler, turuncu accent, modern tipografi
- [x] Tüm TS hataları 0'a düşürüldü
- [x] Tüm 63 test geçiyor

## Home Sayfa Hatası - useLanguage LanguageProvider (08.04.2026)
- [x] useSeoFromDatabase hook'u useLanguage yerine useTranslation kullanıyor — LanguageProvider dışında da çalışır
- [x] HMR/error recovery sırasında provider sıralama sorunu artık oluşmaz
