import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  Pencil,
  PencilRuler,
  Square,
  Circle,
  Type,
  Trash2,
  MousePointer,
  ArrowRight,
  Minus,
  Maximize,
  Maximize2,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  Check,
  Palette,
  Map as MapIcon,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignVerticalJustifyCenter,
  StretchHorizontal,
  StretchVertical,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Image as ImageIcon,
  ZoomIn,
  Settings2
} from 'lucide-react';
import { Space } from '../../types';
import { ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { CanvasSpaceEmbed } from './CanvasSpaceEmbed';
import { CanvasBlockEmbed } from './CanvasBlockEmbed';
import { FileElement } from './FileElement';
import { useHistory } from '../../contexts/HistoryContext';
import { PencilFilters } from './PencilFilters';

type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'line';

const CANVAS_WIDTH = 10000;
const CANVAS_HEIGHT = 8000;

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

const STROKE_PRESETS = [1, 2, 4, 6, 8];

const getSvgPathFromStroke = (pointsStr: string | undefined) => {
  if (!pointsStr) return "";
  const points = pointsStr.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });

  if (points.length < 2) return "";

  if (points.length < 3) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  let res = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 2; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    res += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
  }

  res += ` Q ${points[points.length - 2].x},${points[points.length - 2].y} ${points[points.length - 1].x},${points[points.length - 1].y}`;

  return res;
};

interface CanvasElement {
  id: string;
  type: 'path' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'line' | 'spaceEmbed' | 'blockEmbed' | 'image' | 'file' | 'group';
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
  rotation?: number;
  spaceId?: string;
  spaceName?: string;
  spaceType?: string;
  blockId?: string;
  sourceSpaceId?: string;
  blockType?: string;
  blockContent?: string;
  imageUrl?: string;
  anchorStart?: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left' };
  anchorEnd?: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left' };
  arrowType?: 'straight' | 'curved' | 'electrical';
  curvature?: number; // For curved arrows
  controlPoint?: number; // Legacy offset
  waypoints?: { x: number; y: number }[]; // New: for electrical arrows manual path
  groupId?: string;
  parentId?: string; // Support for nested grouping
}

interface CanvasSpaceProps {
  space: Space;
  spacesState: any;
  onNavigateToSpace?: (spaceId: string) => void;
  isActive?: boolean;
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
}

const ACCEPT_TYPES = [ITEM_TYPE_TO_WORKSPACE, ITEM_TYPE_TEXT_ELEMENT, 'CALENDAR_EVENT', NativeTypes.FILE];

export function CanvasSpace({
  space,
  spacesState,
  onNavigateToSpace,
  isActive = true,
  settings,
  onUpdateSettings
}: CanvasSpaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [isRotatingElement, setIsRotatingElement] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartBounds, setElementStartBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [arrowSnapStart, setArrowSnapStart] = useState<{ x: number; y: number; elementId: string; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [arrowSnapPreview, setArrowSnapPreview] = useState<{ x: number; y: number; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const hasMouseMovedRef = useRef(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementIds: string[] } | null>(null);
  const [isDrawingMenuOpen, setIsDrawingMenuOpen] = useState(false);
  const [arrowType, setArrowType] = useState<'straight' | 'curved' | 'electrical'>('straight');
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isStrokeMenuOpen, setIsStrokeMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const draggingIdsRef = useRef<string[]>([]);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [showMinimap, setShowMinimap] = useState(false);
  const [pencilTexture, setPencilTexture] = useState<'pencilTexture' | 'pencilTextureHeavy' | 'pencilTextureSoft' | 'pencilTextureCharcoal'>('pencilTexture');
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [showDrawingTip, setShowDrawingTip] = useState(false);
  const [isDraggingArrowHandle, setIsDraggingArrowHandle] = useState<{ arrowId: string; end: 'start' | 'end' | 'control' | 'waypoint'; index?: number } | null>(null);
  const [rotateStartAngle, setRotateStartAngle] = useState<number | null>(null);
  const [elementStartRotation, setElementStartRotation] = useState<number | null>(null);
  const [isZKeyPressed, setIsZKeyPressed] = useState(false);
  const [isRightToLeftSelection, setIsRightToLeftSelection] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileDrop = async (files: any[], clientOffset: { x: number, y: number } | null = null) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    let svgX = 0;
    let svgY = 0;

    if (clientOffset) {
      const CTM = svg.getScreenCTM();
      if (!CTM) return;
      svgX = (clientOffset.x - CTM.e) / CTM.a;
      svgY = (clientOffset.y - CTM.f) / CTM.d;
    } else {
      // Fallback to center of current viewBox if no clientOffset (e.g. from file browser)
      svgX = viewBox.x + viewBox.width / 2;
      svgY = viewBox.y + viewBox.height / 2;
    }

    const newElements: CanvasElement[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const offsetX = (i % 5) * 40; // Spaced out grid for multiple files
      const offsetY = Math.floor(i / 5) * 40;

      if (file.type && file.type.startsWith('image/')) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Pre-load image to get dimensions
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = dataUrl;
          });

          const aspectRatio = img.width / img.height;
          let width = 400; // Larger default for images
          let height = 400;

          if (img.width > img.height) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }

          newElements.push({
            id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            x: svgX + offsetX - width / 2,
            y: svgY + offsetY - height / 2,
            width: width,
            height: height,
            color: '#000000',
            strokeWidth: 0,
            imageUrl: dataUrl,
            rotation: 0 // Straightly oriented
          });
        } catch (e) {
          console.error("Failed to read file", file.name, e);
        }
      } else {
        // Generic File Element
        newElements.push({
          id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'file',
          x: svgX + offsetX - 100,
          y: svgY + offsetY - 100,
          width: 200,
          height: 200,
          color: '#000000',
          strokeWidth: 1,
          rotation: 0, // Straightly oriented
          fileMetadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
            fileLayout: 'square'
          }
        });
      }
    }

    if (newElements.length > 0) {
      const oldElements = [...elements];
      const updated = [...elements, ...newElements];

      saveElementsWithHistory(updated, oldElements, `Aggiunti ${newElements.length} file`);

      // Animate new elements
      setTimeout(() => {
        newElements.forEach(el => {
          const svgElement = document.querySelector(`[data-element-id="${el.id}"]`);
          if (svgElement) {
            svgElement.animate([
              { transform: 'scale(0.8)', opacity: 0 },
              { transform: 'scale(1)', opacity: 1 }
            ], {
              duration: 400,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
          }
        });
      }, 50);
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: ACCEPT_TYPES,
    drop: (item: any, monitor) => {
      // Handle File Drop
      if (monitor.getItemType() === NativeTypes.FILE) {
        const files = item.files;
        if (files && files.length > 0) {
          handleFileDrop(files, monitor.getClientOffset());
        }
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !svgRef.current) return;

      const svg = svgRef.current;
      const CTM = svg.getScreenCTM();
      if (!CTM) return;

      const svgX = (clientOffset.x - CTM.e) / CTM.a;
      const svgY = (clientOffset.y - CTM.f) / CTM.d;

      let newElement: CanvasElement;

      // Helper to determine drag mode (link, move, duplicate)
      const getDragMode = (): 'link' | 'duplicate' | 'move' => {
        if (item.dragMode) return item.dragMode;
        if (window.event) {
          const e = window.event as KeyboardEvent;
          if (e.shiftKey) return 'move';
          if (e.altKey) return 'duplicate';
        }
        return 'link';
      };

      const dragMode = getDragMode();

      if (item.itemType === ITEM_TYPE_TEXT_ELEMENT) {
        // If it's a file block and we're moving or duplicating, create a native file element
        if (item.blockType === 'file' && (dragMode === 'move' || dragMode === 'duplicate')) {
          newElement = {
            id: `el_${Date.now()}`,
            type: 'file',
            x: svgX - 100,
            y: svgY - 100,
            width: 200,
            height: 200,
            color: '#1976d2',
            strokeWidth: 2,
            fileMetadata: {
              fileName: item.fullBlock?.metadata?.fileName || item.content || 'New File',
              fileSize: item.fullBlock?.metadata?.fileSize || 0,
              fileType: item.fullBlock?.metadata?.fileType || 'application/octet-stream',
              filePreview: item.fullBlock?.metadata?.filePreview,
              fileLayout: item.fullBlock?.metadata?.fileLayout || 'square',
              files: item.fullBlock?.metadata?.files || []
            }
          };

          // If moving, delete from source
          if (dragMode === 'move' && item.sourceSpaceId) {
            const sourceSpace = spacesState.getSpace(item.sourceSpaceId);
            if (sourceSpace && sourceSpace.content?.blocks) {
              const updatedBlocks = sourceSpace.content.blocks.filter((b: any) => b.id !== (item.blockId || item.id));
              spacesState.updateSpace(item.sourceSpaceId, {
                content: { ...sourceSpace.content, blocks: updatedBlocks }
              });
            }
          }
        } else {
          const isFile = item.blockType === 'file';
          const isCalendar = item.blockType === 'calendar';

          newElement = {
            id: `el_${Date.now()}`,
            type: 'blockEmbed',
            x: svgX - (isFile ? 100 : isCalendar ? 150 : 200),
            y: svgY - (isFile ? 100 : isCalendar ? 75 : 50),
            width: isFile ? 200 : isCalendar ? 300 : 400,
            height: isFile ? 200 : isCalendar ? 150 : 100,
            color: '#1976d2',
            strokeWidth: 2,
            blockId: item.blockId || item.id,
            sourceSpaceId: item.sourceSpaceId,
            blockType: item.blockType,
            blockContent: item.content || '',
          };
        }
      } else if (item.itemType === 'CALENDAR_EVENT' || item.type === 'CALENDAR_EVENT') {
        newElement = {
          id: `el_${Date.now()}`,
          type: 'blockEmbed',
          x: svgX - 150,
          y: svgY - 75,
          width: 300,
          height: 150,
          color: '#1976d2',
          strokeWidth: 2,
          blockId: item.id,
          sourceSpaceId: item.spaceId,
          blockType: 'calendar',
          blockContent: item.title || '',
        };
      } else {
        const droppedSpaceId = item.spaceId || item.id;
        if (droppedSpaceId === space.id) {
          return;
        }

        newElement = {
          id: `el_${Date.now()}`,
          type: 'spaceEmbed',
          x: svgX - 200,
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

      const elementId = newElement.id;

      setElements(prevElements => {
        const updatedElements = [...prevElements, newElement];

        // Schedule side effects outside of the state updater
        setTimeout(() => {
          spacesState.updateSpace(space.id, {
            content: { elements: updatedElements }
          });

          const svgElement = document.querySelector(`[data-element-id="${elementId}"]`);
          if (svgElement) {
            svgElement.animate([
              { transform: 'scale(0)', opacity: 0 },
              { transform: 'scale(1)', opacity: 1 }
            ], {
              duration: 300,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
          }
        }, 0);

        return updatedElements;
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });

  useEffect(() => {
    if (space.content?.elements) {
      // Only update if elements have actually changed to avoid render loops
      if (JSON.stringify(space.content.elements) !== JSON.stringify(elements)) {
        setElements(space.content.elements);
      }
    }
  }, [space.content]);

  const saveElements = useCallback((newElements: CanvasElement[]) => {
    setElements(newElements);
    spacesState.updateSpace(space.id, {
      content: { elements: newElements }
    });
  }, [space.id, spacesState]);

  const saveElementsWithHistory = useCallback((
    newElements: CanvasElement[],
    oldElements: CanvasElement[],
    description: string
  ) => {
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
  }, [saveElements, pushAction]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      setElements(prevElements => {
        const oldElements = [...prevElements];

        // Find all descendants of selected items
        const getAllDescendants = (ids: string[]): string[] => {
          let descendants: string[] = [...ids];
          let queue = [...ids];
          while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = prevElements
              .filter(el => el.parentId === currentId && !descendants.includes(el.id));
            children.forEach(child => {
              descendants.push(child.id);
              queue.push(child.id);
            });
          }
          return descendants;
        };

        const idsToDelete = getAllDescendants(selectedIds);
        const newElements = prevElements.filter(e => !idsToDelete.includes(e.id));
        const count = idsToDelete.length;

        // Save to spaces state
        spacesState.updateSpace(space.id, {
          content: { elements: newElements }
        });

        // Push to history
        const oldElementsCopy = JSON.parse(JSON.stringify(oldElements));
        const newElementsCopy = JSON.parse(JSON.stringify(newElements));

        pushAction({
          type: 'canvas',
          description: `Eliminat${count > 1 ? 'i' : 'o'} ${count} element${count > 1 ? 'i' : 'o'}`,
          undo: () => {
            setElements(oldElementsCopy);
            spacesState.updateSpace(space.id, {
              content: { elements: oldElementsCopy }
            });
          },
          redo: () => {
            setElements(newElementsCopy);
            spacesState.updateSpace(space.id, {
              content: { elements: newElementsCopy }
            });
          }
        });

        return newElements;
      });
      setSelectedIds([]);
    }
  }, [selectedIds, space.id, spacesState, pushAction]);

  const zoomToSelection = useCallback(() => {
    if (selectedIds.length === 0) return;

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const allBounds = selectedElements.map(el => getElementBounds(el)).filter(b => b !== null) as { x: number; y: number; width: number; height: number }[];

    if (allBounds.length === 0) return;

    const minX = Math.min(...allBounds.map(b => b.x));
    const minY = Math.min(...allBounds.map(b => b.y));
    const maxX = Math.max(...allBounds.map(b => b.x + b.width));
    const maxY = Math.max(...allBounds.map(b => b.y + b.height));

    const width = maxX - minX;
    const height = maxY - minY;

    const padding = Math.max(width, height) * 0.2 || 100;

    const newViewBox = {
      x: minX - padding,
      y: minY - padding,
      width: width + padding * 2,
      height: height + padding * 2
    };

    setViewBox(newViewBox);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const newZoom = rect.width / newViewBox.width;
      if (isFinite(newZoom) && newZoom > 0) {
        setZoom(newZoom);
      }
    }
  }, [selectedIds, elements]);

  const zoomToFit = useCallback(() => {
    if (!svgRef.current || elements.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      const bounds = getElementBounds(element);
      if (bounds) {
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
      }
    });

    if (minX === Infinity) return;

    const padding = 0.1;
    const width = maxX - minX;
    const height = maxY - minY;
    const paddingX = width * padding;
    const paddingY = height * padding;

    minX -= paddingX;
    minY -= paddingY;
    const newWidth = width + paddingX * 2;
    const newHeight = height + paddingY * 2;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const aspectRatio = rect.width / rect.height;
    const contentAspectRatio = newWidth / newHeight;

    let finalWidth = newWidth;
    let finalHeight = newHeight;
    let finalX = minX;
    let finalY = minY;

    if (contentAspectRatio > aspectRatio) {
      finalHeight = newWidth / aspectRatio;
      finalY = minY - (finalHeight - newHeight) / 2;
    } else {
      finalWidth = newHeight * aspectRatio;
      finalX = minX - (finalWidth - newWidth) / 2;
    }

    const newViewBox = {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight
    };

    setViewBox(newViewBox);

    const newZoom = rect.width / finalWidth;
    if (isFinite(newZoom) && newZoom > 0) {
      setZoom(newZoom);
    }
  }, [elements]);

  const zoomToElement = useCallback((elementId: string) => {
    if (!svgRef.current) return;

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const bounds = getElementBounds(element);
    if (!bounds) return;

    const padding = 0.2;
    const paddingX = bounds.width * padding;
    const paddingY = bounds.height * padding;

    const minX = bounds.x - paddingX;
    const minY = bounds.y - paddingY;
    const newWidth = bounds.width + paddingX * 2;
    const newHeight = bounds.height + paddingY * 2;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const aspectRatio = rect.width / rect.height;
    const contentAspectRatio = newWidth / newHeight;

    let finalWidth = newWidth;
    let finalHeight = newHeight;
    let finalX = minX;
    let finalY = minY;

    if (contentAspectRatio > aspectRatio) {
      finalHeight = newWidth / aspectRatio;
      finalY = minY - (finalHeight - newHeight) / 2;
    } else {
      finalWidth = newHeight * aspectRatio;
      finalX = minX - (finalWidth - newWidth) / 2;
    }

    const newViewBox = {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight
    };

    setViewBox(newViewBox);

    const newZoom = rect.width / finalWidth;
    if (isFinite(newZoom) && newZoom > 0) {
      setZoom(newZoom);
    }
  }, [elements]);

  const setZoomLevel = useCallback((percentage: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newZoom = percentage / 100;
    const scaleFactor = zoom / newZoom;

    setZoom(newZoom);
    setViewBox(prev => ({
      ...prev,
      width: prev.width * scaleFactor,
      height: prev.height * scaleFactor,
      x: prev.x + (prev.width - prev.width * scaleFactor) / 2,
      y: prev.y + (prev.height - prev.height * scaleFactor) / 2
    }));
  }, [zoom]);

  const zoomToMaxArea = useCallback(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;

    let finalWidth = CANVAS_WIDTH;
    let finalHeight = CANVAS_HEIGHT;

    if (CANVAS_WIDTH / CANVAS_HEIGHT > aspectRatio) {
      finalHeight = CANVAS_WIDTH / aspectRatio;
    } else {
      finalWidth = CANVAS_HEIGHT * aspectRatio;
    }

    const newViewBox = {
      x: -finalWidth / 2,
      y: -finalHeight / 2,
      width: finalWidth,
      height: finalHeight
    };

    setViewBox(newViewBox);
    setZoom(rect.width / finalWidth);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      const target = e.target as HTMLElement;
      if (editingTextId || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const key = e.key.toLowerCase();

      // Tool selection
      if (['s', 't', 'p', 'r', 'c', 'l', 'a'].includes(key)) {
        e.preventDefault();
        switch (key) {
          case 's': setTool('select'); break;
          case 't': setTool('text'); break;
          case 'p': setTool('pen'); break;
          case 'r': setTool('rectangle'); break;
          case 'c': setTool('circle'); break;
          case 'l': setTool('line'); break;
          case 'a': setTool('arrow'); break;
        }
        return;
      }

      // Selection Zoom toggle
      if (key === 'z') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          zoomToSelection();
        } else {
          setIsZKeyPressed(true);
        }
        return;
      }

      // Adatta tutto
      if (key === 'o') {
        e.preventDefault();
        zoomToFit();
        return;
      }

      // Max area
      if (key === '0') {
        e.preventDefault();
        zoomToMaxArea();
        return;
      }

      // Zoom levels 1-9
      if (key >= '1' && key <= '9' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const level = parseInt(key);
        setZoomLevel(level * 10);
        return;
      }

      // Minimap
      if (key === 'm') {
        e.preventDefault();
        setShowMinimap(prev => !prev);
        return;
      }

      // Delete
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.length > 0) {
        e.preventDefault();
        deleteSelected();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, editingTextId, selectedIds, deleteSelected, zoomToFit, zoomToMaxArea, setZoomLevel]);

  const canElementSnap = (element: CanvasElement) => {
    // Only allow snapping to rectangles, circles, ellipses, text, images and files
    return element.type === 'rectangle' ||
      element.type === 'circle' ||
      element.type === 'text' ||
      element.type === 'spaceEmbed' ||
      element.type === 'blockEmbed' ||
      element.type === 'image' ||
      element.type === 'file';
  };

  // Helper for point rotation
  const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    };
  };

  const getSnapPoints = (element: CanvasElement) => {
    const bounds = getElementBounds(element);
    if (!bounds) return null;

    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const padding = element.type === 'text' ? 20 : 10;
    const rotation = element.rotation || 0;

    // Calculate unrotated snap points relative to center
    // Top
    const pTop = rotatePoint(cx, bounds.y - padding, cx, cy, rotation);
    // Right
    const pRight = rotatePoint(bounds.x + bounds.width + padding, cy, cx, cy, rotation);
    // Bottom
    const pBottom = rotatePoint(cx, bounds.y + bounds.height + padding, cx, cy, rotation);
    // Left
    const pLeft = rotatePoint(bounds.x - padding, cy, cx, cy, rotation);

    return {
      top: pTop,
      right: pRight,
      bottom: pBottom,
      left: pLeft
    };
  };

  const getClosestSnapPoint = (pos: { x: number; y: number }, element: CanvasElement) => {
    if (!canElementSnap(element)) return null;
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

  const getElementAtPosition = (pos: { x: number; y: number }): CanvasElement | null => {
    // Add padding for easier selection of thin elements like lines/arrows
    // Use a fixed visual padding divided by zoom to maintain screen size
    const hitPadding = 20 / zoom;

    const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
      if (l2 === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    };

    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];

      if (element.type === 'line' || element.type === 'arrow') {
        const coords = element.type === 'arrow' ? getArrowCoordinates(element) : { startX: element.x, startY: element.y, endX: element.x + (element.width || 0), endY: element.y + (element.height || 0) };
        if (distToSegment(pos.x, pos.y, coords.startX, coords.startY, coords.endX, coords.endY) < hitPadding / 2) {
          return element;
        }
        continue;
      }

      const bounds = getElementBounds(element);
      if (!bounds) continue;

      if (
        pos.x >= bounds.x - hitPadding &&
        pos.x <= bounds.x + bounds.width + hitPadding &&
        pos.y >= bounds.y - hitPadding &&
        pos.y <= bounds.y + bounds.height + hitPadding
      ) {
        return element;
      }
    }
    return null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      const target = e.target as HTMLElement;
      // Allow Escape to work in inputs (to blur them), but don't handle canvas logic if in input
      // However, usually Escape in input means "clear input" or "blur". 
      // If we stopPropagation here, we might block that.
      // But the original code does e.stopPropagation().
      // So if I am in an input and press Escape, I don't want to trigger canvas reset logic AND I don't want to stopPropagation?
      // Actually, if I am in an input, I want default behavior. So I should return early.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        // Always stop drawing/editing first
        if (isDrawing || arrowSnapStart) {
          setIsDrawing(false);
          setCurrentElement(null);
          setArrowSnapStart(null);
          setArrowSnapPreview(null);
        } else if (editingTextId) {
          setEditingTextId(null);
        } else if (selectedIds.length > 0) {
          setSelectedIds([]);
        } else if (tool !== 'select') {
          setTool('select');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, arrowSnapStart, isDrawing, editingTextId, selectedIds, isActive]);

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editingTextId]);

  useEffect(() => {
    if (['pen', 'rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
      setShowDrawingTip(true);
      const timer = setTimeout(() => {
        setShowDrawingTip(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowDrawingTip(false);
    }
  }, [tool]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.toolbar-menu') && !target.closest('.toolbar-button')) {
        setIsDrawingMenuOpen(false);
        setIsColorMenuOpen(false);
        setIsStrokeMenuOpen(false);
        setIsViewMenuOpen(false);
        setIsOptionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMousePos = (e: { clientX: number, clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };

    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

  // Clipboard and Alt-Drag Logic
  useEffect(() => {
    const handleClipboard = (e: KeyboardEvent) => {
      if (!isActive) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedIds.length > 0) {
          const selectedElements = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selectedElements);
        }
      }

      // Paste: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboard.length > 0) {
          const newElements = clipboard.map(el => ({
            ...el,
            id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: el.x + 20,
            y: el.y + 20,
            groupId: el.groupId ? `group_${Date.now()}_${Math.random()}` : undefined // Simple group regen
          }));

          const oldElements = [...elements];
          const updatedElements = [...elements, ...newElements];
          saveElementsWithHistory(updatedElements, oldElements, 'Incolla elementi');
          setSelectedIds(newElements.map(el => el.id));
        }
      }

      // Cut: Ctrl+X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        if (selectedIds.length > 0) {
          const selectedElements = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selectedElements);
          deleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleClipboard);
    return () => window.removeEventListener('keydown', handleClipboard);
  }, [clipboard, elements, selectedIds, deleteSelected, saveElementsWithHistory, isActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // No special hold behavior for Z anymore, unified in the main listener
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key.toLowerCase() === 'z' && selectedIds.length === 0) {
        setIsZKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive, selectedIds.length]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    try {
      hasMouseMovedRef.current = false;

      if (contextMenu) {
        setContextMenu(null);
      }

      if (e.button === 2 && selectedIds.length > 0 && tool === 'select') {
        e.preventDefault();
        handleContextMenu(e, selectedIds);
        return;
      }

      if (e.button === 1 || (e.button === 0 && e.altKey && !isDraggingElement)) { // Allow alt-panning if not on element
        // For middle mouse button (1), always pan regardless of what's under the cursor
        if (e.button === 1) {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          return;
        }

        // For Alt + Left Click, pan only if not on an element
        const pos = getMousePos(e);
        const clickedElement = getElementAtPosition(pos);

        if (!clickedElement || tool !== 'select') {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          return;
        }
      }

      const pos = getMousePos(e);

      if (tool === 'select') {
        const clickedElement = getElementAtPosition(pos);

        if (clickedElement) {
          // Handle element selection and dragging

          // Handle Nested Groups: Find the top-most group
          let topMostId = clickedElement.id;
          let current = clickedElement;
          while (current.parentId) {
            const parent = elements.find(el => el.id === current.parentId);
            if (parent) {
              topMostId = parent.id;
              current = parent;
            } else {
              break;
            }
          }

          const idsToSelect = getFullHierarchy(topMostId, elements);

          // Handle Alt-Drag Copy
          if (e.altKey) {
            const newIds: string[] = [];
            const newElementsList = [...elements];

            // Create copies of all selected elements (or just the clicked group)
            // If we are dragging an existing selection, copy all of them?
            // For simplicity, let's just copy the clicked group/element as per original logic
            // But original logic only copied ONE element.
            // Let's stick to copying the clicked element/group.

            idsToSelect.forEach(id => {
              const el = elements.find(e => e.id === id);
              if (el) {
                const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                newIds.push(newId);
                newElementsList.push({ ...el, id: newId });
              }
            });

            setElements(newElementsList);
            setSelectedIds(newIds);
            draggingIdsRef.current = newIds;
            setHoveredId(null);
            setIsDraggingElement(true);
            setDragStart(pos);
            elementsDragStartRef.current = newElementsList;
            return;
          }

          // Handle Shift-Click (Add to selection) or Regular Click
          if (e.shiftKey) {
            const newSelection = Array.from(new Set([...selectedIds, ...idsToSelect]));
            setSelectedIds(newSelection);
            draggingIdsRef.current = newSelection;
          } else {
            // If clicking an unselected element, replace selection
            // If clicking a selected element, keep selection (to allow dragging the group)
            const isAlreadySelected = idsToSelect.some(id => selectedIds.includes(id));
            if (!isAlreadySelected) {
              setSelectedIds(idsToSelect);
              draggingIdsRef.current = idsToSelect;
            } else {
              draggingIdsRef.current = selectedIds;
            }
          }

          setHoveredId(null);
          setIsDraggingElement(true);
          setDragStart(pos);
          dragStartRef.current = pos;
          elementsDragStartRef.current = [...elements];
          return;
        }

        // If no element clicked, start selection box
        setSelectionStart(pos);
        setIsRightToLeftSelection(false); // Reset selection direction
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
        return;
      }

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
        setTool('select');
        return;
      }

      if (tool === 'arrow') {
        // First try to find element at position
        let elementAt = getElementAtPosition(pos);
        let snapPoint: { x: number; y: number; side: 'top' | 'right' | 'bottom' | 'left' } | null = null;

        if (elementAt) {
          snapPoint = getClosestSnapPoint(pos, elementAt);
        }

        // If no element found or snap point not close enough, search all elements for nearby snap points
        if (!snapPoint || !elementAt) {
          for (const el of elements) {
            if (!canElementSnap(el)) continue;
            const snapPoints = getSnapPoints(el);
            if (!snapPoints) continue;

            for (const side of ['top', 'right', 'bottom', 'left'] as const) {
              const sp = snapPoints[side];
              const distance = Math.hypot(pos.x - sp.x, pos.y - sp.y);
              if (distance < 20) { // Snap threshold for clicking
                elementAt = el;
                snapPoint = { ...sp, side };
                break;
              }
            }
            if (snapPoint) break;
          }
        }

        if (elementAt && snapPoint) {
          // If we already have a start point, complete the arrow with a click
          if (arrowSnapStart && arrowSnapStart.elementId !== elementAt.id) {
            const newArrow: CanvasElement = {
              id: `el_${Date.now()}`,
              type: 'arrow',
              x: arrowSnapStart.x,
              y: arrowSnapStart.y,
              width: snapPoint.x - arrowSnapStart.x,
              height: snapPoint.y - arrowSnapStart.y,
              color,
              strokeWidth,
              arrowType: arrowType,
              curvature: arrowType === 'curved' ? 0.5 : undefined,
              anchorStart: { elementId: arrowSnapStart.elementId, side: arrowSnapStart.side },
              anchorEnd: { elementId: elementAt.id, side: snapPoint.side }
            };

            const oldElements = [...elements];
            const newElements = [...elements, newArrow];
            saveElementsWithHistory(newElements, oldElements, 'Freccia aggiunta');

            // Reset arrow tool state
            setArrowSnapStart(null);
            setArrowSnapPreview(null);
            setCurrentElement(null);
            setTool('select');
            return;
          }

          // Otherwise, set the start point
          setArrowSnapStart({ ...snapPoint, elementId: elementAt.id });
          setIsDrawing(false);
          setSelectedIds([]);
          return;
        } else if (arrowSnapStart) {
          // Clicking in empty space creates an arrow ending here
          const newArrow: CanvasElement = {
            id: `el_${Date.now()}`,
            type: 'arrow',
            x: arrowSnapStart.x,
            y: arrowSnapStart.y,
            width: pos.x - arrowSnapStart.x,
            height: pos.y - arrowSnapStart.y,
            color,
            strokeWidth,
            arrowType: arrowType,
            curvature: arrowType === 'curved' ? 0.5 : undefined,
            anchorStart: { elementId: arrowSnapStart.elementId, side: arrowSnapStart.side }
          };

          const oldElements = [...elements];
          const newElements = [...elements, newArrow];
          saveElementsWithHistory(newElements, oldElements, 'Freccia aggiunta');

          setArrowSnapStart(null);
          setArrowSnapPreview(null);
          setCurrentElement(null);
          setTool('select');
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
        radius: tool === 'rectangle' ? 32 : undefined,
        points: tool === 'pen' ? `${pos.x},${pos.y}` : undefined,
        arrowType: tool === 'arrow' ? arrowType : undefined,
        curvature: tool === 'arrow' && arrowType === 'curved' ? 0.5 : undefined
      };

      setCurrentElement(newElement);
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
    }
  }, [contextMenu, selectedIds, tool, elements, isDraggingElement, zoom, clipboard, arrowType, color, strokeWidth, arrowSnapStart, arrowSnapPreview, currentElement, saveElementsWithHistory]);

  const handleMouseMove = useCallback((e: any) => {
    hasMouseMovedRef.current = true;

    if (isPanning) {
      const dx = (panStart.x - e.clientX) * 2;
      const dy = (panStart.y - e.clientY) * 2;
      setViewBox(prev => {
        let newX = prev.x + dx;
        let newY = prev.y + dy;

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

    if (isDraggingArrowHandle) {
      const pos = getMousePos(e);
      const arrow = elements.find(el => el.id === isDraggingArrowHandle.arrowId);
      if (!arrow) return;

      // Handle waypoint dragging
      if (isDraggingArrowHandle.end === 'waypoint' && typeof isDraggingArrowHandle.index === 'number') {
        const index = isDraggingArrowHandle.index;
        setElements(prev => prev.map(el => {
          if (el.id !== isDraggingArrowHandle.arrowId) return el;
          const newWaypoints = [...(el.waypoints || [])];
          if (newWaypoints[index]) {
            newWaypoints[index] = { x: pos.x, y: pos.y };
          }
          return { ...el, waypoints: newWaypoints };
        }));
        return;
      }

      // Check for snap points
      let snapTarget: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number } | null = null;
      for (const el of elements) {
        if (!canElementSnap(el) || el.id === isDraggingArrowHandle.arrowId) continue;
        // Don't snap to the element on the other end
        if (isDraggingArrowHandle.end === 'start' && arrow.anchorEnd?.elementId === el.id) continue;
        if (isDraggingArrowHandle.end === 'end' && arrow.anchorStart?.elementId === el.id) continue;

        const snapPoints = getSnapPoints(el);
        if (!snapPoints) continue;

        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
          const sp = snapPoints[side];
          const distance = Math.hypot(pos.x - sp.x, pos.y - sp.y);
          if (distance < 30) {
            snapTarget = { elementId: el.id, side, x: sp.x, y: sp.y };
            break;
          }
        }
        if (snapTarget) break;
      }

      if (snapTarget) {
        setArrowSnapPreview({ x: snapTarget.x, y: snapTarget.y, side: snapTarget.side });
      } else {
        setArrowSnapPreview(null);
      }

      // Update arrow position in real-time
      setElements(prev => prev.map(el => {
        if (el.id !== isDraggingArrowHandle.arrowId) return el;

        const targetPos = snapTarget || pos;

        if (isDraggingArrowHandle.end === 'start') {
          // Moving start point
          const oldEndX = el.x + (el.width || 0);
          const oldEndY = el.y + (el.height || 0);
          return {
            ...el,
            x: targetPos.x,
            y: targetPos.y,
            width: oldEndX - targetPos.x,
            height: oldEndY - targetPos.y
          };
        } else {
          // Moving end point
          return {
            ...el,
            width: targetPos.x - el.x,
            height: targetPos.y - el.y
          };
        }
      }));

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

    if (isRotatingElement) {
      handleRotateMouseMove(e);
      return;
    }

    const pos = getMousePos(e);

    if (tool === 'select' && selectionStart) {
      const width = pos.x - selectionStart.x;
      const height = pos.y - selectionStart.y;

      const isRightToLeft = width < 0;
      // Stability: only update selection direction if we are not in zoom mode
      if (!isZKeyPressed) {
        setIsRightToLeftSelection(isRightToLeft);
      }

      setSelectionBox({
        x: width >= 0 ? selectionStart.x : selectionStart.x + width,
        y: height >= 0 ? selectionStart.y : selectionStart.y + height,
        width: Math.abs(width),
        height: Math.abs(height)
      });
      return;
    }

    if (tool === 'arrow') {
      let elementAt = getElementAtPosition(pos);
      let snapPoint: { x: number; y: number; side: 'top' | 'right' | 'bottom' | 'left' } | null = null;

      if (elementAt) {
        snapPoint = getClosestSnapPoint(pos, elementAt);
      } else {
        // Check if we're near any snap points
        for (const el of elements) {
          if (!canElementSnap(el)) continue;
          const snapPoints = getSnapPoints(el);
          if (!snapPoints) continue;

          for (const side of ['top', 'right', 'bottom', 'left'] as const) {
            const sp = snapPoints[side];
            const distance = Math.hypot(pos.x - sp.x, pos.y - sp.y);
            if (distance < 30) {
              elementAt = el;
              snapPoint = { ...sp, side };
              break;
            }
          }
          if (snapPoint) break;
        }
      }

      if (snapPoint) {
        setArrowSnapPreview(snapPoint);
      } else {
        setArrowSnapPreview(null);
      }

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
      if (tool === 'arrow' && arrowSnapStart) {
        // First try to find element at position
        let elementAt = getElementAtPosition(pos);
        let snapPoint: { x: number; y: number; side: 'top' | 'right' | 'bottom' | 'left' } | null = null;

        // If we found an element, get closest snap point
        if (elementAt && elementAt.id !== arrowSnapStart.elementId) {
          snapPoint = getClosestSnapPoint(pos, elementAt);
        } else {
          // If no element at position, check if we're near any snap points
          for (const el of elements) {
            if (!canElementSnap(el) || el.id === arrowSnapStart.elementId) continue;
            const snapPoints = getSnapPoints(el);
            if (!snapPoints) continue;

            // Check each snap point to see if we're close
            for (const side of ['top', 'right', 'bottom', 'left'] as const) {
              const sp = snapPoints[side];
              const distance = Math.hypot(pos.x - sp.x, pos.y - sp.y);
              if (distance < 30) { // Snap threshold
                elementAt = el;
                snapPoint = { ...sp, side };
                break;
              }
            }
            if (snapPoint) break;
          }
        }

        if (snapPoint && elementAt) {
          setArrowSnapPreview(snapPoint);
          setCurrentElement({
            ...currentElement,
            width: snapPoint.x - currentElement.x,
            height: snapPoint.y - currentElement.y
          });
          return;
        } else {
          setArrowSnapPreview(null);
        }
      }

      setCurrentElement({
        ...currentElement,
        width: pos.x - currentElement.x,
        height: pos.y - currentElement.y
      });
    }
  }, [isPanning, panStart, isDraggingArrowHandle, elements, isDraggingElement, isResizingElement, isRotatingElement, tool, selectionStart, arrowSnapStart, arrowSnapPreview, isDrawing, currentElement, color, strokeWidth, zoom, selectionBox, isRightToLeftSelection, arrowType, elementStartBounds, resizeHandle, dragStart, rotateStartAngle, elementStartRotation]);

  const handleMouseUp = useCallback((e?: any) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingArrowHandle) {
      const pos = e ? getMousePos(e) : null;
      if (!pos) {
        setIsDraggingArrowHandle(null);
        setArrowSnapPreview(null);
        setTool('select');
        return;
      }

      const arrow = elements.find(el => el.id === isDraggingArrowHandle.arrowId);
      if (!arrow) {
        setIsDraggingArrowHandle(null);
        setArrowSnapPreview(null);
        setTool('select');
        return;
      }

      // Check for snap target
      let snapTarget: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number } | null = null;
      for (const el of elements) {
        if (!canElementSnap(el) || el.id === isDraggingArrowHandle.arrowId) continue;
        // Don't snap to the element on the other end
        if (isDraggingArrowHandle.end === 'start' && arrow.anchorEnd?.elementId === el.id) continue;
        if (isDraggingArrowHandle.end === 'end' && arrow.anchorStart?.elementId === el.id) continue;

        const snapPoints = getSnapPoints(el);
        if (!snapPoints) continue;

        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
          const sp = snapPoints[side];
          const distance = Math.hypot(pos.x - sp.x, pos.y - sp.y);
          if (distance < 30) {
            snapTarget = { elementId: el.id, side, x: sp.x, y: sp.y };
            break;
          }
        }
        if (snapTarget) break;
      }

      // Update arrow with new anchor or waypoint
      const oldElements = [...elements];

      // Handle waypoint completion
      if (isDraggingArrowHandle.end === 'waypoint') {
        saveElementsWithHistory(elements, oldElements, 'Waypoint spostato');
        setIsDraggingArrowHandle(null);
        setArrowSnapPreview(null);
        setTool('select');
        return;
      }

      const newElements = elements.map(el => {
        if (el.id !== isDraggingArrowHandle.arrowId) return el;

        if (isDraggingArrowHandle.end === 'start') {
          if (snapTarget) {
            // Update start point and anchor
            const newWidth = (el.x + (el.width || 0)) - snapTarget.x;
            const newHeight = (el.y + (el.height || 0)) - snapTarget.y;
            return {
              ...el,
              x: snapTarget.x,
              y: snapTarget.y,
              width: newWidth,
              height: newHeight,
              anchorStart: { elementId: snapTarget.elementId, side: snapTarget.side }
            };
          } else {
            // Remove anchor
            const { anchorStart, ...rest } = el;
            return rest as CanvasElement;
          }
        } else {
          if (snapTarget) {
            // Update end point and anchor
            return {
              ...el,
              width: snapTarget.x - el.x,
              height: snapTarget.y - el.y,
              anchorEnd: { elementId: snapTarget.elementId, side: snapTarget.side }
            };
          } else {
            // Remove anchor
            const { anchorEnd, ...rest } = el;
            return rest as CanvasElement;
          }
        }
      });

      saveElementsWithHistory(newElements, oldElements, 'Freccia riconnessa');
      setIsDraggingArrowHandle(null);
      setArrowSnapPreview(null);
      setTool('select');
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

    if (isRotatingElement) {
      handleRotateMouseUp();
      return;
    }

    if (tool === 'select' && selectionBox) {
      if (isZKeyPressed) {
        // Selection Zoom
        const padding = Math.max(selectionBox.width, selectionBox.height) * 0.1;
        const newViewBox = {
          x: selectionBox.x - padding,
          y: selectionBox.y - padding,
          width: selectionBox.width + padding * 2,
          height: selectionBox.height + padding * 2
        };
        setViewBox(newViewBox);

        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const newZoom = rect.width / newViewBox.width;
          if (isFinite(newZoom) && newZoom > 0) {
            setZoom(newZoom);
          }
        }

        setSelectionBox(null);
        setSelectionStart(null);
        setIsZKeyPressed(false); // Reset mode after zoom
        return;
      }

      const selectedElements = elements.filter(el => {
        const bounds = getElementBounds(el);
        if (!bounds) return false;

        const isIntersecting = !(
          bounds.x + bounds.width < selectionBox.x ||
          bounds.x > selectionBox.x + selectionBox.width ||
          bounds.y + bounds.height < selectionBox.y ||
          bounds.y > selectionBox.y + selectionBox.height
        );

        const isContained =
          bounds.x >= selectionBox.x &&
          bounds.x + bounds.width <= selectionBox.x + selectionBox.width &&
          bounds.y >= selectionBox.y &&
          bounds.y + bounds.height <= selectionBox.y + selectionBox.height;

        if (isRightToLeftSelection) {
          // Crossing Selection: intersect for shapes, but for lines/arrows we want segment intersection if possible
          if (el.type === 'line' || el.type === 'arrow') {
            const coords = el.type === 'arrow' ? getArrowCoordinates(el) : { startX: el.x, startY: el.y, endX: el.x + (el.width || 0), endY: el.y + (el.height || 0) };

            const segmentIntersectsRect = (x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number) => {
              const pinr = (px: number, py: number) => px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
              if (pinr(x1, y1) || pinr(x2, y2)) return true;
              const lli = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
                const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                if (d === 0) return false;
                const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
                const u = ((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;
                return t >= 0 && t <= 1 && u >= 0 && u <= 1;
              };
              return lli(x1, y1, x2, y2, rx, ry, rx + rw, ry) || lli(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh) ||
                lli(x1, y1, x2, y2, rx, ry, rx, ry + rh) || lli(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
            };

            return segmentIntersectsRect(coords.startX, coords.startY, coords.endX, coords.endY, selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
          }
          return isIntersecting;
        } else {
          // Window Selection: must be fully covered
          return isContained;
        }
      });

      if (selectedElements.length > 0) {
        const newIds = selectedElements.map(el => el.id);

        if (e?.altKey) {
          // Remove selection
          setSelectedIds(prev => prev.filter(id => !newIds.includes(id)));
        } else if (e?.shiftKey) {
          setSelectedIds(prev => {
            const combined = [...prev, ...newIds];
            return Array.from(new Set(combined));
          });
        } else {
          setSelectedIds(newIds);
        }
      } else if (!e?.shiftKey && !e?.altKey) {
        // Clear selection if nothing selected (standard behavior)
        // But only if we weren't just adding to selection
        setSelectedIds([]);
      }

      setSelectionBox(null);
      setSelectionStart(null);
      return;
    }

    if (tool === 'select' && selectionStart && !hasMouseMovedRef.current && !e?.shiftKey && !e?.altKey) {
      setSelectedIds([]);
      setSelectionStart(null);
      return;
    }

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
        // Check if we have a snap preview (hovering over element)
        if (arrowSnapPreview) {
          // Find element that owns this snap point
          let targetElement: CanvasElement | null = null;
          const endX = currentElement.x + (currentElement.width || 0);
          const endY = currentElement.y + (currentElement.height || 0);

          // Check each element to see if the end point is near any of its snap points
          for (const el of elements) {
            if (!canElementSnap(el) || el.id === arrowSnapStart.elementId) continue;
            const snapPoints = getSnapPoints(el);
            if (!snapPoints) continue;

            // Check if we're close to any snap point of this element
            for (const side of ['top', 'right', 'bottom', 'left'] as const) {
              const sp = snapPoints[side];
              const distance = Math.hypot(endX - sp.x, endY - sp.y);
              if (distance < 30) { // Snap threshold
                targetElement = el;
                break;
              }
            }
            if (targetElement) break;
          }

          if (targetElement) {
            const snapPoint = arrowSnapPreview;
            const arrowWithAnchors = {
              ...currentElement,
              anchorStart: { elementId: arrowSnapStart.elementId, side: arrowSnapStart.side },
              anchorEnd: { elementId: targetElement.id, side: snapPoint.side },
              width: snapPoint.x - currentElement.x,
              height: snapPoint.y - currentElement.y
            };
            const oldElements = [...elements];
            const newElements = [...elements, arrowWithAnchors];
            saveElementsWithHistory(newElements, oldElements, 'Freccia aggiunta');
            setArrowSnapStart(null);
            setArrowSnapPreview(null);
            setIsDrawing(false);
            setCurrentElement(null);
            setTool('select');
            return;
          }
        }

        const arrowWithOneAnchor = {
          ...currentElement,
          anchorStart: { elementId: arrowSnapStart.elementId, side: arrowSnapStart.side }
        };
        const oldElements = [...elements];
        const newElements = [...elements, arrowWithOneAnchor];
        saveElementsWithHistory(newElements, oldElements, 'Freccia aggiunta');
        setArrowSnapStart(null);
        setArrowSnapPreview(null);
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

        // Auto-switch to select tool after placing rectangle, circle, or line (but not pen)
        if (tool === 'rectangle' || tool === 'circle' || tool === 'line' || tool === 'arrow') {
          setTool('select');
        }
      }
    }

    setIsDrawing(false);
    setCurrentElement(null);
  }, [isPanning, isDraggingArrowHandle, elements, isDraggingElement, isResizingElement, isRotatingElement, tool, selectionBox, isZKeyPressed, selectionStart, hasMouseMovedRef, currentElement, isDrawing, arrowSnapStart, arrowSnapPreview, color, strokeWidth, arrowType, saveElementsWithHistory, spacesState, space.id]);

  // Global mouse handlers for drag-out support - Moved here to avoid TDZ errors
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const clearCanvas = () => {
    const oldElements = [...elements];
    saveElementsWithHistory([], oldElements, 'Canvas svuotato');
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

  const toggleRoundedCorners = () => {
    if (selectedIds.length === 0) return;
    const oldElements = [...elements];
    const newElements = elements.map(el => {
      if (selectedIds.includes(el.id) && el.type === 'rectangle') {
        return { ...el, radius: el.radius ? 0 : 32 };
      }
      return el;
    });
    saveElementsWithHistory(newElements, oldElements, 'Angoli commutati');
  };

  const alignElements = (type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedIds.length < 2) return;

    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length === 0) return;

    const boundsList = selected.map(el => {
      const b = getElementBounds(el);
      return b ? { ...b, el } : null;
    }).filter(item => item !== null) as { x: number; y: number; width: number; height: number; el: CanvasElement }[];

    if (boundsList.length === 0) return;

    const minX = Math.min(...boundsList.map(b => b.x));
    const maxX = Math.max(...boundsList.map(b => b.x + b.width));
    const minY = Math.min(...boundsList.map(b => b.y));
    const maxY = Math.max(...boundsList.map(b => b.y + b.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newElements = elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;

      const boundsItem = boundsList.find(b => b.el.id === el.id);
      if (!boundsItem) return el;
      const bounds = boundsItem;

      let newX = el.x;
      let newY = el.y;

      switch (type) {
        case 'left':
          newX = minX - (bounds.x - el.x);
          break;
        case 'center-h':
          newX = el.x + (centerX - (bounds.x + bounds.width / 2));
          break;
        case 'right':
          newX = el.x + (maxX - (bounds.x + bounds.width));
          break;
        case 'top':
          newY = minY - (bounds.y - el.y);
          break;
        case 'center-v':
          newY = el.y + (centerY - (bounds.y + bounds.height / 2));
          break;
        case 'bottom':
          newY = el.y + (maxY - (bounds.y + bounds.height));
          break;
      }

      return { ...el, x: newX, y: newY };
    });

    saveElementsWithHistory(newElements, [...elements], `Allineamento ${type}`);
    setContextMenu(null);
  };

  const distributeElements = (type: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) return;

    const selected = elements.filter(el => selectedIds.includes(el.id));
    const boundsList = selected.map(el => {
      const b = getElementBounds(el);
      return b ? { ...b, el } : null;
    }).filter(item => item !== null) as { x: number; y: number; width: number; height: number; el: CanvasElement }[];

    if (boundsList.length < 3) return;

    // Sort by position
    const sorted = [...boundsList].sort((a, b) => {
      return type === 'horizontal' ? a.x - b.x : a.y - b.y;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const centerFirst = type === 'horizontal' ? first.x + first.width / 2 : first.y + first.height / 2;
    const centerLast = type === 'horizontal' ? last.x + last.width / 2 : last.y + last.height / 2;
    const totalDist = centerLast - centerFirst;
    const step = totalDist / (sorted.length - 1);

    const newElementMap = new Map();

    sorted.forEach((item, index) => {
      if (index === 0 || index === sorted.length - 1) return; // Keep ends fixed

      const currentCenter = type === 'horizontal' ? item.x + item.width / 2 : item.y + item.height / 2;
      const targetCenter = centerFirst + step * index;
      const diff = targetCenter - currentCenter;

      if (type === 'horizontal') {
        newElementMap.set(item.el.id, { ...item.el, x: item.el.x + diff });
      } else {
        newElementMap.set(item.el.id, { ...item.el, y: item.el.y + diff });
      }
    });

    const newElements = elements.map(el => newElementMap.get(el.id) || el);
    saveElementsWithHistory(newElements, [...elements], `Distribuzione ${type}`);
    setContextMenu(null);
  };

  // Helper to find descendants
  const getDescendants = useCallback((parentId: string, allElements: CanvasElement[]): string[] => {
    const children = allElements.filter(el => el.parentId === parentId);
    let descendants = children.map(c => c.id);
    children.forEach(c => {
      descendants = [...descendants, ...getDescendants(c.id, allElements)];
    });
    return descendants;
  }, []);

  // Helper to find all elements in a hierarchy (up or down)
  const getFullHierarchy = useCallback((elementId: string, allElements: CanvasElement[]): string[] => {
    // Find top-most parent
    let topParentId = elementId;
    let current = allElements.find(el => el.id === elementId);
    while (current?.parentId) {
      topParentId = current.parentId;
      current = allElements.find(el => el.id === current.parentId);
    }

    // Get all descendants of that top parent
    return [topParentId, ...getDescendants(topParentId, allElements)];
  }, [getDescendants]);

  const groupElements = () => {
    if (selectedIds.length < 2) return;

    const oldElements = [...elements];
    const groupId = `group_${Date.now()}`;

    // Calculate bounds for the new group element
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const allBounds = selectedElements.map(el => getElementBounds(el)).filter(b => b !== null) as { x: number; y: number; width: number; height: number }[];

    if (allBounds.length === 0) return;

    const minX = Math.min(...allBounds.map(b => b.x));
    const minY = Math.min(...allBounds.map(b => b.y));
    const maxX = Math.max(...allBounds.map(b => b.x + b.width));
    const maxY = Math.max(...allBounds.map(b => b.y + b.height));

    const newGroup: CanvasElement = {
      id: groupId,
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      color: 'transparent',
      strokeWidth: 0
    };

    const newElements = [
      ...elements.map(el =>
        selectedIds.includes(el.id) ? { ...el, parentId: groupId } : el
      ),
      newGroup
    ];

    saveElementsWithHistory(newElements, oldElements, 'Elementi raggruppati');
    setSelectedIds([groupId]);
  };

  const ungroupElements = () => {
    if (selectedIds.length === 0) return;

    const oldElements = [...elements];
    const newSelectedIds: string[] = [];

    // Find which groups are selected
    const selectedGroups = elements.filter(el => el.type === 'group' && selectedIds.includes(el.id));
    const selectedGroupIds = selectedGroups.map(g => g.id);

    if (selectedGroupIds.length === 0) {
      // If no group is selected but elements are, check if they have parents
      const elementParents = Array.from(new Set(
        elements.filter(el => selectedIds.includes(el.id) && el.parentId)
          .map(el => el.parentId!)
      ));
      if (elementParents.length > 0) {
        selectedGroupIds.push(...elementParents);
      } else {
        return;
      }
    }

    const newElements = elements
      .filter(el => !selectedGroupIds.includes(el.id)) // Remove the group element itself
      .map(el => {
        if (el.parentId && selectedGroupIds.includes(el.parentId)) {
          newSelectedIds.push(el.id);
          const { parentId, ...rest } = el;
          return rest as CanvasElement;
        }
        return el;
      });

    saveElementsWithHistory(newElements, oldElements, 'Gruppo separato');
    setSelectedIds(newSelectedIds);
  };

  const handleContextMenu = (e: React.MouseEvent, elementIds: string[]) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementIds
    });
  };

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
      case 'spaceEmbed':
      case 'blockEmbed':
      case 'image':
      case 'file':
        if (!element.width || !element.height) return null;
        const rx = element.width > 0 ? element.x : element.x + element.width;
        const ry = element.height > 0 ? element.y : element.y + element.height;
        const rw = Math.abs(element.width);
        const rh = Math.abs(element.height);
        const rot = element.rotation || 0;

        if (rot === 0) {
          return { x: rx, y: ry, width: rw, height: rh };
        }

        const rcx = rx + rw / 2;
        const rcy = ry + rh / 2;
        const corners = [
          rotatePoint(rx, ry, rcx, rcy, rot),
          rotatePoint(rx + rw, ry, rcx, rcy, rot),
          rotatePoint(rx + rw, ry + rh, rcx, rcy, rot),
          rotatePoint(rx, ry + rh, rcx, rcy, rot)
        ];

        let rectMinX = corners[0].x, rectMinY = corners[0].y, rectMaxX = corners[0].x, rectMaxY = corners[0].y;
        corners.forEach(p => {
          rectMinX = Math.min(rectMinX, p.x);
          rectMinY = Math.min(rectMinY, p.y);
          rectMaxX = Math.max(rectMaxX, p.x);
          rectMaxY = Math.max(rectMaxY, p.y);
        });

        return { x: rectMinX, y: rectMinY, width: rectMaxX - rectMinX, height: rectMaxY - rectMinY };

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
        // Allow 0 width or height for orthogonal lines
        if (element.width === undefined || element.height === undefined) return null;

        let pts: { x: number; y: number }[] = [];

        if (element.type === 'arrow') {
          const coords = getArrowCoordinates(element);
          pts.push({ x: coords.startX, y: coords.startY });
          pts.push({ x: coords.endX, y: coords.endY });

          if (element.waypoints && element.waypoints.length > 0) {
            pts.push(...element.waypoints);
          }

          if (element.arrowType === 'electrical' || !element.arrowType || element.arrowType === 'straight') {
            const stubLength = 20;
            const startSide = element.anchorStart?.side || 'right';
            const endSide = element.anchorEnd?.side || 'left';

            const getStub = (x: number, y: number, side: string) => {
              if (side === 'top') return { x, y: y - stubLength };
              if (side === 'bottom') return { x, y: y + stubLength };
              if (side === 'left') return { x: x - stubLength, y };
              return { x: x + stubLength, y };
            };

            pts.push(getStub(coords.startX, coords.startY, startSide));
            pts.push(getStub(coords.endX, coords.endY, endSide));
          }

          if (element.arrowType === 'curved') {
            const dx = coords.endX - coords.startX;
            const dy = coords.endY - coords.startY;
            const midX = (coords.startX + coords.endX) / 2;
            const midY = (coords.startY + coords.endY) / 2;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
              const normPerpX = -dy / len;
              const normPerpY = dx / len;
              const offset = (element.curvature || 0.5) * 100;
              pts.push({
                x: midX + normPerpX * offset,
                y: midY + normPerpY * offset
              });
            }
          }
        } else {
          pts.push({ x: element.x, y: element.y });
          pts.push({ x: element.x + (element.width || 0), y: element.y + (element.height || 0) });
        }

        let lineMinX = pts[0].x;
        let lineMinY = pts[0].y;
        let lineMaxX = pts[0].x;
        let lineMaxY = pts[0].y;

        pts.forEach(p => {
          lineMinX = Math.min(lineMinX, p.x);
          lineMinY = Math.min(lineMinY, p.y);
          lineMaxX = Math.max(lineMaxX, p.x);
          lineMaxY = Math.max(lineMaxY, p.y);
        });

        return {
          x: lineMinX,
          y: lineMinY,
          width: lineMaxX - lineMinX,
          height: lineMaxY - lineMinY
        };

      case 'image':
        return {
          x: element.x,
          y: element.y,
          width: element.width || 0,
          height: element.height || 0
        };

      case 'file':
        return {
          x: element.x,
          y: element.y,
          width: element.width || 200,
          height: element.height || 200
        };

      case 'group':
        // Calculate bounds based on all descendants
        const descendants = elements.filter(el => {
          let curr = el;
          while (curr.parentId) {
            if (curr.parentId === element.id) return true;
            curr = elements.find(e => e.id === curr.parentId) || { id: 'root' } as any;
          }
          return false;
        });

        if (descendants.length === 0) return { x: element.x, y: element.y, width: element.width || 0, height: element.height || 0 };

        let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
        descendants.forEach(d => {
          const b = getElementBounds(d);
          if (b) {
            gMinX = Math.min(gMinX, b.x);
            gMinY = Math.min(gMinY, b.y);
            gMaxX = Math.max(gMaxX, b.x + b.width);
            gMaxY = Math.max(gMaxY, b.y + b.height);
          }
        });

        if (gMinX === Infinity) return { x: element.x, y: element.y, width: element.width || 0, height: element.height || 0 };
        return { x: gMinX, y: gMinY, width: gMaxX - gMinX, height: gMaxY - gMinY };

      case 'text':
        const fontSize = element.fontSize || 16;
        const text = element.text || '';
        const textWidth = Math.max(text.length * fontSize * 0.6, 20);
        const textHeight = fontSize * 1.2;
        return {
          x: element.x - 5,
          y: element.y - textHeight - 5,
          width: textWidth + 10,
          height: textHeight + 10
        };

      default:
        return null;
    }
  };

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
        return { ...element, x: element.x + dx, y: element.y + dy };
    }
  };

  const elementsDragStartRef = useRef<CanvasElement[]>([]);

  const handleBoundingBoxMouseDown = (e: React.MouseEvent) => {
    // If shift is pressed, allow propagation to start selection box
    if (e.shiftKey) return;

    if (selectedIds.length === 0) return;
    // Ignore middle mouse button - allow panning
    if (e.button === 1) return;
    e.stopPropagation();
    setHoveredId(null);
    setIsDraggingElement(true);
    const pos = getMousePos(e as any);
    setDragStart(pos);
    dragStartRef.current = pos;
    elementsDragStartRef.current = [...elements];
  };

  const handleBoundingBoxMouseMove = (e: any) => {
    if (!isDraggingElement) return;
    const pos = getMousePos(e as any);
    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;

    const idsToMove = draggingIdsRef.current.length > 0 ? draggingIdsRef.current : selectedIds;

    // Expand idsToMove to include all descendants
    const getAllDescendants = (ids: string[]): string[] => {
      let result = [...ids];
      let queue = [...ids];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = elements.filter(el => el.parentId === currentId && !result.includes(el.id));
        children.forEach(child => {
          result.push(child.id);
          queue.push(child.id);
        });
      }
      return result;
    };

    const finalIdsToMove = getAllDescendants(idsToMove);
    const startElements = elementsDragStartRef.current;

    setElements(prevElements => {
      // Create a map of moved elements for quick lookup of their NEW positions
      const movedElementsMap = new Map<string, CanvasElement>();

      // Calculate new positions for all moved elements based on their START positions
      finalIdsToMove.forEach(id => {
        const startEl = startElements.find(e => e.id === id);
        if (startEl) {
          movedElementsMap.set(id, moveElement(startEl, dx, dy));
        }
      });

      return prevElements.map(el => {
        // If this element is being moved, return the pre-calculated new position
        if (finalIdsToMove.includes(el.id)) {
          return movedElementsMap.get(el.id) || el;
        }

        // Update arrows connected to moving elements
        if (el.type === 'arrow') {
          const startMoved = el.anchorStart?.elementId && idsToMove.includes(el.anchorStart.elementId);
          const endMoved = el.anchorEnd?.elementId && idsToMove.includes(el.anchorEnd.elementId);

          if (!startMoved && !endMoved) return el;

          // Find the referenced elements (either moved or original)
          let startEl = prevElements.find(e => e.id === el.anchorStart?.elementId);
          let endEl = prevElements.find(e => e.id === el.anchorEnd?.elementId);

          if (startMoved && el.anchorStart?.elementId) {
            startEl = movedElementsMap.get(el.anchorStart.elementId);
          }
          if (endMoved && el.anchorEnd?.elementId) {
            endEl = movedElementsMap.get(el.anchorEnd.elementId);
          }

          let startX = el.x;
          let startY = el.y;
          let endX = el.x + (el.width || 0);
          let endY = el.y + (el.height || 0);

          // Update start point if anchored
          if (startEl && el.anchorStart) {
            const snapPoints = getSnapPoints(startEl);
            if (snapPoints) {
              const pt = snapPoints[el.anchorStart.side];
              startX = pt.x;
              startY = pt.y;
            }
          }

          // Update end point if anchored
          if (endEl && el.anchorEnd) {
            const snapPoints = getSnapPoints(endEl);
            if (snapPoints) {
              const pt = snapPoints[el.anchorEnd.side];
              endX = pt.x;
              endY = pt.y;
            }
          }

          return {
            ...el,
            x: startX,
            y: startY,
            width: endX - startX,
            height: endY - startY
          };
        }
        return el;
      });
    });
    // Do NOT update dragStart here to maintain absolute delta calculation
  };

  const handleBoundingBoxMouseUp = () => {
    setIsDraggingElement(false);
    draggingIdsRef.current = [];

    correctArrowIntersections(selectedIds);

    const oldElements = elementsDragStartRef.current;
    const newElements = [...elements];
    const count = selectedIds.length;

    if (JSON.stringify(oldElements) !== JSON.stringify(newElements)) {
      saveElementsWithHistory(
        newElements,
        oldElements,
        `Spostato${count > 1 ? 'i' : ''} ${count} element${count > 1 ? 'i' : 'o'}`
      );
    } else {
      spacesState.updateSpace(space.id, {
        content: { elements }
      });
    }
  };

  const correctArrowIntersections = (movedIds: string[]) => {
    if (movedIds.length === 0) return;

    setElements(prevElements => {
      // Find all arrows connected to moved elements
      const connectedArrows = prevElements.filter(el =>
        el.type === 'arrow' &&
        ((el.anchorStart?.elementId && movedIds.includes(el.anchorStart.elementId)) ||
          (el.anchorEnd?.elementId && movedIds.includes(el.anchorEnd.elementId)))
      );

      if (connectedArrows.length === 0) return prevElements;

      // OPTIMIZATION: Prune obstacles for each arrow later or globally here? 
      // Let's keep it simple but skip groups/arrows
      const obstacles = prevElements
        .filter(el => el.type !== 'arrow' && el.type !== 'group' && !movedIds.includes(el.id))
        .map(el => getElementBounds(el))
        .filter((b): b is { x: number; y: number; width: number; height: number } => b !== null);

      const isSegmentBlocked = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        const xmin = Math.min(p1.x, p2.x) - 10;
        const xmax = Math.max(p1.x, p2.x) + 10;
        const ymin = Math.min(p1.y, p2.y) - 10;
        const ymax = Math.max(p1.y, p2.y) + 10;
        return obstacles.some(obs => !(xmax < obs.x || xmin > obs.x + obs.width || ymax < obs.y || ymin > obs.y + obs.height));
      };

      return prevElements.map(el => {
        if (el.type !== 'arrow' || !connectedArrows.find(a => a.id === el.id)) return el;

        let updated = false;
        let newControlPoint = el.controlPoint;
        let newWaypoints = el.waypoints ? [...el.waypoints] : undefined;

        const coords = getArrowCoordinates(el);
        const { startX, startY, endX, endY } = coords;
        const startSide = el.anchorStart?.side || 'right';
        const endSide = el.anchorEnd?.side || 'left';

        const stubLength = 20;
        const getStub = (x: number, y: number, side: string) => {
          if (side === 'top') return { x, y: y - stubLength };
          if (side === 'bottom') return { x, y: y + stubLength };
          if (side === 'left') return { x: x - stubLength, y };
          return { x: x + stubLength, y };
        };
        const sS = getStub(startX, startY, startSide);
        const eS = getStub(endX, endY, endSide);

        if (newControlPoint !== undefined) {
          const isVert = (startSide === 'right' || startSide === 'left') && (endSide === 'right' || endSide === 'left');
          const pMid1 = isVert ? { x: newControlPoint, y: sS.y } : { x: sS.x, y: newControlPoint };
          const pMid2 = isVert ? { x: newControlPoint, y: eS.y } : { x: eS.x, y: newControlPoint };

          if (isSegmentBlocked(sS, pMid1) || isSegmentBlocked(pMid1, pMid2) || isSegmentBlocked(pMid2, eS)) {
            const searchOffsets = [40, -40, 80, -80, 120, -120];
            for (const offset of searchOffsets) {
              const testVal = newControlPoint + offset;
              const tp1 = isVert ? { x: testVal, y: sS.y } : { x: sS.x, y: testVal };
              const tp2 = isVert ? { x: testVal, y: eS.y } : { x: eS.x, y: testVal };
              if (!isSegmentBlocked(sS, tp1) && !isSegmentBlocked(tp1, tp2) && !isSegmentBlocked(tp2, eS)) {
                newControlPoint = testVal;
                updated = true;
                break;
              }
            }
          }
        }

        if (newWaypoints && newWaypoints.length > 0) {
          newWaypoints = newWaypoints.map((wp, i) => {
            const isInside = obstacles.some(obs => wp.x > obs.x && wp.x < obs.x + obs.width && wp.y > obs.y && wp.y < obs.y + obs.height);
            if (isInside) {
              updated = true;
              return { x: wp.x + 50, y: wp.y + 50 };
            }
            return wp;
          });
        }

        if (updated) {
          return { ...el, controlPoint: newControlPoint, waypoints: newWaypoints };
        }
        return el;
      });
    });
  };


  const handleRotateMouseDown = (e: React.MouseEvent) => {
    if (selectedIds.length === 0) return;

    const element = elements.find(el => el.id === selectedIds[0]);
    if (!element || element.type === 'file') return; // Prevent file rotation but allow images

    e.stopPropagation();
    setIsRotatingElement(true);

    const pos = getMousePos(e as any);

    const bounds = getElementBounds(element);
    if (!bounds) return;

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
    setRotateStartAngle(angle);
    setElementStartRotation(element.rotation || 0);
  };

  const handleRotateMouseMove = (e: any) => {
    if (!isRotatingElement || selectedIds.length === 0 || rotateStartAngle === null) return;
    const pos = getMousePos(e as any);
    const element = elements.find(el => el.id === selectedIds[0]);
    if (!element || element.type === 'image' || element.type === 'file') {
      setIsRotatingElement(false);
      return;
    }

    const bounds = getElementBounds(element);
    if (!bounds) return;

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
    const angleDelta = currentAngle - rotateStartAngle;

    let newRotation = (elementStartRotation || 0) + angleDelta;

    if (e.shiftKey) {
      newRotation = Math.round(newRotation / 15) * 15;
    }

    setElements(prev => prev.map(el =>
      el.id === element.id ? { ...el, rotation: newRotation } : el
    ));
  };

  const handleRotateMouseUp = () => {
    setIsRotatingElement(false);
    setRotateStartAngle(null);
    setElementStartRotation(null);
    spacesState.updateSpace(space.id, {
      content: { elements }
    });
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

  const handleResizeMouseMove = (e: any) => {
    if (!isResizingElement || !elementStartBounds || !resizeHandle) return;
    const pos = getMousePos(e as any);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    const isCenterScaling = e.altKey;

    setElements(prevElements => {
      return prevElements.map(el => {
        if (el.id === selectedIds[0]) {
          const bounds = getElementBounds(el);
          if (bounds) {
            let newWidth = elementStartBounds.width;
            let newHeight = elementStartBounds.height;
            let newX = elementStartBounds.x;
            let newY = elementStartBounds.y;

            // Determine dimensions first
            if (isCenterScaling) {
              switch (resizeHandle) {
                case 'nw': newWidth = elementStartBounds.width - dx * 2; newHeight = elementStartBounds.height - dy * 2; break;
                case 'ne': newWidth = elementStartBounds.width + dx * 2; newHeight = elementStartBounds.height - dy * 2; break;
                case 'sw': newWidth = elementStartBounds.width - dx * 2; newHeight = elementStartBounds.height + dy * 2; break;
                case 'se': newWidth = elementStartBounds.width + dx * 2; newHeight = elementStartBounds.height + dy * 2; break;
                case 'n': newHeight = elementStartBounds.height - dy * 2; break;
                case 's': newHeight = elementStartBounds.height + dy * 2; break;
                case 'e': newWidth = elementStartBounds.width + dx * 2; break;
                case 'w': newWidth = elementStartBounds.width - dx * 2; break;
              }
            } else {
              switch (resizeHandle) {
                case 'nw': newWidth = elementStartBounds.width - dx; newHeight = elementStartBounds.height - dy; break;
                case 'ne': newWidth = elementStartBounds.width + dx; newHeight = elementStartBounds.height - dy; break;
                case 'sw': newWidth = elementStartBounds.width - dx; newHeight = elementStartBounds.height + dy; break;
                case 'se': newWidth = elementStartBounds.width + dx; newHeight = elementStartBounds.height + dy; break;
                case 'n': newHeight = elementStartBounds.height - dy; break;
                case 's': newHeight = elementStartBounds.height + dy; break;
                case 'e': newWidth = elementStartBounds.width + dx; break;
                case 'w': newWidth = elementStartBounds.width - dx; break;
              }
            }

            // Apply proportional constraint if needed (always for images)
            if (el.type === 'image' || e.shiftKey) {
              const startAR = elementStartBounds.width / elementStartBounds.height;

              if (['nw', 'ne', 'sw', 'se'].includes(resizeHandle)) {
                // If it's a corner, we match the larger change or the one that keeps AR
                if (Math.abs(newWidth / elementStartBounds.width) > Math.abs(newHeight / elementStartBounds.height)) {
                  newHeight = newWidth / startAR;
                } else {
                  newWidth = newHeight * startAR;
                }
              } else if (el.type === 'image') {
                // For images, even side handles should scale proportionally
                if (['n', 's'].includes(resizeHandle)) {
                  newWidth = newHeight * startAR;
                } else {
                  newHeight = newWidth / startAR;
                }
              }
            }

            // Minimum size limit 20x20 to prevent flipping and distortion
            const minSize = 20;
            if (newWidth < minSize) {
              newWidth = minSize;
              if (el.type === 'image' || e.shiftKey) {
                const startAR = elementStartBounds.width / elementStartBounds.height;
                newHeight = newWidth / startAR;
              }
            }
            if (newHeight < minSize) {
              newHeight = minSize;
              if (el.type === 'image' || e.shiftKey) {
                const startAR = elementStartBounds.width / elementStartBounds.height;
                newWidth = newHeight * startAR;
              }
            }

            // Recalculate position based on dimensions and handle
            if (isCenterScaling) {
              newX = elementStartBounds.x + (elementStartBounds.width - newWidth) / 2;
              newY = elementStartBounds.y + (elementStartBounds.height - newHeight) / 2;
            } else {
              switch (resizeHandle) {
                case 'nw':
                  newX = elementStartBounds.x + (elementStartBounds.width - newWidth);
                  newY = elementStartBounds.y + (elementStartBounds.height - newHeight);
                  break;
                case 'ne':
                  newY = elementStartBounds.y + (elementStartBounds.height - newHeight);
                  break;
                case 'sw':
                  newX = elementStartBounds.x + (elementStartBounds.width - newWidth);
                  break;
                case 'w':
                  newX = elementStartBounds.x + (elementStartBounds.width - newWidth);
                  break;
                case 'n':
                  newY = elementStartBounds.y + (elementStartBounds.height - newHeight);
                  break;
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
        }
        return el;
      });
    });
    // Do not update dragStart here for center scaling or normal scaling
    // We are calculating from start bounds every time to avoid drift
    // setDragStart(pos); -> Removed to use total delta from start
  };

  const handleResizeMouseUp = () => {
    setIsResizingElement(false);
    setResizeHandle(null);
    setElementStartBounds(null);
    correctArrowIntersections(selectedIds);
    spacesState.updateSpace(space.id, {
      content: { elements }
    });
  };

  const handleMinimapMouseDown = (e: React.MouseEvent<SVGRectElement>) => {
    setIsDraggingMinimap(true);
    // Calculate the clicked position in canvas coordinates
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH - CANVAS_WIDTH / 2;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - CANVAS_HEIGHT / 2;

    // Center the viewbox on the clicked position
    setViewBox(prev => ({
      ...prev,
      x: x - prev.width / 2,
      y: y - prev.height / 2
    }));
  };

  const handleMinimapMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingMinimap) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH - CANVAS_WIDTH / 2;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - CANVAS_HEIGHT / 2;

    setViewBox(prev => ({
      ...prev,
      x: x - prev.width / 2,
      y: y - prev.height / 2
    }));
  };

  const handleMinimapMouseUp = () => {
    setIsDraggingMinimap(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) return;

    // Discriminate between Trackpad and Mouse Wheel
    // 1. Trackpad Pinch: e.ctrlKey is true -> Zoom (Smooth)
    // 2. Trackpad Scroll: e.deltaMode === 0 (pixel precision) -> Pan
    // 3. Mouse Wheel: e.deltaMode !== 0 (line/page precision) -> Zoom (Step)
    // 4. Shift + Mouse Wheel -> Pan

    const isPinch = e.ctrlKey;
    const isTrackpad = e.deltaMode === 0; // Pixel-precise scrolling (Trackpad, Magic Mouse)

    // Improved logic to allow scroll wheel zoom on smooth mice (which report deltaMode 0)
    // If it's a pure vertical scroll (deltaX is 0) and Shift is NOT pressed, 
    // we treat it as a zoom request for standard CAD behavior, 
    // unless it's a pinch (which always zooms).
    const isPureVerticalScroll = e.deltaX === 0;
    const shouldZoom = isPinch || (isPureVerticalScroll && !e.shiftKey) || (!isTrackpad && !e.shiftKey);

    if (shouldZoom) {
      const CTM = svg.getScreenCTM();
      if (!CTM) return;

      const mouseX = (e.clientX - CTM.e) / CTM.a;
      const mouseY = (e.clientY - CTM.f) / CTM.d;

      let nextZoom: number;

      if (isPinch) {
        // Smooth zoom for trackpad pinch
        const sensitivity = 0.01;
        nextZoom = zoom - (e.deltaY * sensitivity * zoom);
      } else {
        // Step zoom for mouse wheel
        nextZoom = zoom * (e.deltaY > 0 ? 0.9 : 1.1);
      }

      // Clamp zoom levels
      nextZoom = Math.min(Math.max(nextZoom, 0.1), 10);

      // Optimization: Don't update if change is negligible
      if (Math.abs(nextZoom - zoom) < 0.0001) return;

      setZoom(nextZoom);

      const scaleFactor = zoom / nextZoom;

      const newWidth = viewBox.width * scaleFactor;
      const newHeight = viewBox.height * scaleFactor;

      const mouseXRatio = (mouseX - viewBox.x) / viewBox.width;
      const mouseYRatio = (mouseY - viewBox.y) / viewBox.height;

      let newX = mouseX - mouseXRatio * newWidth;
      let newY = mouseY - mouseYRatio * newHeight;

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
      // Pan Logic
      // Trackpads usually pan 1:1, mouse wheel with shift might be faster
      const panSpeed = isTrackpad ? 1.0 : 1.5;

      setViewBox(prev => {
        let newX = prev.x + e.deltaX * panSpeed;
        let newY = prev.y + e.deltaY * panSpeed;

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

  // Get actual arrow coordinates considering anchors
  const getArrowCoordinates = (arrow: CanvasElement) => {
    let startX = arrow.x;
    let startY = arrow.y;
    let endX = arrow.x + (arrow.width || 0);
    let endY = arrow.y + (arrow.height || 0);

    // If arrow has anchor start, use the snap point of the anchored element
    if (arrow.anchorStart) {
      const anchoredElement = elements.find(el => el.id === arrow.anchorStart!.elementId);
      if (anchoredElement) {
        const snapPoints = getSnapPoints(anchoredElement);
        if (snapPoints) {
          const snapPoint = snapPoints[arrow.anchorStart.side];
          startX = snapPoint.x;
          startY = snapPoint.y;
        }
      }
    }

    // If arrow has anchor end, use the snap point of the anchored element
    if (arrow.anchorEnd) {
      const anchoredElement = elements.find(el => el.id === arrow.anchorEnd!.elementId);
      if (anchoredElement) {
        const snapPoints = getSnapPoints(anchoredElement);
        if (snapPoints) {
          const snapPoint = snapPoints[arrow.anchorEnd.side];
          endX = snapPoint.x;
          endY = snapPoint.y;
        }
      }
    }

    return { startX, startY, endX, endY };
  };

  // Generate arrow path based on type
  const getArrowPath = (element: CanvasElement, x1: number, y1: number, x2: number, y2: number) => {
    // Default to electrical (Schematic) if straight was selected before or undefined
    const arrowType = (element.arrowType === 'straight' || !element.arrowType) ? 'electrical' : element.arrowType;
    const curvature = element.curvature || 0.5;

    switch (arrowType) {
      case 'curved': {
        // Bezier curve
        const dx = x2 - x1;
        const dy = y2 - y1;
        const perpX = -dy;
        const perpY = dx;
        const len = Math.sqrt(perpX * perpX + perpY * perpY);
        if (len === 0) return `M ${x1},${y1} L ${x2},${y2}`;
        const normPerpX = perpX / len;
        const normPerpY = perpY / len;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const offset = curvature * 100;
        const controlX = midX + normPerpX * offset;
        const controlY = midY + normPerpY * offset;
        return `M ${x1},${y1} Q ${controlX},${controlY} ${x2},${y2}`;
      }
      case 'electrical': {
        // Schematic (PCB) routing with Bevels and Collision Avoidance
        const anchorStart = element.anchorStart;
        const anchorEnd = element.anchorEnd;

        const startSide = anchorStart?.side || 'right';
        const endSide = anchorEnd?.side || 'left';

        // Calculate stubs (lead wires perpendicular to anchor)
        const stubLength = 20;

        const getStub = (x: number, y: number, side: string) => {
          if (side === 'top') return { x, y: y - stubLength };
          if (side === 'bottom') return { x, y: y + stubLength };
          if (side === 'left') return { x: x - stubLength, y };
          return { x: x + stubLength, y }; // right
        };

        const startStub = getStub(x1, y1, startSide);
        const endStub = getStub(x2, y2, endSide);

        // Collect points for the polyline
        const points = [{ x: x1, y: y1 }, { x: startStub.x, y: startStub.y }];

        // Get obstacles (other elements' bounds) - OPTIMIZED: skip far away elements
        const margin = 200;
        const minSegX = Math.min(x1, x2) - margin;
        const maxSegX = Math.max(x1, x2) + margin;
        const minSegY = Math.min(y1, y2) - margin;
        const maxSegY = Math.max(y1, y2) + margin;

        const obstacles = elements
          .filter(el => {
            if (el.id === element.id) return false;
            if (anchorStart && el.id === anchorStart.elementId) return false;
            if (anchorEnd && el.id === anchorEnd.elementId) return false;
            if (el.type === 'group' || el.type === 'arrow') return false; // Ignore groups and other arrows for routing
            return true;
          })
          .map(el => getElementBounds(el))
          .filter((b): b is { x: number; y: number; width: number; height: number } => {
            if (!b) return false;
            // Pruning: Skip obstacles that cannot possibly intersect the routing area
            return !(b.x > maxSegX || b.x + b.width < minSegX || b.y > maxSegY || b.y + b.height < minSegY);
          });

        const isBlocked = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
          const xmin = Math.min(p1.x, p2.x) - 8;
          const xmax = Math.max(p1.x, p2.x) + 8;
          const ymin = Math.min(p1.y, p2.y) - 8;
          const ymax = Math.max(p1.y, p2.y) + 8;

          return obstacles.some(obs => {
            // Collision if segment AABB intersects obstacle AABB
            return !(xmax < obs.x || xmin > obs.x + obs.width || ymax < obs.y || ymin > obs.y + obs.height);
          });
        };

        const findClearMid = (start: { x: number, y: number }, end: { x: number, y: number }, horizontal: boolean, baseVal: number) => {
          const searchOffsets = [0, 40, -40, 80, -80, 120, -120, 160, -160, 200, -200];
          for (const offset of searchOffsets) {
            const val = baseVal + offset;
            let pM1, pM2;
            if (horizontal) {
              pM1 = { x: val, y: start.y };
              pM2 = { x: val, y: end.y };
            } else {
              pM1 = { x: start.x, y: val };
              pM2 = { x: end.x, y: val };
            }
            if (!isBlocked(start, pM1) && !isBlocked(pM1, pM2) && !isBlocked(pM2, end)) {
              return { pM1, pM2 };
            }
          }
          // Fallback to base
          if (horizontal) {
            return { pM1: { x: baseVal, y: start.y }, pM2: { x: baseVal, y: end.y } };
          }
          return { pM1: { x: start.x, y: baseVal }, pM2: { x: end.x, y: baseVal } };
        };

        // Check if manual waypoints exist
        if (element.waypoints && element.waypoints.length > 0) {
          let lastPoint = startStub;

          element.waypoints.forEach((wp) => {
            // Try both L-shapes and pick the clear one
            let pMidA = { x: wp.x, y: lastPoint.y };
            let pMidB = { x: lastPoint.x, y: wp.y };

            let pMid = pMidA;
            if (isBlocked(lastPoint, pMidA) || isBlocked(pMidA, wp)) {
              if (!isBlocked(lastPoint, pMidB) && !isBlocked(pMidB, wp)) {
                pMid = pMidB;
              }
            }

            points.push(pMid);
            points.push({ x: wp.x, y: wp.y });
            lastPoint = wp;
          });

          // Connect final waypoint to endStub orthogonally
          let pEndMidA = { x: endStub.x, y: lastPoint.y };
          let pEndMidB = { x: lastPoint.x, y: endStub.y };
          let pEndMid = pEndMidA;
          if (isBlocked(lastPoint, pEndMidA) || isBlocked(pEndMidA, endStub)) {
            if (!isBlocked(lastPoint, pEndMidB) && !isBlocked(pEndMidB, endStub)) {
              pEndMid = pEndMidB;
            }
          }
          points.push(pEndMid);
        } else {
          // Automatic Routing Logic
          const startEl = anchorStart ? elements.find(e => e.id === anchorStart.elementId) : null;
          const endEl = anchorEnd ? elements.find(e => e.id === anchorEnd.elementId) : null;
          const startBounds = startEl ? getElementBounds(startEl) : null;
          const endBounds = endEl ? getElementBounds(endEl) : null;

          let goAround = false;
          if (startSide === 'right' && endSide === 'left' && startStub.x > endStub.x) goAround = true;
          if (startSide === 'left' && endSide === 'right' && startStub.x < endStub.x) goAround = true;
          if (startSide === 'bottom' && endSide === 'top' && startStub.y > endStub.y) goAround = true;
          if (startSide === 'top' && endSide === 'bottom' && startStub.y < endStub.y) goAround = true;

          if (goAround) {
            const isHorizontalMove = startSide === 'right' || startSide === 'left';
            let baseDetour;
            if (isHorizontalMove) {
              if (element.controlPoint !== undefined) {
                baseDetour = element.controlPoint;
              } else {
                const bottomY = Math.max(startBounds?.y! + startBounds?.height! || -Infinity, endBounds?.y! + endBounds?.height! || -Infinity) + 40;
                const topY = Math.min(startBounds?.y! || Infinity, endBounds?.y! || Infinity) - 40;
                baseDetour = Math.abs(startStub.y - bottomY) < Math.abs(startStub.y - topY) ? bottomY : topY;
              }
            } else {
              if (element.controlPoint !== undefined) {
                baseDetour = element.controlPoint;
              } else {
                const rightX = Math.max(startBounds?.x! + startBounds?.width! || -Infinity, endBounds?.x! + endBounds?.width! || -Infinity) + 40;
                const leftX = Math.min(startBounds?.x! || Infinity, endBounds?.x! || Infinity) - 40;
                baseDetour = Math.abs(startStub.x - rightX) < Math.abs(startStub.x - leftX) ? rightX : leftX;
              }
            }

            const { pM1, pM2 } = findClearMid(startStub, endStub, !isHorizontalMove, baseDetour);
            points.push(pM1);
            points.push(pM2);
          } else {
            // Standard Manhattan
            const isVerticalMid = (startSide === 'right' || startSide === 'left') && (endSide === 'right' || endSide === 'left');
            const isHorizontalMid = (startSide === 'top' || startSide === 'bottom') && (endSide === 'top' || endSide === 'bottom');

            if (isVerticalMid) {
              const baseVal = element.controlPoint ?? (startStub.x + endStub.x) / 2;
              const { pM1, pM2 } = findClearMid(startStub, endStub, true, baseVal);
              points.push(pM1);
              points.push(pM2);
            } else if (isHorizontalMid) {
              const baseVal = element.controlPoint ?? (startStub.y + endStub.y) / 2;
              const { pM1, pM2 } = findClearMid(startStub, endStub, false, baseVal);
              points.push(pM1);
              points.push(pM2);
            } else {
              // Orthogonal (e.g. Right to Bottom)
              let pMid = { x: endStub.x, y: startStub.y };
              if (isBlocked(startStub, pMid) || isBlocked(pMid, endStub)) {
                pMid = { x: startStub.x, y: endStub.y };
              }
              points.push(pMid);
            }
          }
        }

        points.push({ x: endStub.x, y: endStub.y });
        points.push({ x: x2, y: y2 });

        // Generate Path with Bevels
        let path = `M ${points[0].x},${points[0].y}`;
        // Bevel limit - dynamically calculated later
        for (let i = 1; i < points.length - 1; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const next = points[i + 1];

          const distPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
          const distNext = Math.hypot(next.x - curr.x, next.y - curr.y);

          // Big straight chamfers (PCB Style)
          // Limit chamfer size to fit within segments, but aim for 5000px
          const chamferSize = 5000;
          const actualBevel = Math.min(distPrev / 2, distNext / 2, chamferSize);

          if (actualBevel < 2) {
            path += ` L ${curr.x},${curr.y}`;
            continue;
          }

          const anglePrev = Math.atan2(prev.y - curr.y, prev.x - curr.x);
          const angleNext = Math.atan2(next.y - curr.y, next.x - curr.x);

          const bevelStartX = curr.x + actualBevel * Math.cos(anglePrev);
          const bevelStartY = curr.y + actualBevel * Math.sin(anglePrev);

          const bevelEndX = curr.x + actualBevel * Math.cos(angleNext);
          const bevelEndY = curr.y + actualBevel * Math.sin(angleNext);

          path += ` L ${bevelStartX},${bevelStartY} L ${bevelEndX},${bevelEndY}`;
        }

        path += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
        return path;
      }
      case 'straight':
      default:
        // Fallback to electrical if something goes wrong, or direct line
        return `M ${x1},${y1} L ${x2},${y2}`;
    }
  };

  // Get the end point of arrow path for arrowhead positioning
  const getArrowEndPoint = (element: CanvasElement, x1: number, y1: number, x2: number, y2: number) => {
    return { x: x2, y: y2 };
  };

  // Get the angle at the end of the arrow for arrowhead
  const getArrowEndAngle = (element: CanvasElement, x1: number, y1: number, x2: number, y2: number) => {
    // If we have an anchor, use the normal of the anchor side to determine perpendicularity
    if (element.anchorEnd) {
      const side = element.anchorEnd.side;
      switch (side) {
        case 'right': return Math.PI; // Pointing Left (into the element)
        case 'left': return 0; // Pointing Right
        case 'top': return Math.PI / 2; // Pointing Down
        case 'bottom': return -Math.PI / 2; // Pointing Up
      }
    }

    const arrowType = (element.arrowType === 'straight' || !element.arrowType) ? 'electrical' : element.arrowType;

    if (arrowType === 'curved') {
      const curvature = element.curvature || 0.5;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const perpX = -dy;
      const perpY = dx;
      const len = Math.sqrt(perpX * perpX + perpY * perpY);
      if (len === 0) return 0;
      const normPerpX = perpX / len;
      const normPerpY = perpY / len;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const offset = curvature * 100;
      const controlX = midX + normPerpX * offset;
      const controlY = midY + normPerpY * offset;
      return Math.atan2(y2 - controlY, x2 - controlX);
    }

    return Math.atan2(y2 - y1, x2 - x1);
  };

  const renderElement = (element: CanvasElement, isCurrent = false) => {
    let opacity = isCurrent ? 0.7 : 1;
    if (isDraggingElement && element.type === 'arrow' &&
      (element.anchorStart?.elementId && selectedIds.includes(element.anchorStart.elementId) ||
        element.anchorEnd?.elementId && selectedIds.includes(element.anchorEnd.elementId))) {
      opacity = 0.5;
    }
    const strokeDasharray = undefined;

    const handleClick = (e: React.MouseEvent) => {
      // Ignore click if we dragged (to prevent toggling after a shift-drag selection)
      if (hasMouseMovedRef.current) return;

      if (tool === 'select') {
        e.stopPropagation();

        let idsToSelect = [element.id];
        if (element.groupId) {
          idsToSelect = elements
            .filter(el => el.groupId === element.groupId)
            .map(el => el.id);
        }

        if (e.shiftKey) {
          setSelectedIds(prev => {
            const allSelected = idsToSelect.every(id => prev.includes(id));
            if (allSelected) {
              return prev.filter(id => !idsToSelect.includes(id));
            } else {
              return [...prev, ...idsToSelect.filter(id => !prev.includes(id))];
            }
          });
        } else {
          setSelectedIds(idsToSelect);
        }
      }
    };

    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (tool === 'select') {
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
          handleContextMenu(e, selectedIds);
        }
      }
    };

    const getElementStyle = () => ({
      cursor: tool === 'select' ? 'pointer' : 'default',
      pointerEvents: 'auto' as const
    });

    const handleMouseEnter = () => {
      if (!isDraggingElement && !isResizingElement && !selectedIds.includes(element.id)) {
        requestAnimationFrame(() => setHoveredId(element.id));
      }
    };

    const handleMouseLeave = () => {
      if (!isDraggingElement && !isResizingElement) {
        requestAnimationFrame(() => setHoveredId(null));
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (tool === 'select') {
        if (e.shiftKey) return; // Allow propagation to start selection
        // Allow propagation to SVG for dragging
      }
    };

    switch (element.type) {
      case 'path':
        // Render multiple overlapping strokes for organic pencil texture
        const pathData = getSvgPathFromStroke(element.points);
        return (
          <g key={element.id}>
            {/* Base stroke */}
            <path
              data-element-id={element.id}
              d={pathData}
              fill="none"
              stroke={element.color}
              strokeWidth={element.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.1}
              strokeDasharray={strokeDasharray}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={getElementStyle()}
            />
            {/* Layer 1 - slightly thinner, more opaque */}
            <path
              d={pathData}
              fill="none"
              stroke={element.color}
              strokeWidth={element.strokeWidth * 0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.1}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
            {/* Layer 2 - medium stroke */}
            <path
              d={pathData}
              fill="none"
              stroke={element.color}
              strokeWidth={element.strokeWidth * 0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.4}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
            {/* Layer 3 - core stroke */}
            <path
              d={pathData}
              fill="none"
              stroke={element.color}
              strokeWidth={element.strokeWidth * 0.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.4}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
          </g>
        );
      case 'image':
        return (
          <g key={element.id} data-element-id={element.id}>
            <image
              href={element.imageUrl}
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              opacity={opacity}
              preserveAspectRatio="none"
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={getElementStyle()}
            />
          </g>
        );
      case 'file':
        return (
          <g key={element.id} data-element-id={element.id}>
            <foreignObject
              x={element.x}
              y={element.y}
              width={element.width || 200}
              height={element.height || 200}
              style={{ overflow: 'visible' }}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${element.rotation || 0}deg)`,
                  transformOrigin: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ pointerEvents: 'auto' }}>
                  <FileElement
                    layout={element.fileMetadata?.layout || 'bookmark'}
                    fileName={element.fileMetadata?.fileName || 'New File'}
                    fileSize={element.fileMetadata?.fileSize || 0}
                    fileType={element.fileMetadata?.fileType || 'application/octet-stream'}
                    filePreview={element.fileMetadata?.filePreview}
                    files={element.fileMetadata?.files}
                    isReadOnly={!isActive}
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onUpdate={(updates) => {
                      const newElements = elements.map(el =>
                        el.id === element.id ? { ...el, fileMetadata: { ...el.fileMetadata, ...updates } } : el
                      );
                      setElements(newElements);
                      spacesState.updateSpace(space.id, { content: { elements: newElements } });
                    }}
                    onDelete={() => {
                      const newElements = elements.filter(el => el.id !== element.id);
                      setElements(newElements);
                      spacesState.updateSpace(space.id, { content: { elements: newElements } });
                    }}
                  />
                </div>
              </div>
            </foreignObject>
          </g>
        );
      case 'rectangle':
        if (!element.width || !element.height) return null;
        const rectX = element.width > 0 ? element.x : element.x + element.width;
        const rectY = element.height > 0 ? element.y : element.y + element.height;
        const rectWidth = Math.abs(element.width);
        const rectHeight = Math.abs(element.height);
        const hitboxPadding = 10 / zoom;
        return (
          <g key={element.id} data-element-id={element.id}>
            <rect
              x={rectX - hitboxPadding}
              y={rectY - hitboxPadding}
              width={rectWidth + hitboxPadding * 2}
              height={rectHeight + hitboxPadding * 2}
              rx={element.radius || 0}
              fill="transparent"
              stroke="none"
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={getElementStyle()}
            />
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              rx={element.radius || 0}
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
        const circleHitboxPadding = 10 / zoom;
        return (
          <g key={element.id} data-element-id={element.id}>
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
              style={getElementStyle()}
            />
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
        const lineHitboxWidth = 20 / zoom;
        return (
          <g key={element.id} data-element-id={element.id}>
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
              style={getElementStyle()}
            />
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
      case 'arrow': {
        if (!element.width || !element.height) return null;

        // Get actual coordinates considering anchors
        const { startX, startY, endX, endY } = getArrowCoordinates(element);

        const arrowPath = getArrowPath(element, startX, startY, endX, endY);
        const angle = getArrowEndAngle(element, startX, startY, endX, endY);
        const arrowSize = 16;
        const arrowHitboxWidth = 20 / zoom;

        // Chamfered arrowhead calculation (4-point polygon with recessed back)
        const shoulderDist = arrowSize * 1.1;
        const shoulder1X = endX - shoulderDist * Math.cos(angle - Math.PI / 6);
        const shoulder1Y = endY - shoulderDist * Math.sin(angle - Math.PI / 6);
        const shoulder2X = endX - shoulderDist * Math.cos(angle + Math.PI / 6);
        const shoulder2Y = endY - shoulderDist * Math.sin(angle + Math.PI / 6);

        // The "chamfer" is created by pulling the base of the arrow head slightly inward
        const innerBackX = endX - arrowSize * 0.7 * Math.cos(angle);
        const innerBackY = endY - arrowSize * 0.7 * Math.sin(angle);

        return (
          <g key={element.id} data-element-id={element.id}>
            {/* Hitbox path */}
            <path
              d={arrowPath}
              stroke="transparent"
              strokeWidth={arrowHitboxWidth}
              fill="none"
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={getElementStyle()}
            />
            {/* Visible path */}
            <path
              d={arrowPath}
              stroke={element.color}
              strokeWidth={element.strokeWidth}
              fill="none"
              opacity={opacity}
              strokeDasharray={strokeDasharray}
              pointerEvents="none"
            />
            {/* Arrowhead (Chamfered) */}
            <polygon
              points={`${endX},${endY} ${shoulder1X},${shoulder1Y} ${innerBackX},${innerBackY} ${shoulder2X},${shoulder2Y}`}
              fill={element.color}
              opacity={opacity}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onContextMenu={handleRightClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={getElementStyle()}
            />
          </g>
        );
      }
      case 'text':
        if (editingTextId === element.id) {
          return null;
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
                setEditingTextId(element.id);
                setEditingTextValue(element.text || '');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={getElementStyle()}
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
              zoomToElement(element.id);
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
            settings={settings}
            onUpdateSettings={onUpdateSettings}
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

      {/* Drawing Mode Tip */}
      {showDrawingTip && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-black/80 backdrop-blur-md text-white text-sm shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/20 rounded text-xs">ESC</kbd>
            <span>to exit drawing mode</span>
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] p-1.5 rounded-2xl shadow-xl border border-white/40 flex items-center bg-white/80 backdrop-blur-md hover:bg-white/90 transition-colors w-fit"
      >
        <div className="flex flex-row gap-1 items-center px-1">
          {/* Select Tool */}
          <button
            title="Select (S)"
            onClick={() => setTool('select')}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${tool === 'select'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-transparent text-slate-600 hover:bg-black/5'
              }`}
          >
            <MousePointer size={18} />
          </button>

          {/* Tools Menu (Merged) */}
          <div className="relative shrink-0">
            <button
              title="Drawing Tools"
              onClick={() => {
                setIsDrawingMenuOpen(!isDrawingMenuOpen);
                setIsOptionsOpen(false);
                setIsViewMenuOpen(false);
              }}
              className={`toolbar-button w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${['pen', 'rectangle', 'circle', 'line', 'arrow', 'text'].includes(tool)
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-transparent text-slate-600 hover:bg-black/5'
                }`}
            >
              {tool === 'pen' && <Pencil size={18} />}
              {tool === 'rectangle' && <Square size={18} />}
              {tool === 'circle' && <Circle size={18} />}
              {tool === 'line' && <Minus size={18} />}
              {tool === 'arrow' && <ArrowRight size={18} />}
              {tool === 'text' && <Type size={18} />}
              {!['pen', 'rectangle', 'circle', 'line', 'arrow', 'text'].includes(tool) && <PencilRuler size={18} />}
            </button>

            {isDrawingMenuOpen && (
              <div
                className="toolbar-menu absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-1 flex flex-col gap-1 z-[9999] min-w-[180px]"
                onMouseLeave={() => setIsDrawingMenuOpen(false)}
              >
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    setTool('pen');
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <Pencil size={16} />
                  <span className="flex-1 text-sm">Matita</span>
                  <kbd className="opacity-50 text-[10px]">P</kbd>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    setTool('rectangle');
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <Square size={16} />
                  <span className="flex-1 text-sm">Rettangolo</span>
                  <kbd className="opacity-50 text-[10px]">R</kbd>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    setTool('circle');
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <Circle size={16} />
                  <span className="flex-1 text-sm">Cerchio</span>
                  <kbd className="opacity-50 text-[10px]">C</kbd>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    setTool('line');
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <Minus size={16} />
                  <span className="flex-1 text-sm">Linea</span>
                  <kbd className="opacity-50 text-[10px]">L</kbd>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    setTool('arrow');
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <ArrowRight size={16} />
                  <span className="flex-1 text-sm">Freccia</span>
                  <kbd className="opacity-50 text-[10px]">A</kbd>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    setTool('text');
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <Type size={16} />
                  <span className="flex-1 text-sm">Testo</span>
                  <kbd className="opacity-50 text-[10px]">T</kbd>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left cursor-pointer w-full"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsDrawingMenuOpen(false);
                  }}
                >
                  <ImageIcon size={16} />
                  <span className="flex-1 text-sm">Immagine</span>
                  <kbd className="opacity-50 text-[10px]">Upload</kbd>
                </button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-black/10 mx-0.5 shrink-0" />

          {/* Options Submenu */}
          <div className="relative shrink-0">
            <button
              title="Options"
              onClick={() => {
                setIsOptionsOpen(!isOptionsOpen);
                setIsViewMenuOpen(false);
                setIsDrawingMenuOpen(false);
              }}
              className={`toolbar-button w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isOptionsOpen ? 'bg-black/10' : 'text-slate-600 hover:bg-black/5'
                }`}
            >
              <Settings2 size={18} />
            </button>

            {isOptionsOpen && (
              <div
                className="toolbar-menu absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-3 z-[9999] w-[260px] flex flex-col gap-4"
                onMouseLeave={() => setIsOptionsOpen(false)}
              >
                {/* Color Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Colore</span>
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: preset.value }}
                        onClick={() => setColor(preset.value)}
                        title={preset.name}
                      >
                        {color === preset.value && <Check size={12} className={preset.value === '#FFFFFF' || preset.value === '#F8D501' ? 'text-black' : 'text-white'} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stroke Width Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tratto</span>
                    <span className="text-[10px] font-medium text-slate-500">{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex gap-1 justify-between">
                    {STROKE_PRESETS.map(w => (
                      <button
                        key={w}
                        className={`w-7 h-6 rounded-md text-[10px] flex items-center justify-center border cursor-pointer transition-all ${strokeWidth === w ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        onClick={() => setStrokeWidth(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[1px] bg-black/5" />

                {/* Clear Canvas */}
                <button
                  onClick={() => {
                    clearCanvas();
                    setIsOptionsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer text-xs w-full font-medium"
                >
                  <Trash2 size={14} />
                  <span>Svuota Canvas</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-black/10 mx-0.5 shrink-0" />

          {/* View Menu */}
          <div className="relative shrink-0">
            <button
              title="View Options"
              onClick={() => {
                setIsViewMenuOpen(!isViewMenuOpen);
                setIsOptionsOpen(false);
                setIsDrawingMenuOpen(false);
              }}
              className={`toolbar-button h-8 px-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0 ${isViewMenuOpen ? 'bg-black/10' : 'text-slate-600 hover:bg-black/5'
                }`}
            >
              <span className="text-xs font-medium w-9 text-center">{Math.round(zoom * 100)}%</span>
              <ChevronDown size={14} />
            </button>

            {isViewMenuOpen && (
              <div
                className="toolbar-menu absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-3 flex flex-col gap-3 z-[9999] min-w-[200px]"
                onMouseLeave={() => setIsViewMenuOpen(false)}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Zoom</span>
                    <span className="text-[10px] font-medium text-slate-500">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => {
                      const newZoom = parseFloat(e.target.value);
                      const scaleFactor = zoom / newZoom;
                      setZoom(newZoom);
                      setViewBox(prev => ({
                        ...prev,
                        width: prev.width * scaleFactor,
                        height: prev.height * scaleFactor,
                        x: prev.x + (prev.width - prev.width * scaleFactor) / 2,
                        y: prev.y + (prev.height - prev.height * scaleFactor) / 2
                      }));
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="h-[1px] bg-black/5" />

                <div className="flex flex-col gap-1">
                  <button
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left cursor-pointer hover:bg-black/5 text-xs font-medium ${elements.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    onClick={() => {
                      zoomToFit();
                      setIsViewMenuOpen(false);
                    }}
                    disabled={elements.length === 0}
                  >
                    <Maximize2 size={14} />
                    <span className="flex-1">Adatta tutto</span>
                    <kbd className="opacity-50 text-[10px]">Home</kbd>
                  </button>
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors text-left cursor-pointer text-xs font-medium"
                    onClick={() => {
                      setShowMinimap(!showMinimap);
                      setIsViewMenuOpen(false);
                    }}
                  >
                    <MapIcon size={14} />
                    <span className="flex-1">Mostra Minimap</span>
                    {showMinimap && <Check size={12} className="ml-auto" />}
                  </button>
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors text-left cursor-pointer text-xs font-medium"
                    onClick={() => {
                      setIsZKeyPressed(!isZKeyPressed);
                      setIsViewMenuOpen(false);
                    }}
                  >
                    <Maximize size={14} />
                    <span className="flex-1">Selection Zoom</span>
                    <kbd className="opacity-50 text-[10px]">Z</kbd>
                    {isZKeyPressed && <Check size={12} className="ml-auto" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedIds.length > 0 && (
            <>
              <div className="w-[1px] h-5 bg-black/10 mx-0.5 shrink-0" />
              <button
                title="Delete (Del)"
                onClick={deleteSelected}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-transparent text-danger hover:bg-danger/10 transition-all cursor-pointer shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-transparent">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onContextMenu={(e) => {
            e.preventDefault();
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
          {/* Import Mischief-style pencil filters */}
          <PencilFilters />

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
          {elements.map(el => {
            const content = renderElement(el);
            if (el.rotation) {
              const bounds = getElementBounds(el);
              if (bounds) {
                const cx = bounds.x + bounds.width / 2;
                const cy = bounds.y + bounds.height / 2;
                return (
                  <g key={el.id} transform={`rotate(${el.rotation} ${cx} ${cy})`}>
                    {content}
                  </g>
                );
              }
            }
            return content;
          })}

          {/* Render current element being drawn */}
          {currentElement && (
            <g key="current-drawing">
              {renderElement(currentElement, true)}
            </g>
          )}

          {/* Render bounding box for selected element(s) */}
          {selectedIds.length > 0 && tool === 'select' && (() => {
            const scale = 1 / zoom;
            const selectedElements = elements.filter(el => selectedIds.includes(el.id));
            if (selectedElements.length === 0) return null;

            // Check if all selected elements are lines, arrows or paths
            const allStrokeElements = selectedElements.every(el =>
              el.type === 'line' || el.type === 'arrow' || el.type === 'path'
            );

            // For stroke elements (lines, arrows, paths), render outline instead of bounding box
            if (allStrokeElements && selectedIds.length === 1) {
              const element = selectedElements[0];
              const highlightWidth = (element.strokeWidth || 2) + (20 * scale); // Much thicker highlight
              const hitboxWidth = Math.max((element.strokeWidth || 2) + (32 * scale), 32 * scale);

              return (
                <g key="selection-outline">
                  {element.type === 'arrow' && (() => {
                    // Use getArrowCoordinates to get actual arrow position (considering anchors)
                    const { startX, startY, endX, endY } = getArrowCoordinates(element);
                    const arrowPath = getArrowPath(element, startX, startY, endX, endY);

                    return (
                      <>
                        <path
                          d={arrowPath}
                          stroke="#1976d2"
                          strokeWidth={highlightWidth}
                          fill="none"
                          opacity={0.3}
                          pointerEvents="none"
                        />
                        <rect
                          x={Math.min(startX, endX) - 32 * scale}
                          y={Math.min(startY, endY) - 32 * scale}
                          width={Math.abs(endX - startX) + 64 * scale}
                          height={Math.abs(endY - startY) + 64 * scale}
                          fill="transparent"
                          stroke="none"
                          onMouseDown={handleBoundingBoxMouseDown}
                          style={{ cursor: 'move' }}
                        />
                      </>
                    );
                  })()}
                  {element.type === 'line' && (() => {
                    const x1 = element.x;
                    const y1 = element.y;
                    const x2 = element.x + (element.width || 0);
                    const y2 = element.y + (element.height || 0);

                    return (
                      <>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#1976d2"
                          strokeWidth={highlightWidth}
                          opacity={0.3}
                          pointerEvents="none"
                        />
                        <rect
                          x={Math.min(x1, x2) - 32 * scale}
                          y={Math.min(y1, y2) - 32 * scale}
                          width={Math.abs(x2 - x1) + 64 * scale}
                          height={Math.abs(y2 - y1) + 64 * scale}
                          fill="transparent"
                          stroke="none"
                          onMouseDown={handleBoundingBoxMouseDown}
                          style={{ cursor: 'move' }}
                        />
                      </>
                    );
                  })()}
                  {element.type === 'path' && element.points && (() => {
                    return (
                      <>
                        <path
                          d={element.points}
                          stroke="#1976d2"
                          strokeWidth={highlightWidth}
                          fill="none"
                          opacity={0.3}
                          pointerEvents="none"
                        />
                        {(() => {
                          const bounds = getElementBounds(element);
                          if (!bounds) return null;
                          return (
                            <rect
                              x={bounds.x - 16 * scale}
                              y={bounds.y - 16 * scale}
                              width={bounds.width + 32 * scale}
                              height={bounds.height + 32 * scale}
                              fill="transparent"
                              stroke="none"
                              onMouseDown={handleBoundingBoxMouseDown}
                              style={{ cursor: 'move' }}
                            />
                          );
                        })()}
                      </>
                    );
                  })()}
                </g>
              );
            }

            // For other elements, render normal bounding box
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

            // Adjusted constants for better visibility at any zoom level
            const padding = 16 * scale;
            const strokeWidthLine = 2 * scale; // Clean selection line
            const handleRadius = 8 * scale; // w-4 diameter (16px)
            const handleStrokeWidth = 2 * scale;
            const arcRadius = 40 * scale;
            const rotation = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0])?.rotation : 0;
            const cx = bounds.x + bounds.width / 2;
            const cy = bounds.y + bounds.height / 2;

            // Simple Grab cursor for rotation as default fallback
            const rotateCursor = 'grab';

            return (
              <g transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}>
                {/* Bounding box rectangle */}
                <rect
                  x={bounds.x - padding}
                  y={bounds.y - padding}
                  width={bounds.width + padding * 2}
                  height={bounds.height + padding * 2}
                  fill="none"
                  stroke="#1976d2"
                  strokeWidth={strokeWidthLine}
                  opacity={0.3}
                  strokeLinecap="round"
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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (selectedIds.length === 1) {
                      const el = elements.find(e => e.id === selectedIds[0]);
                      if (el && el.type === 'text') {
                        setEditingTextId(el.id);
                        setEditingTextValue(el.text || '');
                      }
                    }
                  }}
                  style={{ cursor: 'move' }}
                />
                {/* Resize handles - solo per selezione singola e NON per elementi text */}
                {selectedIds.length === 1 && (() => {
                  const selectedElement = elements.find(el => el.id === selectedIds[0]);
                  return selectedElement && selectedElement.type !== 'text';
                })() && (
                    <>
                      {/* Corner handles with rotation indicators */}
                      {[
                        { x: bounds.x - padding, y: bounds.y - padding, angle: 225 }, // top-left
                        { x: bounds.x + bounds.width + padding, y: bounds.y - padding, angle: 315 }, // top-right
                        { x: bounds.x - padding, y: bounds.y + bounds.height + padding, angle: 135 }, // bottom-left
                        { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height + padding, angle: 45 } // bottom-right
                      ].map((corner, i) => {
                        const arcStartAngle = corner.angle - 30;
                        const arcEndAngle = corner.angle + 30;
                        const startX = corner.x + arcRadius * Math.cos(arcStartAngle * Math.PI / 180);
                        const startY = corner.y + arcRadius * Math.sin(arcStartAngle * Math.PI / 180);
                        const endX = corner.x + arcRadius * Math.cos(arcEndAngle * Math.PI / 180);
                        const endY = corner.y + arcRadius * Math.sin(arcEndAngle * Math.PI / 180);

                        const selectedElement = elements.find(el => el.id === selectedIds[0]);
                        const isMedia = selectedElement?.type === 'image' || selectedElement?.type === 'file';

                        return (
                          <g key={i}>
                            {/* Rotation Arc (Thick Curve, No Chevron) */}
                            {true && (
                              <>
                                <path
                                  d={`M ${startX},${startY} A ${arcRadius},${arcRadius} 0 0 1 ${endX},${endY}`}
                                  fill="none"
                                  stroke="#1976d2"
                                  strokeWidth={4 * scale}
                                  strokeLinecap="round"
                                  opacity={0.6}
                                  pointerEvents="none"
                                />

                                {/* Interactive Invisible Arc for easier grabbing */}
                                <path
                                  d={`M ${startX},${startY} A ${arcRadius},${arcRadius} 0 0 1 ${endX},${endY}`}
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth={10 * scale}
                                  style={{ cursor: rotateCursor }}
                                  onMouseDown={handleRotateMouseDown}
                                />
                              </>
                            )}

                            {/* Resize Handle */}
                            <circle
                              cx={corner.x}
                              cy={corner.y}
                              r={handleRadius}
                              fill="white"
                              stroke="#1976d2"
                              strokeWidth={handleStrokeWidth}
                              style={{ cursor: 'nwse-resize' }}
                              onMouseDown={(e) => {
                                if (e.shiftKey) {
                                  handleRotateMouseDown(e);
                                } else {
                                  handleResizeMouseDown(e, i < 2 ? (i % 2 === 0 ? 'nw' : 'ne') : (i % 2 === 0 ? 'sw' : 'se'));
                                }
                              }}
                            />
                          </g>
                        );
                      })}
                      {/* Edge handles with rotation indicators */}
                      {[
                        { x: bounds.x + bounds.width / 2, y: bounds.y - padding, angle: 270 }, // top
                        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + padding, angle: 90 }, // bottom
                        { x: bounds.x - padding, y: bounds.y + bounds.height / 2, angle: 180 }, // left
                        { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height / 2, angle: 0 } // right
                      ].map((edge, i) => {
                        const arcStartAngle = edge.angle - 30;
                        const arcEndAngle = edge.angle + 30;
                        const startX = edge.x + arcRadius * Math.cos(arcStartAngle * Math.PI / 180);
                        const startY = edge.y + arcRadius * Math.sin(arcStartAngle * Math.PI / 180);
                        const endX = edge.x + arcRadius * Math.cos(arcEndAngle * Math.PI / 180);
                        const endY = edge.y + arcRadius * Math.sin(arcEndAngle * Math.PI / 180);

                        const selectedElement = elements.find(el => el.id === selectedIds[0]);
                        const isMedia = selectedElement?.type === 'image' || selectedElement?.type === 'file';

                        return (
                          <g key={i + 4}>
                            {/* Rotation Arc (Thick Curve, No Chevron) */}
                            {true && (
                              <>
                                <path
                                  d={`M ${startX},${startY} A ${arcRadius},${arcRadius} 0 0 1 ${endX},${endY}`}
                                  fill="none"
                                  stroke="#1976d2"
                                  strokeWidth={4 * scale}
                                  strokeLinecap="round"
                                  opacity={0.6}
                                  pointerEvents="none"
                                />

                                {/* Interactive Invisible Arc for easier grabbing */}
                                <path
                                  d={`M ${startX},${startY} A ${arcRadius},${arcRadius} 0 0 1 ${endX},${endY}`}
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth={10 * scale}
                                  style={{ cursor: rotateCursor }}
                                  onMouseDown={handleRotateMouseDown}
                                />
                              </>
                            )}

                            {/* Resize Handle */}
                            <circle
                              cx={edge.x}
                              cy={edge.y}
                              r={handleRadius}
                              fill="white"
                              stroke="#1976d2"
                              strokeWidth={handleStrokeWidth}
                              style={{ cursor: i < 2 ? 'ns-resize' : 'ew-resize' }}
                              onMouseDown={(e) => {
                                if (e.shiftKey) {
                                  handleRotateMouseDown(e);
                                } else {
                                  handleResizeMouseDown(e, i < 2 ? (i % 2 === 0 ? 'n' : 's') : (i % 2 === 0 ? 'w' : 'e'));
                                }
                              }}
                            />
                          </g>
                        );
                      })}
                    </>
                  )}
              </g>
            );
          })()}

          {/* Render hover preview when hovering over element */}
          {hoveredId && !selectedIds.includes(hoveredId) && tool === 'select' && !isDraggingElement && !isResizingElement && (() => {
            const hoveredElement = elements.find(el => el.id === hoveredId);
            if (!hoveredElement) return null;

            const scale = 1 / zoom;

            const renderHoverOutline = (el: CanvasElement) => {
              const strokeWidth = (el.strokeWidth || 2) + (20 * scale);
              const commonProps = {
                stroke: "#64b5f6",
                strokeWidth,
                opacity: 0.5,
                fill: "none",
                pointerEvents: "none" as const
              };

              switch (el.type) {
                case 'line':
                  return (
                    <line
                      x1={el.x}
                      y1={el.y}
                      x2={el.x + (el.width || 0)}
                      y2={el.y + (el.height || 0)}
                      {...commonProps}
                    />
                  );
                case 'arrow':
                  // Use getArrowCoordinates to get actual arrow position (considering anchors)
                  const { startX, startY, endX, endY } = getArrowCoordinates(el);
                  const d = getArrowPath(el, startX, startY, endX, endY);
                  return <path d={d} {...commonProps} />;
                case 'path':
                  return <polyline points={el.points} {...commonProps} />;
                case 'rectangle':
                  return (
                    <rect
                      x={el.width && el.width < 0 ? el.x + el.width : el.x}
                      y={el.height && el.height < 0 ? el.y + el.height : el.y}
                      width={Math.abs(el.width || 0)}
                      height={Math.abs(el.height || 0)}
                      rx={el.radius || 0}
                      {...commonProps}
                    />
                  );
                case 'circle':
                  return (
                    <circle
                      cx={el.x}
                      cy={el.y}
                      r={el.radius || 0}
                      {...commonProps}
                    />
                  );
                default:
                  const b = getElementBounds(el);
                  if (!b) return null;
                  return (
                    <rect
                      x={b.x - 5}
                      y={b.y - 5}
                      width={b.width + 10}
                      height={b.height + 10}
                      rx={4}
                      {...commonProps}
                    />
                  );
              }
            };

            if (hoveredElement.groupId) {
              const groupEls = elements.filter(e => e.groupId === hoveredElement.groupId);
              return <g>{groupEls.map(e => <React.Fragment key={e.id}>{renderHoverOutline(e)}</React.Fragment>)}</g>;
            }

            return renderHoverOutline(hoveredElement);
          })()}

          {/* Render arrow snap start point */}
          {arrowSnapStart && (
            <circle
              cx={arrowSnapStart.x}
              cy={arrowSnapStart.y}
              r={12 / zoom}
              fill="#4CAF50"
              stroke="#2E7D32"
              strokeWidth={3 / zoom}
              opacity={0.8}
              pointerEvents="none"
            />
          )}

          {/* Render arrow snap preview point when hovering over element with arrow tool */}
          {tool === 'arrow' && arrowSnapPreview && (
            <circle
              cx={arrowSnapPreview.x}
              cy={arrowSnapPreview.y}
              r={10 / zoom}
              fill="#FF9800"
              stroke="#E65100"
              strokeWidth={3 / zoom}
              opacity={0.7}
              pointerEvents="none"
            />
          )}

          {/* Render anchor points/handles for selected arrows and lines */}
          {selectedIds.length > 0 && tool === 'select' && (() => {
            const scale = 1 / zoom;
            const handleRadius = 6.6 * scale; // Reduced by a third (from 10)
            const hitRadius = 20 * scale; // Hitbox radius (40px visual)
            const strokeWidth = 4 * scale;
            const handleStrokeWidth = 2 * scale;

            const selectedStrokeElements = elements.filter(el =>
              selectedIds.includes(el.id) && (el.type === 'arrow' || el.type === 'line')
            );

            return selectedStrokeElements.map(element => {
              const indicators: JSX.Element[] = [];

              let startX, startY, endX, endY;

              if (element.type === 'arrow') {
                const coords = getArrowCoordinates(element);
                startX = coords.startX;
                startY = coords.startY;
                endX = coords.endX;
                endY = coords.endY;
              } else {
                startX = element.x;
                startY = element.y;
                endX = element.x + (element.width || 0);
                endY = element.y + (element.height || 0);
              }

              // Start handle
              indicators.push(
                <g key={`anchor-start-${element.id}`}>
                  {/* Outer glow/border for visibility */}
                  <circle
                    cx={startX}
                    cy={startY}
                    r={handleRadius}
                    fill={element.anchorStart ? "#4CAF50" : "#FFFFFF"}
                    stroke="#1976d2"
                    strokeWidth={handleStrokeWidth}
                    opacity={1}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Invisible larger hit area */}
                  <circle
                    cx={startX}
                    cy={startY}
                    r={hitRadius}
                    fill="transparent"
                    stroke="none"
                    style={{ cursor: 'move' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingArrowHandle({ arrowId: element.id, end: 'start' });
                      setTool('arrow');
                    }}
                  />
                </g>
              );

              // End handle
              indicators.push(
                <g key={`anchor-end-${element.id}`}>
                  <circle
                    cx={endX}
                    cy={endY}
                    r={handleRadius}
                    fill={element.anchorEnd ? "#4CAF50" : "#FFFFFF"}
                    stroke="#1976d2"
                    strokeWidth={handleStrokeWidth}
                    opacity={1}
                    style={{ cursor: 'pointer' }}
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r={hitRadius}
                    fill="transparent"
                    stroke="none"
                    style={{ cursor: 'move' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingArrowHandle({ arrowId: element.id, end: 'end' });
                      setTool('arrow');
                    }}
                  />
                </g>
              );

              // Curvature handle for curved arrows
              if (element.type === 'arrow' && element.arrowType === 'curved') {
                const curvature = element.curvature || 0.5;
                const dx = endX - startX;
                const dy = endY - startY;
                const perpX = -dy;
                const perpY = dx;
                const len = Math.sqrt(perpX * perpX + perpY * perpY);
                if (len > 0) {
                  const normPerpX = perpX / len;
                  const normPerpY = perpY / len;
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;
                  const offset = curvature * 100;
                  const controlX = midX + normPerpX * offset;
                  const controlY = midY + normPerpY * offset;

                  indicators.push(
                    <g key={`curvature-handle-${element.id}`}>
                      {/* Line from midpoint to control point */}
                      <line
                        x1={midX}
                        y1={midY}
                        x2={controlX}
                        y2={controlY}
                        stroke="#9C27B0"
                        strokeWidth={4 * scale}
                        strokeDasharray={`${12 * scale} ${12 * scale}`}
                        opacity={0.5}
                        pointerEvents="none"
                      />
                      {/* Draggable control point */}
                      <circle
                        cx={controlX}
                        cy={controlY}
                        r={handleRadius}
                        fill="#9C27B0"
                        stroke="#FFFFFF"
                        strokeWidth={handleStrokeWidth}
                        opacity={0.9}
                        style={{ cursor: 'move' }}
                      />
                      <circle
                        cx={controlX}
                        cy={controlY}
                        r={hitRadius}
                        fill="transparent"
                        stroke="none"
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const svg = svgRef.current;
                          if (!svg) return;

                          // Save current state BEFORE starting to drag
                          const oldElements = JSON.parse(JSON.stringify(elements));

                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const CTM = svg.getScreenCTM();
                            if (!CTM) return;

                            const svgX = (moveEvent.clientX - CTM.e) / CTM.a;
                            const svgY = (moveEvent.clientY - CTM.f) / CTM.d;

                            // Calculate new curvature based on distance from midpoint
                            const distX = svgX - midX;
                            const distY = svgY - midY;

                            // Project onto perpendicular direction
                            const projection = (distX * normPerpX + distY * normPerpY);
                            const newCurvature = projection / 100;

                            // Update arrow curvature
                            setElements(prev => prev.map(el =>
                              el.id === element.id
                                ? { ...el, curvature: newCurvature }
                                : el
                            ));
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);

                            // Save to history with the state captured at mousedown
                            setElements(currentElements => {
                              saveElementsWithHistory(currentElements, oldElements, 'Curvatura freccia modificata');
                              return currentElements;
                            });
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </g>
                  );
                }
              } else if (element.type === 'arrow' && element.arrowType === 'electrical') {
                // Control handles for electrical arrows waypoints
                const waypoints = element.waypoints || [];

                // If waypoints exist, render a handle for each
                if (waypoints.length > 0) {
                  waypoints.forEach((wp, wpIndex) => {
                    indicators.push(
                      <g key={`waypoint-handle-${element.id}-${wpIndex}`}>
                        <rect
                          x={wp.x - (8 * scale)}
                          y={wp.y - (8 * scale)}
                          width={16 * scale}
                          height={16 * scale}
                          fill="#FFC107"
                          stroke="#FFFFFF"
                          strokeWidth={handleStrokeWidth}
                          transform={`rotate(45 ${wp.x} ${wp.y})`}
                          style={{ cursor: 'move' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDraggingArrowHandle({
                              arrowId: element.id,
                              end: 'waypoint',
                              index: wpIndex
                            });
                          }}
                        />
                        <circle
                          cx={wp.x}
                          cy={wp.y}
                          r={12 * scale}
                          fill="transparent"
                          stroke="none"
                          style={{ cursor: 'move' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const svg = svgRef.current;
                            if (!svg) return;

                            const oldElements = JSON.parse(JSON.stringify(elements));

                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const CTM = svg.getScreenCTM();
                              if (!CTM) return;

                              const svgX = (moveEvent.clientX - CTM.e) / CTM.a;
                              const svgY = (moveEvent.clientY - CTM.f) / CTM.d;

                              setElements(prev => prev.map(el => {
                                if (el.id !== element.id) return el;
                                const newWaypoints = [...(el.waypoints || [])];
                                newWaypoints[wpIndex] = { x: svgX, y: svgY };
                                return { ...el, waypoints: newWaypoints };
                              }));
                            };

                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);

                              setElements(currentElements => {
                                saveElementsWithHistory(currentElements, oldElements, 'Punto di controllo spostato');
                                return currentElements;
                              });
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                      </g>
                    );
                  });
                } else if (element.controlPoint !== undefined) {
                  // Legacy support for single controlPoint
                  const anchorStart = element.anchorStart;
                  const anchorEnd = element.anchorEnd;
                  const startSide = anchorStart?.side || 'right';
                  const endSide = anchorEnd?.side || 'left';
                  const stubLength = 20;

                  const getStub = (x: number, y: number, side: string) => {
                    if (side === 'top') return { x, y: y - stubLength };
                    if (side === 'bottom') return { x, y: y + stubLength };
                    if (side === 'left') return { x: x - stubLength, y };
                    return { x: x + stubLength, y };
                  };

                  const startStub = getStub(startX, startY, startSide);
                  const endStub = getStub(endX, endY, endSide);

                  let isVerticalControl = (startSide === 'right' || startSide === 'left') && (endSide === 'right' || endSide === 'left');
                  let controlX = isVerticalControl ? element.controlPoint : (startStub.x + endStub.x) / 2;
                  let controlY = isVerticalControl ? (startStub.y + endStub.y) / 2 : element.controlPoint;

                  indicators.push(
                    <g key={`control-handle-legacy-${element.id}`}>
                      <rect
                        x={controlX - (8 * scale)}
                        y={controlY - (8 * scale)}
                        width={16 * scale}
                        height={16 * scale}
                        fill="#FFC107"
                        stroke="#FFFFFF"
                        strokeWidth={handleStrokeWidth}
                        transform={`rotate(45 ${controlX} ${controlY})`}
                        style={{ cursor: isVerticalControl ? 'ew-resize' : 'ns-resize' }}
                      />
                      <circle
                        cx={controlX}
                        cy={controlY}
                        r={12 * scale}
                        fill="transparent"
                        stroke="none"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const svg = svgRef.current;
                          if (!svg) return;
                          const oldElements = JSON.parse(JSON.stringify(elements));
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const CTM = svg.getScreenCTM();
                            if (!CTM) return;
                            const svgX = (moveEvent.clientX - CTM.e) / CTM.a;
                            const svgY = (moveEvent.clientY - CTM.f) / CTM.d;
                            setElements(prev => prev.map(el => el.id === element.id ? { ...el, controlPoint: isVerticalControl ? svgX : svgY } : el));
                          };
                          const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                            setElements(current => { saveElementsWithHistory(current, oldElements, 'Percorso modificato'); return current; });
                          };
                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                      />
                    </g>
                  );
                }
              }

              return indicators;
            });
          })()}

          {/* Render all snap points when using arrow tool */}
          {tool === 'arrow' && (() => {
            const scale = 1 / zoom;
            return elements.map(element => {
              if (!canElementSnap(element)) return null;
              const snapPoints = getSnapPoints(element);
              if (!snapPoints) return null;

              return (
                <g key={`snap-points-${element.id}`}>
                  {(['top', 'right', 'bottom', 'left'] as const).map(side => {
                    const point = snapPoints[side];
                    return (
                      <circle
                        key={`snap-${element.id}-${side}`}
                        cx={point.x}
                        cy={point.y}
                        r={8 * scale}
                        fill="#2196F3"
                        stroke="#FFFFFF"
                        strokeWidth={3 * scale}
                        opacity={0.6}
                        pointerEvents="none"
                      />
                    );
                  })}
                </g>
              );
            });
          })()}

          {/* Render selection box when dragging with select tool */}
          {selectionBox && (
            <g>
              <rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.width}
                height={selectionBox.height}
                fill={isZKeyPressed ? "rgba(255, 235, 59, 0.1)" : (isRightToLeftSelection ? "rgba(76, 175, 80, 0.1)" : "rgba(25, 118, 210, 0.1)")}
                stroke={isZKeyPressed ? "#FBC02D" : (isRightToLeftSelection ? "#4CAF50" : "#1976d2")}
                strokeWidth={4 / zoom}
                strokeDasharray={isRightToLeftSelection && !isZKeyPressed ? `${12 / zoom},${12 / zoom}` : undefined}
                opacity={0.7}
                pointerEvents="none"
              />
            </g>
          )}

          {/* Render text input for editing */}
          {editingTextId && (() => {
            const textElement = elements.find(el => el.id === editingTextId);
            if (!textElement) return null;

            const bounds = getElementBounds(textElement);
            let transform = undefined;
            if (textElement.rotation && bounds) {
              const cx = bounds.x + bounds.width / 2;
              const cy = bounds.y + bounds.height / 2;
              transform = `rotate(${textElement.rotation} ${cx} ${cy})`;
            }

            return (
              <g transform={transform}>
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
                      const updatedElements = elements.map(el =>
                        el.id === editingTextId ? { ...el, text: editingTextValue } : el
                      );
                      saveElements(updatedElements);
                      setEditingTextId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const updatedElements = elements.map(el =>
                          el.id === editingTextId ? { ...el, text: editingTextValue } : el
                        );
                        saveElements(updatedElements);
                        setEditingTextId(null);
                      } else if (e.key === 'Escape') {
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
              </g>
            );
          })()}
        </svg>

        {/* Mini-map / Viewport indicator */}
        {showMinimap && (
          <div
            className="absolute bottom-[60px] right-4 w-[200px] h-[160px] bg-white border border-divider rounded-lg overflow-hidden shadow-md z-50 flex flex-col"
          >
            <div className="px-2 py-1 bg-default-100 border-b border-divider flex items-center justify-center gap-1">
              <span className="text-xs font-bold">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <svg
              width="200"
              height="140"
              viewBox={`${-CANVAS_WIDTH / 2} ${-CANVAS_HEIGHT / 2} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              onMouseMove={handleMinimapMouseMove}
              onMouseUp={handleMinimapMouseUp}
              onMouseLeave={handleMinimapMouseUp}
            >
              <rect
                x={-CANVAS_WIDTH / 2}
                y={-CANVAS_HEIGHT / 2}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="rgba(0,0,0,0.02)"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={CANVAS_WIDTH / 100}
              />

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
                        rx={el.radius || 0}
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

              <rect
                x={viewBox.x}
                y={viewBox.y}
                width={viewBox.width}
                height={viewBox.height}
                fill="rgba(25, 118, 210, 0.1)"
                stroke="var(--heroui-primary-500)"
                strokeWidth={CANVAS_WIDTH / 150}
                opacity={0.9}
                style={{ cursor: 'move' }}
                onMouseDown={handleMinimapMouseDown}
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-divider text-xs text-default-400 bg-background">
        Tip: Hold Alt or middle-click to pan • Pinch to zoom • Two-finger scroll to pan
      </div>

      {/* Selection Toast Notification */}
      {selectionBox && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className={`px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 ${isZKeyPressed
            ? "bg-yellow-50/90 text-yellow-700 border-yellow-200"
            : (isRightToLeftSelection
              ? "bg-green-50/90 text-green-700 border-green-200"
              : "bg-blue-50/90 text-blue-700 border-blue-200")
            }`}>
            {isZKeyPressed && <Maximize2 size={16} />}
            <span className="font-medium text-sm">
              {isZKeyPressed
                ? "Selection Zoom"
                : (isRightToLeftSelection
                  ? "Selezione a tocco (Tutto ciò che tocca)"
                  : "Selezione inclusiva (Solo ciò che è dentro)")}
            </span>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[10000] min-w-[200px] bg-background/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 py-1"
          style={{
            left: contextMenu.x > window.innerWidth - 300 ? 'auto' : contextMenu.x,
            right: contextMenu.x > window.innerWidth - 300 ? window.innerWidth - contextMenu.x : 'auto',
            top: contextMenu.y > window.innerHeight - 500 ? 'auto' : contextMenu.y,
            bottom: contextMenu.y > window.innerHeight - 500 ? window.innerHeight - contextMenu.y : 'auto',
          }}
        >
          {(() => {
            const selectedElements = elements.filter(e => contextMenu.elementIds.includes(e.id));
            const hasStrokeElements = selectedElements.some(e =>
              e.type === 'arrow' || e.type === 'rectangle' || e.type === 'circle' || e.type === 'line' || e.type === 'path'
            );

            if (!hasStrokeElements) return null;

            const firstStrokeElement = selectedElements.find(e =>
              e.type === 'arrow' || e.type === 'rectangle' || e.type === 'circle' || e.type === 'line' || e.type === 'path'
            );

            return (
              <>
                <div className="px-3 py-2">
                  <p className="text-xs text-default-500 mb-1">
                    Colore:
                  </p>
                  <input
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
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="px-3 py-2">
                  <p className="text-xs text-default-500 mb-1">
                    Spessore: {firstStrokeElement?.strokeWidth || 2}px
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={firstStrokeElement?.strokeWidth || 2}
                    onChange={(e) => {
                      const newStrokeWidth = parseInt(e.target.value);
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
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Arrow type selector - solo se tutte le selezioni sono frecce */}
                {(() => {
                  const selectedElements = elements.filter(el => contextMenu.elementIds.includes(el.id));
                  const allArrows = selectedElements.every(el => el.type === 'arrow');
                  if (allArrows && selectedElements.length > 0) {
                    const firstArrow = selectedElements[0];
                    return (
                      <div className="px-3 py-2">
                        <p className="text-xs text-default-500 mb-2">
                          Tipo freccia:
                        </p>
                        <div className="flex flex-col gap-1">
                          <button
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left text-sm ${firstArrow.arrowType === 'curved' ? 'bg-blue-500/20' : 'hover:bg-default-100'
                              }`}
                            onClick={() => {
                              const newElements = elements.map(el => {
                                if (contextMenu.elementIds.includes(el.id) && el.type === 'arrow') {
                                  return { ...el, arrowType: 'curved' as const, curvature: 0.5 };
                                }
                                return el;
                              });
                              const oldElements = [...elements];
                              saveElementsWithHistory(newElements, oldElements, 'Tipo freccia modificato');
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 14 Q 8 2 14 14" fill="none" />
                            </svg>
                            <span>Curva</span>
                          </button>
                          <button
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left text-sm ${firstArrow.arrowType === 'electrical' ? 'bg-blue-500/20' : 'hover:bg-default-100'
                              }`}
                            onClick={() => {
                              const newElements = elements.map(el => {
                                if (contextMenu.elementIds.includes(el.id) && el.type === 'arrow') {
                                  return { ...el, arrowType: 'electrical' as const, curvature: undefined };
                                }
                                return el;
                              });
                              const oldElements = [...elements];
                              saveElementsWithHistory(newElements, oldElements, 'Tipo freccia modificato');
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 8 L6 8 L10 14 L14 14" fill="none" />
                            </svg>
                            <span>Schematico</span>
                          </button>

                          <div className="border-t border-gray-100 my-1" />

                          <button
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left text-sm hover:bg-default-100"
                            onClick={() => {
                              const newElements = elements.map(el => {
                                if (contextMenu.elementIds.includes(el.id) && el.type === 'arrow') {
                                  // Invert direction
                                  const startX = el.x;
                                  const startY = el.y;
                                  const endX = el.x + (el.width || 0);
                                  const endY = el.y + (el.height || 0);

                                  const newStartX = endX;
                                  const newStartY = endY;
                                  const newEndX = startX;
                                  const newEndY = startY;

                                  const newX = newStartX;
                                  const newY = newStartY;
                                  const newWidth = newEndX - newStartX;
                                  const newHeight = newEndY - newStartY;

                                  // Also invert anchors
                                  return {
                                    ...el,
                                    x: newX,
                                    y: newY,
                                    width: newWidth,
                                    height: newHeight,
                                    anchorStart: el.anchorEnd,
                                    anchorEnd: el.anchorStart
                                  };
                                }
                                return el;
                              });
                              const oldElements = [...elements];
                              saveElementsWithHistory(newElements, oldElements, 'Direzione invertita');
                              setContextMenu(null);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 8 L12 8 M4 8 L7 5 M4 8 L7 11 M12 8 L9 5 M12 8 L9 11" fill="none" strokeDasharray="2 2" />
                            </svg>
                            <span>Inverti direzione</span>
                          </button>

                          {firstArrow.arrowType === 'electrical' && (
                            <>
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left text-sm hover:bg-blue-50 text-blue-600"
                                onClick={() => {
                                  const svg = svgRef.current;
                                  if (!svg) return;
                                  const CTM = svg.getScreenCTM();
                                  if (!CTM) return;
                                  const svgX = (contextMenu.x - CTM.e) / CTM.a;
                                  const svgY = (contextMenu.y - CTM.f) / CTM.d;

                                  const newElements = elements.map(el => {
                                    if (contextMenu.elementIds.includes(el.id) && el.type === 'arrow') {
                                      const waypoints = el.waypoints || [];
                                      return { ...el, waypoints: [...waypoints, { x: svgX, y: svgY }] };
                                    }
                                    return el;
                                  });
                                  saveElementsWithHistory(newElements, [...elements], 'Punto di controllo aggiunto');
                                  setContextMenu(null);
                                }}
                              >
                                <Sparkles size={14} />
                                <span>Aggiungi punto</span>
                              </button>
                              {(firstArrow.waypoints || []).length > 0 && (
                                <button
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left text-sm hover:bg-red-50 text-red-600"
                                  onClick={() => {
                                    const newElements = elements.map(el => {
                                      if (contextMenu.elementIds.includes(el.id) && el.type === 'arrow') {
                                        const { waypoints, ...rest } = el;
                                        return rest as CanvasElement;
                                      }
                                      return el;
                                    });
                                    saveElementsWithHistory(newElements, [...elements], 'Punti di controllo rimossi');
                                    setContextMenu(null);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Rimuovi punti</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="border-t border-gray-200 my-1" />
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

          <div className="border-t border-gray-200 my-1" />

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

          {elements.some(el => selectedIds.includes(el.id) && el.type === 'rectangle') && (
            <div
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-default-100 cursor-pointer"
              onClick={() => {
                toggleRoundedCorners();
                setContextMenu(null);
              }}
            >
              <Square size={16} />
              <span>{elements.find(el => selectedIds.includes(el.id) && el.type === 'rectangle')?.radius ? 'Angoli retti' : 'Angoli arrotondati'}</span>
            </div>
          )}

          {contextMenu.elementIds.length > 1 && (
            <>
              <div className="px-2 py-2">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Allineamento</div>
                <div className="flex justify-between bg-gray-50/50 p-1 rounded-md border border-gray-100">
                  <button onClick={() => alignElements('left')} className="p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all text-gray-600" title="Allinea a sinistra"><AlignLeft size={16} /></button>
                  <button onClick={() => alignElements('center-h')} className="p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all text-gray-600" title="Allinea al centro orizzontale"><AlignCenter size={16} /></button>
                  <button onClick={() => alignElements('right')} className="p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all text-gray-600" title="Allinea a destra"><AlignRight size={16} /></button>
                  <div className="w-px bg-gray-200 mx-1 my-1"></div>
                  <button onClick={() => alignElements('top')} className="p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all text-gray-600" title="Allinea in alto"><ArrowUpToLine size={16} /></button>
                  <button onClick={() => alignElements('center-v')} className="p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all text-gray-600" title="Allinea al centro verticale"><AlignVerticalJustifyCenter size={16} /></button>
                  <button onClick={() => alignElements('bottom')} className="p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all text-gray-600" title="Allinea in basso"><ArrowDownToLine size={16} /></button>
                </div>

                {contextMenu.elementIds.length > 2 && (
                  <>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-3 px-1">Distribuzione</div>
                    <div className="flex gap-2 bg-gray-50/50 p-1 rounded-md border border-gray-100">
                      <button onClick={() => distributeElements('horizontal')} className="flex-1 p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all flex justify-center text-gray-600" title="Distribuisci orizzontalmente"><StretchHorizontal size={16} /></button>
                      <button onClick={() => distributeElements('vertical')} className="flex-1 p-1.5 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md transition-all flex justify-center text-gray-600" title="Distribuisci verticalmente"><StretchVertical size={16} /></button>
                    </div>
                  </>
                )}
              </div>
              <div className="border-t border-gray-200 my-1" />
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
                <div className="border-t border-gray-200 my-1" />
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
