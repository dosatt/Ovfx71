import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardBody, Button } from '@heroui/react';
import { GripVertical, Trash2 } from 'lucide-react';

interface Widget {
  id: string;
  type: 'text' | 'chart' | 'stats';
  title: string;
  content: any;
}

interface DashboardWidgetProps {
  widget: Widget;
  index: number;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const ITEM_TYPE = 'WIDGET';

export function DashboardWidget({ widget, index, onDelete, onMove }: DashboardWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  drag(drop(ref));

  const renderContent = () => {
    switch (widget.type) {
      case 'stats':
        return (
          <div className="text-center py-4">
            <h2 className="text-4xl font-bold text-default-900">{widget.content.value}</h2>
            <p className="text-small font-medium text-success-500 mt-1">
              {widget.content.change}
            </p>
          </div>
        );
      case 'text':
        return <p className="text-default-600">{widget.content.text}</p>;
      case 'chart':
        return <p className="text-small text-default-400 italic">Chart widget coming soon</p>;
      default:
        return null;
    }
  };

  return (
    <Card
      ref={ref}
      className={`
        transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isOver ? 'ring-2 ring-primary border-transparent' : 'border border-divider'}
      `}
      shadow="sm"
    >
      <CardBody>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing text-default-400 hover:text-default-600">
              <GripVertical size={16} />
            </div>
            <h3 className="text-medium font-semibold">{widget.title}</h3>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={() => onDelete(widget.id)}
            className="opacity-50 hover:opacity-100"
          >
            <Trash2 size={14} />
          </Button>
        </div>
        {renderContent()}
      </CardBody>
    </Card>
  );
}
