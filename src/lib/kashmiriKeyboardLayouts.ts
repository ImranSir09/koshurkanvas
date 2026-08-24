export interface KeyboardKeyItem {
  char: string;
  displayChar?: string;
  label?: string;
  isKashmiriSpecial?: boolean;
  longPress?: string[];
  flex?: string; // flex width ratio (e.g. 'flex-[1.5]')
}

export const PROFESSIONAL_KASHMIRI_LAYOUTS: {
  main: KeyboardKeyItem[][];
  shift: KeyboardKeyItem[][];
  vowelsAndMarks: KeyboardKeyItem[][];
  numbersAndSymbols: KeyboardKeyItem[][];
  calligraphyAndPhrases: KeyboardKeyItem[][];
} = {
  // 1. Primary Kashmiri Alphabet (حروف)
  main: [
    // Row 1: Kashmiri Primary Vowels & Top Consonants
    [
      { char: 'ٲ', isKashmiriSpecial: true, label: 'Alif Madda', longPress: ['ٳ'] },
      { char: 'ۄ', isKashmiriSpecial: true, label: 'Waw Ring', longPress: ['ۄٚ', 'ۆ'] },
      { char: 'ؠ', isKashmiriSpecial: true, label: 'Tshae Yeh', longPress: ['ےٚ', 'ێ'] },
      { char: 'ژ', isKashmiriSpecial: true, label: 'Tse' },
      { char: 'چ', label: 'Tche', longPress: ['چھ'] },
      { char: 'پ', label: 'Pe', longPress: ['پھ'] },
      { char: 'ٹ', label: 'Tte', longPress: ['ٹھ'] },
      { char: 'ت', label: 'Te', longPress: ['تھ', 'ط', 'ۃ'] },
      { char: 'ڈ', label: 'Ddal', longPress: ['ڈھ'] },
      { char: 'د', label: 'Dal', longPress: ['دھ', 'ذ'] },
      { char: 'ھ', label: 'Do-chashmi' },
    ],
    // Row 2: Home Row Consonants
    [
      { char: 'ش', label: 'Sheen' },
      { char: 'س', label: 'Seen', longPress: ['ص', 'ث'] },
      { char: 'ی', label: 'Chhoti Yeh', longPress: ['ئ'] },
      { char: 'ب', label: 'Be', longPress: ['بھ'] },
      { char: 'ل', label: 'Laam', longPress: ['لا', 'لٲ'] },
      { char: 'ا', label: 'Alif', longPress: ['آ', 'أ', 'إ', 'ٱ'] },
      { char: 'ن', label: 'Noon', longPress: ['ں', 'ݨ'] },
      { char: 'م', label: 'Meem' },
      { char: 'ک', label: 'Kaaf', longPress: ['کھ'] },
      { char: 'گ', label: 'Gaaf', longPress: ['گھ'] },
      { char: 'ر', label: 'Re' },
    ],
    // Row 3: Bottom Row Consonants & Key Vowel Forms
    [
      { char: 'ف', label: 'Fe', longPress: ['ڤ'] },
      { char: 'غ', label: 'Ghain' },
      { char: 'ح', label: 'Bari He', longPress: ['خ'] },
      { char: 'ج', label: 'Jeem', longPress: ['جھ'] },
      { char: 'ز', label: 'Ze', longPress: ['ض', 'ظ'] },
      { char: 'ڑ', label: 'Rre' },
      { char: 'و', label: 'Waw', longPress: ['ؤ', 'ۇ'] },
      { char: 'ہ', label: 'Goal He', longPress: ['ۂ'] },
      { char: 'ع', label: 'Ain', longPress: ['ء'] },
      { char: 'ق', label: 'Qaaf' },
      { char: 'ے', label: 'Bari Yeh' },
    ],
  ],

  // 2. Shift Layout (حروف ثانوی و نایاب) - Secondary / Arabic / Extended letters
  shift: [
    // Row 1
    [
      { char: 'ٳ', isKashmiriSpecial: true, label: 'Alif Hamza Below' },
      { char: 'ۆ', isKashmiriSpecial: true, label: 'Short O Waw' },
      { char: 'ۄٚ', isKashmiriSpecial: true, label: 'Waw Inverted V' },
      { char: 'ےٚ', isKashmiriSpecial: true, label: 'Bari Yeh Inverted V' },
      { char: 'ێ', isKashmiriSpecial: true, label: 'Yeh with V' },
      { char: 'ط', label: 'Toe' },
      { char: 'ظ', label: 'Zoe' },
      { char: 'ص', label: 'Suad' },
      { char: 'ض', label: 'Zuad' },
      { char: 'ث', label: 'Se' },
      { char: 'ذ', label: 'Zal' },
    ],
    // Row 2
    [
      { char: 'خ', label: 'Khe' },
      { char: 'ں', label: 'Noon Ghunna' },
      { char: 'ݨ', label: 'Retroflex Noon' },
      { char: 'ۂ', label: 'He with Hamza' },
      { char: 'ۃ', label: 'Te Marbuta' },
      { char: 'ء', label: 'Hamza' },
      { char: 'ئ', label: 'Yeh Hamza' },
      { char: 'ؤ', label: 'Waw Hamza' },
      { char: 'أ', label: 'Alif Hamza Above' },
      { char: 'إ', label: 'Alif Hamza Below' },
      { char: 'آ', label: 'Alif Madd' },
    ],
    // Row 3
    [
      { char: 'پھ', isKashmiriSpecial: true, label: 'Pha' },
      { char: 'تھ', isKashmiriSpecial: true, label: 'Tha' },
      { char: 'ٹھ', isKashmiriSpecial: true, label: 'Ttha' },
      { char: 'چھ', isKashmiriSpecial: true, label: 'Chha' },
      { char: 'جھ', isKashmiriSpecial: true, label: 'Jha' },
      { char: 'دھ', isKashmiriSpecial: true, label: 'Dha' },
      { char: 'ڈھ', isKashmiriSpecial: true, label: 'Ddha' },
      { char: 'کھ', isKashmiriSpecial: true, label: 'Kha' },
      { char: 'گھ', isKashmiriSpecial: true, label: 'Gha' },
      { char: 'لا', label: 'Laam-Alif' },
      { char: 'لٲ', isKashmiriSpecial: true, label: 'Laam-Alif Madd' },
    ],
  ],

  // 3. Kashmiri Vowels & Diacritic Harakat (واوَل و اِعراب) - Dotted circle for optimal Nastaliq rendering
  vowelsAndMarks: [
    // Row 1: Kashmiri Vowel Diacritics (Crucial for Nastaliq positioning)
    [
      { char: 'ٔ', displayChar: '◌ٔ', label: 'کٲشُر ہَمزہ پَتھ', isKashmiriSpecial: true },
      { char: 'ٕ', displayChar: '◌ٕ', label: 'کٲشُر ہَمزہ تَل', isKashmiriSpecial: true },
      { char: 'ٚ', displayChar: '◌ٚ', label: 'اۄلٹا وی (Inverted V)', isKashmiriSpecial: true },
      { char: '٘', displayChar: '◌٘', label: 'چوٹی وی (Small V)', isKashmiriSpecial: true },
      { char: 'ٖ', displayChar: '◌ٖ', label: 'زیر مَد (Subscript Alef)', isKashmiriSpecial: true },
      { char: 'ٗ', displayChar: '◌ٗ', label: 'الٹا پیش (Inverted Damma)', isKashmiriSpecial: true },
      { char: 'ٟ', displayChar: '◌ٟ', label: 'وِیوی ہمزہ زیر', isKashmiriSpecial: true },
      { char: 'ٓ', displayChar: '◌ٓ', label: 'مَدٕ (Madd)', isKashmiriSpecial: true },
    ],
    // Row 2: Traditional Arabic & Persian Harakat
    [
      { char: 'َ', displayChar: '◌َ', label: 'زَبَر (Zabar / Fatha)' },
      { char: 'ِ', displayChar: '◌ِ', label: 'زیر (Zer / Kasra)' },
      { char: 'ُ', displayChar: '◌ُ', label: 'پِش (Pesh / Damma)' },
      { char: 'ْ', displayChar: '◌ْ', label: 'جَزْم / سُکون (Jazm)' },
      { char: 'ّ', displayChar: '◌ّ', label: 'تَشْدِید (Tashdeed)' },
      { char: 'ٰ', displayChar: '◌ٰ', label: 'الف خنجری (Superscript Alef)' },
      { char: 'ّٰ', displayChar: '◌ّٰ', label: 'خنجری الف تشدید' },
      { char: 'ۡ', displayChar: '◌ۡ', label: 'سکون صغیر' },
    ],
    // Row 3: Full Kashmiri Vowel Matras & Tanween
    [
      { char: 'اَ', displayChar: 'اَ', label: 'Short A' },
      { char: 'اِ', displayChar: 'اِ', label: 'Short I' },
      { char: 'اُ', displayChar: 'اُ', label: 'Short U' },
      { char: 'ایٖ', displayChar: 'ایٖ', label: 'Long Ee', isKashmiriSpecial: true },
      { char: 'اوٗ', displayChar: 'اوٗ', label: 'Long Oo', isKashmiriSpecial: true },
      { char: 'ً', displayChar: '◌ً', label: 'دو زبر (Tanwin Fath)' },
      { char: 'ٍ', displayChar: '◌ٍ', label: 'دو زیر (Tanwin Kasr)' },
      { char: 'ٌ', displayChar: '◌ٌ', label: 'دو پیش (Tanwin Damm)' },
    ],
  ],

  // 4. Numerals, Standard Punctuation & Arithmetic Symbols (۱۲۳ و علامات)
  numbersAndSymbols: [
    // Row 1: Kashmiri / Urdu Numerals with Latin Long-press
    [
      { char: '۱', label: '1', longPress: ['1'] },
      { char: '۲', label: '2', longPress: ['2'] },
      { char: '۳', label: '3', longPress: ['3'] },
      { char: '۴', label: '4', longPress: ['4'] },
      { char: '۵', label: '5', longPress: ['5'] },
      { char: '۶', label: '6', longPress: ['6'] },
      { char: '۷', label: '7', longPress: ['7'] },
      { char: '۸', label: '8', longPress: ['8'] },
      { char: '۹', label: '9', longPress: ['9'] },
      { char: '۰', label: '0', longPress: ['0'] },
    ],
    // Row 2: Standard Kashmiri, Urdu & Regional Punctuation
    [
      { char: '۔', label: 'Full Stop' },
      { char: '،', label: 'Comma' },
      { char: '؟', label: 'Question' },
      { char: '؛', label: 'Semicolon' },
      { char: ':', label: 'Colon' },
      { char: '!', label: 'Exclamation' },
      { char: '—', label: 'Em Dash' },
      { char: '-', label: 'Hyphen' },
      { char: '/', label: 'Slash' },
      { char: '\\', label: 'Backslash' },
      { char: '٪', label: 'Percent' },
    ],
    // Row 3: Math, Brackets & Currency
    [
      { char: '(', label: 'Bracket (' },
      { char: ')', label: 'Bracket )' },
      { char: '[', label: 'Square [' },
      { char: ']', label: 'Square ]' },
      { char: '{', label: 'Brace {' },
      { char: '}', label: 'Brace }' },
      { char: '+', label: 'Plus' },
      { char: '×', label: 'Multiply' },
      { char: '÷', label: 'Divide' },
      { char: '=', label: 'Equals' },
      { char: '₹', label: 'Rupee' },
      { char: '$', label: 'Dollar' },
    ],
  ],

  // 5. Kashmiri Ligatures, Sacred Signs, Poetic Marks & Quotes (رموز، علامات و خطاطی)
  calligraphyAndPhrases: [
    // Row 1: Sacred Calligraphy & Quranic Marks
    [
      { char: '﷽', displayChar: '﷽', label: 'بسم اللہ', isKashmiriSpecial: true },
      { char: 'ﷺ', displayChar: 'ﷺ', label: 'درود شریف', isKashmiriSpecial: true },
      { char: 'ﷻ', displayChar: 'ﷻ', label: 'جل جلالہ', isKashmiriSpecial: true },
      { char: 'ؐ', displayChar: 'ؐ', label: 'صلی اللہ' },
      { char: 'ؑ', displayChar: 'ؑ', label: 'علیہ السلام' },
      { char: 'ؒ', displayChar: 'ؒ', label: 'رحمہ اللہ' },
      { char: 'ؓ', displayChar: 'ؓ', label: 'رضی اللہ' },
      { char: '۞', displayChar: '۞', label: 'حزب آیت' },
      { char: '۝', displayChar: '۝', label: 'آیت نشان' },
      { char: '۩', displayChar: '۩', label: 'سجدہ نشان' },
    ],
    // Row 2: Traditional Poetic, Literary & Editorial Signs
    [
      { char: '؎', displayChar: '؎', label: 'شعر نشان', isKashmiriSpecial: true },
      { char: '؏', displayChar: '؏', label: 'مصرعہ نشان', isKashmiriSpecial: true },
      { char: '؂', displayChar: '؂', label: 'تخلص نشان', isKashmiriSpecial: true },
      { char: '؀', displayChar: '؀', label: 'نمبر نشان' },
      { char: '؁', displayChar: '؁', label: 'سنہ نشان' },
      { char: '؍', displayChar: '؍', label: 'تاریخ نشان' },
      { char: '؃', displayChar: '؃', label: 'صفحہ نشان' },
      { char: '؞', displayChar: '؞', label: 'تین نکتے' },
      { char: 'ـ', displayChar: 'ـ', label: 'کشیدہ/تطویل' },
      { char: '…', displayChar: '…', label: 'تین نقطے (حذف)' },
    ],
    // Row 3: Brackets, Quotation Marks & Typographic Symbols
    [
      { char: '﴾', displayChar: '﴾', label: 'قرآنی بریکٹ' },
      { char: '﴿', displayChar: '﴿', label: 'قرآنی بریکٹ' },
      { char: '«', displayChar: '«', label: 'گیلو میں' },
      { char: '»', displayChar: '»', label: 'گیلو میں' },
      { char: '“', displayChar: '“', label: 'ڈبل کوٹ' },
      { char: '”', displayChar: '”', label: 'ڈبل کوٹ' },
      { char: '‘', displayChar: '‘', label: 'سنگل کوٹ' },
      { char: '’', displayChar: '’', label: 'سنگل کوٹ' },
      { char: '٭', displayChar: '٭', label: 'ستارہ' },
      { char: '※', displayChar: '※', label: 'حوالہ' },
      { char: '•', displayChar: '•', label: 'بلٹ' },
    ],
  ],
};

// Kashmiri Quick Bar top items
export const KASHMIRI_QUICK_STRIP = [
  { char: 'ٲ', name: 'ٲ' },
  { char: 'ۄ', name: 'ۄ' },
  { char: 'ؠ', name: 'ؠ' },
  { char: 'ژ', name: 'ژ' },
  { char: 'ٕ', name: '◌ٕ' },
  { char: 'ٔ', name: '◌ٔ' },
  { char: 'ٚ', name: '◌ٚ' },
  { char: '٘', name: '◌٘' },
  { char: 'ےٚ', name: 'ےٚ' },
  { char: 'ۆ', name: 'ۆ' },
  { char: 'ٳ', name: 'ٳ' },
  { char: 'ٖ', name: '◌ٖ' },
  { char: 'ٗ', name: '◌ٗ' },
  { char: 'پھ', name: 'پھ' },
  { char: 'تھ', name: 'تھ' },
  { char: 'ٹھ', name: 'ٹھ' },
  { char: 'چھ', name: 'چھ' },
  { char: 'کھ', name: 'کھ' },
  { char: '۔', name: '۔' },
  { char: '،', name: '،' },
  { char: '؟', name: '؟' },
];
