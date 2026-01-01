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
      const initialHistoryItem = { spaceId, appType, title: title || 'New Tab' };
      const newTab: Tab = {
        id: `tab_${Date.now()}`,
        spaceId,
        appType,
        title: title || 'New Tab',
        history: [initialHistoryItem],
        historyIndex: 0
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
    setRootViewport(prev => updateViewportInTree(viewportId, (viewport) => {
      const tab = viewport.tabs.find(t => t.id === tabId);
      if (!tab) return viewport;

      const updatedTab = { ...tab, ...updates };

      // If content changed, push to history
      if (updates.spaceId !== undefined || updates.appType !== undefined) {
        const isContentChange = updates.spaceId !== tab.spaceId || updates.appType !== tab.appType;
        if (isContentChange) {
           const history = tab.history || [];
           const currentIndex = tab.historyIndex ?? -1;
           
           // Slice history if we were in the middle
           // If history was empty/undefined, slice(0, 0) is empty array.
           const newHistory = currentIndex >= 0 ? history.slice(0, currentIndex + 1) : [];
           
           // Push new state
           newHistory.push({
               spaceId: updatedTab.spaceId,
               appType: updatedTab.appType,
               title: updatedTab.title
           });
           
           updatedTab.history = newHistory;
           updatedTab.historyIndex = newHistory.length - 1;
        }
      }
      
      // Safety: Ensure history exists
      if (!updatedTab.history || updatedTab.history.length === 0) {
          updatedTab.history = [{
              spaceId: updatedTab.spaceId,
              appType: updatedTab.appType,
              title: updatedTab.title
          }];
          updatedTab.historyIndex = 0;
      }

      return {
        ...viewport,
        tabs: viewport.tabs.map(t => t.id === tabId ? updatedTab : t)
      };
    }, prev));
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
          title: title || currentTab.title,
        };
        
        // Add to history
        const history = currentTab.history || [];
        const currentIndex = currentTab.historyIndex ?? -1;
        
        const newHistory = currentIndex >= 0 ? history.slice(0, currentIndex + 1) : [];
        newHistory.push({ spaceId, appType, title });
        
        updatedTab.history = newHistory;
        updatedTab.historyIndex = newHistory.length - 1;
        
        return {
          ...viewport,
          tabs: viewport.tabs.map(t => t.id === currentTab.id ? updatedTab : t)
        };
      } else {
        // Otherwise add new tab (delegate to addTab logic, but we must inline it here to keep clean state update)
        const initialHistoryItem = { spaceId, appType, title: title || 'New Tab' };
        const newTab: Tab = {
          id: `tab_${Date.now()}`,
          spaceId,
          appType,
          title: title || 'New Tab',
          history: [initialHistoryItem],
          historyIndex: 0
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
      if (!viewport.activeTabId) return viewport;
      
      const currentTab = viewport.tabs.find(t => t.id === viewport.activeTabId);
      if (!currentTab) return viewport;

      const history = currentTab.history || [];
      const currentIndex = currentTab.historyIndex ?? -1;
      
      let newIndex = currentIndex;
      if (direction === 'back' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'forward' && currentIndex < history.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        return viewport;
      }
      
      const historyItem = history[newIndex];
      
      const updatedTab: Tab = {
        ...currentTab,
        spaceId: historyItem.spaceId,
        appType: historyItem.appType,
        title: historyItem.title || currentTab.title,
        historyIndex: newIndex
      };
      
      return {
        ...viewport,
        tabs: viewport.tabs.map(t => t.id === currentTab.id ? updatedTab : t)
      };
    }, prev));
  };

  const canNavigateBack = (viewportId: string): boolean => {
    const viewport = findViewport(viewportId);
    if (!viewport || !viewport.activeTabId) return false;
    const tab = viewport.tabs.find(t => t.id === viewport.activeTabId);
    if (!tab) return false;
    return (tab.historyIndex ?? -1) > 0;
  };

  const canNavigateForward = (viewportId: string): boolean => {
    const viewport = findViewport(viewportId);
    if (!viewport || !viewport.activeTabId) return false;
    const tab = viewport.tabs.find(t => t.id === viewport.activeTabId);
    if (!tab) return false;
    const history = tab.history || [];
    return (tab.historyIndex ?? -1) < history.length - 1;
  };

  const moveTab = (sourceViewportId: string, targetViewportId: string, tabId: string, targetIndex: number) => {
    setRootViewport(prev => {
      let movedTab: Tab | null = null;
      
      // Step 1: Find and remove the tab from source
      const removeTab = (viewport: Viewport): Viewport => {
        if (viewport.id === sourceViewportId) {
          const tabIndex = viewport.tabs.findIndex(t => t.id === tabId);
          if (tabIndex !== -1) {
            movedTab = viewport.tabs[tabIndex];
            const newTabs = viewport.tabs.filter(t => t.id !== tabId);
            let newActiveTabId = viewport.activeTabId;
            
            if (viewport.activeTabId === tabId) {
              if (newTabs.length > 0) {
                newActiveTabId = newTabs[Math.max(0, tabIndex - 1)].id;
              } else {
                newActiveTabId = undefined;
              }
            }
            
            return { ...viewport, tabs: newTabs, activeTabId: newActiveTabId };
          }
        }
        
        if (viewport.children) {
          return {
            ...viewport,
            children: [removeTab(viewport.children[0]), removeTab(viewport.children[1])]
          };
        }
        return viewport;
      };

      const treeWithoutTab = removeTab(prev);
      if (!movedTab) return prev;

      // Step 2: Insert the tab into target
      const insertTab = (viewport: Viewport): Viewport => {
        if (viewport.id === targetViewportId) {
          const newTabs = [...viewport.tabs];
          newTabs.splice(targetIndex, 0, movedTab!);
          
          return {
            ...viewport,
            tabs: newTabs,
            activeTabId: movedTab!.id
          };
        }

        if (viewport.children) {
          return {
            ...viewport,
            children: [insertTab(viewport.children[0]), insertTab(viewport.children[1])]
          };
        }
        return viewport;
      };

      return insertTab(treeWithoutTab);
    });
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
    moveTab,
    focusedViewportId,
    setFocusedViewportId
  };
}