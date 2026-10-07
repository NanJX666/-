/**
 * Story and message data types and the swappable StoryService interface.
 * In a future phase, this interface can be implemented by a SillyTavern UI Extension
 * adapter without changing the UI components.
 */

export interface Story {
  id: string;
  title: string;
  characterName: string;
  personaSetting: string;
  createdAt: number;
  updatedAt: number;
  lastSnippet: string;
  accentColor: string; // Subtle accent color for identifier block
}

export interface StoryMessage {
  id: string;
  storyId: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  candidates: string[];
  activeCandidateIndex: number;
  createdAt: number;
  isStreaming?: boolean;
  isInterrupted?: boolean;
}

export interface ReadingPreferences {
  fontSize: number; // 15, 17, 19, 21 (default 17)
  theme: 'light' | 'dark';
}

export interface StreamCallbacks {
  onChunk?: (text: string) => void;
  onDone?: (finalText: string) => void;
  onError?: (error: Error) => void;
}

export interface StoryBackup {
  story: Story;
  messages: StoryMessage[];
}

export interface StoryService {
  listStories(): Promise<Story[]>;
  getStory(id: string): Promise<Story | null>;
  getMessages(storyId: string): Promise<StoryMessage[]>;
  createStory(params: { characterName: string; setting: string; customTitle?: string }): Promise<Story>;
  renameStory(storyId: string, newTitle: string): Promise<void>;
  deleteStory(storyId: string): Promise<StoryBackup>;
  restoreStory(backup: StoryBackup): Promise<void>;
  sendMessage(storyId: string, content: string, callbacks?: StreamCallbacks): Promise<void>;
  stopGeneration(storyId: string): void;
  isGenerating(storyId: string): boolean;
  regenerateLatest(storyId: string, callbacks?: StreamCallbacks): Promise<void>;
  switchCandidate(storyId: string, messageId: string, index: number): Promise<void>;
  editMessage(storyId: string, messageId: string, newContent: string): Promise<void>;
  retryLastMessage(storyId: string, callbacks?: StreamCallbacks): Promise<void>;
  getPreferences(): ReadingPreferences;
  updatePreferences(partial: Partial<ReadingPreferences>): void;
  subscribe(listener: () => void): () => void;
  resetToDefaults(): Promise<void>;
  setEmptyListSimulation(enabled: boolean): void;
  getEmptyListSimulation(): boolean;
  setSimulateErrorOnce(enabled: boolean): void;
  getSimulateErrorOnce(): boolean;
}
