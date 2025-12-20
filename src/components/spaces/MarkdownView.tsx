import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@heroui/react';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleScroll = (e: React.UIEvent<HTMLInputElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Calculate line numbers
  const lineCount = markdown.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="h-full overflow-hidden p-4 bg-default-100 flex gap-0">
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        className="min-w-[50px] max-w-[50px] overflow-hidden bg-background border-r border-divider pr-2 py-2 text-right font-mono text-sm leading-[1.6] text-default-400 select-none"
      >
        {lineNumbers.map((num) => (
          <div key={num} className="leading-[1.6]">
            {num}
          </div>
        ))}
      </div>

      {/* Textarea */}
      <Textarea
        value={markdown}
        onChange={handleChange}
        placeholder="Edit markdown..."
        variant="flat"
        classNames={{
          base: "flex-1 w-full h-full",
          input: "font-mono text-sm leading-[1.6] h-full overflow-auto !important p-2 bg-background border-none outline-none shadow-none resize-none",
          inputWrapper: "h-full bg-background shadow-none p-0",
        }}
        ref={textareaRef}
        onScroll={handleScroll as any}
      />
    </div>
  );
}
