import { useEffect, useState } from 'react';
import { Space } from '../../types';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { createPortal } from 'react-dom';

interface SpacePreviewProps {
  spaceId: string;
  spacesState: any;
  position: { x: number; y: number };
  onClose: () => void;
}

export function SpacePreview({ spaceId, spacesState, position, onClose }: SpacePreviewProps) {
  const [space, setSpace] = useState<Space | null>(null);

  useEffect(() => {
    const s = spacesState.getSpace(spaceId);
    setSpace(s);
  }, [spaceId, spacesState]);

  if (!space) return null;

  // Calculate adjusted position to keep it on screen
  const menuWidth = 300;
  const menuHeight = 200;
  
  let left = position.x;
  let top = position.y + 20; // 20px offset

  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 20;
  }
  
  if (top + menuHeight > window.innerHeight) {
    top = position.y - menuHeight - 10;
  }

  return createPortal(
    <div 
      className="absolute z-[1000] pointer-events-none"
      style={{ top: position.y + 10, left: position.x + 10 }}
    >
      <Card className="w-[300px] max-h-[200px] shadow-xl border border-default-200">
        <CardHeader className="pb-2 pt-3 px-4 flex-col items-start bg-default-50">
          <h4 className="font-bold text-large line-clamp-1">{space.title || "New page"}</h4>
          <small className="text-default-500 uppercase font-bold text-[10px]">{space.type}</small>
        </CardHeader>
        <Divider />
        <CardBody className="px-4 py-3 overflow-hidden">
            <div className="text-small text-default-600 line-clamp-4">
              {space.content?.blocks?.map((b: any) => b.content || '').join(' ') || "No content"}
            </div>
        </CardBody>
      </Card>
    </div>,
    document.body
  );
}