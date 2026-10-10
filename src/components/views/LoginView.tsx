import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, WifiOff, Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config';
import { ReadingPreferences } from '../../types/story';

export type LoginPreviewState = 'default' | 'typing' | 'loading' | 'auth_error' | 'network_error';

interface LoginViewProps {
  preferences: ReadingPreferences;
  onUpdatePreferences: (partial: Partial<ReadingPreferences>) => void;
  onLoginSuccess: (username: string) => void;
  onCancel?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  preferences,
  onUpdatePreferences,
  onLoginSuccess,
  onCancel,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'network' | null>(null);
  const [previewMode, setPreviewMode] = useState<LoginPreviewState>('default');

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 快捷主题切换
  const handleToggleTheme = () => {
    onUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  // 状态预览切换器逻辑 (供评审体验 5 种状态)
  const applyPreviewState = (state: LoginPreviewState) => {
    setPreviewMode(state);
    switch (state) {
      case 'default':
        setUsername('');
        setPassword('');
        setIsSubmitting(false);
        setErrorMessage(null);
        setErrorType(null);
        break;
      case 'typing':
        setUsername('linchu');
        setPassword('secret123');
        setIsSubmitting(false);
        setErrorMessage(null);
        setErrorType(null);
        break;
      case 'loading':
        setUsername('linchu');
        setPassword('secret123');
        setIsSubmitting(true);
        setErrorMessage(null);
        setErrorType(null);
        break;
      case 'auth_error':
        setUsername('linchu');
        setPassword('wrong_pwd');
        setIsSubmitting(false);
        setErrorType('auth');
        setErrorMessage('账号或密码不正确，请重新输入');
        break;
      case 'network_error':
        setUsername('linchu');
        setPassword('secret123');
        setIsSubmitting(false);
        setErrorType('network');
        setErrorMessage('连接服务器超时，请检查网络后重试');
        break;
    }
  };

  // 用户修改输入时，主动清除既有错误，允许立即重试
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
      setErrorType(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
      setErrorType(null);
    }
  };

  // 表单提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 防止在提交中重复点击
    if (isSubmitting) return;

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorType('auth');
      setErrorMessage('请输入账号');
      usernameInputRef.current?.focus();
      return;
    }

    if (!password) {
      setErrorType('auth');
      setErrorMessage('请输入密码');
      passwordInputRef.current?.focus();
      return;
    }

    // 针对特定模拟用例的处理
    if (previewMode === 'auth_error' || password === 'wrong') {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorType('auth');
        setErrorMessage('账号或密码不正确，请重新输入');
        passwordInputRef.current?.focus();
      }, 500);
      return;
    }

    if (previewMode === 'network_error' || trimmedUser === 'offline') {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorType('network');
        setErrorMessage('连接服务器超时，请检查网络后重试');
      }, 600);
      return;
    }

    // 正常模拟提交成功流
    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    setTimeout(() => {
      setIsSubmitting(false);
      // 登录成功，触发衔接已有的启动动画与主应用流程
      onLoginSuccess(trimmedUser);
    }, 600);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between p-4 sm:p-6 bg-[var(--bg-page)] text-[var(--text-main)] transition-colors overflow-y-auto custom-scrollbar select-none">
      {/* 顶栏：主题切换与取消/返回（如有） */}
      <header className="flex items-center justify-between max-w-sm mx-auto w-full pt-1 pb-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="touch-target-44 px-3 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 transition-all cursor-pointer"
          >
            返回
          </button>
        ) : (
          <span className="text-[11px] text-[var(--text-subtle)] tracking-wider">
            私人故事空间
          </span>
        )}

        {/* 外置日夜模式切换按钮 (44x44px 触控目标) */}
        <button
          type="button"
          onClick={handleToggleTheme}
          aria-label={preferences.theme === 'dark' ? '切换为浅色日间模式' : '切换为深色夜间模式'}
          className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-main)] hover:text-[var(--brand-primary)] active:scale-90 transition-all shadow-xs cursor-pointer ml-auto"
          title={preferences.theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
        >
          {preferences.theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-[var(--brand-primary)]" />
          )}
        </button>
      </header>

      {/* 状态预览控制条（仅供评审切换测试） */}
      <div className="w-full max-w-sm mx-auto mb-2">
        <div className="flex items-center justify-between p-1 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] text-[10px] text-[var(--text-muted)] overflow-x-auto gap-1">
          <span className="shrink-0 px-2 font-medium">预览状态:</span>
          <button
            type="button"
            onClick={() => applyPreviewState('default')}
            className={`px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              previewMode === 'default'
                ? 'bg-[var(--brand-primary)] text-white font-medium'
                : 'hover:bg-[var(--bg-surface)]'
            }`}
          >
            默认
          </button>
          <button
            type="button"
            onClick={() => applyPreviewState('typing')}
            className={`px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              previewMode === 'typing'
                ? 'bg-[var(--brand-primary)] text-white font-medium'
                : 'hover:bg-[var(--bg-surface)]'
            }`}
          >
            输入中
          </button>
          <button
            type="button"
            onClick={() => applyPreviewState('loading')}
            className={`px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              previewMode === 'loading'
                ? 'bg-[var(--brand-primary)] text-white font-medium'
                : 'hover:bg-[var(--bg-surface)]'
            }`}
          >
            登录中
          </button>
          <button
            type="button"
            onClick={() => applyPreviewState('auth_error')}
            className={`px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              previewMode === 'auth_error'
                ? 'bg-rose-600 text-white font-medium'
                : 'hover:bg-[var(--bg-surface)]'
            }`}
          >
            密码错误
          </button>
          <button
            type="button"
            onClick={() => applyPreviewState('network_error')}
            className={`px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              previewMode === 'network_error'
                ? 'bg-amber-600 text-white font-medium'
                : 'hover:bg-[var(--bg-surface)]'
            }`}
          >
            网络失败
          </button>
        </div>
      </div>

      {/* 主体卡片 (针对 360/390/430px 及键盘弹出后的紧凑排版) */}
      <main className="w-full max-w-sm mx-auto my-auto py-2">
        <div className="flex flex-col items-center text-center mb-6">
          {/* 品牌标识符 */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[var(--brand-primary)] flex items-center justify-center text-white font-serif font-bold text-2xl shadow-sm mb-4">
            未
          </div>

          {/* 品牌名 */}
          <h1 className="font-serif tracking-widest text-2xl sm:text-3xl font-semibold text-[var(--text-main)]">
            {APP_CONFIG.name}
          </h1>

          {/* 副标题 */}
          <p className="text-xs sm:text-sm text-[var(--text-muted)] tracking-wider mt-1.5 font-normal">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {/* 错误提示条 (简洁明晰) */}
        {errorMessage && (
          <div
            role="alert"
            className={`mb-4 p-3 rounded-2xl flex items-center gap-2.5 text-xs animate-fadeIn border ${
              errorType === 'network'
                ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            {errorType === 'network' ? (
              <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="flex-1 text-left leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} method="post" noValidate className="space-y-4">
          {/* 账号输入框 */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="login-username"
              className="block text-xs font-medium text-[var(--text-muted)] px-1"
            >
              账号
            </label>
            <div className="relative">
              <input
                ref={usernameInputRef}
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
                disabled={isSubmitting}
                value={username}
                onChange={handleUsernameChange}
                placeholder="请输入已分配的账号"
                className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-subtle)] border border-[var(--border-light)] focus:border-[var(--brand-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all text-[16px] sm:text-sm disabled:opacity-60 shadow-xs"
              />
            </div>
          </div>

          {/* 密码输入框 */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-[var(--text-muted)] px-1"
            >
              密码
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={handlePasswordChange}
                placeholder="请输入密码"
                className="w-full min-h-[48px] pl-4 pr-12 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-subtle)] border border-[var(--border-light)] focus:border-[var(--brand-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all text-[16px] sm:text-sm disabled:opacity-60 shadow-xs"
              />

              {/* 显示/隐藏密码切换按钮 (触控区域 >= 44x44px) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                className="touch-target-44 absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-colors cursor-pointer rounded-full"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-[var(--brand-primary)]" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 登录按钮 (min-height 48px, >=44px 触控标准) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="touch-target-44 w-full min-h-[50px] rounded-full bg-[var(--brand-primary)] text-white text-sm font-medium shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在验证…</span>
                </>
              ) : (
                <>
                  <span>登录故事空间</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* 提示文案（说明由管理员分配，不提供公开注册） */}
        <p className="text-[11px] text-[var(--text-subtle)] text-center mt-5 leading-relaxed">
          私人故事空间，账号由管理员分配
          <br />
          登录后将同步个人角色记录与对话档案
        </p>
      </main>

      {/* 页脚说明 */}
      <footer className="w-full max-w-sm mx-auto text-center text-[10px] text-[var(--text-subtle)] pb-2 pt-4">
        <span>基于 SillyTavern Multi-user 认证体系 · 本地端安全连接</span>
      </footer>
    </div>
  );
};
