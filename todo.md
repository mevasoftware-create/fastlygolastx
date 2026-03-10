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
