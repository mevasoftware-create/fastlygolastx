import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Clock, MapPin, Star, ArrowRight, CheckCircle, Zap, Shield, Package, Truck, Utensils, Timer, ThumbsUp, Pill, ShoppingBag, Briefcase, FileText, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSeoFromDatabase } from '@/hooks/useSeoFromDatabase';
import { useEffect } from 'react';
import { BASE_URL } from '@/const';

// Category-specific content configurations
const getCategoryConfig = (slug: string, language: string) => {
  const configs: Record<string, any> = {
    'food-delivery': {
      icon: '🍔',
      features: [
        { 
          icon: Timer, 
          title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
          desc: language === 'tr' ? 'Yemeğiniz 15 dakikada kapınızda' : language === 'mk' ? 'Вашата храна на врата за 15 минути' : language === 'sq' ? 'Ushqimi juaj në derë për 15 minuta' : 'Your food at your door in 15 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: Utensils, 
          title: language === 'tr' ? 'Geniş Restoran Seçeneği' : language === 'mk' ? 'Широк Избор на Ресторани' : language === 'sq' ? 'Zgjedhje e Gjerë e Restoranteve' : 'Wide Restaurant Selection',
          desc: language === 'tr' ? 'Yüzlerce restorandan seçim yapın' : language === 'mk' ? 'Изберете од стотици ресторани' : language === 'sq' ? 'Zgjidhni nga qindra restorante' : 'Choose from hundreds of restaurants',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: ThumbsUp, 
          title: language === 'tr' ? 'Taze ve Sıcak' : language === 'mk' ? 'Свежо и Топло' : language === 'sq' ? 'E Freskët dhe e Ngrohtë' : 'Fresh and Hot',
          desc: language === 'tr' ? 'Yemeğiniz her zaman taze ve sıcak' : language === 'mk' ? 'Вашата храна секогаш свежа и топла' : language === 'sq' ? 'Ushqimi juaj gjithmonë i freskët dhe i ngrohtë' : 'Your food always fresh and hot',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '500+', label: language === 'tr' ? 'Restoran' : language === 'mk' ? 'Ресторани' : language === 'sq' ? 'Restorante' : 'Restaurants' },
        { value: '15', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '50K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Pizza' : 'Pizza', emoji: '🍕' },
        { name: language === 'tr' ? 'Burger' : 'Burger', emoji: '🍔' },
        { name: language === 'tr' ? 'Sushi' : 'Sushi', emoji: '🍣' },
        { name: language === 'tr' ? 'Kebap' : language === 'mk' ? 'Кебап' : language === 'sq' ? 'Qebap' : 'Kebab', emoji: '🥙' },
        { name: language === 'tr' ? 'Tatlı' : language === 'mk' ? 'Десерт' : language === 'sq' ? 'Ëmbëlsirë' : 'Dessert', emoji: '🍰' },
        { name: language === 'tr' ? 'Kahve' : language === 'mk' ? 'Кафе' : language === 'sq' ? 'Kafe' : 'Coffee', emoji: '☕' },
      ],
      extrasTitle: language === 'tr' ? 'Popüler Mutfaklar' : language === 'mk' ? 'Популарни Кујни' : language === 'sq' ? 'Kuzhinat Popullore' : 'Popular Cuisines'
    },
    'pharmacy-delivery': {
      icon: '💊',
      features: [
        { 
          icon: Pill, 
          title: language === 'tr' ? 'İlaç Teslimatı' : language === 'mk' ? 'Достава на Лекови' : language === 'sq' ? 'Dorëzim Ilaçesh' : 'Medicine Delivery',
          desc: language === 'tr' ? 'İlaçlarınız güvenle kapınızda' : language === 'mk' ? 'Вашите лекови безбедно на врата' : language === 'sq' ? 'Ilaçet tuaja në mënyrë të sigurt në derë' : 'Your medicines safely at your door',
          color: 'from-green-400 to-green-500' 
        },
        { 
          icon: Shield, 
          title: language === 'tr' ? 'Güvenli Taşıma' : language === 'mk' ? 'Безбедна Транспорт' : language === 'sq' ? 'Transport i Sigurt' : 'Safe Transport',
          desc: language === 'tr' ? 'Özel ambalaj ve soğuk zincir' : language === 'mk' ? 'Специјално пакување и ладен синџир' : language === 'sq' ? 'Paketim i veçantë dhe zinxhir i ftohtë' : 'Special packaging and cold chain',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? '7/24 Hizmet' : language === 'mk' ? '24/7 Услуга' : language === 'sq' ? 'Shërbim 24/7' : '24/7 Service',
          desc: language === 'tr' ? 'Acil ilaç ihtiyacınız için her zaman' : language === 'mk' ? 'Секогаш за вашата итна потреба од лекови' : language === 'sq' ? 'Gjithmonë për nevojën tuaj urgjente për ilaçe' : 'Always for your urgent medicine needs',
          color: 'from-orange-400 to-orange-500' 
        },
      ],
      stats: [
        { value: '50+', label: language === 'tr' ? 'Eczane' : language === 'mk' ? 'Аптеки' : language === 'sq' ? 'Farmaci' : 'Pharmacies' },
        { value: '20', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '10K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Reçeteli İlaçlar' : language === 'mk' ? 'Лекови со Рецепт' : language === 'sq' ? 'Ilaçe me Recetë' : 'Prescription Drugs', emoji: '💊' },
        { name: language === 'tr' ? 'Reçetesiz İlaçlar' : language === 'mk' ? 'Лекови без Рецепт' : language === 'sq' ? 'Ilaçe pa Recetë' : 'OTC Drugs', emoji: '🏥' },
        { name: language === 'tr' ? 'Vitamin & Takviye' : language === 'mk' ? 'Витамини & Додатоци' : language === 'sq' ? 'Vitamina & Shtesa' : 'Vitamins & Supplements', emoji: '💪' },
        { name: language === 'tr' ? 'Bebek Ürünleri' : language === 'mk' ? 'Бебешки Производи' : language === 'sq' ? 'Produkte për Fëmijë' : 'Baby Products', emoji: '👶' },
        { name: language === 'tr' ? 'Kozmetik' : language === 'mk' ? 'Козметика' : language === 'sq' ? 'Kozmetikë' : 'Cosmetics', emoji: '💄' },
        { name: language === 'tr' ? 'Tıbbi Cihazlar' : language === 'mk' ? 'Медицински Уреди' : language === 'sq' ? 'Pajisje Mjekësore' : 'Medical Devices', emoji: '🩺' },
      ],
      extrasTitle: language === 'tr' ? 'Ürün Kategorileri' : language === 'mk' ? 'Категории на Производи' : language === 'sq' ? 'Kategoritë e Produkteve' : 'Product Categories'
    },
    'grocery-delivery': {
      icon: '🛒',
      features: [
        { 
          icon: ShoppingBag, 
          title: language === 'tr' ? 'Market Alışverişi' : language === 'mk' ? 'Купување во Маркет' : language === 'sq' ? 'Blerje në Market' : 'Grocery Shopping',
          desc: language === 'tr' ? 'Taze gıda ürünleri kapınızda' : language === 'mk' ? 'Свежи прехранбени производи на врата' : language === 'sq' ? 'Produkte të freskëta ushqimore në derë' : 'Fresh food products at your door',
          color: 'from-green-400 to-green-500' 
        },
        { 
          icon: Timer, 
          title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
          desc: language === 'tr' ? 'Alışverişiniz 30 dakikada' : language === 'mk' ? 'Вашата купувина за 30 минути' : language === 'sq' ? 'Blerja juaj për 30 minuta' : 'Your shopping in 30 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: ThumbsUp, 
          title: language === 'tr' ? 'Kaliteli Ürünler' : language === 'mk' ? 'Квалитетни Производи' : language === 'sq' ? 'Produkte Cilësore' : 'Quality Products',
          desc: language === 'tr' ? 'En taze ve kaliteli ürünler' : language === 'mk' ? 'Најсвежи и квалитетни производи' : language === 'sq' ? 'Produktet më të freskëta dhe cilësore' : 'Freshest and quality products',
          color: 'from-blue-400 to-blue-500' 
        },
      ],
      stats: [
        { value: '100+', label: language === 'tr' ? 'Market' : language === 'mk' ? 'Маркети' : language === 'sq' ? 'Markete' : 'Stores' },
        { value: '30', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '25K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.8', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Meyve & Sebze' : language === 'mk' ? 'Овошје & Зеленчук' : language === 'sq' ? 'Fruta & Perime' : 'Fruits & Vegetables', emoji: '🥬' },
        { name: language === 'tr' ? 'Et & Tavuk' : language === 'mk' ? 'Месо & Пилешко' : language === 'sq' ? 'Mish & Pulë' : 'Meat & Chicken', emoji: '🥩' },
        { name: language === 'tr' ? 'Süt Ürünleri' : language === 'mk' ? 'Млечни Производи' : language === 'sq' ? 'Produkte Qumështi' : 'Dairy Products', emoji: '🥛' },
        { name: language === 'tr' ? 'Ekmek & Unlu' : language === 'mk' ? 'Леб & Пецива' : language === 'sq' ? 'Bukë & Brumëra' : 'Bread & Bakery', emoji: '🍞' },
        { name: language === 'tr' ? 'İçecekler' : language === 'mk' ? 'Пијалоци' : language === 'sq' ? 'Pije' : 'Beverages', emoji: '🥤' },
        { name: language === 'tr' ? 'Temizlik' : language === 'mk' ? 'Чистење' : language === 'sq' ? 'Pastrimi' : 'Cleaning', emoji: '🧹' },
      ],
      extrasTitle: language === 'tr' ? 'Ürün Kategorileri' : language === 'mk' ? 'Категории на Производи' : language === 'sq' ? 'Kategoritë e Produkteve' : 'Product Categories'
    },
    'document-delivery': {
      icon: '📄',
      features: [
        { 
          icon: FileText, 
          title: language === 'tr' ? 'Evrak Teslimatı' : language === 'mk' ? 'Достава на Документи' : language === 'sq' ? 'Dorëzim Dokumentesh' : 'Document Delivery',
          desc: language === 'tr' ? 'Önemli evraklarınız güvenle' : language === 'mk' ? 'Вашите важни документи безбедно' : language === 'sq' ? 'Dokumentet tuaja të rëndësishme në mënyrë të sigurt' : 'Your important documents safely',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Shield, 
          title: language === 'tr' ? 'Güvenli Taşıma' : language === 'mk' ? 'Безбедна Транспорт' : language === 'sq' ? 'Transport i Sigurt' : 'Safe Transport',
          desc: language === 'tr' ? 'Özel ambalaj ve sigorta' : language === 'mk' ? 'Специјално пакување и осигурување' : language === 'sq' ? 'Paketim i veçantë dhe sigurim' : 'Special packaging and insurance',
          color: 'from-green-400 to-green-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
          desc: language === 'tr' ? 'Evraklarınız 20 dakikada' : language === 'mk' ? 'Вашите документи за 20 минути' : language === 'sq' ? 'Dokumentet tuaja për 20 minuta' : 'Your documents in 20 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
      ],
      stats: [
        { value: '20K+', label: language === 'tr' ? 'Evrak' : language === 'mk' ? 'Документи' : language === 'sq' ? 'Dokumente' : 'Documents' },
        { value: '20', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '99.9%', label: language === 'tr' ? 'Güvenlik' : language === 'mk' ? 'Безбедност' : language === 'sq' ? 'Siguri' : 'Security' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Resmi Evraklar' : language === 'mk' ? 'Официјални Документи' : language === 'sq' ? 'Dokumente Zyrtare' : 'Official Documents', emoji: '📋' },
        { name: language === 'tr' ? 'Sözleşmeler' : language === 'mk' ? 'Договори' : language === 'sq' ? 'Kontrata' : 'Contracts', emoji: '📝' },
        { name: language === 'tr' ? 'Faturalar' : language === 'mk' ? 'Фактури' : language === 'sq' ? 'Fatura' : 'Invoices', emoji: '🧾' },
        { name: language === 'tr' ? 'Kimlik Belgeleri' : language === 'mk' ? 'Документи за Идентитет' : language === 'sq' ? 'Dokumente Identiteti' : 'ID Documents', emoji: '🪪' },
        { name: language === 'tr' ? 'Bankacılık' : language === 'mk' ? 'Банкарство' : language === 'sq' ? 'Bankare' : 'Banking', emoji: '🏦' },
        { name: language === 'tr' ? 'Hukuki' : language === 'mk' ? 'Правни' : language === 'sq' ? 'Ligjore' : 'Legal', emoji: '⚖️' },
      ],
      extrasTitle: language === 'tr' ? 'Evrak Türleri' : language === 'mk' ? 'Типови на Документи' : language === 'sq' ? 'Llojet e Dokumenteve' : 'Document Types'
    },
    'cargo-package-delivery': {
      icon: '📦',
      features: [
        { 
          icon: Package, 
          title: language === 'tr' ? 'Paket Teslimatı' : language === 'mk' ? 'Достава на Пакети' : language === 'sq' ? 'Dorëzim Paketash' : 'Package Delivery',
          desc: language === 'tr' ? 'Her türlü paket teslimatı' : language === 'mk' ? 'Секаков вид на достава на пакети' : language === 'sq' ? 'Çdo lloj dorëzimi paketash' : 'All kinds of package delivery',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: MapPin, 
          title: language === 'tr' ? 'Canlı Takip' : language === 'mk' ? 'Следење во Живо' : language === 'sq' ? 'Ndjekje në Kohë Reale' : 'Live Tracking',
          desc: language === 'tr' ? 'Paketinizi anlık takip edin' : language === 'mk' ? 'Следете го вашиот пакет во реално време' : language === 'sq' ? 'Ndiqni paketën tuaj në kohë reale' : 'Track your package in real-time',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Shield, 
          title: language === 'tr' ? 'Güvenli Taşıma' : language === 'mk' ? 'Безбедна Транспорт' : language === 'sq' ? 'Transport i Sigurt' : 'Safe Transport',
          desc: language === 'tr' ? 'Paketiniz sigortalı ve güvende' : language === 'mk' ? 'Вашиот пакет е осигуран и безбеден' : language === 'sq' ? 'Paketa juaj është e siguruar dhe e sigurt' : 'Your package is insured and safe',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '100K+', label: language === 'tr' ? 'Paket' : language === 'mk' ? 'Пакети' : language === 'sq' ? 'Paketa' : 'Packages' },
        { value: '25', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '99%', label: language === 'tr' ? 'Başarı' : language === 'mk' ? 'Успех' : language === 'sq' ? 'Sukses' : 'Success' },
        { value: '4.8', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Küçük Paketler' : language === 'mk' ? 'Мали Пакети' : language === 'sq' ? 'Paketa të Vogla' : 'Small Packages', emoji: '📦' },
        { name: language === 'tr' ? 'Orta Paketler' : language === 'mk' ? 'Средни Пакети' : language === 'sq' ? 'Paketa Mesatare' : 'Medium Packages', emoji: '📦' },
        { name: language === 'tr' ? 'Büyük Paketler' : language === 'mk' ? 'Големи Пакети' : language === 'sq' ? 'Paketa të Mëdha' : 'Large Packages', emoji: '📦' },
        { name: language === 'tr' ? 'Kırılabilir' : language === 'mk' ? 'Кршливо' : language === 'sq' ? 'E Thyeshme' : 'Fragile', emoji: '🔔' },
        { name: language === 'tr' ? 'Elektronik' : language === 'mk' ? 'Електроника' : language === 'sq' ? 'Elektronikë' : 'Electronics', emoji: '📱' },
        { name: language === 'tr' ? 'Giyim' : language === 'mk' ? 'Облека' : language === 'sq' ? 'Veshje' : 'Clothing', emoji: '👕' },
      ],
      extrasTitle: language === 'tr' ? 'Paket Türleri' : language === 'mk' ? 'Типови на Пакети' : language === 'sq' ? 'Llojet e Paketave' : 'Package Types'
    },
    'business-delivery': {
      icon: '💼',
      features: [
        { 
          icon: Briefcase, 
          title: language === 'tr' ? 'Kurumsal Çözümler' : language === 'mk' ? 'Корпоративни Решенија' : language === 'sq' ? 'Zgjidhje Korporative' : 'Corporate Solutions',
          desc: language === 'tr' ? 'İşletmeniz için özel teslimat' : language === 'mk' ? 'Специјална достава за вашиот бизнис' : language === 'sq' ? 'Dorëzim i veçantë për biznesin tuaj' : 'Special delivery for your business',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Öncelikli Hizmet' : language === 'mk' ? 'Приоритетна Услуга' : language === 'sq' ? 'Shërbim Prioritar' : 'Priority Service',
          desc: language === 'tr' ? 'İşletmelere öncelikli teslimat' : language === 'mk' ? 'Приоритетна достава за бизниси' : language === 'sq' ? 'Dorëzim prioritar për biznese' : 'Priority delivery for businesses',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: Shield, 
          title: language === 'tr' ? 'Güvenilir' : language === 'mk' ? 'Доверливо' : language === 'sq' ? 'E Besueshme' : 'Reliable',
          desc: language === 'tr' ? 'Profesyonel ve güvenilir hizmet' : language === 'mk' ? 'Професионална и доверлива услуга' : language === 'sq' ? 'Shërbim profesional dhe i besueshëm' : 'Professional and reliable service',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '200+', label: language === 'tr' ? 'İşletme' : language === 'mk' ? 'Бизниси' : language === 'sq' ? 'Biznese' : 'Businesses' },
        { value: '20', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '50K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Restoranlar' : language === 'mk' ? 'Ресторани' : language === 'sq' ? 'Restorante' : 'Restaurants', emoji: '🍽️' },
        { name: language === 'tr' ? 'Marketler' : language === 'mk' ? 'Маркети' : language === 'sq' ? 'Markete' : 'Stores', emoji: '🏪' },
        { name: language === 'tr' ? 'Eczaneler' : language === 'mk' ? 'Аптеки' : language === 'sq' ? 'Farmaci' : 'Pharmacies', emoji: '💊' },
        { name: language === 'tr' ? 'E-ticaret' : language === 'mk' ? 'Е-трговија' : language === 'sq' ? 'E-commerce' : 'E-commerce', emoji: '🛍️' },
        { name: language === 'tr' ? 'Ofisler' : language === 'mk' ? 'Канцеларии' : language === 'sq' ? 'Zyra' : 'Offices', emoji: '🏢' },
        { name: language === 'tr' ? 'Kurumlar' : language === 'mk' ? 'Институции' : language === 'sq' ? 'Institucione' : 'Institutions', emoji: '🏛️' },
      ],
      extrasTitle: language === 'tr' ? 'İşletme Türleri' : language === 'mk' ? 'Типови на Бизниси' : language === 'sq' ? 'Llojet e Bizneseve' : 'Business Types'
    },
    'gift-delivery': {
      icon: '🎁',
      features: [
        { 
          icon: Gift, 
          title: language === 'tr' ? 'Hediye Teslimatı' : language === 'mk' ? 'Достава на Подароци' : language === 'sq' ? 'Dorëzim Dhuratash' : 'Gift Delivery',
          desc: language === 'tr' ? 'Sevdiklerinize özel hediyeler' : language === 'mk' ? 'Специјални подароци за вашите сакани' : language === 'sq' ? 'Dhurata të veçanta për të dashurit tuaj' : 'Special gifts for your loved ones',
          color: 'from-pink-400 to-pink-500' 
        },
        { 
          icon: Package, 
          title: language === 'tr' ? 'Özel Ambalaj' : language === 'mk' ? 'Специјално Пакување' : language === 'sq' ? 'Paketim i Veçantë' : 'Special Packaging',
          desc: language === 'tr' ? 'Hediyeniz özel ambalajda' : language === 'mk' ? 'Вашиот подарок во специјално пакување' : language === 'sq' ? 'Dhurata juaj në paketim të veçantë' : 'Your gift in special packaging',
          color: 'from-purple-400 to-purple-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Zamanında Teslimat' : language === 'mk' ? 'Навремена Достава' : language === 'sq' ? 'Dorëzim në Kohë' : 'On-Time Delivery',
          desc: language === 'tr' ? 'Özel günlerde zamanında' : language === 'mk' ? 'Навреме за специјални денови' : language === 'sq' ? 'Në kohë për ditë speciale' : 'On time for special days',
          color: 'from-orange-400 to-orange-500' 
        },
      ],
      stats: [
        { value: '15K+', label: language === 'tr' ? 'Hediye' : language === 'mk' ? 'Подароци' : language === 'sq' ? 'Dhurata' : 'Gifts' },
        { value: '25', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '100%', label: language === 'tr' ? 'Mutluluk' : language === 'mk' ? 'Среќа' : language === 'sq' ? 'Lumturi' : 'Happiness' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Çiçekler' : language === 'mk' ? 'Цвеќиња' : language === 'sq' ? 'Lule' : 'Flowers', emoji: '💐' },
        { name: language === 'tr' ? 'Pastalar' : language === 'mk' ? 'Торти' : language === 'sq' ? 'Torta' : 'Cakes', emoji: '🎂' },
        { name: language === 'tr' ? 'Çikolatalar' : language === 'mk' ? 'Чоколади' : language === 'sq' ? 'Çokollata' : 'Chocolates', emoji: '🍫' },
        { name: language === 'tr' ? 'Oyuncaklar' : language === 'mk' ? 'Играчки' : language === 'sq' ? 'Lodra' : 'Toys', emoji: '🧸' },
        { name: language === 'tr' ? 'Takılar' : language === 'mk' ? 'Накит' : language === 'sq' ? 'Bizhuteri' : 'Jewelry', emoji: '💍' },
        { name: language === 'tr' ? 'Kitaplar' : language === 'mk' ? 'Книги' : language === 'sq' ? 'Libra' : 'Books', emoji: '📚' },
      ],
      extrasTitle: language === 'tr' ? 'Hediye Türleri' : language === 'mk' ? 'Типови на Подароци' : language === 'sq' ? 'Llojet e Dhuratave' : 'Gift Types'
    },
    'flower-delivery': {
      icon: '🌸',
      features: [
        { 
          icon: Gift, 
          title: language === 'tr' ? 'Çiçek Teslimatı' : language === 'mk' ? 'Достава на Цвеќиња' : language === 'sq' ? 'Dorëzim Lulesh' : 'Flower Delivery',
          desc: language === 'tr' ? 'Taze çiçekler sevdiklerinize' : language === 'mk' ? 'Свежи цвеќиња за вашите сакани' : language === 'sq' ? 'Lule të freskëta për të dashurit tuaj' : 'Fresh flowers for your loved ones',
          color: 'from-pink-400 to-pink-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
          desc: language === 'tr' ? 'Çiçekleriniz 30 dakikada' : language === 'mk' ? 'Вашите цвеќиња за 30 минути' : language === 'sq' ? 'Lulet tuaja për 30 minuta' : 'Your flowers in 30 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: ThumbsUp, 
          title: language === 'tr' ? 'Taze ve Kaliteli' : language === 'mk' ? 'Свежо и Квалитетно' : language === 'sq' ? 'E Freskët dhe Cilësore' : 'Fresh and Quality',
          desc: language === 'tr' ? 'En taze çiçekler garantisi' : language === 'mk' ? 'Гаранција за најсвежи цвеќиња' : language === 'sq' ? 'Garanci për lulet më të freskëta' : 'Guarantee for freshest flowers',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '50+', label: language === 'tr' ? 'Çiçekçi' : language === 'mk' ? 'Цвеќарници' : language === 'sq' ? 'Lulishte' : 'Florists' },
        { value: '30', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '20K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Güller' : language === 'mk' ? 'Рози' : language === 'sq' ? 'Trëndafila' : 'Roses', emoji: '🌹' },
        { name: language === 'tr' ? 'Buketler' : language === 'mk' ? 'Букети' : language === 'sq' ? 'Buketa' : 'Bouquets', emoji: '💐' },
        { name: language === 'tr' ? 'Orkideler' : language === 'mk' ? 'Орхидеи' : language === 'sq' ? 'Orkide' : 'Orchids', emoji: '🌺' },
        { name: language === 'tr' ? 'Laleler' : language === 'mk' ? 'Лалиња' : language === 'sq' ? 'Tulipanë' : 'Tulips', emoji: '🌷' },
        { name: language === 'tr' ? 'Karanfiller' : language === 'mk' ? 'Каранфили' : language === 'sq' ? 'Karafila' : 'Carnations', emoji: '🌸' },
        { name: language === 'tr' ? 'Ayçiçekleri' : language === 'mk' ? 'Сончогледи' : language === 'sq' ? 'Luledielli' : 'Sunflowers', emoji: '🌻' },
      ],
      extrasTitle: language === 'tr' ? 'Çiçek Türleri' : language === 'mk' ? 'Типови на Цвеќиња' : language === 'sq' ? 'Llojet e Luleve' : 'Flower Types'
    },
    'pet-supplies': {
      icon: '🐾',
      features: [
        { 
          icon: Package, 
          title: language === 'tr' ? 'Evcil Hayvan Ürünleri' : language === 'mk' ? 'Производи за Миленици' : language === 'sq' ? 'Produkte për Kafshë Shtëpiake' : 'Pet Supplies',
          desc: language === 'tr' ? 'Evcil dostlarınız için her şey' : language === 'mk' ? 'Сè за вашите миленици' : language === 'sq' ? 'Gjithçka për kafshët tuaja' : 'Everything for your pets',
          color: 'from-amber-400 to-amber-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
          desc: language === 'tr' ? 'Pet ürünleri 30 dakikada' : language === 'mk' ? 'Производи за миленици за 30 минути' : language === 'sq' ? 'Produkte për kafshë për 30 minuta' : 'Pet products in 30 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: Shield, 
          title: language === 'tr' ? 'Güvenli Taşıma' : language === 'mk' ? 'Безбедна Транспорт' : language === 'sq' ? 'Transport i Sigurt' : 'Safe Transport',
          desc: language === 'tr' ? 'Ürünler özenle taşınır' : language === 'mk' ? 'Производите се пренесуваат со грижа' : language === 'sq' ? 'Produktet transportohen me kujdes' : 'Products transported with care',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '30+', label: language === 'tr' ? 'Pet Shop' : language === 'mk' ? 'Продавници' : language === 'sq' ? 'Dyqane' : 'Pet Shops' },
        { value: '30', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '10K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.8', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Kedi Maması' : language === 'mk' ? 'Храна за Мачки' : language === 'sq' ? 'Ushqim për Mace' : 'Cat Food', emoji: '🐱' },
        { name: language === 'tr' ? 'Köpek Maması' : language === 'mk' ? 'Храна за Кучиња' : language === 'sq' ? 'Ushqim për Qen' : 'Dog Food', emoji: '🐶' },
        { name: language === 'tr' ? 'Oyuncaklar' : language === 'mk' ? 'Играчки' : language === 'sq' ? 'Lodra' : 'Toys', emoji: '🎾' },
        { name: language === 'tr' ? 'Bakım Ürünleri' : language === 'mk' ? 'Производи за Нега' : language === 'sq' ? 'Produkte Kujdesi' : 'Care Products', emoji: '🧴' },
        { name: language === 'tr' ? 'Aksesuarlar' : language === 'mk' ? 'Додатоци' : language === 'sq' ? 'Aksesorë' : 'Accessories', emoji: '🦴' },
        { name: language === 'tr' ? 'Kuş Yemi' : language === 'mk' ? 'Храна за Птици' : language === 'sq' ? 'Ushqim për Zogj' : 'Bird Food', emoji: '🐦' },
      ],
      extrasTitle: language === 'tr' ? 'Ürün Kategorileri' : language === 'mk' ? 'Категории на Производи' : language === 'sq' ? 'Kategoritë e Produkteve' : 'Product Categories'
    },
    'books-stationery': {
      icon: '📚',
      features: [
        { 
          icon: Package, 
          title: language === 'tr' ? 'Kitap Teslimatı' : language === 'mk' ? 'Достава на Книги' : language === 'sq' ? 'Dorëzim Librash' : 'Book Delivery',
          desc: language === 'tr' ? 'Kitaplar ve kırtasiye ürünleri' : language === 'mk' ? 'Книги и канцелариски производи' : language === 'sq' ? 'Libra dhe produkte zyre' : 'Books and stationery products',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
          desc: language === 'tr' ? 'Kitaplarınız 30 dakikada' : language === 'mk' ? 'Вашите книги за 30 минути' : language === 'sq' ? 'Librat tuaj për 30 minuta' : 'Your books in 30 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: Shield, 
          title: language === 'tr' ? 'Güvenli Paketleme' : language === 'mk' ? 'Безбедно Пакување' : language === 'sq' ? 'Paketim i Sigurt' : 'Safe Packaging',
          desc: language === 'tr' ? 'Kitaplarınız özel ambalajda' : language === 'mk' ? 'Вашите книги во специјално пакување' : language === 'sq' ? 'Librat tuaj në paketim të veçantë' : 'Your books in special packaging',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '20+', label: language === 'tr' ? 'Kitapçı' : language === 'mk' ? 'Книжарници' : language === 'sq' ? 'Librari' : 'Bookstores' },
        { value: '30', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '5K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      extras: [
        { name: language === 'tr' ? 'Roman' : language === 'mk' ? 'Романи' : language === 'sq' ? 'Romane' : 'Novels', emoji: '📖' },
        { name: language === 'tr' ? 'Ders Kitapları' : language === 'mk' ? 'Учебници' : language === 'sq' ? 'Libra Mësimore' : 'Textbooks', emoji: '📚' },
        { name: language === 'tr' ? 'Defterler' : language === 'mk' ? 'Тетратки' : language === 'sq' ? 'Fletore' : 'Notebooks', emoji: '📓' },
        { name: language === 'tr' ? 'Kalemler' : language === 'mk' ? 'Пенкала' : language === 'sq' ? 'Stilolapsa' : 'Pens', emoji: '✏️' },
        { name: language === 'tr' ? 'Sanat Malzemeleri' : language === 'mk' ? 'Уметнички Материјали' : language === 'sq' ? 'Materiale Artistike' : 'Art Supplies', emoji: '🎨' },
        { name: language === 'tr' ? 'Ofis Malzemeleri' : language === 'mk' ? 'Канцелариски Материјали' : language === 'sq' ? 'Materiale Zyre' : 'Office Supplies', emoji: '📎' },
      ],
      extrasTitle: language === 'tr' ? 'Ürün Kategorileri' : language === 'mk' ? 'Категории на Производи' : language === 'sq' ? 'Kategoritë e Produkteve' : 'Product Categories'
    },
  };

  return configs[slug] || configs['food-delivery'];
};

export default function CategoryPage() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams();
  const slug = params.slug || '';

  // Fetch category data from backend - this is the single source of truth
  const { data: category, isLoading, error } = trpc.categories.getBySlug.useQuery({ slug }, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour to prevent refetching
  });

  // Call all hooks BEFORE any conditional returns (React Rules of Hooks)
  // seoMeta comes as a JS object from tRPC (superjson), no JSON.parse needed
  const seoData = useSeoFromDatabase(category?.seoMeta || {});

  // Redirect to 404 if category not found
  useEffect(() => {
    if (!isLoading && !category && !error) {
      setLocation('/404');
    }
    if (error) {
      setLocation('/404');
    }
  }, [isLoading, category, error, setLocation]);

  // Prepare SEO data BEFORE conditional return (for Google bot)
  const currentUrl = `${BASE_URL}/categories/${slug}`;
  // seoMeta is already a JS object from tRPC - never JSON.parse it
  const seoMeta = (category?.seoMeta && typeof category.seoMeta === 'object') ? category.seoMeta as Record<string, any> : null;
  const content = seoMeta ? (seoMeta[language] || seoMeta.en || {}) : {};
  const finalTitle = seoData.title || content.title || '';
  const finalDescription = seoData.description || content.description || '';

  // Don't render content until data is loaded
  if (isLoading) {
    return (
      <>
        <meta name="prerender-status-code" content="200" />
        <SEOHead 
          title=""
          description=""
          keywords=""
          canonical={currentUrl}
          noindex={false}
        />
      </>
    );
  }

  // If category not found, show nothing (useEffect will redirect to 404)
  if (!category) {
    return null;
  }

  // Get static config only for features/icons (not for content)
  const config = getCategoryConfig(slug, language);

  // How it works steps
  const steps = [
    { 
      num: '01', 
      title: language === 'tr' ? 'Sipariş Oluştur' : language === 'mk' ? 'Креирај Нарачка' : language === 'sq' ? 'Krijo Porosi' : 'Create Order',
      desc: language === 'tr' ? 'Teslimat detaylarını girin ve sipariş oluşturun' : language === 'mk' ? 'Внесете ги деталите за достава и креирајте нарачка' : language === 'sq' ? 'Vendosni detajet e dorëzimit dhe krijoni porosinë' : 'Enter delivery details and create order'
    },
    { 
      num: '02', 
      title: language === 'tr' ? 'Kurye Atanır' : language === 'mk' ? 'Се Доделува Курир' : language === 'sq' ? 'Caktohet Korrier' : 'Courier Assigned',
      desc: language === 'tr' ? 'En yakın kurye otomatik olarak atanır' : language === 'mk' ? 'Најблискиот курир автоматски се доделува' : language === 'sq' ? 'Korrieri më i afërt caktohet automatikisht' : 'Nearest courier is automatically assigned'
    },
    { 
      num: '03', 
      title: language === 'tr' ? 'Teslimat Tamamlanır' : language === 'mk' ? 'Доставата се Завршува' : language === 'sq' ? 'Dorëzimi Përfundon' : 'Delivery Completed',
      desc: language === 'tr' ? 'Kurye teslimatı tamamlar ve onay alır' : language === 'mk' ? 'Курирот ја завршува доставата и добива потврда' : language === 'sq' ? 'Korrieri përfundon dorëzimin dhe merr konfirmimin' : 'Courier completes delivery and gets confirmation'
    },
  ];

  return (
    <>
      <meta name="prerender-status-code" content="200" />
      {/* Always render SEOHead for Google bot */}
      <SEOHead 
        title={finalTitle}
        description={finalDescription}
        keywords={seoData.keywords}
        canonical={currentUrl}
      />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30">
        <Header />
        
        <main role="main">
          {/* Hero Section */}
          <section className="relative py-16 md:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100/80 via-orange-50/50 to-amber-50/60" />
            <div className="absolute top-10 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
            
            <div className="container relative">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 mx-auto">
                  <span className="text-5xl">{config.icon}</span>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-orange-600 text-sm font-medium shadow-sm">
                  <Zap className="w-4 h-4" />
                  {language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery'} • 15 {t('minutes')}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                  {category?.shortName ? (typeof category.shortName === 'object' ? (category.shortName as Record<string, string>)[language] || (category.shortName as Record<string, string>).en : content.title) : content.title}
                </h1>
                
                {content.subtitle && (
                  <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
                    {content.subtitle}
                  </p>
                )}

                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {content.description}
                </p>

                {/* Stats Row */}
                {config.stats && (
                  <div className="flex flex-wrap justify-center gap-6 pt-4">
                    {config.stats.map((stat: any, idx: number) => (
                      <div key={idx} className="text-center px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-orange-100/50">
                        <div className="text-2xl font-bold text-orange-500">{stat.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    size="lg" 
                    className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => setLocation('/new-order')}
                  >
                    {t('orderNow')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-14 px-8 text-base font-semibold rounded-2xl border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-300"
                    onClick={() => setLocation('/how-it-works')}
                  >
                    {t('howItWorks')}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          {config.features && (
            <section className="py-14 bg-white">
              <div className="container">
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {config.features.map((feature: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 hover:shadow-md transition-all duration-300">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Extras Section (Cuisines/Products/Types) */}
          {config.extras && (
            <section className="py-12 bg-white">
              <div className="container">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
                  {config.extrasTitle}
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                  {config.extras.map((item: any, idx: number) => (
                    <div key={idx} className="text-center p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
                      <div className="text-4xl mb-2">{item.emoji}</div>
                      <div className="text-sm font-medium text-gray-700">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}



          {/* How It Works Section */}
          <section className="py-16 md:py-20 bg-gradient-to-br from-orange-50/60 to-amber-50/40 relative overflow-hidden">
            <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
            
            <div className="container relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-4">
                  <Clock className="w-4 h-4" />
                  {language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery'}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {t('howItWorks')}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-orange-100/50 h-full">
                      <div className="text-5xl font-bold text-orange-200 mb-4">{step.num}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                      <p className="text-gray-600 text-sm">{step.desc}</p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight className="w-8 h-8 text-orange-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>



          {/* CTA Section */}
          <section className="py-16 md:py-20 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="container relative text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold">{t('readyToOrder')}</h2>
              <p className="text-xl max-w-2xl mx-auto opacity-90">
                {language === 'tr' ? 'Hemen sipariş verin, 15 dakikada kapınızda!' : language === 'mk' ? 'Нарачајте сега, на врата за 15 минути!' : language === 'sq' ? 'Porosisni tani, në derë për 15 minuta!' : 'Order now, at your door in 15 minutes!'}
              </p>
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="h-14 px-10 text-lg font-semibold rounded-2xl bg-white text-orange-600 hover:bg-orange-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => setLocation('/new-order')}
                >
                  <Package className="mr-2 h-5 w-5" />
                  {t('startOrdering')}
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
