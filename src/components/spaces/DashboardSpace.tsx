import { useState, useCallback } from 'react';
import { Button } from '@heroui/react';
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
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="p-4 border-b border-divider flex-shrink-0">
        <Button 
          startContent={<Plus size={16} />} 
          size="sm" 
          color="primary"
          onPress={addWidget}
        >
          Add Widget
        </Button>
      </div>

      {/* Dashboard grid */}
      <div className="flex-1 overflow-auto p-4 bg-default-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
          {widgets.map((widget, index) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              index={index}
              onDelete={deleteWidget}
              onMove={moveWidget}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
