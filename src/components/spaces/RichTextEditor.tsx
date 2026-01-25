import { useRef, useEffect, useState } from 'react';
import { storageToDisplay, displayToStorage, LinkInfo } from '../../utils/linkConverter';
import { SpacePreview } from './SpacePreview';
import { highlightCode, SupportedLanguage } from '../../utils/syntaxHighlighter';

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
  language?: SupportedLanguage;
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
  onNavigateDown,
  language
}: RichTextEditorProps) {
  const contentEditableRef = externalContentEditableRef || useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [hoveredBrokenLink, setHoveredBrokenLink] = useState<string | null>(null);
  const [previewSpaceId, setPreviewSpaceId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number, y: number } | null>(null);

  const { displayContent, links } = storageToDisplay(content);

  const navigateToSpace = (spaceId: string) => {
    if (!viewportsState || !viewportsState.focusedViewportId || !viewportsState.findViewport) return;
    const focusedViewport = viewportsState.findViewport(viewportsState.focusedViewportId);
    if (!focusedViewport || !focusedViewport.activeTabId) return;
    viewportsState.updateTab(focusedViewport.id, focusedViewport.activeTabId, { spaceId });
  };

  const getCaretOffset = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !contentEditableRef.current) return 0;
    const range = selection.getRangeAt(0);
    const root = contentEditableRef.current;

    let offset = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;

    while ((node = walker.nextNode())) {
      if (node === range.startContainer) {
        return offset + range.startOffset;
      }
      offset += node.textContent?.length || 0;
    }
    return offset;
  };

  const setCaretOffset = (offset: number) => {
    if (!contentEditableRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    const root = contentEditableRef.current;

    let current = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const length = node.textContent?.length || 0;
      if (offset >= current && offset <= current + length) {
        const range = document.createRange();
        range.setStart(node, offset - current);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      current += length;
    }

    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleInput = () => {
    if (isComposingRef.current || !contentEditableRef.current) return;
    const caretPos = getCaretOffset();
    const newText = contentEditableRef.current.textContent || '';

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
        const index = textToMatch.indexOf(title, lastSearchIndex);
        if (index !== -1) {
          foundLinks.push({ spaceId: id, title, startIndex: index, endIndex: index + title.length, storageStartIndex: 0, storageEndIndex: 0 });
          lastSearchIndex = index + title.length;
        }
      });
      return foundLinks;
    };

    const newLinks = getLinksFromDOM(newText);
    onChange(displayToStorage(newText, newLinks));

    // Handle triggers
    if (newText.endsWith('>>')) {
      const pos = { top: 0, left: 0 };
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        pos.top = rect.bottom + 4; pos.left = rect.left;
      }
      if (onTriggerSpaceLink) onTriggerSpaceLink(pos, (caretPos || 0) - 2);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (language) {
      e.preventDefault();
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    }
  };

  useEffect(() => {
    if (!contentEditableRef.current || isComposingRef.current) return;
    const currentHtml = contentEditableRef.current.innerHTML || '';
    const currentText = contentEditableRef.current.textContent || '';
    const needsHighlighting = !!(language && language !== 'text');
    const highlightedHtml = needsHighlighting ? highlightCode(displayContent, language!) : '';

    if (currentText !== displayContent || (needsHighlighting && currentHtml !== highlightedHtml)) {
      const caretPos = getCaretOffset();
      if (needsHighlighting) {
        contentEditableRef.current.innerHTML = highlightedHtml;
        // Add a line break if it ends with newline to allow cursor placement
        if (displayContent.endsWith('\n')) {
          contentEditableRef.current.appendChild(document.createElement('br'));
        }
      } else {
        contentEditableRef.current.textContent = displayContent;
      }
      setTimeout(() => setCaretOffset(caretPos), 0);
    }
  }, [displayContent, links, language]);

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'Enter' && language && !e.shiftKey) {
      e.preventDefault(); e.stopPropagation();
      document.execCommand('insertLineBreak');
      return;
    }

    if (e.key === 'ArrowUp' && onNavigateUp) { /* handle logic */ }

    e.stopPropagation();
    if (onKeyDown) onKeyDown(e as any);
  };

  return (
    <>
      <div
        ref={contentEditableRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => { isComposingRef.current = false; handleInput(); }}
        onKeyDown={handleKeyDownInternal}
        onFocus={onFocus}
        onBlur={onBlur}
        data-placeholder={placeholder}
        className={`min-h-[24px] py-[2px] px-0 bg-transparent leading-[1.2] whitespace-pre-wrap break-words cursor-text outline-none relative ${(!displayContent && placeholder) ? 'before:content-[attr(data-placeholder)] before:text-zinc-300 before:pointer-events-none before:absolute before:left-0 before:right-0' : ''} ${className}`}
      />
      {previewSpaceId && previewPosition && (
        <SpacePreview spaceId={previewSpaceId} spacesState={spacesState} position={previewPosition} onClose={() => setPreviewSpaceId(null)} />
      )}
    </>
  );
}