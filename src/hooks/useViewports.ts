import { useState, useEffect } from 'react';
import { Viewport, Tab, ViewportSplit, AppType } from '../types';

const STORAGE_KEY = 'ovfx_viewports';

export function useViewports() {
  const [rootViewport, setRootViewport] = useState<Viewport>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      id: 'root',
      tabs: [],
      activeTabId: undefined,
      history: [],
      historyIndex: -1
    };
  });

  const [focusedViewportId, setFocusedViewportId] = useState<string>('root');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rootViewport));
  }, [rootViewport]);

  const findViewport = (id: string, viewport: Viewport = rootViewport): Viewport | null => {
    if (viewport.id === id) return viewport;
    if (viewport.children) {
      const found = findViewport(id, viewport.children[0]) || findViewport(id, viewport.children[1]);
      if (found) return found;
    }
    return null;
  };

  const updateViewportInTree = (
    id: string,
    updater: (v: Viewport) => Viewport,
    viewport: Viewport = rootViewport
  ): Viewport => {
    if (viewport.id === id) {
      return updater(viewport);
    }
    if (viewport.children) {
      return {
        ...viewport,
        children: [
          updateViewportInTree(id, updater, viewport.children[0]),
          updateViewportInTree(id, updater, viewport.children[1])
        ]
      };
    }
    return viewport;
  };

  const splitViewport = (id: string, direction: ViewportSplit) => {
    // Verifica se c'è spazio sufficiente per dividere
    const viewportElement = document.querySelector(`[data-viewport-id="${id}"]`);
    if (viewportElement) {
      const rect = viewportElement.getBoundingClientRect();
      const minWidth = 360; // Larghezza minima per viewport
      const minHeight = 400; // Altezza minima per viewport
      
      // Controlla se dopo la divisione ogni viewport sarebbe abbastanza grande
      if (direction === 'vertical') {
        // Divisione verticale: controlla la larghezza
        if (rect.width / 2 < minWidth) {
          console.warn(`Cannot split viewport: minimum width of ${minWidth}px not met`);
          return;
        }
      } else {
        // Divisione orizzontale: controlla l'altezza
        if (rect.height / 2 < minHeight) {
          console.warn(`Cannot split viewport: minimum height of ${minHeight}px not met`);
          return;
        }
      }
    }
    
    setRootViewport(prev => updateViewportInTree(id, (viewport) => {
      const newViewport1: Viewport = {
        ...viewport,
        id: `${viewport.id}_1`,
        size: 50
      };
      const newViewport2: Viewport = {
        id: `${viewport.id}_2`,
        tabs: [],
        size: 50
      };
      return {
        ...viewport,
        split: direction,
        children: [newViewport1, newViewport2],
        tabs: [],
        activeTabId: undefined,
        spaceId: undefined,
        appType: undefined
      };
    }, prev));
  };

  const closeViewport = (id: string) => {
    if (id === 'root') return; // Cannot close root

    const removeViewportFromTree = (viewport: Viewport): Viewport | null => {
      if (viewport.children) {
        const [left, right] = viewport.children;
        
        // If one child is the target, return the other child
        if (left.id === id) return right;
        if (right.id === id) return left;

        // Recursively check children
        const newLeft = removeViewportFromTree(left);
        const newRight = removeViewportFromTree(right);

        // If a child was removed, update
        if (newLeft === null) return newRight;
        if (newRight === null) return newLeft;

        return {
          ...viewport,
          children: [newLeft, newRight]
        };
      }
      return viewport;
    };

    const result = removeViewportFromTree(rootViewport);
    if (result) {
      setRootViewport(result);
    }
  };

  const resizeViewport = (id: string, newSize: number) => {
    setRootViewport(prev => {
      const updateSize = (viewport: Viewport): Viewport => {
        if (viewport.children) {
          const [left, right] = viewport.children;
          if (left.id === id) {
            return {
              ...viewport,
              children: [
                { ...left, size: newSize },
                { ...right, size: 100 - newSize }
              ]
            };
          }
          if (right.id === id) {
            return {
              ...viewport,
              children: [
                { ...left, size: 100 - newSize },
                { ...right, size: newSize }
              ]
            };
          }
          return {
            ...viewport,
            children: [updateSize(left), updateSize(right)]
          };
        }
        return viewport;
      };
      return updateSize(prev);
    });
  };

  const addTab = (viewportId: string, spaceId?: string, appType?: AppType, title?: string) => {
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => {
      const newTab: Tab = {
        id: `tab_${Date.now()}`,
        spaceId,
        appType,
        title: title || 'New Tab'
      };
      return {
        ...viewport,
        tabs: [...viewport.tabs, newTab],
        activeTabId: newTab.id
      };
    }, prev));
  };

  const closeTab = (viewportId: string, tabId: string) => {
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => {
      const newTabs = viewport.tabs.filter(t => t.id !== tabId);
      let newActiveTabId = viewport.activeTabId;
      
      if (viewport.activeTabId === tabId && newTabs.length > 0) {
        const index = viewport.tabs.findIndex(t => t.id === tabId);
        newActiveTabId = newTabs[Math.max(0, index - 1)]?.id;
      }

      return {
        ...viewport,
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    }, prev));
  };

  const updateTab = (viewportId: string, tabId: string, updates: Partial<Tab>) => {
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => ({
      ...viewport,
      tabs: viewport.tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
    }), prev));
  };

  const closeTabsWithSpace = (spaceId: string) => {
    const closeInViewport = (viewport: Viewport): Viewport => {
      // Close all tabs with this spaceId
      const newTabs = viewport.tabs.filter(t => t.spaceId !== spaceId);
      let newActiveTabId = viewport.activeTabId;
      
      // If active tab was removed, select another tab
      if (viewport.tabs.find(t => t.id === viewport.activeTabId)?.spaceId === spaceId) {
        newActiveTabId = newTabs[0]?.id;
      }

      const updated = {
        ...viewport,
        tabs: newTabs,
        activeTabId: newActiveTabId
      };

      // Recursively handle children
      if (viewport.children) {
        return {
          ...updated,
          children: [
            closeInViewport(viewport.children[0]),
            closeInViewport(viewport.children[1])
          ]
        };
      }

      return updated;
    };

    setRootViewport(prev => closeInViewport(prev));
  };

  const setActiveTab = (viewportId: string, tabId: string) => {
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => ({
      ...viewport,
      activeTabId: tabId
    }), prev));
  };

  const openSpaceInViewport = (viewportId: string, spaceId: string, title: string) => {
    const viewport = findViewport(viewportId);
    if (!viewport) return;

    // Check if space is already open in a tab
    const existingTab = viewport.tabs.find(t => t.spaceId === spaceId);
    if (existingTab) {
      setActiveTab(viewportId, existingTab.id);
    } else {
      addTab(viewportId, spaceId, undefined, title);
    }
  };

  const replaceCurrentTab = (viewportId: string, spaceId?: string, appType?: AppType, title?: string) => {
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => {
      const currentTab = viewport.tabs.find(t => t.id === viewport.activeTabId);
      
      // If current tab is empty (welcome page), replace it
      if (currentTab && !currentTab.spaceId && !currentTab.appType) {
        const updatedTab: Tab = {
          ...currentTab,
          spaceId,
          appType,
          title: title || currentTab.title
        };
        
        // Add to history
        const newHistory = [
          ...(viewport.history || []).slice(0, (viewport.historyIndex || -1) + 1),
          { spaceId, appType, title }
        ];
        
        return {
          ...viewport,
          tabs: viewport.tabs.map(t => t.id === currentTab.id ? updatedTab : t),
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      } else {
        // Otherwise add new tab
        const newTab: Tab = {
          id: `tab_${Date.now()}`,
          spaceId,
          appType,
          title: title || 'New Tab'
        };
        return {
          ...viewport,
          tabs: [...viewport.tabs, newTab],
          activeTabId: newTab.id
        };
      }
    }, prev));
  };

  const navigateHistory = (viewportId: string, direction: 'back' | 'forward') => {
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => {
      const history = viewport.history || [];
      const currentIndex = viewport.historyIndex ?? -1;
      
      let newIndex = currentIndex;
      if (direction === 'back' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'forward' && currentIndex < history.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        return viewport;
      }
      
      const historyItem = history[newIndex];
      const currentTab = viewport.tabs.find(t => t.id === viewport.activeTabId);
      
      if (!currentTab) return viewport;
      
      const updatedTab: Tab = {
        ...currentTab,
        spaceId: historyItem.spaceId,
        appType: historyItem.appType,
        title: historyItem.title || currentTab.title
      };
      
      return {
        ...viewport,
        tabs: viewport.tabs.map(t => t.id === currentTab.id ? updatedTab : t),
        historyIndex: newIndex
      };
    }, prev));
  };

  const canNavigateBack = (viewportId: string): boolean => {
    const viewport = findViewport(viewportId);
    if (!viewport) return false;
    return (viewport.historyIndex ?? -1) > 0;
  };

  const canNavigateForward = (viewportId: string): boolean => {
    const viewport = findViewport(viewportId);
    if (!viewport) return false;
    const history = viewport.history || [];
    return (viewport.historyIndex ?? -1) < history.length - 1;
  };

  return {
    rootViewport,
    findViewport,
    splitViewport,
    closeViewport,
    resizeViewport,
    addTab,
    closeTab,
    updateTab,
    closeTabsWithSpace,
    setActiveTab,
    openSpaceInViewport,
    replaceCurrentTab,
    navigateHistory,
    canNavigateBack,
    canNavigateForward,
    focusedViewportId,
    setFocusedViewportId
  };
}