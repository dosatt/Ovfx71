import { useState, useEffect, useRef } from 'react';
import { Input } from '@heroui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate whether to show the menu above or below based on available space
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    // Check if there is enough space below
    const menuHeight = 360; // maxHeight del menu
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - position.top;
    const spaceAbove = position.top;

    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      // Show above
      setAdjustedPosition({
        top: position.top - menuHeight,
        left: position.left
      });
    } else {
      // Show below (default)
      setAdjustedPosition(position);
    }
  }, [position]);

  // Filter spaces based on search and sort by last modified
  const filteredSpaces = spaces
    .filter(space =>
      space &&
      space.title &&
      space.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      space.id !== currentSpaceId // Exclude current space
    )
    .sort((a, b) => {
      // Sort by lastModified, most recent first
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

  useEffect(() => {
    // Focus on input when component mounts
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset selected index when filtered results change
    if (onSelectedIndexChange) {
      onSelectedIndexChange(0);
    }
  }, [searchQuery, onSelectedIndexChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key); // Debug

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (onSelectedIndexChange && filteredSpaces.length > 0) {
        const newIndex = Math.min(selectedIndex + 1, filteredSpaces.length - 1);
        console.log('Moving down to index:', newIndex);
        onSelectedIndexChange(newIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (onSelectedIndexChange && filteredSpaces.length > 0) {
        const newIndex = Math.max(selectedIndex - 1, 0);
        console.log('Moving up to index:', newIndex);
        onSelectedIndexChange(newIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredSpaces[selectedIndex]) {
        onSelect(filteredSpaces[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  // Auto scroll to selected element
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Icon for each space type
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

  // Badge for space type
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
      {/* Overlay to catch clicks outside the menu */}
      <div
        onClick={onClose}
        onMouseDown={(e) => e.preventDefault()} // Prevent overlay from taking focus
        className="fixed inset-0 z-[9998]"
      />

      {/* Menu autocomplete */}
      <div
        ref={containerRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
        }}
        className="fixed bg-white shadow-lg rounded-lg border border-divider z-[9999] w-[360px] max-h-[360px] flex flex-col overflow-hidden focus:outline-none"
      >
        {/* Search input */}
        <div className="p-2 border-b border-divider">
          <Input
            value={searchQuery}
            onValueChange={setSearchQuery}
            onKeyDown={handleKeyDown}
            placeholder="Search spaces..."
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
            size="sm"
            autoFocus
            ref={inputRef}
            classNames={{
              input: "text-sm focus:outline-none",
              inputWrapper: "h-8 min-h-8 focus:outline-none shadow-none",
              base: "focus:outline-none",
            }}
          />
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="flex-1 overflow-auto focus:outline-none"
        >
          {filteredSpaces.length > 0 ? (
            filteredSpaces.map((space, index) => (
              <div
                key={space.id}
                onClick={() => onSelect(space)}
                className={`
                  px-3 py-2 cursor-pointer flex items-center gap-2.5 transition-colors focus:outline-none
                  ${index === selectedIndex ? 'bg-blue-50' : 'bg-transparent'}
                  hover:bg-default-100
                `}
              >
                {/* Icon */}
                <span className="text-lg min-w-[22px] text-center">
                  {getSpaceIcon(space)}
                </span>

                {/* Title and type */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {space.title}
                  </p>
                  <p className="text-xs text-default-400 leading-tight">
                    {getSpaceTypeBadge(space.type)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <span className="text-sm text-default-400">
                No spaces found
              </span>
            </div>
          )}
        </div>

        {/* Footer with hint */}
        <div className="px-2 py-1.5 border-t border-divider bg-default-50">
          <p className="text-xs text-default-400 text-center">
            ↑↓ to navigate • Enter to select • Esc to close
          </p>
        </div>
      </div>
    </>
  );
}
