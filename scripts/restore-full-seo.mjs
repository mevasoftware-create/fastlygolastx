import mysql2 from 'mysql2/promise';

const url = process.env.DATABASE_URL;

// ── AREAS ──────────────────────────────────────────────────────────────────
const areasSeo = {
  aerodrom: {
    en: {
      title: "Express Delivery in Aerodrom | FastlyGo Skopje",
      description: "FastlyGo delivers in Aerodrom — food, groceries, pharmacy & parcels. Near Skopje Airport. 15-min express courier, 7 days a week, live GPS tracking.",
      keywords: "delivery aerodrom skopje, courier aerodrom, food delivery aerodrom, express delivery skopje airport, fastlygo aerodrom"
    },
    mk: {
      title: "Брза Достава во Аеродром | FastlyGo Скопје",
      description: "FastlyGo доставува во Аеродром — храна, намирници, аптека и пакети. Близу аеродром. Експрес курир за 15 мин, 7 дена, GPS следење.",
      keywords: "достава аеродром скопје, курир аеродром, достава храна аеродром, fastlygo аеродром"
    },
    sq: {
      title: "Dorëzim Ekspres në Aerodrom | FastlyGo Shkup",
      description: "FastlyGo dërgon në Aerodrom — ushqim, ushqimore, farmaci & pako. Afër aeroportit. Korrier ekspres 15 min, 7 ditë, gjurmim GPS.",
      keywords: "dërgim aerodrom shkup, korrier aerodrom, ushqim aerodrom, fastlygo aerodrom"
    },
    tr: {
      title: "Aerodrom'da Ekspres Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Aerodrom'da teslimat yapar — yemek, market, eczane ve kargo. Havalimanı yakını. 15 dk ekspres kurye, haftanın 7 günü, canlı GPS.",
      keywords: "teslimat aerodrom üsküp, kurye aerodrom, yemek teslimat aerodrom, fastlygo aerodrom"
    }
  },
  centar: {
    en: {
      title: "Courier Delivery in Centar | FastlyGo Skopje",
      description: "FastlyGo delivers in Centar, Skopje city center — food, groceries, pharmacy & packages. 15-min express courier with live GPS tracking, 7 days a week.",
      keywords: "delivery centar skopje, courier city center skopje, food delivery centar, express delivery skopje center, fastlygo centar"
    },
    mk: {
      title: "Курирска Достава во Центар | FastlyGo Скопје",
      description: "FastlyGo доставува во Центар, центарот на Скопје — храна, намирници, аптека. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава центар скопје, курир центар, достава храна центар, fastlygo центар"
    },
    sq: {
      title: "Dorëzim Kurieri në Qendër | FastlyGo Shkup",
      description: "FastlyGo dërgon në Qendër të Shkupit — ushqim, ushqimore, farmaci. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim qendër shkup, korrier qendër, ushqim qendër shkup, fastlygo qendër"
    },
    tr: {
      title: "Centar'da Kurye Teslimatı | FastlyGo Üsküp",
      description: "FastlyGo Centar, Üsküp şehir merkezinde teslimat yapar — yemek, market, eczane. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat centar üsküp, kurye şehir merkezi, yemek teslimat centar, fastlygo centar"
    }
  },
  karpos: {
    en: {
      title: "Fast Delivery in Karpos | FastlyGo Skopje",
      description: "FastlyGo delivers in Karpos, Skopje's most prestigious residential area — food, groceries, pharmacy & packages. 15-min courier, GPS tracking, 7 days.",
      keywords: "delivery karpos skopje, courier karpos, food delivery karpos, express delivery karpos skopje, fastlygo karpos"
    },
    mk: {
      title: "Брза Достава во Карпош | FastlyGo Скопје",
      description: "FastlyGo доставува во Карпош — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава карпош скопје, курир карпош, достава храна карпош, fastlygo карпош"
    },
    sq: {
      title: "Dorëzim i Shpejtë në Karpos | FastlyGo Shkup",
      description: "FastlyGo dërgon në Karpos — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim karpos shkup, korrier karpos, ushqim karpos, fastlygo karpos"
    },
    tr: {
      title: "Karpos'ta Hızlı Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Karpos'ta teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat karpos üsküp, kurye karpos, yemek teslimat karpos, fastlygo karpos"
    }
  },
  'kisela-voda': {
    en: {
      title: "Delivery in Kisela Voda | FastlyGo Skopje",
      description: "FastlyGo delivers in Kisela Voda, Skopje's largest municipality — food, groceries, pharmacy & parcels. 15-min express courier, live GPS, 7 days a week.",
      keywords: "delivery kisela voda skopje, courier kisela voda, food delivery kisela voda, fastlygo kisela voda"
    },
    mk: {
      title: "Достава во Кисела Вода | FastlyGo Скопје",
      description: "FastlyGo доставува во Кисела Вода — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава кисела вода скопје, курир кисела вода, достава храна кисела вода, fastlygo кисела вода"
    },
    sq: {
      title: "Dorëzim në Kisela Voda | FastlyGo Shkup",
      description: "FastlyGo dërgon në Kisela Voda — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim kisela voda shkup, korrier kisela voda, fastlygo kisela voda"
    },
    tr: {
      title: "Kisela Voda'da Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Kisela Voda'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat kisela voda üsküp, kurye kisela voda, fastlygo kisela voda"
    }
  },
  cair: {
    en: {
      title: "Professional Delivery in Cair | FastlyGo",
      description: "FastlyGo delivers in Cair, Skopje's historic and cultural neighborhood — food, groceries, pharmacy & packages. Express courier in 15 min, 7 days a week.",
      keywords: "delivery cair skopje, courier cair, food delivery cair skopje, express delivery cair, fastlygo cair"
    },
    mk: {
      title: "Достава во Чаир | FastlyGo Скопје",
      description: "FastlyGo доставува во Чаир — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава чаир скопје, курир чаир, достава храна чаир, fastlygo чаир"
    },
    sq: {
      title: "Dorëzim Profesional në Çair | FastlyGo",
      description: "FastlyGo dërgon në Çair — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim çair shkup, korrier çair, ushqim çair, fastlygo çair"
    },
    tr: {
      title: "Cair'de Profesyonel Teslimat | FastlyGo",
      description: "FastlyGo Cair'de teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat cair üsküp, kurye cair, yemek teslimat cair, fastlygo cair"
    }
  },
  'gazi-baba': {
    en: {
      title: "Delivery in Gazi Baba | FastlyGo Skopje",
      description: "FastlyGo delivers in Gazi Baba, Skopje's eastern gateway — food, groceries, pharmacy & parcels. 15-min express courier, live GPS tracking, 7 days.",
      keywords: "delivery gazi baba skopje, courier gazi baba, food delivery gazi baba, fastlygo gazi baba"
    },
    mk: {
      title: "Достава во Гази Баба | FastlyGo Скопје",
      description: "FastlyGo доставува во Гази Баба — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава гази баба скопје, курир гази баба, достава храна гази баба, fastlygo гази баба"
    },
    sq: {
      title: "Dorëzim në Gazi Baba | FastlyGo Shkup",
      description: "FastlyGo dërgon në Gazi Baba — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim gazi baba shkup, korrier gazi baba, fastlygo gazi baba"
    },
    tr: {
      title: "Gazi Baba'da Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Gazi Baba'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat gazi baba üsküp, kurye gazi baba, fastlygo gazi baba"
    }
  },
  saraj: {
    en: {
      title: "Courier Delivery in Saraj | FastlyGo Skopje",
      description: "FastlyGo delivers in Saraj, Skopje's westernmost municipality — food, groceries, pharmacy & packages. Express courier in 15 min, GPS tracking, 7 days.",
      keywords: "delivery saraj skopje, courier saraj, food delivery saraj skopje, fastlygo saraj"
    },
    mk: {
      title: "Курирска Достава во Сарај | FastlyGo",
      description: "FastlyGo доставува во Сарај — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава сарај скопје, курир сарај, достава храна сарај, fastlygo сарај"
    },
    sq: {
      title: "Dorëzim Kurieri në Saraj | FastlyGo Shkup",
      description: "FastlyGo dërgon në Saraj — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim saraj shkup, korrier saraj, ushqim saraj, fastlygo saraj"
    },
    tr: {
      title: "Saraj'da Kurye Teslimatı | FastlyGo Üsküp",
      description: "FastlyGo Saraj'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat saraj üsküp, kurye saraj, fastlygo saraj"
    }
  },
  butel: {
    en: {
      title: "Fast Delivery in Butel | FastlyGo Skopje",
      description: "FastlyGo delivers in Butel, Skopje's northern municipality — food, groceries, pharmacy & parcels. 15-min express courier, live GPS tracking, 7 days.",
      keywords: "delivery butel skopje, courier butel, food delivery butel skopje, fastlygo butel"
    },
    mk: {
      title: "Брза Достава во Бутел | FastlyGo Скопје",
      description: "FastlyGo доставува во Бутел — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава бутел скопје, курир бутел, достава храна бутел, fastlygo бутел"
    },
    sq: {
      title: "Dorëzim i Shpejtë në Butel | FastlyGo Shkup",
      description: "FastlyGo dërgon në Butel — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim butel shkup, korrier butel, fastlygo butel"
    },
    tr: {
      title: "Butel'de Hızlı Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Butel'de teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat butel üsküp, kurye butel, fastlygo butel"
    }
  },
  skopje: {
    en: {
      title: "On-Demand Delivery in Skopje | FastlyGo",
      description: "FastlyGo is Skopje's premier on-demand delivery platform — food, groceries, pharmacy & packages across all neighborhoods. 15-min courier, GPS, 7 days.",
      keywords: "delivery skopje, courier skopje, food delivery skopje, express delivery skopje, fastlygo skopje, on-demand delivery skopje"
    },
    mk: {
      title: "Достава на Барање во Скопје | FastlyGo",
      description: "FastlyGo е водечката платформа за достава во Скопје — храна, намирници, аптека низ сите општини. Курир за 15 мин, GPS, 7 дена.",
      keywords: "достава скопје, курир скопје, достава храна скопје, fastlygo скопје"
    },
    sq: {
      title: "Dorëzim me Kërkesë në Shkup | FastlyGo",
      description: "FastlyGo është platforma kryesore e dorëzimit në Shkup — ushqim, ushqimore, farmaci në të gjitha lagjet. Korrier 15 min, GPS, 7 ditë.",
      keywords: "dërgim shkup, korrier shkup, ushqim shkup, fastlygo shkup"
    },
    tr: {
      title: "Üsküp'te İsteğe Bağlı Teslimat | FastlyGo",
      description: "FastlyGo, Üsküp'ün önde gelen teslimat platformu — yemek, market, eczane tüm mahallelerde. 15 dk kurye, GPS, haftanın 7 günü.",
      keywords: "teslimat üsküp, kurye üsküp, yemek teslimat üsküp, fastlygo üsküp"
    }
  },
  tetovo: {
    en: {
      title: "Courier Delivery in Tetovo | FastlyGo",
      description: "FastlyGo delivers in Tetovo, the vibrant capital of the Polog region — food, groceries, pharmacy & packages. Express courier in 15 min, 7 days a week.",
      keywords: "delivery tetovo, courier tetovo, food delivery tetovo, express delivery tetovo, fastlygo tetovo"
    },
    mk: {
      title: "Курирска Достава во Тетово | FastlyGo",
      description: "FastlyGo доставува во Тетово — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава тетово, курир тетово, достава храна тетово, fastlygo тетово"
    },
    sq: {
      title: "Dorëzim Kurieri në Tetovë | FastlyGo",
      description: "FastlyGo dërgon në Tetovë — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim tetovë, korrier tetovë, ushqim tetovë, fastlygo tetovë"
    },
    tr: {
      title: "Tetova'da Kurye Teslimatı | FastlyGo",
      description: "FastlyGo Tetova'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat tetova, kurye tetova, yemek teslimat tetova, fastlygo tetova"
    }
  },
  bitola: {
    en: {
      title: "Fast Delivery in Bitola | FastlyGo",
      description: "FastlyGo delivers in Bitola, North Macedonia's second-largest city — food, groceries, pharmacy & parcels. 15-min express courier, GPS tracking, 7 days.",
      keywords: "delivery bitola, courier bitola, food delivery bitola, express delivery bitola, fastlygo bitola"
    },
    mk: {
      title: "Брза Достава во Битола | FastlyGo",
      description: "FastlyGo доставува во Битола — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава битола, курир битола, достава храна битола, fastlygo битола"
    },
    sq: {
      title: "Dorëzim i Shpejtë në Manastir | FastlyGo",
      description: "FastlyGo dërgon në Manastir — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim manastir, korrier manastir, ushqim manastir, fastlygo manastir"
    },
    tr: {
      title: "Manastır'da Hızlı Teslimat | FastlyGo",
      description: "FastlyGo Manastır'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat manastır, kurye manastır, yemek teslimat manastır, fastlygo manastır"
    }
  },
  kumanovo: {
    en: {
      title: "Delivery Service in Kumanovo | FastlyGo",
      description: "FastlyGo delivers in Kumanovo, North Macedonia's third-largest city — food, groceries, pharmacy & packages. Express courier in 15 min, 7 days a week.",
      keywords: "delivery kumanovo, courier kumanovo, food delivery kumanovo, express delivery kumanovo, fastlygo kumanovo"
    },
    mk: {
      title: "Достава во Куманово | FastlyGo",
      description: "FastlyGo доставува во Куманово — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава куманово, курир куманово, достава храна куманово, fastlygo куманово"
    },
    sq: {
      title: "Shërbim Dorëzimi në Kumanovë | FastlyGo",
      description: "FastlyGo dërgon në Kumanovë — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim kumanovë, korrier kumanovë, ushqim kumanovë, fastlygo kumanovë"
    },
    tr: {
      title: "Kumanova'da Teslimat Hizmeti | FastlyGo",
      description: "FastlyGo Kumanova'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat kumanova, kurye kumanova, yemek teslimat kumanova, fastlygo kumanova"
    }
  },
  istip: {
    en: {
      title: "Courier Delivery in Shtip | FastlyGo",
      description: "FastlyGo delivers in Shtip, the cultural capital of eastern Macedonia — food, groceries, pharmacy & parcels. 15-min express courier, GPS, 7 days.",
      keywords: "delivery shtip, courier shtip, food delivery shtip, express delivery shtip, fastlygo shtip"
    },
    mk: {
      title: "Курирска Достава во Штип | FastlyGo",
      description: "FastlyGo доставува во Штип — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава штип, курир штип, достава храна штип, fastlygo штип"
    },
    sq: {
      title: "Dorëzim Kurieri në Shtip | FastlyGo",
      description: "FastlyGo dërgon në Shtip — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim shtip, korrier shtip, ushqim shtip, fastlygo shtip"
    },
    tr: {
      title: "Ştip'te Kurye Teslimatı | FastlyGo",
      description: "FastlyGo Ştip'te teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat ştip, kurye ştip, yemek teslimat ştip, fastlygo ştip"
    }
  },
  veles: {
    en: {
      title: "Delivery in Veles | FastlyGo North Macedonia",
      description: "FastlyGo delivers in Veles, a historic city at the geographic heart of North Macedonia — food, groceries, pharmacy & packages. Express courier, 7 days.",
      keywords: "delivery veles, courier veles, food delivery veles, express delivery veles, fastlygo veles"
    },
    mk: {
      title: "Достава во Велес | FastlyGo Македонија",
      description: "FastlyGo доставува во Велес — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава велес, курир велес, достава храна велес, fastlygo велес"
    },
    sq: {
      title: "Dorëzim në Veles | FastlyGo Maqedoni",
      description: "FastlyGo dërgon në Veles — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim veles, korrier veles, ushqim veles, fastlygo veles"
    },
    tr: {
      title: "Veles'te Teslimat | FastlyGo Makedonya",
      description: "FastlyGo Veles'te teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat veles, kurye veles, yemek teslimat veles, fastlygo veles"
    }
  },
  prilep: {
    en: {
      title: "Fast Delivery in Prilep | FastlyGo",
      description: "FastlyGo delivers in Prilep, the 'City of Tobacco' and industrial hub of central Macedonia — food, groceries, pharmacy & packages. Express courier, 7 days.",
      keywords: "delivery prilep, courier prilep, food delivery prilep, express delivery prilep, fastlygo prilep"
    },
    mk: {
      title: "Брза Достава во Прилеп | FastlyGo",
      description: "FastlyGo доставува во Прилеп — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава прилеп, курир прилеп, достава храна прилеп, fastlygo прилеп"
    },
    sq: {
      title: "Dorëzim i Shpejtë në Prilep | FastlyGo",
      description: "FastlyGo dërgon në Prilep — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim prilep, korrier prilep, ushqim prilep, fastlygo prilep"
    },
    tr: {
      title: "Prilep'te Hızlı Teslimat | FastlyGo",
      description: "FastlyGo Prilep'te teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat prilep, kurye prilep, yemek teslimat prilep, fastlygo prilep"
    }
  },
  kocani: {
    en: {
      title: "Delivery Service in Kocani | FastlyGo",
      description: "FastlyGo delivers in Kocani, the rice capital of North Macedonia — food, groceries, pharmacy & parcels. 15-min express courier, GPS tracking, 7 days.",
      keywords: "delivery kocani, courier kocani, food delivery kocani, express delivery kocani, fastlygo kocani"
    },
    mk: {
      title: "Достава во Кочани | FastlyGo",
      description: "FastlyGo доставува во Кочани — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава кочани, курир кочани, достава храна кочани, fastlygo кочани"
    },
    sq: {
      title: "Shërbim Dorëzimi në Koçan | FastlyGo",
      description: "FastlyGo dërgon në Koçan — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim koçan, korrier koçan, ushqim koçan, fastlygo koçan"
    },
    tr: {
      title: "Koçani'de Teslimat Hizmeti | FastlyGo",
      description: "FastlyGo Koçani'de teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat koçani, kurye koçani, yemek teslimat koçani, fastlygo koçani"
    }
  },
  strumica: {
    en: {
      title: "Courier Delivery in Strumica | FastlyGo",
      description: "FastlyGo delivers in Strumica, the agricultural capital of southeastern Macedonia — food, groceries, pharmacy & packages. Express courier, 7 days a week.",
      keywords: "delivery strumica, courier strumica, food delivery strumica, express delivery strumica, fastlygo strumica"
    },
    mk: {
      title: "Курирска Достава во Струмица | FastlyGo",
      description: "FastlyGo доставува во Струмица — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава струмица, курир струмица, достава храна струмица, fastlygo струмица"
    },
    sq: {
      title: "Dorëzim Kurieri në Strumicë | FastlyGo",
      description: "FastlyGo dërgon në Strumicë — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim strumicë, korrier strumicë, ushqim strumicë, fastlygo strumicë"
    },
    tr: {
      title: "Strumitsa'da Kurye Teslimatı | FastlyGo",
      description: "FastlyGo Strumitsa'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat strumitsa, kurye strumitsa, yemek teslimat strumitsa, fastlygo strumitsa"
    }
  },
  gostivar: {
    en: {
      title: "Delivery in Gostivar | FastlyGo North Macedonia",
      description: "FastlyGo delivers in Gostivar, a vibrant multicultural city in western Macedonia — food, groceries, pharmacy & packages. Express courier, 7 days a week.",
      keywords: "delivery gostivar, courier gostivar, food delivery gostivar, express delivery gostivar, fastlygo gostivar"
    },
    mk: {
      title: "Достава во Гостивар | FastlyGo Македонија",
      description: "FastlyGo доставува во Гостивар — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава гостивар, курир гостивар, достава храна гостивар, fastlygo гостивар"
    },
    sq: {
      title: "Dorëzim në Gostivar | FastlyGo Maqedoni",
      description: "FastlyGo dërgon në Gostivar — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim gostivar, korrier gostivar, ushqim gostivar, fastlygo gostivar"
    },
    tr: {
      title: "Gostivar'da Teslimat | FastlyGo Makedonya",
      description: "FastlyGo Gostivar'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat gostivar, kurye gostivar, yemek teslimat gostivar, fastlygo gostivar"
    }
  },
  ohrid: {
    en: {
      title: "Delivery in Ohrid | FastlyGo North Macedonia",
      description: "FastlyGo delivers in Ohrid, North Macedonia's most iconic tourist city on Lake Ohrid — food, groceries, pharmacy & packages. Express courier, 7 days.",
      keywords: "delivery ohrid, courier ohrid, food delivery ohrid, express delivery ohrid, fastlygo ohrid, lake ohrid delivery"
    },
    mk: {
      title: "Достава во Охрид | FastlyGo Македонија",
      description: "FastlyGo доставува во Охрид — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена неделно.",
      keywords: "достава охрид, курир охрид, достава храна охрид, fastlygo охрид, охридско езеро"
    },
    sq: {
      title: "Dorëzim në Ohër | FastlyGo Maqedoni",
      description: "FastlyGo dërgon në Ohër — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim ohër, korrier ohër, ushqim ohër, fastlygo ohër, liqeni ohrit"
    },
    tr: {
      title: "Ohri'de Teslimat | FastlyGo Makedonya",
      description: "FastlyGo Ohri'de teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat ohri, kurye ohri, yemek teslimat ohri, fastlygo ohri, ohri gölü"
    }
  },
  'gjorce-petrov': {
    en: {
      title: "Delivery in Gjorce Petrov | FastlyGo Skopje",
      description: "FastlyGo delivers in Gjorce Petrov, one of Skopje's most populated municipalities — food, groceries, pharmacy & packages. Express courier, 7 days.",
      keywords: "delivery gjorce petrov skopje, courier gjorce petrov, food delivery gjorce petrov, fastlygo gjorce petrov"
    },
    mk: {
      title: "Достава во Ѓорче Петров | FastlyGo Скопје",
      description: "FastlyGo доставува во Ѓорче Петров — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава ѓорче петров скопје, курир ѓорче петров, достава храна ѓорче петров, fastlygo ѓорче петров"
    },
    sq: {
      title: "Dorëzim në Gjorçe Petrov | FastlyGo Shkup",
      description: "FastlyGo dërgon në Gjorçe Petrov — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim gjorçe petrov shkup, korrier gjorçe petrov, fastlygo gjorçe petrov"
    },
    tr: {
      title: "Gjorce Petrov'da Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Gjorce Petrov'da teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat gjorce petrov üsküp, kurye gjorce petrov, fastlygo gjorce petrov"
    }
  },
  'suto-orizari': {
    en: {
      title: "Delivery in Suto Orizari | FastlyGo Skopje",
      description: "FastlyGo delivers in Suto Orizari, Skopje's unique northern municipality — food, groceries, pharmacy & packages. Express courier in 15 min, 7 days.",
      keywords: "delivery suto orizari skopje, courier suto orizari, food delivery suto orizari, fastlygo suto orizari"
    },
    mk: {
      title: "Достава во Шуто Оризари | FastlyGo Скопје",
      description: "FastlyGo доставува во Шуто Оризари — храна, намирници, аптека и пакети. Експрес курир за 15 мин, GPS следење, 7 дена.",
      keywords: "достава шуто оризари скопје, курир шуто оризари, fastlygo шуто оризари"
    },
    sq: {
      title: "Dorëzim në Shuto Orizare | FastlyGo Shkup",
      description: "FastlyGo dërgon në Shuto Orizare — ushqim, ushqimore, farmaci & pako. Korrier ekspres 15 min, gjurmim GPS, 7 ditë.",
      keywords: "dërgim shuto orizare shkup, korrier shuto orizare, fastlygo shuto orizare"
    },
    tr: {
      title: "Suto Orizari'de Teslimat | FastlyGo Üsküp",
      description: "FastlyGo Suto Orizari'de teslimat yapar — yemek, market, eczane ve paket. 15 dk ekspres kurye, GPS takip, haftanın 7 günü.",
      keywords: "teslimat suto orizari üsküp, kurye suto orizari, fastlygo suto orizari"
    }
  }
};

// ── CATEGORIES ─────────────────────────────────────────────────────────────
const categoriesSeo = {
  'food-delivery': {
    en: {
      title: "Food Delivery - Pizza, Burgers, Sushi & More | FastlyGo",
      description: "Order pizza, burgers, sushi, kebabs & more from top Skopje restaurants. FastlyGo delivers hot food to your door in 15 minutes across North Macedonia.",
      keywords: "food delivery skopje, pizza delivery skopje, burger delivery, sushi delivery skopje, restaurant delivery, fastlygo food"
    },
    mk: {
      title: "Достава Храна - Пица, Бургери, Суши | FastlyGo",
      description: "Нарачај пица, бургери, суши, ќебапи и уште многу од врвните ресторани во Скопје. FastlyGo доставува топла храна за 15 минути.",
      keywords: "достава храна скопје, пица достава скопје, бургер достава, суши достава, ресторан достава, fastlygo храна"
    },
    sq: {
      title: "Dorëzim Ushqimi - Pica, Hamburger, Sushi | FastlyGo",
      description: "Porosit picë, hamburger, sushi, qebap & më shumë nga restorantet kryesore të Shkupit. FastlyGo dërgon ushqim të nxehtë për 15 minuta.",
      keywords: "dorëzim ushqimi shkup, dorëzim picë shkup, dorëzim hamburger, dorëzim sushi, fastlygo ushqim"
    },
    tr: {
      title: "Yemek Teslimatı - Pizza, Burger, Sushi | FastlyGo",
      description: "Üsküp'ün en iyi restoranlarından pizza, burger, sushi, kebap ve daha fazlasını sipariş et. FastlyGo 15 dakikada sıcak yemeği kapına getirir.",
      keywords: "yemek teslimat üsküp, pizza teslimat üsküp, burger teslimat, sushi teslimat, restoran teslimat, fastlygo yemek"
    }
  },
  'grocery-delivery': {
    en: {
      title: "Grocery Delivery - Supermarket & Fresh Food | FastlyGo",
      description: "Order groceries, fresh produce, dairy, snacks & household essentials from local supermarkets. FastlyGo delivers to your door in 15 min across North Macedonia.",
      keywords: "grocery delivery skopje, supermarket delivery, fresh food delivery, online grocery skopje, fastlygo grocery"
    },
    mk: {
      title: "Достава Намирници - Супермаркет и Свежа Храна | FastlyGo",
      description: "Нарачај намирници, свежи производи, млечни производи и основни потреби од локалните маркети. FastlyGo доставува за 15 мин.",
      keywords: "достава намирници скопје, достава супермаркет, свежа храна достава, онлајн намирници скопје, fastlygo намирници"
    },
    sq: {
      title: "Dorëzim Ushqimore - Supermarket & Ushqim i Freskët | FastlyGo",
      description: "Porosit ushqimore, produkte të freskëta, bulmetore & të domosdoshme nga supermarketet lokale. FastlyGo dërgon për 15 min.",
      keywords: "dorëzim ushqimore shkup, dorëzim supermarket, ushqim i freskët, fastlygo ushqimore"
    },
    tr: {
      title: "Market Teslimatı - Süpermarket ve Taze Gıda | FastlyGo",
      description: "Yerel süpermarketlerden market ürünleri, taze gıda, süt ürünleri ve temel ihtiyaçları sipariş et. FastlyGo 15 dk'da kapına getirir.",
      keywords: "market teslimat üsküp, süpermarket teslimat, taze gıda teslimat, online market üsküp, fastlygo market"
    }
  },
  'pharmacy-delivery': {
    en: {
      title: "Pharmacy Delivery - Medicines & Health Products | FastlyGo",
      description: "Order prescription drugs, OTC medicines, vitamins & health essentials from licensed pharmacies. FastlyGo delivers safely to your door in 15 min, 7 days.",
      keywords: "pharmacy delivery skopje, medicine delivery skopje, prescription delivery, vitamins delivery skopje, drug delivery home, health products delivery, fastlygo pharmacy"
    },
    mk: {
      title: "Достава Аптека - Лекови и Здравствени Производи | FastlyGo",
      description: "Нарачај лекови на рецепт, ОТЦ лекови, витамини и здравствени производи од лиценцирани аптеки. FastlyGo доставува безбедно за 15 мин.",
      keywords: "достава аптека скопје, достава лекови скопје, достава рецепт, витамини достава, fastlygo аптека"
    },
    sq: {
      title: "Dorëzim Farmaci - Ilaçe & Produkte Shëndetësore | FastlyGo",
      description: "Porosit ilaçe me recetë, ilaçe OTC, vitamina & të domosdoshme shëndetësore nga farmacitë e licencuara. FastlyGo dërgon për 15 min.",
      keywords: "dorëzim farmaci shkup, dorëzim ilaçe shkup, dorëzim recetë, vitamina dorëzim, fastlygo farmaci"
    },
    tr: {
      title: "Eczane Teslimatı - İlaç ve Sağlık Ürünleri | FastlyGo",
      description: "Lisanslı eczanelerden reçeteli ilaç, OTC ilaç, vitamin ve sağlık ürünleri sipariş et. FastlyGo 15 dk'da güvenle kapına getirir.",
      keywords: "eczane teslimat üsküp, ilaç teslimat üsküp, reçete teslimat, vitamin teslimat, fastlygo eczane"
    }
  },
  'package-delivery': {
    en: {
      title: "Package Delivery - Same-Day Courier Service | FastlyGo",
      description: "Send documents, parcels & packages across Skopje and North Macedonia with FastlyGo's same-day courier. Real-time GPS tracking, insured delivery, 7 days.",
      keywords: "package delivery skopje, parcel delivery skopje, same day courier, document delivery skopje, courier service skopje, fastlygo package"
    },
    mk: {
      title: "Достава Пакети - Курирска Служба Ист Ден | FastlyGo",
      description: "Испрати документи, пакети и пратки низ Скопје и Македонија со FastlyGo. GPS следење во реално време, осигурана достава, 7 дена.",
      keywords: "достава пакети скопје, пратка достава скопје, курир ист ден, документи достава, fastlygo пакети"
    },
    sq: {
      title: "Dorëzim Pakosh - Shërbim Korrier i Ditës | FastlyGo",
      description: "Dërgo dokumente, pako & sende nëpër Shkup dhe Maqedoni me FastlyGo. Gjurmim GPS në kohë reale, dorëzim i siguruar, 7 ditë.",
      keywords: "dorëzim pakosh shkup, dërgim pako shkup, korrier i ditës, dorëzim dokumentesh, fastlygo pakosh"
    },
    tr: {
      title: "Paket Teslimatı - Aynı Gün Kurye Hizmeti | FastlyGo",
      description: "Üsküp ve Makedonya genelinde belge, koli ve paket gönderin. Gerçek zamanlı GPS takip, sigortalı teslimat, haftanın 7 günü.",
      keywords: "paket teslimat üsküp, koli teslimat üsküp, aynı gün kurye, belge teslimat, kurye hizmeti üsküp, fastlygo paket"
    }
  },
  'pet-supplies': {
    en: {
      title: "Pet Supplies - Cat & Dog Food, Toys, Accessories | FastlyGo",
      description: "Order cat food, dog food, pet toys, accessories and care products from local pet stores. FastlyGo delivers pet supplies to your door in 15 min across North Macedonia.",
      keywords: "pet supplies delivery skopje, cat food delivery, dog food delivery, pet toys skopje, pet accessories delivery, fastlygo pet supplies"
    },
    mk: {
      title: "Потрепштини за Миленичиња - Храна, Играчки | FastlyGo",
      description: "Нарачај храна за мачки, храна за кучиња, играчки и производи за нега од локалните продавници. FastlyGo доставува за 15 мин.",
      keywords: "потрепштини миленичиња скопје, храна мачки достава, храна кучиња достава, играчки миленичиња, fastlygo миленичиња"
    },
    sq: {
      title: "Produkte për Kafshë Shtëpiake - Ushqim, Lodra | FastlyGo",
      description: "Porosit ushqim për mace, ushqim për qen, lodra & produkte kujdesi nga dyqanet lokale. FastlyGo dërgon për 15 min.",
      keywords: "produkte kafshë shtëpiake shkup, ushqim mace dorëzim, ushqim qen dorëzim, fastlygo kafshë"
    },
    tr: {
      title: "Evcil Hayvan Malzemeleri - Kedi & Köpek Maması | FastlyGo",
      description: "Yerel pet mağazalarından kedi maması, köpek maması, oyuncak ve bakım ürünleri sipariş et. FastlyGo 15 dk'da kapına getirir.",
      keywords: "evcil hayvan malzeme teslimat üsküp, kedi maması teslimat, köpek maması teslimat, pet malzeme üsküp, fastlygo evcil hayvan"
    }
  },
  'business-delivery': {
    en: {
      title: "Business Delivery - B2B Courier Solutions | FastlyGo",
      description: "FastlyGo offers dedicated B2B courier solutions for restaurants, pharmacies, markets & businesses in North Macedonia. Bulk orders, API integration, priority dispatch.",
      keywords: "business delivery skopje, b2b courier skopje, corporate delivery service, restaurant courier, pharmacy courier, fastlygo business"
    },
    mk: {
      title: "Бизнис Достава - Б2Б Курирски Решенија | FastlyGo",
      description: "FastlyGo нуди посветени Б2Б курирски решенија за ресторани, аптеки, маркети и бизниси во Македонија. Масовни нарачки, API интеграција.",
      keywords: "бизнис достава скопје, б2б курир скопје, корпоративна достава, ресторан курир, аптека курир, fastlygo бизнис"
    },
    sq: {
      title: "Dorëzim Biznesi - Zgjidhje Korrier B2B | FastlyGo",
      description: "FastlyGo ofron zgjidhje të dedikuara B2B për restorante, farmaci, markete & biznese në Maqedoni. Porosi me shumicë, integrim API.",
      keywords: "dorëzim biznesi shkup, korrier b2b shkup, shërbim dorëzimi korporativ, korrier restoranti, fastlygo biznes"
    },
    tr: {
      title: "İşletme Teslimatı - B2B Kurye Çözümleri | FastlyGo",
      description: "FastlyGo, Makedonya'daki restoran, eczane, market ve işletmeler için özel B2B kurye çözümleri sunar. Toplu sipariş, API entegrasyonu.",
      keywords: "işletme teslimat üsküp, b2b kurye üsküp, kurumsal teslimat hizmeti, restoran kurye, eczane kurye, fastlygo işletme"
    }
  }
};

async function main() {
  const conn = await mysql2.createConnection(url);
  let updatedAreas = 0;
  let updatedCats = 0;

  // Update areas
  const [areas] = await conn.execute('SELECT id, slug, seoMeta FROM areas');
  for (const area of areas) {
    const slug = area.slug;
    if (!areasSeo[slug]) {
      console.log(`⚠️  No SEO data for area: ${slug}`);
      continue;
    }
    const existing = typeof area.seoMeta === 'object' ? area.seoMeta : JSON.parse(area.seoMeta || '{}');
    const newMeta = {};
    for (const lang of ['en', 'mk', 'sq', 'tr']) {
      newMeta[lang] = {
        ...(existing[lang] || {}),
        title: areasSeo[slug][lang].title,
        description: areasSeo[slug][lang].description,
        keywords: areasSeo[slug][lang].keywords
      };
    }
    await conn.execute('UPDATE areas SET seoMeta = ? WHERE id = ?', [JSON.stringify(newMeta), area.id]);
    updatedAreas++;
    console.log(`✅ Area updated: ${slug}`);
  }

  // Update categories
  const [cats] = await conn.execute('SELECT id, slug, seoMeta FROM categories');
  for (const cat of cats) {
    const slug = cat.slug;
    if (!categoriesSeo[slug]) {
      console.log(`⚠️  No SEO data for category: ${slug}`);
      continue;
    }
    const existing = typeof cat.seoMeta === 'object' ? cat.seoMeta : JSON.parse(cat.seoMeta || '{}');
    const newMeta = {};
    for (const lang of ['en', 'mk', 'sq', 'tr']) {
      newMeta[lang] = {
        ...(existing[lang] || {}),
        title: categoriesSeo[slug][lang].title,
        description: categoriesSeo[slug][lang].description,
        keywords: categoriesSeo[slug][lang].keywords
      };
    }
    await conn.execute('UPDATE categories SET seoMeta = ? WHERE id = ?', [JSON.stringify(newMeta), cat.id]);
    updatedCats++;
    console.log(`✅ Category updated: ${slug}`);
  }

  await conn.end();
  console.log(`\n🎉 Done! Updated ${updatedAreas} areas and ${updatedCats} categories.`);
}

main().catch(console.error);
