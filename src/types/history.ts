import { CanvasBackgroundConfig, TextStyleProperties, TextStyleSpan, TextLayer } from './index';

export type HistoryActionCategory =
  | 'text_edit'
  | 'format_style'
  | 'layer_add'
  | 'layer_delete'
  | 'layer_arrange'
  | 'layer_transform'
  | 'layer_group'
  | 'layer_align'
  | 'canvas_layout'
  | 'batch_operation'
  | 'document_init';

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  description: string;
  category: HistoryActionCategory;
  docTitle?: string;
  content: string;
  textLayers: TextLayer[];
  spans: TextStyleSpan[];
  canvasConfig?: CanvasBackgroundConfig;
  defaultStyle?: TextStyleProperties;
  activeLayerId?: string | null;
  selectedLayerIds?: string[];
  meta?: {
    actionDetails?: string;
    affectedLayerCount?: number;
    fontSize?: number;
    fontFamily?: string;
    preset?: string;
  };
}

export interface HistoryStats {
  pastCount: number;
  futureCount: number;
  totalCount: number;
  currentIndex: number;
  lastAction?: HistorySnapshot;
  nextRedoAction?: HistorySnapshot;
}
