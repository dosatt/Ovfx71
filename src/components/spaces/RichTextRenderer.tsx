import { Fragment } from 'react';
import { ExternalLink } from 'lucide-react';

interface RichTextRendererProps {
  content: string;
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  // Regex per trovare i link nel formato [[id|text]]
  // La regex cattura:
  // 1. Testo normale prima del link
  // 2. Il link completo [[id|text]]
  // 3. L'ID dello space
  // 4. Il testo del link
  const linkRegex = /\[\[([a-zA-Z0-9-]+)\|([^\]]+)\]\]/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Aggiungi il testo prima del link
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const spaceId = match[1];
    const linkText = match[2];

    // Aggiungi il link
    parts.push(
      <a
        key={match.index}
        href={`#space/${spaceId}`}
        onClick={(e) => {
          e.preventDefault();
          // La navigazione effettiva sarà gestita dal parent o da un context
          const event = new CustomEvent('navigate-to-space', { 
            detail: { spaceId } 
          });
          window.dispatchEvent(event);
        }}
        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
      >
        {linkText}
        <ExternalLink size={12} className="opacity-50" />
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Aggiungi il testo rimanente
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.length > 0 ? parts : content}
    </span>
  );
}
