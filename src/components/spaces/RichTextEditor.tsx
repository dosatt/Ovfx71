import { useRef, useEffect, useState } from 'react';
import { storageToDisplay, displayToStorage, LinkInfo } from '../../utils/linkConverter';
import { SpacePreview } from './SpacePreview';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  spacesState?: any;
  viewportsState?: any;
  className?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  contentEditableRef?: React.RefObject<HTMLDivElement>;
  onTriggerSpaceLink?: (position: { top: number; left: number }, triggerIndex: number) => void;
  onTriggerCalendar?: (position: { top: number; left: number }, triggerIndex: number) => void;
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
  placeholder = 'Type something',
  spacesState,
  viewportsState,
  className = '',
  textareaRef: externalRef,
  contentEditableRef: externalContentEditableRef,
  onTriggerSpaceLink,
  onTriggerCalendar,
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
  const [previewSpaceId, setPreviewSpaceId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number, y: number } | null>(null);

  // Convert storage → display
  const { displayContent, links } = storageToDisplay(content);

  // Function to navigate to a space
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

  // Function to render content with colored links
  const renderContentWithLinks = (): (string | JSX.Element)[] => {
    if (links.length === 0) {
      return [displayContent];
    }

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    const sortedLinks = [...links].sort((a, b) => a.startIndex - b.startIndex);

    sortedLinks.forEach((link, idx) => {
      // Text before the link
      if (link.startIndex > lastIndex) {
        parts.push(displayContent.substring(lastIndex, link.startIndex));
      }

      // Check if the link is broken
      const isBroken = brokenLinks?.has(link.spaceId);

      // Styled link
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
          onMouseEnter={(e) => {
            setHoveredBrokenLink(isBroken ? link.spaceId : null);
            if (e.ctrlKey || e.metaKey) {
              setPreviewSpaceId(link.spaceId);
              setPreviewPosition({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseMove={(e) => {
            if (e.ctrlKey || e.metaKey) {
              if (previewSpaceId !== link.spaceId) {
                setPreviewSpaceId(link.spaceId);
              }
              setPreviewPosition({ x: e.clientX, y: e.clientY });
            } else {
              setPreviewSpaceId(null);
            }
          }}
          onMouseLeave={() => {
            setHoveredBrokenLink(null);
            setPreviewSpaceId(null);
          }}
          className={`font-semibold cursor-pointer select-none inline-flex items-center gap-1 hover:underline ${isBroken ? 'text-[#d32f2f] line-through' : 'text-[#0b6bcb]'}`}
        >
          {linkText}
          {isBroken && (
            <span data-is-broken="true">⛔</span>
          )}
        </span>
      );

      lastIndex = link.endIndex;
    });

    // Text after the last link
    if (lastIndex < displayContent.length) {
      parts.push(displayContent.substring(lastIndex));
    }

    return parts;
  };

  // Save and restore caret position
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

  // Handle user input
  const handleInput = () => {
    if (isComposingRef.current || !contentEditableRef.current) return;

    const caretPos = saveCaretPosition();
    const newText = contentEditableRef.current.innerText || '';

    // Helper function to extract current links from the DOM and remap them to the new text
    const getLinksFromDOM = (textToMatch: string) => {
      if (!contentEditableRef.current) return [];

      const linkElements = contentEditableRef.current.querySelectorAll('span[data-link-id]');
      const foundLinks: LinkInfo[] = [];
      let lastSearchIndex = 0;

      linkElements.forEach((el) => {
        const span = el as HTMLElement;
        const id = span.getAttribute('data-link-id');
        const title = span.getAttribute('data-link-text') || span.innerText;

        if (!id || !title) return;

        // Search for link text in the complete text starting from the last point
        const index = textToMatch.indexOf(title, lastSearchIndex);

        if (index !== -1) {
          foundLinks.push({
            spaceId: id,
            title: title,
            startIndex: index,
            endIndex: index + title.length,
            storageStartIndex: 0, // Verrà ricalcolato da displayToStorage
            storageEndIndex: 0 // Verrà ricalcolato da displayToStorage
          });
          lastSearchIndex = index + title.length;
        }
      });
      return foundLinks;
    };

    // Check if user typed ">>"
    if (newText.endsWith('>>') && !displayContent.endsWith('>>')) {
      // Save caret position before removing ">>"
      const cursorPosition = caretPos! - 2; // -2 perché stiamo per rimuovere ">>"

      // Remove ">>" from content
      const contentWithoutTrigger = newText.slice(0, -2);

      // Find existing links in new text
      const newLinks = getLinksFromDOM(contentWithoutTrigger);

      const storageContent = displayToStorage(contentWithoutTrigger, newLinks);
      onChange(storageContent);

      // Trigger autocomplete
      if (onTriggerSpaceLink) {
        // Use standard selection API to get accurate cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Check if rect is valid (it might be 0,0,0,0 if cursor is in an empty line sometimes)
          // If invalid, fallback to the element's bottom left or simple calculation
          if (rect.width === 0 && rect.height === 0 && contentEditableRef.current) {
            // Try to get position from the text node
            const span = document.createElement('span');
            span.appendChild(document.createTextNode('\u200b')); // Zero width space
            range.insertNode(span);
            const spanRect = span.getBoundingClientRect();
            span.parentNode?.removeChild(span);

            onTriggerSpaceLink(
              {
                top: spanRect.bottom + 4,
                left: spanRect.left,
              },
              cursorPosition
            );
          } else {
            onTriggerSpaceLink(
              {
                top: rect.bottom + 4,
                left: rect.left,
              },
              cursorPosition
            );
          }
        }
      }

      return;
    }

    // Check if user typed "+++"
    if (newText.endsWith('+++') && !displayContent.endsWith('+++')) {
      const cursorPosition = caretPos! - 3;
      const contentWithoutTrigger = newText.slice(0, -3);
      const newLinks = getLinksFromDOM(contentWithoutTrigger);
      const storageContent = displayToStorage(contentWithoutTrigger, newLinks);
      onChange(storageContent);

      if (onTriggerCalendar) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          if (rect.width === 0 && rect.height === 0 && contentEditableRef.current) {
            const span = document.createElement('span');
            span.appendChild(document.createTextNode('\u200b'));
            range.insertNode(span);
            const spanRect = span.getBoundingClientRect();
            span.parentNode?.removeChild(span);

            onTriggerCalendar(
              { top: spanRect.bottom + 4, left: spanRect.left },
              cursorPosition
            );
          } else {
            onTriggerCalendar(
              { top: rect.bottom + 4, left: rect.left },
              cursorPosition
            );
          }
        }
      }
      return;
    }

    // Find existing links in normal text
    const newLinks = getLinksFromDOM(newText);

    const storageContent = displayToStorage(newText, newLinks);
    onChange(storageContent);

    // Restore caret after re-render
    setTimeout(() => restoreCaretPosition(caretPos), 0);
  };

  // Sync content when it changes from outside
  useEffect(() => {
    if (!contentEditableRef.current || isComposingRef.current) return;

    const currentText = contentEditableRef.current.innerText || '';
    if (currentText !== displayContent) {
      const caretPos = saveCaretPosition();

      // Clear current content
      while (contentEditableRef.current.firstChild) {
        contentEditableRef.current.removeChild(contentEditableRef.current.firstChild);
      }

      // Render new content
      const parts = renderContentWithLinks();
      parts.forEach((part) => {
        if (typeof part === 'string') {
          contentEditableRef.current!.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.setAttribute('data-link-id', (part as JSX.Element).props['data-link-id']);
          span.setAttribute('data-link-text', (part as JSX.Element).props['data-link-text']);
          span.setAttribute('contenteditable', 'false');

          const isBroken = brokenLinks?.has((part as JSX.Element).props['data-link-id']);

          span.className = `font-semibold cursor-pointer select-none inline-flex items-center gap-1 hover:underline ${isBroken ? 'text-[#d32f2f] line-through' : 'text-[#0b6bcb]'}`;

          const linkId = (part as JSX.Element).props['data-link-id'];
          const linkText = (part as JSX.Element).props['data-link-text'];

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

          span.onmouseenter = (e) => {
            setHoveredBrokenLink(isBroken ? linkId : null);
            if (e.ctrlKey || e.metaKey) {
              setPreviewSpaceId(linkId);
              setPreviewPosition({ x: e.clientX, y: e.clientY });
            }
          };
          span.onmousemove = (e) => {
            if (e.ctrlKey || e.metaKey) {
              if (previewSpaceId !== linkId) {
                setPreviewSpaceId(linkId);
              }
              setPreviewPosition({ x: e.clientX, y: e.clientY });
            } else {
              setPreviewSpaceId(null);
            }
          };
          span.onmouseleave = () => {
            setHoveredBrokenLink(null);
            setPreviewSpaceId(null);
          };

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

    // Handle ArrowUp and ArrowDown for block navigation
    if (e.key === 'ArrowUp' && onNavigateUp && contentEditableRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Create a range from the beginning of contentEditable up to the caret
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentEditableRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const caretOffset = preCaretRange.toString().length;
        // If text length before the caret is 0, we're at the beginning
        if (caretOffset === 0) {
          e.preventDefault();
          onNavigateUp();
          return; // Don't call onKeyDown
        }
      }
    } else if (e.key === 'ArrowDown' && onNavigateDown && contentEditableRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Create a range from the beginning of contentEditable up to the caret
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentEditableRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        // Get total text from contentEditable
        const totalLength = contentEditableRef.current.innerText?.length || 0;
        const caretOffset = preCaretRange.toString().length;
        // If text length before caret equals total length, we're at the end
        if (caretOffset === totalLength) {
          e.preventDefault();
          onNavigateDown();
          return; // Don't call onKeyDown
        }
      }
    }

    // Handle Backspace/Delete to delete links
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && contentEditableRef.current) {
        const range = selection.getRangeAt(0);

        // If there is no selection (single caret)
        if (range.collapsed) {
          let node: Node | null = range.startContainer;

          // Navigate up the DOM tree to find a link span
          while (node && node !== contentEditableRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (element.hasAttribute('data-link-id')) {
                e.preventDefault();

                // Save the ID of the link to remove
                const linkId = element.getAttribute('data-link-id');

                // Remove the link from the links array
                const newLinks = links.filter(link => link.spaceId !== linkId);

                // Get link text
                const linkText = element.textContent || '';

                // Rebuild content without the link
                let newDisplayContent = displayContent;
                const linkIndex = displayContent.indexOf(linkText);
                if (linkIndex !== -1) {
                  // Remove link text
                  newDisplayContent = displayContent.substring(0, linkIndex) + displayContent.substring(linkIndex + linkText.length);
                }

                // Convert display → storage with updated links
                const newStorageContent = displayToStorage(newDisplayContent, newLinks);

                // Save caret position
                const caretPos = linkIndex;

                // Aggiorna il contenuto
                onChange(newStorageContent);

                // Restore caret after update
                setTimeout(() => {
                  restoreCaretPosition(caretPos);
                }, 0);

                return;
              }
            }

            // If inside a text node, check the next/previous sibling
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

    // Formatting with shortcuts
    if (isCtrlOrCmd) {
      // Allow Ctrl/Cmd+A to select everything
      if (e.key === 'a' || e.key === 'A') {
        // Don't preventDefault, let the browser handle selection
        // Don't return, still call onKeyDown
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

    // Stop propagation to prevent global shortcuts from firing while editing
    e.stopPropagation();

    if (onKeyDown) {
      onKeyDown(e as any);
    }
  };

  return (
    <>
      <div
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
        data-placeholder={placeholder}
        className={`
        min-h-[24px] py-[2px] px-0
        bg-transparent
        leading-[1.2] whitespace-pre-wrap break-words cursor-text
        outline-none border-none shadow-none
        relative
        ${(!displayContent && placeholder && placeholder.trim() !== '') ? 'before:content-[attr(data-placeholder)] before:text-zinc-300 before:pointer-events-none before:absolute before:left-0 before:right-0 before:text-inherit' : ''}
        ${className}
      `}
      />

      {previewSpaceId && previewPosition && (
        <SpacePreview
          spaceId={previewSpaceId}
          spacesState={spacesState}
          position={previewPosition}
          onClose={() => setPreviewSpaceId(null)}
        />
      )}
    </>
  );
}