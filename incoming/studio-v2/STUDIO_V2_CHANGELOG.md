# STUDIO_V2_CHANGELOG.md - 手机外层 UI 迭代变更记录

日期：2026-10-08  
基线版本：Studio v1 (SHA256: `739E2730B31C88D6BE81E44626803E5D20D4B144014E272468F865A7A5A831F3`)  
目标机型：realme GT5 Pro + Via 浏览器、小米14 + 小米自带浏览器 (360px ~ 430px)

---

## 一、代码修改文件清单（与权限范围严格对照）

### 允许修改范围内的文件
- `src/components/views/ChatView.tsx`：重排手机顶栏、修复流式滚动过时闭包、改造 Enter 换行与防误触、草稿错误保留、统一退出导航守卫、接入 `MockMessageList`。
- `src/components/views/MockMessageList.tsx`（新增组件）：提取原 inline 消息循环，保留纯文本 Mock 交互，保证所有操作区域 $\ge 44\times 44\text{px}$，增加静态富文本/宽表格排版样本供视口与主题检测。
- `src/components/views/StoryListView.tsx`：增加加载中/空列表/搜索无结果/操作错误等组件级状态分流，触控区域全部提升至 $44\times 44\text{px}$，增加清空搜索快捷入口。
- `src/components/views/CreateStoryView.tsx`：小可视高度下滚动保障，键盘弹起防丢失草稿，错误就地提示，触控区域 $\ge 44\times 44\text{px}$。
- `src/components/views/LandingView.tsx`：优化移动端顶栏外置日夜模式与 44px 触控区。
- `src/components/drawers/StoryDrawer.tsx`：增加 Esc 键退出支持与 44px 触控目标。
- `src/components/modals/ConfirmDialog.tsx`：增加 Esc 键关闭、焦点捕获与 44px 触控目标。
- `src/components/modals/RenameStoryModal.tsx`：增加 Esc 键关闭、输入框标签关联与 44px 触控目标。
- `src/components/modals/DemoToolsModal.tsx`：增加 Esc 键关闭与 44px 触控目标。
- `src/components/common/UndoToast.tsx`：撤销与关闭按钮保证 $\ge 44\times 44\text{px}$。
- `src/App.tsx`：引入 `./styles/mobile-layout.css`，保持业务契约与现有服务实例。
- `src/styles/mobile-layout.css`（新增样式）：所有规则严格限定在 `.story-lite-root` 作用域内，支持安全区 padding、44px 触控包裹、高对比度深浅警示色与表格横向滚动。
- `README.md` 与 `STUDIO_V2_CHANGELOG.md`：更新交接文档。

### 未触碰的保留文件（严格由接收者 Sol 负责）
- `src/services/**`（未修改）
- `src/types/**`（未修改）
- `package.json`（未修改）
- 现有依赖锁文件（`bun.lock` 等未修改）
- `vite.config.ts`（未修改）
- `tsconfig.json`（未修改）
- `src/index.css`（未修改）
- `src/main.tsx`（未修改）

---

## 二、核心问题修复与交互变更细节

### 1. 手机输入与导航保护
- **Enter 键行为**：修改为移动端回车默认换行，只有明确点击圆形发送按钮才会发送；桌面端保留说明并支持 `Ctrl+Enter` / `Cmd+Enter` 快捷发送。严格保留 `isComposing` 与 `keyCode === 229` 保护，杜绝中文输入法候选确认时走火。
- **发送异常草稿恢复**：发送如果抛出异常或网络故障模拟，发送前输入的文字会自动填回输入框，绝不不可恢复地永久清空。
- **编辑保存异常保护**：编辑消息时如果保存失败，不关闭编辑器，草稿保留在 textarea 中，并在下方显示明确的错误条。
- **一致的退出守卫**：
  - 点击返回书架、抽屉切换故事、新建故事三处入口统一触发守卫；
  - 若正在流式输出：弹窗提示“正在生成回复，离开将停止并保存已接收内容”，确认后调用 `stopGeneration` 并在完成后安全切换；
  - 若正在编辑消息：弹窗提示“有未保存的编辑内容”，由用户确认是否放弃；
  - 增加 `window.addEventListener('beforeunload')` 在标签页关闭或刷新时做浏览器级提醒。

### 2. 手机顶栏重排与 44px 触控规范
- **顶栏呼吸感与标题可读性**：
  - 将原先拥挤横排的字号步进器改为轻巧的 `[ Type 17 ]` 触控胶囊，点击弹出直觉的字号调节层（支持 A⁻ / A⁺ 与档位点选）；
  - 腾出 180px~220px 宽度给故事标题，并在 360px 屏幕下支持单触标题弹窗查看完整标题与自由设定详情；
  - 白天/黑夜模式依然保持外置 1 触切换。
- **触控区域实测标准**：
  - 复制、编辑、重新生成、候选翻页 `< 1/3 >`、发送、停止、关闭按钮均确保点击区域 $\ge 44\times 44\text{ CSS px}$。

### 3. 流式滚动与视口跟随 Bug 彻底修复
- **v1 滚动被强制拽回 Bug 原因**：在 `onChunk` 回调中读取了组件 state `isUserScrolledUp`，该 state 在发送时被旧闭包捕获为 `false`，导致无论用户向上滚动多少像素，每 35ms 收到新字符时都会执行一次 `scrollToBottom('auto')`。
- **v2 修复方案**：使用 `isUserScrolledUpRef = useRef(false)`，在 `handleScroll` 实时计算 `distanceToBottom > 120` 并同步写入 Ref。在 `onChunk` 中读取 `!isUserScrolledUpRef.current`，彻底杜绝向上阅读被强制拽底。
- **回到最新按钮**：移除了分散阅读注意力的持续弹跳动画（`animate-bounce`），改为静止且可见度高的浮动胶囊，只有用户主动点击后才恢复底部跟随。

### 4. 边界提取与富文本排版样本
- **MockMessageList**：职责完全抽离，正文排版与输入控制解耦。
- **静态排版样本**：在更多菜单中提供“显示排版样本”，包含小说段落、HTML `<details>` 折叠及宽数据表格横向滚动容器，方便在 realme/小米 等真机上测试 360px 视口与深色模式下是否横向溢出（明确标注“实际预设兼容未验证，正式接入时由 Sol 保留 ST 原生消息 DOM”）。
