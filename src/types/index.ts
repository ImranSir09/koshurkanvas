export type EditorMode = 'editor' | 'design' | 'templates' | 'projects';

export type FontChoice = 'Noto Nastaliq Urdu' | 'Gulzar' | 'Amiri' | 'Noto Sans Arabic';

export interface TextStyleProperties {
  fontFamily: FontChoice;
  fontSize: number; // in px or pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  highlightColor?: string;
  align: 'right' | 'center' | 'left' | 'justify';
  verticalAlign?: 'top' | 'center' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  direction: 'rtl' | 'ltr';
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeColor?: string;
  strokeWidth?: number;
  opacity: number;
  kashida?: boolean;
  borderRadius?: number;
  padding?: number;
  borderWidth?: number;
  borderColor?: string;
  flipX?: boolean;
  flipY?: boolean;
  presetEffect?: 'none' | 'gold' | 'neon' | 'calligraphy' | 'vintage' | 'minimal' | 'glass';
}

export interface TextStyleSpan {
  id: string;
  start: number; // 0-based character index in Unicode string
  end: number;   // 0-based character index (exclusive)
  style: Partial<TextStyleProperties>;
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

export type DocumentPaperSize =
  | 'a3'
  | 'a4'
  | 'a5'
  | 'a6'
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'b4'
  | 'b5'
  | 'b6';

export type SocialCardSize =
  | '1:1'
  | '4:5'
  | '9:16'
  | '16:9'
  | '3:4'
  | '2:3'
  | 'auto'
  | 'custom';

export type CanvasAspectRatio = DocumentPaperSize | SocialCardSize;

export interface CanvasBackgroundConfig {
  color?: string;
  image?: string;
  imageOpacity?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  pattern?: string;
  aspectRatio?: CanvasAspectRatio;
  customWidth?: number;
  customHeight?: number;
  orientation?: 'portrait' | 'landscape';
  margin?: 'compact' | 'normal' | 'wide' | 'none';
}

export type ParagraphType = 'normal' | 'bullet' | 'numbered' | 'checklist' | 'quote';

export interface ParagraphFormat {
  direction?: 'rtl' | 'ltr';
  type?: ParagraphType;
  align?: 'right' | 'center' | 'left' | 'justify';
  indent?: number; // 0, 1, 2...
  checked?: boolean; // for checklist items
}

export interface KashurDocument {
  id: string;
  title: string;
  content: string; // Clean raw Unicode text
  textLayers?: TextLayer[]; // Canvas Text Layers
  activeLayerId?: string | null;
  spans: TextStyleSpan[]; // Non-destructive formatting ranges
  paragraphFormats?: { [paraIndex: number]: ParagraphFormat };
  defaultStyle: TextStyleProperties;
  canvasConfig?: CanvasBackgroundConfig;
  createdAt: number;
  updatedAt: number;
}

export type CanvasPresetType = CanvasAspectRatio | 'custom';

export interface CanvasPreset {
  id: CanvasPresetType;
  name: string;
  nameKashmiri: string;
  width: number;
  height: number;
  aspectRatio: string;
  icon: string;
  description: string;
  dimensionsMm?: string;
  category: 'document' | 'social' | 'print';
}

export type LayerType = 'text' | 'image' | 'shape' | 'sticker' | 'background';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isHidden: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string; // Real Unicode Kashmiri text
  style: TextStyleProperties;
  scale?: number;
  kashida?: boolean;
  spans?: TextStyleSpan[];
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  aspectRatio: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow?: boolean;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'pill' | 'banner' | 'divider' | 'frame';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  stickerId: string;
  svgContent?: string;
  color?: string;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  bgType: 'solid' | 'gradient' | 'pattern' | 'image';
  color: string;
  gradient?: {
    from: string;
    to: string;
    angle: number;
  };
  pattern?: string;
  imageSrc?: string;
  overlayOpacity?: number;
}

export type CanvasLayer = TextLayer | ImageLayer | ShapeLayer | StickerLayer | BackgroundLayer;

export interface DesignProject {
  id: string;
  title: string;
  preset: CanvasPresetType;
  width: number;
  height: number;
  layers: CanvasLayer[];
  createdAt: number;
  updatedAt: number;
}

export type TemplateCategory =
  | 'all'
  | 'poetry'
  | 'quotes'
  | 'islamic'
  | 'greetings'
  | 'announcements'
  | 'education'
  | 'social';

export interface KashurTemplate {
  id: string;
  category: TemplateCategory;
  title: string;
  titleKashmiri: string;
  description: string;
  author?: string;
  previewGradient: string;
  docContent: string;
  designData?: {
    preset: CanvasPresetType;
    width: number;
    height: number;
    layers: Partial<CanvasLayer>[];
  };
}

export interface KashmiriCharInfo {
  char: string;
  name: string;
  nameKashmiri: string;
  unicodeHex: string;
  category: 'letter' | 'vowel' | 'diacritic' | 'combining' | 'number' | 'punctuation';
  sound: string;
  exampleWord: string;
  exampleMeaning: string;
  isKashmiriSpecific?: boolean;
}

export interface KeyboardKey {
  char: string;
  displayChar?: string;
  label?: string;
  type?: 'char' | 'action' | 'diacritic' | 'space' | 'enter' | 'backspace';
  longPress?: string[];
  isKashmiriSpecial?: boolean;
}
