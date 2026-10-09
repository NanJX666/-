import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config';

export type StartupStatus = 'loading' | 'slow' | 'failed';

interface StartupLoadingScreenProps {
  status: StartupStatus;
  errorMessage?: string;
  onRetry?: () => void;
  onReady?: () => void;
  isReady?: boolean;
  theme?: 'light' | 'dark';
  enablePreviewSwitcher?: boolean;
  onPreviewStatusChange?: (status: StartupStatus) => void;
}

export const StartupLoadingScreen: React.FC<StartupLoadingScreenProps> = ({
  status,
  errorMessage = '无法建立故事数据连接，请点击重试。',
  onRetry,
  onReady,
  isReady = false,
  theme = 'light',
  enablePreviewSwitcher = false,
  onPreviewStatusChange,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [hasUnmounted, setHasUnmounted] = useState(false);

  // When real readiness signal is received, smoothly exit
  useEffect(() => {
    if (isReady && !isExiting) {
      setIsExiting(true);
      const timer = window.setTimeout(() => {
        setHasUnmounted(true);
        onReady?.();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isReady, isExiting, onReady]);

  if (hasUnmounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col justify-between p-6 sm:p-10 transition-opacity duration-350 ease-out select-none ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } bg-[var(--bg-page)] text-[var(--text-main)]`}
      style={{
        minHeight: '100dvh',
      }}
    >
      {/* Top subtle hint or preview controls */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between text-xs text-[var(--text-muted)] min-h-[32px]">
        {enablePreviewSwitcher ? (
          <div className="w-full flex items-center justify-center gap-1.5 p-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] shadow-xs">
            <span className="text-[10px] text-[var(--text-muted)] px-1">预览状态:</span>
            <button
              type="button"
              onClick={() => onPreviewStatusChange?.('loading')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                status === 'loading'
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
              }`}
            >
              正常加载
            </button>
            <button
              type="button"
              onClick={() => onPreviewStatusChange?.('slow')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                status === 'slow'
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
              }`}
            >
              加载较久
            </button>
            <button
              type="button"
              onClick={() => onPreviewStatusChange?.('failed')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                status === 'failed'
                  ? 'bg-rose-600 text-white'
                  : 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
              }`}
            >
              加载失败
            </button>
          </div>
        ) : (
          <span className="mx-auto text-[11px] tracking-wider text-[var(--text-subtle)]">
            私人故事阅读空间
          </span>
        )}
      </div>

      {/* Center Branding & Loading Indicator (Responsive for 360, 390, 430px & landscape) */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto px-4 py-6">
        {/* Brand Icon Mark */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[var(--brand-primary)] flex items-center justify-center text-white font-serif font-bold text-2xl shadow-sm mb-5 transition-transform">
          未
        </div>

        {/* Product Name */}
        <h1 className="font-serif tracking-widest text-2xl sm:text-3xl font-semibold text-[var(--text-main)]">
          {APP_CONFIG.name}
        </h1>

        {/* Subtitle Tagline */}
        <p className="text-xs sm:text-sm text-[var(--text-muted)] tracking-wider mt-2 font-normal">
          {APP_CONFIG.tagline}
        </p>

        {/* State Container */}
        <div className="mt-8 sm:mt-10 w-full flex flex-col items-center">
          {/* 1. Normal Loading State (正常加载) */}
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4 animate-fadeIn">
              {/* Literary Breathing Ink-Line Indicator (No heavy spinner, respects reduced-motion) */}
              <div className="w-32 sm:w-40 h-1 rounded-full bg-[var(--border-light)] overflow-hidden relative">
                <div className="h-full rounded-full bg-[var(--brand-primary)] opacity-85 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] w-full" />
              </div>

              {/* Explicit status label, no fake percentage */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-normal">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>正在准备故事空间…</span>
              </div>
            </div>
          )}

          {/* 2. Slow Loading State (加载较久，可以继续等待) */}
          {status === 'slow' && (
            <div className="flex flex-col items-center space-y-4 animate-fadeIn max-w-xs">
              {/* Subtle pulsing clock hint */}
              <div className="w-9 h-9 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] flex items-center justify-center text-[var(--brand-primary)]">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>

              {/* Informative prompt */}
              <div className="text-xs text-[var(--text-muted)] leading-relaxed text-center">
                <span>故事数据准备中，请继续稍候…</span>
                <span className="block text-[11px] text-[var(--text-subtle)] mt-1">
                  正在同步本地故事档案
                </span>
              </div>
            </div>
          )}

          {/* 3. Failed State (加载失败，清晰错误提示与重试按钮) */}
          {status === 'failed' && (
            <div className="flex flex-col items-center space-y-3.5 animate-fadeIn max-w-xs w-full">
              {/* Soft alert badge */}
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mb-1">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="text-xs text-[var(--text-main)] font-medium">
                故事空间初始化未就绪
              </div>

              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed px-2 text-center">
                {errorMessage}
              </p>

              {/* Controlled external retry button (Touch target >= 44x44px) */}
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 touch-target-44 min-h-[44px] px-6 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新尝试加载</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-sm mx-auto text-center text-[10px] text-[var(--text-subtle)] pb-2">
        <span>沉浸式长篇中文小说对话 · 本地离线就绪</span>
      </div>
    </div>
  );
};
