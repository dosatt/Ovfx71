import { Block } from '../../types';
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
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid',
            borderColor: '#e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f4f4f5',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            gap: '8px'
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md bg-default-200 flex items-center justify-center"
            >
              <TypeIcon size={18} />
            </div>
            <span className="text-small text-default-400">
              Blocco non trovato
            </span>
          </div>
        </div>
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
      <div
        style={{
          width: '100%',
          height: '100%',
          border: '2px solid',
          borderColor: 'var(--heroui-primary)',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          gap: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Header con icona e info */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0"
          >
            <TypeIcon size={14} />
          </div>
          <span className="text-xs text-default-500 shrink-0">
            da {sourceSpace.title}
          </span>
        </div>

        {/* Contenuto del blocco */}
        <p className="text-sm overflow-hidden text-ellipsis line-clamp-2">
          {displayContent || '(vuoto)'}
        </p>
      </div>
    </foreignObject>
  );
}
