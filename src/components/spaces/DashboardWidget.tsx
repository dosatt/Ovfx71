import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Card from '@mui/joy@5.0.0-beta.48/Card';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
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
          <Box sx={{ textAlign: 'center' }}>
            <Typography level="h2">{widget.content.value}</Typography>
            <Typography level="body-sm" sx={{ color: 'success.500' }}>
              {widget.content.change}
            </Typography>
          </Box>
        );
      case 'text':
        return <Typography level="body-md">{widget.content.text}</Typography>;
      case 'chart':
        return <Typography level="body-sm">Chart widget coming soon</Typography>;
      default:
        return null;
    }
  };

  return (
    <Card
      ref={ref}
      variant="outlined"
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: isOver ? '2px solid' : '1px solid',
        borderColor: isOver ? 'primary.500' : 'divider'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GripVertical size={16} style={{ cursor: 'grab' }} />
          <Typography level="title-md">{widget.title}</Typography>
        </Box>
        <IconButton
          size="sm"
          variant="plain"
          color="danger"
          onClick={() => onDelete(widget.id)}
        >
          <Trash2 size={14} />
        </IconButton>
      </Box>
      {renderContent()}
    </Card>
  );
}