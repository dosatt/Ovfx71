import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDrop } from 'react-dnd';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Textarea from '@mui/joy@5.0.0-beta.48/Textarea';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import {
  Plus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
  AlertCircle,
  Image as ImageIcon,
  File as FileIcon,
  Link2,
  Globe
} from 'lucide-react';
import { Space, Block, BlockType, PageContent } from '../../types';
import { PageBlock } from './PageBlock';
import { ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { useHistory } from '../../contexts/HistoryContext';

interface PageEditorProps {
  space: Space;
  spacesState: any;
  viewportsState?: any;
  viewportId?: string;
  tabId?: string;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
}

const blockTypeConfig: Record<BlockType, { icon: any; label: string; placeholder: string }> = {
  text: { icon: Type, label: 'Text', placeholder: 'Type something...' },
  heading1: { icon: Heading1, label: 'Heading 1', placeholder: 'Heading 1' },
  heading2: { icon: Heading2, label: 'Heading 2', placeholder: 'Heading 2' },
  heading3: { icon: Heading3, label: 'Heading 3', placeholder: 'Heading 3' },
  bulletList: { icon: List, label: 'Bullet List', placeholder: 'List item' },
  numberedList: { icon: ListOrdered, label: 'Numbered List', placeholder: 'List item' },
  checkbox: { icon: CheckSquare, label: 'Checkbox', placeholder: 'To-do item' },
  quote: { icon: Quote, label: 'Quote', placeholder: 'Quote' },
  divider: { icon: Minus, label: 'Divider', placeholder: '' },
  callout: { icon: AlertCircle, label: 'Callout', placeholder: 'Callout text' },
  code: { icon: Code, label: 'Code', placeholder: 'Code block' },
  image: { icon: ImageIcon, label: 'Image', placeholder: 'Insert image' },
  file: { icon: FileIcon, label: 'File', placeholder: 'Insert file' },
  embed: { icon: Globe, label: 'Embed', placeholder: 'Paste iframe or code' },
  pageLink: { icon: Link2, label: 'Space Link', placeholder: 'Link to space' }
};

export function PageEditor({ space, spacesState, viewportsState, viewportId, tabId, brokenLinks, brokenLinksVersion }: PageEditorProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ anchor: HTMLElement; afterBlockId?: string } | null>(null);
  const [collapsedHeaders, setCollapsedHeaders] = useState<Set<string>>(new Set());
  const [temporaryBlockId, setTemporaryBlockId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { pushAction } = useHistory();

  const content = space.content as PageContent;
  const blocks = content?.blocks || [];

  // Focus sul titolo quando la pagina viene creata (titolo vuoto o "Untitled")
  useEffect(() => {
    if (!space.title || space.title === 'Untitled' || space.title.startsWith('New Page')) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, []);

  const handleTitleChange = (newTitle: string) => {
    // Update space title
    spacesState.updateSpace(space.id, { title: newTitle });
    
    // Update tab title if viewportsState is available
    if (viewportsState && viewportId && tabId) {
      viewportsState.updateTab(viewportId, tabId, { title: newTitle });
    }
  };

  const updateContent = (newBlocks: Block[]) => {
    spacesState.updateSpace(space.id, {
      content: { ...content, blocks: newBlocks }
    });
  };

  const addBlock = (type: BlockType, afterBlockId?: string) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      content: '',
      checked: type === 'checkbox' ? false : undefined
    };

    if (afterBlockId) {
      const index = blocks.findIndex(b => b.id === afterBlockId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      updateContent(newBlocks);
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
    
    const index = blocks.findIndex(b => b.id === blockId);
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

  const createNextBlock = (blockId: string, blockType: BlockType) => {
    const index = blocks.findIndex(b => b.id === blockId);
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random()}`,
      type: blockType,
      content: '',
      checked: blockType === 'checkbox' ? false : undefined
    };
    
    const newBlocks = [...blocks];
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

  const focusBlockByIndex = (index: number, position: 'start' | 'end' = 'start') => {
    if (index === -1) {
      // Focus sul titolo
      titleInputRef.current?.focus();
    } else if (index >= 0 && index < blocks.length) {
      // Focus sul blocco
      setTimeout(() => {
        const blockElement = document.querySelector(`[data-block-id="${blocks[index].id}"]`);
        if (blockElement) {
          // Cerca prima input/textarea, poi contentEditable
          const input = blockElement.querySelector('input, textarea') as HTMLTextAreaElement | HTMLInputElement;
          if (input) {
            (input as HTMLElement).focus();
            // Posiziona il cursore alla fine o all'inizio
            if (position === 'end') {
              const length = input.value.length;
              input.setSelectionRange(length, length);
            } else {
              input.setSelectionRange(0, 0);
            }
          } else {
            // Cerca contentEditable per RichTextEditor
            const contentEditable = blockElement.querySelector('[contenteditable="true"]');
            if (contentEditable) {
              (contentEditable as HTMLElement).focus();
              // Posiziona il cursore alla fine o all'inizio del contenuto
              const selection = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(contentEditable);
              range.collapse(position === 'end' ? false : true); // false = alla fine, true = all'inizio
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
        }
      }, 0);
    }
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const oldBlock = blocks.find(b => b.id === id);
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    updateContent(newBlocks);
    
    // Track history only for content changes (not for internal state like checked)
    if (updates.content !== undefined && oldBlock) {
      const oldContent = oldBlock.content;
      const newContent = updates.content;
      
      pushAction({
        type: 'updateBlock',
        description: 'Modifica blocco',
        undo: () => {
          const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
          const restoredBlocks = currentBlocks.map(b => b.id === id ? { ...b, content: oldContent } : b);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: restoredBlocks }
          });
        },
        redo: () => {
          const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
          const updatedBlocks = currentBlocks.map(b => b.id === id ? { ...b, content: newContent } : b);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: updatedBlocks }
          });
        }
      });
    }
  };

  const deleteBlock = (id: string) => {
    const deletedBlock = blocks.find(b => b.id === id);
    const deletedIndex = blocks.findIndex(b => b.id === id);
    const newBlocks = blocks.filter(b => b.id !== id);
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
          const filteredBlocks = currentBlocks.filter(b => b.id !== id);
          spacesState.updateSpace(space.id, {
            content: { ...content, blocks: filteredBlocks }
          });
        }
      });
    }
  };

  const convertBlock = (id: string, newType: BlockType) => {
    const oldBlock = blocks.find(b => b.id === id);
    if (!oldBlock) return;
    
    const oldType = oldBlock.type;
    const newBlocks = blocks.map(b => {
      if (b.id === id) {
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
      type: 'convertBlock',
      description: `Converti in ${blockTypeConfig[newType].label}`,
      undo: () => {
        const currentBlocks = (spacesState.getSpace(space.id)?.content as PageContent)?.blocks || [];
        const restoredBlocks = currentBlocks.map(b => {
          if (b.id === id) {
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
          if (b.id === id) {
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

  const moveBlock = useCallback((dragIndex: number, hoverIndex: number) => {
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, removed);
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
    // Check if this block is under a collapsed header
    const currentBlock = blocks[blockIndex];
    const currentIsHeader = currentBlock.type === 'heading1' || currentBlock.type === 'heading2' || currentBlock.type === 'heading3';
    
    // Headers themselves are never hidden
    if (currentIsHeader) {
      return false;
    }
    
    // Find the most recent header before this block
    for (let i = blockIndex - 1; i >= 0; i--) {
      const block = blocks[i];
      const isHeader = block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3';
      
      if (isHeader) {
        // If we found a collapsed header, check if current block should be hidden
        if (collapsedHeaders.has(block.id)) {
          // Find the next header at the same or higher level
          const headerLevel = parseInt(block.type.replace('heading', ''));
          
          for (let j = i + 1; j < blocks.length; j++) {
            const nextBlock = blocks[j];
            const nextIsHeader = nextBlock.type === 'heading1' || nextBlock.type === 'heading2' || nextBlock.type === 'heading3';
            
            if (nextIsHeader) {
              const nextLevel = parseInt(nextBlock.type.replace('heading', ''));
              if (nextLevel <= headerLevel) {
                // This is the end of the collapsed section
                return j > blockIndex ? false : (j === blockIndex ? false : true);
              }
            }
            
            // If we reach the current block before finding another header, it should be hidden
            if (j === blockIndex) {
              return true;
            }
          }
          
          // If we reach here, the current block is after the last header in the collapsed section
          return true;
        }
      }
    }
    
    return false;
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
    
    const block = blocks.find(b => b.id === blockId);
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

  const [{ isOver }, dropRef] = useDrop({
    accept: [ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT],
    drop: (item: any, monitor) => {
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
        // Highlight animation
        blockElement.animate([
          { backgroundColor: 'var(--joy-palette-primary-softBg)' },
          { backgroundColor: 'transparent' }
        ], {
          duration: 600,
          easing: 'ease-out'
        });
      }
    }, 100);
  };

  return (
    <Box 
      ref={dropRef}
      sx={{ 
        maxWidth: 700, 
        mx: 'auto', 
        p: 4, 
        position: 'relative',
        minHeight: '100vh',
      }}
    >
      {/* Page title - allineato con i text blocks */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 4 }}>
        {/* Spazio per allineare con il drag handle dei blocchi - 24px (handle width) */}
        <Box sx={{ width: 24, flexShrink: 0 }} />
        
        {/* Textarea del titolo - con flex: 1 come i blocchi */}
        <Textarea
          value={space.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          variant="plain"
          minRows={1}
          sx={{
            flex: 1,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            p: 0,
            border: 'none',
            outline: 'none !important',
            boxShadow: 'none !important',
            '--Textarea-focusedThickness': '0px',
            '&:focus-within': {
              outline: 'none !important',
              boxShadow: 'none !important',
              border: 'none !important',
            },
            '&:focus': {
              outline: 'none !important',
              boxShadow: 'none !important',
              border: 'none !important',
            },
            '& textarea': {
              border: 'none !important',
              outline: 'none !important',
              boxShadow: 'none !important',
              textAlign: 'center',
            },
            '& textarea:focus': {
              outline: 'none !important',
              boxShadow: 'none !important',
              border: 'none !important',
              textAlign: 'center',
            },
            '& textarea:focus-visible': {
              outline: 'none !important',
              boxShadow: 'none !important',
              textAlign: 'center',
            }
          }}
          slotProps={{
            textarea: {
              ref: titleInputRef as any,
              onKeyDown: handleTitleKeyDown
            }
          }}
        />
      </Box>

      {/* Blocks */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {blocks.map((block, index) => {
          const isHeader = block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3';
          const isCollapsed = isHeader ? collapsedHeaders.has(block.id) : false;
          const prevBlock = index > 0 ? blocks[index - 1] : undefined;
          const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : undefined;
          
          return (
            <PageBlock
              key={block.id}
              block={{ ...block, collapsed: isCollapsed }}
              index={index}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onAddAfter={(blockId, anchor) => setMenuAnchor({ anchor, afterBlockId: blockId })}
              onAddBefore={addBlockBefore}
              onMove={moveBlock}
              onConvertBlock={convertBlock}
              config={blockTypeConfig[block.type]}
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
              onEditEnd={block.id === temporaryBlockId ? (blockId) => {
                // Quando il blocco temporaneo perde il focus, resettiamo lo stato
                setTemporaryBlockId(null);
              } : undefined}
            />
          );
        })}

        {/* Add block button at the end */}
        {!temporaryBlockId && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            {/* Spazio per allineare con il drag handle dei blocchi - 24px (handle width) */}
            <Box sx={{ width: 24, flexShrink: 0 }} />
            
            {/* Quando non c'è scrittura, mostra entrambi i pulsanti sulla stessa riga */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
              <Typography 
                level="body-sm" 
                sx={{ 
                  color: 'text.tertiary',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'text.primary'
                  }
                }}
                onClick={() => {
                  // Crea un nuovo blocco text e focus su di esso
                  const newBlock: Block = {
                    id: `block_${Date.now()}_${Math.random()}`,
                    type: 'text',
                    content: '',
                  };
                  setTemporaryBlockId(newBlock.id);
                  updateContent([...blocks, newBlock]);
                  
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
                }}
              >
                Start writing
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                or
              </Typography>
              <Button
                variant="plain"
                startDecorator={<Plus size={16} />}
                onClick={(e) => {
                  const lastBlock = blocks[blocks.length - 1];
                  setMenuAnchor({ anchor: e.currentTarget, afterBlockId: lastBlock?.id });
                }}
                sx={{ justifyContent: 'flex-start', color: 'text.tertiary', p: 0 }}
              >
                add an element
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Block type menu */}
      {menuAnchor && menuAnchor.anchor && createPortal(
        (() => {
          const rect = menuAnchor.anchor.getBoundingClientRect();
          const menuWidth = 450;
          const menuHeight = 300;
          
          let top = rect.bottom + 4;
          let left = rect.left;
          
          // Trova il contenitore viewport
          const viewportContent = menuAnchor.anchor.closest('[data-viewport-content]');
          const viewportRect = viewportContent?.getBoundingClientRect() || {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight
          };
          
          // Controlla se esce dal bordo destro
          if (left + menuWidth > viewportRect.right) {
            left = viewportRect.right - menuWidth - 8;
          }
          
          // Controlla se esce dal bordo sinistro
          if (left < viewportRect.left) {
            left = viewportRect.left + 8;
          }
          
          // Controlla se esce dal bordo inferiore
          if (top + menuHeight > viewportRect.bottom) {
            top = rect.top - menuHeight - 4;
          }
          
          // Controlla se esce dal bordo superiore
          if (top < viewportRect.top) {
            top = viewportRect.top + 8;
          }
          
          // Ordine per colonne: dall'alto verso il basso, partendo da sinistra
          // Colonna 1: Text, Heading 1, Heading 2, Heading 3, Image
          // Colonna 2: Numbered List, Bullet List, Checkbox, Callout, File
          // Colonna 3: Divider, Embed, Space Link, Quote, Code
          const orderedTypes: BlockType[] = [
            'text', 'numberedList', 'divider',
            'heading1', 'bulletList', 'embed',
            'heading2', 'checkbox', 'pageLink',
            'heading3', 'callout', 'quote',
            'image', 'file', 'code'
          ];
          
          return (
            <>
              <Box
                onClick={() => setMenuAnchor(null)}
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
                  bgcolor: 'background.popup',
                  boxShadow: 'md',
                  borderRadius: '8px',
                  p: 1,
                  zIndex: 1000,
                  width: menuWidth,
                  maxHeight: menuHeight,
                  overflow: 'auto',
                  top: `${top}px`,
                  left: `${left}px`,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 0.5
                }}
              >
                {orderedTypes.map((type) => {
                  const config = blockTypeConfig[type];
                  return (
                    <Box
                      key={type}
                      onClick={() => {
                        addBlock(type, menuAnchor?.afterBlockId);
                        setMenuAnchor(null);
                      }}
                      sx={{
                        px: 1,
                        py: 0.75,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 0.75,
                        '&:hover': {
                          bgcolor: 'background.level1'
                        }
                      }}
                    >
                      <config.icon size={16} style={{ flexShrink: 0 }} />
                      <Typography level="body-xs" sx={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config.label}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </>
          );
        })(),
        document.body
      )}
    </Box>
  );
}