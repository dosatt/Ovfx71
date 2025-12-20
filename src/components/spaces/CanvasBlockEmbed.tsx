import { Block } from '../../types';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import * as LucideIcons from 'lucide-react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List as ListIcon, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Minus, 
  Code,
  AlertCircle,
  Image as ImageIcon,
  File as FileIcon,
  Globe,
  Link2
} from 'lucide-react';

interface CanvasBlockEmbedProps {
  element: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    blockId?: string;
    sourceSpaceId?: string;
    blockType?: string;
    blockContent?: string;
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
}

export function CanvasBlockEmbed({
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
  spacesState
}: CanvasBlockEmbedProps) {
  // Trova lo space e il blocco dai dati
  const sourceSpace = element.sourceSpaceId 
    ? spacesState.getSpace(element.sourceSpaceId)
    : null;

  const embeddedBlock = sourceSpace && element.blockId
    ? sourceSpace.content?.blocks?.find((b: Block) => b.id === element.blockId)
    : null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return Type;
      case 'heading1':
        return Heading1;
      case 'heading2':
        return Heading2;
      case 'heading3':
        return Heading3;
      case 'bulletList':
        return ListIcon;
      case 'numberedList':
        return ListOrdered;
      case 'checkbox':
        return CheckSquare;
      case 'quote':
        return Quote;
      case 'divider':
        return Minus;
      case 'code':
        return Code;
      case 'callout':
        return AlertCircle;
      case 'image':
        return ImageIcon;
      case 'file':
        return FileIcon;
      case 'embed':
        return Globe;
      case 'pageLink':
        return Link2;
      default:
        return Type;
    }
  };

  // Se il blocco non viene trovato, mostra un placeholder
  if (!embeddedBlock || !sourceSpace) {
    const TypeIcon = getTypeIcon(element.blockType || 'text');
    
    return (
      <foreignObject
        data-element-id={element.id}
        x={element.x}
        y={element.y}
        width={element.width || 400}
        height={element.height || 100}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        style={{ cursor, opacity }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            border: '2px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            bgcolor: 'background.level1',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: 'background.level2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TypeIcon size={18} />
            </Box>
            <Typography level="title-sm" sx={{ color: 'text.tertiary' }}>
              Blocco non trovato
            </Typography>
          </Box>
        </Box>
      </foreignObject>
    );
  }

  const TypeIcon = getTypeIcon(embeddedBlock.type);

  // Tronca il contenuto se è troppo lungo
  const maxLength = 100;
  const displayContent = embeddedBlock.content?.length > maxLength 
    ? embeddedBlock.content.substring(0, maxLength) + '...' 
    : embeddedBlock.content;

  return (
    <foreignObject
      data-element-id={element.id}
      x={element.x}
      y={element.y}
      width={element.width || 400}
      height={element.height || 100}
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
          border: '2px solid',
          borderColor: 'primary.500',
          borderRadius: '8px',
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'column',
          p: 1.5,
          gap: 1,
          overflow: 'hidden'
        }}
      >
        {/* Header con icona e info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              bgcolor: 'primary.softBg',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <TypeIcon size={14} />
          </Box>
          <Typography level="body-xs" sx={{ color: 'text.secondary', flexShrink: 0 }}>
            da {sourceSpace.title}
          </Typography>
        </Box>

        {/* Contenuto del blocco */}
        <Typography 
          level="body-sm" 
          sx={{ 
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayContent || '(vuoto)'}
        </Typography>
      </Box>
    </foreignObject>
  );
}