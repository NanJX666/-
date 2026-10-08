import React from 'react';
import { X, Sun, Moon, Type } from 'lucide-react';
import { ReadingPreferences } from '../../types/story';

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ReadingPreferences;
  onUpdate: (partial: Partial<ReadingPreferences>) => void;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const fontSizes = [
    { label: '小', size: 15, desc: '15px 紧凑' },
    { label: '中', size: 17, desc: '17px 默认' },
    { label: '大', size: 19, desc: '19px 舒展' },
    { label: '特大', size: 21, desc: '21px 放大' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-xl border transition-colors bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-light)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-[var(--brand-primary)]" />
            <h2 id="reading-settings-title" className="text-base font-medium">
              阅读设置
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭阅读设置"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-6">
          {/* Font Size Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-3">
              正文字号
            </label>
            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((item) => (
                <button
                  key={item.size}
                  onClick={() => onUpdate({ fontSize: item.size })}
                  className={`min-h-[44px] flex flex-col items-center justify-center py-2 px-1 rounded-xl text-sm font-medium border transition-all ${
                    preferences.fontSize === item.size
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                      : 'border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  <span className="font-serif">{item.label}</span>
                  <span className="text-[10px] opacity-75">{item.size}px</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-3">
              页面色彩模式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdate({ theme: 'light' })}
                className={`min-h-[48px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  preferences.theme === 'light'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold'
                    : 'border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>珍珠白 (浅色)</span>
              </button>
              <button
                onClick={() => onUpdate({ theme: 'dark' })}
                className={`min-h-[48px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  preferences.theme === 'dark'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold'
                    : 'border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>墨夜沉寂 (深色)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            设置将保存在本地浏览器中，刷新后依然有效
          </p>
        </div>
      </div>
    </div>
  );
};
