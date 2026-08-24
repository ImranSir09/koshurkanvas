export interface KashmiriCorrectionRule {
  wrong: string;
  correct: string;
  reason: string;
}

export const COMMON_KASHMIRI_CORRECTIONS: KashmiriCorrectionRule[] = [
  // 1. Arabic Yeh instead of Kashmiri/Urdu Yeh
  {
    wrong: 'ي',
    correct: 'ی',
    reason: 'Convert Arabic Yeh (U+064A with dots) to Perso-Arabic/Kashmiri Yeh (U+06CC)',
  },
  // 2. Arabic Kaf instead of Persian/Kashmiri Keheh
  {
    wrong: 'ك',
    correct: 'ک',
    reason: 'Convert Arabic Kaf (U+0643) to Kashmiri/Urdu Keheh (U+06A9)',
  },
  // 3. Arabic Heh instead of Kashmiri Goal Heh
  {
    wrong: 'ه',
    correct: 'ہ',
    reason: 'Convert Arabic Heh (U+0647) to Kashmiri Goal Heh (U+06C1)',
  },
  // 4. Combined Hamza + Alif typos to standard Kashmiri ٲ (U+0672)
  {
    wrong: 'أ',
    correct: 'ٲ',
    reason: 'Convert Arabic Hamza-Alif to Kashmiri Alif with Madda ٲ (U+0672) where appropriate',
  },
  // 5. Kashmiri Waw with ring standard
  {
    wrong: 'وٗ',
    correct: 'ۄ',
    reason: 'Convert decomposed Waw+Inverted Damma to Kashmiri Waw with Ring (U+06C4)',
  },
  // 6. Fix decomposed Yeh combinations
  {
    wrong: 'یٔ',
    correct: 'ؠ',
    reason: 'Standardize Kashmiri Tshae/Palatalized Yeh to single Unicode character ؠ (U+0620)',
  },
  // 7. Non-standard dash full stop to Urdu Full Stop
  {
    wrong: '۔-',
    correct: '۔',
    reason: 'Clean redundant dashes after Urdu full stops',
  },
  // 8. Western comma to Urdu comma
  {
    wrong: ',',
    correct: '،',
    reason: 'Convert Western comma to Urdu/Kashmiri comma (،)',
  },
  // 9. Western question mark to Urdu question mark
  {
    wrong: '?',
    correct: '؟',
    reason: 'Convert Western question mark to Urdu/Kashmiri question mark (؟)',
  },
  // 10. Western semicolon to Urdu semicolon
  {
    wrong: ';',
    correct: '؛',
    reason: 'Convert Western semicolon to Urdu/Kashmiri semicolon (؛)',
  },
];

// Transliterate Kashmiri text to Latin / English phonetic representation
export function transliterateKashmiriToLatin(text: string): string {
  if (!text) return '';

  const charMap: Record<string, string> = {
    'ا': 'a',
    'آ': 'aa',
    'ٲ': 'ae',
    'ٳ': 'i',
    'ب': 'b',
    'پ': 'p',
    'ت': 't',
    'ٹ': 'tt',
    'ث': 's',
    'ج': 'j',
    'چ': 'ch',
    'ح': 'h',
    'خ': 'kh',
    'د': 'd',
    'ڈ': 'dd',
    'ذ': 'z',
    'ر': 'r',
    'ڑ': 'rr',
    'ز': 'z',
    'ژ': 'ts',
    'س': 's',
    'ش': 'sh',
    'ص': 's',
    'ض': 'z',
    'ط': 't',
    'ظ': 'z',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'q',
    'ک': 'k',
    'گ': 'g',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'ں': 'n',
    'و': 'w',
    'ۄ': 'o',
    'ۆ': 'oo',
    'ہ': 'h',
    'ھ': 'h',
    'ء': "'",
    'ی': 'y',
    'ے': 'e',
    'ؠ': 'ya',
    'ےٚ': 'e',
    'َ': 'a',
    'ِ': 'i',
    'ُ': 'u',
    'ْ': '',
    'ّ': '',
    'ٔ': 'a',
    'ٕ': 'i',
    'ٚ': 'o',
    '٘': '',
    'ٖ': 'ee',
    'ٗ': 'oo',
    'ٰ': 'aa',
    '۔': '.',
    '،': ',',
    '؟': '?',
    '؛': ';',
    ' ': ' ',
    '\n': '\n',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '۰': '0',
  };

  let result = '';
  for (const char of text) {
    if (charMap[char] !== undefined) {
      result += charMap[char];
    } else {
      result += char;
    }
  }

  // Capitalize beginnings of sentences
  return result
    .replace(/(^\s*|[.!?]\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function toKashmiriNumerals(num: number): string {
  const kashDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => kashDigits[parseInt(d, 10)] ?? d).join('');
}
