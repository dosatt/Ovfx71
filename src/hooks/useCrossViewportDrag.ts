import { useState, useEffect } from 'react';

export type DragMode = 'link' | 'duplicate' | 'move';

interface UseCrossViewportDragReturn {
  dragMode: DragMode;
  showTooltip: boolean;
}

export function useCrossViewportDrag(isDragging: boolean): UseCrossViewportDragReturn {
  const [dragMode, setDragMode] = useState<DragMode>('link');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setShowTooltip(false);
      setDragMode('link');
      return;
    }

    setShowTooltip(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey) {
        // Priorità a shift se entrambi premuti
        setDragMode('move');
      } else if (e.shiftKey) {
        setDragMode('move');
      } else if (e.altKey) {
        setDragMode('duplicate');
      } else {
        setDragMode('link');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ricontrolla lo stato delle chiavi dopo il rilascio
      if (e.shiftKey) {
        setDragMode('move');
      } else if (e.altKey) {
        setDragMode('duplicate');
      } else {
        setDragMode('link');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDragging]);

  return {
    dragMode,
    showTooltip,
  };
}
