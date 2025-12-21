import { useState, useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { DndProvider } from './components/DndProvider';
import { useSpaces } from './hooks/useSpaces';
import { useViewports } from './hooks/useViewports';
import { useSettings } from './hooks/useSettings';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { HistoryProvider } from './contexts/HistoryContext';
import { TextElementDragLayer } from './components/spaces/TextElementDragLayer';
import './styles/globals.css';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const viewportsState = useViewports();
  const spacesState = useSpaces((spaceId) => {
    // Close all tabs with deleted space
    viewportsState.closeTabsWithSpace(spaceId);
  });
  const { settings, updateSettings, resetSettings, getBackgroundStyle } = useSettings();

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <HeroUIProvider>
      <HistoryProvider>
        <DndProvider>
          <div 
            className="flex h-screen overflow-hidden relative"
            style={{ 
              background: getBackgroundStyle(),
              gap: sidebarOpen ? '2px' : 0,
            }}
          >
            <Sidebar
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              spacesState={spacesState}
              viewportsState={viewportsState}
              settings={settings}
              onUpdateSettings={updateSettings}
              onResetSettings={resetSettings}
            />
            
            <Workspace
              sidebarOpen={sidebarOpen}
              spacesState={spacesState}
              viewportsState={viewportsState}
              settings={settings}
              onUpdateSettings={updateSettings}
              onResetSettings={resetSettings}
              getBackgroundStyle={getBackgroundStyle}
              brokenLinks={spacesState.brokenLinks}
              brokenLinksVersion={spacesState.brokenLinksVersion}
            />
            <TextElementDragLayer />
          </div>
        </DndProvider>
      </HistoryProvider>
    </HeroUIProvider>
  );
}
