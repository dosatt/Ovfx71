import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input
} from '@heroui/react';
import { X, ChevronLeft, ChevronRight, FileCode, SplitSquareVertical, SplitSquareHorizontal, Plus, Star, File, Edit2, Trash2, LayoutGrid, DiamondPlus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
    <div
      className="flex items-center justify-between px-2 py-1 gap-2 min-h-[40px] border-b border-divider bg-white"
    >
      {/* Navigation */}
      <div className="flex gap-1">
        <Button 
          isIconOnly
          size="sm" 
          variant="light" 
          isDisabled={!canGoBack}
          onClick={() => viewportsState.navigateHistory(viewport.id, 'back')}
          className="min-w-0 w-8 h-8"
        >
          <ChevronLeft size={16} />
        </Button>
        <Button 
          isIconOnly
          size="sm" 
          variant="light" 
          isDisabled={!canGoForward}
          onClick={() => viewportsState.navigateHistory(viewport.id, 'forward')}
          className="min-w-0 w-8 h-8"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Tabs - Centrate */}
      <div className="flex-1 min-w-0 flex gap-1 items-center justify-center">
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
            <Tooltip key={tab.id} content={tab.title} size="sm">
              <Button
                size="sm"
                variant={isActive ? 'flat' : 'light'}
                onClick={() => {
                  viewportsState.setActiveTab(viewport.id, tab.id);
                  viewportsState.setFocusedViewportId(viewport.id);
                }}
                endContent={
                  isActive && !isOnlyWelcomeTab ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      className="ml-1 flex items-center cursor-pointer hover:opacity-70"
                    >
                      <X size={12} />
                    </span>
                  ) : undefined
                }
                style={{
                  borderRadius: settings.tabBorderRadius,
                  paddingLeft: (isActive || showTitle) ? settings.tabPaddingLeft : 8,
                  paddingTop: settings.tabPaddingTop,
                  paddingBottom: settings.tabPaddingBottom,
                  paddingRight: (isActive || showTitle) ? settings.tabPaddingRight : 8,
                }}
                className={`
                  flex-shrink-0 flex items-center
                  ${isActive ? 'bg-default-100' : ''}
                  ${isActive || showTitle ? 'min-w-[100px] max-w-[200px] justify-between' : 'min-w-0 max-w-auto px-2 justify-center'}
                `}
                onContextMenu={(e) => handleTabContextMenu(e, tab.id, tab.title)}
              >
                {(isActive || showTitle) ? (
                  <div className="flex items-center w-full overflow-hidden">
                    {IconComponent ? (
                      <IconComponent size={16} style={{ marginRight: 4, color: iconColor }} className="shrink-0" />
                    ) : (
                      tabSpace?.icon && <span style={{ marginRight: 4 }} className="shrink-0">{tabSpace.icon}</span>
                    )}
                    <span className="truncate text-left flex-1 text-small">
                      {displayTitle}
                    </span>
                  </div>
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
        
        <Tooltip content="Nuova Tab" size="sm">
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            color="primary"
            onClick={() => viewportsState.addTab(viewport.id, undefined, undefined, 'New Tab')}
            className="flex-shrink-0 w-8 h-8 min-w-0 border-small"
          >
            <Plus size={16} />
          </Button>
        </Tooltip>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <Tooltip content="Azioni viewport" size="sm">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
            className="min-w-0 w-8 h-8"
          >
            <LayoutGrid size={16} />
          </Button>
        </Tooltip>
      </div>

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
              <div
                onClick={() => setActionsMenuAnchor(null)}
                className="fixed inset-0 z-[999]"
              />
              <div
                style={{ top: `${top}px`, left: `${left}px` }}
                className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] min-w-[200px] max-h-[250px] overflow-auto border border-divider"
              >
                {space && (
                  <>
                    <div
                      onClick={() => {
                        spacesState.toggleFavorite(space.id);
                        setActionsMenuAnchor(null);
                      }}
                      className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                    >
                      <Star size={16} fill={space.isFavorite ? 'currentColor' : 'none'} />
                      <span className="text-small">
                        {space.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
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
                          {showMarkdown ? 'Nascondi vista .md' : 'Mostra vista .md'}
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
                  <span className="text-small">Dividi verticalmente</span>
                </div>
                <div
                  onClick={() => {
                    viewportsState.splitViewport(viewport.id, 'horizontal');
                    setActionsMenuAnchor(null);
                  }}
                  className="p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-default-100 transition-colors"
                >
                  <SplitSquareVertical size={16} />
                  <span className="text-small">Dividi orizzontalmente</span>
                </div>
                {canClose && (
                  <div
                    onClick={() => {
                      viewportsState.closeViewport(viewport.id);
                      setActionsMenuAnchor(null);
                    }}
                    className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-danger hover:bg-danger-50 transition-colors"
                  >
                    <X size={16} />
                    <span className="text-small">Chiudi viewport</span>
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
              <ModalHeader className="flex flex-col gap-1">Rinomina Tab</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  value={renameValue}
                  onValueChange={setRenameValue}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenameTabId(null);
                  }}
                  placeholder="Nome tab"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annulla
                </Button>
                <Button color="primary" onPress={handleRenameSubmit}>
                  Salva
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
                Rinomina
              </span>
            </div>
            <div
              onClick={handleDelete}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-danger hover:bg-danger-50 transition-colors"
            >
              <Trash2 size={14} />
              <span className="text-small">Elimina</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
