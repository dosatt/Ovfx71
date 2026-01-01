import { useState } from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Card, CardBody, Select, SelectItem } from '@heroui/react';
import { Checkbox } from '../ui/checkbox';
import { Plus, Trash2, Settings, Table, LayoutGrid, Calendar, ListOrdered, X } from 'lucide-react';
import { Space } from '../../types';

interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'select' | 'date';
  options?: string[];
  visible?: boolean;
}

interface Row {
  id: string;
  data: Record<string, any>;
}

type ViewType = 'table' | 'kanban' | 'calendar' | 'list';

interface DatabaseSpaceProps {
  space: Space;
  spacesState: any;
}

export function DatabaseSpace({ space, spacesState }: DatabaseSpaceProps) {
  const [currentView, setCurrentView] = useState<ViewType>('table');
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  
  const [columns, setColumns] = useState<Column[]>(
    space.content?.columns || [
      { id: 'col1', name: 'Name', type: 'text', visible: true },
      { id: 'col2', name: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'], visible: true },
      { id: 'col3', name: 'Priority', type: 'number', visible: true },
      { id: 'col4', name: 'Due Date', type: 'date', visible: true },
      { id: 'col5', name: 'Completed', type: 'checkbox', visible: true }
    ]
  );

  const [rows, setRows] = useState<Row[]>(
    space.content?.rows || [
      { id: 'row1', data: { col1: 'Task 1', col2: 'To Do', col3: 1, col4: '2024-12-10', col5: false } },
      { id: 'row2', data: { col1: 'Task 2', col2: 'In Progress', col3: 2, col4: '2024-12-15', col5: false } },
      { id: 'row3', data: { col1: 'Task 3', col2: 'Done', col3: 3, col4: '2024-12-05', col5: true } }
    ]
  );

  const visibleColumns = columns.filter(c => c.visible !== false);

  const updateContent = () => {
    spacesState.updateSpace(space.id, {
      content: { columns, rows }
    });
  };

  const addRow = () => {
    const newRow: Row = {
      id: `row_${Date.now()}`,
      data: {}
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    spacesState.updateSpace(space.id, {
      content: { columns, rows: newRows }
    });
  };

  const deleteRow = (rowId: string) => {
    const newRows = rows.filter(r => r.id !== rowId);
    setRows(newRows);
    spacesState.updateSpace(space.id, {
      content: { columns, rows: newRows }
    });
  };

  const updateCell = (rowId: string, columnId: string, value: any) => {
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          data: { ...row.data, [columnId]: value }
        };
      }
      return row;
    });
    setRows(newRows);
    spacesState.updateSpace(space.id, {
      content: { columns, rows: newRows }
    });
  };

  const addColumn = () => {
    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: 'New Column',
      type: 'text',
      visible: true
    };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    spacesState.updateSpace(space.id, {
      content: { columns: newColumns, rows }
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    const newColumns = columns.map(c =>
      c.id === columnId ? { ...c, visible: !c.visible } : c
    );
    setColumns(newColumns);
    spacesState.updateSpace(space.id, {
      content: { columns: newColumns, rows }
    });
  };

  const deleteColumn = (columnId: string) => {
    const newColumns = columns.filter(c => c.id !== columnId);
    setColumns(newColumns);
    spacesState.updateSpace(space.id, {
      content: { columns: newColumns, rows }
    });
  };

  const renderCell = (row: Row, column: Column) => {
    const value = row.data[column.id];

    switch (column.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            variant="flat"
            size="sm"
            className="min-w-[150px]"
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-transparent shadow-none hover:bg-default-100"
            }}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            variant="flat"
            size="sm"
            className="min-w-[100px]"
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-transparent shadow-none hover:bg-default-100"
            }}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            variant="flat"
            size="sm"
            className="min-w-[150px]"
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-transparent shadow-none hover:bg-default-100"
            }}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            checked={value || false}
            onCheckedChange={(checked) => updateCell(row.id, column.id, checked === true)}
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            className="w-full min-w-[150px] bg-transparent border-none outline-none text-small p-1 cursor-pointer hover:bg-default-100 rounded"
          >
            <option value="">Select...</option>
            {column.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const renderTableView = () => (
    <div className="flex-1 overflow-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="flex border-b-2 border-divider bg-default-50 sticky top-0 z-10">
          {visibleColumns.map(column => (
            <div
              key={column.id}
              className="p-3 min-w-[150px] font-bold border-r border-divider text-small text-default-600"
            >
              {column.name}
            </div>
          ))}
          <div className="p-3 min-w-[60px]" />
        </div>

        {/* Rows */}
        {rows.map(row => (
          <div
            key={row.id}
            className="flex border-b border-divider hover:bg-default-50 group transition-colors"
          >
            {visibleColumns.map(column => (
              <div
                key={column.id}
                className="p-2 min-w-[150px] border-r border-divider flex items-center"
              >
                {renderCell(row, column)}
              </div>
            ))}
            <div className="p-2 flex gap-1 items-center justify-center min-w-[60px]">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => deleteRow(row.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKanbanView = () => {
    const statusColumn = columns.find(c => c.type === 'select');
    if (!statusColumn) {
      return (
        <div className="p-8 text-center text-default-400">
          Add a Select column to use Kanban view
        </div>
      );
    }

    const statuses = statusColumn.options || [];
    const groupedRows = statuses.reduce((acc, status) => {
      acc[status] = rows.filter(r => r.data[statusColumn.id] === status);
      return acc;
    }, {} as Record<string, Row[]>);

    return (
      <div className="flex-1 overflow-auto p-4 bg-default-50">
        <div className="flex gap-4 min-h-full">
          {statuses.map(status => (
            <div key={status} className="min-w-[300px] max-w-[350px] flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-default-700">{status}</span>
                  <span className="bg-default-200 text-default-600 text-tiny px-2 py-0.5 rounded-full">
                    {groupedRows[status]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {groupedRows[status]?.map(row => (
                  <Card key={row.id} shadow="sm" className="hover:shadow-md transition-shadow">
                    <CardBody className="p-3">
                      <p className="font-medium text-small mb-2">{row.data.col1}</p>
                      <div className="space-y-1">
                        {visibleColumns.slice(1).map(col => (
                          <p key={col.id} className="text-tiny text-default-500">
                            <span className="font-semibold">{col.name}:</span> {String(row.data[col.id] || '-')}
                          </p>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="flex-1 overflow-auto p-4 bg-default-50">
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {rows.map(row => (
          <Card key={row.id} shadow="sm" className="hover:shadow-md transition-shadow">
            <CardBody className="p-4 flex flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <p className="text-medium font-semibold mb-2">{row.data.col1}</p>
                <div className="flex gap-4 flex-wrap">
                  {visibleColumns.slice(1).map(col => (
                    <p key={col.id} className="text-small text-default-500">
                      <span className="font-semibold text-default-700">{col.name}:</span> {String(row.data[col.id] || '-')}
                    </p>
                  ))}
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => deleteRow(row.id)}
              >
                <Trash2 size={16} />
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const dateColumn = columns.find(c => c.type === 'date');
    if (!dateColumn) {
      return (
        <div className="p-8 text-center text-default-400">
          Add a Date column to use Calendar view
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto p-4 bg-default-50">
        <h3 className="text-lg font-semibold mb-4 px-2">Calendar View</h3>
        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
          {rows
            .filter(r => r.data[dateColumn.id])
            .sort((a, b) => new Date(a.data[dateColumn.id]).getTime() - new Date(b.data[dateColumn.id]).getTime())
            .map(row => (
              <Card key={row.id} shadow="sm">
                <CardBody className="p-3 flex items-center gap-4">
                  <div className="min-w-[100px] font-semibold text-primary">
                    {new Date(row.data[dateColumn.id]).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{row.data.col1}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="p-2 border-b border-divider flex gap-2 items-center bg-background">
        <Button 
          startContent={<Plus size={16} />} 
          size="sm" 
          color="primary"
          onPress={addRow}
        >
          New Row
        </Button>
        <Button
          variant="bordered"
          size="sm"
          startContent={<Settings size={16} />}
          onPress={() => setColumnModalOpen(true)}
        >
          Columns
        </Button>
        <div className="flex-1" />
        
        {/* View switcher */}
        <div className="flex gap-1 bg-default-100 p-1 rounded-lg">
          <Button
            isIconOnly
            size="sm"
            variant={currentView === 'table' ? 'solid' : 'light'}
            color={currentView === 'table' ? "primary" : "default"}
            onPress={() => setCurrentView('table')}
            title="Table View"
          >
            <Table size={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={currentView === 'kanban' ? 'solid' : 'light'}
            color={currentView === 'kanban' ? "primary" : "default"}
            onPress={() => setCurrentView('kanban')}
            title="Kanban View"
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={currentView === 'list' ? 'solid' : 'light'}
            color={currentView === 'list' ? "primary" : "default"}
            onPress={() => setCurrentView('list')}
            title="List View"
          >
            <ListOrdered size={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={currentView === 'calendar' ? 'solid' : 'light'}
            color={currentView === 'calendar' ? "primary" : "default"}
            onPress={() => setCurrentView('calendar')}
            title="Calendar View"
          >
            <Calendar size={16} />
          </Button>
        </div>
      </div>

      {/* Views */}
      {currentView === 'table' && renderTableView()}
      {currentView === 'kanban' && renderKanbanView()}
      {currentView === 'list' && renderListView()}
      {currentView === 'calendar' && renderCalendarView()}

      {/* Column Management Modal */}
      <Modal 
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Manage Columns</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2 mb-4">
                  {columns.map(column => (
                    <div
                      key={column.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-100 transition-colors"
                    >
                      <Checkbox
                        checked={column.visible !== false}
                        onCheckedChange={() => toggleColumnVisibility(column.id)}
                      />
                      <div className="flex-1">
                        <span className="text-small font-medium">{column.name}</span>
                        <span className="text-tiny text-default-400 ml-2 uppercase border border-default-200 rounded px-1">{column.type}</span>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => deleteColumn(column.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  startContent={<Plus size={16} />} 
                  variant="flat" 
                  onPress={addColumn}
                  className="w-full"
                >
                  Add Column
                </Button>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
