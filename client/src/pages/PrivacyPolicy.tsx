import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  // Static SEO data
  const seoData = {
    title: 'Privacy Policy - FastlyGo Courier & Delivery Service',
    description: 'FastlyGo privacy policy and data protection information. Learn how we collect, use, and protect your personal data.',
    keywords: 'privacy policy, data protection, FastlyGo, courier service'
  };
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - FastlyGo",
    "description": "FastlyGo privacy policy and data protection information"
  };

  const content = {
    tr: {
      title: "Gizlilik Politikası",
      lastUpdated: "Son Güncelleme: 17 Aralık 2024",
      sections: [
        {
          title: "1. Toplanan Bilgiler",
          content: "FastlyGo olarak, hizmetlerimizi sunabilmek için ad, soyad, e-posta adresi, telefon numarası, teslimat adresleri ve ödeme bilgileri gibi kişisel verilerinizi toplarız. Ayrıca, platformu kullanımınız sırasında IP adresi, tarayıcı türü ve kullanım istatistikleri gibi teknik veriler de toplanabilir."
        },
        {
          title: "2. Bilgilerin Kullanımı",
          content: "Toplanan bilgiler, teslimat hizmetlerinin sağlanması, sipariş takibi, müşteri desteği, ödeme işlemleri ve platformun iyileştirilmesi amacıyla kullanılır. Kişisel verileriniz, yasal zorunluluklar dışında üçüncü şahıslarla paylaşılmaz."
        },
        {
          title: "3. Veri Güvenliği",
          content: "Kişisel verilerinizin güvenliği bizim için önceliklidir. Verilerinizi korumak için endüstri standartlarında şifreleme ve güvenlik önlemleri kullanıyoruz. Ancak, internet üzerinden yapılan hiçbir veri iletiminin %100 güvenli olmadığını unutmayın."
        },
        {
          title: "4. Çerezler (Cookies)",
          content: "Web sitemiz, kullanıcı deneyimini iyileştirmek ve site kullanımını analiz etmek için çerezler kullanır. Tarayıcı ayarlarınızdan çerezleri yönetebilir veya reddedebilirsiniz, ancak bu durumda bazı site özellikleri düzgün çalışmayabilir."
        },
        {
          title: "5. Üçüncü Taraf Hizmetler",
          content: "Platformumuz, ödeme işlemleri ve harita hizmetleri gibi üçüncü taraf hizmet sağlayıcılarını kullanabilir. Bu hizmet sağlayıcıların kendi gizlilik politikaları vardır ve verilerinizi kendi politikaları doğrultusunda işlerler."
        },
        {
          title: "6. Kullanıcı Hakları",
          content: "Kişisel verilerinize erişim, düzeltme, silme veya işlenmesini kısıtlama hakkına sahipsiniz. Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz."
        },
        {
          title: "7. Veri Saklama Süresi",
          content: "Kişisel verileriniz, hizmet sunumu için gerekli olduğu sürece veya yasal zorunluluklar gerektirdiği sürece saklanır. Artık gerekli olmayan veriler güvenli bir şekilde silinir."
        },
        {
          title: "8. Politika Değişiklikleri",
          content: "Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler yapıldığında, web sitemiz üzerinden veya e-posta yoluyla bilgilendirileceksiniz."
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: December 17, 2024",
      sections: [
        {
          title: "1. Information Collected",
          content: "As FastlyGo, we collect personal data such as name, surname, email address, phone number, delivery addresses, and payment information to provide our services. Additionally, technical data such as IP address, browser type, and usage statistics may be collected during your use of the platform."
        },
        {
          title: "2. Use of Information",
          content: "The collected information is used for providing delivery services, order tracking, customer support, payment processing, and platform improvement. Your personal data will not be shared with third parties except for legal obligations."
        },
        {
          title: "3. Data Security",
          content: "The security of your personal data is our priority. We use industry-standard encryption and security measures to protect your data. However, please note that no data transmission over the internet is 100% secure."
        },
        {
          title: "4. Cookies",
          content: "Our website uses cookies to improve user experience and analyze site usage. You can manage or reject cookies through your browser settings, but some site features may not function properly in this case."
        },
        {
          title: "5. Third-Party Services",
          content: "Our platform may use third-party service providers such as payment processors and map services. These service providers have their own privacy policies and process your data according to their own policies."
        },
        {
          title: "6. User Rights",
          content: "You have the right to access, correct, delete, or restrict the processing of your personal data. You can contact us to exercise these rights."
        },
        {
          title: "7. Data Retention Period",
          content: "Your personal data is retained as long as necessary for service provision or as required by legal obligations. Data that is no longer necessary is securely deleted."
        },
        {
          title: "8. Policy Changes",
          content: "We may update this privacy policy from time to time. When significant changes are made, you will be notified through our website or via email."
        }
      ]
    },
    mk: {
      title: "Политика за приватност",
      lastUpdated: "Последно ажурирање: 17 декември 2024",
      sections: [
        {
          title: "1. Собрани информации",
          content: "Како FastlyGo, ние собираме лични податоци како име, презиме, е-пошта, телефонски број, адреси за достава и информации за плаќање за да ги обезбедиме нашите услуги. Дополнително, технички податоци како IP адреса, тип на прелистувач и статистики за користење може да се собираат за време на вашето користење на платформата."
        },
        {
          title: "2. Користење на информации",
          content: "Собраните информации се користат за обезбедување услуги за достава, следење на нарачки, корисничка поддршка, обработка на плаќања и подобрување на платформата. Вашите лични податоци нема да бидат споделени со трети страни освен за законски обврски."
        },
        {
          title: "3. Безбедност на податоци",
          content: "Безбедноста на вашите лични податоци е наш приоритет. Користиме индустриски стандарди за шифрирање и безбедносни мерки за заштита на вашите податоци. Сепак, ве молиме да имате предвид дека ниту еден пренос на податоци преку интернет не е 100% безбеден."
        },
        {
          title: "4. Колачиња (Cookies)",
          content: "Нашата веб-страница користи колачиња за подобрување на корисничкото искуство и анализа на користењето на страницата. Можете да ги управувате или одбиете колачињата преку поставките на вашиот прелистувач, но некои функции на страницата може да не функционираат правилно во тој случај."
        },
        {
          title: "5. Услуги од трети страни",
          content: "Нашата платформа може да користи давателите на услуги од трети страни како процесори на плаќање и услуги за карти. Овие даватели на услуги имаат свои политики за приватност и ги обработуваат вашите податоци според нивните политики."
        },
        {
          title: "6. Права на корисниците",
          content: "Имате право да пристапите, коригирате, избришете или ограничите обработката на вашите лични податоци. Можете да не контактирате за да ги остварите овие права."
        },
        {
          title: "7. Период на чување на податоци",
          content: "Вашите лични податоци се чуваат додека е потребно за обезбедување услуга или како што бараат законските обврски. Податоците кои повеќе не се потребни се безбедно избришани."
        },
        {
          title: "8. Промени на политиката",
          content: "Можеме да ја ажурираме оваа политика за приватност од време на време. Кога ќе се направат значајни промени, ќе бидете известени преку нашата веб-страница или преку е-пошта."
        }
      ]
    },
    sq: {
      title: "Politika e Privatësisë",
      lastUpdated: "Përditësimi i fundit: 17 dhjetor 2024",
      sections: [
        {
          title: "1. Informacioni i Mbledhur",
          content: "Si FastlyGo, ne mbledhim të dhëna personale si emri, mbiemri, adresa e emailit, numri i telefonit, adresat e dërgesës dhe informacionin e pagesës për të ofruar shërbimet tona. Për më tepër, të dhëna teknike si adresa IP, lloji i shfletuesit dhe statistikat e përdorimit mund të mblidhen gjatë përdorimit tuaj të platformës."
        },
        {
          title: "2. Përdorimi i Informacionit",
          content: "Informacioni i mbledhur përdoret për ofrimin e shërbimeve të dërgesës, ndjekjen e porosive, mbështetjen e klientit, përpunimin e pagesave dhe përmirësimin e platformës. Të dhënat tuaja personale nuk do të ndahen me palë të treta përveç për detyrime ligjore."
        },
        {
          title: "3. Siguria e të Dhënave",
          content: "Siguria e të dhënave tuaja personale është prioriteti ynë. Ne përdorim standarde industriale të enkriptimit dhe masat e sigurisë për të mbrojtur të dhënat tuaja. Megjithatë, ju lutemi vini re se asnjë transmetim i të dhënave përmes internetit nuk është 100% i sigurt."
        },
        {
          title: "4. Cookies",
          content: "Faqja jonë e internetit përdor cookies për të përmirësuar përvojën e përdoruesit dhe për të analizuar përdorimin e faqes. Ju mund t'i menaxhoni ose refuzoni cookies përmes cilësimeve të shfletuesit tuaj, por disa veçori të faqes mund të mos funksionojnë siç duhet në këtë rast."
        },
        {
          title: "5. Shërbimet e Palëve të Treta",
          content: "Platforma jonë mund të përdorë ofrues shërbimesh të palëve të treta si procesorët e pagesave dhe shërbimet e hartave. Këta ofrues shërbimesh kanë politikat e tyre të privatësisë dhe përpunojnë të dhënat tuaja sipas politikave të tyre."
        },
        {
          title: "6. Të Drejtat e Përdoruesit",
          content: "Ju keni të drejtë të aksesoni, korrigjoni, fshini ose kufizoni përpunimin e të dhënave tuaja personale. Ju mund të na kontaktoni për të ushtruar këto të drejta."
        },
        {
          title: "7. Periudha e Ruajtjes së të Dhënave",
          content: "Të dhënat tuaja personale ruhen për aq kohë sa është e nevojshme për ofrimin e shërbimit ose siç kërkohet nga detyrimet ligjore. Të dhënat që nuk janë më të nevojshme fshihen në mënyrë të sigurt."
        },
        {
          title: "8. Ndryshimet e Politikës",
          content: "Ne mund ta përditësojmë këtë politikë privatësie herë pas here. Kur bëhen ndryshime të rëndësishme, do të njoftoheni përmes faqes sonë të internetit ose përmes emailit."
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-orange-50/20">
      <SEOHead 
        title={seoData.title || 'Privacy Policy - FastlyGo Courier & Delivery Service'}
        description={seoData.description || 'FastlyGo privacy policy and data protection information. Learn how we collect, use, and protect your personal data.'}
        keywords={seoData.keywords}
        structuredData={structuredData}
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
              {language === 'tr' && "Gizlilik politikamız hakkında sorularınız varsa, lütfen bizimle iletişime geçin: info@fastlygo.mk"}
              {language === 'en' && "If you have any questions about our privacy policy, please contact us: info@fastlygo.mk"}
              {language === 'mk' && "Доколку имате прашања во врска со нашата политика за приватност, ве молиме контактирајте не: info@fastlygo.mk"}
              {language === 'sq' && "Nëse keni ndonjë pyetje në lidhje me politikën tonë të privatësisë, ju lutemi na kontaktoni: info@fastlygo.mk"}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
