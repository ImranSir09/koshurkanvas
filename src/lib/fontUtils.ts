import { FontChoice } from '../types';

export interface FontDefinition {
  id: FontChoice;
  label: string;
  preview: string;
}

export const SYSTEM_FONTS: FontDefinition[] = [
  { id: 'Noto Nastaliq Urdu', label: 'Noto Nastaliq Urdu', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Gulzar', label: 'Gulzar Nastaliq', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Amiri', label: 'Amiri Naskh', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Noto Sans Arabic', label: 'Noto Sans Arabic', preview: 'کٲشُر لیٚکھُن' },
];

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
