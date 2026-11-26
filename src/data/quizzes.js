export const ANSWER_SHAPES = [
  { id: 0, shape: 'triangle', symbol: '▲', color: '#e21b3c' },
  { id: 1, shape: 'diamond', symbol: '◆', color: '#1368ce' },
  { id: 2, shape: 'circle', symbol: '●', color: '#d89e00' },
  { id: 3, shape: 'square', symbol: '■', color: '#26890c' },
]

export const QUIZZES = [
  {
    id: 'web-basics',
    title: {
      ckb: 'بنەماکانی وێب',
      ar: 'أساسيات الويب',
      en: 'Web Basics',
    },
    description: {
      ckb: 'پرسیارە خێراکانی HTML، CSS و JavaScript',
      ar: 'أسئلة سريعة عن HTML و CSS و JavaScript',
      en: 'Quick questions on HTML, CSS and JavaScript',
    },
    timeLimit: 20,
    questions: [
      {
        text: {
          ckb: 'HTML کورتکراوەی چییە؟',
          ar: 'ماذا تعني HTML؟',
          en: 'What does HTML stand for?',
        },
        options: {
          ckb: ['HyperText Markup Language', 'HighText Machine Language', 'HyperTool Multi Language', 'Home Tool Markup Language'],
          ar: ['HyperText Markup Language', 'HighText Machine Language', 'HyperTool Multi Language', 'Home Tool Markup Language'],
          en: ['HyperText Markup Language', 'HighText Machine Language', 'HyperTool Multi Language', 'Home Tool Markup Language'],
        },
        correct: 0,
      },
      {
        text: {
          ckb: 'کام یەک بۆ ستایلکردنی پەڕە بەکاردێت؟',
          ar: 'أيها يُستخدم لتنسيق الصفحة؟',
          en: 'Which is used to style a page?',
        },
        options: {
          ckb: ['HTML', 'CSS', 'SQL', 'Python'],
          ar: ['HTML', 'CSS', 'SQL', 'Python'],
          en: ['HTML', 'CSS', 'SQL', 'Python'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: 'لە JavaScriptدا، کام جۆر داتا بۆ ڕاست/هەڵە بەکاردێت؟',
          ar: 'في JavaScript، أي نوع بيانات للمنطق صح/خطأ؟',
          en: 'In JavaScript, which type holds true/false?',
        },
        options: {
          ckb: ['String', 'Number', 'Boolean', 'Array'],
          ar: ['String', 'Number', 'Boolean', 'Array'],
          en: ['String', 'Number', 'Boolean', 'Array'],
        },
        correct: 2,
      },
      {
        text: {
          ckb: 'React چ جۆرە کتێبخانەیەکە؟',
          ar: 'ما نوع مكتبة React؟',
          en: 'What kind of library is React?',
        },
        options: {
          ckb: ['بنکەی زانیاری', 'UI / کۆمپۆنێنت', 'سیستەمی کارپێکردن', 'ئامرازی دیزاین'],
          ar: ['قاعدة بيانات', 'واجهة / مكوّنات', 'نظام تشغيل', 'أداة تصميم'],
          en: ['Database', 'UI / components', 'Operating system', 'Design tool'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: 'کام تەگ بۆ لینک لە HTMLدا؟',
          ar: 'أي وسم للرابط في HTML؟',
          en: 'Which HTML tag makes a link?',
        },
        options: {
          ckb: ['<link>', '<a>', '<href>', '<url>'],
          ar: ['<link>', '<a>', '<href>', '<url>'],
          en: ['<link>', '<a>', '<href>', '<url>'],
        },
        correct: 1,
      },
    ],
  },
  {
    id: 'biology',
    title: {
      ckb: 'زیندەزانیی خانە',
      ar: 'بيولوجيا الخلية',
      en: 'Cell Biology',
    },
    description: {
      ckb: 'پرسیار لەسەر پێکهاتە و کارکردی خانە',
      ar: 'أسئلة عن تركيب الخلية ووظائفها',
      en: 'Questions on cell structure and function',
    },
    timeLimit: 15,
    questions: [
      {
        text: {
          ckb: 'هێزی خانە (ATP) زیاتر لە کوێ دروست دەبێت؟',
          ar: 'أين يُنتج معظم ATP في الخلية؟',
          en: 'Where is most ATP made in the cell?',
        },
        options: {
          ckb: ['ناوک', 'میتۆکۆندریا', 'گۆڵجی', 'لایزۆسۆم'],
          ar: ['النواة', 'الميتوكوندريا', 'جهاز غولجي', 'الليسوسوم'],
          en: ['Nucleus', 'Mitochondria', 'Golgi', 'Lysosome'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: 'DNA لە کوێ هەڵدەگیرێت؟',
          ar: 'أين يُخزَّن DNA؟',
          en: 'Where is DNA stored?',
        },
        options: {
          ckb: ['ناوک', 'ڕایبۆسۆم', 'سایتۆپلاسم', 'دیواری خانە'],
          ar: ['النواة', 'الريبوسوم', 'السيتوبلازم', 'جدار الخلية'],
          en: ['Nucleus', 'Ribosome', 'Cytoplasm', 'Cell wall'],
        },
        correct: 0,
      },
      {
        text: {
          ckb: 'ڕایبۆسۆم چی دروست دەکات؟',
          ar: 'ماذا يصنع الريبوسوم؟',
          en: 'What do ribosomes make?',
        },
        options: {
          ckb: ['چەوری', 'پڕۆتین', 'شەکر', 'ڤیتامین'],
          ar: ['دهون', 'بروتين', 'سكر', 'فيتامين'],
          en: ['Lipids', 'Proteins', 'Sugars', 'Vitamins'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: 'ڕوەک خانەی سبز (کلۆرۆپلاست)ی هەیە بۆ…',
          ar: 'تمتلك النباتات بلاستيدات خضر لـ…',
          en: 'Plants have chloroplasts for…',
        },
        options: {
          ckb: ['هەناسەدان', 'فۆتۆسێنتێز', 'جووڵە', 'هەستیاری'],
          ar: ['التنفس', 'التمثيل الضوئي', 'الحركة', 'الإحساس'],
          en: ['Respiration', 'Photosynthesis', 'Movement', 'Sensation'],
        },
        correct: 1,
      },
    ],
  },
  {
    id: 'kurdish',
    title: {
      ckb: 'ڕێنووسی کوردی',
      ar: 'الإملاء الكردي',
      en: 'Kurdish Orthography',
    },
    description: {
      ckb: 'پرسیاری خێرا لەسەر ڕێنووسی کوردی',
      ar: 'أسئلة سريعة عن الإملاء الكردي',
      en: 'Quick questions on Kurdish spelling',
    },
    timeLimit: 18,
    questions: [
      {
        text: {
          ckb: 'کام نووسین ڕاستە؟',
          ar: 'أي كتابة صحيحة؟',
          en: 'Which spelling is correct?',
        },
        options: {
          ckb: ['چاك', 'چاک', 'چآک', 'چاكـ'],
          ar: ['چاك', 'چاک', 'چآک', 'چاكـ'],
          en: ['چاك', 'چاک', 'چآک', 'چاكـ'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: '«نییە» چۆن دەنووسرێت؟',
          ar: 'كيف تُكتب «نییە»؟',
          en: 'How is «نییە» written?',
        },
        options: {
          ckb: ['نیە', 'نییە', 'نيە', 'نیـە'],
          ar: ['نیە', 'نییە', 'نيە', 'نیـە'],
          en: ['نیە', 'نییە', 'نيە', 'نیـە'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: 'کامە دروستە؟',
          ar: 'أيها صحيح؟',
          en: 'Which is correct?',
        },
        options: {
          ckb: ['کوردیی', 'کوردی', 'كوردی', 'کوردى'],
          ar: ['کوردیی', 'کوردی', 'كوردی', 'کوردى'],
          en: ['کوردیی', 'کوردی', 'كوردی', 'کوردى'],
        },
        correct: 1,
      },
      {
        text: {
          ckb: 'لە سەرەتای وشەدا «ر» دەبێتە…',
          ar: 'في بداية الكلمة تصبح «ر»…',
          en: 'At the start of a word, «ر» becomes…',
        },
        options: {
          ckb: ['ر', 'ڕ', 'ڕڕ', 'رّ'],
          ar: ['ر', 'ڕ', 'ڕڕ', 'رّ'],
          en: ['ر', 'ڕ', 'ڕڕ', 'رّ'],
        },
        correct: 1,
      },
    ],
  },
]

export function getQuiz(id) {
  return QUIZZES.find((q) => q.id === id) ?? null
}

export function scoreAnswer(timeMs, timeLimitSec) {
  const limit = timeLimitSec * 1000
  const clamped = Math.min(Math.max(timeMs, 0), limit)
  const ratio = 1 - clamped / limit
  return Math.round(500 + 500 * ratio)
}
