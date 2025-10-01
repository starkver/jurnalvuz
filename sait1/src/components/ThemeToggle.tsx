import { useTheme } from '../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Предотвращаем мерцание при загрузке
  if (!mounted) {
    return (
      <button
        className="relative h-9 w-9 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Переключить тему"
        disabled
      >
        <div className="h-4 w-4 animate-pulse bg-gray-300 dark:bg-gray-600 rounded" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative h-9 w-9 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out"
      aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
    >
      {/* Sun Icon - показывается в светлой теме */}
      <Sun
        className={`absolute top-2 left-2 h-4 w-4 transition-all duration-300 ${
          theme === 'light' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      
      {/* Moon Icon - показывается в темной теме */}
      <Moon
        className={`absolute top-2 left-2 h-4 w-4 transition-all duration-300 ${
          theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}