import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  MoreVertical,
  Play,
  Edit2,
  Trash2,
  Sliders,
  Sun,
  Moon,
  ArrowRight,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { APP_CONFIG } from '../../constants/config';
import {
  ReadingPreferences,
  Story,
  StoryBackup,
  StoryService,
} from '../../types/story';
import { formatRelativeTime } from '../../utils/format';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { RenameStoryModal } from '../modals/RenameStoryModal';
import { UndoToast } from '../common/UndoToast';

interface StoryListViewProps {
  stories: Story[];
  service: StoryService;
  preferences: ReadingPreferences;
  onUpdatePreferences: (partial: Partial<ReadingPreferences>) => void;
  onOpenStory: (storyId: string) => void;
  onCreateStory: () => void;
  onOpenDemoTools: () => void;
  onReload: () => void;
  onLogout?: () => void;
  currentUser?: string;
}

export const StoryListView: React.FC<StoryListViewProps> = ({
  stories,
  service,
  preferences,
  onUpdatePreferences,
  onOpenStory,
  onCreateStory,
  onOpenDemoTools,
  onReload,
  onLogout,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Rename modal state
  const [renamingStory, setRenamingStory] = useState<Story | null>(null);

  // Delete confirm dialog state
  const [deletingStory, setDeletingStory] = useState<Story | null>(null);

  // Undo deletion state
  const [undoBackup, setUndoBackup] = useState<StoryBackup | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  // Component-side operation error feedback
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filtered stories by search query
  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) return stories;
    const q = searchQuery.toLowerCase().trim();
    return stories.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.characterName.toLowerCase().includes(q) ||
        s.lastSnippet.toLowerCase().includes(q)
    );
  }, [stories, searchQuery]);

  // The latest active story for "继续上次故事" entry
  const lastActiveStory = stories.length > 0 ? stories[0] : null;

  const handleStartDelete = (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setDeletingStory(story);
  };

  const confirmDelete = async () => {
    if (!deletingStory) return;
    try {
      setOperationError(null);
      const backup = await service.deleteStory(deletingStory.id);
      setUndoBackup(backup);
      setUndoToastVisible(true);
      setDeletingStory(null);
      onReload();
    } catch (err: any) {
      setOperationError(err?.message || '删除故事失败，请重试。');
      setDeletingStory(null);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoBackup) return;
    try {
      setOperationError(null);
      await service.restoreStory(undoBackup);
      setUndoToastVisible(false);
      setUndoBackup(null);
      onReload();
    } catch (err: any) {
      setOperationError('恢复故事失败，请重试。');
    }
  };

  const handleSaveRename = async (storyId: string, newTitle: string) => {
    try {
      setOperationError(null);
      await service.renameStory(storyId, newTitle);
      onReload();
    } catch (err: any) {
      setOperationError('重命名故事失败，请重试。');
    }
  };

  const handleToggleTheme = () => {
    onUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
      {/* 顶部移动端导航栏 (44x44px 触控目标) */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-light)] bg-[var(--header-bg)] backdrop-blur-md px-3 sm:px-6">
        <div className="max-w-2xl mx-auto h-14 flex items-center justify-between gap-2">
          {/* Logo 与产品名 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center text-white font-serif font-bold text-xs shadow-xs">
              未
            </div>
            <div>
              <span className="font-serif tracking-widest text-base font-semibold text-[var(--text-main)]">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block sm:inline sm:ml-1.5 font-normal leading-none">
                {APP_CONFIG.tagline}
              </span>
            </div>
          </div>

          {/* 右侧外置快捷控件 */}
          <div className="flex items-center gap-1.5">
            {/* 白天/黑夜外置单触切换 (44x44px) */}
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

            {/* 新建故事胶囊按钮 (44px 高度触控区) */}
            <button
              type="button"
              onClick={onCreateStory}
              className="touch-target-44 min-h-[44px] px-3.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建故事</span>
            </button>

            {/* 原型选项菜单 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-label="原型选项菜单"
                className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] active:scale-90 transition-all cursor-pointer text-[var(--text-muted)]"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-3xl p-2 bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-2xl z-50 text-xs animate-fadeIn space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border-light)]">
                      <div className="font-medium text-[var(--text-main)] flex items-center justify-between">
                        <span>{currentUser || APP_CONFIG.visitorNickname}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-medium">
                          {currentUser ? '已登录' : '手机演示访客'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        {APP_CONFIG.badgeText}
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenDemoTools();
                        }}
                        className="touch-target-44 w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-4 h-4 text-[var(--brand-primary)]" />
                        <span>原型测试工具 (网络错误/空列表)</span>
                      </button>

                      {onLogout && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onLogout();
                          }}
                          className="touch-target-44 w-full text-left px-3 py-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>退出登录 / 切换账号</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主书架区域 */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6">
        {/* 操作异常通知 */}
        {operationError && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-2xl readable-alert-error border text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{operationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setOperationError(null)}
              className="p-1 opacity-70 hover:opacity-100"
              aria-label="关闭错误提示"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* “继续上次故事” 英雄卡片 */}
        {lastActiveStory && !searchQuery.trim() && (
          <section className="mb-5">
            <div
              onClick={() => onOpenStory(lastActiveStory.id)}
              className="group p-4 sm:p-5 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xs transition-all hover:border-[var(--brand-primary)]/40 hover:shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-medium text-[var(--brand-primary)] flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-primary-soft)]">
                  <Play className="w-3 h-3 fill-current" />
                  <span>继续上次故事</span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {formatRelativeTime(lastActiveStory.updatedAt)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 mt-2">
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-base sm:text-lg font-semibold text-[var(--text-main)] truncate group-hover:text-[var(--brand-primary)] transition-colors">
                    {lastActiveStory.title}
                  </h2>
                  <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                    <span className="font-medium text-[var(--text-main)]">
                      {lastActiveStory.characterName}
                    </span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs italic opacity-85">
                      “{lastActiveStory.lastSnippet || '等待继续写下新篇章…'}”
                    </span>
                  </div>
                </div>

                <div className="touch-target-44 w-11 h-11 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 搜索栏 (全圆角胶囊与即时清空按钮，44x44px 触控区) */}
        <div className="relative mb-4">
          <label htmlFor="story-search-input" className="sr-only">
            搜索故事
          </label>
          <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="story-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索故事、角色或对话片段…"
            className="w-full h-11 pl-9 pr-11 rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="touch-target-44 w-11 h-11 absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label="清空搜索内容"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 故事列表正文区域 */}
        <section aria-labelledby="story-list-heading">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 id="story-list-heading" className="text-sm font-serif font-medium text-[var(--text-main)]">
              所有故事 ({filteredStories.length})
            </h3>
          </div>

          {/* 状态分支 1: 搜索无结果 */}
          {searchQuery.trim() && filteredStories.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-center my-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-subtle)] mx-auto flex items-center justify-center text-[var(--text-muted)] mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-[var(--text-main)]">未找到匹配的故事</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                没有包含“{searchQuery}”的故事标题、角色或对话。可以更换关键词或清空搜索。
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 touch-target-44 min-h-[44px] px-5 rounded-full border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-xs font-medium inline-flex items-center gap-1.5 hover:text-[var(--brand-primary)] active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>清空搜索条件</span>
              </button>
            </div>
          ) : stories.length === 0 ? (
            /* 状态分支 2: 书架真正为空 */
            <div className="p-8 sm:p-10 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-center my-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-subtle)] mx-auto flex items-center justify-center text-[var(--text-muted)] mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-[var(--text-main)]">书架暂无故事档案</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                输入角色名字与自由设定，即可开启沉浸的长篇小说对话。
              </p>
              <button
                type="button"
                onClick={onCreateStory}
                className="mt-4 touch-target-44 min-h-[44px] px-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>立即新建第一个故事</span>
              </button>
            </div>
          ) : (
            /* 状态分支 3: 正常故事列表 */
            <div className="space-y-3">
              {filteredStories.map((story) => {
                const isMenuOpen = menuOpenId === story.id;
                return (
                  <div
                    key={story.id}
                    onClick={() => onOpenStory(story.id)}
                    className="group relative p-4 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xs transition-all hover:border-[var(--brand-primary)]/40 hover:shadow-sm cursor-pointer flex items-start gap-3"
                  >
                    {/* 角色字模色块 */}
                    <div
                      className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-white font-serif text-sm font-bold shadow-xs transition-transform group-hover:scale-105"
                      style={{ backgroundColor: story.accentColor || '#625177' }}
                    >
                      {story.characterName.slice(0, 1)}
                    </div>

                    {/* 故事条目细节 */}
                    <div className="flex-1 min-w-0 pr-10">
                      <h4 className="font-serif text-base font-medium text-[var(--text-main)] truncate group-hover:text-[var(--brand-primary)] transition-colors">
                        {story.title}
                      </h4>

                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text-main)]">
                          {story.characterName}
                        </span>
                        <span aria-hidden="true" className="opacity-40">·</span>
                        <span>{formatRelativeTime(story.updatedAt)}</span>
                      </div>

                      {/* 摘录片段 */}
                      <p className="mt-1.5 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {story.lastSnippet || '暂无对话记录'}
                      </p>
                    </div>

                    {/* 卡片右侧选项按钮 (44x44px 触控目标) */}
                    <div className="absolute right-1.5 top-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(isMenuOpen ? null : story.id)}
                        aria-label={`故事《${story.title}》选项`}
                        className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-90 transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div
                            role="menu"
                            className="absolute right-0 mt-1 w-36 rounded-2xl p-1 bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-2xl z-50 text-xs animate-fadeIn space-y-1"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuOpenId(null);
                                onOpenStory(story.id);
                              }}
                              className="touch-target-44 w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                              <span>进入阅读</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuOpenId(null);
                                setRenamingStory(story);
                              }}
                              className="touch-target-44 w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>重命名</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => handleStartDelete(story, e)}
                              className="touch-target-44 w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>删除故事</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 重命名故事模态框 */}
      <RenameStoryModal
        isOpen={!!renamingStory}
        story={renamingStory}
        onClose={() => setRenamingStory(null)}
        onSave={handleSaveRename}
      />

      {/* 删除故事确认对话框 */}
      <ConfirmDialog
        isOpen={!!deletingStory}
        title="确认删除该故事？"
        message={`删除《${deletingStory?.title}》后，所有相关对话都将移除。系统将提供撤销恢复。`}
        confirmLabel="删除"
        cancelLabel="取消"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingStory(null)}
      />

      {/* 撤销删除全局 Toast 浮动条 */}
      {undoToastVisible && undoBackup && (
        <UndoToast
          message={`已删除《${undoBackup.story.title}》`}
          onUndo={handleUndoDelete}
          onDismiss={() => setUndoToastVisible(false)}
        />
      )}
    </div>
  );
};
