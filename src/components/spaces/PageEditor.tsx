import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { Button, Input, Textarea, Tooltip } from '@heroui/react';
import {
  Calendar,
  Clock,
  User,
  Tag,
  Hash,
  Link as LinkIcon,
  Globe,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Type,
  Upload
} from 'lucide-react';
import { Space, Block, BlockType, PageContent } from '../../types';
import { ListGroup } from './ListGroup';
import { TextElement } from './TextElement';
import { ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { useHistory } from '../../contexts/HistoryContext';
import { blockTypeConfig } from './blockConfig';
import type { Settings } from '../../hooks/useSettings';
import { PropertiesView } from './PropertiesView';

interface PageEditorProps {
  space: Space;
  spacesState: any;
  viewportsState?: any;
  viewportId?: string;
  tabId?: string;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
}

export function PageEditor({
  space,
  spacesState,
  viewportsState,
  viewportId,
  tabId,
  brokenLinks,
  brokenLinksVersion,
  settings,
  onUpdateSettings
}: PageEditorProps) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<{ anchor: HTMLElement; afterBlockId?: string } | null>(null);
  const [collapsedHeaders, setCollapsedHeaders] = useState<Set<string>>(new Set());
  const [temporaryBlockId, setTemporaryBlockId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pushAction } = useHistory();

  const content = space.content as PageContent;
  const blocks = content?.blocks || [];

  const showProperties = space.metadata?.showProperties === true; // Default to false (hidden)

  // Focus sul primo blocco quando la pagina viene creata
  useEffect(() => {
    if (blocks.length === 0) {
      addBlock('text');
      // Wait for the state to update and block to be rendered
      setTimeout(() => {
        focusBlockByIndex(0);
      }, 150);
    } else {
      // If it's a new session for this page but it has content, focus first
      setTimeout(() => {
        focusBlockByIndex(0);
      }, 150);
    }
  }, [space.id]);

  const handleTitleChange = (newTitle: string) => {
    // Update space title
    spacesState.updateSpace(space.id, { title: newTitle });

    // Update tab title if viewportsState is available
    if (viewportsState && viewportId && tabId) {
      viewportsState.updateTab(viewportId, tabId, { title: newTitle });
    }
  };

  const updateContent = (newBlocks: Block[]) => {
    // Ensure there's always at least one trailing text element
    const lastBlock = newBlocks[newBlocks.length - 1];
    const needsTrailingElement = !lastBlock || lastBlock.type !== 'text' || lastBlock.content !== '';

    let blocksToSave = newBlocks;
    if (needsTrailingElement) {
      // Add a trailing text element if needed
      const trailingBlock: Block = {
        id: `block_${Date.now()}_trailing`,
        type: 'text',
        content: '',
      };
      blocksToSave = [...newBlocks, trailingBlock];
    }

    spacesState.updateSpace(space.id, {
      content: { ...content, blocks: blocksToSave }
    });

    // Check if the title needs to be synced with a new "first header"
    const isTitleSynced = space.metadata?.syncTitleWithH1 !== false;
    if (isTitleSynced) {
      const firstHeader = blocksToSave.find((b: any) =>
        b && ['heading1', 'heading2', 'heading3', 'heading4'].includes(b.type)
      );
      if (firstHeader && firstHeader.content !== space.title) {
        spacesState.updateSpace(space.id, { title: firstHeader.content });
        // Update tab title if viewportsState is available
        if (viewportsState && viewportId && tabId) {
          viewportsState.updateTab(viewportId, tabId, { title: firstHeader.content });
        }
      }
    }
  };

  const addBlock = (type: BlockType, afterBlockId?: string) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      content: '',
      checked: type === 'checkbox' ? false : undefined
    };

    if (afterBlockId) {
      const index = blocks.findIndex(b => b && b.id === afterBlockId);
      const newBlocks = [...blocks];
      if (index !== -1) {
        newBlocks.splice(index + 1, 0, newBlock);
        updateContent(newBlocks);
      }
    } else {
      updateContent([...blocks, newBlock]);
    }
    setMenuAnchor(null);
  };

  const addBlockBefore = (blockId: string) => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random()}`,
      type: 'text',
      content: '',
    };

    const index = blocks.findIndex(b => b && b.id === blockId);
    if (index === -1) return;
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    updateContent(newBlocks);

    // Focus sul nuovo blocco dopo un breve delay
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`);
      if (newBlockElement) {
        const input = newBlockElement.querySelector('input, textarea');
        if (input) {
          (input as HTMLElement).focus();
        } else {
          // Cerca contentEditable per RichTextEditor
          const contentEditable = newBlockElement.querySelector('[contenteditable="true"]');
          if (contentEditable) {
            (contentEditable as HTMLElement).focus();
          }
        }
      }
    }, 50);
  };

  const createNextBlock = (blockId: string, blockType: BlockType, newBlockUpdates?: Partial<Block>, currentBlockUpdates?: Partial<Block>) => {
    const index = blocks.findIndex(b => b && b.id === blockId);
    if (index === -1) return;

    // Logic to inherit indent
    let indent = 0;
    const allowedIndentTypes = ['bulletList', 'numberedList', 'checkbox', 'checkboxNumberedList'];

    if (index !== -1 && allowedIndentTypes.includes(blockType)) {
      const currentBlock = blocks[index];
      if (currentBlock.indent) {
        indent = currentBlock.indent;
      }
    }

    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random()}`,
      type: blockType,
      content: '',
      checked: blockType === 'checkbox' ? false : undefined,
      indent: indent > 0 ? indent : undefined,
      ...newBlockUpdates
    };

    let newBlocks = [...blocks];

    // Apply updates to current block if provided
    if (currentBlockUpdates && index !== -1) {
      newBlocks[index] = { ...newBlocks[index], ...currentBlockUpdates };
    }

    newBlocks.splice(index + 1, 0, newBlock);
    updateContent(newBlocks);

    // Focus sul nuovo blocco dopo un breve delay
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`);
      if (newBlockElement) {
        const input = newBlockElement.querySelector('input, textarea');
        if (input) {
          (input as HTMLElement).focus();
        } else {
          // Cerca contentEditable per RichTextEditor
          const contentEditable = newBlockElement.querySelector('[contenteditable="true"]');
          if (contentEditable) {
            (contentEditable as HTMLElement).focus();
          }
        }
      }
    }, 50);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Se ci sono blocchi, focalizza il primo
      if (blocks.length > 0) {
        setTimeout(() => {
          const firstBlockElement = document.querySelector(`[data-block-id="${blocks[0].id}"]`);
          if (firstBlockElement) {
            const input = firstBlockElement.querySelector('input, textarea');
            if (input) {
              (input as HTMLElement).focus();
            } else {
              // Cerca contentEditable per RichTextEditor
              const contentEditable = firstBlockElement.querySelector('[contenteditable="true"]');
              if (contentEditable) {
                (contentEditable as HTMLElement).focus();
              }
            }
          }
        }, 50);
      } else {
        // Altrimenti crea un nuovo blocco text
        const newBlock: Block = {
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'text',
          content: '',
        };
        updateContent([newBlock]);

        // Focus sul nuovo blocco dopo un breve delay
        setTimeout(() => {
          const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`);
          if (newBlockElement) {
            const input = newBlockElement.querySelector('input, textarea');
            if (input) {
              (input as HTMLElement).focus();
            } else {
              // Cerca contentEditable per RichTextEditor
              const contentEditable = newBlockElement.querySelector('[contenteditable="true"]');
              if (contentEditable) {
                (contentEditable as HTMLElement).focus();
              }
            }
          }
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      // Passa al primo blocco
      if (blocks.length > 0) {
        e.preventDefault();
        setTimeout(() => {
          const firstBlockElement = document.querySelector(`[data-block-id="${blocks[0].id}"]`);
          if (firstBlockElement) {
            const input = firstBlockElement.querySelector('input, textarea');
            if (input) {
              (input as HTMLElement).focus();
            } else {
              // Cerca contentEditable per RichTextEditor
              const contentEditable = firstBlockElement.querySelector('[contenteditable="true"]');
              if (contentEditable) {
                (contentEditable as HTMLElement).focus();
              }
            }
          }
        }, 0);
      }
    }
  };

  const focusBlockByIndex = (index: number) => {
    // We need to wait for the DOM to be ready
    setTimeout(() => {
      // Find all contenteditable blocks within this editor instance
      // Use a more specific selector to avoid picking up sidebar items or other viewports
      const editorElement = document.querySelector(`[data-viewport-id="${viewportId}"]`) || document;
      const editableElements = editorElement.querySelectorAll('[contenteditable="true"]');

      const target = editableElements[index] as HTMLElement;
      if (target) {
        target.focus();

        // Move cursor to end
        try {
          const selection = window.getSelection();
          const range = document.createRange();

          if (target.childNodes.length > 0) {
            range.selectNodeContents(target);
            range.collapse(false); // end
          } else {
            range.setStart(target, 0);
            range.setEnd(target, 0);
          }

          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (e) {
          console.warn("Could not move cursor:", e);
        }

        // Ensure the block is marked as focused in our state if necessary
        // (TextElement manages its own focus state via onFocus/onBlur)
      }
    }, 150);
  };

  const focusLastBlock = () => {
    focusBlockByIndex(blocks.length - 1);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const oldBlock = blocks.find(b => b && b.id === id);
    if (!oldBlock) return;

    const newBlock = { ...oldBlock, ...updates };
    const newBlocks = blocks.map(b => b && b.id === id ? newBlock : b);
    updateContent(newBlocks);

    // Track history for content or type changes
    // We ignore internal state changes like checked unless explicitly needed, 
    // but type change is significant.
    const isContentChange = updates.content !== undefined && updates.content !== oldBlock.content;
    const isTypeChange = updates.type !== undefined && updates.type !== oldBlock.type;

    if (isContentChange || isTypeChange) {
      pushAction({
        type: 'updateBlock',
        description: isTypeChange ? 'Converti blocco' : 'Modifica blocco',
        undo: () => {
          const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
          // Restore the entire old block state
          const restoredBlocks = currentBlocks.map(b => b && b.id === id ? oldBlock : b);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: restoredBlocks }
          });
        },
        redo: () => {
          const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
          // Apply the new block state
          const updatedBlocks = currentBlocks.map(b => b && b.id === id ? newBlock : b);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: updatedBlocks }
          });
        }
      });
    }
  };

  const deleteBlock = (id: string) => {
    const deletedBlock = blocks.find(b => b && b.id === id);
    const deletedIndex = blocks.findIndex(b => b && b.id === id);
    if (deletedIndex === -1) return;
    const newBlocks = blocks.filter(b => b && b.id !== id);
    updateContent(newBlocks);

    if (deletedBlock) {
      pushAction({
        type: 'deleteBlock',
        description: 'Elimina blocco',
        undo: () => {
          const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
          const restoredBlocks = [...currentBlocks];
          restoredBlocks.splice(deletedIndex, 0, deletedBlock);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: restoredBlocks }
          });
        },
        redo: () => {
          const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
          const filteredBlocks = currentBlocks.filter(b => b && b.id !== id);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: filteredBlocks }
          });
        }
      });
    }
  };

  const convertBlock = (id: string, newType: BlockType) => {
    convertBlocks([id], newType);
  };

  const convertBlocks = (ids: string[], newType: BlockType) => {
    // Filter out blocks that don't need conversion
    const targetIds = new Set(ids);
    const blocksToConvert = blocks.filter(b => b && targetIds.has(b.id) && b.type !== newType);

    if (blocksToConvert.length === 0) return;

    // Store old types for undo
    const oldTypes = new Map<string, BlockType>();
    blocksToConvert.forEach(b => oldTypes.set(b.id, b.type));

    const newBlocks = blocks.map(b => {
      if (targetIds.has(b.id)) {
        return {
          ...b,
          type: newType,
          checked: newType === 'checkbox' ? false : undefined
        };
      }
      return b;
    });

    updateContent(newBlocks);

    pushAction({
      type: 'convertBlock', // reusing type for simplicity, or could add 'convertBlocks'
      description: `Converti ${ids.length} elementi in ${blockTypeConfig[newType].label}`,
      undo: () => {
        const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
        const restoredBlocks = currentBlocks.map(b => {
          if (targetIds.has(b.id) && oldTypes.has(b.id)) {
            const oldType = oldTypes.get(b.id)!;
            return {
              ...b,
              type: oldType,
              checked: oldType === 'checkbox' ? false : undefined
            };
          }
          return b;
        });
        spacesState.updateSpace(space.id, {
          content: { ...content, blocks: restoredBlocks }
        });
      },
      redo: () => {
        const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
        const convertedBlocks = currentBlocks.map(b => {
          if (targetIds.has(b.id)) {
            return {
              ...b,
              type: newType,
              checked: newType === 'checkbox' ? false : undefined
            };
          }
          return b;
        });
        spacesState.updateSpace(space.id, {
          content: { ...content, blocks: convertedBlocks }
        });
      }
    });
  };

  const moveBlocks = useCallback((blockIds: string[], hoverIndex: number) => {
    const newBlocks = [...blocks];

    // Filtra gli ID validi presenti in questo space
    const validIds = blockIds.filter(id => blocks.some(b => b && b.id === id));
    if (validIds.length === 0) return;

    // Salva i blocchi da spostare nell'ordine di selezione (pickup order)
    const blocksToMove = validIds.map(id => blocks.find(b => b && b.id === id)!).filter(Boolean);

    // Trova l'indice del blocco target prima della rimozione
    const targetBlock = blocks[hoverIndex];

    // Rimuovi i blocchi dalle posizioni originali
    const remainingBlocks = newBlocks.filter(b => !validIds.includes(b.id));

    // Trova il nuovo indice di inserimento
    let insertIndex = hoverIndex;
    if (targetBlock) {
      insertIndex = remainingBlocks.findIndex(b => b.id === targetBlock.id);
      // Se non lo trova (perché era uno di quelli rimossi), usa hoverIndex limitato
      if (insertIndex === -1) insertIndex = Math.min(hoverIndex, remainingBlocks.length);
    } else {
      insertIndex = remainingBlocks.length;
    }

    // Pulisci i numeri di lista se necessario
    const cleanedBlocksToMove = blocksToMove.map(block => {
      if (block.listNumber !== undefined) {
        return { ...block, listNumber: undefined };
      }
      return block;
    });

    remainingBlocks.splice(insertIndex, 0, ...cleanedBlocksToMove);
    updateContent(remainingBlocks);
    setSelectedBlockIds([]); // Pulisci la selezione dopo lo spostamento
  }, [blocks, updateContent]);

  const moveBlock = useCallback((dragIndex: number, hoverIndex: number, count: number = 1) => {
    // Se c'è una selezione multipla e il blocco trascinato ne fa parte, usa moveBlocks
    const draggedBlock = blocks[dragIndex];
    if (draggedBlock && selectedBlockIds.includes(draggedBlock.id)) {
      moveBlocks(selectedBlockIds, hoverIndex);
      return;
    }

    const newBlocks = [...blocks];

    // Ensure indices are valid
    if (dragIndex < 0 || dragIndex >= newBlocks.length || hoverIndex < 0 || hoverIndex > newBlocks.length) {
      return;
    }

    // Remove the block(s)
    const removed = newBlocks.splice(dragIndex, count);

    // Reset manual ordering for moved blocks so they comply with the new list position
    const cleanedRemoved = removed.map(block => {
      if (block.listNumber !== undefined) {
        return { ...block, listNumber: undefined };
      }
      return block;
    });

    // Calculate insertion index
    // When moving down (dragIndex < hoverIndex), the removal shifts subsequent items by 'count'.
    // If count > 1, using hoverIndex directly would skip (count-1) items.
    let insertIndex = hoverIndex;
    if (dragIndex < hoverIndex) {
      insertIndex = hoverIndex - (count - 1);
    }

    newBlocks.splice(insertIndex, 0, ...cleanedRemoved);
    updateContent(newBlocks);
  }, [blocks, content, space.id, spacesState]);

  const toggleHeaderCollapse = (blockId: string) => {
    setCollapsedHeaders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const isBlockCollapsed = (blockIndex: number): boolean => {
    const currentBlock = blocks[blockIndex];

    // 1. Stop Dividers exception: if we are a stop divider, we are never hidden by a parent collapse
    // because we are the boundary. Regular dividers remain collapsible.
    if (currentBlock.type === 'divider' && currentBlock.metadata?.dividerVariant === 'stop') {
      return false;
    }

    const currentIsHeader = currentBlock.type === 'heading1' || currentBlock.type === 'heading2' || currentBlock.type === 'heading3' || currentBlock.type === 'heading4';

    let currentLevel = 99; // Text/other default
    if (currentIsHeader) {
      currentLevel = parseInt(currentBlock.type.replace('heading', ''));
    }

    let minLevelSeen = currentLevel;

    for (let i = blockIndex - 1; i >= 0; i--) {
      const block = blocks[i];

      // If we find a stop divider, it blocks all collapse scopes from above
      if (block.type === 'divider' && block.metadata?.dividerVariant === 'stop') {
        return false;
      }

      const isHeader = block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3' || block.type === 'heading4';

      if (isHeader) {
        const headerLevel = parseInt(block.type.replace('heading', ''));

        if (headerLevel < minLevelSeen) {
          if (collapsedHeaders.has(block.id)) {
            return true;
          }
          minLevelSeen = headerLevel;
        }
      }
    }

    return false;
  };

  const getCollapsedGroupSize = (startIndex: number): number => {
    const headerBlock = blocks[startIndex];
    const isHeader = headerBlock.type.startsWith('heading');
    if (!isHeader || !collapsedHeaders.has(headerBlock.id)) {
      return 1;
    }

    const headerLevel = headerBlock.type === 'text' ? 99 : parseInt(headerBlock.type.replace('heading', ''));
    let count = 1;

    for (let i = startIndex + 1; i < blocks.length; i++) {
      const current = blocks[i];

      // Stop grouping if we hit a stop divider
      if (current.type === 'divider' && current.metadata?.dividerVariant === 'stop') {
        break;
      }

      // Check if current block breaks the scope
      if (current.type.startsWith('heading')) {
        const currentLevel = parseInt(current.type.replace('heading', ''));
        if (currentLevel <= headerLevel) {
          break;
        }
      }
      count++;
    }
    return count;
  };

  const handleApplyStyle = (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    // Questa funzione applica lo stile markdown al testo selezionato
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const selectedText = range.toString();

    // Trova il blocco contenente la selezione
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentNode!;
    }

    const blockElement = (container as HTMLElement).closest('[data-block-id]');
    if (!blockElement) return;

    const blockId = blockElement.getAttribute('data-block-id');
    if (!blockId) return;

    const block = blocks.find(b => b && b.id === blockId);
    if (!block) return;

    // Applica lo stile markdown
    let styledText = selectedText;
    switch (style) {
      case 'bold':
        styledText = `**${selectedText}**`;
        break;
      case 'italic':
        styledText = `*${selectedText}*`;
        break;
      case 'underline':
        styledText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        styledText = `~~${selectedText}~~`;
        break;
    }

    // Sostituisci il testo selezionato con il testo stilizzato nel content del blocco
    const textarea = blockElement.querySelector('textarea, input');
    if (textarea instanceof HTMLTextAreaElement || textarea instanceof HTMLInputElement) {
      const start = textarea.value.indexOf(selectedText);
      if (start !== -1) {
        const newContent = textarea.value.substring(0, start) + styledText + textarea.value.substring(start + selectedText.length);
        updateBlock(blockId, { content: newContent });
      }
    }
  };

  const handleFileDrop = async (files: any[]) => {
    const newBlocks: Block[] = [];

    for (const file of files) {
      if (file.type && file.type.startsWith('image/')) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newBlocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: dataUrl,
          });
        } catch (e) {
          console.error("Failed to read file", file.name, e);
        }
      } else {
        // Generic File Block
        newBlocks.push({
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'file',
          content: file.name,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream'
          }
        });
      }
    }

    if (newBlocks.length > 0) {
      updateContent([...blocks, ...newBlocks]);
    }
  };

  const [{ isOver }, dropRef] = useDrop({
    accept: [ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT, 'CALENDAR_EVENT', NativeTypes.FILE],
    drop: (item: any, monitor) => {
      // Handle File Drop
      if (monitor.getItemType() === NativeTypes.FILE) {
        const files = item.files;
        if (files && files.length > 0) {
          handleFileDrop(files);
        }
        return;
      }

      // Gestione drop textElement (da PageBlock)
      if (item.itemType === ITEM_TYPE_TEXT_ELEMENT) {
        const dragMode = getDragMode(); // Ottieni il drag mode corrente
        const sourceSpaceId = item.sourceSpaceId;
        const targetSpaceId = space.id;

        // Se è lo stesso space, non fare nulla (già gestito dal drag interno)
        if (sourceSpaceId === targetSpaceId && dragMode !== 'duplicate') {
          return;
        }

        // Crea il nuovo blocco basato sulla modalità
        handleTextElementDrop(item, dragMode, sourceSpaceId);
      }
      // Gestione drop calendar event (da CalendarApp)
      else if (item.type === 'CALENDAR_EVENT' || item.itemType === 'CALENDAR_EVENT') {
        const dragMode = getDragMode();
        handleTextElementDrop({
          ...item,
          itemType: ITEM_TYPE_TEXT_ELEMENT,
          blockType: 'calendar',
          fullBlock: {
            id: item.id,
            type: 'calendar',
            content: item.title || '',
            metadata: {
              startDate: item.start,
              endDate: item.end,
              notes: item.content
            }
          }
        }, dragMode, item.spaceId);
      }
      // Gestione drop space (da Sidebar)
      else if (item.isSpaceDrag && item.spaceData) {
        const newBlock: Block = {
          id: `block_${Date.now()}`,
          type: 'spaceEmbed',
          content: '', // Non usato per spaceEmbed
          spaceId: item.spaceData.id,
        };
        updateContent([...blocks, newBlock]);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });

  // Helper per ottenere il drag mode corrente
  const getDragMode = (): 'link' | 'duplicate' | 'move' => {
    if (window.event) {
      const e = window.event as KeyboardEvent;
      if (e.shiftKey) return 'move';
      if (e.altKey) return 'duplicate';
    }
    return 'link';
  };

  // Handler per il drop di textElement
  const handleTextElementDrop = (item: any, dragMode: 'link' | 'duplicate' | 'move', sourceSpaceId: string) => {
    const fullBlock = item.fullBlock;

    // Determina il tipo di blocco risultante
    let resultBlockType = fullBlock.type;
    let resultBlock: Block;

    // Tipi che restano sempre come embed quando linkati
    const alwaysEmbedTypes = ['embed', 'pageLink', 'image', 'file', 'code', 'divider'];

    switch (dragMode) {
      case 'link':
        // Se è uno dei tipi speciali, crea blockEmbed
        if (alwaysEmbedTypes.includes(fullBlock.type)) {
          resultBlock = {
            id: `block_${Date.now()}_${Math.random()}`,
            type: 'blockEmbed',
            content: '', // Non usato per blockEmbed
            blockId: fullBlock.id,
            sourceSpaceId: sourceSpaceId,
          };
        } else {
          // Altrimenti crea blockEmbed comunque (l'elemento viene collegato)
          resultBlock = {
            id: `block_${Date.now()}_${Math.random()}`,
            type: 'blockEmbed',
            content: '', // Non usato per blockEmbed
            blockId: fullBlock.id,
            sourceSpaceId: sourceSpaceId,
          };
        }
        break;

      case 'duplicate':
        // Crea una copia completa del blocco
        resultBlock = {
          ...fullBlock,
          id: `block_${Date.now()}_${Math.random()}`,
        };
        break;

      case 'move':
        // Per 'move': se sono nello stesso space, non fare nulla (gestito da drag interno)
        // Se sono in space diversi:
        if (sourceSpaceId !== space.id) {
          // Gli embed/link/image/file/code/divider diventano blockEmbed
          if (alwaysEmbedTypes.includes(fullBlock.type)) {
            resultBlock = {
              id: `block_${Date.now()}_${Math.random()}`,
              type: 'blockEmbed',
              content: '',
              blockId: fullBlock.id,
              sourceSpaceId: sourceSpaceId,
            };
          } else {
            // Gli altri vengono spostati (copia + rimozione dall'originale)
            resultBlock = {
              ...fullBlock,
              id: `block_${Date.now()}_${Math.random()}`,
            };

            // Rimuovi dall'originale
            const sourceSpace = spacesState.getSpace(sourceSpaceId);
            if (sourceSpace && sourceSpace.content?.blocks) {
              const sourceBlocks = sourceSpace.content.blocks.filter(
                (b: Block) => b.id !== fullBlock.id
              );
              spacesState.updateSpace(sourceSpaceId, {
                content: { ...sourceSpace.content, blocks: sourceBlocks }
              });
            }
          }
        } else {
          // Stesso space, usa duplicate come fallback
          resultBlock = {
            ...fullBlock,
            id: `block_${Date.now()}_${Math.random()}`,
          };
        }
        break;

      default:
        resultBlock = {
          ...fullBlock,
          id: `block_${Date.now()}_${Math.random()}`,
        };
    }

    // Aggiungi il blocco alla fine
    const newBlocks = [...blocks, resultBlock];
    updateContent(newBlocks);

    // Animazione: scroll al blocco appena aggiunto
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${resultBlock.id}"]`);
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const renderBlocks = () => {
    const renderedElements: JSX.Element[] = [];
    let i = 0;

    // Helper for calculating list number based on hierarchy
    const calculateListNumber = (currentIndex: number): string | number | undefined => {
      const currentBlock = blocks[currentIndex];
      const isNumbered = (type: BlockType) => type === 'numberedList' || type === 'checkboxNumberedList';
      const isList = (type: BlockType) => ['bulletList', 'numberedList', 'checkbox', 'checkboxNumberedList'].includes(type);

      if (!isNumbered(currentBlock.type)) return undefined;

      const currentIndent = currentBlock.indent || 0;
      let siblingCount = 0;
      let localBase = 1;
      let parentIndex = -1;
      let foundLocalBase = false;

      // Single pass backwards
      for (let k = currentIndex - 1; k >= 0; k--) {
        const prevBlock = blocks[k];

        if (!isList(prevBlock.type)) break;

        const prevIndent = prevBlock.indent || 0;

        if (prevIndent === currentIndent) {
          if (isNumbered(prevBlock.type)) {
            // Only count siblings if we haven't found a base yet
            if (!foundLocalBase) {
              siblingCount++;
              if (prevBlock.listNumber !== undefined) {
                localBase = prevBlock.listNumber;
                foundLocalBase = true;
              }
            }
          } else {
            // Sibling breaks sequence (e.g. bullet list in between numbered lists)
            // If we hit a break, it means the current sequence started AFTER this block.
            // So we stop counting siblings and use default base 1.
            break;
          }
        } else if (prevIndent < currentIndent) {
          parentIndex = k;
          break;
        }
      }

      let localValue = localBase;
      if (currentBlock.listNumber !== undefined) {
        localValue = currentBlock.listNumber;
      } else {
        localValue = localBase + siblingCount;
      }

      if (parentIndex !== -1) {
        const parentString = calculateListNumber(parentIndex);
        if (parentString !== undefined) {
          return `${parentString}.${localValue}`;
        }
      }

      return localValue;
    };

    while (i < blocks.length) {
      const block = blocks[i];
      const isNumbered = (type: BlockType) => type === 'numberedList' || type === 'checkboxNumberedList';
      const isList = ['bulletList', 'numberedList', 'checkbox', 'checkboxNumberedList'].includes(block.type);

      if (isList) {
        let j = i + 1;
        // Group logic:
        // If current is numbered/checkboxNumbered, group with subsequent numbered/checkboxNumbered
        // Else group with exact same type
        const currentIsNumbered = isNumbered(block.type);

        while (j < blocks.length) {
          const nextType = blocks[j].type;
          if (currentIsNumbered) {
            if (!isNumbered(nextType)) break;
          } else {
            if (nextType !== block.type) break;
          }
          j++;
        }

        const groupSize = j - i;

        if (groupSize >= 2) {
          const groupBlocks = blocks.slice(i, j);

          const groupListNumbers = groupBlocks.map((b, relativeIndex) => {
            return calculateListNumber(i + relativeIndex);
          });

          renderedElements.push(
            <ListGroup
              key={`group-${block.id}`}
              blocks={groupBlocks}
              startIndex={i}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onAddAfter={(blockId, anchor) => setMenuAnchor({ anchor, afterBlockId: blockId })}
              onAddBefore={addBlockBefore}
              onMove={moveBlock}
              onConvertBlock={convertBlock}
              onConvertBlocks={convertBlocks}
              createNextBlock={createNextBlock}
              toggleHeaderCollapse={toggleHeaderCollapse}
              isBlockCollapsed={isBlockCollapsed}
              collapsedHeaders={collapsedHeaders}
              focusBlockByIndex={focusBlockByIndex}
              totalBlocks={blocks.length}
              config={{}}
              currentSpaceId={space.id}
              currentSpaceName={space.title}
              spacesState={spacesState}
              viewportsState={viewportsState}
              brokenLinks={brokenLinks}
              brokenLinksVersion={brokenLinksVersion}
              listNumbers={groupListNumbers}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              selectedBlockIds={selectedBlockIds}
              onToggleSelection={onToggleSelection}
            />
          );
          i = j;
          continue;
        }
      }

      // Render single block
      const isHeader = block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3' || block.type === 'heading4';
      const isCollapsed = isHeader ? collapsedHeaders.has(block.id) : false;
      const prevBlock = i > 0 ? blocks[i - 1] : undefined;
      const nextBlock = i < blocks.length - 1 ? blocks[i + 1] : undefined;

      const dragCount = isCollapsed ? getCollapsedGroupSize(i) : 1;

      let listNumber: number | string | undefined;

      if (isNumbered(block.type)) {
        listNumber = calculateListNumber(i);
      }

      renderedElements.push(
        <TextElement
          key={block.id}
          block={{ ...block, collapsed: isCollapsed }}
          index={i}
          onUpdate={updateBlock}
          onDelete={deleteBlock}
          onAddAfter={(blockId, anchor) => setMenuAnchor({ anchor, afterBlockId: blockId })}
          onAddBefore={addBlockBefore}
          onMove={moveBlock}
          onConvertBlock={convertBlock}
          config={blockTypeConfig[block.type] || blockTypeConfig['text']}
          createNextBlock={createNextBlock}
          toggleHeaderCollapse={toggleHeaderCollapse}
          isBlockCollapsed={isBlockCollapsed}
          collapsedHeaders={collapsedHeaders}
          focusBlockByIndex={focusBlockByIndex}
          totalBlocks={blocks.length}
          prevBlock={prevBlock}
          nextBlock={nextBlock}
          currentSpaceId={space.id}
          currentSpaceName={space.title}
          spacesState={spacesState}
          viewportsState={viewportsState}
          brokenLinks={brokenLinks}
          brokenLinksVersion={brokenLinksVersion}
          listNumber={listNumber}
          dragCount={dragCount}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          selectedBlockIds={selectedBlockIds}
          onToggleSelection={onToggleSelection}
        />
      );
      i++;
    }
    return renderedElements;
  };

  const selectAllBlocks = useCallback(() => {
    setSelectedBlockIds(blocks.map(b => b.id));
  }, [blocks]);

  const selectGroupBlocks = useCallback((ids: string[]) => {
    setSelectedBlockIds(ids);
  }, []);

  const onToggleSelection = (blockId: string, isShift: boolean) => {
    if (isShift) {
      setSelectedBlockIds(prev =>
        prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]
      );
    } else {
      setSelectedBlockIds([blockId]);
    }
  };

  return (
    <div
      ref={dropRef}
      className={`flex-1 h-full min-h-[500px] overflow-y-auto no-scrollbar pb-32 transition-colors duration-200 ${isOver ? 'bg-primary/5' : ''}`}
    >
      <div
        className={`max-w-4xl mx-auto pb-8 px-8 flex flex-col transition-all duration-300 ${showProperties ? 'pt-6' : 'pt-[15vh]'
          }`}
      >
        {/* Properties Section */}
        {showProperties && (
          <div className="mb-6 -mx-3 border border-divider rounded-lg bg-white/15 dark:bg-default-50/30">
            <PropertiesView
              space={space}
              spacesState={spacesState}
            />
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex justify-end mb-4 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => fileInputRef.current?.click()}
            className="text-default-400 hover:text-default-600"
            title="Carica più file"
          >
            <Upload size={18} />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileDrop(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* Editor Blocks */}
        <div className="flex flex-col relative">
          {renderBlocks()}
        </div>
      </div>
    </div>
  );
}