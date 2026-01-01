import { Block } from '../../types';
import * as LucideIcons from 'lucide-react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4,
  List as ListIcon, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code,
  AlertCircle,
  ExternalLink,
  Sigma
} from 'lucide-react';
import { Button } from '@heroui/react';

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
      case 'heading4':
        return Heading4;
      case 'bulletList':
        return ListIcon;
      case 'numberedList':
        return ListOrdered;
      case 'checkbox':
        return CheckSquare;
      case 'quote':
        return Quote;
      case 'code':
        return Code;
      case 'math':
        return Sigma;
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
          <h2 className="text-2xl font-bold">
            {block.content || '(vuoto)'}
          </h2>
        );
      case 'heading2':
        return (
          <h3 className="text-xl font-bold">
            {block.content || '(vuoto)'}
          </h3>
        );
      case 'heading3':
        return (
          <h4 className="text-lg font-bold">
            {block.content || '(vuoto)'}
          </h4>
        );
      case 'heading4':
        return (
          <h5 className="text-base font-bold">
            {block.content || '(vuoto)'}
          </h5>
        );
      case 'bulletList':
        return (
          <div className="flex gap-2 items-start">
            <span>•</span>
            <span>{block.content || '(vuoto)'}</span>
          </div>
        );
      case 'numberedList':
        return (
          <div className="flex gap-2 items-start">
            <span>1.</span>
            <span>{block.content || '(vuoto)'}</span>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex gap-2 items-center">
            <CheckSquare size={16} />
            <span
              className={`${block.checked ? 'line-through opacity-60' : ''}`}
            >
              {block.content || '(vuoto)'}
            </span>
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-divider pl-4">
            <span className="italic">{block.content || '(vuoto)'}</span>
          </div>
        );
      case 'code':
        return (
          <div className="font-mono bg-default-100 p-3 rounded-md text-sm">
            <span className="font-mono">
              {block.content || '(vuoto)'}
            </span>
          </div>
        );
      case 'math':
        return (
          <div className="font-mono bg-default-50 p-3 rounded-md border-l-4 border-primary text-sm">
             <span className="font-mono">
              {block.content || '(vuoto)'}
            </span>
          </div>
        );
      case 'callout':
        const calloutColor = block.calloutColor || 'default';
        const colorClassMap: Record<string, string> = {
          default: 'bg-default-100',
          blue: 'bg-blue-50',
          green: 'bg-green-50',
          yellow: 'bg-yellow-50',
          red: 'bg-red-50',
          purple: 'bg-purple-50',
        };
        return (
          <div
            className={`flex gap-2 p-3 rounded-md ${colorClassMap[calloutColor] || 'bg-default-100'}`}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{block.content || '(vuoto)'}</span>
          </div>
        );
      default:
        return <span>{block.content || '(vuoto)'}</span>;
    }
  };

  return (
    <div 
      className="p-4 bg-white shadow-sm"
      style={{
        borderRadius: '32px',
        border: '2px solid #D4AF37',
        pointerEvents: 'auto'
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-md bg-default-100 flex items-center justify-center shrink-0">
          <BlockIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-default-700">
            Blocco da {sourceSpaceName || 'altra pagina'}
          </p>
          <p className="text-xs text-default-400">
            {block.type}
          </p>
        </div>
        {onNavigate && sourceSpaceId && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => onNavigate(sourceSpaceId)}
            className="hover:bg-default-100"
          >
            <ExternalLink size={14} />
          </Button>
        )}
      </div>
      <div className="pl-11">{renderBlockContent()}</div>
    </div>
  );
}
