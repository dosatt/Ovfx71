import React, { useState, useRef, useEffect } from 'react';
import { 
  File, 
  Folder, 
  FileText, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  FileImage, 
  FileCode, 
  MoreVertical, 
  Download, 
  Trash2, 
  Search,
  Star,
  Grid,
  List,
  LayoutGrid,
  Library,
  ArrowLeft,
  ExternalLink,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Columns,
  TableProperties,
  Upload,
  FolderPlus,
  Pencil,
  Copy,
  FolderInput,
  FilePlus,
  MoreHorizontal,
  Scissors,
  ClipboardList,
  Check
} from 'lucide-react';
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useDrag, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Settings } from '../hooks/useSettings';

export const ItemTypes = {
  FILE: 'file',
  EXTERNAL_ELEMENT: 'external_element',
  TEXT_ELEMENT: 'TEXT_ELEMENT'
};

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  icon?: string;
  preview?: string;
  isFolder?: boolean;
  isFavorite?: boolean;
  children?: FileItem[];
  parentId?: string;
  dateAdded?: string;
  dateCreated?: string;
  dateModified?: string;
}

interface FileElementProps {
  layout?: 'preview' | 'compact' | 'collection';
  collectionLayout?: 'grid' | 'list' | 'detail' | 'columns';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileIcon?: string;
  filePreview?: string;
  isFolder?: boolean;
  files?: FileItem[];
  searchQuery?: string;
  onUpdate?: (updates: any) => void;
  onDelete?: () => void;
  className?: string;
  isReadOnly?: boolean;
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
}

interface DraggableSingleElementProps {
  type: 'preview' | 'compact';
  fileName: string;
  fileSize: number;
  fileType: string;
  filePreview?: string;
  isFolder?: boolean;
  className?: string;
  triggerFileBrowser: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  renderLayoutMenu: () => React.ReactNode;
  isReadOnly: boolean;
  onDelete?: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string, isFolder?: boolean) => {
  if (isFolder) return <Folder className="w-8 h-8 text-amber-500" />;
  
  const t = type.toLowerCase();
  if (t.startsWith('image/')) return <FileImage className="w-8 h-8 text-blue-500" />;
  if (t.startsWith('video/')) return <FileVideo className="w-8 h-8 text-purple-500" />;
  if (t.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-pink-500" />;
  if (t.includes('zip') || t.includes('rar') || t.includes('archive')) return <FileArchive className="w-8 h-8 text-orange-500" />;
  if (t.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  if (t.includes('code') || t.includes('javascript') || t.includes('typescript') || t.includes('html') || t.includes('css')) return <FileCode className="w-8 h-8 text-emerald-500" />;
  
  return <File className="w-8 h-8 text-default-500" />;
};

const EMPTY_FILES: any[] = [];

export function FileElement({
  layout = 'compact',
  collectionLayout: initialCollectionLayout = 'grid',
  fileName = 'Collection', // Default name changed to Collection
  fileSize = 0,
  fileType = 'application/octet-stream',
  fileIcon,
  filePreview,
  isFolder = false,
  files: propFiles = EMPTY_FILES,
  searchQuery = '',
  onUpdate,
  onDelete,
  className = '',
  isReadOnly = false,
  settings,
  onUpdateSettings
}: FileElementProps) {
  // Use local state for snappiness, synchronized with props
  const [files, setFiles] = useState<FileItem[]>(Array.isArray(propFiles) ? propFiles : EMPTY_FILES);
  const lastPropFiles = useRef<FileItem[]>(propFiles);

  useEffect(() => {
    if (Array.isArray(propFiles) && propFiles !== lastPropFiles.current) {
      setFiles(propFiles);
      lastPropFiles.current = propFiles;
    }
  }, [propFiles]);

  const [internalSearch, setInternalSearch] = useState(searchQuery);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [collectionLayout, setCollectionLayout] = useState<'grid' | 'list' | 'detail' | 'columns'>(
    initialCollectionLayout || settings?.defaultCollectionLayout || 'grid'
  );
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [sortBy, setSortBy] = useState<'az' | 'za' | 'date' | 'size' | 'manual'>('az'); // State for custom layout menu
  const [detailColumnWidths, setDetailColumnWidths] = useState({
    name: 200,
    type: 100,
    size: 100,
    date: 120
  });
  const [viewOptions, setViewOptions] = useState({
    grid: { preview: true, title: true, type: true, size: true },
    list: { title: true, type: true, size: true, dateAdded: true, dateCreated: true, dateModified: true }
  });
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [columnPath, setColumnPath] = useState<(string | null)[]>([null]);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<Set<string | null>>(new Set());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // NEW: Track selection for preview
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isRenameRootOpen, setIsRenameRootOpen] = useState(false);
  const [rootNewName, setRootNewName] = useState(fileName);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileItem } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
  }, []);

  // Helper to find folder path for breadcrumbs
  const getFolderPath = (folderId: string | null): FileItem[] => {
    if (!folderId) return [];
    const path: FileItem[] = [];
    
    const findPath = (items: FileItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.children && findPath(item.children, targetId)) {
          path.unshift(item);
          return true;
        }
      }
      return false;
    };
    
    findPath(files, folderId);
    return path;
  };

  const openFolder = (id: string | null) => {
    setCurrentFolderId(id);
    const path = getFolderPath(id).map(f => f.id);
    setColumnPath([null, ...path]);
  };

  const breadcrumbs = getFolderPath(currentFolderId);

  // Get current level items
  const getCurrentItems = () => {
    if (!currentFolderId) return files;
    
    const findFolder = (items: FileItem[], id: string): FileItem[] | null => {
      for (const item of items) {
        if (item.id === id) return item.children || [];
        if (item.children) {
          const found = findFolder(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findFolder(files, currentFolderId) || [];
  };

  const currentItems = getCurrentItems();
  
  const sortedFiles = React.useMemo(() => {
    const items = [...currentItems];
    if (sortBy === 'manual') return items;
    
    return items.sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      if (sortBy === 'date') {
        const dateA = a.dateModified ? new Date(a.dateModified).getTime() : 0;
        const dateB = b.dateModified ? new Date(b.dateModified).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
    });
  }, [currentItems, sortBy]);

  const filteredFiles = sortedFiles.filter(f => 
    f && f.name.toLowerCase().includes(internalSearch.toLowerCase())
  );

  const reorderItem = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    // Auto-enable manual sort if we are reordering
    if (sortBy !== 'manual') {
      setSortBy('manual');
    }

    const findAndRemove = (items: FileItem[], id: string): { items: FileItem[], removedItem: FileItem | null } => {
      let removedItem: FileItem | null = null;
      const newItems = items.filter(item => {
        if (item.id === id) {
          removedItem = item;
          return false;
        }
        return true;
      }).map(item => {
        if (item.children) {
          const { items: newChildren, removedItem: found } = findAndRemove(item.children, id);
          if (found) removedItem = found;
          return { ...item, children: newChildren };
        }
        return item;
      });
      return { items: newItems, removedItem };
    };

    const { items: cleanFiles, removedItem } = findAndRemove(files, draggedId);
    if (!removedItem) return;

    // Prevent reordering into a target that was removed (e.g. child of the dragged folder)
    const findTarget = (items: FileItem[], id: string): boolean => {
      for (const item of items) {
        if (item.id === id) return true;
        if (item.children && findTarget(item.children, id)) return true;
      }
      return false;
    };

    if (!findTarget(cleanFiles, targetId)) {
      console.warn("Target not found in cleaned tree, move aborted to prevent data loss");
      return;
    }

    const insertAtTarget = (items: FileItem[], targetId: string, itemToInsert: FileItem): FileItem[] => {
      const targetIndex = items.findIndex(i => i.id === targetId);
      if (targetIndex !== -1) {
        const result = [...items];
        result.splice(targetIndex, 0, itemToInsert);
        return result;
      }
      
      return items.map(item => {
        if (item.children) {
          return { ...item, children: insertAtTarget(item.children, targetId, itemToInsert) };
        }
        return item;
      });
    };

    const updatedFiles = insertAtTarget(cleanFiles, targetId, removedItem);
    setFiles(updatedFiles);
    onUpdate?.({ files: updatedFiles });
  };

  const getAllFavorites = (items: FileItem[]): FileItem[] => {
    let favs: FileItem[] = [];
    items.forEach(item => {
      if (item.isFavorite) {
        favs.push(item);
      }
      if (item.children) {
        favs = [...favs, ...getAllFavorites(item.children)];
      }
    });
    return favs;
  };

  const favorites = getAllFavorites(files);
  const selectedItem = files.find(f => f && f.id === selectedItemId) || 
                   getCurrentItems().find(f => f && f.id === selectedItemId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Use a unified processing function to handle both drag-and-drop and manual selection
    processFiles(Array.from(selectedFiles));
    
    // Reset inputs so the same folder/file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const processFiles = (fileList: File[]) => {
    if (files.length || layout === 'collection') {
      const newItems: FileItem[] = [];
      const folderMap = new Map<string, FileItem>();

      fileList.forEach((f: any) => {
        // webkitRelativePath is the key for folder uploads
        const path = f.webkitRelativePath || '';
        
        if (path && path.includes('/')) {
          const parts = path.split('/');
          parts.pop(); // Remove the filename from the path parts
          
          let currentParentId = currentFolderId;
          let pathPrefix = "";

          // Ensure all parent folders in the path exist
          parts.forEach((part, index) => {
            pathPrefix += (index > 0 ? '/' : '') + part;
            
            if (!folderMap.has(pathPrefix)) {
              const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const newFolder: FileItem = {
                id: folderId,
                name: part,
                size: 0,
                type: 'directory',
                isFolder: true,
                children: [],
                parentId: currentParentId || undefined
              };
              folderMap.set(pathPrefix, newFolder);
              
              if (index === 0) {
                newItems.push(newFolder);
              } else {
                const parentPath = parts.slice(0, index).join('/');
                const parent = folderMap.get(parentPath);
                if (parent) {
                  parent.children = [...(parent.children || []), newFolder];
                }
              }
            }
            currentParentId = folderMap.get(pathPrefix)?.id || currentParentId;
          });

          // Create the file item
          const fileItem: FileItem = {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: f.name,
            size: f.size,
            type: f.type || 'application/octet-stream',
            isFolder: false,
            parentId: currentParentId || undefined,
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
          };
          
          const finalFolderKey = parts.join('/');
          const parentFolder = folderMap.get(finalFolderKey);
          if (parentFolder) {
            parentFolder.children = [...(parentFolder.children || []), fileItem];
          }
        } else {
          // Plain file upload (no relative path)
          newItems.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: f.name,
            size: f.size,
            type: f.type || 'application/octet-stream',
            isFolder: false,
            parentId: currentFolderId || undefined,
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
          });
        }
      });

      // Update state with the newly built tree
      if (!currentFolderId) {
        onUpdate?.({ files: [...files, ...newItems] });
      } else {
        const updateNested = (items: FileItem[]): FileItem[] => {
          return items.map(item => {
            if (item.id === currentFolderId) {
              return { ...item, children: [...(item.children || []), ...newItems] };
            }
            if (item.children) {
              return { ...item, children: updateNested(item.children) };
            }
            return item;
          });
        };
        onUpdate?.({ files: updateNested(files) });
      }
    } else {
      // Logic for single file mode
      const f = fileList[0];
      onUpdate?.({
        fileName: f.name,
        fileSize: f.size,
        fileType: f.type,
        filePreview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
      });
    }
  };

  const createFolder = () => {
    const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newFolder: FileItem = {
      id,
      name: 'Nuova Cartella',
      size: 0,
      type: 'directory',
      isFolder: true,
      children: [],
      parentId: currentFolderId || undefined,
      isFavorite: false
    };

    if (!currentFolderId) {
      onUpdate?.({ files: [newFolder, ...files] });
    } else {
      const updateNested = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.id === currentFolderId) {
            return { ...item, children: [newFolder, ...(item.children || [])] };
          }
          if (item.children) return { ...item, children: updateNested(item.children) };
          return item;
        });
      };
      onUpdate?.({ files: updateNested(files) });
    }
    setEditingItemId(id);
    setInternalSearch('');
  };

  const triggerFolderBrowser = () => {
    if (!isReadOnly) folderInputRef.current?.click();
  };

  const triggerFileBrowser = () => {
    if (!isReadOnly) fileInputRef.current?.click();
  };

  const renameItem = (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingItemId(null);
      return;
    }
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(f => {
        if (f.id === id) return { ...f, name: newName };
        if (f.children) return { ...f, children: updateRecursive(f.children) };
        return f;
      });
    };
    onUpdate?.({ files: updateRecursive(files) });
    setEditingItemId(null);
  };

  const toggleFavorite = (fileId: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(f => {
        if (f.id === fileId) return { ...f, isFavorite: !f.isFavorite };
        if (f.children) return { ...f, children: updateRecursive(f.children) };
        return f;
      });
    };
    onUpdate?.({ files: updateRecursive(files) });
  };

  const toggleColumnDetails = (id: string | null) => {
    setExpandedDetailsIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleColumnFolderClick = (folderId: string | null, index: number) => {
    const newPath = columnPath.slice(0, index + 1);
    newPath.push(folderId);
    setColumnPath(newPath);
    setSelectedItemId(folderId);
    if (folderId !== null) setCurrentFolderId(folderId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (collectionLayout !== 'columns' || !selectedItemId) return;

    // Find which column the selected item is in.
    let currentIdx = -1;
    for (let i = 0; i < columnPath.length - 1; i++) {
      if (columnPath[i+1] === selectedItemId) {
        currentIdx = i;
        break;
      }
    }
    
    if (currentIdx === -1) {
      currentIdx = columnPath.length - 1;
    }
    
    const folderId = columnPath[currentIdx];
    const isRoot = folderId === null;
    const folder = isRoot ? { children: files } : findInTree(files, folderId);
    const items = folder?.children || [];
    
    const currentItemIdx = items.findIndex(i => i.id === selectedItemId);
    if (currentItemIdx === -1) return;

    const scrollIntoView = (colIdx: number) => {
      if (!containerRef.current) return;
      const columns = containerRef.current.children;
      const targetColumn = columns[colIdx] as HTMLElement;
      if (targetColumn) {
        targetColumn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    };

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentItemIdx > 0) {
          const prevItem = items[currentItemIdx - 1];
          setSelectedItemId(prevItem.id);
          if (prevItem.isFolder) {
            const newPath = columnPath.slice(0, currentIdx + 1);
            newPath.push(prevItem.id);
            setColumnPath(newPath);
          } else {
            setColumnPath(columnPath.slice(0, currentIdx + 1));
          }
          scrollIntoView(currentIdx);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentItemIdx < items.length - 1) {
          const nextItem = items[currentItemIdx + 1];
          setSelectedItemId(nextItem.id);
          if (nextItem.isFolder) {
            const newPath = columnPath.slice(0, currentIdx + 1);
            newPath.push(nextItem.id);
            setColumnPath(newPath);
          } else {
            setColumnPath(columnPath.slice(0, currentIdx + 1));
          }
          scrollIntoView(currentIdx);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIdx > 0) {
          const parentId = columnPath[currentIdx];
          setSelectedItemId(parentId);
          setColumnPath(columnPath.slice(0, currentIdx + 1));
          scrollIntoView(currentIdx - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const currentItem = items[currentItemIdx];
        if (currentItem?.isFolder && currentItem.children && currentItem.children.length > 0) {
          const firstChild = currentItem.children[0];
          setSelectedItemId(firstChild.id);
          const newPath = columnPath.slice(0, currentIdx + 1);
          newPath.push(currentItem.id);
          if (firstChild.isFolder) newPath.push(firstChild.id);
          setColumnPath(newPath);
          
          setTimeout(() => {
            scrollIntoView(currentIdx + 1);
          }, 0);
        } else if (currentItem && !currentItem.isFolder) {
          // If it's a file, scroll to ensure the preview column (the very last child of the container) is visible
          setTimeout(() => {
            if (containerRef.current) {
              const children = Array.from(containerRef.current.children);
              const previewCol = children[children.length - 1] as HTMLElement;
              if (previewCol) {
                previewCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              }
            }
          }, 0);
        }
        break;
      case 'Enter':
        const itemToOpen = items[currentItemIdx];
        if (itemToOpen?.isFolder) openFolder(itemToOpen.id);
        break;
    }
  };

  const findInTree = (items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findInTree(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const importElement = (item: any, targetFolderId: string | null) => {
    // This handles importing a standalone FileElement (single file/folder) into a Collection
    const newFile: FileItem = {
      id: `imported_${Date.now()}`,
      name: item.fileName || 'Imported Element',
      size: item.fileSize || 0,
      type: item.fileType || 'application/octet-stream',
      preview: item.filePreview,
      isFolder: item.isFolder,
      parentId: targetFolderId || undefined,
      children: item.files || []
    };

    let updatedFiles: FileItem[];
    if (!targetFolderId) {
      updatedFiles = [...files, newFile];
    } else {
      const updateNested = (items: FileItem[]): FileItem[] => {
        return items.map(f => {
          if (f.id === targetFolderId) {
            return { ...f, children: [...(f.children || []), newFile] };
          }
          if (f.children) return { ...f, children: updateNested(f.children) };
          return f;
        });
      };
      updatedFiles = updateNested(files);
    }
    
    onUpdate?.({ files: updatedFiles });
  };

  const moveItem = (draggedId: string, targetFolderId: string | null) => {
    if (draggedId === targetFolderId) return;

    // Auto-enable manual sort if we are moving/reordering
    if (sortBy !== 'manual') {
      setSortBy('manual');
    }

    const findAndRemove = (items: FileItem[], id: string): { items: FileItem[], removedItem: FileItem | null } => {
      let removedItem: FileItem | null = null;
      const newItems = items.filter(item => {
        if (item.id === id) {
          removedItem = item;
          return false;
        }
        return true;
      }).map(item => {
        if (item.children) {
          const { items: newChildren, removedItem: found } = findAndRemove(item.children, id);
          if (found) removedItem = found;
          return { ...item, children: newChildren };
        }
        return item;
      });
      return { items: newItems, removedItem };
    };

    const { items: cleanFiles, removedItem } = findAndRemove(files, draggedId);
    if (!removedItem) return;

    // Prevent moving a folder into its own descendant
    if (targetFolderId) {
        const findTarget = (items: FileItem[], id: string): boolean => {
          for (const item of items) {
            if (item.id === id) return true;
            if (item.children && findTarget(item.children, id)) return true;
          }
          return false;
        };
        if (!findTarget(cleanFiles, targetFolderId)) {
            console.warn("Move aborted: target folder is a descendant of dragged folder");
            return;
        }
    }

    const addItemToFolder = (items: FileItem[], folderId: string | null, itemToAdd: FileItem): FileItem[] => {
      const newItem = { ...itemToAdd, parentId: folderId || undefined };
      if (!folderId) return [...items, newItem];
      
      return items.map(item => {
        if (item.id === folderId) {
          return { ...item, children: [...(item.children || []), newItem] };
        }
        if (item.children) {
          return { ...item, children: addItemToFolder(item.children, folderId, itemToAdd) };
        }
        return item;
      });
    };

    const updatedFiles = addItemToFolder(cleanFiles, targetFolderId, removedItem);
    setFiles(updatedFiles);
    onUpdate?.({ files: updatedFiles });
  };

  const deleteFile = (fileId: string) => {
    const deleteRecursive = (items: FileItem[]): FileItem[] => {
      return items.filter(f => f.id !== fileId).map(f => ({
        ...f,
        children: f.children ? deleteRecursive(f.children) : undefined
      }));
    };
    onUpdate?.({ files: deleteRecursive(files) });
  };

  const duplicateFile = (fileId: string) => {
    const duplicateRecursive = (items: FileItem[]): FileItem[] => {
      return items.reduce((acc, item) => {
        acc.push({ ...item, children: item.children ? duplicateRecursive(item.children) : undefined });
        if (item.id === fileId) {
          const newItem = {
            ...item,
            id: `${item.id}_copy_${Date.now()}`,
            name: `${item.name} (Copia)`,
            isFavorite: false
          };
          acc.push(newItem);
        }
        return acc;
      }, [] as FileItem[]);
    };
    onUpdate?.({ files: duplicateRecursive(files) });
  };

  const copyFile = (file: FileItem) => {
    localStorage.setItem('ovfx_clipboard', JSON.stringify({ type: 'copy', id: file.id, data: file }));
  };

  const cutFile = (file: FileItem) => {
    localStorage.setItem('ovfx_clipboard', JSON.stringify({ type: 'cut', id: file.id, data: file }));
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Context menu triggered for:", file.name, "at", e.clientX, e.clientY);
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const renderLayoutMenu = () => {
    if (isReadOnly) return null;
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly size="sm" variant="light" className="text-default-400">
            <MoreVertical size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu 
          aria-label="Layout options"
          onAction={(key) => onUpdate?.({ layout: key })}
        >
          <DropdownItem key="compact" startContent={<List size={14} />}>Compact View</DropdownItem>
          <DropdownItem key="preview" startContent={<LayoutGrid size={14} />}>Preview</DropdownItem>
          <DropdownItem key="collection" startContent={<Library size={14} />}>Collection View</DropdownItem>
          <DropdownItem key="delete" color="danger" className="text-danger" startContent={<Trash2 size={14} />} onClick={onDelete}>Delete Element</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  // Layout: Preview (Single File)
  if (layout === 'preview' && !files.length) {
    return <DraggableSingleElement 
      type="preview"
      fileName={fileName}
      fileSize={fileSize}
      fileType={fileType}
      filePreview={filePreview}
      isFolder={isFolder}
      className={className}
      triggerFileBrowser={triggerFileBrowser}
      handleFileChange={handleFileChange}
      fileInputRef={fileInputRef}
      renderLayoutMenu={renderLayoutMenu}
      isReadOnly={isReadOnly}
      onDelete={onDelete}
    />;
  }

  // Layout: Compact (Single File)
  if (layout === 'compact' && !files.length) {
    return <DraggableSingleElement 
      type="compact"
      fileName={fileName}
      fileSize={fileSize}
      fileType={fileType}
      filePreview={filePreview}
      isFolder={isFolder}
      className={className}
      triggerFileBrowser={triggerFileBrowser}
      handleFileChange={handleFileChange}
      fileInputRef={fileInputRef}
      renderLayoutMenu={renderLayoutMenu}
      isReadOnly={isReadOnly}
      onDelete={onDelete}
    />;
  }

  // Layout: Collection (Handles multiple files/folders)
  return (
    <>
      <AnimatePresence>
        {contextMenu && (
          <FileContextMenuStandalone 
            file={contextMenu.file}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            onClose={() => setContextMenu(null)}
            onRename={() => {
              setEditingItemId(contextMenu.file.id);
              setContextMenu(null);
            }}
            onDelete={() => {
              deleteFile(contextMenu.file.id);
              setContextMenu(null);
            }}
            onDuplicate={() => {
              duplicateFile(contextMenu.file.id);
              setContextMenu(null);
            }}
            onCopy={() => {
              copyFile(contextMenu.file);
              setContextMenu(null);
            }}
            onCut={() => {
              cutFile(contextMenu.file);
              setContextMenu(null);
            }}
            onMove={() => {
              console.log('Move', contextMenu.file.id);
              setContextMenu(null);
            }}
            onToggleFavorite={() => {
              toggleFavorite(contextMenu.file.id);
              setContextMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className={`flex flex-col gap-2 p-2 rounded-xl border border-default-200 bg-white/50 backdrop-blur-sm w-full h-fit max-h-[600px] overflow-hidden ${className}`}>
        {/* Hidden inputs for uploads */}
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
        <input 
          type="file" 
          ref={folderInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />

        {/* Main Content Area */}
        <div className="flex flex-col gap-0 flex-1 overflow-hidden">
          {/* Breadcrumbs and Action Bar - MOVED TO TOP */}
          <div className="flex items-center justify-between px-3 h-10 mb-1 shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 py-1 no-scrollbar whitespace-nowrap">
              <div className="flex items-center gap-0 group/root relative shrink-0 ml-[10px]">
                <div className="flex items-center gap-2 mr-1">
                  <Library size={18} className={!currentFolderId ? 'text-primary' : 'text-default-400'} />
                  <button 
                    onClick={() => openFolder(null)}
                    className={`text-[18px] font-black transition-colors hover:text-primary truncate max-w-[200px] z-10 ${!currentFolderId ? 'text-primary' : 'text-default-700'}`}
                  >
                    {fileName || 'Collection'}
                  </button>
                </div>
                {!isReadOnly && (
                  <div className="flex items-center overflow-hidden transition-all duration-300 w-0 group-hover/root:w-6 group-hover/root:ml-1">
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRootNewName(fileName || 'Collection');
                        setIsRenameRootOpen(true);
                      }}
                      className="p-1 hover:bg-default-200 rounded transition-all cursor-pointer flex items-center justify-center min-w-[20px] min-h-[20px] active:scale-90 opacity-0 group-hover/root:opacity-100"
                      title="Rinomina Raccolta"
                    >
                      <Pencil size={10} className="text-default-400 pointer-events-none" />
                    </button>

                    <Dialog open={isRenameRootOpen} onOpenChange={setIsRenameRootOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Rinomina Raccolta</DialogTitle>
                          <DialogDescription>
                            Inserisci il nuovo nome per questa raccolta.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 text-left">
                          <Input
                            fullWidth
                            value={rootNewName}
                            onValueChange={setRootNewName}
                            placeholder="Nome raccolta"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (rootNewName.trim() !== "" && rootNewName.trim() !== fileName) {
                                  onUpdate?.({ fileName: rootNewName.trim() });
                                }
                                setIsRenameRootOpen(false);
                              }
                            }}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" size="sm" onPress={() => setIsRenameRootOpen(false)}>
                            Annulla
                          </Button>
                          <Button 
                            color="primary" 
                            size="sm"
                            onPress={() => {
                              if (rootNewName.trim() !== "" && rootNewName.trim() !== fileName) {
                                onUpdate?.({ fileName: rootNewName.trim() });
                              }
                              setIsRenameRootOpen(false);
                            }}
                          >
                            Salva
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight size={12} className="text-default-300 shrink-0" />
                  <button 
                    onClick={() => openFolder(crumb.id)}
                    className={`text-[13px] font-bold transition-colors hover:text-primary truncate max-w-[140px] ${crumb.id === currentFolderId ? 'text-primary' : 'text-default-400'}`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-default-100/80 p-0.5 rounded-lg border border-default-200/50 shadow-sm relative">
                {/* Search Bar */}
                <div className="flex items-center overflow-hidden">
                  <AnimatePresence initial={false}>
                    {showSearch ? (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 240, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center"
                      >
                        <Input
                          size="sm"
                          variant="flat"
                          placeholder="Cerca nella raccolta..."
                          value={internalSearch}
                          onValueChange={(val) => {
                            setInternalSearch(val);
                            onUpdate?.({ searchQuery: val });
                          }}
                          onBlur={() => !internalSearch && setShowSearch(false)}
                          className="w-full h-8 text-xs ml-1"
                          classNames={{ 
                            inputWrapper: "bg-white h-8 border border-default-200 shadow-inner",
                            input: "text-[11px] font-medium"
                          }}
                          startContent={<Search size={14} className="text-default-400" />}
                          autoFocus
                        />
                      </motion.div>
                    ) : (
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        className="text-default-400 h-8 w-8 min-w-8 hover:bg-white hover:shadow-sm" 
                        onClick={() => setShowSearch(true)}
                      >
                        <Search size={16} />
                      </Button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Layout and Sorting Menu */}
                <div className="relative">
                  <Button 
                    isIconOnly
                    size="sm" 
                    variant="light" 
                    className="text-default-400 h-8 w-8 min-w-8 hover:bg-white hover:shadow-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuWidth = 224;
                      const gap = 8;
                      let left = rect.right - menuWidth;
                      let top = rect.bottom + gap;
                      if (left < gap) left = gap;
                      if (left + menuWidth > window.innerWidth - gap) left = window.innerWidth - menuWidth - gap;
                      if (top + 300 > window.innerHeight) top = rect.top - 300 - gap;
                      setMenuPosition({ top, left });
                      setShowLayoutMenu(!showLayoutMenu);
                      setShowActionsMenu(false);
                    }}
                  >
                    {collectionLayout === 'grid' ? <LayoutGrid size={16} /> : 
                     collectionLayout === 'list' ? <List size={16} /> : 
                     collectionLayout === 'columns' ? <Columns size={16} /> :
                     <FileText size={16} />}
                  </Button>
                  
                  {showLayoutMenu && menuPosition && createPortal(
                    <>
                      <div className="fixed inset-0 z-[99998]" onClick={() => setShowLayoutMenu(false)} />
                      <div 
                        className="fixed w-56 bg-white border border-default-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-[99999] py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                      >
                        <div className="px-3 py-1.5 text-[9px] font-black uppercase text-default-400 tracking-widest border-b border-default-50 mb-1">Visualizzazione</div>
                        <div className="px-1 pb-1 border-b border-default-50">
                          {[
                            { id: 'grid', label: 'Griglia', icon: LayoutGrid },
                            { id: 'list', label: 'Elenco', icon: List },
                            { id: 'detail', label: 'Dettagli', icon: FileText },
                            { id: 'columns', label: 'Colonne', icon: Columns }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollectionLayout(item.id as any);
                                setShowLayoutMenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-default-50 ${collectionLayout === item.id ? 'text-primary bg-primary/5' : 'text-default-600'}`}
                            >
                              <item.icon size={12} />
                              {item.label}
                            </button>
                          ))}
                        </div>
                        {/* Sorting Section */}
                        <div className="px-3 py-1.5 text-[9px] font-black uppercase text-default-400 tracking-widest mt-1">Ordina per</div>
                        <div className="px-1 pb-1">
                          {[
                            { id: 'az', label: 'Nome (A-Z)' },
                            { id: 'za', label: 'Nome (Z-A)' },
                            { id: 'date', label: 'Data Modifica' },
                            { id: 'size', label: 'Dimensione' },
                            { id: 'manual', label: 'Manuale (DND)' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortBy(item.id as any);
                                setShowLayoutMenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-default-50 ${sortBy === item.id ? 'text-primary bg-primary/5' : 'text-default-600'}`}
                            >
                              <Check size={12} className={sortBy === item.id ? 'opacity-100' : 'opacity-0'} />
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <Button 
                    isIconOnly
                    size="sm" 
                    variant="light" 
                    className="text-default-400 h-8 w-8 min-w-8 hover:bg-white hover:shadow-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuWidth = 224;
                      const gap = 8;
                      let left = rect.right - menuWidth;
                      let top = rect.bottom + gap;
                      if (left < gap) left = gap;
                      if (left + menuWidth > window.innerWidth - gap) left = window.innerWidth - menuWidth - gap;
                      if (top + 300 > window.innerHeight) top = rect.top - 300 - gap;
                      setMenuPosition({ top, left });
                      setShowActionsMenu(!showActionsMenu);
                      setShowLayoutMenu(false);
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                  {showActionsMenu && menuPosition && createPortal(
                    <>
                      <div className="fixed inset-0 z-[99998]" onClick={() => setShowActionsMenu(false)} />
                      <div 
                        className="fixed w-56 bg-white border border-default-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-[99999] py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                      >
                        <div className="px-3 py-1.5 border-b border-default-50">
                          <span className="text-[9px] font-black uppercase text-default-400 tracking-wider">Azioni</span>
                        </div>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-default-600 hover:bg-default-50"
                          onClick={() => { createFolder(); setShowActionsMenu(false); }}
                        >
                          <FolderPlus size={16} className="text-amber-500" />
                          Nuova cartella
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-default-600 hover:bg-default-50"
                          onClick={() => { triggerFileBrowser(); setShowActionsMenu(false); }}
                        >
                          <Upload size={16} className="text-blue-500" />
                          Importa file
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-default-600 hover:bg-default-50"
                          onClick={() => { triggerFolderBrowser(); setShowActionsMenu(false); }}
                        >
                          <FolderInput size={16} className="text-green-500" />
                          Importa cartella
                        </button>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-default-100 mb-1" />

          {/* Favorites Section - RESTORED & POSITIONED BELOW HEADER */}
          {!internalSearch && favorites.length > 0 && (
            <>
              <div 
                className="grid gap-2 py-2 bg-default-50/30 px-2 w-full shrink-0"
                style={{ 
                  gridTemplateColumns: `repeat(${Math.min(favorites.length, 6)}, minmax(0, 1fr))` 
                }}
              >
                {favorites.slice(0, 6).map(file => (
                  <ItemDropTarget key={file.id} file={file} files={files} onMove={moveItem} onImport={importElement} onReorder={reorderItem} sortBy={sortBy} onDelete={deleteFile}>
                    <div className="w-full h-full min-h-[184px] max-h-[184px] p-1">
                      <FileCard 
                        file={file} 
                        isFavorite={true} 
                        isLarge={false} 
                        isReadOnly={isReadOnly} 
                        isEditing={editingItemId === file.id}
                        onRename={(newName) => renameItem(file.id, newName)}
                        onCancelEdit={() => setEditingItemId(null)}
                        onToggleFavorite={() => toggleFavorite(file.id)}
                        onOpen={() => file.isFolder ? setCurrentFolderId(file.id) : setSelectedItemId(file.id)}
                        onMove={moveItem}
                        onImport={importElement}
                        onDelete={() => deleteFile(file.id)}
                        onDuplicate={() => duplicateFile(file.id)}
                        onCopy={() => copyFile(file)}
                        onCut={() => cutFile(file)}
                        onMoveMenu={() => console.log('Move', file.id)}
                        onStartEdit={() => setEditingItemId(file.id)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        onMenuOpen={handleContextMenu}
                      />
                    </div>
                  </ItemDropTarget>
                ))}
              </div>
              <div className="h-[2px] w-[calc(100%-24px)] mx-auto bg-default-600 my-2 shadow-sm" />
            </>
          )}

          {/* Content area - Handles clipping and scrolling */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-2">
            {collectionLayout === 'grid' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {sortBy === 'manual' && (
                  <GridBoundaryDropZone 
                    position="start" 
                    files={files}
                    onMove={moveItem} 
                    onImport={importElement} 
                    onReorder={reorderItem} 
                    currentFolderId={currentFolderId}
                    firstFileId={filteredFiles[0]?.id}
                  />
                )}
                {filteredFiles.map(file => (
                  <ItemDropTarget key={file.id} file={file} files={files} onMove={moveItem} onImport={importElement} onReorder={reorderItem} sortBy={sortBy} onDelete={deleteFile}>
                    <div className="p-1">
                      <FileCard 
                        file={file} 
                        isReadOnly={isReadOnly} 
                        isEditing={editingItemId === file.id}
                        options={{...viewOptions.grid, type: false, size: false}}
                        onRename={(newName) => renameItem(file.id, newName)}
                        onCancelEdit={() => setEditingItemId(null)}
                        onToggleFavorite={() => toggleFavorite(file.id)}
                        onOpen={() => file.isFolder ? openFolder(file.id) : setSelectedItemId(file.id)}
                        onMove={moveItem}
                        onImport={importElement}
                        onDelete={() => deleteFile(file.id)}
                        onDuplicate={() => duplicateFile(file.id)}
                        onCopy={() => copyFile(file)}
                        onCut={() => cutFile(file)}
                        onMoveMenu={() => console.log('Move', file.id)}
                        onStartEdit={() => setEditingItemId(file.id)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        onMenuOpen={handleContextMenu}
                      />
                    </div>
                  </ItemDropTarget>
                ))}
                {sortBy === 'manual' && (
                  <GridBoundaryDropZone 
                    position="end" 
                    files={files}
                    onMove={moveItem} 
                    onImport={importElement} 
                    onReorder={reorderItem} 
                    currentFolderId={currentFolderId}
                  />
                )}
              </div>
            )}

            {collectionLayout === 'list' && (
              <div className="flex flex-col gap-1">
                {filteredFiles.map(file => (
                  <ItemDropTarget key={file.id} file={file} files={files} onMove={moveItem} onImport={importElement} onReorder={reorderItem} sortBy={sortBy} onDelete={deleteFile}>
                    <ListItem 
                      file={file} 
                      isReadOnly={isReadOnly}
                      isEditing={editingItemId === file.id}
                      options={viewOptions.list}
                      onRename={(newName) => renameItem(file.id, newName)}
                      onCancelEdit={() => setEditingItemId(null)}
                      onToggleFavorite={() => toggleFavorite(file.id)}
                      onOpen={() => file.isFolder ? openFolder(file.id) : setSelectedItemId(file.id)}
                      onMove={moveItem}
                      onImport={importElement}
                      onDelete={() => deleteFile(file.id)}
                      onDuplicate={() => duplicateFile(file.id)}
                      onCopy={() => copyFile(file)}
                      onCut={() => cutFile(file)}
                      onMoveMenu={() => console.log('Move', file.id)}
                      onStartEdit={() => setEditingItemId(file.id)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      onMenuOpen={handleContextMenu}
                    />
                  </ItemDropTarget>
                ))}
              </div>
            )}

            {collectionLayout === 'detail' && (
              <div className="flex flex-col border border-default-100 rounded-lg overflow-x-auto min-h-full bg-white">
                <div className="flex items-center gap-0 bg-default-50 border-b border-default-100 sticky top-0 z-20 min-w-max">
                  <div className="w-8 shrink-0 border-r border-default-100 h-8 flex items-center justify-center">
                    <Star size={10} className="text-default-300" />
                  </div>
                  {/* Name Column */}
                  <div 
                    style={{ width: detailColumnWidths.name }}
                    className="flex items-center justify-between px-2 py-1.5 h-8 relative group shrink-0"
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-default-400">Nome</span>
                    <div 
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = detailColumnWidths.name;
                        const move = (moveEvent: MouseEvent) => {
                          setDetailColumnWidths(prev => ({ ...prev, name: Math.max(100, startWidth + (moveEvent.pageX - startX)) }));
                        };
                        const up = () => {
                          window.removeEventListener('mousemove', move);
                          window.removeEventListener('mouseup', up);
                        };
                        window.addEventListener('mousemove', move);
                        window.addEventListener('mouseup', up);
                      }}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 z-30" 
                    />
                  </div>

                  {/* Type Column */}
                  <div 
                    style={{ width: detailColumnWidths.type }}
                    className="flex items-center justify-between px-2 py-1.5 h-8 relative group shrink-0"
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-default-400">Tipo</span>
                    <div 
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = detailColumnWidths.type;
                        const move = (moveEvent: MouseEvent) => {
                          setDetailColumnWidths(prev => ({ ...prev, type: Math.max(60, startWidth + (moveEvent.pageX - startX)) }));
                        };
                        const up = () => {
                          window.removeEventListener('mousemove', move);
                          window.removeEventListener('mouseup', up);
                        };
                        window.addEventListener('mousemove', move);
                        window.addEventListener('mouseup', up);
                      }}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 z-30" 
                    />
                  </div>

                  {/* Size Column */}
                  <div 
                    style={{ width: detailColumnWidths.size }}
                    className="flex items-center justify-between px-2 py-1.5 h-8 relative group shrink-0"
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-default-400">Dimensione</span>
                    <div 
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = detailColumnWidths.size;
                        const move = (moveEvent: MouseEvent) => {
                          setDetailColumnWidths(prev => ({ ...prev, size: Math.max(60, startWidth + (moveEvent.pageX - startX)) }));
                        };
                        const up = () => {
                          window.removeEventListener('mousemove', move);
                          window.removeEventListener('mouseup', up);
                        };
                        window.addEventListener('mousemove', move);
                        window.addEventListener('mouseup', up);
                      }}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 z-30" 
                    />
                  </div>

                  {/* Date Column */}
                  <div 
                    style={{ width: detailColumnWidths.date }}
                    className="flex items-center justify-between px-2 py-1.5 h-8 relative group shrink-0"
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-default-400">Modifica</span>
                    <div 
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = detailColumnWidths.date;
                        const move = (moveEvent: MouseEvent) => {
                          setDetailColumnWidths(prev => ({ ...prev, date: Math.max(80, startWidth + (moveEvent.pageX - startX)) }));
                        };
                        const up = () => {
                          window.removeEventListener('mousemove', move);
                          window.removeEventListener('mouseup', up);
                        };
                        window.addEventListener('mousemove', move);
                        window.addEventListener('mouseup', up);
                      }}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 z-30" 
                    />
                  </div>
                </div>
                {filteredFiles.map(file => (
                  <ItemDropTarget key={file.id} file={file} onMove={moveItem} onImport={importElement} onReorder={reorderItem} sortBy={sortBy} onDelete={deleteFile}>
                    <DetailItem 
                      file={file} 
                      isReadOnly={isReadOnly}
                      isEditing={editingItemId === file.id}
                      options={viewOptions.list}
                      widths={detailColumnWidths}
                      onRename={(newName) => renameItem(file.id, newName)}
                      onCancelEdit={() => setEditingItemId(null)}
                      onToggleFavorite={() => toggleFavorite(file.id)}
                      onOpen={() => file.isFolder ? openFolder(file.id) : setSelectedItemId(file.id)}
                      onMove={moveItem}
                      onImport={importElement}
                      onDelete={() => deleteFile(file.id)}
                      onDuplicate={() => duplicateFile(file.id)}
                      onCopy={() => copyFile(file)}
                      onCut={() => cutFile(file)}
                      onMoveMenu={() => console.log('Move', file.id)}
                      onStartEdit={() => setEditingItemId(file.id)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      onMenuOpen={handleContextMenu}
                    />
                  </ItemDropTarget>
                ))}
              </div>
            )}

            {collectionLayout === 'columns' && (
              <div 
                ref={containerRef}
                className="flex gap-0 border border-default-100 rounded-xl overflow-x-auto min-h-[350px] bg-white shadow-sm scrollbar-hide outline-none focus:ring-1 focus:ring-primary/20"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={() => containerRef.current?.focus()}
              >
                {columnPath.map((folderId, idx) => {
                  const isRoot = folderId === null;
                  const folder = isRoot ? { id: 'root', name: fileName || 'Collection', children: files } : findInTree(files, folderId);
                  
                  if (!folder) return null;
                  
                  const items = folder.children || [];
                  const isExpanded = expandedDetailsIds.has(folderId);
                  const currentWidth = columnWidths[idx] || 224;

                  return (
                    <div key={idx} className="flex shrink-0">
                      <ColumnDropZone 
                        folderId={folderId} 
                        onMove={moveItem} 
                        onImport={importElement} 
                        onDropFiles={processFiles}
                        width={currentWidth}
                      >
                        {/* Column Header / Title Bar */}
                        <div 
                          className="p-2 border-b border-default-100 bg-default-50/50 flex items-center justify-between z-10"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isRoot ? (
                              <LayoutGrid size={12} className="text-primary shrink-0" />
                            ) : (
                              <Folder size={12} className="text-amber-500 shrink-0" />
                            )}
                            <span className="text-[9px] font-black uppercase text-default-600 tracking-widest truncate">
                              {folder.name}
                            </span>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="h-6 w-6 min-w-6 text-default-400 hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(expandedDetailsIds);
                              if (newSet.has(folderId)) {
                                newSet.delete(folderId);
                              } else {
                                newSet.add(folderId);
                              }
                              setExpandedDetailsIds(newSet);
                            }}
                          >
                            <ChevronDown 
                              size={12} 
                              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          </Button>
                        </div>

                        {/* Folder Details - Conditional based on Chevron toggle */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-default-50/30 border-b border-default-100"
                            >
                              <div className="p-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-default-400 font-bold uppercase">Elementi</span>
                                  <span className="text-[10px] text-default-600 font-black">{items.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-default-400 font-bold uppercase">Dimensione</span>
                                  <span className="text-[10px] text-default-600 font-black">
                                    {formatFileSize(items.reduce((acc, item) => acc + (item.size || 0), 0))}
                                  </span>
                                </div>
                                {!isRoot && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-default-400 font-bold uppercase">Modificato</span>
                                    <span className="text-[10px] text-default-600 font-black">{folder.dateModified || '3 Gen'}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-1 gap-0.5 flex flex-col scrollbar-hide">
                          {items.length > 0 ? (
                            items.map(item => {
                              const isSelected = selectedItemId === item.id || columnPath[idx + 1] === item.id;
                              return (
                                <ItemDropTarget key={item.id} file={item} files={files} onMove={moveItem} onImport={importElement} onReorder={reorderItem} sortBy={sortBy} onDelete={deleteFile}>
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      containerRef.current?.focus();
                                      if (item.isFolder) {
                                        handleColumnFolderClick(item.id, idx);
                                      } else {
                                        // Set the path to end here for files
                                        setColumnPath(columnPath.slice(0, idx + 1));
                                        setSelectedItemId(item.id);
                                      }
                                    }}
                                    className={`flex items-center justify-between p-1.5 rounded-lg transition-all group cursor-pointer text-[11px] ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30 shadow-sm' : 'hover:bg-default-50'}`}
                                  >
                                    <div className="flex items-center gap-2 truncate flex-1">
                                      <div className={isSelected ? 'scale-100' : 'scale-75'}>
                                        {getFileIcon(item.type, item.isFolder)}
                                      </div>
                                      <span className={`truncate font-medium ${isSelected ? 'text-primary' : 'text-default-700'}`}>
                                        {item.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {!isReadOnly && (
                                        <div 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleContextMenu(e, item);
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-default-200 cursor-pointer"
                                        >
                                          <MoreVertical size={10} className="text-default-500" />
                                        </div>
                                      )}
                                      {item.isFavorite && <Star size={8} className="text-amber-400 fill-amber-400" />}
                                      {item.isFolder && (
                                        <ChevronRight size={10} className={isSelected ? 'text-primary' : 'text-default-300'} />
                                      )}
                                    </div>
                                  </div>
                                </ItemDropTarget>
                              );
                            })
                          ) : (
                            <div className="flex flex-col items-center justify-center h-20 opacity-20">
                              <FolderPlus size={16} />
                              <span className="text-[8px] font-black uppercase mt-1">Vuota</span>
                            </div>
                          )}
                        </div>
                      </ColumnDropZone>

                      {/* Resizer Handle */}
                      <div 
                        className="w-1 cursor-col-resize hover:bg-primary/50 transition-colors bg-default-50 flex items-center justify-center group"
                        onMouseDown={(e) => {
                          const startX = e.pageX;
                          const startWidth = currentWidth;
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const newWidth = Math.max(150, Math.min(600, startWidth + (moveEvent.pageX - startX)));
                            setColumnWidths(prev => {
                              const next = [...prev];
                              next[idx] = newWidth;
                              return next;
                            });
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            document.body.style.cursor = 'default';
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                          document.body.style.cursor = 'col-resize';
                        }}
                      >
                        <div className="w-[1px] h-4 bg-default-200 group-hover:bg-primary/50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isReadOnly && filteredFiles.length === 0 && (
              <div 
                onClick={triggerFileBrowser}
                className="col-span-full py-4 flex flex-col items-center justify-center text-default-400 border border-dashed border-default-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <Plus size={16} className="text-default-400 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1">drop here or click to upload</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}


function DraggableSingleElement({ 
  type, fileName, fileSize, fileType, filePreview, isFolder, className, 
  triggerFileBrowser, handleFileChange, fileInputRef, renderLayoutMenu, isReadOnly,
  onDelete
}: DraggableSingleElementProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EXTERNAL_ELEMENT,
    item: { 
      type: 'external',
      id: `ext-${Date.now()}`,
      data: { fileName, fileSize, fileType, filePreview, isFolder }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult: any = monitor.getDropResult();
      // If the single file was dropped into a collection view (which returns handled: true)
      // we remove it from the page to complete the "move" operation
      if (dropResult?.handled && onDelete) {
        onDelete();
      }
    }
  }), [fileName, fileSize, fileType, filePreview, isFolder, onDelete]);

  if (type === 'preview') {
    return (
      <div 
        ref={drag as any}
        className={`relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-default-200 hover:border-primary/50 hover:bg-primary/5 transition-all w-48 h-48 ${isDragging ? 'opacity-50 grayscale' : ''} ${className}`}
      >
        <div onClick={triggerFileBrowser} className="flex flex-col items-center gap-2 text-center cursor-pointer w-full h-full justify-center">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          {filePreview ? (
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-default-100 shadow-sm">
              <ImageWithFallback src={filePreview} alt={fileName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="scale-125">{getFileIcon(fileType, isFolder)}</div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[140px]">{fileName}</span>
            <span className="text-[10px] text-default-400">{formatFileSize(fileSize)}</span>
          </div>
        </div>
        {!isReadOnly && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {renderLayoutMenu()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={drag as any}
      className={`group relative flex items-center gap-3 p-2 rounded-xl border border-default-200 hover:border-primary/30 hover:bg-default-50 transition-all w-full ${isDragging ? 'opacity-50 grayscale' : ''} ${className}`}
    >
      <div onClick={triggerFileBrowser} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden">
          {filePreview ? (
            <ImageWithFallback src={filePreview} alt={fileName} className="w-full h-full object-cover" />
          ) : (
            <div className="scale-75">{getFileIcon(fileType, isFolder)}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium truncate leading-tight">{fileName}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-default-500 uppercase font-bold tracking-wider">{fileType.split('/')[1]?.substring(0, 4) || 'FILE'}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-default-300"></span>
            <span className="text-[9px] text-default-400">{formatFileSize(fileSize)}</span>
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {renderLayoutMenu()}
        </div>
      )}
    </div>
  );
}

function BreadcrumbTarget({ children, folderId, onMove, onImport }: { children: React.ReactNode, folderId: string | null, onMove: any, onImport: any }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.FILE, ItemTypes.EXTERNAL_ELEMENT],
    drop: (item: any) => {
      if (item.type === 'external') {
        onImport(item.data, folderId);
      } else {
        onMove(item.id, folderId);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [folderId, onMove, onImport]);

  return (
    <div ref={drop as any} className={`transition-all rounded px-1 ${isOver ? 'bg-primary/20 scale-110 ring-2 ring-primary' : ''}`}>
      {children}
    </div>
  );
}

function ColumnDropZone({ children, folderId, onMove, onImport, onDropFiles, width }: { children: React.ReactNode, folderId: string | null, onMove: (id: string, folderId: string | null) => void, onImport: (item: any, folderId: string | null) => void, onDropFiles: (files: File[]) => void, width: number }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.FILE, ItemTypes.EXTERNAL_ELEMENT, NativeTypes.FILE],
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) return;
      
      const type = monitor.getItemType();
      
      if (type === NativeTypes.FILE) {
        const files = monitor.getItem().files;
        if (files && files.length > 0) {
          onDropFiles(Array.from(files));
        }
        return { dropped: true };
      }

      if (item && item.type === 'external') {
        onImport(item.data, folderId);
        return { dropped: true };
      }

      if (item && item.id) {
        onMove(item.id, folderId);
        return { dropped: true };
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
  }), [folderId, onMove, onImport, onDropFiles]);

  return (
    <div 
      ref={drop as any}
      style={{ width }}
      className={`border-r border-default-100 flex flex-col bg-white relative animate-in fade-in slide-in-from-left-2 transition-colors ${
        isOver ? 'bg-primary/5' : ''
      }`}
    >
      {isOver && (
        <div className="absolute inset-0 border-2 border-primary/30 border-dashed pointer-events-none z-20 m-1 rounded-lg" />
      )}
      {children}
    </div>
  );
}

function ItemDropTarget({ children, file, files, onMove, onImport, onReorder, sortBy, onDelete }: { children: React.ReactNode, file: FileItem, files: FileItem[], onMove: any, onImport: any, onReorder: (draggedId: string, targetId: string) => void, sortBy: string, onDelete?: (id: string) => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FILE,
    item: { id: file.id, fileData: file, type: 'file_item' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult: any = monitor.getDropResult();
      // Only delete if it was "pulled out" to another target that handles it as a move/import
      if (dropResult?.pulledOut && onDelete) {
        onDelete(item.id);
      }
    }
  }), [file.id, file, onDelete]);

  const [{ isOver, canDrop, isOverShallow }, drop] = useDrop(() => ({
    accept: [ItemTypes.FILE, ItemTypes.EXTERNAL_ELEMENT, ItemTypes.TEXT_ELEMENT],
    canDrop: (item: any) => {
      // Always allow dropping into folders
      if (file.isFolder && item.id !== file.id) return true;
      // Allow reordering if manual sort is active OR if we want to trigger it
      return item.id !== file.id;
    },
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) return;
      
      const isOverInner = monitor.isOver({ shallow: true });
      
      // Handle dropping a TextElement (block) into a collection
      if (item.itemType === ItemTypes.TEXT_ELEMENT || item.type === ItemTypes.TEXT_ELEMENT) {
        const block = item.fullBlock;
        if (block && (block.type === 'file' || block.type === 'image')) {
          const importData = block.type === 'file' 
            ? { 
                fileName: block.metadata?.fileName || block.content || 'File',
                fileSize: block.metadata?.fileSize || 0,
                fileType: block.metadata?.fileType || 'application/octet-stream',
                filePreview: block.metadata?.filePreview,
                isFolder: block.metadata?.isFolder || false
              }
            : {
                fileName: 'Image',
                fileSize: 0,
                fileType: 'image/png',
                filePreview: block.content,
                isFolder: false
              };
          
          onImport(importData, file.isFolder ? file.id : (file.parentId || null));
          return { dropped: true, handled: true };
        }
      }

      if (file.isFolder) {
        // Drop INSIDE folder
        if (item.type === 'external') {
          onImport(item.data, file.id);
        } else {
          // Check if it's from the same collection
          const isInternal = files.some(f => f.id === item.id) || (function checkNested(items): boolean {
            for (const f of items) {
              if (f.id === item.id) return true;
              if (f.children && checkNested(f.children)) return true;
            }
            return false;
          })(files);

          if (isInternal) {
            onMove(item.id, file.id);
          } else {
            // Import from other collection
            onImport(item.fileData || item.data, file.id);
            return { dropped: true, pulledOut: true }; // Trigger removal from source
          }
        }
        return { dropped: true };
      } else {
        // Drop BEFORE file (Reorder)
        if (item.id && item.id !== file.id) {
          // Check if it's from the same collection
          const isInternal = files.some(f => f.id === item.id) || (function checkNested(items): boolean {
            for (const f of items) {
              if (f.id === item.id) return true;
              if (f.children && checkNested(f.children)) return true;
            }
            return false;
          })(files);

          if (isInternal) {
            onReorder(item.id, file.id);
          } else {
            // Import from other collection
            onImport(item.fileData || item.data, file.parentId || null);
            return { dropped: true, pulledOut: true }; // Trigger removal from source
          }
          return { dropped: true };
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      isOverShallow: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  }), [file.id, file.isFolder, onMove, onImport, onReorder, sortBy]);

  // Visual feedback for reordering (between) vs moving (inside)
  const showReorderIndicator = isOverShallow && !file.isFolder;
  const showMoveIndicator = isOver && file.isFolder;

  return (
    <div 
      ref={(node) => { drag(drop(node)); }} 
      className={`relative transition-all rounded-lg ${isDragging ? 'opacity-40 grayscale scale-95' : ''}`}
    >
      {/* Reorder Drop Zone (Indicator) */}
      {showReorderIndicator && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] z-20 rounded-full animate-pulse" />
      )}
      
      {/* Folder Drop Zone (Indicator) */}
      <div className={`transition-all rounded-lg h-full ${showMoveIndicator ? 'bg-primary/20 ring-2 ring-primary scale-[1.02] z-10 shadow-lg' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function GridBoundaryDropZone({ files, onMove, onImport, onReorder, position, currentFolderId, firstFileId }: { files: FileItem[], onMove: any, onImport: any, onReorder: any, position: 'start' | 'end', currentFolderId: string | null, firstFileId?: string }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ItemTypes.FILE, ItemTypes.EXTERNAL_ELEMENT, ItemTypes.TEXT_ELEMENT],
    drop: (item: any) => {
      // Handle TextElement drop
      if (item.itemType === ItemTypes.TEXT_ELEMENT || item.type === ItemTypes.TEXT_ELEMENT) {
        const block = item.fullBlock;
        if (block && (block.type === 'file' || block.type === 'image')) {
          const importData = block.type === 'file' 
            ? { 
                fileName: block.metadata?.fileName || block.content || 'File',
                fileSize: block.metadata?.fileSize || 0,
                fileType: block.metadata?.fileType || 'application/octet-stream',
                filePreview: block.metadata?.filePreview,
                isFolder: block.metadata?.isFolder || false
              }
            : {
                fileName: 'Image',
                fileSize: 0,
                fileType: 'image/png',
                filePreview: block.content,
                isFolder: false
              };
          
          onImport(importData, currentFolderId);
          return { dropped: true, handled: true };
        }
      }

      // Handle file drop (from this or other collection)
      if (item.id && (item.type === ItemTypes.FILE || item.type === 'file_item')) {
        // Check if it's from the same collection
        const isInternal = (function checkNested(items): boolean {
          for (const f of items) {
            if (f.id === item.id) return true;
            if (f.children && checkNested(f.children)) return true;
          }
          return false;
        })(files);

        if (isInternal) {
          if (position === 'start' && firstFileId && item.id !== firstFileId) {
            onReorder(item.id, firstFileId);
          } else if (position === 'end') {
            onMove(item.id, currentFolderId);
          }
        } else {
          // Import from other collection
          onImport(item.fileData || item.data, currentFolderId);
          return { dropped: true, pulledOut: true };
        }
        return { dropped: true };
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onMove, onImport, onReorder, position, currentFolderId, firstFileId]);

  return (
    <div 
      ref={drop as any}
      className={`aspect-square rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${isOver ? 'border-primary bg-primary/10 scale-105 shadow-lg' : 'border-default-200 bg-default-50/30 opacity-40 hover:opacity-100'}`}
    >
      <div className={`p-2 rounded-full ${isOver ? 'bg-primary text-white' : 'bg-default-100 text-default-400'}`}>
        {position === 'start' ? <ChevronLeft size={16} /> : <Plus size={16} />}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest ${isOver ? 'text-primary' : 'text-default-400'}`}>
        {position === 'start' ? 'Inizio' : 'Fine'}
      </span>
    </div>
  );
}

function ListItem({ 
  file, 
  onOpen, 
  onToggleFavorite, 
  isReadOnly,
  isEditing,
  onRename,
  onCancelEdit,
  options,
  onContextMenu,
  onMenuOpen
}: { 
  file: FileItem, 
  onOpen: () => void, 
  onToggleFavorite: () => void, 
  isReadOnly: boolean,
  isEditing?: boolean,
  onRename?: (name: string) => void,
  onCancelEdit?: () => void,
  options?: any,
  onContextMenu?: (e: React.MouseEvent) => void,
  onMenuOpen?: (e: React.MouseEvent, file: FileItem) => void
}) {
  return (
    <div 
      onClick={onOpen}
      onContextMenu={onContextMenu}
      className="flex items-center gap-2 p-1 rounded-lg hover:bg-default-100 transition-colors cursor-pointer group"
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        <div className="scale-75 origin-center">{getFileIcon(file.type, file.isFolder)}</div>
      </div>
      {isEditing ? (
        <Input
          size="sm"
          variant="underlined"
          defaultValue={file.name}
          autoFocus
          className="h-6 flex-1 text-xs"
          onBlur={(e) => onRename?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRename?.((e.target as HTMLInputElement).value);
            if (e.key === 'Escape') onCancelEdit?.();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        options?.title !== false && <span className="text-xs font-medium flex-1 truncate">{file.name}</span>
      )}
      
      {!isReadOnly && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button 
            isIconOnly 
            size="sm" 
            variant="light" 
            className="text-default-400 min-w-6 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuOpen?.(e, file);
            }}
          >
            <MoreHorizontal size={14} />
          </Button>
        </div>
      )}

      {options?.size !== false && <span className="text-[9px] text-default-400 font-bold">{file.isFolder ? `${file.children?.length || 0}` : formatFileSize(file.size)}</span>}
    </div>
  );
}

function DetailItem({ 
  file, 
  onOpen, 
  onToggleFavorite, 
  isReadOnly,
  isEditing,
  widths,
  onRename,
  onCancelEdit,
  options,
  onContextMenu
}: { 
  file: FileItem, 
  onOpen: () => void, 
  onToggleFavorite: () => void, 
  isReadOnly: boolean,
  isEditing?: boolean,
  widths?: any,
  onRename?: (name: string) => void,
  onCancelEdit?: () => void,
  options?: any,
  onContextMenu?: (e: React.MouseEvent) => void
}) {
  return (
    <div 
      onClick={onOpen}
      onContextMenu={onContextMenu}
      className="flex items-center gap-0 hover:bg-default-50 border-b border-default-50 last:border-0 transition-colors cursor-pointer text-xs min-w-max"
    >
      <div className="w-8 shrink-0 flex items-center justify-center">
        {!isReadOnly && (
          <Button 
            isIconOnly 
            size="sm" 
            variant="light" 
            className={`h-6 w-6 min-w-6 ${file.isFavorite ? 'text-amber-400' : 'text-default-300 hover:text-amber-400'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star size={12} className={file.isFavorite ? 'fill-amber-400' : ''} />
          </Button>
        )}
      </div>

      {options?.title !== false && (
        <div 
          style={{ width: widths?.name || 200 }}
          className="px-2 py-1.5 flex items-center gap-2 truncate font-medium shrink-0"
        >
          <div className="scale-75 origin-left shrink-0">{getFileIcon(file.type, file.isFolder)}</div>
          {isEditing ? (
            <Input
              size="sm"
              variant="underlined"
              defaultValue={file.name}
              autoFocus
              className="h-6 flex-1 text-xs"
              onBlur={(e) => onRename?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRename?.((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') onCancelEdit?.();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{file.name}</span>
          )}
        </div>
      )}

      {options?.type !== false && (
        <div 
          style={{ width: widths?.type || 100 }}
          className="px-2 py-1.5 text-[9px] text-default-500 font-bold uppercase shrink-0"
        >
          {file.isFolder ? 'FOLDER' : file.type.split('/')[1] || 'FILE'}
        </div>
      )}

      {options?.size !== false && (
        <div 
          style={{ width: widths?.size || 100 }}
          className="px-2 py-1.5 text-[9px] text-default-400 shrink-0"
        >
          {file.isFolder ? '-' : formatFileSize(file.size)}
        </div>
      )}

      <div 
        style={{ width: widths?.date || 120 }}
        className="px-2 py-1.5 text-[9px] text-default-400 truncate shrink-0"
      >
        {file.dateModified || '3 Gen'}
      </div>
    </div>
  );
}

function FileCard({ 
  file, 
  isFavorite = false, 
  isLarge = false, 
  isReadOnly = false,
  isEditing = false,
  onRename,
  onCancelEdit,
  onToggleFavorite,
  onOpen,
  onMove,
  onImport,
  options,
  onDelete,
  onDuplicate,
  onCopy,
  onCut,
  onMoveMenu,
  onStartEdit,
  onContextMenu,
  onMenuOpen
}: { 
  file: FileItem, 
  isFavorite?: boolean, 
  isLarge?: boolean, 
  isReadOnly?: boolean,
  isEditing?: boolean,
  onRename?: (name: string) => void,
  onCancelEdit?: () => void,
  onToggleFavorite: () => void,
  onOpen: () => void,
  onMove: (id: string, folderId: string | null) => void,
  onImport: (item: any, folderId: string | null) => void,
  options?: any,
  onDelete?: () => void,
  onDuplicate?: () => void,
  onCopy?: () => void,
  onCut?: () => void,
  onMoveMenu?: () => void,
  onStartEdit?: () => void,
  onContextMenu?: (e: React.MouseEvent) => void,
  onMenuOpen?: (e: React.MouseEvent, file: FileItem) => void
}) {
  const handleTriggerPress = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Dropdown trigger pressed for file:", file.name);
  };

  return (
    <div
      onClick={onOpen}
      onContextMenu={onContextMenu}
      className={`
        group relative flex flex-col gap-1 p-2 rounded-xl border transition-all cursor-pointer h-full
        ${isLarge ? 'p-3 border-divider bg-default-50/50 shadow-sm' : 'border-default-200 bg-white hover:shadow-lg'}
        ${file.isFavorite && !isLarge ? 'ring-1 ring-amber-200 bg-amber-50/10' : ''}
      `}
    >
      {options?.preview !== false && (
        <div className={`w-full ${isLarge ? 'aspect-square mb-1' : 'aspect-square'} flex items-center justify-center rounded-lg bg-default-50 overflow-hidden relative shadow-inner`}>
          {file.preview ? (
            <ImageWithFallback src={file.preview} alt={file.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className={isLarge ? 'scale-150 opacity-80' : 'scale-90'}>{getFileIcon(file.type, file.isFolder)}</div>
          )}
        </div>
      )}

      <div className="w-full flex items-start gap-1 px-0.5 mt-1">
        <div className="flex-1 flex flex-col min-w-0">
          {isEditing ? (
            <Input
              size="sm"
              variant="underlined"
              defaultValue={file.name}
              autoFocus
              className="h-6 -mt-1"
              onBlur={(e) => onRename?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRename?.((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') onCancelEdit?.();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            options?.title !== false && (
              <span className={`font-bold truncate w-full ${isFavorite ? 'text-[13px]' : isLarge ? 'text-[10px]' : 'text-[11px] leading-tight'}`}>
                {file.name}
              </span>
            )
          )}
          {(options?.type !== false || options?.size !== false) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {options?.type !== false && (
                <span className={`${isFavorite ? 'text-[10px]' : 'text-[8px]'} text-default-400 font-black uppercase tracking-widest`}>
                  {file.isFolder ? 'FLDR' : (file.type.split('/')[1]?.substring(0, 4) || 'FILE')}
                </span>
              )}
              {!isLarge && options?.size !== false && (
                <Chip size="sm" variant="flat" color="default" className={`h-3 px-1 ${isFavorite ? 'text-[9px]' : 'text-[7px]'} font-black uppercase border-none bg-default-100`}>
                  v1.0
                </Chip>
              )}
            </div>
          )}
        </div>

        {/* Favorite specific: MoreHorizontal button next to text info, aligned right */}
        {isFavorite && !isReadOnly && (
          <Button 
            isIconOnly 
            size="sm" 
            variant="light" 
            radius="full"
            className="text-default-400 w-8 h-8 min-w-0 hover:bg-default-100 shrink-0 ml-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuOpen?.(e, file);
            }}
          >
            <MoreHorizontal size={16} />
          </Button>
        )}
      </div>

      {!isReadOnly && !isFavorite && (
        <div 
          className="w-full mt-auto pt-1 flex items-center justify-between relative h-7 bg-default-50/30 rounded-b-xl px-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1 hover:bg-default-200 rounded-md transition-colors group/star cursor-pointer z-20"
            >
              <Star 
                size={12} 
                className={file.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-default-300 group-hover/star:text-amber-400'} 
              />
            </button>
            {isLarge && <Chip size="sm" variant="flat" color="primary" className="h-4 px-1 text-[7px] font-black uppercase border-none">Featured</Chip>}
          </div>
          
          <Button 
            isIconOnly 
            size="sm" 
            variant="light" 
            radius="full"
            className="text-default-400 w-6 h-6 min-w-0 hover:bg-default-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuOpen?.(e, file);
            }}
          >
            <MoreHorizontal size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}



function FileContextMenuStandalone({
  file,
  position,
  onClose,
  onRename,
  onDelete,
  onDuplicate,
  onCopy,
  onCut,
  onMove,
  onToggleFavorite
}: {
  file: FileItem;
  position: { x: number, y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onCut: () => void;
  onMove: () => void;
  onToggleFavorite: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Adjust position to stay within viewport
  const menuWidth = 160;
  const menuHeight = 280; // slightly larger to be safe
  const gap = 12;

  let left = position.x;
  let top = position.y;

  if (left + menuWidth > window.innerWidth - gap) {
    left = Math.max(gap, position.x - menuWidth);
  }
  if (top + menuHeight > window.innerHeight - gap) {
    top = Math.max(gap, position.y - menuHeight);
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[9999] bg-white border border-default-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] py-1 min-w-[160px]"
        style={{
          top,
          left
        }}
      >
        <div className="px-3 py-1 border-b border-default-50 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-default-400 truncate tracking-[0.1em]">{file.name}</span>
          </div>
        </div>

        {[
          { key: 'move', label: 'Sposta', icon: <FolderInput size={12} />, color: 'text-green-600 hover:bg-green-50', onClick: onMove },
          { key: 'cut', label: 'Taglia', icon: <Scissors size={12} />, onClick: onCut },
          { key: 'copy', label: 'Copia', icon: <Copy size={12} />, onClick: onCopy },
          { key: 'duplicate', label: 'Duplica', icon: <FilePlus size={12} />, onClick: onDuplicate },
          { key: 'rename', label: 'Rinomina', icon: <Pencil size={12} />, color: 'text-blue-600 hover:bg-blue-50', onClick: onRename },
          { key: 'favorite', label: file.isFavorite ? 'Rimuovi' : 'Preferito', icon: <Star size={12} className={file.isFavorite ? "fill-amber-500 text-amber-500" : ""} />, color: 'text-amber-500 hover:bg-amber-50', onClick: onToggleFavorite },
          { key: 'delete', label: 'Elimina', icon: <Trash2 size={12} />, color: 'text-red-600 hover:bg-red-50', onClick: onDelete },
        ].map((item) => (
          <button
            key={item.key}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-default-50 text-default-600 ${item.color || ''}`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </motion.div>
    </>,
    document.body
  );
}