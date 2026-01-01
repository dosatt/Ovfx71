import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input, Button } from '@heroui/react';
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
        <div
          ref={menuRef}
          className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] border border-divider min-w-[200px] max-w-[250px]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <div
            onClick={handleToggleFavorite}
            className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors overflow-hidden"
          >
            <Star size={14} className="shrink-0" />
            <span className="text-small truncate">
              {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </div>

          <div
            onClick={handleShowMoveMenu}
            className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors overflow-hidden"
          >
            <FolderInput size={14} className="shrink-0" />
            <span className="text-small truncate flex-1">Move to</span>
            <ChevronRight size={12} className="shrink-0" />
          </div>

          <div
            onClick={handleShowIconPicker}
            className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors overflow-hidden"
          >
            <Smile size={14} className="shrink-0" />
            <span className="text-small truncate">Change icon</span>
          </div>

          <div
            onClick={handleDeleteClick}
            className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors overflow-hidden"
          >
            <Trash2 size={14} className="shrink-0 text-red-600" />
            <span className="text-small truncate text-red-600">Delete</span>
          </div>
        </div>
      )}

      {/* Icon Picker Dropdown */}
      {showIconPicker && (
        <div
          ref={iconPickerRef}
          className="fixed bg-white shadow-lg rounded-lg p-3 z-[1001] border border-divider w-[340px]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          {/* Header con pulsante Back */}
          <div className="flex items-center gap-2 mb-3">
            <div
              onClick={() => setShowIconPicker(false)}
              className="flex items-center justify-center cursor-pointer p-1 rounded-md hover:bg-default-100 transition-colors"
            >
              <ArrowLeft size={16} />
            </div>
            <span className="text-small font-semibold">Change Icon</span>
          </div>
          
          <IconPicker
            currentIcon={tempIcon}
            currentColor={tempColor}
            onIconChange={setTempIcon}
            onColorChange={setTempColor}
          />
          <div className="flex gap-2 justify-end mt-3">
            <Button 
              size="sm" 
              variant="light" 
              onPress={() => setShowIconPicker(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              color="primary"
              onPress={handleConfirmIcon}
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Move Menu Dropdown */}
      {showMoveMenu && (() => {
        const availableSpaces = getAllSpaces();
        const filteredSpaces = availableSpaces.filter(s => 
          s.title.toLowerCase().includes(moveSearch.toLowerCase())
        );

        return (
          <div
            ref={moveMenuRef}
            className="fixed bg-white shadow-lg rounded-lg p-2 z-[1001] border border-divider min-w-[250px] max-w-[300px] flex flex-col max-h-[350px]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`
            }}
          >
            {/* Header con pulsante Back */}
            <div className="flex items-center gap-2 mb-2">
              <div
                onClick={() => setShowMoveMenu(false)}
                className="flex items-center justify-center cursor-pointer p-1 rounded-md hover:bg-default-100 transition-colors"
              >
                <ArrowLeft size={16} />
              </div>
              <span className="text-small font-semibold">Move to</span>
            </div>
            
            <Input
              size="sm"
              placeholder="Search spaces..."
              value={moveSearch}
              onValueChange={setMoveSearch}
              variant="bordered"
              className="mb-2"
            />
            <div className="overflow-y-auto flex-1 flex flex-col">
              {filteredSpaces.length === 0 ? (
                <span className="text-small text-default-400 p-2 text-center">No spaces available</span>
              ) : (
                filteredSpaces.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleMoveToSpace(s.id)}
                    className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                  >
                    <span className="text-small truncate">{s.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
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
      <div
        onClick={onClose}
        className="fixed inset-0 z-[999]"
      />
    </>,
    document.body
  );
}
