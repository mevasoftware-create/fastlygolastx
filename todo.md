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
- [ ] Admin girişi (ayrı panel)
- [ ] JWT tabanlı oturum yönetimi

## Sipariş Yönetimi
- [x] Sipariş oluşturma (işletme ve kullanıcı)
- [x] Gerçek zamanlı sipariş durumu güncellemeleri (Socket.IO)
- [ ] Sipariş takip sayfası
- [ ] Sipariş geçmişi

## Kurye Paneli
- [ ] Sipariş kabul/red
- [ ] Konum paylaşma
- [ ] Kazanç takibi
- [ ] Ödeme talepleri

## İşletme Paneli
- [ ] Sipariş oluşturma
- [ ] Kurye seçimi
- [ ] Ödeme yönetimi
- [ ] Sipariş geçmişi

## Admin Paneli
- [ ] Kullanıcı yönetimi
- [ ] Kurye onaylama
- [ ] Sistem ayarları
- [ ] Hata logları
- [ ] Fiyatlandırma yönetimi

## Fiyatlandırma Sistemi
- [ ] Mesafe bazlı hesaplama
- [ ] Surge pricing
- [ ] Kategori bazlı ücretler

## Gerçek Zamanlı Özellikler
- [x] Socket.IO entegrasyonu
- [ ] Anlık bildirimler
- [ ] Konum güncellemeleri

## SEO ve Çok Dil
- [ ] Kategori bazlı SEO sayfaları
- [ ] Bölge bazlı SEO sayfaları
- [ ] i18n (Türkçe, İngilizce, Makedonca)
- [ ] Dinamik meta etiketler

## Değerlendirme Sistemi
- [ ] Kullanıcı-kurye değerlendirmesi
- [ ] Puanlama sistemi

## Deployment
- [ ] Production build
- [ ] Checkpoint oluştur
- [ ] Publish
