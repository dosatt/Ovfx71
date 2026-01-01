import { useDragLayer } from 'react-dnd';
import { TextElementPreview } from './TextElementPreview';
import { DragTooltip } from './DragTooltip';
import { ITEM_TYPE_TEXT_ELEMENT } from '../SpaceTreeItem';
import { DragMode } from '../../hooks/useCrossViewportDrag';

export function TextElementDragLayer() {
  const { isDragging, item, itemType, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(), // Usa getClientOffset per la posizione del cursore
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset || !item) {
    return null;
  }

  // Controlla sia itemType del monitor che item.itemType
  const isTextElement = itemType === ITEM_TYPE_TEXT_ELEMENT || item.itemType === ITEM_TYPE_TEXT_ELEMENT;
  
  if (!isTextElement) {
    return null;
  }

  const { x, y } = currentOffset;
  const dragMode: DragMode = item.dragMode || 'link';

  return (
    <>
      {/* Preview del textElement */}
      <div
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          left: 0,
          top: 0,
          transform: `translate(${x}px, ${y}px)`,
          zIndex: 9999,
        }}
      >
        <TextElementPreview
          type={item.blockType}
          content={item.content}
          sourceSpaceName={item.sourceSpaceName}
          count={item.count}
        />
      </div>

      {/* Tooltip con scorciatoie */}
      <DragTooltip mode={dragMode} />
    </>
  );
}
