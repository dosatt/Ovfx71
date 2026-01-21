import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export const SortableListItem = ({ event, index, moveItem, onSelect, isManual, isSelected, onContextMenu }: { event: any, index: number, moveItem: (d: number, h: number) => void, onSelect: any, isManual: boolean, isSelected: boolean, onContextMenu: (e: React.MouseEvent) => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
        accept: 'CALENDAR_EVENT',
        hover(item: any, monitor) {
            if (!ref.current || !isManual) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === undefined || dragIndex === hoverIndex) return;

            moveItem(dragIndex, hoverIndex);
            item.index = hoverIndex;
        }
    });

    const [{ isDragging }, drag] = useDrag({
        type: 'CALENDAR_EVENT',
        item: {
            id: event.id,
            blockId: event.id,
            spaceId: event.sourceSpaceId,
            type: 'CALENDAR_EVENT',
            title: event.metadata?.title || 'Untitled',
            content: event.metadata?.notes,
            start: event.start,
            end: event.end,
            sourceSpaceTitle: event.sourceSpaceTitle,
            index
        },
        collect: (m) => ({ isDragging: m.isDragging() })
    });

    drag(drop(ref));

    return (
        <div ref={ref} className={`calendar-event-item p-2 ${isDragging ? 'opacity-50' : ''}`} style={{ cursor: isManual ? 'grab' : 'default' }} data-event-id={event.id}>
            <div
                className={`p-3 rounded-lg border bg-white transition-all cursor-pointer group shadow-sm flex flex-col gap-2 h-full
              ${isSelected ? 'border-primary ring-2 ring-primary/30 z-10 bg-primary/5' : 'border-divider hover:border-primary/50 hover:bg-default-50'}
            `}
                onClick={onSelect}
                onContextMenu={onContextMenu}
            >
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-default-900 leading-tight">{event.metadata?.title || 'Untitled'}</h3>
                    {event.sourceSpaceTitle && (
                        <span className="text-[9px] uppercase font-bold bg-default-100 text-default-500 px-1.5 py-0.5 rounded shrink-0 max-w-[80px] truncate">
                            {event.sourceSpaceTitle}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-default-500">
                    <Clock size={12} className="shrink-0" />
                    <span>{format(new Date(event.start), 'PPP p')}</span>
                </div>
                {event.metadata?.notes && (
                    <p className="text-xs text-default-600 bg-default-50/50 p-1.5 rounded border border-transparent group-hover:border-default-200/50 line-clamp-3">
                        {event.metadata.notes}
                    </p>
                )}
            </div>
        </div>
    );
};
