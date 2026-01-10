import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 're-resizable';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { GripVertical, Trash2, Edit, ExternalLink } from 'lucide-react';
import { FileElement } from './FileElement';
import { CalendarElement } from './CalendarElement';
import { SpaceEmbed } from './SpaceEmbed';
import { ItemTypes } from './types';
import { Settings } from '../../hooks/useSettings';

interface Widget {
  id: string;
  type: 'text' | 'chart' | 'stats' | 'file' | 'space' | 'calendar';
  title: string;
  content: any;
  w?: number;
  h?: number;
}

interface DashboardWidgetProps {
  widget: Widget;
  index: number;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onEdit?: (id: string) => void;
  onResize?: (id: string, w: number, h: number) => void;
  onUpdate?: (id: string, updates: Partial<Widget>) => void;
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
}

export function DashboardWidget({ widget, index, onDelete, onMove, onEdit, onResize, onUpdate, settings, onUpdateSettings }: DashboardWidgetProps) {
  const ref = useRef<any>(null); // Ref for Resizable (HTMLElement)
  
  // Separate drag handle ref
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // We need to know column width for minWidth, but it's dynamic.
  // Using a fallback or calculating it roughly.
  const colWidthFallback = 80; 

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.WIDGET,
    item: { id: widget.id, index, type: ItemTypes.WIDGET, widget },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.WIDGET,
    hover: (item: { index: number; type: string }) => {
      if (!ref.current || item.type !== ItemTypes.WIDGET) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  // Connect drag to handle, drop to main container
  drag(dragHandleRef);
  drop(ref);
  // Optional: use preview for the whole item, but default HTML5 drag preview might be enough
  // preview(ref); 

  const handleResizeStop = (e: any, direction: any, refNode: HTMLElement, d: { width: number, height: number }) => {
    if (!onResize) return;

    // Get grid container and its dimensions
    const gridContainer = refNode.parentElement;
    if (!gridContainer) return;

    const containerWidth = gridContainer.clientWidth;
    const gap = 8; // Matches gap-2 (0.5rem)
    const rowHeight = 20; // Matches auto-rows-[20px]
    
    // Calculate precise column width
    // totalWidth = 12 * colWidth + 11 * gap
    const colWidth = (containerWidth - (11 * gap)) / 12;
    
    // Calculate new spans based on measured pixels
    // w * colWidth + (w - 1) * gap = measuredWidth
    // w * (colWidth + gap) - gap = measuredWidth
    // w = (measuredWidth + gap) / (colWidth + gap)
    const measuredWidth = refNode.offsetWidth;
    const measuredHeight = refNode.offsetHeight;
    
    const newW = Math.round((measuredWidth + gap) / (colWidth + gap));
    const newH = Math.round((measuredHeight + gap) / (rowHeight + gap));

    // Clamp values to valid ranges
    const clampedW = Math.max(1, Math.min(12, newW));
    const clampedH = Math.max(2, newH);

    onResize(widget.id, clampedW, clampedH);
    
    // Reset inline styles to let Grid take over again
    refNode.style.width = '';
    refNode.style.height = '';
  };

  const renderContent = () => {
    switch (widget.type) {
      case 'stats':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold text-default-900">{widget.content.value}</h2>
            <p className="text-xs font-medium text-success-500 mt-1">
              {widget.content.change}
            </p>
          </div>
        );
      case 'text':
        return (
            <div className="prose prose-sm max-w-none text-default-600 text-xs overflow-auto h-full p-1">
                {widget.content.text || widget.content}
            </div>
        );
      case 'chart':
        return <p className="text-xs text-default-400 italic text-center mt-4">Chart widget coming soon</p>;
      case 'file':
        return (
          <div className="h-full overflow-hidden">
            <FileElement 
              layout={widget.content.layout || 'compact'}
              fileName={widget.content.fileName || widget.title}
              fileType={widget.content.fileType || 'application/octet-stream'}
              fileSize={widget.content.fileSize || 0}
              filePreview={widget.content.filePreview}
              isFolder={widget.content.isFolder}
              files={widget.content.files || []}
              onUpdate={(updates) => {
                if (onUpdate) {
                  onUpdate(widget.id, { 
                    content: { ...widget.content, ...updates },
                    title: updates.fileName || widget.title
                  });
                }
              }}
              isReadOnly={false}
              className="!border-none !bg-transparent !p-0 !shadow-none"
            />
          </div>
        );
      case 'calendar':
        return (
          <div className="h-full w-full overflow-hidden">
             <CalendarElement 
                data={{
                  startDate: widget.content.startDate || new Date().toISOString(),
                  endDate: widget.content.endDate || new Date(Date.now() + 3600000).toISOString(),
                  recurrence: widget.content.recurrence || 'none',
                  notes: widget.content.notes || widget.title,
                  completed: widget.content.completed,
                  attachments: widget.content.attachments,
                  displayMode: 'card'
                }}
                onUpdate={(updates) => {
                  if (onUpdate) {
                     onUpdate(widget.id, { 
                        content: { ...widget.content, ...updates },
                        title: updates.notes ? updates.notes.split('\n')[0] : widget.title
                     });
                  }
                }}
                spacesState={settings?.spaces ? { spaces: settings.spaces } : undefined} // Mock spacesState if needed or pass properly
                isReadOnly={false}
                className="!border-none !shadow-none !p-0 h-full"
             />
          </div>
        );
      case 'space':
        const embeddedSpace = settings?.spaces?.find?.((s: any) => s.id === widget.content.spaceId) || 
                             (widget.content.spaceData ? widget.content.spaceData : null);
        
        return (
          <div className="h-full overflow-hidden flex flex-col bg-default-50/50 rounded-lg border border-default-100 p-1">
            {embeddedSpace ? (
              <SpaceEmbed 
                space={embeddedSpace}
                compact={true}
                onNavigate={(spaceId) => {
                  // If we have a navigation function passed through dashboard props
                  // we could use it here. For now, it's a preview.
                  console.log("Navigating to space from dashboard:", spaceId);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-default-400 gap-2">
                <ExternalLink size={24} className="opacity-20" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Space non trovato</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Resizable
        minWidth={colWidthFallback}
        minHeight={40}
        maxWidth="100%"
        enable={{
            top: false,
            right: true,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: false,
            topLeft: false,
        }}
        onResizeStop={handleResizeStop}
        className={`relative group ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        style={{
            gridColumn: `span ${widget.w || 3}`,
            gridRow: `span ${widget.h || 8}`
        }}
    >
        <div
            ref={ref}
            className={`
                h-full w-full flex flex-col
                bg-white rounded-xl
                border border-default-200
                transition-shadow hover:shadow-sm
                ${isOver ? 'ring-2 ring-primary border-transparent' : ''}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-3 pb-2 select-none">
                <div className="flex items-center gap-2 min-w-0">
                    <div 
                        ref={dragHandleRef}
                        className="cursor-grab active:cursor-grabbing text-[#e5e5e5] hover:text-default-400 transition-colors shrink-0"
                    >
                        <GripVertical size={16} />
                    </div>
                    <span className="text-xs font-semibold text-default-700 truncate">{widget.title}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && widget.type === 'text' && (
                        <button
                            onClick={() => onEdit(widget.id)}
                            className="p-1 text-default-400 hover:text-default-600 rounded hover:bg-default-100"
                        >
                            <Edit size={12} />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(widget.id)}
                        className="p-1 text-default-400 hover:text-danger rounded hover:bg-danger/10"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 px-3 pb-3">
                {renderContent()}
            </div>
            
            {/* Custom Resize Handle Indicator */}
            <div className="absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 6 6" className="w-full h-full fill-default-300">
                    <path d="M6 6L6 0L0 6Z" />
                </svg>
            </div>
        </div>
    </Resizable>
  );
}