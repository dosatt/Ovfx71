import { Box, Typography, Chip } from '@mui/joy@5.0.0-beta.48';
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

export function TextElementPreview({ type, content, sourceSpaceName }: TextElementPreviewProps) {
  const Icon = blockTypeIcons[type] || Type;
  const label = blockTypeLabels[type] || 'Block';
  
  // Truncate content
  const displayContent = content.length > 60 ? `${content.substring(0, 60)}...` : content;
  
  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 400,
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'primary.500',
        borderRadius: '8px',
        p: 2,
        boxShadow: 'lg',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon size={16} style={{ flexShrink: 0, color: 'var(--joy-palette-primary-500)' }} />
        <Typography level="body-sm" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {sourceSpaceName && (
          <Chip size="sm" variant="soft" color="primary" sx={{ ml: 'auto' }}>
            {sourceSpaceName}
          </Chip>
        )}
      </Box>
      
      {/* Content preview */}
      {content && type !== 'divider' && (
        <Typography 
          level="body-sm" 
          sx={{ 
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayContent}
        </Typography>
      )}
    </Box>
  );
}