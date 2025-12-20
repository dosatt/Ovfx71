import { useState } from 'react';
import { CssVarsProvider } from '@mui/joy@5.0.0-beta.48/styles';
import CssBaseline from '@mui/joy@5.0.0-beta.48/CssBaseline';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import { DndProvider } from './components/DndProvider';
import { useSpaces } from './hooks/useSpaces';
import { useViewports } from './hooks/useViewports';
import { useSettings } from './hooks/useSettings';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { HistoryProvider } from './contexts/HistoryContext';
import { TextElementDragLayer } from './components/spaces/TextElementDragLayer';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const viewportsState = useViewports();
  const spacesState = useSpaces((spaceId) => {
    // Close all tabs with deleted space
    viewportsState.closeTabsWithSpace(spaceId);
  });
  const { settings, updateSettings, resetSettings, getBackgroundStyle } = useSettings();

  return (
    <CssVarsProvider defaultMode="light">
      <CssBaseline />
      <HistoryProvider>
        <DndProvider>
          <Box sx={{ 
            display: 'flex', 
            height: '100vh', 
            overflow: 'hidden',
            background: getBackgroundStyle(),
            gap: sidebarOpen ? '2px' : 0,
            position: 'relative'
          }}>
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
            getBackgroundStyle={getBackgroundStyle}
            brokenLinks={spacesState.brokenLinks}
            brokenLinksVersion={spacesState.brokenLinksVersion}
          />
          <TextElementDragLayer />
          </Box>
        </DndProvider>
      </HistoryProvider>
    </CssVarsProvider>
  );
}