import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import { SpaceTreeItem } from './SpaceTreeItem';
import type { Space } from '../types';

interface SpaceTreeProps {
  spaces: Space[];
  spacesState: any;
  onSpaceClick: (space: Space) => void;
  level?: number;
}

export function SpaceTree({ spaces, spacesState, onSpaceClick, level = 0 }: SpaceTreeProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {spaces.map(space => (
        <SpaceTreeItem
          key={space.id}
          space={space}
          spacesState={spacesState}
          onSpaceClick={onSpaceClick}
          level={level}
        />
      ))}
    </Box>
  );
}