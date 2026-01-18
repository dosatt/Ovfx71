import { useState, useRef, useEffect } from 'react';
import { Button, Input, ScrollShadow } from '@heroui/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar,
  Globe,
  MessageSquare,
  Mail,
  Pencil,
  Clock,
  Archive,
  Bell,
  Settings as SettingsIcon,
  Trash2,
  FileText,
  LayoutDashboard,
  Database,
  Search
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { SpaceTree } from './SpaceTree';
import { DraggableSpaceItem } from './DraggableSpaceItem';
import { SpaceContextMenu } from './SpaceContextMenu';
import { NewSpaceModal } from './NewSpaceModal';
import { Space, AppType } from '../types';
import type { Settings } from '../hooks/useSettings';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onResetSettings: () => void;
}

const apps = [
  { type: 'calendar' as AppType, title: 'Calendar', icon: Calendar, color: '#FF5F56' },
  { type: 'browser' as AppType, title: 'Browser', icon: Globe, color: '#27C93F' },
  { type: 'chat' as AppType, title: 'Chat', icon: MessageSquare, color: '#007AFF' },
  { type: 'mail' as AppType, title: 'Mail', icon: Mail, color: '#FFBD2E' }
];

export function Sidebar({ open, onToggle, spacesState, viewportsState, settings, onUpdateSettings, onResetSettings }: SidebarProps) {
  const [newSpaceModalOpen, setNewSpaceModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [spacesExpanded, setSpacesExpanded] = useState(true);
  const [searchResultContextMenu, setSearchResultContextMenu] = useState<{ x: number; y: number; space: Space } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const favorites = spacesState.getFavorites().filter((s: Space) => !s.metadata?.isHidden && (s.type as string) !== 'calendar' && !s.metadata?.isCalendarElement && !s.metadata?.eventId);
  const rootSpaces = spacesState.getChildren().filter((s: Space) => !s.metadata?.isHidden && (s.type as string) !== 'calendar' && !s.metadata?.isCalendarElement && !s.metadata?.eventId);

  // Recursive function to filter spaces
  const filterSpaces = (spaces: Space[], query: string): Space[] => {
    const baseSpaces = spaces.filter(s => !s.metadata?.isHidden && (s.type as string) !== 'calendar' && !s.metadata?.isCalendarElement && !s.metadata?.eventId);
    if (!query) return baseSpaces;

    const lowerQuery = query.toLowerCase();
    const filtered: Space[] = [];

    for (const space of baseSpaces) {
      const children = spacesState.getChildren(space.id).filter((s: Space) => !s.metadata?.isHidden && (s.type as string) !== 'calendar' && !s.metadata?.isCalendarElement && !s.metadata?.eventId);
      const filteredChildren = filterSpaces(children, query);

      if (space.title.toLowerCase().includes(lowerQuery) || filteredChildren.length > 0) {
        filtered.push(space);
      }
    }

    return filtered;
  };

  const filteredSpaces = filterSpaces(rootSpaces, searchQuery);
  const filteredFavorites = favorites.filter((space: Space) =>
    space.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(300, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle ESC key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const handleSpaceClick = (e: React.MouseEvent, space: Space) => {
    e.stopPropagation();

    // Command/Control key logic (toggle selection)
    if (e.metaKey || e.ctrlKey) {
      setSelectedSpaceIds(prev =>
        prev.includes(space.id)
          ? prev.filter(id => id !== space.id)
          : [...prev, space.id]
      );
      setLastSelectedId(space.id);
      return;
    }

    // Shift key logic (range selection)
    if (e.shiftKey && lastSelectedId) {
      // Get all visible spaces in a flat list to calculate range
      const getFlatVisibleSpaces = (spaces: Space[]): string[] => {
        let result: string[] = [];
        for (const s of spaces) {
          result.push(s.id);
          // Only include children if the space would be expanded in the UI
          // For simplicity in Sidebar, we'll get all children of rootSpaces
          // (actual refinement might need tracking expanded state, but this is a good start)
          const children = spacesState.getChildren(s.id).filter((child: Space) => !child.metadata?.isHidden);
          if (children.length > 0) {
            result = [...result, ...getFlatVisibleSpaces(children)];
          }
        }
        return result;
      };

      const flatIds = Array.from(new Set([
        ...getFlatVisibleSpaces(favorites),
        ...getFlatVisibleSpaces(rootSpaces)
      ]));
      const lastIndex = flatIds.indexOf(lastSelectedId);
      const currentIndex = flatIds.indexOf(space.id);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = flatIds.slice(start, end + 1);

        setSelectedSpaceIds(prev => Array.from(new Set([...prev, ...rangeIds])));
        setLastSelectedId(space.id);
        return;
      }
    }

    // Default: Single selection
    setSelectedSpaceIds([space.id]);
    setLastSelectedId(space.id);
  };

  const handleSpaceDoubleClick = (space: Space) => {
    const focusedId = viewportsState.focusedViewportId;
    const findViewportById = (vp: any, id: string): any => {
      if (vp.id === id) return vp;
      if (vp.children) {
        for (const child of vp.children) {
          const found = findViewportById(child, id);
          if (found) return found;
        }
      }
      return null;
    };

    const findLeafViewport = (vp: any): any => {
      if (!vp.children) return vp;
      return findLeafViewport(vp.children[0]);
    };

    let targetViewport = focusedId ? findViewportById(viewportsState.rootViewport, focusedId) : null;

    if (targetViewport && targetViewport.children) {
      targetViewport = findLeafViewport(targetViewport);
    }

    if (!targetViewport) {
      targetViewport = findLeafViewport(viewportsState.rootViewport);
    }

    viewportsState.openSpaceInViewport(targetViewport.id, space.id, space.title);
  };

  const handleAppClick = (appType: AppType, title: string) => {
    const focusedId = viewportsState.focusedViewportId;
    const findViewportById = (vp: any, id: string): any => {
      if (vp.id === id) return vp;
      if (vp.children) {
        for (const child of vp.children) {
          const found = findViewportById(child, id);
          if (found) return found;
        }
      }
      return null;
    };

    const findLeafViewport = (vp: any): any => {
      if (!vp.children) return vp;
      return findLeafViewport(vp.children[0]);
    };

    let targetViewport = focusedId ? findViewportById(viewportsState.rootViewport, focusedId) : null;

    if (targetViewport && targetViewport.children) {
      targetViewport = findLeafViewport(targetViewport);
    }

    if (!targetViewport) {
      targetViewport = findLeafViewport(viewportsState.rootViewport);
    }

    viewportsState.addTab(targetViewport.id, undefined, appType, title);
  };

  const handleUtilityClick = (type: string, title: string) => {
    const focusedId = viewportsState.focusedViewportId;
    const findViewportById = (vp: any, id: string): any => {
      if (vp.id === id) return vp;
      if (vp.children) {
        for (const child of vp.children) {
          const found = findViewportById(child, id);
          if (found) return found;
        }
      }
      return null;
    };

    const findLeafViewport = (vp: any): any => {
      if (!vp.children) return vp;
      return findLeafViewport(vp.children[0]);
    };

    let targetViewport = focusedId ? findViewportById(viewportsState.rootViewport, focusedId) : null;

    if (targetViewport && targetViewport.children) {
      targetViewport = findLeafViewport(targetViewport);
    }

    if (!targetViewport) {
      targetViewport = findLeafViewport(viewportsState.rootViewport);
    }

    viewportsState.addTab(targetViewport.id, undefined, type as AppType, title);
  };

  if (!open) {
    return (
      <Button
        isIconOnly
        variant="light"
        onPress={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 rounded-r-lg bg-background border border-l-0 border-divider shadow-md h-12 w-8 min-w-8"
      >
        <ChevronLeft className="rotate-180" size={20} />
      </Button>
    );
  }

  return (
    <>
      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        onClick={() => setSelectedSpaceIds([])}
        className={`
          flex flex-col h-[calc(100vh-8px)] overflow-hidden relative mt-1 ml-1 rounded-2xl border-2 border-divider
          shadow-none transition-all technical-border
          ${settings.transparency ? 'bg-background/70' : 'bg-background'}
          ${settings.blur ? 'backdrop-blur-xl' : ''}
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* macOS Traffic Lights */}
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 hover:bg-[#FF3B30] transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 hover:bg-[#FFB300] transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 hover:bg-[#00D91A] transition-colors cursor-pointer" />
            </div>
            <h4 className="text-lg font-bold">OVFX</h4>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center mr-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => viewportsState.navigateHistory && viewportsState.navigateHistory(viewportsState.focusedViewportId, 'back')}
                isDisabled={!viewportsState.canNavigateBack || !viewportsState.canNavigateBack(viewportsState.focusedViewportId)}
                className="text-default-500 hover:text-default-900 min-w-8 w-8 h-8"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => viewportsState.navigateHistory && viewportsState.navigateHistory(viewportsState.focusedViewportId, 'forward')}
                isDisabled={!viewportsState.canNavigateForward || !viewportsState.canNavigateForward(viewportsState.focusedViewportId)}
                className="text-default-500 hover:text-default-900 min-w-8 w-8 h-8"
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            <Button
              isIconOnly
              size="sm"
              color="primary"
              variant="solid"
              onPress={() => setNewSpaceModalOpen(true)}
              style={{
                borderRadius: settings.buttonBorderRadius,
              }}
            >
              <Plus size={18} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <Input
            ref={searchInputRef}
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search size={16} className="text-default-400" />}
            size="sm"
            variant="flat"
            radius="full"
            classNames={{
              input: "text-small",
              inputWrapper: "bg-default-100 hover:bg-default-200 group-data-[focus=true]:bg-default-100",
            }}
          />
        </div>

        {!searchQuery ? (
          <>
            {/* Apps Grid - HIGH DENSITY */}
            <div className="px-4 pb-1">
              <div className="flex gap-1 justify-center px-2">
                {apps.map((app) => (
                  <Button
                    key={app.type}
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleAppClick(app.type, app.title)}
                    className="text-default-500 hover:text-default-900 h-8 w-8 min-w-8"
                  >
                    <app.icon size={16} />
                  </Button>
                ))}
              </div>
            </div>

            {/* Favorites - ALWAYS VISIBLE - HIGH DENSITY */}
            {favorites.length > 0 && (
              <div className="px-2 py-1">
                <div
                  className="flex items-center justify-between py-1 px-2 rounded-lg"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-default-400">Favorites</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {favorites.map((space: Space) => (
                    <DraggableSpaceItem
                      key={space.id}
                      space={space}
                      spacesState={spacesState}
                      onSpaceClick={handleSpaceClick}
                      onSpaceDoubleClick={handleSpaceDoubleClick}
                      isSelected={selectedSpaceIds.includes(space.id)}
                      selectedSpaceIds={selectedSpaceIds}
                      isFavorite={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* File Browser - HIGH DENSITY */}
            <ScrollShadow className="flex-1 overflow-auto px-2 py-1 autohide-scrollbar">
              <div
                className="cursor-pointer"
                onClick={() => setSpacesExpanded(!spacesExpanded)}
              >
                <span className="text-xs font-semibold text-default-500 uppercase px-2 py-1 block">Spaces</span>
              </div>
              {spacesExpanded && (
                <div className="mt-0.5 flex flex-col gap-0.5 px-2">
                  {filteredSpaces.map(space => (
                    <DraggableSpaceItem
                      key={space.id}
                      space={space}
                      spacesState={spacesState}
                      onSpaceClick={handleSpaceClick}
                      onSpaceDoubleClick={handleSpaceDoubleClick}
                      isSelected={selectedSpaceIds.includes(space.id)}
                      selectedSpaceIds={selectedSpaceIds}
                    />
                  ))}
                </div>
              )}
            </ScrollShadow>

            {/* Utility Section - HIGH DENSITY */}
            <div className="px-4 py-2 mt-auto border-t border-divider">
              <span className="text-xs font-semibold text-default-500 uppercase px-2 py-1 block">Utilities</span>
              <div className="flex gap-1 mt-2 justify-between px-2 flex-wrap">
                <Button isIconOnly size="sm" variant="light" onPress={() => handleUtilityClick('clock', 'Clock')}>
                  <Clock size={18} />
                </Button>
                <Button isIconOnly size="sm" variant="light" onPress={() => handleUtilityClick('archive', 'Archive')}>
                  <Archive size={18} />
                </Button>
                <Button isIconOnly size="sm" variant="light" onPress={() => handleUtilityClick('notifications', 'Notifications')}>
                  <Bell size={18} />
                </Button>
                <Button isIconOnly size="sm" variant="light" onPress={() => handleAppClick('settings', 'Settings')} aria-label="Settings">
                  <SettingsIcon size={18} />
                </Button>
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleUtilityClick('trash', 'Trash')}>
                  <Trash2 size={18} />
                </Button>
                <Button isIconOnly size="sm" variant="light" onPress={onToggle}>
                  <ChevronLeft size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <ScrollShadow className="flex-1 overflow-auto px-2 py-2 autohide-scrollbar">
            <span className="text-xs font-semibold text-default-500 uppercase px-2 py-1 block">
              Results ({filteredFavorites.length + filteredSpaces.length})
            </span>
            <div className="mt-2 flex flex-col gap-1">
              {filteredFavorites.map(space => {
                let IconComponent = null;
                if (space.icon) {
                  IconComponent = (LucideIcons as any)[space.icon];
                }
                if (!IconComponent) {
                  const defaultIcons: any = {
                    page: FileText,
                    canvas: Pencil,
                    database: Database,
                    dashboard: LayoutDashboard
                  };
                  IconComponent = defaultIcons[space.type];
                }

                return (
                  <div
                    key={space.id}
                    onClick={(e) => handleSpaceClick(e, space)}
                    onDoubleClick={() => handleSpaceDoubleClick(space)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSearchResultContextMenu({ x: e.clientX, y: e.clientY, space });
                    }}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${selectedSpaceIds.includes(space.id) ? 'bg-primary/10 text-primary-900 font-medium' : 'hover:bg-default-100'}`}
                  >
                    {IconComponent ? (
                      <IconComponent
                        size={16}
                        className="shrink-0"
                        style={{ color: space.iconColor || 'currentColor' }}
                      />
                    ) : (
                      space.icon && <span className="text-base shrink-0">{space.icon}</span>
                    )}
                    <span className="text-sm truncate">
                      {space.title || (space.type === 'page' ? 'New page' : `New ${space.type}`)}
                    </span>
                  </div>
                );
              })}
              {filteredSpaces.length > 0 && (
                <SpaceTree
                  spaces={filteredSpaces}
                  spacesState={spacesState}
                  onSpaceClick={handleSpaceClick}
                  onSpaceDoubleClick={handleSpaceDoubleClick}
                  selectedSpaceIds={selectedSpaceIds}
                />
              )}
            </div>
          </ScrollShadow>
        )}

        {/* Resize handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/20 transition-colors z-50 ${isResizing ? 'bg-primary/20' : 'bg-transparent'}`}
        />
      </div>

      <NewSpaceModal
        open={newSpaceModalOpen}
        onClose={() => setNewSpaceModalOpen(false)}
        onCreate={(type) => {
          const newSpace = spacesState.createSpace(type);
          setNewSpaceModalOpen(false);
          handleSpaceDoubleClick(newSpace);
        }}
      />

      {searchResultContextMenu && (
        <SpaceContextMenu
          space={searchResultContextMenu.space}
          spacesState={spacesState}
          selectedSpaceIds={selectedSpaceIds}
          position={{ x: searchResultContextMenu.x, y: searchResultContextMenu.y }}
          onClose={() => setSearchResultContextMenu(null)}
        />
      )}
    </>
  );
}