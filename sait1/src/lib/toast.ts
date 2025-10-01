// Простая система уведомлений без внешних зависимостей
let toastCounter = 0;

const createToast = (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => {
  const id = `toast-${++toastCounter}`;
  
  // Создаем контейнер для уведомлений, если его нет
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Создаем уведомление
  const toast = document.createElement('div');
  toast.id = id;
  toast.style.cssText = `
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    max-width: 320px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--foreground);
    font-size: 14px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    pointer-events: auto;
  `;

  // Определяем иконку и цвет для типа
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };

  toast.innerHTML = `
    <span style="font-size: 16px;">${icons[type]}</span>
    <div style="flex: 1;">
      <div style="font-weight: 600;">${message}</div>
      ${description ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${description}</div>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" style="
      background: none; 
      border: none; 
      color: var(--muted-foreground); 
      cursor: pointer;
      padding: 0;
      font-size: 16px;
      line-height: 1;
    ">×</button>
  `;

  // Добавляем цветную полоску слева
  toast.style.borderLeft = `4px solid ${colors[type]}`;

  container.appendChild(toast);

  // Анимация появления
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Автоудаление через 4 секунды
  setTimeout(() => {
    if (document.getElementById(id)) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }
  }, 4000);

  console.log(`${icons[type]} ${message}`);
};

export const toast = {
  success: (message: string, description?: string) => createToast(message, 'success', description),
  error: (message: string, description?: string) => createToast(message, 'error', description),
  info: (message: string, description?: string) => createToast(message, 'info', description),
  warning: (message: string, description?: string) => createToast(message, 'warning', description)
};