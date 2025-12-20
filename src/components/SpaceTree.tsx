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
    <div className="flex flex-col gap-1">
      {spaces.map(space => (
        <SpaceTreeItem
          key={space.id}
          space={space}
          spacesState={spacesState}
          onSpaceClick={onSpaceClick}
          level={level}
        />
      ))}
    </div>
  );
}
