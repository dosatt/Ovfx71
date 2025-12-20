import { Fragment } from 'react';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Link from '@mui/joy@5.0.0-beta.48/Link';
import { ExternalLink } from 'lucide-react';

interface RichTextRendererProps {
  content: string;
  onSpaceLinkClick?: (spaceId: string) => void;
  spacesState?: any;
  sx?: any;
}

export function RichTextRenderer({ 
  content, 
  onSpaceLinkClick, 
  spacesState,
  sx = {}
}: RichTextRendererProps) {
  // Parse il contenuto per trovare i link interni [[spaceId|title]]
  const parseContent = (text: string) => {
    const linkPattern = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
    const parts: Array<{ type: 'text' | 'link'; content: string; spaceId?: string; title?: string }> = [];
    
    let lastIndex = 0;
    let match;
    
    while ((match = linkPattern.exec(text)) !== null) {
      // Aggiungi il testo prima del link
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Aggiungi il link
      parts.push({
        type: 'link',
        content: match[0],
        spaceId: match[1],
        title: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Aggiungi il testo rimanente
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return parts;
  };

  // Parse markdown inline (bold, italic, strikethrough, underline)
  const renderMarkdown = (text: string) => {
    // Questa è una versione semplificata, puoi estenderla
    let rendered = text;
    
    // Bold: **text**
    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text*
    rendered = rendered.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Strikethrough: ~~text~~
    rendered = rendered.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // Underline: <u>text</u>
    // Already HTML, no need to transform
    
    return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  const parts = parseContent(content);

  if (parts.length === 0) {
    return (
      <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', ...sx }}>
        {renderMarkdown(content)}
      </Typography>
    );
  }

  return (
    <Typography 
      component="div" 
      sx={{ 
        whiteSpace: 'pre-wrap',
        display: 'inline',
        lineHeight: '1.5',
        ...sx
      }}
    >
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <Fragment key={index}>
              {renderMarkdown(part.content)}
            </Fragment>
          );
        } else {
          // Verifica se lo space esiste e ottieni il titolo aggiornato
          const linkedSpace = spacesState?.getSpace(part.spaceId!);
          const displayTitle = linkedSpace ? linkedSpace.title : part.title; // Usa il titolo aggiornato se lo space esiste
          
          return (
            <Link
              key={index}
              onClick={(e) => {
                e.preventDefault();
                if (onSpaceLinkClick && part.spaceId) {
                  onSpaceLinkClick(part.spaceId);
                }
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                color: linkedSpace ? 'primary.500' : 'text.tertiary',
                '&:hover': {
                  textDecoration: 'underline',
                  color: linkedSpace ? 'primary.600' : 'text.secondary',
                },
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.3,
              }}
            >
              {displayTitle}
              {!linkedSpace && (
                <ExternalLink size={12} style={{ opacity: 0.5 }} />
              )}
            </Link>
          );
        }
      })}
    </Typography>
  );
}