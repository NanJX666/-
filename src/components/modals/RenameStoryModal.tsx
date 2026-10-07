import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Story } from '../../types/story';

interface RenameStoryModalProps {
  isOpen: boolean;
  story: Story | null;
  onClose: () => void;
  onSave: (storyId: string, newTitle: string) => Promise<void>;
}

export const RenameStoryModal: React.FC<RenameStoryModalProps> = ({
  isOpen,
  story,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
    }
  }, [story]);

  if (!isOpen || !story) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave(story.id, title.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-story-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-light)] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
          <h2 id="rename-story-title" className="text-base font-serif font-medium">
            重命名故事
          </h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 px-1">
              故事标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入故事标题"
              autoFocus
              className="w-full h-11 px-4 rounded-2xl border border-[var(--border-light)] bg-transparent text-[var(--text-main)] text-sm focus:outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-full border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 text-xs font-medium transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="h-10 px-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
