import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Checkbox from '@mui/joy@5.0.0-beta.48/Checkbox';
import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Card from '@mui/joy@5.0.0-beta.48/Card';
import { Plus, Trash2, Settings, Table, LayoutGrid, Calendar, ListOrdered } from 'lucide-react';
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
            variant="plain"
            size="sm"
            sx={{ minWidth: 150 }}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            variant="plain"
            size="sm"
            sx={{ minWidth: 100 }}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            variant="plain"
            size="sm"
            sx={{ minWidth: 150 }}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            checked={value || false}
            onChange={(e) => updateCell(row.id, column.id, e.target.checked)}
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.875rem',
              minWidth: '150px',
              padding: '4px',
              cursor: 'pointer'
            }}
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
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      <Box sx={{ minWidth: 'max-content' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: '2px solid',
            borderColor: 'divider',
            bgcolor: 'background.level1',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}
        >
          {visibleColumns.map(column => (
            <Box
              key={column.id}
              sx={{
                p: 2,
                minWidth: 150,
                fontWeight: 'bold',
                borderRight: '1px solid',
                borderColor: 'divider'
              }}
            >
              {column.name}
            </Box>
          ))}
          <Box sx={{ p: 2, minWidth: 60 }} />
        </Box>

        {/* Rows */}
        {rows.map(row => (
          <Box
            key={row.id}
            sx={{
              display: 'flex',
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            {visibleColumns.map(column => (
              <Box
                key={column.id}
                sx={{
                  p: 2,
                  minWidth: 150,
                  borderRight: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {renderCell(row, column)}
              </Box>
            ))}
            <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
              <IconButton
                size="sm"
                variant="plain"
                color="danger"
                onClick={() => deleteRow(row.id)}
              >
                <Trash2 size={14} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderKanbanView = () => {
    const statusColumn = columns.find(c => c.type === 'select');
    if (!statusColumn) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.tertiary' }}>
          Add a Select column to use Kanban view
        </Box>
      );
    }

    const statuses = statusColumn.options || [];
    const groupedRows = statuses.reduce((acc, status) => {
      acc[status] = rows.filter(r => r.data[statusColumn.id] === status);
      return acc;
    }, {} as Record<string, Row[]>);

    return (
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, minHeight: '100%' }}>
          {statuses.map(status => (
            <Box key={status} sx={{ minWidth: 300, maxWidth: 350 }}>
              <Box sx={{ mb: 2, p: 1, bgcolor: 'background.level1', borderRadius: '8px' }}>
                <Typography level="title-md">{status}</Typography>
                <Typography level="body-xs">
                  {groupedRows[status]?.length || 0} items
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {groupedRows[status]?.map(row => (
                  <Card key={row.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography level="title-sm">{row.data.col1}</Typography>
                    {visibleColumns.slice(1).map(col => (
                      <Typography key={col.id} level="body-xs" sx={{ mt: 0.5 }}>
                        {col.name}: {String(row.data[col.id] || '-')}
                      </Typography>
                    ))}
                  </Card>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderListView = () => (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map(row => (
          <Card key={row.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography level="title-md">{row.data.col1}</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                  {visibleColumns.slice(1).map(col => (
                    <Typography key={col.id} level="body-sm">
                      <strong>{col.name}:</strong> {String(row.data[col.id] || '-')}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <IconButton
                size="sm"
                variant="plain"
                color="danger"
                onClick={() => deleteRow(row.id)}
              >
                <Trash2 size={14} />
              </IconButton>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );

  const renderCalendarView = () => {
    const dateColumn = columns.find(c => c.type === 'date');
    if (!dateColumn) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.tertiary' }}>
          Add a Date column to use Calendar view
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography level="title-md" sx={{ mb: 2 }}>Calendar View</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows
            .filter(r => r.data[dateColumn.id])
            .sort((a, b) => new Date(a.data[dateColumn.id]).getTime() - new Date(b.data[dateColumn.id]).getTime())
            .map(row => (
              <Card key={row.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
                      {new Date(row.data[dateColumn.id]).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography level="title-sm">{row.data.col1}</Typography>
                  </Box>
                </Box>
              </Card>
            ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button startDecorator={<Plus size={16} />} size="sm" onClick={addRow}>
          New Row
        </Button>
        <Button
          variant="outlined"
          size="sm"
          startDecorator={<Settings size={16} />}
          onClick={() => setColumnModalOpen(true)}
        >
          Columns
        </Button>
        <Box sx={{ flex: 1 }} />
        
        {/* View switcher */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="sm"
            variant={currentView === 'table' ? 'solid' : 'plain'}
            onClick={() => setCurrentView('table')}
          >
            <Table size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant={currentView === 'kanban' ? 'solid' : 'plain'}
            onClick={() => setCurrentView('kanban')}
          >
            <LayoutGrid size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant={currentView === 'list' ? 'solid' : 'plain'}
            onClick={() => setCurrentView('list')}
          >
            <ListOrdered size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant={currentView === 'calendar' ? 'solid' : 'plain'}
            onClick={() => setCurrentView('calendar')}
          >
            <Calendar size={16} />
          </IconButton>
        </Box>
      </Box>

      {/* Views */}
      {currentView === 'table' && renderTableView()}
      {currentView === 'kanban' && renderKanbanView()}
      {currentView === 'list' && renderListView()}
      {currentView === 'calendar' && renderCalendarView()}

      {/* Column Management Modal */}
      <Modal open={columnModalOpen} onClose={() => setColumnModalOpen(false)}>
        <ModalDialog sx={{ minWidth: 500 }}>
          <Typography level="h4" sx={{ mb: 2 }}>
            Manage Columns
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {columns.map(column => (
              <Box
                key={column.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: '6px',
                  '&:hover': { bgcolor: 'background.level1' }
                }}
              >
                <Checkbox
                  checked={column.visible !== false}
                  onChange={() => toggleColumnVisibility(column.id)}
                />
                <Typography level="body-sm" sx={{ flex: 1 }}>
                  {column.name} ({column.type})
                </Typography>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="danger"
                  onClick={() => deleteColumn(column.id)}
                >
                  <Trash2 size={14} />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Button startDecorator={<Plus size={16} />} onClick={addColumn}>
            Add Column
          </Button>
        </ModalDialog>
      </Modal>
    </Box>
  );
}