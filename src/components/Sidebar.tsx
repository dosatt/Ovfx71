import { useState, useRef, useEffect } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Sheet from '@mui/joy@5.0.0-beta.48/Sheet';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import { 
  ChevronLeft,
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
import { NewSpaceModal } from './NewSpaceModal';
import { SettingsModal } from './SettingsModal';
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
  { type: 'calendar' as AppType, title: 'Calendario', icon: Calendar, color: '#FF5F56' },
  { type: 'browser' as AppType, title: 'Browser', icon: Globe, color: '#27C93F' },
  { type: 'chat' as AppType, title: 'Chat', icon: MessageSquare, color: '#007AFF' },
  { type: 'mail' as AppType, title: 'Mail', icon: Mail, color: '#FFBD2E' }
];

export function Sidebar({ open, onToggle, spacesState, viewportsState, settings, onUpdateSettings, onResetSettings }: SidebarProps) {
  const [newSpaceModalOpen, setNewSpaceModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [spacesExpanded, setSpacesExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const favorites = spacesState.getFavorites();
  const rootSpaces = spacesState.getChildren();

  // Funzione ricorsiva per filtrare gli spaces
  const filterSpaces = (spaces: Space[], query: string): Space[] => {
    if (!query) return spaces;
    
    const lowerQuery = query.toLowerCase();
    const filtered: Space[] = [];
    
    for (const space of spaces) {
      const children = spacesState.getChildren(space.id);
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

  const handleSpaceClick = (space: Space) => {
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
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          borderRadius: '0 8px 8px 0'
        }}
      >
        <ChevronLeft style={{ transform: 'rotate(180deg)' }} />
      </IconButton>
    );
  }

  return (
    <>
      <Sheet
        ref={sidebarRef}
        sx={{
          width: sidebarWidth,
          height: 'calc(100vh - 8px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          mt: '4px',
          ml: '4px',
          borderRadius: '15px',
          border: '2px solid',
          borderColor: 'divider',
          bgcolor: settings.transparency ? 'rgba(255, 255, 255, 0.7)' : 'background.surface',
          backdropFilter: settings.blur ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: settings.blur ? 'blur(20px)' : 'none',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* macOS Traffic Lights */}
            <Box sx={{ display: 'flex', gap: 0.6 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: '#FF5F56',
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#FF3B30'
                  }
                }} 
              />
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: '#FFBD2E',
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#FFB300'
                  }
                }} 
              />
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: '#27C93F',
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#00D91A'
                  }
                }} 
              />
            </Box>
            <Typography level="h4">OVFX</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button 
              size="sm" 
              startDecorator={<Plus size={16} />}
              onClick={() => setNewSpaceModalOpen(true)}
              sx={{
                bgcolor: 'primary.500',
                color: 'white',
                borderRadius: settings.buttonBorderRadius,
                pt: settings.buttonPaddingTop,
                pb: settings.buttonPaddingBottom,
                pl: settings.buttonPaddingLeft,
                pr: settings.buttonPaddingRight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: 'primary.600'
                }
              }}
            >
              Nuovo
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Input
            ref={searchInputRef}
            placeholder="Cerca spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startDecorator={<Search size={16} />}
            size="sm"
            sx={{
              '--Input-focusedThickness': '2px',
              '--Input-focusedHighlight': 'var(--joy-palette-primary-500)',
              bgcolor: 'rgba(255, 255, 255, 0.66)',
              borderRadius: '999px'
            }}
          />
        </Box>

        {!searchQuery ? (
          <>
            {/* Apps Grid */}
            <Box sx={{ px: 2, pb: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.75,
                justifyContent: 'center',
                px: '12px'
              }}>
                {apps.map((app) => {
                  return (
                    <IconButton
                      key={app.type}
                      size="sm"
                      variant="plain"
                      onClick={() => handleAppClick(app.type, app.title)}
                    >
                      <app.icon size={18} />
                    </IconButton>
                  );
                })}
              </Box>
            </Box>

            {/* Favorites */}
            {favorites.length > 0 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 0.5,
                    px: 1,
                    borderRadius: '6px',
                    '&:hover': {
                      bgcolor: 'background.level1'
                    }
                  }}
                  onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                >
                  <Typography level="body-sm" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Preferiti
                  </Typography>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: favoritesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </Box>
                {favoritesExpanded && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    {favorites.map((space: Space) => (
                      <DraggableSpaceItem
                        key={space.id}
                        space={space}
                        spacesState={spacesState}
                        onSpaceClick={handleSpaceClick}
                        isFavorite={true}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* File Browser */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              px: 2,
              py: 1,
              '&::-webkit-scrollbar': { display: 'none' },
              '-ms-overflow-style': 'none',
              scrollbarWidth: 'none'
            }}>
              <Box
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  py: 0.5,
                  px: 1,
                  borderRadius: '6px',
                  '&:hover': {
                    bgcolor: 'background.level1'
                  }
                }}
                onClick={() => setSpacesExpanded(!spacesExpanded)}
              >
                <Typography level="body-sm" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Spaces
                </Typography>
                <ChevronDown
                  size={14}
                  style={{ 
                    transform: spacesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s'
                  }} 
                />
              </Box>
              {spacesExpanded && (
                <Box sx={{ mt: 1 }}>
                  {filteredSpaces.map(space => (
                    <DraggableSpaceItem
                      key={space.id}
                      space={space}
                      spacesState={spacesState}
                      onSpaceClick={handleSpaceClick}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Utility Section */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography level="body-sm" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontSize: '0.75rem', px: 1, py: 0.5 }}>
                Utility
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                mt: 1,
                justifyContent: 'space-between',
                px: 1,
                flexWrap: 'wrap'
              }}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => handleUtilityClick('clock', 'Clock')}
                >
                  <Clock size={18} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => handleUtilityClick('archive', 'Archive')}
                >
                  <Archive size={18} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => handleUtilityClick('notifications', 'Notifications')}
                >
                  <Bell size={18} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => setSettingsModalOpen(true)}
                >
                  <SettingsIcon size={18} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="danger"
                  onClick={() => handleUtilityClick('trash', 'Trash')}
                >
                  <Trash2 size={18} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={onToggle}
                >
                  <ChevronLeft size={18} />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          // Search Results View
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            px: 2,
            py: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            '-ms-overflow-style': 'none',
            scrollbarWidth: 'none'
          }}>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontSize: '0.75rem', px: 1, py: 0.5 }}>
              Risultati ({filteredFavorites.length + filteredSpaces.length})
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {filteredFavorites.map(space => {
                let IconComponent = null;
                if (space.icon) {
                  IconComponent = (LucideIcons as any)[space.icon];
                }
                if (!IconComponent) {
                  const defaultIcons = {
                    page: FileText,
                    canvas: Pencil,
                    database: Database,
                    dashboard: LayoutDashboard
                  };
                  IconComponent = defaultIcons[space.type];
                }
                
                return (
                  <Box
                    key={space.id}
                    onClick={() => handleSpaceClick(space)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      py: 0.5,
                      px: 1,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      minWidth: 0,
                      '&:hover': {
                        bgcolor: 'background.level1'
                      }
                    }}
                  >
                    {IconComponent ? (
                      <IconComponent 
                        size={16} 
                        style={{ 
                          flexShrink: 0,
                          color: space.iconColor || 'currentColor' 
                        }}
                      />
                    ) : (
                      space.icon && <span style={{ fontSize: '1rem', flexShrink: 0 }}>{space.icon}</span>
                    )}
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
                );
              })}
              {filteredSpaces.length > 0 && (
                <SpaceTree
                  spaces={filteredSpaces}
                  spacesState={spacesState}
                  onSpaceClick={handleSpaceClick}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Resize handle */}
        <Box
          onMouseDown={() => setIsResizing(true)}
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            cursor: 'col-resize',
            bgcolor: isResizing ? 'primary.softBg' : 'transparent',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'primary.softBg'
            },
            zIndex: 1000
          }}
        />
      </Sheet>

      <NewSpaceModal
        open={newSpaceModalOpen}
        onClose={() => setNewSpaceModalOpen(false)}
        onCreate={(type) => {
          const newSpace = spacesState.createSpace(type);
          setNewSpaceModalOpen(false);
          handleSpaceClick(newSpace);
        }}
      />

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onResetSettings={onResetSettings}
        spacesState={spacesState}
        viewportsState={viewportsState}
      />
    </>
  );
}