import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { BookOpen, FileText, Upload, Trash2, Eye, RefreshCw } from "lucide-react";
import { useAuth } from "./AuthContext";

interface UserFile {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
  sharedWith: 'none' | 'all' | 'specific';
  sharedBy?: string;
  type?: string;
  description?: string;
}

interface UserCourseSectionProps {
  onViewFile?: (file: any) => void;
}

export function UserCourseSection({ onViewFile }: UserCourseSectionProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const courseNumber = user?.course || "1";

  // Функция для обновления списка файлов
  const refreshSharedFiles = () => {
    const groupFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
    const fileContents = JSON.parse(localStorage.getItem('fileContents') || '[]');
    const adminFiles = JSON.parse(localStorage.getItem('admin_files') || '[]');
    
    // Получаем файлы от преподавателей для текущего курса
    const teacherFiles = groupFiles
      .filter((file: any) => file.groupId === courseNumber)
      .map((file: any) => {
        const content = fileContents.find((fc: any) => fc.id === file.id);
        const fileContent = content?.content || '';
        
        return {
          id: file.id,
          name: file.name,
          content: fileContent,
          uploadedAt: file.uploadDate,
          sharedWith: 'all',
          sharedBy: 'Преподаватель',
          type: file.type,
          description: file.description
        };
      });

    // Получаем файлы от администратора для текущего курса и факультета пользователя
    const userFaculty = user?.faculty || 'medical'; // Факультет по умолчанию
    const adminFilesForUser = adminFiles
      .filter((file: any) => file.course === courseNumber && file.faculty === userFaculty)
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        content: file.content,
        uploadedAt: file.uploadedAt,
        sharedWith: 'all',
        sharedBy: 'Администратор',
        type: file.type,
        description: file.description
      }));
    
    const saved = localStorage.getItem(`course${courseNumber}_shared_files`);
    const oldSharedFiles = saved ? JSON.parse(saved) : [];
    setSharedFiles([...oldSharedFiles, ...teacherFiles, ...adminFilesForUser]);
  };
  
  const [userFiles, setUserFiles] = useState<UserFile[]>(() => {
    const saved = localStorage.getItem(`course${courseNumber}_files_${user?.id}`);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Создаем пример файла при первом запуске
    const exampleContent = `# Биохимия: Основы метаболизма

## Введение в биохимические процессы

Биохимия изучает химические процессы, происходящие в живых организмах. Одним из ключевых понятий является [[#метаболизм]], который включает в себя множество сложных реакций.

> [!note] Важно помнить
> Метаболизм состоит из двух основных процессов: катаболизма и анаболизма.

## Метаболизм

**Метаболизм** — это совокупность всех химических реакций, происходящих в клетке. Он включает:

- **Катаболизм** — процессы расщепления сложных веществ
- **Анаболизм** — процессы синтеза сложных веществ

### Ферментативные реакции

Большинство биохимических реакций катализируются [[#ферментами]]. Эти белковые молекулы значительно ускоряют химические реакции без изменения их равновесия.

Более подробно о [[#классификации ферментов]] вы можете узнать в следующем разделе.

## Ферменты

Ферменты — это биологические катализаторы, которые состоят из белков. Они обладают следующими свойствами:

1. **Специфичность** — каждый фермент катализирует определенную реакцию
2. **Активность** — зависит от температуры и pH среды
3. **Регуляция** — активность может быть изменена различными факторами

### Классификация ферментов

Ферменты классифицируются на основе типа катализируемых реакций:

| Класс | Название | Функция |
|-------|----------|---------|
| 1 | Оксидоредуктазы | Окислительно-восстановительные реакции |
| 2 | Трансферазы | Перенос функциональных групп |
| 3 | Гидролазы | Гидролитическое расщепление |

### Механизм действия

Фермент связывается с субстратом, образуя фермент-субстратный комплекс. Для понимания этого процесса важно изучить [[#структуру активного центра]].

## Структура активного центра

Активный центр фермента — это специфическая область молекулы, где происходит связывание субстрата и катализ реакции.

> [!tip] Модель "ключ-замок"
> Эмиль Фишер предложил модель, согласно которой субстрат (ключ) точно подходит к активному центру фермента (замку).

## Заключение

Понимание основ [[#метаболизма]] и работы [[#ферментов]] является фундаментальным для изучения биохимии.

---

*Попробуйте кликнуть на выделенные ссылки вида [[#метаболизм]] для навигации по документу!*`;

    const exampleFile: UserFile = {
      id: 'example-1',
      name: 'Пример урока - Биохимия.md',
      content: exampleContent,
      uploadedAt: new Date().toISOString(),
      sharedWith: 'none'
    };
    
    return [exampleFile];
  });
  
  const [sharedFiles, setSharedFiles] = useState<UserFile[]>(() => {
    const saved = localStorage.getItem(`course${courseNumber}_shared_files`);
    const groupFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
    const fileContents = JSON.parse(localStorage.getItem('fileContents') || '[]');
    const adminFiles = JSON.parse(localStorage.getItem('admin_files') || '[]');
    
    // Получаем файлы от преподавателей для текущего курса
    const teacherFiles = groupFiles
      .filter((file: any) => file.groupId === courseNumber)
      .map((file: any) => {
        // Находим содержимое файла
        const content = fileContents.find((fc: any) => fc.id === file.id);
        
        // Проверяем, что содержимое является учебным материалом
        const fileContent = content?.content || '';
        if (fileContent.includes('<!DOCTYPE') || fileContent.includes('<html>') || fileContent.includes('<script>')) {
          console.warn(`Файл ${file.name} содержит HTML/JS код вместо учебного материала`);
        }
        
        return {
          id: file.id,
          name: file.name,
          content: fileContent,
          uploadedAt: file.uploadDate,
          sharedWith: 'all',
          sharedBy: 'Преподаватель',
          type: file.type,
          description: file.description
        };
      });

    // Получаем файлы от администратора для текущего курса и факультета пользователя
    const userFaculty = user?.faculty || 'medical'; // Факультет по умолчанию
    const adminFilesForUser = adminFiles
      .filter((file: any) => file.course === courseNumber && file.faculty === userFaculty)
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        content: file.content,
        uploadedAt: file.uploadedAt,
        sharedWith: 'all',
        sharedBy: 'Администратор',
        type: file.type,
        description: file.description
      }));
    
    const oldSharedFiles = saved ? JSON.parse(saved) : [];
    return [...oldSharedFiles, ...teacherFiles, ...adminFilesForUser];
  });

  // Автоматическое обновление файлов каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSharedFiles();
    }, 5000);

    return () => clearInterval(interval);
  }, [courseNumber, user?.faculty]);

  const saveUserFiles = (files: UserFile[]) => {
    setUserFiles(files);
    localStorage.setItem(`course${courseNumber}_files_${user?.id}`, JSON.stringify(files));
  };

  const saveSharedFiles = (files: UserFile[]) => {
    setSharedFiles(files);
    localStorage.setItem(`course${courseNumber}_shared_files`, JSON.stringify(files));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: UserFile = {
          id: Date.now().toString(),
          name: file.name,
          content,
          uploadedAt: new Date().toISOString(),
          sharedWith: 'none'
        };
        saveUserFiles([...userFiles, newFile]);
      };
      reader.readAsText(file);
    }
  };



  const deleteFile = (fileId: string) => {
    const updatedFiles = userFiles.filter(f => f.id !== fileId);
    saveUserFiles(updatedFiles);
  };

  const allFiles = [
    ...userFiles.map(f => ({ ...f, isOwn: true })),
    ...sharedFiles.filter(f => !userFiles.some(uf => uf.name === f.name))
      .map(f => ({ ...f, isOwn: false }))
  ];

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl mb-4">{courseNumber} курс - Учебные материалы</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Изучайте предметы {courseNumber} курса и работайте с материалами
        </p>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="materials">Материалы</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Учебные материалы</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshSharedFiles}
                  title="Обновить список файлов"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обновить
                </Button>
              </div>
            </div>
            
            {allFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                    Материалы не найдены
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    Материалы для вашего курса и факультета пока не загружены администратором
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allFiles.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <h3>{file.name}</h3>
                            {file.description && (
                              <p className="text-sm text-muted-foreground">{file.description}</p>
                            )}
                            <div className="flex items-center space-x-2">
                              {file.sharedBy && (
                                <Badge variant="secondary" className="text-xs">
                                  {file.sharedBy}
                                </Badge>
                              )}
                              {file.type && (
                                <Badge variant="outline" className="text-xs">
                                  {file.type === 'lesson' ? 'Урок' : 
                                   file.type === 'assignment' ? 'Задание' : 'Материал'}
                                </Badge>
                              )}
                              {file.isOwn && file.sharedWith === 'all' && (
                                <Badge variant="outline" className="text-xs">
                                  Общий доступ
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Кнопка просмотра содержимого */}
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => onViewFile?.({
                              ...file,
                              isOwn: file.isOwn
                            })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Просмотр
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>




      </Tabs>
    </div>
  );
}