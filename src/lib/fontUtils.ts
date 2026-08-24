import { FontChoice } from '../types';

export function getFontFamilyCSS(fontFamily: FontChoice | string): string {
  switch (fontFamily) {
    case 'Noto Nastaliq Urdu':
      return "'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Gulzar', 'Amiri', serif";
    case 'Gulzar':
      return "'Gulzar', 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Amiri', serif";
    case 'Amiri':
      return "'Amiri', 'Noto Nastaliq Urdu', 'Gulzar', 'Urdu Typesetting', serif";
    case 'Noto Sans Arabic':
      return "'Noto Sans Arabic', 'Tahoma', 'Arial', 'Segoe UI', sans-serif";
    default:
      return `'${fontFamily}', 'Noto Nastaliq Urdu', 'Gulzar', serif`;
  }
}
