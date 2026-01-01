import React from 'react';
import { 
  Calendar,
  Clock,
  User,
  Tag,
  Hash,
  Link as LinkIcon,
  Globe,
  Plus,
  Type,
  Link2,
  Link2Off
} from "lucide-react";
import { Input, Button, Tooltip, Chip } from "@heroui/react";
import type { Space } from "../../types";

interface PropertiesViewProps {
  space: Space;
  spacesState: any;
  className?: string;
}

export function PropertiesView({ space, spacesState, className = "" }: PropertiesViewProps) {
  const isTitleSynced = space.metadata?.syncTitleWithH1 !== false;
  
  // Dynamic properties from space metadata or defaults
  const spaceProperties = space.metadata?.properties || [
    { label: 'Created', icon: 'Calendar', value: 'Oct 24, 2023', type: 'date' },
    { label: 'Last Edited', icon: 'Clock', value: 'Today, 2:45 PM', type: 'date' },
    { label: 'Author', icon: 'User', value: 'Alessandro G.', type: 'person' },
    { label: 'Status', icon: 'Tag', value: 'In Progress', type: 'select', color: 'bg-blue-100 text-blue-700' },
    { label: 'Tags', icon: 'Hash', value: ['PCB', 'Editor', 'React'], type: 'multi-select' },
  ];

  const handleClose = () => {
    spacesState.updateSpace(space.id, {
      metadata: { ...space.metadata, showProperties: false }
    });
  };

  const updateProperty = (index: number, newValue: any) => {
    const newProps = [...spaceProperties];
    newProps[index] = { ...newProps[index], value: newValue };
    spacesState.updateSpace(space.id, {
      metadata: { ...space.metadata, properties: newProps }
    });
  };

  const addProperty = () => {
    const newProp = { label: 'New Property', icon: 'Type', value: '', type: 'text' };
    spacesState.updateSpace(space.id, {
      metadata: { ...space.metadata, properties: [...spaceProperties, newProp] }
    });
  };

  const deleteProperty = (index: number) => {
    const newProps = spaceProperties.filter((_: any, i: number) => i !== index);
    spacesState.updateSpace(space.id, {
      metadata: { ...space.metadata, properties: newProps }
    });
  };

  const handleTitleChange = (newTitle: string) => {
    spacesState.updateSpace(space.id, { title: newTitle });
    
    // If synced, update the first header (H1-H4) if it exists
    const isTitleSynced = space.metadata?.syncTitleWithH1 !== false;
    if (isTitleSynced && space.content?.blocks) {
      const firstHeaderIndex = space.content.blocks.findIndex((b: any) => 
        ['heading1', 'heading2', 'heading3', 'heading4'].includes(b.type)
      );
      if (firstHeaderIndex !== -1) {
        const firstHeader = space.content.blocks[firstHeaderIndex];
        const newBlocks = [...space.content.blocks];
        newBlocks[firstHeaderIndex] = { ...firstHeader, content: newTitle };
        spacesState.updateSpace(space.id, {
          content: { ...space.content, blocks: newBlocks }
        });
      }
    }
  };

  const handleToggleSync = () => {
    const isTitleSynced = space.metadata?.syncTitleWithH1 !== false;
    const newSync = !isTitleSynced;
    spacesState.updateSpace(space.id, {
      metadata: { ...space.metadata, syncTitleWithH1: newSync }
    });
    
    // If enabling sync, set title to first header content
    if (newSync && space.content?.blocks) {
      const firstHeaderIndex = space.content.blocks.findIndex((b: any) => 
        ['heading1', 'heading2', 'heading3', 'heading4'].includes(b.type)
      );
      if (firstHeaderIndex !== -1) {
        spacesState.updateSpace(space.id, { title: space.content.blocks[firstHeaderIndex].content });
      }
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar': return Calendar;
      case 'Clock': return Clock;
      case 'User': return User;
      case 'Tag': return Tag;
      case 'Hash': return Hash;
      case 'Globe': return Globe;
      default: return Type;
    }
  };

  return (
    <div className={`flex flex-col gap-3 p-4 @container relative hero-gradient hero-shadow technical-border rounded-xl mx-2 my-2 ${className}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>

        <div 
          className="text-[10px] uppercase tracking-[0.2em] font-bold text-default-400 select-none cursor-default flex items-center gap-2"
          onDoubleClick={handleClose}
          title="Double click to hide"
        >
          <span className="w-8 h-[1px] bg-default-200/50"></span>
          System Properties
          <span className="w-8 h-[1px] bg-default-200/50"></span>
        </div>
      </div>

      <div className="grid grid-cols-1 @min-[400px]:grid-cols-2 gap-x-6 gap-y-4">
        {/* Title property - always present */}
        <div className="flex flex-col items-start gap-1.5 px-1 group/prop col-span-full mb-2">
            <div className="flex items-center justify-between w-full text-default-400 text-[10px] uppercase tracking-wider font-medium px-1">
              <div className="flex items-center gap-2">
                <Type size={12} />
                <span>Page Title</span>
              </div>
              {space.type === 'page' && (
                <button
                  className="transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{
                    backgroundColor: isTitleSynced ? 'rgba(34, 197, 94, 0.15)' : 'rgba(161, 161, 170, 0.15)',
                  }}
                  onClick={handleToggleSync}
                  title={isTitleSynced ? "Title synced with H1" : "Sync title with H1"}
                >
                  {isTitleSynced ? <Link2 size={12} className="text-green-600" /> : <Link2Off size={12} className="text-zinc-500" />}
                </button>
              )}
            </div>
            <Input
              value={space.title}
              onValueChange={handleTitleChange}
              placeholder="New page"
              size="sm"
              variant="flat"
              classNames={{
                input: "font-bold text-base",
                inputWrapper: "bg-default-100/50 border-none h-10 px-3"
              }}
            />
        </div>

        {spaceProperties.map((prop: any, i: number) => {
          const Icon = getIcon(prop.icon);
          return (
            <div key={`${prop.label}-${i}`} className="flex flex-col items-start gap-1.5 px-1 group/prop relative">
              <div className="flex items-center justify-between w-full text-default-400 text-[10px] uppercase tracking-wider font-medium px-1">
                <div className="flex items-center gap-2">
                  <Icon size={12} />
                  <span>{prop.label}</span>
                </div>
                <button 
                   onClick={() => deleteProperty(i)}
                   className="opacity-0 group-hover/prop:opacity-100 transition-opacity p-0.5 hover:text-danger cursor-pointer"
                >
                    <Plus size={12} className="rotate-45" />
                </button>
              </div>
              <div className="w-full">
                {prop.type === 'multi-select' ? (
                  <div className="flex gap-1 flex-wrap min-h-[36px] items-center p-1 bg-default-100/50 rounded-lg px-3">
                    {prop.value.map((tag: string, idx: number) => (
                      <Chip key={idx} size="sm" variant="flat" className="bg-default-200/50 text-[10px] h-5">{tag}</Chip>
                    ))}
                  </div>
                ) : (
                  <Input
                    value={prop.value}
                    onValueChange={(val) => updateProperty(i, val)}
                    size="sm"
                    variant="flat"
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "bg-default-100/50 border-none h-9 px-3"
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-center">
        <Button 
          size="sm" 
          variant="light" 
          onPress={addProperty}
          startContent={<Plus size={14} />}
          className="text-default-400 hover:text-default-700 font-medium tracking-wide uppercase text-[10px] circular-feedback"
        >
          Add dynamic property
        </Button>
      </div>
    </div>
  );
}