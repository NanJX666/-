# “未完” 启动加载画面 (独立原生组件说明)

本目录为专为 **SillyTavern UI Extension** 准备的独立启动加载画面，在宿主页面下载 React/框架主脚本并完成初始化之前即可先行展示。

---

## 包含文件清单

1. `splash.css`：完全作用域隔离的样式文件（专用类名前缀 `.ww-splash-`），沿用珍珠白（浅色）与墨夜沉寂（深色）配色规范、衬线宋体标题与无衬线界面字体栈。包含 `@media (prefers-reduced-motion)` 与横屏自适应。
2. `splash.js`：轻量级 Vanilla JavaScript 控制器（约 4KB，零第三方依赖）。挂载全局对象 `window.WeiwanSplash`。
3. `index.html`：独立可运行的调试预览沙盒，包含底部调试面板，支持即时测试：正常加载、加载较久、加载失败、就绪平滑退出、日/夜主题切换。

---

## 核心接口 API (`WeiwanSplash`)

```javascript
// 1. 初始化并立即展示
WeiwanSplash.show({
  theme: 'light', // 可选 'light' | 'dark'，默认 'light'
  container: document.body, // 可选挂载节点，默认 document.body
  onRetry: function() {
    // 失败重试外部控制回调（由接入方触发真实重新加载或重试请求）
    console.log('用户点击了重新尝试加载');
    WeiwanSplash.setStatus('loading');
    startRealExtensionInit();
  }
});

// 2. 状态切换
WeiwanSplash.setStatus('loading'); // 正常加载
WeiwanSplash.setStatus('slow');    // 加载较久（提示数据同步中，可继续稍候）
WeiwanSplash.setStatus('failed', '网络连接超时或扩展模块就绪失败'); // 失败（显示重试按钮）

// 3. 失败并绑定重试函数快捷方式
WeiwanSplash.fail('扩展配置读取失败，请点击重试', function() {
  retryInitialization();
});

// 4. 接收到真实就绪信号后平滑退出
// (不强制等待动画，平滑 350ms 淡出后自动从 DOM 中销毁移除)
WeiwanSplash.ready();

// 5. 动态切换主题
WeiwanSplash.setTheme('dark'); // 'light' | 'dark'

// 6. 手动强制销毁 DOM
WeiwanSplash.destroy();
```

---

## SillyTavern 扩展中的接入示例

在 SillyTavern 扩展入口脚本（如 `index.js` 或扩展启动 HTML）最顶部引入：

```html
<link rel="stylesheet" href="./extensions/weiwan/standalone-splash/splash.css" />
<script src="./extensions/weiwan/standalone-splash/splash.js"></script>

<script>
  // 1. 在扩展脚本加载前立即展示
  WeiwanSplash.show({
    theme: document.body.classList.contains('dark') ? 'dark' : 'light',
    onRetry: function() {
      location.reload();
    }
  });

  // 2. 超过 5 秒未初始化完成，自动切换为“较久等待”提示
  const slowTimer = setTimeout(() => {
    WeiwanSplash.setStatus('slow');
  }, 5000);

  // 3. 动态加载 React 主包并挂载完成
  import('./dist/bundle.js')
    .then(({ mountWeiwanExtension }) => {
      clearTimeout(slowTimer);
      return mountWeiwanExtension();
    })
    .then(() => {
      // 4. 真实就绪后调用平滑淡出退出
      WeiwanSplash.ready();
    })
    .catch((err) => {
      clearTimeout(slowTimer);
      WeiwanSplash.fail(err.message || 'SillyTavern 扩展载入失败');
    });
</script>
```

---

## 关键特性保障

- **无虚假百分比**：采用呼吸墨线，不伪造 0%~100% 进度条。
- **触控面积规范**：重试按钮满足 $\ge 44 \times 44\text{ CSS px}$ 手机无障碍规范。
- **动效安全降级**：系统开启减弱动态效果时自动取消平移与缩放，保持清晰文字指引。
- **零全局样式污染**：所有 CSS 变量与选择器均严格限定在 `.ww-splash-` 命名空间下。
