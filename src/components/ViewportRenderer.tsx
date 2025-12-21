import { useState, useRef, useEffect } from 'react';
import { Viewport } from '../types';
import { ViewportContent } from './ViewportContent';
import type { Settings } from '../hooks/useSettings';

interface ViewportRendererProps {
  viewport: Viewport;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onResetSettings: () => void;
  getBackgroundStyle: () => any;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
}

export function ViewportRenderer({ 
  viewport, 
  spacesState, 
  viewportsState, 
  settings, 
  onUpdateSettings,
  onResetSettings,
  getBackgroundStyle, 
  brokenLinks, 
  brokenLinksVersion 
}: ViewportRendererProps) {
  // Always call all hooks at the top level
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState(viewport.size || 50);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Always run this effect
  useEffect(() => {
    if (viewport.size !== undefined) {
      setSize(viewport.size);
    }
  }, [viewport.size]);

  // Always set up the drag effect, but conditionally execute its logic
  useEffect(() => {
    if (!isDragging || !viewport.children) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !viewport.children) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSize: number;
      const isHorizontal = viewport.split === 'horizontal';

      if (isHorizontal) {
        const offsetY = e.clientY - rect.top;
        const newSizePercent = (offsetY / rect.height) * 100;
        
        // Calcola le dimensioni in pixel per verificare i limiti
        const topHeightPx = (newSizePercent / 100) * rect.height;
        const bottomHeightPx = rect.height - topHeightPx;
        
        // Impedisci che una viewport sia più piccola di 400px in altezza
        const minHeightPx = 400;
        if (topHeightPx < minHeightPx) {
          newSize = (minHeightPx / rect.height) * 100;
        } else if (bottomHeightPx < minHeightPx) {
          newSize = ((rect.height - minHeightPx) / rect.height) * 100;
        } else {
          newSize = newSizePercent;
        }
      } else {
        const offsetX = e.clientX - rect.left;
        const newSizePercent = (offsetX / rect.width) * 100;
        
        // Calcola le dimensioni in pixel per verificare i limiti
        const leftWidthPx = (newSizePercent / 100) * rect.width;
        const rightWidthPx = rect.width - leftWidthPx;
        
        // Impedisci che una viewport sia più piccola di 360px in larghezza
        const minWidthPx = 360;
        if (leftWidthPx < minWidthPx) {
          newSize = (minWidthPx / rect.width) * 100;
        } else if (rightWidthPx < minWidthPx) {
          newSize = ((rect.width - minWidthPx) / rect.width) * 100;
        } else {
          newSize = newSizePercent;
        }
      }

      newSize = Math.max(20, Math.min(80, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (viewport.children) {
        const [left] = viewport.children;
        viewportsState.resizeViewport(left.id, size);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, viewport.children, viewport.split, size, viewportsState]);

  // After all hooks, do conditional rendering
  if (!viewport.children) {
    // Leaf viewport - render content
    return (
      <ViewportContent
        viewport={viewport}
        spacesState={spacesState}
        viewportsState={viewportsState}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onResetSettings={onResetSettings}
        getBackgroundStyle={getBackgroundStyle}
        brokenLinks={brokenLinks}
        brokenLinksVersion={brokenLinksVersion}
      />
    );
  }

  // Split viewport - render children with resizable divider
  const [left, right] = viewport.children;
  const isHorizontal = viewport.split === 'horizontal';

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className={`flex w-full h-full gap-[2px] relative ${isHorizontal ? 'flex-col' : 'flex-row'}`}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: isHorizontal ? '100%' : `calc(${size}% - 1px)`,
          height: isHorizontal ? `calc(${size}% - 1px)` : '100%',
          minHeight: isHorizontal ? '200px' : undefined,
          minWidth: !isHorizontal ? '280px' : undefined
        }}
      >
        <ViewportRenderer
          viewport={left}
          spacesState={spacesState}
          viewportsState={viewportsState}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onResetSettings={onResetSettings}
          getBackgroundStyle={getBackgroundStyle}
          brokenLinks={brokenLinks}
          brokenLinksVersion={brokenLinksVersion}
        />
      </div>

      {/* Resize handle in the gap */}
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`relative flex items-center justify-center shrink-0 z-[100] ${isHorizontal ? 'w-full h-[2px] cursor-row-resize' : 'w-[2px] h-full cursor-col-resize'}`}
      >
        <div
          className={`transition-all duration-200 pointer-events-none rounded-[2px] ${isHorizontal ? 'w-[30px] h-[2px]' : 'w-[2px] h-[30px]'} ${isDragging || isHovering ? 'bg-primary' : 'bg-divider'}`}
        />
      </div>

      <div
        className="flex-1 relative overflow-hidden"
        style={{
          minHeight: isHorizontal ? '200px' : undefined,
          minWidth: !isHorizontal ? '280px' : undefined
        }}
      >
        <ViewportRenderer
          viewport={right}
          spacesState={spacesState}
          viewportsState={viewportsState}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onResetSettings={onResetSettings}
          getBackgroundStyle={getBackgroundStyle}
          brokenLinks={brokenLinks}
          brokenLinksVersion={brokenLinksVersion}
        />
      </div>
    </div>
  );
}
