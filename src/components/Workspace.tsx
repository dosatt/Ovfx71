import Box from '@mui/joy@5.0.0-beta.48/Box';
import { ViewportRenderer } from './ViewportRenderer';
import { Viewport } from '../types';
import type { Settings } from '../hooks/useSettings';

interface WorkspaceProps {
  sidebarOpen: boolean;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  getBackgroundStyle: () => any;
  brokenLinks: Set<string>;
  brokenLinksVersion: number;
}

export function Workspace({ sidebarOpen, spacesState, viewportsState, settings, getBackgroundStyle, brokenLinks, brokenLinksVersion }: WorkspaceProps) {
  return (
    <Box
      sx={{
        flex: 1,
        height: '100vh',
        overflow: 'hidden',
        p: '4px'
      }}
    >
      <ViewportRenderer
        viewport={viewportsState.rootViewport}
        spacesState={spacesState}
        viewportsState={viewportsState}
        settings={settings}
        getBackgroundStyle={getBackgroundStyle}
        brokenLinks={brokenLinks}
        brokenLinksVersion={brokenLinksVersion}
      />
    </Box>
  );
}