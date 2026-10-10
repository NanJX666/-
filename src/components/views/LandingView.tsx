import React from 'react';
import { Sparkles, User, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config';
import { ReadingPreferences } from '../../types/story';

interface LandingViewProps {
  onEnter: () => void;
  onGoToLogin?: () => void;
  preferences: ReadingPreferences;
  onUpdatePreferences: (partial: Partial<ReadingPreferences>) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onEnter,
  onGoToLogin,
  preferences,
  onUpdatePreferences,
}) => {
  const handleToggleTheme = () => {
    onUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col justify-between p-4 sm:p-8 select-none overflow-y-auto custom-scrollbar">
      {/* 顶部手机品牌栏，带 44x44px 日夜模式外置按钮 */}
      <header className="flex items-center justify-between max-w-xl mx-auto w-full pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center text-white font-serif font-bold text-sm shadow-xs">
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

        {/* 外置日夜切换按钮 (44x44px 触控目标) */}
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
      </header>

      {/* 主卡片 */}
      <main className="max-w-xl mx-auto w-full py-6 sm:py-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{APP_CONFIG.badgeText}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-serif font-medium text-[var(--text-main)] tracking-tight leading-snug">
          为安静阅读准备的
          <br />
          手机中文长篇故事空间
        </h1>

        <p className="mt-3.5 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
          无需理解复杂的角色卡、参数与设定。
          <br />
          翻开新的一页，与故事中的人继续对话。
        </p>

        {/* 访客身份展示卡片 */}
        <div className="mt-6 p-4 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xs max-w-xs sm:max-w-sm mx-auto text-left">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-2.5 border-b border-[var(--border-light)]">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              当前访客身份
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium">
              免密就绪
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-[var(--text-main)]">{APP_CONFIG.visitorNickname}</div>
              <div className="text-xs text-[var(--text-muted)]">回乡插画师 · 预置角色档案</div>
            </div>
          </div>
        </div>

        {/* 进入演示主按钮 (44px+ 触控目标) */}
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={onEnter}
            className="touch-target-44 w-full max-w-xs sm:max-w-sm min-h-[50px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--brand-primary)] text-white text-base font-medium shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>进入演示</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onGoToLogin && (
            <button
              type="button"
              onClick={onGoToLogin}
              className="touch-target-44 mt-2.5 text-xs text-[var(--brand-primary)] hover:underline flex items-center justify-center gap-1 cursor-pointer font-medium"
            >
              <span>已有朋友/管理员账号？去登录</span>
            </button>
          )}
        </div>

        {/* 免责说明 */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
          <span>离线模拟生成 · 无需 API 密钥 · 数据保存在本地</span>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="max-w-xl mx-auto w-full pb-2 text-center text-[11px] text-[var(--text-subtle)]">
        为移动端阅读排版优化 · 未来接入 SillyTavern UI Extension
      </footer>
    </div>
  );
};
