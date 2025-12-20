import { useState, useEffect, useRef } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Textarea from '@mui/joy@5.0.0-beta.48/Textarea';
import { Space } from '../../types';
import { spaceToMarkdown, markdownToSpace } from '../../utils/markdownConverter';

interface MarkdownViewProps {
  space: Space;
  spacesState?: any;
}

export function MarkdownView({ space, spacesState }: MarkdownViewProps) {
  const [markdown, setMarkdown] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMarkdown(spaceToMarkdown(space));
  }, [space]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);

    // Update the space with the new markdown
    if (spacesState) {
      try {
        const updatedSpace = markdownToSpace(newMarkdown, space);
        if (updatedSpace) {
          spacesState.updateSpace(space.id, updatedSpace);
        }
      } catch (error) {
        console.error('Error parsing markdown:', error);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Calculate line numbers
  const lineCount = markdown.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        p: 2,
        bgcolor: 'background.level1',
        display: 'flex',
        gap: 0
      }}
    >
      {/* Line numbers */}
      <Box
        ref={lineNumbersRef}
        sx={{
          minWidth: '50px',
          maxWidth: '50px',
          overflow: 'hidden',
          bgcolor: 'background.surface',
          borderRight: '1px solid',
          borderColor: 'divider',
          pr: 1,
          pt: 1,
          pb: 1,
          textAlign: 'right',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: 'text.tertiary',
          userSelect: 'none'
        }}
      >
        {lineNumbers.map((num) => (
          <Box key={num} sx={{ lineHeight: 1.6 }}>
            {num}
          </Box>
        ))}
      </Box>

      {/* Textarea */}
      <Textarea
        value={markdown}
        onChange={handleChange}
        placeholder="Edit markdown..."
        variant="plain"
        sx={{
          flex: 1,
          width: '100%',
          height: '100%',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          bgcolor: 'background.surface',
          border: 'none',
          p: 1,
          '& textarea': {
            overflow: 'auto !important'
          }
        }}
        slotProps={{
          textarea: {
            ref: textareaRef,
            onScroll: handleScroll
          }
        }}
      />
    </Box>
  );
}