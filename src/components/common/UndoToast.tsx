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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl bg-[var(--text-main)] text-[var(--bg-surface)] border border-[var(--border-light)] text-xs animate-slideUp max-w-[92vw]"
    >
      <span className="truncate max-w-[180px] sm:max-w-xs">{message}</span>
      <button
        onClick={onUndo}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>撤销</span>
      </button>
      <button
        onClick={onDismiss}
        aria-label="关闭提示"
        className="p-1 rounded-full opacity-60 hover:opacity-100 active:scale-90 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
