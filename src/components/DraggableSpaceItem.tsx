import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input
} from '@heroui/react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Database,
  Pencil,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { Space, SpaceType } from '../types';
import { SpaceContextMenu } from './SpaceContextMenu';
import * as LucideIcons from 'lucide-react';

interface DraggableSpaceItemProps {
  space: Space;
  spacesState: any;
  onSpaceClick: (e: React.MouseEvent, space: Space) => void;
  onSpaceDoubleClick: (space: Space) => void;
  isSelected?: boolean;
  selectedSpaceIds?: string[];
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

export function DraggableSpaceItem({
  space,
  spacesState,
  onSpaceClick,
  onSpaceDoubleClick,
  isSelected = false,
  selectedSpaceIds = [],
  level = 0,
  isFavorite = false
}: DraggableSpaceItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
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

      // In favorites: only reordering with ONE snap point between elements
      if (isFavorite && item.isFavoriteItem) {
        // Each element handles only the "before" line (above)
        if (hoverClientY < hoverHeight * 0.5) {
          setDropIndicator('before');
        } else {
          setDropIndicator(null);
        }
        return;
      }

      // In spaces: supports reordering and nesting with wider zones
      if (!isFavorite && !item.isFavoriteItem) {
        // Avoid nesting an element into itself or its children
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

        // Wider and clearer zones for reordering
        // Top 25%: always before
        if (hoverClientY < hoverHeight * 0.25) {
          setDropIndicator('before');
        }
        // Middle 50%: inside if far enough to the right, otherwise nothing
        else if (hoverClientY >= hoverHeight * 0.25 && hoverClientY <= hoverHeight * 0.75) {
          const leftThreshold = 30;
          if (hoverClientX > leftThreshold) {
            setDropIndicator('inside');
          } else {
            setDropIndicator(null);
          }
        }
        // Bottom 25%: nothing (the next element will handle before)
        else {
          setDropIndicator(null);
        }
      }
    },
    drop: (item: any, monitor) => {
      if (item.id === space.id || !dropIndicator) return;

      if (isFavorite && item.isFavoriteItem) {
        // Reordering in favorites
        if (dropIndicator === 'before' || dropIndicator === 'after') {
          spacesState.reorderFavorites(item.id, space.id, dropIndicator);
        }
      } else if (!isFavorite && !item.isFavoriteItem) {
        if (dropIndicator === 'inside') {
          // Nesting: move as a child
          spacesState.moveSpace(item.id, space.id);
        } else if (dropIndicator === 'before' || dropIndicator === 'after') {
          // Reordering: move before/after to the same level
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

  return (
    <>
      <div className="relative">
        {/* Drop indicator before */}
        {isOver && dropIndicator === 'before' && (
          <div
            className="absolute top-[-1px] right-0 h-[2px] bg-primary z-10 pointer-events-none"
            style={{ left: `${level * 16 + 8}px` }}
          />
        )}

        <div
          ref={ref}
          className={`
            relative flex items-center pr-2 py-0.5 rounded-lg cursor-pointer transition-all duration-150 ease-out group
            ${isDragging ? 'opacity-50' : 'opacity-100'}
            ${isOver && dropIndicator === 'inside' ? 'bg-primary/10 border-2 border-dashed border-primary' : 'border-2 border-transparent'}
            ${isSelected ? 'bg-primary/10 text-primary-900 border-primary/20' : (!isOver && !isDragging ? 'hover:bg-default-100' : '')}
          `}
          style={{ paddingLeft: `${isFavorite ? 4 : level * 12 + 4}px` }}
        >
          {/* Chevron or empty space */}
          {!isFavorite && hasChildren ? (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="min-w-[16px] w-4 h-4 p-0 mr-1 text-default-500"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </Button>
          ) : (
            <div className={`min-w-[16px] w-4 h-4 ${isFavorite ? 'mr-0' : 'mr-1'}`} />
          )}

          <div
            onClick={(e) => onSpaceClick(e, space)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onSpaceDoubleClick(space);
            }}
            onContextMenu={handleContextMenu}
            className="flex-1 flex items-center gap-2 min-w-0"
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
                  className="shrink-0"
                  style={{ color: space.iconColor || 'currentColor' }}
                />
              ) : (
                space.icon && <span className="text-base shrink-0">{space.icon}</span>
              );
            })()}
            <span className={`text-small truncate overflow-hidden text-ellipsis whitespace-nowrap ${isSelected ? 'font-medium' : ''}`}>
              {space.title || (space.type === 'page' ? 'New page' : `New ${space.type}`)}
            </span>
          </div>

          <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              ref={buttonRef}
              isIconOnly
              size="sm"
              variant="light"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="min-w-[20px] w-5 h-5"
            >
              <MoreVertical size={14} />
            </Button>
          </div>
        </div>

        {/* Drop indicator after */}
        {isOver && dropIndicator === 'after' && (
          <div
            className="absolute bottom-[-1px] right-0 h-[2px] bg-primary z-10 pointer-events-none"
            style={{ left: `${level * 16 + 8}px` }}
          />
        )}

        {!isFavorite && hasChildren && expanded && (
          <div>
            {children.map((child: Space) => (
              <DraggableSpaceItem
                key={child.id}
                space={child}
                spacesState={spacesState}
                onSpaceClick={onSpaceClick}
                onSpaceDoubleClick={onSpaceDoubleClick}
                isSelected={selectedSpaceIds?.includes(child.id)}
                selectedSpaceIds={selectedSpaceIds}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showMenu && (
        <SpaceContextMenu
          space={space}
          spacesState={spacesState}
          selectedSpaceIds={selectedSpaceIds}
          position={{ x: 0, y: 0 }}
          anchorRef={buttonRef}
          onClose={() => setShowMenu(false)}
          onRename={handleRename}
        />
      )}

      {contextMenu && (
        <SpaceContextMenu
          space={space}
          spacesState={spacesState}
          selectedSpaceIds={selectedSpaceIds}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
        />
      )}

      {/* Rename modal */}
      <Modal isOpen={renaming} onClose={() => setRenaming(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Rename Space</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  value={renameValue}
                  onValueChange={setRenameValue}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenaming(false);
                  }}
                  placeholder="Space name"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleRenameSubmit}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}