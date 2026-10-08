import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onDismiss,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full shadow-2xl bg-[var(--text-main)] text-[var(--bg-surface)] border border-[var(--border-light)] text-xs animate-slideUp max-w-[92vw]"
    >
      <span className="truncate max-w-[160px] sm:max-w-xs">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="touch-target-44 min-h-[44px] px-3.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
        <span>撤销</span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="关闭撤销提示"
        className="touch-target-44 w-11 h-11 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 active:scale-90 transition-opacity cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
