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
  | 'bulletList'
  | 'numberedList'
  | 'checkbox'
  | 'quote'
  | 'divider'
  | 'callout'
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
  metadata?: Record<string, any>;
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
}

export type AppType = 'browser' | 'calendar' | 'mail' | 'chat' | 'draw' | 'settings';

export interface App {
  type: AppType;
  title: string;
  icon: string;
}