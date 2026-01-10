import { useState, useEffect, useRef } from 'react';
import { Input, Button } from '@heroui/react';
import { Plus, Calendar, Search } from 'lucide-react';
import { Space, Block } from '../../types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface CalendarAutocompleteProps {
  spaces: Space[];
  onSelect: (event: any) => void;
  onCreateNew: () => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function CalendarAutocomplete({
  spaces,
  onSelect,
  onCreateNew,
  onClose,
  position
}: CalendarAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Extract all calendar events
  const allEvents = spaces.flatMap(space => 
    (space.content?.blocks || [])
      .filter((block: Block) => block.type === 'calendar')
      .map((block: Block) => ({
        ...block,
        sourceSpaceId: space.id,
        sourceSpaceTitle: space.title
      }))
  );

  const filteredEvents = allEvents.filter(event => 
    (event.metadata?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredEvents.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === 0) {
        onCreateNew();
      } else if (filteredEvents[selectedIndex - 1]) {
        onSelect(filteredEvents[selectedIndex - 1]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} onMouseDown={e => e.preventDefault()} />
      <div
        style={{ top: position.top, left: position.left }}
        className="fixed bg-white shadow-xl rounded-xl border border-divider z-[9999] w-[320px] max-h-[400px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
        onKeyDown={handleKeyDown}
      >
        <div className="p-2 border-b border-divider">
          <Input
            ref={inputRef}
            size="sm"
            placeholder="Cerca evento o crea nuovo..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search size={14} className="text-default-400" />}
            variant="flat"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {/* Create Option */}
          <div
            onClick={onCreateNew}
            className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors ${selectedIndex === 0 ? 'bg-primary/10 text-primary' : 'hover:bg-default-100'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Plus size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Nuovo Evento</span>
              <span className="text-[10px] text-default-400">Crea un nuovo elemento calendario</span>
            </div>
          </div>

          <div className="px-3 py-1 text-[10px] font-bold uppercase text-default-400 tracking-wider mt-2 mb-1">
            Eventi Esistenti
          </div>

          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => {
              const actualIdx = idx + 1;
              return (
                <div
                  key={event.id}
                  onClick={() => onSelect(event)}
                  className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors ${selectedIndex === actualIdx ? 'bg-primary/10 text-primary' : 'hover:bg-default-100'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-default-100 flex items-center justify-center text-default-500">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{event.metadata?.title || 'Senza titolo'}</span>
                    <span className="text-[10px] text-default-400 truncate">
                      {event.metadata?.startDate ? format(new Date(event.metadata.startDate), 'd MMM yyyy', { locale: it }) : 'Nessuna data'}
                      {' • '}
                      {event.sourceSpaceTitle}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-default-400">
              Nessun evento trovato
            </div>
          )}
        </div>

        <div className="p-2 bg-default-50 border-t border-divider text-[10px] text-center text-default-400">
          ↑↓ per navigare • Enter per confermare
        </div>
      </div>
    </>
  );
}
