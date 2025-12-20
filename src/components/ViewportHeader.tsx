import { useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import Tooltip from '@mui/joy@5.0.0-beta.48/Tooltip';
import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import { X, ChevronLeft, ChevronRight, FileCode, SplitSquareVertical, SplitSquareHorizontal, Plus, Star, File, Edit2, Trash2, LayoutGrid, DiamondPlus } from 'lucide-react';
import type { Viewport } from '../types';
import type { Space } from '../types';
import type { Settings } from '../hooks/useSettings';

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
  
  const canClose = viewport.id !== 'root';
  const activeTab = viewport.tabs?.find(t => t.id === viewport.activeTabId);
  const canGoBack = viewportsState.canNavigateBack(viewport.id);
  const canGoForward = viewportsState.canNavigateForward(viewport.id);
  
  const handleCloseTab = (tabId: string) => {
    if (viewport.tabs.length === 1) {
      // Se c'è solo una tab, apri la welcome page invece di chiudere
      viewportsState.setActiveTab(viewport.id, tabId);
      viewportsState.updateTab(viewport.id, tabId, { spaceId: 'welcome', title: 'Welcome to OVFX' });
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

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        py: 0.5,
        gap: 1,
        minHeight: 40,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.surface'
      }}
    >
      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton 
          size="sm" 
          variant="plain" 
          disabled={!canGoBack}
          onClick={() => viewportsState.navigateHistory(viewport.id, 'back')}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <IconButton 
          size="sm" 
          variant="plain" 
          disabled={!canGoForward}
          onClick={() => viewportsState.navigateHistory(viewport.id, 'forward')}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Box>

      {/* Tabs - Centrate */}
      <Box sx={{ 
        flex: 1, 
        minWidth: 0, 
        display: 'flex', 
        gap: 0.5, 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {viewport.tabs?.map(tab => {
          const isActive = tab.id === viewport.activeTabId;
          const tabSpace = tab.spaceId ? spacesState.spaces.find((s: Space) => s.id === tab.spaceId) : null;
          const showTitle = viewport.tabs.length <= 4; // Mostra titolo se ci sono poche tab
          
          // Nascondi il pulsante chiudi se c'è solo una tab di benvenuto
          const isOnlyWelcomeTab = viewport.tabs.length === 1 && !tab.spaceId && !tab.appType;
          
          // Determina l'icona da mostrare
          let IconComponent = null;
          let iconColor = 'currentColor';
          
          // Se è la welcome page (nessuno space e nessuna app)
          if (!tab.spaceId && !tab.appType) {
            IconComponent = DiamondPlus;
          } else if (tabSpace?.icon) {
            IconComponent = (LucideIcons as any)[tabSpace.icon];
            iconColor = tabSpace.iconColor || 'currentColor';
          }
          
          // Usa il titolo dello space se esiste, altrimenti usa il titolo del tab
          const displayTitle = tabSpace?.title || tab.title;
          
          return (
            <Tooltip key={tab.id} title={tab.title} size="sm">
              <Button
                size="sm"
                variant={isActive ? 'soft' : 'plain'}
                onClick={() => {
                  viewportsState.setActiveTab(viewport.id, tab.id);
                  viewportsState.setFocusedViewportId(viewport.id);
                }}
                endDecorator={
                  isActive && !isOnlyWelcomeTab ? (
                    <Box
                      component="span"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      sx={{ 
                        ml: 0.5, 
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7
                        }
                      }}
                    >
                      <X size={12} />
                    </Box>
                  ) : undefined
                }
                sx={{ 
                  flexShrink: 0,
                  minWidth: (isActive || showTitle) ? 100 : 'auto',
                  maxWidth: (isActive || showTitle) ? 200 : 'auto',
                  px: (isActive || showTitle) ? settings.tabPaddingLeft : 1,
                  pt: settings.tabPaddingTop,
                  pb: settings.tabPaddingBottom,
                  pr: (isActive || showTitle) ? settings.tabPaddingRight : 1,
                  justifyContent: isActive ? 'space-between' : (showTitle ? 'flex-start' : 'center'),
                  borderRadius: settings.tabBorderRadius,
                  display: 'flex',
                  alignItems: 'center'
                }}
                onContextMenu={(e) => handleTabContextMenu(e, tab.id, tab.title)}
              >
                {(isActive || showTitle) ? (
                  <>
                    {IconComponent ? (
                      <IconComponent size={16} style={{ marginRight: 4, color: iconColor }} />
                    ) : (
                      tabSpace?.icon && <span style={{ marginRight: 4 }}>{tabSpace.icon}</span>
                    )}
                    <span style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      flex: 1,
                      textAlign: 'left'
                    }}>
                      {displayTitle}
                    </span>
                  </>
                ) : (
                  IconComponent ? (
                    <IconComponent size={16} style={{ color: iconColor }} />
                  ) : (
                    tabSpace?.icon || '📄'
                  )
                )}
              </Button>
            </Tooltip>
          );
        })}
        
        <Tooltip title="Nuova Tab" size="sm">
          <IconButton
            size="sm"
            variant="outlined"
            color="primary"
            onClick={() => viewportsState.addTab(viewport.id, undefined, undefined, 'New Tab')}
            sx={{ flexShrink: 0 }}
          >
            <Plus size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Azioni viewport" size="sm">
          <IconButton
            size="sm"
            variant="plain"
            onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
          >
            <LayoutGrid size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Custom Dropdown menu */}
      {actionsMenuAnchor && createPortal(
        (() => {
          const rect = actionsMenuAnchor.getBoundingClientRect();
          const menuWidth = 200;
          const menuHeight = space && onToggleMarkdown ? 250 : 200;
          
          // Calcola la posizione ottimale
          let top = rect.bottom + 4;
          let left = rect.right - menuWidth;
          
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
              <Box
                onClick={() => setActionsMenuAnchor(null)}
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
              />
              <Box
                sx={{
                  position: 'fixed',
                  top: `${top}px`,
                  left: `${left}px`,
                  bgcolor: 'background.popup',
                  boxShadow: 'md',
                  borderRadius: '8px',
                  p: 0.5,
                  zIndex: 1000,
                  minWidth: menuWidth,
                  maxHeight: menuHeight,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {space && (
                  <>
                    <Box
                      onClick={() => {
                        spacesState.toggleFavorite(space.id);
                        setActionsMenuAnchor(null);
                      }}
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
                      <Star size={16} fill={space.isFavorite ? 'currentColor' : 'none'} />
                      <Typography level="body-sm">
                        {space.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                      </Typography>
                    </Box>
                    {onToggleMarkdown && (
                      <Box
                        onClick={() => {
                          onToggleMarkdown();
                          setActionsMenuAnchor(null);
                        }}
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
                        <FileCode size={16} />
                        <Typography level="body-sm">
                          {showMarkdown ? 'Nascondi vista .md' : 'Mostra vista .md'}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ my: 0.5, height: '1px', bgcolor: 'divider' }} />
                  </>
                )}
                <Box
                  onClick={() => {
                    viewportsState.splitViewport(viewport.id, 'vertical');
                    setActionsMenuAnchor(null);
                  }}
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
                  <SplitSquareHorizontal size={16} />
                  <Typography level="body-sm">Dividi verticalmente</Typography>
                </Box>
                <Box
                  onClick={() => {
                    viewportsState.splitViewport(viewport.id, 'horizontal');
                    setActionsMenuAnchor(null);
                  }}
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
                  <SplitSquareVertical size={16} />
                  <Typography level="body-sm">Dividi orizzontalmente</Typography>
                </Box>
                {canClose && (
                  <Box
                    onClick={() => {
                      viewportsState.closeViewport(viewport.id);
                      setActionsMenuAnchor(null);
                    }}
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
                    <X size={16} />
                    <Typography level="body-sm">Chiudi viewport</Typography>
                  </Box>
                )}
              </Box>
            </>
          );
        })(),
        document.body
      )}

      {/* Rename Tab Modal */}
      <Modal open={renameTabId !== null} onClose={() => setRenameTabId(null)}>
        <ModalDialog>
          <Typography level="title-md" sx={{ mb: 1.5 }}>
            Rinomina Tab
          </Typography>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenameTabId(null);
            }}
            placeholder="Nome tab"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="plain" onClick={() => setRenameTabId(null)}>
              Annulla
            </Button>
            <Button onClick={handleRenameSubmit}>
              Salva
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Context Menu */}
      {contextMenu && (
        <>
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
          <Box
            sx={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              bgcolor: 'background.popup',
              boxShadow: 'md',
              borderRadius: '8px',
              p: 0.5,
              zIndex: 1000,
              minWidth: 180
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
                Rinomina
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
              <Typography level="body-sm">Elimina</Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}