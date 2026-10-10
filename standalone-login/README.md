# “未完” 手机登录页面 (独立原生组件说明)

本目录为专为 **SillyTavern Multi-user** 扩展设计的原生移动端登录页面。在宿主页面下载并执行大型 React 聊天应用主脚本前即可先行展示，完成身份鉴权后平滑衔接已有的启动加载画面（`WeiwanSplash`）。

---

## 包含文件清单

1. `login.css`：完全作用域隔离的样式文件（专用前缀 `.ww-login-`），沿用珍珠白（浅色）与墨夜沉寂（深色）配色，支持 360/390/430px 屏幕、软键盘弹起后内容滚动、iOS 输入防自动缩放与 `@media (prefers-reduced-motion)` 适配。
2. `login.js`：轻量级 Vanilla JavaScript 控制器（约 5KB，零第三方依赖）。挂载全局对象 `window.WeiwanLogin`。
3. `index.html`：独立可运行的调试预览沙盒，包含底部调试面板，支持即时测试：默认、输入中、登录中、密码错误、网络失败、登录成功平滑衔接已有启动动画（`WeiwanSplash`）以及日/夜色切换。

---

## 核心接口 API (`WeiwanLogin`)

```javascript
// 1. 初始化并展示登录页面
WeiwanLogin.show({
  theme: 'light', // 可选 'light' | 'dark'，默认 'light'
  container: document.body, // 可选挂载节点，默认 document.body
  onThemeChange: function(nextTheme) {
    console.log('主题已切换为:', nextTheme);
  },
  onSubmit: function({ username, password }) {
    // 拦截表单提交，触发后续 SillyTavern 鉴权请求
    WeiwanLogin.setLoading(true);
    callSillyTavernAuth(username, password);
  }
});

// 2. 状态切换与防重复提交
WeiwanLogin.setLoading(true);  // 禁用输入框与按钮，切换为“正在验证…”旋转动画
WeiwanLogin.setLoading(false); // 恢复输入状态

// 3. 错误提示展示 (输入框有任何编辑行为时会自动清除错误)
WeiwanLogin.setError('账号或密码不正确，请重新输入', 'auth');     // 红色认证错误
WeiwanLogin.setError('连接故事服务器超时，请检查网络后重试', 'network'); // 黄色网络错误
WeiwanLogin.clearError(); // 手动清除错误提示

// 4. 切换日/夜色
WeiwanLogin.setTheme('dark'); // 'light' | 'dark'

// 5. 销毁登录界面 (平滑淡出 300ms 后从 DOM 中移除)
WeiwanLogin.destroy();
```

---

## SillyTavern Multi-user 接入示例

在 SillyTavern 扩展入口脚本中，通常需要先检查是否存在有效 Session；若未登录，则拉起 `WeiwanLogin`：

```javascript
// 获取当前系统日夜主题
const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';

// 检查是否已有活跃会话
async function initSession() {
  try {
    const res = await fetch('/api/users/current', { credentials: 'include' });
    if (res.ok) {
      // 已登录：直接展示启动加载动画并载入 React 应用
      launchMainApp();
      return;
    }
  } catch (e) {
    // 忽略并继续展示登录界面
  }

  // 未登录：调出登录页面
  WeiwanLogin.show({
    theme: currentTheme,
    onSubmit: async function({ username, password }) {
      WeiwanLogin.setLoading(true);

      try {
        // 请求 SillyTavern Multi-user 认证接口
        const authRes = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken() // 注入宿主 CSRF Token
          },
          credentials: 'include',
          body: JSON.stringify({ username, password })
        });

        if (authRes.ok) {
          // 1. 登录成功：销毁登录页面
          WeiwanLogin.destroy();
          // 2. 衔接已有的启动动画
          launchMainApp();
        } else {
          WeiwanLogin.setLoading(false);
          WeiwanLogin.setError('账号或密码不正确，请重新输入', 'auth');
        }
      } catch (err) {
        WeiwanLogin.setLoading(false);
        WeiwanLogin.setError('连接故事服务器超时，请检查网络后重试', 'network');
      }
    }
  });
}

function launchMainApp() {
  // 调用已有的启动画面组件
  WeiwanSplash.show({ theme: currentTheme });

  // 动态导入 React 聊天扩展主包
  import('./dist/bundle.js')
    .then(({ mountWeiwanApp }) => mountWeiwanApp())
    .then(() => {
      // 主应用挂载完成，启动动画平滑退出
      WeiwanSplash.ready();
    })
    .catch((err) => {
      WeiwanSplash.fail(err.message || '扩展主模块载入失败');
    });
}
```

---

## 规范与体验保障

1. **移动端软键盘兼容**：
   - 整体使用 `min-height: 100dvh` 与 `overflow-y: auto` 布局；
   - 输入框移动端字号严格 $\ge 16\text{px}$，避免 iOS Safari 聚焦时强制视口放大；
   - 键盘升起后表单与错误提示仍可顺畅上下滑动与操作。
2. **凭据自动填充 (Browser Autofill)**：
   - 账号输入框设置 `autocomplete="username"`，密码输入框设置 `autocomplete="current-password"`；
   - 兼容 iOS 钥匙串、Google 密码保险箱及主流密码管理器一键填充。
3. **安全与防重复提交**：
   - 提交过程中输入框与按钮进入 `disabled` 状态，拦截快速双击与并发请求；
   - 客户端不在 LocalStorage 或任何地方持久化真实明文密码；
   - 不伪造没有后端支持的“记住密码”或“找回密码”勾选框。
4. **视觉与动效统一**：
   - 样式与动画完全继承自当前“未完”产品规范与 `standalone-splash`；
   - 原生支持系统 `prefers-reduced-motion: reduce` 偏好。
