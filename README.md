# 未完 (WeiWan) - 中文小说 RP 聊天前端原型（交付文档）

> **「故事从这里继续」**  
> 本项目为移动端优先、沉浸式长篇中文小说角色扮演聊天界面的前端原型。  
> 旨在交付给后续开发者直接无缝接入 **SillyTavern UI Extension**。

---

## 一、项目架构与原则

1. **绝对纯净的组件层**：所有业务视图（书架、创建、对话、抽屉）**严禁**直接访问 `localStorage`、模型 SDK 或伪造的外部 REST 接口。
2. **单一服务契约**：所有数据获取、对话发送、流式输出、候选切换、消息编辑与偏好修改，100% 经由 `StoryService` 接口驱动。
3. **零外部网络依赖**：当前原型使用离线 Mock 适配器（`mockStoryService.ts`）与文学语料种子（`mockData.ts`），无需 API Key、无需后端、无需登录鉴权。
4. **移动端手感第一**：针对 390px 手机与窄屏优化，全圆角触控胶囊、外置字号步进器、外置白天/黑夜模式切换、防抖动 `100dvh` 与安全区贴合。

---

## 二、启动与运行方法

```bash
# 1. 安装项目依赖
npm install

# 2. 启动本地开发预览服务器 (运行于 3000 端口)
npm run dev

# 3. 执行类型校验
npm run lint

# 4. 生产环境打包验证
npm run build
```

---

## 三、服务接口规范 (`src/types/story.ts`)

后续接入 SillyTavern 时，开发者仅需实现 `StoryService` 接口：

```typescript
export interface StoryService {
  // 故事管理
  listStories(): Promise<Story[]>;
  getStory(id: string): Promise<Story | null>;
  getMessages(storyId: string): Promise<StoryMessage[]>;
  createStory(params: { characterName: string; setting: string; customTitle?: string }): Promise<Story>;
  renameStory(storyId: string, newTitle: string): Promise<void>;
  deleteStory(storyId: string): Promise<StoryBackup>;
  restoreStory(backup: StoryBackup): Promise<void>;

  // 消息生成与流式控制
  sendMessage(storyId: string, content: string, callbacks?: StreamCallbacks): Promise<void>;
  stopGeneration(storyId: string): void;
  isGenerating(storyId: string): boolean;
  regenerateLatest(storyId: string, callbacks?: StreamCallbacks): Promise<void>;
  retryLastMessage(storyId: string, callbacks?: StreamCallbacks): Promise<void>;

  // 候选与编辑
  switchCandidate(storyId: string, messageId: string, index: number): Promise<void>;
  editMessage(storyId: string, messageId: string, newContent: string): Promise<void>;

  // 偏好与订阅
  getPreferences(): ReadingPreferences;
  updatePreferences(partial: Partial<ReadingPreferences>): void;
  subscribe(listener: () => void): () => void;
  resetToDefaults(): Promise<void>;
}
```

---

## 四、Mock 适配器行为细节 (`src/services/mockStoryService.ts`)

### 1. 模拟数据持久化位置
Mock 适配器使用独立命名空间的本地存储：
- 故事列表：`localStorage.getItem('weiwan_v1_stories')`
- 对话记录：`localStorage.getItem('weiwan_v1_messages')`
- 阅读偏好：`localStorage.getItem('weiwan_v1_prefs')`

### 2. 取消生成（Stop Generation）行为
- 用户点击停止（或在生成中切换故事）时，立即清除活动的定时器句柄（`activeStreams`）。
- **保留已生成文字**：截断当前输出并更新消息为 `isStreaming: false, isInterrupted: true`，将当前残片存入 candidates 中。
- **刷新恢复机制**：构造函数中内置状态自愈，若刷新时存在未完结的流式消息，自动更正为中断保留状态，绝不陷入死循环。

### 3. 候选回复（Candidates）行为
- 每一条回复对象维护 `candidates: string[]` 与 `activeCandidateIndex: number`。
- 「重新生成」仅对**最新一条助手消息**开放；触发时新开候选槽并启动流式。
- 若新候选生成失败或被取消，之前的候选版本完整保留，用户可通过 `< 1/3 >` 胶囊随时前后切回。

### 4. 消息编辑（Edit Message）
- 用户可就地编辑任何一条消息（无论用户发言或助手段落）。
- 编辑保存时静默更新当前候选槽文本，界面提示「后面的回复不会自动重写」，不触发复杂的分支树分裂。

### 5. 删除与撤销（Undo）
- 删除故事时返回完整数据备份 `{ story, messages }`。
- 界面弹出全局 `UndoToast` 浮钮，点击后调用 `restoreStory` 立即完整复原。

---

## 五、样式作用域与 SillyTavern 嵌入指导

为了在嵌入 SillyTavern（拥有自身的页面样式、全局 CSS 与主题）时不产生冲突，样式已进行严格物理隔离：

1. **可嵌入核心样式**：
   - 作用域限定在 `.story-lite-root` 及其派生的 `.theme-light` / `.theme-dark` 容器内。
   - 所有 CSS 变量（`--bg-page`, `--text-main`, `--brand-primary` 等）均绑定在容器类上。
   - **未改写**全局 `body`、`html`、`button`、`input` 默认样式。
2. **全屏独立外壳**：
   - 仅 `#root { min-height: 100dvh }` 用于本次原型独立浏览。
   - 接入扩展时，只需在 ST 容器中直接渲染 `<div className="story-lite-root">...</div>`。
3. **替换适配器四步法**：
   1. 在 `src/services/` 下新建 `stStoryService.ts` 实现 `StoryService`；
   2. 将 SillyTavern 的扩展接口（如 `SillyTavern.getContext().chat`）映射进 `getMessages` 与 `listStories`；
   3. 将流式生成事件对接至 `sendMessage` 的 `onChunk` / `onDone`；
   4. 在 `src/App.tsx` 中将 `mockStoryService` 替换为 `stStoryService` 实例。

---

## 六、实际检查清单（真实的验证记录）

### 实际已完成验证的项目
- [x] **TypeScript 类型检查**：执行 `tsc --noEmit`，通过（0 错误、0 警告）。
- [x] **Vite 生产构建**：执行 `vite build`，成功输出构建包，依赖解析完整。
- [x] **纯净性代码审计**：使用全局搜索排查，确认业务组件无任何直接 `localStorage` 调用（仅限 `mockStoryService`）；无任何模型 SDK 导入；无硬编码网络请求。
- [x] **手机端 390px 布局检验**：
  - 顶部导航外置直觉步进器 `[ A⁻ | 17 | A⁺ ]`（1 档即时缩放，支持快速浮层）；
  - 顶部导航外置日夜模式切换按钮（☀️/🌙，单触即切）；
  - 底部输入区采用 `rounded-3xl` 悬浮胶囊，已挂载 `env(safe-area-inset-bottom)` 安全区垫高；
  - 触控目标均维持在 40~44px 以上，移动端无需 hover 即可操作复制、编辑、重新生成。
- [x] **中文输入法（IME）防打断**：输入框拦截 `e.nativeEvent.isComposing` 与 `keyCode 229`，防止拼音选词回车误触发送。
- [x] **滚动感知保护**：读者翻阅上文时，流式输出不会强行拖拽读者视口，并弹出「回到最新」浮动提示。
- [x] **中途切换故事守卫**：生成中切换故事会弹出中止确认对话框，中止并保存后再切换。

### 如实说明：尚未验证/未接入的事项
- **真实 SillyTavern 运行环境联调**：尚未挂载到真实 SillyTavern 插件目录中进行 DOM 宿主样式测试（待宿主工程就绪）。
- **真实 LLM API**：文本回复均为内置虚构样本，未接入任何真实大语言模型。
- **真机软键盘弹起高度**：在极少数 Android WebView 下，软键盘可能压缩视口，需在宿主接入时根据真机表现确定是否监听 `window.visualViewport`。
