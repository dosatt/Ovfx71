import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import Snackbar from '@mui/joy@5.0.0-beta.48/Snackbar';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import { Undo, Redo } from 'lucide-react';

export interface HistoryAction {
  type: string;
  description: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;
}

interface HistoryContextType {
  pushAction: (action: Omit<HistoryAction, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}

interface HistoryProviderProps {
  children: ReactNode;
}

export function HistoryProvider({ children }: HistoryProviderProps) {
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'undo' | 'redo'>('undo');

  const showSnackbar = (message: string, type: 'undo' | 'redo') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarOpen(true);
  };

  const pushAction = useCallback((action: Omit<HistoryAction, 'timestamp'>) => {
    const fullAction: HistoryAction = {
      ...action,
      timestamp: Date.now()
    };
    
    setUndoStack(prev => [...prev, fullAction]);
    setRedoStack([]); // Cancella la cronologia redo quando si fa una nuova azione
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    action.undo();
    
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
    
    showSnackbar(`Annullato: ${action.description}`, 'undo');
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    action.redo();
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    
    showSnackbar(`Ripristinato: ${action.description}`, 'redo');
  }, [redoStack]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Gestione keyboard shortcuts globali
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Z (Mac) o Ctrl+Z (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        
        if (e.shiftKey) {
          // Cmd+Shift+Z = Redo
          redo();
        } else {
          // Cmd+Z = Undo
          undo();
        }
      }
      
      // Cmd+Y (alternativa per redo su Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <HistoryContext.Provider
      value={{
        pushAction,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        clearHistory
      }}
    >
      {children}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        color={snackbarType === 'undo' ? 'neutral' : 'primary'}
        variant="soft"
        size="sm"
        sx={{
          bottom: 'calc(100vh / 7)',
          boxShadow: 'lg'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {snackbarType === 'undo' ? <Undo size={16} /> : <Redo size={16} />}
          <Typography level="body-sm">
            {snackbarMessage}
          </Typography>
        </Box>
      </Snackbar>
    </HistoryContext.Provider>
  );
}