import React from 'react';
import { 
  File, Folder, FileText, FileArchive, FileAudio, FileVideo, 
  FileImage, FileCode 
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const getFileIcon = (type: string, isFolder?: boolean) => {
  if (isFolder) return <Folder className="w-8 h-8 text-amber-500" />;
  
  const t = (type || '').toLowerCase();
  if (t.startsWith('image/')) return <FileImage className="w-8 h-8 text-blue-500" />;
  if (t.startsWith('video/')) return <FileVideo className="w-8 h-8 text-purple-500" />;
  if (t.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-pink-500" />;
  if (t.includes('zip') || t.includes('rar') || t.includes('archive')) return <FileArchive className="w-8 h-8 text-orange-500" />;
  if (t.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  if (t.includes('code') || t.includes('javascript') || t.includes('typescript') || t.includes('html') || t.includes('css')) return <FileCode className="w-8 h-8 text-emerald-500" />;
  
  return <File className="w-8 h-8 text-default-500" />;
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface FilePreviewProps {
  name: string;
  type: string;
  size: number;
  preview?: string;
  isFolder?: boolean;
  className?: string;
}

export function FilePreview({ name, type, size, preview, isFolder, className = '' }: FilePreviewProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden relative">
        {preview ? (
          <ImageWithFallback src={preview} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="scale-75">{getFileIcon(type, isFolder)}</div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-center w-full">
        <h4 className="text-xs font-medium truncate leading-tight w-full">{name}</h4>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-default-500 uppercase font-bold tracking-wider">
            {isFolder ? 'FLDR' : (type.split('/')[1]?.substring(0, 4) || 'FILE')}
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-default-300"></span>
          <span className="text-[9px] text-default-400">
            {isFolder ? '-' : formatFileSize(size)}
          </span>
        </div>
      </div>
    </div>
  );
}
