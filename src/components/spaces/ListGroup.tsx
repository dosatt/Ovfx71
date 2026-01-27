import { useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { Block, BlockType } from "../../types";
import { TextElement } from "./TextElement";
import { ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { blockTypeConfig } from './blockConfig';
import {
  Type,
  ListOrdered
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "../ui/dropdown-menu";
import type { Settings } from '../../hooks/useSettings';

interface ListGroupProps {
  blocks: Block[];
  startIndex: number;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddAfter: (blockId: string, anchor: HTMLElement) => void;
  onAddBefore?: (blockId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number, count?: number) => void;
  onConvertBlock: (blockId: string, newType: BlockType) => void;
  onConvertBlocks?: (blockIds: string[], newType: BlockType) => void;
  createNextBlock?: (blockId: string, blockType: BlockType, currentBlockUpdates?: Partial<Block>) => void;
  toggleHeaderCollapse?: (blockId: string) => void;
  isBlockCollapsed?: (index: number) => boolean;
  collapsedHeaders?: Set<string>;
  focusBlockByIndex?: (index: number) => void;
  totalBlocks?: number;
  config: any;
  currentSpaceId?: string;
  currentSpaceName?: string;
  spacesState?: any;
  viewportsState?: any;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
  onEditEnd?: (blockId: string) => void;
  listNumbers?: (number | string | undefined)[];
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
  selectedBlockIds?: string[];
  onToggleSelection?: (blockId: string, isShift: boolean) => void;
  onSelectAll?: () => void;

  onSelectGroup?: (ids: string[]) => void;
  isEventPage?: boolean;
  allBlocks?: Block[];
  pageHasFocus?: boolean;
}

export function ListGroup(props: ListGroupProps) {
  const { blocks, startIndex, currentSpaceId, currentSpaceName, listNumbers, onConvertBlock, onConvertBlocks, selectedBlockIds = [], onToggleSelection, onSelectAll, onSelectGroup, onUpdateSettings, isEventPage, allBlocks, pageHasFocus } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewType, setPreviewType] = useState<BlockType | null>(null);
  const [dragHovered, setDragHovered] = useState(false);

  // Drag logic for the group
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE_TEXT_ELEMENT,
    item: () => {
      // Se uno dei blocchi nel gruppo è selezionato, trasciniamo la selezione globale
      const anySelected = blocks.some(b => selectedBlockIds.includes(b.id));
      const itemBlockIds = anySelected ? selectedBlockIds : blocks.map(b => b.id);

      return {
        index: startIndex,
        id: blocks[0].id,
        count: anySelected ? selectedBlockIds.length : blocks.length,
        sourceSpaceId: currentSpaceId,
        sourceSpaceName: currentSpaceName,
        itemType: ITEM_TYPE_TEXT_ELEMENT,
        blockType: blocks[0].type,
        content: blocks[0].content || '',
        fullBlock: blocks[0],
        selectedBlockIds: itemBlockIds,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleConvertGroup = (newType: BlockType) => {
    // If we have bulk convert function, use it
    if (onConvertBlocks) {
      const idsToConvert = blocks
        .filter(b => b.type !== newType)
        .map(b => b.id);

      if (idsToConvert.length > 0) {
        onConvertBlocks(idsToConvert, newType);
      }
      return;
    }

    // Fallback to loop if bulk not available
    blocks.forEach(block => {
      if (block.type !== newType) {
        onConvertBlock(block.id, newType);
      }
    });
  };

  const onSelectAllInGroup = () => {
    blocks.forEach(block => {
      if (!selectedBlockIds.includes(block.id)) {
        onToggleSelection && onToggleSelection(block.id, true);
      }
    });
  };

  return (
    <div ref={preview} className={`w-full relative group/list-group ${isDragging ? 'opacity-50' : ''}`}>

      {/* Render Blocks - Full Width */}
      <div className="flex flex-col gap-0 w-full">
        {blocks.map((block, i) => {
          const effectiveType = previewType || block.type;
          return (
            <TextElement
              key={block.id}
              {...props}
              onUpdateSettings={onUpdateSettings}
              config={blockTypeConfig[effectiveType] || blockTypeConfig['text']}
              block={{ ...block, type: effectiveType }}
              index={startIndex + i}
              listNumber={listNumbers ? listNumbers[i] : undefined}
              selectedBlockIds={selectedBlockIds}
              onToggleSelection={onToggleSelection}
              onSelectAll={onSelectAll}
              onSelectGroup={() => onSelectGroup && onSelectGroup(blocks.map(b => b.id))}
              isEventPage={isEventPage}
              allBlocks={allBlocks}
              pageHasFocus={pageHasFocus}
            />
          );
        })}
      </div>

      {/* Group Drag Handle Container - Overlay */}
      {/* This allows the handle to be positioned relative to the content width, while blocks take full width */}
      <div className="absolute inset-0 pointer-events-none z-[60]">
        <div className={`${isEventPage ? 'w-full' : 'max-w-[700px] mx-auto'} relative h-full`}>
          {/* Group Drag Handle */}
          <div
            ref={drag}
            className={`pointer-events-auto absolute left-0 top-0 bottom-0 w-4 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover/list-group:opacity-100 hover:!opacity-100 transition-all duration-200 z-50 py-[5px] rounded-sm ${menuOpen ? '!opacity-100' : ''} ${blocks.some(b => selectedBlockIds.includes(b.id)) ? 'bg-blue-50 !opacity-100' : ''}`}
            title={`Drag ${blocks.length} items. Click to convert.`}
            onClick={(e) => {
              // Prevent click propagation if needed, but mainly we just want to open menu
              // e.stopPropagation(); 
              if (onToggleSelection && e.shiftKey) {
                onToggleSelection(blocks[0].id, true);
              } else {
                setMenuOpen(true);
              }
            }}
          >
            <div className={`w-[3px] h-full rounded-full transition-colors pointer-events-none ${blocks.some(b => selectedBlockIds.includes(b.id)) ? 'bg-blue-500' : 'bg-[#e5e5e5] hover:bg-black'}`} />

            <DropdownMenu open={menuOpen} onOpenChange={(open) => {
              setMenuOpen(open);
              if (!open) setPreviewType(null);
            }}>
              <DropdownMenuTrigger className="absolute top-0 left-0 w-full h-6 opacity-0 pointer-events-none" />
              <DropdownMenuContent
                align="start"
                className="max-h-[300px] overflow-y-auto"
              >
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>Convert to...</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className="max-h-[300px] overflow-y-auto"
                  >
                    {[
                      'text',
                      'heading1',
                      'heading2',
                      'heading3',
                      'heading4',
                      'SEPARATOR',
                      'bulletList',
                      'numberedList',
                      'checkbox',
                      'checkboxNumberedList',
                      'SEPARATOR',
                      'table',
                      'image',
                      'file',
                      'SEPARATOR',
                      'pageLink',
                      'divider',
                      'callout',
                      'quote',
                      'math',
                      'code'
                    ].map((type, i) => {
                      if (type === 'SEPARATOR') return <DropdownMenuSeparator key={i} />;

                      const config = blockTypeConfig[type as BlockType];
                      const Icon = config?.icon || Type;
                      const isCurrent = blocks[0].type === type;

                      return (
                        <DropdownMenuItem
                          key={type}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            setPreviewType(null);
                            if (blocks[0].type !== type) {
                              handleConvertGroup(type as BlockType);
                            }
                          }}
                          className={isCurrent ? 'italic font-bold bg-default-50' : ''}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          <span className={isCurrent ? 'italic font-bold' : ''}>{config?.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {(blocks[0].type === 'numberedList' || blocks[0].type === 'checkboxNumberedList') && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Other</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          // Reset all listNumbers to undefined
                          blocks.forEach(b => {
                            if (b.listNumber !== undefined) {
                              props.onUpdate(b.id, { listNumber: undefined });
                            }
                          });
                        }}
                      >
                        <ListOrdered className="w-4 h-4 mr-2" />
                        <span>Force reorder</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div >
  );
}