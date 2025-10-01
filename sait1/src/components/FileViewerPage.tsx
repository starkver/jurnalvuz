import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, FileText, Clock, User, Download, Eye, EyeOff, Copy } from 'lucide-react';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';
import { toast } from '../lib/toast';
import { useAuth } from './AuthContext';
import { checkAndAwardAchievements } from './AchievementsInitializer';

interface FileViewerPageProps {
  file: {
    id: string;
    name: string;
    content: string;
    uploadedAt: string;
    sharedBy?: string;
    sharedWith?: 'none' | 'all' | 'specific';
    isOwn?: boolean;
  };
  onBack: () => void;
}

export function FileViewerPage({ file, onBack }: FileViewerPageProps) {
  const [showRawContent, setShowRawContent] = useState(false);
  const { user } = useAuth();
  
  const wordCount = file.content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Примерно 200 слов в минуту
  const characterCount = file.content.length;

  // Записываем факт просмотра файла для достижений
  useEffect(() => {
    if (user?.role === 'student') {
      recordFileView(user.username, file.id, file.name);
      checkAndAwardAchievements.firstFileView(user.username);
    }
  }, [user, file.id]);

  const recordFileView = (username: string, fileId: string, fileName: string) => {
    const viewHistory = JSON.parse(localStorage.getItem('userFileViews') || '{}');
    const userViews = viewHistory[username] || [];
    
    // Проверяем, не просматривал ли пользователь этот файл недавно (в течение дня)
    const today = new Date().toDateString();
    const alreadyViewedToday = userViews.some((view: any) => 
      view.fileId === fileId && new Date(view.date).toDateString() === today
    );
    
    if (!alreadyViewedToday) {
      userViews.push({
        fileId,
        fileName,
        date: new Date().toISOString()
      });
      
      viewHistory[username] = userViews;
      localStorage.setItem('userFileViews', JSON.stringify(viewHistory));
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(file.content);
    toast.success('Содержимое скопировано в буфер обмена');
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Файл загружен');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Верхняя панель управления */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold truncate max-w-md">
                  {file.name.replace('.md', '')}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowRawContent(!showRawContent)}
              >
                {showRawContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showRawContent ? 'Скрыть код' : 'Показать код'}
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleCopyContent}>
                <Copy className="h-4 w-4" />
                Копировать
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Скачать
              </Button>
              

            </div>
          </div>
          
          {/* Метаданные файла */}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {file.sharedBy && (
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {file.sharedBy}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(file.uploadedAt).toLocaleDateString()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <span>{characterCount} символов</span>
              <span>•</span>
              <span>{wordCount} слов</span>
              <span>•</span>
              <span>~{readingTime} мин. чтения</span>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {showRawContent ? (
          <div className="bg-muted/50 rounded-lg border">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-sm">Исходный Markdown код</h3>
            </div>
            <pre className="p-6 text-sm overflow-auto max-h-[70vh] font-mono">
              <code className="text-foreground">{file.content}</code>
            </pre>
          </div>
        ) : (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-8">
                <EnhancedMarkdownRenderer content={file.content} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Нижняя панель */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Документ загружен</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Markdown формат</span>
              <span>•</span>
              <span>{(new Blob([file.content]).size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}