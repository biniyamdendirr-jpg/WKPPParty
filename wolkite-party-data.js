/* ================================================================
   wolkite-party-data.js
   Master data repository for the Wolkite City Prosperity Party
   Branch website. All content imported verbatim from the `.update`
   master prompt (data import task). Bilingual: Amharic + English.
   ================================================================ */

const wolkitePartyData = {

  /* ==============================================================
     SECTION 1: PARTY IDENTITY  (Source: .update Section 1)
     ============================================================== */
  identity: {
    officialName: {
      am: 'ወልቂጤ ከተማ ብልጽግና ፓርቲ ቅርንጫፍ',
      en: 'Wolkite City Prosperity Party Branch'
    },
    slogan: {
      am: 'መደመር መንገዳችን፤ ብልጽግና መዳረሻችን',
      en: 'Synergy is our path; prosperity is our destination'
    },
    coreIdeology: {
      name: 'Medemer (ምድመር)',
      meaning: 'Synergy / Coming Together',
      am: 'ተቋማዊ ውህደት፣ ኢኮኖሚያዊ ምርታማነት እና አስተዳደራዊ ወጥነት',
      en: 'Institutional integration, economic productivity, and administrative coherence'
    },
    geography: {
      city: 'Wolkite',
      zone: 'Gurage Zone',
      region: 'Central Ethiopia Region',
      country: 'Ethiopia',
      status: 'Administrative capital of the Gurage Zone'
    }
  },

  /* ==============================================================
     SECTION 2: COMPLETE LEADERSHIP TEAM — 6 members
     (Source: .update Section 2; photo filenames from Section 7)
     ============================================================== */
  leadership: [
    { id: 7,
      nameAm: 'አቶ ሰፋ ዘይኑ ያሲን', nameEn: 'Atto Seifu Zeynu Yasin',
      titleAm: 'የአደረጃጀት ዘርፍ ኃላፊ፣ የወልቂጤ ከተማ አስተዳደር', titleEn: 'Head of Organizational Sector, Wolkite City Administration',
      roleAm: 'የድርጅታዊ መዋቅር እና አሰራር ተግባራትን ይመራል',
      roleEn: 'Directs organizational structure and procedural operations',
      photo: 'አቶሰፋዘይኑያሲን.jpg' },

    { id: 8,
      nameAm: 'አቶ አስራት ታደለ', nameEn: 'Atto Asrat Tadele',
      titleAm: 'የፖለቲካ ዘርፍ ሀላፊ', titleEn: 'Political Sector Head',
      roleAm: 'የፖለቲካ ጉዳዮችና የፓርቲ እንቅስቃሴዎችን ይቆጣጠራል',
      roleEn: 'Oversees political affairs and party activities',
      photo: 'አቶአስራትታደለ.jpg' },

    { id: 9,
      nameAm: 'አቶ ታደለ በቀለ', nameEn: 'Atto Tadele Bekele',
      titleAm: 'የወልቂጤ ከተማ አስተዳደር ብልጽግና ፓርቲ ጽ/ቤት ሀላፊ', titleEn: 'Head of Wolkite City Administration Prosperity Party Office',
      roleAm: 'የከተማ አስተዳደር ብልጽግና ፓርቲ ጽሕፈት ቤት አጠቃላይ አስተዳደርን ይመራል',
      roleEn: 'Directs the overall administration of the Wolkite City Prosperity Party Office',
      photo: 'አቶታደለበቀለ.jpg' },

    { id: 10,
      nameAm: 'ወ/ሮ ሂዲያ ሙህዲን', nameEn: 'Mrs. Hidiya Muhidin',
      titleAm: 'የወልቂጤ ከተማ ወጣቶች ክንፍ ኃላፊ', titleEn: 'Wolkite City Youth Wing Head',
      roleAm: 'የከተማውን የወጣቶች ክንፍ እንቅስቃሴዎችን ያስተባብራል',
      roleEn: "Coordinates the city's youth wing activities",
      photo: 'ሂዲያሙህዲን.jpg' },

    { id: 11,
      nameAm: 'አቶ ሙባረክ ኸሊል', nameEn: 'Atto Mubarak Khalil',
      titleAm: 'የሰው ሀብትና ፋይናንስ ዘርፍ ኃላፊ', titleEn: 'Head of Human Resources and Finance Sector',
      roleAm: 'የሰው ሀብት አስተዳደርና የፋይናንስ ጉዳዮችን ይመራል',
      roleEn: 'Directs human resources management and financial affairs',
      photo: 'አቶሙባረክኸሊልአህመድ.jpg' },

    { id: 12,
      nameAm: 'አቶ ሐሰን ጀማል ሰማን', nameEn: 'Atto Hassen Jamal Saman',
      titleAm: 'የወልቂጤ ከተማ የብልጽግና ፓርቲ ኢንስፔክሽን ስነ-ምግባር ኮሚሽን ጽ/ቤት ሃላፊ', titleEn: 'Head of Wolkite City Prosperity Party Inspection and Ethics Commission Office',
      roleAm: 'የኢንስፔሽንና ስነ-ምግባር ጉዳዮችን ይመራል',
      roleEn: 'Directs inspection and ethics affairs',
      photo: 'አቶሐሰንጀማልሰማን.jpg' }
  ],

  /* ==============================================================
     SECTION 3: ADMINISTRATIVE SUB-STRUCTURE  (.update Section 3)
     ============================================================== */
  structure: {
    subCities: {
      am: 'ወልቂጤ ከተማ የተከፈለችው የከተማ አገልግሎቶችን በተዘጋጁ የከተማ ዞኖች የሚያስተዳድሩ ክፍለ ከተሞች ናቸው።',
      en: 'Wolkite City is divided into sub-cities which manage municipal services across designated urban zones.'
    },
    kebeles: {
      list: ['ቀበሌ 01', 'ቀበሌ 02', 'ቀበሌ 03/05'],
      note: 'Grassroots Political Sub-Offices',
      functionsAm: ['የመራጮች ማሰባሰብ', 'የሰፈር ፓርቲ ኮሚቴዎች', 'የአካባቢ ልማት መመሪያዎች', 'የማህበረሰብ ደህንነት ክትትል'],
      functionsEn: ['Voter mobilization', 'Neighborhood party committees', 'Local development directives', 'Community security monitoring']
    },
    wings: [
      { nameEn: "Prosperity Party Women's League — Wolkite Branch", nameAm: 'የብልጽግና ፓርቲ የሴቶች ሊግ — የወልቂጤ ቅርንጫፍ' },
      { nameEn: 'Prosperity Party Youth League — Wolkite Branch', nameAm: 'የብልጽግና ፓርቲ የወጣቶች ሊግ — የወልቂጤ ቅርንጫፍ' }
    ],
    wingsPurpose: {
      am: 'የዜጎችን ተሳትፎ እና የአመራር ሥልጠና ለማመቻቸት',
      en: 'Facilitate civic participation and leadership training'
    }
  }
};
/* NOTE: this file was received truncated after Section 3 (structure). The
   root object was closed above to keep it syntactically valid. Sections 4+
   (doctrine, newsFeed, sectorMessages...) were missing from the copy — the
   redesigned index.html carries the authoritative content from .update. */