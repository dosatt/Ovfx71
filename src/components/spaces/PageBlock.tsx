import { LinkContextMenu } from './LinkContextMenu';
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDrag, useDrop } from "react-dnd";
import { Button, Textarea, Input, Checkbox, Tooltip } from "@heroui/react";
import {
  Trash2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List as ListIcon,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  File as FileIcon,
  Globe,
  Link2,
  GripVertical
} from "lucide-react";
import { Block, BlockType } from "../../types";
import { SpaceEmbed } from './SpaceEmbed';
import { BlockEmbed } from './BlockEmbed';
import { SpaceLinkAutocomplete } from './SpaceLinkAutocomplete';
import { RichTextEditor } from './RichTextEditor';
import { useCrossViewportDrag } from '../../hooks/useCrossViewportDrag';
import { ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';

// Helper components per rendering condizionale
function RenderSpaceEmbed({ spaceId, spacesState, viewportsState }: any) {
  const embeddedSpace = spacesState.getSpace(spaceId);
  
  if (!embeddedSpace) {
    return (
      <div className="p-4 bg-default-100 rounded-lg">
        <span className="text-small text-default-500">
          Space non trovato
        </span>
      </div>
    );
  }
  
  const handleNavigate = (navigateSpaceId: string) => {
    if (!viewportsState || !viewportsState.focusedViewportId || !viewportsState.findViewport) {
      console.warn('Cannot navigate: viewportsState not available');
      return;
    }
    
    const focusedViewport = viewportsState.findViewport(viewportsState.focusedViewportId);
    
    if (!focusedViewport || !focusedViewport.activeTabId) {
      console.warn('Cannot navigate: no focused viewport or active tab');
      return;
    }
    
    viewportsState.updateTab(focusedViewport.id, focusedViewport.activeTabId, { spaceId: navigateSpaceId });
  };
  
  return (
    <SpaceEmbed
      space={embeddedSpace}
      onNavigate={handleNavigate}
      compact={false}
      spacesState={spacesState}
    />
  );
}

function RenderBlockEmbed({ blockId, sourceSpaceId, spacesState, viewportsState }: any) {
  const sourceSpace = spacesState.getSpace(sourceSpaceId);
  
  if (!sourceSpace || !sourceSpace.content?.blocks) {
    return (
      <div className="p-4 bg-default-100 rounded-lg">
        <span className="text-small text-default-500">
          Blocco non trovato
        </span>
      </div>
    );
  }
  
  const embeddedBlock = sourceSpace.content.blocks.find((b: Block) => b.id === blockId);
  
  if (!embeddedBlock) {
    return (
      <div className="p-4 bg-default-100 rounded-lg">
        <span className="text-small text-default-500">
          Blocco non trovato
        </span>
      </div>
    );
  }
  
  const handleNavigate = (spaceId: string) => {
    if (!viewportsState || !viewportsState.focusedViewportId || !viewportsState.findViewport) {
      console.warn('Cannot navigate: viewportsState not available');
      return;
    }
    
    const focusedViewport = viewportsState.findViewport(viewportsState.focusedViewportId);
    
    if (!focusedViewport || !focusedViewport.activeTabId) {
      console.warn('Cannot navigate: no focused viewport or active tab');
      return;
    }
    
    viewportsState.updateTab(focusedViewport.id, focusedViewport.activeTabId, { spaceId });
  };
  
  return (
    <BlockEmbed
      block={embeddedBlock}
      sourceSpaceName={sourceSpace.title}
      onNavigate={handleNavigate}
      sourceSpaceId={sourceSpace.id}
    />
  );
}

interface PageBlockProps {
  block: Block & { collapsed?: boolean };
  index: number;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddAfter: (blockId: string, anchor: HTMLElement) => void;
  onAddBefore?: (blockId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onConvertBlock: (blockId: string, newType: BlockType) => void;
  onCreateNextBlock?: (
    blockId: string,
    blockType: BlockType,
  ) => void;
  createNextBlock?: (
    blockId: string,
    blockType: BlockType,
  ) => void;
  toggleHeaderCollapse?: (blockId: string) => void;
  isBlockCollapsed?: (index: number) => boolean;
  collapsedHeaders?: Set<string>;
  focusBlockByIndex?: (index: number) => void;
  totalBlocks?: number;
  config: any;
  prevBlock?: Block;
  nextBlock?: Block;
  currentSpaceId?: string;
  currentSpaceName?: string;
  spacesState?: any;
  viewportsState?: any;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
  onEditEnd?: (blockId: string) => void;
}

const blockTypeIcons: Record<string, any> = {
  text: Type,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  bulletList: ListIcon,
  numberedList: ListOrdered,
  checkbox: CheckSquare,
  quote: Quote,
  divider: Minus,
  callout: AlertCircle,
  code: Code,
  image: ImageIcon,
  file: FileIcon,
  embed: Globe,
  pageLink: Link2,
};

const blockTypeLabels: Record<string, string> = {
  text: "Text",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bulletList: "Bullet List",
  numberedList: "Numbered List",
  checkbox: "Checkbox",
  quote: "Quote",
  divider: "Divider",
  callout: "Callout",
  code: "Code",
  image: "Image",
  file: "File",
  embed: "Embed",
  pageLink: "Space Link",
};

const orderedBlockTypes: string[] = [
  'text', 'numberedList', 'divider',
  'heading1', 'bulletList', 'embed',
  'heading2', 'checkbox', 'pageLink',
  'heading3', 'callout', 'quote',
  'image', 'file', 'code'
];

export function PageBlock({
  block,
  index,
  onUpdate,
  onDelete,
  onAddAfter,
  onAddBefore,
  onMove,
  onConvertBlock,
  onCreateNextBlock,
  createNextBlock,
  toggleHeaderCollapse,
  isBlockCollapsed,
  collapsedHeaders,
  focusBlockByIndex,
  totalBlocks,
  config,
  prevBlock,
  nextBlock,
  currentSpaceId,
  currentSpaceName,
  spacesState,
  viewportsState,
  brokenLinks,
  brokenLinksVersion,
  onEditEnd,
}: PageBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [dropLinePosition, setDropLinePosition] = useState<
    "top" | "bottom" | null
  >(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Stati per l'autocomplete dei link
  const [showSpaceLinkAutocomplete, setShowSpaceLinkAutocomplete] = useState(false);
  const [spaceLinkPosition, setSpaceLinkPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [linkTriggerIndex, setLinkTriggerIndex] = useState<number>(-1);
  const [isSelectingPageLink, setIsSelectingPageLink] = useState(false);
  
  // Stati per il menu contestuale dei link
  const [showLinkContextMenu, setShowLinkContextMenu] = useState(false);
  const [linkContextMenuPosition, setLinkContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [selectedLinkText, setSelectedLinkText] = useState<string>('');
  
  // Stato per mostrare il menu di relink quando si clicca sull'icona broken
  const [showRelinkMenu, setShowRelinkMenu] = useState(false);
  const [relinkMenuPosition, setRelinkMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [relinkingLinkId, setRelinkingLinkId] = useState<string>('');

  const isHeader =
    block.type === "heading1" ||
    block.type === "heading2" ||
    block.type === "heading3";
  const hidden = isBlockCollapsed
    ? isBlockCollapsed(index)
    : false;

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE_TEXT_ELEMENT,
    item: () => {
      const e = window.event as KeyboardEvent | undefined;
      let dragMode: 'link' | 'duplicate' | 'move' = 'link';
      
      if (e) {
        if (e.shiftKey) {
          dragMode = 'move';
        } else if (e.altKey) {
          dragMode = 'duplicate';
        }
      }

      return {
        index,
        id: block.id,
        blockId: block.id,
        blockType: block.type,
        content: block.content,
        sourceSpaceId: currentSpaceId,
        sourceSpaceName: currentSpaceName,
        itemType: ITEM_TYPE_TEXT_ELEMENT,
        dragMode,
        fullBlock: block,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const { dragMode, showTooltip } = useCrossViewportDrag(isDragging);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE_TEXT_ELEMENT,
    hover: (item: any, monitor) => {
      if (!ref.current) return;
      
      if (item.sourceSpaceId !== currentSpaceId) {
        setDropLinePosition(null);
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        setDropLinePosition(null);
        return;
      }

      if (dragIndex < hoverIndex) {
        setDropLinePosition("bottom");
      } else {
        setDropLinePosition("top");
      }
    },
    drop: (item: any) => {
      if (item.sourceSpaceId === currentSpaceId && (!item.dragMode || item.dragMode === 'link')) {
        const dragIndex = item.index;
        const hoverIndex = index;

        if (dragIndex !== hoverIndex) {
          onMove(dragIndex, hoverIndex);
        }
      }
      setDropLinePosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(dragHandleRef);
  drop(ref);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [block.content, block.type]);

  const handleContentChange = (newContent: string) => {
    onUpdate(block.id, { content: newContent });
  };

  const handleSpaceSelected = (space: any) => {
    if (isSelectingPageLink) {
      onConvertBlock(block.id, 'pageLink');
      onUpdate(block.id, { 
        content: `[[${space.id}|${space.title}]]`,
        spaceId: space.id 
      });
      
      setShowSpaceLinkAutocomplete(false);
      setIsSelectingPageLink(false);
      setLinkTriggerIndex(-1);
      
      textareaRef.current?.blur();
      return;
    }
    
    // Altrimenti è un link inline normale (Gestito in RichTextEditor per i blocchi text)
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const handler = createNextBlock || onCreateNextBlock;
      if (handler) {
        handler(block.id, block.type);
      }
    } else if (e.key === "Backspace") {
      const target = e.target as HTMLElement;
      let isAtStart = false;
      let isEmpty = false;
      
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtStart = textAreaTarget.selectionStart === 0;
        isEmpty = textAreaTarget.value.trim() === '';
      } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(target);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          isAtStart = preCaretRange.toString().length === 0;
          isEmpty = (target.innerText || '').trim() === '';
        }
      }
      
      if (isEmpty && isAtStart && index > 0) {
        e.preventDefault();
        if (onDelete) {
          onDelete(block.id);
        }
        if (focusBlockByIndex) {
          setTimeout(() => {
            focusBlockByIndex(index - 1);
          }, 50);
        }
      }
    } else if (e.key === "ArrowUp") {
      const target = e.target as HTMLElement;
      let isAtStart = false;
      
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtStart = textAreaTarget.selectionStart === 0;
      } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(target);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          isAtStart = preCaretRange.toString().length === 0;
        }
      }
      
      if (isAtStart && focusBlockByIndex) {
        e.preventDefault();
        focusBlockByIndex(index - 1);
      }
    } else if (e.key === "ArrowDown") {
      const target = e.target as HTMLElement;
      let isAtEnd = false;
      
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtEnd = textAreaTarget.selectionStart === textAreaTarget.value.length;
      } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(target);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          const totalLength = target.innerText?.length || 0;
          isAtEnd = preCaretRange.toString().length === totalLength;
        }
      }
      
      if (isAtEnd && focusBlockByIndex && totalBlocks) {
        if (index < totalBlocks - 1) {
          e.preventDefault();
          focusBlockByIndex(index + 1);
        }
      }
    }
  };

  const handleDragHandleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragHandleRef.current) {
      const rect = dragHandleRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left });
      setShowMenu(!showMenu);
    }
  };

  if (hidden) {
    return null;
  }

  // Stili per il contenitore principale del blocco
  const getBlockStyles = () => {
    switch (block.type) {
      case 'heading1': return 'text-4xl font-bold mt-6 mb-2';
      case 'heading2': return 'text-3xl font-semibold mt-5 mb-2';
      case 'heading3': return 'text-2xl font-semibold mt-4 mb-2';
      case 'quote': return 'border-l-4 border-default-300 pl-4 py-1 my-2 italic text-default-500';
      case 'code': return 'font-mono text-sm bg-default-100 p-3 rounded-md my-2';
      case 'callout': return 'bg-default-100 p-4 rounded-lg my-2 flex gap-3 items-start border border-default-200';
      default: return 'text-base my-1';
    }
  };

  return (
    <div
      ref={ref}
      data-block-id={block.id}
      className={`
        relative flex gap-2 items-start group
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isOver && dropLinePosition === 'top' ? 'border-t-2 border-primary' : ''}
        ${isOver && dropLinePosition === 'bottom' ? 'border-b-2 border-primary' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        onClick={handleDragHandleClick}
        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-default-100 transition-opacity mt-1.5"
      >
        <GripVertical size={16} className="text-default-400" />
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className={`flex-1 min-w-0 ${getBlockStyles()}`}
      >
        {block.type === 'text' ? (
          <RichTextEditor
            content={block.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder}
            spacesState={spacesState}
            viewportsState={viewportsState}
            contentEditableRef={contentEditableRef}
            brokenLinks={brokenLinks}
            brokenLinksVersion={brokenLinksVersion}
            onTriggerSpaceLink={(position, triggerIndex) => {
              setSpaceLinkPosition(position);
              setLinkTriggerIndex(triggerIndex);
              setShowSpaceLinkAutocomplete(true);
            }}
            onLinkContextMenu={(linkId, linkText, position) => {
              setSelectedLinkId(linkId);
              setSelectedLinkText(linkText);
              setLinkContextMenuPosition(position);
              setShowLinkContextMenu(true);
            }}
            onBrokenLinkClick={(linkId, position) => {
              setRelinkingLinkId(linkId);
              setRelinkMenuPosition(position);
              setShowRelinkMenu(true);
            }}
            onNavigateUp={() => focusBlockByIndex && focusBlockByIndex(index - 1)}
            onNavigateDown={() => focusBlockByIndex && focusBlockByIndex(index + 1)}
          />
        ) : block.type === 'checkbox' ? (
          <div className="flex gap-2 items-start">
            <Checkbox 
              isSelected={block.checked} 
              onValueChange={(checked) => onUpdate(block.id, { checked })}
              className="mt-1"
            />
            <Textarea
              value={block.content}
              onValueChange={(content) => onUpdate(block.id, { content })}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              minRows={1}
              ref={textareaRef}
              classNames={{
                input: `bg-transparent border-none shadow-none outline-none p-0 text-base ${block.checked ? 'line-through text-default-400' : ''}`,
                inputWrapper: "bg-transparent shadow-none p-0 min-h-0 h-auto",
              }}
            />
          </div>
        ) : block.type === 'divider' ? (
          <div className="py-2">
            <div className="h-[1px] bg-divider w-full" />
          </div>
        ) : block.type === 'bulletList' ? (
          <div className="flex gap-2 items-start">
            <span className="text-xl leading-none mt-[-2px]">•</span>
            <Textarea
              value={block.content}
              onValueChange={(content) => onUpdate(block.id, { content })}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              minRows={1}
              ref={textareaRef}
              classNames={{
                input: "bg-transparent border-none shadow-none outline-none p-0 text-base",
                inputWrapper: "bg-transparent shadow-none p-0 min-h-0 h-auto",
              }}
            />
          </div>
        ) : block.type === 'numberedList' ? (
          <div className="flex gap-2 items-start">
            <span className="font-medium min-w-[20px] text-right">1.</span>
            <Textarea
              value={block.content}
              onValueChange={(content) => onUpdate(block.id, { content })}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              minRows={1}
              ref={textareaRef}
              classNames={{
                input: "bg-transparent border-none shadow-none outline-none p-0 text-base",
                inputWrapper: "bg-transparent shadow-none p-0 min-h-0 h-auto",
              }}
            />
          </div>
        ) : block.type === 'image' ? (
          <div className="flex flex-col gap-2">
            {block.content ? (
              <img 
                src={block.content} 
                alt="Block content" 
                className="max-w-full rounded-lg border border-divider"
              />
            ) : (
              <div className="p-8 bg-default-50 border-2 border-dashed border-default-200 rounded-lg flex items-center justify-center text-default-400">
                <ImageIcon size={24} className="mr-2" />
                <span>Add an image URL</span>
              </div>
            )}
            <Input
              value={block.content}
              onValueChange={(content) => onUpdate(block.id, { content })}
              placeholder="Image URL"
              size="sm"
              variant="flat"
            />
          </div>
        ) : block.type === 'spaceEmbed' ? (
          <RenderSpaceEmbed 
            spaceId={block.spaceId} 
            spacesState={spacesState} 
            viewportsState={viewportsState} 
          />
        ) : block.type === 'blockEmbed' ? (
          <RenderBlockEmbed 
            blockId={block.blockId} 
            sourceSpaceId={block.sourceSpaceId} 
            spacesState={spacesState} 
            viewportsState={viewportsState} 
          />
        ) : (
          <Textarea
            value={block.content}
            onValueChange={(content) => onUpdate(block.id, { content })}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder}
            minRows={1}
            ref={textareaRef}
            classNames={{
              input: "bg-transparent border-none shadow-none outline-none p-0 text-inherit font-inherit",
              inputWrapper: "bg-transparent shadow-none p-0 min-h-0 h-auto",
            }}
          />
        )}
      </div>

      {/* Block Menu (simplified) */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-[999]" 
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed bg-white shadow-lg rounded-lg p-1 z-[1000] border border-divider min-w-[150px]"
            style={{
              top: `${menuPosition?.top}px`,
              left: `${menuPosition?.left}px`,
            }}
          >
            <div
              onClick={() => { onDelete(block.id); setShowMenu(false); }}
              className="p-2 rounded-md cursor-pointer flex items-center gap-2 text-danger hover:bg-danger-50 transition-colors"
            >
              <Trash2 size={16} />
              <span className="text-small">Delete</span>
            </div>
            {/* Add more menu items here */}
          </div>
        </>
      )}

      {/* Link Autocomplete */}
      {showSpaceLinkAutocomplete && (
        <SpaceLinkAutocomplete
          spaces={spacesState.spaces}
          onSelect={handleSpaceSelected}
          onClose={() => {
            setShowSpaceLinkAutocomplete(false);
            setLinkTriggerIndex(-1);
            setIsSelectingPageLink(false);
          }}
          position={spaceLinkPosition}
          currentSpaceId={currentSpaceId}
        />
      )}

      {/* Link Context Menu */}
      {showLinkContextMenu && (
        <LinkContextMenu
          linkId={selectedLinkId}
          linkText={selectedLinkText}
          position={linkContextMenuPosition}
          spacesState={spacesState}
          onRename={() => {}} // TODO
          onRelink={() => {}} // TODO
          onClose={() => setShowLinkContextMenu(false)}
        />
      )}
    </div>
  );
}
