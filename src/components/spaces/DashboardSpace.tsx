import { useState, useCallback } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Plus, FileText, File as FileIcon } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { Space } from '../../types';
import { DashboardWidget } from './DashboardWidget';
import { ItemTypes } from './types';
import { ITEM_TYPE_TEXT_ELEMENT, ITEM_TYPE_TO_WORKSPACE } from '../SpaceTreeItem';
import { Settings } from '../../hooks/useSettings';

interface Widget {
  id: string;
  type: 'text' | 'chart' | 'stats' | 'file' | 'space';
  title: string;
  content: any;
  w: number; // width in grid columns (1-12)
  h: number; // height in grid rows (20px each)
}

interface DashboardSpaceProps {
  space: Space;
  spacesState: any;
  settings?: Settings;
  onUpdateSettings?: (updates: Partial<Settings>) => void;
}

export function DashboardSpace({ space, spacesState, settings, onUpdateSettings }: DashboardSpaceProps) {
  const [widgets, setWidgets] = useState<Widget[]>(
    space.content?.widgets || [
      {
        id: 'w1',
        type: 'stats',
        title: 'Total Tasks',
        content: { value: 24, change: '+12%' },
        w: 3,
        h: 8
      },
      {
        id: 'w2',
        type: 'stats',
        title: 'Completed',
        content: { value: 18, change: '+5%' },
        w: 3,
        h: 8
      },
      {
        id: 'w3',
        type: 'text',
        title: 'Welcome',
        content: { text: 'Welcome to your dashboard. Add widgets to customize your view.' },
        w: 6,
        h: 16
      }
    ]
  );

  const updateWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    spacesState.updateSpace(space.id, {
      content: { widgets: newWidgets }
    });
  };

  const addWidget = (type: 'text' | 'file') => {
    const newWidget: Widget = {
      id: `w_${Date.now()}`,
      type: type,
      title: type === 'text' ? 'New Note' : 'New File',
      content: type === 'text' ? { text: 'Edit this note...' } : { fileName: 'Empty File' },
      w: 4,
      h: 10
    };
    updateWidgets([...widgets, newWidget]);
  };

  const deleteWidget = (id: string) => {
    updateWidgets(widgets.filter(w => w.id !== id));
  };

  const handleResize = (id: string, w: number, h: number) => {
    const newWidgets = widgets.map(widget =>
      widget.id === id ? { ...widget, w, h } : widget
    );
    updateWidgets(newWidgets);
  };

  const handleUpdateWidget = (id: string, updates: Partial<Widget>) => {
    const newWidgets = widgets.map(widget =>
      widget.id === id ? { ...widget, ...updates } : widget
    );
    updateWidgets(newWidgets);
  };

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, removed);
    updateWidgets(newWidgets);
  }, [widgets, space.id, spacesState]);

  const handleDrop = (item: any, type: string) => {
    let newWidget: Widget | null = null;

    if (type === ItemTypes.EXTERNAL_ELEMENT) {
      // Drop from FileElement sidebar
      newWidget = {
        id: `w_file_${Date.now()}`,
        type: 'file',
        title: item.data.fileName,
        content: {
          ...item.data,
          layout: item.data.isFolder ? 'collection' : 'compact'
        },
        w: item.data.isFolder ? 6 : 4,
        h: item.data.isFolder ? 16 : 6
      };
    } else if (type === ITEM_TYPE_TO_WORKSPACE) {
      // Drop from Space sidebar
      newWidget = {
        id: `w_space_${Date.now()}`,
        type: 'space',
        title: item.spaceData?.title || 'Space Preview',
        content: {
          spaceId: item.spaceId,
          spaceData: item.spaceData
        },
        w: 4,
        h: 8
      };
    } else if (type === ITEM_TYPE_TEXT_ELEMENT) {
      // Drop from TextElement (PageEditor)
      newWidget = {
        id: `w_text_${Date.now()}`,
        type: 'text',
        title: 'Text Snippet',
        content: { text: item.content || 'Imported text' },
        w: 4,
        h: 10
      };
    } else if (type === ItemTypes.WIDGET) {
      // Internal move handled by hover, but cross-viewport moves handled here?
      // If the widget is not in the current list, add it.
      const exists = widgets.find(w => w.id === item.id);
      if (!exists && item.widget) {
        newWidget = {
          ...item.widget,
          id: `w_copy_${Date.now()}` // Create copy to avoid ID conflicts if dragging back and forth
        };
      }
    }

    if (newWidget) {
      updateWidgets([...widgets, newWidget]);
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: [ItemTypes.WIDGET, ItemTypes.EXTERNAL_ELEMENT, ITEM_TYPE_TEXT_ELEMENT, ITEM_TYPE_TO_WORKSPACE],
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      handleDrop(item, monitor.getItemType() as string);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Dashboard grid container */}
      <div
        ref={drop as any}
        className={`flex-1 overflow-auto p-4 bg-default-50/50 transition-colors ${isOver ? 'bg-primary/5' : ''}`}
      >
        <div className="grid grid-cols-12 gap-2 auto-rows-[20px] pb-40">
          {widgets.map((widget, index) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              index={index}
              onDelete={deleteWidget}
              onMove={moveWidget}
              onResize={handleResize}
              onUpdate={handleUpdateWidget}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
            />
          ))}

          {/* Persistent Add Button Card - Fixed Size for now */}
          <div className="col-span-3 row-span-8">
            <Dropdown>
              <DropdownTrigger>
                <div
                  role="button"
                  className="flex flex-col items-center justify-center h-full min-h-[140px] border border-dashed border-default-200 rounded-xl hover:border-primary/50 hover:bg-white/50 cursor-pointer transition-all group gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Plus size={20} className="text-default-400 group-hover:text-primary" />
                  </div>
                  <span className="text-xs font-bold text-default-400 uppercase tracking-wider group-hover:text-primary">Add Widget</span>
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="Add Widget Actions">
                <DropdownItem
                  key="text"
                  startContent={<FileText size={16} />}
                  onPress={() => addWidget('text')}
                >
                  Text Note
                </DropdownItem>
                <DropdownItem
                  key="file"
                  startContent={<FileIcon size={16} />}
                  onPress={() => addWidget('file')}
                >
                  File Placeholder
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
}