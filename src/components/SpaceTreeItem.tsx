import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Database,
  Pencil,
  MoreVertical,
  Star,
  Trash2,
  Edit2,
  Smile
} from 'lucide-react';
import { Space, SpaceType } from '../types';
import { IconPicker } from './IconPicker';
import * as LucideIcons from 'lucide-react';

interface SpaceTreeItemProps {
  space: Space;
  spacesState: any;
  onSpaceClick: (space: Space) => void;
  level?: number;
}

const spaceIcons: Record<SpaceType, any> = {
  page: FileText,
  canvas: Pencil,
  database: Database,
  dashboard: LayoutDashboard
};

const ITEM_TYPE = 'SPACE';
const ITEM_TYPE_TO_WORKSPACE = 'SPACE_TO_WORKSPACE'; // Per drag verso workspace
const ITEM_TYPE_TEXT_ELEMENT = 'TEXT_ELEMENT'; // Per drag di textElements

// Export per usare in altri componenti
export { ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT };

export function SpaceTreeItem({ space, spacesState, onSpaceClick, level = 0 }: SpaceTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [changingIcon, setChangingIcon] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const children = spacesState.getChildren(space.id);
  const hasChildren = children.length > 0;
  const Icon = spaceIcons[space.type];

  // Unified drag che funziona per entrambi gli scopi
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE_TO_WORKSPACE, // Uso sempre questo tipo principale
    item: { 
      id: space.id, 
      parentId: space.parentId,
      spaceId: space.id, 
      spaceData: space,
      // Flag per distinguere il comportamento
      isSpaceDrag: true
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [space.id, space.parentId, space]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ITEM_TYPE, ITEM_TYPE_TO_WORKSPACE],
    canDrop: (item: any) => item.id !== space.id && item.isSpaceDrag,
    drop: (item: any) => {
      if (item.id !== space.id && item.isSpaceDrag) {
        spacesState.moveSpace(item.id, space.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [space.id, spacesState]);

  drag(drop(ref));

  const handleToggleFavorite = () => {
    spacesState.toggleFavorite(space.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    spacesState.deleteSpace(space.id);
    setShowMenu(false);
  };

  const handleRename = () => {
    setShowMenu(false);
    setContextMenu(null);
    setRenaming(true);
    setRenameValue(space.title);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      spacesState.updateSpace(space.id, { title: renameValue.trim() });
      setRenaming(false);
      setRenameValue('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleIconChange = (icon: string) => {
    spacesState.updateSpace(space.id, { icon });
    setChangingIcon(false);
  };

  const handleColorChange = (color: string) => {
    spacesState.updateSpace(space.id, { iconColor: color });
  };

  const handleChangeIcon = () => {
    setShowMenu(false);
    setContextMenu(null);
    setChangingIcon(true);
  };

  const handleContextToggleFavorite = () => {
    spacesState.toggleFavorite(space.id);
    setContextMenu(null);
  };

  const handleContextDelete = () => {
    spacesState.deleteSpace(space.id);
    setContextMenu(null);
  };

  return (
    <>
      <Box>
        <Box
          ref={ref}
          sx={{
            display: 'flex',
            alignItems: 'center',
            pl: level * 2 + 1, // Indentazione progressiva per ogni livello + padding base
            pr: 1,
            py: 0.5,
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: isDragging ? 0.5 : 1,
            bgcolor: isOver && canDrop ? 'primary.softBg' : 'transparent',
            '&:hover': {
              bgcolor: 'background.level1',
              '& .menu-button': {
                opacity: 1
              }
            }
          }}
        >
          {hasChildren && (
            <IconButton
              size="sm"
              variant="plain"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ minWidth: 20, minHeight: 20, mr: 0.5 }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </IconButton>
          )}

          <Box
            onClick={() => onSpaceClick(space)}
            onContextMenu={handleContextMenu}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0,
              ml: hasChildren ? 0 : 2.5 // Allinea gli elementi senza figli con quelli che hanno figli
            }}
          >
            {(() => {
              // Determina l'icona da mostrare
              let IconComponent = null;
              if (space.icon) {
                IconComponent = (LucideIcons as any)[space.icon];
              }
              if (!IconComponent) {
                IconComponent = Icon; // Usa l'icona di default per tipo
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

        {hasChildren && expanded && (
          <Box>
            {children.map((child: Space) => (
              <SpaceTreeItem
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

      {/* Simple dropdown menu */}
      {showMenu && buttonRef.current && (() => {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 200;
        const menuHeight = 150; // Stima approssimativa
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calcola se il menu esce dallo schermo
        const isOffRight = buttonRect.left + menuWidth > windowWidth;
        const isOffBottom = buttonRect.bottom + menuHeight > windowHeight;
        
        return (
          <Box
            sx={{
              position: 'fixed',
              bgcolor: 'background.popup',
              boxShadow: 'md',
              borderRadius: '8px',
              p: 0.5,
              zIndex: 1000,
              minWidth: menuWidth,
              top: isOffBottom 
                ? `${buttonRect.top - menuHeight}px` 
                : `${buttonRect.bottom + 4}px`,
              left: isOffRight 
                ? `${buttonRect.right - menuWidth}px` 
                : `${buttonRect.left}px`
            }}
          >
            <Box
              onClick={handleRename}
              sx={{
                p: 1,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  bgcolor: 'background.level1'
                }
              }}
            >
              <Edit2 size={14} />
              <Typography level="body-sm">
                Rename
              </Typography>
            </Box>
            <Box
              onClick={handleToggleFavorite}
              sx={{
                p: 1,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  bgcolor: 'background.level1'
                }
              }}
            >
              <Star size={14} />
              <Typography level="body-sm">
                {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </Typography>
            </Box>
            <Box
              onClick={handleDelete}
              sx={{
                p: 1,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'danger.500',
                '&:hover': {
                  bgcolor: 'danger.softBg'
                }
              }}
            >
              <Trash2 size={14} />
              <Typography level="body-sm">Delete</Typography>
            </Box>
          </Box>
        );
      })()}

      {/* Backdrop to close menu */}
      {showMenu && (
        <Box
          onClick={() => setShowMenu(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}

      {/* Rename modal */}
      <Modal open={renaming} onClose={() => setRenaming(false)}>
        <ModalDialog>
          <Typography level="title-md" sx={{ mb: 1.5 }}>
            Rinomina Space
          </Typography>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenaming(false);
            }}
            placeholder="Nome dello space"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="plain" onClick={() => setRenaming(false)}>
              Annulla
            </Button>
            <Button onClick={handleRenameSubmit}>
              Salva
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Icon change modal */}
      <Modal open={changingIcon} onClose={() => setChangingIcon(false)}>
        <ModalDialog>
          <Typography level="title-md" sx={{ mb: 1.5 }}>
            Cambia Icona
          </Typography>
          <IconPicker
            currentIcon={space.icon}
            onIconChange={handleIconChange}
            onColorChange={handleColorChange}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="plain" onClick={() => setChangingIcon(false)}>
              Annulla
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Context menu */}
      {contextMenu && (
        <Box
          sx={{
            position: 'fixed',
            bgcolor: 'background.popup',
            boxShadow: 'md',
            borderRadius: '8px',
            p: 0.5,
            zIndex: 1000,
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: 'translate(-50%, calc(-100% - 4px))'
          }}
        >
          <Box
            onClick={handleRename}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <Edit2 size={14} />
            <Typography level="body-sm">
              Rename
            </Typography>
          </Box>
          <Box
            onClick={handleContextToggleFavorite}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <Star size={14} />
            <Typography level="body-sm">
              {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </Typography>
          </Box>
          <Box
            onClick={handleContextDelete}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'danger.500',
              '&:hover': {
                bgcolor: 'danger.softBg'
              }
            }}
          >
            <Trash2 size={14} />
            <Typography level="body-sm">Delete</Typography>
          </Box>
          <Box
            onClick={handleChangeIcon}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <Smile size={14} />
            <Typography level="body-sm">Change Icon</Typography>
          </Box>
        </Box>
      )}

      {/* Backdrop to close context menu */}
      {contextMenu && (
        <Box
          onClick={() => setContextMenu(null)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </>
  );
}