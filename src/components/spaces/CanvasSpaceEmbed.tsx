import { Space } from '../../types';
import { SpaceEmbed } from './SpaceEmbed';
import * as LucideIcons from 'lucide-react';
import { FileText, LayoutDashboard, Database, Palette } from 'lucide-react';

interface CanvasSpaceEmbedProps {
  element: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    spaceId?: string;
    spaceName?: string;
    spaceType?: string;
  };
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  cursor: string;
  opacity: number;
  strokeDasharray?: string;
  spacesState: any;
  onNavigate: (spaceId: string) => void;
}

export function CanvasSpaceEmbed({
  element,
  onClick,
  onDoubleClick,
  onContextMenu,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  cursor,
  opacity,
  strokeDasharray,
  spacesState,
  onNavigate
}: CanvasSpaceEmbedProps) {
  // Trova lo space completo dai dati
  const embeddedSpace = element.spaceId 
    ? spacesState.getSpace(element.spaceId)
    : null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return FileText;
      case 'canvas':
        return Palette;
      case 'database':
        return Database;
      case 'dashboard':
        return LayoutDashboard;
      default:
        return FileText;
    }
  };

  // Se non troviamo lo space, mostra un placeholder con le info che abbiamo
  if (!embeddedSpace) {
    const TypeIcon = element.spaceType ? getTypeIcon(element.spaceType) : FileText;
    
    return (
      <foreignObject
        x={element.x}
        y={element.y}
        width={element.width || 400}
        height={element.height || 300}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor, opacity }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: strokeDasharray ? '2px dashed #1976d2' : '2px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              backgroundColor: 'var(--heroui-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TypeIcon size={24} />
          </div>
          <h3 className="text-lg font-semibold">
            {element.spaceName || 'Space non trovato'}
          </h3>
          {element.spaceType && (
            <p className="text-xs text-default-400">
              {element.spaceType}
            </p>
          )}
        </div>
      </foreignObject>
    );
  }

  return (
    <foreignObject
      data-element-id={element.id}
      x={element.x}
      y={element.y}
      width={element.width || 400}
      height={element.height || 300}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor, opacity }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          border: strokeDasharray ? '2px dashed #1976d2' : 'none',
          borderRadius: '8px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <SpaceEmbed
          space={embeddedSpace}
          onNavigate={onNavigate}
          compact={false}
        />
      </div>
    </foreignObject>
  );
}
