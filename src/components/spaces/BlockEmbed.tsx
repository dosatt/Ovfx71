import { Block } from '../../types';
import { CalendarElement } from './CalendarElement';
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
  Link2,
  Sigma
} from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { highlightCode, SupportedLanguage } from '../../utils/syntaxHighlighter';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface BlockEmbedProps {
  block: Block;
  sourceSpaceName?: string;
  onNavigate?: (spaceId: string) => void;
  sourceSpaceId?: string;
}

const CALLOUT_THEMES = {
  blue: { color: '#3b82f6', label: 'Blue' },
  green: { color: '#10b981', label: 'Green' },
  yellow: { color: '#f59e0b', label: 'Yellow' },
  red: { color: '#ef4444', label: 'Red' },
  purple: { color: '#8b5cf6', label: 'Purple' },
  gray: { color: '#6b7280', label: 'Gray' },
};

const getCalloutBg = (hex: string) => `${hex}12`;

export function BlockEmbed({ block, sourceSpaceName, onNavigate, sourceSpaceId }: BlockEmbedProps) {
  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'heading1': return Heading1;
      case 'heading2': return Heading2;
      case 'heading3': return Heading3;
      case 'heading4': return Heading4;
      case 'bulletList': return ListIcon;
      case 'numberedList': return ListOrdered;
      case 'checkbox': return CheckSquare;
      case 'quote': return Quote;
      case 'code': return Code;
      case 'math': return Sigma;
      case 'callout': return AlertCircle;
      case 'calendar': return LucideIcons.Calendar;
      default: return Type;
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading1':
        return <h1 className="text-4xl font-bold mb-4">{block.content || '(vuoto)'}</h1>;
      case 'heading2':
        return <h2 className="text-2xl font-bold mb-3">{block.content || '(vuoto)'}</h2>;
      case 'heading3':
        return <h3 className="text-xl font-bold mb-2">{block.content || '(vuoto)'}</h3>;
      case 'heading4':
        return <h4 className="text-lg font-bold mb-2">{block.content || '(vuoto)'}</h4>;
      case 'bulletList':
        return (
          <div className="flex gap-2 items-start py-0.5">
            <span className="text-default-400 mt-1.5">•</span>
            <div className="flex-1 min-h-[1.5em]">{block.content || '(vuoto)'}</div>
          </div>
        );
      case 'numberedList':
        return (
          <div className="flex gap-2 items-start py-0.5">
            <span className="text-default-400 mt-1 min-w-[1.2em]">1.</span>
            <div className="flex-1 min-h-[1.5em]">{block.content || '(vuoto)'}</div>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex gap-2 items-start py-0.5">
            <div className={`mt-1.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${block.checked ? 'bg-primary border-primary text-white' : 'border-default-300'}`}>
              {block.checked && <LucideIcons.Check size={12} strokeWidth={3} />}
            </div>
            <span className={`flex-1 min-h-[1.5em] ${block.checked ? 'line-through opacity-50' : ''}`}>
              {block.content || '(vuoto)'}
            </span>
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-default-200 pl-4 py-1 italic text-default-600">
            {block.content || '(vuoto)'}
          </div>
        );
      case 'code':
        return (
          <div className="bg-default-50 rounded-lg border border-divider overflow-hidden">
            {block.metadata?.language && (
              <div className="px-3 py-1 bg-default-100/50 text-xs text-default-400 border-b border-divider font-mono">
                {block.metadata.language}
              </div>
            )}
            <div className="p-3 font-mono text-sm overflow-x-auto">
              <pre
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: highlightCode(block.content || '', (block.metadata?.language as SupportedLanguage) || 'javascript') }}
              />
            </div>
          </div>
        );
      case 'math':
        return (
          <div className="bg-default-50/50 p-4 rounded-lg flex items-center justify-center min-h-[3em] overflow-x-auto text-center">
            <div
              className="max-w-full"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(block.content || 'E = mc^2', {
                  throwOnError: false,
                  displayMode: true
                })
              }}
            />
          </div>
        );
      case 'callout': {
        const theme = CALLOUT_THEMES[block.metadata?.calloutColor as keyof typeof CALLOUT_THEMES] || CALLOUT_THEMES.blue;
        const iconName = block.metadata?.calloutIcon || 'AlertCircle';
        const IconComp = (LucideIcons as any)[iconName] || LucideIcons.AlertCircle;

        return (
          <div
            className="w-full flex flex-col rounded-lg overflow-hidden"
            style={{ backgroundColor: getCalloutBg(theme.color) }}
          >
            <div
              className="pt-3 pb-2 px-3 flex items-center gap-2 font-bold"
              style={{ color: theme.color }}
            >
              <IconComp size={18} />
              <div className="flex-1">
                {block.metadata?.title || 'Callout'}
              </div>
            </div>
            <div className="px-3 pb-3 pt-0 text-base leading-relaxed">
              {block.content || '(vuoto)'}
            </div>
          </div>
        );
      }
      case 'calendar':
        return (
          <div className="w-full">
            <CalendarElement
              data={{
                startDate: block.metadata?.startDate || new Date().toISOString(),
                endDate: block.metadata?.endDate || new Date().toISOString(),
                recurrence: block.metadata?.recurrence,
                notes: block.metadata?.notes || block.content,
                completed: block.metadata?.completed,
                attachments: block.metadata?.attachments,
                displayMode: block.metadata?.displayMode || 'card'
              }}
              onUpdate={() => { }}
              isReadOnly={true}
              spacesState={undefined}
            />
          </div>
        );
      default:
        return <div className="min-h-[1.5em]">{block.content || '(vuoto)'}</div>;
    }
  };

  const handleLinkClick = () => {
    if (onNavigate && sourceSpaceId) {
      // Pass both spaceId and the target block ID through navigation
      // We'll handle the scrolling in PageEditor
      onNavigate(`${sourceSpaceId}?blockId=${block.id}`);
    }
  };

  return (
    <div className="group relative w-full flex items-center">
      {/* Content wrapper with reduced width to leave space for the badge */}
      <div className="w-[calc(100%-40px)]">
        {renderBlockContent()}
      </div>

      {/* Link badge - positioned in the right gutter - always visible */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30">
        <Tooltip content={`Vai a: ${sourceSpaceName || 'Sorgente'}`} closeDelay={0}>
          <button
            onClick={handleLinkClick}
            className="w-6 h-6 flex items-center justify-center rounded-full transition-all cursor-pointer pointer-events-auto border-none"
            style={{
              backgroundColor: '#e8f7ed',  // Light green from image
              color: '#16a34a',            // Dark green from image
            }}
          >
            <Link2 size={12} strokeWidth={2.5} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
