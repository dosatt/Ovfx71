import { Chip } from '@heroui/react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List as ListIcon, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  AlertCircle,
  Code,
  Image as ImageIcon,
  File as FileIcon,
  Link2,
  Minus
} from 'lucide-react';
import { TextElementType } from '../../types';

interface TextElementPreviewProps {
  type: TextElementType;
  content: string;
  sourceSpaceName?: string;
  count?: number;
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
  callout: AlertCircle,
  code: Code,
  image: ImageIcon,
  file: FileIcon,
  pageLink: Link2,
  embed: Link2,
  spaceEmbed: Link2,
  blockEmbed: Link2,
  divider: Minus,
};

const blockTypeLabels: Record<string, string> = {
  text: 'Text',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulletList: 'Bullet List',
  numberedList: 'Numbered List',
  checkbox: 'Checkbox',
  quote: 'Quote',
  callout: 'Callout',
  code: 'Code',
  image: 'Image',
  file: 'File',
  pageLink: 'Space Link',
  embed: 'Embed',
  spaceEmbed: 'Space Embed',
  blockEmbed: 'Block Embed',
  divider: 'Divider',
};

export function TextElementPreview({ type, content = '', sourceSpaceName, count }: TextElementPreviewProps) {
  const Icon = blockTypeIcons[type] || Type;
  const label = blockTypeLabels[type] || 'Block';
  
  // Truncate content
  const safeContent = content || '';
  const displayContent = safeContent.length > 60 ? `${safeContent.substring(0, 60)}...` : safeContent;
  
  return (
    <div
      className="min-w-[280px] max-w-[400px] bg-white border border-primary-500 rounded-lg p-4 shadow-lg flex flex-col gap-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon size={16} className="shrink-0 text-primary-500" />
        <span className="text-sm font-semibold">
          {label}
        </span>
        {count && count > 1 && (
           <Chip size="sm" variant="flat" color="primary">
             {count} items
           </Chip>
        )}
        {sourceSpaceName && (
          <Chip size="sm" variant="flat" color="primary" className="ml-auto">
            {sourceSpaceName}
          </Chip>
        )}
      </div>
      
      {/* Content preview */}
      {content && type !== 'divider' && (
        <p className="text-sm text-default-500 overflow-hidden text-ellipsis whitespace-nowrap">
          {displayContent}
        </p>
      )}
    </div>
  );
}
