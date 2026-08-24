import { useState, useEffect } from 'react';

export interface VisualViewportState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  viewportWidth: number;
  offsetTop: number;
}

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        isKeyboardOpen: false,
        keyboardHeight: 0,
        viewportHeight: 800,
        viewportWidth: 390,
        offsetTop: 0,
      };
    }

    const vv = window.visualViewport;
    const initialHeight = vv ? vv.height : window.innerHeight;
    const initialWidth = vv ? vv.width : window.innerWidth;
    return {
      isKeyboardOpen: false,
      keyboardHeight: 0,
      viewportHeight: initialHeight,
      viewportWidth: initialWidth,
      offsetTop: vv ? vv.offsetTop : 0,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const handleResizeOrScroll = () => {
      const winHeight = window.innerHeight;
      const currentHeight = vv ? vv.height : window.innerHeight;
      const currentWidth = vv ? vv.width : window.innerWidth;
      const offsetTop = vv ? vv.offsetTop : 0;

      // When an Android soft keyboard opens, visualViewport.height shrinks by > 150px
      const heightDiff = winHeight - currentHeight;
      const isKeyboardOpen = heightDiff > 150;
      const keyboardHeight = isKeyboardOpen ? Math.max(0, heightDiff) : 0;

      setState({
        isKeyboardOpen,
        keyboardHeight,
        viewportHeight: currentHeight,
        viewportWidth: currentWidth,
        offsetTop,
      });
    };

    if (vv) {
      vv.addEventListener('resize', handleResizeOrScroll);
      vv.addEventListener('scroll', handleResizeOrScroll);
    }
    window.addEventListener('resize', handleResizeOrScroll);

    handleResizeOrScroll();

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleResizeOrScroll);
        vv.removeEventListener('scroll', handleResizeOrScroll);
      }
      window.removeEventListener('resize', handleResizeOrScroll);
    };
  }, []);

  return state;
}
