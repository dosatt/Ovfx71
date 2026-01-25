import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { domToDataUrl } from 'modern-screenshot';
import { useDrag, useDrop } from 'react-dnd';
import {
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Card,
  CardBody
} from '@heroui/react';
import { X, FileCode, SplitSquareVertical, SplitSquareHorizontal, Plus, Star, File, Edit2, Trash2, LayoutGrid, DiamondPlus, Menu, Settings as SettingsIcon, Settings2, Eye, Calendar, Globe, MessageSquare, Mail, Clock, Archive, Bell, FileText, Pencil, Database, LayoutDashboard } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Viewport } from '../types';
import type { Space } from '../types';
import type { Settings } from '../hooks/useSettings';
import { PropertiesView } from './spaces/PropertiesView';
import { TabPreview } from './TabPreview';

const ITEM_TYPE_TAB = 'VIEWPORT_TAB';

interface TabItemProps {
  tab: any;
  viewport: Viewport;
  isActive: boolean;
  tabSpace: Space | null;
  showTitle: boolean;
  isOnlyWelcomeTab: boolean;
  IconComponent: any;
  iconColor: string;
  displayTitle: string;
  settings: Settings;
  viewportsState: any;
  spacesState: any;
  onCloseTab: (tabId: string) => void;
  onContextMenu: (e: React.MouseEvent, tabId: string, title: string) => void;
  index: number;
}

function TabItem({
  tab,
  viewport,
  isActive,
  tabSpace,
  showTitle,
  isOnlyWelcomeTab,
  IconComponent,
  iconColor,
  displayTitle,
  settings,
  viewportsState,
  spacesState,
  onCloseTab,
  onContextMenu,
  index
}: TabItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isViewportFocused = viewportsState.focusedViewportId === viewport.id;

  const captureCurrentView = async () => {
    // We only capture what's currently VISIBLE in the viewport content area
    const container = document.querySelector(`[data-viewport-id="${viewport.id}"] [data-viewport-content]`);
    if (!container) return;

    try {
      // Find the currently active tab ID to assign the preview to it
      const activeTabId = viewport.tabs.find(t => t.id === viewport.activeTabId)?.id;
      if (!activeTabId) return;

      const dataUrl = await domToDataUrl(container as HTMLElement, {
        scale: 0.52,
        quality: 0.6
      });

      viewportsState.setTabPreview(viewport.id, activeTabId, dataUrl);
    } catch (err) {
      // Silent fail
    }
  };

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE_TAB,
    item: { tabId: tab.id, sourceViewportId: viewport.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE_TAB,
    hover: (item: any, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceViewportId = item.sourceViewportId;

      // Se stiamo trascinando nello stesso viewport
      if (sourceViewportId === viewport.id) {
        if (dragIndex === hoverIndex) return;

        // Determiniamo il rettangolo dell'elemento
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientX = (clientOffset?.x || 0) - hoverBoundingRect.left;

        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

        viewportsState.moveTab(viewport.id, viewport.id, item.tabId, hoverIndex);
        item.index = hoverIndex;
      }
    },
    drop: (item: any) => {
      if (item.sourceViewportId !== viewport.id) {
        viewportsState.moveTab(item.sourceViewportId, viewport.id, item.tabId, index);
      }
    }
  });

  drag(drop(ref));

  const getTabActiveStyle = () => {
    if (!isActive || !isViewportFocused) return {};

    const isLight = settings.theme === 'light';

    if (settings.backgroundType === 'gradient') {
      return {
        background: `linear-gradient(${settings.gradientAngle}deg, ${settings.gradientStart} 0%, ${settings.gradientEnd} 100%)`,
        filter: isLight ? 'brightness(0.98) contrast(1.02)' : 'brightness(1.1) saturate(1.2)',
        color: isLight ? '#111827' : 'white'
      };
    }
    return {
      backgroundColor: settings.backgroundColor,
      filter: isLight ? 'brightness(0.98) contrast(1.02)' : 'brightness(0.9) saturate(1.5)',
      color: isLight ? '#111827' : 'white'
    };
  };

  return (
    <div
      ref={ref}
      className={`flex-shrink-0 flex items-center h-full py-1 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (isActive) {
          captureCurrentView();
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip
        content={
          <div className="p-0.5">
            <div className="aspect-video w-[360px] rounded-xl bg-default-200/20 overflow-hidden relative border border-white/10 shadow-inner group">
              <TabPreview tab={tab} tabSpace={tabSpace} spacesState={spacesState} />
            </div>
          </div>
        }
        size="sm"
        delay={400}
        closeDelay={0}
      >
        <Button
          size="sm"
          variant={isActive ? (isViewportFocused ? 'solid' : 'flat') : 'light'}
          color={isActive ? (isViewportFocused ? 'primary' : 'default') : 'default'}
          onClick={() => {
            if (!isActive) {
              captureCurrentView(); // Capture before switching
            }
            viewportsState.setActiveTab(viewport.id, tab.id);
            viewportsState.setFocusedViewportId(viewport.id);
          }}
          style={getTabActiveStyle()}
          startContent={
            (isActive || showTitle) ? (
              IconComponent ? (
                <IconComponent size={14} style={{ color: isActive && isViewportFocused ? (settings.theme === 'light' ? '#111827' : 'white') : iconColor }} className="shrink-0" />
              ) : (
                tabSpace?.icon && <span className="shrink-0 text-[14px]">{tabSpace.icon}</span>
              )
            ) : (
              IconComponent ? (
                <IconComponent size={14} style={{ color: iconColor }} />
              ) : (
                tabSpace?.icon || '📄'
              )
            )
          }
          endContent={
            (isActive || isHovered) ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`ml-1 flex items-center cursor-pointer hover:bg-black/5 rounded-full p-0.5 transition-all ${isActive && isViewportFocused ? (settings.theme === 'light' ? 'text-black/60' : 'text-white/80') : 'text-default-500'}`}
              >
                <X size={12} />
              </span>
            ) : undefined
          }
          className={`
            h-8 min-h-0 rounded-full transition-all duration-300
          ${isActive ? 'shadow-lg px-4' : 'px-3 text-default-500 hover:text-default-900'}
          ${isActive && !isViewportFocused ? 'bg-default-200/50 text-default-700' : ''}
          ${isActive || showTitle ? 'min-w-[100px] max-w-[160px] justify-between' : 'min-w-[32px] w-auto justify-center'}
          ${isViewportFocused && isActive ? `border-1 ${settings.theme === 'light' ? 'border-black/5 shadow-black/5' : 'border-white/40 shadow-primary/20'} shadow-xl scale-105` : ''}
          `}
          onContextMenu={(e) => onContextMenu(e, tab.id, tab.title)}
        >
          {(isActive || showTitle) && (
            <span className={`truncate text-left flex-1 text-[13px] font-semibold ml-1 ${isActive && isViewportFocused ? (settings.theme === 'light' ? 'text-black' : 'text-white') : (isActive ? 'text-default-700' : '')}`}>
              {displayTitle}
            </span>
          )}
        </Button>
      </Tooltip>
    </div >
  );
}

interface ViewportHeaderProps {
  viewport: Viewport;
  space: Space | null;
  spacesState: any;
  viewportsState: any;
  showMarkdown?: boolean;
  onToggleMarkdown?: () => void;
  settings: Settings;
}

export function ViewportHeader({ viewport, space, spacesState, viewportsState, showMarkdown, onToggleMarkdown, settings }: ViewportHeaderProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string; title: string } | null>(null);
  const [renameTabId, setRenameTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<HTMLElement | null>(null);
  const [hamburgerMenuAnchor, setHamburgerMenuAnchor] = useState<HTMLElement | null>(null);

  const canClose = viewport.id !== 'root';
  const activeTab = viewport.tabs?.find(t => t && t.id === viewport.activeTabId);

  const handleCloseTab = (tabId: string) => {
    if (viewport.tabs.length === 1) {
      // Se è l'ultima tab, chiudi l'intero viewport invece di sostituire con welcome
      if (viewport.id !== 'root') {
        viewportsState.closeViewport(viewport.id);
      } else {
        // Se è il root, sostituisci con welcome come fallback
        viewportsState.updateTab(viewport.id, tabId, { spaceId: 'welcome', title: 'Welcome to OVFX' });
      }
    } else {
      viewportsState.closeTab(viewport.id, tabId);
    }
  };

  const handleTabContextMenu = (e: React.MouseEvent, tabId: string, title: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId,
      title
    });
  };

  const handleRename = () => {
    if (contextMenu) {
      setRenameTabId(contextMenu.tabId);
      setRenameValue(contextMenu.title);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      handleCloseTab(contextMenu.tabId);
      setContextMenu(null);
    }
  };

  const handleRenameSubmit = () => {
    if (renameTabId && renameValue.trim()) {
      viewportsState.updateTab(viewport.id, renameTabId, { title: renameValue.trim() });
      setRenameTabId(null);
      setRenameValue('');
    }
  };

  const [{ isOverTabArea }, dropTabArea] = useDrop({
    accept: ITEM_TYPE_TAB,
    drop: (item: any, monitor) => {
      // Se il drop non è stato gestito da un TabItem (quindi è sulla parte vuota dell'area tab)
      if (!monitor.didDrop() && item.sourceViewportId !== viewport.id) {
        viewportsState.moveTab(item.sourceViewportId, viewport.id, item.tabId, viewport.tabs.length);
      }
    },
    collect: (monitor) => ({
      isOverTabArea: monitor.isOver({ shallow: true })
    })
  });

  const isViewportFocused = viewportsState.focusedViewportId === viewport.id;

  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 gap-3 min-h-[44px] transition-all duration-300 bg-transparent ${isViewportFocused ? 'opacity-100' : 'opacity-80'}`}
      onClick={() => viewportsState.setFocusedViewportId(viewport.id)}
    >
      {/* Navigation - Replaced by Hamburger Menu */}
      <div className="flex gap-1 shrink-0">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onClick={(e) => setHamburgerMenuAnchor(e.currentTarget)}
          className="min-w-0 w-8 h-8 rounded-full"
        >
          <Menu size={16} />
        </Button>
      </div>

      {/* Hamburger Menu Portal */}
      {hamburgerMenuAnchor && createPortal(
        (() => {
          const rect = hamburgerMenuAnchor.getBoundingClientRect();
          const menuWidth = 200;

          return (
            <>
              <div
                onClick={() => setHamburgerMenuAnchor(null)}
                className="fixed inset-0 z-[999]"
              />
              <div
                style={{ top: `${rect.bottom + 4}px`, left: `${rect.left}px`, width: `${menuWidth}px` }}
                className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] border border-divider flex flex-col"
              >
                {space && space.type === 'page' && (
                  <>
                    <div className="px-2 py-1 flex items-center justify-between border-b border-divider mb-1">
                      <span className="text-[10px] uppercase font-bold text-default-400">Page Settings</span>
                    </div>
                    <div
                      onClick={() => {
                        const currentShow = space.metadata?.showProperties === true;
                        spacesState.updateSpace(space.id, {
                          metadata: { ...space.metadata, showProperties: !currentShow }
                        });
                        setHamburgerMenuAnchor(null);
                      }}
                      className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                    >
                      <Settings2 size={16} />
                      <span className="text-small">
                        {space.metadata?.showProperties === true ? 'Hide Properties' : 'Show Properties'}
                      </span>
                    </div>
                    <div className="my-1 h-[1px] bg-divider" />
                  </>
                )}
                <div className="px-2 py-1 flex items-center justify-between border-b border-divider mb-1">
                  <span className="text-[10px] uppercase font-bold text-default-400">Navigation</span>
                </div>
                {/* Add other hamburger menu items here if needed */}
                <div
                  onClick={() => {
                    setHamburgerMenuAnchor(null);
                  }}
                  className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors opacity-50"
                >
                  <File size={16} />
                  <span className="text-small">Other options...</span>
                </div>
              </div>
            </>
          );
        })(),
        document.body
      )}

      {/* Tabs - Centrate */}
      <div
        ref={dropTabArea}
        className={`flex-1 min-w-0 overflow-x-auto no-scrollbar flex gap-2 items-center justify-center h-full transition-colors rounded-lg ${isOverTabArea ? 'bg-primary/5' : ''}`}
      >
        {viewport.tabs?.map((tab, index) => {
          const isActive = tab.id === viewport.activeTabId;
          const tabSpace = tab.spaceId ? spacesState.spaces.find((s: Space) => s && s.id === tab.spaceId) : null;

          // Logica di collasso: se ci sono molte tab, mostra solo l'icona per quelle non attive
          const totalTabs = viewport.tabs.length;
          const showTitle = isActive || totalTabs <= 3;

          const isOnlyWelcomeTab = viewport.tabs.length === 1 && !tab.spaceId && !tab.appType;

          let IconComponent: any = null;
          let iconColor = 'currentColor';

          if (!tab.spaceId && !tab.appType) {
            IconComponent = DiamondPlus;
          } else if (tab.appType) {
            const appIcons: any = {
              calendar: Calendar,
              browser: Globe,
              chat: MessageSquare,
              mail: Mail,
              settings: SettingsIcon,
              clock: Clock,
              archive: Archive,
              notifications: Bell,
              trash: Trash2
            };
            IconComponent = appIcons[tab.appType] || File;
          } else if (tabSpace) {
            if (tabSpace.icon) {
              IconComponent = (LucideIcons as any)[tabSpace.icon];
              iconColor = tabSpace.iconColor || 'currentColor';
            }

            // Fallback icons per tipo se l'icona non è risolta
            if (!IconComponent) {
              const defaultIcons: any = {
                page: FileText,
                canvas: Pencil,
                database: Database,
                dashboard: LayoutDashboard
              };
              IconComponent = defaultIcons[tabSpace.type] || File;
              iconColor = tabSpace.iconColor || 'currentColor';
            }
          }

          const displayTitle = tabSpace?.title || tab.title;

          return (
            <TabItem
              key={tab.id}
              tab={tab}
              viewport={viewport}
              isActive={isActive}
              tabSpace={tabSpace}
              showTitle={showTitle}
              isOnlyWelcomeTab={isOnlyWelcomeTab}
              IconComponent={IconComponent}
              iconColor={iconColor}
              displayTitle={displayTitle}
              settings={settings}
              viewportsState={viewportsState}
              spacesState={spacesState}
              onCloseTab={handleCloseTab}
              onContextMenu={handleTabContextMenu}
              index={index}
            />
          );
        })}

        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="primary"
          onClick={() => viewportsState.addTab(viewport.id, undefined, undefined, 'New Tab')}
          className="flex-shrink-0 w-8 h-8 min-w-0 rounded-full"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
          className="min-w-0 w-8 h-8 rounded-full"
        >
          <LayoutGrid size={16} />
        </Button>
      </div>

      {/* Custom Dropdown menu */}
      {actionsMenuAnchor && createPortal(
        (() => {
          const rect = actionsMenuAnchor.getBoundingClientRect();
          const menuWidth = 200;
          const menuHeight = space && onToggleMarkdown ? 250 : 200;

          // Calcola la posizione ottimale
          let top = rect.bottom + 4;
          let left = rect.left;

          // Se il menu esce dal bordo destro della finestra
          if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 8;
          }

          // Se il menu esce dal bordo sinistro
          if (left < 8) {
            left = 8;
          }

          // Se il menu esce dal bordo inferiore
          if (top + menuHeight > window.innerHeight) {
            top = rect.top - menuHeight - 4;
          }

          // Se anche così esce dal bordo superiore
          if (top < 8) {
            top = 8;
          }

          return (
            <>
              <div
                onClick={() => setActionsMenuAnchor(null)}
                className="fixed inset-0 z-[999]"
              />
              <div
                style={{ top: `${top}px`, left: `${left}px`, width: `${menuWidth}px` }}
                className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] max-h-[80vh] overflow-y-auto border border-divider flex flex-col"
              >
                {space && (
                  <>
                    <div className="px-2 py-1 flex items-center justify-between border-b border-divider mb-1">
                      <span className="text-[10px] uppercase font-bold text-default-400">Page Actions</span>
                    </div>

                    <div
                      onClick={() => {
                        spacesState.toggleFavorite(space.id);
                        setActionsMenuAnchor(null);
                      }}
                      className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                    >
                      <Star size={16} fill={space.isFavorite ? 'currentColor' : 'none'} />
                      <span className="text-small">
                        {space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      </span>
                    </div>
                    {onToggleMarkdown && (
                      <div
                        onClick={() => {
                          onToggleMarkdown();
                          setActionsMenuAnchor(null);
                        }}
                        className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                      >
                        <FileCode size={16} />
                        <span className="text-small">
                          {showMarkdown ? 'Hide .md view' : 'Show .md view'}
                        </span>
                      </div>
                    )}
                    <div className="my-1 h-[1px] bg-divider" />
                  </>
                )}
                <div
                  onClick={() => {
                    viewportsState.splitViewport(viewport.id, 'vertical');
                    setActionsMenuAnchor(null);
                  }}
                  className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                >
                  <SplitSquareHorizontal size={16} />
                  <span className="text-small">Split vertically</span>
                </div>
                <div
                  onClick={() => {
                    viewportsState.splitViewport(viewport.id, 'horizontal');
                    setActionsMenuAnchor(null);
                  }}
                  className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                >
                  <SplitSquareVertical size={16} />
                  <span className="text-small">Split horizontally</span>
                </div>
                {canClose && (
                  <div
                    onClick={() => {
                      viewportsState.closeViewport(viewport.id);
                      setActionsMenuAnchor(null);
                    }}
                    className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X size={16} className="text-red-600" />
                    <span className="text-small text-red-600">Close viewport</span>
                  </div>
                )}
              </div>
            </>
          );
        })(),
        document.body
      )}

      {/* Rename Tab Modal */}
      <Modal isOpen={renameTabId !== null} onOpenChange={() => setRenameTabId(null)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Rename Tab</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  value={renameValue}
                  onValueChange={setRenameValue}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenameTabId(null);
                  }}
                  placeholder="Tab name"
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            onClick={() => setContextMenu(null)}
            className="fixed inset-0 z-[999]"
          />
          <div
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] min-w-[180px] border border-divider"
          >
            <div
              onClick={handleRename}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
            >
              <Edit2 size={14} />
              <span className="text-small">
                Rename
              </span>
            </div>
            <div
              onClick={handleDelete}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-red-600" />
              <span className="text-small text-red-600">Delete</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}