import { MarkdownRenderer } from './MarkdownRenderer';
import { Badge } from './ui/badge';
import { FileText, Clock, User } from 'lucide-react';

interface ObsidianStyleViewerProps {
  content: string;
  filename: string;
  metadata?: {
    uploadedAt?: string;
    sharedBy?: string;
    fileSize?: number;
  };
}

export function ObsidianStyleViewer({ content, filename, metadata }: ObsidianStyleViewerProps) {
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Примерно 200 слов в минуту
  const characterCount = content.length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Заголовок документа в стиле Obsidian */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {filename.replace('.md', '')}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {metadata?.sharedBy && (
              <Badge variant="secondary" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {metadata.sharedBy}
              </Badge>
            )}
            {metadata?.uploadedAt && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(metadata.uploadedAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Статистика документа */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{characterCount} символов</span>
          <span>•</span>
          <span>{wordCount} слов</span>
          <span>•</span>
          <span>~{readingTime} мин. чтения</span>
        </div>
      </div>

      {/* Контент документа */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-none">
          {/* Обертка для стилизации в стиле Obsidian */}
          <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>

      {/* Нижняя панель с дополнительной информацией */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Документ загружен</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Markdown формат</span>
            {metadata?.fileSize && (
              <>
                <span>•</span>
                <span>{(metadata.fileSize / 1024).toFixed(1)} KB</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}