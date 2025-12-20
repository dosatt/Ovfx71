import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import { 
  Edit2, 
  Star, 
  Trash2,
  FolderInput,
  ChevronRight,
  Smile,
  ArrowLeft
} from 'lucide-react';
import { Space } from '../types';
import { IconPicker } from './IconPicker';
import { DeleteSpaceDialog } from './spaces/DeleteSpaceDialog';

interface SpaceContextMenuProps {
  space: Space;
  spacesState: any;
  position: { x: number; y: number };
  anchorRef?: React.RefObject<HTMLElement>;
  onClose: () => void;
  onRename?: () => void;
}

export function SpaceContextMenu({ 
  space, 
  spacesState, 
  position, 
  anchorRef,
  onClose,
  onRename
}: SpaceContextMenuProps) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [linkedPagesCount, setLinkedPagesCount] = useState(0);
  const [moveSearch, setMoveSearch] = useState('');
  const [tempIcon, setTempIcon] = useState(space.icon || '');
  const [tempColor, setTempColor] = useState(space.iconColor || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // Calcola la posizione ottimale del menu
  const getMenuPosition = () => {
    const menuWidth = 200;
    const menuHeight = 200;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = position.y;
    let left = position.x;

    // Se c'è un anchorRef (pulsante dei 3 puntini), posiziona rispetto ad esso
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      top = rect.bottom + 4;
      left = rect.left;

      // Controlla se va fuori a destra
      if (left + menuWidth > windowWidth) {
        left = rect.right - menuWidth;
      }

      // Controlla se va fuori in basso
      if (top + menuHeight > windowHeight) {
        top = rect.top - menuHeight - 4;
      }
    } else {
      // Context menu con tasto destro
      // Controlla se va fuori a destra
      if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 8;
      }

      // Controlla se va fuori a sinistra
      if (left < 8) {
        left = 8;
      }

      // Controlla se va fuori in basso
      if (top + menuHeight > windowHeight) {
        top = windowHeight - menuHeight - 8;
      }

      // Controlla se va fuori in alto
      if (top < 8) {
        top = 8;
      }
    }

    return { top, left };
  };

  const menuPosition = getMenuPosition();

  const handleToggleFavorite = () => {
    spacesState.toggleFavorite(space.id);
    onClose();
  };

  const handleDeleteClick = () => {
    // Controlla se ci sono link a questo space
    const linkedSpaces = spacesState.findSpacesLinkingTo(space.id);
    setLinkedPagesCount(linkedSpaces.length);
    
    if (linkedSpaces.length > 0) {
      setShowDeleteDialog(true);
    } else {
      handleDelete();
    }
  };

  const handleDelete = () => {
    spacesState.deleteSpace(space.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const handleShowIconPicker = () => {
    setTempIcon(space.icon || '');
    setTempColor(space.iconColor || '');
    setShowIconPicker(true);
  };

  const handleConfirmIcon = () => {
    if (tempIcon) {
      spacesState.updateSpace(space.id, { icon: tempIcon });
    }
    if (tempColor) {
      spacesState.updateSpace(space.id, { iconColor: tempColor });
    }
    setShowIconPicker(false);
    onClose();
  };

  const handleShowMoveMenu = () => {
    setShowMoveMenu(true);
  };

  const handleMoveToSpace = (targetSpaceId: string) => {
    spacesState.moveSpace(space.id, targetSpaceId);
    onClose();
  };

  // Ottieni tutti gli spaces disponibili per lo spostamento
  const getAllSpaces = (): Space[] => {
    const allSpaces: Space[] = [];
    const visited = new Set<string>();

    const traverse = (spaceId: string | null) => {
      const children = spacesState.getChildren(spaceId);
      children.forEach((child: Space) => {
        if (child.id !== space.id && !visited.has(child.id)) {
          visited.add(child.id);
          allSpaces.push(child);
          traverse(child.id);
        }
      });
    };

    traverse(null);
    return allSpaces;
  };

  return createPortal(
    <>
      {/* Main Menu */}
      {!showIconPicker && !showMoveMenu && (
        <Box
          ref={menuRef}
          sx={{
            position: 'fixed',
            bgcolor: 'background.popup',
            boxShadow: 'md',
            borderRadius: '8px',
            p: 0.5,
            zIndex: 1000,
            minWidth: 200,
            maxWidth: 250,
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <Box
            onClick={handleToggleFavorite}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <Star size={14} style={{ flexShrink: 0 }} />
            <Typography level="body-sm" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </Typography>
          </Box>

          <Box
            onClick={handleShowMoveMenu}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <FolderInput size={14} style={{ flexShrink: 0 }} />
            <Typography level="body-sm" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
              Move to
            </Typography>
            <ChevronRight size={12} style={{ flexShrink: 0 }} />
          </Box>

          <Box
            onClick={handleShowIconPicker}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <Smile size={14} style={{ flexShrink: 0 }} />
            <Typography level="body-sm" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Change icon
            </Typography>
          </Box>

          <Box
            onClick={handleDeleteClick}
            sx={{
              p: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'danger.500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              '&:hover': {
                bgcolor: 'danger.softBg'
              }
            }}
          >
            <Trash2 size={14} style={{ flexShrink: 0 }} />
            <Typography level="body-sm" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Delete
            </Typography>
          </Box>
        </Box>
      )}

      {/* Icon Picker Dropdown */}
      {showIconPicker && (
        <Box
          ref={iconPickerRef}
          sx={{
            position: 'fixed',
            bgcolor: 'background.popup',
            boxShadow: 'md',
            borderRadius: '8px',
            p: 1.5,
            zIndex: 1001,
            width: 340,
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          {/* Header con pulsante Back */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box
              onClick={() => setShowIconPicker(false)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                p: 0.5,
                borderRadius: '6px',
                '&:hover': {
                  bgcolor: 'background.level1'
                }
              }}
            >
              <ArrowLeft size={16} />
            </Box>
            <Typography level="title-sm">
              Change Icon
            </Typography>
          </Box>
          
          <IconPicker
            currentIcon={tempIcon}
            currentColor={tempColor}
            onIconChange={setTempIcon}
            onColorChange={setTempColor}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
            <Button 
              size="sm" 
              variant="plain" 
              onClick={() => setShowIconPicker(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleConfirmIcon}
            >
              OK
            </Button>
          </Box>
        </Box>
      )}

      {/* Move Menu Dropdown */}
      {showMoveMenu && (() => {
        const availableSpaces = getAllSpaces();
        const filteredSpaces = availableSpaces.filter(s => 
          s.title.toLowerCase().includes(moveSearch.toLowerCase())
        );

        return (
          <Box
            ref={moveMenuRef}
            sx={{
              position: 'fixed',
              bgcolor: 'background.popup',
              boxShadow: 'md',
              borderRadius: '8px',
              p: 1,
              zIndex: 1001,
              minWidth: 250,
              maxWidth: 300,
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              maxHeight: '350px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header con pulsante Back */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                onClick={() => setShowMoveMenu(false)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '6px',
                  '&:hover': {
                    bgcolor: 'background.level1'
                  }
                }}
              >
                <ArrowLeft size={16} />
              </Box>
              <Typography level="title-sm">
                Move to
              </Typography>
            </Box>
            
            <Input
              size="sm"
              placeholder="Search spaces..."
              value={moveSearch}
              onChange={(e) => setMoveSearch(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {filteredSpaces.length === 0 ? (
                <Typography level="body-sm" sx={{ p: 1, textAlign: 'center', color: 'text.tertiary' }}>
                  No spaces available
                </Typography>
              ) : (
                filteredSpaces.map((s) => (
                  <Box
                    key={s.id}
                    onClick={() => handleMoveToSpace(s.id)}
                    sx={{
                      p: 1,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      '&:hover': {
                        bgcolor: 'background.level1'
                      }
                    }}
                  >
                    <Typography 
                      level="body-sm" 
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.title}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        );
      })()}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <DeleteSpaceDialog
          open={showDeleteDialog}
          spaceId={space.id}
          linkedPagesCount={linkedPagesCount}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
      />
    </>,
    document.body
  );
}