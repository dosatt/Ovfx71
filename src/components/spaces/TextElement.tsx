import { LinkContextMenu } from './LinkContextMenu';
import { useRef, useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Button, Textarea, Input, Chip, Tooltip } from "@heroui/react";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import {
  Trash2,
  AlertCircle,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List as ListIcon,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
  Image as ImageIcon,
  File as FileIcon,
  Globe,
  Link2,
  Plus,
  Copy,
  Scissors,
  Clipboard,
  Type,
  Palette,
  Sigma,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  Link2Off,
  MoreVertical,
  LayoutGrid,
  Grid,
  Star,
  Search,
  Library,
  List
} from "lucide-react";
import { Block, BlockType } from "../../types";
import { SpaceEmbed } from './SpaceEmbed';
import { BlockEmbed } from './BlockEmbed';
import { FileElement, ItemTypes as FileItemTypes } from './FileElement';
import { CalendarElement } from './CalendarElement';
import { CalendarAutocomplete } from './CalendarAutocomplete';
import { SpaceLinkAutocomplete } from './SpaceLinkAutocomplete';
import { RichTextEditor } from './RichTextEditor';
import { useCrossViewportDrag } from '../../hooks/useCrossViewportDrag';
import { ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { blockTypeConfig, orderedBlockTypes } from './blockConfig';
import type { Settings } from '../../hooks/useSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../ui/table";

// Helper components for conditional rendering
function RenderSpaceEmbed({ spaceId, spacesState, viewportsState }: any) {
  const embeddedSpace = spacesState.getSpace(spaceId);

  if (!embeddedSpace) {
    return (
      <div className="p-4 bg-default-100 rounded-lg">
        <span className="text-small text-default-500">
          Space not found
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

  const embeddedBlock = sourceSpace.content.blocks.find((b: Block) => b && b.id === blockId);

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

function SimpleTableEditor({ content, onUpdate }: { content: string, onUpdate: (newContent: string) => void }) {
  const [data, setData] = useState<{ rows: string[][] }>(() => {
    try {
      const parsed = JSON.parse(content || '{"rows":[["",""],["",""]]}');
      return parsed.rows ? parsed : { rows: [['', ''], ['', '']] };
    } catch {
      return { rows: [['', ''], ['', '']] };
    }
  });

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...data.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;
    const newData = { rows: newRows };
    setData(newData);
    onUpdate(JSON.stringify(newData));
  };

  const addRow = () => {
    const cols = data.rows[0]?.length || 2;
    const newRows = [...data.rows, Array(cols).fill('')];
    const newData = { rows: newRows };
    setData(newData);
    onUpdate(JSON.stringify(newData));
  };

  const addCol = () => {
    const newRows = data.rows.map(row => [...row, '']);
    const newData = { rows: newRows };
    setData(newData);
    onUpdate(JSON.stringify(newData));
  };

  return (
    <div className="border rounded-md p-2 overflow-x-auto bg-default-50 mx-auto max-w-full">
      <Table>
        <TableBody>
          {data.rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j} className="p-1 min-w-[100px]">
                  <Input
                    value={cell}
                    onValueChange={(val) => updateCell(i, j, val)}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: "bg-default-100 h-8 border border-default-200 hover:border-default-400 focus-within:border-primary shadow-none"
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="flat" onPress={addRow} startContent={<Plus className="w-4 h-4" />}>Row</Button>
        <Button size="sm" variant="flat" onPress={addCol} startContent={<Plus className="w-4 h-4" />}>Col</Button>
      </div>
    </div>
  );
}

interface TextElementProps {
  block: Block & { collapsed?: boolean };
  index: number;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddAfter: (blockId: string, anchor: HTMLElement) => void;
  onAddBefore?: (blockId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number, count?: number) => void;
  onConvertBlock: (blockId: string, newType: BlockType) => void;
  onCreateNextBlock?: (
    blockId: string,
    blockType: BlockType,
    currentBlockUpdates?: Partial<Block>
  ) => void;
  createNextBlock?: (
    blockId: string,
    blockType: BlockType,
    currentBlockUpdates?: Partial<Block>
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
  listNumber?: number | string;
  dragCount?: number;
  blocks?: Block[];
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
  selectedBlockIds?: string[];
  onToggleSelection?: (blockId: string, isShift: boolean) => void;
  onSelectAll?: () => void;
  onSelectGroup?: () => void;
  isEventPage?: boolean;
}

const ALLOWED_INDENT_TYPES = ['bulletList', 'numberedList', 'checkbox', 'checkboxNumberedList'];

export function TextElement({
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
  listNumber,
  dragCount = 1,
  blocks: parentBlocks,
  settings,
  onUpdateSettings,
  selectedBlockIds = [],
  onToggleSelection,
  onSelectAll,
  onSelectGroup,
  isEventPage,
}: TextElementProps) {
  const [previewType, setPreviewType] = useState<BlockType | null>(null);
  const effectiveBlock = previewType ? { ...block, type: previewType } : block;
  const activeConfig = blockTypeConfig[effectiveBlock.type] || config;
  const isSelected = selectedBlockIds.includes(block.id);

  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dropLinePosition, setDropLinePosition] = useState<
    "top" | "bottom" | null
  >(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Stati per l'autocomplete dei link
  const [showSpaceLinkAutocomplete, setShowSpaceLinkAutocomplete] = useState(false);
  const [showCalendarAutocomplete, setShowCalendarAutocomplete] = useState(false);
  const [spaceLinkPosition, setSpaceLinkPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [linkTriggerIndex, setLinkTriggerIndex] = useState<number>(-1);
  const [autocompleteMode, setAutocompleteMode] = useState<'inline' | 'pageLink' | 'spacePreview' | null>(null);
  const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = useState(0);

  // Stati per il menu contestuale dei link
  const [showLinkContextMenu, setShowLinkContextMenu] = useState(false);
  const [linkContextMenuPosition, setLinkContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [selectedLinkText, setSelectedLinkText] = useState<string>('');

  // Stato per mostrare il menu di relink quando si clicca sull'icona broken
  const [showRelinkMenu, setShowRelinkMenu] = useState(false);
  const [relinkMenuPosition, setRelinkMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [relinkingLinkId, setRelinkingLinkId] = useState<string>('');

  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDividerMenu, setShowDividerMenu] = useState(false);
  const shouldFocusRef = useRef(false);
  const [justMoved, setJustMoved] = useState(false);

  // Per la gestione di Cmd+A progressivo
  const lastAPressTime = useRef<number>(0);
  const aPressCount = useRef<number>(0);

  // Restore focus after type conversion
  useEffect(() => {
    if (shouldFocusRef.current) {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      } else if (contentEditableRef.current) {
        contentEditableRef.current.focus();
      }
      shouldFocusRef.current = false;
    }
  }, [block.type]);

  const isHeader =
    effectiveBlock.type === "heading1" ||
    effectiveBlock.type === "heading2" ||
    effectiveBlock.type === "heading3" ||
    effectiveBlock.type === "heading4";

  const space = currentSpaceId ? spacesState.getSpace(currentSpaceId) : null;

  // Find the first header (H1-H4) in the entire page content
  const firstHeaderInPage = space?.content?.blocks?.find((b: any) =>
    b && ['heading1', 'heading2', 'heading3', 'heading4'].includes(b.type)
  );
  const isTargetHeader = firstHeaderInPage?.id === block.id;
  const isTitleSynced = space?.metadata?.syncTitleWithH1 !== false;

  const isCollapsedHeader = isHeader && collapsedHeaders && collapsedHeaders.has(block.id);

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

      // Se il blocco trascinato è parte della selezione multipla, trascina l'intera selezione
      const itemBlockIds = isSelected ? selectedBlockIds : [block.id];

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
        count: isSelected ? selectedBlockIds.length : dragCount,
        selectedBlockIds: itemBlockIds,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult: any = monitor.getDropResult();
      // If the block was dropped into a collection view (which returns handled: true)
      // we remove it from the page to complete the "move" operation
      if (dropResult?.handled && onDelete) {
        onDelete(block.id);
      }

      if (monitor.didDrop()) {
        setJustMoved(true);
        setTimeout(() => setJustMoved(false), 700);
      }
    }
  });

  const { dragMode, showTooltip } = useCrossViewportDrag(isDragging);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ITEM_TYPE_TEXT_ELEMENT, FileItemTypes.FILE, FileItemTypes.EXTERNAL_ELEMENT],
    hover: (item: any, monitor) => {
      if (!ref.current) return;

      const itemType = monitor.getItemType();

      if (itemType === ITEM_TYPE_TEXT_ELEMENT) {
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
      } else {
        // External file or file from collection
        setDropLinePosition("bottom");
      }
    },
    drop: (item: any, monitor) => {
      const itemType = monitor.getItemType();

      if (itemType === ITEM_TYPE_TEXT_ELEMENT) {
        if (item.sourceSpaceId === currentSpaceId && (!item.dragMode || item.dragMode === 'link' || item.dragMode === 'move')) {
          const dragIndex = item.index;
          const hoverIndex = index;
          const count = item.count || 1;

          if (dragIndex !== hoverIndex) {
            onMove(dragIndex, hoverIndex, count);
          }
        }
      } else {
        // Handle external drop (FILE or EXTERNAL_ELEMENT)
        // Convert to a new block
        const handler = createNextBlock || onCreateNextBlock;
        if (handler) {
          let fileData = item.fileData || item.data;
          if (fileData) {
            const isImage = fileData.fileType?.startsWith('image/') || fileData.type?.startsWith('image/');
            const blockType = isImage ? 'image' : 'file';

            const metadata = isImage ? {} : {
              fileName: fileData.fileName || fileData.name || 'File',
              fileSize: fileData.fileSize || fileData.size || 0,
              fileType: fileData.fileType || fileData.type || 'application/octet-stream',
              filePreview: fileData.filePreview || fileData.preview,
              isFolder: fileData.isFolder || false,
              files: fileData.children || fileData.files || []
            };

            const content = isImage ? (fileData.filePreview || fileData.preview || '') : (fileData.fileName || fileData.name || 'File');

            // Pass the data for the NEW block and also update the CURRENT block if it's just a blank line
            const isCurrentBlockEmpty = !block.content || block.content.trim() === '';

            if (isCurrentBlockEmpty) {
              // Replace current block
              onUpdate(block.id, {
                type: blockType,
                content,
                metadata: { ...block.metadata, ...metadata }
              });
            } else {
              // Insert AFTER
              handler(block.id, blockType, {
                content,
                metadata
              });
            }
          }
        }
      }
      setDropLinePosition(null);
      return { pulledOut: true, handled: true };
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
  }, [block.content, effectiveBlock.type]);

  const handleContentChange = (newContent: string) => {
    // Check if block type is allowed for shortcuts
    // Excluded: table, file, image, space link (pageLink, spaceEmbed)
    const excludedTypes = ['table', 'file', 'image', 'pageLink', 'spaceEmbed', 'blockEmbed'];

    if (!excludedTypes.includes(block.type)) {
      // 1. Headings
      if (/^####\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'heading4', content: newContent.replace(/^####\s/, '') });
        return;
      }
      if (/^###\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'heading3', content: newContent.replace(/^###\s/, '') });
        return;
      }
      if (/^##\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'heading2', content: newContent.replace(/^##\s/, '') });
        return;
      }
      if (/^#\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'heading1', content: newContent.replace(/^#\s/, '') });
        return;
      }

      // 2. Bullet List
      if (/^-\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'bulletList', content: newContent.replace(/^-\s/, '') });
        return;
      }

      // 3. Numbered List
      const numberedListMatch = newContent.match(/^(\d+)\.\s/);
      if (numberedListMatch) {
        shouldFocusRef.current = true;
        const startNum = parseInt(numberedListMatch[1], 10);
        onUpdate(block.id, {
          type: 'numberedList',
          content: newContent.replace(/^\d+\.\s/, ''),
          listNumber: startNum
        });
        return;
      }

      // 4. Checkbox List
      if (/^-\[(-| )\]\s/.test(newContent) || /^\[\[\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'checkbox', content: newContent.replace(/^(-\[(-| )\]\s|\[\[\s)/, ''), checked: false });
        return;
      }
      if (/^-\[x\]\s/i.test(newContent) || /^\[\[\[\s/.test(newContent)) {
        shouldFocusRef.current = true;
        onUpdate(block.id, { type: 'checkbox', content: newContent.replace(/^(-\[x\]\s|\[\[\[\s)/, ''), checked: true });
        return;
      }

      // 5. Numbered Checkbox List (N[[ and N[[[)
      const numberedCheckboxMatch = newContent.match(/^(\d+)\[\[\s/);
      if (numberedCheckboxMatch) {
        shouldFocusRef.current = true;
        const startNum = parseInt(numberedCheckboxMatch[1], 10);
        onUpdate(block.id, {
          type: 'checkboxNumberedList',
          content: newContent.replace(/^\d+\[\[\s/, ''),
          checked: false,
          listNumber: startNum
        });
        return;
      }

      const numberedCheckboxCheckedMatch = newContent.match(/^(\d+)\[\[\[\s/);
      if (numberedCheckboxCheckedMatch) {
        shouldFocusRef.current = true;
        const startNum = parseInt(numberedCheckboxCheckedMatch[1], 10);
        onUpdate(block.id, {
          type: 'checkboxNumberedList',
          content: newContent.replace(/^\d+\[\[\[\s/, ''),
          checked: true,
          listNumber: startNum
        });
        return;
      }

      // 6. Divider
      if (newContent.trim() === '___') {
        const handler = createNextBlock || onCreateNextBlock;
        if (handler) {
          handler(block.id, 'text', { type: 'divider', content: '', metadata: { ...block.metadata, dividerVariant: 'stop' } });
        } else {
          onUpdate(block.id, { type: 'divider', content: '', metadata: { ...block.metadata, dividerVariant: 'stop' } });
          if (focusBlockByIndex && totalBlocks) {
            if (index < totalBlocks - 1) {
              setTimeout(() => focusBlockByIndex(index + 1), 0);
            }
          }
        }
        return;
      }

      if (newContent.trim() === '---') {
        const handler = createNextBlock || onCreateNextBlock;
        if (handler) {
          // Atomically update current block to divider and create new text block
          handler(block.id, 'text', { type: 'divider', content: '', metadata: { ...block.metadata, dividerVariant: 'regular' } });
        } else {
          // Fallback
          onUpdate(block.id, { type: 'divider', content: '', metadata: { ...block.metadata, dividerVariant: 'regular' } });
          if (focusBlockByIndex && totalBlocks) {
            if (index < totalBlocks - 1) {
              setTimeout(() => focusBlockByIndex(index + 1), 0);
            }
          }
        }
        return;
      }

      // 6. Space Preview shortcut (\\\)
      if (newContent.startsWith('\\\\\\')) {
        setLinkTriggerIndex(0);

        // Calculate position for autocomplete
        if (contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          setSpaceLinkPosition({
            top: rect.bottom + 4,
            left: rect.left
          });
        }

        setShowSpaceLinkAutocomplete(true);
        setAutocompleteMode('spacePreview');
        onUpdate(block.id, { content: '' });
        return;
      }

      // 7. Space Link shortcut (>>) - This is now handled inline by RichTextEditor
      // Removed block-level shortcut to avoid automatic conversion to block embed

      // 8. Calendar shortcut (+++)
      if (newContent.startsWith('+++')) {
        setLinkTriggerIndex(0);
        if (contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          setSpaceLinkPosition({
            top: rect.bottom + 4,
            left: rect.left
          });
        }
        setShowCalendarAutocomplete(true);
        onUpdate(block.id, { content: '' });
        return;
      }

      // 6. Numbered Checkbox List
      // Custom shortcut style: 1[[
      const shortcutCheckboxMatch = newContent.match(/^(\d+)\[\[\s/);
      if (shortcutCheckboxMatch) {
        shouldFocusRef.current = true;
        const startNum = parseInt(shortcutCheckboxMatch[1], 10);
        onUpdate(block.id, {
          type: 'checkboxNumberedList',
          content: newContent.replace(/^\d+\[\[\s/, ''),
          checked: false,
          listNumber: startNum
        });
        return;
      }

      const shortcutCheckboxCheckedMatch = newContent.match(/^(\d+)\[\[\[\s/);
      if (shortcutCheckboxCheckedMatch) {
        shouldFocusRef.current = true;
        const startNum = parseInt(shortcutCheckboxCheckedMatch[1], 10);
        onUpdate(block.id, {
          type: 'checkboxNumberedList',
          content: newContent.replace(/^\d+\[\[\[\s/, ''),
          checked: true,
          listNumber: startNum
        });
        return;
      }
    }

    onUpdate(block.id, { content: newContent });

    // Sync logic for the first header found in the page
    if (isTargetHeader && isTitleSynced && currentSpaceId) {
      spacesState.updateSpace(currentSpaceId, { title: newContent });
      // Update tab title if viewportsState is available
      if (viewportsState && viewportsState.focusedViewportId) {
        const focusedViewport = viewportsState.findViewport(viewportsState.focusedViewportId);
        if (focusedViewport && focusedViewport.activeTabId) {
          viewportsState.updateTab(focusedViewport.id, focusedViewport.activeTabId, { title: newContent });
        }
      }
    }
  };

  const handleToggleSync = () => {
    const newSync = !isTitleSynced;
    if (currentSpaceId) {
      spacesState.updateSpace(currentSpaceId, {
        metadata: { ...space?.metadata, syncTitleWithH1: newSync }
      });
      if (newSync && isTargetHeader) {
        spacesState.updateSpace(currentSpaceId, { title: block.content });
      }
    }
  };

  const handleSpaceSelected = (space: any) => {
    if (autocompleteMode === 'pageLink') {
      onUpdate(block.id, {
        type: 'pageLink',
        content: `[[${space.id}|${space.title}]]`,
        spaceId: space.id
      });

      setShowSpaceLinkAutocomplete(false);
      setAutocompleteMode(null);
      setLinkTriggerIndex(-1);

      textareaRef.current?.blur();
      return;
    }

    if (autocompleteMode === 'spacePreview') {
      onUpdate(block.id, {
        type: 'spaceEmbed',
        spaceId: space.id,
        content: ''
      });

      setShowSpaceLinkAutocomplete(false);
      setAutocompleteMode(null);
      setLinkTriggerIndex(-1);

      textareaRef.current?.blur();
      return;
    }

    // Altrimenti è un link inline normale
    const currentContent = block.content || '';
    const insertIndex = linkTriggerIndex;

    if (insertIndex !== -1 && insertIndex <= currentContent.length) {
      const linkText = `[[${space.id}|${space.title}]]`;
      const newContent = currentContent.slice(0, insertIndex) + linkText + currentContent.slice(insertIndex);
      onUpdate(block.id, { content: newContent });

      setShowSpaceLinkAutocomplete(false);
      setAutocompleteMode(null);
      setLinkTriggerIndex(-1);

      // Restore focus to editor
      shouldFocusRef.current = true;
    }
  };

  const handleEventSelected = (event: any) => {
    // Inserisci un link all'evento (usando il suo ID blocco)
    const currentContent = block.content || '';
    const insertIndex = linkTriggerIndex;

    const linkText = `[[${event.id}|${event.metadata?.title || event.content || 'Event'}]]`;
    const newContent = currentContent.slice(0, insertIndex) + linkText + currentContent.slice(insertIndex);
    onUpdate(block.id, { content: newContent });

    setShowCalendarAutocomplete(false);
    setLinkTriggerIndex(-1);
    shouldFocusRef.current = true;
  };

  const handleCreateNewEvent = () => {
    setShowCalendarAutocomplete(false);

    if (currentSpaceId) {
      const newEventId = `block_${Date.now()}`;
      const newEvent = {
        id: newEventId,
        type: 'calendar',
        content: 'New Event',
        metadata: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3600000).toISOString(),
          title: 'New Event',
          displayMode: 'card'
        }
      };

      const space = spacesState.getSpace(currentSpaceId);
      if (space) {
        const updatedBlocks = [...(space.content?.blocks || []), newEvent];
        spacesState.updateSpace(currentSpaceId, {
          content: { ...space.content, blocks: updatedBlocks }
        });

        const linkText = `[[${newEventId}|New Event]]`;
        const currentContent = block.content || '';
        const newContent = currentContent.slice(0, linkTriggerIndex) + linkText + currentContent.slice(linkTriggerIndex);
        onUpdate(block.id, { content: newContent });
      }
    }
    setLinkTriggerIndex(-1);
    shouldFocusRef.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (isCmdOrCtrl && e.key === 'a') {
      const now = Date.now();
      if (now - lastAPressTime.current > 500) {
        aPressCount.current = 0;
      }

      e.preventDefault();
      e.stopPropagation();

      const newCount = aPressCount.current + 1;
      aPressCount.current = newCount;
      lastAPressTime.current = now;

      if (newCount === 1) {
        // Seleziona il blocco corrente
        if (onToggleSelection) {
          onToggleSelection(block.id, false);
        }
      } else if (newCount === 2) {
        // Seleziona il gruppo
        if (onSelectGroup) {
          onSelectGroup();
        } else if (onSelectAll) {
          // Se non c'è un gruppo, passa a Seleziona tutto
          onSelectAll();
          aPressCount.current = 3;
        }
      } else if (newCount >= 3) {
        // Seleziona tutto
        if (onSelectAll) {
          onSelectAll();
        }
      }
      return;
    }

    // Check if block type allows indentation
    const canIndent = ALLOWED_INDENT_TYPES.includes(block.type);

    if (e.key === 'Tab') {
      if (!canIndent) return;

      e.preventDefault();
      const currentIndent = block.indent || 0;
      if (e.shiftKey) {
        if (currentIndent > 0) {
          onUpdate(block.id, { indent: currentIndent - 1 });
        }
      } else {
        if (currentIndent < 10) {
          onUpdate(block.id, { indent: currentIndent + 1 });
        }
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // If current block is a list type OR HEADER and is empty, convert to text
      const typesToConvertToText = ['bulletList', 'numberedList', 'checkbox', 'checkboxNumberedList', 'heading1', 'heading2', 'heading3', 'heading4', 'math', 'callout'];
      if (typesToConvertToText.includes(block.type) && (!block.content || block.content.trim() === '')) {
        // If it's an indented list item, outdent it first before converting to text
        if (canIndent && (block.indent || 0) > 0) {
          onUpdate(block.id, { indent: (block.indent || 0) - 1 });
          return;
        }

        onConvertBlock(block.id, 'text');

        // Use a timeout to ensure React has re-rendered the component as text
        // before attempting to focus it. We can't rely on existing refs because
        // the component structure might change (e.g. from check+input to just input).
        setTimeout(() => {
          // We need to find the element again because the DOM might have been replaced
          // or we just need to re-trigger focus on the updated component.
          // Since we are inside the component instance, we can try using focusBlockByIndex 
          // if available, which searches by ID/Index.
          if (focusBlockByIndex) {
            focusBlockByIndex(index);
          }
        }, 10);
        return;
      }

      const handler = createNextBlock || onCreateNextBlock;
      if (handler) {
        // If current block is a header, next block should be text
        const nextType = block.type.startsWith('heading') ? 'text' : block.type;
        handler(block.id, nextType);
      }
    } else if (e.key === "Backspace") {
      const target = e.target as HTMLElement;
      let isAtStart = false;
      let isEmpty = false;

      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtStart = textAreaTarget.selectionStart === 0;
        isEmpty = textAreaTarget.value.length === 0; // Use value length for input/textarea
      } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const root = contentEditableRef.current || target;

          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(root);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          isAtStart = preCaretRange.toString().length === 0;

          // Use block content for emptiness check to be consistent with state
          isEmpty = !block.content || block.content.trim() === '';
        }
      }

      // Handle outdent on backspace at start
      if (isAtStart && canIndent && (block.indent || 0) > 0) {
        e.preventDefault();
        onUpdate(block.id, { indent: (block.indent || 0) - 1 });
        return;
      }

      // Handle empty block deletion
      if (isEmpty && isAtStart && index > 0) {
        e.preventDefault();
        if (onDelete) {
          onDelete(block.id);
        }
        if (focusBlockByIndex) {
          // Focus previous block at the end
          setTimeout(() => {
            focusBlockByIndex(index - 1, 'end');
          }, 10);
        }
        return;
      }

      // Handle merge with previous block (non-empty)
      if (isAtStart && index > 0 && prevBlock) {
        const mergeableTypes = ['text', 'heading1', 'heading2', 'heading3', 'heading4', 'bulletList', 'numberedList', 'checkbox', 'checkboxNumberedList', 'quote', 'callout'];

        if (mergeableTypes.includes(prevBlock.type) && mergeableTypes.includes(block.type)) {
          e.preventDefault();
          const prevContent = prevBlock.content || '';
          const currentContent = block.content || '';

          // Update previous block with combined content
          onUpdate(prevBlock.id, { content: prevContent + currentContent });

          // Delete current block
          onDelete(block.id);

          // Focus previous block at the junction point
          if (focusBlockByIndex) {
            focusBlockByIndex(index - 1, prevContent.length);
          }
        } else {
          // If types are not mergeable, just focus the end of previous block
          e.preventDefault();
          if (focusBlockByIndex) {
            focusBlockByIndex(index - 1, 'end');
          }
        }
      }
    } else if (e.key === "ArrowUp") {
      // Don't intercept arrow keys when autocomplete is open
      if (showSpaceLinkAutocomplete) {
        return;
      }

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
      // Don't intercept arrow keys when autocomplete is open
      if (showSpaceLinkAutocomplete) {
        return;
      }

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

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content || '');
  };

  const handleCut = () => {
    navigator.clipboard.writeText(block.content || '');
    onDelete(block.id);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUpdate(block.id, { content: (block.content || '') + text });
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleManualOverrideChange = (val: number | undefined) => {
    if (val !== undefined && blocks && blocks.length > 0 && blocks[0].id === block.id) {
      blocks.slice(1).forEach(b => {
        if (b.listNumber !== undefined) {
          onUpdate(b.id, { listNumber: undefined });
        }
      });
    }
    onUpdate(block.id, { listNumber: val });
  };

  if (hidden) {
    return null;
  }

  // Stili per il contenitore principale del blocco
  const getBlockMargins = () => {
    switch (effectiveBlock.type) {
      case 'heading1': return 'mt-4 mb-2';
      case 'heading2':
      case 'heading3':
      case 'heading4': return 'mt-1 mb-2';
      case 'quote':
      case 'code':
      case 'math':
      case 'callout': return 'my-2';
      default: return 'my-1';
    }
  };

  const getBlockStyles = () => {
    let styles = '';
    switch (effectiveBlock.type) {
      case 'heading1': styles = 'text-4xl font-bold'; break;
      case 'heading2': styles = 'text-3xl font-semibold'; break;
      case 'heading3': styles = 'text-2xl font-semibold'; break;
      case 'heading4': styles = 'text-xl font-semibold'; break;
      case 'quote': styles = 'border-l-4 border-default-300 pl-4 py-1 italic text-default-500'; break;
      case 'code': styles = 'font-mono text-sm bg-default-100 p-3 rounded-md'; break;
      case 'math': styles = 'font-mono bg-default-50 p-3 rounded-md border-l-4 border-primary'; break;
      case 'callout': styles = 'bg-default-100 p-4 rounded-lg flex gap-3 items-start border border-default-200'; break;
      default: styles = 'text-base'; break;
    }

    // Alignment logic
    if (isHeader || effectiveBlock.type === 'text') {
      // The justification classes are kept but might not affect non-flex containers.
      // Text alignment is handled by getTextAlignmentClass() applied to inputs/editors.
      if (block.align === 'left') styles += ' justify-start';
      else if (block.align === 'center') styles += ' justify-center';
      else if (block.align === 'right') styles += ' justify-end';
      else {
        // Default justification based on type
        styles += ' justify-start';
      }
    }

    return styles;
  };

  const getTextAlignmentClass = () => {
    // If user explicitly set alignment, use it
    if (block.align === 'left') return 'text-left';
    if (block.align === 'center') return 'text-center';
    if (block.align === 'right') return 'text-right';

    // Default logic: Always left to ensure cursor position is predictable (before the text)
    return 'text-left';
  };

  const renderRichText = (placeholder?: string, className?: string) => (
    <RichTextEditor
      content={block.content}
      onChange={handleContentChange}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        // Use a small delay to avoid flicker and allow button clicks in the placeholder
        // before they are unmounted by isFocused becoming false.
        setTimeout(() => {
          setIsFocused(false);
          // Convert empty heading to text on blur
          if (isHeader && (!block.content || block.content.trim() === '')) {
            onConvertBlock(block.id, 'text');
          }
        }, 150);
      }}
      placeholder={placeholder || activeConfig.placeholder}
      spacesState={spacesState}
      viewportsState={viewportsState}
      contentEditableRef={contentEditableRef}
      brokenLinks={brokenLinks}
      brokenLinksVersion={brokenLinksVersion}
      className={className || getTextAlignmentClass()}
      onTriggerSpaceLink={(position, triggerIndex) => {
        setSpaceLinkPosition(position);
        setLinkTriggerIndex(triggerIndex);
        setShowSpaceLinkAutocomplete(true);
        setAutocompleteSelectedIndex(0);
        if (triggerIndex === 0) {
          setAutocompleteMode('pageLink');
        } else {
          setAutocompleteMode('inline');
        }
      }}
      onTriggerCalendar={(position, triggerIndex) => {
        setSpaceLinkPosition(position);
        setLinkTriggerIndex(triggerIndex);
        setShowCalendarAutocomplete(true);
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
  );

  return (
    <div
      ref={ref}
      className={`
        relative w-full group transition-opacity duration-500
        ${(isDragging || justMoved) ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className={`${isEventPage ? 'w-full px-1' : 'max-w-[700px] mx-auto px-4'} relative`}>
        {/* Drop Lines - Aligned with content */}
        {isOver && dropLinePosition === 'top' && (
          <div className="absolute top-0 left-4 right-4 h-[2px] bg-primary z-50 pointer-events-none" />
        )}
        {isOver && dropLinePosition === 'bottom' && (
          <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary z-50 pointer-events-none" />
        )}

        <div
          data-block-id={block.id}
          style={{
            boxShadow: settings?.showMargins ? `0 0 0 1px ${settings.marginColor}` : undefined,
            marginLeft: `${(ALLOWED_INDENT_TYPES.includes(block.type) ? (block.indent || 0) : 0) * 24}px`
          }}
          className={`
                flex gap-2 items-stretch
                ${getBlockMargins()}
                ${settings?.showTextOutlines ? 'border border-dashed border-primary/50 rounded-sm' : ''}
            `}
        >
          {/* Drag Handle & Context Menu */}
          <div className="flex items-stretch gap-1 mr-0 relative w-4 shrink-0">
            {/* Collapse Handle for Headers */}
            {isHeader && (
              <div
                className={`
              absolute -left-5 top-0 bottom-0
              w-4 flex items-center justify-center rounded hover:bg-default-200 cursor-pointer transition-all
              text-default-400
              ${isCollapsedHeader ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHeaderCollapse && toggleHeaderCollapse(block.id);
                }}
                title="Toggle Collapse"
              >
                {isCollapsedHeader ? (
                  <ChevronRight size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            )}

            <div
              ref={dragHandleRef}
              className={`
              ${(isMenuOpen || (effectiveBlock.type !== 'divider' && isFocused) || isSelected) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              transition-all duration-200
              cursor-grab active:cursor-grabbing focus:outline-none relative flex justify-center w-4 py-[5px] rounded-sm
              ${isSelected ? 'bg-blue-50' : ''}
            `}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleSelection) {
                  onToggleSelection(block.id, e.shiftKey);
                }
                // Se è un click semplice (senza shift) e non era già selezionato, apriamo anche il menu
                // Ma se è un click per aggiungere alla selezione, non apriamo il menu
                if (!e.shiftKey) {
                  setIsMenuOpen(true);
                }
              }}
            >
              <div className={`w-[3px] h-full rounded-full transition-colors ${isSelected ? 'bg-blue-500' : 'bg-[#6b6b6b]'} pointer-events-none`} />

              <DropdownMenu open={isMenuOpen} onOpenChange={(open) => {
                setIsMenuOpen(open);
                if (!open) setPreviewType(null);
              }}>
                <DropdownMenuTrigger className="absolute top-0 left-0 w-full h-6 opacity-0 pointer-events-none" />
                <DropdownMenuContent align="start" className="w-[180px] p-2">
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    <DropdownMenuItem
                      onClick={() => onAddBefore && onAddBefore(block.id)}
                      className="flex flex-col items-center justify-center w-20 h-16 p-1 cursor-pointer focus:bg-default-100 rounded-md outline-none mx-auto"
                    >
                      <Plus className="h-6 w-6 mb-1 text-default-500" />
                      <span className="text-[10px] leading-tight text-center text-default-500 w-full truncate">Add Before</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onAddAfter && onAddAfter(block.id)}
                      className="flex flex-col items-center justify-center w-20 h-16 p-1 cursor-pointer focus:bg-default-100 rounded-md outline-none mx-auto"
                    >
                      <Plus className="h-6 w-6 mb-1 text-default-500" />
                      <span className="text-[10px] leading-tight text-center text-default-500 w-full truncate">Add After</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleCopy}
                      className="flex flex-col items-center justify-center w-20 h-16 p-1 cursor-pointer focus:bg-default-100 rounded-md outline-none mx-auto"
                    >
                      <Copy className="h-6 w-6 mb-1 text-default-500" />
                      <span className="text-[10px] leading-tight text-center text-default-500 w-full truncate">Copy</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleCut}
                      className="flex flex-col items-center justify-center w-20 h-16 p-1 cursor-pointer focus:bg-default-100 rounded-md outline-none mx-auto"
                    >
                      <Scissors className="h-6 w-6 mb-1 text-default-500" />
                      <span className="text-[10px] leading-tight text-center text-default-500 w-full truncate">Cut</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handlePaste}
                      className="flex flex-col items-center justify-center w-20 h-16 p-1 cursor-pointer focus:bg-default-100 rounded-md outline-none mx-auto"
                    >
                      <Clipboard className="h-6 w-6 mb-1 text-default-500" />
                      <span className="text-[10px] leading-tight text-center text-default-500 w-full truncate">Paste</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onDelete(block.id)}
                      className="flex flex-col items-center justify-center w-20 h-16 p-1 cursor-pointer focus:bg-red-50 rounded-md outline-none group/delete mx-auto"
                    >
                      <Trash2 className="h-6 w-6 mb-1 text-red-600" />
                      <span className="text-[10px] leading-tight text-center text-red-600 w-full truncate">Delete</span>
                    </DropdownMenuItem>
                  </div>

                  {block.type === 'file' && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none">
                          <span className="text-sm text-default-700">Options</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-2 w-48">
                          <DropdownMenuLabel className="text-xs text-default-400 font-bold uppercase tracking-wider mb-1 px-2">Layout</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onUpdate(block.id, { metadata: { ...block.metadata, layout: 'compact' } })} className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-default-100 text-sm">
                            <List className="w-4 h-4" /> Compact View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdate(block.id, { metadata: { ...block.metadata, layout: 'preview' } })} className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-default-100 text-sm">
                            <LayoutGrid className="w-4 h-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdate(block.id, { metadata: { ...block.metadata, layout: 'collection' } })} className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-default-100 text-sm">
                            <Library className="w-4 h-4" /> Collection View
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </>
                  )}

                  {(effectiveBlock.type === 'numberedList' || effectiveBlock.type === 'checkboxNumberedList') && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none">
                          <ListOrdered className="mr-2 h-4 w-4" />
                          <span className="text-sm text-default-700">Start from...</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-2 w-52">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-sm text-default-600">Manual Override</span>
                            <Switch
                              checked={block.listNumber !== undefined}
                              onCheckedChange={(checked) => {
                                handleManualOverrideChange(checked ? (listNumber || 1) : undefined);
                                if (!checked) setIsMenuOpen(false);
                              }}
                              className="scale-75"
                            />
                          </div>
                          {block.listNumber !== undefined && (
                            <>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-default-500 w-12">Value:</span>
                                <Input
                                  autoFocus
                                  type="number"
                                  defaultValue={block.listNumber.toString()}
                                  size="sm"
                                  className="h-8"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = parseInt(e.currentTarget.value, 10);
                                      if (!isNaN(val)) {
                                        handleManualOverrideChange(val);
                                        setIsMenuOpen(false);
                                      }
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="text-[10px] text-default-400 mt-1 px-1">Press Enter to apply. Supports negative.</div>
                            </>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </>
                  )}

                  {effectiveBlock.type === 'divider' && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuLabel className="text-[10px] text-default-400 uppercase font-bold px-2 mb-1">Divider Type</DropdownMenuLabel>
                      <DropdownMenuItem
                        className={`flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none ${block.metadata?.dividerVariant === 'regular' || !block.metadata?.dividerVariant ? 'bg-default-50' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(block.id, { metadata: { ...block.metadata, dividerVariant: 'regular' } });
                          setIsMenuOpen(false);
                        }}
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        <span className="text-sm text-default-700">Regular Divider</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none ${block.metadata?.dividerVariant === 'stop' ? 'bg-default-50' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(block.id, { metadata: { ...block.metadata, dividerVariant: 'stop' } });
                          setIsMenuOpen(false);
                        }}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <span className="text-sm text-default-700">Stop Divider</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {(isHeader || effectiveBlock.type === 'text') && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="mr-2 h-4 w-4" />
                          <span>Appearance</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-[160px] p-1">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMenuOpen(false);
                              onUpdate(block.id, { align: 'left' });
                            }}
                            className={`flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none ${block.align === 'left' ? 'bg-default-100' : ''}`}
                          >
                            <AlignLeft className="mr-2 h-4 w-4 text-default-500" />
                            <span className="text-sm text-default-700">Left</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMenuOpen(false);
                              onUpdate(block.id, { align: 'center' });
                            }}
                            className={`flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none ${block.align === 'center' ? 'bg-default-100' : ''}`}
                          >
                            <AlignCenter className="mr-2 h-4 w-4 text-default-500" />
                            <span className="text-sm text-default-700">Center</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMenuOpen(false);
                              onUpdate(block.id, { align: 'right' });
                            }}
                            className={`flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none ${block.align === 'right' ? 'bg-default-100' : ''}`}
                          >
                            <AlignRight className="mr-2 h-4 w-4 text-default-500" />
                            <span className="text-sm text-default-700">Right</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                      <Type className="mr-2 h-4 w-4" />
                      <span>Convert to...</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[160px] p-1 overflow-y-auto max-h-[300px]">
                      {orderedBlockTypes.map(type => {
                        const Icon = blockTypeConfig[type]?.icon || Type;
                        const isCurrent = type === block.type;
                        return (
                          <DropdownMenuItem
                            key={type}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewType(null);
                              setIsMenuOpen(false);
                              if (type !== block.type) {
                                if (type === 'spaceEmbed') {
                                  setShowSpaceLinkAutocomplete(true);
                                  setAutocompleteMode('spacePreview');
                                  setLinkTriggerIndex(0);

                                  if (dragHandleRef.current) {
                                    const rect = dragHandleRef.current.getBoundingClientRect();
                                    setSpaceLinkPosition({
                                      top: rect.bottom + 4,
                                      left: rect.left
                                    });
                                  }
                                } else {
                                  onConvertBlock(block.id, type as BlockType);
                                }
                              }
                            }}
                            className={`flex items-center p-2 cursor-pointer focus:bg-default-100 rounded-md outline-none ${isCurrent ? 'italic font-bold bg-default-50' : ''}`}
                          >
                            <Icon className="mr-2 h-4 w-4 text-default-500" />
                            <span className={`text-sm text-default-700 ${isCurrent ? 'italic font-bold' : ''}`}>{blockTypeConfig[type]?.label}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className={`flex-1 min-w-0 relative ${getBlockStyles()}`}
            style={{
              backgroundColor: settings?.showPadding ? (settings.paddingColor + '33') : undefined
            }}
            onDoubleClick={(e) => {
              if (isHeader && toggleHeaderCollapse) {
                e.stopPropagation();
                toggleHeaderCollapse(block.id);
              }
            }}
          >
            {/* Sync Button for the first header in the page */}
            {isTargetHeader && (
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content={isTitleSynced ? "Unsync title" : "Sync title with header"}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={handleToggleSync}
                    className={`min-w-0 w-8 h-8 ${isTitleSynced ? 'text-primary' : 'text-default-400'}`}
                  >
                    {isTitleSynced ? <LinkIcon size={14} /> : <Link2Off size={14} />}
                  </Button>
                </Tooltip>
              </div>
            )}

            {effectiveBlock.type === 'text' ? (
              <div className="flex items-start gap-2 w-full group/text relative">
                <div className="flex-1 min-w-0 relative">
                  {renderRichText(" ", getTextAlignmentClass())}

                  {/* Custom Placeholder and Insert Button */}
                  {!block.content && (isFocused || isDropdownOpen) && (
                    <div className={`absolute top-0 left-0 w-full pointer-events-none pb-1 select-none px-0 leading-[1.8] ${getTextAlignmentClass()}`}>
                      <span className="text-default-400 opacity-50 font-normal font-sans text-base">{index === 0 ? 'Type "#" to add a title' : (activeConfig.placeholder || "Type something")}</span>
                      <span className="text-default-400 opacity-50 font-normal font-sans text-base"> or </span>
                      <div className="pointer-events-auto inline-block align-baseline">
                        <DropdownMenu onOpenChange={setIsDropdownOpen} modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              className="relative z-10 bg-neutral-200 hover:bg-neutral-300 cursor-pointer border-none rounded-full px-3 py-1 flex items-center gap-1 leading-none text-neutral-600 font-normal text-[14px] transition-colors"
                            >
                              an element <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            side="bottom"
                            sideOffset={15}
                            className="z-[2000]"
                            onCloseAutoFocus={(e) => {
                              e.preventDefault();
                              if (contentEditableRef.current) {
                                contentEditableRef.current.focus();
                              } else if (textareaRef.current) {
                                textareaRef.current.focus();
                              }
                            }}
                          >
                            <DropdownMenuLabel>Insert Element</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {orderedBlockTypes.map(type => {
                              const Icon = blockTypeConfig[type]?.icon || Type;
                              return (
                                <DropdownMenuItem
                                  key={type}
                                  onSelect={() => {
                                    if (type === 'spaceEmbed') {
                                      setShowSpaceLinkAutocomplete(true);
                                      setAutocompleteMode('spacePreview');
                                      setLinkTriggerIndex(0);

                                      // Fallback position if chip is used
                                      if (contentRef.current) {
                                        const rect = contentRef.current.getBoundingClientRect();
                                        setSpaceLinkPosition({
                                          top: rect.bottom + 4,
                                          left: rect.left
                                        });
                                      }
                                    } else {
                                      onConvertBlock(block.id, type as BlockType);
                                    }
                                  }}
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  <span>{blockTypeConfig[type]?.label}</span>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {index === 0 && (
                        <span className="text-default-400 opacity-50 font-normal font-sans text-base"> or just simply type something...</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : effectiveBlock.type === 'checkbox' ? (
              <div className="flex gap-2 items-start">
                <Checkbox
                  checked={block.checked}
                  onCheckedChange={(checked) => onUpdate(block.id, { checked: checked === true })}
                  className="mt-1"
                />
                {renderRichText(activeConfig.placeholder, `min-h-[24px] outline-none text-base w-full ${block.checked ? 'line-through text-default-400' : ''}`)}
              </div>
            ) : effectiveBlock.type === 'divider' ? (
              <div className="py-2 group/divider relative select-none">
                {block.metadata?.dividerVariant === 'stop' ? (
                  <hr className="border-t-[3px] border-default-600 w-full my-2" />
                ) : (
                  <hr className="border-t-2 border-default-300 w-full my-2" />
                )}
              </div>
            ) : effectiveBlock.type === 'bulletList' ? (
              <div className="flex gap-2 items-start">
                <div className="min-w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                  <span className="text-3xl leading-none mt-[-2px]">•</span>
                </div>
                {renderRichText(activeConfig.placeholder, "min-h-[24px] outline-none text-base w-full")}
              </div>
            ) : effectiveBlock.type === 'checkboxNumberedList' ? (
              <div className="flex gap-2 items-start">
                <span className="font-medium min-w-[24px] shrink-0 text-right tabular-nums">{listNumber !== undefined ? listNumber + '.' : '1.'}</span>
                <Checkbox
                  checked={block.checked}
                  onCheckedChange={(checked) => onUpdate(block.id, { checked: checked === true })}
                  className="mt-1"
                />
                {renderRichText(activeConfig.placeholder, `min-h-[24px] outline-none text-base w-full ${block.checked ? 'line-through text-default-400' : ''}`)}
              </div>
            ) : effectiveBlock.type === 'table' ? (
              <SimpleTableEditor
                content={block.content}
                onUpdate={(content) => onUpdate(block.id, { content })}
              />
            ) : effectiveBlock.type === 'numberedList' ? (
              <div className="flex gap-2 items-start">
                <span className="font-medium min-w-[24px] shrink-0 text-right tabular-nums">{listNumber !== undefined ? listNumber + '.' : '1.'}</span>
                {renderRichText(activeConfig.placeholder, "min-h-[24px] outline-none text-base w-full")}
              </div>
            ) : effectiveBlock.type === 'image' ? (
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
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Image URL"
                  size="sm"
                  variant="flat"
                />
              </div>
            ) : effectiveBlock.type === 'calendar' ? (
              <div className="w-full">
                <CalendarElement
                  className="w-full"
                  data={(function () {
                    const baseData = {
                      startDate: block.metadata?.startDate || new Date().toISOString(),
                      endDate: block.metadata?.endDate || new Date(Date.now() + 3600000).toISOString(),
                      recurrence: block.metadata?.recurrence || 'none',
                      notes: block.metadata?.notes,
                      completed: block.metadata?.completed,
                      attachments: block.metadata?.attachments,
                      displayMode: block.metadata?.displayMode || 'card',
                      linkedEventId: block.metadata?.linkedEventId,
                      sourceSpaceId: block.metadata?.sourceSpaceId
                    };

                    // Pull sync: Override with source data if linked
                    if (baseData.linkedEventId && baseData.sourceSpaceId && spacesState) {
                      const sourceSpace = spacesState.getSpace(baseData.sourceSpaceId);
                      const sourceBlock = sourceSpace?.content?.blocks?.find((b: any) => b.id === baseData.linkedEventId);
                      if (sourceBlock) {
                        return {
                          ...baseData,
                          startDate: sourceBlock.metadata?.startDate || baseData.startDate,
                          endDate: sourceBlock.metadata?.endDate || baseData.endDate,
                          recurrence: sourceBlock.metadata?.recurrence || baseData.recurrence,
                          notes: sourceBlock.metadata?.notes || sourceBlock.content || baseData.notes,
                          completed: sourceBlock.metadata?.completed ?? baseData.completed,
                          attachments: sourceBlock.metadata?.attachments || baseData.attachments,
                        };
                      }
                    }
                    return baseData;
                  })()}
                  onUpdate={(updates) => {
                    // Update local block
                    onUpdate(block.id, { metadata: { ...block.metadata, ...updates } });

                    // Push sync: Update linked source block
                    if (block.metadata?.linkedEventId && block.metadata?.sourceSpaceId && spacesState) {
                      const sourceSpace = spacesState.getSpace(block.metadata.sourceSpaceId);
                      if (sourceSpace && sourceSpace.content?.blocks) {
                        const sourceBlocks = sourceSpace.content.blocks;
                        const blockIndex = sourceBlocks.findIndex((b: any) => b.id === block.metadata.linkedEventId);
                        if (blockIndex !== -1) {
                          const sourceBlock = sourceBlocks[blockIndex];
                          const newSourceBlock = {
                            ...sourceBlock,
                            // specific mapping: updates.notes -> content & metadata.notes
                            content: updates.notes !== undefined ? updates.notes : sourceBlock.content,
                            metadata: {
                              ...sourceBlock.metadata,
                              ...updates
                            }
                          };
                          const newBlocks = [...sourceBlocks];
                          newBlocks[blockIndex] = newSourceBlock;
                          spacesState.updateSpace(block.metadata.sourceSpaceId, {
                            content: { ...sourceSpace.content, blocks: newBlocks }
                          });
                        }
                      }
                    }
                  }}
                  spacesState={spacesState}
                  isReadOnly={false}
                />
              </div>
            ) : effectiveBlock.type === 'file' ? (
              <div className={`w-full flex ${block.metadata?.layout === 'preview' ? 'justify-center' : 'justify-start'}`}>
                <FileElement
                  layout={block.metadata?.layout || 'compact'}
                  fileName={block.metadata?.fileName || (block.content || 'New File')}
                  fileSize={block.metadata?.fileSize || 0}
                  fileType={block.metadata?.fileType || 'application/octet-stream'}
                  filePreview={block.metadata?.filePreview}
                  files={block.metadata?.files}
                  searchQuery={block.metadata?.searchQuery}
                  onUpdate={(updates) => onUpdate(block.id, { metadata: { ...block.metadata, ...updates } })}
                  onDelete={() => onDelete(block.id)}
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                />
              </div>
            ) : effectiveBlock.type === 'spaceEmbed' ? (
              <RenderSpaceEmbed
                spaceId={block.spaceId}
                spacesState={spacesState}
                viewportsState={viewportsState}
              />
            ) : effectiveBlock.type === 'blockEmbed' ? (
              <RenderBlockEmbed
                blockId={block.blockId}
                sourceSpaceId={block.sourceSpaceId}
                spacesState={spacesState}
                viewportsState={viewportsState}
              />
            ) : (
              renderRichText(activeConfig.placeholder, `bg-transparent border-none shadow-none outline-none p-0 font-inherit w-full ${getTextAlignmentClass()}`)
            )}
          </div>

          {/* Balancing Spacer for symmetry (compensates for the left-hand handle) */}
          <div className="w-4 shrink-0 pointer-events-none" aria-hidden="true" />

          {/* Link Autocomplete */}
          {showSpaceLinkAutocomplete && (
            <SpaceLinkAutocomplete
              spaces={spacesState.spaces}
              onSelect={handleSpaceSelected}
              onClose={() => {
                setShowSpaceLinkAutocomplete(false);
                setLinkTriggerIndex(-1);
                setAutocompleteMode(null);
              }}
              position={spaceLinkPosition}
              currentSpaceId={currentSpaceId}
              selectedIndex={autocompleteSelectedIndex}
              onSelectedIndexChange={setAutocompleteSelectedIndex}
            />
          )}

          {showCalendarAutocomplete && (
            <CalendarAutocomplete
              spaces={spacesState.spaces}
              onSelect={handleEventSelected}
              onCreateNew={handleCreateNewEvent}
              onClose={() => {
                setShowCalendarAutocomplete(false);
                setLinkTriggerIndex(-1);
              }}
              position={spaceLinkPosition}
            />
          )}

          {/* Link Context Menu */}
          {showLinkContextMenu && (
            <LinkContextMenu
              linkId={selectedLinkId}
              linkText={selectedLinkText}
              position={linkContextMenuPosition}
              spacesState={spacesState}
              onRename={() => { }} // TODO
              onRelink={() => { }} // TODO
              onClose={() => setShowLinkContextMenu(false)}
            />
          )}

        </div>
      </div>
    </div>
  );
}