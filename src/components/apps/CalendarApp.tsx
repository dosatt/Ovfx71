import { useState, useMemo, useRef, useEffect, useLayoutEffect, memo, useCallback } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
  startOfDay,
  setHours,
  setMinutes,
  differenceInMinutes,
  addMinutes,
  addWeeks,
  subWeeks,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isValid,
  differenceInCalendarDays,
  endOfDay,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useDisclosure, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Popover, PopoverTrigger, PopoverContent, Textarea, Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  Search,
  Settings,
  Maximize2,
  Minimize2,
  Trash2,
  GripVertical,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeekShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type CalendarView = 'month' | 'week' | 'day' | 'year' | 'timeline';

interface CalendarAppProps {
  spacesState: any;
  viewportsState: any;
}

interface DraggableEventProps {
  event: any;
  onUpdate: (id: string, updates: any) => void;
  onNavigate: (spaceId: string, title: string) => void;
  onDragEnd?: () => void;
  onHoverEvent: (id: string | null) => void;
  isHovered: boolean;
}

interface DraggableMultiDayEventProps extends Omit<DraggableEventProps, 'onNavigate'> {
  startCol: number;
  colSpan: number;
  row: number;
  isStart: boolean;
  isEnd: boolean;
  onHoverDateChange?: (date: Date | null) => void;
}

function DraggableCalendarEvent({ event, onUpdate, onNavigate, onDragEnd, onHoverEvent, isHovered }: DraggableEventProps) {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'CALENDAR_EVENT',
    item: {
      id: event.id,
      blockId: event.id,
      spaceId: event.sourceSpaceId,
      type: 'CALENDAR_EVENT',
      title: event.metadata?.title || 'Senza titolo',
      content: event.metadata?.notes,
      start: event.start,
      end: event.end,
      sourceSpaceTitle: event.sourceSpaceTitle
    },
    end: (item, monitor) => {
      onDragEnd?.();
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [event, onDragEnd]);

  // Suppress native preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Use a stable ref callback or direct assignment if possible. 
  // Since drag is a function from useDrag, we can pass it directly if we don't need to chain.
  // However, older react-dnd might need the function call. 
  // Standard React 19 / Modern Dnd: ref={drag} works.

  const handleResize = (e: React.MouseEvent, days: number) => {
    e.stopPropagation();
    e.preventDefault();
    const currentEnd = event.end ? new Date(event.end) : addDays(new Date(event.start), 1);
    const newEnd = addDays(currentEnd, days);

    // Ensure end date is not before start date
    if (newEnd > event.start) {
      onUpdate(event.id, { endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm") });
    }
  };

  const handleResizeLeft = (e: React.MouseEvent, days: number) => {
    e.stopPropagation();
    e.preventDefault();
    const currentStart = new Date(event.start);
    const newStart = addDays(currentStart, days);

    // Ensure start date is not after end date
    const currentEnd = event.end ? new Date(event.end) : addDays(new Date(event.start), 1);
    if (newStart < currentEnd) {
      onUpdate(event.id, { startDate: format(newStart, "yyyy-MM-dd'T'HH:mm") });
    }
  };

  const setDragRef = useCallback((el: HTMLDivElement | null) => {
    drag(el);
  }, [drag]);

  return (
    <div
      ref={setDragRef}
      className={`
        text-[10px] p-1.5 rounded bg-primary/10 text-primary-700 truncate border-l-2 border-primary 
        hover:bg-primary/20 transition-all cursor-grab active:cursor-grabbing
        flex items-center gap-1 group relative h-7 select-none calendar-event-item
        ${isHovered ? 'ring-2 ring-primary/50 bg-primary/20 shadow-md' : ''}
        ${isDragging ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}
      `}
      onMouseEnter={() => onHoverEvent(event.id)}
      onMouseLeave={() => onHoverEvent(null)}
      title={`${event.metadata?.title || 'Event'}`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Left Resizer */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-primary/30 flex items-center justify-center rounded-l z-20"
        onMouseDown={(e) => handleResizeLeft(e, -1)}
        title="1 day earlier"
      >
        <div className="w-0.5 h-3 bg-primary/50 rounded-full" />
      </div>

      <GripVertical size={10} className="opacity-0 group-hover:opacity-40 shrink-0 mx-1" />
      <span className="truncate flex-1">{event.metadata?.title || 'Untitled'}</span>

      {/* Right Resizer */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-primary/30 flex items-center justify-center rounded-r z-20"
        onMouseDown={(e) => handleResize(e, 1)}
        title="1 day later"
      >
        <div className="w-0.5 h-3 bg-primary/50 rounded-full" />
      </div>
    </div>
  );
}

interface DraggableMultiDayEventProps extends Omit<DraggableEventProps, 'onNavigate'> {
  startCol: number;
  colSpan: number;
  row: number;
  isStart: boolean;
  isEnd: boolean;
  onHoverDateChange?: (date: Date | null) => void;
  // Use boolean to avoid re-renders on every pixel move of resize
  isResizing: boolean;
  onActiveResizeChange: (resize: { id: string, direction: 'left' | 'right', offset: number } | null) => void;
  isSelected: boolean;
  onSelect: (id: string, anchor: { x: number; y: number }) => void;
  eventHeight?: number;
  topOffset?: number;
  onHoverEvent: (id: string | null) => void;
  isHovered: boolean;
}

const DraggableMultiDayEvent = memo(({
  event,
  onUpdate,
  onHoverDateChange,
  isResizing,
  onActiveResizeChange,
  startCol,
  colSpan,
  row,
  isStart,
  isEnd,
  isSelected,
  onSelect,
  onDragEnd,
  eventHeight = 24,
  topOffset = 26,
  onHoverEvent,
  isHovered
}: DraggableMultiDayEventProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
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
      sourceSpaceTitle: event.sourceSpaceTitle
    },
    canDrag: !isResizing,
    end: (item, monitor) => {
      onDragEnd?.();
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [event, isResizing, onDragEnd]);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const handleMouseDownResize = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    onActiveResizeChange({ id: event.id, direction, offset: 0 });

    const parentGrid = containerRef.current?.closest('.calendar-grid-container') || document.querySelector('.calendar-grid-container');
    if (!parentGrid) return;

    const gridRect = parentGrid.getBoundingClientRect();
    const initialDayWidth = gridRect.width / 7;
    const weekRows = Array.from(parentGrid.querySelectorAll('.calendar-week-row')) as HTMLElement[];

    const getCellIndexFromCoords = (clientX: number, clientY: number) => {
      const relativeX = clientX - gridRect.left;
      const relativeY = clientY - gridRect.top + (parentGrid as HTMLElement).scrollTop;
      const col = Math.floor(Math.max(0, Math.min(gridRect.width - 1, relativeX)) / initialDayWidth);
      let row = 0;
      let accumulatedHeight = 0;
      for (let i = 0; i < weekRows.length; i++) {
        const h = weekRows[i].offsetHeight;
        if (relativeY < accumulatedHeight + h) {
          row = i;
          break;
        }
        accumulatedHeight += h;
        row = i;
      }
      return col + (row * 7);
    };

    const initialCellIndex = getCellIndexFromCoords(e.clientX, e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentCellIndex = getCellIndexFromCoords(moveEvent.clientX, moveEvent.clientY);
      let newOffset = currentCellIndex - initialCellIndex;
      const baseDate = direction === 'left' ? new Date(event.start) : (event.end ? new Date(event.end) : addDays(new Date(event.start), 1));
      const targetDate = addDays(baseDate, newOffset);
      onHoverDateChange?.(targetDate);
      onActiveResizeChange({ id: event.id, direction, offset: newOffset });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      onHoverDateChange?.(null);
      const currentCellIndex = getCellIndexFromCoords(upEvent.clientX, upEvent.clientY);
      let finalOffset = currentCellIndex - initialCellIndex;
      const initialStart = new Date(event.start);
      const initialEnd = event.end ? new Date(event.end) : addDays(initialStart, 1);

      if (direction === 'left') {
        const potentialStart = addDays(initialStart, finalOffset);
        if (potentialStart > initialEnd) {
          onUpdate(event.id, { startDate: format(initialEnd, "yyyy-MM-dd'T'HH:mm"), endDate: format(potentialStart, "yyyy-MM-dd'T'HH:mm") });
        } else {
          onUpdate(event.id, { startDate: format(potentialStart, "yyyy-MM-dd'T'HH:mm") });
        }
      } else {
        const potentialEnd = addDays(initialEnd, finalOffset);
        if (potentialEnd < initialStart) {
          onUpdate(event.id, { startDate: format(potentialEnd, "yyyy-MM-dd'T'HH:mm"), endDate: format(initialStart, "yyyy-MM-dd'T'HH:mm") });
        } else {
          onUpdate(event.id, { endDate: format(potentialEnd, "yyyy-MM-dd'T'HH:mm") });
        }
      }
      onActiveResizeChange(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    drag(node);
    if (containerRef) {
      (containerRef as any).current = node;
    }
  }, [drag]);

  const eventContent = (
    <div
      ref={setRefs}
      style={{
        left: `calc(${(Math.max(0, startCol) / 7) * 100}% + 2px)`,
        width: `calc(${(colSpan / 7) * 100}% - 4px)`,
        top: `${topOffset + row * eventHeight}px`,
        height: `${eventHeight}px`,
        position: 'absolute',
        zIndex: isResizing || isSelected ? 100 : 20,
        transition: isResizing ? 'none' : 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'hidden',
        opacity: isResizing ? 0.05 : 1,
      }}
      className={`
        text-[10px] px-1.5 rounded-sm truncate select-none shadow-sm
        flex items-center gap-1 group calendar-event-item
        ${isSelected ? 'ring-2 ring-primary bg-primary/30 text-primary-900 z-[110]' : (isResizing ? 'bg-primary/5 ring-1 ring-primary/10' : 'bg-primary/15 text-primary-700 hover:bg-primary/25')}
        ${isHovered && !isSelected && !isResizing ? 'ring-2 ring-primary/50 bg-primary/20' : ''}
        ${isStart ? 'rounded-l border-l-2 border-primary' : ''}
        ${isEnd ? 'rounded-r' : ''}
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
      onMouseEnter={() => onHoverEvent(event.id)}
      onMouseLeave={() => onHoverEvent(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event.id, { x: e.clientX, y: e.clientY });
      }}
    >
      {isResizing && isStart && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary-800 text-white text-[9px] px-2 py-1 rounded shadow-lg font-bold whitespace-nowrap z-[100] border border-primary-600">
          Resizing...
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary-800 rotate-45 border-r border-b border-primary-600" />
        </div>
      )}
      {isStart && eventHeight > 12 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-primary/40 flex items-center justify-center rounded-l z-30 transition-opacity"
          onMouseDown={(e) => handleMouseDownResize(e, 'left')}
        >
          <div className="w-1 h-3 bg-white rounded-full shadow-sm" />
        </div>
      )}
      {isStart && eventHeight > 16 && <GripVertical size={10} className="opacity-0 group-hover:opacity-40 shrink-0" />}
      {eventHeight > 10 && <span className="truncate flex-1 font-medium">{event.metadata?.title || 'Untitled'}</span>}
      {isEnd && eventHeight > 12 && (
        <div
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-primary/40 flex items-center justify-center rounded-r z-30 transition-opacity"
          onMouseDown={(e) => handleMouseDownResize(e, 'right')}
        >
          <div className="w-1 h-3 bg-white rounded-full shadow-sm" />
        </div>
      )}
    </div>
  );

  return eventContent;
});

interface CalendarDayCellProps {
  day: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  isSelected: boolean | null;
  dayEvents: any[];
  onStartSelection: (date: Date) => void;
  onUpdateSelection: (date: Date) => void;
  onUpdateEvent: (eventId: string, blockId: string, spaceId: string, updates: any) => void;
  onNavigate: (sid: string, title: string) => void;
  allEvents: any[];
  renderEvents?: boolean;
  onDragEnter?: (date: Date, item: any) => void;
  onDragLeave?: () => void;
}

const CalendarDayCell = memo(({
  day,
  isToday,
  isCurrentMonth,
  isSelected,
  dayEvents,
  onStartSelection,
  onUpdateSelection,
  onUpdateEvent,
  onNavigate,
  allEvents,
  renderEvents = true,
  onDragEnter,
  onDragLeave
}: CalendarDayCellProps) => {
  const [{ isOver, draggedItem }, drop] = useDrop(() => ({
    accept: 'CALENDAR_EVENT',
    drop: (item: any) => {
      onDragLeave?.(); // Clear ghost on drop
      const event = allEvents.find(e => e.id === item.id);
      if (!event) return;

      const durationMs = (event.end ? new Date(event.end).getTime() : new Date(event.start).getTime() + 3600000) - new Date(event.start).getTime();
      const newStart = new Date(day);
      newStart.setHours(new Date(event.start).getHours(), new Date(event.start).getMinutes());
      const newEnd = new Date(newStart.getTime() + durationMs);

      onUpdateEvent(item.id, item.id, item.spaceId, {
        startDate: format(newStart, "yyyy-MM-dd'T'HH:mm"),
        endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm")
      });
    },
    hover: (item: any) => {
      onDragEnter?.(day, item);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      draggedItem: monitor.getItem(),
    }),
  }), [day, allEvents, onUpdateEvent, onDragEnter, onDragLeave]);

  const setDropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  return (
    <div
      ref={setDropRef}
      className={`
        min-h-[120px] h-full p-1.5 flex flex-col gap-1 transition-colors relative cursor-pointer
        ${isCurrentMonth ? 'bg-white' : 'bg-default-50/50 text-default-400'}
        ${isToday ? 'bg-primary/5' : ''}
      `}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        // Don't start cell selection if we're clicking an event or resizing
        if ((e.target as HTMLElement).closest('.calendar-event-item')) return;

        const dragDate = new Date(day);
        dragDate.setHours(9, 0, 0, 0);
        onStartSelection(dragDate);
      }}
      onMouseEnter={() => {
        const dragDate = new Date(day);
        dragDate.setHours(10, 0, 0, 0);
        onUpdateSelection(dragDate);
      }}
    >
      <div className="flex justify-end items-center gap-1.5 h-6 px-1">
        {day.getDate() === 1 && (
          <span
            className="absolute left-2 top-1.5 inline-flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl z-20 px-4 h-6 border-none"
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1'
            }}
          >
            {format(day, 'MMMM', { locale: enUS })}
          </span>
        )}
        <span className={`
          text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all
          ${isToday
            ? 'bg-primary text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] scale-110'
            : isCurrentMonth ? 'text-default-600 hover:bg-default-100' : 'text-default-300'}
        `}>
          {format(day, 'd')}
        </span>
      </div>
      <div className="flex flex-col gap-1 mt-1">
        {renderEvents && dayEvents.map((event, idx) => (
          <DraggableCalendarEvent
            key={event.id || idx}
            event={event}
            onUpdate={(id, updates) => onUpdateEvent(id, event.id, event.sourceSpaceId, updates)}
            onNavigate={onNavigate}
            onDragEnd={onDragLeave}
          />
        ))}
      </div>
    </div>
  );
});

interface MonthWeekRowProps {
  weekStart: Date;
  events: any[];
  allEvents: any[]; // Used for drop logic in CalendarDayCell
  // We need the full list or the specific event for the ghost, because the ghost might be in a week where the event isn't originally.
  // To avoid breaking memoization with 'allEvents', we can pass just the resizing event if it exists.
  resizingEvent?: any;
  currentMonth: Date;
  selectionRange: { start: Date; end: Date } | null;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onStartSelection: (date: Date) => void;
  onUpdateSelection: (date: Date) => void;
  onUpdateEvent: (eventId: string, blockId: string, spaceId: string, updates: any) => void;
  onNavigate: (sid: string, title: string) => void;
  hoveredResizeDate: Date | null;
  onHoverDateChange: (date: Date | null) => void;
  activeResize: { id: string, direction: 'left' | 'right', offset: number } | null;
  onActiveResizeChange: (resize: { id: string, direction: 'left' | 'right', offset: number } | null) => void;
  dragGhostDate: Date | null;
  dragGhostItem: any | null;
  onDragEnter: (date: Date, item: any) => void;
  onDragLeave: () => void;
  hoveredEventId: string | null;
  onHoverEvent: (id: string | null) => void;
}


interface DragGhostProps {
  date: Date;
  event: any;
  weekStart: Date;
  weekEnd: Date;
  rowHeight?: number;
  topOffset?: number;
  layout?: Array<{ event: any; startCol: number; colSpan: number; row: number; isStart: boolean; isEnd: boolean }>;
  eventHeight?: number;
}

function DragGhost({ date, event, weekStart, weekEnd, rowHeight = 24, topOffset = 26, layout = [], eventHeight = 24 }: DragGhostProps) {
  if (!event || !date) return null;

  // Calculate duration to show correct span
  const durationMs = (event.end ? new Date(event.end).getTime() : new Date(event.start).getTime() + 3600000) - new Date(event.start).getTime();
  const ghostEnd = new Date(date.getTime() + durationMs);

  // Replicate MonthWeekRow logic for consistent span
  const eventStart = startOfDay(date);
  const eventEnd = startOfDay(ghostEnd);

  const startIndex = differenceInCalendarDays(eventStart, weekStart);
  const endIndex = differenceInCalendarDays(eventEnd, weekStart);

  // Basic constraints for the current week view
  // If the event ends before the week starts or starts after the week ends, don't render.
  if (endIndex < 0 || startIndex > 6) return null;

  const effectiveStart = Math.max(0, startIndex);
  const effectiveEnd = Math.min(6, endIndex);
  const span = effectiveEnd - effectiveStart + 1;

  // Calculate next available row based on existing layout
  const slots: string[][] = Array(7).fill(null).map(() => []);

  // Fill slots with existing events
  layout.forEach(item => {
    for (let d = item.startCol; d < item.startCol + item.colSpan && d < 7; d++) {
      slots[d][item.row] = item.event.id;
    }
  });

  // Find first available row for the ghost
  let ghostRow = 0;
  const maxRows = 20; // Safety limit
  while (ghostRow < maxRows) {
    let isRowFree = true;
    for (let d = effectiveStart; d < effectiveStart + span && d < 7; d++) {
      if (slots[d][ghostRow]) {
        isRowFree = false;
        break;
      }
    }
    if (isRowFree) break;
    ghostRow++;
  }

  return (
    <div
      className="absolute bg-primary/20 border-2 border-primary/50 border-dashed rounded-sm pointer-events-none z-[150] flex items-center px-2 overflow-hidden"
      style={{
        top: `${topOffset + ghostRow * eventHeight}px`,
        left: `calc(${(effectiveStart / 7) * 100}% + 2px)`,
        width: `calc(${(span / 7) * 100}% - 4px)`,
        height: `${eventHeight}px`
      }}
    >
      <span className="text-[9px] font-bold text-primary truncate opacity-70">
        {(startIndex < 0 ? '← ' : '') + (event.metadata?.title || 'Moving...') + (endIndex > 6 ? ' →' : '')}
      </span>
    </div>
  );
}

// Ensure ResizeGhost can find the event even if we only pass 'events' (which are local to week)
// Actually, 'ResizeGhost' used 'allEvents' in the previous code.
// In my update to MonthWeekRow, I passed `allEvents={events}` to ResizeGhost.
// This might break ResizeGhost if the event being resized is NOT in the current week's `events` list?
// Wait, if ResizeGhost is being rendered for *this week*, it implies the ghost intersects this week.
// If the ghost intersects this week, does the original event intersect this week? Not necessarily (if we moved it far away).
// But `ResizeGhost` calculates `displayStart/End` based on the *new* geometry.
// It needs `event` object to get title and original start/end?
// Line 479: `const event = allEvents.find((e: any) => e.id === activeResize.id);`
// If `allEvents` passed to ResizeGhost is just the local week events, and we dragged the ghost HERE but the event is originally elsewhere, `event` will be undefined!
// FIX: We need to pass the FULL `allEvents` to ResizeGhost, OR pass the `event` object directly.
// `MonthWeekRow` receives `events` (local) but not `allEvents` (global).
// I should pass `allEvents` to `MonthWeekRow` as well? Or just the resizing event?
// `MonthWeekRow` has `activeResize`.
// Let's pass the full `allEvents` to `MonthWeekRow` BUT only use it for ResizeGhost.
// Or better: `CalendarApp` can pass the `activeResizeEvent` object to `MonthWeekRow`.

// Let's fix MonthWeekRow signature to include `allEvents` again OR `activeResizeEvent`.
// Passing `allEvents` again invalidates the optimization if we are not careful (it changes on every add/remove).
// Actually, `allEvents` changes reference on every edit.
// If I pass it to `MonthWeekRow`, `memo` will fail to prevent re-renders unless I use `allEvents` ONLY for that ghost.
// But `MonthWeekRow` renders frequently.
// Better: Pass `resizingEvent` to `MonthWeekRow`.


const MonthWeekRow = memo(({
  weekStart,
  events,
  allEvents,
  resizingEvent,
  currentMonth,
  selectionRange,
  selectedEventId,
  onSelectEvent,
  onStartSelection,
  onUpdateSelection,
  onUpdateEvent,
  onNavigate,
  hoveredResizeDate,
  onHoverDateChange,
  activeResize,
  onActiveResizeChange,
  dragGhostDate,
  dragGhostItem,
  onDragEnter,
  onDragLeave,
  hoveredEventId,
  onHoverEvent
}: MonthWeekRowProps) => {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Layout calculation
  const layout = useMemo(() => {
    // Events are already filtered for this week by parent optimization
    const eventsInWeek = events;

    // Sort: Respect manual order (updatedAt) first, then standard time-based sort
    // This ensures recently moved/created events stay at the "bottom" (processed last)
    eventsInWeek.sort((a, b) => {
      const updatedA = a.metadata?.updatedAt || 0;
      const updatedB = b.metadata?.updatedAt || 0;

      if (updatedA !== updatedB) {
        return updatedA - updatedB;
      }

      if (a.start.getTime() !== b.start.getTime()) return a.start.getTime() - b.start.getTime();
      const durA = (a.end || a.start).getTime() - a.start.getTime();
      const durB = (b.end || b.start).getTime() - b.start.getTime();
      return durB - durA;
    });

    const slots: string[][] = Array(7).fill(null).map(() => []);

    return eventsInWeek.map(event => {
      const eventStart = startOfDay(event.start);
      const eventEnd = event.end ? startOfDay(event.end) : eventStart;

      let startIndex = differenceInCalendarDays(eventStart, weekStart);
      let endIndex = differenceInCalendarDays(eventEnd, weekStart);

      const isStart = startIndex >= 0;
      const isEnd = endIndex <= 6;

      startIndex = Math.max(0, startIndex);
      endIndex = Math.min(6, endIndex);

      const span = endIndex - startIndex + 1;

      // Find first available row
      let row = 0;
      while (true) {
        let isRowFree = true;
        for (let d = startIndex; d <= endIndex; d++) {
          if (slots[d][row]) {
            isRowFree = false;
            break;
          }
        }
        if (isRowFree) {
          for (let d = startIndex; d <= endIndex; d++) {
            slots[d][row] = event.id;
          }
          break;
        }
        row++;
      }

      return {
        event,
        startCol: startIndex,
        colSpan: span,
        row,
        isStart,
        isEnd
      };
    });
  }, [events, weekStart, weekEnd]);

  // Find the row of the resizing event in ANY week to keep it consistent
  const resizingEventItem = useMemo(() => {
    if (!activeResize) return null;
    return layout.find(l => l.event.id === activeResize.id);
  }, [activeResize, layout]);

  // Since we need the original row even in weeks where the event wasn't present,
  // we might need a more global way to determine the row.
  // However, within MonthWeekRow, we only know about our own layout.
  // For now, let's assume we can find the row if the event intersects this week.

  const maxRow = layout.length > 0 ? Math.max(...layout.map(l => l.row)) : -1;
  const rowHeight = 160;
  const topOffset = 26; // Reduced space for the day number
  const availableHeight = rowHeight - topOffset - 4; // Padding inferiore
  const eventHeight = (maxRow + 1) * 24 > availableHeight ? Math.max(4, Math.floor(availableHeight / (maxRow + 1))) : 24;

  const resizeGhostProps = useMemo(() => {
    if (!activeResize || !hoveredResizeDate || !activeResize.id) return null;
    const event = allEvents.find(e => e.id === activeResize.id);
    if (!event) return null;

    // Construct modified event
    const modifiedEvent = { ...event };
    if (activeResize.direction === 'left') {
      modifiedEvent.start = hoveredResizeDate;
    } else {
      modifiedEvent.end = hoveredResizeDate;
    }
    return { event: modifiedEvent, date: modifiedEvent.start };
  }, [activeResize, hoveredResizeDate, allEvents]);

  const selectionGhostProps = useMemo(() => {
    if (!selectionRange) return null;
    return {
      event: {
        id: 'selection',
        start: selectionRange.start,
        end: selectionRange.end,
        metadata: { title: 'New Event' }
      },
      date: selectionRange.start
    };
  }, [selectionRange]);

  return (
    <div
      className="relative flex-none calendar-week-row h-[160px] border-b border-divider"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 grid grid-cols-7 z-0">
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectionRange && (
            (day >= selectionRange.start && day <= selectionRange.end) ||
            (day <= selectionRange.start && day >= selectionRange.end)
          );

          const isHoveredTarget = hoveredResizeDate && isSameDay(day, hoveredResizeDate);

          return (
            <div
              key={day.getTime()}
              className={`relative border-r border-divider h-full transition-colors ${isHoveredTarget ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
            >
              <CalendarDayCell
                day={day}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                isSelected={false}
                dayEvents={[]} // Pass empty events as we render them in overlay
                renderEvents={false}
                onStartSelection={onStartSelection}
                onUpdateSelection={onUpdateSelection}
                onUpdateEvent={onUpdateEvent}
                onNavigate={onNavigate}
                allEvents={allEvents}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
              />
            </div>
          );
        })}
      </div>

      {/* Events Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {layout.map((item) => (
          <div key={`${item.event.id}-${weekStart.getTime()}`} className="pointer-events-auto">
            <DraggableMultiDayEvent
              {...item}
              onUpdate={(id, updates) => onUpdateEvent(id, item.event.id, item.event.sourceSpaceId, updates)}
              onHoverDateChange={onHoverDateChange}
              isResizing={activeResize?.id === item.event.id}
              onActiveResizeChange={onActiveResizeChange}
              isSelected={selectedEventId === item.event.id}
              onSelect={onSelectEvent}
              onDragEnd={onDragLeave}
              eventHeight={eventHeight}
              topOffset={topOffset}
              onHoverEvent={onHoverEvent}
              isHovered={hoveredEventId === item.event.id}
            />
          </div>
        ))}

        {/* Resize Ghost Overlay */}
        {resizeGhostProps && (
          <DragGhost
            date={resizeGhostProps.date}
            event={resizeGhostProps.event}
            weekStart={weekStart}
            weekEnd={weekEnd}
            rowHeight={eventHeight}
            topOffset={topOffset}
            layout={layout}
            eventHeight={eventHeight}
          />
        )}

        {/* Selection Ghost Overlay */}
        {selectionGhostProps && (
          <DragGhost
            date={selectionGhostProps.date}
            event={selectionGhostProps.event}
            weekStart={weekStart}
            weekEnd={weekEnd}
            rowHeight={eventHeight}
            topOffset={topOffset}
            layout={layout}
            eventHeight={eventHeight}
          />
        )}

        {/* Drag Ghost Overlay */}
        {dragGhostDate && dragGhostItem && (
          <DragGhost
            date={dragGhostDate}
            event={dragGhostItem}
            weekStart={weekStart}
            weekEnd={weekEnd}
            rowHeight={eventHeight}
            topOffset={topOffset}
            layout={layout}
            eventHeight={eventHeight}
          />
        )}
      </div>
    </div>
  );
});

export function CalendarApp({ spacesState, viewportsState }: CalendarAppProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Zoom state for week/day views
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Selection/Drag state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: Date; end: Date } | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveredResizeDate, setHoveredResizeDate] = useState<Date | null>(null);
  const [activeResize, setActiveResize] = useState<{ id: string, direction: 'left' | 'right', offset: number } | null>(null);
  const [dragGhostDate, setDragGhostDate] = useState<Date | null>(null);
  const [dragGhostItem, setDragGhostItem] = useState<any | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [editPopoverAnchor, setEditPopoverAnchor] = useState<{ x: number, y: number } | null>(null);

  // New event state
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    spaceId: ''
  });

  // Refs for auto-saving on outside click
  const newEventRef = useRef(newEvent);
  const popoverAnchorRef = useRef(popoverAnchor);
  const handleCreateEventRef = useRef<() => void>(() => { });

  useEffect(() => { newEventRef.current = newEvent; }, [newEvent]);
  useEffect(() => { popoverAnchorRef.current = popoverAnchor; }, [popoverAnchor]);

  const popoverRef = useRef<HTMLDivElement>(null);
  const editPopoverRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic hour height based on viewport and zoom
  const baseHourHeight = useMemo(() => {
    if (!viewportHeight || viewportHeight === 0) return 60; // fallback
    const availableHeight = viewportHeight - 40; // minus header
    return availableHeight / 24; // fit 24 hours in viewport
  }, [viewportHeight]);

  const hourHeight = baseHourHeight * zoomLevel;

  // Track viewport height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef) {
        setViewportHeight(containerRef.clientHeight);
      }
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef) {
      resizeObserver.observe(containerRef);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, view]);

  // Zoom handlers
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 4.0;
  const ZOOM_STEP = 0.2;

  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => {
      const newZoom = prev + delta;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    });
  }, []);

  // Zoom event listeners
  useEffect(() => {
    // Only active in week/day views
    if (view !== 'week' && view !== 'day') return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        handleZoom(delta);
      }
    };

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoom(ZOOM_STEP);
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handleZoom(-ZOOM_STEP);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [view, handleZoom]);


  // Bulletproof popover repositioning
  useLayoutEffect(() => {
    const updatePosition = () => {
      const reposition = (ref: React.RefObject<HTMLDivElement | null>, anchor: { x: number, y: number } | null) => {
        if (!ref.current || !anchor) return;
        const el = ref.current;
        const rect = el.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const padding = 12;

        let targetX = anchor.x;
        let targetY = anchor.y;

        // X Positioning: try to center, but clamp to viewport
        let left = targetX - rect.width / 2;
        if (left < padding) left = padding;
        if (left + rect.width > winW - padding) left = winW - rect.width - padding;

        // Y Positioning: try to show below anchor, if clippped, show above, if still clipped, clamp
        let top = targetY + 10; // offset from click
        if (top + rect.height > winH - padding) {
          // No space below? Try above
          top = targetY - rect.height - 10;
        }

        // Final safety clamp for Y
        if (top < padding) top = padding;
        if (top + rect.height > winH - padding) top = winH - rect.height - padding;

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.transform = 'none'; // Disable the translateX(-50%) from style to avoid conflict
      };

      reposition(popoverRef, popoverAnchor);
      reposition(editPopoverRef, editPopoverAnchor);
    };

    updatePosition();

    // Watch for size changes (inputs, textareas growing)
    const observer = new ResizeObserver(updatePosition);
    if (popoverRef.current) observer.observe(popoverRef.current);
    if (editPopoverRef.current) observer.observe(editPopoverRef.current);

    window.addEventListener('resize', updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [popoverAnchor, editPopoverAnchor]);

  // Global interaction listener for auto-save/destroy
  useEffect(() => {
    if (!popoverAnchor && !editPopoverAnchor) {
      setSelectionRange(null);
      setDragGhostDate(null);
      setDragGhostItem(null); // Ensure drag ghost is cleared
      return;
    }

    const handleInteraction = (e: Event) => {
      // If ref is null, it means it was already handled by handleStartSelection (race condition prevention)
      if (!popoverAnchorRef.current && !editPopoverAnchor) return; // Check both anchors

      const target = e.target as HTMLElement;

      // If interacting inside popover, ignore
      if (popoverRef.current && popoverRef.current.contains(target as Node)) {
        return;
      }
      if (editPopoverRef.current && editPopoverRef.current.contains(target as Node)) {
        return;
      }

      // If interacting with a Portal (e.g., Select dropdowns), ignore
      if (target.closest && target.closest('[role="listbox"], [role="menu"], [data-slot="listbox"], [data-overlay-container="true"]')) {
        return;
      }

      // If interacting outside: auto-save if title exists, otherwise destroy
      if (popoverAnchorRef.current) { // Only auto-save for new event popover
        if (newEventRef.current.title) {
          handleCreateEventRef.current();
        } else {
          setSelectionRange(null);
        }
      }

      setPopoverAnchor(null);
      popoverAnchorRef.current = null; // Mark as handled
      setEditPopoverAnchor(null);
      setDragGhostDate(null); // Clear drag ghost on outside interaction
      setDragGhostItem(null); // Clear drag ghost item on outside interaction
    };

    // Use capture phase to handle events before they are stopped by other components (e.g. existing value drags)
    const options = { capture: true };
    document.addEventListener('mousedown', handleInteraction, options);
    document.addEventListener('dragstart', handleInteraction, options);
    document.addEventListener('wheel', handleInteraction, options);
    document.addEventListener('contextmenu', handleInteraction, options);

    return () => {
      document.removeEventListener('mousedown', handleInteraction, options);
      document.removeEventListener('dragstart', handleInteraction, options);
      document.removeEventListener('wheel', handleInteraction, options);
      document.removeEventListener('contextmenu', handleInteraction, options);
    };
  }, [popoverAnchor, editPopoverAnchor]);

  // Keep a stable ref to spacesState to avoid re-creating callbacks on every render
  // This is crucial for performance as spacesState changes frequently
  const spacesStateRef = useRef(spacesState);
  useEffect(() => {
    spacesStateRef.current = spacesState;
  });

  // Extract all calendar events from all spaces with deep comparison check to avoid unnecessary updates
  const prevEventsRef = useRef<any[]>([]);
  const allEvents = useMemo(() => {
    const events: any[] = [];
    spacesState.spaces.forEach((space: any) => {
      if (space.content?.blocks) {
        space.content.blocks.forEach((block: any) => {
          if (block.type === 'calendar') {
            const start = new Date(block.metadata?.startDate || Date.now());
            const end = block.metadata?.endDate ? new Date(block.metadata.endDate) : null;

            if (isValid(start)) {
              events.push({
                ...block,
                sourceSpaceId: space.id,
                sourceSpaceTitle: space.title,
                start,
                end: end && isValid(end) ? end : null
              });
            }
          }
        });
      }
    });

    // Simple length check first
    if (events.length !== prevEventsRef.current.length) {
      prevEventsRef.current = events;
      return events;
    }

    // Deep comparison of content strings to avoid re-renders when other parts of state change
    const currentString = JSON.stringify(events.map(e => ({ ...e, start: e.start.getTime(), end: e.end?.getTime() })));
    const prevString = JSON.stringify(prevEventsRef.current.map(e => ({ ...e, start: e.start.getTime(), end: e.end?.getTime() })));

    if (currentString !== prevString) {
      prevEventsRef.current = events;
      return events;
    }

    return prevEventsRef.current;
  }, [spacesState.spaces]);

  const prevPeriod = useCallback(() => {
    setCurrentDate(prev => {
      let nextDate = prev;
      if (view === 'month') nextDate = subMonths(prev, 1);
      else if (view === 'week') nextDate = subWeeks(prev, 1);
      else if (view === 'day') nextDate = subDays(prev, 1);
      else if (view === 'year') nextDate = new Date(prev.getFullYear() - 1, prev.getMonth(), 1);
      else if (view === 'timeline') nextDate = subDays(prev, 14);

      if (view === 'month' && containerRef) {
        // We can't easily scroll inside set state, but we can trigger effect or use ref
        setTimeout(() => {
          const targetMonth = startOfMonth(nextDate);
          const targetWeek = startOfWeek(targetMonth, { weekStartsOn: 1 });
          const weekElement = containerRef.querySelector(`[data-week="${targetWeek.getTime()}"]`);
          if (weekElement) weekElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }, 10);
      }
      return nextDate;
    });
  }, [view, containerRef]);

  const nextPeriod = useCallback(() => {
    setCurrentDate(prev => {
      let nextDate = prev;
      if (view === 'month') nextDate = addMonths(prev, 1);
      else if (view === 'week') nextDate = addWeeks(prev, 1);
      else if (view === 'day') nextDate = addDays(prev, 1);
      else if (view === 'year') nextDate = new Date(prev.getFullYear() + 1, prev.getMonth(), 1);
      else if (view === 'timeline') nextDate = addDays(prev, 14);

      if (view === 'month' && containerRef) {
        setTimeout(() => {
          const targetMonth = startOfMonth(nextDate);
          const targetWeek = startOfWeek(targetMonth, { weekStartsOn: 1 });
          const weekElement = containerRef.querySelector(`[data-week="${targetWeek.getTime()}"]`);
          if (weekElement) weekElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }, 10);
      }
      return nextDate;
    });
  }, [view, containerRef]);

  const scrollToMonth = useCallback((date: Date) => {
    if (containerRef && view === 'month') {
      const targetMonth = startOfMonth(date);
      const targetWeek = startOfWeek(targetMonth, { weekStartsOn: 1 });
      const weekElement = containerRef.querySelector(`[data-week="${targetWeek.getTime()}"]`);
      if (weekElement) {
        weekElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [containerRef, view]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    if (view === 'month') {
      // Need a small timeout to allow render if view changed
      setTimeout(() => scrollToMonth(today), 10);
    }
  }, [view, scrollToMonth]);
  const weeksInRange = useMemo(() => {
    // 6 months before and 6 months after current "center" date
    const startRange = startOfWeek(startOfMonth(subMonths(new Date(), 6)), { weekStartsOn: 1 });
    const endRange = endOfWeek(endOfMonth(addMonths(new Date(), 6)), { weekStartsOn: 1 });

    const weeks: Date[] = [];
    let curr = startRange;
    while (curr <= endRange) {
      weeks.push(curr);
      curr = addWeeks(curr, 1);
    }
    return weeks;
  }, []);

  // Optimize: Group events by week for Month view to avoid filtering in every row
  const eventsByWeek = useMemo(() => {
    const map = new Map<number, any[]>();
    // Iterate weeks in range and filter events for each week
    // This moves the O(Weeks * Events) op here, instead of per-render of Row
    weeksInRange.forEach(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEvents = allEvents.filter(e => {
        const eventStart = startOfDay(e.start);
        const eventEnd = e.end ? startOfDay(e.end) : eventStart;
        return (eventStart <= weekEnd && eventEnd >= weekStart);
      });
      map.set(weekStart.getTime(), weekEvents);
    });
    return map;
  }, [allEvents, weeksInRange]);

  // Scroll to "today" or current month on mount
  useEffect(() => {
    if (containerRef && view === 'month') {
      const today = new Date();
      const todayWeek = startOfWeek(today, { weekStartsOn: 1 });
      const weekElement = containerRef.querySelector(`[data-week="${todayWeek.getTime()}"]`);
      if (weekElement) {
        weekElement.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [containerRef, view]);

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title) return;

    let targetSpaceId = newEvent.spaceId;
    const spaces = spacesStateRef.current.spaces;

    // If no space selected, find or create a default "Calendar" space
    if (!targetSpaceId) {
      const existingCalendarSpace = spaces.find((s: any) => s.title === 'Calendar' && s.metadata?.isHidden);
      if (existingCalendarSpace) {
        targetSpaceId = existingCalendarSpace.id;
      } else {
        const newSpace = spacesStateRef.current.createSpace('page');
        spacesStateRef.current.updateSpace(newSpace.id, {
          title: 'Calendar',
          metadata: { isHidden: true } // Hide from sidebar
        });
        targetSpaceId = newSpace.id;
      }
    }

    const targetSpace = spacesStateRef.current.getSpace(targetSpaceId);
    if (targetSpace) {
      const newBlock = {
        id: `block_${Date.now()}`,
        type: 'calendar',
        content: newEvent.notes,
        metadata: {
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          notes: newEvent.notes,
          title: newEvent.title,
          displayMode: 'card',
          updatedAt: Date.now() // Track for sort order
        }
      };

      const updatedBlocks = [...(targetSpace.content?.blocks || []), newBlock];
      spacesStateRef.current.updateSpace(targetSpaceId, {
        content: { ...targetSpace.content, blocks: updatedBlocks }
      });
    }

    onClose();
    setSelectionRange(null);
    setNewEvent({
      title: '',
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
      notes: '',
      spaceId: ''
    });
  }, [newEvent, onClose]);

  useEffect(() => {
    handleCreateEventRef.current = handleCreateEvent;
  }, [handleCreateEvent]);

  const handleQuickCreate = useCallback(() => {
    if (!newEvent.title) return;
    handleCreateEvent();
    setPopoverAnchor(null);
  }, [newEvent, handleCreateEvent]);

  const handleStartSelection = useCallback((date: Date) => {
    // Auto-save draft if clicking outside (starting new selection) while popover is open
    if (popoverAnchorRef.current && newEventRef.current.title) {
      handleCreateEventRef.current();
    }
    setPopoverAnchor(null);
    popoverAnchorRef.current = null;

    setIsSelecting(true);
    setSelectionRange({ start: date, end: date });
  }, []);

  const handleUpdateSelection = useCallback((date: Date) => {
    if (!isSelecting) return;
    setSelectionRange(prev => prev ? { ...prev, end: date } : null); // Access prev from state, don't depend on selectionRange
  }, [isSelecting]);

  const handleEndSelection = useCallback((e?: React.MouseEvent | MouseEvent) => {
    if (!isSelecting) {
      // Just explicit false set
      setIsSelecting(false);
      return;
    }

    // We need to access selectionRange state.
    // Since we can't get it from 'prev', we need it in deps, but then this changes.
    // So we can use a ref or just accept selectionRange dependency (it changes on drag, which is frequent).
    // BUT handleEndSelection is attached to container onMouseUp.
    // If it changes, the listener re-attaches.
    // However, onMouseUp is likely not a big deal if it's passive.
    // But let's try to get selectionRange from state inside setSelectionRange if possible? No.
    // We can use a ref for selectionRange.
    // Let's defer 'handleEndSelection' logic to effect or just use selectionRange here.
    // Actually, selectionRange updates every mousemove (hover).
    // So handleEndSelection updates every mousemove.
    // This is fine for the event handler itself.
    // But let's see where it is used.
    // It is used in `renderMonthView` -> `div onMouseUp`.
    // The div re-renders every time handleEndSelection changes.
    // The div contains the WHOLE calendar.
    // This means the WHOLE CALENDAR re-renders on every mouse move during selection!
    // THIS IS A BOTTLENECK.

    // FIX: use a ref for selectionRange to read it in handleEndSelection without re-creating the function.
  }, [isSelecting]); // Wait, implementation below.

  // Using ref for selectionRange to stabilize handleEndSelection
  const selectionRangeRef = useRef(selectionRange);
  useEffect(() => { selectionRangeRef.current = selectionRange; }, [selectionRange]);

  const handleEndSelectionStable = useCallback((e?: React.MouseEvent | MouseEvent) => {
    if (!isSelecting) {
      setIsSelecting(false);
      return;
    }

    const range = selectionRangeRef.current;
    if (!range) {
      setIsSelecting(false);
      return;
    }

    // Normalize range (start should be before end)
    const start = range.start < range.end ? range.start : range.end;
    const end = range.start < range.end ? range.end : range.start;

    // For week/day view, ensure at least 30min duration if it's the same time
    let finalEnd = end;
    if ((view === 'week' || view === 'day') && start.getTime() === end.getTime()) {
      finalEnd = new Date(start.getTime() + 30 * 60 * 1000);
    } else if (view === 'month' && isSameDay(start, end)) {
      // For month view, default to 1h on that day
      finalEnd = new Date(start.getTime() + 60 * 60 * 1000);
    }

    setNewEvent(prev => ({
      ...prev,
      title: '', // Empty title to allow cancellation on outside click
      startDate: format(start, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(finalEnd, "yyyy-MM-dd'T'HH:mm")
    }));

    if (e && 'clientX' in e) {
      setPopoverAnchor({ x: e.clientX, y: e.clientY });
    } else {
      // Fallback anchor
      setPopoverAnchor({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }

    setIsSelecting(false);
  }, [isSelecting, view]); // Removed selectionRange from deps

  const handleUpdateEvent = useCallback((eventId: string, blockId: string, spaceId: string, updates: any) => {
    const space = spacesStateRef.current.spaces.find((s: any) => s.id === spaceId);
    if (!space) return;

    const blocks = [...(space.content?.blocks || [])];
    const blockIndex = blocks.findIndex((b: any) => b.id === blockId);
    if (blockIndex === -1) return;

    blocks[blockIndex] = {
      ...blocks[blockIndex],
      metadata: {
        ...blocks[blockIndex].metadata,
        ...updates,
        updatedAt: Date.now() // Track for sort order
      }
    };

    spacesStateRef.current.updateSpace(spaceId, {
      content: { ...space.content, blocks }
    });
  }, []);

  const handleToggleEventSelection = useCallback((id: string | null, anchor?: { x: number, y: number }) => {
    setSelectedEventId(id);
    if (anchor) setEditPopoverAnchor(anchor);
    else setEditPopoverAnchor(null);
  }, []);

  const handleDragEnter = useCallback((date: Date, item: any) => {
    setDragGhostDate(date);
    setDragGhostItem(item);
    handleToggleEventSelection(null); // Dismiss edit popover on drag
  }, [handleToggleEventSelection]);

  const handleDragLeave = useCallback(() => {
    setDragGhostDate(null);
    setDragGhostItem(null);
  }, []);

  const getViewTitle = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: enUS });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`;
    }
    if (view === 'day') return format(currentDate, 'd MMMM yyyy', { locale: enUS });
    if (view === 'year') return `${currentDate.getFullYear()}`;
    if (view === 'timeline') return `Timeline - ${format(currentDate, 'MMMM yyyy', { locale: enUS })}`;
    return '';
  };

  const resizingEvent = useMemo(() => {
    if (!activeResize) return null;
    return allEvents.find(e => e.id === activeResize.id);
  }, [activeResize, allEvents]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return allEvents.find(e => e.id === selectedEventId);
  }, [selectedEventId, allEvents]);

  const renderMonthView = () => {
    return (
      <div
        ref={setContainerRef}
        className="h-full overflow-y-auto relative bg-white scroll-smooth no-scrollbar select-none calendar-grid-container"
        onMouseUp={(e) => isSelecting && handleEndSelectionStable(e)}
        onMouseLeave={() => isSelecting && handleEndSelectionStable()}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('.calendar-event-item')) {
            handleToggleEventSelection(null);
          }
        }}
        onScroll={(e) => {
          // Optional: Update currentDate based on visible month to sync header title
          // For now we keep header manually navigable or synced on start
        }}
      >
        {/* Sticky Day Headers */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-divider shadow-sm">
          <div className="grid grid-cols-7 gap-0 border-l border-divider">
            {daysOfWeek.map(d => (
              <div key={d} className="py-2 text-center font-bold text-[9px] uppercase text-default-400 border-r border-divider tracking-wider">
                {d}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col border-l border-divider">
          {weeksInRange.map((weekStart, idx) => {
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const firstDayInWeek = weekDays.find(d => d.getDate() === 1);
            const showMonthBar = firstDayInWeek || idx === 0;
            const monthOfThisWeek = startOfMonth(firstDayInWeek || weekStart);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });



            return (
              <div key={weekStart.getTime()} data-week={weekStart.getTime()} className="relative">
                <MonthWeekRow
                  weekStart={weekStart}
                  events={eventsByWeek.get(weekStart.getTime()) || []}
                  allEvents={allEvents}
                  resizingEvent={resizingEvent}
                  currentMonth={monthOfThisWeek}
                  selectionRange={selectionRange}
                  selectedEventId={selectedEventId}
                  onSelectEvent={handleToggleEventSelection}
                  onStartSelection={handleStartSelection}
                  onUpdateSelection={handleUpdateSelection}
                  onUpdateEvent={handleUpdateEvent}
                  onNavigate={() => { }} // Disabled navigation
                  hoveredResizeDate={hoveredResizeDate}
                  onHoverDateChange={setHoveredResizeDate}
                  activeResize={activeResize}
                  onActiveResizeChange={setActiveResize}
                  dragGhostDate={dragGhostDate}
                  dragGhostItem={dragGhostItem}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  hoveredEventId={hoveredEventId}
                  onHoverEvent={(id) => {
                    if (!dragGhostItem && !isSelecting) {
                      setHoveredEventId(id);
                    }
                  }}
                />
              </div>
            );
          })}
          {/* Infinite-like bottom spacer */}
          <div className="h-[300px] bg-default-50/10 flex items-center justify-center">
            <span className="text-[10px] font-medium text-default-300 uppercase tracking-[0.2em]">End of Calendar</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = allEvents.filter(event => isSameDay(event.start, currentDate));

    return (
      <div
        ref={setContainerRef}
        className="flex h-full overflow-auto select-none"
        onMouseUp={(e) => isSelecting && handleEndSelectionStable(e)}
        onMouseLeave={() => isSelecting && handleEndSelectionStable()}
      >
        <div className="w-[60px] shrink-0 border-r border-divider bg-default-50/50">
          <div className="h-[40px]" />
          {hours.map(hour => (
            <div key={hour} style={{ height: `${hourHeight}px` }} className="px-2 flex items-center border-t border-divider text-[10px] text-default-400">
              {`${hour}:00`}
            </div>
          ))}
        </div>

        <div className="flex-1 relative flex flex-col">
          <div className="h-[40px] flex items-center justify-center border-b border-divider sticky top-0 bg-white z-10 font-bold">
            {format(currentDate, 'EEEE d MMMM', { locale: enUS })}
          </div>
          <div className="relative flex-1">
            {hours.map(hour => (
              <CalendarDaySlot
                key={hour}
                hour={hour}
                day={currentDate}
                onStartSelection={handleStartSelection}
                onUpdateSelection={handleUpdateSelection}
                onUpdateEvent={handleUpdateEvent}
                allEvents={allEvents}
                hourHeight={hourHeight}
              />
            ))}

            {selectionRange && isSameDay(selectionRange.start, currentDate) && (
              <div
                className="absolute left-1 right-1 bg-primary/30 border-2 border-primary rounded-md z-30 pointer-events-none"
                style={{
                  top: `${Math.min(selectionRange.start.getHours(), selectionRange.end.getHours()) * hourHeight}px`,
                  height: `${Math.max(1, Math.abs(selectionRange.end.getHours() - selectionRange.start.getHours())) * hourHeight}px`
                }}
              />
            )}

            {dayEvents.map((event, idx) => {
              const startHour = event.start.getHours();
              const startMin = event.start.getMinutes();
              const top = (startHour * hourHeight + startMin * (hourHeight / 60));
              const duration = event.end ? (event.end.getTime() - event.start.getTime()) / (1000 * 60) : 60;


              return (
                <DraggableTimelineEvent
                  key={event.id || idx}
                  event={event}
                  top={top}
                  height={Math.max(24, duration * (hourHeight / 60))}
                  onUpdate={(id, updates) => handleUpdateEvent(id, id, event.sourceSpaceId, updates)}
                  onHoverEvent={(id) => {
                    if (!dragGhostItem && !isSelecting) {
                      setHoveredEventId(id);
                    }
                  }}
                  isHovered={hoveredEventId === event.id}
                  onSelect={handleToggleEventSelection}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const monthsInYear = eachMonthOfInterval({ start: yearStart, end: endOfYear(yearStart) });

    return (
      <div className="h-full overflow-auto p-6 bg-default-50/20" onMouseUp={(e) => isSelecting && handleEndSelectionStable(e)}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {monthsInYear.map((month, mIdx) => {
            const monthDays = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
            const monthStartDay = (startOfWeek(startOfMonth(month), { weekStartsOn: 1 }).getDay() + 6) % 7;

            return (
              <div key={mIdx} className="flex flex-col gap-2">
                <h3 className="font-bold text-sm capitalize">{format(month, 'MMMM', { locale: enUS })}</h3>
                <div className="grid grid-cols-7 gap-1">
                  {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
                    <div key={`${mIdx}-${d}-${i}`} className="text-[9px] text-default-400 text-center font-bold">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: monthStartDay }).map((_, i) => <div key={`empty-${mIdx}-${i}`} />)}
                  {monthDays.map((day, dIdx) => {
                    const isToday = isSameDay(day, new Date());
                    const hasEvents = allEvents.some(e => isSameDay(e.start, day));
                    const isSelected = selectionRange && (
                      (day >= selectionRange.start && day <= selectionRange.end) ||
                      (day <= selectionRange.start && day >= selectionRange.end)
                    );

                    return (
                      <div
                        key={dIdx}
                        className={`
                          aspect-square flex items-center justify-center text-[10px] rounded-full cursor-pointer transition-colors
                          ${isToday ? 'bg-primary text-white font-bold' : 'hover:bg-default-200'}
                          ${hasEvents && !isToday ? 'bg-primary/10 text-primary font-bold' : ''}
                          ${isSelected ? 'bg-primary/30 text-primary-900 ring-2 ring-primary z-10' : ''}
                        `}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          const d = new Date(day);
                          d.setHours(9, 0, 0, 0);
                          handleStartSelection(d);
                        }}
                        onMouseEnter={() => {
                          if (!isSelecting) return;
                          const d = new Date(day);
                          d.setHours(10, 0, 0, 0);
                          handleUpdateSelection(d);
                        }}
                        onClick={(e) => {
                          if (!isSelecting) {
                            setCurrentDate(day);
                            setView('day');
                          }
                        }}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const startDate = subDays(currentDate, 7);
    const timelineDays = Array.from({ length: 30 }, (_, i) => addDays(startDate, i));

    return (
      <div
        className="h-full overflow-x-auto overflow-y-hidden select-none whitespace-nowrap p-4 flex gap-1"
        onMouseUp={(e) => isSelecting && handleEndSelectionStable(e)}
        onMouseLeave={() => isSelecting && handleEndSelectionStable()}
      >
        {timelineDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const dayEvents = allEvents.filter(event => isSameDay(event.start, day));
          const isSelected = selectionRange && (
            (day >= selectionRange.start && day <= selectionRange.end) ||
            (day <= selectionRange.start && day >= selectionRange.end)
          );

          return (
            <div
              key={i}
              className={`
                min-w-[140px] h-full border border-divider rounded-xl flex flex-col transition-colors cursor-pointer
                ${isToday ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-white'}
                ${isSelected ? 'bg-primary/10 border-primary ring-2 ring-primary/30 z-10' : ''}
              `}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                const d = new Date(day);
                d.setHours(9, 0, 0, 0);
                handleStartSelection(d);
              }}
              onMouseEnter={() => {
                if (!isSelecting) return;
                const d = new Date(day);
                d.setHours(10, 0, 0, 0);
                handleUpdateSelection(d);
              }}
            >
              <div className="p-3 border-b border-divider flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-default-400">{format(day, 'EEE', { locale: enUS })}</span>
                <span className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                <span className="text-[10px] text-default-400">{format(day, 'MMM', { locale: enUS })}</span>
              </div>
              <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {dayEvents.map((event, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-primary/10 text-primary-800 text-[10px] border-l-2 border-primary font-medium whitespace-normal">
                    <div className="font-bold">{event.metadata?.title}</div>
                    <div className="opacity-70">{format(event.start, 'HH:mm')}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div
        ref={setContainerRef}
        className="flex h-full overflow-auto select-none"
        onMouseUp={(e) => isSelecting && handleEndSelectionStable(e)}
        onMouseLeave={() => isSelecting && handleEndSelectionStable()}
      >
        <div className="w-[60px] shrink-0 border-r border-divider bg-default-50/50">
          <div className="h-[40px]" />
          {hours.map(hour => (
            <div key={hour} style={{ height: `${hourHeight}px` }} className="px-2 flex items-center border-t border-divider text-[10px] text-default-400">
              {`${hour}:00`}
            </div>
          ))}
        </div>

        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const dayEvents = allEvents.filter(event => isSameDay(event.start, day));

          return (
            <div key={i} className="flex-1 border-r border-divider min-w-[120px] relative flex flex-col">
              <div className={`
                h-[40px] flex flex-col items-center justify-center border-b border-divider sticky top-0 bg-white z-10
                ${isToday ? 'bg-primary/5 text-primary' : ''}
              `}>
                <span className="text-[10px] uppercase font-bold text-default-400">{daysOfWeekShort[i]}</span>
                <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{format(day, 'd')}</span>
              </div>
              <div className="relative flex-1">
                {hours.map(hour => (
                  <CalendarDaySlot
                    key={hour}
                    hour={hour}
                    day={day}
                    onStartSelection={handleStartSelection}
                    onUpdateSelection={handleUpdateSelection}
                    onUpdateEvent={handleUpdateEvent}
                    allEvents={allEvents}
                    hourHeight={hourHeight}
                  />
                ))}

                {selectionRange && isSameDay(selectionRange.start, day) && (
                  <div
                    className="absolute left-1 right-1 bg-primary/30 border-2 border-primary rounded-md z-30 pointer-events-none"
                    style={{
                      top: `${Math.min(selectionRange.start.getHours(), selectionRange.end.getHours()) * hourHeight}px`,
                      height: `${Math.max(1, Math.abs(selectionRange.end.getHours() - selectionRange.start.getHours())) * hourHeight}px`
                    }}
                  />
                )}

                {dayEvents.map((event) => {
                  const startHour = event.start.getHours();
                  const startMin = event.start.getMinutes();
                  const top = (startHour * hourHeight + startMin * (hourHeight / 60));
                  const duration = event.end ? (event.end.getTime() - event.start.getTime()) / (1000 * 60) : 60;


                  return (
                    <DraggableTimelineEvent
                      key={event.id}
                      event={event}
                      top={top}
                      height={Math.max(24, duration * (hourHeight / 60))}
                      onUpdate={(id: string, updates: any) => handleUpdateEvent(id, id, event.sourceSpaceId, updates)}
                      onNavigate={(sid: string, title: string) => {
                        if (viewportsState) {
                          viewportsState.replaceCurrentTab(viewportsState.focusedViewportId, sid, undefined, title);
                        }
                      }}
                      onHoverEvent={(id) => {
                        if (!dragGhostItem && !isSelecting) {
                          setHoveredEventId(id);
                        }
                      }}
                      isHovered={hoveredEventId === event.id}
                      onSelect={handleToggleEventSelection}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <style>{`
        .is-dragging-event .calendar-event-item {
          pointer-events: none !important;
        }
      `}</style>
      {/* Header */}
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-divider shrink-0 bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-default-100 rounded-lg p-0.5">
            <Button isIconOnly size="sm" variant="light" onPress={prevPeriod} className="h-7 w-7 min-w-7 data-[hover=true]:bg-white rounded-md">
              <ChevronLeft size={16} className="text-default-500" />
            </Button>
            <div className="px-3 font-bold text-sm min-w-[120px] text-center text-default-700">
              {getViewTitle()}
            </div>
            <Button isIconOnly size="sm" variant="light" onPress={nextPeriod} className="h-7 w-7 min-w-7 data-[hover=true]:bg-white rounded-md">
              <ChevronRight size={16} className="text-default-500" />
            </Button>
          </div>
          <Button size="sm" variant="light" onPress={goToToday} className="h-8 font-medium text-default-600">Today</Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex gap-0.5 bg-default-100 p-0.5 rounded-lg border border-default-200/50">
            {(['month', 'week', 'day', 'year', 'timeline'] as const).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={view === v ? 'light' : 'light'}
                onPress={() => setView(v)}
                className={`capitalize text-xs h-7 px-3 rounded-md transition-all ${view === v ? 'bg-white text-default-900 font-bold shadow-sm' : 'text-default-500 hover:text-default-700'}`}
                disableAnimation
              >
                {v === 'month' ? 'Month' : v === 'week' ? 'Week' : v === 'day' ? 'Day' : v === 'year' ? 'Year' : 'Timeline'}
              </Button>
            ))}
          </div>
          <div className="w-px h-4 bg-default-300 mx-1" />
          <Button startContent={<Plus size={16} />} size="sm" color="primary" className="font-bold shadow-lg" onPress={onOpen}>
            New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-hidden ${dragGhostItem ? 'is-dragging-event' : ''}`}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'year' && renderYearView()}
        {view === 'timeline' && renderTimelineView()}
      </div>

      {/* Quick Create UI */}
      <AnimatePresence>
        {popoverAnchor && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: popoverAnchor.x,
              top: popoverAnchor.y
            }}
          >
            <div className="pointer-events-auto w-[260px] p-3 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-divider flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">New Event</span>
                <Button size="sm" isIconOnly variant="light" className="h-5 w-5 min-w-5 text-default-400 hover:text-default-700" onClick={() => setPopoverAnchor(null)}>
                  <Plus size={14} className="rotate-45" />
                </Button>
              </div>
              <Input
                autoFocus
                placeholder="Event title"
                variant="bordered"
                size="sm"
                value={newEvent.title}
                onValueChange={(v) => setNewEvent(prev => ({ ...prev, title: v }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newEvent.title) handleQuickCreate();
                  if (e.key === 'Escape') setPopoverAnchor(null);
                }}
                classNames={{ inputWrapper: "h-8 min-h-8 px-2 text-sm shadow-none bg-default-50/50" }}
              />
              <div className="flex items-center gap-2 text-[10px] text-default-500 bg-default-50 p-1.5 rounded-lg border border-default-100">
                <CalendarIcon size={12} className="text-primary" />
                <span className="font-medium">{format(new Date(newEvent.startDate), 'd MMM, HH:mm')}</span>
                <span className="opacity-30">→</span>
                <span className="font-medium">{format(new Date(newEvent.endDate), 'HH:mm')}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" fullWidth variant="light" className="font-medium h-7 text-xs bg-default-100" onClick={() => { setPopoverAnchor(null); onOpen(); }}>
                  More...
                </Button>
                <Button size="sm" fullWidth color="primary" className="font-bold h-7 text-xs shadow-lg shadow-primary/20" onClick={handleQuickCreate} isDisabled={!newEvent.title}>
                  Add
                </Button>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-divider rotate-45" />
            </div>
          </motion.div>
        )}

        {selectedEvent && editPopoverAnchor && (
          <motion.div
            ref={editPopoverRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: editPopoverAnchor.x,
              top: editPopoverAnchor.y
            }}
          >
            <div className="pointer-events-auto w-[280px] p-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.3)] border border-divider flex flex-col gap-2">
              <div className="absolute right-2 top-2 z-10">
                <Button size="sm" isIconOnly variant="light" radius="full" className="h-6 w-6 min-w-6 text-default-400 hover:text-default-700" onClick={() => handleToggleEventSelection(null)}>
                  <Plus size={16} className="rotate-45" />
                </Button>
              </div>

              <div className="pr-8 pt-1">
                <Input
                  placeholder="Event title"
                  variant="flat"
                  size="sm"
                  value={selectedEvent.metadata?.title || ''}
                  onValueChange={(v) => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { title: v })}
                  classNames={{
                    inputWrapper: "bg-transparent hover:bg-default-100 transition-colors h-auto min-h-0 p-0 shadow-none data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent",
                    input: "text-lg font-bold text-default-900 placeholder:text-default-300"
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5 bg-default-50/50 p-2 rounded-lg border border-default-100/50">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="datetime-local"
                    variant="bordered"
                    size="sm"
                    value={format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { startDate: e.target.value })}
                    classNames={{
                      inputWrapper: "h-7 min-h-7 px-1.5 bg-white border-default-200/50 shadow-none",
                      input: "text-[10px] font-medium"
                    }}
                  />
                  <Input
                    type="datetime-local"
                    variant="bordered"
                    size="sm"
                    value={selectedEvent.end ? format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { endDate: e.target.value })}
                    classNames={{
                      inputWrapper: "h-7 min-h-7 px-1.5 bg-white border-default-200/50 shadow-none",
                      input: "text-[10px] font-medium"
                    }}
                  />
                </div>

                <Select
                  selectionMode="multiple"
                  placeholder="Link spaces..."
                  variant="bordered"
                  size="sm"
                  selectedKeys={new Set(selectedEvent.metadata?.linkedSpaceIds || [])}
                  onSelectionChange={(keys: any) => {
                    const linkedSpaceIds = Array.from(keys);
                    handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { linkedSpaceIds });
                  }}
                  classNames={{
                    trigger: "bg-white min-h-7 h-7 py-0 px-2 border-default-200/50 shadow-none",
                    value: "text-[10px]"
                  }}
                  renderValue={(items) => (
                    <div className="flex flex-wrap gap-1">
                      {items.map((item) => (
                        <span key={item.key} className="text-[10px] font-medium text-primary">{item.textValue}</span>
                      ))}
                    </div>
                  )}
                >
                  {spacesState.spaces.filter((s: any) => s.id !== selectedEvent.sourceSpaceId).map((space: any) => (
                    <SelectItem key={space.id} textValue={space.title}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="text-xs">{space.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <Button
                  size="sm"
                  variant="flat"
                  className="w-full justify-between h-9 bg-primary/5 hover:bg-primary/10 text-primary-700 border border-primary/20"
                  startContent={<FileText size={14} />}
                  endContent={selectedEvent.metadata?.noteSpaceId ? <ExternalLink size={12} className="opacity-50" /> : <Plus size={12} className="opacity-50" />}
                  onClick={() => {
                    let spaceId = selectedEvent.metadata?.noteSpaceId;
                    if (!spaceId) {
                      // Create new note space
                      const newSpace = spacesState.createSpace('page');
                      const noteTitle = `Notes: ${selectedEvent.metadata?.title || 'Untitled Event'}`;
                      spacesState.updateSpace(newSpace.id, {
                        title: noteTitle,
                        metadata: { isNote: true, eventId: selectedEvent.id }
                      });
                      spaceId = newSpace.id;
                      handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { noteSpaceId: spaceId });
                    }

                    if (viewportsState && spaceId) {
                      viewportsState.replaceCurrentTab(viewportsState.focusedViewportId, spaceId, undefined, selectedEvent.metadata?.title || 'Notes');
                      handleToggleEventSelection(null);
                    }
                  }}
                >
                  <span className="flex-1 text-left ml-2 font-medium">Event Notes Space</span>
                </Button>
                {selectedEvent.metadata?.notes && !selectedEvent.metadata?.noteSpaceId && (
                  <div className="text-[10px] text-default-400 px-2 line-clamp-2 italic">
                    {selectedEvent.metadata.notes}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-divider mt-1">
                <Button
                  size="sm"
                  variant="solid"
                  className="font-bold text-[10px] h-7 px-3 shadow-sm bg-red-600 hover:bg-red-700 text-white"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                  startContent={<Trash2 size={12} className="text-white" />}
                  onClick={() => {
                    const space = spacesState.spaces.find((s: any) => s.id === selectedEvent.sourceSpaceId);
                    if (space) {
                      const blocks = space.content?.blocks.filter((b: any) => b.id !== selectedEvent.id);
                      spacesState.updateSpace(selectedEvent.sourceSpaceId, { content: { ...space.content, blocks } });
                      handleToggleEventSelection(null);
                    }
                  }}
                >
                  Delete Event
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Event Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create New Event</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Title"
                    placeholder="Event name"
                    variant="bordered"
                    value={newEvent.title}
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, title: v }))}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      label="Start"
                      variant="bordered"
                      value={newEvent.startDate}
                      onValueChange={(v) => setNewEvent(prev => ({ ...prev, startDate: v }))}
                    />
                    <Input
                      type="datetime-local"
                      label="End"
                      variant="bordered"
                      value={newEvent.endDate}
                      onValueChange={(v) => setNewEvent(prev => ({ ...prev, endDate: v }))}
                    />
                  </div>
                  <Select
                    label="Destination"
                    placeholder="Choose a space"
                    variant="bordered"
                    selectedKeys={newEvent.spaceId ? [newEvent.spaceId] : []}
                    onSelectionChange={(keys: any) => setNewEvent(prev => ({ ...prev, spaceId: Array.from(keys)[0] as string }))}
                  >
                    {spacesState.spaces.filter((s: any) => s.type === 'page').map((space: any) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.title}
                      </SelectItem>
                    ))}
                  </Select>
                  <Textarea
                    label="Note"
                    placeholder="Additional details..."
                    variant="bordered"
                    value={newEvent.notes}
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, notes: v }))}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={handleCreateEvent}>Save Event</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div >
  );
}

function CalendarDaySlot({ hour, day, onStartSelection, onUpdateSelection, onUpdateEvent, allEvents, hourHeight = 60 }: any) {
  const [dropPosition, setDropPosition] = useState<number | null>(null);

  const [{ isOver, draggedItem }, drop] = useDrop({
    accept: 'CALENDAR_EVENT',
    hover: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverBoundingRect = document.elementFromPoint(clientOffset.x, clientOffset.y)?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const minuteHeight = hourHeight / 60;
      const hoverMinute = Math.floor(hoverClientY / minuteHeight);

      // Snap to 15-minute intervals
      const snappedMinute = Math.floor(hoverMinute / 15) * 15;
      setDropPosition(snappedMinute);
    },
    drop: (item: any, monitor) => {
      const event = allEvents.find((e: any) => e.id === item.id);
      if (!event) return;

      const clientOffset = monitor.getClientOffset();
      let minute = 0;

      if (clientOffset) {
        const hoverBoundingRect = document.elementFromPoint(clientOffset.x, clientOffset.y)?.getBoundingClientRect();
        if (hoverBoundingRect) {
          const hoverClientY = clientOffset.y - hoverBoundingRect.top;
          const minuteHeight = hourHeight / 60;
          const hoverMinute = Math.floor(hoverClientY / minuteHeight);
          // Snap to 15-minute intervals
          minute = Math.floor(hoverMinute / 15) * 15;
        }
      }

      const durationMs = (event.end ? event.end.getTime() : event.start.getTime() + 3600000) - event.start.getTime();
      const newStart = new Date(day);
      newStart.setHours(hour, minute, 0, 0);
      const newEnd = new Date(newStart.getTime() + durationMs);

      onUpdateEvent(item.id, item.id, item.spaceId, {
        startDate: format(newStart, "yyyy-MM-dd'T'HH:mm"),
        endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm")
      });

      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      draggedItem: monitor.getItem()
    })
  });

  const setDropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  return (
    <div
      ref={setDropRef}
      style={{ height: `${hourHeight}px` }}
      className={`border-t border-divider hover:bg-default-50/50 cursor-crosshair relative ${isOver ? 'bg-primary/10' : ''}`}
      onMouseDown={() => {
        const d = new Date(day);
        d.setHours(hour, 0, 0, 0);
        onStartSelection(d);
      }}
      onMouseEnter={() => {
        const d = new Date(day);
        d.setHours(hour, 0, 0, 0);
        onUpdateSelection(d);
      }}
      onMouseLeave={() => {
        setDropPosition(null);
      }}
    >
      {/* Smooth snapping ghost */}
      {isOver && dropPosition !== null && draggedItem && (() => {
        // Calculate event duration in minutes
        const durationMinutes = draggedItem.end
          ? (new Date(draggedItem.end).getTime() - new Date(draggedItem.start).getTime()) / (1000 * 60)
          : 60;

        // Calculate height based on duration and hourHeight (for zoom support)
        const ghostHeight = durationMinutes * (hourHeight / 60);

        return (
          <div
            className="absolute left-1 right-1 bg-primary/50 border-2 border-primary rounded pointer-events-none z-50 shadow-lg transition-all duration-100 ease-out"
            style={{
              top: `${(dropPosition / 60) * hourHeight}px`,
              height: `${ghostHeight}px`
            }}
          >
            <div className="text-[10px] font-bold text-white px-2 py-1 bg-primary/80 rounded-t">
              {hour}:{dropPosition.toString().padStart(2, '0')}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function DraggableTimelineEvent({ event, top, height, onUpdate, onNavigate, onHoverEvent, isHovered, onSelect }: any) {
  const [{ isDragging }, drag, preview] = useDrag({
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
      sourceSpaceTitle: event.sourceSpaceTitle
    },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  });

  // Suppress native drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();

    const startY = e.clientY;
    const startTime = direction === 'top' ? new Date(event.start) : (event.end || addMinutes(event.start, 60));

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // Convert pixels to minutes based on hourHeight
      // Assuming 60px per hour as base, adjust if needed
      const minutesPerPixel = 60 / 60; // 1 minute per pixel at base zoom
      const deltaMinutes = Math.round(deltaY * minutesPerPixel);

      // Snap to 15-minute intervals
      const snappedDeltaMinutes = Math.round(deltaMinutes / 15) * 15;

      if (direction === 'top') {
        const newStart = addMinutes(startTime, snappedDeltaMinutes);
        const currentEnd = event.end || addMinutes(event.start, 60);
        if (newStart < currentEnd) {
          onUpdate(event.id, { startDate: format(newStart, "yyyy-MM-dd'T'HH:mm") });
        }
      } else {
        const newEnd = addMinutes(startTime, snappedDeltaMinutes);
        const currentStart = new Date(event.start);
        if (newEnd > currentStart) {
          onUpdate(event.id, { endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm") });
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const setDragRef = useCallback((el: HTMLDivElement | null) => {
    drag(el);
  }, [drag]);

  return (
    <div
      ref={setDragRef}
      className={`absolute left-1 right-1 rounded bg-primary text-white p-2 text-xs shadow-md z-20 overflow-hidden cursor-grab active:cursor-grabbing group calendar-event-item ${isDragging ? 'opacity-50' : ''} ${isHovered ? 'ring-2 ring-primary-300' : ''}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onMouseEnter={() => onHoverEvent && onHoverEvent(event.id)}
      onMouseLeave={() => onHoverEvent && onHoverEvent(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(event.id, { x: e.clientX, y: e.clientY });
        else if (onNavigate) onNavigate(event.sourceSpaceId, event.sourceSpaceTitle);
      }}
    >
      {/* Top Resizer Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/20 flex items-center justify-center transition-all z-20"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        title="Drag to resize start time"
      >
        <div className="w-8 h-0.5 bg-white/60 rounded-full" />
      </div>

      <div className="flex justify-between items-start gap-1 pt-1">
        <div className="font-bold truncate flex-1">{event.metadata?.title}</div>
        <GripVertical size={12} className="opacity-40 shrink-0" />
      </div>
      <div className="opacity-80 text-[10px]">{format(event.start, 'HH:mm')} - {event.end ? format(event.end, 'HH:mm') : ''}</div>

      {/* Vertical Resizer Handle (Bottom) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/20 flex items-center justify-center transition-all z-20"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        title="Drag to resize end time"
      >
        <div className="w-8 h-0.5 bg-white/60 rounded-full" />
      </div>
    </div>
  );
}