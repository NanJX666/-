/**
 * Formatting helpers for Chinese relative time and text excerpts.
 */

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return `${mins} 分钟前`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} 小时前`;
  }
  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days} 天前`;
  }
  
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(successful);
  } catch {
    return Promise.resolve(false);
  }
}
