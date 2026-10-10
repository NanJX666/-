# 未完 (WeiWan) - 中文小说 RP 聊天前端原型 (v2 交付文档)

> **「故事从这里继续」**  
> 本项目为移动端优先、沉浸式长篇中文小说角色扮演聊天界面的前端原型。  
> 目标用于交付给接收者 Sol 接入 **SillyTavern UI Extension**。  
> 本轮基线版本：Studio v1 (SHA256: `739E2730B31C88D6BE81E44626803E5D20D4B144014E272468F865A7A5A831F3`)

---

## 一、启动与运行方法

```bash
# 1. 安装项目依赖（注意：依赖环境存在 esbuild peer 警告，由 Sol 统一归一化锁文件）
npm install

# 2. 启动本地开发预览服务器 (默认端口 3000)
npm run dev

# 3. 运行静态类型检查
npm run lint

# 4. 生产环境构建验证
npm run build
```

---

## 二、服务接口规范 (`src/types/story.ts`)

组件层严禁绕过服务接口直接存取存储或调用外部网络。所有业务行为均通过 `StoryService` 契约定义：

```typescript
export interface StoryService {
  listStories(): Promise<Story[]>;
  getStory(id: string): Promise<Story | null>;
  getMessages(storyId: string): Promise<StoryMessage[]>;
  createStory(params: { characterName: string; setting: string; customTitle?: string }): Promise<Story>;
  renameStory(storyId: string, newTitle: string): Promise<void>;
  deleteStory(storyId: string): Promise<StoryBackup>;
  restoreStory(backup: StoryBackup): Promise<void>;
  sendMessage(storyId: string, content: string, callbacks?: StreamCallbacks): Promise<void>;
  stopGeneration(storyId: string): void;
  isGenerating(storyId: string): boolean;
  regenerateLatest(storyId: string, callbacks?: StreamCallbacks): Promise<void>;
  retryLastMessage(storyId: string, callbacks?: StreamCallbacks): Promise<void>;
  switchCandidate(storyId: string, messageId: string, index: number): Promise<void>;
  editMessage(storyId: string, messageId: string, newContent: string): Promise<void>;
  getPreferences(): ReadingPreferences;
  updatePreferences(partial: Partial<ReadingPreferences>): void;
  subscribe(listener: () => void): () => void;
  resetToDefaults(): Promise<void>;
}
```

---

## 三、Mock 适配器与数据行为约定 (`src/services/mockStoryService.ts`)

1. **数据存储命名空间**：
   - 故事集：`localStorage.getItem('weiwan_v1_stories')`
   - 对话记录：`localStorage.getItem('weiwan_v1_messages')`
   - 阅读偏好：`localStorage.getItem('weiwan_v1_prefs')`
2. **取消生成（Stop Generation）**：
   - 点击停止（或触发离开守卫确认）时，立即清除活动定时器句柄；
   - 消息标记为 `isStreaming: false, isInterrupted: true`，截断已生成的片段并持久化保存至当前候选；
   - 适配器初始化时包含状态自愈：页面意外刷新不会死锁在 streaming 状态。
3. **候选回复（Candidates）**：
   - 每条助手消息维护 `candidates: string[]` 和 `activeCandidateIndex: number`；
   - 「重新生成」仅对**最新一条助手回复**有效，新增候选并启动流式；
   - 重新生成失败或中断时，之前的候选版本全部保留，通过 `< 1/3 >` 胶囊可无损前后切回。
4. **编辑与草稿保护**：
   - 允许就地编辑任何消息，保存时更新当前候选槽；
   - 发送失败或编辑失败时，输入草稿保留，不因异常清空用户劳动。

---

## 四、样式区分：独立外壳与可嵌入核心

为便于后续将界面挂载至 SillyTavern UI Extension，样式结构划分为：

1. **可嵌入核心样式 (`src/styles/mobile-layout.css` 及 `src/index.css`)**：
   - 所有选择器全部限定在 `.story-lite-root` 作用域内；
   - 包含主题色彩变量（`theme-light` / `theme-dark`）、小说宋体（`novel-reading-font`）、安全区保护类（`mobile-bottom-safe`）、44px 触控包裹类（`touch-target-44`）；
   - **未直接声明全局通配覆盖**。
2. **独立原型全屏外壳**：
   - 仅 `#root { min-height: 100dvh }` 作为独立网页的容器；
   - 正式嵌入 ST 时，只需在 ST 插件面板中渲染带有 `.story-lite-root` 类名的根节点。

---

## 五、消息显示边界与酒馆接入指引

1. **纯前端 Mock 消息展示边界**：
   - 现有消息循环已解耦并抽取为 `MockMessageList.tsx`；
   - 仅负责展示纯文本、就地编辑输入框、候选分页胶囊与静态测试样本；
   - **未引入任何 Prompt 引擎，未臆测 ST 内部 API，未对动态模型输出使用 dangerouslySetInnerHTML**。
2. **正式接入时的架构约定**：
   - 真实版本采用“Google 外层导航/输入 + ST 原版消息区域/必要扩展 + ST 原版生成逻辑”；
   - 正式接入时由 Sol 在 ST 原生容器中保留 `#chat`、`.mes`、`.mesid` 以及 ST 的原生事件流；
   - React 外层组件不接管原生消息内部节点，不渲染第二份全量聊天树。

---

## 六、三类检查报告（真实记录）

### 1. 实际执行过的检查 (Verified)
- [x] **TypeScript 静态检查**：`tsc --noEmit`（`npm run lint`）执行通过，0 错误 0 警告。
- [x] **Vite 生产打包验证**：`vite build` 执行通过，构建出完整 dist 静态文件。
- [x] **手机输入回车保护**：360px ~ 430px 下，文本框输入多行文本按 Enter 正常产生换行，绝不误触发送；桌面端支持 Ctrl+Enter / Cmd+Enter 发送。
- [x] **IME 中文输入法保护**：输入拼音选词按 Enter，通过 `isComposing` 与 `keyCode === 229` 拦截，不触发快捷发送。
- [x] **流式上翻滚动锁定修复**：在长文本流式输出期间，手动向上滚动 600px，利用 `isUserScrolledUpRef` 实时判断，彻底修复了 v1 中每 27ms 被强制拉回底部的 Bug；点击静止的“回到最新”按钮后平滑滚底并恢复自动跟随。
- [x] **触控目标规范化**：复制、编辑、重新生成、候选切换 `< 1/3 >`、发送、停止、关闭按钮均确保点击区域 $\ge 44\times 44\text{ CSS px}$。
- [x] **统一离开守卫**：生成中或编辑中点击返回书架、抽屉切换故事、新建故事均会拦截并提示，避免跨故事流串写或编辑丢失。
- [x] **草稿异常保留**：模拟网络报错时，输入内容恢复至文本框并提示重试。

### 2. 源码检查通过的事项 (Codebase Audited)
- [x] 业务组件内无直接 `localStorage` 调用（仅集中在 `mockStoryService.ts` 内部）；
- [x] 源码中无任何模型 SDK（如 `@google/genai`）导入与调用；
- [x] 无任何真实 API Key、外部网络接口、或臆测的 SillyTavern URL 请求。

### 3. 未验证 / 明确由 Sol 负责的事项 (Unverified / Handed over to Sol)
- **真机软键盘视口压缩**：在 realme GT5 Pro (Via 浏览器) 与小米14 (自带浏览器) 上，未进行物理真机软键盘弹起时的 `window.visualViewport` 像素级边缘测试（当前仅在 Studio 模拟视口中测试）。
- **已知工程依赖冲突**：Vite 与 esbuild 存在 peer 依赖版本差异，当前 `bun.lock` 为 Studio 临时状态，由 Sol 在接收后统一修复并生成正式可复现锁文件。
- **Tailwind 全局 Preflight 影响**：Tailwind 对原生 button/input 的部分默认 reset 可能影响 ST 宿主样式，需在真实接入 ST 扩展时由 Sol 统一评估是否使用独立的 PostCSS prefixer 或 scoped preflight。
- **真实大模型与 ST 原生插件挂载**：当前全部回复为内置 Mock 语料，未接入真实大模型；ST 原生 DOM 挂载由 Sol 负责。

---

## 七、启动加载画面与原生独立组件规范

根据移动端优先与扩展加载生命周期要求，提供了两套互通实现的加载画面：

### 1. React 内置组件 (`src/components/common/StartupLoadingScreen.tsx`)
- 真实加载生命周期：监听服务初次就绪信号平滑退出，超时（4.5s）自动切换为“加载较久，继续等待”提示；遇到异常抛出清晰错误信息并提供受控重试按钮。
- 原型评审工具支持：可在「演示工具」中随时唤起，模拟检验「正常加载」、「加载较久」、「加载失败」三态切换。
- 零虚假进度、适配深浅色主题、适配 360/390/430px 及横屏，支持 `prefers-reduced-motion`。

### 2. 独立原生包 (`standalone-splash/`)
- 专供 SillyTavern 扩展在下载庞大 React Bundle 前瞬间直出展示。
- 包含 `splash.css`、`splash.js`（挂载 `window.WeiwanSplash`）与 `index.html` 独立测试沙盒。
- 详见 `standalone-splash/README.md`。

---

## 八、手机登录页面与原生独立组件规范

专为 SillyTavern Multi-user 体系设计的移动端登录组件，保证在 React 聊天应用载入前完成身份鉴权，并平滑衔接已有的启动动画：

### 1. React 内置组件 (`src/components/views/LoginView.tsx`)
- 包含品牌名「未完」与副标题「故事从这里继续」，采用统一衬线/非衬线字体栈与珍珠白/墨夜深色配色；
- 适配 360/390/430px 屏幕与软键盘弹起后视口滚动，输入框采用 16px 字号防 iOS Safari 强制缩放；
- 密码输入框支持眼睛图标切换显隐（`Eye`/`EyeOff`，触控区域 $\ge 44\times 44\text{px}$）；
- 完整设置 `autocomplete="username"` 与 `autocomplete="current-password"`，支持主流浏览器密码自动填充；
- 防重复提交控制：登录提交中进入禁用状态与旋转微动效；
- 简洁明晰的错误与网络异常状态条，用户开始输入修改后自动清除错误；
- 原型评审状态条：支持一键体验「默认」、「输入中」、「登录中」、「密码错误」、「网络失败」5种状态；
- 登录成功后直接触发已有的 `StartupLoadingScreen`，平滑衔接进入主故事书架，避免冗余动画。

### 2. 独立原生包 (`standalone-login/`)
- 纯原生 Vanilla JS（约 5KB，挂载 `window.WeiwanLogin`）与专属样式前缀 `.ww-login-`；
- 零第三方依赖，在 SillyTavern 扩展入口脚本中可直接引入并完成 `/api/users/login` 与 CSRF 交互；
- 提供 `standalone-login/index.html` 独立测试沙盒与 `standalone-login/README.md` 接入文档。


