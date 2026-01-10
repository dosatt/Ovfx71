import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  FileText,
  CheckCircle2,
  Circle,
  MoreVertical,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  Paperclip,
  X
} from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react";
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { SpaceEmbed } from './SpaceEmbed';

export interface CalendarElementData {
  startDate: string; // ISO string
  endDate: string; // ISO string
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  completed?: boolean;
  attachments?: { id: string; type: string; title: string }[];
  displayMode?: 'inline' | 'card';
}

interface CalendarElementProps {
  data: CalendarElementData;
  onUpdate: (data: Partial<CalendarElementData>) => void;
  isReadOnly?: boolean;
  className?: string;
  spacesState?: any; // To resolve attachments if needed
}

export function CalendarElement({
  data,
  onUpdate,
  isReadOnly = false,
  className = "",
  spacesState
}: CalendarElementProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: enUS });
    } catch (e) {
      return dateStr;
    }
  };

  const getRecurrenceLabel = (r?: string) => {
    switch (r) {
      case 'daily': return 'Every day';
      case 'weekly': return 'Every week';
      case 'monthly': return 'Every month';
      case 'yearly': return 'Every year';
      default: return 'None';
    }
  };

  // Inline (Capsule) View
  if (data.displayMode === 'inline') {
    return (
      <Popover placement="bottom" isOpen={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger>
          <div
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
              border transition-all cursor-pointer select-none
              ${data.completed
                ? 'bg-success-50/50 border-success-200 text-default-500 line-through'
                : 'bg-default-100/50 border-default-200 hover:border-default-300 text-default-700 hover:bg-default-100'}
              ${className}
            `}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${data.completed ? 'border-success-500 bg-success-500' : 'border-default-400'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isReadOnly) onUpdate({ completed: !data.completed });
              }}
            >
              {data.completed && <CheckCircle2 size={12} className="text-white" />}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <CalendarIcon size={12} className="opacity-70" />
              <span>{formatDate(data.startDate)}</span>
              {data.endDate && (
                <>
                  <span className="opacity-50">-</span>
                  <span>{format(new Date(data.endDate), "HH:mm")}</span>
                </>
              )}
            </div>

            {data.recurrence && data.recurrence !== 'none' && (
              <Repeat size={10} className="opacity-50" />
            )}

            {data.notes && (
              <FileText size={10} className="opacity-50" />
            )}
            {data.attachments && data.attachments.length > 0 && (
              <Paperclip size={10} className="opacity-50" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0">
          <CalendarElementEditor
            data={data}
            onUpdate={onUpdate}
            isReadOnly={isReadOnly}
            onClose={() => setIsOpen(false)}
            spacesState={spacesState}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Card View (Standalone/Compact)
  return (
    <div className={`
      relative group flex flex-col gap-3 p-4 rounded-xl border bg-white shadow-sm transition-all w-full
      ${data.completed ? 'border-success-200 bg-success-50/10' : 'border-default-200 hover:border-default-300'}
      ${className}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                ${data.completed
                ? 'border-success-500 bg-success-500 text-white'
                : 'border-default-300 hover:border-primary hover:bg-primary/5 text-transparent'}
              `}
            onClick={() => !isReadOnly && onUpdate({ completed: !data.completed })}
          >
            <CheckCircle2 size={14} className={data.completed ? "opacity-100" : "opacity-0"} />
          </button>

          <div className="flex flex-col gap-0.5">
            <div className={`font-semibold text-sm ${data.completed ? 'text-default-500 line-through' : 'text-default-900'}`}>
              {data.notes ? data.notes.split('\n')[0] : 'New Event'}
            </div>
            <div className="flex items-center gap-2 text-xs text-default-500">
              <div className="flex items-center gap-1 bg-default-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                <CalendarIcon size={10} />
                {formatDate(data.startDate)}
              </div>
              {data.endDate && (
                <div className="flex items-center gap-1 bg-default-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  <Clock size={10} />
                  {format(new Date(data.endDate), "HH:mm")}
                </div>
              )}
              {data.recurrence && data.recurrence !== 'none' && (
                <div className="flex items-center gap-1 text-primary">
                  <Repeat size={10} />
                  <span>{getRecurrenceLabel(data.recurrence)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Button isIconOnly size="sm" variant="light" className="text-default-400">
                <MoreVertical size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[340px]">
              <CalendarElementEditor
                data={data}
                onUpdate={onUpdate}
                isReadOnly={isReadOnly}
                spacesState={spacesState}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Attachments Section */}
      {data.attachments && data.attachments.length > 0 && (
        <div className="flex flex-col gap-2 mt-1 pl-9">
          <div className="text-[10px] font-semibold uppercase text-default-400 tracking-wider">Attachments</div>
          <div className="grid grid-cols-1 gap-2">
            {data.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-default-50 border border-default-100 text-xs text-default-700">
                <Paperclip size={12} className="text-default-400" />
                <span className="truncate flex-1">{att.title}</span>
                {!isReadOnly && (
                  <button
                    className="text-default-400 hover:text-danger"
                    onClick={() => {
                      const newAtts = [...(data.attachments || [])];
                      newAtts.splice(i, 1);
                      onUpdate({ attachments: newAtts });
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Notes (if more than first line) */}
      {data.notes && data.notes.includes('\n') && (
        <div className="pl-9 text-xs text-default-500 whitespace-pre-wrap line-clamp-2">
          {data.notes.split('\n').slice(1).join('\n')}
        </div>
      )}
    </div>
  );
}

function CalendarElementEditor({ data, onUpdate, isReadOnly, onClose, spacesState }: any) {
  // Local state for editing to avoid constant re-renders on parent
  const [localData, setLocalData] = useState(data);

  const handleSave = () => {
    onUpdate(localData);
    if (onClose) onClose();
  };

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    // Auto-save on simple changes? Or keep explicit save?
    // Let's do auto-update for better UX, but usually Popover content might want explicit save/close
    // We'll update parent immediately for responsiveness
    onUpdate(newData);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-default-700">Event Details</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onClick={() => handleChange('displayMode', localData.displayMode === 'inline' ? 'card' : 'inline')}
            title={localData.displayMode === 'inline' ? "Switch to Card view" : "Switch to Inline view"}
          >
            {localData.displayMode === 'inline' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase text-default-500">Start</label>
            <Input
              type="datetime-local"
              size="sm"
              value={localData.startDate}
              onValueChange={(v) => handleChange('startDate', v)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase text-default-500">End</label>
            <Input
              type="datetime-local"
              size="sm"
              value={localData.endDate}
              onValueChange={(v) => handleChange('endDate', v)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-default-500">Recurrence</label>
          <div className="flex gap-1 flex-wrap">
            {['none', 'daily', 'weekly', 'monthly', 'yearly'].map((r) => (
              <button
                key={r}
                className={`px-2 py-1 text-xs rounded border transition-colors ${localData.recurrence === r ? 'bg-primary text-white border-primary' : 'bg-transparent border-default-200 text-default-600 hover:bg-default-100'}`}
                onClick={() => handleChange('recurrence', r)}
              >
                {r === 'none' ? 'None' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-default-500">Notes</label>
          <Textarea
            minRows={2}
            size="sm"
            placeholder="Add details..."
            value={localData.notes || ''}
            onValueChange={(v) => handleChange('notes', v)}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-default-100">
          <span className="text-xs font-medium text-default-600">Completed</span>
          <Switch
            size="sm"
            isSelected={localData.completed}
            onValueChange={(v) => handleChange('completed', v)}
          />
        </div>
      </div>
    </div>
  );
}