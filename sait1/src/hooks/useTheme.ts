import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Инициализируем тему из localStorage или системных настроек
  const getInitialTheme = (): Theme => {
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Проверяем системные настройки
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  // Применяем тему к документу
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Удаляем оба класса перед добавлением нужного
    root.classList.remove('light', 'dark');
    
    // Добавляем класс темы
    root.classList.add(newTheme);
    
    // Устанавливаем атрибут для дополнительной совместимости
    root.setAttribute('data-theme', newTheme);
  };

  // Инициализация при монтировании компонента
  useEffect(() => {
    setMounted(true);
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Слушаем изменения системной темы
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Только если пользователь не установил тему вручную
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    // Современный способ
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Устаревший способ для старых браузеров
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [mounted]);

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Отправляем событие для других компонентов
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
  };

  // Установка конкретной темы
  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
  };

  return { 
    theme, 
    toggleTheme, 
    setTheme: setSpecificTheme,
    mounted 
  };
}