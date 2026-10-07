import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Menu,
  MoreVertical,
  Send,
  Square,
  RotateCcw,
  Copy,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sun,
  Moon,
  ArrowDown,
  AlertTriangle,
  Download,
  Info,
  Type,
} from 'lucide-react';
import {
  ReadingPreferences,
  Story,
  StoryMessage,
  StoryService,
} from '../../types/story';
import { copyToClipboard } from '../../utils/format';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { DemoToolsModal } from '../modals/DemoToolsModal';
import { StoryDrawer } from '../drawers/StoryDrawer';
import { RenameStoryModal } from '../modals/RenameStoryModal';

interface ChatViewProps {
  storyId: string;
  allStories: Story[];
  service: StoryService;
  onBackToBookshelf: () => void;
  onSwitchStory: (newStoryId: string) => void;
  onCreateNewStory: () => void;
  preferences: ReadingPreferences;
  onUpdatePreferences: (partial: Partial<ReadingPreferences>) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  storyId,
  allStories,
  service,
  onBackToBookshelf,
  onSwitchStory,
  onCreateNewStory,
  preferences,
  onUpdatePreferences,
}) => {
  const [story, setStory] = useState<Story | null>(null);
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // Message inline editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditTip, setShowEditTip] = useState(false);

  // Modals and Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDemoToolsOpen, setIsDemoToolsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);

  // Story switch guard when generating
  const [pendingSwitchStoryId, setPendingSwitchStoryId] = useState<string | null>(null);

  // Scroll tracking
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load active story and messages
  const loadData = useCallback(async () => {
    const s = await service.getStory(storyId);
    setStory(s);
    const msgs = await service.getMessages(storyId);
    setMessages(msgs);
    setIsGenerating(service.isGenerating(storyId));
  }, [service, storyId]);

  useEffect(() => {
    loadData();
    const unsubscribe = service.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData, service]);

  // Handle scroll detection: do not auto-scroll if user is reading previous text
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsUserScrolledUp(distanceToBottom > 100);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setIsUserScrolledUp(false);
  };

  // Adjust textarea auto-grow
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [inputValue]);

  // Direct Font Size Controls (1-tap accessible on mobile header)
  const FONT_SIZES = [15, 17, 19, 21];

  const handleDecreaseFont = () => {
    const idx = FONT_SIZES.indexOf(preferences.fontSize);
    if (idx > 0) {
      onUpdatePreferences({ fontSize: FONT_SIZES[idx - 1] });
    }
  };

  const handleIncreaseFont = () => {
    const idx = FONT_SIZES.indexOf(preferences.fontSize);
    if (idx >= 0 && idx < FONT_SIZES.length - 1) {
      onUpdatePreferences({ fontSize: FONT_SIZES[idx + 1] });
    } else if (idx === -1) {
      onUpdatePreferences({ fontSize: 19 });
    }
  };

  const handleToggleTheme = () => {
    onUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  // Guard when switching stories while generating
  const attemptSwitchStory = (newTargetStoryId: string) => {
    if (newTargetStoryId === storyId) {
      setIsDrawerOpen(false);
      return;
    }
    if (isGenerating) {
      setPendingSwitchStoryId(newTargetStoryId);
    } else {
      onSwitchStory(newTargetStoryId);
    }
  };

  const confirmSwitchAndStop = () => {
    service.stopGeneration(storyId);
    setIsGenerating(false);
    if (pendingSwitchStoryId) {
      const target = pendingSwitchStoryId;
      setPendingSwitchStoryId(null);
      onSwitchStory(target);
    }
  };

  // Send message handler
  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const text = inputValue.trim();
    setInputValue('');
    setErrorMessage(null);
    setIsGenerating(true);

    // Initial smooth scroll
    setTimeout(() => scrollToBottom('smooth'), 40);

    try {
      await service.sendMessage(storyId, text, {
        onChunk: () => {
          if (!isUserScrolledUp) {
            scrollToBottom('auto');
          }
        },
        onDone: () => {
          setIsGenerating(false);
          loadData();
        },
        onError: (err) => {
          setIsGenerating(false);
          setErrorMessage(err.message || '生成中断，请稍后重试');
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || '发送失败');
    }
  };

  // Stop active generation
  const handleStop = () => {
    service.stopGeneration(storyId);
    setIsGenerating(false);
    loadData();
  };

  // Regenerate latest AI response
  const handleRegenerate = async () => {
    if (isGenerating) return;
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      await service.regenerateLatest(storyId, {
        onChunk: () => {
          if (!isUserScrolledUp) {
            scrollToBottom('auto');
          }
        },
        onDone: () => {
          setIsGenerating(false);
          loadData();
        },
        onError: (err) => {
          setIsGenerating(false);
          setErrorMessage(err.message || '重新生成失败');
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || '重新生成异常');
    }
  };

  // Retry last failed generation without duplicating user message
  const handleRetry = async () => {
    if (isGenerating) return;
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      await service.retryLastMessage(storyId, {
        onChunk: () => {
          if (!isUserScrolledUp) {
            scrollToBottom('auto');
          }
        },
        onDone: () => {
          setIsGenerating(false);
          loadData();
        },
        onError: (err) => {
          setIsGenerating(false);
          setErrorMessage(err.message || '重试失败');
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || '重试异常');
    }
  };

  // Edit message
  const startEdit = (msg: StoryMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setShowEditTip(true);
  };

  const saveEdit = async () => {
    if (!editingMessageId) return;
    await service.editMessage(storyId, editingMessageId, editContent);
    setEditingMessageId(null);
    setShowEditTip(false);
    loadData();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setShowEditTip(false);
  };

  // Copy message text
  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopySuccessId(id);
      setTimeout(() => setCopySuccessId(null), 2000);
    }
  };

  // Switch candidate variation
  const handleSwitchCandidate = async (messageId: string, index: number) => {
    await service.switchCandidate(storyId, messageId, index);
    loadData();
  };

  // Export novel transcript as readable TXT
  const handleExportText = () => {
    if (!story) return;
    let transcript = `《${story.title}》\n角色：${story.characterName}\n\n`;
    messages.forEach((m) => {
      if (m.role === 'assistant') {
        transcript += `【${story.characterName}】\n${m.content}\n\n`;
      } else if (m.role === 'user') {
        transcript += `【我】\n${m.content}\n\n`;
      }
    });

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title}_阅读记录.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setMoreMenuOpen(false);
  };

  // Keydown handler: Desktop Enter sends, Shift+Enter breaks line, ignores IME composition
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find index of latest assistant message for "重新生成" eligibility
  const latestAssistantMsgIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors overflow-hidden">
      {/* Top Mobile-First Reading Navigation Bar */}
      <header className="shrink-0 h-14 border-b border-[var(--border-light)] bg-[var(--header-bg)] backdrop-blur-md z-30 px-2 sm:px-4">
        <div className="max-w-[760px] mx-auto h-full flex items-center justify-between gap-1">
          {/* Left: Back & Drawer & Story Info */}
          <div className="flex items-center gap-1 min-w-0">
            {/* Back button */}
            <button
              onClick={onBackToBookshelf}
              aria-label="返回故事书架"
              className="h-10 w-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Quick Drawer trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="打开故事抽屉"
              className="h-10 w-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Story Title & Character Info */}
            <div className="min-w-0 ml-0.5 max-w-[120px] sm:max-w-[200px]">
              <h1 className="font-serif text-sm font-semibold text-[var(--text-main)] truncate leading-tight">
                {story?.title || '未完的故事'}
              </h1>
              <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5">
                <span>{story?.characterName || '沈砚'}</span>
              </div>
            </div>
          </div>

          {/* Right: Intuitive OUTSIDE Controls (Font Stepper + Day/Night Toggle + More) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Direct Font Size Stepper Pill (Placed on the outside for instant 1-tap adjustment) */}
            <div className="relative flex items-center rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] p-0.5 shadow-xs">
              <button
                onClick={handleDecreaseFont}
                disabled={preferences.fontSize <= 15}
                aria-label="缩小字号"
                className="h-8 w-7 rounded-full flex items-center justify-center text-xs font-serif font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] hover:text-[var(--brand-primary)] disabled:opacity-25 active:scale-90 transition-all cursor-pointer"
              >
                A⁻
              </button>

              <button
                onClick={() => setFontMenuOpen(!fontMenuOpen)}
                aria-label="字号选项"
                className="px-1 text-[11px] font-mono font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                title="选择字号"
              >
                {preferences.fontSize}
              </button>

              <button
                onClick={handleIncreaseFont}
                disabled={preferences.fontSize >= 21}
                aria-label="放大字号"
                className="h-8 w-7 rounded-full flex items-center justify-center text-sm font-serif font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] hover:text-[var(--brand-primary)] disabled:opacity-25 active:scale-90 transition-all cursor-pointer"
              >
                A⁺
              </button>

              {/* Quick Font Size Selector Popover */}
              {fontMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFontMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 p-1.5 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-xl animate-fadeIn flex flex-col gap-1 w-28">
                    <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] font-medium">
                      选择字号
                    </div>
                    {FONT_SIZES.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          onUpdatePreferences({ fontSize: sz });
                          setFontMenuOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                          preferences.fontSize === sz
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'hover:bg-[var(--bg-surface-subtle)]'
                        }`}
                      >
                        <span className="font-serif">
                          {sz === 15 ? '紧凑' : sz === 17 ? '标准' : sz === 19 ? '舒展' : '大号'}
                        </span>
                        <span className="text-[10px] opacity-75">{sz}px</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 2. Direct Day / Night Mode Toggle (Placed on the outside for instant 1-tap toggle) */}
            <button
              onClick={handleToggleTheme}
              aria-label={preferences.theme === 'dark' ? '切换为浅色日间模式' : '切换为深色夜间模式'}
              className="h-9 w-9 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-main)] hover:text-[var(--brand-primary)] active:scale-90 transition-all shadow-xs cursor-pointer"
              title={preferences.theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--brand-primary)]" />
              )}
            </button>

            {/* 3. More options dropdown (Rename, Export, Demo tools) */}
            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-label="更多操作"
                className="h-9 w-9 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl p-1.5 bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-xl z-50 text-xs animate-fadeIn">
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setIsRenameOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      <span>重命名故事</span>
                    </button>
                    <button
                      onClick={handleExportText}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      <span>导出纯文本</span>
                    </button>
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setIsDemoToolsOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      <span>原型测试工具</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Reading Flow Canvas (Optimized for Mobile Phone Reading) */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-6 custom-scrollbar relative"
      >
        <div className="max-w-[720px] mx-auto min-h-full flex flex-col justify-between">
          {/* Messages Sequence */}
          <div className="space-y-5 sm:space-y-7 pb-20 sm:pb-24">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const isLatestAssistant = index === latestAssistantMsgIndex;
              const hasCandidates = msg.candidates && msg.candidates.length > 1;
              const isEditingThis = editingMessageId === msg.id;

              return (
                <article
                  key={msg.id}
                  className={`relative group transition-opacity ${
                    isAssistant
                      ? 'pt-1'
                      : 'py-3 px-4 rounded-3xl bg-[var(--user-bg)] border border-[var(--user-border)] shadow-xs ml-4 sm:ml-12'
                  }`}
                >
                  {/* Subtle speaker cue */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 select-none">
                    <div className="flex items-center gap-2 font-medium">
                      <span
                        className={
                          isAssistant
                            ? 'font-serif text-[var(--brand-primary)] text-sm font-semibold'
                            : 'text-[var(--text-main)]'
                        }
                      >
                        {isAssistant ? story?.characterName || '沈砚' : '我'}
                      </span>
                      {msg.isInterrupted && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-normal">
                          已停止（保留片段）
                        </span>
                      )}
                    </div>

                    {/* Candidates switcher for assistant messages (< 1/3 >) */}
                    {isAssistant && hasCandidates && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 rounded-full border border-[var(--border-light)]">
                        <button
                          disabled={msg.activeCandidateIndex <= 0}
                          onClick={() => handleSwitchCandidate(msg.id, msg.activeCandidateIndex - 1)}
                          className="p-1 hover:text-[var(--text-main)] disabled:opacity-25 active:scale-90 transition-transform cursor-pointer"
                          aria-label="上一候选"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>
                          {msg.activeCandidateIndex + 1}/{msg.candidates.length}
                        </span>
                        <button
                          disabled={msg.activeCandidateIndex >= msg.candidates.length - 1}
                          onClick={() => handleSwitchCandidate(msg.id, msg.activeCandidateIndex + 1)}
                          className="p-1 hover:text-[var(--text-main)] disabled:opacity-25 active:scale-90 transition-transform cursor-pointer"
                          aria-label="下一候选"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Prose Content or Inline Editor */}
                  {isEditingThis ? (
                    <div className="mt-2 space-y-2.5">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3.5 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm leading-relaxed resize-none min-h-[130px] focus:outline-hidden focus:border-[var(--brand-primary)] custom-scrollbar"
                      />
                      {showEditTip && (
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 px-1">
                          <Info className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                          <span>后面的回复不会自动重写</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          onClick={cancelEdit}
                          className="min-h-[42px] px-4 py-1.5 rounded-full border border-[var(--border-light)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          onClick={saveEdit}
                          className="min-h-[42px] px-5 py-1.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                        >
                          保存修改
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Continuous novel reading typography */
                    <div
                      className={`novel-reading-font text-[var(--text-main)] text-left whitespace-pre-wrap select-text leading-[1.85] tracking-wide ${
                        isAssistant ? '' : 'italic opacity-95'
                      }`}
                      style={{ fontSize: `${preferences.fontSize}px` }}
                    >
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--brand-primary)] animate-pulse align-middle" />
                      )}
                    </div>
                  )}

                  {/* Message Action Bar (Refined Rounded Tactile Pills) */}
                  {!isEditingThis && !msg.isStreaming && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] select-none">
                      {/* Copy Pill */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="h-8 px-2.5 rounded-full flex items-center gap-1 bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                        aria-label="复制段落"
                      >
                        {copySuccessId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>复制</span>
                          </>
                        )}
                      </button>

                      {/* Edit Pill */}
                      <button
                        onClick={() => startEdit(msg)}
                        className="h-8 px-2.5 rounded-full flex items-center gap-1 bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                        aria-label="编辑段落"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>编辑</span>
                      </button>

                      {/* Regenerate Pill (ONLY for latest AI message) */}
                      {isAssistant && isLatestAssistant && !isGenerating && (
                        <button
                          onClick={handleRegenerate}
                          className="h-8 px-3 rounded-full flex items-center gap-1 bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-medium border border-[var(--brand-primary)]/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                          aria-label="重新生成本条回复"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>重新生成</span>
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {/* Error Notification Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <div className="font-medium">生成异常</div>
                    <div className="mt-0.5 text-rose-700/80 dark:text-rose-400">
                      {errorMessage}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRetry}
                  className="min-h-[40px] shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>立即重试</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating "回到最新" Button (Visible when user scrolled up) */}
        {isUserScrolledUp && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2 rounded-full shadow-lg bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-95 active:scale-95 transition-all cursor-pointer animate-bounce"
            aria-label="滚动回到最新消息"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>回到最新</span>
          </button>
        )}
      </main>

      {/* Bottom Floating Rounded Dock for Mobile Typing */}
      <footer className="shrink-0 p-2.5 sm:p-4 z-20 pb-[max(0.65rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)] to-transparent">
        <div className="max-w-[720px] mx-auto">
          <div className="rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-md p-1.5 sm:p-2 flex items-end gap-2 transition-all focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/15">
            {/* Auto-resizing textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isGenerating
                  ? `${story?.characterName || '沈砚'} 正在续写故事…`
                  : '继续接上故事，描写动作或对白…'
              }
              disabled={isGenerating}
              className="flex-1 bg-transparent text-[var(--text-main)] text-sm leading-relaxed resize-none px-3 py-2 focus:outline-hidden placeholder-[var(--text-subtle)] max-h-32 custom-scrollbar min-h-[40px]"
            />

            {/* Circular Send / Stop Action Button */}
            {isGenerating ? (
              <button
                onClick={handleStop}
                aria-label="停止生成"
                className="h-10 w-10 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 active:scale-90 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="发送消息"
                className="h-10 w-10 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center hover:opacity-95 active:scale-90 disabled:opacity-30 disabled:hover:opacity-30 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Drawer for Story Switching */}
      <StoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        stories={allStories}
        activeStoryId={storyId}
        onSelectStory={attemptSwitchStory}
        onCreateNew={() => {
          setIsDrawerOpen(false);
          onCreateNewStory();
        }}
      />

      {/* Demo Tools Modal */}
      <DemoToolsModal
        isOpen={isDemoToolsOpen}
        onClose={() => setIsDemoToolsOpen(false)}
        service={service}
        onReloadRequested={loadData}
      />

      {/* Rename Story Modal */}
      <RenameStoryModal
        isOpen={isRenameOpen}
        story={story}
        onClose={() => setIsRenameOpen(false)}
        onSave={async (id, title) => {
          await service.renameStory(id, title);
          loadData();
        }}
      />

      {/* Story Switch Guard Dialog */}
      <ConfirmDialog
        isOpen={!!pendingSwitchStoryId}
        title="当前故事正在生成中"
        message="切换故事将停止当前故事的生成，并为您保存已生成的片段。是否确认停止并切换？"
        confirmLabel="停止并切换"
        cancelLabel="继续留在当前故事"
        onConfirm={confirmSwitchAndStop}
        onCancel={() => setPendingSwitchStoryId(null)}
      />
    </div>
  );
};
