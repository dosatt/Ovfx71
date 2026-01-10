import { DndProvider as ReactDndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createDragDropManager } from 'dnd-core';

// Use a global variable to persist the manager across re-renders and potential duplicate package instances
const getManager = () => {
  if (typeof window !== 'undefined') {
    if (!(window as any).__DND_MANAGER__) {
      (window as any).__DND_MANAGER__ = createDragDropManager(HTML5Backend);
    }
    return (window as any).__DND_MANAGER__;
  }
  return null;
};

export function DndProvider({ children }: { children: React.ReactNode }) {
  const manager = getManager();
  
  if (!manager) return <>{children}</>;
  
  return <ReactDndProvider manager={manager}>{children}</ReactDndProvider>;
}