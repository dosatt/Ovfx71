import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Database,
  Pencil,
  MoreVertical
} from 'lucide-react';
import { Space, SpaceType } from '../types';
import { SpaceContextMenu } from './SpaceContextMenu';
import * as LucideIcons from 'lucide-react';

interface DraggableSpaceItemProps {
  space: Space;
  spacesState: any;
  onSpaceClick: (space: Space) => void;
  level?: number;
  isFavorite?: boolean;
}

const spaceIcons: Record<SpaceType, any> = {
  page: FileText,
  canvas: Pencil,
  database: Database,
  dashboard: LayoutDashboard
};

const ITEM_TYPE = 'SPACE_REORDER';
const ITEM_TYPE_TO_WORKSPACE = 'SPACE_TO_WORKSPACE';

export function DraggableSpaceItem({ space, spacesState, onSpaceClick, level = 0, isFavorite = false }: DraggableSpaceItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<'before' | 'after' | 'inside' | null>(null);
  
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const children = spacesState.getChildren(space.id);
  const hasChildren = children.length > 0;
  const Icon = spaceIcons[space.type];

  const [{ isDragging }, drag] = useDrag(() => ({
    type: isFavorite ? 'FAVORITE_ITEM' : ITEM_TYPE_TO_WORKSPACE,
    item: { 
      id: space.id,
      parentId: space.parentId,
      spaceId: space.id,
      spaceData: space,
      isFavoriteItem: isFavorite,
      isSpaceDrag: true
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [space.id, space.parentId, isFavorite]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: isFavorite ? ['FAVORITE_ITEM'] : [ITEM_TYPE, ITEM_TYPE_TO_WORKSPACE],
    hover: (item: any, monitor) => {
      if (!ref.current || item.id === space.id) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Nei favoriti: solo riordino con UN SOLO snap point tra elementi
      if (isFavorite && item.isFavoriteItem) {
        // Ogni elemento gestisce solo la linea "before" (sopra)
        // In questo modo tra due elementi c'è un solo punto di snap
        if (hoverClientY < hoverHeight * 0.5) {
          setDropIndicator('before');
        } else {
          setDropIndicator(null);
        }
        return;
      }
      
      // Negli spaces: supporta riordino e nesting con zone più ampie
      if (!isFavorite && !item.isFavoriteItem) {
        // Evita di nestare un elemento in se stesso o nei propri figli
        const isDescendant = (parentId: string | undefined): boolean => {
          if (!parentId) return false;
          if (parentId === item.id) return true;
          const parent = spacesState.getSpace(parentId);
          if (!parent) return false;
          return isDescendant(parent.parentId);
        };
        
        if (isDescendant(space.id)) {
          setDropIndicator(null);
          return;
        }
        
        // Zone più ampie e chiare per il riordino
        // Top 25%: always before
        if (hoverClientY < hoverHeight * 0.25) {
          setDropIndicator('before');
        }
        // Middle 50%: inside se abbastanza a destra, altrimenti niente
        else if (hoverClientY >= hoverHeight * 0.25 && hoverClientY <= hoverHeight * 0.75) {
          const leftThreshold = 30;
          if (hoverClientX > leftThreshold) {
            setDropIndicator('inside');
          } else {
            setDropIndicator(null);
          }
        }
        // Bottom 25%: niente (il prossimo elemento gestirà il before)
        else {
          setDropIndicator(null);
        }
      }
    },
    drop: (item: any, monitor) => {
      if (item.id === space.id || !dropIndicator) return;
      
      if (isFavorite && item.isFavoriteItem) {
        // Riordino nei favoriti
        if (dropIndicator === 'before' || dropIndicator === 'after') {
          spacesState.reorderFavorites(item.id, space.id, dropIndicator);
        }
      } else if (!isFavorite && !item.isFavoriteItem) {
        if (dropIndicator === 'inside') {
          // Nesting: sposta come figlio
          spacesState.moveSpace(item.id, space.id);
        } else if (dropIndicator === 'before' || dropIndicator === 'after') {
          // Riordino: sposta before/after allo stesso livello
          spacesState.reorderSpaces(item.id, space.id, dropIndicator);
        }
      }
      
      setDropIndicator(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  }), [space.id, space.parentId, dropIndicator, isFavorite, spacesState, level]);

  drag(drop(ref));

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        {/* Drop indicator before - Posizione assoluta per non spostare gli elementi */}
        {isOver && dropIndicator === 'before' && (
          <Box sx={{ 
            position: 'absolute',
            top: '-1px',
            left: level * 2 + 1,
            right: 0,
            height: '2px', 
            bgcolor: 'primary.500',
            zIndex: 10
          }} />
        )}

        <Box
          ref={ref}
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            pl: isFavorite ? 0.5 : level * 1.5 + 0.5,
            pr: 1,
            py: 0.1,
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: isDragging ? 0.5 : 1,
            bgcolor: isOver && dropIndicator === 'inside' ? 'primary.softBg' : 'transparent',
            transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
            ...(isFavorite ? {
              // Favoriti: usa outline per non spostare elementi
              outline: 'none'
            } : {
              // Spaces: usa border per il contorno tratteggiato
              border: isOver && dropIndicator === 'inside' ? '2px dashed' : '2px solid transparent',
              borderColor: isOver && dropIndicator === 'inside' ? 'primary.500' : 'transparent'
            }),
            '&:hover': {
              bgcolor: dropIndicator === 'inside' && isOver ? 'primary.softBg' : 'background.level1',
              '& .menu-button': {
                opacity: 1
              }
            }
          }}
        >
          {/* Chevron o spazio vuoto - sempre presente per allineamento */}
          {!isFavorite && hasChildren ? (
            <IconButton
              size="sm"
              variant="plain"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ 
                minWidth: 16, 
                minHeight: 16,
                p: 0,
                mr: isFavorite ? 0 : 0.5
              }}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </IconButton>
          ) : (
            <Box sx={{ minWidth: 16, minHeight: 16, mr: isFavorite ? 0 : 0.5 }} />
          )}

          <Box
            onClick={() => onSpaceClick(space)}
            onContextMenu={handleContextMenu}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0
            }}
          >
            {(() => {
              let IconComponent = null;
              if (space.icon) {
                IconComponent = (LucideIcons as any)[space.icon];
              }
              if (!IconComponent) {
                IconComponent = Icon;
              }
              
              return IconComponent ? (
                <IconComponent 
                  size={16} 
                  style={{ 
                    flexShrink: 0,
                    color: space.iconColor || 'currentColor' 
                  }}
                />
              ) : (
                space.icon && <span style={{ fontSize: '1rem', flexShrink: 0 }}>{space.icon}</span>
              );
            })()}
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
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton
              ref={buttonRef}
              size="sm"
              variant="plain"
              className="menu-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              sx={{ 
                minWidth: 20, 
                minHeight: 20,
                opacity: 0
              }}
            >
              <MoreVertical size={14} />
            </IconButton>
          </Box>
        </Box>

        {/* Drop indicator after - Posizione assoluta per non spostare gli elementi */}
        {isOver && dropIndicator === 'after' && (
          <Box sx={{ 
            position: 'absolute',
            bottom: '-1px',
            left: level * 2 + 1,
            right: 0,
            height: '2px', 
            bgcolor: 'primary.500',
            zIndex: 10
          }} />
        )}

        {!isFavorite && hasChildren && expanded && (
          <Box>
            {children.map((child: Space) => (
              <DraggableSpaceItem
                key={child.id}
                space={child}
                spacesState={spacesState}
                onSpaceClick={onSpaceClick}
                level={level + 1}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Nuovo Context Menu unificato con funzione Rename inline */}
      {showMenu && (
        <SpaceContextMenu
          space={space}
          spacesState={spacesState}
          position={{ x: 0, y: 0 }}
          anchorRef={buttonRef}
          onClose={() => setShowMenu(false)}
        />
      )}

      {contextMenu && (
        <SpaceContextMenu
          space={space}
          spacesState={spacesState}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}