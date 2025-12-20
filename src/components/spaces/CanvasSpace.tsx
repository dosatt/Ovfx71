import { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Button, Input, Slider, Divider } from '@heroui/react';
import {
  Pencil,
  Square,
  Circle,
  Type,
  Trash2,
  MousePointer,
  ArrowRight,
  Minus,
  Maximize2,
  ChevronDown,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  Check,
  Palette,
  Map
} from 'lucide-react';
import { Space } from '../../types';
import { ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { CanvasSpaceEmbed } from './CanvasSpaceEmbed';
import { CanvasBlockEmbed } from './CanvasBlockEmbed';
import { useHistory } from '../../contexts/HistoryContext';

type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'line';

// Canvas dimensions - area limitata ma grande
const CANVAS_WIDTH = 10000;
const CANVAS_HEIGHT = 8000;

// Color presets (same as IconPicker)
const COLOR_PRESETS = [
  { name: 'Verde', value: '#01BC2B' },
  { name: 'Turchese', value: '#05BCC6' },
  { name: 'Blu', value: '#0181BE' },
  { name: 'Azzurro', value: '#039CF6' },
  { name: 'Giallo', value: '#F8D501' },
  { name: 'Arancio', value: '#FF9900' },
  { name: 'Rosso', value: '#FF0100' },
  { name: 'Viola', value: '#9D01FD' },
  { name: 'Grigio scuro', value: '#474747' },
  { name: 'Grigio medio', value: '#9B9B9B' },
  { name: 'Bianco', value: '#FFFFFF' },
  { name: 'Nero', value: '#000000' }
];

// Stroke width presets
const STROKE_PRESETS = [1, 2, 4, 6, 8];

interface CanvasElement {
  id: string;
  type: 'path' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'line' | 'spaceEmbed' | 'blockEmbed';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  points?: string;
  color: string;
  strokeWidth: number;
  spaceId?: string; // For space embeds
  spaceName?: string; // For space embeds
  spaceType?: string; // For space embeds
  blockId?: string; // For block embeds
  sourceSpaceId?: string; // For block embeds
  blockType?: string; // For block embeds
  blockContent?: string; // For block embeds
  // For arrows with anchors
  anchorStart?: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left' };
  anchorEnd?: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left' };
  // For grouping
  groupId?: string;
}

interface CanvasSpaceProps {
  space: Space;
  spacesState: any;
  onNavigateToSpace?: (spaceId: string) => void;
}

export function CanvasSpace({ space, spacesState, onNavigateToSpace }: CanvasSpaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const { pushAction } = useHistory();
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<CanvasElement[]>(space.content?.elements || []);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [viewBox, setViewBox] = useState({ x: -1200, y: -800, width: 2400, height: 1600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [isResizingElement, setIsResizingElement] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartBounds, setElementStartBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [drawingMenuOpen, setDrawingMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [strokeMenuOpen, setStrokeMenuOpen] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [arrowSnapStart, setArrowSnapStart] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [arrowSnapPreview, setArrowSnapPreview] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const hasMouseMovedRef = useRef(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementIds: string[] } | null>(null);
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
  const draggingIdsRef = useRef<string[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  
  // Refs per i dropdown menu della toolbar
  const drawingMenuButtonRef = useRef<HTMLButtonElement>(null);
  const colorMenuButtonRef = useRef<HTMLButtonElement>(null);
  const strokeMenuButtonRef = useRef<HTMLButtonElement>(null);

  // useDrop hook MUST be declared before any regular functions
  const [{ isOver }, drop] = useDrop({
    accept: [ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT],
    drop: (item: any, monitor) => {
      // Get drop position relative to the canvas container
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !svgRef.current) return;

      // Convert client coordinates to SVG coordinates
      const svg = svgRef.current;
      const CTM = svg.getScreenCTM();
      if (!CTM) return;

      const svgX = (clientOffset.x - CTM.e) / CTM.a;
      const svgY = (clientOffset.y - CTM.f) / CTM.d;

      let newElement: CanvasElement;

      // Handle textElement drop
      if (item.itemType === ITEM_TYPE_TEXT_ELEMENT) {
        // Crea un blockEmbed per mostrare l'anteprima del textElement
        newElement = {
          id: `el_${Date.now()}`,
          type: 'blockEmbed',
          x: svgX - 200, // Center horizontally
          y: svgY - 50, // Center vertically
          width: 400,
          height: 100,
          color: '#1976d2',
          strokeWidth: 2,
          blockId: item.blockId || item.id,
          sourceSpaceId: item.sourceSpaceId,
          blockType: item.blockType,
          blockContent: item.content || '',
        };
      } 
      // Handle space drop from sidebar
      else {
        // Impedisci di droppare uno space su se stesso
        const droppedSpaceId = item.spaceId || item.id;
        if (droppedSpaceId === space.id) {
          console.log('Cannot drop a space onto itself');
          return;
        }

        newElement = {
          id: `el_${Date.now()}`,
          type: 'spaceEmbed',
          x: svgX - 200, // Center the element
          y: svgY - 150,
          width: item.spaceData?.type === 'page' ? 700 : 400,
          height: item.spaceData?.type === 'page' ? 600 : 300,
          color: '#1976d2',
          strokeWidth: 2,
          spaceId: item.spaceId || item.id,
          spaceName: item.spaceData?.title || 'Unknown',
          spaceType: item.spaceData?.type || 'page'
        };
      }
      
      // Animazione: create elemento con scala 0 e poi anima a scala 1
      const elementId = newElement.id;
      
      // Use functional update to avoid stale closure
      setElements(prevElements => {
        const updatedElements = [...prevElements, newElement];
        // Update space content with correct elements
        spacesState.updateSpace(space.id, {
          content: { elements: updatedElements }
        });
        
        // Anima l'elemento dopo un frame
        requestAnimationFrame(() => {
          const svgElement = document.querySelector(`[data-element-id="${elementId}"]`);
          if (svgElement) {
            // Applica animazione di scala
            svgElement.animate([
              { transform: 'scale(0)', opacity: 0 },
              { transform: 'scale(1)', opacity: 1 }
            ], {
              duration: 300,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
          }
        });
        
        return updatedElements;
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });

  // Sincronizza gli elementi quando lo space viene aggiornato
  useEffect(() => {
    if (space.content?.elements) {
      setElements(space.content.elements);
    }
  }, [space.content]);

  const saveElements = (newElements: CanvasElement[]) => {
    setElements(newElements);
    spacesState.updateSpace(space.id, {
      content: { elements: newElements }
    });
  };

  const saveElementsWithHistory = (
    newElements: CanvasElement[], 
    oldElements: CanvasElement[], 
    description: string
  ) => {
    // Crea copie profonde per evitare problemi con le closure
    const oldElementsCopy = JSON.parse(JSON.stringify(oldElements));
    const newElementsCopy = JSON.parse(JSON.stringify(newElements));
    
    saveElements(newElements);
    
    pushAction({
      type: 'canvas',
      description,
      undo: () => {
        saveElements(oldElementsCopy);
      },
      redo: () => {
        saveElements(newElementsCopy);
      }
    });
  };

  // Gestione tasti Backspace/Delete per eliminare elementi selezionati
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se si sta editando del testo
      if (editingTextId) return;
      
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.length > 0) {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editingTextId]);

  // Scorciatoie da tastiera per cambiare strumento quando tool === 'select'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se si sta editando del testo o se il tool non è 'select'
      if (editingTextId || tool !== 'select') return;
      
      // Previene il comportamento di default solo se la scorciatoia è valida
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          // S torna già a select, non serve fare nulla
          break;
        case 't':
          e.preventDefault();
          setTool('text');
          break;
        case 'p':
          e.preventDefault();
          setTool('pen');
          break;
        case 'r':
          e.preventDefault();
          setTool('rectangle');
          break;
        case 'c':
          e.preventDefault();
          setTool('circle');
          break;
        case 'l':
          e.preventDefault();
          setTool('line');
          break;
        case 'a':
          e.preventDefault();
          setTool('arrow');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, editingTextId]);

  // Calcola i punti di snap sui lati di un elemento
  const getSnapPoints = (element: CanvasElement): { top: { x: number; y: number }, right: { x: number; y: number }, bottom: { x: number; y: number }, left: { x: number; y: number } } | null => {
    const bounds = getElementBounds(element);
    if (!bounds) return null;

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    return {
      top: { x: centerX, y: bounds.y },
      right: { x: bounds.x + bounds.width, y: centerY },
      bottom: { x: centerX, y: bounds.y + bounds.height },
      left: { x: bounds.x, y: centerY }
    };
  };

  // Trova il punto di snap più vicino al cursore
  const getClosestSnapPoint = (pos: { x: number; y: number }, element: CanvasElement): { x: number; y: number; side: 'top' | 'right' | 'bottom' | 'left' } | null => {
    const snapPoints = getSnapPoints(element);
    if (!snapPoints) return null;

    const distances = [
      { side: 'top' as const, point: snapPoints.top, distance: Math.hypot(pos.x - snapPoints.top.x, pos.y - snapPoints.top.y) },
      { side: 'right' as const, point: snapPoints.right, distance: Math.hypot(pos.x - snapPoints.right.x, pos.y - snapPoints.right.y) },
      { side: 'bottom' as const, point: snapPoints.bottom, distance: Math.hypot(pos.x - snapPoints.bottom.x, pos.y - snapPoints.bottom.y) },
      { side: 'left' as const, point: snapPoints.left, distance: Math.hypot(pos.x - snapPoints.left.x, pos.y - snapPoints.left.y) }
    ];

    const closest = distances.reduce((min, curr) => curr.distance < min.distance ? curr : min);
    return { ...closest.point, side: closest.side };
  };

  // Trova l'elemento sotto il cursore
  const getElementAtPosition = (pos: { x: number; y: number }): CanvasElement | null => {
    // Itera in ordine inverso per trovare l'elemento più in alto
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const bounds = getElementBounds(element);
      if (!bounds) continue;

      if (
        pos.x >= bounds.x &&
        pos.x <= bounds.x + bounds.width &&
        pos.y >= bounds.y &&
        pos.y <= bounds.y + bounds.height
      ) {
        return element;
      }
    }
    return null;
  };

  // Handler per il tasto ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Annulla l'operazione di creazione freccia
        if (tool === 'arrow' && (arrowSnapStart || isDrawing)) {
          setArrowSnapStart(null);
          setArrowSnapPreview(null);
          setIsDrawing(false);
          setCurrentElement(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, arrowSnapStart, isDrawing]);

  // Focus sulla textarea quando si inizia a editare il testo
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      // Usa un delay più lungo per assicurarsi che il rendering sia completato
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editingTextId]);

  // Chiudi i menu dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Controlla se il click è fuori dai menu
      // In Hero UI dropdowns handle outside clicks automatically, but custom dropdowns need this
      if (drawingMenuOpen && drawingMenuButtonRef.current && !drawingMenuButtonRef.current.contains(target) && !target.closest('.custom-dropdown')) {
        setDrawingMenuOpen(false);
      }
      if (colorMenuOpen && colorMenuButtonRef.current && !colorMenuButtonRef.current.contains(target) && !target.closest('.custom-dropdown')) {
        setColorMenuOpen(false);
      }
      if (strokeMenuOpen && strokeMenuButtonRef.current && !strokeMenuButtonRef.current.contains(target) && !target.closest('.custom-dropdown')) {
        setStrokeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [drawingMenuOpen, colorMenuOpen, strokeMenuOpen]);

  const getMousePos = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };

    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    hasMouseMovedRef.current = false; // Reset flag movimento mouse
    
    // Chiudi il context menu se aperto
    if (contextMenu) {
      setContextMenu(null);
    }
    
    // Gestisci click destro sull'SVG quando ci sono elementi selezionati
    if (e.button === 2 && selectedIds.length > 0 && tool === 'select') {
      e.preventDefault();
      handleContextMenu(e, selectedIds);
      return;
    }
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const pos = getMousePos(e);

    if (tool === 'select') {
      // Controlla se si sta cliccando su un elemento
      const clickedElement = getElementAtPosition(pos);
      
      if (!clickedElement) {
        // Se non si clicca su un elemento, inizia il rettangolo di selezione
        setSelectionStart(pos);
        // Azzera la selezione solo se NON si tiene premuto Shift
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
      }
      return;
    }
    
    // Gestione speciale per il tool testo
    if (tool === 'text') {
      const newElement: CanvasElement = {
        id: `el_${Date.now()}`,
        type: 'text',
        x: pos.x,
        y: pos.y,
        color,
        strokeWidth,
        text: 'Inserisci testo qui'
      };
      const oldElements = [...elements];
      const newElements = [...elements, newElement];
      saveElementsWithHistory(newElements, oldElements, 'Testo aggiunto');
      setEditingTextId(newElement.id);
      setEditingTextValue('Inserisci testo qui');
      // Torna automaticamente allo strumento selezione
      setTool('select');
      return;
    }
    
    // Gestione speciale per le frecce con snapping
    if (tool === 'arrow') {
      const elementAt = getElementAtPosition(pos);
      if (elementAt) {
        // Primo click: snap all'elemento
        const snapPoint = getClosestSnapPoint(pos, elementAt);
        if (snapPoint) {
          setArrowSnapStart({ ...snapPoint, elementId: elementAt.id });
          setIsDrawing(true);
          setSelectedIds([]);
          return;
        }
      } else if (arrowSnapStart) {
        // Secondo click senza elemento: crea freccia normale da snap start
        return;
      }
    }

    setIsDrawing(true);
    setSelectedIds([]);

    const newElement: CanvasElement = {
      id: `el_${Date.now()}`,
      type: tool === 'pen' ? 'path' : tool as any,
      x: tool === 'arrow' && arrowSnapStart ? arrowSnapStart.x : pos.x,
      y: tool === 'arrow' && arrowSnapStart ? arrowSnapStart.y : pos.y,
      color,
      strokeWidth,
      points: tool === 'pen' ? `${pos.x},${pos.y}` : undefined
    };

    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    hasMouseMovedRef.current = true; // Segna che il mouse si è mosso
    
    if (isPanning) {
      const dx = (panStart.x - e.clientX) * 2;
      const dy = (panStart.y - e.clientY) * 2;
      setViewBox(prev => {
        // Calcola nuove coordinate
        let newX = prev.x + dx;
        let newY = prev.y + dy;
        
        // Limita il panning ai bordi del canvas
        // Se il viewBox è più grande del canvas (zoom out), centra il canvas
        if (prev.width >= CANVAS_WIDTH) {
          newX = -CANVAS_WIDTH / 2 - (prev.width - CANVAS_WIDTH) / 2;
        } else {
          const minX = -CANVAS_WIDTH / 2;
          const maxX = CANVAS_WIDTH / 2 - prev.width;
          newX = Math.max(minX, Math.min(maxX, newX));
        }
        
        if (prev.height >= CANVAS_HEIGHT) {
          newY = -CANVAS_HEIGHT / 2 - (prev.height - CANVAS_HEIGHT) / 2;
        } else {
          const minY = -CANVAS_HEIGHT / 2;
          const maxY = CANVAS_HEIGHT / 2 - prev.height;
          newY = Math.max(minY, Math.min(maxY, newY));
        }
        
        return {
          ...prev,
          x: newX,
          y: newY
        };
      });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDraggingElement) {
      handleBoundingBoxMouseMove(e);
      return;
    }

    if (isResizingElement) {
      handleResizeMouseMove(e);
      return;
    }

    const pos = getMousePos(e);

    // Rettangolo di selezione con il tool select
    if (tool === 'select' && selectionStart) {
      const width = pos.x - selectionStart.x;
      const height = pos.y - selectionStart.y;
      setSelectionBox({
        x: width >= 0 ? selectionStart.x : selectionStart.x + width,
        y: height >= 0 ? selectionStart.y : selectionStart.y + height,
        width: Math.abs(width),
        height: Math.abs(height)
      });
      return;
    }

    // Preview del punto di snap per le frecce
    if (tool === 'arrow') {
      const elementAt = getElementAtPosition(pos);
      if (elementAt) {
        const snapPoint = getClosestSnapPoint(pos, elementAt);
        if (snapPoint) {
          setArrowSnapPreview(snapPoint);
        } else {
          setArrowSnapPreview(null);
        }
      } else {
        setArrowSnapPreview(null);
      }
      
      // Se abbiamo già il punto di partenza, mostra anteprima della freccia
      if (arrowSnapStart && !isDrawing) {
        setCurrentElement({
          id: 'preview',
          type: 'arrow',
          x: arrowSnapStart.x,
          y: arrowSnapStart.y,
          width: pos.x - arrowSnapStart.x,
          height: pos.y - arrowSnapStart.y,
          color,
          strokeWidth
        });
      } else if (!arrowSnapStart) {
        setCurrentElement(null);
      }
    }

    if (!isDrawing || !currentElement) return;

    if (tool === 'pen') {
      setCurrentElement({
        ...currentElement,
        points: `${currentElement.points} ${pos.x},${pos.y}`
      });
    } else if (tool === 'rectangle') {
      setCurrentElement({
        ...currentElement,
        width: pos.x - currentElement.x,
        height: pos.y - currentElement.y
      });
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(pos.x - currentElement.x, 2) + Math.pow(pos.y - currentElement.y, 2)
      );
      setCurrentElement({
        ...currentElement,
        radius
      });
    } else if (tool === 'arrow' || tool === 'line') {
      // Per le frecce con snap, controlla se il mouse è sopra un elemento
      if (tool === 'arrow' && arrowSnapStart) {
        const elementAt = getElementAtPosition(pos);
        if (elementAt && elementAt.id !== arrowSnapStart.elementId) {
          const snapPoint = getClosestSnapPoint(pos, elementAt);
          if (snapPoint) {
            setCurrentElement({
              ...currentElement,
              width: snapPoint.x - currentElement.x,
              height: snapPoint.y - currentElement.y
            });
            return;
          }
        }
      }
      
      setCurrentElement({
        ...currentElement,
        width: pos.x - currentElement.x,
        height: pos.y - currentElement.y
      });
    }
  };

  const handleMouseUp = (e?: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingElement) {
      handleBoundingBoxMouseUp();
      return;
    }

    if (isResizingElement) {
      handleResizeMouseUp();
      return;
    }

    // Rettangolo di selezione: seleziona tutti gli elementi dentro il box
    if (tool === 'select' && selectionBox) {
      // Trova TUTTI gli elementi dentro il rettangolo di selezione
      const selectedElements = elements.filter(el => {
        const bounds = getElementBounds(el);
        if (!bounds) return false;
        
        // Verifica se l'elemento interseca il rettangolo di selezione
        return !(
          bounds.x + bounds.width < selectionBox.x ||
          bounds.x > selectionBox.x + selectionBox.width ||
          bounds.y + bounds.height < selectionBox.y ||
          bounds.y > selectionBox.y + selectionBox.height
        );
      });
      
      // Seleziona TUTTI gli elementi trovati
      if (selectedElements.length > 0) {
        const newIds = selectedElements.map(el => el.id);
        
        // Se Shift è premuto, aggiungi alla selezione esistente
        if (e?.shiftKey) {
          setSelectedIds(prev => {
            // Unisci le selezioni rimuovendo i duplicati
            const combined = [...prev, ...newIds];
            return Array.from(new Set(combined));
          });
        } else {
          // Altrimenti sostituisci la selezione
          setSelectedIds(newIds);
        }
      }
      
      setSelectionBox(null);
      setSelectionStart(null);
      return;
    }

    // Se tool è select, non c'è stato movimento, e si è cliccato su area vuota, deseleziona
    if (tool === 'select' && selectionStart && !hasMouseMovedRef.current && !e?.shiftKey) {
      setSelectedIds([]);
      setSelectionStart(null);
      return;
    }

    // Resetta selectionStart se tool è select
    if (tool === 'select' && selectionStart) {
      setSelectionStart(null);
    }

    if (currentElement && isDrawing) {
      if (tool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          const oldElements = [...elements];
          const newElements = [...elements, { ...currentElement, text }];
          saveElementsWithHistory(newElements, oldElements, 'Testo aggiunto');
        }
      } else if (tool === 'arrow' && arrowSnapStart) {
        // Verifica se il mouse è sopra un elemento per il secondo ancoraggio
        const pos = getMousePos({ clientX: 0, clientY: 0 } as any); // Ottieni l'ultima posizione
        const elementAt = getElementAtPosition({ 
          x: currentElement.x + (currentElement.width || 0), 
          y: currentElement.y + (currentElement.height || 0) 
        });
        
        if (elementAt && elementAt.id !== arrowSnapStart.elementId) {
          const snapPoint = getClosestSnapPoint({ 
            x: currentElement.x + (currentElement.width || 0), 
            y: currentElement.y + (currentElement.height || 0) 
          }, elementAt);
          
          if (snapPoint) {
            // Salva la freccia con entrambi gli ancoraggi
            const arrowWithAnchors = {
              ...currentElement,
              anchorStart: { elementId: arrowSnapStart.elementId, side: arrowSnapStart.side || 'top' as const },
              anchorEnd: { elementId: elementAt.id, side: snapPoint.side }
            };
            const oldElements = [...elements];
            const newElements = [...elements, arrowWithAnchors];
            saveElementsWithHistory(newElements, oldElements, 'Freccia aggiunta');
            setArrowSnapStart(null);
            setArrowSnapPreview(null);
            setIsDrawing(false);
            setCurrentElement(null);
            // Torna automaticamente allo strumento selezione
            setTool('select');
            return;
          }
        }
        
        // Se non c'è un secondo ancoraggio, salva la freccia con solo l'ancoraggio iniziale
        const arrowWithOneAnchor = {
          ...currentElement,
          anchorStart: { elementId: arrowSnapStart.elementId, side: arrowSnapStart.side || 'top' as const }
        };
        const oldElements = [...elements];
        const newElements = [...elements, arrowWithOneAnchor];
        saveElementsWithHistory(newElements, oldElements, 'Freccia aggiunta');
        setArrowSnapStart(null);
        setArrowSnapPreview(null);
        // Torna automaticamente allo strumento selezione
        setTool('select');
      } else {
        const oldElements = [...elements];
        const newElements = [...elements, currentElement];
        const typeMap: { [key: string]: string } = {
          pen: 'Disegno',
          rectangle: 'Rettangolo',
          circle: 'Cerchio',
          line: 'Linea'
        };
        const description = typeMap[tool] ? `${typeMap[tool]} aggiunto` : 'Elemento aggiunto';
        saveElementsWithHistory(newElements, oldElements, description);
        // Torna automaticamente allo strumento selezione per pen, rectangle, circle, line
        if (['pen', 'rectangle', 'circle', 'line'].includes(tool)) {
          setTool('select');
        }
      }
    }

    setIsDrawing(false);
    setCurrentElement(null);
  };

  const clearCanvas = () => {
    const oldElements = [...elements];
    saveElementsWithHistory([], oldElements, 'Canvas svuotato');
  };

  const deleteSelected = () => {
    if (selectedIds.length > 0) {
      const oldElements = [...elements];
      const newElements = elements.filter(e => !selectedIds.includes(e.id));
      const count = selectedIds.length;
      
      saveElementsWithHistory(
        newElements,
        oldElements,
        `Eliminat${count > 1 ? 'i' : 'o'} ${count} element${count > 1 ? 'i' : 'o'}`
      );
      setSelectedIds([]);
    }
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const oldElements = [...elements];
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const others = elements.filter(e => !selectedIds.includes(e.id));
    const newElements = [...others, ...selected];
    saveElementsWithHistory(newElements, oldElements, 'Portato in primo piano');
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const oldElements = [...elements];
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const others = elements.filter(e => !selectedIds.includes(e.id));
    const newElements = [...selected, ...others];
    saveElementsWithHistory(newElements, oldElements, 'Portato in secondo piano');
  };

  const groupElements = () => {
    if (selectedIds.length < 2) return;
    const oldElements = [...elements];
    const groupId = `group_${Date.now()}`;
    const newElements = elements.map(el => 
      selectedIds.includes(el.id) ? { ...el, groupId } : el
    );
    saveElementsWithHistory(newElements, oldElements, 'Elementi raggruppati');
  };

  const ungroupElements = () => {
    if (selectedIds.length === 0) return;
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    const groupIds = Array.from(new Set(selectedElements.map(e => e.groupId).filter(Boolean)));
    if (groupIds.length === 0) return;
    
    const oldElements = [...elements];
    const newElements = elements.map(el => {
      if (el.groupId && groupIds.includes(el.groupId)) {
        const { groupId, ...rest } = el;
        return rest as CanvasElement;
      }
      return el;
    });
    saveElementsWithHistory(newElements, oldElements, 'Gruppo separato');
  };

  const handleContextMenu = (e: React.MouseEvent, elementIds: string[]) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementIds
    });
  };

  // Calcola il bounding box di un elemento
  const getElementBounds = (element: CanvasElement): { x: number; y: number; width: number; height: number } | null => {
    switch (element.type) {
      case 'path':
        if (!element.points) return null;
        const coords = element.points.split(' ').map(p => {
          const [x, y] = p.split(',').map(Number);
          return { x, y };
        });
        if (coords.length === 0) return null;
        let minX = coords[0].x;
        let minY = coords[0].y;
        let maxX = coords[0].x;
        let maxY = coords[0].y;
        coords.forEach(({ x, y }) => {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      
      case 'rectangle':
        if (!element.width || !element.height) return null;
        return {
          x: element.width > 0 ? element.x : element.x + element.width,
          y: element.height > 0 ? element.y : element.y + element.height,
          width: Math.abs(element.width),
          height: Math.abs(element.height)
        };
      
      case 'circle':
        if (!element.radius) return null;
        return {
          x: element.x - element.radius,
          y: element.y - element.radius,
          width: element.radius * 2,
          height: element.radius * 2
        };
      
      case 'line':
      case 'arrow':
        if (!element.width || !element.height) return null;
        return {
          x: Math.min(element.x, element.x + element.width),
          y: Math.min(element.y, element.y + element.height),
          width: Math.abs(element.width),
          height: Math.abs(element.height)
        };
      
      case 'text':
        // Calcola dimensioni del testo basate su fontSize e lunghezza
        const fontSize = element.fontSize || 16;
        const text = element.text || '';
        // Approssimazione: larghezza = caratteri * fontSize * 0.6, altezza = fontSize * 1.2
        const textWidth = Math.max(text.length * fontSize * 0.6, 20);
        const textHeight = fontSize * 1.2;
        return {
          x: element.x - 5,
          y: element.y - textHeight - 5,
          width: textWidth + 10,
          height: textHeight + 10
        };
      
      case 'spaceEmbed':
        if (!element.width || !element.height) return null;
        // Il bounding box deve corrispondere esattamente al foreignObject
        return {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        };
      
      case 'blockEmbed':
        if (!element.width || !element.height) return null;
        // Il bounding box deve corrispondere esattamente al foreignObject
        return {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        };
      
      default:
        return null;
    }
  };

  // Muove un elemento di dx, dy
  const moveElement = (element: CanvasElement, dx: number, dy: number): CanvasElement => {
    switch (element.type) {
      case 'path':
        if (!element.points) return element;
        const newPoints = element.points.split(' ').map(p => {
          const [x, y] = p.split(',').map(Number);
          return `${x + dx},${y + dy}`;
        }).join(' ');
        return { ...element, points: newPoints };
      
      case 'circle':
      case 'text':
        return { ...element, x: element.x + dx, y: element.y + dy };
      
      default:
        // rectangle, triangle, arrow, spaceEmbed
        return { ...element, x: element.x + dx, y: element.y + dy };
    }
  };

  const elementsDragStartRef = useRef<CanvasElement[]>([]);

  const handleBoundingBoxMouseDown = (e: React.MouseEvent) => {
    if (selectedIds.length === 0) return;
    e.stopPropagation();
    // Resetta hoveredId per evitare flickering
    setHoveredId(null);
    setIsDraggingElement(true);
    const pos = getMousePos(e as any);
    setDragStart(pos);
    // Salva lo stato iniziale per la cronologia
    elementsDragStartRef.current = [...elements];
  };

  const handleBoundingBoxMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingElement) return;
    const pos = getMousePos(e as any);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    
    // Usa draggingIdsRef se disponibile, altrimenti usa selectedIds
    const idsToMove = draggingIdsRef.current.length > 0 ? draggingIdsRef.current : selectedIds;
    
    // Aggiorna solo lo state locale, NON spacesState
    setElements(prevElements => {
      return prevElements.map(el => {
        // Sposta tutti gli elementi da trascinare
        if (idsToMove.includes(el.id)) {
          return moveElement(el, dx, dy);
        }
        // Aggiorna le frecce ancorate agli elementi spostati
        if (el.type === 'arrow' && (
          (el.anchorStart?.elementId && idsToMove.includes(el.anchorStart.elementId)) ||
          (el.anchorEnd?.elementId && idsToMove.includes(el.anchorEnd.elementId))
        )) {
          const movedElementId = el.anchorStart?.elementId && idsToMove.includes(el.anchorStart.elementId)
            ? el.anchorStart.elementId
            : el.anchorEnd?.elementId;
          const movedElement = prevElements.find(e => e.id === movedElementId);
          if (!movedElement) return el;
          
          let newX = el.x;
          let newY = el.y;
          let newWidth = el.width || 0;
          let newHeight = el.height || 0;
          
          // Aggiorna il punto di partenza se ancorato a un elemento spostato
          if (el.anchorStart?.elementId && idsToMove.includes(el.anchorStart.elementId)) {
            const anchoredElement = prevElements.find(e => e.id === el.anchorStart!.elementId);
            if (anchoredElement) {
              const snapPoints = getSnapPoints(moveElement(anchoredElement, dx, dy));
              if (snapPoints) {
                const newSnapPoint = snapPoints[el.anchorStart.side];
                newX = newSnapPoint.x;
                newY = newSnapPoint.y;
                newWidth = (el.x + (el.width || 0)) - newSnapPoint.x;
                newHeight = (el.y + (el.height || 0)) - newSnapPoint.y;
              }
            }
          }
          
          // Aggiorna il punto finale se ancorato a un elemento spostato
          if (el.anchorEnd?.elementId && idsToMove.includes(el.anchorEnd.elementId)) {
            const anchoredElement = prevElements.find(e => e.id === el.anchorEnd!.elementId);
            if (anchoredElement) {
              const snapPoints = getSnapPoints(moveElement(anchoredElement, dx, dy));
              if (snapPoints) {
                const newSnapPoint = snapPoints[el.anchorEnd.side];
                newWidth = newSnapPoint.x - el.x;
                newHeight = newSnapPoint.y - el.y;
              }
            }
          }
          
          return {
            ...el,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          };
        }
        return el;
      });
    });
    setDragStart(pos);
  };

  const handleBoundingBoxMouseUp = () => {
    setIsDraggingElement(false);
    draggingIdsRef.current = []; // Reset
    
    // Salva su spacesState con cronologia
    const oldElements = elementsDragStartRef.current;
    const newElements = [...elements];
    const count = selectedIds.length;
    
    // Solo se c'è stato un vero spostamento
    if (JSON.stringify(oldElements) !== JSON.stringify(newElements)) {
      saveElementsWithHistory(
        newElements,
        oldElements,
        `Spostato${count > 1 ? 'i' : ''} ${count} element${count > 1 ? 'i' : 'o'}`
      );
    } else {
      // Se non c'è stato spostamento, salva comunque per sicurezza
      spacesState.updateSpace(space.id, {
        content: { elements }
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w') => {
    if (selectedIds.length === 0) return;
    e.stopPropagation();
    setIsResizingElement(true);
    const pos = getMousePos(e as any);
    setDragStart(pos);
    setResizeHandle(handle);
    const selectedElement = elements.find(el => el.id === selectedIds[0]);
    if (selectedElement) {
      const bounds = getElementBounds(selectedElement);
      if (bounds) {
        setElementStartBounds(bounds);
      }
    }
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (!isResizingElement || !elementStartBounds || !resizeHandle) return;
    const pos = getMousePos(e as any);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    
    // Aggiorna solo lo state locale, NON spacesState
    setElements(prevElements => {
      return prevElements.map(el => {
        if (el.id === selectedIds[0]) {
          const bounds = getElementBounds(el);
          if (bounds) {
            const newBounds = { ...bounds };
            switch (resizeHandle) {
              case 'nw':
                newBounds.x += dx;
                newBounds.y += dy;
                newBounds.width -= dx;
                newBounds.height -= dy;
                break;
              case 'ne':
                newBounds.y += dy;
                newBounds.width += dx;
                newBounds.height -= dy;
                break;
              case 'sw':
                newBounds.x += dx;
                newBounds.height += dy;
                newBounds.width -= dx;
                break;
              case 'se':
                newBounds.width += dx;
                newBounds.height += dy;
                break;
              case 'n':
                newBounds.y += dy;
                newBounds.height -= dy;
                break;
              case 's':
                newBounds.height += dy;
                break;
              case 'e':
                newBounds.width += dx;
                break;
              case 'w':
                newBounds.x += dx;
                newBounds.width -= dx;
                break;
            }
            return {
              ...el,
              x: newBounds.x,
              y: newBounds.y,
              width: newBounds.width,
              height: newBounds.height
            };
          }
        }
        return el;
      });
    });
    setDragStart(pos);
  };

  const handleResizeMouseUp = () => {
    setIsResizingElement(false);
    setResizeHandle(null);
    setElementStartBounds(null);
    // Salva su spacesState solo alla fine del resize
    spacesState.updateSpace(space.id, {
      content: { elements }
    });
  };

  const zoomToFit = () => {
    if (!svgRef.current || elements.length === 0) return;

    // Calcola il bounding box di tutti gli elementi
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      switch (element.type) {
        case 'path':
          if (element.points) {
            const coords = element.points.split(' ').map(p => {
              const [x, y] = p.split(',').map(Number);
              return { x, y };
            });
            coords.forEach(({ x, y }) => {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            });
          }
          break;
        case 'rectangle':
          if (element.width && element.height) {
            const x1 = element.width > 0 ? element.x : element.x + element.width;
            const y1 = element.height > 0 ? element.y : element.y + element.height;
            const x2 = element.width > 0 ? element.x + element.width : element.x;
            const y2 = element.height > 0 ? element.y + element.height : element.y;
            minX = Math.min(minX, x1);
            minY = Math.min(minY, y1);
            maxX = Math.max(maxX, x2);
            maxY = Math.max(maxY, y2);
          }
          break;
        case 'circle':
          if (element.radius) {
            minX = Math.min(minX, element.x - element.radius);
            minY = Math.min(minY, element.y - element.radius);
            maxX = Math.max(maxX, element.x + element.radius);
            maxY = Math.max(maxY, element.y + element.radius);
          }
          break;
        case 'line':
        case 'arrow':
          if (element.width && element.height) {
            const x1 = element.x;
            const y1 = element.y;
            const x2 = element.x + element.width;
            const y2 = element.y + element.height;
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
          }
          break;
        case 'text':
          // Calcola dimensioni del testo basate su fontSize e lunghezza
          {
            const fontSize = element.fontSize || 16;
            const text = element.text || '';
            const textWidth = Math.max(text.length * fontSize * 0.6, 20);
            const textHeight = fontSize * 1.2;
            minX = Math.min(minX, element.x - 5);
            minY = Math.min(minY, element.y - textHeight - 5);
            maxX = Math.max(maxX, element.x + textWidth + 5);
            maxY = Math.max(maxY, element.y + 5);
          }
          break;
        case 'spaceEmbed':
        case 'blockEmbed':
          if (element.width && element.height) {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
          }
          break;
      }
    });

    // Aggiungi padding del 10%
    const padding = 0.1;
    const width = maxX - minX;
    const height = maxY - minY;
    const paddingX = width * padding;
    const paddingY = height * padding;

    minX -= paddingX;
    minY -= paddingY;
    const newWidth = width + paddingX * 2;
    const newHeight = height + paddingY * 2;

    // Ottieni le dimensioni del SVG container
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    
    // Verifica che le dimensioni siano valide
    if (!rect.width || !rect.height || !isFinite(rect.width) || !isFinite(rect.height) || 
        rect.width <= 0 || rect.height <= 0) {
      return; // Skip se le dimensioni non sono valide
    }
    
    const aspectRatio = rect.width / rect.height;
    const contentAspectRatio = newWidth / newHeight;

    // Verifica che i ratio siano validi
    if (!isFinite(aspectRatio) || !isFinite(contentAspectRatio)) {
      return; // Skip se i ratio non sono validi
    }

    // Aggiusta il viewBox per mantenere l'aspect ratio
    let finalWidth = newWidth;
    let finalHeight = newHeight;
    let finalX = minX;
    let finalY = minY;

    if (contentAspectRatio > aspectRatio) {
      // Il contenuto è più largo, aggiungi padding verticale
      finalHeight = newWidth / aspectRatio;
      finalY = minY - (finalHeight - newHeight) / 2;
    } else {
      // Il contenuto è più alto, aggiungi padding orizzontale
      finalWidth = newHeight * aspectRatio;
      finalX = minX - (finalWidth - newWidth) / 2;
    }

    // Verifica che le dimensioni finali siano valide
    if (!isFinite(finalWidth) || !isFinite(finalHeight) || finalWidth <= 0 || finalHeight <= 0) {
      return; // Skip se le dimensioni finali non sono valide
    }

    setViewBox({
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight
    });

    // Calcola e aggiorna lo zoom
    const newZoom = 2400 / finalWidth; // 2400 è la larghezza iniziale
    if (isFinite(newZoom) && newZoom > 0) {
      setZoom(newZoom);
    }
  };

  // Funzione per zoomare su un singolo elemento
  const zoomToElement = (elementId: string) => {
    if (!svgRef.current) return;
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    const bounds = getElementBounds(element);
    if (!bounds) return;

    // Aggiungi padding del 20%
    const padding = 0.2;
    const paddingX = bounds.width * padding;
    const paddingY = bounds.height * padding;

    const minX = bounds.x - paddingX;
    const minY = bounds.y - paddingY;
    const newWidth = bounds.width + paddingX * 2;
    const newHeight = bounds.height + paddingY * 2;

    // Ottieni le dimensioni del SVG container
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Verifica che le dimensioni siano valide
    if (!rect.width || !rect.height || !isFinite(rect.width) || !isFinite(rect.height) || 
        rect.width <= 0 || rect.height <= 0) {
      return; // Skip se le dimensioni non sono valide
    }
    
    const aspectRatio = rect.width / rect.height;
    const contentAspectRatio = newWidth / newHeight;

    // Verifica che i ratio siano validi
    if (!isFinite(aspectRatio) || !isFinite(contentAspectRatio)) {
      return; // Skip se i ratio non sono validi
    }

    // Aggiusta il viewBox per mantenere l'aspect ratio
    let finalWidth = newWidth;
    let finalHeight = newHeight;
    let finalX = minX;
    let finalY = minY;

    if (contentAspectRatio > aspectRatio) {
      // Il contenuto è più largo, aggiungi padding verticale
      finalHeight = newWidth / aspectRatio;
      finalY = minY - (finalHeight - newHeight) / 2;
    } else {
      // Il contenuto è più alto, aggiungi padding orizzontale
      finalWidth = newHeight * aspectRatio;
      finalX = minX - (finalWidth - newWidth) / 2;
    }

    // Verifica che le dimensioni finali siano valide
    if (!isFinite(finalWidth) || !isFinite(finalHeight) || finalWidth <= 0 || finalHeight <= 0) {
      return; // Skip se le dimensioni finali non sono valide
    }

    setViewBox({
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight
    });

    // Calcola e aggiorna lo zoom
    const newZoom = 2400 / finalWidth;
    if (isFinite(newZoom) && newZoom > 0) {
      setZoom(newZoom);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    
    const svg = svgRef.current;
    if (!svg) return;

    // Distingue tra pinch (zoom) e scroll (panning)
    // Il pinch gesture ha ctrlKey === true
    if (e.ctrlKey) {
      // ZOOM con pinch gesture
      const CTM = svg.getScreenCTM();
      if (!CTM) return;

      const mouseX = (e.clientX - CTM.e) / CTM.a;
      const mouseY = (e.clientY - CTM.f) / CTM.d;

      // Calculate zoom factor
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const newZoom = zoom * (e.deltaY > 0 ? 0.9 : 1.1);
      
      // Limit zoom range
      if (newZoom < 0.1 || newZoom > 10) return;

      setZoom(newZoom);

      // Calculate new viewBox dimensions
      const newWidth = viewBox.width * zoomFactor;
      const newHeight = viewBox.height * zoomFactor;

      // Calculate new viewBox position to keep mouse point fixed
      const mouseXRatio = (mouseX - viewBox.x) / viewBox.width;
      const mouseYRatio = (mouseY - viewBox.y) / viewBox.height;

      let newX = mouseX - mouseXRatio * newWidth;
      let newY = mouseY - mouseYRatio * newHeight;

      // Limita il viewBox ai bordi del canvas
      // Se il viewBox è più grande del canvas (zoom out), centra il canvas
      if (newWidth >= CANVAS_WIDTH) {
        newX = -CANVAS_WIDTH / 2 - (newWidth - CANVAS_WIDTH) / 2;
      } else {
        const minX = -CANVAS_WIDTH / 2;
        const maxX = CANVAS_WIDTH / 2 - newWidth;
        newX = Math.max(minX, Math.min(maxX, newX));
      }
      
      if (newHeight >= CANVAS_HEIGHT) {
        newY = -CANVAS_HEIGHT / 2 - (newHeight - CANVAS_HEIGHT) / 2;
      } else {
        const minY = -CANVAS_HEIGHT / 2;
        const maxY = CANVAS_HEIGHT / 2 - newHeight;
        newY = Math.max(minY, Math.min(maxY, newY));
      }

      setViewBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    } else {
      // PANNING con scroll a due dita
      const panSpeed = 1.5;
      setViewBox(prev => {
        let newX = prev.x + e.deltaX * panSpeed;
        let newY = prev.y + e.deltaY * panSpeed;
        
        // Limita il panning ai bordi del canvas
        // Se il viewBox è più grande del canvas (zoom out), centra il canvas
        if (prev.width >= CANVAS_WIDTH) {
          newX = -CANVAS_WIDTH / 2 - (prev.width - CANVAS_WIDTH) / 2;
        } else {
          const minX = -CANVAS_WIDTH / 2;
          const maxX = CANVAS_WIDTH / 2 - prev.width;
          newX = Math.max(minX, Math.min(maxX, newX));
        }
        
        if (prev.height >= CANVAS_HEIGHT) {
          newY = -CANVAS_HEIGHT / 2 - (prev.height - CANVAS_HEIGHT) / 2;
        } else {
          const minY = -CANVAS_HEIGHT / 2;
          const maxY = CANVAS_HEIGHT / 2 - prev.height;
          newY = Math.max(minY, Math.min(maxY, newY));
        }
        
        return {
          ...prev,
          x: newX,
          y: newY
        };
      });
    }
  };

  const renderElement = (element: CanvasElement, isCurrent = false) => {
    // Frecce ancorate all'elemento in drag devono avere opacità 50%
    let opacity = isCurrent ? 0.7 : 1;
    if (isDraggingElement && element.type === 'arrow' && 
        (element.anchorStart?.elementId && selectedIds.includes(element.anchorStart.elementId) || 
         element.anchorEnd?.elementId && selectedIds.includes(element.anchorEnd.elementId))) {
      opacity = 0.5;
    }
    // Rimuovi i tratteggi dalle selezioni, usa linee continue
    const strokeDasharray = undefined;

    const handleClick = (e: React.MouseEvent) => {
      if (tool === 'select') {
        e.stopPropagation();
        
        // Se l'elemento appartiene a un gruppo, seleziona tutti gli elementi del gruppo
        let idsToSelect = [element.id];
        if (element.groupId) {
          idsToSelect = elements
            .filter(el => el.groupId === element.groupId)
            .map(el => el.id);
        }
        
        // Se Shift è premuto, aggiungi/rimuovi dalla selezione
        if (e.shiftKey) {
          setSelectedIds(prev => {
            const allSelected = idsToSelect.every(id => prev.includes(id));
            if (allSelected) {
              // Rimuovi tutti gli elementi del gruppo dalla selezione
              return prev.filter(id => !idsToSelect.includes(id));
            } else {
              // Aggiungi tutti gli elementi del gruppo alla selezione
              return [...prev, ...idsToSelect.filter(id => !prev.includes(id))];
            }
          });
        } else {
          // Senza Shift, sostituisci la selezione con il gruppo
          setSelectedIds(idsToSelect);
        }
      }
    };
    
    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (tool === 'select') {
        // Se l'elemento non è selezionato, selezionalo
        if (!selectedIds.includes(element.id)) {
          if (element.groupId) {
            const groupIds = elements
              .filter(el => el.groupId === element.groupId)
              .map(el => el.id);
            setSelectedIds(groupIds);
            handleContextMenu(e, groupIds);
          } else {
            setSelectedIds([element.id]);
            handleContextMenu(e, [element.id]);
          }
        } else {
          // Altrimenti usa la selezione corrente
          handleContextMenu(e, selectedIds);
        }
      }
    };

    const handleMouseEnter = () => {
      // NON impostare hoveredId se siamo in fase di drag
      if (!isDraggingElement && !isResizingElement) {
        setHoveredId(element.id);
      }
    };

    const handleMouseLeave = () => {
      // Resetta hoveredId solo se non stiamo trascinando
      if (!isDraggingElement && !isResizingElement) {
        setHoveredId(null);
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      // Ferma la propagazione per evitare che l'SVG principale gestisca l'evento
      if (tool === 'select') {
        e.stopPropagation();
      }
    };

    switch (element.type) {
      case 'path':
        return (
          <polyline
            key={element.id}
            data-element-id={element.id}
            points={element.points}
            fill="none"
            stroke={element.color}
            strokeWidth={element.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
            strokeDasharray={strokeDasharray}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onContextMenu={handleRightClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
          />
        );
      case 'rectangle':
        if (!element.width || !element.height) return null;
        const rectX = element.width > 0 ? element.x : element.x + element.width;
        const rectY = element.height > 0 ? element.y : element.y + element.height;
        const rectWidth = Math.abs(element.width);
        const rectHeight = Math.abs(element.height);
        const hitboxPadding = 10;
        return (
          <g key={element.id} data-element-id={element.id}>
            {/* Hitbox invisibile più grande */}
            <rect
              x={rectX - hitboxPadding}
              y={rectY - hitboxPadding}
              width={rectWidth + hitboxPadding * 2}
              height={rectHeight + hitboxPadding * 2}
              fill="transparent"
              stroke="none"
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
            />
            {/* Rettangolo visibile */}
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              fill="none"
              stroke={element.color}
              strokeWidth={element.strokeWidth}
              opacity={opacity}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
          </g>
        );
      case 'circle':
        if (!element.radius) return null;
        const circleHitboxPadding = 10;
        return (
          <g key={element.id} data-element-id={element.id}>
            {/* Hitbox invisibile più grande */}
            <circle
              cx={element.x}
              cy={element.y}
              r={element.radius + circleHitboxPadding}
              fill="transparent"
              stroke="none"
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
            />
            {/* Cerchio visibile */}
            <circle
              cx={element.x}
              cy={element.y}
              r={element.radius}
              fill="none"
              stroke={element.color}
              strokeWidth={element.strokeWidth}
              opacity={opacity}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
          </g>
        );
      case 'line':
        if (!element.width || !element.height) return null;
        const x1Line = element.x;
        const y1Line = element.y;
        const x2Line = element.x + element.width;
        const y2Line = element.y + element.height;
        const lineHitboxWidth = 15;
        return (
          <g key={element.id} data-element-id={element.id}>
            {/* Hitbox invisibile più larga */}
            <line
              x1={x1Line}
              y1={y1Line}
              x2={x2Line}
              y2={y2Line}
              stroke="transparent"
              strokeWidth={lineHitboxWidth}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
            />
            {/* Linea visibile */}
            <line
              x1={x1Line}
              y1={y1Line}
              x2={x2Line}
              y2={y2Line}
              stroke={element.color}
              strokeWidth={element.strokeWidth}
              opacity={opacity}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
          </g>
        );
      case 'arrow':
        if (!element.width || !element.height) return null;
        const x1 = element.x;
        const y1 = element.y;
        const x2Arrow = element.x + element.width;
        const y2Arrow = element.y + element.height;
        const angle = Math.atan2(y2Arrow - y1, x2Arrow - x1);
        const arrowSize = 15;
        const arrowHitboxWidth = 15;
        return (
          <g key={element.id} data-element-id={element.id}>
            {/* Hitbox invisibile più larga per la linea */}
            <line
              x1={x1}
              y1={y1}
              x2={x2Arrow}
              y2={y2Arrow}
              stroke="transparent"
              strokeWidth={arrowHitboxWidth}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
            />
            {/* Linea visibile */}
            <line
              x1={x1}
              y1={y1}
              x2={x2Arrow}
              y2={y2Arrow}
              stroke={element.color}
              strokeWidth={element.strokeWidth}
              opacity={opacity}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
            {/* Punta della freccia */}
            <polygon
              points={`${x2Arrow},${y2Arrow} ${x2Arrow - arrowSize * Math.cos(angle - Math.PI / 6)},${y2Arrow - arrowSize * Math.sin(angle - Math.PI / 6)} ${x2Arrow - arrowSize * Math.cos(angle + Math.PI / 6)},${y2Arrow - arrowSize * Math.sin(angle + Math.PI / 6)}`}
              fill={element.color}
              opacity={opacity}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
            />
          </g>
        );
      case 'text':
        // Se l'elemento è in editing, mostra il foreignObject con input
        if (editingTextId === element.id) {
          return null; // Non renderizzare il testo, lo sostituiremo con il foreignObject
        }
        return (
          <text
            key={element.id}
            data-element-id={element.id}
            x={element.x}
            y={element.y}
            fill={element.color}
            fontSize="24"
            fontFamily="sans-serif"
            opacity={opacity}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onContextMenu={handleRightClick}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (tool === 'select') {
                // Doppio click per editare il testo
                setEditingTextId(element.id);
                setEditingTextValue(element.text || '');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
          >
            {element.text}
          </text>
        );
      case 'spaceEmbed':
        return (
          <CanvasSpaceEmbed
            key={element.id}
            element={element}
            onClick={handleClick}
            onDoubleClick={(e) => {
              e.stopPropagation();
              // Zooma sull'elemento
              zoomToElement(element.id);
              // Marca l'elemento come in editing (se è una page)
              if (element.spaceType === 'page' && element.spaceId) {
                setEditingSpaceId(element.spaceId);
              }
            }}
            onContextMenu={handleRightClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            cursor={tool === 'select' ? 'pointer' : 'default'}
            opacity={opacity}
            strokeDasharray={strokeDasharray}
            spacesState={spacesState}
            onNavigate={(spaceId) => {
              // La navigazione potrebbe essere gestita tramite un callback passato dal parent
              if (onNavigateToSpace) {
                onNavigateToSpace(spaceId);
              }
            }}
          />
        );
      case 'blockEmbed':
        return (
          <CanvasBlockEmbed
            key={element.id}
            element={element}
            onClick={handleClick}
            onDoubleClick={(e) => {
              e.stopPropagation();
              // Zooma sull'elemento
              zoomToElement(element.id);
            }}
            onContextMenu={handleRightClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            cursor={tool === 'select' ? 'pointer' : 'default'}
            opacity={opacity}
            strokeDasharray={strokeDasharray}
            spacesState={spacesState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={drop} className="flex flex-col h-full relative overflow-hidden">
      {isOver && (
        <div className="absolute inset-0 bg-primary-500 opacity-10 z-[999] pointer-events-none border-4 border-dashed border-primary-500" />
      )}
      
      {/* Toolbar */}
      <div className="p-2 border-b border-divider flex gap-2 items-center overflow-hidden flex-nowrap relative shrink-0 bg-background">
        {/* Tools */}
        <div className="flex gap-1 items-center relative">
          <span className="text-xs text-default-500 mr-1 whitespace-nowrap">
            Tools:
          </span>
          <Button isIconOnly size="sm" variant={tool === 'select' ? 'solid' : 'light'} onPress={() => setTool('select')} title="Select" color={tool === 'select' ? "primary" : "default"}>
            <MousePointer size={16} />
          </Button>
          
          {/* Dropdown per strumenti di disegno */}
          <div className="relative custom-dropdown">
            <Button
              ref={drawingMenuButtonRef}
              isIconOnly
              size="sm"
              variant={['pen', 'rectangle', 'circle', 'line'].includes(tool) ? 'solid' : 'light'}
              color={['pen', 'rectangle', 'circle', 'line'].includes(tool) ? "primary" : "default"}
              onPress={() => setDrawingMenuOpen(!drawingMenuOpen)}
              title="Strumenti di disegno"
              className="min-w-8"
            >
              <div className="flex items-center">
                {tool === 'pen' && <Pencil size={16} />}
                {tool === 'rectangle' && <Square size={16} />}
                {tool === 'circle' && <Circle size={16} />}
                {tool === 'line' && <Minus size={16} />}
                {!['pen', 'rectangle', 'circle', 'line'].includes(tool) && <Pencil size={16} />}
                <ChevronDown size={12} className="ml-0.5" />
              </div>
            </Button>
            
            {drawingMenuOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[150px] bg-white rounded-lg shadow-lg border border-divider p-1">
                <div 
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-default-100 cursor-pointer"
                  onClick={() => { setTool('pen'); setDrawingMenuOpen(false); }}
                >
                  <Pencil size={14} />
                  <span>Matita</span>
                </div>
                <div 
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-default-100 cursor-pointer"
                  onClick={() => { setTool('rectangle'); setDrawingMenuOpen(false); }}
                >
                  <Square size={14} />
                  <span>Rettangolo</span>
                </div>
                <div 
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-default-100 cursor-pointer"
                  onClick={() => { setTool('circle'); setDrawingMenuOpen(false); }}
                >
                  <Circle size={14} />
                  <span>Cerchio</span>
                </div>
                <div 
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-default-100 cursor-pointer"
                  onClick={() => { setTool('line'); setDrawingMenuOpen(false); }}
                >
                  <Minus size={14} />
                  <span>Linea</span>
                </div>
              </div>
            )}
          </div>

          <Button isIconOnly size="sm" variant={tool === 'arrow' ? 'solid' : 'light'} color={tool === 'arrow' ? "primary" : "default"} onPress={() => setTool('arrow')} title="Arrow">
            <ArrowRight size={16} />
          </Button>
          <Button isIconOnly size="sm" variant={tool === 'text' ? 'solid' : 'light'} color={tool === 'text' ? "primary" : "default"} onPress={() => setTool('text')} title="Text">
            <Type size={16} />
          </Button>
        </div>
        
        <div className="w-[1px] h-5 bg-divider" />
        
        {/* Color picker with presets */}
        <div className="relative custom-dropdown">
          <div className="flex gap-1 items-center">
            <span className="text-xs text-default-500 whitespace-nowrap">
              Color:
            </span>
            <Button
              ref={colorMenuButtonRef}
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setColorMenuOpen(!colorMenuOpen)}
              className="min-w-8 min-h-6 border-2 border-divider"
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            >
              <Palette size={14} style={{ color: color === '#FFFFFF' || color === '#F8D501' ? '#000' : '#fff' }} />
            </Button>
          </div>
          
          {/* Color menu dropdown */}
          {colorMenuOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 min-w-[220px] bg-white rounded-lg shadow-lg border border-divider p-3">
              <p className="text-xs font-bold mb-2">Colori predefiniti</p>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {COLOR_PRESETS.map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => {
                      setColor(preset.value);
                      setColorMenuOpen(false);
                    }}
                    className="relative w-7 h-7 rounded cursor-pointer border border-divider flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  >
                    {color === preset.value && (
                      <Check 
                        size={14} 
                        style={{ 
                          color: preset.value === '#FFFFFF' || preset.value === '#F8D501' ? '#000' : '#fff',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                        }} 
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold mb-1">Colore personalizzato</p>
              <Input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-full"
                size="sm"
              />
            </div>
          )}
        </div>
        
        {/* Stroke width picker with presets */}
        <div className="relative custom-dropdown">
          <div className="flex gap-1 items-center">
            <span className="text-xs text-default-500 whitespace-nowrap">
              Stroke:
            </span>
            <Button
              ref={strokeMenuButtonRef}
              size="sm"
              variant="light"
              onPress={() => setStrokeMenuOpen(!strokeMenuOpen)}
              className="min-w-10 text-xs font-bold"
              title={`Stroke width: ${strokeWidth}px`}
            >
              {strokeWidth}px
            </Button>
          </div>
          
          {/* Stroke menu dropdown */}
          {strokeMenuOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] bg-white rounded-lg shadow-lg border border-divider p-3">
              <p className="text-xs font-bold mb-2">Spessori predefiniti</p>
              <div className="flex flex-col gap-1 mb-3">
                {STROKE_PRESETS.map((width) => (
                  <div
                    key={width}
                    onClick={() => {
                      setStrokeWidth(width);
                      setStrokeMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${strokeWidth === width ? 'bg-primary-50' : 'hover:bg-default-100'}`}
                  >
                    <div
                      className="flex-1 bg-black rounded-sm"
                      style={{ height: width }}
                    />
                    <span className="text-xs min-w-[30px] text-right">{width}px</span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold mb-1">Spessore personalizzato</p>
              <Input
                type="number"
                value={String(strokeWidth)}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full"
                size="sm"
              />
            </div>
          )}
        </div>
        
        <div className="w-[1px] h-5 bg-divider" />
        
        {/* Actions */}
        <div className="flex gap-1 items-center">
          {selectedIds.length > 0 && (
            <>
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={deleteSelected} title={`Delete ${selectedIds.length} selected element${selectedIds.length > 1 ? 's' : ''}`}>
                <Trash2 size={16} />
              </Button>
              {selectedIds.length > 1 && (
                <span className="text-xs text-default-500 px-1">
                  {selectedIds.length} selected
                </span>
              )}
            </>
          )}
          <Button size="sm" variant="light" onPress={clearCanvas} className="min-w-0 px-2">
            Clear All
          </Button>
        </div>

        <div className="w-[1px] h-5 bg-divider" />

        {/* Zoom controls */}
        <div className="flex gap-1 items-center">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={zoomToFit}
            title="Zoom to fit all elements"
            isDisabled={elements.length === 0}
          >
            <Maximize2 size={16} />
          </Button>
          <div className="px-2 py-1 bg-default-100 rounded text-xs whitespace-nowrap">
            Zoom: {Math.round(zoom * 100)}%
          </div>
          <Button
            isIconOnly
            size="sm"
            variant={showMinimap ? 'solid' : 'light'}
            color={showMinimap ? "primary" : "default"}
            onPress={() => setShowMinimap(!showMinimap)}
            title={showMinimap ? "Nascondi minimappa" : "Mostra minimappa"}
          >
            <Map size={16} />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => {
            // Previeni il menu contestuale del browser
            e.preventDefault();
            // Se ci sono elementi selezionati e siamo in modalità select, mostra il context menu
            if (selectedIds.length > 0 && tool === 'select') {
              handleContextMenu(e, selectedIds);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            cursor: isPanning 
              ? 'grabbing' 
              : tool === 'select' 
                ? 'default' 
                : tool === 'text'
                  ? 'text'
                  : tool === 'pen'
                    ? 'crosshair'
                    : 'crosshair',
            backgroundColor: 'transparent',
            userSelect: editingTextId ? 'text' : 'none'
          }}
        >
          {/* Canvas boundary rectangle */}
          <rect
            x={-CANVAS_WIDTH / 2}
            y={-CANVAS_HEIGHT / 2}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={2}
            strokeDasharray="10 10"
            opacity={0.3}
            pointerEvents="none"
          />
          
          {/* Render existing elements */}
          {elements.map(el => renderElement(el))}
          
          {/* Render current element being drawn */}
          {currentElement && renderElement(currentElement, true)}

          {/* Render bounding box for selected element(s) */}
          {selectedIds.length > 0 && tool === 'select' && (() => {
            // Calcola il bounding box combinato di tutti gli elementi selezionati
            const selectedElements = elements.filter(el => selectedIds.includes(el.id));
            if (selectedElements.length === 0) return null;
            
            const allBounds = selectedElements.map(el => getElementBounds(el)).filter(b => b !== null) as { x: number; y: number; width: number; height: number }[];
            if (allBounds.length === 0) return null;
            
            const minX = Math.min(...allBounds.map(b => b.x));
            const minY = Math.min(...allBounds.map(b => b.y));
            const maxX = Math.max(...allBounds.map(b => b.x + b.width));
            const maxY = Math.max(...allBounds.map(b => b.y + b.height));
            
            const bounds = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            };
            
            const padding = 5;
            return (
              <g>
                {/* Bounding box rectangle */}
                <rect
                  x={bounds.x - padding}
                  y={bounds.y - padding}
                  width={bounds.width + padding * 2}
                  height={bounds.height + padding * 2}
                  fill="none"
                  stroke="#1976d2"
                  strokeWidth={2}
                  pointerEvents="none"
                />
                {/* Draggable area (invisible rect) */}
                <rect
                  x={bounds.x - padding}
                  y={bounds.y - padding}
                  width={bounds.width + padding * 2}
                  height={bounds.height + padding * 2}
                  fill="transparent"
                  stroke="none"
                  onMouseDown={handleBoundingBoxMouseDown}
                  style={{ cursor: 'move' }}
                />
                {/* Resize handles - solo per selezione singola e NON per elementi text */}
                {selectedIds.length === 1 && (() => {
                  const selectedElement = elements.find(el => el.id === selectedIds[0]);
                  return selectedElement && selectedElement.type !== 'text';
                })() && (
                  <>
                    {/* Corner handles */}
                    {[
                  { x: bounds.x - padding, y: bounds.y - padding }, // top-left
                  { x: bounds.x + bounds.width + padding, y: bounds.y - padding }, // top-right
                  { x: bounds.x - padding, y: bounds.y + bounds.height + padding }, // bottom-left
                  { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height + padding } // bottom-right
                ].map((corner, i) => (
                  <circle
                    key={i}
                    cx={corner.x}
                    cy={corner.y}
                    r={6}
                    fill="white"
                    stroke="#1976d2"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => handleResizeMouseDown(e, i < 2 ? (i % 2 === 0 ? 'nw' : 'ne') : (i % 2 === 0 ? 'sw' : 'se'))}
                  />
                ))}
                {/* Edge handles */}
                {[
                  { x: bounds.x + bounds.width / 2, y: bounds.y - padding }, // top
                  { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + padding }, // bottom
                  { x: bounds.x - padding, y: bounds.y + bounds.height / 2 }, // left
                  { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height / 2 } // right
                ].map((edge, i) => (
                  <circle
                    key={i + 4}
                    cx={edge.x}
                    cy={edge.y}
                    r={6}
                    fill="white"
                    stroke="#1976d2"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => handleResizeMouseDown(e, i < 2 ? (i % 2 === 0 ? 'n' : 's') : (i % 2 === 0 ? 'w' : 'e'))}
                  />
                ))}
                  </>
                )}
              </g>
            );
          })()}

          {/* Render hover preview when hovering over element */}
          {hoveredId && !selectedIds.includes(hoveredId) && tool === 'select' && !isDraggingElement && !isResizingElement && (() => {
            const hoveredElement = elements.find(el => el.id === hoveredId);
            if (!hoveredElement) return null;
            
            // Se l'elemento è raggruppato, mostra il bounding box di tutto il gruppo
            let boundsElements = [hoveredElement];
            if (hoveredElement.groupId) {
              boundsElements = elements.filter(el => el.groupId === hoveredElement.groupId);
            }
            
            const allBounds = boundsElements.map(el => getElementBounds(el)).filter(b => b !== null) as { x: number; y: number; width: number; height: number }[];
            if (allBounds.length === 0) return null;
            
            const minX = Math.min(...allBounds.map(b => b.x));
            const minY = Math.min(...allBounds.map(b => b.y));
            const maxX = Math.max(...allBounds.map(b => b.x + b.width));
            const maxY = Math.max(...allBounds.map(b => b.y + b.height));
            
            const bounds = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            };
            
            const padding = 5;
            
            const handleHoverBoxMouseDown = (e: React.MouseEvent) => {
              e.stopPropagation();
              // Seleziona l'elemento o il gruppo
              let idsToSelect = [hoveredElement.id];
              if (hoveredElement.groupId) {
                idsToSelect = elements
                  .filter(el => el.groupId === hoveredElement.groupId)
                  .map(el => el.id);
              }
              draggingIdsRef.current = idsToSelect;
              setSelectedIds(idsToSelect);
              // Resetta hoveredId per evitare flickering
              setHoveredId(null);
              setIsDraggingElement(true);
              const pos = getMousePos(e as any);
              setDragStart(pos);
              elementsDragStartRef.current = [...elements];
            };
            
            return (
              <g>
                {/* Bounding box visibile */}
                <rect
                  x={bounds.x - padding}
                  y={bounds.y - padding}
                  width={bounds.width + padding * 2}
                  height={bounds.height + padding * 2}
                  fill="rgba(100, 181, 246, 0.1)"
                  stroke="#64b5f6"
                  strokeWidth={2}
                  opacity={0.8}
                  pointerEvents="none"
                />
                {/* Area cliccabile per il drag */}
                <rect
                  x={bounds.x - padding}
                  y={bounds.y - padding}
                  width={bounds.width + padding * 2}
                  height={bounds.height + padding * 2}
                  fill="transparent"
                  stroke="none"
                  onMouseDown={handleHoverBoxMouseDown}
                  onMouseEnter={() => setHoveredId(hoveredElement.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onDoubleClick={(e) => {
                    // Per elementi di testo, attiva l'editing invece del drag
                    if (hoveredElement.type === 'text') {
                      e.stopPropagation();
                      setEditingTextId(hoveredElement.id);
                      setEditingTextValue(hoveredElement.text || '');
                      setHoveredId(null);
                    }
                  }}
                  style={{ cursor: hoveredElement.type === 'text' ? 'text' : 'move' }}
                />
              </g>
            );
          })()}

          {/* Render arrow snap start point */}
          {arrowSnapStart && (
            <circle
              cx={arrowSnapStart.x}
              cy={arrowSnapStart.y}
              r={8}
              fill="#4CAF50"
              stroke="#2E7D32"
              strokeWidth={2}
              opacity={0.8}
              pointerEvents="none"
            />
          )}

          {/* Render arrow snap preview point when hovering over element with arrow tool */}
          {tool === 'arrow' && arrowSnapPreview && !isDrawing && (
            <circle
              cx={arrowSnapPreview.x}
              cy={arrowSnapPreview.y}
              r={6}
              fill="#FF9800"
              stroke="#E65100"
              strokeWidth={2}
              opacity={0.7}
              pointerEvents="none"
            />
          )}

          {/* Render selection box when dragging with select tool */}
          {selectionBox && (
            <rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(25, 118, 210, 0.1)"
              stroke="#1976d2"
              strokeWidth={2}
              opacity={0.7}
              pointerEvents="none"
            />
          )}

          {/* Render text input for editing */}
          {editingTextId && (() => {
            const textElement = elements.find(el => el.id === editingTextId);
            if (!textElement) return null;
            
            return (
              <foreignObject
                x={textElement.x}
                y={textElement.y - 24}
                width={700}
                height={50}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  ref={textareaRef}
                  value={editingTextValue}
                  onChange={(e) => setEditingTextValue(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => {
                    // Salva il testo quando l'input perde il focus
                    const updatedElements = elements.map(el =>
                      el.id === editingTextId ? { ...el, text: editingTextValue } : el
                    );
                    saveElements(updatedElements);
                    setEditingTextId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Salva con Enter
                      const updatedElements = elements.map(el =>
                        el.id === editingTextId ? { ...el, text: editingTextValue } : el
                      );
                      saveElements(updatedElements);
                      setEditingTextId(null);
                    } else if (e.key === 'Escape') {
                      // Annulla con Esc
                      setEditingTextId(null);
                    }
                  }}
                  autoFocus
                  style={{
                    width: '400px',
                    maxWidth: '700px',
                    minHeight: '40px',
                    maxHeight: '200px',
                    fontSize: '24px',
                    fontFamily: 'sans-serif',
                    color: textElement.color,
                    border: '2px solid #1976d2',
                    outline: 'none',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    resize: 'horizontal',
                    overflow: 'auto'
                  }}
                />
              </foreignObject>
            );
          })()}
        </svg>

        {/* Mini-map / Viewport indicator */}
        {showMinimap && (
        <div
          className="absolute bottom-[60px] right-4 w-[200px] h-[160px] bg-white border border-divider rounded-lg overflow-hidden shadow-md pointer-events-none z-50 flex flex-col"
        >
          {/* Zoom indicator */}
          <div className="px-2 py-1 bg-default-100 border-b border-divider flex items-center justify-center gap-1">
            <span className="text-xs font-bold">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          
          <svg
            width="200"
            height="140"
            viewBox={`${-CANVAS_WIDTH / 2} ${-CANVAS_HEIGHT / 2} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Canvas boundary */}
            <rect
              x={-CANVAS_WIDTH / 2}
              y={-CANVAS_HEIGHT / 2}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="rgba(0,0,0,0.02)"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={CANVAS_WIDTH / 100}
            />
            
            {/* Elementi semplificati */}
            {elements.map(el => {
              switch (el.type) {
                case 'rectangle':
                  return (
                    <rect
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      fill={el.color}
                      opacity={0.5}
                    />
                  );
                case 'circle':
                  return (
                    <circle
                      key={el.id}
                      cx={el.x}
                      cy={el.y}
                      r={el.radius}
                      fill={el.color}
                      opacity={0.5}
                    />
                  );
                case 'text':
                  return (
                    <rect
                      key={el.id}
                      x={el.x}
                      y={el.y - 12}
                      width={60}
                      height={20}
                      fill={el.color}
                      opacity={0.5}
                    />
                  );
                case 'spaceEmbed':
                case 'blockEmbed':
                  return (
                    <rect
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      fill={el.color}
                      opacity={0.5}
                    />
                  );
                case 'path':
                  return (
                    <path
                      key={el.id}
                      d={el.points}
                      fill="none"
                      stroke={el.color}
                      strokeWidth={el.strokeWidth}
                      opacity={0.5}
                    />
                  );
                case 'line':
                case 'arrow':
                  const points = el.points?.split(' ') || [];
                  if (points.length >= 2) {
                    const [x1, y1] = points[0].split(',').map(Number);
                    const lastPoint = points[points.length - 1].split(',').map(Number);
                    return (
                      <line
                        key={el.id}
                        x1={x1}
                        y1={y1}
                        x2={lastPoint[0]}
                        y2={lastPoint[1]}
                        stroke={el.color}
                        strokeWidth={el.strokeWidth}
                        opacity={0.5}
                      />
                    );
                  }
                  return null;
                default:
                  return null;
              }
            })}
            
            {/* Viewport rectangle - mostra il riquadro visibile */}
            <rect
              x={viewBox.x}
              y={viewBox.y}
              width={viewBox.width}
              height={viewBox.height}
              fill="rgba(25, 118, 210, 0.1)"
              stroke="var(--heroui-primary-500)"
              strokeWidth={CANVAS_WIDTH / 150}
              opacity={0.9}
            />
          </svg>
        </div>
        )}
      </div>
      
      <div className="p-2 border-t border-divider text-xs text-default-400 bg-background">
        Tip: Hold Alt or middle-click to pan • Pinch to zoom • Two-finger scroll to pan
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[10000] min-w-[200px] bg-white rounded-lg shadow-lg border border-divider py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {/* Controlli per colore e spessore se applicabile */}
          {(() => {
            const selectedElements = elements.filter(e => contextMenu.elementIds.includes(e.id));
            const hasStrokeElements = selectedElements.some(e => 
              e.type === 'arrow' || e.type === 'rectangle' || e.type === 'circle' || e.type === 'line' || e.type === 'path'
            );
            
            if (!hasStrokeElements) return null;
            
            // Prendi il colore e lo spessore del primo elemento applicabile
            const firstStrokeElement = selectedElements.find(e => 
              e.type === 'arrow' || e.type === 'rectangle' || e.type === 'circle' || e.type === 'line' || e.type === 'path'
            );
            
            return (
              <>
                <div className="px-3 py-2">
                  <p className="text-xs text-default-500 mb-1">
                    Colore:
                  </p>
                  <Input
                    type="color"
                    value={firstStrokeElement?.color || '#000000'}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      const newElements = elements.map(el => {
                        if (contextMenu.elementIds.includes(el.id) && 
                            (el.type === 'arrow' || el.type === 'rectangle' || el.type === 'circle' || el.type === 'line' || el.type === 'path' || el.type === 'text')) {
                          return { ...el, color: newColor };
                        }
                        return el;
                      });
                      const oldElements = [...elements];
                      saveElementsWithHistory(newElements, oldElements, 'Colore modificato');
                    }}
                    className="w-full"
                    size="sm"
                  />
                </div>
                
                <div className="px-3 py-2">
                  <p className="text-xs text-default-500 mb-1">
                    Spessore: {firstStrokeElement?.strokeWidth || 2}px
                  </p>
                  <Slider
                    value={firstStrokeElement?.strokeWidth || 2}
                    onChange={(value) => {
                      const newStrokeWidth = value as number;
                      const newElements = elements.map(el => {
                        if (contextMenu.elementIds.includes(el.id) && 
                            (el.type === 'arrow' || el.type === 'rectangle' || el.type === 'circle' || el.type === 'line' || el.type === 'path')) {
                          return { ...el, strokeWidth: newStrokeWidth };
                        }
                        return el;
                      });
                      const oldElements = [...elements];
                      saveElementsWithHistory(newElements, oldElements, 'Spessore modificato');
                    }}
                    minValue={1}
                    maxValue={20}
                    size="sm"
                  />
                </div>
                
                <Divider className="my-1" />
              </>
            );
          })()}
          
          <div 
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-default-100 cursor-pointer"
            onClick={() => {
              deleteSelected();
              setContextMenu(null);
            }}
          >
            <Trash2 size={16} />
            <span>Elimina</span>
          </div>
          
          <Divider className="my-1" />
          
          <div 
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-default-100 cursor-pointer"
            onClick={() => {
              bringToFront();
              setContextMenu(null);
            }}
          >
            <BringToFront size={16} />
            <span>Porta in primo piano</span>
          </div>
          
          <div 
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-default-100 cursor-pointer"
            onClick={() => {
              sendToBack();
              setContextMenu(null);
            }}
          >
            <SendToBack size={16} />
            <span>Porta in secondo piano</span>
          </div>

          {contextMenu.elementIds.length > 1 && (
            <>
              <Divider className="my-1" />
              <div 
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-default-100 cursor-pointer"
                onClick={() => {
                  groupElements();
                  setContextMenu(null);
                }}
              >
                <Group size={16} />
                <span>Raggruppa</span>
              </div>
            </>
          )}

          {contextMenu.elementIds.length > 0 && (() => {
            const selectedElements = elements.filter(e => contextMenu.elementIds.includes(e.id));
            const hasGroup = selectedElements.some(e => e.groupId);
            return hasGroup ? (
              <>
                <Divider className="my-1" />
                <div 
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-default-100 cursor-pointer"
                  onClick={() => {
                    ungroupElements();
                    setContextMenu(null);
                  }}
                >
                  <Ungroup size={16} />
                  <span>Separa</span>
                </div>
              </>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
