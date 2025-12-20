import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Sheet from '@mui/joy@5.0.0-beta.48/Sheet';
import { Viewport } from '../types';
import { ViewportHeader } from './ViewportHeader';
import { PageEditor } from './spaces/PageEditor';
import { CanvasSpace } from './spaces/CanvasSpace';
import { DatabaseSpace } from './spaces/DatabaseSpace';
import { DashboardSpace } from './spaces/DashboardSpace';
import { MarkdownView } from './spaces/MarkdownView';
import { BrowserApp } from './apps/BrowserApp';
import { CalendarApp } from './apps/CalendarApp';
import { MailApp } from './apps/MailApp';
import { ChatApp } from './apps/ChatApp';
import { DrawApp } from './apps/DrawApp';
import { WelcomePage } from './WelcomePage';
import type { Settings } from '../hooks/useSettings';

interface ViewportContentProps {
  viewport: Viewport;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  getBackgroundStyle: () => any;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
}

export function ViewportContent({ viewport, spacesState, viewportsState, settings, getBackgroundStyle, brokenLinks, brokenLinksVersion }: ViewportContentProps) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const activeTab = viewport.tabs.find(t => t.id === viewport.activeTabId);
  const space = activeTab?.spaceId ? spacesState.getSpace(activeTab.spaceId) : null;
  const isFocused = viewportsState.focusedViewportId === viewport.id;

  const handleCreateSpace = (type: 'page' | 'canvas' | 'database' | 'dashboard') => {
    const newSpace = spacesState.createSpace(type);
    viewportsState.replaceCurrentTab(viewport.id, newSpace.id, undefined, newSpace.title);
    viewportsState.setFocusedViewportId(viewport.id);
  };

  const handleOpenApp = (appType: 'browser' | 'mail' | 'chat' | 'calendar' | 'draw') => {
    const title = appType.charAt(0).toUpperCase() + appType.slice(1);
    viewportsState.replaceCurrentTab(viewport.id, undefined, appType, title);
    viewportsState.setFocusedViewportId(viewport.id);
  };

  const handleOpenSpace = (spaceId: string) => {
    const space = spacesState.getSpace(spaceId);
    if (space) {
      viewportsState.replaceCurrentTab(viewport.id, spaceId, undefined, space.title);
      viewportsState.setFocusedViewportId(viewport.id);
    }
  };

  const handleViewportClick = () => {
    viewportsState.setFocusedViewportId(viewport.id);
  };

  return (
    <Sheet
      onClick={handleViewportClick}
      data-viewport-id={viewport.id}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '15px',
        overflow: 'hidden',
        border: '2px solid',
        borderColor: isFocused ? 'primary.outlinedBorder' : 'divider',
        transition: 'border-color 0.2s',
        bgcolor: settings.viewportTransparency ? 'rgba(255, 255, 255, 0.7)' : 'background.surface',
        backdropFilter: settings.viewportBlur ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: settings.viewportBlur ? 'blur(20px)' : 'none',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
      }}
    >
      <ViewportHeader
        viewport={viewport}
        space={space}
        spacesState={spacesState}
        viewportsState={viewportsState}
        showMarkdown={showMarkdown}
        onToggleMarkdown={space ? () => setShowMarkdown(!showMarkdown) : undefined}
        settings={settings}
      />

      <Box
        data-viewport-content
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: settings.viewportTransparency ? 'transparent' : 'background.surface',
          '&::-webkit-scrollbar': { display: 'none' },
          '-ms-overflow-style': 'none',
          scrollbarWidth: 'none'
        }}
      >
        {/* Render APP if active tab has appType */}
        {activeTab?.appType && (
          <>
            {activeTab.appType === 'browser' && <BrowserApp />}
            {activeTab.appType === 'calendar' && <CalendarApp />}
            {activeTab.appType === 'mail' && <MailApp />}
            {activeTab.appType === 'chat' && <ChatApp />}
            {activeTab.appType === 'draw' && <DrawApp />}
          </>
        )}

        {/* Render SPACE if active tab has spaceId */}
        {space && !activeTab?.appType && (
          <>
            {showMarkdown ? (
              <MarkdownView space={space} spacesState={spacesState} />
            ) : (
              <>
                {space.type === 'page' && (
                  <PageEditor 
                    space={space} 
                    spacesState={spacesState}
                    viewportsState={viewportsState}
                    viewportId={viewport.id}
                    tabId={activeTab?.id}
                    brokenLinks={brokenLinks}
                    brokenLinksVersion={brokenLinksVersion}
                  />
                )}
                {space.type === 'canvas' && (
                  <CanvasSpace space={space} spacesState={spacesState} />
                )}
                {space.type === 'database' && (
                  <DatabaseSpace space={space} spacesState={spacesState} />
                )}
                {space.type === 'dashboard' && (
                  <DashboardSpace space={space} spacesState={spacesState} />
                )}
              </>
            )}
          </>
        )}

        {/* Empty state - Show Welcome Page */}
        {!space && !activeTab?.appType && (
          <WelcomePage
            onCreateSpace={handleCreateSpace}
            onOpenApp={handleOpenApp}
            onOpenSpace={handleOpenSpace}
            recentSpaces={spacesState.spaces.slice(0, 5).map((s: any) => ({
              id: s.id,
              title: s.title,
              type: s.type
            }))}
          />
        )}
      </Box>
    </Sheet>
  );
}