import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Upload, Send, Users, FileText, Calendar, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';
import { toast } from '../lib/toast';

interface GroupFile {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  uploadDate: string;
  description: string;
  type: 'lesson' | 'assignment' | 'material';
}

interface UploadedFile {
  id: string;
  name: string;
  content: string;
  uploadDate: string;
  size: number;
}

export function GroupManagementSection() {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileForSend, setSelectedFileForSend] = useState<UploadedFile | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sendData, setSendData] = useState({
    name: '',
    description: '',
    type: 'material' as 'lesson' | 'assignment' | 'material'
  });

  // Получаем список групп из localStorage
  const getGroups = () => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const groups = new Set();
    
    // Преобразуем объект пользователей в массив и перебираем его
    Object.values(users).forEach((user: any) => {
      if (user.role === 'student' && user.group) {
        groups.add(user.group);
      }
    });
    
    return Array.from(groups) as string[];
  };

  // Получаем файлы для выбранной группы
  const getGroupFiles = (): GroupFile[] => {
    const files = JSON.parse(localStorage.getItem('groupFiles') || '[]');
    if (!selectedGroup) return [];
    if (selectedGroup === 'all') return files;
    return files.filter((file: GroupFile) => file.groupId === selectedGroup);
  };

  const groups = getGroups();
  const groupFiles = getGroupFiles();

  // Загрузка файла на сайт (первый этап)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.name.toLowerCase().endsWith('.md')) {
      toast.error('Пожалуйста, загружайте только Markdown файлы (.md)');
      event.target.value = '';
      return;
    }

    setUploadingFile(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Базовая проверка на содержимое HTML/JS
        if (content.includes('<!DOCTYPE') || content.includes('<html>') || content.includes('<script>')) {
          toast.error('Этот файл содержит HTML/JavaScript код. Пожалуйста, загрузите Markdown файл с учебным содержимым.');
          event.target.value = '';
          setUploadingFile(false);
          return;
        }
        
        const uploadedFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          content,
          uploadDate: new Date().toISOString(),
          size: file.size
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        toast.success(`Файл "${file.name}" успешно загружен на сайт`);
        
        // Очищаем input
        event.target.value = '';
      };
      
      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      toast.error('Ошибка при загрузке файла');
    } finally {
      setUploadingFile(false);
    }
  };

  // Отправка файла студентам (второй этап)
  const handleSendToGroup = async () => {
    if (!selectedFileForSend || !selectedGroup) return;

    setSendingFile(true);
    
    try {
      const existingFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
      const existingContent = JSON.parse(localStorage.getItem('fileContents') || '[]');
      
      if (selectedGroup === 'all') {
        // Отправляем всем группам
        for (const group of groups) {
          const groupFile: GroupFile = {
            id: `${selectedFileForSend.id}_${group}`,
            name: sendData.name || selectedFileForSend.name,
            groupId: group,
            groupName: group,
            uploadDate: new Date().toISOString(),
            description: sendData.description,
            type: sendData.type
          };

          existingFiles.push(groupFile);

          // Сохраняем содержимое файла для каждой группы
          const fileContent = {
            id: groupFile.id,
            content: selectedFileForSend.content,
            filename: selectedFileForSend.name
          };
          
          existingContent.push(fileContent);
        }
        
        localStorage.setItem('groupFiles', JSON.stringify(existingFiles));
        localStorage.setItem('fileContents', JSON.stringify(existingContent));
        
        toast.success(`Файл "${sendData.name || selectedFileForSend.name}" успешно отправлен всем группам (${groups.length} групп)`);
      } else {
        // Отправляем конкретной группе
        const groupFile: GroupFile = {
          id: selectedFileForSend.id,
          name: sendData.name || selectedFileForSend.name,
          groupId: selectedGroup,
          groupName: groups.find(g => g === selectedGroup) || selectedGroup,
          uploadDate: new Date().toISOString(),
          description: sendData.description,
          type: sendData.type
        };

        existingFiles.push(groupFile);

        // Также сохраняем содержимое файла
        const fileContent = {
          id: groupFile.id,
          content: selectedFileForSend.content,
          filename: selectedFileForSend.name
        };
        
        existingContent.push(fileContent);
        
        localStorage.setItem('groupFiles', JSON.stringify(existingFiles));
        localStorage.setItem('fileContents', JSON.stringify(existingContent));

        toast.success(`Файл "${groupFile.name}" успешно отправлен группе ${selectedGroup}`);
      }
      
      // Очищаем форму и закрываем диалог
      setSendData({
        name: '',
        description: '',
        type: 'material'
      });
      setSelectedFileForSend(null);
      setShowSendDialog(false);
      
    } catch (error) {
      toast.error('Ошибка при отправке файла');
    } finally {
      setSendingFile(false);
    }
  };

  const deleteUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('Файл удален с сайта');
  };

  const openFilePreview = (file: UploadedFile) => {
    setPreviewFile(file);
    setShowFilePreview(true);
  };

  // Создание примера учебного файла
  const createExampleFile = () => {
    const exampleContent = `# Мембранные рецепторы

## Классификация рецепторов

**Лиганд + рецептор = лигандрецепторный комплекс**

Рецептор — это специализированная белковая молекула, способная связываться с определенным лигандом и передавать сигнал внутрь клетки.

### Типы мембранных рецепторов

#### 1. Мембранные рецепторы
- **Встроенные в плазматическую мембрану**
- Имеют внеклеточный домен для связывания лиганда
- Трансмембранный домен
- Внутриклеточный домен для передачи сигнала

#### 2. Внутриклеточные рецепторы  
- **Цитозольные и ядерные**
- Обычно их называют **ядерными**
- Связываются с липофильными лигандами

## Подтипы мембранных рецепторов

### Ионотропные рецепторы
- Это открытые или закрытые ионные каналы
- При соединении с лигандом происходит изменение конформации
- Изменение проницаемости мембраны для ионов

### Метаботропные рецепторы  
- Связанные с G-белками
- Активируют внутриклеточные сигнальные каскады
- Более сложная система передачи сигнала

## Механизм действия

При связывании лиганда с рецептором происходит:

1. **Конформационные изменения** в структуре рецептора
2. **Активация** внутриклеточных сигнальных путей  
3. **Передача сигнала** внутрь клетки
4. **Клеточный ответ** - изменение метаболизма, экспрессии генов

## Примеры рецепторов

| Тип рецептора | Лиганд | Функция |
|---------------|--------|---------|
| Никотиновый | Ацетилхолин | Передача нервного импульса |
| Адренергический | Адреналин | Стресс-ответ |
| Инсулиновый | Инсулин | Регуляция глюкозы |

## Клиническое значение

Понимание работы рецепторов критически важно для:
- Разработки лекарственных препаратов
- Понимания механизмов заболеваний
- Персонализированной медицины

> [!important] Важно запомнить
> Специфичность связывания лиганда с рецептором определяет избирательность биологического ответа

---

*Изучение рецепторов - основа понимания клеточной сигнализации и фармакологии*`;

    const exampleFile: UploadedFile = {
      id: Date.now().toString(),
      name: 'Пример - Мембранные рецепторы.md',
      content: exampleContent,
      uploadDate: new Date().toISOString(),
      size: new Blob([exampleContent]).size
    };

    setUploadedFiles(prev => [...prev, exampleFile]);
    toast.success('Создан пример учебного файла о мембранных рецепторах');
  };

  // Функция для очистки некорректных файлов
  const clearInvalidFiles = () => {
    // Очищаем groupFiles от HTML/JS файлов
    const groupFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
    const fileContents = JSON.parse(localStorage.getItem('fileContents') || '[]');
    
    const validGroupFiles = groupFiles.filter((file: any) => {
      const content = fileContents.find((fc: any) => fc.id === file.id);
      const fileContent = content?.content || '';
      return !fileContent.includes('<!DOCTYPE') && !fileContent.includes('<html>') && !fileContent.includes('<script>');
    });
    
    const validFileContents = fileContents.filter((content: any) => {
      return !content.content.includes('<!DOCTYPE') && !content.content.includes('<html>') && !content.content.includes('<script>');
    });
    
    localStorage.setItem('groupFiles', JSON.stringify(validGroupFiles));
    localStorage.setItem('fileContents', JSON.stringify(validFileContents));
    
    const removedCount = groupFiles.length - validGroupFiles.length;
    if (removedCount > 0) {
      toast.success(`Удалено ${removedCount} некорректных файлов с HTML/JS содержимым`);
    } else {
      toast.info('Некорректных файлов не найдено');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lesson': return 'Урок';
      case 'assignment': return 'Задание';
      case 'material': return 'Материал';
      default: return 'Материал';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <FileText className="h-4 w-4" />;
      case 'assignment': return <CheckCircle className="h-4 w-4" />;
      case 'material': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление группами</h1>
        <p className="text-muted-foreground">
          Загружайте учебные Markdown файлы, предварительно просматривайте их и отправляйте группам студентов
        </p>
      </div>

      {/* Выбор группы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Выбор группы
          </CardTitle>
          <CardDescription>
            Выберите группу для отправки файлов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-select">Группа</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Отправить всем группам</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!groups.length && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет доступных групп</p>
                <p className="text-sm">Группы появятся после регистрации студентов</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Загрузка файлов на сайт */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Загрузка файлов на сайт
          </CardTitle>
          <CardDescription>
            Сначала загрузите Markdown файлы на сайт для предварительного просмотра
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="file-upload">Выберите файл для загрузки</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearInvalidFiles}
                className="text-orange-600 hover:text-orange-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Очистить некорректные файлы
              </Button>
            </div>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="flex-1"
                >
                  {uploadingFile ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Загрузить файл на сайт
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => createExampleFile()}
                  disabled={uploadingFile}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Создать пример
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Поддерживаются только Markdown файлы (.md) с учебным содержимым
              </p>
            </div>

            {/* Загруженные файлы */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Загруженные файлы ({uploadedFiles.length})</h3>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{new Date(file.uploadDate).toLocaleDateString('ru')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openFilePreview(file)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Предпросмотр
                        </Button>
                        
                        {selectedGroup && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedFileForSend(file);
                              setSendData({
                                name: file.name,
                                description: '',
                                type: 'material'
                              });
                              setShowSendDialog(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Отправить группе
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteUploadedFile(file.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Отправленные файлы */}
      {selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedGroup === 'all' ? 'Отправленные файлы всем группам' : `Отправленные файлы группе ${selectedGroup}`}
            </CardTitle>
            <CardDescription>
              История отправленных файлов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groupFiles.length > 0 ? (
              <div className="space-y-4">
                {groupFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(file.type)}
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">{file.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                            {getTypeLabel(file.type)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(file.uploadDate).toLocaleDateString('ru')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">
                      Отправлено
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Файлы для этой группы не найдены</p>
                <p className="text-sm">Отправьте первый файл группе</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Диалог предпросмотра файла */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Предпросмотр: {previewFile?.name}
            </DialogTitle>
            <DialogDescription>
              Просмотр содержимого файла перед отправкой студентам
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-muted/20 rounded-lg min-h-0">
            {previewFile && previewFile.name.endsWith('.md') ? (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <EnhancedMarkdownRenderer content={previewFile.content} />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {previewFile?.content}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог отправки файла */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              Отправить файл {selectedGroup === 'all' ? 'всем группам' : `группе ${selectedGroup}`}
            </DialogTitle>
            <DialogDescription>
              Заполните метаданные для файла "{selectedFileForSend?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <Label htmlFor="send-name">Название файла</Label>
              <Input
                id="send-name"
                value={sendData.name}
                onChange={(e) => {
                  e.stopPropagation();
                  setSendData(prev => ({ ...prev, name: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Название файла для студентов"
              />
            </div>
            
            <div>
              <Label htmlFor="send-type">Тип</Label>
              <Select 
                value={sendData.type} 
                onValueChange={(value: 'lesson' | 'assignment' | 'material') => 
                  setSendData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">Материал</SelectItem>
                  <SelectItem value="lesson">Урок</SelectItem>
                  <SelectItem value="assignment">Задание</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="send-description">Описание</Label>
              <Textarea
                id="send-description"
                value={sendData.description}
                onChange={(e) => {
                  e.stopPropagation();
                  setSendData(prev => ({ ...prev, description: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Краткое описание файла..."
                rows={3}
              />
            </div>

            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleSendToGroup();
              }}
              disabled={sendingFile}
              className="w-full"
            >
              {sendingFile ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {selectedGroup === 'all' ? 'Отправить всем группам' : 'Отправить группе'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}