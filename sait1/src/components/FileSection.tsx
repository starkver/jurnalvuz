import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from './AuthContext';
import { Upload, Download, Share2, File, Trash2, Users, User } from 'lucide-react';
import { toast } from '../lib/toast';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedBy: string;
  uploadedAt: string;
  sharedWith: 'private' | 'all' | string; // 'private', 'all', or specific user id
  sharedByUsername?: string;
}

interface User {
  id: string;
  username: string;
  role: 'student' | 'teacher';
}

interface FileSectionProps {
  onViewFile?: (file: any) => void;
}

export function FileSection({ onViewFile }: FileSectionProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<string>('');

  useEffect(() => {
    loadFiles();
    loadUsers();
  }, [user]);

  const loadFiles = () => {
    if (!user) return;

    // Загружаем все файлы из localStorage
    const allFiles = JSON.parse(localStorage.getItem('files') || '[]') as FileItem[];
    
    // Загружаем файлы, отправленные преподавателями группам
    const groupFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
    
    // Фильтруем файлы: личные файлы пользователя + файлы, которыми поделились с ним или со всеми
    let userFiles = allFiles.filter(file => 
      file.uploadedBy === user.id || 
      file.sharedWith === 'all' || 
      file.sharedWith === user.id
    );

    // Если пользователь студент, добавляем файлы от преподавателей для его группы
    if (user.role === 'student' && user.group) {
      const teacherFiles = groupFiles
        .filter((groupFile: any) => groupFile.groupId === user.group)
        .map((groupFile: any) => ({
          id: groupFile.id,
          name: groupFile.name,
          size: 0, // Размер неизвестен для файлов от преподавателей
          type: 'text/markdown',
          content: '', // Содержимое будет загружено отдельно
          uploadedBy: 'teacher',
          uploadedAt: groupFile.uploadDate,
          sharedWith: 'group',
          sharedByUsername: 'Преподаватель',
          description: groupFile.description,
          fileType: groupFile.type
        }));
      
      userFiles = [...userFiles, ...teacherFiles];
    }

    setFiles(userFiles);
  };

  const loadUsers = () => {
    const usersData = JSON.parse(localStorage.getItem('users') || '{}');
    const usersList = Object.values(usersData) as User[];
    setAllUsers(usersList.filter(u => u.id !== user?.id));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    try {
      const content = await readFileAsDataURL(file);
      
      const newFile: FileItem = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        content,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
        sharedWith: 'private'
      };

      const allFiles = JSON.parse(localStorage.getItem('files') || '[]') as FileItem[];
      allFiles.push(newFile);
      localStorage.setItem('files', JSON.stringify(allFiles));
      
      loadFiles();
      toast.success('Файл успешно загружен!');
      
      // Очищаем input
      event.target.value = '';
    } catch (error) {
      toast.error('Ошибка при загрузке файла');
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileDownload = (file: FileItem) => {
    try {
      const link = document.createElement('a');
      link.href = file.content;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Файл загружен!');
    } catch (error) {
      toast.error('Ошибка при скачивании файла');
    }
  };

  const handleShareFile = (file: FileItem) => {
    setSelectedFileForShare(file);
    setShareTarget('');
    setShareDialogOpen(true);
  };

  const confirmShare = () => {
    if (!selectedFileForShare || !shareTarget) return;

    const allFiles = JSON.parse(localStorage.getItem('files') || '[]') as FileItem[];
    const fileIndex = allFiles.findIndex(f => f.id === selectedFileForShare.id);
    
    if (fileIndex !== -1) {
      if (shareTarget === 'all') {
        allFiles[fileIndex].sharedWith = 'all';
        allFiles[fileIndex].sharedByUsername = user?.username;
      } else {
        // Создаем копию файла для конкретного пользователя
        const targetUser = allUsers.find(u => u.id === shareTarget);
        if (targetUser) {
          const sharedFile: FileItem = {
            ...selectedFileForShare,
            id: Date.now().toString(),
            sharedWith: shareTarget,
            sharedByUsername: user?.username
          };
          allFiles.push(sharedFile);
        }
      }
      
      localStorage.setItem('files', JSON.stringify(allFiles));
      loadFiles();
      toast.success('Файл успешно отправлен!');
    }

    setShareDialogOpen(false);
    setSelectedFileForShare(null);
    setShareTarget('');
  };

  const handleDeleteFile = (file: FileItem) => {
    if (!user) return;
    
    // Можно удалять только свои файлы
    if (file.uploadedBy !== user.id) {
      toast.error('Вы можете удалять только свои файлы');
      return;
    }

    const allFiles = JSON.parse(localStorage.getItem('files') || '[]') as FileItem[];
    const filteredFiles = allFiles.filter(f => f.id !== file.id);
    localStorage.setItem('files', JSON.stringify(filteredFiles));
    
    loadFiles();
    toast.success('Файл удален');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Войдите в систему для доступа к файлам</p>
      </div>
    );
  }

  const myFiles = files.filter(f => f.uploadedBy === user.id);
  const sharedFiles = files.filter(f => f.uploadedBy !== user.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Файлы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление учебными материалами и документами
          </p>
        </div>
      </div>

      {/* Загрузка файлов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Загрузить файл
          </CardTitle>
          <CardDescription>
            Выберите файл для загрузки (максимум 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Выберите файл</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                className="mt-1"
                accept="*/*"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Мои файлы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Мои файлы ({myFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">У вас пока нет загруженных файлов</p>
          ) : (
            <div className="space-y-3">
              {myFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {file.uploadedBy === 'teacher' ? 'От преподавателя' : formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                      {(file as any).description && (
                        <p className="text-sm text-muted-foreground mt-1">{(file as any).description}</p>
                      )}
                      {file.uploadedBy === 'teacher' && (file as any).fileType && (
                        <Badge variant="outline" className="mt-1">
                          {(file as any).fileType === 'lesson' ? 'Урок' : 
                           (file as any).fileType === 'assignment' ? 'Задание' : 'Материал'}
                        </Badge>
                      )}
                      {file.sharedWith !== 'private' && file.uploadedBy !== 'teacher' && (
                        <Badge variant="secondary" className="mt-1">
                          {file.sharedWith === 'all' ? 'Доступен всем' : 'Отправлен пользователю'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.name.endsWith('.md') && onViewFile && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          // Для файлов от преподавателей загружаем содержимое отдельно
                          if (file.uploadedBy === 'teacher') {
                            const fileContents = JSON.parse(localStorage.getItem('fileContents') || '[]');
                            const fileContent = fileContents.find((fc: any) => fc.id === file.id);
                            
                            if (fileContent) {
                              onViewFile({
                                id: file.id,
                                name: file.name,
                                content: fileContent.content,
                                uploadedAt: file.uploadedAt,
                                sharedBy: file.sharedByUsername,
                                sharedWith: file.sharedWith,
                                isOwn: false,
                                description: (file as any).description,
                                fileType: (file as any).fileType
                              });
                            } else {
                              toast.error('Содержимое файла не найдено');
                            }
                          } else {
                            // Конвертируем DataURL в текст для обычных markdown файлов
                            if (file.content.startsWith('data:text/')) {
                              try {
                                const base64 = file.content.split(',')[1];
                                const text = atob(base64);
                                onViewFile({
                                  id: file.id,
                                  name: file.name,
                                  content: text,
                                  uploadedAt: file.uploadedAt,
                                  sharedBy: file.sharedByUsername,
                                  sharedWith: file.sharedWith,
                                  isOwn: file.uploadedBy === user?.id
                                });
                              } catch (error) {
                                console.error('Error decoding file:', error);
                              }
                            }
                          }
                        }}
                      >
                        <File className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                    )}
                    {file.uploadedBy !== 'teacher' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleFileDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShareFile(file)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteFile(file)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Файлы, которыми поделились */}
      {sharedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Файлы от других пользователей ({sharedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sharedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        От: {file.sharedByUsername || 'Неизвестно'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.name.endsWith('.md') && onViewFile && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          // Конвертируем DataURL в текст для markdown файлов
                          if (file.content.startsWith('data:text/')) {
                            try {
                              const base64 = file.content.split(',')[1];
                              const text = atob(base64);
                              onViewFile({
                                id: file.id,
                                name: file.name,
                                content: text,
                                uploadedAt: file.uploadedAt,
                                sharedBy: file.sharedByUsername,
                                sharedWith: file.sharedWith,
                                isOwn: false
                              });
                            } catch (error) {
                              console.error('Error decoding file:', error);
                            }
                          }
                        }}
                      >
                        <File className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleFileDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог для отправки файла */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Поделиться файлом</DialogTitle>
            <DialogDescription>
              Выберите, с кем поделиться файлом "{selectedFileForShare?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="share-target">Получатель</Label>
              <Select value={shareTarget} onValueChange={setShareTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите получателя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всем пользователям</SelectItem>
                  {allUsers.map((userItem) => (
                    <SelectItem key={userItem.id} value={userItem.id}>
                      {userItem.username} ({userItem.role === 'teacher' ? 'Преподаватель' : 'Студент'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={confirmShare} disabled={!shareTarget}>
              Поделиться
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}