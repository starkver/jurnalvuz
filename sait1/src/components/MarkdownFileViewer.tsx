import { useState, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownFileViewerProps {
  className?: string;
}

export function MarkdownFileViewer({ className = '' }: MarkdownFileViewerProps) {
  const [content, setContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем расширение файла
    if (!file.name.endsWith('.md')) {
      setError('Пожалуйста, выберите файл с расширением .md');
      return;
    }

    setIsLoading(true);
    setError('');
    setFilename(file.name);

    try {
      const text = await file.text();
      setContent(text);
    } catch (err) {
      setError('Ошибка при чтении файла');
      console.error('File reading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearContent = () => {
    setContent('');
    setFilename('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Загрузка файла */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Загрузить файл Markdown (.md)
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900 dark:file:text-blue-300
                dark:hover:file:bg-blue-800"
            />
            
            {content && (
              <button
                onClick={clearContent}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                  rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Очистить
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Загрузка файла...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {filename && !error && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm">
                ✓ Файл загружен: {filename}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Отображение контента */}
      {content && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {filename}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {content.length} символов
            </span>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-6">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      )}

      {/* Пример контента */}
      {!content && !isLoading && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Поддерживаемые возможности
          </h3>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Markdown синтаксис:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Заголовки (# ## ###)</li>
                <li>Жирный и курсивный текст (**жирный** *курсив*)</li>
                <li>Списки (маркированные и нумерованные)</li>
                <li>Ссылки [текст](URL)</li>
                <li>Инлайн код `код` и блоки кода</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Диаграммы Mermaid:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Flowchart (блок-схемы)</li>
                <li>Sequence diagrams (диаграммы последовательности)</li>
                <li>Class diagrams (диаграммы классов)</li>
                <li>State diagrams (диаграммы состояний)</li>
                <li>И многие другие типы диаграмм</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Совет:</strong> Файлы из Obsidian полностью поддерживаются, включая все команды и диаграммы Mermaid.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}