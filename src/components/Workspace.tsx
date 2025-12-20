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
    <div
      className="flex-1 h-full overflow-hidden p-1"
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
    </div>
  );
}
