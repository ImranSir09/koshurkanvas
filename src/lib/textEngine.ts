import { TextStyleProperties, TextStyleSpan } from '../types';
import { DEFAULT_TEXT_STYLE } from './kashmiriData';

export interface RenderedTextSlice {
  text: string;
  start: number;
  end: number;
  style: TextStyleProperties;
  isSelected?: boolean;
  hasCaretAtStart?: boolean;
  hasCaretAtEnd?: boolean;
}

/**
 * Returns an array of valid grapheme cluster boundaries in Kashmiri Unicode text
 * using Intl.Segmenter with safe fallback.
 */
export function getGraphemeBoundaries(text: string): number[] {
  if (!text) return [0];
  const boundaries = [0];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('ks', { granularity: 'grapheme' });
      for (const seg of segmenter.segment(text)) {
        boundaries.push(seg.index + seg.segment.length);
      }
      return boundaries;
    } catch {
      // fallback
    }
  }
  for (let i = 0; i < text.length; ) {
    const code = text.charCodeAt(i);
    let len = 1;
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const nextCode = text.charCodeAt(i + 1);
      if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
        len = 2;
      }
    }
    while (i + len < text.length) {
      const nextC = text.charCodeAt(i + len);
      if ((nextC >= 0x064b && nextC <= 0x065f) || (nextC >= 0x0610 && nextC <= 0x061a) || nextC === 0x06e1) {
        len += 1;
      } else {
        break;
      }
    }
    i += len;
    boundaries.push(i);
  }
  return boundaries;
}

/**
 * Normalizes selection start and end to valid grapheme boundaries so that
 * Kashmiri combining marks, vowel signs, or diacritics are never split.
 */
export function normalizeSelection(text: string, start: number, end: number): { start: number; end: number } {
  if (!text || start >= end) {
    const clamped = Math.max(0, Math.min(text?.length || 0, start));
    return { start: clamped, end: clamped };
  }
  const s = Math.max(0, Math.min(text.length, start));
  const e = Math.max(0, Math.min(text.length, end));
  if (s === e) return { start: s, end: e };

  const boundaries = getGraphemeBoundaries(text);
  let bestStart = s;
  let bestEnd = e;

  for (const b of boundaries) {
    if (b <= s) bestStart = b;
    if (b >= e) {
      bestEnd = b;
      break;
    }
  }
  return { start: Math.min(bestStart, bestEnd), end: Math.max(bestStart, bestEnd) };
}

/**
 * Transforms selection or caret range after text insertion or deletion.
 */
export function transformRangeAfterEdit(
  rangeStart: number,
  rangeEnd: number,
  changePos: number,
  deltaLength: number
): { start: number; end: number } {
  if (deltaLength === 0) return { start: rangeStart, end: rangeEnd };

  let newStart = rangeStart;
  let newEnd = rangeEnd;

  if (deltaLength > 0) {
    if (rangeStart >= changePos) newStart += deltaLength;
    if (rangeEnd >= changePos) newEnd += deltaLength;
  } else {
    const deleteEnd = changePos - deltaLength;
    if (rangeEnd <= changePos) {
      // unchanged
    } else if (rangeStart >= deleteEnd) {
      newStart += deltaLength;
      newEnd += deltaLength;
    } else {
      if (rangeStart >= changePos) newStart = changePos;
      if (rangeEnd >= changePos) newEnd = Math.max(changePos, rangeEnd + deltaLength);
    }
  }
  return {
    start: Math.max(0, Math.min(newStart, newEnd)),
    end: Math.max(0, Math.max(newStart, newEnd)),
  };
}

/**
 * Normalizes spans: removes empty spans, sorts by start index, merges adjacent
 * compatible spans with identical styles, and prevents unnecessary overlap.
 */
export function normalizeSpans(spans: TextStyleSpan[]): TextStyleSpan[] {
  if (!spans || spans.length === 0) return [];

  let valid = spans.filter((s) => s && s.start < s.end && s.style);
  if (valid.length <= 1) return valid;

  valid.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  const merged: TextStyleSpan[] = [];

  for (const span of valid) {
    if (merged.length === 0) {
      merged.push({ ...span });
      continue;
    }

    const last = merged[merged.length - 1];
    const sameStyle = JSON.stringify(last.style) === JSON.stringify(span.style);

    if (sameStyle && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else if (span.start < last.end) {
      if (span.end <= last.end) {
        const leftEnd = span.start;
        const rightStart = span.end;

        if (leftEnd > last.start) {
          last.end = leftEnd;
        } else {
          merged.pop();
        }

        merged.push({ ...span });

        if (rightStart < last.end) {
          merged.push({
            id: `${last.id}-r`,
            start: rightStart,
            end: last.end,
            style: last.style,
          });
        }
      } else {
        if (span.start > last.start) {
          last.end = span.start;
        } else {
          merged.pop();
        }
        merged.push({ ...span });
      }
    } else {
      merged.push({ ...span });
    }
  }

  return merged.filter((s) => s.start < s.end);
}

/**
 * Transforms span indices when text is inserted or deleted and normalizes the resulting spans.
 */
export function transformSpansAfterEdit(
  spans: TextStyleSpan[],
  changePos: number,
  deltaLength: number
): TextStyleSpan[] {
  const shifted = shiftSpansOnTextChange(spans, changePos, deltaLength);
  return normalizeSpans(shifted);
}

/**
 * Merges default styles with applicable span styles at any character index,
 * producing flattened rendered slices of clean Unicode text.
 */
export function buildRenderedSlices(
  content: string,
  spans: TextStyleSpan[],
  defaultStyle: TextStyleProperties = DEFAULT_TEXT_STYLE,
  selection?: { start: number; end: number },
  cursorPos?: number
): RenderedTextSlice[] {
  if (!content) return [];

  const hasSelection = selection && selection.start !== selection.end && selection.start < selection.end;
  const selStart = hasSelection ? Math.max(0, Math.min(content.length, selection.start)) : 0;
  const selEnd = hasSelection ? Math.max(0, Math.min(content.length, selection.end)) : 0;
  const validCursor = !hasSelection && cursorPos !== undefined && cursorPos >= 0 && cursorPos <= content.length ? cursorPos : -1;

  const points = new Set<number>([0, content.length]);

  if (hasSelection) {
    points.add(selStart);
    points.add(selEnd);
  }

  if (validCursor !== -1) {
    points.add(validCursor);
  }

  if (spans && spans.length > 0) {
    for (const span of spans) {
      if (span.start >= 0 && span.start <= content.length) points.add(span.start);
      if (span.end >= 0 && span.end <= content.length) points.add(span.end);
    }
  }

  const sortedPoints = Array.from(points).sort((a, b) => a - b);
  const slices: RenderedTextSlice[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    if (start === end) continue;

    const sliceText = content.slice(start, end);
    let combinedStyle: TextStyleProperties = { ...defaultStyle };

    if (spans && spans.length > 0) {
      for (const span of spans) {
        if (span.start < end && span.end > start) {
          combinedStyle = {
            ...combinedStyle,
            ...span.style,
          };
        }
      }
    }

    const isSelected = hasSelection && start >= selStart && end <= selEnd;
    const hasCaretAtStart = !hasSelection && validCursor === start && start !== content.length;
    const hasCaretAtEnd = !hasSelection && validCursor === end && end === content.length;

    slices.push({
      text: sliceText,
      start,
      end,
      style: combinedStyle,
      isSelected,
      hasCaretAtStart,
      hasCaretAtEnd,
    });
  }

  return slices;
}

/**
 * Gets the effective formatting style at a given selection or cursor position.
 */
export function getEffectiveStyleAtRange(
  contentLength: number,
  spans: TextStyleSpan[],
  defaultStyle: TextStyleProperties,
  rangeStart: number,
  rangeEnd: number
): TextStyleProperties {
  let effective: TextStyleProperties = { ...defaultStyle };
  const targetStart = rangeStart === rangeEnd ? Math.max(0, rangeStart - 1) : rangeStart;
  const targetEnd = rangeStart === rangeEnd ? rangeStart : rangeEnd;

  if (spans && spans.length > 0) {
    for (const span of spans) {
      if (span.start < targetEnd && span.end > targetStart) {
        effective = {
          ...effective,
          ...span.style,
        };
      }
    }
  }
  return effective;
}

/**
 * Applies a partial style change to the EXACT arbitrary character range [start, end].
 */
export function applyStyleToRange(
  contentLength: number,
  existingSpans: TextStyleSpan[],
  rangeStart: number,
  rangeEnd: number,
  styleDiff: Partial<TextStyleProperties>
): TextStyleSpan[] {
  if (rangeStart >= rangeEnd || rangeStart < 0 || rangeEnd > contentLength) {
    return normalizeSpans(existingSpans);
  }

  const newSpan: TextStyleSpan = {
    id: `span-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    start: rangeStart,
    end: rangeEnd,
    style: styleDiff,
  };

  const resultingSpans: TextStyleSpan[] = [];

  for (const span of existingSpans) {
    if (span.end <= rangeStart || span.start >= rangeEnd) {
      resultingSpans.push(span);
      continue;
    }

    if (span.start >= rangeStart && span.end <= rangeEnd) {
      const remainingStyle = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingStyle[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingStyle).length > 0) {
        resultingSpans.push({
          ...span,
          style: remainingStyle,
        });
      }
      continue;
    }

    if (span.start < rangeStart && span.end > rangeEnd) {
      resultingSpans.push({
        ...span,
        id: `${span.id}-left`,
        end: rangeStart,
      });

      const remainingMiddle = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingMiddle[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingMiddle).length > 0) {
        resultingSpans.push({
          id: `${span.id}-mid`,
          start: rangeStart,
          end: rangeEnd,
          style: remainingMiddle,
        });
      }

      resultingSpans.push({
        ...span,
        id: `${span.id}-right`,
        start: rangeEnd,
      });
      continue;
    }

    if (span.start < rangeStart && span.end > rangeStart) {
      resultingSpans.push({
        ...span,
        end: rangeStart,
      });
      const remainingOverlap = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingOverlap[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingOverlap).length > 0) {
        resultingSpans.push({
          id: `${span.id}-ovl`,
          start: rangeStart,
          end: span.end,
          style: remainingOverlap,
        });
      }
      continue;
    }

    if (span.start < rangeEnd && span.end > rangeEnd) {
      const remainingOverlap = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingOverlap[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingOverlap).length > 0) {
        resultingSpans.push({
          id: `${span.id}-ovr`,
          start: span.start,
          end: rangeEnd,
          style: remainingOverlap,
        });
      }
      resultingSpans.push({
        ...span,
        start: rangeEnd,
      });
      continue;
    }
  }

  resultingSpans.push(newSpan);
  return normalizeSpans(resultingSpans);
}

/**
 * Clears all custom formatting within the exact range [start, end].
 */
export function clearFormattingInRange(
  contentLength: number,
  existingSpans: TextStyleSpan[],
  rangeStart: number,
  rangeEnd: number
): TextStyleSpan[] {
  if (rangeStart >= rangeEnd || rangeStart < 0 || rangeEnd > contentLength) {
    return normalizeSpans(existingSpans);
  }

  const resultingSpans: TextStyleSpan[] = [];

  for (const span of existingSpans) {
    if (span.end <= rangeStart || span.start >= rangeEnd) {
      resultingSpans.push(span);
    } else if (span.start < rangeStart && span.end > rangeEnd) {
      resultingSpans.push({
        ...span,
        id: `${span.id}-l`,
        end: rangeStart,
      });
      resultingSpans.push({
        ...span,
        id: `${span.id}-r`,
        start: rangeEnd,
      });
    } else if (span.start < rangeStart && span.end > rangeStart) {
      resultingSpans.push({
        ...span,
        end: rangeStart,
      });
    } else if (span.start < rangeEnd && span.end > rangeEnd) {
      resultingSpans.push({
        ...span,
        start: rangeEnd,
      });
    }
  }

  return normalizeSpans(resultingSpans);
}

/**
 * Adjusts span indices when text is inserted or deleted at index `changePos`.
 */
export function shiftSpansOnTextChange(
  spans: TextStyleSpan[],
  changePos: number,
  deltaLength: number
): TextStyleSpan[] {
  if (deltaLength === 0 || !spans) return normalizeSpans(spans || []);

  const updated: TextStyleSpan[] = [];

  for (const span of spans) {
    if (deltaLength > 0) {
      if (span.start >= changePos) {
        updated.push({
          ...span,
          start: span.start + deltaLength,
          end: span.end + deltaLength,
        });
      } else if (span.end > changePos) {
        updated.push({
          ...span,
          end: span.end + deltaLength,
        });
      } else {
        updated.push(span);
      }
    } else {
      const deleteEnd = changePos - deltaLength;
      if (span.end <= changePos) {
        updated.push(span);
      } else if (span.start >= deleteEnd) {
        updated.push({
          ...span,
          start: span.start + deltaLength,
          end: span.end + deltaLength,
        });
      } else {
        const newStart = Math.min(span.start, changePos);
        const newEnd = Math.max(newStart, span.end + deltaLength);
        if (newEnd > newStart) {
          updated.push({
            ...span,
            start: newStart,
            end: newEnd,
          });
        }
      }
    }
  }

  return normalizeSpans(updated);
}

