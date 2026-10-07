import React from 'react';
import { X, Plus, BookOpen } from 'lucide-react';
import { Story } from '../../types/story';
import { formatRelativeTime } from '../../utils/format';

interface StoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  activeStoryId?: string;
  onSelectStory: (storyId: string) => void;
  onCreateNew: () => void;
}

export const StoryDrawer: React.FC<StoryDrawerProps> = ({
  isOpen,
  onClose,
  stories,
  activeStoryId,
  onSelectStory,
  onCreateNew,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="故事抽屉"
      className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-[84vw] max-w-xs h-full bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xl flex flex-col border-r border-[var(--border-light)] rounded-r-3xl animate-slideRight overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 border-b border-[var(--border-light)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="font-serif text-sm font-medium">故事书架</span>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭抽屉"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: Create New Story */}
        <div className="p-3 border-b border-[var(--border-light)]">
          <button
            onClick={() => {
              onClose();
              onCreateNew();
            }}
            className="w-full h-10 flex items-center justify-center gap-2 px-3 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] text-xs font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建故事</span>
          </button>
        </div>

        {/* Stories List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
          {stories.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              暂无已保存的故事
            </div>
          ) : (
            stories.map((story) => {
              const isActive = story.id === activeStoryId;
              return (
                <button
                  key={story.id}
                  onClick={() => {
                    onSelectStory(story.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex flex-col gap-1 active:scale-[0.98] cursor-pointer ${
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'hover:bg-[var(--bg-surface-subtle)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="truncate pr-2 font-serif">{story.title}</span>
                    <span
                      className={`text-[10px] shrink-0 ${
                        isActive ? 'text-white/80' : 'text-[var(--text-subtle)]'
                      }`}
                    >
                      {formatRelativeTime(story.updatedAt)}
                    </span>
                  </div>
                  <div
                    className={`text-xs truncate ${
                      isActive ? 'text-white/90' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    角色：{story.characterName}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
