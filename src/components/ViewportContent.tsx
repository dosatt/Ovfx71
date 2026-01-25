import { useState } from 'react';
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
import { SettingsApp } from './apps/SettingsApp';
import { WelcomePage } from './WelcomePage';
import type { Settings } from '../hooks/useSettings';

interface ViewportContentProps {
  viewport: Viewport;
  spacesState: any;
  viewportsState: any;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onResetSettings: () => void;
  getBackgroundStyle: () => any;
  brokenLinks?: Set<string>;
  brokenLinksVersion?: number;
}

export function ViewportContent({
  viewport,
  spacesState,
  viewportsState,
  settings,
  onUpdateSettings,
  onResetSettings,
  getBackgroundStyle,
  brokenLinks,
  brokenLinksVersion
}: ViewportContentProps) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const activeTab = viewport.tabs.find(t => t.id === viewport.activeTabId);
  const space = activeTab?.spaceId ? spacesState.getSpace(activeTab.spaceId) : null;
  const isFocused = viewportsState.focusedViewportId === viewport.id;

  const handleCreateSpace = (type: 'page' | 'canvas' | 'database' | 'dashboard') => {
    const newSpace = spacesState.createSpace(type);
    viewportsState.replaceCurrentTab(viewport.id, newSpace.id, undefined, newSpace.title);
    viewportsState.setFocusedViewportId(viewport.id);
  };

  const handleOpenApp = (appType: 'browser' | 'mail' | 'chat' | 'calendar' | 'draw' | 'settings') => {
    const title = appType === 'settings'
      ? 'Impostazioni'
      : appType.charAt(0).toUpperCase() + appType.slice(1);

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
    <div
      onClick={handleViewportClick}
      data-viewport-id={viewport.id}
      className={`
        w-full h-full flex flex-col rounded-[15px] overflow-hidden border-2 transition-colors duration-200 shadow-medium
        border-divider
        ${settings.viewportTransparency ? 'bg-background/70' : 'bg-background'}
        ${settings.viewportBlur ? 'backdrop-blur-xl' : ''}
      `}
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

      <div
        data-viewport-content
        className={`
          flex-1
          ${space?.type === 'page' && !showMarkdown ? 'overflow-hidden' : 'overflow-auto no-scrollbar'}
          ${settings.viewportTransparency ? 'bg-transparent' : 'bg-background'}
        `}
      >
        {/* Render APP if active tab has appType */}
        {activeTab?.appType && (
          <>
            {activeTab.appType === 'browser' && <BrowserApp />}
            {activeTab.appType === 'calendar' && (
              <CalendarApp
                spacesState={spacesState}
                viewportsState={viewportsState}
              />
            )}
            {activeTab.appType === 'mail' && <MailApp />}
            {activeTab.appType === 'chat' && <ChatApp />}
            {activeTab.appType === 'draw' && <DrawApp />}
            {activeTab.appType === 'settings' && (
              <SettingsApp
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onResetSettings={onResetSettings}
                spacesState={spacesState}
                viewportsState={viewportsState}
              />
            )}
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
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                  />
                )}
                {space.type === 'canvas' && (
                  <CanvasSpace
                    space={space}
                    spacesState={spacesState}
                    isActive={isFocused}
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                  />
                )}
                {space.type === 'database' && (
                  <DatabaseSpace space={space} spacesState={spacesState} />
                )}
                {space.type === 'dashboard' && (
                  <DashboardSpace
                    space={space}
                    spacesState={spacesState}
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                  />
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
      </div>
    </div>
  );
}