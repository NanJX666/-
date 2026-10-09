/**
 * splash.js - “未完” 启动加载画面独立控制器 (Vanilla JS, 零外部依赖)
 * 供 SillyTavern UI Extension 挂载前纯原生调用。
 * 元素及样式使用专有前缀 ww-splash-，提供清晰的生命周期与重试回调。
 */

(function (global) {
  'use strict';

  var WeiwanSplash = {
    overlayEl: null,
    statusBoxEl: null,
    currentTheme: 'light',
    onRetryCallback: null,

    /**
     * 显示加载画面
     * @param {Object} options
     * @param {string} [options.theme='light'] - 'light' | 'dark'
     * @param {HTMLElement} [options.container=document.body] - 挂载目标容器
     * @param {Function} [options.onRetry] - 失败重试时的回调函数
     */
    show: function (options) {
      options = options || {};
      this.currentTheme = options.theme || 'light';
      this.onRetryCallback = options.onRetry || null;

      // 如果已存在则仅更新并复用
      if (this.overlayEl && document.body.contains(this.overlayEl)) {
        this.overlayEl.classList.remove('ww-splash-exiting');
        this.setTheme(this.currentTheme);
        this.setStatus('loading');
        return;
      }

      var container = options.container || document.body;
      var el = document.createElement('div');
      el.className = 'ww-splash-overlay';
      el.setAttribute('data-theme', this.currentTheme);
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');

      el.innerHTML = [
        '<div class="ww-splash-header">',
        '  <span>私人故事阅读空间</span>',
        '</div>',
        '<div class="ww-splash-body">',
        '  <div class="ww-splash-logo" aria-hidden="true">未</div>',
        '  <h1 class="ww-splash-title">未完</h1>',
        '  <p class="ww-splash-tagline">故事从这里继续</p>',
        '  <div class="ww-splash-status-box" id="ww-splash-status-box"></div>',
        '</div>',
        '<div class="ww-splash-footer">',
        '  <span>沉浸式长篇中文小说对话 · 本地离线就绪</span>',
        '</div>'
      ].join('');

      container.appendChild(el);
      this.overlayEl = el;
      this.statusBoxEl = el.querySelector('#ww-splash-status-box');

      // 默认呈现正常加载状态
      this.setStatus('loading');
    },

    /**
     * 切换状态展示
     * @param {'loading'|'slow'|'failed'} status - 目标状态
     * @param {string} [message] - 错误状态下的提示文本
     */
    setStatus: function (status, message) {
      if (!this.statusBoxEl) return;

      var box = this.statusBoxEl;
      box.innerHTML = '';

      if (status === 'loading') {
        box.innerHTML = [
          '<div class="ww-splash-pulse-track" aria-hidden="true">',
          '  <div class="ww-splash-pulse-thumb"></div>',
          '</div>',
          '<div class="ww-splash-status-text">',
          '  <span>正在准备故事空间…</span>',
          '</div>'
        ].join('');
      } else if (status === 'slow') {
        box.innerHTML = [
          '<div class="ww-splash-slow-badge" aria-hidden="true">',
          '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '    <circle cx="12" cy="12" r="10"></circle>',
          '    <polyline points="12 6 12 12 16 14"></polyline>',
          '  </svg>',
          '</div>',
          '<div class="ww-splash-slow-desc">',
          '  故事数据准备中，请继续稍候…',
          '  <div class="ww-splash-slow-sub">正在同步本地故事档案</div>',
          '</div>'
        ].join('');
      } else if (status === 'failed') {
        var errMsg = message || '无法建立故事数据连接，请点击重试。';
        box.innerHTML = [
          '<div class="ww-splash-fail-badge" aria-hidden="true">',
          '  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>',
          '    <line x1="12" y1="9" x2="12" y2="13"></line>',
          '    <line x1="12" y1="17" x2="12.01" y2="17"></line>',
          '  </svg>',
          '</div>',
          '<div class="ww-splash-fail-title">故事空间初始化未就绪</div>',
          '<div class="ww-splash-fail-desc">' + escapeHtml(errMsg) + '</div>',
          '<button type="button" class="ww-splash-retry-btn" id="ww-splash-retry-trigger">',
          '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>',
          '    <path d="M21 3v5h-5"></path>',
          '    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>',
          '    <path d="M8 16H3v5"></path>',
          '  </svg>',
          '  <span>重新尝试加载</span>',
          '</button>'
        ].join('');

        var retryBtn = box.querySelector('#ww-splash-retry-trigger');
        if (retryBtn) {
          var self = this;
          retryBtn.addEventListener('click', function () {
            if (typeof self.onRetryCallback === 'function') {
              self.onRetryCallback();
            } else {
              // 默认重试回 loading 状态
              self.setStatus('loading');
            }
          });
        }
      }
    },

    /**
     * 标记初始化失败，呈现简短错误与重试按钮
     * @param {string} [errorMessage] - 错误文案
     * @param {Function} [onRetry] - 重新绑定的重试回调
     */
    fail: function (errorMessage, onRetry) {
      if (typeof onRetry === 'function') {
        this.onRetryCallback = onRetry;
      }
      this.setStatus('failed', errorMessage);
    },

    /**
     * 接收到真实就绪信号后平滑退出
     * 不强制等待动画播放，淡出后自动销毁 DOM 节点
     */
    ready: function () {
      if (!this.overlayEl) return;
      var el = this.overlayEl;
      el.classList.add('ww-splash-exiting');

      var self = this;
      setTimeout(function () {
        self.destroy();
      }, 350);
    },

    /**
     * 切换日间/夜间配色
     * @param {'light'|'dark'} theme
     */
    setTheme: function (theme) {
      this.currentTheme = theme;
      if (this.overlayEl) {
        this.overlayEl.setAttribute('data-theme', theme);
      }
    },

    /**
     * 清理销毁 DOM 与引用
     */
    destroy: function () {
      if (this.overlayEl && this.overlayEl.parentNode) {
        this.overlayEl.parentNode.removeChild(this.overlayEl);
      }
      this.overlayEl = null;
      this.statusBoxEl = null;
      this.onRetryCallback = null;
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 挂载至全局
  global.WeiwanSplash = WeiwanSplash;
})(typeof window !== 'undefined' ? window : this);
