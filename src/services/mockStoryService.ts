import {
  ReadingPreferences,
  Story,
  StoryBackup,
  StoryMessage,
  StoryService,
  StreamCallbacks,
} from '../types/story';
import { INITIAL_MESSAGES, INITIAL_STORIES } from './mockData';

const STORAGE_KEYS = {
  STORIES: 'weiwan_v1_stories',
  MESSAGES: 'weiwan_v1_messages',
  PREFS: 'weiwan_v1_prefs',
};

// Character-themed narrative generator templates for realistic prototype simulation
const SAMPLE_REPLIES: Record<string, string[]> = {
  沈砚: [
    '沈砚放下手中的青瓷茶盏，目光在窗外连绵的雨帘上凝视了片刻。\n\n“老街这一片，天晴时总能闻到远处晒网场的海风腥气；可一下起雨，整座城就像被泡进了旧宣纸里。”他转过身，将书桌右侧一盏覆着墨绿色灯罩的旧台灯拧亮了些，暖黄的光圈顿时拢住了两人之间的方寸之地，“那本日记里夹着的两张素描，外婆当年画的是码头旧灯塔拆毁前的模样吧？我找找看那年修路志的附图。”',
    '沈砚的手指骨节分明，在泛黄的纸张边缘稍作停留。\n\n“十年前你离开的时候，车站那排香樟树才刚栽下不久。”他的声调依旧平缓宁静，不带多余的波澜，却让人感到一种沉实的安定，“时间在小城里过得极慢，好像什么都没变，但不知不觉，檐下的瓦当又被海风蚀薄了一层。你慢慢看，店里今天不会有别的客人。”',
    '沈砚从书架底层的铁皮匣子里取出一柄细黄铜放大镜，递到你手边。\n\n“墨迹受潮散开的地方，不要用手直接摸。”他提醒道，眼神专注而细致，“侧着光看，纸面还留着当年钢笔尖划下的压痕。你看这一笔，是‘海盐仓第三号码头’。”',
  ],
  许知遥: [
    '许知遥微微侧过头，目光落在过道尽头那面晃动的铜镜上。\n\n“列车快进隧道了。”他将食指竖在唇边，示意你降低音量，“刚才列车员推过去的餐车上，没有放任何食物，只有两盏已经熄灭的煤油灯。不管待会儿车窗外闪过什么动静，记住，绝不能把手伸出窗帘外。”',
    '许知遥手腕翻转，那枚老旧的银怀表在他修长的指尖灵活地转了一圈，最后稳稳落入风衣口袋。\n\n“既然你也拿到了这张不记名的硬卧车票，说明他们已经注意到了你手里的账本。”他的眼神冷峻如霜，“从现在起，跟着我的步调走。下一站停车只有三分钟，那是我们唯一的窗口。”',
  ],
  阿尔登: [
    '阿尔登将淬火长剑缓缓推入雕刻着荆棘花纹的黑铁剑鞘，发出一声沉闷的咬合轻响。\n\n“寒风在石隙里哭嚎，这说明荒原深处的冰魔兽正在往南迁徙。”他走回壁炉前，用火钳拨了拨暗红的炭火，火星升腾而起，“先喝口热麦酒暖暖身子。王都的那些贵族老爷如果真想让北方防线坚守到开春，就不会只派你一个人带着羊皮纸来。”',
    '守望骑士阿尔登摘下覆满霜雪的皮手套，露出一双布满刀茧与冻疮的粗粝手掌。\n\n“这封密信上的蜡封，是前代老伯爵亲手印下的鹰徽。”他紧盯着信笺的一角，眼神中掠过一丝复杂的情绪，“二十年了，老家伙临死前终于想起了他在北境还有这样一支驻军。说吧，他在信里给你交代了什么秘密？”',
  ],
  DEFAULT: [
    '微风拂过屋檐，周围的一切显得格外安静。\n\n他低头思索了片刻，随后抬眼看向你，目光中带着探究与沉静：“既然已经走到这一步，很多事情就不必再遮遮掩掩了。你所关心的那个答案，其实就在我们最初相遇的地方。”',
    '空气中弥漫着淡淡的气息，仿佛某种久远的记忆被悄然唤醒。\n\n他停顿了片刻，声音放得很轻：“有些事情，越是急于求成，越容易迷失方向。我们不妨顺着现在的线索，一步一步往前走。”',
  ],
};

class MockStoryServiceImpl implements StoryService {
  private activeStreams: Map<string, { abort: () => void; isDone: boolean }> = new Map();
  private listeners: Set<() => void> = new Set();
  private simulateErrorOnce = false;
  private simulateEmptyList = false;

  constructor() {
    this.sanitizeInterruptedStates();
  }

  // Ensure interrupted states upon reload don't remain stuck in "streaming"
  private sanitizeInterruptedStates() {
    try {
      const messagesMap = this.loadMessagesMap();
      let changed = false;
      for (const storyId in messagesMap) {
        const msgs = messagesMap[storyId];
        for (const msg of msgs) {
          if (msg.isStreaming) {
            msg.isStreaming = false;
            msg.isInterrupted = true;
            changed = true;
          }
        }
      }
      if (changed) {
        this.saveMessagesMap(messagesMap);
      }
    } catch (e) {
      console.warn('Sanitizing stored message states failed, falling back:', e);
    }
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in story service subscriber:', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private loadStories(): Story[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(INITIAL_STORIES));
        return INITIAL_STORIES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 0) {
        return parsed;
      }
      return INITIAL_STORIES;
    } catch (e) {
      console.error('Failed to parse stories from storage, restoring defaults:', e);
      return INITIAL_STORIES;
    }
  }

  private saveStories(stories: Story[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
    } catch (e) {
      console.error('Failed to save stories to storage:', e);
    }
    this.notify();
  }

  private loadMessagesMap(): Record<string, StoryMessage[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
        return INITIAL_MESSAGES;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse messages from storage, restoring defaults:', e);
      return INITIAL_MESSAGES;
    }
  }

  private saveMessagesMap(map: Record<string, StoryMessage[]>) {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(map));
    } catch (e) {
      console.error('Failed to save messages to storage:', e);
    }
    this.notify();
  }

  // --- Public StoryService Methods ---

  public async listStories(): Promise<Story[]> {
    if (this.simulateEmptyList) {
      return [];
    }
    const stories = this.loadStories();
    // Sort by latest updated first
    return [...stories].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async getStory(id: string): Promise<Story | null> {
    const stories = this.loadStories();
    return stories.find((s) => s.id === id) || null;
  }

  public async getMessages(storyId: string): Promise<StoryMessage[]> {
    const map = this.loadMessagesMap();
    return map[storyId] || [];
  }

  public async createStory(params: {
    characterName: string;
    setting: string;
    customTitle?: string;
  }): Promise<Story> {
    const id = `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const title =
      params.customTitle && params.customTitle.trim()
        ? params.customTitle.trim()
        : `与${params.characterName}的初遇`;

    // Subtle atmospheric accent color
    const colors = ['#625177', '#465870', '#566050', '#745353', '#496068'];
    const accentColor = colors[Math.floor(Math.random() * colors.length)];

    const newStory: Story = {
      id,
      title,
      characterName: params.characterName.trim(),
      personaSetting: params.setting.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSnippet: '',
      accentColor,
    };

    // Generate tailored atmospheric opening message based on character and setting
    let opening = '';
    const char = params.characterName.trim();
    if (char.includes('沈砚')) {
      opening = `雨声在老街的屋檐下滴答作响。旧书店的木门被推开时，发出熟悉的轻响。\n\n沈砚正站在长桌后翻阅一册旧图纸，听见声音微微抬头。他的眼眸清亮，目光落在你身上时带着一丝淡淡的关切：“伞放门边吧。这雨一时半会儿停不了，先进来坐。”`;
    } else {
      opening = `四周渐渐安静下来，光影在墙面上勾勒出柔和的轮廓。\n\n${char}站在不远处，神色沉静地注视着你。空气中弥漫着熟悉而微妙的气氛，仿佛长久的等待终于迎来了这一刻。\n\n“你来了。”${char}的声音在室内缓缓回荡，“有些话，或许现在说正合适。”`;
    }

    const openingMessage: StoryMessage = {
      id: `msg-${Date.now()}-open`,
      storyId: id,
      role: 'assistant',
      content: opening,
      candidates: [opening],
      activeCandidateIndex: 0,
      createdAt: Date.now(),
    };

    newStory.lastSnippet = opening.slice(0, 50).replace(/\n/g, ' ') + '...';

    const stories = this.loadStories();
    this.saveStories([newStory, ...stories]);

    const messagesMap = this.loadMessagesMap();
    messagesMap[id] = [openingMessage];
    this.saveMessagesMap(messagesMap);

    return newStory;
  }

  public async renameStory(storyId: string, newTitle: string): Promise<void> {
    const stories = this.loadStories();
    const target = stories.find((s) => s.id === storyId);
    if (!target) return;
    target.title = newTitle.trim();
    target.updatedAt = Date.now();
    this.saveStories(stories);
  }

  public async deleteStory(storyId: string): Promise<StoryBackup> {
    const stories = this.loadStories();
    const targetStory = stories.find((s) => s.id === storyId);
    if (!targetStory) throw new Error('故事不存在');

    const messagesMap = this.loadMessagesMap();
    const targetMessages = messagesMap[storyId] || [];

    // Stop active generation if running
    this.stopGeneration(storyId);

    // Remove from storage
    const remainingStories = stories.filter((s) => s.id !== storyId);
    this.saveStories(remainingStories);

    delete messagesMap[storyId];
    this.saveMessagesMap(messagesMap);

    return {
      story: targetStory,
      messages: targetMessages,
    };
  }

  public async restoreStory(backup: StoryBackup): Promise<void> {
    const stories = this.loadStories();
    // Prepend restored story
    this.saveStories([backup.story, ...stories.filter((s) => s.id !== backup.story.id)]);

    const messagesMap = this.loadMessagesMap();
    messagesMap[backup.story.id] = backup.messages;
    this.saveMessagesMap(messagesMap);
  }

  public isGenerating(storyId: string): boolean {
    const active = this.activeStreams.get(storyId);
    return !!active && !active.isDone;
  }

  public stopGeneration(storyId: string): void {
    const active = this.activeStreams.get(storyId);
    if (active) {
      active.abort();
      this.activeStreams.delete(storyId);
    }

    // Mark current streaming message as interrupted and persistent
    const messagesMap = this.loadMessagesMap();
    const msgs = messagesMap[storyId];
    if (msgs && msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
        lastMsg.isStreaming = false;
        lastMsg.isInterrupted = true;
        // Save current chunk into candidates
        if (lastMsg.candidates.length > lastMsg.activeCandidateIndex) {
          lastMsg.candidates[lastMsg.activeCandidateIndex] = lastMsg.content;
        }
        this.saveMessagesMap(messagesMap);
      }
    }
  }

  public async sendMessage(
    storyId: string,
    content: string,
    callbacks?: StreamCallbacks
  ): Promise<void> {
    if (!content.trim()) return;

    // Stop previous generation on this story if any
    this.stopGeneration(storyId);

    // 1. Append user message
    const userMsg: StoryMessage = {
      id: `msg-${Date.now()}-u`,
      storyId,
      role: 'user',
      content: content.trim(),
      candidates: [content.trim()],
      activeCandidateIndex: 0,
      createdAt: Date.now(),
    };

    const messagesMap = this.loadMessagesMap();
    const storyMessages = messagesMap[storyId] || [];
    storyMessages.push(userMsg);
    messagesMap[storyId] = storyMessages;
    this.saveMessagesMap(messagesMap);

    // Update story timestamp & last snippet
    const stories = this.loadStories();
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      story.updatedAt = Date.now();
      story.lastSnippet = content.trim().slice(0, 60);
      this.saveStories(stories);
    }

    // Check error simulation flag
    if (this.simulateErrorOnce) {
      this.simulateErrorOnce = false; // Reset after one trigger
      setTimeout(() => {
        const err = new Error('模拟网络连接异常：无法完成本次输出。您的输入已被保留，可点击重试。');
        callbacks?.onError?.(err);
      }, 500);
      return;
    }

    // 2. Prepare assistant placeholder and stream response
    await this.startStreamingResponse(storyId, story?.characterName || '沈砚', callbacks);
  }

  public async retryLastMessage(storyId: string, callbacks?: StreamCallbacks): Promise<void> {
    const messagesMap = this.loadMessagesMap();
    const msgs = messagesMap[storyId] || [];
    if (msgs.length === 0) return;

    // Check if the last message is already an interrupted or empty assistant message; if so, remove it
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.role === 'assistant') {
      msgs.pop();
      messagesMap[storyId] = msgs;
      this.saveMessagesMap(messagesMap);
    }

    const stories = this.loadStories();
    const story = stories.find((s) => s.id === storyId);

    await this.startStreamingResponse(storyId, story?.characterName || '沈砚', callbacks);
  }

  public async regenerateLatest(storyId: string, callbacks?: StreamCallbacks): Promise<void> {
    const messagesMap = this.loadMessagesMap();
    const msgs = messagesMap[storyId] || [];
    if (msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.role !== 'assistant') {
      return;
    }

    this.stopGeneration(storyId);

    const stories = this.loadStories();
    const story = stories.find((s) => s.id === storyId);

    // Create a new candidate slot
    lastMsg.isStreaming = true;
    lastMsg.isInterrupted = false;
    lastMsg.content = '';
    lastMsg.candidates.push('');
    lastMsg.activeCandidateIndex = lastMsg.candidates.length - 1;
    this.saveMessagesMap(messagesMap);

    await this.streamIntoExistingMessage(storyId, lastMsg.id, story?.characterName || '沈砚', callbacks);
  }

  private async startStreamingResponse(
    storyId: string,
    characterName: string,
    callbacks?: StreamCallbacks
  ): Promise<void> {
    const assistantMsg: StoryMessage = {
      id: `msg-${Date.now()}-a`,
      storyId,
      role: 'assistant',
      content: '',
      candidates: [''],
      activeCandidateIndex: 0,
      createdAt: Date.now(),
      isStreaming: true,
      isInterrupted: false,
    };

    const messagesMap = this.loadMessagesMap();
    const storyMessages = messagesMap[storyId] || [];
    storyMessages.push(assistantMsg);
    messagesMap[storyId] = storyMessages;
    this.saveMessagesMap(messagesMap);

    await this.streamIntoExistingMessage(storyId, assistantMsg.id, characterName, callbacks);
  }

  private async streamIntoExistingMessage(
    storyId: string,
    messageId: string,
    characterName: string,
    callbacks?: StreamCallbacks
  ): Promise<void> {
    // Pick tailored text
    const pool = SAMPLE_REPLIES[characterName] || SAMPLE_REPLIES['DEFAULT'];
    const chosenText = pool[Math.floor(Math.random() * pool.length)];

    let isAborted = false;
    let timerHandle: number | null = null;

    const abort = () => {
      isAborted = true;
      if (timerHandle !== null) {
        clearTimeout(timerHandle);
        timerHandle = null;
      }
    };

    this.activeStreams.set(storyId, { abort, isDone: false });

    // Stream by small chunks (simulating natural novel typing speed)
    let index = 0;
    const chunkSize = 2; // 2 characters per tick for smooth streaming
    const tickInterval = 35; // 35ms per tick

    const step = () => {
      if (isAborted) return;

      index += chunkSize;
      const currentChunk = chosenText.slice(0, index);
      const isFinished = index >= chosenText.length;

      // Update message in memory
      const messagesMap = this.loadMessagesMap();
      const msgs = messagesMap[storyId] || [];
      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.content = currentChunk;
        msg.candidates[msg.activeCandidateIndex] = currentChunk;
        if (isFinished) {
          msg.isStreaming = false;
          msg.isInterrupted = false;
        }
        this.saveMessagesMap(messagesMap);
      }

      // Update story snippet
      if (isFinished) {
        const stories = this.loadStories();
        const story = stories.find((s) => s.id === storyId);
        if (story) {
          story.lastSnippet = currentChunk.slice(0, 60).replace(/\n/g, ' ') + '...';
          story.updatedAt = Date.now();
          this.saveStories(stories);
        }
      }

      callbacks?.onChunk?.(currentChunk);

      if (isFinished) {
        const streamInfo = this.activeStreams.get(storyId);
        if (streamInfo) streamInfo.isDone = true;
        this.activeStreams.delete(storyId);
        callbacks?.onDone?.(currentChunk);
      } else {
        timerHandle = window.setTimeout(step, tickInterval);
      }
    };

    timerHandle = window.setTimeout(step, tickInterval);
  }

  public async switchCandidate(
    storyId: string,
    messageId: string,
    index: number
  ): Promise<void> {
    const messagesMap = this.loadMessagesMap();
    const msgs = messagesMap[storyId] || [];
    const target = msgs.find((m) => m.id === messageId);
    if (!target) return;
    if (index >= 0 && index < target.candidates.length) {
      target.activeCandidateIndex = index;
      target.content = target.candidates[index];
      this.saveMessagesMap(messagesMap);
    }
  }

  public async editMessage(
    storyId: string,
    messageId: string,
    newContent: string
  ): Promise<void> {
    const messagesMap = this.loadMessagesMap();
    const msgs = messagesMap[storyId] || [];
    const target = msgs.find((m) => m.id === messageId);
    if (!target) return;
    target.content = newContent;
    if (target.candidates.length > target.activeCandidateIndex) {
      target.candidates[target.activeCandidateIndex] = newContent;
    }
    this.saveMessagesMap(messagesMap);
  }

  // --- Reading Preferences ---

  public getPreferences(): ReadingPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
      if (!raw) {
        return { fontSize: 17, theme: 'light' };
      }
      return JSON.parse(raw);
    } catch {
      return { fontSize: 17, theme: 'light' };
    }
  }

  public updatePreferences(partial: Partial<ReadingPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...partial };
    try {
      localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save reading preferences:', e);
    }
    this.notify();
  }

  // --- Prototype / Demo States Control ---

  public async resetToDefaults(): Promise<void> {
    // Clear all active timers
    this.activeStreams.forEach((s) => s.abort());
    this.activeStreams.clear();
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(INITIAL_STORIES));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    this.simulateEmptyList = false;
    this.simulateErrorOnce = false;
    this.notify();
  }

  public setEmptyListSimulation(enabled: boolean): void {
    this.simulateEmptyList = enabled;
    this.notify();
  }

  public getEmptyListSimulation(): boolean {
    return this.simulateEmptyList;
  }

  public setSimulateErrorOnce(enabled: boolean): void {
    this.simulateErrorOnce = enabled;
  }

  public getSimulateErrorOnce(): boolean {
    return this.simulateErrorOnce;
  }
}

// Singleton export
export const mockStoryService: StoryService = new MockStoryServiceImpl();
