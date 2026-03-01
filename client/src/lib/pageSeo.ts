import { APP_TITLE } from "@/const";
import { Language } from "./i18n";

/**
 * Multi-language page-specific SEO meta tags
 * Updates document title and meta tags dynamically for each page and language
 */

interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  url?: string;
}

type MultiLangPageSEO = Record<Language, PageSEO>;

export const pageSeoData: Record<string, MultiLangPageSEO> = {
  home: {
    en: {
      title: `${APP_TITLE} - Food Delivery, Courier and Cargo Services in Skopje`,
      description: `Fast courier & delivery service in Skopje. Food, cargo, package delivery in 15 minutes. Real-time tracking, affordable prices. Order now with ${APP_TITLE}!`,
      keywords: "food delivery, courier service, Skopje, fast delivery, cargo delivery, Macedonia",
      image: "/og-home.jpg",
      url: "https://fastlygo.mk/"
    },
    tr: {
      title: `${APP_TITLE} - Yemek Teslimatı ve Kurye Hizmeti | Üsküp`,
      description: `Üsküp'te hızlı kurye ve teslimat hizmeti. Yemek, kargo, paket teslimatı 15 dakikada. Canlı takip, uygun fiyatlar. ${APP_TITLE} ile hemen sipariş verin!`,
      keywords: "yemek teslimatı, kurye hizmeti, Üsküp, hızlı teslimat, kargo teslimatı, Makedonya"
    },
    mk: {
      title: `${APP_TITLE} - Достава на Храна и Курирска Услуга | Скопје`,
      description: `Брза курирска и доставна услуга во Скопје. Храна, карго, пакети за 15 минути. Следење во реално време, достапни цени. Нарачајте со ${APP_TITLE}!`,
      keywords: "достава на храна, курирска услуга, Скопје, брза достава, карго достава, Македонија"
    },
    sq: {
      title: `${APP_TITLE} - Shërbim Dërgese Ushqimi dhe Korrier | Shkup`,
      description: `Shërbim i shpejtë korrier dhe dërgese në Shkup. Ushqim, kargo, paketa në 15 minuta. Gjurmim në kohë reale, çmime të përballueshme. Porosit me ${APP_TITLE}!`,
      keywords: "dërgim ushqimi, shërbim korrier, Shkup, dërgim i shpejtë, dërgim kargo, Maqedoni"
    }
  },
  howItWorks: {
    en: {
      title: `How It Works - ${APP_TITLE} Delivery Process | Skopje`,
      description: `Learn how ${APP_TITLE} delivery works. Simple 4-step process: Order online, courier accepts, real-time tracking, delivery in 15 minutes. Fast & reliable.`,
      keywords: "delivery process, how to order, courier tracking, fast delivery, order steps, Skopje",
      image: "/og-how-it-works.jpg",
      url: "https://fastlygo.mk/how-it-works"
    },
    tr: {
      title: `Nasıl Çalışır - ${APP_TITLE} Teslimat Süreci | Üsküp`,
      description: `${APP_TITLE} teslimat nasıl çalışır öğrenin. Basit 4 adım: Online sipariş, kurye kabul eder, canlı takip, 15 dakikada teslimat. Hızlı ve güvenilir.`,
      keywords: "teslimat süreci, nasıl sipariş verilir, kurye takibi, hızlı teslimat, sipariş adımları, Üsküp"
    },
    mk: {
      title: `Како Функционира - ${APP_TITLE} Процес на Достава | Скопје`,
      description: `Дознајте како функционира доставата на ${APP_TITLE}. Едноставен процес од 4 чекори: Нарачка онлајн, курирот прифаќа, следење во реално време, достава за 15 минути.`,
      keywords: "процес на достава, како да нарачам, следење курир, брза достава, чекори за нарачка, Скопје"
    },
    sq: {
      title: `Si Funksionon - ${APP_TITLE} Procesi i Dërgimit | Shkup`,
      description: `Mëso si funksionon dërgimi me ${APP_TITLE}. Proces i thjeshtë me 4 hapa: Porosit online, korrier pranon, gjurmim në kohë reale, dërgim në 15 minuta.`,
      keywords: "proces dërgimi, si të porosisësh, gjurmim korrier, dërgim i shpejtë, hapa porosie, Shkup"
    }
  },
  aboutUs: {
    en: {
      title: `About Us - ${APP_TITLE} | Leading Courier Service in Skopje`,
      description: `Learn about ${APP_TITLE}, Skopje's leading courier service. 10+ years experience, 50,000+ deliveries, 4.8/5 rating. Fast, reliable food & package delivery.`,
      keywords: "about fastlygo, courier company, delivery service, Skopje Macedonia, fast delivery",
      image: "/og-about.jpg",
      url: "https://fastlygo.mk/about-us"
    },
    tr: {
      title: `Hakkımızda - ${APP_TITLE} | Üsküp'ün Lider Kurye Hizmeti`,
      description: `${APP_TITLE} hakkında bilgi edinin, Üsküp'ün lider kurye hizmeti. 10+ yıl deneyim, 50.000+ teslimat, 4.8/5 puan. Hızlı, güvenilir yemek ve paket teslimatı.`,
      keywords: "hakkımızda, kurye şirketi, teslimat hizmeti, Üsküp Makedonya, hızlı teslimat"
    },
    mk: {
      title: `За Нас - ${APP_TITLE} | Водечка Курирска Услуга во Скопје`,
      description: `Дознајте за ${APP_TITLE}, водечката курирска услуга во Скопје. 10+ години искуство, 50.000+ достави, оценка 4.8/5. Брза, сигурна достава на храна и пакети.`,
      keywords: "за нас, курирска компанија, услуга за достава, Скопје Македонија, брза достава"
    },
    sq: {
      title: `Rreth Nesh - ${APP_TITLE} | Shërbimi Kryesor i Korrier në Shkup`,
      description: `Mëso rreth ${APP_TITLE}, shërbimi kryesor i korrier në Shkup. 10+ vjet përvojë, 50,000+ dërgesa, vlerësim 4.8/5. Dërgim i shpejtë dhe i besueshëm.`,
      keywords: "rreth nesh, kompani korrier, shërbim dërgese, Shkup Maqedoni, dërgim i shpejtë"
    }
  },
  order: {
    en: {
      title: `Order Delivery - ${APP_TITLE} | Fast Courier Service Skopje`,
      description: `Order fast delivery in Skopje with ${APP_TITLE}. Food, packages, cargo delivered in 15 minutes. Real-time tracking, affordable prices. Call courier now!`,
      keywords: "order delivery, courier service, fast delivery, Skopje, package delivery, food delivery",
      image: "/og-order.jpg",
      url: "https://fastlygo.mk/new-order"
    },
    tr: {
      title: `Sipariş Ver - ${APP_TITLE} | Hızlı Kurye Hizmeti Üsküp`,
      description: `${APP_TITLE} ile Üsküp'te hızlı teslimat sipariş edin. Yemek, paket, kargo 15 dakikada teslim. Canlı takip, uygun fiyatlar. Hemen kurye çağırın!`,
      keywords: "sipariş ver, kurye hizmeti, hızlı teslimat, Üsküp, paket teslimatı, yemek teslimatı"
    },
    mk: {
      title: `Нарачај Достава - ${APP_TITLE} | Брза Курирска Услуга Скопје`,
      description: `Нарачајте брза достава во Скопје со ${APP_TITLE}. Храна, пакети, карго доставени за 15 минути. Следење во реално време, достапни цени. Повикајте курир сега!`,
      keywords: "нарачај достава, курирска услуга, брза достава, Скопје, достава пакети, достава храна"
    },
    sq: {
      title: `Porosit Dërgim - ${APP_TITLE} | Shërbim i Shpejtë Korrier Shkup`,
      description: `Porosit dërgim të shpejtë në Shkup me ${APP_TITLE}. Ushqim, paketa, kargo të dërguara në 15 minuta. Gjurmim në kohë reale, çmime të përballueshme. Thirr korrier tani!`,
      keywords: "porosit dërgim, shërbim korrier, dërgim i shpejtë, Shkup, dërgim paketash, dërgim ushqimi"
    }
  },
  courierRegister: {
    en: {
      title: `Become a Courier - Earn Money with ${APP_TITLE} | Skopje`,
      description: `Join ${APP_TITLE} as a courier in Skopje. Flexible hours, daily payments, earn up to 1000€/month. Register now and start delivering today!`,
      keywords: "become courier, delivery jobs, earn money, flexible work, Skopje jobs, courier registration"
    },
    tr: {
      title: `Kurye Ol - ${APP_TITLE} ile Para Kazan | Üsküp`,
      description: `${APP_TITLE}'da Üsküp'te kurye olarak katılın. Esnek saatler, günlük ödemeler, ayda 1000€'ya kadar kazanç. Hemen kaydolun ve bugün teslimat yapmaya başlayın!`,
      keywords: "kurye ol, teslimat işleri, para kazan, esnek çalışma, Üsküp işleri, kurye kaydı"
    },
    mk: {
      title: `Стани Курир - Заработи Пари со ${APP_TITLE} | Скопје`,
      description: `Придружи се на ${APP_TITLE} како курир во Скопје. Флексибилни часови, дневни плаќања, заработи до 1000€/месец. Регистрирај се сега и почни да доставуваш денес!`,
      keywords: "стани курир, работи за достава, заработи пари, флексибилна работа, работи Скопје, регистрација курир"
    },
    sq: {
      title: `Bëhu Korrier - Fito Para me ${APP_TITLE} | Shkup`,
      description: `Bashkohu me ${APP_TITLE} si korrier në Shkup. Orë fleksibël, pagesa ditore, fito deri në 1000€/muaj. Regjistrohu tani dhe fillo të dërgosh sot!`,
      keywords: "bëhu korrier, punë dërgimi, fito para, punë fleksibël, punë Shkup, regjistrim korrier"
    }
  },
  businessRegister: {
    en: {
      title: `Business Partnership - ${APP_TITLE} Delivery Solutions | Skopje`,
      description: `Partner with ${APP_TITLE} for your business delivery needs. Restaurants, pharmacies, retail stores. Fast, reliable delivery service in Skopje.`,
      keywords: "business delivery, restaurant delivery, pharmacy courier, retail delivery, Skopje business"
    },
    tr: {
      title: `İşletme Ortaklığı - ${APP_TITLE} Teslimat Çözümleri | Üsküp`,
      description: `İşletmenizin teslimat ihtiyaçları için ${APP_TITLE} ile ortaklık kurun. Restoranlar, eczaneler, perakende mağazaları. Üsküp'te hızlı, güvenilir teslimat hizmeti.`,
      keywords: "işletme teslimatı, restoran teslimatı, eczane kuryesi, perakende teslimatı, Üsküp işletme"
    },
    mk: {
      title: `Деловно Партнерство - ${APP_TITLE} Решенија за Достава | Скопје`,
      description: `Партнерирајте со ${APP_TITLE} за вашите деловни потреби за достава. Ресторани, аптеки, малопродажни продавници. Брза, сигурна услуга за достава во Скопје.`,
      keywords: "деловна достава, достава ресторан, курир аптека, малопродажна достава, бизнис Скопје"
    },
    sq: {
      title: `Partneritet Biznesi - ${APP_TITLE} Zgjidhje Dërgimi | Shkup`,
      description: `Partnerizo me ${APP_TITLE} për nevojat e dërgimit të biznesit tuaj. Restorante, farmaci, dyqane me pakicë. Shërbim i shpejtë dhe i besueshëm dërgimi në Shkup.`,
      keywords: "dërgim biznesi, dërgim restorant, korrier farmaci, dërgim me pakicë, biznes Shkup"
    }
  },
  login: {
    en: {
      title: `Login - ${APP_TITLE} | Access Your Account`,
      description: `Login to your ${APP_TITLE} account. Track orders, manage deliveries, view history. Secure access for customers, couriers, and businesses.`,
      keywords: "login, sign in, account access, courier login, business login, customer login"
    },
    tr: {
      title: `Giriş Yap - ${APP_TITLE} | Hesabınıza Erişin`,
      description: `${APP_TITLE} hesabınıza giriş yapın. Siparişleri takip edin, teslimatları yönetin, geçmişi görüntüleyin. Müşteriler, kuryeler ve işletmeler için güvenli erişim.`,
      keywords: "giriş yap, oturum aç, hesap erişimi, kurye girişi, işletme girişi, müşteri girişi"
    },
    mk: {
      title: `Најави се - ${APP_TITLE} | Пристап до Вашата Сметка`,
      description: `Најавете се на вашата ${APP_TITLE} сметка. Следете нарачки, управувајте со достави, прегледајте историја. Безбеден пристап за клиенти, курири и бизниси.`,
      keywords: "најава, влез, пристап до сметка, најава курир, најава бизнис, најава клиент"
    },
    sq: {
      title: `Hyr - ${APP_TITLE} | Qasje në Llogarinë Tuaj`,
      description: `Hyni në llogarinë tuaj ${APP_TITLE}. Gjurmoni porositë, menaxhoni dërgesat, shikoni historikun. Qasje e sigurt për klientë, korrier dhe biznese.`,
      keywords: "hyrje, kyçje, qasje në llogari, hyrje korrier, hyrje biznesi, hyrje klienti"
    }
  },
  register: {
    en: {
      title: `Register - ${APP_TITLE} | Create New Account`,
      description: `Create your ${APP_TITLE} account. Join thousands of users enjoying fast delivery. Quick registration for customers, couriers, and businesses.`,
      keywords: "register, sign up, create account, new account, join fastlygo, courier signup"
    },
    tr: {
      title: `Kayıt Ol - ${APP_TITLE} | Yeni Hesap Oluştur`,
      description: `${APP_TITLE} hesabınızı oluşturun. Hızlı teslimatın keyfini çıkaran binlerce kullanıcıya katılın. Müşteriler, kuryeler ve işletmeler için hızlı kayıt.`,
      keywords: "kayıt ol, üye ol, hesap oluştur, yeni hesap, fastlygo katıl, kurye kaydı"
    },
    mk: {
      title: `Регистрирај се - ${APP_TITLE} | Креирај Нова Сметка`,
      description: `Креирајте ваша ${APP_TITLE} сметка. Придружете се на илјадници корисници кои уживаат во брза достава. Брза регистрација за клиенти, курири и бизниси.`,
      keywords: "регистрација, зачленување, креирај сметка, нова сметка, придружи се fastlygo, регистрација курир"
    },
    sq: {
      title: `Regjistrohu - ${APP_TITLE} | Krijo Llogari të Re`,
      description: `Krijo llogarinë tënde ${APP_TITLE}. Bashkohu me mijëra përdorues që gëzojnë dërgim të shpejtë. Regjistrim i shpejtë për klientë, korrier dhe biznese.`,
      keywords: "regjistrim, kyçje, krijo llogari, llogari e re, bashkohu fastlygo, regjistrim korrier"
    }
  }
};

/**
 * Update page SEO meta tags with language support
 * @param page - Page identifier (home, howItWorks, aboutUs, etc.)
 * @param language - Current language (en, tr, mk, sq)
 */
export function updatePageSEO(page: keyof typeof pageSeoData, language: Language = 'en') {
  const pageSeo = pageSeoData[page];
  
  if (!pageSeo) {
    console.warn(`SEO data not found for page: ${page}`);
    return;
  }

  const seo = pageSeo[language];
  
  if (!seo) {
    console.warn(`SEO data not found for language: ${language} on page: ${page}`);
    return;
  }

  // Update document title
  document.title = seo.title;

  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', seo.description);

  // Update meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', seo.keywords);

  // Update Open Graph title (always use English for social media)
  const englishSeo = pageSeo['en'];
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', englishSeo.title);

  // Update Open Graph description (always use English for social media)
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (!ogDescription) {
    ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    document.head.appendChild(ogDescription);
  }
  ogDescription.setAttribute('content', englishSeo.description);

  // Update Twitter title (always use English for social media)
  let twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (!twitterTitle) {
    twitterTitle = document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    document.head.appendChild(twitterTitle);
  }
  twitterTitle.setAttribute('content', englishSeo.title);

  // Update Twitter description (always use English for social media)
  let twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (!twitterDescription) {
    twitterDescription = document.createElement('meta');
    twitterDescription.setAttribute('name', 'twitter:description');
    document.head.appendChild(twitterDescription);
  }
  twitterDescription.setAttribute('content', englishSeo.description);

  // Update Open Graph image (if available)
  if (englishSeo.image) {
    const baseUrl = 'https://fastlygo.mk';
    const imageUrl = `${baseUrl}${englishSeo.image}`;
    
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', imageUrl);
    
    // Twitter card image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', imageUrl);
    
    // Twitter card type
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');
  }

  // Update Open Graph URL (if available)
  if (englishSeo.url) {
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', englishSeo.url);
  }

  // Update Open Graph type
  let ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType) {
    ogType = document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    document.head.appendChild(ogType);
  }
  ogType.setAttribute('content', 'website');

  // Update Open Graph site name
  let ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (!ogSiteName) {
    ogSiteName = document.createElement('meta');
    ogSiteName.setAttribute('property', 'og:site_name');
    document.head.appendChild(ogSiteName);
  }
  ogSiteName.setAttribute('content', APP_TITLE);

  // Update hreflang tags
  updateHreflangTags(page, language);

  // Update canonical URL
  updateCanonicalURL(page);
}

/**
 * Update hreflang tags for multi-language SEO
 * Tells search engines about language/region variants of the page
 * @param page - Page identifier
 * @param currentLanguage - Current language
 */
function updateHreflangTags(page: keyof typeof pageSeoData, currentLanguage: Language) {
  // Remove existing hreflang tags
  const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingHreflangs.forEach(tag => tag.remove());

  // Base URL (production domain)
  const baseUrl = 'https://fastlygo.mk';

  // Page paths
  const pagePaths: Record<string, string> = {
    home: '/',
    howItWorks: '/how-it-works',
    aboutUs: '/about-us',
    order: '/order',
    courierRegister: '/courier-register',
    businessRegister: '/business/register',
    login: '/login',
    register: '/register'
  };

  const pagePath = pagePaths[page] || '/';

  // Language codes for hreflang
  const languages: Language[] = ['en', 'tr', 'mk', 'sq'];

  // Add hreflang tag for each language
  languages.forEach(lang => {
    const hreflangTag = document.createElement('link');
    hreflangTag.setAttribute('rel', 'alternate');
    hreflangTag.setAttribute('hreflang', lang);
    hreflangTag.setAttribute('href', `${baseUrl}${pagePath}?lang=${lang}`);
    document.head.appendChild(hreflangTag);
  });

  // Add x-default hreflang (fallback for unmatched languages)
  const xDefaultTag = document.createElement('link');
  xDefaultTag.setAttribute('rel', 'alternate');
  xDefaultTag.setAttribute('hreflang', 'x-default');
  xDefaultTag.setAttribute('href', `${baseUrl}${pagePath}`);
  document.head.appendChild(xDefaultTag);
}

/**
 * Update canonical URL tag for duplicate content prevention
 * Points to the main domain (fastlygo.mk) without query parameters
 * @param page - Page identifier
 */
function updateCanonicalURL(page: keyof typeof pageSeoData) {
  // Remove existing canonical tag
  const existingCanonical = document.querySelector('link[rel="canonical"]');
  if (existingCanonical) {
    existingCanonical.remove();
  }

  // Base URL (production domain - always HTTPS)
  const baseUrl = 'https://fastlygo.mk';

  // Page paths
  const pagePaths: Record<string, string> = {
    home: '/',
    howItWorks: '/how-it-works',
    aboutUs: '/about-us',
    order: '/order',
    courierRegister: '/courier-register',
    businessRegister: '/business/register',
    login: '/login',
    register: '/register'
  };

  const pagePath = pagePaths[page] || '/';

  // Create canonical URL tag (without query parameters like ?lang=tr)
  const canonicalTag = document.createElement('link');
  canonicalTag.setAttribute('rel', 'canonical');
  canonicalTag.setAttribute('href', `${baseUrl}${pagePath}`);
  document.head.appendChild(canonicalTag);
}
