import { useState, useEffect, useRef } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import { Search } from 'lucide-react';
import { Space } from '../../types';

interface SpaceLinkAutocompleteProps {
  spaces: Space[];
  onSelect: (space: Space) => void;
  onClose: () => void;
  position: { top: number; left: number };
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
  currentSpaceId?: string; // ID dello space corrente da escludere
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
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
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
        onSelectedIndexChange(prev => Math.min(prev + 1, filteredSpaces.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (onSelectedIndexChange) {
        onSelectedIndexChange(prev => Math.max(prev - 1, 0));
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
      <Box
        onClick={onClose}
        onMouseDown={(e) => e.preventDefault()} // Previeni che l'overlay prenda il focus
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998
        }}
      />
      
      {/* Menu autocomplete */}
      <Box
        sx={{
          position: 'fixed',
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          bgcolor: 'background.popup',
          boxShadow: 'lg',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          zIndex: 9999,
          width: 400,
          maxHeight: 400,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search input */}
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search spaces..."
            startDecorator={<Search size={16} />}
            size="sm"
            autoFocus
            slotProps={{
              input: {
                ref: inputRef,
              }
            }}
            sx={{
              '--Input-focusedThickness': '1px',
            }}
          />
        </Box>

        {/* Results list */}
        <Box
          ref={listRef}
          sx={{
            overflow: 'auto',
            flex: 1
          }}
        >
          {filteredSpaces.length > 0 ? (
            filteredSpaces.map((space, index) => (
              <Box
                key={space.id}
                onClick={() => onSelect(space)}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: index === selectedIndex ? 'background.level1' : 'transparent',
                  '&:hover': {
                    bgcolor: 'background.level1'
                  },
                  transition: 'background-color 0.15s'
                }}
              >
                {/* Icon */}
                <Typography 
                  level="body-lg"
                  sx={{ minWidth: 24, textAlign: 'center' }}
                >
                  {getSpaceIcon(space)}
                </Typography>

                {/* Title and type */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    level="body-sm"
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {space.title}
                  </Typography>
                  <Typography 
                    level="body-xs" 
                    sx={{ color: 'text.tertiary' }}
                  >
                    {getSpaceTypeBadge(space.type)}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                No spaces found
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer con hint */}
        <Box 
          sx={{ 
            p: 1, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.level1'
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            ↑↓ to navigate • Enter to select • Esc to close
          </Typography>
        </Box>
      </Box>
    </>
  );
}