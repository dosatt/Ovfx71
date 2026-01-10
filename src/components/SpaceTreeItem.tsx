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
  Star,
  Trash2,
  Edit2,
  Smile,
  ArrowLeft,
  Settings2
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
const ITEM_TYPE_TO_WORKSPACE = 'SPACE_TO_WORKSPACE';
const ITEM_TYPE_TEXT_ELEMENT = 'TEXT_ELEMENT';

export { ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT };

export function SpaceTreeItem({ space, spacesState, onSpaceClick, level = 0 }: SpaceTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [changingIcon, setChangingIcon] = useState(false);
  const [tempIcon, setTempIcon] = useState(space.icon || '');
  const [tempColor, setTempColor] = useState(space.iconColor || '');

  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const children = spacesState.getChildren(space.id);
  const hasChildren = children.length > 0;
  const Icon = spaceIcons[space.type];

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE_TO_WORKSPACE,
    item: {
      id: space.id,
      parentId: space.parentId,
      spaceId: space.id,
      spaceData: space,
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

  const handleToggleProperties = () => {
    const currentShow = space.metadata?.showProperties === true;
    spacesState.updateSpace(space.id, {
      metadata: { ...space.metadata, showProperties: !currentShow }
    });
    setShowMenu(false);
    setContextMenu(null);
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
    setTempIcon(icon);
  };

  const handleColorChange = (color: string) => {
    setTempColor(color);
  };

  const handleConfirmIcon = () => {
    spacesState.updateSpace(space.id, { icon: tempIcon, iconColor: tempColor });
    setChangingIcon(false);
  };

  const handleChangeIcon = () => {
    setShowMenu(false);
    setContextMenu(null);
    setTempIcon(space.icon || '');
    setTempColor(space.iconColor || '');
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
      <div>
        <div
          ref={ref}
          className={`
            flex items-center pr-2 py-1 rounded-lg cursor-pointer transition-colors duration-150 ease-out group
            ${isDragging ? 'opacity-50' : 'opacity-100'}
            ${isOver && canDrop ? 'bg-primary/10' : 'hover:bg-default-100'}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="min-w-[20px] w-5 h-5 p-0 mr-1 text-default-500"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </Button>
          )}

          <div
            onClick={() => onSpaceClick(space)}
            onContextMenu={handleContextMenu}
            className={`flex-1 flex items-center gap-2 min-w-0 ${hasChildren ? '' : 'ml-[24px]'}`}
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
            <span className="text-small truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {space.title}
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

        {hasChildren && expanded && (
          <div>
            {children.map((child: Space) => (
              <SpaceTreeItem
                key={child.id}
                space={child}
                spacesState={spacesState}
                onSpaceClick={onSpaceClick}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Simple dropdown menu */}
      {showMenu && buttonRef.current && (() => {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 200;
        const menuHeight = 150;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const isOffRight = buttonRect.left + menuWidth > windowWidth;
        const isOffBottom = buttonRect.bottom + menuHeight > windowHeight;

        return (
          <>
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => setShowMenu(false)}
            />
            <div
              className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] border border-divider min-w-[200px]"
              style={{
                top: isOffBottom ? `${buttonRect.top - menuHeight}px` : `${buttonRect.bottom + 4}px`,
                left: isOffRight ? `${buttonRect.right - menuWidth}px` : `${buttonRect.left}px`
              }}
            >
              <div
                onClick={handleRename}
                className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
              >
                <Edit2 size={14} />
                <span className="text-small">Rename</span>
              </div>
              <div
                onClick={handleToggleFavorite}
                className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
              >
                <Star size={14} />
                <span className="text-small">
                  {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </span>
              </div>
              {space.type === 'page' && (
                <div
                  onClick={handleToggleProperties}
                  className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                >
                  <Settings2 size={14} />
                  <span className="text-small">
                    {space.metadata?.showProperties === true ? 'Hide Properties' : 'Show Properties'}
                  </span>
                </div>
              )}
              <div
                onClick={handleDelete}
                className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} className="text-red-600" />
                <span className="text-small text-red-600">Delete</span>
              </div>
            </div>
          </>
        );
      })()}

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

      {/* Icon change modal */}
      <Modal isOpen={changingIcon} onClose={() => setChangingIcon(false)} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center">
                <Button isIconOnly variant="light" size="sm" onPress={onClose}>
                  <ArrowLeft size={18} />
                </Button>
                Change Icon
              </ModalHeader>
              <ModalBody>
                <IconPicker
                  currentIcon={tempIcon}
                  currentColor={tempColor}
                  onIconChange={handleIconChange}
                  onColorChange={handleColorChange}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleConfirmIcon}>
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] border border-divider min-w-[180px]"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              transform: 'translate(-50%, -100%) translateY(-4px)'
            }}
          >
            <div
              onClick={handleRename}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
            >
              <Edit2 size={14} />
              <span className="text-small">Rename</span>
            </div>
            <div
              onClick={handleContextToggleFavorite}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
            >
              <Star size={14} />
              <span className="text-small">
                {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </span>
            </div>
            {space.type === 'page' && (
              <div
                onClick={handleToggleProperties}
                className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
              >
                <Settings2 size={14} />
                <span className="text-small">
                  {space.metadata?.showProperties === true ? 'Hide Properties' : 'Show Properties'}
                </span>
              </div>
            )}
            <div
              onClick={handleChangeIcon}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
            >
              <Smile size={14} />
              <span className="text-small">Change Icon</span>
            </div>
            <div
              onClick={handleContextDelete}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-red-600" />
              <span className="text-small text-red-600">Delete</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}