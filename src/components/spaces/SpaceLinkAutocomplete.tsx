import { useState, useEffect, useRef } from 'react';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';
import { Space } from '../../types';

interface SpaceLinkAutocompleteProps {
  spaces: Space[];
  onSelect: (space: Space) => void;
  onClose: () => void;
  position: { top: number; left: number };
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
  currentSpaceId?: string;
}

export function SpaceLinkAutocomplete({
  spaces,
  onSelect,
  onClose,
  position,
  selectedIndex = 0,
  onSelectedIndexChange,
  currentSpaceId
}: SpaceLinkAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Calcola se mostrare il menu sopra o sotto in base allo spazio disponibile
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  
  useEffect(() => {
    // Verifica se c'è spazio sufficiente sotto
    const menuHeight = 400; // maxHeight del menu
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - position.top;
    const spaceAbove = position.top;
    
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      // Mostra sopra
      setAdjustedPosition({
        top: position.top - menuHeight,
        left: position.left
      });
    } else {
      // Mostra sotto (default)
      setAdjustedPosition(position);
    }
  }, [position]);

  // Filtra gli spaces in base alla ricerca e ordina per ultima modifica
  const filteredSpaces = spaces
    .filter(space =>
      space && 
      space.title && 
      space.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      space.id !== currentSpaceId // Escludi lo space corrente
    )
    .sort((a, b) => {
      // Ordina per lastModified, più recenti prima
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

  useEffect(() => {
    // Focus sull'input quando il componente viene montato
    // Usa setTimeout con delay maggiore e focus più aggressivo
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select(); // Seleziona tutto il testo se presente
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset dell'indice selezionato quando cambiano i risultati filtrati
    if (onSelectedIndexChange) {
      onSelectedIndexChange(0);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (onSelectedIndexChange) {
        onSelectedIndexChange(Math.min(selectedIndex + 1, filteredSpaces.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (onSelectedIndexChange) {
        onSelectedIndexChange(Math.max(selectedIndex - 1, 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSpaces[selectedIndex]) {
        onSelect(filteredSpaces[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll automatico dell'elemento selezionato
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Icona per ogni tipo di space
  const getSpaceIcon = (space: Space) => {
    if (space.icon) return space.icon;
    switch (space.type) {
      case 'page': return '📄';
      case 'canvas': return '🎨';
      case 'database': return '🗄️';
      case 'dashboard': return '📊';
      default: return '📄';
    }
  };

  // Badge per il tipo di space
  const getSpaceTypeBadge = (type: string) => {
    switch (type) {
      case 'page': return 'Page';
      case 'canvas': return 'Canvas';
      case 'database': return 'Database';
      case 'dashboard': return 'Dashboard';
      default: return type;
    }
  };

  return (
    <>
      {/* Overlay per catturare i click fuori dal menu */}
      <div
        onClick={onClose}
        onMouseDown={(e) => e.preventDefault()} // Previeni che l'overlay prenda il focus
        className="fixed inset-0 z-[9998]"
      />
      
      {/* Menu autocomplete */}
      <div
        style={{
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
        }}
        className="fixed bg-white shadow-lg rounded-lg border border-divider z-[9999] w-[400px] max-h-[400px] flex flex-col overflow-hidden"
      >
        {/* Search input */}
        <div className="p-2 border-b border-divider">
          <Input
            value={searchQuery}
            onValueChange={setSearchQuery}
            onKeyDown={handleKeyDown}
            placeholder="Search spaces..."
            startContent={<Search size={16} className="text-default-400" />}
            size="sm"
            autoFocus
            ref={inputRef}
            classNames={{
              input: "text-small",
              inputWrapper: "h-8",
            }}
          />
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="flex-1 overflow-auto"
        >
          {filteredSpaces.length > 0 ? (
            filteredSpaces.map((space, index) => (
              <div
                key={space.id}
                onClick={() => onSelect(space)}
                className={`
                  p-2 cursor-pointer flex items-center gap-3 transition-colors
                  ${index === selectedIndex ? 'bg-default-100' : 'bg-transparent'}
                  hover:bg-default-100
                `}
              >
                {/* Icon */}
                <span className="text-lg min-w-[24px] text-center">
                  {getSpaceIcon(space)}
                </span>

                {/* Title and type */}
                <div className="flex-1 min-w-0">
                  <p className="text-small font-medium truncate">
                    {space.title}
                  </p>
                  <p className="text-tiny text-default-400">
                    {getSpaceTypeBadge(space.type)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <span className="text-small text-default-400">
                No spaces found
              </span>
            </div>
          )}
        </div>

        {/* Footer con hint */}
        <div className="p-2 border-t border-divider bg-default-50">
          <p className="text-tiny text-default-400 text-center">
            ↑↓ to navigate • Enter to select • Esc to close
          </p>
        </div>
      </div>
    </>
  );
}
