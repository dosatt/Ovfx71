import { useState, useEffect } from 'react';
import { Space, SpaceType, PageContent, Block } from '../types';
import { useHistory } from './useHistory';

const STORAGE_KEY = 'ovfx_spaces';

const defaultSpaces: Space[] = [];

export function useSpaces(onSpaceDeleted?: (spaceId: string) => void) {
  const initialSpaces = (() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSpaces;
  })();

  const {
    state: spaces,
    setState: setSpaces,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<Space[]>(initialSpaces);
  
  const [brokenLinks, setBrokenLinks] = useState<Set<string>>(new Set());
  const [brokenLinksVersion, setBrokenLinksVersion] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces));
  }, [spaces]);

  const createSpace = (type: SpaceType, parentId?: string): Space => {
    const siblings = spaces.filter(s => s.parentId === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.order || 0)) : -1;
    
    const newSpace: Space = {
      id: `space_${Date.now()}`,
      title: type === 'page' ? 'New page' : `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      parentId,
      order: maxOrder + 1,
      content: type === 'page' ? { blocks: [] } : {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSpaces(prev => [...prev, newSpace]);
    return newSpace;
  };

  const updateSpace = (id: string, updates: Partial<Space>) => {
    // Se il titolo cambia, aggiorna tutti i link che puntano a questo space
    if (updates.title) {
      const oldSpace = spaces.find(s => s.id === id);
      if (oldSpace && oldSpace.title !== updates.title) {
        const newTitle = updates.title;
        
        // Escape di caratteri speciali nella regex
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Aggiorna lo space e tutti i link nei page blocks
        setSpaces(prev => prev.map(space => {
          if (space.id === id) {
            // Aggiorna lo space target
            return { ...space, ...updates, updatedAt: new Date().toISOString() };
          } else if (space.type === 'page' && space.content) {
            // Aggiorna i link nei blocchi delle pages
            const pageContent = space.content as PageContent;
            if (!pageContent.blocks) return space;
            
            let hasChanges = false;
            const updatedBlocks = pageContent.blocks.map(block => {
              if (!block.content) return block;
              
              let updatedContent = block.content;
              
              // Aggiorna il formato storage [[spaceId:title]] (usato nei text elements)
              const regexStorage = new RegExp(`\\[\\[${escapedId}:([^\\]]+)\\]\\]`, 'g');
              updatedContent = updatedContent.replace(regexStorage, `[[${id}:${newTitle}]]`);
              
              // Aggiorna il formato standard [[spaceId|title]] (usato negli altri elementi)
              const regexStandard = new RegExp(`\\[\\[${escapedId}\\|([^\\]]+)\\]\\]`, 'g');
              updatedContent = updatedContent.replace(regexStandard, `[[${id}|${newTitle}]]`);
              
              if (updatedContent !== block.content) {
                hasChanges = true;
                return { ...block, content: updatedContent };
              }
              return block;
            });
            
            if (hasChanges) {
              return {
                ...space,
                content: { ...pageContent, blocks: updatedBlocks },
                updatedAt: new Date().toISOString()
              };
            }
          }
          return space;
        }));
        return;
      }
    }
    
    // Aggiornamento normale senza cambiamento di titolo
    setSpaces(prev => prev.map(s => 
      s.id === id 
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  const deleteSpace = (id: string) => {
    // Raccogli tutti gli ID da eliminare (inclusi i figli)
    const idsToDelete: string[] = [];
    
    const collectIds = (spaceId: string) => {
      idsToDelete.push(spaceId);
      const children = spaces.filter(s => s.parentId === spaceId);
      children.forEach(child => collectIds(child.id));
    };
    
    collectIds(id);
    
    // Aggiorna spaces e brokenLinks insieme
    setSpaces(prev => prev.filter(s => !idsToDelete.includes(s.id)));
    setBrokenLinks(prev => {
      const newSet = new Set(prev);
      idsToDelete.forEach(spaceId => newSet.add(spaceId));
      return newSet;
    });
    setBrokenLinksVersion(prev => prev + 1);
    
    // Notify that spaces were deleted
    if (onSpaceDeleted) {
      idsToDelete.forEach(spaceId => onSpaceDeleted(spaceId));
    }
  };

  const moveSpace = (spaceId: string, newParentId?: string) => {
    // Prevent moving a space into itself or its descendants
    if (spaceId === newParentId) return;
    
    const isDescendant = (parentId: string, childId: string): boolean => {
      const children = spaces.filter(s => s.parentId === parentId);
      if (children.some(c => c.id === childId)) return true;
      return children.some(c => isDescendant(c.id, childId));
    };
    
    if (newParentId && isDescendant(spaceId, newParentId)) return;
    
    setSpaces(prev => prev.map(s =>
      s.id === spaceId
        ? { ...s, parentId: newParentId, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  const toggleFavorite = (id: string) => {
    setSpaces(prev => prev.map(s =>
      s.id === id
        ? { ...s, isFavorite: !s.isFavorite, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  const getSpace = (id: string) => spaces.find(s => s.id === id);

  const getChildren = (parentId?: string) => 
    spaces
      .filter(s => s.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getFavorites = () => 
    spaces
      .filter(s => s.isFavorite)
      .sort((a, b) => (a.favoriteOrder || 0) - (b.favoriteOrder || 0));

  const reorderSpaces = (spaceId: string, targetSpaceId: string, position: 'before' | 'after') => {
    const space = getSpace(spaceId);
    const targetSpace = getSpace(targetSpaceId);
    
    if (!space || !targetSpace) return;
    
    // Se hanno parent diversi, prima sposta al parent del target, poi riordina
    if (space.parentId !== targetSpace.parentId) {
      // Sposta al livello del target
      setSpaces(prev => prev.map(s => 
        s.id === spaceId 
          ? { ...s, parentId: targetSpace.parentId, updatedAt: new Date().toISOString() }
          : s
      ));
      // Aggiorna il riferimento dopo lo spostamento
      setTimeout(() => {
        const siblings = getChildren(targetSpace.parentId);
        const filteredSiblings = siblings.filter(s => s.id !== spaceId);
        const targetIndex = filteredSiblings.findIndex(s => s.id === targetSpaceId);
        
        if (targetIndex === -1) return;
        
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        const newOrder = [...filteredSiblings.slice(0, insertIndex), space, ...filteredSiblings.slice(insertIndex)];
        
        setSpaces(prev => prev.map(s => {
          const orderIndex = newOrder.findIndex(ns => ns.id === s.id);
          if (orderIndex !== -1) {
            return { ...s, order: orderIndex, updatedAt: new Date().toISOString() };
          }
          return s;
        }));
      }, 0);
      return;
    }
    
    const siblings = getChildren(space.parentId);
    const filteredSiblings = siblings.filter(s => s.id !== spaceId);
    const targetIndex = filteredSiblings.findIndex(s => s.id === targetSpaceId);
    
    if (targetIndex === -1) return;
    
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    const newOrder = [...filteredSiblings.slice(0, insertIndex), space, ...filteredSiblings.slice(insertIndex)];
    
    setSpaces(prev => prev.map(s => {
      const orderIndex = newOrder.findIndex(ns => ns.id === s.id);
      if (orderIndex !== -1) {
        return { ...s, order: orderIndex, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  };

  const reorderFavorites = (spaceId: string, targetSpaceId: string, position: 'before' | 'after') => {
    const space = getSpace(spaceId);
    const targetSpace = getSpace(targetSpaceId);
    
    if (!space || !targetSpace || !space.isFavorite || !targetSpace.isFavorite) return;
    
    const favorites = getFavorites();
    const filteredFavorites = favorites.filter(s => s.id !== spaceId);
    const targetIndex = filteredFavorites.findIndex(s => s.id === targetSpaceId);
    
    if (targetIndex === -1) return;
    
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    const newOrder = [...filteredFavorites.slice(0, insertIndex), space, ...filteredFavorites.slice(insertIndex)];
    
    setSpaces(prev => prev.map(s => {
      const orderIndex = newOrder.findIndex(ns => ns.id === s.id);
      if (orderIndex !== -1 && s.isFavorite) {
        return { ...s, favoriteOrder: orderIndex, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  };

  // Trova tutti gli spaces che contengono link a un dato spaceId
  const findSpacesLinkingTo = (targetSpaceId: string): Space[] => {
    return spaces.filter(space => {
      if (space.type !== 'page' || !space.content) return false;
      
      const pageContent = space.content as PageContent;
      if (!pageContent.blocks) return false;
      
      // Cerca link nel contenuto dei blocchi (sia formato : che |)
      return pageContent.blocks.some(block => {
        if (!block.content) return false;
        // Cerca entrambi i pattern: [[spaceId:...]] e [[spaceId|...]]
        return block.content.includes(`[[${targetSpaceId}:`) || 
               block.content.includes(`[[${targetSpaceId}|`);
      });
    });
  };

  return {
    spaces,
    createSpace,
    updateSpace,
    deleteSpace,
    moveSpace,
    toggleFavorite,
    getSpace,
    getChildren,
    getFavorites,
    reorderSpaces,
    reorderFavorites,
    findSpacesLinkingTo,
    brokenLinks,
    brokenLinksVersion,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}