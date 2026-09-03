import React, { useState, useMemo } from 'react';
import {
  SOLID_PALETTE_GROUPS,
  GRADIENT_PRESETS,
} from '../lib/kashmiriData';
import {
  Check,
  Ban,
  Plus,
  Sliders,
  Sparkles,
} from 'lucide-react';

export interface ColorChangeResult {
  color?: string;
  gradient?: string;
  type: 'solid' | 'gradient' | 'none';
}

export interface ColorGradientPickerProps {
  label?: string;
  title?: string;
  value?: string; // solid color (hex/rgb) or gradient string ("linear-gradient(...)")
  currentColor?: string; // backwards compatibility alias
  gradientValue?: string;
  currentGradient?: string; // backwards compatibility alias
  allowNone?: boolean;
  noneLabel?: string;
  onChange: ((result: ColorChangeResult) => void) | ((color?: string, gradient?: string) => void);
  compact?: boolean;
}

const GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export const ColorGradientPicker: React.FC<ColorGradientPickerProps> = ({
  label,
  title,
  value,
  currentColor: propCurrentColor,
  gradientValue,
  currentGradient: propCurrentGradient,
  allowNone = false,
  noneLabel = 'None',
  onChange,
}) => {
  const displayLabel = label || title;

  // Defensively unwrap color/gradient values whether passed as string or object
  const rawValue = value ?? propCurrentColor;
  const rawGradient = gradientValue ?? propCurrentGradient;

  const effectiveValue = typeof rawValue === 'string'
    ? rawValue
    : (rawValue && typeof (rawValue as any).color === 'string'
        ? (rawValue as any).color
        : undefined);

  const effectiveGradient = typeof rawGradient === 'string'
    ? rawGradient
    : (rawGradient && typeof (rawGradient as any).gradient === 'string'
        ? (rawGradient as any).gradient
        : undefined);

  // Determine initial mode
  const isGradientActive = !!(
    effectiveGradient ||
    (effectiveValue && (effectiveValue.startsWith('linear-gradient') || effectiveValue.startsWith('radial-gradient')))
  );
  const isNoneActive = !effectiveValue && !effectiveGradient && allowNone;

  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>(
    isGradientActive ? 'gradient' : 'solid'
  );
  const [showCustomGradient, setShowCustomGradient] = useState<boolean>(false);

  // Custom gradient state
  const [customColor1, setCustomColor1] = useState<string>('#064e3b');
  const [customColor2, setCustomColor2] = useState<string>('#10b981');
  const [customAngle, setCustomAngle] = useState<number>(135);

  const currentColor = !isGradientActive && effectiveValue && effectiveValue !== 'transparent'
    ? effectiveValue
    : '#1c1917';
  const currentGradient = effectiveGradient || (isGradientActive ? effectiveValue : undefined);

  // Unified change dispatcher supporting both (result) => void and (color, gradient) => void
  const notifyChange = (res: ColorChangeResult) => {
    if (typeof onChange === 'function') {
      if (onChange.length === 2) {
        (onChange as any)(res.color, res.gradient);
      } else {
        (onChange as any)(res, res.color, res.gradient);
      }
    }
  };

  // Flattened deduplicated solid color swatches without categories
  const allSolidSwatches = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; color: string }[] = [];
    for (const group of SOLID_PALETTE_GROUPS) {
      for (const swatch of group.swatches) {
        const normalized = swatch.color.toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          list.push(swatch);
        }
      }
    }
    return list;
  }, []);

  // Handle solid color selection
  const handleSelectSolid = (color: string) => {
    notifyChange({
      color,
      gradient: undefined,
      type: 'solid',
    });
  };

  // Handle gradient preset selection
  const handleSelectGradient = (gradValue: string) => {
    notifyChange({
      color: undefined,
      gradient: gradValue,
      type: 'gradient',
    });
  };

  // Handle none / transparent selection
  const handleSelectNone = () => {
    notifyChange({
      color: undefined,
      gradient: undefined,
      type: 'none',
    });
  };

  // Apply custom 2-stop gradient
  const handleApplyCustomGradient = (c1: string, c2: string, angle: number) => {
    const grad = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
    notifyChange({
      color: undefined,
      gradient: grad,
      type: 'gradient',
    });
  };

  return (
    <div className="flex flex-col gap-2.5 font-sans">
      {/* Header & Sub-Menu Switcher in Flat Design */}
      <div className="flex items-center justify-between gap-2">
        {displayLabel && (
          <span className="text-xs font-semibold text-stone-800 tracking-tight">
            {displayLabel}
          </span>
        )}

        {/* Minimal Flat Sub-Menu: Solid / Gradient */}
        <div className="flex items-center p-0.5 bg-stone-200/70 rounded-full">
          <button
            type="button"
            onClick={() => setActiveTab('solid')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
              activeTab === 'solid'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Solid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gradient')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
              activeTab === 'gradient'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Gradient
          </button>
        </div>
      </div>

      {/* SOLID SUB-MENU: ONLY ROUND CIRCLES (NO CATEGORIES) */}
      {activeTab === 'solid' && (
        <div className="flex flex-col gap-2">
          {/* Flat Grid of Round Color Circles */}
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-2 py-1 items-center justify-items-center max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
            {/* None / Transparent Circle (if allowed) */}
            {allowNone && (
              <button
                type="button"
                onClick={handleSelectNone}
                className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-all cursor-pointer ${
                  isNoneActive
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400 ring-offset-1 scale-105'
                    : 'border-stone-300 bg-transparent hover:border-stone-400'
                }`}
                title="Transparent / None"
              >
                <Ban size={14} className={isNoneActive ? 'text-rose-600' : 'text-stone-400'} />
              </button>
            )}

            {/* Custom Color Picker Round Circle */}
            <div className="relative w-8 h-8 rounded-full shrink-0">
              <input
                type="color"
                value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#1c1917'}
                onChange={(e) => handleSelectSolid(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full z-10"
                title="Custom color picker"
              />
              <div className="w-8 h-8 rounded-full border border-stone-300 bg-linear-to-tr from-rose-400 via-amber-300 to-emerald-400 flex items-center justify-center transition-transform hover:scale-105">
                <Plus size={14} className="text-stone-900 drop-shadow-2xs stroke-[2.5]" />
              </div>
            </div>

            {/* Flat List of Swatch Round Circles without Categories */}
            {allSolidSwatches.map((swatch, idx) => {
              const isSelected =
                !isGradientActive &&
                !isNoneActive &&
                currentColor.toLowerCase() === swatch.color.toLowerCase();

              const isLight =
                swatch.color === '#ffffff' ||
                swatch.color === '#fef3c7' ||
                swatch.color === '#f5f5f4' ||
                swatch.color === '#fdfbf7' ||
                swatch.color === '#fef9c3' ||
                swatch.color === '#ffedd5' ||
                swatch.color === '#fafafa' ||
                swatch.color === '#e2e8f0';

              return (
                <button
                  key={`solid-${swatch.color}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSolid(swatch.color)}
                  className={`w-8 h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-emerald-700 ring-offset-2 scale-110 border-transparent shadow-xs'
                      : 'border-black/10 hover:scale-105 active:scale-95'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                  title={`${swatch.name} (${swatch.color})`}
                >
                  {isSelected && (
                    <Check
                      size={14}
                      className={`stroke-[3] ${isLight ? 'text-stone-900' : 'text-white'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GRADIENT SUB-MENU: ONLY ROUND CIRCLES (NO CATEGORIES) */}
      {activeTab === 'gradient' && (
        <div className="flex flex-col gap-2">
          {/* Flat Grid of Round Gradient Circles */}
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 py-1 items-center justify-items-center max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
            {/* Custom Gradient Builder Trigger Round Circle */}
            <button
              type="button"
              onClick={() => setShowCustomGradient(!showCustomGradient)}
              className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-all cursor-pointer ${
                showCustomGradient
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600 ring-offset-1'
                  : 'border-stone-300 bg-stone-50 text-stone-500 hover:border-stone-400 hover:text-stone-800'
              }`}
              title={showCustomGradient ? 'Hide Custom Builder' : 'Build Custom Gradient'}
            >
              {showCustomGradient ? <Sliders size={13} /> : <Sparkles size={13} />}
            </button>

            {/* Gradient Preset Round Circles without Categories */}
            {GRADIENT_PRESETS.map((preset) => {
              const isSelected = isGradientActive && currentGradient === preset.value;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectGradient(preset.value)}
                  className={`w-8 h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-emerald-700 ring-offset-2 scale-110 border-transparent shadow-xs'
                      : 'border-black/10 hover:scale-105 active:scale-95'
                  }`}
                  style={{ backgroundImage: preset.value }}
                  title={preset.name}
                >
                  {isSelected && (
                    <Check size={14} className="text-white stroke-[3] drop-shadow-xs" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Minimal Inline Custom Gradient Controls (when triggered) */}
          {showCustomGradient && (
            <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={customColor1}
                  onChange={(e) => {
                    setCustomColor1(e.target.value);
                    handleApplyCustomGradient(e.target.value, customColor2, customAngle);
                  }}
                  className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer p-0 shrink-0"
                  title="Gradient start color"
                />
                <input
                  type="color"
                  value={customColor2}
                  onChange={(e) => {
                    setCustomColor2(e.target.value);
                    handleApplyCustomGradient(customColor1, e.target.value, customAngle);
                  }}
                  className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer p-0 shrink-0"
                  title="Gradient end color"
                />
              </div>

              {/* Quick Angle Chips */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar flex-1">
                {GRADIENT_ANGLES.map((ang) => (
                  <button
                    key={ang}
                    type="button"
                    onClick={() => {
                      setCustomAngle(ang);
                      handleApplyCustomGradient(customColor1, customColor2, ang);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                      customAngle === ang
                        ? 'bg-stone-800 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {ang}°
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
