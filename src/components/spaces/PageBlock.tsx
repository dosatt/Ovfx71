import { LinkContextMenu } from './LinkContextMenu';
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDrag, useDrop } from "react-dnd";
import { storageToDisplay, displayToStorage, LinkInfo } from '../../utils/linkConverter';
import Box from "@mui/joy@5.0.0-beta.48/Box";
import Textarea from "@mui/joy@5.0.0-beta.48/Textarea";
import IconButton from "@mui/joy@5.0.0-beta.48/IconButton";
import Checkbox from "@mui/joy@5.0.0-beta.48/Checkbox";
import Typography from "@mui/joy@5.0.0-beta.48/Typography";
import Input from "@mui/joy@5.0.0-beta.48/Input";
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
} from "lucide-react";
import { Block, BlockType, TextElement, TextElementType } from "../../types";
import { SpaceEmbed } from './SpaceEmbed';
import { BlockEmbed } from './BlockEmbed';
import { SpaceLinkAutocomplete } from './SpaceLinkAutocomplete';
import { RichTextRenderer } from './RichTextRenderer';
import { RichTextEditor } from './RichTextEditor';
import { DragHandle } from '../icons/DragHandle';
import { TextElementPreview } from './TextElementPreview';
import { useCrossViewportDrag } from '../../hooks/useCrossViewportDrag';
import { ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';

// Helper components per rendering condizionale
function RenderSpaceEmbed({ spaceId, spacesState, viewportsState }: any) {
  const embeddedSpace = spacesState.getSpace(spaceId);
  
  if (!embeddedSpace) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: '8px' }}>
        <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
          Space non trovato
        </Typography>
      </Box>
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
      <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: '8px' }}>
        <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
          Blocco non trovato
        </Typography>
      </Box>
    );
  }
  
  const embeddedBlock = sourceSpace.content.blocks.find((b: Block) => b.id === blockId);
  
  if (!embeddedBlock) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: '8px' }}>
        <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
          Blocco non trovato
        </Typography>
      </Box>
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
  currentSpaceId?: string; // Per identificare lo space di origine
  currentSpaceName?: string; // Per mostrare nel embed
  spacesState?: any; // Per accedere agli spaces
  viewportsState?: any; // Per navigazione
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
  onEditEnd?: (blockId: string) => void; // Callback quando l'editing termina
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

// Ordine per colonne: dall'alto verso il basso, partendo da sinistra
// Colonna 1: Text, Heading 1, Heading 2, Heading 3, Image
// Colonna 2: Numbered List, Bullet List, Checkbox, Callout, File
// Colonna 3: Divider, Embed, Space Link, Quote, Code
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
  const contentEditableRef = useRef<HTMLDivElement>(null); // Ref per il RichTextEditor
  const contentRef = useRef<HTMLDivElement>(null); // Ref per misurare l'altezza del contenuto
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [dropLinePosition, setDropLinePosition] = useState<
    "top" | "bottom" | null
  >(null);
  const [isFocused, setIsFocused] = useState(false); // Traccia se il blocco ha il focus
  const [contentHeight, setContentHeight] = useState<number>(0); // Altezza dinamica del contenuto

  // Stati per l'autocomplete dei link
  const [showSpaceLinkAutocomplete, setShowSpaceLinkAutocomplete] = useState(false);
  const [spaceLinkPosition, setSpaceLinkPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [linkTriggerIndex, setLinkTriggerIndex] = useState<number>(-1);
  const [isSelectingPageLink, setIsSelectingPageLink] = useState(false); // Stato per sapere se stiamo selezionando da menu
  const [isHandleHovered, setIsHandleHovered] = useState(false); // Stato per hover dell'handle
  const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = useState(0); // Indice selezionato nell'autocomplete

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

  // Check if this block is part of a list group
  const isList = block.type === "bulletList" || block.type === "numberedList" || block.type === "checkbox";
  const prevIsList = prevBlock && (prevBlock.type === "bulletList" || prevBlock.type === "numberedList" || prevBlock.type === "checkbox");
  const nextIsList = nextBlock && (nextBlock.type === "bulletList" || nextBlock.type === "numberedList" || nextBlock.type === "checkbox");
  const isFirstInGroup = isList && !prevIsList;
  const isLastInGroup = isList && !nextIsList;
  const isInGroup = isList && (prevIsList || nextIsList);

  // useDrag per drag interno (stessa page)
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE_TEXT_ELEMENT, // Usa ITEM_TYPE_TEXT_ELEMENT per supportare cross-viewport
    item: () => {
      // Determina drag mode basato sui tasti premuti
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
        fullBlock: block, // Passa tutto il blocco per preservare tutte le proprietà
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Hook per gestire il drag mode dinamico
  const { dragMode, showTooltip } = useCrossViewportDrag(isDragging);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE_TEXT_ELEMENT, // Accetta ITEM_TYPE_TEXT_ELEMENT per consistenza
    hover: (item: any, monitor) => {
      if (!ref.current) return;
      
      // Solo hover per drag interno (stesso space)
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

      // Determina dove mostrare la linea basandosi sulla direzione del drag
      if (dragIndex < hoverIndex) {
        // Dragging down: show line at bottom
        setDropLinePosition("bottom");
      } else {
        // Dragging up: show line at top
        setDropLinePosition("top");
      }
    },
    drop: (item: any) => {
      // Solo drop per drag interno (stesso space + modalità link)
      if (item.sourceSpaceId === currentSpaceId && (!item.dragMode || item.dragMode === 'link')) {
        const dragIndex = item.index;
        const hoverIndex = index;

        if (dragIndex !== hoverIndex) {
          onMove(dragIndex, hoverIndex);
        }
      }
      // Altrimenti lascia che PageEditor gestisca il drop cross-viewport
      
      setDropLinePosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }), // Solo direct drops
      canDrop: monitor.canDrop(),
    }),
  });

  // Connect drag handle to drag functionality
  drag(dragHandleRef);
  drop(ref);

  // useEffect per misurare l'altezza dinamica del contenuto
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }
    };

    // Imposta l'altezza iniziale
    updateHeight();

    // Osserva i cambiamenti di dimensione
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [block.content, block.type]);

  // Handler per rilevare ">>" e attivare l'autocomplete (solo per text elements)
  const handleContentChange = (newContent: string) => {
    // Per i text elements, RichTextEditor gestisce tutto internamente
    // Qui aggiorniamo solo il contenuto
    onUpdate(block.id, { content: newContent });
  };

  // Handler per quando uno space viene selezionato dall'autocomplete
  const handleSpaceSelected = (space: any) => {
    console.log('handleSpaceSelected called', { space, isSelectingPageLink, linkTriggerIndex });
    
    // Se stiamo selezionando da menu per page link
    if (isSelectingPageLink) {
      console.log('Converting to pageLink and updating');
      onConvertBlock(block.id, 'pageLink');
      onUpdate(block.id, { 
        content: `[[${space.id}|${space.title}]]`,
        spaceId: space.id 
      });
      
      setShowSpaceLinkAutocomplete(false);
      setIsSelectingPageLink(false);
      setLinkTriggerIndex(-1);
      
      // Rimuovi il focus per mostrare il blocco pageLink renderizzato
      textareaRef.current?.blur();
      return;
    }
    
    // Altrimenti è un link inline normale
    const content = block.content;
    
    if (linkTriggerIndex !== -1) {
      // Per block.type === "text" usiamo il formato storage direttamente
      if (block.type === "text") {
        // Converti da storage a display per manipolare il testo
        const { displayContent, links } = storageToDisplay(content);
        
        // Inserisci il link alla posizione del cursore con uno spazio dopo
        const beforeTrigger = displayContent.substring(0, linkTriggerIndex);
        const afterTrigger = displayContent.substring(linkTriggerIndex);
        const linkText = space.title;
        const newDisplayContent = beforeTrigger + linkText + ' ' + afterTrigger; // Spazio dopo il link
        
        // Crea il nuovo array di link
        const newLinks: LinkInfo[] = [];
        
        // Aggiungi i link esistenti, aggiustando le posizioni
        links.forEach((link) => {
          if (link.endIndex <= linkTriggerIndex) {
            // Link prima del nuovo link - mantieni posizione
            newLinks.push(link);
          } else if (link.startIndex >= linkTriggerIndex) {
            // Link dopo il nuovo link - sposta in avanti (link + spazio)
            newLinks.push({
              ...link,
              startIndex: link.startIndex + linkText.length + 1, // +1 per lo spazio
              endIndex: link.endIndex + linkText.length + 1,
            });
          }
        });
        
        // Aggiungi il nuovo link
        newLinks.push({
          spaceId: space.id,
          title: space.title,
          startIndex: linkTriggerIndex,
          endIndex: linkTriggerIndex + linkText.length,
          storageStartIndex: 0,
          storageEndIndex: 0,
        });
        
        // Converti da display a storage
        const newStorageContent = displayToStorage(newDisplayContent, newLinks);
        
        // Calcola la posizione del cursore dopo il link inserito (dopo lo spazio)
        const cursorPositionAfterLink = linkTriggerIndex + linkText.length + 1; // +1 per lo spazio
        
        // Aggiorna il contenuto
        onUpdate(block.id, { content: newStorageContent });
        
        // Chiudi l'autocomplete
        setShowSpaceLinkAutocomplete(false);
        setLinkTriggerIndex(-1);
        
        // Rifocalizza il contentEditable e posiziona il cursore dopo il link
        setTimeout(() => {
          if (contentEditableRef.current) {
            contentEditableRef.current.focus();
            
            // Posiziona il cursore dopo il link e lo spazio che segue
            const selection = window.getSelection();
            if (!selection) return;
            
            // Trova tutti i link spans
            const linkSpans = contentEditableRef.current.querySelectorAll('[data-link-id]');
            let targetLinkSpan: Element | null = null;
            
            // Trova lo span del link appena inserito (l'ultimo con questo spaceId)
            linkSpans.forEach((span) => {
              if (span.getAttribute('data-link-id') === space.id) {
                targetLinkSpan = span;
              }
            });
            
            if (targetLinkSpan && targetLinkSpan.nextSibling) {
              // C'è un nodo dopo il link (dovrebbe essere il testo con lo spazio)
              const range = document.createRange();
              const nextNode = targetLinkSpan.nextSibling;
              
              if (nextNode.nodeType === Node.TEXT_NODE) {
                // È un nodo di testo, posiziona dopo lo spazio (posizione 1)
                range.setStart(nextNode, 1);
                range.setEnd(nextNode, 1);
              } else {
                // È un altro elemento, posiziona prima di esso
                range.setStartBefore(nextNode);
                range.setEndBefore(nextNode);
              }
              
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }, 50);
      } else {
        // Per gli altri tipi, usa il vecchio sistema con textarea
        const beforeTrigger = content.substring(0, linkTriggerIndex);
        const afterTrigger = content.substring(linkTriggerIndex);
        const link = `[[${space.id}|${space.title}]]`;
        const newContent = beforeTrigger + link + afterTrigger;
        
        // Calcola la nuova posizione del cursore (dopo il link)
        const newCursorPosition = beforeTrigger.length + link.length;
        
        // Aggiorna il contenuto
        onUpdate(block.id, { content: newContent });
        
        // Chiudi l'autocomplete
        setShowSpaceLinkAutocomplete(false);
        setLinkTriggerIndex(-1);
        
        // Rifocalizza la textarea e posiziona il cursore dopo il link
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 50);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Se l'autocomplete è aperto, gestisci SOLO i tasti per l'autocomplete
    if (showSpaceLinkAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        // Filtra gli spaces in base al contenuto dopo [[
        const searchQuery = linkTriggerIndex !== -1 
          ? block.content.substring(linkTriggerIndex + 2)
          : '';
        const filteredSpaces = (spacesState?.spaces || []).filter((space: any) =>
          space.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          space.id !== currentSpaceId
        );
        setAutocompleteSelectedIndex(prev => Math.min(prev + 1, filteredSpaces.length - 1));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setAutocompleteSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        // Seleziona lo space correntemente evidenziato
        const searchQuery = linkTriggerIndex !== -1 
          ? block.content.substring(linkTriggerIndex + 2)
          : '';
        const filteredSpaces = (spacesState?.spaces || []).filter((space: any) =>
          space.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          space.id !== currentSpaceId
        );
        if (filteredSpaces[autocompleteSelectedIndex]) {
          handleSpaceSelected(filteredSpaces[autocompleteSelectedIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowSpaceLinkAutocomplete(false);
        setLinkTriggerIndex(-1);
        setIsSelectingPageLink(false);
        return;
      }
      // Per qualsiasi altro tasto, lascia che venga gestito normalmente
      // ma non eseguire la logica sottostante
      return;
    }
    
    // Gestione normale dei tasti quando l'autocomplete non è aperto
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const handler = createNextBlock || onCreateNextBlock;
      if (handler) {
        handler(block.id, block.type);
      }
    } else if (e.key === "Backspace") {
      // Se il blocco è vuoto e siamo all'inizio, cancella il blocco e sposta il focus al precedente
      const target = e.target as HTMLElement;
      let isAtStart = false;
      let isEmpty = false;
      
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtStart = textAreaTarget.selectionStart === 0;
        isEmpty = textAreaTarget.value.trim() === '';
      } else {
        // Per contentEditable
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
      
      // Se il blocco è vuoto e siamo all'inizio, cancella il blocco e sposta il focus al precedente
      if (isEmpty && isAtStart && index > 0) {
        e.preventDefault();
        // Cancella il blocco corrente
        if (onDelete) {
          onDelete(block.id);
        }
        // Sposta il focus al blocco precedente
        if (focusBlockByIndex) {
          setTimeout(() => {
            focusBlockByIndex(index - 1, 'end');
          }, 50);
        }
      }
    } else if (e.key === "ArrowUp") {
      // Controlla se è un textarea o contentEditable
      const target = e.target as HTMLElement;
      let isAtStart = false;
      
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        // Per textarea/input, usa selectionStart
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtStart = textAreaTarget.selectionStart === 0;
      } else {
        // Per contentEditable, usa window.getSelection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // Crea un range dall'inizio del contentEditable fino al cursore
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(target);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          // Se la lunghezza del testo prima del cursore è 0, siamo all'inizio
          isAtStart = preCaretRange.toString().length === 0;
        }
      }
      
      if (isAtStart && focusBlockByIndex) {
        e.preventDefault();
        focusBlockByIndex(index - 1);
      }
    } else if (e.key === "ArrowDown") {
      // Controlla se è un textarea o contentEditable
      const target = e.target as HTMLElement;
      let isAtEnd = false;
      
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        // Per textarea/input, usa selectionStart e value
        const textAreaTarget = target as HTMLTextAreaElement;
        isAtEnd = textAreaTarget.selectionStart === textAreaTarget.value.length;
      } else {
        // Per contentEditable, usa window.getSelection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // Crea un range dall'inizio del contentEditable fino al cursore
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(target);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          // Ottieni il testo totale del contentEditable
          const totalLength = target.innerText?.length || 0;
          // Se la lunghezza del testo prima del cursore è uguale alla lunghezza totale, siamo alla fine
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
    // Se è un click (non un drag), apri il menu
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

  // Stili comuni per rimuovere tutti gli effetti visivi
  const noEffectStyles = {
    '&:focus, &:focus-within, &:hover': {
      outline: 'none !important',
      boxShadow: 'none !important',
      border: 'none !important',
    },
    '& input, & textarea, & [contenteditable]': {
      border: 'none !important',
      outline: 'none !important',
      boxShadow: 'none !important',
      lineHeight: '1.5',
    },
    '& input:focus, & textarea:focus, & [contenteditable]:focus': {
      outline: 'none !important',
      boxShadow: 'none !important',
      border: 'none !important',
    },
    '& input:focus-visible, & textarea:focus-visible, & [contenteditable]:focus-visible': {
      outline: 'none !important',
      boxShadow: 'none !important',
    },
  };

  return (
    <Box
      ref={ref}
      data-block-id={block.id}
      sx={{
        position: "relative",
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        opacity: isDragging ? 0.5 : 1,
        // Riduci spacing per liste consecutive
        mt: isInGroup && !isFirstInGroup ? 0.25 : 0.5,
        mb: isInGroup && !isLastInGroup ? 0 : 0.5,
        // Indicatore visivo per liste raggruppate
        ...(isInGroup && {
          '&::before': prevIsList ? {
            content: '""',
            position: 'absolute',
            left: 32,
            top: -2,
            width: 2,
            height: 4,
            bgcolor: 'divider',
          } : {},
        }),
        "&:hover .block-actions": {
          opacity: 1,
        },
      }}
    >
      {/* Drop indicator line - positioned between blocks */}
      {isOver && canDrop && dropLinePosition && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            [dropLinePosition === "top" ? "top" : "bottom"]: dropLinePosition === "top" ? -6 : -6,
            height: "2px",
            bgcolor: "primary.500",
            zIndex: 10,
          }}
        />
      )}

      {/* Left side: unified drag handle + menu button */}
      <Box
        ref={dragHandleRef}
        className="block-actions"
        onClick={handleDragHandleClick}
        onMouseEnter={() => setIsHandleHovered(true)}
        onMouseLeave={() => setIsHandleHovered(false)}
        sx={{
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          p: 0.5,
          borderRadius: "4px",
          opacity: 0,
          transition: "opacity 0.2s",
          flexShrink: 0,
          alignSelf: "stretch",
          height: contentHeight > 0 ? `${contentHeight}px` : 'auto',
          "&:hover": {
            bgcolor: "background.level1",
          },
          "&:active": {
            cursor: "grabbing",
          },
        }}
      >
        <DragHandle isHovered={isHandleHovered} height={contentHeight > 0 ? contentHeight : '100%'} />
      </Box>

      {/* Block content - flex: 1 per occupare tutto lo spazio */}
      <Box ref={contentRef} sx={{ flex: 1, minWidth: 0 }}>
        {block.type === "heading1" && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
            }}
          >
            {toggleHeaderCollapse ? (
              <>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHeaderCollapse(block.id);
                  }}
                  sx={{
                    minWidth: 24,
                    minHeight: 24,
                    flexShrink: 0,
                  }}
                >
                  {block.collapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </IconButton>
                <Textarea
                  value={block.content}
                  onChange={(e) =>
                    onUpdate(block.id, { content: e.target.value })
                  }
                  placeholder={config.placeholder}
                  variant="plain"
                  minRows={1}
                  sx={{
                    flex: 1,
                    fontSize: "2rem",
                    fontWeight: "bold",
                    p: 0,
                    width: "100%",
                    ...noEffectStyles,
                    "& textarea": {
                      textAlign: "center",
                      border: "none !important",
                      outline: "none !important",
                      boxShadow: "none !important",
                    },
                  }}
                  slotProps={{
                    textarea: {
                      ref: textareaRef,
                      onKeyDown: handleKeyDown,
                    },
                  }}
                />
                {/* Spacer box uguale al chevron per mantenere il testo centrato */}
                <Box sx={{ minWidth: 24, minHeight: 24, flexShrink: 0 }} />
              </>
            ) : (
              <Textarea
                value={block.content}
                onChange={(e) =>
                  onUpdate(block.id, { content: e.target.value })
                }
                placeholder={config.placeholder}
                variant="plain"
                minRows={1}
                sx={{
                  flex: 1,
                  fontSize: "2rem",
                  fontWeight: "bold",
                  p: 0,
                  width: "100%",
                  ...noEffectStyles,
                  "& textarea": {
                    textAlign: "center",
                    border: "none !important",
                    outline: "none !important",
                    boxShadow: "none !important",
                  },
                }}
                slotProps={{
                  textarea: {
                    ref: textareaRef,
                    onKeyDown: handleKeyDown,
                  },
                }}
              />
            )}
          </Box>
        )}

        {block.type === "heading2" && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
            }}
          >
            {toggleHeaderCollapse ? (
              <>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHeaderCollapse(block.id);
                  }}
                  sx={{
                    minWidth: 24,
                    minHeight: 24,
                    flexShrink: 0,
                  }}
                >
                  {block.collapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </IconButton>
                <Textarea
                  value={block.content}
                  onChange={(e) =>
                    onUpdate(block.id, { content: e.target.value })
                  }
                  placeholder={config.placeholder}
                  variant="plain"
                  minRows={1}
                  sx={{
                    flex: 1,
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    p: 0,
                    width: "100%",
                    ...noEffectStyles,
                    "& textarea": {
                      textAlign: "center",
                      border: "none !important",
                      outline: "none !important",
                      boxShadow: "none !important",
                      lineHeight: 1.2,
                    },
                  }}
                  slotProps={{
                    textarea: {
                      ref: textareaRef,
                      onKeyDown: handleKeyDown,
                    },
                  }}
                />
                {/* Spacer box uguale al chevron per mantenere il testo centrato */}
                <Box sx={{ minWidth: 24, minHeight: 24, flexShrink: 0 }} />
              </>
            ) : (
              <Textarea
                value={block.content}
                onChange={(e) =>
                  onUpdate(block.id, { content: e.target.value })
                }
                placeholder={config.placeholder}
                variant="plain"
                minRows={1}
                sx={{
                  flex: 1,
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  p: 0,
                  width: "100%",
                  ...noEffectStyles,
                  "& textarea": {
                    textAlign: "center",
                    border: "none !important",
                    outline: "none !important",
                    boxShadow: "none !important",
                  },
                }}
                slotProps={{
                  textarea: {
                    ref: textareaRef,
                    onKeyDown: handleKeyDown,
                  },
                }}
              />
            )}
          </Box>
        )}

        {block.type === "heading3" && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
            }}
          >
            {toggleHeaderCollapse ? (
              <>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHeaderCollapse(block.id);
                  }}
                  sx={{
                    minWidth: 24,
                    minHeight: 24,
                    flexShrink: 0,
                  }}
                >
                  {block.collapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </IconButton>
                <Textarea
                  value={block.content}
                  onChange={(e) =>
                    onUpdate(block.id, { content: e.target.value })
                  }
                  placeholder={config.placeholder}
                  variant="plain"
                  minRows={1}
                  sx={{
                    flex: 1,
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    p: 0,
                    width: "100%",
                    ...noEffectStyles,
                    "& textarea": {
                      textAlign: "center",
                      border: "none !important",
                      outline: "none !important",
                      boxShadow: "none !important",
                    },
                  }}
                  slotProps={{
                    textarea: {
                      ref: textareaRef,
                      onKeyDown: handleKeyDown,
                    },
                  }}
                />
                {/* Spacer box uguale al chevron per mantenere il testo centrato */}
                <Box sx={{ minWidth: 24, minHeight: 24, flexShrink: 0 }} />
              </>
            ) : (
              <Textarea
                value={block.content}
                onChange={(e) =>
                  onUpdate(block.id, { content: e.target.value })
                }
                placeholder={config.placeholder}
                variant="plain"
                minRows={1}
                sx={{
                  flex: 1,
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  p: 0,
                  width: "100%",
                  ...noEffectStyles,
                  "& textarea": {
                    textAlign: "center",
                    border: "none !important",
                    outline: "none !important",
                    boxShadow: "none !important",
                  },
                }}
                slotProps={{
                  textarea: {
                    ref: textareaRef,
                    onKeyDown: handleKeyDown,
                  },
                }}
              />
            )}
          </Box>
        )}

        {block.type === "text" && (
          <RichTextEditor
            content={block.content}
            onChange={(newContent) => handleContentChange(newContent)}
            onKeyDown={handleKeyDown}
            onNavigateUp={() => {
              if (focusBlockByIndex) {
                focusBlockByIndex(index - 1);
              }
            }}
            onNavigateDown={() => {
              if (focusBlockByIndex && totalBlocks && index < totalBlocks - 1) {
                focusBlockByIndex(index + 1);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (onEditEnd) {
                onEditEnd(block.id);
              }
            }}
            placeholder={config.placeholder}
            spacesState={spacesState}
            textareaRef={textareaRef}
            contentEditableRef={contentEditableRef}
            viewportsState={viewportsState}
            onTriggerSpaceLink={(position, triggerIndex) => {
              setSpaceLinkPosition(position);
              setLinkTriggerIndex(triggerIndex);
              setAutocompleteSelectedIndex(0);
              setShowSpaceLinkAutocomplete(true);
            }}
            onLinkContextMenu={(linkId, linkText, position) => {
              setSelectedLinkId(linkId);
              setSelectedLinkText(linkText);
              setLinkContextMenuPosition(position);
              setShowLinkContextMenu(true);
            }}
            brokenLinks={brokenLinks}
            brokenLinksVersion={brokenLinksVersion}
            onBrokenLinkClick={(linkId, position) => {
              setRelinkingLinkId(linkId);
              setRelinkMenuPosition(position);
              setShowRelinkMenu(true);
            }}
            sx={{
              py: '2px',
              px: 0,
              ...noEffectStyles,
            }}
          />
        )}

        {(block.type === "bulletList" ||
          block.type === "numberedList") && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "flex-start",
            }}
          >
            <Typography sx={{ mt: "2px", lineHeight: 1.5, flexShrink: 0 }}>
              {block.type === "bulletList"
                ? "•"
                : `${index + 1}.`}
            </Typography>
            <Textarea
              value={block.content}
              onChange={(e) =>
                handleContentChange(e.target.value)
              }
              placeholder={config.placeholder}
              variant="plain"
              minRows={1}
              sx={{
                flex: 1,
                p: 0,
                ...noEffectStyles,
              }}
              slotProps={{
                textarea: {
                  ref: textareaRef,
                  onKeyDown: handleKeyDown,
                },
              }}
            />
          </Box>
        )}

        {block.type === "checkbox" && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "flex-start",
            }}
          >
            <Checkbox
              checked={block.checked || false}
              onChange={(e) =>
                onUpdate(block.id, { checked: e.target.checked })
              }
              sx={{ mt: "2px", flexShrink: 0 }}
            />
            <Textarea
              value={block.content}
              onChange={(e) =>
                handleContentChange(e.target.value)
              }
              placeholder={config.placeholder}
              variant="plain"
              minRows={1}
              sx={{
                flex: 1,
                p: 0,
                textDecoration: block.checked
                  ? "line-through"
                  : "none",
                opacity: block.checked ? 0.6 : 1,
                ...noEffectStyles,
              }}
              slotProps={{
                textarea: {
                  ref: textareaRef,
                  onKeyDown: handleKeyDown,
                },
              }}
            />
          </Box>
        )}

        {block.type === "quote" && (
          <Box
            sx={{
              borderLeft: "3px solid",
              borderColor: "neutral.outlinedBorder",
              pl: 2,
            }}
          >
            <Textarea
              value={block.content}
              onChange={(e) =>
                handleContentChange(e.target.value)
              }
              placeholder={config.placeholder}
              variant="plain"
              minRows={1}
              sx={{
                p: 0,
                fontStyle: "italic",
                ...noEffectStyles,
              }}
              slotProps={{
                textarea: {
                  ref: textareaRef,
                  onKeyDown: handleKeyDown,
                },
              }}
            />
          </Box>
        )}

        {block.type === "divider" && (
          <Box
            sx={{
              height: "1px",
              bgcolor: "divider",
              my: 1,
            }}
          />
        )}

        {block.type === "callout" && (() => {
          const calloutColor = block.calloutColor || 'default';
          const calloutIcon = block.calloutIcon || 'alert';
          
          const colorMap: Record<string, string> = {
            default: 'background.level1',
            blue: '#E3F2FD',
            green: '#E8F5E9',
            yellow: '#FFF9C4',
            red: '#FFEBEE',
            purple: '#F3E5F5',
          };
          
          const iconMap: Record<string, any> = {
            alert: AlertCircle,
            check: CheckSquare,
            info: AlertCircle,
            quote: Quote,
            code: Code,
            file: FileIcon,
          };
          
          const Icon = iconMap[calloutIcon] || AlertCircle;
          
          return (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                bgcolor: colorMap[calloutColor],
                p: 2,
                borderRadius: "8px",
              }}
            >
              <Icon
                size={20}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <Textarea
                value={block.content}
                onChange={(e) =>
                  onUpdate(block.id, { content: e.target.value })
                }
                placeholder={config.placeholder}
                variant="plain"
                minRows={1}
                sx={{
                  flex: 1,
                  p: 0,
                  backgroundColor: "transparent",
                  ...noEffectStyles,
                }}
                slotProps={{
                  textarea: {
                    ref: textareaRef,
                    onKeyDown: handleKeyDown,
                  },
                }}
              />
            </Box>
          );
        })()}

        {block.type === "code" && (
          <Box
            sx={{
              fontFamily: "monospace",
              bgcolor: "background.level1",
              p: 2,
              borderRadius: "8px",
            }}
          >
            <Textarea
              value={block.content}
              onChange={(e) =>
                onUpdate(block.id, { content: e.target.value })
              }
              placeholder={config.placeholder}
              variant="plain"
              minRows={3}
              sx={{
                p: 0,
                fontFamily: "monospace",
                backgroundColor: "transparent",
                ...noEffectStyles,
              }}
              slotProps={{
                textarea: {
                  ref: textareaRef,
                  onKeyDown: handleKeyDown,
                },
              }}
            />
          </Box>
        )}

        {block.type === "image" && (
          <Box>
            <Input
              value={block.content}
              onChange={(e) =>
                onUpdate(block.id, { content: e.target.value })
              }
              placeholder="Inserisci URL immagine"
              variant="plain"
              sx={{ mb: 1, ...noEffectStyles }}
            />
            {block.content && (
              <Box
                component="img"
                src={block.content}
                alt="Uploaded"
                sx={{
                  maxWidth: "100%",
                  borderRadius: "8px",
                }}
              />
            )}
          </Box>
        )}

        {block.type === "file" && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              p: 2,
              bgcolor: "background.level1",
              borderRadius: "8px",
            }}
          >
            <FileIcon size={20} />
            <Input
              value={block.content}
              onChange={(e) =>
                onUpdate(block.id, { content: e.target.value })
              }
              placeholder="Nome file"
              variant="plain"
              sx={{ flex: 1, ...noEffectStyles }}
            />
          </Box>
        )}

        {block.type === "embed" && (
          <Box>
            <Textarea
              value={block.content}
              onChange={(e) =>
                onUpdate(block.id, { content: e.target.value })
              }
              placeholder="Incolla iframe o codice HTML"
              variant="plain"
              minRows={3}
              sx={{ mb: 1, fontFamily: 'monospace', fontSize: '0.85rem', ...noEffectStyles }}
            />
            {block.content && (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  '& iframe': {
                    width: '100%',
                    minHeight: '400px',
                    border: 'none',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
          </Box>
        )}

        {/* Page Link - blocco che linka a un'altra page */}
        {block.type === "pageLink" && block.spaceId && spacesState && (
          <Box
            onClick={() => {
              if (!viewportsState || !viewportsState.focusedViewportId || !viewportsState.findViewport) {
                console.warn('Cannot navigate: viewportsState not available');
                return;
              }
              
              const focusedViewport = viewportsState.findViewport(viewportsState.focusedViewportId);
              
              if (!focusedViewport || !focusedViewport.activeTabId) {
                console.warn('Cannot navigate: no focused viewport or active tab');
                return;
              }
              
              viewportsState.updateTab(focusedViewport.id, focusedViewport.activeTabId, { spaceId: block.spaceId });
            }}
            sx={{
              p: 2,
              bgcolor: 'background.level1',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'background.level2',
                borderColor: 'primary.500',
              }
            }}
          >
            <Link2 size={20} />
            <Box sx={{ flex: 1 }}>
              <Typography level="body-md">
                {(() => {
                  const linkedSpace = spacesState.getSpace(block.spaceId);
                  return linkedSpace ? linkedSpace.title : 'Page non trovata';
                })()}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                Click to open
              </Typography>
            </Box>
          </Box>
        )}

        {/* Space Embed & Block Embed rendering */}
        {block.type === "spaceEmbed" && block.spaceId && spacesState && (
          <RenderSpaceEmbed 
            spaceId={block.spaceId}
            spacesState={spacesState}
            viewportsState={viewportsState}
          />
        )}
        
        {block.type === "blockEmbed" && block.blockId && block.sourceSpaceId && spacesState && (
          <RenderBlockEmbed
            blockId={block.blockId}
            sourceSpaceId={block.sourceSpaceId}
            spacesState={spacesState}
            viewportsState={viewportsState}
          />
        )}
      </Box>

      {/* Block menu - rendered with Portal */}
      {showMenu && menuPosition && createPortal(
        (() => {
          const menuWidth = 450; // Aumentato per 3 colonne
          const menuHeight = 450;
          
          let top = menuPosition.top;
          let left = menuPosition.left;
          
          // Adjust for window bounds
          if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 8;
          }
          
          if (left < 8) {
            left = 8;
          }
          
          if (top + menuHeight > window.innerHeight) {
            top = menuPosition.top - menuHeight - 32;
          }
          
          if (top < 8) {
            top = 8;
          }
          
          return (
            <>
              <Box
                onClick={() => {
                  setShowMenu(false);
                  setMenuPosition(null);
                }}
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1099
                }}
              />
              <Box
                sx={{
                  position: 'fixed',
                  top: `${top}px`,
                  left: `${left}px`,
                  bgcolor: 'background.popup',
                  boxShadow: 'lg',
                  borderRadius: '8px',
                  p: 0.5,
                  zIndex: 1100,
                  width: menuWidth,
                  maxHeight: menuHeight,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {/* Actions row */}
                <Box sx={{ display: 'flex', gap: 0.3, mb: 0.5 }}>
                  <Box
                    onClick={() => {
                      if (onAddBefore) {
                        onAddBefore(block.id);
                      }
                      setShowMenu(false);
                      setMenuPosition(null);
                    }}
                    sx={{
                      flex: 1,
                      p: 0.5,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.3,
                      '&:hover': {
                        bgcolor: 'background.level1'
                      }
                    }}
                  >
                    <ArrowUp size={14} />
                    <Typography level="body-xs" sx={{ fontSize: '0.65rem' }}>Sopra</Typography>
                  </Box>
                  <Box
                    onClick={() => {
                      if (dragHandleRef.current) {
                        onAddAfter(block.id, dragHandleRef.current);
                      }
                      setShowMenu(false);
                      setMenuPosition(null);
                    }}
                    sx={{
                      flex: 1,
                      p: 0.5,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.3,
                      '&:hover': {
                        bgcolor: 'background.level1'
                      }
                    }}
                  >
                    <ArrowDown size={14} />
                    <Typography level="body-xs" sx={{ fontSize: '0.65rem' }}>Sotto</Typography>
                  </Box>
                  <Box
                    onClick={() => {
                      onDelete(block.id);
                      setShowMenu(false);
                      setMenuPosition(null);
                    }}
                    sx={{
                      flex: 1,
                      p: 0.5,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.3,
                      color: 'danger.500',
                      '&:hover': {
                        bgcolor: 'danger.softBg'
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    <Typography level="body-xs" sx={{ fontSize: '0.65rem' }}>Elimina</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ my: 0.3, height: '1px', bgcolor: 'divider' }} />
                
                <Typography level="body-xs" sx={{ px: 0.5, py: 0.3, mb: 0.3, color: 'text.tertiary', fontSize: '0.65rem' }}>
                  Converti in
                </Typography>
                
                {/* Grid layout a 3 colonne per i tipi di blocco */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.3 }}>
                  {orderedBlockTypes.map((type) => {
                    const Icon = blockTypeIcons[type];
                    return (
                      <Box
                        key={type}
                        onClick={() => {
                          // Caso speciale per pageLink: mostra l'autocomplete
                          if (type === 'pageLink' && spacesState && dragHandleRef.current) {
                            // Chiudi il menu prima
                            setShowMenu(false);
                            setMenuPosition(null);
                            
                            // Usa setTimeout per assicurarsi che il menu si chiuda prima di calcolare la posizione
                            setTimeout(() => {
                              const rect = dragHandleRef.current!.getBoundingClientRect();
                              const position = {
                                top: rect.bottom + 4,
                                left: rect.left + 20,
                              };
                              console.log('Opening pageLink autocomplete', { position, isSelectingPageLink: true });
                              setSpaceLinkPosition(position);
                              setIsSelectingPageLink(true);
                              setAutocompleteSelectedIndex(0); // Reset index
                              setShowSpaceLinkAutocomplete(true);
                            }, 10);
                          } else {
                            onConvertBlock(block.id, type as BlockType);
                            setShowMenu(false);
                            setMenuPosition(null);
                          }
                        }}
                        sx={{
                          px: 0.75,
                          py: 0.5,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 0.75,
                          bgcolor: block.type === type ? 'primary.softBg' : 'transparent',
                          '&:hover': {
                            bgcolor: block.type === type ? 'primary.softHoverBg' : 'background.level1'
                          }
                        }}
                      >
                        <Icon size={16} style={{ flexShrink: 0 }} />
                        <Typography level="body-xs" sx={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blockTypeLabels[type]}</Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Callout options - only show if block is callout */}
                {block.type === 'callout' && (
                  <>
                    <Box sx={{ my: 0.3, height: '1px', bgcolor: 'divider' }} />
                    
                    <Typography level="body-xs" sx={{ px: 0.5, py: 0.3, mb: 0.3, color: 'text.tertiary', fontSize: '0.65rem' }}>
                      Colore
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.3, px: 0.5, mb: 0.5 }}>
                      {['default', 'blue', 'green', 'yellow', 'red', 'purple'].map((color) => (
                        <Box
                          key={color}
                          onClick={() => {
                            onUpdate(block.id, { calloutColor: color });
                          }}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '3px',
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: block.calloutColor === color ? 'primary.500' : 'transparent',
                            bgcolor: color === 'default' ? 'background.level1' : 
                                     color === 'blue' ? '#E3F2FD' :
                                     color === 'green' ? '#E8F5E9' :
                                     color === 'yellow' ? '#FFF9C4' :
                                     color === 'red' ? '#FFEBEE' :
                                     '#F3E5F5',
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                        />
                      ))}
                    </Box>

                    <Typography level="body-xs" sx={{ px: 0.5, py: 0.3, mb: 0.3, color: 'text.tertiary', fontSize: '0.65rem' }}>
                      Icona
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.3, px: 0.5 }}>
                      {[
                        { name: 'alert', icon: AlertCircle },
                        { name: 'check', icon: CheckSquare },
                        { name: 'info', icon: AlertCircle },
                        { name: 'quote', icon: Quote },
                        { name: 'code', icon: Code },
                        { name: 'file', icon: FileIcon }
                      ].map(({ name, icon: Icon }) => (
                        <Box
                          key={name}
                          onClick={() => {
                            onUpdate(block.id, { calloutIcon: name });
                          }}
                          sx={{
                            p: 0.3,
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: block.calloutIcon === name ? 'primary.softBg' : 'transparent',
                            '&:hover': {
                              bgcolor: 'background.level1'
                            }
                          }}
                        >
                          <Icon size={14} />
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </>
          );
        })(),
        document.body
      )}

      {/* Space Link Autocomplete - rendered with Portal */}
      {showSpaceLinkAutocomplete && spacesState && createPortal(
        <SpaceLinkAutocomplete
          spaces={spacesState.spaces}
          onSelect={handleSpaceSelected}
          onClose={() => {
            setShowSpaceLinkAutocomplete(false);
            setLinkTriggerIndex(-1);
          }}
          position={spaceLinkPosition}
          selectedIndex={autocompleteSelectedIndex}
          onSelectedIndexChange={setAutocompleteSelectedIndex}
          currentSpaceId={currentSpaceId}
        />,
        document.body
      )}

      {/* Link Context Menu - rendered with Portal */}
      {showLinkContextMenu && spacesState && createPortal(
        <LinkContextMenu
          linkId={selectedLinkId}
          linkText={selectedLinkText}
          position={linkContextMenuPosition}
          spacesState={spacesState}
          onClose={() => setShowLinkContextMenu(false)}
          onRename={(newTitle) => {
            // Rinomina solo il testo del link, non lo space
            if (block.type === 'text' && block.content) {
              // Per text elements, aggiorna il formato storage [[spaceId:title]]
              const regex = new RegExp(`\\[\\[${selectedLinkId}:([^\\]]+)\\]\\]`, 'g');
              const newContent = block.content.replace(regex, `[[${selectedLinkId}:${newTitle}]]`);
              onUpdate(block.id, { content: newContent });
            } else if (block.content) {
              // Per altri tipi, aggiorna il formato standard [[spaceId|title]]
              const regex = new RegExp(`\\[\\[${selectedLinkId}\\|([^\\]]+)\\]\\]`, 'g');
              const newContent = block.content.replace(regex, `[[${selectedLinkId}|${newTitle}]]`);
              onUpdate(block.id, { content: newContent });
            }
            setShowLinkContextMenu(false);
          }}
          onRelink={(newSpaceId) => {
            // TODO: Implementare la logica di relink
            setShowLinkContextMenu(false);
          }}
          onShowRelinkMenu={() => {
            // Mostra il menu di relink
            setRelinkingLinkId(selectedLinkId);
            setRelinkMenuPosition(linkContextMenuPosition);
            setShowRelinkMenu(true);
            setShowLinkContextMenu(false);
          }}
        />,
        document.body
      )}

      {/* Relink Menu for Broken Links - rendered with Portal */}
      {showRelinkMenu && spacesState && createPortal(
        <SpaceLinkAutocomplete
          spaces={spacesState.spaces}
          onSelect={(space) => {
            // Implementa la logica di relink del broken link
            if (relinkingLinkId && block.content) {
              const oldSpaceId = relinkingLinkId;
              const newSpaceId = space.id;
              const newTitle = space.title;
              
              if (block.type === 'text') {
                // Per text elements, aggiorna il formato storage
                const regex = new RegExp(`\\[\\[${oldSpaceId}:([^\\]]+)\\]\\]`, 'g');
                const newContent = block.content.replace(regex, `[[${newSpaceId}:${newTitle}]]`);
                onUpdate(block.id, { content: newContent });
              } else {
                // Per altri tipi di blocchi, aggiorna il formato standard
                const regex = new RegExp(`\\[\\[${oldSpaceId}\\|([^\\]]+)\\]\\]`, 'g');
                const newContent = block.content.replace(regex, `[[${newSpaceId}|${newTitle}]]`);
                onUpdate(block.id, { content: newContent });
              }
            }
            setShowRelinkMenu(false);
            setRelinkingLinkId('');
          }}
          onClose={() => {
            setShowRelinkMenu(false);
            setRelinkingLinkId('');
          }}
          position={relinkMenuPosition}
          selectedIndex={0}
          onSelectedIndexChange={() => {}}
        />,
        document.body
      )}
    </Box>
  );
}