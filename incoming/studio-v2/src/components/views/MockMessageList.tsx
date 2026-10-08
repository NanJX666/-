import React from 'react';
import {
  Copy,
  Edit3,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { StoryMessage } from '../../types/story';

interface MockMessageListProps {
  messages: StoryMessage[];
  characterName: string;
  fontSize: number;
  editingMessageId: string | null;
  editContent: string;
  showEditTip: boolean;
  isGenerating: boolean;
  copySuccessId: string | null;
  onStartEdit: (msg: StoryMessage) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditContent: (val: string) => void;
  onCopy: (id: string, text: string) => void;
  onRegenerate: () => void;
  onSwitchCandidate: (messageId: string, index: number) => void;
  showRichLayoutSample?: boolean;
}

/**
 * MockMessageList - 负责纯文本模拟消息列表的排版渲染
 * 架构边界说明：
 * 真实接入 SillyTavern 时，由接收者 Sol 在 ST 原生容器中保留 #chat / .mes / .mesid 节点及事件，
 * 本组件仅用于纯前端无后端阶段的 Mock 验证，不接管原生节点，不执行未受信 HTML，不拼装 Prompt。
 */
export const MockMessageList: React.FC<MockMessageListProps> = ({
  messages,
  characterName,
  fontSize,
  editingMessageId,
  editContent,
  showEditTip,
  isGenerating,
  copySuccessId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeEditContent,
  onCopy,
  onRegenerate,
  onSwitchCandidate,
  showRichLayoutSample = false,
}) => {
  const latestAssistantMsgIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 静态 React 富内容布局样本（用于测试容器宽度、深浅色模式与宽表格横向滚动） */}
      {showRichLayoutSample && (
        <aside
          aria-label="富文本布局排版测试样本"
          className="p-4 sm:p-5 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-xs space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
            <span className="font-medium text-[var(--brand-primary)]">
              布局测试样本（长文 / 折叠 / 宽表格）
            </span>
            <span className="text-[10px] text-[var(--text-subtle)]">
              实际预设兼容未验证 · 仅供视口宽度与主题测试
            </span>
          </div>

          <p className="novel-reading-font text-[var(--text-main)] leading-[1.8] text-sm">
            这是一家临海旧书店的典型午后。书架之间弥漫着干燥木料与受潮纸张混合的气味。外侧的雨水顺着青黑色的瓦当连绵滑落，汇入街边的石槽。
          </p>

          {/* HTML5 标准 details 折叠标签测试 */}
          <details className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-main)]">
            <summary className="font-medium cursor-pointer py-1 select-none text-[var(--text-main)]">
              点击展开环境备忘录与旧地图索引
            </summary>
            <div className="mt-2 text-[var(--text-muted)] space-y-1 pl-2 border-l-2 border-[var(--brand-primary)]/40">
              <p>· 码头西侧旧防波堤建立于民国二十三年，七十年代填海后已不可见。</p>
              <p>· 书架第四排《海防要览》附有手绘港口剖面图。</p>
            </div>
          </details>

          {/* 宽表格横向滚动防撑破视口测试 */}
          <div className="rich-layout-table-container rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)]">
            <table className="w-full text-left border-collapse min-w-[380px]">
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]">
                  <th className="p-2.5 font-medium">文献名称</th>
                  <th className="p-2.5 font-medium">年份</th>
                  <th className="p-2.5 font-medium">保管状态</th>
                  <th className="p-2.5 font-medium">备注</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-main)]">
                <tr className="border-b border-[var(--border-light)]">
                  <td className="p-2.5">《沿海小城舆图》</td>
                  <td className="p-2.5">1934</td>
                  <td className="p-2.5">完整（略有水渍）</td>
                  <td className="p-2.5">西侧第三排底</td>
                </tr>
                <tr>
                  <td className="p-2.5">《林氏家族手记》</td>
                  <td className="p-2.5">1952</td>
                  <td className="p-2.5">装订线脱落</td>
                  <td className="p-2.5">沈砚私藏抽屉</td>
                </tr>
              </tbody>
            </table>
          </div>
        </aside>
      )}

      {/* 真实消息流 */}
      {messages.map((msg, index) => {
        const isAssistant = msg.role === 'assistant';
        const isLatestAssistant = index === latestAssistantMsgIndex;
        const hasCandidates = msg.candidates && msg.candidates.length > 1;
        const isEditingThis = editingMessageId === msg.id;

        return (
          <article
            key={msg.id}
            className={`relative group transition-opacity ${
              isAssistant
                ? 'pt-1'
                : 'py-3.5 px-4 rounded-3xl bg-[var(--user-bg)] border border-[var(--user-border)] shadow-xs ml-3 sm:ml-12'
            }`}
          >
            {/* 发言者标签与候选指示 */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 select-none">
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={
                    isAssistant
                      ? 'font-serif text-[var(--brand-primary)] text-sm font-semibold'
                      : 'text-[var(--text-main)]'
                  }
                >
                  {isAssistant ? characterName : '我'}
                </span>
                {msg.isInterrupted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-normal readable-alert-warning border">
                    已停止（保留片段）
                  </span>
                )}
              </div>

              {/* 候选切换器 (< 1/3 >) 保证触控区域 >= 44x44px */}
              {isAssistant && hasCandidates && (
                <div className="flex items-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] rounded-full border border-[var(--border-light)] pl-1 pr-1">
                  <button
                    disabled={msg.activeCandidateIndex <= 0}
                    onClick={() => onSwitchCandidate(msg.id, msg.activeCandidateIndex - 1)}
                    className="touch-target-44 w-11 h-11 flex items-center justify-center hover:text-[var(--text-main)] disabled:opacity-25 active:scale-90 transition-transform cursor-pointer"
                    aria-label="上一条候选回复"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-xs">
                    {msg.activeCandidateIndex + 1}/{msg.candidates.length}
                  </span>
                  <button
                    disabled={msg.activeCandidateIndex >= msg.candidates.length - 1}
                    onClick={() => onSwitchCandidate(msg.id, msg.activeCandidateIndex + 1)}
                    className="touch-target-44 w-11 h-11 flex items-center justify-center hover:text-[var(--text-main)] disabled:opacity-25 active:scale-90 transition-transform cursor-pointer"
                    aria-label="下一条候选回复"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 正文区域或就地编辑器 */}
            {isEditingThis ? (
              <div className="mt-2 space-y-3">
                <label htmlFor={`edit-input-${msg.id}`} className="sr-only">
                  编辑消息正文
                </label>
                <textarea
                  id={`edit-input-${msg.id}`}
                  value={editContent}
                  onChange={(e) => onChangeEditContent(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm leading-relaxed resize-none min-h-[140px] focus:outline-hidden focus:border-[var(--brand-primary)] custom-scrollbar"
                />
                {showEditTip && (
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 px-1">
                    <Info className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                    <span>后面的回复不会自动重写，修改将仅保存在此段落。</span>
                  </div>
                )}
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="touch-target-44 min-h-[44px] px-4 rounded-full border border-[var(--border-light)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    className="touch-target-44 min-h-[44px] px-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            ) : (
              /* 小说衬线排版正文 */
              <div
                className={`novel-reading-font text-[var(--text-main)] text-left whitespace-pre-wrap select-text leading-[1.85] tracking-wide ${
                  isAssistant ? '' : 'italic opacity-95'
                }`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {msg.content}
                {msg.isStreaming && (
                  <span
                    aria-label="正在生成中"
                    className="inline-block w-1.5 h-4 ml-1 bg-[var(--brand-primary)] animate-pulse align-middle"
                  />
                )}
              </div>
            )}

            {/* 消息操作栏（触控目标全部 >= 44x44px） */}
            {!isEditingThis && !msg.isStreaming && (
              <div className="mt-2.5 flex items-center flex-wrap gap-1 text-xs text-[var(--text-muted)] select-none">
                {/* 复制按钮 */}
                <button
                  type="button"
                  onClick={() => onCopy(msg.id, msg.content)}
                  className="touch-target-44 min-h-[44px] px-3 rounded-full flex items-center gap-1.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                  aria-label="复制段落正文"
                >
                  {copySuccessId === msg.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-600 font-medium text-xs">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" />
                      <span className="text-xs">复制</span>
                    </>
                  )}
                </button>

                {/* 编辑按钮 */}
                <button
                  type="button"
                  onClick={() => onStartEdit(msg)}
                  className="touch-target-44 min-h-[44px] px-3 rounded-full flex items-center gap-1.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                  aria-label="编辑该段落"
                >
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span className="text-xs">编辑</span>
                </button>

                {/* 重新生成按钮（仅限最新一条助手回复） */}
                {isAssistant && isLatestAssistant && !isGenerating && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="touch-target-44 min-h-[44px] px-3.5 rounded-full flex items-center gap-1.5 bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-medium border border-[var(--brand-primary)]/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    aria-label="重新生成最新回复"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span className="text-xs">重新生成</span>
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
