import { useState, useRef, useEffect } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import { Viewport } from '../types';
import { ViewportContent } from './ViewportContent';
import type { Settings } from '../hooks/useSettings';

interface ViewportRendererProps {
  viewport: Viewport;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  getBackgroundStyle: () => any;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
}

export function ViewportRenderer({ viewport, spacesState, viewportsState, settings, getBackgroundStyle, brokenLinks, brokenLinksVersion }: ViewportRendererProps) {
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
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: isHorizontal ? 'column' : 'row',
        width: '100%',
        height: '100%',
        gap: '2px',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          width: isHorizontal ? '100%' : `calc(${size}% - 1px)`,
          height: isHorizontal ? `calc(${size}% - 1px)` : '100%',
          ...(isHorizontal ? { minHeight: '200px' } : { minWidth: '280px' }),
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <ViewportRenderer
          viewport={left}
          spacesState={spacesState}
          viewportsState={viewportsState}
          settings={settings}
          getBackgroundStyle={getBackgroundStyle}
          brokenLinks={brokenLinks}
          brokenLinksVersion={brokenLinksVersion}
        />
      </Box>

      {/* Resize handle in the gap */}
      <Box
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        sx={{
          position: 'relative',
          width: isHorizontal ? '100%' : '2px',
          height: isHorizontal ? '2px' : '100%',
          flexShrink: 0,
          cursor: isHorizontal ? 'row-resize' : 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}
      >
        <Box
          sx={{
            width: isHorizontal ? '30px' : '2px',
            height: isHorizontal ? '2px' : '30px',
            bgcolor: isDragging || isHovering ? 'primary.solidBg' : 'divider',
            borderRadius: '2px',
            transition: 'all 0.2s',
            pointerEvents: 'none',
            '&:hover': {
              bgcolor: 'primary.solidBg'
            }
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          ...(isHorizontal ? { minHeight: '200px' } : { minWidth: '280px' }),
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <ViewportRenderer
          viewport={right}
          spacesState={spacesState}
          viewportsState={viewportsState}
          settings={settings}
          getBackgroundStyle={getBackgroundStyle}
          brokenLinks={brokenLinks}
          brokenLinksVersion={brokenLinksVersion}
        />
      </Box>
    </Box>
  );
}