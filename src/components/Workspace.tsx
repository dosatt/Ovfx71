import { ViewportRenderer } from './ViewportRenderer';
import { Viewport } from '../types';
import type { Settings } from '../hooks/useSettings';

interface WorkspaceProps {
  sidebarOpen: boolean;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onResetSettings: () => void;
  getBackgroundStyle: () => any;
  brokenLinks: Set<string>;
  brokenLinksVersion: number;
}

export function Workspace({ 
  sidebarOpen, 
  spacesState, 
  viewportsState, 
  settings, 
  onUpdateSettings,
  onResetSettings,
  getBackgroundStyle, 
  brokenLinks, 
  brokenLinksVersion 
}: WorkspaceProps) {
  return (
    <div
      className="flex-1 h-full overflow-hidden p-1"
    >
      <ViewportRenderer
        viewport={viewportsState.rootViewport}
        spacesState={spacesState}
        viewportsState={viewportsState}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onResetSettings={onResetSettings}
        getBackgroundStyle={getBackgroundStyle}
        brokenLinks={brokenLinks}
        brokenLinksVersion={brokenLinksVersion}
      />
    </div>
  );
}
