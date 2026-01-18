import { SpaceTreeItem } from './SpaceTreeItem';
import type { Space } from '../types';

interface SpaceTreeProps {
  spaces: Space[];
  spacesState: any;
  onSpaceClick: (e: React.MouseEvent, space: Space) => void;
  onSpaceDoubleClick: (space: Space) => void;
  selectedSpaceIds: string[];
  level?: number;
}

export function SpaceTree({ spaces, spacesState, onSpaceClick, onSpaceDoubleClick, selectedSpaceIds, level = 0 }: SpaceTreeProps) {
  return (
    <div className="flex flex-col gap-1">
      {spaces.map(space => (
        <SpaceTreeItem
          key={space.id}
          space={space}
          spacesState={spacesState}
          onSpaceClick={onSpaceClick}
          onSpaceDoubleClick={onSpaceDoubleClick}
          isSelected={selectedSpaceIds.includes(space.id)}
          selectedSpaceIds={selectedSpaceIds}
          level={level}
        />
      ))}
    </div>
  );
}
