import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@heroui/react';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';

interface TextSelectionToolbarProps {
  onApplyStyle: (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
}

export function TextSelectionToolbar({ onApplyStyle }: TextSelectionToolbarProps) {
  const [selection, setSelection] = useState<{
    text: string;
    range: Range | null;
  } | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() || '';
      
      if (text.length > 0 && sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Verifica che la selezione sia all'interno di un blocco della pagina
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as HTMLElement;
        
        const blockElement = element?.closest('[data-block-id]');
        if (!blockElement) {
          setSelection(null);
          setPosition(null);
          return;
        }
        
        // Posiziona al centro orizzontalmente e a 3/4 dell'altezza (1/4 dal basso)
        const left = window.innerWidth / 2;
        const top = window.innerHeight * 0.75; // 3/4 dell'altezza = 1/4 dal basso
        
        setPosition({
          top,
          left
        });
        
        setSelection({ text, range });
      } else {
        setSelection(null);
        setPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  const handleStyleClick = (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    onApplyStyle(style);
    // Non chiudere immediatamente la toolbar per permettere più azioni
  };

  if (!selection || !position) {
    return null;
  }

  return createPortal(
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 9999
      }}
      className="fixed bg-white shadow-lg rounded-lg p-1 flex gap-1 border border-divider"
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => handleStyleClick('bold')}
      >
        <Bold size={16} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => handleStyleClick('italic')}
      >
        <Italic size={16} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => handleStyleClick('underline')}
      >
        <Underline size={16} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => handleStyleClick('strikethrough')}
      >
        <Strikethrough size={16} />
      </Button>
    </div>,
    document.body
  );
}
