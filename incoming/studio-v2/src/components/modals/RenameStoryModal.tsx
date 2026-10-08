import React, { useState, useEffect, useRef } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
    }
  }, [story]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-light)] animate-fadeIn focus-visible:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
          <h2 id="rename-story-title" className="text-base font-serif font-medium">
            重命名故事
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭重命名窗口"
            className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="rename-title-input" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 px-1">
              故事标题
            </label>
            <input
              id="rename-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入故事标题"
              autoFocus
              className="w-full h-12 px-4 rounded-2xl border border-[var(--border-light)] bg-transparent text-[var(--text-main)] text-sm focus:outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="touch-target-44 min-h-[44px] px-4 rounded-full border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 text-xs font-medium transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="touch-target-44 min-h-[44px] px-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              {loading ? '正在保存…' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
