import { useState, useCallback, useEffect } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T), addToHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

// Function to show temporary tooltip
const showTooltip = (message: string) => {
  // Remove existing tooltips
  const existing = document.getElementById('history-tooltip');
  if (existing) {
    existing.remove();
  }

  // Create new tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'history-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--joy-palette-neutral-900, #1a1a1a);
    color: var(--joy-palette-common-white, #ffffff);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: fadeInOut 1.5s ease-in-out;
  `;

  // Add CSS animation
  if (!document.getElementById('history-tooltip-style')) {
    const style = document.createElement('style');
    style.id = 'history-tooltip-style';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(tooltip);

  // Remove after animation
  setTimeout(() => {
    tooltip.remove();
  }, 1500);
};

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T | ((prev: T) => T), addToHistory: boolean = true) => {
    setHistory((current) => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(current.present)
        : newState;

      // If we don't want to add to history (e.g. for internal updates)
      if (!addToHistory) {
        return {
          ...current,
          present: nextState,
        };
      }

      // Add current state to past
      const newPast = [...current.past, current.present];

      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: nextState,
        future: [], // Clear future when a new action is performed
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) {
        showTooltip('Nothing to undo');
        return current;
      }

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);

      showTooltip('Undone');

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) {
        showTooltip('Nothing to redo');
        return current;
      }

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      showTooltip('Redone');

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((current) => ({
      past: [],
      present: current.present,
      future: [],
    }));
  }, []);

  // Keyboard shortcuts handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrCmd && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      // Alternative: Ctrl/Cmd + Y for redo
      if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory,
  };
}