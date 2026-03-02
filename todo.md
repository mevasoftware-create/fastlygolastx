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
