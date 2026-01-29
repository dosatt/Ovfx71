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
import { FileElement } from './FileElement';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { CalendarElement } from './CalendarElement';
import { Settings } from '../../hooks/useSettings';

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
    rotation?: number;
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
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
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
  spacesState,
  settings,
  onUpdateSettings
}: CanvasBlockEmbedProps) {
  // Trova lo space e il blocco dai dati
  const sourceSpace = element.sourceSpaceId
    ? spacesState.getSpace(element.sourceSpaceId)
    : null;

  const embeddedBlock = sourceSpace && element.blockId
    ? sourceSpace.content?.blocks?.find((b: Block) => b.id === element.blockId)
    : null;

  const updateEmbeddedBlock = (updates: any) => {
    if (!sourceSpace || !embeddedBlock) return;

    const updatedBlocks = sourceSpace.content.blocks.map((b: Block) => {
      if (b.id === embeddedBlock.id) {
        return {
          ...b,
          metadata: {
            ...b.metadata,
            ...updates
          }
        };
      }
      return b;
    });

    spacesState.updateSpace(sourceSpace.id, {
      content: {
        ...sourceSpace.content,
        blocks: updatedBlocks
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return Type;
      case 'calendar':
        return LucideIcons.Calendar;
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

  // Se il blocco è un'immagine, mostra l'immagine direttamente
  if (embeddedBlock.type === 'image') {
    const width = element.width || 400;
    const height = element.height || 300;
    const rotation = element.rotation || 0;
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;

    return (
      <g
        data-element-id={element.id}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor, opacity }}
      >
        {/* Shadow Layer - Using a simple rect with CSS shadow because SVG filters can be finicky */}
        <foreignObject
          x={element.x - 40}
          y={element.y - 40}
          width={width + 80}
          height={height + 80}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            style={{
              width: width,
              height: height,
              margin: '40px',
              borderRadius: '12px',
              backgroundColor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.3)',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
        </foreignObject>

        {/* Image Layer */}
        <foreignObject
          x={element.x}
          y={element.y}
          width={width}
          height={height}
          style={{ overflow: 'visible' }}
          transform={`rotate(${rotation}, ${centerX}, ${centerY})`}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid white',
              backgroundColor: '#ffffff',
              padding: '4px'
            }}
          >
            <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
              <ImageWithFallback
                src={embeddedBlock.content}
                alt="Embedded"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  // Se il blocco è un file, usa FileElement per la stessa preview
  if (embeddedBlock.type === 'file') {
    const layout = embeddedBlock.metadata?.layout || 'bookmark';
    const isCollection = ['grid', 'featured', 'collection'].includes(layout);

    // Dimensione dinamica basata sul layout se non specificata
    const defaultWidth = isCollection ? 600 : (layout === 'square' ? 200 : 350);
    const defaultHeight = isCollection ? 500 : (layout === 'square' ? 200 : 80);

    return (
      <foreignObject
        data-element-id={element.id}
        x={element.x}
        y={element.y}
        width={element.width || defaultWidth}
        height={element.height || defaultHeight}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor, opacity, overflow: 'visible' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `rotate(${element.rotation || 0}deg)`,
            transformOrigin: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <FileElement
              layout={layout}
              fileName={embeddedBlock.metadata?.fileName || embeddedBlock.content || 'Nuovo File'}
              fileSize={embeddedBlock.metadata?.fileSize || 0}
              fileType={embeddedBlock.metadata?.fileType || 'application/octet-stream'}
              filePreview={embeddedBlock.metadata?.filePreview}
              files={embeddedBlock.metadata?.files}
              isReadOnly={false}
              onUpdate={updateEmbeddedBlock}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
            />
          </div>
        </div>
      </foreignObject>
    );
  }

  const renderContent = () => {
    switch (embeddedBlock.type) {
      case 'heading1':
        return <h1 className="text-4xl font-bold m-0 leading-tight">{embeddedBlock.content}</h1>;
      case 'heading2':
        return <h2 className="text-3xl font-bold m-0 leading-tight">{embeddedBlock.content}</h2>;
      case 'heading3':
        return <h3 className="text-2xl font-bold m-0 leading-tight">{embeddedBlock.content}</h3>;
      case 'heading4':
        return <h4 className="text-xl font-bold m-0 leading-tight">{embeddedBlock.content}</h4>;
      case 'bulletList':
        return (
          <div className="flex gap-2 items-start">
            <span className="shrink-0">•</span>
            <span className="text-lg">{embeddedBlock.content}</span>
          </div>
        );
      case 'numberedList':
        return (
          <div className="flex gap-2 items-start">
            <span className="shrink-0">1.</span>
            <span className="text-lg">{embeddedBlock.content}</span>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex gap-2 items-center">
            <div className={`w-5 h-5 rounded border-2 shrink-0 ${embeddedBlock.checked ? 'bg-primary border-primary flex items-center justify-center' : 'border-default-300'}`}>
              {embeddedBlock.checked && <LucideIcons.Check size={14} className="text-white" />}
            </div>
            <span className={`text-lg ${embeddedBlock.checked ? 'line-through text-default-400' : ''}`}>
              {embeddedBlock.content}
            </span>
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-primary pl-4 py-1 italic text-xl text-default-600">
            {embeddedBlock.content}
          </div>
        );
      case 'code':
        return (
          <pre className="bg-default-100 p-4 rounded-lg font-mono text-sm overflow-hidden whitespace-pre-wrap w-full">
            {embeddedBlock.content}
          </pre>
        );
      case 'callout':
        return (
          <div className={`p-4 rounded-xl flex gap-3 items-start bg-default-100 border border-default-200 w-full`}>
            <LucideIcons.Info size={20} className="text-primary shrink-0 mt-1" />
            <div className="text-lg">{embeddedBlock.content}</div>
          </div>
        );
      case 'calendar':
        return (
          <div className="w-full">
            <CalendarElement
              data={{
                startDate: embeddedBlock.metadata?.startDate || new Date().toISOString(),
                endDate: embeddedBlock.metadata?.endDate || '',
                recurrence: embeddedBlock.metadata?.recurrence || 'none',
                notes: embeddedBlock.metadata?.notes || embeddedBlock.content || '',
                completed: embeddedBlock.metadata?.completed || embeddedBlock.checked || false,
                attachments: embeddedBlock.metadata?.attachments || [],
                displayMode: embeddedBlock.metadata?.displayMode || 'card'
              }}
              onUpdate={updateEmbeddedBlock}
              isReadOnly={true}
              spacesState={spacesState}
            />
          </div>
        );
      default:
        return <p className="text-lg m-0 leading-normal">{embeddedBlock.content}</p>;
    }
  };

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
      style={{ cursor, opacity, overflow: 'visible' }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${element.rotation || 0}deg)`,
          transformOrigin: 'center',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div
          style={{ pointerEvents: 'auto' }}
          className="hover:ring-2 hover:ring-primary/30 rounded-lg transition-all p-2"
        >
          {renderContent()}
          <div className="mt-1 flex items-center gap-1 text-[10px] text-default-400 font-medium uppercase tracking-wider">
            <LucideIcons.Link size={10} />
            da {sourceSpace.title}
          </div>
        </div>
      </div>
    </foreignObject>
  );
}