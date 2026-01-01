import React, { useState } from 'react';
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
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button, Input, Card, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  icon?: string;
  preview?: string;
  isFolder?: boolean;
  isFavorite?: boolean;
}

interface FileElementProps {
  layout?: 'square' | 'bookmark' | 'grid';
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

export function FileElement({
  layout = 'square',
  fileName = 'New File',
  fileSize = 0,
  fileType = 'application/octet-stream',
  fileIcon,
  filePreview,
  isFolder = false,
  files = [],
  searchQuery = '',
  onUpdate,
  onDelete,
  className = '',
  isReadOnly = false
}: FileElementProps) {
  const [internalSearch, setInternalSearch] = useState(searchQuery);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(internalSearch.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length || layout === 'grid') {
      // Adding to collection
      const newFiles = Array.from(selectedFiles).map(f => ({
        id: `file_${Date.now()}_${Math.random()}`,
        name: f.name,
        size: f.size,
        type: f.type,
        isFolder: false
      }));
      onUpdate?.({ files: [...files, ...newFiles] });
    } else {
      // Updating single file
      const f = selectedFiles[0];
      onUpdate?.({
        fileName: f.name,
        fileSize: f.size,
        fileType: f.type,
        filePreview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
      });
    }
  };

  const triggerFileBrowser = () => {
    if (!isReadOnly) fileInputRef.current?.click();
  };

  // Layout: Single Square
  if (layout === 'square' && !files.length) {
    return (
      <div 
        onClick={triggerFileBrowser}
        className={`relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-default-200 hover:border-primary/50 hover:bg-primary/5 transition-all w-48 h-48 cursor-pointer ${className}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          multiple={layout === 'grid'} 
        />
        <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
          {filePreview ? (
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-default-100 shadow-sm">
              <ImageWithFallback src={filePreview} alt={fileName} className="w-full h-full object-cover" />
            </div>
          ) : (
            getFileIcon(fileType, isFolder)
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[140px]">{fileName}</span>
            <span className="text-[10px] text-default-400">{formatFileSize(fileSize)}</span>
          </div>
        </div>

        {!isReadOnly && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <MoreVertical size={14} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="download" startContent={<Download size={14} />}>Download</DropdownItem>
                <DropdownItem key="layout" startContent={<LayoutGrid size={14} />}>Change Layout</DropdownItem>
                <DropdownItem key="delete" color="danger" className="text-danger" startContent={<Trash2 size={14} />} onClick={onDelete}>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        )}
      </div>
    );
  }

  // Layout: Bookmark
  if (layout === 'bookmark' && !files.length) {
    return (
      <div 
        onClick={triggerFileBrowser}
        className={`group flex items-center gap-4 p-3 rounded-xl border border-default-200 hover:border-primary/30 hover:bg-default-50 transition-all max-w-md cursor-pointer ${className}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden pointer-events-none">
          {filePreview ? (
            <ImageWithFallback src={filePreview} alt={fileName} className="w-full h-full object-cover" />
          ) : (
            <div className="scale-75">{getFileIcon(fileType, isFolder)}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate leading-tight">{fileName}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-default-500 uppercase font-bold tracking-wider">{fileType.split('/')[1] || 'FILE'}</span>
            <span className="w-1 h-1 rounded-full bg-default-300"></span>
            <span className="text-[11px] text-default-400">{formatFileSize(fileSize)}</span>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button isIconOnly size="sm" variant="light" className="text-default-400">
            <Download size={16} />
          </Button>
          <Button isIconOnly size="sm" variant="light" className="text-default-400 hover:text-danger" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // Layout: Grid (Collection)
  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          multiple 
        />
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Input
            size="sm"
            placeholder="Search files..."
            startContent={<Search size={14} className="text-default-400" />}
            value={internalSearch}
            onValueChange={(val) => {
              setInternalSearch(val);
              onUpdate?.({ searchQuery: val });
            }}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <Button size="sm" variant="flat" color="primary" startContent={<Plus size={14} />} onClick={triggerFileBrowser}>
              Add Files
            </Button>
          )}
          <Button isIconOnly size="sm" variant="light" title="Favorites">
            <Star size={16} className={favorites.length ? 'text-amber-400 fill-amber-400' : 'text-default-400'} />
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <Grid size={16} className="text-default-400" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="grid" startContent={<Grid size={14} />}>Grid View</DropdownItem>
              <DropdownItem key="list" startContent={<List size={14} />}>List View</DropdownItem>
              <DropdownItem key="compact" startContent={<LayoutGrid size={14} />}>Compact</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Favorites Section if any */}
      {favorites.length > 0 && !internalSearch && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-default-400">Favorites</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {favorites.map(file => (
              <FileCard key={file.id} file={file} isFavorite={true} isReadOnly={isReadOnly} />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <Folder size={12} className="text-default-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-default-400">All Files</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredFiles.map(file => (
              <FileCard key={file.id} file={file} isReadOnly={isReadOnly} />
            ))}
            {filteredFiles.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-default-400 border-2 border-dashed border-default-100 rounded-2xl">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No files found</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function FileCard({ file, isFavorite = false, isReadOnly = false }: { file: FileItem, isFavorite?: boolean, isReadOnly?: boolean }) {
  return (
    <div
      className={`
        group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-default-200 bg-white
        hover:shadow-md hover:border-primary/20 transition-all cursor-pointer
        ${isFavorite ? 'ring-1 ring-amber-100' : ''}
      `}
    >
      <div className="w-full aspect-square flex items-center justify-center rounded-lg bg-default-50 overflow-hidden relative">
        {file.preview ? (
          <ImageWithFallback src={file.preview} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        ) : (
          <div className="scale-125">{getFileIcon(file.type, file.isFolder)}</div>
        )}
        
        {/* Floating Action Icons */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <Button isIconOnly size="sm" radius="full" variant="solid" className="bg-white/80 backdrop-blur min-w-0 w-7 h-7 shadow-sm">
            <ExternalLink size={12} className="text-default-600" />
          </Button>
        </div>
      </div>

      <div className="w-full flex flex-col items-center text-center">
        <span className="text-[13px] font-medium truncate w-full px-1">{file.name}</span>
        <span className="text-[10px] text-default-400 uppercase tracking-tight">{formatFileSize(file.size)}</span>
      </div>

      {file.isFavorite && !isFavorite && (
        <div className="absolute top-1 left-1">
          <Star size={10} className="text-amber-500 fill-amber-500" />
        </div>
      )}
    </div>
  );
}