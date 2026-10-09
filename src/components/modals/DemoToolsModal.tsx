import React, { useState, useEffect, useRef } from 'react';
import { X, Sliders, RefreshCw, CheckCircle, Info, Sparkles } from 'lucide-react';
import { StoryService } from '../../types/story';

interface DemoToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: StoryService;
  onReloadRequested: () => void;
  onTriggerSplashPreview?: () => void;
}

export const DemoToolsModal: React.FC<DemoToolsModalProps> = ({
  isOpen,
  onClose,
  service,
  onReloadRequested,
  onTriggerSplashPreview,
}) => {
  const [simulateError, setSimulateError] = useState(service.getSimulateErrorOnce());
  const [emptyList, setEmptyList] = useState(service.getEmptyListSimulation());
  const [resetSuccess, setResetSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSimulateError = (checked: boolean) => {
    service.setSimulateErrorOnce(checked);
    setSimulateError(checked);
  };

  const toggleEmptyList = (checked: boolean) => {
    service.setEmptyListSimulation(checked);
    setEmptyList(checked);
    onReloadRequested();
  };

  const handleResetDefaults = async () => {
    if (window.confirm('确定将所有故事与对话重置为初始演示状态吗？现有修改将被覆盖。')) {
      await service.resetToDefaults();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2000);
      onReloadRequested();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-tools-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-colors bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-light)] max-h-[90vh] overflow-y-auto custom-scrollbar animate-fadeIn focus-visible:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--brand-primary)]" />
            <h2 id="demo-tools-title" className="text-base font-serif font-medium">
              原型评审与测试工具
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭演示工具"
            className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-light)] text-xs text-[var(--text-muted)] flex gap-2.5">
            <Info className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
            <div>
              本抽屉仅供评审手机交互边界（网络异常保留输入与重试、空列表状态、流式中断恢复、启动加载画面）。上线时可无缝移除。
            </div>
          </div>

          {/* Test Option: Splash Screen Preview */}
          {onTriggerSplashPreview && (
            <div className="p-3.5 rounded-2xl border border-[var(--border-light)] flex flex-col gap-2">
              <div className="font-medium text-xs text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>启动加载画面 (Splash Screen) 预览</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                可模拟检验“正常加载”、“加载较久（继续等待）”、“加载失败（重试按钮）”三种状态及其退出过渡。
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerSplashPreview();
                }}
                className="mt-1 touch-target-44 min-h-[44px] flex items-center justify-center gap-2 px-4 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white active:scale-95 text-xs font-medium transition-all cursor-pointer"
              >
                <span>进入启动画面状态预览</span>
              </button>
            </div>
          )}

          {/* Test Option 1: Network error simulation */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-[var(--border-light)] hover:bg-[var(--bg-surface-subtle)]/50 transition-colors">
            <div>
              <div className="font-medium text-xs text-[var(--text-main)]">模拟下一次发送网络异常</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                测试：“报错时保留用户输入与已发消息，显示重试入口，重试不重复生成用户消息”。
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => toggleSimulateError(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
            </label>
          </div>

          {/* Test Option 2: Empty list simulation */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-[var(--border-light)] hover:bg-[var(--bg-surface-subtle)]/50 transition-colors">
            <div>
              <div className="font-medium text-xs text-[var(--text-main)]">模拟空故事列表状态</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                无需清空存储即可检验空列表下的引导界面与「新建故事」引导流程。
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={emptyList}
                onChange={(e) => toggleEmptyList(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
            </label>
          </div>

          {/* Test Option 3: Reset demo data */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-light)] flex flex-col gap-2">
            <div className="font-medium text-xs text-[var(--text-main)]">重置演示示例数据</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              恢复《雨停之前》、《末班列车》、《北境来信》三个精选多轮小说样本。
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="mt-1 touch-target-44 min-h-[44px] flex items-center justify-center gap-2 px-4 rounded-full border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] active:scale-95 text-xs font-medium transition-all cursor-pointer"
            >
              {resetSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">已成功重置</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>恢复初始数据与预置故事</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-light)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-target-44 min-h-[44px] px-6 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
