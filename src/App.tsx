/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReadingPreferences, Story } from './types/story';
import { mockStoryService } from './services/mockStoryService';
import { LandingView } from './components/views/LandingView';
import { LoginView } from './components/views/LoginView';
import { StoryListView } from './components/views/StoryListView';
import { CreateStoryView } from './components/views/CreateStoryView';
import { ChatView } from './components/views/ChatView';
import { DemoToolsModal } from './components/modals/DemoToolsModal';
import { StartupLoadingScreen, StartupStatus } from './components/common/StartupLoadingScreen';
import { APP_CONFIG } from './constants/config';
import './styles/mobile-layout.css';

type AppView = 'landing' | 'login' | 'stories' | 'create' | 'chat';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUser, setCurrentUser] = useState<string>(APP_CONFIG.visitorNickname);
  const [preferences, setPreferences] = useState<ReadingPreferences>(
    mockStoryService.getPreferences()
  );

  // Global modals
  const [isDemoToolsOpen, setIsDemoToolsOpen] = useState(false);

  // Startup Splash Screen State
  const [isStartupSplashVisible, setIsStartupSplashVisible] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [startupStatus, setStartupStatus] = useState<StartupStatus>('loading');
  const [startupError, setStartupError] = useState<string | undefined>(undefined);
  const [isPreviewSplashMode, setIsPreviewSplashMode] = useState(false);
  const slowTimerRef = useRef<number | null>(null);

  // Real App Initialization logic without fake progress
  const initApp = useCallback(async () => {
    setStartupStatus('loading');
    setStartupError(undefined);
    setIsAppReady(false);

    // If real initialization takes longer than 4.5 seconds, shift to 'slow' state
    if (slowTimerRef.current !== null) {
      window.clearTimeout(slowTimerRef.current);
    }
    slowTimerRef.current = window.setTimeout(() => {
      setStartupStatus((current) => (current === 'loading' ? 'slow' : current));
    }, 4500);

    try {
      const list = await mockStoryService.listStories();
      setStories(list);
      // Real ready signal received: smooth exit triggers
      setIsAppReady(true);
    } catch (err: any) {
      setStartupStatus('failed');
      setStartupError(err?.message || '读取故事存储服务未就绪，请点击重试。');
    } finally {
      if (slowTimerRef.current !== null) {
        window.clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    }
  }, []);

  // Refresh stories list (during runtime)
  const refreshStories = useCallback(async () => {
    try {
      const list = await mockStoryService.listStories();
      setStories(list);
    } catch (e) {
      console.warn('Refresh stories warning:', e);
    }
  }, []);

  // Run real initialization on boot
  useEffect(() => {
    initApp();
    const unsubscribe = mockStoryService.subscribe(() => {
      refreshStories();
      setPreferences(mockStoryService.getPreferences());
    });
    return () => {
      unsubscribe();
      if (slowTimerRef.current !== null) {
        window.clearTimeout(slowTimerRef.current);
      }
    };
  }, [initApp, refreshStories]);

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

  // Login Success Handler: smoothly transitions into existing startup splash!
  const handleLoginSuccess = (user: string) => {
    setCurrentUser(user);
    setIsStartupSplashVisible(true);
    initApp();
    setCurrentView('stories');
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  // Preview splash screen controls (from DemoTools)
  const handleTriggerSplashPreview = () => {
    setIsPreviewSplashMode(true);
    setStartupStatus('loading');
    setIsAppReady(false);
    setIsStartupSplashVisible(true);
  };

  const handleTriggerLoginPreview = () => {
    setCurrentView('login');
  };

  const themeClass = preferences.theme === 'dark' ? 'theme-dark' : 'theme-light';

  return (
    <div
      className={`story-lite-root ${themeClass} min-h-[100dvh] bg-[var(--bg-page)] text-[var(--text-main)] transition-colors selection:bg-[var(--brand-primary)]/20 selection:text-[var(--text-main)]`}
    >
      {/* 启动加载画面 (Startup Loading Screen) */}
      {isStartupSplashVisible && (
        <StartupLoadingScreen
          status={startupStatus}
          errorMessage={startupError}
          isReady={isAppReady}
          theme={preferences.theme}
          onRetry={initApp}
          onReady={() => {
            setIsStartupSplashVisible(false);
            setIsPreviewSplashMode(false);
          }}
          enablePreviewSwitcher={isPreviewSplashMode}
          onPreviewStatusChange={(nextStatus) => {
            setStartupStatus(nextStatus);
            if (nextStatus === 'failed') {
              setStartupError('模拟数据连接超时或扩展未就绪，请点击重试。');
            }
          }}
        />
      )}

      {currentView === 'landing' && (
        <LandingView
          onEnter={() => setCurrentView('stories')}
          onGoToLogin={() => setCurrentView('login')}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
        />
      )}

      {currentView === 'login' && (
        <LoginView
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setCurrentView('landing')}
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
          onLogout={handleLogout}
          currentUser={currentUser}
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
        onTriggerSplashPreview={handleTriggerSplashPreview}
        onTriggerLoginPreview={handleTriggerLoginPreview}
      />
    </div>
  );
}
