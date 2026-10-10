/**
 * login.js - “未完” 手机登录页面独立控制器 (Vanilla JS, 零外部依赖)
 * 供 SillyTavern Multi-user 扩展在主应用脚本加载前纯原生调用。
 * 元素及样式使用专有前缀 ww-login-，提供提交、错误提示、防重复提交与就绪生命周期。
 */

(function (global) {
  'use strict';

  var WeiwanLogin = {
    overlayEl: null,
    formEl: null,
    usernameInput: null,
    passwordInput: null,
    submitBtn: null,
    alertEl: null,
    themeBtn: null,
    currentTheme: 'light',
    isSubmitting: false,
    showPassword: false,
    onSubmitCallback: null,
    onCancelCallback: null,
    onThemeChangeCallback: null,

    /**
     * 显示登录画面
     * @param {Object} options
     * @param {'light'|'dark'} [options.theme='light'] - 主题模式
     * @param {HTMLElement} [options.container=document.body] - 挂载容器
     * @param {Function} [options.onSubmit] - 表单提交回调 function({ username, password })
     * @param {Function} [options.onCancel] - 取消/返回回调
     * @param {Function} [options.onThemeChange] - 主题切换通知回调
     */
    show: function (options) {
      options = options || {};
      this.currentTheme = options.theme || 'light';
      this.onSubmitCallback = options.onSubmit || null;
      this.onCancelCallback = options.onCancel || null;
      this.onThemeChangeCallback = options.onThemeChange || null;

      // 如果已有实例则重用
      if (this.overlayEl && document.body.contains(this.overlayEl)) {
        this.overlayEl.classList.remove('ww-login-exiting');
        this.setTheme(this.currentTheme);
        return;
      }

      var container = options.container || document.body;
      var el = document.createElement('div');
      el.className = 'ww-login-overlay';
      el.setAttribute('data-theme', this.currentTheme);
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'ww-login-title-text');

      var eyeSvg = this._getEyeSvg(false);
      var themeSvg = this._getThemeSvg(this.currentTheme);

      el.innerHTML = [
        '<div class="ww-login-header">',
        '  <span class="ww-login-header-sub">私人故事空间</span>',
        '  <button type="button" class="ww-login-theme-btn" id="ww-login-theme-btn" aria-label="切换日夜模式">',
        themeSvg,
        '  </button>',
        '</div>',
        '<main class="ww-login-main">',
        '  <div class="ww-login-brand-box">',
        '    <div class="ww-login-logo" aria-hidden="true">未</div>',
        '    <h1 class="ww-login-title" id="ww-login-title-text">未完</h1>',
        '    <p class="ww-login-tagline">故事从这里继续</p>',
        '  </div>',
        '  <div id="ww-login-alert-slot"></div>',
        '  <form class="ww-login-form" id="ww-login-form" method="post" novalidate>',
        '    <div class="ww-login-field">',
        '      <label class="ww-login-label" for="ww-login-username-input">账号</label>',
        '      <div class="ww-login-input-wrap">',
        '        <input class="ww-login-input" id="ww-login-username-input" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="请输入已分配的账号" />',
        '      </div>',
        '    </div>',
        '    <div class="ww-login-field">',
        '      <label class="ww-login-label" for="ww-login-password-input">密码</label>',
        '      <div class="ww-login-input-wrap">',
        '        <input class="ww-login-input ww-login-input-password" id="ww-login-password-input" name="password" type="password" autocomplete="current-password" required placeholder="请输入密码" />',
        '        <button type="button" class="ww-login-eye-btn" id="ww-login-eye-btn" aria-label="显示密码">',
        eyeSvg,
        '        </button>',
        '      </div>',
        '    </div>',
        '    <button type="submit" class="ww-login-submit-btn" id="ww-login-submit-btn">',
        '      <span>登录故事空间</span>',
        '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
        '    </button>',
        '  </form>',
        '  <p class="ww-login-info">私人故事空间，账号由管理员分配<br />登录后将同步个人角色记录与对话档案</p>',
        '</main>',
        '<footer class="ww-login-footer">',
        '  <span>基于 SillyTavern Multi-user 认证体系 · 本地端安全连接</span>',
        '</footer>'
      ].join('');

      container.appendChild(el);
      this.overlayEl = el;
      this.formEl = el.querySelector('#ww-login-form');
      this.usernameInput = el.querySelector('#ww-login-username-input');
      this.passwordInput = el.querySelector('#ww-login-password-input');
      this.submitBtn = el.querySelector('#ww-login-submit-btn');
      this.alertEl = el.querySelector('#ww-login-alert-slot');
      this.themeBtn = el.querySelector('#ww-login-theme-btn');

      this._bindEvents();
    },

    /**
     * 绑定 DOM 事件监听
     */
    _bindEvents: function () {
      var self = this;

      // 密码显示隐藏切换
      var eyeBtn = this.overlayEl.querySelector('#ww-login-eye-btn');
      if (eyeBtn) {
        eyeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          self.togglePasswordVisibility();
        });
      }

      // 主题切换
      if (this.themeBtn) {
        this.themeBtn.addEventListener('click', function () {
          var next = self.currentTheme === 'dark' ? 'light' : 'dark';
          self.setTheme(next);
          if (typeof self.onThemeChangeCallback === 'function') {
            self.onThemeChangeCallback(next);
          }
        });
      }

      // 输入时清除既有错误，允许立即重试
      var onInputHandler = function () {
        self.clearError();
      };
      if (this.usernameInput) this.usernameInput.addEventListener('input', onInputHandler);
      if (this.passwordInput) this.passwordInput.addEventListener('input', onInputHandler);

      // 表单提交
      if (this.formEl) {
        this.formEl.addEventListener('submit', function (e) {
          e.preventDefault();
          if (self.isSubmitting) return;

          var username = (self.usernameInput ? self.usernameInput.value : '').trim();
          var password = self.passwordInput ? self.passwordInput.value : '';

          if (!username) {
            self.setError('请输入账号', 'auth');
            self.usernameInput && self.usernameInput.focus();
            return;
          }

          if (!password) {
            self.setError('请输入密码', 'auth');
            self.passwordInput && self.passwordInput.focus();
            return;
          }

          if (typeof self.onSubmitCallback === 'function') {
            self.onSubmitCallback({
              username: username,
              password: password
            });
          }
        });
      }
    },

    /**
     * 切换密码显隐
     */
    togglePasswordVisibility: function () {
      if (!this.passwordInput) return;
      this.showPassword = !this.showPassword;
      this.passwordInput.type = this.showPassword ? 'text' : 'password';

      var eyeBtn = this.overlayEl.querySelector('#ww-login-eye-btn');
      if (eyeBtn) {
        eyeBtn.innerHTML = this._getEyeSvg(this.showPassword);
        eyeBtn.setAttribute('aria-label', this.showPassword ? '隐藏密码' : '显示密码');
      }
    },

    /**
     * 设置提交 Loading 状态 (防重复提交)
     * @param {boolean} loading
     */
    setLoading: function (loading) {
      this.isSubmitting = !!loading;

      if (this.usernameInput) this.usernameInput.disabled = this.isSubmitting;
      if (this.passwordInput) this.passwordInput.disabled = this.isSubmitting;
      if (this.submitBtn) {
        this.submitBtn.disabled = this.isSubmitting;
        if (this.isSubmitting) {
          this.submitBtn.innerHTML = [
            '<span class="ww-login-spinner" aria-hidden="true"></span>',
            '<span>正在验证…</span>'
          ].join('');
        } else {
          this.submitBtn.innerHTML = [
            '<span>登录故事空间</span>',
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
          ].join('');
        }
      }
    },

    /**
     * 展示错误提示条
     * @param {string} message - 错误说明文案
     * @param {'auth'|'network'} [type='auth'] - 错误类型
     */
    setError: function (message, type) {
      if (!this.alertEl) return;
      type = type === 'network' ? 'network' : 'auth';

      var iconSvg = type === 'network'
        ? '<svg class="ww-login-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>'
        : '<svg class="ww-login-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

      this.alertEl.innerHTML = [
        '<div class="ww-login-alert ww-login-alert-' + type + '" role="alert">',
        iconSvg,
        '  <span>' + escapeHtml(message) + '</span>',
        '</div>'
      ].join('');
    },

    /**
     * 清除错误提示
     */
    clearError: function () {
      if (this.alertEl) {
        this.alertEl.innerHTML = '';
      }
    },

    /**
     * 设置明暗主题
     * @param {'light'|'dark'} theme
     */
    setTheme: function (theme) {
      this.currentTheme = theme === 'dark' ? 'dark' : 'light';
      if (this.overlayEl) {
        this.overlayEl.setAttribute('data-theme', this.currentTheme);
      }
      if (this.themeBtn) {
        this.themeBtn.innerHTML = this._getThemeSvg(this.currentTheme);
      }
    },

    /**
     * 优雅淡出并销毁 DOM 节点
     */
    destroy: function () {
      if (!this.overlayEl) return;
      var el = this.overlayEl;
      el.classList.add('ww-login-exiting');

      var self = this;
      setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        self.overlayEl = null;
        self.formEl = null;
        self.usernameInput = null;
        self.passwordInput = null;
        self.submitBtn = null;
        self.alertEl = null;
        self.themeBtn = null;
        self.isSubmitting = false;
        self.showPassword = false;
      }, 300);
    },

    /**
     * 辅助方法：生成密码显隐图标 SVG
     */
    _getEyeSvg: function (visible) {
      if (visible) {
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>';
      }
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    },

    /**
     * 辅助方法：生成日/夜模式图标 SVG
     */
    _getThemeSvg: function (theme) {
      if (theme === 'dark') {
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>';
      }
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#625177" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>';
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
  global.WeiwanLogin = WeiwanLogin;
})(typeof window !== 'undefined' ? window : this);
