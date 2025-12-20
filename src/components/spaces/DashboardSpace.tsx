import { useState, useCallback } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import { Plus } from 'lucide-react';
import { Space } from '../../types';
import { DashboardWidget } from './DashboardWidget';

interface Widget {
  id: string;
  type: 'text' | 'chart' | 'stats';
  title: string;
  content: any;
  gridArea: string;
}

interface DashboardSpaceProps {
  space: Space;
  spacesState: any;
}

export function DashboardSpace({ space, spacesState }: DashboardSpaceProps) {
  const [widgets, setWidgets] = useState<Widget[]>(
    space.content?.widgets || [
      {
        id: 'w1',
        type: 'stats',
        title: 'Total Tasks',
        content: { value: 24, change: '+12%' },
        gridArea: '1 / 1 / 2 / 2'
      },
      {
        id: 'w2',
        type: 'stats',
        title: 'Completed',
        content: { value: 18, change: '+5%' },
        gridArea: '1 / 2 / 2 / 3'
      },
      {
        id: 'w3',
        type: 'text',
        title: 'Welcome',
        content: { text: 'Welcome to your dashboard. Add widgets to customize your view.' },
        gridArea: '2 / 1 / 3 / 3'
      }
    ]
  );

  const addWidget = () => {
    const newWidget: Widget = {
      id: `w_${Date.now()}`,
      type: 'text',
      title: 'New Widget',
      content: { text: 'Configure this widget...' },
      gridArea: `${widgets.length + 1} / 1 / ${widgets.length + 2} / 2`
    };
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    spacesState.updateSpace(space.id, {
      content: { widgets: newWidgets }
    });
  };

  const deleteWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    setWidgets(newWidgets);
    spacesState.updateSpace(space.id, {
      content: { widgets: newWidgets }
    });
  };

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, removed);
    setWidgets(newWidgets);
    spacesState.updateSpace(space.id, {
      content: { widgets: newWidgets }
    });
  }, [widgets, space.id, spacesState]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button startDecorator={<Plus size={16} />} size="sm" onClick={addWidget}>
          Add Widget
        </Button>
      </Box>

      {/* Dashboard grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2
          }}
        >
          {widgets.map((widget, index) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              index={index}
              onDelete={deleteWidget}
              onMove={moveWidget}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}