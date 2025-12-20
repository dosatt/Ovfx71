import { useRef, useEffect, useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Tooltip from '@mui/joy@5.0.0-beta.48/Tooltip';
import { storageToDisplay, displayToStorage, LinkInfo } from '../../utils/linkConverter';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  spacesState?: any;
  viewportsState?: any;
  sx?: any;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  contentEditableRef?: React.RefObject<HTMLDivElement>;
  onTriggerSpaceLink?: (position: { top: number; left: number }, triggerIndex: number) => void;
  onLinkContextMenu?: (linkId: string, linkText: string, position: { x: number; y: number }) => void;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
  onBrokenLinkClick?: (linkId: string, position: { x: number; y: number }) => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
}

export function RichTextEditor({
  content,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = 'Type something...',
  spacesState,
  viewportsState,
  sx = {},
  textareaRef: externalRef,
  contentEditableRef: externalContentEditableRef,
  onTriggerSpaceLink,
  onLinkContextMenu,
  brokenLinks,
  brokenLinksVersion,
  onBrokenLinkClick,
  onNavigateUp,
  onNavigateDown
}: RichTextEditorProps) {
  const contentEditableRef = externalContentEditableRef || useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [hoveredBrokenLink, setHoveredBrokenLink] = useState<string | null>(null);

  // Converti storage → display
  const { displayContent, links } = storageToDisplay(content);

  // Funzione per navigare a uno space
  const navigateToSpace = (spaceId: string) => {
    if (!viewportsState || !viewportsState.focusedViewportId || !viewportsState.findViewport) {
      return;
    }
    
    const focusedViewport = viewportsState.findViewport(viewportsState.focusedViewportId);
    
    if (!focusedViewport || !focusedViewport.activeTabId) {
      return;
    }
    
    viewportsState.updateTab(focusedViewport.id, focusedViewport.activeTabId, { spaceId });
  };

  // Funzione per renderizzare il contenuto con link colorati
  const renderContentWithLinks = (): (string | JSX.Element)[] => {
    if (links.length === 0) {
      return [displayContent];
    }

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    const sortedLinks = [...links].sort((a, b) => a.startIndex - b.startIndex);

    sortedLinks.forEach((link, idx) => {
      // Testo prima del link
      if (link.startIndex > lastIndex) {
        parts.push(displayContent.substring(lastIndex, link.startIndex));
      }

      // Controlla se il link è rotto
      const isBroken = brokenLinks?.has(link.spaceId);

      // Link stilizzato
      const linkText = displayContent.substring(link.startIndex, link.endIndex);
      parts.push(
        <span
          key={`link-${idx}`}
          data-link-id={link.spaceId}
          data-link-text={linkText}
          contentEditable={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isBroken) {
              navigateToSpace(link.spaceId);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onLinkContextMenu) {
              onLinkContextMenu(link.spaceId, linkText, { x: e.clientX, y: e.clientY });
            }
          }}
          onMouseEnter={() => setHoveredBrokenLink(isBroken ? link.spaceId : null)}
          onMouseLeave={() => setHoveredBrokenLink(null)}
          style={{
            color: isBroken ? '#d32f2f' : '#0b6bcb',
            fontWeight: 600,
            cursor: 'pointer',
            userSelect: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: isBroken ? 'line-through' : 'none'
          }}
        >
          {linkText}
          {isBroken && (
            <Tooltip 
              title="Right-click for options" 
              variant="outlined" 
              size="sm"
              placement="top"
            >
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onBrokenLinkClick) {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    onBrokenLinkClick(link.spaceId, { x: rect.left, y: rect.bottom + 4 });
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onBrokenLinkClick) {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    onBrokenLinkClick(link.spaceId, { x: rect.left, y: rect.bottom + 4 });
                  }
                }}
                style={{
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: '2px'
                }}
              >
                ⛔
              </span>
            </Tooltip>
          )}
        </span>
      );

      lastIndex = link.endIndex;
    });

    // Testo dopo l'ultimo link
    if (lastIndex < displayContent.length) {
      parts.push(displayContent.substring(lastIndex));
    }

    return parts;
  };

  // Salva e ripristina la posizione del cursore
  const saveCaretPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    if (contentEditableRef.current) {
      preCaretRange.selectNodeContents(contentEditableRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return null;
  };

  const restoreCaretPosition = (pos: number | null) => {
    if (pos === null || !contentEditableRef.current) return;

    const selection = window.getSelection();
    const range = document.createRange();
    let charIndex = 0;
    let nodeStack = [contentEditableRef.current];
    let node: Node | undefined;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharIndex = charIndex + (node.textContent?.length || 0);
        if (pos >= charIndex && pos <= nextCharIndex) {
          range.setStart(node, pos - charIndex);
          range.setEnd(node, pos - charIndex);
          foundStart = true;
        }
        charIndex = nextCharIndex;
      } else {
        const children = Array.from(node.childNodes);
        for (let i = children.length - 1; i >= 0; i--) {
          nodeStack.push(children[i]);
        }
      }
    }

    if (foundStart && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Gestisce l'input dell'utente
  const handleInput = () => {
    if (isComposingRef.current || !contentEditableRef.current) return;
    
    const caretPos = saveCaretPosition();
    const newText = contentEditableRef.current.innerText || '';
    
    // Controlla se l'utente ha appena digitato ">>"
    if (newText.endsWith('>>') && !displayContent.endsWith('>>')) {
      // Salva la posizione del cursore prima di rimuovere ">>"
      const cursorPosition = caretPos - 2; // -2 perché stiamo per rimuovere ">>"
      
      // Rimuovi ">>" dal contenuto
      const contentWithoutTrigger = newText.slice(0, -2);
      
      // Trova link esistenti nel nuovo testo
      const newLinks: LinkInfo[] = [];
      links.forEach((link) => {
        const linkText = displayContent.substring(link.startIndex, link.endIndex);
        const index = contentWithoutTrigger.indexOf(linkText);
        if (index !== -1) {
          newLinks.push({
            spaceId: link.spaceId,
            title: link.title,
            startIndex: index,
            endIndex: index + linkText.length,
            storageStartIndex: link.storageStartIndex,
            storageEndIndex: link.storageEndIndex,
          });
        }
      });

      const storageContent = displayToStorage(contentWithoutTrigger, newLinks);
      onChange(storageContent);

      // Trigger autocomplete
      if (onTriggerSpaceLink && contentEditableRef.current) {
        const rect = contentEditableRef.current.getBoundingClientRect();
        onTriggerSpaceLink(
          {
            top: rect.bottom + 4,
            left: rect.left + 20,
          },
          cursorPosition
        );
      }

      return;
    }
    
    // Trova link esistenti nel nuovo testo
    const newLinks: LinkInfo[] = [];
    links.forEach((link) => {
      const linkText = displayContent.substring(link.startIndex, link.endIndex);
      const index = newText.indexOf(linkText);
      if (index !== -1) {
        newLinks.push({
          spaceId: link.spaceId,
          title: link.title,
          startIndex: index,
          endIndex: index + linkText.length,
          storageStartIndex: link.storageStartIndex,
          storageEndIndex: link.storageEndIndex,
        });
      }
    });

    const storageContent = displayToStorage(newText, newLinks);
    onChange(storageContent);

    // Ripristina il cursore dopo il re-render
    setTimeout(() => restoreCaretPosition(caretPos), 0);
  };

  // Sincronizza il contenuto quando cambia dall'esterno
  useEffect(() => {
    if (!contentEditableRef.current || isComposingRef.current) return;
    
    const currentText = contentEditableRef.current.innerText || '';
    if (currentText !== displayContent) {
      const caretPos = saveCaretPosition();
      
      // Cancella il contenuto corrente
      while (contentEditableRef.current.firstChild) {
        contentEditableRef.current.removeChild(contentEditableRef.current.firstChild);
      }
      
      // Renderizza il nuovo contenuto
      const parts = renderContentWithLinks();
      parts.forEach((part) => {
        if (typeof part === 'string') {
          contentEditableRef.current!.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.setAttribute('data-link-id', part.props['data-link-id']);
          span.setAttribute('data-link-text', part.props['data-link-text']);
          span.setAttribute('contenteditable', 'false');
          
          const isBroken = brokenLinks?.has(part.props['data-link-id']);
          
          span.style.color = isBroken ? '#d32f2f' : '#0b6bcb';
          span.style.fontWeight = '600';
          span.style.cursor = 'pointer';
          span.style.userSelect = 'none';
          span.style.display = 'inline-flex';
          span.style.alignItems = 'center';
          span.style.gap = '4px';
          span.style.textDecoration = isBroken ? 'line-through' : 'none';
          
          const linkId = part.props['data-link-id'];
          const linkText = part.props['data-link-text'];
          
          span.textContent = linkText;
          
          span.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isBroken) {
              navigateToSpace(linkId);
            }
          };
          
          span.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onLinkContextMenu) {
              onLinkContextMenu(linkId, linkText, { x: e.clientX, y: e.clientY });
            }
          };
          
          span.onmouseenter = () => setHoveredBrokenLink(isBroken ? linkId : null);
          span.onmouseleave = () => setHoveredBrokenLink(null);
          
          if (isBroken) {
            const brokenIcon = document.createElement('span');
            brokenIcon.innerHTML = '⛔';
            brokenIcon.setAttribute('title', 'Right-click for options');
            brokenIcon.style.fontSize = '14px';
            brokenIcon.style.cursor = 'pointer';
            brokenIcon.style.display = 'inline-flex';
            brokenIcon.style.alignItems = 'center';
            brokenIcon.style.marginLeft = '2px';
            brokenIcon.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBrokenLinkClick) {
                const rect = brokenIcon.getBoundingClientRect();
                onBrokenLinkClick(linkId, { x: rect.left, y: rect.bottom + 4 });
              }
            };
            brokenIcon.oncontextmenu = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBrokenLinkClick) {
                const rect = brokenIcon.getBoundingClientRect();
                onBrokenLinkClick(linkId, { x: rect.left, y: rect.bottom + 4 });
              }
            };
            span.appendChild(brokenIcon);
          }
          
          contentEditableRef.current!.appendChild(span);
        }
      });
      
      setTimeout(() => restoreCaretPosition(caretPos), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayContent, links, brokenLinksVersion]);

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    // Gestione ArrowUp e ArrowDown per navigazione tra blocchi
    if (e.key === 'ArrowUp' && onNavigateUp && contentEditableRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Crea un range dall'inizio del contentEditable fino al cursore
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentEditableRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const caretOffset = preCaretRange.toString().length;
        // Se la lunghezza del testo prima del cursore è 0, siamo all'inizio
        if (caretOffset === 0) {
          e.preventDefault();
          onNavigateUp();
          return; // Non chiamare onKeyDown
        }
      }
    } else if (e.key === 'ArrowDown' && onNavigateDown && contentEditableRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Crea un range dall'inizio del contentEditable fino al cursore
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentEditableRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        // Ottieni il testo totale del contentEditable
        const totalLength = contentEditableRef.current.innerText?.length || 0;
        const caretOffset = preCaretRange.toString().length;
        // Se la lunghezza del testo prima del cursore è uguale alla lunghezza totale, siamo alla fine
        if (caretOffset === totalLength) {
          e.preventDefault();
          onNavigateDown();
          return; // Non chiamare onKeyDown
        }
      }
    }

    // Gestione Backspace/Delete per cancellare i link
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && contentEditableRef.current) {
        const range = selection.getRangeAt(0);
        
        // Se non c'è selezione (cursore singolo)
        if (range.collapsed) {
          let node: Node | null = range.startContainer;
          
          // Naviga verso l'alto nell'albero DOM per trovare un link span
          while (node && node !== contentEditableRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (element.hasAttribute('data-link-id')) {
                e.preventDefault();
                
                // Salva l'ID del link da rimuovere
                const linkId = element.getAttribute('data-link-id');
                
                // Rimuovi il link dall'array dei link
                const newLinks = links.filter(link => link.spaceId !== linkId);
                
                // Ottieni il testo del link
                const linkText = element.textContent || '';
                
                // Ricostruisci il contenuto senza il link
                let newDisplayContent = displayContent;
                const linkIndex = displayContent.indexOf(linkText);
                if (linkIndex !== -1) {
                  // Rimuovi il testo del link
                  newDisplayContent = displayContent.substring(0, linkIndex) + displayContent.substring(linkIndex + linkText.length);
                }
                
                // Converti display → storage con i link aggiornati
                const newStorageContent = displayToStorage(newDisplayContent, newLinks);
                
                // Salva la posizione del cursore
                const caretPos = linkIndex;
                
                // Aggiorna il contenuto
                onChange(newStorageContent);
                
                // Ripristina il cursore dopo l'aggiornamento
                setTimeout(() => {
                  restoreCaretPosition(caretPos);
                }, 0);
                
                return;
              }
            }
            
            // Se siamo all'interno di un text node, controlla il nodo successivo/precedente
            if (node.nodeType === Node.TEXT_NODE) {
              const nextNode = e.key === 'Backspace' ? node.previousSibling : node.nextSibling;
              if (nextNode && nextNode.nodeType === Node.ELEMENT_NODE) {
                const element = nextNode as HTMLElement;
                if (element.hasAttribute('data-link-id') && 
                    ((e.key === 'Backspace' && range.startOffset === 0) || 
                     (e.key === 'Delete' && range.startOffset === (node.textContent?.length || 0)))) {
                  e.preventDefault();
                  
                  const linkId = element.getAttribute('data-link-id');
                  const newLinks = links.filter(link => link.spaceId !== linkId);
                  const linkText = element.textContent || '';
                  
                  let newDisplayContent = displayContent;
                  const linkIndex = displayContent.indexOf(linkText);
                  if (linkIndex !== -1) {
                    newDisplayContent = displayContent.substring(0, linkIndex) + displayContent.substring(linkIndex + linkText.length);
                  }
                  
                  const newStorageContent = displayToStorage(newDisplayContent, newLinks);
                  const caretPos = e.key === 'Backspace' ? linkIndex : linkIndex;
                  
                  onChange(newStorageContent);
                  
                  setTimeout(() => {
                    restoreCaretPosition(caretPos);
                  }, 0);
                  
                  return;
                }
              }
            }
            
            node = node.parentNode;
          }
        }
      }
    }

    // Formattazione con scorciatoie
    if (isCtrlOrCmd) {
      // Permetti Ctrl/Cmd+A per selezionare tutto
      if (e.key === 'a' || e.key === 'A') {
        // Non fare preventDefault, lascia che il browser gestisca la selezione
        // Non fare return, chiama comunque onKeyDown
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        document.execCommand('bold', false);
        return;
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        document.execCommand('italic', false);
        return;
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        document.execCommand('underline', false);
        return;
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        document.execCommand('strikeThrough', false);
        return;
      }
    }

    if (onKeyDown) {
      onKeyDown(e as any);
    }
  };

  return (
    <Box
      ref={contentEditableRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={() => { 
        isComposingRef.current = false;
        handleInput();
      }}
      onKeyDown={handleKeyDownInternal}
      onFocus={onFocus}
      onBlur={onBlur}
      data-placeholder={!displayContent ? placeholder : ''}
      sx={{
        minHeight: '24px',
        py: '2px',
        px: '12px',
        border: 'none !important',
        outline: 'none !important',
        backgroundColor: 'transparent',
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        cursor: 'text',
        '&:focus': {
          outline: 'none !important',
          boxShadow: 'none !important',
          border: 'none !important',
        },
        '&:focus-visible': {
          outline: 'none !important',
          boxShadow: 'none !important',
          border: 'none !important',
        },
        '&[data-placeholder]:not(:focus)::before': {
          content: 'attr(data-placeholder)',
          color: 'text.tertiary',
          pointerEvents: 'none',
          position: 'absolute',
        },
        ...sx,
      }}
    />
  );
}