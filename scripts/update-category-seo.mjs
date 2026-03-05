import mysql2 from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const CATEGORY_SEO = {
  "food-delivery": {
    en: {
      description: "Order food delivery in North Macedonia with FastlyGo — your go-to platform for pizza, burgers, sushi, kebabs, wraps, desserts, and cuisine from dozens of top-rated local restaurants. Whether you're craving a late-night burger, a fresh sushi platter, or a family-sized pizza, FastlyGo connects you with the best restaurants in your city and delivers hot, fresh meals to your door in 15 minutes. Real-time GPS tracking, flexible payment options, and no minimum order.",
      subtitle: "FastlyGo's food delivery service covers restaurants across Skopje, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar, and more. Browse menus, place your order in seconds, and track your courier live on the map. We partner with local favorites and popular chains alike — from traditional Macedonian cuisine to international fast food, Italian, Asian, and healthy options.",
      keywords: "food delivery north macedonia, order food online skopje, pizza delivery skopje, burger delivery, sushi delivery, restaurant delivery 15 minutes, fast food delivery north macedonia, fastlygo food"
    },
    mk: {
      description: "Нарачајте достава на храна во Македонија со FastlyGo — вашата платформа за пица, бургери, суши, кебап, завиткувачи, десерти и јадења од десетици врвни локални ресторани. Без разлика дали посакувате бургер навечер, свежа чинија суши или пица за семејство, FastlyGo ве поврзува со најдобрите ресторани во вашиот град и доставува топли, свежи оброци до вашата врата за 15 минути. GPS следење во реално време, флексибилни опции за плаќање и без минимална нарачка.",
      subtitle: "Услугата за достава на храна на FastlyGo ги покрива ресторантите низ Скопје, Битола, Охрид, Тетово, Куманово, Гостивар и повеќе. Прегледајте мениа, направете нарачка за секунди и следете го вашиот куриер во живо на картата.",
      keywords: "достава храна македонија, нарачај храна онлајн скопје, достава пица скопје, достава бургери, достава суши, достава ресторан 15 минути, брза достава храна македонија"
    },
    sq: {
      description: "Porosit dërgesa ushqimi në Maqedoninë e Veriut me FastlyGo — platforma juaj kryesore për pica, hamburgerë, sushi, qebap, rrotulla, ëmbëlsira dhe kuzhinë nga dhjetëra restorante lokale me vlerësim të lartë. Pavarësisht nëse dëshironi një hamburger gjatë natës, një pjatë sushi të freskët ose një picë familjare, FastlyGo ju lidh me restorantet më të mira në qytetin tuaj dhe dorëzon vakte të nxehta, të freskëta në derën tuaj brenda 15 minutave.",
      subtitle: "Shërbimi i dërgimit të ushqimit i FastlyGo mbulon restorantet në Shkup, Manastir, Ohër, Tetovë, Kumanovë, Gostivar dhe më shumë. Shfletoni menytë, bëni porosinë tuaj në sekonda dhe gjurmoni kurjerin tuaj live në hartë.",
      keywords: "dërgesa ushqimi maqedonia, porosit ushqim online shkup, dërgesa picë shkup, dërgesa hamburger, dërgesa sushi, dërgesa restoranti 15 minuta, dërgesa e shpejtë ushqimi maqedonia"
    },
    tr: {
      description: "Kuzey Makedonya'da FastlyGo ile yemek siparişi verin — pizza, burger, suşi, kebap, dürüm, tatlı ve düzinelerce üst düzey yerel restorandan yemek için başvuracağınız platform. Gece geç saatlerde burger, taze suşi tabağı veya aile boyu pizza isteseniz de FastlyGo sizi şehrinizdeki en iyi restoranlarla buluşturur ve 15 dakikada sıcak, taze yemekleri kapınıza teslim eder. Gerçek zamanlı GPS takibi, esnek ödeme seçenekleri ve minimum sipariş yok.",
      subtitle: "FastlyGo'nun yemek teslimat hizmeti Üsküp, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar ve daha fazlasındaki restoranları kapsıyor. Menülere göz atın, saniyeler içinde sipariş verin ve kuryenizi haritada canlı takip edin.",
      keywords: "yemek teslimat kuzey makedonya, online yemek sipariş üsküp, pizza teslimat üsküp, burger teslimat, suşi teslimat, restoran teslimat 15 dakika, hızlı yemek teslimat makedonya"
    }
  },
  "grocery-delivery": {
    en: {
      description: "Get groceries delivered to your door in 15 minutes with FastlyGo — fresh fruits, vegetables, dairy, bread, meat, beverages, snacks, cleaning supplies, and household essentials from local supermarkets and shops. Skip the queue and the commute: FastlyGo's grocery delivery service brings your entire weekly shopping list straight to your home or office, with live GPS tracking and same-day delivery across North Macedonia.",
      subtitle: "FastlyGo partners with local supermarkets, convenience stores, and specialty food shops to offer the widest grocery selection in your city. From organic produce and imported goods to everyday staples and last-minute items, our couriers pick, pack, and deliver your order with care — usually in under 15 minutes. Available in Skopje, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar, and more cities.",
      keywords: "grocery delivery north macedonia, supermarket delivery skopje, fresh vegetables delivery, online grocery order skopje, same day grocery delivery, household essentials delivery, fastlygo grocery"
    },
    mk: {
      description: "Добијте намирници доставени до вашата врата за 15 минути со FastlyGo — свежо овошје, зеленчук, млечни производи, леб, месо, пијалоци, грицки, средства за чистење и домашни потрепштини од локални супермаркети и продавници. Прескокнете ги редиците и патувањето: услугата за достава на намирници на FastlyGo го носи целиот ваш список за неделно купување директно до вашиот дом или канцеларија.",
      subtitle: "FastlyGo соработува со локални супермаркети, продавници и специјализирани прехранбени продавници за да понуди најширок избор на намирници во вашиот град. Достапно во Скопје, Битола, Охрид, Тетово, Куманово, Гостивар и повеќе градови.",
      keywords: "достава намирници македонија, достава супермаркет скопје, достава свеж зеленчук, онлајн нарачка намирници скопје, достава ист ден, достава домашни потрепштини"
    },
    sq: {
      description: "Merrni ushqimet e dorëzuara në derën tuaj brenda 15 minutave me FastlyGo — fruta të freskëta, perime, produkte qumështi, bukë, mish, pije, ushqime të lehta, produkte pastrimi dhe të domosdoshme shtëpiake nga supermarketet dhe dyqanet lokale. Anashkaloni radhët dhe udhëtimin: shërbimi i dërgimit të ushqimeve të FastlyGo sjell të gjithë listën tuaj javore të blerjeve direkt në shtëpinë ose zyrën tuaj.",
      subtitle: "FastlyGo bashkëpunon me supermarkete lokale, dyqane dhe dyqane ushqimore të specializuara për të ofruar zgjedhjen më të gjerë të ushqimeve në qytetin tuaj. I disponueshëm në Shkup, Manastir, Ohër, Tetovë, Kumanovë, Gostivar dhe qytete të tjera.",
      keywords: "dërgesa ushqimesh maqedonia, dërgesa supermarket shkup, dërgesa perime të freskëta, porosi ushqimesh online shkup, dërgesa e ditës, dërgesa të domosdoshme shtëpiake"
    },
    tr: {
      description: "FastlyGo ile 15 dakikada kapınıza market alışverişi yaptırın — yerel süpermarketler ve dükkanlardan taze meyve, sebze, süt ürünleri, ekmek, et, içecek, atıştırmalık, temizlik malzemeleri ve ev ihtiyaçları. Kuyruklara ve yolculuğa son: FastlyGo'nun market teslimat hizmeti haftalık alışveriş listenizin tamamını doğrudan evinize veya ofisinize getirir, canlı GPS takibi ve aynı gün teslimatla.",
      subtitle: "FastlyGo, şehrinizdeki en geniş market seçimini sunmak için yerel süpermarketler, marketler ve özel gıda dükkanlarıyla iş birliği yapıyor. Üsküp, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar ve daha fazla şehirde mevcut.",
      keywords: "market teslimat kuzey makedonya, süpermarket teslimat üsküp, taze sebze teslimat, online market sipariş üsküp, aynı gün teslimat, ev ihtiyaçları teslimat, fastlygo market"
    }
  },
  "pharmacy-delivery": {
    en: {
      description: "Order prescription medicines, over-the-counter drugs, vitamins, supplements, baby care products, and health essentials with FastlyGo's pharmacy delivery service — delivered to your door in 15 minutes across North Macedonia. No need to leave home when you're unwell: FastlyGo connects you with licensed local pharmacies and delivers your medications quickly, safely, and discreetly. Available 7 days a week with real-time GPS tracking.",
      subtitle: "FastlyGo's pharmacy delivery covers a wide range of health products: antibiotics, pain relievers, allergy medications, vitamins, probiotics, baby formula, personal care items, medical devices, and more. Our courier partners work with certified pharmacies in Skopje, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar, and other cities to ensure your health needs are met promptly.",
      keywords: "pharmacy delivery north macedonia, medicine delivery skopje, prescription delivery, vitamins delivery skopje, drug delivery home, health products delivery, fastlygo pharmacy, online pharmacy north macedonia"
    },
    mk: {
      description: "Нарачајте лекови на рецепт, лекови без рецепт, витамини, суплементи, производи за нега на бебиња и здравствени потрепштини со услугата за достава на аптека на FastlyGo — доставено до вашата врата за 15 минути низ Македонија. Нема потреба да излегувате кога сте болни: FastlyGo ве поврзува со лиценцирани локални аптеки и ги доставува вашите лекови брзо, безбедно и дискретно.",
      subtitle: "Доставата на аптека на FastlyGo покрива широк спектар на здравствени производи: антибиотици, аналгетици, лекови за алергија, витамини, пробиотици, формула за бебиња, производи за лична нега, медицински уреди и многу повеќе. Достапно во Скопје, Битола, Охрид, Тетово, Куманово, Гостивар и други градови.",
      keywords: "достава аптека македонија, достава лекови скопје, достава рецепт, достава витамини скопје, достава лекови дома, достава здравствени производи, онлајн аптека македонија"
    },
    sq: {
      description: "Porosit ilaçe me recetë, ilaçe pa recetë, vitamina, suplemente, produkte kujdesi për fëmijë dhe të domosdoshme shëndetësore me shërbimin e dërgimit të farmacisë FastlyGo — dorëzuar në derën tuaj brenda 15 minutave në të gjithë Maqedoninë. Nuk keni nevojë të dilni nga shtëpia kur jeni të sëmurë: FastlyGo ju lidh me farmacitë lokale të licencuara dhe dorëzon ilaçet tuaja shpejt, me siguri dhe diskretisht.",
      subtitle: "Dërgimi i farmacisë FastlyGo mbulon një gamë të gjerë produktesh shëndetësore: antibiotikë, qetësues dhimbjesh, ilaçe kundër alergjisë, vitamina, probiotikë, formula foshnjash, produkte kujdesi personal, pajisje mjekësore dhe më shumë. I disponueshëm në Shkup, Manastir, Ohër, Tetovë, Kumanovë, Gostivar dhe qytete të tjera.",
      keywords: "dërgesa farmaci maqedonia, dërgesa ilaçesh shkup, dërgesa recetë, dërgesa vitaminash shkup, dërgesa ilaçesh në shtëpi, dërgesa produktesh shëndetësore, farmaci online maqedonia"
    },
    tr: {
      description: "FastlyGo'nun eczane teslimat hizmetiyle reçeteli ilaçlar, reçetesiz ilaçlar, vitaminler, takviyeler, bebek bakım ürünleri ve sağlık ihtiyaçlarını Kuzey Makedonya genelinde 15 dakikada kapınıza sipariş edin. Hasta olduğunuzda evden çıkmanıza gerek yok: FastlyGo sizi lisanslı yerel eczanelerle buluşturur ve ilaçlarınızı hızlı, güvenli ve gizlilik içinde teslim eder. Haftanın 7 günü, gerçek zamanlı GPS takibiyle.",
      subtitle: "FastlyGo'nun eczane teslimatı geniş bir sağlık ürünleri yelpazesini kapsıyor: antibiyotikler, ağrı kesiciler, alerji ilaçları, vitaminler, probiyotikler, bebek maması, kişisel bakım ürünleri, tıbbi cihazlar ve daha fazlası. Üsküp, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar ve diğer şehirlerde mevcut.",
      keywords: "eczane teslimat kuzey makedonya, ilaç teslimat üsküp, reçete teslimat, vitamin teslimat üsküp, eve ilaç teslimat, sağlık ürünleri teslimat, online eczane makedonya"
    }
  },
  "flower-delivery": {
    en: {
      description: "Send fresh flowers, bouquets, and floral arrangements with FastlyGo's flower delivery service — roses, tulips, lilies, sunflowers, orchids, and custom arrangements delivered in 15 minutes across North Macedonia. Perfect for birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, funerals, and spontaneous gestures of love. FastlyGo partners with local florists to ensure every bouquet arrives fresh, beautifully wrapped, and on time.",
      subtitle: "Whether you need a last-minute birthday bouquet, a romantic anniversary arrangement, a sympathy wreath, or a corporate floral display, FastlyGo's flower delivery connects you with the best local florists in Skopje, Bitola, Ohrid, Tetovo, and beyond. Order online in seconds, choose your delivery time, and let FastlyGo handle the rest — fresh flowers, fast delivery, every time.",
      keywords: "flower delivery north macedonia, bouquet delivery skopje, rose delivery, send flowers skopje, florist delivery, same day flower delivery, birthday flowers delivery, anniversary flowers north macedonia"
    },
    mk: {
      description: "Испратете свежи цвеќиња, букети и цветни аранжмани со услугата за достава на цвеќиња на FastlyGo — рози, лалиња, лилиуми, сончогледи, орхидеи и прилагодени аранжмани доставени за 15 минути низ Македонија. Совршено за роденденски денови, годишнини, Денот на вљубените, Денот на мајките, свадби, погреби и спонтани гестови на љубов.",
      subtitle: "Без разлика дали ви треба букет за роденден во последен момент, романтичен аранжман за годишнина или корпоративен цветен приказ, доставата на цвеќиња на FastlyGo ве поврзува со најдобрите локални цвеќарници во Скопје, Битола, Охрид, Тетово и пошироко.",
      keywords: "достава цвеќиња македонија, достава букет скопје, достава рози, испрати цвеќиња скопје, достава цвеќарница, достава цвеќиња ист ден, роденденски цвеќиња достава"
    },
    sq: {
      description: "Dërgoni lule të freskëta, buqeta dhe rregullime lulesh me shërbimin e dërgimit të luleve FastlyGo — trëndafila, tulipanë, zambakë, luledielli, orkide dhe rregullime të personalizuara të dorëzuara brenda 15 minutave në të gjithë Maqedoninë. Perfekte për ditëlindje, përvjetorë, Ditën e Shën Valentinit, Ditën e Nënës, dasma, funerale dhe gjeste spontane dashurie.",
      subtitle: "Pavarësisht nëse keni nevojë për një buqetë ditëlindjeje në minutën e fundit, një rregullim romantik përvjetor ose një ekspozitë lulesh korporative, dërgimi i luleve FastlyGo ju lidh me floristët lokalë më të mirë në Shkup, Manastir, Ohër, Tetovë dhe më gjerë.",
      keywords: "dërgesa lulesh maqedonia, dërgesa buqetash shkup, dërgesa trëndafilash, dërgo lule shkup, dërgesa floristi, dërgesa lulesh e ditës, lule ditëlindjeje dërgesa"
    },
    tr: {
      description: "FastlyGo'nun çiçek teslimat hizmetiyle taze çiçekler, buketler ve çiçek aranjmanları gönderin — güller, laleler, zambaklar, ayçiçekleri, orkideler ve özel aranjmanlar Kuzey Makedonya genelinde 15 dakikada teslim edilir. Doğum günleri, yıl dönümleri, Sevgililer Günü, Anneler Günü, düğünler, cenazeler ve spontane sevgi jestleri için mükemmel.",
      subtitle: "Son dakika doğum günü buketi, romantik yıl dönümü aranjmanı veya kurumsal çiçek düzenlemesi olsun, FastlyGo'nun çiçek teslimatı sizi Üsküp, Bitola, Ohrid, Tetovo ve çevresindeki en iyi yerel çiçekçilerle buluşturur.",
      keywords: "çiçek teslimat kuzey makedonya, buket teslimat üsküp, gül teslimat, çiçek gönder üsküp, çiçekçi teslimat, aynı gün çiçek teslimat, doğum günü çiçek teslimat makedonya"
    }
  },
  "cargo-package-delivery": {
    en: {
      description: "Send documents, parcels, packages, and cargo quickly and reliably with FastlyGo's courier delivery service — same-city delivery in 15 minutes across North Macedonia. Whether you need to send a legal document across town, ship a product to a customer, or deliver a gift to a friend, FastlyGo's professional couriers handle your shipment with care. Real-time GPS tracking, proof of delivery, and flexible pickup options.",
      subtitle: "FastlyGo's cargo and package delivery service is ideal for businesses, e-commerce sellers, freelancers, and individuals who need fast, reliable same-city courier services. We handle envelopes, small parcels, medium boxes, and larger cargo items — all tracked in real time. Available in Skopje, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar, and other cities across North Macedonia.",
      keywords: "cargo delivery north macedonia, package delivery skopje, courier service skopje, document delivery, parcel delivery north macedonia, same day courier, business delivery skopje, e-commerce delivery north macedonia"
    },
    mk: {
      description: "Испратете документи, пакети, пакувања и товар брзо и сигурно со услугата за курирска достава на FastlyGo — достава во ист град за 15 минути низ Македонија. Без разлика дали треба да испратите правен документ низ градот, да испратите производ до клиент или да доставите подарок до пријател, професионалните куриери на FastlyGo го ракуваат вашиот пратка со грижа. GPS следење во реално време, потврда за достава и флексибилни опции за подигање.",
      subtitle: "Услугата за достава на товар и пакети на FastlyGo е идеална за бизниси, продавачи на е-трговија, слободни работници и поединци кои имаат потреба од брзи, сигурни курирски услуги во ист град. Достапно во Скопје, Битола, Охрид, Тетово, Куманово, Гостивар и други градови.",
      keywords: "достава товар македонија, достава пакети скопје, куриерска служба скопје, достава документи, достава пакети македонија, куриер ист ден, деловна достава скопје"
    },
    sq: {
      description: "Dërgoni dokumente, pako, paketa dhe ngarkesa shpejt dhe me besueshmëri me shërbimin e dërgimit të kurjerit FastlyGo — dërgim brenda qytetit në 15 minuta në të gjithë Maqedoninë. Pavarësisht nëse keni nevojë të dërgoni një dokument ligjor nëpër qytet, të dërgoni një produkt te një klient ose të dorëzoni një dhuratë te një mik, kurierët profesionalë të FastlyGo trajtojnë dërgesën tuaj me kujdes.",
      subtitle: "Shërbimi i dërgimit të ngarkesave dhe paketave të FastlyGo është ideal për bizneset, shitësit e tregtisë elektronike, freelancerët dhe individët që kanë nevojë për shërbime të shpejta, të besueshme të kurjerit brenda qytetit. I disponueshëm në Shkup, Manastir, Ohër, Tetovë, Kumanovë, Gostivar dhe qytete të tjera.",
      keywords: "dërgesa ngarkesash maqedonia, dërgesa paketash shkup, shërbim kurjeri shkup, dërgesa dokumentesh, dërgesa paketash maqedonia, kurjer i ditës, dërgesa biznesi shkup"
    },
    tr: {
      description: "FastlyGo'nun kurye teslimat hizmetiyle belgeleri, paketleri ve kargoyu Kuzey Makedonya genelinde 15 dakikada hızlı ve güvenilir şekilde gönderin. Şehrin karşısına yasal bir belge, bir müşteriye ürün veya bir arkadaşa hediye göndermeniz gereksin, FastlyGo'nun profesyonel kuryerleri gönderinizi özenle teslim eder. Gerçek zamanlı GPS takibi, teslim onayı ve esnek teslim alma seçenekleri.",
      subtitle: "FastlyGo'nun kargo ve paket teslimat hizmeti, hızlı ve güvenilir şehir içi kurye hizmetlerine ihtiyaç duyan işletmeler, e-ticaret satıcıları, serbest çalışanlar ve bireyler için idealdir. Üsküp, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar ve Kuzey Makedonya genelindeki diğer şehirlerde mevcut.",
      keywords: "kargo teslimat kuzey makedonya, paket teslimat üsküp, kurye hizmeti üsküp, belge teslimat, paket teslimat makedonya, aynı gün kurye, iş teslimat üsküp, e-ticaret teslimat makedonya"
    }
  },
  "pet-supplies": {
    en: {
      description: "Order pet food, toys, accessories, grooming products, and veterinary supplies for your cats, dogs, birds, fish, and small animals with FastlyGo's pet supplies delivery — delivered to your door in 15 minutes across North Macedonia. Never run out of your pet's favorite food again: FastlyGo connects you with local pet shops and delivers everything your furry, feathered, or scaly friend needs, fast and reliably.",
      subtitle: "FastlyGo's pet supplies delivery covers dry food, wet food, treats, litter, bedding, leashes, collars, toys, grooming kits, flea treatments, vitamins, and specialty veterinary products. Whether you have a cat, dog, rabbit, hamster, bird, or fish, we have what your pet needs. Available in Skopje, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar, and more cities across North Macedonia.",
      keywords: "pet supplies delivery north macedonia, dog food delivery skopje, cat food delivery, pet shop delivery, pet accessories delivery, animal food delivery skopje, veterinary supplies delivery, fastlygo pets"
    },
    mk: {
      description: "Нарачајте храна за миленичиња, играчки, додатоци, производи за негување и ветеринарни потрепштини за вашите мачки, кучиња, птици, риби и мали животни со доставата на потрепштини за миленичиња на FastlyGo — доставено до вашата врата за 15 минути низ Македонија. Никогаш повеќе не останувајте без омилената храна на вашиот миленик: FastlyGo ве поврзува со локални продавници за миленичиња и доставува сè што му треба на вашиот крзнен, пернат или лушпест пријател.",
      subtitle: "Доставата на потрепштини за миленичиња на FastlyGo покрива сува храна, влажна храна, грицки, простирки, постелнина, поводници, јаки, играчки, комплети за негување, третмани против буви, витамини и специјализирани ветеринарни производи. Достапно во Скопје, Битола, Охрид, Тетово, Куманово, Гостивар и повеќе градови.",
      keywords: "достава потрепштини миленичиња македонија, достава храна за кучиња скопје, достава храна за мачки, достава продавница миленичиња, достава додатоци миленичиња"
    },
    sq: {
      description: "Porosit ushqim për kafshë shtëpiake, lodra, aksesorë, produkte kujdesi dhe furnizime veterinare për macet, qentë, zogjtë, peshqit dhe kafshët e vogla me dërgimin e furnizimeve për kafshë shtëpiake FastlyGo — dorëzuar në derën tuaj brenda 15 minutave në të gjithë Maqedoninë. Mos mbetni kurrë pa ushqimin e preferuar të kafshës tuaj shtëpiake: FastlyGo ju lidh me dyqanet lokale të kafshëve shtëpiake dhe dorëzon gjithçka që i nevojitet shokut tuaj me gëzof, pendë ose luspa.",
      subtitle: "Dërgimi i furnizimeve për kafshë shtëpiake FastlyGo mbulon ushqim të thatë, ushqim të lagur, ëmbëlsira, rërë, shtretër, zinxhirë, jakë, lodra, komplete kujdesi, trajtime kundër breshkave, vitamina dhe produkte veterinare të specializuara. I disponueshëm në Shkup, Manastir, Ohër, Tetovë, Kumanovë, Gostivar dhe qytete të tjera.",
      keywords: "dërgesa furnizimesh kafshësh shtëpiake maqedonia, dërgesa ushqimi qeni shkup, dërgesa ushqimi maceje, dërgesa dyqan kafshësh, dërgesa aksesorësh kafshësh"
    },
    tr: {
      description: "FastlyGo'nun evcil hayvan malzemeleri teslimatıyla kedileriniz, köpekleriniz, kuşlarınız, balıklarınız ve küçük hayvanlarınız için evcil hayvan maması, oyuncaklar, aksesuarlar, bakım ürünleri ve veteriner malzemelerini Kuzey Makedonya genelinde 15 dakikada kapınıza sipariş edin. Evcil hayvanınızın favori mamasının bitmesine son: FastlyGo sizi yerel evcil hayvan dükkanlarıyla buluşturur ve tüylü, tüylü veya pullu dostunuzun ihtiyacı olan her şeyi hızlı ve güvenilir şekilde teslim eder.",
      subtitle: "FastlyGo'nun evcil hayvan malzemeleri teslimatı kuru mama, yaş mama, ödüller, kedi kumu, yatak, tasma, tasma, oyuncaklar, bakım kitleri, pire tedavileri, vitaminler ve özel veteriner ürünlerini kapsıyor. Üsküp, Bitola, Ohrid, Tetovo, Kumanovo, Gostivar ve Kuzey Makedonya genelindeki daha fazla şehirde mevcut.",
      keywords: "evcil hayvan malzemeleri teslimat kuzey makedonya, köpek maması teslimat üsküp, kedi maması teslimat, evcil hayvan dükkanı teslimat, evcil hayvan aksesuarları teslimat, hayvan maması teslimat üsküp"
    }
  }
};

async function main() {
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);

  let updated = 0;

  for (const [slug, seoData] of Object.entries(CATEGORY_SEO)) {
    // Get current seoMeta to preserve title
    const [rows] = await conn.execute('SELECT id, seoMeta FROM categories WHERE slug = ?', [slug]);
    if (!rows.length) {
      console.log(`⚠️  Not found: ${slug}`);
      continue;
    }

    const row = rows[0];
    const currentMeta = typeof row.seoMeta === 'string' ? JSON.parse(row.seoMeta) : (row.seoMeta || {});

    // Merge: preserve existing title, update description/subtitle/keywords
    const newMeta = {};
    for (const lang of ['en', 'mk', 'sq', 'tr']) {
      newMeta[lang] = {
        title: currentMeta[lang]?.title || currentMeta?.en?.title || '',
        description: seoData[lang].description,
        subtitle: seoData[lang].subtitle,
        keywords: seoData[lang].keywords
      };
    }

    await conn.execute(
      'UPDATE categories SET seoMeta = ?, updatedAt = NOW() WHERE id = ?',
      [JSON.stringify(newMeta), row.id]
    );

    console.log(`✅ Updated: ${slug} (id=${row.id})`);
    updated++;
  }

  console.log(`\n📊 Summary: ${updated} categories updated`);
  await conn.end();
}

main().catch(console.error);
