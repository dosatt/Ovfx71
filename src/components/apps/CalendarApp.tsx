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
  ExternalLink,
  Layout,
  X,
  Copy,
  Check,
  Users,
  Tag,
  Timer,
  Circle
} from 'lucide-react';
import { PageEditor } from '../spaces/PageEditor';
import { useDrag, useDrop, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { SortableListItem } from './SortableListItem';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeekShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type CalendarView = 'month' | 'week' | 'day' | 'year' | 'list' | 'ndays' | 'timeline';

// ===== CALENDAR EVENT TYPES =====
type CalendarEventType = 'event' | 'task' | 'timeblock' | 'meeting' | 'deadline';

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  count?: number;
  byDay?: number[]; // 1=Mon..7=Sun
}

interface EventReminder {
  type: 'notification' | 'email';
  offsetMinutes: number; // negative = before event
}

interface CustomProperty {
  key: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'checkbox' | 'date' | 'url';
}

interface EventLabel {
  text: string;
  color: string;
}

interface CalendarEventMetadata {
  // Core (existing)
  startDate: string;
  endDate: string;
  title: string;
  infoSpaceId?: string;
  displayMode?: 'card' | 'compact' | 'minimal';
  updatedAt: number;

  // New fields
  eventType: CalendarEventType;
  isCompleted?: boolean; // For tasks

  // WIP fields
  timezone?: string;
  location?: string;
  locationCoords?: { lat: number; lng: number };
  attendees?: string[];

  // Reminders & Recurrence
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;

  // Custom properties & Labels
  customProperties?: CustomProperty[];
  labels?: EventLabel[];

  // Project link
  projectId?: string;
}


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
  isSelected: boolean;
  onOpenDrawer?: (event: any) => void;
  onSelect?: (id: string | null, anchor?: { x: number; y: number; elementCenterX?: number }, mouseEvent?: React.MouseEvent) => void;
}

interface DraggableMultiDayEventProps extends Omit<DraggableEventProps, 'onNavigate'> {
  startCol: number;
  colSpan: number;
  row: number;
  isStart: boolean;
  isEnd: boolean;
  onHoverDateChange?: (date: Date | null) => void;
}

function DraggableCalendarEvent({ event, onUpdate, onNavigate, onDragEnd, onHoverEvent, isHovered, isSelected, onSelect, onOpenDrawer }: DraggableEventProps) {
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
        ${isHovered || isSelected ? 'ring-2 ring-primary bg-primary/20 shadow-md' : 'border-l-2 border-primary'}
        ${isDragging ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}
        ${isSelected ? 'z-[60]' : ''}
      `}
      onMouseEnter={() => onHoverEvent(event.id)}
      onMouseLeave={() => onHoverEvent(null)}
      title={`${event.metadata?.title || 'Event'}`}
      data-event-id={event.id}
      onMouseDown={(e) => {
        if (e.shiftKey) {
          // Don't stop propagation so marquee can start
          return;
        }
        e.stopPropagation();
      }}
      onClick={(e) => {
        if (e.shiftKey) return;
        e.stopPropagation();
        if (onSelect) onSelect(event.id, { x: e.clientX, y: e.clientY });
        else onNavigate(event.sourceSpaceId, event.sourceSpaceTitle);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onOpenDrawer) onOpenDrawer(event);
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
  onSelect: (id: string | null, anchor?: { x: number; y: number; elementCenterX?: number }, mouseEvent?: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent, eventId: string) => void;
  onOpenDrawer: (event: any) => void;
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
  onContextMenu,
  onDragEnd,
  eventHeight = 24,
  topOffset = 26,
  onHoverEvent,
  isHovered,
  onOpenDrawer
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

  // Extract event type info
  const eventType = event.metadata?.eventType || 'event';
  const isCompleted = event.metadata?.isCompleted || false;
  const labels = event.metadata?.labels || [];

  // Get type-specific styles
  const getTypeStyles = () => {
    switch (eventType) {
      case 'task':
        return isCompleted ? 'bg-success/20 text-success-700' : 'bg-primary/15 text-primary-700';
      case 'timeblock':
        return 'bg-default-200/50 text-default-600 border-dashed';
      case 'meeting':
        return 'bg-secondary/15 text-secondary-700';
      case 'deadline':
        return 'bg-danger/15 text-danger-700 border-l-4 border-l-danger';
      default:
        return 'bg-primary/15 text-primary-700';
    }
  };

  const eventContent = (
    <div
      ref={setRefs}
      style={{
        left: `calc(${(Math.max(0, startCol) / 7) * 100}% + 2px)`,
        width: `calc(${(colSpan / 7) * 100}% - 4px)`,
        top: `${topOffset + row * eventHeight}px`,
        height: `${eventHeight}px`,
        position: 'absolute',
        zIndex: isResizing || isSelected ? 35 : 20,
        transition: isResizing ? 'none' : 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'hidden',
        opacity: isResizing ? 0.05 : (eventType === 'timeblock' ? 0.6 : 1),
        boxShadow: isSelected ? '0 0 0 2px #3b82f6' : undefined,
      }}
      className={`
        text-[10px] px-1.5 rounded-sm truncate select-none shadow-sm
        flex items-center gap-1 group calendar-event-item
        ${isResizing ? 'bg-primary/5 ring-1 ring-primary/10' : getTypeStyles()}
        ${isSelected ? 'z-[110]' : ''}
        ${isHovered && !isSelected && !isResizing ? 'ring-2 ring-primary/50' : ''}
        ${isStart ? 'rounded-l' : ''}
        ${isEnd ? 'rounded-r' : ''}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${eventType !== 'deadline' && isStart ? 'border-l-2 border-primary' : ''}
        ${isCompleted ? 'line-through opacity-60' : ''}
      `}
      onMouseEnter={() => onHoverEvent(event.id)}
      onMouseLeave={() => onHoverEvent(null)}
      data-event-id={event.id}
      onMouseDown={(e) => {
        if (e.shiftKey) return;
        e.stopPropagation();
      }}
      onClick={(e) => {
        if (e.shiftKey) return;
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        onSelect(event.id, { x: e.clientX, y: e.clientY, elementCenterX }, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenDrawer(event);
      }}
      onContextMenu={(e) => {
        if (onContextMenu) onContextMenu(e, event.id);
      }}
    >
      {/* Labels in corner */}
      {labels.length > 0 && isEnd && (
        <div className="absolute top-0 right-0 flex">
          {labels.slice(0, 2).map((label: EventLabel, idx: number) => (
            <div
              key={idx}
              className="w-3 h-full"
              style={{
                backgroundColor: label.color,
                clipPath: idx === 0 ? 'polygon(100% 0, 0 100%, 100% 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              }}
              title={label.text}
            />
          ))}
        </div>
      )}

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

      {/* Task checkbox */}
      {isStart && eventType === 'task' && (
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${isCompleted ? 'bg-success border-success' : 'border-primary hover:bg-primary/20'}`}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(event.id, { isCompleted: !isCompleted });
          }}
        >
          {isCompleted && <Check size={8} className="text-white" />}
        </div>
      )}

      {/* Meeting icon */}
      {isStart && eventType === 'meeting' && eventHeight > 16 && (
        <Users size={10} className="shrink-0 opacity-70" />
      )}

      {/* Timeblock icon */}
      {isStart && eventType === 'timeblock' && eventHeight > 16 && (
        <Timer size={10} className="shrink-0 opacity-50" />
      )}

      {isStart && eventHeight > 16 && eventType !== 'task' && eventType !== 'meeting' && eventType !== 'timeblock' && (
        <GripVertical size={10} className="opacity-0 group-hover:opacity-40 shrink-0" />
      )}

      {eventHeight > 10 && (
        <span className={`truncate flex-1 font-medium ${isCompleted ? 'line-through' : ''}`}>
          {event.metadata?.title || 'Untitled'}
        </span>
      )}

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
  onStartSelection: (date: Date, mousePos?: { x: number, y: number }) => void;
  onUpdateSelection: (date: Date) => void;
  onUpdateEvent: (eventId: string, blockId: string, spaceId: string, updates: any) => void;
  onNavigate: (sid: string, title: string) => void;
  allEvents: any[];
  renderEvents?: boolean;
  onDragEnter?: (date: Date, item: any) => void;
  onDragLeave?: () => void;
  isAnyDragging?: boolean;
  onOpenDrawer?: (event: any) => void;
  hoveredEventId: string | null;
  setHoveredEventId: (id: string | null) => void;
  selectedEventIds: Set<string>;
  selectedEventId: string | null;
  handleToggleEventSelection: (id: string | null, anchor?: { x: number; y: number; elementCenterX?: number }, mouseEvent?: React.MouseEvent) => void;
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
  onDragLeave,
  isAnyDragging,
  onOpenDrawer,
  hoveredEventId,
  setHoveredEventId,
  selectedEventIds,
  selectedEventId,
  handleToggleEventSelection
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
        if (e.button !== 0 || isAnyDragging) return;
        if (e.shiftKey) return;
        // Don't start cell selection if we're clicking an event or resizing
        if ((e.target as HTMLElement).closest('.calendar-event-item')) return;

        const dragDate = new Date(day);
        dragDate.setHours(9, 0, 0, 0);
        onStartSelection(dragDate, { x: e.clientX, y: e.clientY });
      }}
      onMouseEnter={() => {
        if (isAnyDragging) return;
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
            isHovered={hoveredEventId === event.id}
            onHoverEvent={setHoveredEventId}
            isSelected={selectedEventIds.has(event.id) || selectedEventId === event.id}
            onSelect={handleToggleEventSelection}
            onOpenDrawer={onOpenDrawer}
          />
        ))}
      </div>
      {/* Free selection zone at bottom of cell */}
      <div className="flex-1 min-h-[20px]" />
    </div>
  );
});

interface MonthWeekRowProps {
  weekStart: Date;
  events: any[];
  allEvents: any[];
  resizingEvent?: any;
  currentMonth: Date;
  selectionRange: { start: Date; end: Date } | null;
  selectedEventId: string | null;
  selectedEventIds: Set<string>;
  onSelectEvent: (id: string | null, anchor?: { x: number, y: number; elementCenterX?: number }, mouseEvent?: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent, eventId: string) => void;
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
  isAnyDragging?: boolean;
  onOpenDrawer: (event: any) => void;
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
  selectedEventIds,
  onSelectEvent,
  onContextMenu,
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
  onHoverEvent,
  isAnyDragging,
  onOpenDrawer
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
                isAnyDragging={isAnyDragging}
                onOpenDrawer={onOpenDrawer}
                hoveredEventId={hoveredEventId}
                setHoveredEventId={onHoverEvent}
                selectedEventIds={selectedEventIds}
                selectedEventId={selectedEventId}
                handleToggleEventSelection={onSelectEvent}
              />
            </div>
          );
        })}
      </div>

      {/* Events Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {layout.map((item, idx) => (
          <div key={`${item.event.id}-${weekStart.getTime()}-${idx}`} className="pointer-events-auto">
            <DraggableMultiDayEvent
              {...item}
              onUpdate={(id, updates) => onUpdateEvent(id, item.event.id, item.event.sourceSpaceId, updates)}
              onHoverDateChange={onHoverDateChange}
              isResizing={activeResize?.id === item.event.id}
              onActiveResizeChange={onActiveResizeChange}
              isSelected={selectedEventId === item.event.id || selectedEventIds.has(item.event.id)}
              onSelect={onSelectEvent}
              onContextMenu={onContextMenu}
              onOpenDrawer={onOpenDrawer}
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
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('calendar_current_view');
      if (saved && ['month', 'week', 'day', 'ndays', 'year', 'list'].includes(saved)) {
        return saved as CalendarView;
      }
    }
    return 'month';
  });

  const [nDays, setNDays] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('calendar_n_days');
      if (saved) return parseInt(saved, 10);
    }
    return 3;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calendar_n_days', nDays.toString());
    }
  }, [nDays]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calendar_current_view', view);
    }
  }, [view]);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Zoom state for week/day views
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Selection/Drag state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: Date; end: Date } | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number; elementCenterX?: number } | null>(null);
  const [hoveredResizeDate, setHoveredResizeDate] = useState<Date | null>(null);
  const [activeResize, setActiveResize] = useState<{ id: string, direction: 'left' | 'right', offset: number } | null>(null);

  // List View State
  const [listSearch, setListSearch] = useState('');
  const [listSort, setListSort] = useState<'date-asc' | 'date-desc' | 'title-asc' | 'title-desc' | 'manual'>('date-asc');
  const [manualOrderIDs, setManualOrderIDs] = useState<string[]>([]);
  const [savedOrders, setSavedOrders] = useState<Record<string, string[]>>(() => {
    if (typeof localStorage !== 'undefined') {
      const s = localStorage.getItem('calendar_saved_orders');
      return s ? JSON.parse(s) : {};
    }
    return {};
  });
  const [activeOrderName, setActiveOrderName] = useState<string>('');
  const [filterSpaceId, setFilterSpaceId] = useState<string>('all');

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calendar_saved_orders', JSON.stringify(savedOrders));
    }
  }, [savedOrders]);


  const [dragGhostDate, setDragGhostDate] = useState<Date | null>(null);
  const [dragGhostItem, setDragGhostItem] = useState<any | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [editPopoverAnchor, setEditPopoverAnchor] = useState<{ x: number, y: number; elementCenterX?: number } | null>(null);

  // Multi-selection state
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [lastSelectedEventId, setLastSelectedEventId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Marquee Selection State
  const [marqueeRect, setMarqueeRect] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const isMarqueeSelecting = !!marqueeRect;
  const marqueeRef = useRef<HTMLDivElement>(null);
  const wasMarqueeRef = useRef(false);



  // New event state
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    spaceId: '',
    eventType: 'event' as CalendarEventType,
    labels: [] as EventLabel[]
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Refs for auto-saving on outside click and stable interaction logic
  const newEventRef = useRef(newEvent);
  const popoverAnchorRef = useRef<{ x: number; y: number; elementCenterX?: number } | null>(null);
  const editPopoverAnchorRef = useRef<{ x: number; y: number; elementCenterX?: number } | null>(null);
  const selectionRangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const handleCreateEventRef = useRef<() => void>(() => { });

  useEffect(() => { newEventRef.current = newEvent; }, [newEvent]);
  useEffect(() => { popoverAnchorRef.current = popoverAnchor; }, [popoverAnchor]);
  useEffect(() => { editPopoverAnchorRef.current = editPopoverAnchor; }, [editPopoverAnchor]);
  useEffect(() => { selectionRangeRef.current = selectionRange; }, [selectionRange]);

  const popoverRef = useRef<HTMLDivElement>(null);
  const editPopoverRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<{
    scrollTop: number;
    mouseY: number;
    timeAtMouse: number;
    scrollLeftAdjustment?: number;
    trigger?: 'left' | 'right';
  } | null>(null);

  // Calculate dynamic hour height based on viewport and zoom
  const baseHourHeight = useMemo(() => {
    if (!viewportHeight || viewportHeight === 0) return 60; // fallback
    const availableHeight = viewportHeight - 40; // minus header
    return availableHeight / 24; // fit 24 hours in viewport
  }, [viewportHeight]);

  const hourHeight = Math.floor(baseHourHeight * zoomLevel);

  const { isAnyDraggingGlobal } = useDragLayer(monitor => ({
    isAnyDraggingGlobal: monitor.isDragging() && monitor.getItemType() === 'CALENDAR_EVENT'
  }));

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
  }, [view, containerRef]);

  // Horizontal Scroll Logic
  // Scroll horizontal logic with native scroll + virtualization
  // Scroll horizontal logic with native scroll + virtualization
  const skipScrollEvent = useRef(false);

  // Marquee Handlers
  const handleMarqueeMouseDown = (e: React.MouseEvent) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMarqueeRect({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top
    });
  };

  const handleMarqueeMouseMove = (e: React.MouseEvent) => {
    if (!marqueeRect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setMarqueeRect(prev => prev ? { ...prev, currentX, currentY } : null);

    // Calculate selection in real-time
    const container = e.currentTarget;
    const eventElements = container.querySelectorAll('.calendar-event-item');
    const newSelectedIds = new Set<string>();

    const mLeft = Math.min(marqueeRect.startX, currentX);
    const mTop = Math.min(marqueeRect.startY, currentY);
    const mWidth = Math.abs(marqueeRect.startX - currentX);
    const mHeight = Math.abs(marqueeRect.startY - currentY);
    const mRight = mLeft + mWidth;
    const mBottom = mTop + mHeight;

    const isLeftToRight = currentX >= marqueeRect.startX;

    // Convert relative marquee to screen coords for simple getBoundingClientRect comparison
    const containerRect = container.getBoundingClientRect();
    const screenM = {
      left: mLeft + containerRect.left,
      top: mTop + containerRect.top,
      right: mRight + containerRect.left,
      bottom: mBottom + containerRect.top
    };

    eventElements.forEach((el: any) => {
      const elRect = el.getBoundingClientRect();
      const id = el.getAttribute('data-event-id') || el.closest('[data-event-id]')?.getAttribute('data-event-id');
      if (!id) return;

      if (isLeftToRight) {
        // Selection by intersection (touches)
        const intersects = !(elRect.left > screenM.right ||
          elRect.right < screenM.left ||
          elRect.top > screenM.bottom ||
          elRect.bottom < screenM.top);
        if (intersects) newSelectedIds.add(id);
      } else {
        // Selection by inclusion (fully inside)
        const included = (elRect.left >= screenM.left &&
          elRect.right <= screenM.right &&
          elRect.top >= screenM.top &&
          elRect.bottom <= screenM.bottom);
        if (included) newSelectedIds.add(id);
      }
    });

    setSelectedEventIds(newSelectedIds);
  };

  const handleMarqueeMouseUp = () => {
    if (marqueeRect && (Math.abs(marqueeRect.startX - marqueeRect.currentX) > 2 || Math.abs(marqueeRect.startY - marqueeRect.currentY) > 2)) {
      wasMarqueeRef.current = true;
      setTimeout(() => { wasMarqueeRef.current = false; }, 100);
    }
    setMarqueeRect(null);
  };

  // Sync header scroll with body scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!containerRef) return;
    if (skipScrollEvent.current) return;

    // Prevent date shifts during drag OR if a shift is already pending
    if (isAnyDraggingGlobal || pendingScrollRef.current) {
      // Still sync header scroll though - REMOVED (using sticky)
      // if (headerRef.current.scrollLeft !== e.currentTarget.scrollLeft) {
      //   headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
      // }
      return;
    }

    // Sync header X scroll logic removed (using sticky positioning now)


    // Infinite scroll logic
    // Only for week/ndays view
    if (view !== 'week' && view !== 'ndays') return;

    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    const n = view === 'week' ? 7 : nDays;

    // We can calculate colWidth dynamically
    const colWidth = clientWidth / n;

    // Threshold to load more: 3 columns approx
    const threshold = colWidth * 3;

    // We shift by 28 days (4 weeks) at a time to keep it stable and handle momentum
    const SHIFT_DAYS = 28;

    if (scrollLeft < threshold) {
      const pxToShift = SHIFT_DAYS * colWidth;

      pendingScrollRef.current = {
        scrollTop: container.scrollTop,
        mouseY: 0,
        timeAtMouse: 0,
        scrollLeftAdjustment: pxToShift, // Positive means we added content to left, so we need to scroll right
        trigger: 'left'
      };

      setCurrentDate(prev => subDays(prev, SHIFT_DAYS));
    } else if (scrollWidth - (scrollLeft + clientWidth) < threshold) {
      const pxToShift = SHIFT_DAYS * colWidth;

      pendingScrollRef.current = {
        scrollTop: container.scrollTop,
        mouseY: 0,
        timeAtMouse: 0,
        scrollLeftAdjustment: -pxToShift, // Negative means we removed content from left (shifted window right), so we scroll left
        trigger: 'right'
      };

      setCurrentDate(prev => addDays(prev, SHIFT_DAYS));
    }

  }, [view, nDays, containerRef]);

  // Handle pending scroll adjustments (Vertical Zoom OR Horizontal Infinite Shift)
  useLayoutEffect(() => {
    if (!pendingScrollRef.current || !containerRef) return;

    // Handle Horizontal Shift
    if (pendingScrollRef.current.scrollLeftAdjustment !== undefined && pendingScrollRef.current.scrollLeftAdjustment !== 0) {
      const adj = pendingScrollRef.current.scrollLeftAdjustment;
      containerRef.scrollLeft += adj;

      // Restore vertical scroll position which browser usually resets when content changes
      if (pendingScrollRef.current.scrollTop !== undefined) {
        containerRef.scrollTop = pendingScrollRef.current.scrollTop;
      }



      pendingScrollRef.current = null;
      return;
    }

    // Handle Vertical Zoom (from previous code)
    if (pendingScrollRef.current.timeAtMouse) {
      const { mouseY, timeAtMouse } = pendingScrollRef.current;
      const HEADER_HEIGHT = 40;
      const currentHourHeight = Math.floor(baseHourHeight * zoomLevel);
      const newAbsoluteY = (timeAtMouse * currentHourHeight) + HEADER_HEIGHT;
      const newScrollTop = newAbsoluteY - mouseY;
      containerRef.scrollTop = Math.max(0, newScrollTop);
    }

    pendingScrollRef.current = null;
  }, [zoomLevel, baseHourHeight, currentDate]);

  // Initialize scroll position when view changes to Center the buffer
  useLayoutEffect(() => {
    if ((view === 'week' || view === 'ndays') && containerRef && containerRef.clientWidth) {
      // Use clientWidth to calculate column width
      const n = view === 'week' ? 7 : nDays;
      const colWidth = containerRef.clientWidth / n;
      const BUFFER = 60;

      const initialScroll = BUFFER * colWidth;
      containerRef.scrollLeft = initialScroll;


    }
  }, [view, nDays, containerRef]);

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

        const container = containerRef;
        if (!container) return;

        // Get container bounds
        const rect = container.getBoundingClientRect();

        // Mouse position relative to the scrollable content area
        const mouseY = e.clientY - rect.top;

        // Current scroll position
        const scrollTop = container.scrollTop;

        // Absolute Y position in the content (accounting for scroll)
        const absoluteY = scrollTop + mouseY;

        // Current hour height
        const currentHourHeight = baseHourHeight * zoomLevel;

        // Which "time" (in hours) is at the mouse position
        // Note: We need to account for the 40px header in Day/Week views
        const HEADER_HEIGHT = 40;
        const timeAtMouse = (absoluteY - HEADER_HEIGHT) / currentHourHeight;

        // Calculate new zoom level
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));

        // Only proceed if zoom actually changed
        if (newZoom === zoomLevel) return;

        // Store scroll adjustment info for useEffect
        pendingScrollRef.current = {
          scrollTop,
          mouseY,
          timeAtMouse
        };

        // Update zoom level (triggers useEffect)
        setZoomLevel(newZoom);
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
  }, [view, containerRef, baseHourHeight, zoomLevel, handleZoom]);


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

  // Global interaction listener for auto-save/destroy
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      const currentPopoverAnchor = popoverAnchorRef.current;
      const currentEditPopoverAnchor = editPopoverAnchorRef.current;

      // Always let contextmenu events on calendar items propagate to local handlers
      if (e.type === 'contextmenu' && target.closest('.calendar-event-item')) {
        return;
      }

      // If no popover is open, we only care about clearing ghosts
      if (!currentPopoverAnchor && !currentEditPopoverAnchor) {
        setDragGhostDate(null);
        setDragGhostItem(null);
        return;
      }

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

      // On scroll, only close element popover (not creation popover which should follow)
      if (e.type === 'scroll') {
        if (currentEditPopoverAnchor) {
          setEditPopoverAnchor(null);
          setSelectedEventId(null);
        }
        return;
      }

      // Handle outside interactions
      if (currentPopoverAnchor || currentEditPopoverAnchor) {
        // If clicking or right-clicking on an event item, let that handler deal with it
        if (target.closest('.calendar-event-item')) return;

        if (currentPopoverAnchor) {
          // Cancel creation on outside click - don't auto-save
          setSelectionRange(null);
          setPopoverAnchor(null);
        }

        if (currentEditPopoverAnchor) {
          setEditPopoverAnchor(null);
          setSelectedEventId(null);
        }
      }

      setDragGhostDate(null);
      setDragGhostItem(null);
    };

    const options = { capture: true, passive: true };
    window.addEventListener('pointerdown', handleInteraction, { capture: true });
    window.addEventListener('scroll', handleInteraction, options);
    window.addEventListener('wheel', handleInteraction, options);
    window.addEventListener('dragstart', handleInteraction, options);
    window.addEventListener('contextmenu', handleInteraction, { capture: true });

    return () => {
      window.removeEventListener('pointerdown', handleInteraction, { capture: true });
      window.removeEventListener('scroll', handleInteraction, options);
      window.removeEventListener('wheel', handleInteraction, options);
      window.removeEventListener('dragstart', handleInteraction, options);
      window.removeEventListener('contextmenu', handleInteraction, { capture: true });
    };
  }, []); // Stable effect

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
    const seenIds = new Set<string>(); // Deduplicate by block ID
    spacesState.spaces.forEach((space: any) => {
      if (filterSpaceId !== 'all' && space.id !== filterSpaceId) return;
      if (space.content?.blocks) {
        space.content.blocks.forEach((block: any) => {
          // Skip if already seen (prevents duplicates)
          if (seenIds.has(block.id)) return;
          seenIds.add(block.id);

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
  }, [spacesState.spaces, filterSpaceId]);

  // --- List View Logic (Moved to here to be after allEvents definition) ---
  const filteredListEvents = useMemo(() => {
    return allEvents.filter(e => {
      const text = (e.metadata?.title || '') + ' ' + (e.metadata?.notes || '');
      return text.toLowerCase().includes(listSearch.toLowerCase());
    });
  }, [allEvents, listSearch]);

  const sortedListEvents = useMemo(() => {
    const list = [...filteredListEvents];
    return list.sort((a, b) => {
      if (listSort === 'manual') {
        const idxA = manualOrderIDs.indexOf(a.id);
        const idxB = manualOrderIDs.indexOf(b.id);
        // If both unknown, sort by date? Or keep stable?
        if (idxA === -1 && idxB === -1) return new Date(a.start).getTime() - new Date(b.start).getTime();
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      }
      if (listSort === 'date-asc') return new Date(a.start).getTime() - new Date(b.start).getTime();
      if (listSort === 'date-desc') return new Date(b.start).getTime() - new Date(a.start).getTime();
      if (listSort === 'title-asc') return (a.metadata?.title || '').localeCompare(b.metadata?.title || '');
      return (b.metadata?.title || '').localeCompare(a.metadata?.title || '');
    });
  }, [filteredListEvents, listSort, manualOrderIDs]);

  const moveListItem = useCallback((dragIndex: number, hoverIndex: number) => {
    const newSorted = [...sortedListEvents];
    const [moved] = newSorted.splice(dragIndex, 1);
    newSorted.splice(hoverIndex, 0, moved);
    setManualOrderIDs(newSorted.map(e => e.id));
  }, [sortedListEvents]);

  const prevPeriod = useCallback(() => {
    setCurrentDate(prev => {
      let nextDate = prev;
      if (view === 'month') nextDate = subMonths(prev, 1);
      else if (view === 'week') nextDate = subWeeks(prev, 1);
      else if (view === 'day') nextDate = subDays(prev, 1);
      else if (view === 'ndays') nextDate = subDays(prev, nDays);
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
      else if (view === 'ndays') nextDate = addDays(prev, nDays);
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
  // Scroll to "today" or current month on mount/view change
  useLayoutEffect(() => {
    if (!containerRef) return;

    if (view === 'month') {
      const today = new Date();
      const todayWeek = startOfWeek(today, { weekStartsOn: 1 });
      const weekElement = containerRef.querySelector(`[data-week="${todayWeek.getTime()}"]`);
      if (weekElement) {
        weekElement.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    } else if (['week', 'day', 'ndays'].includes(view)) {
      // Horizontal Scroll for Week/NDays (renderHorizontalGrid with Buffer of 60)
      if (view === 'week' || view === 'ndays') {
        const n = view === 'week' ? 7 : nDays;
        // BUFFER = 60. Visible area covers 'n' days. Scroll matching 60 days width.
        if (containerRef.clientWidth) {
          containerRef.scrollLeft = (60 / n) * containerRef.clientWidth;
        }
      }

      // Horizontal Scroll for Week/NDays
      if (view === 'week' || view === 'ndays') {
        const n = view === 'week' ? 7 : nDays;
        // Buffer is 60. Total days = n + 120.
        const totalDays = n + 120;
        if (containerRef.scrollWidth) {
          const trackWidth = containerRef.scrollWidth;
          const dayWidth = (trackWidth - 60) / totalDays;
          const targetScrollLeft = 60 * dayWidth;
          containerRef.scrollTo({ left: targetScrollLeft, behavior: 'instant' });
        }
      }

      // Scroll to current time (1 hour before current hour for context)
      const now = new Date();
      const currentHour = now.getHours();
      const targetScroll = Math.max(0, (currentHour - 1) * hourHeight);
      containerRef.scrollTo({ top: targetScroll, behavior: 'instant' });
    }
  }, [containerRef, view, hourHeight, nDays]);



  const handleCreateEvent = useCallback(() => {
    // We now allow 'New' as fallback title
    const finalTitle = newEvent.title || 'New';

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

    // Create Info space for the event - this is a REAL page/space
    const infoSpace = spacesStateRef.current.createSpace('page');
    spacesStateRef.current.updateSpace(infoSpace.id, {
      title: `${finalTitle} - Info`,
      content: { blocks: [] },
      icon: 'Calendar',
      iconColor: '#FF5F56',
      metadata: { isInfo: true, eventId: '', isHidden: true, isCalendarElement: true } // Hid from sidebar, linked to event
    });

    const targetSpace = spacesStateRef.current.getSpace(targetSpaceId);
    if (targetSpace) {
      const newBlock = {
        id: `block_${Date.now()}`,
        type: 'calendar',
        content: '',
        metadata: {
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          title: finalTitle,
          infoSpaceId: infoSpace.id,
          displayMode: 'card',
          updatedAt: Date.now(),
          eventType: newEvent.eventType,
          isCompleted: false,
          labels: newEvent.labels || []
        }
      };

      // Back-link the Info space to the event
      spacesStateRef.current.updateSpace(infoSpace.id, {
        metadata: { ...infoSpace.metadata, eventId: newBlock.id }
      });

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
      spaceId: '',
      eventType: 'event' as CalendarEventType,
      labels: []
    });
  }, [newEvent, onClose]);

  // Update the ref to handleCreateEvent once defined
  useEffect(() => {
    handleCreateEventRef.current = handleCreateEvent;
  }, [handleCreateEvent]);

  const handleQuickCreate = useCallback(() => {
    // Allow 'New' default
    handleCreateEvent();
    setPopoverAnchor(null);
  }, [handleCreateEvent]);

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

    // If start === end (single click or single cell drag), ensure at least default duration
    let effectiveEnd = end;
    if (start.getTime() === end.getTime()) {
      if (view === 'month') {
        // For month view, single day is just start date (start == end).
        // Do NOT add a day, otherwise it spans 2 days (inclusive logic).
        effectiveEnd = end;
      } else {
        effectiveEnd = addMinutes(start, 60);
      }
    }

    // Calculate anchor position for popover
    let anchor: { x: number; y: number; elementCenterX?: number } | null = null;
    if (e && e.clientX !== undefined) {
      // Try to find the element center from the event target or selection
      let elementCenterX: number | undefined;

      // Try to get the element that was clicked/selected
      const target = e.target as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        elementCenterX = rect.left + rect.width / 2;
      }

      anchor = { x: e.clientX, y: e.clientY, elementCenterX };
    } else {
      // Fallback
      anchor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    // Reset new event data
    setNewEvent({
      title: '',
      startDate: format(start, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(effectiveEnd, "yyyy-MM-dd'T'HH:mm"),
      notes: '',
      spaceId: spacesStateRef.current.focusedSpaceId || (spacesStateRef.current.spaces[0]?.id || '')
    });

    setPopoverAnchor(anchor);
    if (dragTrackRef.current) prevDragTrackRef.current.isDragCreation = true;
    setIsSelecting(false);
    // Don't clear selectionRange here - we want the blue highlight to stay
    // while the user fills the popover fields.
  }, [isSelecting, setNewEvent, setPopoverAnchor, setIsSelecting, setSelectionRange, spacesStateRef]);

  const handleStartSelection = useCallback((date: Date, mousePos?: { x: number, y: number }) => {
    // If we're already selecting, finish that one first (safety)
    // Note: avoid calling handleEndSelectionStable directly if it's not defined yet,
    // but here we are reordering so it's fine.
    if (isSelecting) {
      setIsSelecting(false);
    }

    // Force close any existing popover
    if (popoverAnchorRef.current) {
      if (newEventRef.current.title) {
        handleCreateEventRef.current();
      }
      setPopoverAnchor(null);
    }
    setEditPopoverAnchor(null);
    setSelectedEventId(null);

    setIsSelecting(true);
    const newRange = { start: date, end: date };
    selectionRangeRef.current = newRange;
    setSelectionRange(newRange);

    // Initialize drag tracking immediately to ensure move/up correctly detect it
    if (mousePos) {
      dragTrackRef.current.mouseDownPos = mousePos;
    }
  }, [isSelecting, setSelectionRange, setIsSelecting, setPopoverAnchor, setEditPopoverAnchor, setSelectedEventId, newEventRef, handleCreateEventRef, popoverAnchorRef]);

  const handleUpdateSelection = useCallback((date: Date) => {
    if (!isSelecting) return;
    const newRange = selectionRangeRef.current ? { ...selectionRangeRef.current, end: date } : { start: date, end: date };
    selectionRangeRef.current = newRange;
    setSelectionRange(newRange);
  }, [isSelecting]);

  const handleUpdateEvent = useCallback((eventId: string, blockId: string, spaceId: string, updates: any) => {
    const space = spacesStateRef.current.spaces.find((s: any) => s.id === spaceId);
    if (!space) return;

    const blocks = [...(space.content?.blocks || [])];
    const blockIndex = blocks.findIndex((b: any) => b.id === blockId);
    if (blockIndex === -1) return;

    const oldMetadata = blocks[blockIndex].metadata;
    blocks[blockIndex] = {
      ...blocks[blockIndex],
      metadata: {
        ...oldMetadata,
        ...updates,
        updatedAt: Date.now() // Track for sort order
      }
    };

    spacesStateRef.current.updateSpace(spaceId, {
      content: { ...space.content, blocks }
    });

    // If title was updated, also update the linked info space title
    if (updates.title && oldMetadata?.infoSpaceId) {
      spacesStateRef.current.updateSpace(oldMetadata.infoSpaceId, {
        title: `${updates.title} - Info`
      });
    }
  }, []);

  // Handler for deleting multiple events
  const handleDeleteEvents = useCallback((eventIds: string[]) => {
    // Group events by source space for efficient batch updates
    const eventsBySpace = new Map<string, string[]>();

    eventIds.forEach(eventId => {
      const event = allEvents.find(e => e.id === eventId);
      if (event) {
        const existing = eventsBySpace.get(event.sourceSpaceId) || [];
        existing.push(eventId);
        eventsBySpace.set(event.sourceSpaceId, existing);

        // Delete associated info space
        if (event.metadata?.infoSpaceId) {
          spacesStateRef.current.deleteSpace(event.metadata.infoSpaceId);
        }
      }
    });

    // Update each space once with filtered blocks
    eventsBySpace.forEach((idsToDelete, spaceId) => {
      const space = spacesStateRef.current.spaces.find((s: any) => s.id === spaceId);
      if (space) {
        const blocks = space.content?.blocks.filter((b: any) => !idsToDelete.includes(b.id));
        spacesStateRef.current.updateSpace(spaceId, { content: { ...space.content, blocks } });
      }
    });

    setSelectedEventIds(new Set());
    setSelectedEventId(null);
    setEditPopoverAnchor(null);
    setContextMenu(null);
  }, [allEvents]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEventIds.size > 0) {
        // Prevent deletion if we are typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true' || target.closest('[contenteditable="true"]')) {
          return;
        }
        e.preventDefault();
        handleDeleteEvents(Array.from(selectedEventIds));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEventIds, handleDeleteEvents]);

  // Handler for duplicating multiple events
  const handleDuplicateEvents = useCallback((eventIds: string[]) => {
    eventIds.forEach(eventId => {
      const event = allEvents.find(e => e.id === eventId);
      if (!event) return;

      const space = spacesStateRef.current.spaces.find((s: any) => s.id === event.sourceSpaceId);
      if (!space) return;

      // Create new info space for duplicate
      const infoSpace = spacesStateRef.current.createSpace('page');
      spacesStateRef.current.updateSpace(infoSpace.id, {
        title: `${event.metadata?.title || 'Untitled'} (Copy) - Info`,
        content: { blocks: [] },
        icon: 'Calendar',
        iconColor: '#FF5F56',
        metadata: { isInfo: true, isHidden: true, isCalendarElement: true }
      });

      const newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'calendar',
        content: '',
        metadata: {
          ...event.metadata,
          title: `${event.metadata?.title || 'Untitled'} (Copy)`,
          infoSpaceId: infoSpace.id,
          updatedAt: Date.now()
        }
      };

      const updatedBlocks = [...(space.content?.blocks || []), newBlock];
      spacesStateRef.current.updateSpace(event.sourceSpaceId, {
        content: { ...space.content, blocks: updatedBlocks }
      });
    });

    setSelectedEventIds(new Set());
    setContextMenu(null);
  }, [allEvents]);

  // Handler for event clicks with multi-selection support
  const handleEventClick = useCallback((e: React.MouseEvent, eventId: string, anchor?: { x: number; y: number; elementCenterX?: number }) => {
    e.stopPropagation();

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isMultiSelectKey = isMac ? e.metaKey : e.ctrlKey;
    const isRangeSelectKey = e.shiftKey;

    // Close creation popover
    setPopoverAnchor(null);
    setIsSelecting(false);
    setSelectionRange(null);

    if (isMultiSelectKey) {
      // Toggle selection
      setSelectedEventIds(prev => {
        const next = new Set(prev);
        if (next.has(eventId)) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }
        return next;
      });
      setLastSelectedEventId(eventId);
      setSelectedEventId(null);
      setEditPopoverAnchor(null);
    } else if (isRangeSelectKey && lastSelectedEventId) {
      // Range selection based on current view sorting
      const sortedEvents = [...allEvents];

      if (view === 'list') {
        sortedEvents.sort((a, b) => {
          if (listSort === 'date-asc') return new Date(a.start).getTime() - new Date(b.start).getTime();
          if (listSort === 'date-desc') return new Date(b.start).getTime() - new Date(a.start).getTime();
          if (listSort === 'title-asc') return (a.metadata?.title || '').localeCompare(b.metadata?.title || '');
          return (b.metadata?.title || '').localeCompare(a.metadata?.title || '');
        });
      } else {
        sortedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      }

      const lastIdx = sortedEvents.findIndex(e => e.id === lastSelectedEventId);
      const currIdx = sortedEvents.findIndex(e => e.id === eventId);

      if (lastIdx !== -1 && currIdx !== -1) {
        const [fromIdx, toIdx] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
        const rangeIds = sortedEvents.slice(fromIdx, toIdx + 1).map(e => e.id);
        setSelectedEventIds(new Set(rangeIds));
      }
      setSelectedEventId(null);
      setEditPopoverAnchor(null);
    } else {
      // Single selection - show popover
      setSelectedEventIds(new Set([eventId]));
      setLastSelectedEventId(eventId);
      setSelectedEventId(eventId);
      if (anchor) setEditPopoverAnchor(anchor);
    }
  }, [allEvents, lastSelectedEventId, view, listSort]);

  // Handler for right-click context menu on events
  const handleEventContextMenu = useCallback((e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // If right-clicked event is not in selection, make it the only selection
    if (!selectedEventIds.has(eventId)) {
      setSelectedEventIds(new Set([eventId]));
      setLastSelectedEventId(eventId);
    }

    // Close single-select popover
    setSelectedEventId(null);
    setEditPopoverAnchor(null);

    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [selectedEventIds]);

  const dragTrackRef = useRef({ mouseDownPos: null as { x: number, y: number } | null, isDragCreation: false });
  // Helper ref to access current value in callbacks without recreating them if not needed, though dragTrackRef is stable.
  const prevDragTrackRef = dragTrackRef;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSelecting) {
          setIsSelecting(false);
          setSelectionRange(null);
        }
        if (popoverAnchor) {
          setPopoverAnchor(null);
        }
        if (selectedEventId) {
          setSelectedEventId(null);
          setEditPopoverAnchor(null);
        }
        if (activeResize) {
          setActiveResize(null);
        }
        // Clear multi-selection and context menu
        if (selectedEventIds.size > 0) {
          setSelectedEventIds(new Set());
        }
        if (contextMenu) {
          setContextMenu(null);
        }
      }
    };

    const handleGlobalMouseDown = (e: MouseEvent) => {
      // If we already started selecting via handleStartSelection, this track is already set.
      // But for clicks outside, we still need to capture it.
      if (isSelecting && e.button === 0 && !dragTrackRef.current.mouseDownPos) {
        dragTrackRef.current.mouseDownPos = { x: e.clientX, y: e.clientY };
      }

      const target = e.target as HTMLElement;
      if (isSelecting && containerRef && !containerRef.contains(target)) {
        setIsSelecting(false);
        setSelectionRange(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !dragTrackRef.current.mouseDownPos) return;

      const dx = Math.abs(e.clientX - dragTrackRef.current.mouseDownPos.x);
      const dy = Math.abs(e.clientY - dragTrackRef.current.mouseDownPos.y);

      if (dx > 5 || dy > 5) {
        const target = e.target as HTMLElement;
        const calendarContainer = containerRef;
        if (calendarContainer && (!calendarContainer.contains(target) || target.closest('.calendar-event-item'))) {
          setIsSelecting(false);
          setSelectionRange(null);
          dragTrackRef.current.mouseDownPos = null;
        }
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isSelecting) {
        handleEndSelectionStable(e);
      }
      dragTrackRef.current.mouseDownPos = null;
    };

    const handleDragStart = (e: DragEvent) => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionRange(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleGlobalMouseDown, { capture: true });
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleGlobalMouseDown, { capture: true });
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, [isSelecting, popoverAnchor, handleEndSelectionStable, selectedEventId, activeResize, containerRef]);

  // Keep ref-based anchors for interaction logic
  // Removed from here, moved to the top of the component body for hoisting safety


  const handleToggleEventSelection = useCallback((id: string | null, anchor?: { x: number, y: number; elementCenterX?: number }, mouseEvent?: React.MouseEvent) => {
    // Always close creation state when interacting with an existing element or clearing selection
    setPopoverAnchor(null);
    popoverAnchorRef.current = null;
    setIsSelecting(false);
    setSelectionRange(null);

    if (id && anchor && newEventRef.current.title) {
      handleCreateEventRef.current();
    }

    // Check for Ctrl/Cmd modifier for multi-selection
    if (mouseEvent && id) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isMultiSelectKey = isMac ? mouseEvent.metaKey : mouseEvent.ctrlKey;
      const isRangeSelectKey = mouseEvent.shiftKey;

      if (isMultiSelectKey) {
        // Toggle selection
        setSelectedEventIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        setLastSelectedEventId(id);
        setSelectedEventId(null);
        setEditPopoverAnchor(null);
        return;
      } else if (isRangeSelectKey && lastSelectedEventId) {
        // Range selection based on start time
        const sortedEvents = [...allEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
        const lastIdx = sortedEvents.findIndex(e => e.id === lastSelectedEventId);
        const currIdx = sortedEvents.findIndex(e => e.id === id);

        if (lastIdx !== -1 && currIdx !== -1) {
          const [fromIdx, toIdx] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
          const rangeIds = sortedEvents.slice(fromIdx, toIdx + 1).map(e => e.id);
          setSelectedEventIds(new Set(rangeIds));
        }
        setSelectedEventId(null);
        setEditPopoverAnchor(null);
        return;
      }
    }

    // Normal single selection
    if (id) {
      setSelectedEventIds(new Set([id]));
      setLastSelectedEventId(id);
    } else {
      setSelectedEventIds(new Set());
    }

    setSelectedEventId(id);
    if (anchor) setEditPopoverAnchor(anchor);
    else setEditPopoverAnchor(null);
  }, [allEvents, lastSelectedEventId]);

  const handleOpenDrawer = useCallback((event: any) => {
    setNewEvent({
      title: event.metadata?.title || '',
      startDate: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      endDate: event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm") : format(event.start, "yyyy-MM-dd'T'HH:mm"),
      notes: '',
      spaceId: event.sourceSpaceId
    });
    setEditingEventId(event.id);
    handleToggleEventSelection(null);
    onOpen();
  }, [handleToggleEventSelection, onOpen]);

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
    if (view === 'ndays') {
      const end = addDays(currentDate, nDays - 1);
      return `${format(currentDate, 'd MMM')} - ${format(end, 'd MMM yyyy')}`;
    }
    if (view === 'year') return `${currentDate.getFullYear()}`;
    if (view === 'list') return `List - ${format(currentDate, 'MMMM yyyy', { locale: enUS })}`;
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
          // If this click is the tail of a drag-creation, ignore it to prevent closing the popover immediately
          if (dragTrackRef.current.isDragCreation) {
            dragTrackRef.current.isDragCreation = false;
            return;
          }

          const target = e.target as HTMLElement;
          if (!target.closest('.calendar-event-item') && !wasMarqueeRef.current) {
            handleToggleEventSelection(null);
          }
        }}
        onScroll={(e) => {
          // Optional: Update currentDate based on visible month to sync header title
          // For now we keep header manually navigable or synced on start
        }}
      >
        {/* Sticky Day Headers */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-divider shadow-sm">
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
                  selectedEventIds={selectedEventIds}
                  onSelectEvent={handleToggleEventSelection}
                  onContextMenu={handleEventContextMenu}
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
                    if (!isAnyDraggingGlobal && !isSelecting) {
                      setHoveredEventId(id);
                    }
                  }}
                  isAnyDragging={isAnyDraggingGlobal}
                  onOpenDrawer={handleOpenDrawer}
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
        <div className="w-[60px] shrink-0 border-r border-divider bg-default-50/50 relative">
          <div className="h-[40px] sticky top-0 bg-default-50/50 z-10 border-b border-divider" />
          {hours.map(hour => (
            <div key={hour} style={{ height: `${hourHeight}px` }} className="px-1 relative border-t border-divider text-[10px] text-default-400">
              <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 bg-default-50 px-1 rounded-sm">
                {`${hour}:00`}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 relative flex flex-col shrink-0">
          <div className="h-[40px] flex items-center justify-center border-b border-divider sticky top-0 bg-white z-10 font-bold shrink-0">
            {format(currentDate, 'EEEE d MMMM', { locale: enUS })}
          </div>
          <div className="relative shrink-0 overflow-hidden" style={{ height: hourHeight * 24 }}>
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
                isAnyDragging={isAnyDraggingGlobal}
                isSelecting={isSelecting}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
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

            {calculateTimelineLayout(allEvents.filter(e => {
              const start = new Date(e.start);
              const end = e.end ? new Date(e.end) : addMinutes(start, 60);
              return isWithinInterval(currentDate, { start: startOfDay(start), end: endOfDay(end) });
            }), hourHeight, currentDate).map((item, idx) => (
              <DraggableTimelineEvent
                key={item.id || idx}
                event={item}
                top={item.layout.top}
                height={item.layout.height}
                left={item.layout.left}
                width={item.layout.width}
                onUpdate={(id: string, updates: any) => handleUpdateEvent(id, id, item.sourceSpaceId, updates)}
                onHoverEvent={(id: string | null) => {
                  if (!dragGhostItem && !isSelecting) {
                    setHoveredEventId(id);
                  }
                }}
                isHovered={hoveredEventId === item.id}
                onSelect={handleToggleEventSelection}
                onContextMenu={handleEventContextMenu}
                onOpenDrawer={handleOpenDrawer}
                hourHeight={hourHeight}
                isSelected={selectedEventId === item.id || selectedEventIds.has(item.id)}
              />
            ))}
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
                          if (e.button !== 0 || isAnyDraggingGlobal) return;
                          const d = new Date(day);
                          d.setHours(9, 0, 0, 0);
                          handleStartSelection(d, { x: e.clientX, y: e.clientY });
                        }}
                        onMouseEnter={() => {
                          if (!isSelecting || isAnyDraggingGlobal) return;
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

  const renderListView = () => {
    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex gap-2 p-4 border-b border-divider items-center shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-default-400" size={16} />
            <Input
              value={listSearch}
              onValueChange={setListSearch}
              placeholder="Search events..."
              className="w-full"
              classNames={{ inputWrapper: "pl-8" }}
              size="sm"
              variant="bordered"
            />
          </div>
          <Select
            selectedKeys={[listSort]}
            onChange={(e: any) => setListSort(e.target.value as any)}
            className="w-[160px] shrink-0"
            size="sm"
            variant="bordered"
            aria-label="Sort by"
            popoverProps={{ className: "min-w-[180px]" }}
          >
            <SelectItem key="date-asc">Date (Oldest)</SelectItem>
            <SelectItem key="date-desc">Date (Newest)</SelectItem>
            <SelectItem key="title-asc">Title (A-Z)</SelectItem>
            <SelectItem key="title-desc">Title (Z-A)</SelectItem>
            <SelectItem key="manual">Manual Order</SelectItem>
          </Select>

          {listSort === 'manual' && (
            <div className="flex gap-2 items-center">
              <Select
                placeholder="Load Order"
                selectedKeys={activeOrderName ? [activeOrderName] : []}
                onChange={(e: any) => {
                  const name = e.target.value;
                  if (name && savedOrders[name]) {
                    setActiveOrderName(name);
                    setManualOrderIDs(savedOrders[name]);
                  }
                }}
                className="w-[140px]"
                size="sm"
                variant="bordered"
                popoverProps={{ className: "min-w-[160px]" }}
              >
                {Object.keys(savedOrders).map(name => (
                  <SelectItem key={name}>{name}</SelectItem>
                ))}
              </Select>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  const name = prompt("Enter name for this order:", activeOrderName || "My Order");
                  if (name) {
                    setSavedOrders(prev => ({ ...prev, [name]: manualOrderIDs }));
                    setActiveOrderName(name);
                  }
                }}
              >
                Save
              </Button>
            </div>
          )}
        </div>

        {/* List Content - CSS Columns for responsive multi-column layout with vertical dividers */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
            {sortedListEvents.map((event, index) => (
              <SortableListItem
                key={event.id}
                index={index}
                event={event}
                moveItem={moveListItem}
                onSelect={(e: any) => handleToggleEventSelection(event.id, undefined, e)}
                isManual={listSort === 'manual'}
                isSelected={selectedEventId === event.id || selectedEventIds.has(event.id)}
                onContextMenu={(e: any) => handleEventContextMenu(e, event.id)}
              />
            ))}
            {sortedListEvents.length === 0 && (
              <div className="text-center text-default-400 py-10 w-full col-span-full">
                No events found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHorizontalGrid = (n: number) => {
    const BUFFER = 60;
    // Render: [-BUFFER ... -1, 0, 1 ... n-1, n ... n+BUFFER-1]
    const totalDays = n + (BUFFER * 2);
    const startOffset = -BUFFER;

    // Stable day generation
    const daysBuffer = Array.from({ length: totalDays }, (_, i) => addDays(startOfDay(currentDate), i + startOffset));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Total track width must include the sidebar (60px) plus the columns.
    // However, since columns are flex-1, we use containerWidthPct to scale them relative to viewport.
    const totalWidthPct = (totalDays / n) * 100;

    return (
      <div className="flex flex-col h-full bg-white relative overflow-hidden select-none">
        <div
          ref={setContainerRef}
          className="flex-1 overflow-auto relative no-scrollbar scroll-smooth overscroll-none"
          onScroll={handleScroll}
        >
          {/* Scrollable track with explicit width for sticky row bounds */}
          <div
            className="flex flex-col relative min-h-full"
            style={{ width: `${totalWidthPct}%`, minWidth: '100%' }}
          >
            {/* Header Row - Sticky Top */}
            <div className="sticky top-0 z-40 flex border-b border-divider bg-white shrink-0 h-[40px] w-full">
              {/* Corner */}
              <div
                className="w-[60px] shrink-0 border-r border-divider bg-default-50 sticky left-0 z-50 flex items-center justify-center font-bold text-[10px] text-default-400"
                style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
              >
                TIME
              </div>

              {/* Header Days */}
              <div className="flex-1 flex bg-white min-w-0">
                {daysBuffer.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.getTime()} className="flex-1 flex flex-col items-center justify-center border-r border-divider min-w-0 bg-white">
                      <span className="text-[10px] uppercase font-bold text-default-400 leading-none">{format(day, 'EEE', { locale: enUS })}</span>
                      <span className={`text-[13px] mt-0.5 ${isToday ? 'font-black text-primary' : 'font-bold text-default-800'}`}>{format(day, 'd')}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Body Sticky Row */}
            <div className="flex flex-1 relative bg-white min-h-0 overflow-visible" style={{ width: '100%' }}>
              {/* Sidebar - Sticky Left */}
              <div
                className="w-[60px] shrink-0 bg-default-50 border-r border-divider sticky left-0 z-40 pointer-events-none self-start flex flex-col"
                style={{
                  height: `${hourHeight * 24}px`,
                  transform: 'translate3d(0,0,0)',
                  willChange: 'transform'
                }}
              >
                {hours.map(hour => (
                  <div key={hour} style={{ height: `${hourHeight}px` }} className="px-1 relative border-t border-divider text-[10px] text-default-400 font-medium">
                    <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 bg-default-50 px-1 rounded-sm">
                      {`${hour}:00`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Columns Area - Explicitly flex to fill the remaining track width */}
              <div className="flex-1 flex min-w-0 h-full relative" style={{ width: `calc(100% - 60px)` }}>
                {daysBuffer.map((day, i) => {
                  const dayEvents = allEvents.filter(event => {
                    const eventStart = new Date(event.start);
                    const eventEnd = event.end ? new Date(event.end) : addMinutes(eventStart, 60);
                    return (eventStart < endOfDay(day) && eventEnd > startOfDay(day));
                  });

                  return (
                    <div key={day.getTime()} className="flex-1 border-r border-divider relative min-w-0 bg-white">
                      <div className="relative w-full overflow-hidden" style={{ height: hourHeight * 24 }}>
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
                            isAnyDragging={isAnyDraggingGlobal}
                            isSelecting={isSelecting}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                          />
                        ))}

                        {selectionRange && (() => {
                          // Normalize range
                          const s = selectionRange.start < selectionRange.end ? selectionRange.start : selectionRange.end;
                          const e = selectionRange.start < selectionRange.end ? selectionRange.end : selectionRange.start;

                          const dayStart = startOfDay(day);
                          const dayEnd = endOfDay(day);

                          // Check if selection overlaps this day
                          if (s < dayEnd && e > dayStart) {
                            let top = 0;
                            let height = hourHeight * 24;

                            const isS = isSameDay(s, day);
                            const isE = isSameDay(e, day);

                            if (isS && isE) {
                              top = (s.getHours() * 60 + s.getMinutes()) * (hourHeight / 60);
                              const durationMinutes = (e.getHours() * 60 + e.getMinutes()) - (s.getHours() * 60 + s.getMinutes());
                              height = Math.max(15 * (hourHeight / 60), durationMinutes * (hourHeight / 60));
                            } else if (isS) {
                              top = (s.getHours() * 60 + s.getMinutes()) * (hourHeight / 60);
                              height = (24 * 60 - (s.getHours() * 60 + s.getMinutes())) * (hourHeight / 60);
                            } else if (isE) {
                              top = 0;
                              height = (e.getHours() * 60 + e.getMinutes()) * (hourHeight / 60);
                            }

                            return (
                              <div
                                className={`
                                  absolute left-0 right-0 bg-primary/30 z-[35] pointer-events-none border-x-2 border-primary
                                  ${isS ? 'border-t-2 rounded-t-md mt-0.5' : ''} 
                                  ${isE ? 'border-b-2 rounded-b-md mb-0.5' : ''}
                                `}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  left: '2px',
                                  right: '2px'
                                }}
                              />
                            );
                          }
                          return null;
                        })()}

                        {calculateTimelineLayout(dayEvents, hourHeight, day).map((item, idx) => (
                          <DraggableTimelineEvent
                            key={item.id || idx}
                            event={item}
                            top={item.layout.top}
                            height={item.layout.height}
                            left={item.layout.left}
                            width={item.layout.width}
                            onUpdate={(id: string, updates: any) => handleUpdateEvent(id, id, item.sourceSpaceId, updates)}
                            onNavigate={(sid: string, title: string) => {
                              if (viewportsState) {
                                viewportsState.replaceCurrentTab(viewportsState.focusedViewportId, sid, undefined, title);
                              }
                            }}
                            onHoverEvent={(id: string | null) => {
                              if (!dragGhostItem && !isSelecting) {
                                setHoveredEventId(id);
                              }
                            }}
                            isHovered={hoveredEventId === item.id}
                            onSelect={handleToggleEventSelection}
                            onContextMenu={handleEventContextMenu}
                            onOpenDrawer={handleOpenDrawer}
                            hourHeight={hourHeight}
                            isSelected={selectedEventId === item.id || selectedEventIds.has(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-10 w-full shrink-0" />
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => renderHorizontalGrid(7);
  const renderNDaysView = () => renderHorizontalGrid(nDays);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white overscroll-x-none overscroll-none relative">
      <style>{`
        .is-dragging-event .calendar-event-item {
          pointer-events: none !important;
        }
        .is-dragging-now, 
        .is-dragging-now * {
          pointer-events: none !important;
        }
        body.is-dragging-event-global {
          cursor: grabbing !important;
        }
        body.is-dragging-event-global .calendar-event-item,
        body.is-dragging-event-global .calendar-event-item * {
          pointer-events: none !important;
        }
        body.is-dragging-event-global * {
          cursor: grabbing !important;
        }
      `}</style>
      {/* Header */}
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-divider shrink-0 bg-background/80 backdrop-blur-md z-20 relative">
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
          <div className="w-px h-4 bg-default-300 mx-1" />
          <Select
            aria-label="Filter by space"
            placeholder="All Spaces"
            selectedKeys={filterSpaceId === 'all' ? [] : [filterSpaceId]}
            onChange={(e: any) => setFilterSpaceId(e.target.value || 'all')}
            className="w-[140px]"
            size="sm"
            variant="bordered"
            classNames={{ trigger: "h-8 min-h-8 border-default-200" }}
            popoverProps={{ className: "min-w-[180px]" }}
          >
            <SelectItem key="all">All Spaces</SelectItem>
            {spacesState.spaces.map((space: any) => (
              <SelectItem key={space.id}>{space.title}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex gap-0.5 bg-default-100 p-0.5 rounded-lg border border-default-200/50">
            {(['month', 'week', 'day', 'ndays', 'year', 'list'] as const).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={view === v ? 'light' : 'light'}
                onPress={() => {
                  setView(v);
                  setCurrentDate(new Date());
                }}
                className={`capitalize text-xs h-7 px-3 rounded-md transition-all ${view === v ? 'bg-white text-default-900 font-bold shadow-sm' : 'text-default-500 hover:text-default-700'}`}
                disableAnimation
              >
                {v === 'month' ? 'Month' : v === 'week' ? 'Week' : v === 'day' ? 'Day' : v === 'ndays' ? `${nDays} Days` : v === 'year' ? 'Year' : 'List'}
              </Button>
            ))}
          </div>
          {view === 'ndays' && (
            <div className="w-[60px] ml-2">
              <Input
                type="number"
                size="sm"
                min={1}
                max={90}
                value={nDays.toString()}
                onValueChange={(v) => {
                  const val = parseInt(v);
                  if (!isNaN(val)) setNDays(Math.max(1, Math.min(90, val)));
                }}
                classNames={{ input: "text-right font-bold text-xs", inputWrapper: "h-7 min-h-7 px-1" }}
              />
            </div>
          )}
          <div className="w-px h-4 bg-default-300 mx-1" />
          <Button
            isIconOnly
            size="sm"
            color="primary"
            className="font-bold shadow-lg"
            onPress={(e) => {
              setNewEvent({
                title: '',
                startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                endDate: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
                notes: '',
                spaceId: spacesStateRef.current.focusedSpaceId || (spacesStateRef.current.spaces[0]?.id || '')
              });
              onOpen(); // Open the Drawer directly
            }}
          >
            <Plus size={18} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-hidden relative z-0 ${dragGhostItem ? 'is-dragging-event' : ''} ${marqueeRect ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMarqueeMouseDown}
        onMouseMove={handleMarqueeMouseMove}
        onMouseUp={handleMarqueeMouseUp}
        onMouseLeave={handleMarqueeMouseUp}
      >
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'ndays' && renderNDaysView()}
        {view === 'year' && renderYearView()}
        {view === 'list' && renderListView()}

        {/* Marquee Visual Rectangle */}
        {marqueeRect && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(marqueeRect.startX, marqueeRect.currentX),
              top: Math.min(marqueeRect.startY, marqueeRect.currentY),
              width: Math.abs(marqueeRect.startX - marqueeRect.currentX),
              height: Math.abs(marqueeRect.startY - marqueeRect.currentY),
              backgroundColor: marqueeRect.currentX >= marqueeRect.startX
                ? 'rgba(59, 130, 246, 0.15)' // Intersect (Blue)
                : 'rgba(16, 185, 129, 0.15)', // Enclose (Green)
              border: `1.5px ${marqueeRect.currentX >= marqueeRect.startX ? 'solid' : 'dashed'} ${marqueeRect.currentX >= marqueeRect.startX ? '#3b82f6' : '#10b981'}`,
              zIndex: 1000,
              pointerEvents: 'none',
              borderRadius: '2px'
            }}
          />
        )}
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
            {(() => {
              // Calculate arrow position to point at element center
              // Popover width is 280px, arrow width is 24px
              // We want the arrow centered on the element, but clamped within rounded corners (12px to 268px)
              const popoverWidth = 280;
              const arrowWidth = 24;
              const minArrowLeft = 12; // Stay inside left rounded corner
              const maxArrowLeft = popoverWidth - arrowWidth - 12; // Stay inside right rounded corner

              let arrowLeft = 32; // Default position (left-8)

              if (popoverAnchor.elementCenterX !== undefined) {
                // Calculate offset from popover left edge to element center
                const offset = popoverAnchor.elementCenterX - popoverAnchor.x;
                // Center the arrow on that offset
                arrowLeft = offset - (arrowWidth / 2);
                // Clamp to stay within rounded corners
                arrowLeft = Math.max(minArrowLeft, Math.min(maxArrowLeft, arrowLeft));
              }

              return (
                <div className="pointer-events-auto w-[280px] relative mt-[10px] group filter drop-shadow-2xl">
                  {/* Speech Bubble Arrow (SVG for perfect crispness) */}
                  <div className="absolute w-6 h-[11px] pointer-events-none z-20" style={{ left: `${arrowLeft}px`, top: '-10px' }}>
                    <svg width="24" height="11" viewBox="0 0 24 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                      <path d="M0 11L12 0L24 11" fill="white" />
                      <path d="M0 11L12 0L24 11" stroke="#e4e4e7" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>

                  <div className="absolute -right-10 top-0 z-20">
                    <Button size="sm" isIconOnly variant="light" radius="full" className="h-8 w-8 min-w-8 text-default-400 hover:text-default-800 bg-white shadow-sm hover:shadow-md" onClick={() => setPopoverAnchor(null)}>
                      <Plus size={18} className="rotate-45" />
                    </Button>
                  </div>

                  <div className="relative z-10 bg-white border border-divider flex flex-col overflow-hidden shadow-xl" style={{ borderRadius: '12px' }}>
                    <div className="p-3 flex flex-col gap-1.5">
                      <div className="pt-3 px-4">
                        <Input
                          autoFocus
                          placeholder="New"
                          variant="flat"
                          size="sm"
                          value={newEvent.title}
                          onValueChange={(v) => setNewEvent(prev => ({ ...prev, title: v }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickCreate();
                            if (e.key === 'Escape') setPopoverAnchor(null);
                          }}
                          classNames={{
                            inputWrapper: "bg-transparent px-4 shadow-none data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent h-auto min-h-0",
                            input: "text-lg font-bold text-default-900 placeholder:text-default-300 tracking-tight py-0"
                          }}
                        />
                        <div className="h-0.5 w-10 bg-primary rounded-full mt-1.5 opacity-20" />
                      </div>

                      {/* Event Type Selector */}
                      <div className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {[
                            { type: 'event' as CalendarEventType, icon: CalendarIcon, label: 'Event' },
                            { type: 'task' as CalendarEventType, icon: Check, label: 'Task' },
                            { type: 'timeblock' as CalendarEventType, icon: Timer, label: 'Block' },
                            { type: 'meeting' as CalendarEventType, icon: Users, label: 'Meet' },
                            { type: 'deadline' as CalendarEventType, icon: Circle, label: 'Due' },
                          ].map(({ type, icon: Icon, label }) => (
                            <button
                              key={type}
                              onClick={() => setNewEvent(prev => ({ ...prev, eventType: type }))}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${newEvent.eventType === type
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-default-100 text-default-600 hover:bg-default-200'
                                }`}
                            >
                              <Icon size={10} />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="datetime-local"
                            variant="faded"
                            size="sm"
                            value={format(new Date(newEvent.startDate), "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                            classNames={{
                              inputWrapper: "h-7 px-2 bg-default-50/50 hover:bg-default-100 border-transparent transition-colors rounded-lg shadow-none",
                              input: "text-xs font-medium text-default-600"
                            }}
                          />
                          <Input
                            type="datetime-local"
                            variant="faded"
                            size="sm"
                            value={format(new Date(newEvent.endDate), "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                            classNames={{
                              inputWrapper: "h-7 px-2 bg-default-50/50 hover:bg-default-100 border-transparent transition-colors rounded-lg shadow-none",
                              input: "text-xs font-medium text-default-600"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 p-3 bg-gradient-to-t from-white to-white/50 backdrop-blur-md pt-2" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                      <Button size="sm" fullWidth variant="flat" className="font-semibold h-7 text-[10px] bg-default-100/50 text-default-600 rounded-lg" onClick={() => { setPopoverAnchor(null); onOpen(); }}>
                        More details
                      </Button>
                      <Button size="sm" fullWidth color="primary" className="font-bold h-7 text-[10px] shadow-lg shadow-primary/25 rounded-lg text-white" onClick={handleQuickCreate}>
                        Create Event
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
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
            {(() => {
              // Calculate arrow position to point at element center
              // Edit popover width is 300px, arrow width is 24px
              // We want the arrow centered on the element, but clamped within rounded corners (12px to 288px)
              const popoverWidth = 300;
              const arrowWidth = 24;
              const minArrowLeft = 12; // Stay inside left rounded corner
              const maxArrowLeft = popoverWidth - arrowWidth - 12; // Stay inside right rounded corner

              let arrowLeft = 32; // Default position (left-8)

              if (editPopoverAnchor.elementCenterX !== undefined) {
                // Calculate offset from popover left edge to element center
                const offset = editPopoverAnchor.elementCenterX - editPopoverAnchor.x;
                // Center the arrow on that offset
                arrowLeft = offset - (arrowWidth / 2);
                // Clamp to stay within rounded corners
                arrowLeft = Math.max(minArrowLeft, Math.min(maxArrowLeft, arrowLeft));
              }

              return (
                <div className="pointer-events-auto w-[300px] relative mt-[10px] group filter drop-shadow-2xl">
                  {/* Speech Bubble Arrow (SVG for perfect crispness) */}
                  <div className="absolute w-6 h-[11px] pointer-events-none z-20" style={{ left: `${arrowLeft}px`, top: '-10px' }}>
                    <svg width="24" height="11" viewBox="0 0 24 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                      <path d="M0 11L12 0L24 11" fill="white" />
                      <path d="M0 11L12 0L24 11" stroke="#e4e4e7" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>


                  <div className="absolute -right-10 top-0 z-20">
                    <Button size="sm" isIconOnly variant="light" radius="full" className="h-8 w-8 min-w-8 text-default-400 hover:text-default-800 bg-white shadow-sm hover:shadow-md" onClick={() => handleToggleEventSelection(null)}>
                      <Plus size={18} className="rotate-45" />
                    </Button>
                  </div>

                  <div className="relative z-10 bg-white border border-divider flex flex-col overflow-hidden shadow-xl" style={{ borderRadius: '12px' }}>
                    <div className="px-5 pt-6 pb-2">
                      <Input
                        placeholder="Event title"
                        variant="flat"
                        size="lg"
                        value={selectedEvent.metadata?.title || ''}
                        onValueChange={(v) => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { title: v })}
                        classNames={{
                          inputWrapper: "bg-transparent px-4 shadow-none data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent h-auto min-h-0",
                          input: "text-xl font-bold text-default-900 placeholder:text-default-300 tracking-tight py-0"
                        }}
                      />
                      <div className="h-0.5 w-10 bg-primary rounded-full mt-2 opacity-20" />
                    </div>

                    {/* Event Type Selector */}
                    <div className="px-5 py-2 border-b border-divider/50">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { type: 'event' as CalendarEventType, icon: CalendarIcon, label: 'Event' },
                          { type: 'task' as CalendarEventType, icon: Check, label: 'Task' },
                          { type: 'timeblock' as CalendarEventType, icon: Timer, label: 'Block' },
                          { type: 'meeting' as CalendarEventType, icon: Users, label: 'Meet' },
                          { type: 'deadline' as CalendarEventType, icon: Circle, label: 'Due' },
                        ].map(({ type, icon: Icon, label }) => (
                          <button
                            key={type}
                            onClick={() => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { eventType: type })}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${(selectedEvent.metadata?.eventType || 'event') === type
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-default-100 text-default-600 hover:bg-default-200'
                              }`}
                          >
                            <Icon size={10} />
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Labels Display */}
                      {selectedEvent.metadata?.labels?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {selectedEvent.metadata.labels.map((label: EventLabel, idx: number) => (
                            <Chip
                              key={idx}
                              size="sm"
                              style={{ backgroundColor: label.color, color: 'white' }}
                              className="text-[9px] h-5"
                            >
                              {label.text}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-1.5 flex flex-col gap-4">
                      {/* Time Section */}
                      <div className="flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="datetime-local"
                            variant="faded"
                            size="sm"
                            value={format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { startDate: e.target.value })}
                            classNames={{
                              inputWrapper: "h-8 px-2 bg-default-50/50 hover:bg-default-100 border-transparent transition-colors rounded-lg",
                              input: "text-xs font-medium text-default-600"
                            }}
                          />
                          <Input
                            type="datetime-local"
                            variant="faded"
                            size="sm"
                            value={selectedEvent.end ? format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { endDate: e.target.value })}
                            classNames={{
                              inputWrapper: "h-8 px-2 bg-default-50/50 hover:bg-default-100 border-transparent transition-colors rounded-lg",
                              input: "text-xs font-medium text-default-600"
                            }}
                          />
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1.5 items-center text-default-400 text-[10px] font-bold uppercase tracking-wider pl-1">
                          <span className="w-1 h-1 rounded-full bg-primary" /> INFO
                        </div>
                        {(() => {
                          const infoSpaceId = selectedEvent.metadata?.infoSpaceId;
                          const infoSpace = infoSpaceId ? spacesState.spaces.find((s: any) => s.id === infoSpaceId) : null;

                          if (infoSpace) {
                            return (
                              <div className="h-[200px] overflow-y-auto overflow-x-hidden bg-white">
                                <div style={{ zoom: 0.8, paddingTop: '10px', paddingBottom: '12px' }}>
                                  <PageEditor
                                    space={infoSpace}
                                    spacesState={spacesState}
                                    isEmbedded={true}
                                  />
                                </div>
                              </div>
                            );
                          }

                          return (
                            <Button
                              size="sm"
                              variant="flat"
                              className="w-full justify-between h-12 bg-white border border-default-200/50 shadow-sm hover:border-default-300 hover:shadow transition-all rounded-xl group px-3"
                              startContent={<div className="p-1.5 bg-primary/10 rounded-md text-primary-600 group-hover:bg-primary/20 transition-colors"><Layout size={16} /></div>}
                              endContent={<ExternalLink size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />}
                              onClick={() => {
                                const newSpace = spacesState.createSpace('page');
                                const infoTitle = `${selectedEvent.metadata?.title || 'Untitled Event'} - Info`;

                                spacesState.updateSpace(newSpace.id, {
                                  title: infoTitle,
                                  content: { blocks: [] },
                                  icon: 'Calendar',
                                  iconColor: '#FF5F56',
                                  metadata: { isInfo: true, eventId: selectedEvent.id, isHidden: true, isCalendarElement: true }
                                });

                                handleUpdateEvent(selectedEvent.id, selectedEvent.id, selectedEvent.sourceSpaceId, { infoSpaceId: newSpace.id });
                              }}
                            >
                              <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                <span className="font-bold text-default-700 text-[11px] truncate w-full text-left">
                                  Create Info Page
                                </span>
                                <span className="text-[9px] text-default-400 font-medium">Click to add event details</span>
                              </div>
                            </Button>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-default-50/50 border-t border-divider/50 backdrop-blur-md mt-auto" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        className="font-bold text-[10px] h-7 px-3 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        startContent={<Trash2 size={12} className="text-red-600" />}
                        onClick={() => {
                          const space = spacesState.spaces.find((s: any) => s.id === selectedEvent.sourceSpaceId);
                          if (space) {
                            // Also delete associated info space if it exists
                            if (selectedEvent.metadata?.infoSpaceId) {
                              spacesState.deleteSpace(selectedEvent.metadata.infoSpaceId);
                            }
                            const blocks = space.content?.blocks.filter((b: any) => b.id !== selectedEvent.id);
                            spacesState.updateSpace(selectedEvent.sourceSpaceId, { content: { ...space.content, blocks } });
                            handleToggleEventSelection(null);
                          }
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        className="font-semibold text-[10px] h-7 px-3 rounded-lg"
                        onClick={() => {
                          // Sync the selected event's data to the drawer
                          setNewEvent({
                            title: selectedEvent.metadata?.title || '',
                            startDate: format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm"),
                            endDate: selectedEvent.end ? format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm") : format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm"),
                            notes: '',
                            spaceId: selectedEvent.sourceSpaceId
                          });
                          setEditingEventId(selectedEvent.id);
                          handleToggleEventSelection(null);
                          onOpen();
                        }}
                      >
                        More details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div >
        )
        }
      </AnimatePresence >

      {/* Event Drawer (replaces Modal) */}
      <AnimatePresence>
        {
          isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-transparent pointer-events-none z-[500]"
              />
              {/* Right Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 bottom-0 w-[400px] bg-white shadow-lg z-[501] border-l border-default-200 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-divider bg-white">
                  <h2 className="text-lg font-bold">Create New Event</h2>
                  <Button isIconOnly size="sm" variant="light" onClick={onClose}><X size={18} /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-default-700">Title</label>
                    <Input
                      placeholder="Event name"
                      variant="bordered"
                      value={newEvent.title}
                      onValueChange={(v) => setNewEvent(prev => ({ ...prev, title: v }))}
                      classNames={{ input: "font-bold text-lg" }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-semibold text-default-700">Start</label>
                      <Input
                        type="datetime-local"
                        variant="bordered"
                        value={newEvent.startDate}
                        onValueChange={(v) => setNewEvent(prev => ({ ...prev, startDate: v }))}
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-semibold text-default-700">End</label>
                      <Input
                        type="datetime-local"
                        variant="bordered"
                        value={newEvent.endDate}
                        onValueChange={(v) => setNewEvent(prev => ({ ...prev, endDate: v }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-default-700">Info</label>
                    {(() => {
                      if (editingEventId) {
                        // We're editing an existing event - try to find its Info space
                        const event = allEvents.find((e: any) => e.id === editingEventId);
                        const infoSpaceId = event?.metadata?.infoSpaceId;
                        const infoSpace = infoSpaceId ? spacesState.spaces.find((s: any) => s.id === infoSpaceId) : null;

                        if (infoSpace) {
                          return (
                            <div className="h-[300px] overflow-y-auto overflow-x-hidden bg-white">
                              <div style={{ zoom: 0.8, paddingTop: '10px', paddingBottom: '12px' }}>
                                <PageEditor
                                  space={infoSpace}
                                  spacesState={spacesState}
                                  isEmbedded={true}
                                />
                              </div>
                            </div>
                          );
                        }
                      }

                      // Creating new event or no Info space yet
                      return (
                        <div className="h-[300px] overflow-y-auto border border-default-200 rounded-xl bg-default-50/30 flex items-center justify-center">
                          <div className="text-center p-6">
                            <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                              <Layout size={20} className="text-primary-600" />
                            </div>
                            <p className="text-sm font-semibold text-default-700 mb-1">Info Page</p>
                            <p className="text-xs text-default-500">Will be created when you save the event</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 border-t border-divider bg-default-50 flex justify-end gap-2">
                  <Button variant="light" onPress={() => { setEditingEventId(null); onClose(); }}>Cancel</Button>
                  <Button color="primary" onPress={() => {
                    if (editingEventId) {
                      // Update existing event
                      const event = allEvents.find((e: any) => e.id === editingEventId);
                      if (event) {
                        handleUpdateEvent(editingEventId, editingEventId, event.sourceSpaceId, {
                          title: newEvent.title,
                          startDate: newEvent.startDate,
                          endDate: newEvent.endDate
                        });
                      }
                      setEditingEventId(null);
                    } else {
                      // Create new event
                      handleCreateEvent();
                    }
                    onClose();
                  }}>Save Event</Button>
                </div>
              </motion.div>
            </>
          )
        }
      </AnimatePresence >

      {/* Context Menu for Events */}
      {contextMenu && selectedEventIds.size > 0 && (
        <div
          className="fixed z-[9999]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-divider rounded-lg shadow-xl py-1 min-w-[180px] overflow-hidden">
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-default-100 flex items-center gap-2.5 transition-colors"
              onClick={() => handleDuplicateEvents(Array.from(selectedEventIds))}
            >
              <Copy size={14} className="text-default-500" />
              <span>Duplicate{selectedEventIds.size > 1 ? ` (${selectedEventIds.size})` : ''}</span>
            </button>
            <div className="h-px bg-divider mx-2 my-1" />
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
              onClick={() => handleDeleteEvents(Array.from(selectedEventIds))}
            >
              <Trash2 size={14} />
              <span>Delete{selectedEventIds.size > 1 ? ` (${selectedEventIds.size})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        />
      )}
    </div >
  );
}

function CalendarDaySlot({ hour, day, onStartSelection, onUpdateSelection, onUpdateEvent, allEvents, hourHeight = 60, isAnyDragging, isSelecting, onDragEnter, onDragLeave }: any) {
  const [dropPosition, setDropPosition] = useState<number | null>(null);

  const [{ isOver, draggedItem }, drop] = useDrop({
    accept: 'CALENDAR_EVENT',
    canDrop: () => true,
    hover: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !slotRef.current) return;

      const hoverBoundingRect = slotRef.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const minuteHeight = hourHeight / 60;

      // Adjust hover minute by the grab offset to keep the event top aligned with snap
      const grabOffset = item.grabOffset || 0;
      const hoverMinuteWithOffset = Math.floor((hoverClientY - grabOffset) / minuteHeight);

      // Snap to 15-minute intervals
      const snappedMinute = Math.floor(hoverMinuteWithOffset / 15) * 15;
      setDropPosition(snappedMinute);
    },
    drop: (item: any, monitor) => {
      const event = allEvents.find((e: any) => e.id === item.id);
      if (!event || !slotRef.current) return;

      const clientOffset = monitor.getClientOffset();
      let minute = 0;

      if (clientOffset) {
        const hoverBoundingRect = slotRef.current.getBoundingClientRect();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        const minuteHeight = hourHeight / 60;
        const grabOffset = item.grabOffset || 0;
        const hoverMinuteWithOffset = Math.floor((hoverClientY - grabOffset) / minuteHeight);
        // Snap to 15-minute intervals
        minute = Math.floor(hoverMinuteWithOffset / 15) * 15;
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

  useEffect(() => {
    if (isOver && draggedItem && onDragEnter) {
      const d = new Date(day);
      d.setHours(hour, dropPosition || 0, 0, 0);
      onDragEnter(d, draggedItem);
    } else if (!isOver && onDragLeave) {
      onDragLeave();
    }
  }, [isOver, draggedItem, day, hour, dropPosition, onDragEnter, onDragLeave]);

  const slotRef = useRef<HTMLDivElement>(null);

  const setDropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
    (slotRef as any).current = node;
  }, [drop]);

  return (
    <div
      ref={setDropRef}
      style={{ height: `${hourHeight}px` }}
      className={`border-t border-divider hover:bg-default-50/50 cursor-crosshair relative ${isOver ? 'bg-primary/10' : ''}`}
      onMouseDown={(e) => {
        if (e.shiftKey) return;
        if (isAnyDragging) return;
        // Calculate initial minute on mouse down for precise start time
        if (!slotRef.current) {
          const d = new Date(day);
          d.setHours(hour, 0, 0, 0);
          onStartSelection(d, { x: e.clientX, y: e.clientY });
          return;
        }

        const rect = slotRef.current.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minuteHeight = hourHeight / 60;
        const minute = Math.floor(offsetY / minuteHeight);
        // Snap to 15m
        const snappedMinute = Math.floor(minute / 15) * 15;

        const d = new Date(day);
        d.setHours(hour, snappedMinute, 0, 0);
        onStartSelection(d, { x: e.clientX, y: e.clientY });
      }}
      onMouseMove={(e) => {
        if (isAnyDragging || !isSelecting) return;
        // Support intra-slot and cross-column selection updating
        if (e.buttons !== 1) return; // Only if mouse is down (dragging selection)
        if (!slotRef.current) return;

        const rect = slotRef.current.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minuteHeight = hourHeight / 60;
        const minute = Math.floor(offsetY / minuteHeight);
        const snappedMinute = Math.floor(minute / 15) * 15;

        const d = new Date(day);
        d.setHours(hour, snappedMinute, 0, 0);
        onUpdateSelection(d);
      }}
      onMouseEnter={(e) => {
        if (e.buttons !== 1 || !isSelecting) return;
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


function calculateTimelineLayout(events: any[], hourHeight: number, referenceDate: Date) {
  if (events.length === 0) return [];

  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  // Filter and normalize events for this day
  const dayEvents = events.map(event => {
    const eStart = new Date(event.start);
    const eEnd = event.end ? new Date(event.end) : addMinutes(eStart, 60);

    // Clamp to day boundaries
    const start = new Date(Math.max(eStart.getTime(), dayStart.getTime()));
    const end = new Date(Math.min(eEnd.getTime(), dayEnd.getTime()));

    const top = differenceInMinutes(start, dayStart) * (hourHeight / 60);
    const duration = differenceInMinutes(end, start);

    return {
      ...event,
      effectiveStart: start,
      effectiveEnd: end,
      layoutTop: top,
      layoutHeight: Math.max(20, duration * (hourHeight / 60))
    };
  }).filter(e => e.layoutHeight > 0);

  // Sort by start time
  const sortedEvents = [...dayEvents].sort((a, b) => a.effectiveStart.getTime() - b.effectiveStart.getTime());

  // Group into clusters of overlapping events
  const clusters: any[][] = [];
  let currentCluster: any[] = [];
  let clusterEnd: number = 0;

  sortedEvents.forEach(event => {
    const eventEnd = event.effectiveEnd.getTime();
    if (currentCluster.length > 0 && event.effectiveStart.getTime() >= clusterEnd) {
      clusters.push(currentCluster);
      currentCluster = [event];
      clusterEnd = eventEnd;
    } else {
      currentCluster.push(event);
      clusterEnd = Math.max(clusterEnd, eventEnd);
    }
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  // For each cluster, assign columns
  const result: any[] = [];
  clusters.forEach(cluster => {
    const eventColMap = new Map();
    const columns: any[][] = [];
    cluster.forEach(event => {
      let assigned = false;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        const lastEnd = lastInCol.effectiveEnd.getTime();
        if (event.effectiveStart.getTime() >= lastEnd) {
          columns[i].push(event);
          eventColMap.set(event.id, i);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        columns.push([event]);
        eventColMap.set(event.id, columns.length - 1);
      }
    });

    const totalCols = columns.length;
    cluster.forEach(event => {
      const colIndex = eventColMap.get(event.id) || 0;

      result.push({
        ...event,
        layout: {
          top: event.layoutTop,
          height: event.layoutHeight,
          left: (colIndex / totalCols) * 90,
          width: 90 / totalCols
        }
      });
    });
  });

  return result;
}

function DraggableTimelineEvent({ event, top, height, left = 0, width = 100, onUpdate, onNavigate, onHoverEvent, isHovered, onSelect, onContextMenu, onOpenDrawer, hourHeight, isSelected }: any) {
  const dragOccurredRef = useRef(false);
  const mouseMovedRef = useRef(false);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'CALENDAR_EVENT',
    item: (monitor) => {
      const initialOffset = monitor.getInitialClientOffset();
      const initialSourceOffset = monitor.getInitialSourceClientOffset();
      let grabOffset = 0;
      if (initialOffset && initialSourceOffset) {
        grabOffset = initialOffset.y - initialSourceOffset.y;
      }

      return {
        id: event.id,
        blockId: event.id,
        spaceId: event.sourceSpaceId,
        type: 'CALENDAR_EVENT',
        title: event.metadata?.title || 'Untitled',
        content: event.metadata?.notes,
        start: event.start,
        end: event.end,
        sourceSpaceTitle: event.sourceSpaceTitle,
        grabOffset
      };
    },
    end: () => {
      // Cleanup happens in useEffect
    },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  });

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('is-dragging-event-global');
      dragOccurredRef.current = true;
    } else {
      document.body.classList.remove('is-dragging-event-global');
      // Reset drag flag after a short delay to allow the onClick to check it
      setTimeout(() => {
        dragOccurredRef.current = false;
      }, 150);
    }
    return () => {
      document.body.classList.remove('is-dragging-event-global');
    };
  }, [isDragging]);

  // Suppress native drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();

    const startY = e.clientY;
    const startX = e.clientX;
    const target = e.target as HTMLElement;
    const startTime = direction === 'top' ? new Date(event.start) : (event.end || addMinutes(event.start, 60));

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // Convert pixels to minutes based on hourHeight
      // Assuming 60px per hour as base, adjust if needed
      const minutesPerPixel = 60 / hourHeight;
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
        // Multi-column resize logic for Week/N-days
        const rect = target.closest('.flex-1')?.getBoundingClientRect();
        if (rect) {
          const colWidth = rect.width;
          const deltaX = moveEvent.clientX - startX;
          const daysToJump = Math.round(deltaX / colWidth);

          let newEnd = addMinutes(startTime, snappedDeltaMinutes);
          if (daysToJump !== 0) {
            newEnd = addDays(newEnd, daysToJump);
          }

          const currentStart = new Date(event.start);
          if (newEnd > currentStart) {
            onUpdate(event.id, { endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm") });
          }
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

  // Extract event type info
  const eventType = event.metadata?.eventType || 'event';
  const isCompleted = event.metadata?.isCompleted || false;
  const labels = event.metadata?.labels || [];

  // Get type-specific background
  const getTypeBgClass = () => {
    switch (eventType) {
      case 'task':
        return isCompleted ? 'bg-success' : 'bg-primary';
      case 'timeblock':
        return 'bg-default-400';
      case 'meeting':
        return 'bg-secondary';
      case 'deadline':
        return 'bg-danger';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div
      ref={setDragRef}
      className={`absolute rounded text-white p-2 text-xs shadow-md overflow-hidden cursor-grab active:cursor-grabbing group calendar-event-item ${getTypeBgClass()} ${isDragging ? 'opacity-0 is-dragging-now' : ''} ${isHovered && !isSelected ? 'ring-2 ring-primary-300' : ''} ${eventType === 'timeblock' ? 'opacity-60' : ''} ${isCompleted ? 'opacity-60' : ''}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${left}% + 2px)`,
        width: `calc(${width}% - 4px)`,
        zIndex: isDragging ? -1 : (isSelected ? 60 : 50),
        pointerEvents: isDragging ? 'none' : 'auto',
        visibility: isDragging ? 'hidden' : 'visible',
        boxShadow: isSelected ? '0 0 0 2px #3b82f6' : undefined,
      }}
      onMouseDown={(e) => {
        if (e.shiftKey) return;
        e.stopPropagation();
        mouseMovedRef.current = false;

        const handleMouseMove = () => {
          mouseMovedRef.current = true;
        };

        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }}
      onMouseEnter={() => onHoverEvent && onHoverEvent(event.id)}
      onMouseLeave={() => onHoverEvent && onHoverEvent(null)}
      data-event-id={event.id}
      onClick={(e) => {
        e.stopPropagation();
        if (dragOccurredRef.current || mouseMovedRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        if (onSelect) onSelect(event.id, { x: e.clientX, y: e.clientY, elementCenterX }, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onOpenDrawer) onOpenDrawer(event);
      }}
      onContextMenu={(e) => {
        if (onContextMenu) onContextMenu(e, event.id);
      }}
    >
      {/* Labels in corner */}
      {labels.length > 0 && (
        <div className="absolute top-0 right-0 flex">
          {labels.slice(0, 2).map((label: EventLabel, idx: number) => (
            <div
              key={idx}
              className="w-4 h-4"
              style={{
                backgroundColor: label.color,
                clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
              }}
              title={label.text}
            />
          ))}
        </div>
      )}

      {/* Top Resizer Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/20 flex items-center justify-center transition-all z-20"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        title="Drag to resize start time"
      >
        <div className="w-8 h-0.5 bg-white/60 rounded-full" />
      </div>

      <div className="flex justify-between items-start gap-1 pt-1">
        {/* Task checkbox */}
        {eventType === 'task' && (
          <div
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${isCompleted ? 'bg-white border-white' : 'border-white/70 hover:bg-white/20'}`}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(event.id, { isCompleted: !isCompleted });
            }}
          >
            {isCompleted && <Check size={10} className="text-success" />}
          </div>
        )}

        {/* Meeting icon */}
        {eventType === 'meeting' && height > 30 && (
          <Users size={12} className="shrink-0 opacity-70" />
        )}

        {/* Timeblock icon */}
        {eventType === 'timeblock' && height > 30 && (
          <Timer size={12} className="shrink-0 opacity-70" />
        )}

        <div className={`font-bold truncate flex-1 ${isCompleted ? 'line-through' : ''}`}>{event.metadata?.title}</div>

        {eventType !== 'task' && eventType !== 'meeting' && eventType !== 'timeblock' && (
          <GripVertical size={12} className="opacity-40 shrink-0" />
        )}
      </div>

      {height > 35 && (
        <div className="opacity-80 text-[10px]">{format(event.start, 'HH:mm')} - {event.end ? format(event.end, 'HH:mm') : ''}</div>
      )}

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