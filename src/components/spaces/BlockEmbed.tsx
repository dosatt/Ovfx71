import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Sheet from '@mui/joy@5.0.0-beta.48/Sheet';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import { 
  ExternalLink,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  AlertCircle,
} from 'lucide-react';
import { Block } from '../../types';

interface BlockEmbedProps {
  block: Block;
  sourceSpaceName?: string;
  onNavigate?: (spaceId: string) => void;
  sourceSpaceId?: string;
}

export function BlockEmbed({ block, sourceSpaceName, onNavigate, sourceSpaceId }: BlockEmbedProps) {
  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'heading1':
        return Heading1;
      case 'heading2':
        return Heading2;
      case 'heading3':
        return Heading3;
      case 'bulletList':
        return List;
      case 'numberedList':
        return ListOrdered;
      case 'checkbox':
        return CheckSquare;
      case 'quote':
        return Quote;
      case 'code':
        return Code;
      case 'callout':
        return AlertCircle;
      default:
        return Type;
    }
  };

  const BlockIcon = getBlockIcon(block.type);

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading1':
        return (
          <Typography level="h2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {block.content || '(vuoto)'}
          </Typography>
        );
      case 'heading2':
        return (
          <Typography level="h3" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {block.content || '(vuoto)'}
          </Typography>
        );
      case 'heading3':
        return (
          <Typography level="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {block.content || '(vuoto)'}
          </Typography>
        );
      case 'bulletList':
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Typography>•</Typography>
            <Typography>{block.content || '(vuoto)'}</Typography>
          </Box>
        );
      case 'numberedList':
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Typography>1.</Typography>
            <Typography>{block.content || '(vuoto)'}</Typography>
          </Box>
        );
      case 'checkbox':
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <CheckSquare size={16} />
            <Typography
              sx={{
                textDecoration: block.checked ? 'line-through' : 'none',
                opacity: block.checked ? 0.6 : 1,
              }}
            >
              {block.content || '(vuoto)'}
            </Typography>
          </Box>
        );
      case 'quote':
        return (
          <Box sx={{ borderLeft: '3px solid', borderColor: 'divider', pl: 2 }}>
            <Typography sx={{ fontStyle: 'italic' }}>{block.content || '(vuoto)'}</Typography>
          </Box>
        );
      case 'code':
        return (
          <Box
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'background.level1',
              p: 1.5,
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <Typography sx={{ fontFamily: 'monospace' }}>
              {block.content || '(vuoto)'}
            </Typography>
          </Box>
        );
      case 'callout':
        const calloutColor = block.calloutColor || 'default';
        const colorMap: Record<string, string> = {
          default: 'background.level1',
          blue: '#E3F2FD',
          green: '#E8F5E9',
          yellow: '#FFF9C4',
          red: '#FFEBEE',
          purple: '#F3E5F5',
        };
        return (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              bgcolor: colorMap[calloutColor],
              p: 1.5,
              borderRadius: '6px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <Typography>{block.content || '(vuoto)'}</Typography>
          </Box>
        );
      default:
        return <Typography>{block.content || '(vuoto)'}</Typography>;
    }
  };

  return (
    <Sheet
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: '8px',
        borderColor: 'neutral.300',
        bgcolor: 'background.surface',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            bgcolor: 'neutral.softBg',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BlockIcon size={16} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Blocco da {sourceSpaceName || 'altra pagina'}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {block.type}
          </Typography>
        </Box>
        {onNavigate && sourceSpaceId && (
          <IconButton
            size="sm"
            variant="plain"
            onClick={() => onNavigate(sourceSpaceId)}
            sx={{
              '&:hover': {
                bgcolor: 'neutral.softBg',
              },
            }}
          >
            <ExternalLink size={14} />
          </IconButton>
        )}
      </Box>
      <Box sx={{ pl: 5 }}>{renderBlockContent()}</Box>
    </Sheet>
  );
}