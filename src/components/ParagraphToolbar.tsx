import React from 'react';
import {
  ArrowRightToLine,
  ArrowLeftToLine,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Outdent,
  Indent,
  Heading1,
  Heading2,
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
} from 'lucide-react';
import { ParagraphFormat } from '../types';

interface ParagraphToolbarProps {
  currentFormat: ParagraphFormat;
  onApplyFormat: (updates: Partial<ParagraphFormat>) => void;
  onApplyPreset?: (preset: 'title' | 'heading' | 'subheading' | 'body') => void;
}

export const ParagraphToolbar: React.FC<ParagraphToolbarProps> = ({
  currentFormat,
  onApplyFormat,
  onApplyPreset,
}) => {
  return (
    <div
      className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-1 shadow-2xs overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth [-webkit-overflow-scrolling:touch] custom-scrollbar shrink-0"
      dir="ltr"
    >
      {/* Quick Paragraph Heading Presets */}
      {onApplyPreset && (
        <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-md p-0.5 shrink-0" dir="rtl">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onApplyPreset('title')}
            className="h-7 px-2 rounded text-xs font-nastaliq text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
            title="Title Preset (عنوان)"
          >
            عنوان
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onApplyPreset('heading')}
            className="h-7 px-2 rounded text-xs font-nastaliq text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
            title="Heading Preset (سرخی)"
          >
            سرخی
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onApplyPreset('subheading')}
            className="h-7 px-2 rounded text-xs font-nastaliq text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
            title="Subheading Preset (ذیلی سرخی)"
          >
            ذیلی
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onApplyPreset('body')}
            className="h-7 px-2 rounded text-xs font-nastaliq text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
            title="Body Preset (متن)"
          >
            متن
          </button>
          <div className="w-px h-4 bg-stone-200 mx-0.5" />
        </div>
      )}

      {/* 1. RTL Text Direction */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ direction: 'rtl' })}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          currentFormat.direction === 'rtl' || !currentFormat.direction
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
        title="RTL Text Direction"
      >
        <ArrowRightToLine size={16} />
      </button>

      {/* 2. LTR Text Direction */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ direction: 'ltr' })}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          currentFormat.direction === 'ltr'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
        title="LTR Text Direction"
      >
        <ArrowLeftToLine size={16} />
      </button>

      <div className="w-px h-5 bg-stone-200 mx-0.5 shrink-0" />

      {/* Paragraph Alignment */}
      <div className="flex items-center gap-0.5 bg-stone-50 border border-stone-200 rounded-md p-0.5 shrink-0" dir="rtl">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onApplyFormat({ align: 'right' })}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            currentFormat.align === 'right' || !currentFormat.align
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          title="Align Right (دٔسٲنٛد)"
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onApplyFormat({ align: 'center' })}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            currentFormat.align === 'center'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          title="Align Center (مَنٛز)"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onApplyFormat({ align: 'left' })}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            currentFormat.align === 'left'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          title="Align Left (بٕکٲنٛد)"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onApplyFormat({ align: 'justify' })}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            currentFormat.align === 'justify'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          title="Justify (بَرٛور)"
        >
          <AlignJustify size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-stone-200 mx-0.5 shrink-0" />

      {/* 3. Bulleted List */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ type: currentFormat.type === 'bullet' ? 'normal' : 'bullet' })}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          currentFormat.type === 'bullet'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
        title="Bulleted List"
      >
        <List size={16} />
      </button>

      {/* 4. Numbered List */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ type: currentFormat.type === 'numbered' ? 'normal' : 'numbered' })}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          currentFormat.type === 'numbered'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </button>

      {/* 5. Checklist */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          onApplyFormat({
            type: currentFormat.type === 'checklist' ? 'normal' : 'checklist',
            checked: currentFormat.type === 'checklist' ? undefined : false,
          })
        }
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          currentFormat.type === 'checklist'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
        title="Checklist"
      >
        <CheckSquare size={16} />
      </button>

      {/* 6. Block Quote */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ type: currentFormat.type === 'quote' ? 'normal' : 'quote' })}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          currentFormat.type === 'quote'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
        title="Block Quote"
      >
        <Quote size={16} />
      </button>

      <div className="w-px h-5 bg-stone-200 mx-0.5 shrink-0" />

      {/* 7. Decrease Indent */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ indent: Math.max(0, (currentFormat.indent || 0) - 1) })}
        className="w-8 h-8 rounded-md flex items-center justify-center text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer shrink-0"
        title="Decrease Indent"
      >
        <Outdent size={16} />
      </button>

      {/* 8. Increase Indent */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApplyFormat({ indent: Math.min(5, (currentFormat.indent || 0) + 1) })}
        className="w-8 h-8 rounded-md flex items-center justify-center text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer shrink-0"
        title="Increase Indent"
      >
        <Indent size={16} />
      </button>
    </div>
  );
};
