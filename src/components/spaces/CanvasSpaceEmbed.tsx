import { Space } from '../../types';
import { SpaceEmbed } from './SpaceEmbed';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
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
        <Box
          sx={{
            width: '100%',
            height: '100%',
            border: strokeDasharray ? '2px dashed #1976d2' : '2px solid #ccc',
            borderRadius: '8px',
            bgcolor: 'background.surface',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxSizing: 'border-box'
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '8px',
              bgcolor: 'primary.softBg',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TypeIcon size={24} />
          </Box>
          <Typography level="title-md">
            {element.spaceName || 'Space non trovato'}
          </Typography>
          {element.spaceType && (
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {element.spaceType}
            </Typography>
          )}
        </Box>
      </foreignObject>
    );
  }

  const TypeIcon = getTypeIcon(embeddedSpace.type);
  const SpaceIcon = embeddedSpace.icon && (LucideIcons as any)[embeddedSpace.icon] 
    ? (LucideIcons as any)[embeddedSpace.icon] 
    : TypeIcon;

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
      <Box
        sx={{
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
      </Box>
    </foreignObject>
  );
}