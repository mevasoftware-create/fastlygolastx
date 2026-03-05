import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Benzersiz SEO verileri - her bölge için özel içerik
// Meta description Google'da ~155-160 karakter gösterir, ama 300+ karakter yazılabilir
// subtitle = sayfada görünen uzun açıklama
// keywords = SEO anahtar kelimeler (meta keywords + içerik için)
const SEO_DATA = {
  aerodrom: {
    en: {
      title: "Express Delivery in Aerodrom | FastlyGo Skopje",
      description: "FastlyGo delivers in Aerodrom, Skopje's dynamic southern district home to the international airport, major shopping centers, and thousands of families. Order food, groceries, pharmacy items, or send packages — our couriers reach you in 15 minutes with live GPS tracking.",
      subtitle: "Aerodrom is one of Skopje's most populous and strategically located municipalities, stretching from the city center to the Alexander the Great International Airport. With major shopping malls, business parks, residential towers, and a diverse community, Aerodrom is a district that never slows down. FastlyGo's couriers know every street, block, and building in Aerodrom — delivering food orders, grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking, seven days a week.",
      keywords: "delivery aerodrom, courier aerodrom skopje, food delivery aerodrom, fast delivery near airport skopje, express courier aerodrom"
    },
    mk: {
      title: "Брза Достава во Аеродром | FastlyGo Скопје",
      description: "FastlyGo доставува во Аеродром, динамичниот јужен дел на Скопје со меѓународниот аеродром, главните трговски центри и илјадници семејства. Нарачајте храна, намирници, лекови или испратете пакети — нашите куриери пристигнуваат за 15 минути со GPS следење.",
      subtitle: "Аеродром е една од најнаселените и стратешки поставени општини во Скопје, простирајќи се од центарот на градот до Меѓународниот аеродром Александар Велики. Со главни трговски центри, деловни паркови, станбени кули и разновидна заедница, Аеродром е населба која никогаш не забавува. Куриерите на FastlyGo го знаат секој улица, блок и зграда во Аеродром.",
      keywords: "достава аеродром, куриер аеродром скопје, достава храна аеродром, брза достава аеродром"
    },
    sq: {
      title: "Dërgesa e Shpejtë në Aerodrom | FastlyGo Shkup",
      description: "FastlyGo dërgon në Aerodrom, lagja dinamike jugore e Shkupit me aeroportin ndërkombëtar, qendrat kryesore tregtare dhe mijëra familje. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — kurierët tanë arrijnë brenda 15 minutave me gjurmim GPS.",
      subtitle: "Aerodrom është një nga komunat më të popullta dhe strategjikisht të vendosura të Shkupit, duke u shtrirë nga qendra e qytetit deri te Aeroporti Ndërkombëtar Aleksandar i Madh. Me qendra të mëdha tregtare, parqe biznesi, kulla banimi dhe komunitet të larmishëm, Aerodrom është një lagje që kurrë nuk ngadalësohet. Kurierët e FastlyGo njohin çdo rrugë, bllok dhe ndërtesë në Aerodrom.",
      keywords: "dërgesa aerodrom, kurier aerodrom shkup, dërgesa ushqimi aerodrom, dërgesa e shpejtë aerodrom"
    },
    tr: {
      title: "Aerodrom'da Hızlı Teslimat | FastlyGo Üsküp",
      description: "FastlyGo, uluslararası havalimanına, büyük alışveriş merkezlerine ve binlerce aileye ev sahipliği yapan Üsküp'ün dinamik güney ilçesi Aerodrom'a teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — kuryelerimiz 15 dakikada GPS takibiyle kapınıza gelir.",
      subtitle: "Aerodrom, Üsküp'ün en kalabalık ve stratejik konumdaki belediyelerinden biridir; şehir merkezinden Büyük İskender Uluslararası Havalimanı'na uzanır. Büyük alışveriş merkezleri, iş parkları, konut kuleleri ve çeşitli topluluğuyla Aerodrom hiç durmayan bir ilçedir. FastlyGo kuryelerimiz Aerodrom'daki her sokağı, bloğu ve binayı tanıyor.",
      keywords: "aerodrom teslimat, aerodrom kurye üsküp, aerodrom yemek teslimat, havalimanı yakını teslimat üsküp"
    }
  },
  centar: {
    en: {
      title: "Fast Delivery in Centar | FastlyGo Skopje City Center",
      description: "FastlyGo delivers in Centar, the vibrant heart of Skopje where government buildings, embassies, top restaurants, and cultural landmarks meet. Get food, groceries, pharmacy items, or documents delivered in 15 minutes with live GPS tracking — right to your office or home.",
      subtitle: "Centar is the beating heart of Skopje — a bustling municipality that houses the National Parliament, the main pedestrian zone (Macedonia Street), the famous Old Bazaar (Čaršija), top hotels, embassies, and the city's finest restaurants and cafes. Whether you're a resident, a business, or a tourist, FastlyGo's couriers navigate Centar's busy streets to deliver food orders, grocery essentials, pharmacy needs, and urgent documents with precision and speed, every day of the week.",
      keywords: "delivery centar skopje, courier city center skopje, food delivery skopje center, fast delivery centar, express courier Macedonia Street"
    },
    mk: {
      title: "Брза Достава во Центар | FastlyGo Скопје Центар",
      description: "FastlyGo доставува во Центар, живописното срце на Скопје каде се среќаваат владините згради, амбасадите, врвните ресторани и културните знаменитости. Добијте храна, намирници, лекови или документи за 15 минути со GPS следење — директно до вашата канцеларија или дом.",
      subtitle: "Центар е пулсирачкото срце на Скопје — прометна општина која ги сместува Националниот Парламент, главната пешачка зона (Македонија улица), познатата Стара Чаршија, врвните хотели, амбасадите и најдобрите ресторани и кафулиња во градот. FastlyGo доставува со прецизност и брзина секој ден.",
      keywords: "достава центар скопје, куриер центар скопје, достава храна центар, брза достава центар"
    },
    sq: {
      title: "Dërgesa e Shpejtë në Qendër | FastlyGo Shkup Qendër",
      description: "FastlyGo dërgon në Qendër, zemra e gjallë e Shkupit ku ndërtesa qeveritare, ambasada, restorante të nivelit të lartë dhe monumente kulturore takohen. Merr ushqim, ushqime, ilaçe ose dokumente brenda 15 minutave me gjurmim GPS — direkt në zyrën ose shtëpinë tënde.",
      subtitle: "Qendra është zemra rrahëse e Shkupit — një komunë e zhurmshme që strehon Parlamentin Kombëtar, zonën kryesore këmbësore (Rruga Maqedoni), Çarshia e famshme e Vjetër, hotelet kryesore, ambasadat dhe restorantet dhe kafetë më të mira të qytetit. FastlyGo dërgon me saktësi dhe shpejtësi çdo ditë.",
      keywords: "dërgesa qendër shkup, kurier qendër shkup, dërgesa ushqimi qendër, dërgesa e shpejtë qendër"
    },
    tr: {
      title: "Centar'da Hızlı Teslimat | FastlyGo Üsküp Şehir Merkezi",
      description: "FastlyGo, hükümet binaları, büyükelçilikler, üst düzey restoranlar ve kültürel simgelerin buluştuğu Üsküp'ün canlı kalbi Centar'a teslimat yapar. Yemek, market, eczane veya evrak siparişlerinizi 15 dakikada GPS takibiyle ofisinize veya evinize teslim ediyoruz.",
      subtitle: "Centar, Üsküp'ün çarpan kalbidir — Ulusal Parlamento, ana yaya bölgesi (Makedonya Caddesi), ünlü Eski Çarşı, üst düzey oteller, büyükelçilikler ve şehrin en iyi restoran ve kafelerini barındıran kalabalık bir belediyedir. FastlyGo kuryelerimiz Centar'ın yoğun sokaklarında haftanın her günü hassasiyet ve hızla teslimat yapar.",
      keywords: "centar teslimat üsküp, üsküp şehir merkezi kurye, centar yemek teslimat, makedonya caddesi teslimat"
    }
  },
  karpos: {
    en: {
      title: "Delivery in Karpos | FastlyGo Skopje's Green District",
      description: "FastlyGo delivers in Karpos, Skopje's most prestigious residential district known for its tree-lined boulevards, the sprawling Karpos Park, top schools, and affluent neighborhoods. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.",
      subtitle: "Karpos is widely regarded as Skopje's most desirable residential area — a green, spacious municipality with wide boulevards, the beloved Karpos Park, top-rated schools and universities, and a high quality of life. Home to many of Skopje's professionals, diplomats, and families, Karpos demands delivery services that match its standards. FastlyGo's couriers cover every street and neighborhood in Karpos, delivering food orders, premium grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking.",
      keywords: "delivery karpos, courier karpos skopje, food delivery karpos, fast delivery karpos, express courier green district skopje"
    },
    mk: {
      title: "Достава во Карпош | FastlyGo Зелениот Реон на Скопје",
      description: "FastlyGo доставува во Карпош, најпрестижниот станбен реон на Скопје познат по дрвените булевари, огромниот Карпошки Парк, врвните училишта и имотните населби. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.",
      subtitle: "Карпош е широко сметан за најпожелниот станбен простор во Скопје — зелена, просторна општина со широки булевари, сакан Карпошки Парк, врвни училишта и универзитети и висок квалитет на живот. FastlyGo ги покрива сите улици и населби во Карпош со GPS следење.",
      keywords: "достава карпош, куриер карпош скопје, достава храна карпош, брза достава карпош"
    },
    sq: {
      title: "Dërgesa në Karposh | FastlyGo Rrethi i Gjelbër i Shkupit",
      description: "FastlyGo dërgon në Karposh, rrethi banor më prestigjioz i Shkupit i njohur për bulevardet e tij me pemë, Parkun e madh Karposh, shkollat kryesore dhe lagjet e pasura. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.",
      subtitle: "Karposhi konsiderohet gjerësisht si zona banimi më e dëshirueshme e Shkupit — një komunë e gjelbër, e hapësiruar me bulevarde të gjera, Parkun e dashur Karposh, shkolla dhe universitete të vlerësuara lart dhe cilësi të lartë jetese. FastlyGo mbulon çdo rrugë dhe lagje në Karposh me gjurmim GPS.",
      keywords: "dërgesa karposh, kurier karposh shkup, dërgesa ushqimi karposh, dërgesa e shpejtë karposh"
    },
    tr: {
      title: "Karpoş'ta Teslimat | FastlyGo Üsküp'ün Yeşil İlçesi",
      description: "FastlyGo, ağaçlı bulvarları, geniş Karpoş Parkı, üst düzey okulları ve varlıklı mahalleleriyle Üsküp'ün en prestijli konut bölgesi Karpoş'a teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.",
      subtitle: "Karpoş, Üsküp'ün en gözde konut alanı olarak kabul edilir — geniş bulvarları, sevilen Karpoş Parkı, üst düzey okul ve üniversiteleri ve yüksek yaşam kalitesiyle yeşil, ferah bir belediyedir. Üsküp'ün pek çok profesyoneli, diplomat ve ailesine ev sahipliği yapan Karpoş, standartlarına uygun teslimat hizmetleri talep eder. FastlyGo kuryelerimiz GPS takibiyle Karpoş'un her sokağını ve mahallesini kapsıyor.",
      keywords: "karpoş teslimat, karpoş kurye üsküp, karpoş yemek teslimat, üsküp yeşil ilçe teslimat"
    }
  },
  "kisela-voda": {
    en: {
      title: "Delivery in Kisela Voda | FastlyGo Skopje Southeast",
      description: "FastlyGo delivers in Kisela Voda, Skopje's largest municipality by area and a diverse southeastern district known for its mix of residential neighborhoods, industrial zones, and the beautiful Vodno Mountain foothills. Get food, groceries, pharmacy items, and packages delivered in 15 minutes.",
      subtitle: "Kisela Voda is Skopje's largest municipality, stretching from the city center all the way to the slopes of Mount Vodno and the Treska River canyon. With a mix of dense urban neighborhoods, quieter suburban areas, and industrial zones, Kisela Voda is home to a large and diverse population. FastlyGo's couriers cover every corner of Kisela Voda, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking every day of the week.",
      keywords: "delivery kisela voda, courier kisela voda skopje, food delivery kisela voda, fast delivery skopje southeast, Vodno Mountain area delivery"
    },
    mk: {
      title: "Достава во Кисела Вода | FastlyGo Скопје Југоисток",
      description: "FastlyGo доставува во Кисела Вода, најголемата општина на Скопје по површина и разновиден југоисточен реон познат по мешавината на станбени населби, индустриски зони и убавите подножја на планината Водно. Добијте храна, намирници, лекови и пакети за 15 минути.",
      subtitle: "Кисела Вода е најголемата општина на Скопје, простирајќи се од центарот на градот до падините на Водно и кањонот на реката Треска. Со мешавина на густи урбани населби, потивки приградски области и индустриски зони, Кисела Вода е дом на голема и разновидна популација. FastlyGo ги покрива сите агли на Кисела Вода со GPS следење.",
      keywords: "достава кисела вода, куриер кисела вода скопје, достава храна кисела вода, брза достава кисела вода"
    },
    sq: {
      title: "Dërgesa në Kisela Voda | FastlyGo Shkup Juglindje",
      description: "FastlyGo dërgon në Kisela Voda, komuna më e madhe e Shkupit sipas sipërfaqes dhe një rreth i larmishëm juglindor i njohur për përzierjen e lagjeve banesore, zonave industriale dhe shpateve të bukura të Malit Vodno. Merr ushqim, ushqime, ilaçe dhe paketa brenda 15 minutave.",
      subtitle: "Kisela Voda është komuna më e madhe e Shkupit, duke u shtrirë nga qendra e qytetit deri te shpatet e Malit Vodno dhe kanioni i lumit Treska. Me përzierje të lagjeve urbane të dendura, zonave suburbane dhe industriale, Kisela Voda është shtëpi e një popullate të madhe dhe të larmishme. FastlyGo mbulon çdo cep të Kisela Vodës me gjurmim GPS.",
      keywords: "dërgesa kisela voda, kurier kisela voda shkup, dërgesa ushqimi kisela voda, dërgesa e shpejtë kisela voda"
    },
    tr: {
      title: "Kisela Voda'da Teslimat | FastlyGo Üsküp Güneydoğu",
      description: "FastlyGo, Üsküp'ün yüzölçümü bakımından en büyük belediyesi ve konut mahalleleri, sanayi bölgeleri ve güzel Vodno Dağı eteklerinin karışımıyla bilinen çeşitli güneydoğu ilçesi Kisela Voda'ya teslimat yapar. Yemek, market, eczane ve paketleri 15 dakikada teslim ediyoruz.",
      subtitle: "Kisela Voda, Üsküp'ün en büyük belediyesidir; şehir merkezinden Vodno Dağı yamaçlarına ve Treska Nehri kanyonuna uzanır. Yoğun kentsel mahalleler, daha sakin banliyö alanları ve sanayi bölgelerinin karışımıyla Kisela Voda, büyük ve çeşitli bir nüfusa ev sahipliği yapar. FastlyGo kuryelerimiz GPS takibiyle Kisela Voda'nın her köşesini kapsıyor.",
      keywords: "kisela voda teslimat, kisela voda kurye üsküp, kisela voda yemek teslimat, vodno dağı yakını teslimat"
    }
  },
  cair: {
    en: {
      title: "Delivery in Cair | FastlyGo Skopje's Historic Old Bazaar District",
      description: "FastlyGo delivers in Cair, Skopje's historic and culturally rich municipality that is home to the legendary Old Bazaar (Čaršija), the iconic Stone Bridge, and a vibrant multicultural community. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.",
      subtitle: "Cair is one of Skopje's most historically significant and culturally diverse municipalities, home to the legendary Old Bazaar (Čaršija) — one of the largest and oldest bazaars in the Balkans — the iconic Stone Bridge over the Vardar River, the historic Mustafa Pasha Mosque, and a vibrant community of Macedonian, Albanian, and Turkish residents. FastlyGo's couriers navigate Cair's winding streets and busy bazaar alleys to deliver food, groceries, pharmacy needs, and parcels with live GPS tracking every day.",
      keywords: "delivery cair, courier cair skopje, food delivery old bazaar skopje, fast delivery cair, express courier Čaršija skopje"
    },
    mk: {
      title: "Достава во Чаир | FastlyGo Историскиот Реон на Стара Чаршија",
      description: "FastlyGo доставува во Чаир, историски и културно богата општина на Скопје која е дом на легендарната Стара Чаршија, иконичниот Камен Мост и живописна мултикултурна заедница. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.",
      subtitle: "Чаир е една од историски најзначајните и културно разновидни општини на Скопје, дом на легендарната Стара Чаршија — еден од најголемите и најстарите базари на Балканот — иконичниот Камен Мост над Вардар, историската Мустафа Пашина Џамија и живописна заедница. FastlyGo доставува со GPS следење секој ден.",
      keywords: "достава чаир, куриер чаир скопје, достава стара чаршија скопје, брза достава чаир"
    },
    sq: {
      title: "Dërgesa në Çair | FastlyGo Rrethi Historik i Çarshisë së Vjetër",
      description: "FastlyGo dërgon në Çair, komuna historike dhe kulturalisht e pasur e Shkupit që është shtëpi e Çarshisë Legjendar të Vjetër, Urës ikonike të Gurit dhe një komuniteti shumëkulturor të gjallë. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.",
      subtitle: "Çairi është një nga komunat historikisht më të rëndësishme dhe kulturalisht të larmishme të Shkupit, shtëpi e Çarshisë Legjendar të Vjetër — njërit nga bazarët më të mëdhenj dhe më të vjetër në Ballkan — Ura ikonike e Gurit mbi Vardar dhe Xhamia historike Mustafa Pasha. FastlyGo dërgon me gjurmim GPS çdo ditë.",
      keywords: "dërgesa çair, kurier çair shkup, dërgesa çarshi e vjetër shkup, dërgesa e shpejtë çair"
    },
    tr: {
      title: "Çair'de Teslimat | FastlyGo Üsküp'ün Tarihi Eski Çarşı Bölgesi",
      description: "FastlyGo, efsanevi Eski Çarşı'ya (Çarşija), ikonik Taş Köprü'ye ve canlı çok kültürlü topluluğa ev sahipliği yapan Üsküp'ün tarihi ve kültürel açıdan zengin belediyesi Çair'e teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.",
      subtitle: "Çair, Üsküp'ün tarihi açıdan en önemli ve kültürel açıdan en çeşitli belediyelerinden biridir; Balkanlar'ın en büyük ve en eski çarşılarından biri olan efsanevi Eski Çarşı'ya, Vardar Nehri üzerindeki ikonik Taş Köprü'ye ve tarihi Mustafa Paşa Camii'ne ev sahipliği yapar. FastlyGo kuryelerimiz Çair'in kıvrımlı sokaklarında ve kalabalık çarşı geçitlerinde GPS takibiyle her gün teslimat yapar.",
      keywords: "çair teslimat, çair kurye üsküp, eski çarşı teslimat üsküp, taş köprü yakını teslimat"
    }
  },
  "gazi-baba": {
    en: {
      title: "Delivery in Gazi Baba | FastlyGo Skopje's Eastern Gateway",
      description: "FastlyGo delivers in Gazi Baba, Skopje's eastern gateway municipality known for its diverse residential communities, the Gazi Baba Forest Park, and its strategic location along the main highway corridor. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.",
      subtitle: "Gazi Baba is Skopje's eastern gateway — a large and diverse municipality that stretches from the city's eastern edge toward the Skopje-Kumanovo highway corridor. With a mix of established residential neighborhoods, newer housing developments, the beloved Gazi Baba Forest Park, and a growing commercial sector, Gazi Baba is a community on the rise. FastlyGo's couriers cover every neighborhood in Gazi Baba with live GPS tracking, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels every day of the week.",
      keywords: "delivery gazi baba, courier gazi baba skopje, food delivery gazi baba, fast delivery eastern skopje, Gazi Baba Forest Park delivery"
    },
    mk: {
      title: "Достава во Гази Баба | FastlyGo Источна Порта на Скопје",
      description: "FastlyGo доставува во Гази Баба, источната порта на Скопје позната по разновидните станбени заедници, Шумскиот Парк Гази Баба и стратешката локација долж главниот автопатски коридор. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.",
      subtitle: "Гази Баба е источната порта на Скопје — голема и разновидна општина која се простира од источниот раб на градот кон коридорот на автопатот Скопје-Куманово. Со мешавина на воспоставени станбени населби, нови станбени развои, саканиот Шумски Парк Гази Баба и растечки комерцијален сектор, Гази Баба е заедница во подем. FastlyGo ги покрива сите населби со GPS следење.",
      keywords: "достава гази баба, куриер гази баба скопје, достава храна гази баба, брза достава гази баба"
    },
    sq: {
      title: "Dërgesa në Gazi Baba | FastlyGo Porta Lindore e Shkupit",
      description: "FastlyGo dërgon në Gazi Baba, komuna e portës lindore të Shkupit e njohur për komunitetin e saj të larmishëm banor, Parkun Pyjor Gazi Baba dhe vendndodhjen strategjike përgjatë korridorit kryesor të autostradës. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.",
      subtitle: "Gazi Baba është porta lindore e Shkupit — një komunë e madhe dhe e larmishme që shtrihet nga skaji lindor i qytetit drejt korridorit të autostradës Shkup-Kumanovë. Me përzierje të lagjeve banesore të vendosura, zhvillimeve të reja të strehimit, Parkun e dashur Pyjor Gazi Baba dhe sektorin tregtar në rritje, Gazi Baba është një komunitet në rritje. FastlyGo mbulon çdo lagje me gjurmim GPS.",
      keywords: "dërgesa gazi baba, kurier gazi baba shkup, dërgesa ushqimi gazi baba, dërgesa e shpejtë gazi baba"
    },
    tr: {
      title: "Gazi Baba'da Teslimat | FastlyGo Üsküp'ün Doğu Kapısı",
      description: "FastlyGo, çeşitli konut toplulukları, Gazi Baba Orman Parkı ve ana otoyol koridoru boyunca stratejik konumuyla Üsküp'ün doğu kapısı belediyesi Gazi Baba'ya teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.",
      subtitle: "Gazi Baba, Üsküp'ün doğu kapısıdır — şehrin doğu ucundan Üsküp-Kumanova otoyol koridoruna uzanan büyük ve çeşitli bir belediyedir. Yerleşik konut mahalleleri, yeni konut gelişmeleri, sevilen Gazi Baba Orman Parkı ve büyüyen ticaret sektörünün karışımıyla Gazi Baba yükselen bir topluluktur. FastlyGo kuryelerimiz GPS takibiyle Gazi Baba'nın her mahallesini kapsıyor.",
      keywords: "gazi baba teslimat, gazi baba kurye üsküp, gazi baba yemek teslimat, üsküp doğu teslimat"
    }
  },
  saraj: {
    en: {
      title: "Delivery in Saraj | FastlyGo Skopje's Western Mountain District",
      description: "FastlyGo delivers in Saraj, Skopje's westernmost municipality nestled between the Suva Gora and Karadžica mountains, known for its scenic villages, the Matka Canyon, and a predominantly Albanian community with deep cultural roots. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.",
      subtitle: "Saraj is Skopje's most scenic municipality — a largely rural and semi-urban area stretching from the western city limits into the mountains, encompassing the breathtaking Matka Canyon (one of North Macedonia's most visited natural attractions), traditional Albanian villages, and the Treska River gorge. FastlyGo brings modern delivery convenience to Saraj's communities, covering all accessible neighborhoods with live GPS tracking and professional couriers.",
      keywords: "delivery saraj, courier saraj skopje, food delivery saraj, fast delivery western skopje, Matka Canyon area delivery"
    },
    mk: {
      title: "Достава во Сарај | FastlyGo Западниот Планински Реон на Скопје",
      description: "FastlyGo доставува во Сарај, најзападната општина на Скопје сместена помеѓу планините Сува Гора и Караџица, позната по живописните села, Кањонот Матка и претежно албанска заедница со длабоки културни корени. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.",
      subtitle: "Сарај е најживописната општина на Скопје — претежно рурална и полуурбана област која се простира од западните граници на градот во планините, опфаќајќи го прекрасниот Кањон Матка, традиционалните албански села и клисурата на реката Треска. FastlyGo носи модерна удобност за достава во заедниците на Сарај со GPS следење.",
      keywords: "достава сарај, куриер сарај скопје, достава храна сарај, брза достава сарај, матка кањон достава"
    },
    sq: {
      title: "Dërgesa në Saraj | FastlyGo Rrethi Malor Perëndimor i Shkupit",
      description: "FastlyGo dërgon në Saraj, komuna më perëndimore e Shkupit e vendosur midis maleve Suva Gora dhe Karadžica, e njohur për fshatrat e saj piktoreske, Kanionin Matka dhe një komunitet kryesisht shqiptar me rrënjë kulturore të thella. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.",
      subtitle: "Saraji është komuna më piktoreske e Shkupit — një zonë kryesisht rurale dhe gjysmë-urbane që shtrihet nga kufijtë perëndimorë të qytetit në male, duke përfshirë Kanionin mahnitës Matka, fshatrat tradicionale shqiptare dhe grykat e lumit Treska. FastlyGo sjell komoditetin modern të dërgesës në komunitetet e Sarajit me gjurmim GPS.",
      keywords: "dërgesa saraj, kurier saraj shkup, dërgesa ushqimi saraj, dërgesa e shpejtë saraj, kanioni matka dërgesa"
    },
    tr: {
      title: "Saraj'da Teslimat | FastlyGo Üsküp'ün Batı Dağ İlçesi",
      description: "FastlyGo, Suva Gora ve Karadžica dağları arasına yerleşmiş, manzaralı köyleri, Matka Kanyonu ve derin kültürel köklere sahip ağırlıklı Arnavut topluluğuyla Üsküp'ün en batı belediyesi Saraj'a teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.",
      subtitle: "Saraj, Üsküp'ün en manzaralı belediyesidir — batı şehir sınırlarından dağlara uzanan, Kuzey Makedonya'nın en çok ziyaret edilen doğal cazibe merkezlerinden biri olan nefes kesen Matka Kanyonu'nu, geleneksel Arnavut köylerini ve Treska Nehri boğazını kapsayan büyük ölçüde kırsal ve yarı kentsel bir alan. FastlyGo, Saraj topluluklarına GPS takibiyle modern teslimat kolaylığı getiriyor.",
      keywords: "saraj teslimat, saraj kurye üsküp, saraj yemek teslimat, matka kanyonu yakını teslimat"
    }
  },
  butel: {
    en: {
      title: "Delivery in Butel | FastlyGo Skopje's Northern District",
      description: "FastlyGo delivers in Butel, Skopje's northern municipality known for its multicultural community, the Butel industrial zone, and residential neighborhoods stretching toward the Skopska Crna Gora mountain range. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.",
      subtitle: "Butel is Skopje's northern municipality — a diverse area with a significant Albanian and Macedonian population, a mix of residential neighborhoods and industrial zones, and a strong community spirit. Located between the city center and the Skopska Crna Gora mountains, Butel offers a quieter pace of life while remaining well-connected to Skopje's core. FastlyGo's couriers cover all neighborhoods in Butel, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking every day.",
      keywords: "delivery butel, courier butel skopje, food delivery butel, fast delivery northern skopje, Butel industrial zone delivery"
    },
    mk: {
      title: "Достава во Бутел | FastlyGo Северниот Реон на Скопје",
      description: "FastlyGo доставува во Бутел, северната општина на Скопје позната по мултикултурната заедница, индустриската зона Бутел и станбените населби кои се простираат кон планинскиот масив Скопска Црна Гора. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.",
      subtitle: "Бутел е северната општина на Скопје — разновидна област со значително албанско и македонско население, мешавина на станбени населби и индустриски зони и силен дух на заедницата. Сместена помеѓу центарот на градот и планините Скопска Црна Гора, Бутел нуди потивко темпо на живот додека останува добро поврзан со јадрото на Скопје. FastlyGo ги покрива сите населби со GPS следење.",
      keywords: "достава бутел, куриер бутел скопје, достава храна бутел, брза достава бутел"
    },
    sq: {
      title: "Dërgesa në Butel | FastlyGo Rrethi Verior i Shkupit",
      description: "FastlyGo dërgon në Butel, komuna veriore e Shkupit e njohur për komunitetin e saj shumëkulturor, zonën industriale Butel dhe lagjet banesore që shtrihen drejt vargmaleve Skopska Crna Gora. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.",
      subtitle: "Buteli është komuna veriore e Shkupit — një zonë e larmishme me popullsi të konsiderueshme shqiptare dhe maqedonase, përzierje të lagjeve banesore dhe zonave industriale dhe frymë të fortë komunitare. E vendosur midis qendrës së qytetit dhe maleve Skopska Crna Gora, Buteli ofron një ritëm më të qetë jetese duke mbetur mirë i lidhur me bërthamën e Shkupit. FastlyGo mbulon të gjitha lagjet me gjurmim GPS.",
      keywords: "dërgesa butel, kurier butel shkup, dërgesa ushqimi butel, dërgesa e shpejtë butel"
    },
    tr: {
      title: "Butel'de Teslimat | FastlyGo Üsküp'ün Kuzey İlçesi",
      description: "FastlyGo, çok kültürlü topluluğu, Butel sanayi bölgesi ve Skopska Crna Gora dağ silsilesine doğru uzanan konut mahalleleriyle Üsküp'ün kuzey belediyesi Butel'e teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.",
      subtitle: "Butel, Üsküp'ün kuzey belediyesidir — önemli Arnavut ve Makedon nüfusuyla çeşitli bir alan, konut mahalleleri ve sanayi bölgelerinin karışımı ve güçlü bir topluluk ruhu. Şehir merkezi ile Skopska Crna Gora dağları arasında konumlanan Butel, Üsküp'ün çekirdeğiyle iyi bağlantılı kalırken daha sakin bir yaşam temposu sunar. FastlyGo kuryelerimiz GPS takibiyle tüm mahalleleri kapsıyor.",
      keywords: "butel teslimat, butel kurye üsküp, butel yemek teslimat, üsküp kuzey teslimat"
    }
  },
  skopje: {
    en: {
      title: "Fast Delivery Across Skopje | FastlyGo — 15-Minute Courier Service",
      description: "FastlyGo is Skopje's premier on-demand delivery platform, connecting residents, businesses, restaurants, and pharmacies across all 10 municipalities of the capital. Order food, groceries, pharmacy items, documents, or packages — our professional couriers deliver in 15 minutes with live GPS tracking, 7 days a week.",
      subtitle: "Skopje is the capital and largest city of North Macedonia, a metropolis of over 600,000 people spread across 10 distinct municipalities — from the historic Old Bazaar in Cair to the green boulevards of Karpos, from the airport district of Aerodrom to the mountain-flanked neighborhoods of Saraj. FastlyGo was built for Skopje — a city that moves fast and expects its services to keep up. With a growing fleet of professional couriers, a real-time GPS tracking system, and partnerships with hundreds of restaurants, pharmacies, and businesses, FastlyGo delivers everything Skopje needs, when it needs it.",
      keywords: "delivery skopje, courier skopje, food delivery skopje, fast delivery skopje, express courier skopje, 15 minute delivery skopje north macedonia"
    },
    mk: {
      title: "Брза Достава низ Скопје | FastlyGo — 15-Минутна Курирска Служба",
      description: "FastlyGo е водечката платформа за достава на барање во Скопје, поврзувајќи жители, бизниси, ресторани и аптеки низ сите 10 општини на главниот град. Нарачајте храна, намирници, лекови, документи или пакети — нашите професионални куриери доставуваат за 15 минути со GPS следење, 7 дена во неделата.",
      subtitle: "Скопје е главниот и најголемиот град на Македонија, метропола со над 600.000 луѓе распоредени низ 10 различни општини. FastlyGo е изграден за Скопје — град кој се движи брзо и очекува неговите услуги да го следат. Со растечка флота на професионални куриери и GPS следење во реално време, FastlyGo доставува сè што Скопје треба.",
      keywords: "достава скопје, куриер скопје, достава храна скопје, брза достава скопје, 15 минути достава скопје"
    },
    sq: {
      title: "Dërgesa e Shpejtë nëpër Shkup | FastlyGo — Shërbim Kurier 15-Minutësh",
      description: "FastlyGo është platforma kryesore e dërgesës me kërkesë në Shkup, duke lidhur banorë, biznese, restorante dhe farmaci nëpër të gjitha 10 komunat e kryeqytetit. Porosit ushqim, ushqime, ilaçe, dokumente ose paketa — kurierët tanë profesionalë dërgojnë brenda 15 minutave me gjurmim GPS, 7 ditë në javë.",
      subtitle: "Shkupi është kryeqyteti dhe qyteti më i madh i Maqedonisë së Veriut, një metropol me mbi 600,000 njerëz të shpërndarë nëpër 10 komuna të ndryshme. FastlyGo u ndërtua për Shkupin — një qytet që lëviz shpejt dhe pret që shërbimet e tij të vazhdojnë. Me një flotë në rritje të kurierëve profesionalë dhe gjurmim GPS në kohë reale, FastlyGo dërgon gjithçka që Shkupi ka nevojë.",
      keywords: "dërgesa shkup, kurier shkup, dërgesa ushqimi shkup, dërgesa e shpejtë shkup, 15 minuta dërgesa shkup"
    },
    tr: {
      title: "Üsküp Genelinde Hızlı Teslimat | FastlyGo — 15 Dakika Kurye Hizmeti",
      description: "FastlyGo, başkentin tüm 10 belediyesinde sakinleri, işletmeleri, restoranları ve eczaneleri birbirine bağlayan Üsküp'ün önde gelen isteğe bağlı teslimat platformudur. Yemek, market, eczane, evrak veya paket siparişi verin — profesyonel kuryelerimiz haftanın 7 günü GPS takibiyle 15 dakikada teslim eder.",
      subtitle: "Üsküp, Kuzey Makedonya'nın başkenti ve en büyük şehridir; 10 farklı belediyeye yayılmış 600.000'den fazla nüfuslu bir metropol. FastlyGo Üsküp için inşa edildi — hızlı hareket eden ve hizmetlerinin ayak uydurmasını bekleyen bir şehir. Büyüyen profesyonel kurye filosu ve gerçek zamanlı GPS takip sistemiyle FastlyGo, Üsküp'ün ihtiyaç duyduğu her şeyi, ihtiyaç duyduğu zaman teslim ediyor.",
      keywords: "üsküp teslimat, üsküp kurye, üsküp yemek teslimat, üsküp hızlı teslimat, 15 dakika teslimat üsküp kuzey makedonya"
    }
  },
  tetovo: {
    en: {
      title: "Delivery in Tetovo | FastlyGo — Polog Valley's Fastest Courier",
      description: "FastlyGo delivers in Tetovo, the vibrant capital of the Polog Valley and North Macedonia's second-largest Albanian-majority city, known for the iconic Painted Mosque, the Šar Mountain ski resorts, and a thriving commercial center. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.",
      subtitle: "Tetovo is the heart of the Polog Valley and one of North Macedonia's most dynamic cities — home to the stunning 15th-century Painted Mosque (Šarena Džamija), South East European University, the gateway to the Šar Mountain ski resorts (Popova Šapka), and a bustling commercial district. With a predominantly Albanian community and a strong tradition of trade and education, Tetovo is a city that demands fast, reliable delivery. FastlyGo covers all neighborhoods in Tetovo with live GPS tracking, seven days a week.",
      keywords: "delivery tetovo, courier tetovo, food delivery tetovo, fast delivery tetovo north macedonia, Painted Mosque area delivery, Polog Valley courier"
    },
    mk: {
      title: "Достава во Тетово | FastlyGo — Најбрз Куриер во Полошката Долина",
      description: "FastlyGo доставува во Тетово, живописната престолнина на Полошката Долина и вториот по големина град со албанско мнозинство во Македонија, познат по иконичната Шарена Џамија, скијачките одморалишта на Шар Планина и процветачкиот трговски центар. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.",
      subtitle: "Тетово е срцето на Полошката Долина и еден од најдинамичните градови во Македонија — дом на прекрасната Шарена Џамија, Универзитетот на Југоисточна Европа и портата кон скијачките одморалишта на Шар Планина. FastlyGo ги покрива сите населби во Тетово со GPS следење, седум дена во неделата.",
      keywords: "достава тетово, куриер тетово, достава храна тетово, брза достава тетово, шарена џамија достава"
    },
    sq: {
      title: "Dërgesa në Tetovë | FastlyGo — Kurieri më i Shpejtë i Luginës së Pollogut",
      description: "FastlyGo dërgon në Tetovë, kryeqyteti i gjallë i Luginës së Pollogut dhe qyteti i dytë më i madh me shumicë shqiptare në Maqedoninë e Veriut, i njohur për Xhaminë ikonike të Lyer, resortet e skisë të Malit Sharr dhe qendrën tregtare të lulëzuar. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.",
      subtitle: "Tetova është zemra e Luginës së Pollogut dhe një nga qytetet më dinamike të Maqedonisë — shtëpi e Xhamisë mahnitëse të Lyer të shekullit të 15-të, Universitetit të Evropës Juglindore dhe porta e resorteve të skisë të Malit Sharr (Popova Shapka). FastlyGo mbulon të gjitha lagjet në Tetovë me gjurmim GPS, shtatë ditë në javë.",
      keywords: "dërgesa tetovë, kurier tetovë, dërgesa ushqimi tetovë, dërgesa e shpejtë tetovë, xhamia e lyer dërgesa"
    },
    tr: {
      title: "Tetova'da Teslimat | FastlyGo — Polog Vadisi'nin En Hızlı Kuryesi",
      description: "FastlyGo, ikonik Boyalı Cami, Şar Dağı kayak merkezleri ve gelişen ticaret merkeziyle Polog Vadisi'nin canlı başkenti ve Kuzey Makedonya'nın Arnavut çoğunluklu ikinci büyük şehri Tetova'ya teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.",
      subtitle: "Tetova, Polog Vadisi'nin kalbi ve Makedonya'nın en dinamik şehirlerinden biridir — 15. yüzyıldan kalma muhteşem Boyalı Cami (Şarena Džamija), Güneydoğu Avrupa Üniversitesi ve Şar Dağı kayak merkezlerine (Popova Şapka) açılan kapı. FastlyGo, Tetova'nın tüm mahallelerini GPS takibiyle haftanın yedi günü kapsıyor.",
      keywords: "tetova teslimat, tetova kurye, tetova yemek teslimat, boyalı cami yakını teslimat, polog vadisi kurye"
    }
  },
  bitola: {
    en: {
      title: "Delivery in Bitola | FastlyGo — City of Consuls, Fast Delivery",
      description: "FastlyGo delivers in Bitola, North Macedonia's second-largest city and the historic 'City of Consuls,' known for its magnificent Shirok Sokak pedestrian boulevard, the ancient ruins of Heraclea Lyncestis, and a vibrant cultural and academic scene. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.",
      subtitle: "Bitola is North Macedonia's second city and one of the Balkans' most elegant provincial capitals — nicknamed the 'City of Consuls' for the many foreign consulates that once lined its streets. With the stunning Shirok Sokak pedestrian boulevard, the 2,000-year-old ruins of Heraclea Lyncestis, the historic Clock Tower, a major university, and a proud cultural tradition, Bitola is a city that combines history with modern ambition. FastlyGo covers all neighborhoods in Bitola with live GPS tracking and 15-minute delivery service.",
      keywords: "delivery bitola, courier bitola, food delivery bitola, fast delivery bitola north macedonia, Shirok Sokak delivery, Heraclea Lyncestis area delivery"
    },
    mk: {
      title: "Достава во Битола | FastlyGo — Градот на Конзулите, Брза Достава",
      description: "FastlyGo доставува во Битола, вториот по големина град во Македонија и историскиот 'Град на Конзулите', познат по величествениот пешачки булевар Широк Сокак, античките урнатини на Хераклеа Линкестис и живописната културна и академска сцена. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.",
      subtitle: "Битола е вториот град на Македонија и еден од најелегантните провинциски центри на Балканот — наречен 'Град на Конзулите' поради многуте странски конзулати кои некогаш ги краселе неговите улици. Со прекрасниот пешачки булевар Широк Сокак, 2.000-годишните урнатини на Хераклеа Линкестис и горда културна традиција, Битола е град кој ги комбинира историјата со современите амбиции. FastlyGo ги покрива сите населби со GPS следење.",
      keywords: "достава битола, куриер битола, достава храна битола, брза достава битола, широк сокак достава"
    },
    sq: {
      title: "Dërgesa në Manastir | FastlyGo — Qyteti i Konsujve, Dërgesa e Shpejtë",
      description: "FastlyGo dërgon në Manastir, qyteti i dytë më i madh i Maqedonisë së Veriut dhe 'Qyteti historik i Konsujve', i njohur për bulevardin e mrekullueshëm këmbësor Shirok Sokak, rrënojat antike të Herakleas Lyncestis dhe skenën e gjallë kulturore dhe akademike. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.",
      subtitle: "Manastiri është qyteti i dytë i Maqedonisë dhe një nga kryeqytetet provinciale më elegante të Ballkanit — i quajtur 'Qyteti i Konsujve' për konsulatat e shumta të huaja që dikur zbukuronin rrugët e tij. Me bulevardin mahnitës këmbësor Shirok Sokak, rrënojat 2,000-vjeçare të Herakleas Lyncestis dhe traditë kulturore krenare, Manastiri është një qytet që kombinon historinë me ambiciet moderne. FastlyGo mbulon të gjitha lagjet me gjurmim GPS.",
      keywords: "dërgesa manastir, kurier manastir, dërgesa ushqimi manastir, dërgesa e shpejtë manastir, shirok sokak dërgesa"
    },
    tr: {
      title: "Manastır'da Teslimat | FastlyGo — Konsoloslar Şehri, Hızlı Teslimat",
      description: "FastlyGo, muhteşem Şirok Sokak yaya bulvarı, antik Heraklea Linkestis kalıntıları ve canlı kültürel ve akademik sahnesiyle Kuzey Makedonya'nın ikinci büyük şehri ve tarihi 'Konsoloslar Şehri' Manastır'a teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.",
      subtitle: "Manastır, Makedonya'nın ikinci şehri ve Balkanlar'ın en zarif taşra başkentlerinden biridir — sokaklarını bir zamanlar süsleyen çok sayıda yabancı konsolosluk nedeniyle 'Konsoloslar Şehri' olarak anılır. Muhteşem Şirok Sokak yaya bulvarı, 2.000 yıllık Heraklea Linkestis kalıntıları ve gururlu kültürel geleneğiyle Manastır, tarihi modern hırsla birleştiren bir şehirdir. FastlyGo tüm mahalleleri GPS takibiyle kapsıyor.",
      keywords: "manastır teslimat, manastır kurye, manastır yemek teslimat, şirok sokak teslimat, kuzey makedonya ikinci şehir teslimat"
    }
  },
  kumanovo: {
    en: {
      title: "Delivery in Kumanovo | FastlyGo — North Macedonia's Northern Hub",
      description: "FastlyGo delivers in Kumanovo, North Macedonia's third-largest city and the economic and cultural center of the northeastern region, known for its diverse community, the historic Staro Nagoričane Monastery, and its strategic position near the Serbian border. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.",
      subtitle: "Kumanovo is North Macedonia's third-largest city and the undisputed capital of the northeastern region — a diverse, multicultural city with a significant Albanian, Macedonian, and Serbian community, a thriving commercial district, the historic Staro Nagoričane Monastery, and a strategic location near the Serbian border and the main north-south highway corridor. FastlyGo covers all neighborhoods in Kumanovo with live GPS tracking, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels every day of the week.",
      keywords: "delivery kumanovo, courier kumanovo, food delivery kumanovo, fast delivery kumanovo north macedonia, Staro Nagoricane area delivery"
    },
    mk: {
      title: "Достава во Куманово | FastlyGo — Северниот Центар на Македонија",
      description: "FastlyGo доставува во Куманово, третиот по големина град во Македонија и економскиот и културниот центар на североисточниот регион, познат по разновидната заедница, историскиот Манастир Старо Нагоричане и стратешката позиција во близина на српската граница. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.",
      subtitle: "Куманово е третиот по големина град во Македонија и неспорната престолнина на североисточниот регион — разновиден, мултикултурен град со значително албанско, македонско и српско население, процветачки трговски реон и историскиот Манастир Старо Нагоричане. FastlyGo ги покрива сите населби во Куманово со GPS следење.",
      keywords: "достава куманово, куриер куманово, достава храна куманово, брза достава куманово"
    },
    sq: {
      title: "Dërgesa në Kumanovë | FastlyGo — Qendra Veriore e Maqedonisë",
      description: "FastlyGo dërgon në Kumanovë, qyteti i tretë më i madh i Maqedonisë dhe qendra ekonomike dhe kulturore e rajonit verilindor, i njohur për komunitetin e tij të larmishëm, Manastirin historik Staro Nagoričane dhe pozicionin strategjik pranë kufirit serb. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.",
      subtitle: "Kumanova është qyteti i tretë më i madh i Maqedonisë dhe kryeqyteti i padiskutueshëm i rajonit verilindor — një qytet i larmishëm, shumëkulturor me komunitet të konsiderueshëm shqiptar, maqedonas dhe serb dhe Manastirin historik Staro Nagoričane. FastlyGo mbulon të gjitha lagjet në Kumanovë me gjurmim GPS.",
      keywords: "dërgesa kumanovë, kurier kumanovë, dërgesa ushqimi kumanovë, dërgesa e shpejtë kumanovë"
    },
    tr: {
      title: "Kumanova'da Teslimat | FastlyGo — Kuzey Makedonya'nın Kuzey Merkezi",
      description: "FastlyGo, çeşitli topluluğu, tarihi Staro Nagoričane Manastırı ve Sırp sınırına yakın stratejik konumuyla Kuzey Makedonya'nın üçüncü büyük şehri ve kuzeydoğu bölgesinin ekonomik ve kültürel merkezi Kumanova'ya teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.",
      subtitle: "Kumanova, Makedonya'nın üçüncü büyük şehri ve kuzeydoğu bölgesinin tartışmasız başkentidir — önemli Arnavut, Makedon ve Sırp topluluğuyla çeşitli, çok kültürlü bir şehir, gelişen ticaret bölgesi ve tarihi Staro Nagoričane Manastırı. FastlyGo tüm mahalleleri GPS takibiyle kapsıyor.",
      keywords: "kumanova teslimat, kumanova kurye, kumanova yemek teslimat, kuzey makedonya kuzey teslimat"
    }
  },
  "gjorce-petrov": {
    en: {
      title: "Delivery in Gjorce Petrov | FastlyGo Skopje's Western Residential Hub",
      description: "FastlyGo delivers in Gjorce Petrov, one of Skopje's most populous western municipalities known for its large residential blocks, the Treska River, and a strong community identity. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.",
      subtitle: "Gjorce Petrov is one of Skopje's largest and most densely populated western municipalities — a predominantly residential area with large apartment blocks, local markets, schools, and a strong sense of community. Named after the Macedonian revolutionary Gjorce Petrov, this municipality has grown significantly in recent decades and is home to tens of thousands of Skopje families. FastlyGo's couriers cover every street and building in Gjorce Petrov, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking, seven days a week.",
      keywords: "delivery gjorce petrov, courier gjorce petrov skopje, food delivery gjorce petrov, fast delivery western skopje residential"
    },
    mk: {
      title: "Достава во Ѓорче Петров | FastlyGo Западниот Станбен Центар на Скопје",
      description: "FastlyGo доставува во Ѓорче Петров, една од најнаселените западни општини на Скопје позната по големите станбени блокови, реката Треска и силниот идентитет на заедницата. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.",
      subtitle: "Ѓорче Петров е една од најголемите и најгусто населените западни општини на Скопје — претежно станбена област со големи станбени блокови, локални пазари, училишта и силен дух на заедницата. FastlyGo ги покрива сите улици и згради во Ѓорче Петров со GPS следење, седум дена во неделата.",
      keywords: "достава ѓорче петров, куриер ѓорче петров скопје, достава храна ѓорче петров, брза достава ѓорче петров"
    },
    sq: {
      title: "Dërgesa në Gjorçe Petrov | FastlyGo Qendra Banesore Perëndimore e Shkupit",
      description: "FastlyGo dërgon në Gjorçe Petrov, një nga komunat perëndimore më të popullta të Shkupit e njohur për blloqet e saj të mëdha banesore, lumin Treska dhe identitetin e fortë komunitar. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.",
      subtitle: "Gjorçe Petrovi është një nga komunat perëndimore më të mëdha dhe më dendur të popullta të Shkupit — një zonë kryesisht banesore me blloqe të mëdha apartamentesh, tregje lokale, shkolla dhe ndjenjë të fortë komunitare. FastlyGo mbulon çdo rrugë dhe ndërtesë në Gjorçe Petrov me gjurmim GPS, shtatë ditë në javë.",
      keywords: "dërgesa gjorçe petrov, kurier gjorçe petrov shkup, dërgesa ushqimi gjorçe petrov, dërgesa e shpejtë gjorçe petrov"
    },
    tr: {
      title: "Gjorce Petrov'da Teslimat | FastlyGo Üsküp'ün Batı Konut Merkezi",
      description: "FastlyGo, büyük konut blokları, Treska Nehri ve güçlü topluluk kimliğiyle Üsküp'ün en kalabalık batı belediyelerinden biri olan Gjorce Petrov'a teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.",
      subtitle: "Gjorce Petrov, Üsküp'ün en büyük ve en yoğun nüfuslu batı belediyelerinden biridir — büyük apartman blokları, yerel pazarlar, okullar ve güçlü bir topluluk duygusuna sahip ağırlıklı olarak konut alanı. FastlyGo kuryelerimiz GPS takibiyle Gjorce Petrov'daki her sokağı ve binayı kapsıyor.",
      keywords: "gjorce petrov teslimat, gjorce petrov kurye üsküp, gjorce petrov yemek teslimat, üsküp batı konut teslimat"
    }
  },
  "suto-orizari": {
    en: {
      title: "Delivery in Suto Orizari | FastlyGo Skopje's Unique Northern Municipality",
      description: "FastlyGo delivers in Suto Orizari, Skopje's unique northern municipality and the world's only Roma-majority municipality with official Roma language status. Known for its vibrant community, colorful markets, and rich cultural traditions, Suto Orizari is a place with a distinct identity. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.",
      subtitle: "Suto Orizari (also known as Šutka) is one of the world's most unique municipalities — the only Roma-majority municipality globally to have Roma as an official language. With a vibrant community, colorful markets, rich musical and cultural traditions, and a strong sense of local identity, Suto Orizari is a place unlike any other in Skopje. FastlyGo is proud to serve the Suto Orizari community, delivering food orders, grocery runs, pharmacy prescriptions, and parcels with live GPS tracking every day of the week.",
      keywords: "delivery suto orizari, courier suto orizari skopje, food delivery sutka, fast delivery suto orizari, Roma municipality delivery skopje"
    },
    mk: {
      title: "Достава во Шуто Оризари | FastlyGo Уникатната Северна Општина на Скопје",
      description: "FastlyGo доставува во Шуто Оризари, уникатната северна општина на Скопје и единствената ромска мнозинска општина во светот со официјален статус на ромскиот јазик. Позната по живописната заедница, шарените пазари и богатите културни традиции, Шуто Оризари е место со посебен идентитет. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.",
      subtitle: "Шуто Оризари (исто така познато како Шутка) е една од најуникатните општини во светот — единствената ромска мнозинска општина глобално со ромски јазик како официјален. Со живописна заедница, шарени пазари, богати музички и културни традиции, Шуто Оризари е место за разлика од кое било друго во Скопје. FastlyGo е горд да и служи на заедницата Шуто Оризари со GPS следење.",
      keywords: "достава шуто оризари, куриер шуто оризари скопје, достава храна шутка, брза достава шуто оризари"
    },
    sq: {
      title: "Dërgesa në Shuto Orizari | FastlyGo Komuna Unike Veriore e Shkupit",
      description: "FastlyGo dërgon në Shuto Orizari, komuna unike veriore e Shkupit dhe komuna e vetme me shumicë rome në botë me statusin zyrtar të gjuhës rome. E njohur për komunitetin e saj të gjallë, tregjet me ngjyra dhe traditat e pasura kulturore, Shuto Orizari është një vend me identitet të veçantë. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.",
      subtitle: "Shuto Orizari (i njohur edhe si Shutka) është një nga komunat më unike në botë — komuna e vetme me shumicë rome globalisht që ka romishten si gjuhë zyrtare. Me komunitet të gjallë, tregje me ngjyra, tradita të pasura muzikore dhe kulturore, Shuto Orizari është një vend ndryshe nga çdo gjë tjetër në Shkup. FastlyGo është i krenuar t'i shërbejë komunitetit të Shuto Orizarit me gjurmim GPS.",
      keywords: "dërgesa shuto orizari, kurier shuto orizari shkup, dërgesa ushqimi shutka, dërgesa e shpejtë shuto orizari"
    },
    tr: {
      title: "Suto Orizari'de Teslimat | FastlyGo Üsküp'ün Eşsiz Kuzey Belediyesi",
      description: "FastlyGo, canlı topluluğu, renkli pazarları ve zengin kültürel gelenekleriyle Üsküp'ün eşsiz kuzey belediyesi ve dünyanın resmi Roman dil statüsüne sahip tek Roman çoğunluklu belediyesi Suto Orizari'ye teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.",
      subtitle: "Suto Orizari (Şutka olarak da bilinir), dünyanın en eşsiz belediyelerinden biridir — Romancayı resmi dil olarak tanıyan küresel ölçekte tek Roman çoğunluklu belediye. Canlı topluluğu, renkli pazarları, zengin müzikal ve kültürel gelenekleriyle Suto Orizari, Üsküp'te başka hiçbir yere benzemeyen bir yerdir. FastlyGo, Suto Orizari topluluğuna GPS takibiyle hizmet vermekten gurur duyuyor.",
      keywords: "suto orizari teslimat, suto orizari kurye üsküp, şutka yemek teslimat, üsküp roman mahallesi teslimat"
    }
  }
};

// Slug to area ID mapping
const SLUG_TO_ID = {
  aerodrom: 1,
  centar: 3,
  karpos: 4,
  "kisela-voda": 5,
  cair: 6,
  "gazi-baba": 7,
  saraj: 8,
  butel: 9,
  skopje: 30001,
  tetovo: 30002,
  bitola: 30003,
  kumanovo: 30004,
  istip: 30005,
  veles: 30006,
  prilep: 30007,
  kocani: 30008,
  strumica: 30009,
  gostivar: 30010,
  ohrid: 30011,
  "gjorce-petrov": 60001,
  "suto-orizari": 60003
};

// Remaining cities from the other file
const REMAINING_SEO = {
  istip: {
    en: { title: "Delivery in Shtip | FastlyGo — Eastern Macedonia's Cultural Capital", description: "FastlyGo delivers in Shtip, the cultural capital of eastern North Macedonia and a city known for its rich textile industry, the historic Isar Fortress overlooking the city, and the beautiful Bregalnica River valley. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes with live GPS tracking.", subtitle: "Shtip is eastern Macedonia's cultural and economic hub, famous for its textile industry, the ancient Isar Fortress, and the scenic Bregalnica River. FastlyGo's couriers cover all neighborhoods in Shtip, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking every day of the week.", keywords: "delivery shtip, courier shtip, food delivery shtip, fast delivery shtip north macedonia, Isar Fortress area delivery" },
    mk: { title: "Достава во Штип | FastlyGo — Културна Престолнина на Источна Македонија", description: "FastlyGo доставува во Штип, културната престолнина на источна Македонија и град познат по богатата текстилна индустрија, историската тврдина Исар и убавата долина на реката Брегалница. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути со GPS следење.", subtitle: "Штип е економскиот и културниот центар на источна Македонија, познат по текстилната индустрија, античката тврдина Исар и живописната Брегалница. Нашите куриери ги покриваат сите населби во Штип со GPS следење.", keywords: "достава штип, куриер штип, достава храна штип, брза достава штип" },
    sq: { title: "Dërgesa në Shtip | FastlyGo — Kryeqyteti Kulturor i Maqedonisë Lindore", description: "FastlyGo dërgon në Shtip, kryeqyteti kulturor i Maqedonisë Lindore dhe një qytet i njohur për industrinë e tij të pasur tekstile, Kalanë historike Isar dhe luginën e bukur të lumit Bregalnica. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave me gjurmim GPS.", subtitle: "Shtip është qendra kulturore dhe ekonomike e Maqedonisë Lindore, i famshëm për industrinë tekstile, Kalanë antike Isar dhe lumin Bregalnica. Kurierët tanë mbulojnë të gjitha lagjet me gjurmim GPS.", keywords: "dërgesa shtip, kurier shtip, dërgesa ushqimi shtip, dërgesa e shpejtë shtip" },
    tr: { title: "Ştip'te Teslimat | FastlyGo — Doğu Makedonya'nın Kültür Başkenti", description: "FastlyGo, zengin tekstil endüstrisi, şehre hâkim tarihi İsar Kalesi ve güzel Bregalnitsa Nehri vadisiyle Doğu Kuzey Makedonya'nın kültür başkenti Ştip'e teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada GPS takibiyle teslim edilir.", subtitle: "Ştip, Doğu Makedonya'nın kültürel ve ekonomik merkezidir; tekstil endüstrisi, antik İsar Kalesi ve manzaralı Bregalnitsa Nehri ile ünlüdür. Kurye ekibimiz Ştip'in tüm mahallelerini GPS takibiyle kapsıyor.", keywords: "ştip teslimat, ştip kurye, ştip yemek teslimat, kuzey makedonya doğu teslimat" }
  },
  veles: {
    en: { title: "Delivery in Veles | FastlyGo — Heart of North Macedonia on the Vardar", description: "FastlyGo delivers in Veles, a historic city at the geographic heart of North Macedonia situated along the Vardar River, birthplace of poet Kosta Racin, and known for its distinctive bridge and riverside promenade. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.", subtitle: "Veles is one of North Macedonia's most historically significant cities, located at the geographic center of the country along the Vardar River. With a rich Ottoman heritage, a famous bridge, and a growing industrial and commercial base, Veles is a community that deserves fast, dependable delivery. FastlyGo covers all neighborhoods with live GPS tracking.", keywords: "delivery veles, courier veles, food delivery veles, fast delivery veles north macedonia, Vardar River delivery" },
    mk: { title: "Достава во Велес | FastlyGo — Срцето на Македонија на Вардар", description: "FastlyGo доставува во Велес, историски град во географскиот центар на Македонија покрај реката Вардар, родното место на поетот Коста Рацин, познат по карактеристичниот мост и кејот. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.", subtitle: "Велес е еден од историски најзначајните градови во Македонија, сместен во географскиот центар на земјата покрај Вардар. Со богато отоманско наследство и растечка индустрија, FastlyGo ги покрива сите населби со GPS следење.", keywords: "достава велес, куриер велес, достава храна велес, брза достава велес" },
    sq: { title: "Dërgesa në Veles | FastlyGo — Zemra e Maqedonisë në Vardar", description: "FastlyGo dërgon në Veles, një qytet historik në zemrën gjeografike të Maqedonisë të vendosur përgjatë lumit Vardar, vendlindja e poetit Kosta Racin, i njohur për urën e tij karakteristike. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.", subtitle: "Velesi është një nga qytetet historikisht më të rëndësishme të Maqedonisë, i vendosur në qendrën gjeografike të vendit. Me trashëgimi të pasur otomane dhe bazë industriale në rritje, FastlyGo mbulon të gjitha lagjet me gjurmim GPS.", keywords: "dërgesa veles, kurier veles, dërgesa ushqimi veles, dërgesa e shpejtë veles" },
    tr: { title: "Veles'te Teslimat | FastlyGo — Vardar Üzerinde Makedonya'nın Kalbi", description: "FastlyGo, Vardar Nehri boyunca Kuzey Makedonya'nın coğrafi kalbinde yer alan, şair Kosta Raçin'in doğduğu yer ve karakteristik köprüsüyle bilinen tarihi şehir Veles'e teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.", subtitle: "Veles, Vardar Nehri boyunca ülkenin coğrafi merkezinde yer alan Kuzey Makedonya'nın tarihi açıdan en önemli şehirlerinden biridir. Zengin Osmanlı mirası ve büyüyen sanayi tabanıyla FastlyGo tüm mahalleleri GPS takibiyle kapsıyor.", keywords: "veles teslimat, veles kurye, veles yemek teslimat, kuzey makedonya teslimat" }
  },
  prilep: {
    en: { title: "Delivery in Prilep | FastlyGo — City of Tobacco, Fast Delivery", description: "FastlyGo delivers in Prilep, the 'City of Tobacco' and one of North Macedonia's most important industrial and cultural centers, known for world-renowned tobacco production, the medieval Marko's Tower fortress, and a strong tradition of craftsmanship. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.", subtitle: "Prilep is one of North Macedonia's most distinctive cities — famous worldwide for its premium tobacco, the historic Marko's Tower fortress, and a rich tradition of stone masonry and crafts. FastlyGo brings modern delivery convenience to Prilep, covering every neighborhood with professional couriers and live GPS tracking, seven days a week.", keywords: "delivery prilep, courier prilep, food delivery prilep, fast delivery prilep north macedonia, Marko Tower area delivery" },
    mk: { title: "Достава во Прилеп | FastlyGo — Градот на Тутунот, Брза Достава", description: "FastlyGo доставува во Прилеп, 'Градот на тутунот' и еден од најважните индустриски и културни центри во Македонија, познат по светски признатото производство на тутун, средновековниот Марков Кале и силната традиција на занаетчиство. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.", subtitle: "Прилеп е еден од најдистинктивните градови во Македонија — светски познат по премиум тутунот, историскиот Марков Кале и богатата традиција на каменорезаштво. FastlyGo носи модерна удобност за достава во Прилеп со GPS следење.", keywords: "достава прилеп, куриер прилеп, достава храна прилеп, брза достава прилеп" },
    sq: { title: "Dërgesa në Prilep | FastlyGo — Qyteti i Duhanit, Dërgesa e Shpejtë", description: "FastlyGo dërgon në Prilep, 'Qyteti i Duhanit' dhe një nga qendrat industriale dhe kulturore më të rëndësishme të Maqedonisë, i njohur për prodhimin e tij të duhanit të njohur botërisht, kalanë mesjetare Marko's Tower dhe traditën e fortë të zejtarisë. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.", subtitle: "Prilepи është një nga qytetet më dalluese të Maqedonisë — i famshëm në mbarë botën për duhanin premium, Kalanë historike të Markos dhe traditën e pasur të gdhendjes në gur. FastlyGo sjell komoditetin modern të dërgesës në Prilep me gjurmim GPS.", keywords: "dërgesa prilep, kurier prilep, dërgesa ushqimi prilep, dërgesa e shpejtë prilep" },
    tr: { title: "Prilep'te Teslimat | FastlyGo — Tütün Şehri, Hızlı Teslimat", description: "FastlyGo, dünya çapında tanınan tütün üretimi, ortaçağdan kalma Marko Kulesi kalesi ve güçlü el sanatları geleneğiyle 'Tütün Şehri' ve Kuzey Makedonya'nın en önemli sanayi ve kültür merkezlerinden biri olan Prilep'e teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.", subtitle: "Prilep, Kuzey Makedonya'nın en özgün şehirlerinden biridir — premium tütünüyle dünyaca ünlü, tarihi Marko Kulesi kalesi ve zengin taş işçiliği geleneğiyle öne çıkar. FastlyGo Prilep'e modern teslimat kolaylığı getiriyor, GPS takibiyle tüm mahalleleri kapsıyor.", keywords: "prilep teslimat, prilep kurye, prilep yemek teslimat, kuzey makedonya teslimat" }
  },
  kocani: {
    en: { title: "Delivery in Kocani | FastlyGo — North Macedonia's Rice Capital", description: "FastlyGo delivers in Kocani, the rice capital of North Macedonia and the economic heart of the Kocani Valley in the eastern part of the country, famous for producing the finest rice in the Balkans, surrounded by fertile agricultural land and thermal springs. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.", subtitle: "Kocani is North Macedonia's rice-growing capital, set in the fertile Kocani Valley with rich agricultural traditions, thermal spa resorts, and a proud local culture. FastlyGo's couriers cover all neighborhoods in Kocani, delivering food orders, grocery runs, pharmacy prescriptions, and business parcels with live GPS tracking, every day of the week.", keywords: "delivery kocani, courier kocani, food delivery kocani, fast delivery kocani north macedonia, rice capital Macedonia delivery" },
    mk: { title: "Достава во Кочани | FastlyGo — Ориз-Престолнината на Македонија", description: "FastlyGo доставува во Кочани, ориз-престолнината на Македонија и економскиот центар на Кочанската Котлина, позната по производството на најфиниот ориз на Балканот, опкружена со плодна земјоделска земја и термални извори. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.", subtitle: "Кочани е ориз-престолнината на Македонија, сместена во плодната Кочанска Котлина со богати земјоделски традиции и термални спа-одморалишта. Нашите куриери ги покриваат сите населби во Кочани со GPS следење.", keywords: "достава кочани, куриер кочани, достава храна кочани, брза достава кочани" },
    sq: { title: "Dërgesa në Koçan | FastlyGo — Kryeqyteti i Orizit të Maqedonisë", description: "FastlyGo dërgon në Koçan, kryeqyteti i orizit të Maqedonisë dhe zemra ekonomike e Luginës së Koçanit, i famshëm për prodhimin e orizit më të mirë në Ballkan, i rrethuar nga toka bujqësore pjellore dhe burime termale. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.", subtitle: "Koçani është kryeqyteti i kultivimit të orizit të Maqedonisë, i vendosur në Luginën pjellore të Koçanit me tradita të pasura bujqësore dhe kurort termale. Kurierët tanë mbulojnë të gjitha lagjet me gjurmim GPS.", keywords: "dërgesa koçan, kurier koçan, dërgesa ushqimi koçan, dërgesa e shpejtë koçan" },
    tr: { title: "Koçani'de Teslimat | FastlyGo — Kuzey Makedonya'nın Pirinç Başkenti", description: "FastlyGo, Balkanlar'ın en kaliteli pirinç üretimiyle ünlü, verimli tarım arazileri ve termal kaynaklarla çevrili Kuzey Makedonya'nın pirinç başkenti ve Koçani Vadisi'nin ekonomik kalbi Koçani'ye teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.", subtitle: "Koçani, Kuzey Makedonya'nın pirinç yetiştirme başkentidir; zengin tarım gelenekleri ve termal spa tatil köyleriyle verimli Koçani Vadisi'nde yer alır. Kurye ekibimiz Koçani'nin tüm mahallelerini GPS takibiyle kapsıyor.", keywords: "koçani teslimat, koçani kurye, koçani yemek teslimat, kuzey makedonya doğu teslimat" }
  },
  strumica: {
    en: { title: "Delivery in Strumica | FastlyGo — Southeast Macedonia's Carnival City", description: "FastlyGo delivers in Strumica, the agricultural capital of southeastern North Macedonia, famous for its spectacular annual carnival (one of the largest in the Balkans), fertile plains producing peppers and watermelons, and proximity to Greek and Bulgarian borders. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.", subtitle: "Strumica is southeastern Macedonia's most important city, famous for its spectacular annual carnival, its fertile agricultural plains, and its proximity to international borders. FastlyGo covers all neighborhoods in Strumica with live GPS tracking and 15-minute delivery service.", keywords: "delivery strumica, courier strumica, food delivery strumica, fast delivery strumica north macedonia, Strumica carnival area delivery" },
    mk: { title: "Достава во Струмица | FastlyGo — Карневалскиот Град на Југоисточна Македонија", description: "FastlyGo доставува во Струмица, земјоделската престолнина на југоисточна Македонија, позната по спектакуларниот годишен карневал, плодните рамници и близината до грчката и бугарската граница. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.", subtitle: "Струмица е најважниот град во југоисточна Македонија, познат по спектакуларниот годишен карневал, плодните рамници и близината до меѓународните граници. FastlyGo ги покрива сите населби во Струмица со GPS следење.", keywords: "достава струмица, куриер струмица, достава храна струмица, брза достава струмица" },
    sq: { title: "Dërgesa në Strumicë | FastlyGo — Qyteti i Karnevalit të Maqedonisë Juglindore", description: "FastlyGo dërgon në Strumicë, kryeqyteti bujqësor i Maqedonisë Juglindore, i famshëm për karnevalin e tij spektakolar vjetor, rrafshet pjellore bujqësore dhe afërsinë me kufijtë grek dhe bullgar. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.", subtitle: "Strumicë është qyteti më i rëndësishëm i Maqedonisë Juglindore, i famshëm për karnevalin e tij spektakolar vjetor dhe rrafshet pjellore bujqësore. FastlyGo mbulon të gjitha lagjet me gjurmim GPS.", keywords: "dërgesa strumicë, kurier strumicë, dërgesa ushqimi strumicë, dërgesa e shpejtë strumicë" },
    tr: { title: "Strumitsa'da Teslimat | FastlyGo — Güneydoğu Makedonya'nın Karnaval Şehri", description: "FastlyGo, Balkanlar'ın en büyüklerinden biri olan yıllık karnavalı, biber ve karpuz üreten verimli tarım ovaları ve Yunan ile Bulgar sınırlarına yakınlığıyla Güneydoğu Kuzey Makedonya'nın tarım başkenti Strumitsa'ya teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.", subtitle: "Strumitsa, Güneydoğu Makedonya'nın en önemli şehridir; yıllık karnavalı, verimli tarım ovaları ve uluslararası sınırlara yakınlığıyla ünlüdür. FastlyGo tüm mahalleleri GPS takibiyle kapsıyor.", keywords: "strumitsa teslimat, strumitsa kurye, strumitsa yemek teslimat, kuzey makedonya güneydoğu teslimat" }
  },
  gostivar: {
    en: { title: "Delivery in Gostivar | FastlyGo — Polog Valley's Multicultural Commercial Hub", description: "FastlyGo delivers in Gostivar, a vibrant multicultural city in western North Macedonia and the commercial gateway to the Polog Valley, with a diverse Albanian, Macedonian, and Turkish community, a lively bazaar, and a strategic location near Kosovo and Albanian borders. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.", subtitle: "Gostivar is western North Macedonia's most important commercial hub, a multicultural city with a bustling bazaar, diverse communities, and a strategic position in the Polog Valley near international borders. FastlyGo's couriers cover all neighborhoods in Gostivar with live GPS tracking, delivering food orders, grocery runs, pharmacy needs, and business parcels every day of the week.", keywords: "delivery gostivar, courier gostivar, food delivery gostivar, fast delivery gostivar north macedonia, Polog Valley delivery" },
    mk: { title: "Достава во Гостивар | FastlyGo — Мултикултурниот Трговски Центар на Полог", description: "FastlyGo доставува во Гостивар, живописен мултикултурен град во западна Македонија и трговска порта кон Полошката Долина, со разновидна албанска, македонска и турска заедница, живописен базар и стратешка локација. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.", subtitle: "Гостивар е најважниот трговски центар во западна Македонија, мултикултурен град со прометен базар и стратешка позиција во Полошката Долина. Нашите куриери ги покриваат сите населби со GPS следење.", keywords: "достава гостивар, куриер гостивар, достава храна гостивар, брза достава гостивар" },
    sq: { title: "Dërgesa në Gostivar | FastlyGo — Qendra Tregtare Shumëkulturore e Pollogut", description: "FastlyGo dërgon në Gostivar, një qytet shumëkulturor i gjallë në Maqedoninë Perëndimore dhe porta tregtare e Luginës së Pollogut, me komunitet të larmishëm shqiptar, maqedonas dhe turk, çarshi të gjallë dhe pozicion strategjik. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.", subtitle: "Gostivari është qendra tregtare më e rëndësishme e Maqedonisë Perëndimore, një qytet shumëkulturor me çarshi të zhurmshme dhe pozicion strategjik në Luginën e Pollogut. Kurierët tanë mbulojnë të gjitha lagjet me gjurmim GPS.", keywords: "dërgesa gostivar, kurier gostivar, dërgesa ushqimi gostivar, dërgesa e shpejtë gostivar" },
    tr: { title: "Gostivar'da Teslimat | FastlyGo — Polog Vadisi'nin Çok Kültürlü Ticaret Merkezi", description: "FastlyGo, çeşitli Arnavut, Makedon ve Türk topluluğu, canlı çarşısı ve Kosova ile Arnavutluk sınırlarına yakın stratejik konumuyla Batı Kuzey Makedonya'nın canlı çok kültürlü şehri ve Polog Vadisi'nin ticaret kapısı Gostivar'a teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.", subtitle: "Gostivar, Batı Kuzey Makedonya'nın en önemli ticaret merkezidir; kalabalık çarşısı, çeşitli toplulukları ve Polog Vadisi'ndeki stratejik konumuyla öne çıkar. Kurye ekibimiz tüm mahalleleri GPS takibiyle kapsıyor.", keywords: "gostivar teslimat, gostivar kurye, gostivar yemek teslimat, polog vadisi teslimat" }
  },
  ohrid: {
    en: { title: "Delivery in Ohrid | FastlyGo — UNESCO Heritage City on Lake Ohrid", description: "FastlyGo delivers in Ohrid, North Macedonia's most beloved city and a UNESCO World Heritage Site on the shores of Lake Ohrid, known as the 'Jerusalem of the Balkans' for its hundreds of churches, the ancient Samuel's Fortress, and crystal-clear lake waters. Order food, groceries, pharmacy items, or send packages — delivered in 15 minutes.", subtitle: "Ohrid is North Macedonia's crown jewel — a UNESCO World Heritage city on the shores of one of Europe's oldest and deepest lakes. With over 365 churches, the ancient Samuel's Fortress, stunning Byzantine frescoes, and a thriving tourism economy, Ohrid attracts visitors from around the world. FastlyGo serves residents, hotels, restaurants, and businesses in Ohrid with live GPS tracking and 15-minute delivery.", keywords: "delivery ohrid, courier ohrid, food delivery ohrid, fast delivery ohrid north macedonia, Lake Ohrid delivery, UNESCO site delivery" },
    mk: { title: "Достава во Охрид | FastlyGo — УНЕСКО Наследство на Охридското Езеро", description: "FastlyGo доставува во Охрид, најсаканиот град на Македонија и УНЕСКО Светска Наследство на брегот на Охридското Езеро, познат како 'Ерусалим на Балканот' поради стотиците цркви, античката тврдина на Самуил и кристалните езерски води. Нарачајте храна, намирници, лекови или испратете пакети — доставено за 15 минути.", subtitle: "Охрид е круната на Македонија — УНЕСКО град на брегот на едното од најстарите и најдлабоките езера во Европа. Со над 365 цркви, античката тврдина на Самуил и процветачка туристичка економија, FastlyGo им служи на жителите, хотелите, ресторантите и бизнисите во Охрид со GPS следење.", keywords: "достава охрид, куриер охрид, достава храна охрид, брза достава охрид, охридско езеро достава" },
    sq: { title: "Dërgesa në Ohër | FastlyGo — Qyteti i Trashëgimisë UNESCO në Liqenin e Ohrit", description: "FastlyGo dërgon në Ohër, qyteti më i dashur i Maqedonisë dhe një Trashëgimi Botërore e UNESCO-s në brigjet e Liqenit të Ohrit, i njohur si 'Jeruzalemi i Ballkanit' për qindra kishat e tij, Kalanë antike të Samuelit dhe ujërat e pastër kristal. Porosit ushqim, ushqime, ilaçe ose dërgo paketa — dorëzuar brenda 15 minutave.", subtitle: "Ohri është xhevahiri i kurorës së Maqedonisë — një qytet UNESCO në brigjet e njërit prej liqeneve më të vjetër dhe më të thellë të Evropës. Me mbi 365 kisha dhe ekonomi turistike të lulëzuar, FastlyGo u shërben banorëve, hoteleve, restoranteve dhe bizneseve me gjurmim GPS.", keywords: "dërgesa ohër, kurier ohër, dërgesa ushqimi ohër, dërgesa e shpejtë ohër, liqeni ohrit dërgesa" },
    tr: { title: "Ohrid'de Teslimat | FastlyGo — Ohrid Gölü'ndeki UNESCO Miras Şehri", description: "FastlyGo, yüzlerce kilisesi, antik Samuel Kalesi ve kristal berraklığındaki göl sularıyla 'Balkanların Kudüs'ü' olarak bilinen Kuzey Makedonya'nın en sevilen şehri ve Ohrid Gölü kıyısındaki UNESCO Dünya Mirası Alanı Ohrid'e teslimat yapar. Yemek, market, eczane siparişi verin veya paket gönderin — 15 dakikada teslim edilir.", subtitle: "Ohrid, Kuzey Makedonya'nın taç mücevheridir — Avrupa'nın en eski ve en derin göllerinden birinin kıyısında UNESCO Dünya Mirası şehri. 365'ten fazla kilisesi ve gelişen turizm ekonomisiyle FastlyGo Ohrid'deki sakinlere, otellere, restoranlara ve işletmelere GPS takibiyle hizmet veriyor.", keywords: "ohrid teslimat, ohrid kurye, ohrid yemek teslimat, ohrid gölü teslimat, kuzey makedonya turizm teslimat" }
  }
};

// Merge all SEO data
const ALL_SEO = { ...SEO_DATA, ...REMAINING_SEO };

async function main() {
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);
  
  let updated = 0;
  let skipped = 0;
  
  for (const [slug, seoData] of Object.entries(ALL_SEO)) {
    const areaId = SLUG_TO_ID[slug];
    if (!areaId) {
      console.log(`⚠️  No ID found for slug: ${slug}`);
      skipped++;
      continue;
    }
    
    // Build seoMeta JSON
    const seoMeta = {
      en: {
        title: seoData.en.title,
        description: seoData.en.description,
        subtitle: seoData.en.subtitle,
        keywords: seoData.en.keywords
      },
      mk: {
        title: seoData.mk.title,
        description: seoData.mk.description,
        subtitle: seoData.mk.subtitle || seoData.mk.description,
        keywords: seoData.mk.keywords
      },
      sq: {
        title: seoData.sq.title,
        description: seoData.sq.description,
        subtitle: seoData.sq.subtitle || seoData.sq.description,
        keywords: seoData.sq.keywords
      },
      tr: {
        title: seoData.tr.title,
        description: seoData.tr.description,
        subtitle: seoData.tr.subtitle || seoData.tr.description,
        keywords: seoData.tr.keywords
      }
    };
    
    await conn.execute(
      'UPDATE areas SET seoMeta = ?, updatedAt = NOW() WHERE id = ?',
      [JSON.stringify(seoMeta), areaId]
    );
    
    console.log(`✅ Updated: ${slug} (id=${areaId})`);
    updated++;
  }
  
  console.log(`\n📊 Summary: ${updated} updated, ${skipped} skipped`);
  await conn.end();
}

main().catch(console.error);
