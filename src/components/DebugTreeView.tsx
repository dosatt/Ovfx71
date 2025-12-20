import { useState } from 'react';
import { Button } from '@heroui/react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Space } from '../types';

interface DebugTreeViewProps {
  spaces: Space[];
  viewports?: any;
  settings?: any;
}

interface TreeNodeProps {
  space: Space;
  children: Space[];
  allSpaces: Space[];
  depth: number;
}

function TreeNode({ space, children, allSpaces, depth }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return FileText;
      default:
        return FileText;
    }
  };

  const TypeIcon = getTypeIcon(space.type);
  const SpaceIcon = space.icon && (LucideIcons as any)[space.icon] 
    ? (LucideIcons as any)[space.icon] 
    : TypeIcon;

  const hasChildren = children.length > 0;
  const FolderIcon = hasChildren ? (expanded ? FolderOpen : Folder) : null;

  // Count blocks/elements
  const getContentCount = () => {
    if (space.type === 'page' && space.content?.blocks) {
      return `${space.content.blocks.length} blocchi`;
    }
    return '';
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded-sm cursor-pointer hover:bg-default-100"
        style={{ marginLeft: `${depth * 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="min-w-5 w-5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Button>
        ) : (
          <div className="w-7" />
        )}

        {FolderIcon && (
          <div className="w-5 h-5 flex items-center justify-center text-warning">
            <FolderIcon size={16} />
          </div>
        )}

        <div
          className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: space.iconColor || 'var(--heroui-primary-100)' }}
        >
          <SpaceIcon size={12} style={{ color: space.iconColor || 'inherit' }} />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-small font-medium">
            {space.title}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {getContentCount() && (
            <span className="text-tiny text-default-400">
              {getContentCount()}
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-default-100 text-default-500 rounded-sm text-[0.65rem]">
            {space.type}
          </span>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              space={child}
              children={allSpaces.filter((s) => s.parentId === child.id)}
              allSpaces={allSpaces}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DebugTreeView({ spaces }: DebugTreeViewProps) {
  // Separate root spaces (no parent) from children
  const rootSpaces = spaces.filter((s) => !s.parentId);

  return (
    <div className="bg-default-50 rounded-md p-2 max-h-[600px] overflow-auto">
      <span className="block px-2 py-1 text-default-400 text-[0.7rem]">
        {spaces.length} spaces totali
      </span>
      {rootSpaces.length === 0 ? (
        <div className="p-8 text-center">
          <span className="text-small text-default-400">
            Nessuno space disponibile
          </span>
        </div>
      ) : (
        rootSpaces.map((space) => (
          <TreeNode
            key={space.id}
            space={space}
            children={spaces.filter((s) => s.parentId === space.id)}
            allSpaces={spaces}
            depth={0}
          />
        ))
      )}
    </div>
  );
}
