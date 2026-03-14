import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";
export default function TermsOfService() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { data: pageData, isLoading: isPageLoading } = trpc.pages.getBySlug.useQuery({ slug: 'terms' }, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const seoData = useSeoFromDatabase(pageData?.seoMeta);
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - FastlyGo",
    "description": "FastlyGo terms of service and usage conditions"
  };

  const content = {
    tr: {
      title: "Kullanım Koşulları",
      lastUpdated: "Son Güncelleme: 17 Aralık 2024",
      sections: [
        {
          title: "1. Hizmet Tanımı",
          content: "FastlyGo, Kuzey Makedonya'da faaliyet gösteren bir kurye ve teslimat platformudur. Platformumuz, müşteriler ile kuryeler arasında aracılık hizmeti sunmaktadır."
        },
        {
          title: "2. Kullanıcı Sorumlulukları",
          content: "Kullanıcılar, platformu kullanırken doğru ve güncel bilgiler sağlamakla yükümlüdür. Teslimat adreslerinin doğru olması, paket içeriğinin yasalara uygun olması kullanıcının sorumluluğundadır."
        },
        {
          title: "3. Teslimat Koşulları",
          content: "Teslimat süreleri tahminidir ve trafik, hava koşulları gibi faktörlerden etkilenebilir. Kurye, teslimat sırasında alıcının kimliğini doğrulama hakkına sahiptir."
        },
        {
          title: "4. Ödeme ve Fiyatlandırma",
          content: "Teslimat ücretleri mesafe, paket boyutu ve aciliyet durumuna göre hesaplanır. Ödeme, gönderici veya alıcı tarafından nakit veya kart ile yapılabilir."
        },
        {
          title: "5. İptal ve İade Politikası",
          content: "Sipariş, kurye tarafından kabul edilmeden önce ücretsiz iptal edilebilir. Kurye kabul ettikten sonra iptal durumunda ücret iadesi yapılmaz."
        },
        {
          title: "6. Sorumluluk Sınırlamaları",
          content: "FastlyGo, paket içeriğinden sorumlu değildir. Değerli eşyalar için ek sigorta önerilir. Platform, hizmet kesintilerinden kaynaklanan zararlardan sorumlu tutulamaz."
        },
        {
          title: "7. Gizlilik ve Veri Koruma",
          content: "Kullanıcı verileri, Gizlilik Politikamız kapsamında korunur ve işlenir. Kişisel veriler, yalnızca hizmet sunumu amacıyla kullanılır."
        },
        {
          title: "8. Değişiklikler",
          content: "FastlyGo, bu kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar. Değişiklikler web sitesinde yayınlandığı anda yürürlüğe girer."
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: December 17, 2024",
      sections: [
        {
          title: "1. Service Definition",
          content: "FastlyGo is a courier and delivery platform operating in North Macedonia. Our platform provides intermediary services between customers and couriers."
        },
        {
          title: "2. User Responsibilities",
          content: "Users are obligated to provide accurate and up-to-date information when using the platform. It is the user's responsibility to ensure delivery addresses are correct and package contents comply with laws."
        },
        {
          title: "3. Delivery Terms",
          content: "Delivery times are estimates and may be affected by factors such as traffic and weather conditions. Couriers have the right to verify the recipient's identity during delivery."
        },
        {
          title: "4. Payment and Pricing",
          content: "Delivery fees are calculated based on distance, package size, and urgency. Payment can be made by sender or recipient via cash or card."
        },
        {
          title: "5. Cancellation and Refund Policy",
          content: "Orders can be cancelled free of charge before acceptance by the courier. No refund will be issued if cancelled after courier acceptance."
        },
        {
          title: "6. Liability Limitations",
          content: "FastlyGo is not responsible for package contents. Additional insurance is recommended for valuable items. The platform cannot be held liable for damages resulting from service interruptions."
        },
        {
          title: "7. Privacy and Data Protection",
          content: "User data is protected and processed under our Privacy Policy. Personal data is used solely for service provision purposes."
        },
        {
          title: "8. Changes",
          content: "FastlyGo reserves the right to modify these terms of service without prior notice. Changes take effect immediately upon publication on the website."
        }
      ]
    },
    mk: {
      title: "Услови за користење",
      lastUpdated: "Последно ажурирање: 17 декември 2024",
      sections: [
        {
          title: "1. Дефиниција на услугата",
          content: "FastlyGo е платформа за курирски и достава услуги која работи во Северна Македонија. Нашата платформа обезбедува посреднички услуги помеѓу клиентите и куририте."
        },
        {
          title: "2. Одговорности на корисниците",
          content: "Корисниците се обврзани да обезбедат точни и ажурирани информации при користење на платформата. Одговорност на корисникот е да обезбеди точни адреси за достава и содржината на пакетот да биде во согласност со законите."
        },
        {
          title: "3. Услови за достава",
          content: "Времињата за достава се проценки и можат да бидат под влијание на фактори како сообраќај и временски услови. Куририте имаат право да го потврдат идентитетот на примачот при достава."
        },
        {
          title: "4. Плаќање и ценовник",
          content: "Трошоците за достава се пресметуваат врз основа на растојание, големина на пакетот и итност. Плаќањето може да се изврши од страна на испраќачот или примачот преку готовина или картичка."
        },
        {
          title: "5. Политика за откажување и рефундација",
          content: "Нарачките можат да се откажат бесплатно пред прифаќање од страна на курирот. Нема да биде издадена рефундација доколку се откаже по прифаќањето од курирот."
        },
        {
          title: "6. Ограничувања на одговорност",
          content: "FastlyGo не е одговорен за содржината на пакетот. Се препорачува дополнително осигурување за вредни предмети. Платформата не може да биде одговорна за штети настанати од прекини на услугата."
        },
        {
          title: "7. Приватност и заштита на податоци",
          content: "Податоците на корисниците се заштитени и обработени согласно нашата Политика за приватност. Личните податоци се користат исклучиво за целите на обезбедување услуга."
        },
        {
          title: "8. Измени",
          content: "FastlyGo го задржува правото да ги измени овие услови за користење без претходна најава. Измените стапуваат на сила веднаш по објавувањето на веб-страницата."
        }
      ]
    },
    sq: {
      title: "Kushtet e Shërbimit",
      lastUpdated: "Përditësimi i fundit: 17 dhjetor 2024",
      sections: [
        {
          title: "1. Përkufizimi i Shërbimit",
          content: "FastlyGo është një platformë korieri dhe dërgese që operon në Maqedoninë e Veriut. Platforma jonë ofron shërbime ndërmjetësuese midis klientëve dhe korierëve."
        },
        {
          title: "2. Përgjegjësitë e Përdoruesit",
          content: "Përdoruesit janë të detyruar të ofrojnë informacion të saktë dhe të përditësuar kur përdorin platformën. Është përgjegjësi e përdoruesit të sigurojë që adresat e dërgesës të jenë të sakta dhe përmbajtja e paketës të jetë në përputhje me ligjet."
        },
        {
          title: "3. Kushtet e Dërgesës",
          content: "Kohët e dërgesës janë vlerësime dhe mund të ndikohen nga faktorë si trafiku dhe kushtet e motit. Korierët kanë të drejtë të verifikojnë identitetin e marrësit gjatë dërgesës."
        },
        {
          title: "4. Pagesa dhe Çmimi",
          content: "Tarifat e dërgesës llogariten bazuar në distancë, madhësi të paketës dhe urgjencë. Pagesa mund të bëhet nga dërguesi ose marrësi përmes parasë në dorë ose kartës."
        },
        {
          title: "5. Politika e Anulimit dhe Rimbursimit",
          content: "Porositë mund të anulohen pa pagesë para pranimit nga korieri. Nuk do të lëshohet rimbursim nëse anulohet pas pranimit nga korieri."
        },
        {
          title: "6. Kufizimet e Përgjegjësisë",
          content: "FastlyGo nuk është përgjegjës për përmbajtjen e paketës. Rekomandohet sigurimi shtesë për artikuj me vlerë. Platforma nuk mund të mbahet përgjegjëse për dëmet që rrjedhin nga ndërprerjet e shërbimit."
        },
        {
          title: "7. Privatësia dhe Mbrojtja e të Dhënave",
          content: "Të dhënat e përdoruesve mbrohen dhe përpunohen sipas Politikës sonë të Privatësisë. Të dhënat personale përdoren vetëm për qëllime të ofrimit të shërbimit."
        },
        {
          title: "8. Ndryshimet",
          content: "FastlyGo rezervon të drejtën për të modifikuar këto kushte shërbimi pa njoftim paraprak. Ndryshimet hyjnë në fuqi menjëherë pas publikimit në faqen e internetit."
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-orange-50/20">
      <SEOHead 
        title={seoData.title || ''}
        description={seoData.description || ''}
        keywords={seoData.keywords}
        structuredData={structuredData}
        isLoading={isPageLoading}
      />
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {currentContent.title}
          </h1>
          <p className="text-gray-600 mb-12">{currentContent.lastUpdated}</p>

          <div className="space-y-8">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-orange-50 rounded-2xl border border-orange-100">
            <p className="text-gray-700">
              {language === 'tr' && "Bu kullanım koşulları hakkında sorularınız varsa, lütfen bizimle iletişime geçin."}
              {language === 'en' && "If you have any questions about these terms of service, please contact us."}
              {language === 'mk' && "Доколку имате прашања во врска со овие услови за користење, ве молиме контактирајте не."}
              {language === 'sq' && "Nëse keni ndonjë pyetje në lidhje me këto kushte shërbimi, ju lutemi na kontaktoni."}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
