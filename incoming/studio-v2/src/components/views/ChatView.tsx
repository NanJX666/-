import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Menu,
  MoreVertical,
  Send,
  Square,
  RotateCcw,
  Sliders,
  Sun,
  Moon,
  ArrowDown,
  AlertTriangle,
  Download,
  Type,
  X,
  FileText,
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
import { MockMessageList } from './MockMessageList';

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
  const [editError, setEditError] = useState<string | null>(null);

  // Modals, Drawer and Popover state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDemoToolsOpen, setIsDemoToolsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [fontPanelOpen, setFontPanelOpen] = useState(false);
  const [titleDetailOpen, setTitleDetailOpen] = useState(false);
  const [showRichLayoutSample, setShowRichLayoutSample] = useState(false);

  // Navigation guard state: unified for exiting, switching, and creating
  const [pendingNavAction, setPendingNavAction] = useState<
    | { type: 'switch'; targetStoryId: string }
    | { type: 'back' }
    | { type: 'create' }
    | null
  >(null);
  const [guardDialogState, setGuardDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '确认',
    onConfirm: () => {},
  });

  // Scroll tracking with Ref to prevent stale closures during rapid stream chunks
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load active story and messages
  const loadData = useCallback(async () => {
    try {
      const s = await service.getStory(storyId);
      setStory(s);
      const msgs = await service.getMessages(storyId);
      setMessages(msgs);
      setIsGenerating(service.isGenerating(storyId));
    } catch (err: any) {
      setErrorMessage('读取故事历史记录失败，请点击重试。');
    }
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

  // Window beforeunload guard for unsaved active states
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating || editingMessageId !== null) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGenerating, editingMessageId]);

  // Live scroll position check: distance to bottom > 120px counts as user scrolled up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledUp = distanceToBottom > 120;
    isUserScrolledUpRef.current = scrolledUp;
    setIsUserScrolledUp(scrolledUp);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
  };

  // Adjust textarea auto-grow
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [inputValue]);

  // Direct Font Size Options
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

  // Unified Navigation Guard implementation
  const executeNav = (action: { type: 'switch'; targetStoryId: string } | { type: 'back' } | { type: 'create' }) => {
    if (action.type === 'switch') {
      onSwitchStory(action.targetStoryId);
    } else if (action.type === 'back') {
      onBackToBookshelf();
    } else if (action.type === 'create') {
      onCreateNewStory();
    }
  };

  const triggerGuardedNavigation = (
    action: { type: 'switch'; targetStoryId: string } | { type: 'back' } | { type: 'create' }
  ) => {
    // If generating: warn to stop first and preserve chunks
    if (isGenerating) {
      setPendingNavAction(action);
      setGuardDialogState({
        isOpen: true,
        title: '正在生成故事回复',
        message: '离开将立即停止生成并为您保存已生成的片段。是否确认停止并离开？',
        confirmLabel: '停止并离开',
        onConfirm: () => {
          service.stopGeneration(storyId);
          setIsGenerating(false);
          setGuardDialogState((prev) => ({ ...prev, isOpen: false }));
          executeNav(action);
        },
      });
      return;
    }

    // If unsaved edit exists: warn user
    if (editingMessageId !== null) {
      setPendingNavAction(action);
      setGuardDialogState({
        isOpen: true,
        title: '有未保存的编辑内容',
        message: '您有尚未保存的消息修改。如果现在离开，未保存的修改将会丢失。是否确认放弃修改？',
        confirmLabel: '放弃修改并离开',
        onConfirm: () => {
          setEditingMessageId(null);
          setEditContent('');
          setGuardDialogState((prev) => ({ ...prev, isOpen: false }));
          executeNav(action);
        },
      });
      return;
    }

    // Normal safe navigation
    executeNav(action);
  };

  // Send message handler with draft preservation on error
  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const textToSend = inputValue.trim();
    // Temporarily clear input, but keep backup draft in case of failure
    setInputValue('');
    setErrorMessage(null);
    setIsGenerating(true);

    // Initial smooth scroll
    setTimeout(() => scrollToBottom('smooth'), 40);

    try {
      await service.sendMessage(storyId, textToSend, {
        onChunk: () => {
          // Live check: never pull user down if they scrolled up!
          if (!isUserScrolledUpRef.current) {
            scrollToBottom('auto');
          }
        },
        onDone: () => {
          setIsGenerating(false);
          loadData();
        },
        onError: (err) => {
          setIsGenerating(false);
          // Restore draft so user text is never lost!
          setInputValue(textToSend);
          setErrorMessage(err.message || '生成中断，输入草稿已恢复，可直接重试。');
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      setInputValue(textToSend);
      setErrorMessage(err.message || '发送失败，输入草稿已为您保留。');
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
          if (!isUserScrolledUpRef.current) {
            scrollToBottom('auto');
          }
        },
        onDone: () => {
          setIsGenerating(false);
          loadData();
        },
        onError: (err) => {
          setIsGenerating(false);
          setErrorMessage(err.message || '重新生成失败，历史候选已保留。');
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || '重新生成异常，历史候选已保留。');
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
          if (!isUserScrolledUpRef.current) {
            scrollToBottom('auto');
          }
        },
        onDone: () => {
          setIsGenerating(false);
          loadData();
        },
        onError: (err) => {
          setIsGenerating(false);
          setErrorMessage(err.message || '重试失败，请稍后再次重试。');
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || '重试异常。');
    }
  };

  // Edit message handlers with error preservation
  const startEdit = (msg: StoryMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setShowEditTip(true);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingMessageId) return;
    try {
      await service.editMessage(storyId, editingMessageId, editContent);
      setEditingMessageId(null);
      setShowEditTip(false);
      setEditError(null);
      loadData();
    } catch (err: any) {
      setEditError('保存修改失败，草稿已保留在编辑器中。');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setShowEditTip(false);
    setEditError(null);
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

  // Keyboard handler: Enter produces newline on mobile; Ctrl/Cmd+Enter sends
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME composition protection: do not trigger on pin/yin or keyCode 229
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    // Ctrl+Enter or Cmd+Enter to send on desktop
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Note: Standard Enter naturally creates a newline without sending!
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors overflow-hidden">
      {/* 手机重排顶栏：保留足够标题宽度，外置字号与日夜切换，触控目标全部 >= 44x44px */}
      <header className="shrink-0 h-14 border-b border-[var(--border-light)] bg-[var(--header-bg)] backdrop-blur-md z-30 px-2 sm:px-4">
        <div className="max-w-[760px] mx-auto h-full flex items-center justify-between gap-1">
          {/* 左侧：返回书架 + 抽屉菜单 + 展开标题 */}
          <div className="flex items-center gap-1 min-w-0 flex-1 mr-2">
            {/* 返回按钮 (44x44px 触控区) */}
            <button
              type="button"
              onClick={() => triggerGuardedNavigation({ type: 'back' })}
              aria-label="返回故事书架"
              className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* 抽屉按钮 (44x44px 触控区) */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="打开故事书架抽屉"
              className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 故事标题：点击可查看完整详情，给足 180~220px 宽度 */}
            <button
              type="button"
              onClick={() => setTitleDetailOpen(true)}
              className="text-left min-w-0 py-1 px-1 rounded-xl hover:bg-[var(--bg-surface-subtle)]/70 active:scale-95 transition-all cursor-pointer max-w-[200px] sm:max-w-xs"
              title="点击查看故事详情与完整设定"
            >
              <h1 className="font-serif text-sm font-semibold text-[var(--text-main)] truncate leading-tight">
                {story?.title || '未完的故事'}
              </h1>
              <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5">
                <span className="font-medium text-[var(--brand-primary)]">
                  {story?.characterName || '沈砚'}
                </span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span className="text-[10px] opacity-80">查看详情</span>
              </div>
            </button>
          </div>

          {/* 右侧操作区：日夜切换 + 独立字号面板 + 更多菜单 (全部 >= 44x44px 触控目标) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 字号设置快速触控胶囊 (44x44px) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFontPanelOpen(!fontPanelOpen)}
                aria-label="阅读字号调节"
                className="touch-target-44 h-11 px-2.5 rounded-full flex items-center gap-1 border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-main)] hover:text-[var(--brand-primary)] active:scale-95 transition-all shadow-xs cursor-pointer text-xs"
                title="调整字号"
              >
                <Type className="w-4 h-4 text-[var(--brand-primary)]" />
                <span className="font-mono text-xs">{preferences.fontSize}</span>
              </button>

              {/* 字号面板悬浮弹出层 */}
              {fontPanelOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFontPanelOpen(false)}
                  />
                  <div
                    role="region"
                    aria-label="字号调整面板"
                    className="absolute right-0 top-12 z-50 p-3 rounded-3xl bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-2xl animate-fadeIn w-56 space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--border-light)] text-xs text-[var(--text-muted)] font-medium">
                      <span>正文字号调节</span>
                      <span className="font-mono">{preferences.fontSize}px</span>
                    </div>

                    {/* 步进按钮 */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleDecreaseFont}
                        disabled={preferences.fontSize <= 15}
                        className="touch-target-44 flex-1 h-11 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] font-serif text-sm font-medium hover:text-[var(--brand-primary)] disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                        aria-label="缩小字号"
                      >
                        A⁻ 缩小
                      </button>
                      <button
                        type="button"
                        onClick={handleIncreaseFont}
                        disabled={preferences.fontSize >= 21}
                        className="touch-target-44 flex-1 h-11 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] font-serif text-sm font-medium hover:text-[var(--brand-primary)] disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                        aria-label="放大字号"
                      >
                        A⁺ 放大
                      </button>
                    </div>

                    {/* 快捷档位 */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {FONT_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            onUpdatePreferences({ fontSize: sz });
                            setFontPanelOpen(false);
                          }}
                          className={`h-9 rounded-xl text-xs font-medium transition-colors ${
                            preferences.fontSize === sz
                              ? 'bg-[var(--brand-primary)] text-white'
                              : 'bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-light)]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 白天/黑夜模式直接外置切换按钮 (44x44px 触控目标) */}
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={preferences.theme === 'dark' ? '切换为浅色日间模式' : '切换为深色夜间模式'}
              className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-main)] hover:text-[var(--brand-primary)] active:scale-90 transition-all shadow-xs cursor-pointer"
              title={preferences.theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--brand-primary)]" />
              )}
            </button>

            {/* 更多菜单 (44x44px 触控目标) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-label="更多操作菜单"
                className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-all cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {moreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMoreMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-3xl p-1.5 bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-2xl z-50 text-xs animate-fadeIn space-y-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setIsRenameOpen(true);
                      }}
                      className="touch-target-44 w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Type className="w-4 h-4 text-[var(--brand-primary)]" />
                      <span>重命名故事</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleExportText}
                      className="touch-target-44 w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[var(--brand-primary)]" />
                      <span>导出纯文本</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setShowRichLayoutSample(!showRichLayoutSample);
                      }}
                      className="touch-target-44 w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[var(--brand-primary)]" />
                      <span>{showRichLayoutSample ? '隐藏布局样本' : '显示排版样本'}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setIsDemoToolsOpen(true);
                      }}
                      className="touch-target-44 w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-[var(--brand-primary)]" />
                      <span>原型测试工具</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主阅读流水正文区 */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="小说对话正文流"
        className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-6 custom-scrollbar relative focus-visible:outline-none"
      >
        <div className="max-w-[720px] mx-auto min-h-full flex flex-col justify-between">
          <div className="pb-28">
            {/* 消息正文组件：职责分离，纯前端 Mock 消息展示 */}
            <MockMessageList
              messages={messages}
              characterName={story?.characterName || '沈砚'}
              fontSize={preferences.fontSize}
              editingMessageId={editingMessageId}
              editContent={editContent}
              showEditTip={showEditTip}
              isGenerating={isGenerating}
              copySuccessId={copySuccessId}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onChangeEditContent={(val) => setEditContent(val)}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
              onSwitchCandidate={handleSwitchCandidate}
              showRichLayoutSample={showRichLayoutSample}
            />

            {/* 编辑保存异常提示 */}
            {editError && (
              <div
                role="alert"
                className="mt-4 p-3.5 rounded-2xl readable-alert-error border text-xs flex items-center justify-between"
              >
                <span>{editError}</span>
                <button
                  type="button"
                  onClick={() => setEditError(null)}
                  className="p-1 opacity-70 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 错误提示横幅 (保留草稿与重试，高对比度主题兼容) */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-6 p-4 rounded-3xl readable-alert-error border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <div className="font-medium text-sm">生成或发送异常</div>
                    <div className="mt-0.5 opacity-90 leading-relaxed">
                      {errorMessage}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="touch-target-44 min-h-[44px] shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>立即重试</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 浮动“回到最新”按钮：静止不弹跳，只有主动点击后恢复跟随 */}
        {isUserScrolledUp && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="steady-jump-latest fixed bottom-28 left-1/2 -translate-x-1/2 z-20 touch-target-44 min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-full shadow-xl bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            aria-label="滚动回到最新消息"
          >
            <ArrowDown className="w-4 h-4" />
            <span>回到最新</span>
          </button>
        )}
      </main>

      {/* 底部悬浮输入坞：手机 Enter 换行，按钮发送，不抢滚动 */}
      <footer className="shrink-0 p-2.5 sm:p-4 z-20 mobile-bottom-safe bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)] to-transparent">
        <div className="max-w-[720px] mx-auto">
          <div className="rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-md p-2 flex items-end gap-2 transition-all focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/15">
            {/* 多行输入框：Enter 换行，Ctrl+Enter 发送 */}
            <label htmlFor="chat-message-input" className="sr-only">
              输入对话内容
            </label>
            <textarea
              id="chat-message-input"
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isGenerating
                  ? `${story?.characterName || '沈砚'} 正在续写…`
                  : '写下你的动作或对话… (Enter 换行，点击发送)'
              }
              disabled={isGenerating}
              className="flex-1 bg-transparent text-[var(--text-main)] text-sm leading-relaxed resize-none px-3 py-2.5 focus:outline-hidden placeholder-[var(--text-subtle)] max-h-32 custom-scrollbar min-h-[44px]"
            />

            {/* 圆形发送 / 停止操作按钮 (44x44px 触控目标) */}
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                aria-label="停止生成"
                className="touch-target-44 w-11 h-11 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 active:scale-90 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="发送消息"
                className="touch-target-44 w-11 h-11 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center hover:opacity-95 active:scale-90 disabled:opacity-30 disabled:hover:opacity-30 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* 故事详情查看面板 (点击顶栏标题即可打开) */}
      {titleDetailOpen && story && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-detail-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setTitleDetailOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-light)] max-h-[85vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
              <h2 id="story-detail-modal-title" className="font-serif text-base font-semibold">
                故事档案详情
              </h2>
              <button
                type="button"
                onClick={() => setTitleDetailOpen(false)}
                className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90"
                aria-label="关闭详情"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block">故事标题</span>
                <span className="font-serif text-sm font-medium mt-0.5 block">{story.title}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">角色名字</span>
                <span className="font-medium mt-0.5 block text-[var(--brand-primary)]">{story.characterName}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">自由设定</span>
                <p className="mt-1 p-3 rounded-2xl bg-[var(--bg-surface-subtle)] text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                  {story.personaSetting}
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--border-light)] flex justify-end">
              <button
                type="button"
                onClick={() => setTitleDetailOpen(false)}
                className="touch-target-44 min-h-[44px] px-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 故事抽屉：快捷切换故事 */}
      <StoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        stories={allStories}
        activeStoryId={storyId}
        onSelectStory={(targetId) => {
          setIsDrawerOpen(false);
          triggerGuardedNavigation({ type: 'switch', targetStoryId: targetId });
        }}
        onCreateNew={() => {
          setIsDrawerOpen(false);
          triggerGuardedNavigation({ type: 'create' });
        }}
      />

      {/* 原型测试工具模态框 */}
      <DemoToolsModal
        isOpen={isDemoToolsOpen}
        onClose={() => setIsDemoToolsOpen(false)}
        service={service}
        onReloadRequested={loadData}
      />

      {/* 重命名模态框 */}
      <RenameStoryModal
        isOpen={isRenameOpen}
        story={story}
        onClose={() => setIsRenameOpen(false)}
        onSave={async (id, title) => {
          await service.renameStory(id, title);
          loadData();
        }}
      />

      {/* 统一导航守卫对话框 (生成中退出或未保存修改) */}
      <ConfirmDialog
        isOpen={guardDialogState.isOpen}
        title={guardDialogState.title}
        message={guardDialogState.message}
        confirmLabel={guardDialogState.confirmLabel}
        cancelLabel="留在本故事"
        onConfirm={guardDialogState.onConfirm}
        onCancel={() => {
          setGuardDialogState((prev) => ({ ...prev, isOpen: false }));
          setPendingNavAction(null);
        }}
      />
    </div>
  );
};
