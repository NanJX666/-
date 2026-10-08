import React, { useState } from 'react';
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, Sun, Moon, AlertTriangle, X } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config';
import { ReadingPreferences, Story, StoryService } from '../../types/story';

interface CreateStoryViewProps {
  service: StoryService;
  preferences: ReadingPreferences;
  onUpdatePreferences: (partial: Partial<ReadingPreferences>) => void;
  onBack: () => void;
  onStoryCreated: (story: Story) => void;
}

export const CreateStoryView: React.FC<CreateStoryViewProps> = ({
  service,
  preferences,
  onUpdatePreferences,
  onBack,
  onStoryCreated,
}) => {
  const [characterName, setCharacterName] = useState('');
  const [setting, setSetting] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [settingError, setSettingError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);

  const handleToggleTheme = () => {
    onUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const handleFillExample = () => {
    const hasExistingContent = characterName.trim().length > 0 || setting.trim().length > 0;
    if (hasExistingContent) {
      setShowConfirmOverwrite(true);
    } else {
      applyExample();
    }
  };

  const applyExample = () => {
    setCharacterName(APP_CONFIG.defaultExample.characterName);
    setSetting(APP_CONFIG.defaultExample.setting);
    setNameError(null);
    setSettingError(null);
    setSubmissionError(null);
    setShowConfirmOverwrite(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!characterName.trim()) {
      setNameError('请填写角色名字');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!setting.trim()) {
      setSettingError('请填写自由设定');
      hasError = true;
    } else {
      setSettingError(null);
    }

    if (hasError) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const newStory = await service.createStory({
        characterName: characterName.trim(),
        setting: setting.trim(),
      });
      onStoryCreated(newStory);
    } catch (err: any) {
      setSubmissionError(err?.message || '创建故事失败，请检查并重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors overflow-hidden">
      {/* 顶部移动端导航栏 (44x44px 触控目标) */}
      <header className="shrink-0 sticky top-0 z-20 border-b border-[var(--border-light)] bg-[var(--header-bg)] backdrop-blur-md px-3.5 sm:px-6">
        <div className="max-w-2xl mx-auto h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="touch-target-44 min-h-[44px] px-3 rounded-full flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer"
            aria-label="返回故事书架"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回书架</span>
          </button>

          <div className="font-serif font-medium text-sm">创建新故事</div>

          {/* 白天/黑夜模式外置单触切换 (44x44px) */}
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
        </div>
      </header>

      {/* 创建表单区域：支持小可视高度上下滚动，确保键盘弹起时不丢失内容 */}
      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex flex-col custom-scrollbar">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h1 className="text-lg sm:text-xl font-serif font-medium text-[var(--text-main)]">
              开启一段新旅程
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              只需输入角色名与设定，即可展开专属小说语境
            </p>
          </div>

          {/* 独立填入示例按钮 (44px 触控区) */}
          <button
            type="button"
            onClick={handleFillExample}
            className="touch-target-44 min-h-[44px] px-3.5 rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] text-xs text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>填入示例</span>
          </button>
        </div>

        {/* 提交异常页面级错误通知 */}
        {submissionError && (
          <div
            role="alert"
            className="mb-3.5 p-3.5 rounded-2xl readable-alert-error border text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionError(null)}
              className="p-1 opacity-70 hover:opacity-100"
              aria-label="关闭错误提示"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
          {/* 字段 1: 角色名字 */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label
                htmlFor="char-name"
                className="text-xs font-medium text-[var(--text-main)] flex items-center gap-1"
              >
                <span>角色名字</span>
                <span className="text-rose-500">*</span>
              </label>
              {nameError && (
                <span className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {nameError}
                </span>
              )}
            </div>
            <input
              id="char-name"
              type="text"
              value={characterName}
              onChange={(e) => {
                setCharacterName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="例如：沈砚、许知遥、阿尔登……"
              className={`w-full h-12 px-4 rounded-2xl border bg-[var(--bg-surface)] text-[var(--text-main)] text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)]/15 shadow-xs ${
                nameError
                  ? 'border-rose-300 focus:border-rose-400'
                  : 'border-[var(--border-light)] focus:border-[var(--brand-primary)]'
              }`}
            />
          </div>

          {/* 字段 2: 自由设定大文本框 */}
          <div className="flex-1 flex flex-col min-h-[220px] sm:min-h-[280px]">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label
                htmlFor="free-setting"
                className="text-xs font-medium text-[var(--text-main)] flex items-center gap-1"
              >
                <span>自由设定</span>
                <span className="text-rose-500">*</span>
              </label>
              {settingError && (
                <span className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {settingError}
                </span>
              )}
            </div>
            <textarea
              id="free-setting"
              value={setting}
              onChange={(e) => {
                setSetting(e.target.value);
                if (settingError) setSettingError(null);
              }}
              placeholder="身份、性格、你是谁、你们的关系、故事发生在哪里……想到什么都可以写。"
              className={`flex-1 w-full p-4 rounded-3xl border bg-[var(--bg-surface)] text-[var(--text-main)] text-sm leading-relaxed resize-none transition-all focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)]/15 custom-scrollbar shadow-xs ${
                settingError
                  ? 'border-rose-300 focus:border-rose-400'
                  : 'border-[var(--border-light)] focus:border-[var(--brand-primary)]'
              }`}
            />
          </div>

          {/* 底部按钮区 */}
          <div className="pt-2 mobile-bottom-safe">
            <button
              type="submit"
              disabled={isSubmitting}
              className="touch-target-44 w-full min-h-[50px] flex items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] text-white text-base font-medium shadow-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isSubmitting ? '正在构建故事空间…' : '开始故事'}</span>
            </button>
            <p className="text-center text-xs text-[var(--text-subtle)] mt-2">
              点击后将自动生成独立故事并展开开场对话
            </p>
          </div>
        </form>
      </main>

      {/* 覆写确认弹窗 (Esc 或取消可退出) */}
      {showConfirmOverwrite && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-overwrite-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowConfirmOverwrite(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-light)] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-overwrite-title" className="text-base font-medium">确认填入示例？</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
              您当前已输入了自定义内容，填入默认示例将替换当前输入。是否继续？
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmOverwrite(false)}
                className="touch-target-44 min-h-[44px] px-4 rounded-full border border-[var(--border-light)] text-sm font-medium hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer"
              >
                保留我的输入
              </button>
              <button
                type="button"
                onClick={applyExample}
                className="touch-target-44 min-h-[44px] px-5 rounded-full bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                填入示例
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
