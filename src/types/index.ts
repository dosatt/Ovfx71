// Space types
export type SpaceType = 'page' | 'canvas' | 'database' | 'dashboard';

export interface Space {
  id: string;
  title: string;
  type: SpaceType;
  icon?: string;
  iconColor?: string;
  parentId?: string;
  order?: number;
  favoriteOrder?: number;
  content: any;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

// TextElement types for Page
export type TextElementType = 
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'bulletList'
  | 'numberedList'
  | 'checkbox'
  | 'checkboxNumberedList'
  | 'table'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'math'
  | 'code'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'embed'
  | 'pageLink'
  | 'spaceEmbed'
  | 'elementEmbed';

export interface TextElement {
  id: string;
  type: TextElementType;
  content: string;
  checked?: boolean;
  language?: string;
  listNumber?: number; // Per elenchi numerati custom
  calloutColor?: string; // Per callout
  calloutIcon?: string; // Per callout
  pageId?: string; // Per pageLink
  spaceId?: string; // Per spaceEmbed
  elementId?: string; // Per elementEmbed
  sourceSpaceId?: string; // Space di origine per elementEmbed
  metadata?: {
    // File element metadata
    fileLayout?: 'square' | 'bookmark' | 'grid';
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileIcon?: string;
    filePreview?: string;
    isFolder?: boolean;
    files?: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      icon?: string;
      preview?: string;
      isFolder?: boolean;
      isFavorite?: boolean;
    }>;
    searchQuery?: string;
    [key: string]: any;
  };
  align?: 'left' | 'center' | 'right';
  indent?: number; // Indentation level (0-based)
  showUnderline?: boolean;
  encapsulated?: boolean; // Per i divider: se true (default), vengono nascosti quando l'header padre è collassato
}

// Legacy type aliases for backward compatibility
export type BlockType = TextElementType;
export type Block = TextElement;

export interface PageContent {
  blocks: TextElement[];
  cover?: string;
  icon?: string;
}

// Viewport types
export type ViewportSplit = 'horizontal' | 'vertical';

export interface Viewport {
  id: string;
  spaceId?: string;
  appType?: AppType;
  tabs: Tab[];
  activeTabId?: string;
  split?: ViewportSplit;
  children?: [Viewport, Viewport];
  size?: number; // percentage for split viewports
  history?: Array<{ spaceId?: string; appType?: AppType; title?: string }>;
  historyIndex?: number;
}

export interface Tab {
  id: string;
  spaceId?: string;
  appType?: AppType;
  title: string;
  history?: Array<{ spaceId?: string; appType?: AppType; title?: string }>;
  historyIndex?: number;
}

export type AppType = 'browser' | 'calendar' | 'mail' | 'chat' | 'draw' | 'settings' | 'design-system';

export interface App {
  type: AppType;
  title: string;
  icon: string;
}

export interface CanvasElement {
  id: string;
  type: 'path' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'line' | 'spaceEmbed' | 'blockEmbed' | 'image' | 'file';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'italic' | 'bold italic';
  textAlign?: 'left' | 'center' | 'right';
  textContent?: string;
  blockContent?: string;
  imageUrl?: string;
  fileMetadata?: {
    fileLayout?: 'square' | 'bookmark' | 'grid';
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileIcon?: string;
    filePreview?: string;
    isFolder?: boolean;
    files?: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      icon?: string;
      preview?: string;
      isFolder?: boolean;
      isFavorite?: boolean;
    }>;
  };
  anchorStart?: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left' };
  anchorEnd?: { elementId: string; side: 'top' | 'right' | 'bottom' | 'left' };
}