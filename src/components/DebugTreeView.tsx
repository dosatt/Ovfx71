import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
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
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.5,
          px: 1,
          ml: depth * 2,
          borderRadius: 'sm',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'background.level2',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          <IconButton
            size="sm"
            variant="plain"
            sx={{ minWidth: 20, minHeight: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}

        {FolderIcon && (
          <Box
            sx={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'warning.500',
            }}
          >
            <FolderIcon size={16} />
          </Box>
        )}

        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: 'xs',
            bgcolor: space.iconColor || 'primary.softBg',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SpaceIcon size={12} style={{ color: space.iconColor || 'inherit' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" sx={{ fontWeight: 500 }}>
            {space.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {getContentCount() && (
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {getContentCount()}
            </Typography>
          )}
          <Typography
            level="body-xs"
            sx={{
              px: 0.75,
              py: 0.25,
              bgcolor: 'neutral.softBg',
              color: 'text.secondary',
              borderRadius: 'xs',
              fontSize: '0.65rem',
            }}
          >
            {space.type}
          </Typography>
        </Box>
      </Box>

      {expanded && hasChildren && (
        <Box>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              space={child}
              children={allSpaces.filter((s) => s.parentId === child.id)}
              allSpaces={allSpaces}
              depth={depth + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function DebugTreeView({ spaces }: DebugTreeViewProps) {
  // Separate root spaces (no parent) from children
  const rootSpaces = spaces.filter((s) => !s.parentId);

  return (
    <Box
      sx={{
        bgcolor: 'background.level1',
        borderRadius: 'md',
        p: 1,
        maxHeight: 600,
        overflow: 'auto',
      }}
    >
      <Typography level="body-sm" sx={{ px: 1, py: 0.5, color: 'text.tertiary', fontSize: '0.7rem' }}>
        {spaces.length} spaces totali
      </Typography>
      {rootSpaces.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
            Nessuno space disponibile
          </Typography>
        </Box>
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
    </Box>
  );
}