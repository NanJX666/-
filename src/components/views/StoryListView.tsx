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
      const backup = await service.deleteStory(deletingStory.id);
      setUndoBackup(backup);
      setUndoToastVisible(true);
      setDeletingStory(null);
      onReload();
    } catch (err) {
      console.error('Delete story failed:', err);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoBackup) return;
    try {
      await service.restoreStory(undoBackup);
      setUndoToastVisible(false);
      setUndoBackup(null);
      onReload();
    } catch (err) {
      console.error('Undo story restore failed:', err);
    }
  };

  const handleSaveRename = async (storyId: string, newTitle: string) => {
    await service.renameStory(storyId, newTitle);
    onReload();
  };

  const handleToggleTheme = () => {
    onUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
      {/* Top Mobile-First Navbar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-light)] bg-[var(--header-bg)] backdrop-blur-md px-3.5 sm:px-6">
        <div className="max-w-2xl mx-auto h-14 flex items-center justify-between gap-2">
          {/* Logo & Product Name */}
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

          {/* Right Action Controls (Direct Day/Night Toggle + Rounded New Story Pill) */}
          <div className="flex items-center gap-1.5">
            {/* Direct Day / Night Mode Toggle Outside */}
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

            {/* New Story Pill Button (Touch-friendly rounded-full) */}
            <button
              onClick={onCreateStory}
              className="h-9 px-3.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建故事</span>
            </button>

            {/* Prototype & About menu */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-label="原型选项"
                className="h-9 w-9 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] active:scale-90 transition-all cursor-pointer text-[var(--text-muted)]"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-3xl p-2 bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-xl z-50 text-xs animate-fadeIn">
                    <div className="px-3 py-2 border-b border-[var(--border-light)]">
                      <div className="font-medium text-[var(--text-main)] flex items-center justify-between">
                        <span>{APP_CONFIG.visitorNickname}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-medium">
                          手机演示访客
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        {APP_CONFIG.badgeText}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenDemoTools();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                        <span>原型测试工具 (网络错误/空列表)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Bookshelf Area (Centered on Desktop, Native-app feel on Mobile) */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6">
        {/* "继续上次故事" Hero Card */}
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
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs italic opacity-85">
                      “{lastActiveStory.lastSnippet || '等待继续写下新篇章…'}”
                    </span>
                  </div>
                </div>

                <div className="h-9 w-9 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search Bar (Rounded-full Pill with Instant Clear) */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索故事、角色或对话片段…"
            className="w-full h-11 pl-9 pr-9 rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stories List Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-serif font-medium text-[var(--text-main)]">
              所有故事 ({filteredStories.length})
            </h3>
          </div>

          {/* Stories Grid / Cards */}
          {filteredStories.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-10 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-center my-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-subtle)] mx-auto flex items-center justify-center text-[var(--text-muted)] mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-[var(--text-main)]">
                {searchQuery.trim() ? '未找到符合条件的故事' : '书架暂无故事档案'}
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                {searchQuery.trim()
                  ? '可以尝试搜索角色名或关键词，或者新建故事开启新对话。'
                  : '随时输入角色名字与自由设定，即可开启沉浸的长篇小说对话。'}
              </p>
              <button
                onClick={onCreateStory}
                className="mt-4 h-10 px-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即新建第一个故事</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStories.map((story) => {
                const isMenuOpen = menuOpenId === story.id;
                return (
                  <div
                    key={story.id}
                    onClick={() => onOpenStory(story.id)}
                    className="group relative p-4 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xs transition-all hover:border-[var(--brand-primary)]/40 hover:shadow-sm cursor-pointer flex items-start gap-3"
                  >
                    {/* Abstract Color Block Glyph */}
                    <div
                      className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-white font-serif text-sm font-bold shadow-xs transition-transform group-hover:scale-105"
                      style={{ backgroundColor: story.accentColor || '#625177' }}
                    >
                      {story.characterName.slice(0, 1)}
                    </div>

                    {/* Story Details */}
                    <div className="flex-1 min-w-0 pr-8">
                      <h4 className="font-serif text-base font-medium text-[var(--text-main)] truncate group-hover:text-[var(--brand-primary)] transition-colors">
                        {story.title}
                      </h4>

                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text-main)]">
                          {story.characterName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(story.updatedAt)}</span>
                      </div>

                      {/* Excerpt snippet */}
                      <p className="mt-1.5 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {story.lastSnippet || '暂无对话记录'}
                      </p>
                    </div>

                    {/* Story Actions (Right Menu) */}
                    <div className="absolute right-2.5 top-2.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(isMenuOpen ? null : story.id)}
                        aria-label="故事选项"
                        className="h-9 w-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-90 transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-36 rounded-2xl p-1 bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-light)] shadow-xl z-50 text-xs animate-fadeIn">
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                onOpenStory(story.id);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                              <span>进入阅读</span>
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setRenamingStory(story);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-surface-subtle)] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>重命名</span>
                            </button>
                            <button
                              onClick={(e) => handleStartDelete(story, e)}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
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

      {/* Rename Story Modal */}
      <RenameStoryModal
        isOpen={!!renamingStory}
        story={renamingStory}
        onClose={() => setRenamingStory(null)}
        onSave={handleSaveRename}
      />

      {/* Confirm Story Deletion Dialog */}
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

      {/* Undo Story Deletion Toast */}
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
