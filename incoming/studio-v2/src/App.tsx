/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ReadingPreferences, Story } from './types/story';
import { mockStoryService } from './services/mockStoryService';
import { LandingView } from './components/views/LandingView';
import { StoryListView } from './components/views/StoryListView';
import { CreateStoryView } from './components/views/CreateStoryView';
import { ChatView } from './components/views/ChatView';
import { DemoToolsModal } from './components/modals/DemoToolsModal';
import './styles/mobile-layout.css';

type AppView = 'landing' | 'stories' | 'create' | 'chat';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [preferences, setPreferences] = useState<ReadingPreferences>(
    mockStoryService.getPreferences()
  );

  // Global modals
  const [isDemoToolsOpen, setIsDemoToolsOpen] = useState(false);

  // Refresh stories list
  const refreshStories = useCallback(async () => {
    const list = await mockStoryService.listStories();
    setStories(list);
  }, []);

  useEffect(() => {
    refreshStories();
    const unsubscribe = mockStoryService.subscribe(() => {
      refreshStories();
      setPreferences(mockStoryService.getPreferences());
    });
    return () => {
      unsubscribe();
    };
  }, [refreshStories]);

  const handleUpdatePreferences = (partial: Partial<ReadingPreferences>) => {
    mockStoryService.updatePreferences(partial);
    setPreferences(mockStoryService.getPreferences());
  };

  const handleOpenStory = (storyId: string) => {
    setActiveStoryId(storyId);
    setCurrentView('chat');
  };

  const handleStoryCreated = (story: Story) => {
    setActiveStoryId(story.id);
    setCurrentView('chat');
  };

  const themeClass = preferences.theme === 'dark' ? 'theme-dark' : 'theme-light';

  return (
    <div
      className={`story-lite-root ${themeClass} min-h-[100dvh] bg-[var(--bg-page)] text-[var(--text-main)] transition-colors selection:bg-[var(--brand-primary)]/20 selection:text-[var(--text-main)]`}
    >
      {currentView === 'landing' && (
        <LandingView
          onEnter={() => setCurrentView('stories')}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
        />
      )}

      {currentView === 'stories' && (
        <StoryListView
          stories={stories}
          service={mockStoryService}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onOpenStory={handleOpenStory}
          onCreateStory={() => setCurrentView('create')}
          onOpenDemoTools={() => setIsDemoToolsOpen(true)}
          onReload={refreshStories}
        />
      )}

      {currentView === 'create' && (
        <CreateStoryView
          service={mockStoryService}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onBack={() => setCurrentView('stories')}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {currentView === 'chat' && activeStoryId && (
        <ChatView
          storyId={activeStoryId}
          allStories={stories}
          service={mockStoryService}
          onBackToBookshelf={() => setCurrentView('stories')}
          onSwitchStory={(newId) => setActiveStoryId(newId)}
          onCreateNewStory={() => setCurrentView('create')}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
        />
      )}

      {/* Global Demo Tools Modal */}
      <DemoToolsModal
        isOpen={isDemoToolsOpen}
        onClose={() => setIsDemoToolsOpen(false)}
        service={mockStoryService}
        onReloadRequested={refreshStories}
      />
    </div>
  );
}
