import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { FileText, Upload, Trash2, Plus, Eye, Save } from 'lucide-react';
import { useAuth } from './AuthContext';

interface AdminFile {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
  course: string;
  faculty: string;
  description?: string;
  type: 'lesson' | 'assignment' | 'material';
  fileType?: string; // mime-type файла (например, application/pdf)
}

export function AdminFileManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFile, setEditingFile] = useState<AdminFile | null>(null);
  
  // Форма добавления файла
  const [newFile, setNewFile] = useState({
    name: '',
    content: '',
    course: '',
    faculty: '',
    description: '',
    type: 'lesson' as 'lesson' | 'assignment' | 'material',
    fileType: ''
  });
  
  const [adminFiles, setAdminFiles] = useState<AdminFile[]>(() => {
    const saved = localStorage.getItem('admin_files');
    return saved ? JSON.parse(saved) : [];
  });

  const saveAdminFiles = (files: AdminFile[]) => {
    setAdminFiles(files);
    localStorage.setItem('admin_files', JSON.stringify(files));
    
    // Также обновляем данные для студентов
    updateStudentFiles(files);
  };

  const updateStudentFiles = (files: AdminFile[]) => {
    // Группируем файлы по курсам и факультетам для студентов
    files.forEach(file => {
      const groupFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
      const fileContents = JSON.parse(localStorage.getItem('fileContents') || '[]');
      
      // Проверяем, существует ли уже файл в groupFiles
      const existingFileIndex = groupFiles.findIndex((gf: any) => gf.id === file.id);
      const groupFileData = {
        id: file.id,
        name: file.name,
        groupId: file.course,
        faculty: file.faculty,
        uploadDate: file.uploadedAt,
        type: file.type,
        description: file.description,
        fileType: file.fileType
      };
      
      if (existingFileIndex >= 0) {
        groupFiles[existingFileIndex] = groupFileData;
      } else {
        groupFiles.push(groupFileData);
      }
      
      // Обновляем содержимое файла
      const existingContentIndex = fileContents.findIndex((fc: any) => fc.id === file.id);
      const contentData = {
        id: file.id,
        content: file.content,
        fileType: file.fileType
      };
      
      if (existingContentIndex >= 0) {
        fileContents[existingContentIndex] = contentData;
      } else {
        fileContents.push(contentData);
      }
      
      localStorage.setItem('groupFiles', JSON.stringify(groupFiles));
      localStorage.setItem('fileContents', JSON.stringify(fileContents));
    });

    // Запускаем событие для обновления UI студентов
    window.dispatchEvent(new CustomEvent('adminFilesUpdated'));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setNewFile(prev => ({
          ...prev,
          name: file.name,
          content,
          fileType: file.type || 'application/octet-stream'
        }));
      };
      // Читаем все файлы как текст (для Markdown) или как Data URL (для других форматов)
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddFile = () => {
    if (!newFile.name || !newFile.content || !newFile.course || !newFile.faculty) {
      alert('Заполните все обязательные поля');
      return;
    }

    const file: AdminFile = {
      id: Date.now().toString(),
      name: newFile.name,
      content: newFile.content,
      course: newFile.course,
      faculty: newFile.faculty,
      description: newFile.description,
      type: newFile.type,
      fileType: newFile.fileType,
      uploadedAt: new Date().toISOString()
    };

    saveAdminFiles([...adminFiles, file]);
    
    setNewFile({
      name: '',
      content: '',
      course: '',
      faculty: '',
      description: '',
      type: 'lesson',
      fileType: ''
    });
    setShowAddForm(false);
    alert('Файл успешно добавлен и стал доступен студентам!');
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
      const updatedFiles = adminFiles.filter(f => f.id !== fileId);
      saveAdminFiles(updatedFiles);
      
      // Также удаляем из данных студентов
      const groupFiles = JSON.parse(localStorage.getItem('groupFiles') || '[]');
      const fileContents = JSON.parse(localStorage.getItem('fileContents') || '[]');
      
      const updatedGroupFiles = groupFiles.filter((gf: any) => gf.id !== fileId);
      const updatedFileContents = fileContents.filter((fc: any) => fc.id !== fileId);
      
      localStorage.setItem('groupFiles', JSON.stringify(updatedGroupFiles));
      localStorage.setItem('fileContents', JSON.stringify(updatedFileContents));
      
      alert('Файл удален');
    }
  };

  const handleEditFile = (file: AdminFile) => {
    setEditingFile(file);
    setNewFile({
      name: file.name,
      content: file.content,
      course: file.course,
      faculty: file.faculty,
      description: file.description || '',
      type: file.type,
      fileType: file.fileType || ''
    });
    setShowAddForm(true);
  };

  const handleUpdateFile = () => {
    if (!editingFile || !newFile.name || !newFile.content || !newFile.course || !newFile.faculty) {
      alert('Заполните все обязательные поля');
      return;
    }

    const updatedFile: AdminFile = {
      ...editingFile,
      name: newFile.name,
      content: newFile.content,
      course: newFile.course,
      faculty: newFile.faculty,
      description: newFile.description,
      type: newFile.type,
      fileType: newFile.fileType
    };

    const updatedFiles = adminFiles.map(f => f.id === editingFile.id ? updatedFile : f);
    saveAdminFiles(updatedFiles);
    
    setEditingFile(null);
    setNewFile({
      name: '',
      content: '',
      course: '',
      faculty: '',
      description: '',
      type: 'lesson',
      fileType: ''
    });
    setShowAddForm(false);
    alert('Файл успешно обновлен!');
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Управление файлами для студентов</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить файл
        </Button>
      </div>

      {/* Форма добавления/редактирования файла */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFile ? 'Редактировать файл' : 'Добавить новый файл'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Название файла *</Label>
                <Input
                  value={newFile.name}
                  onChange={(e) => setNewFile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название файла"
                />
              </div>
              <div>
                <Label>Тип материала *</Label>
                <Select value={newFile.type} onValueChange={(value: 'lesson' | 'assignment' | 'material') => setNewFile(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Урок</SelectItem>
                    <SelectItem value="assignment">Задание</SelectItem>
                    <SelectItem value="material">Материал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Курс *</Label>
                <Select value={newFile.course} onValueChange={(value) => setNewFile(prev => ({ ...prev, course: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите курс" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 курс</SelectItem>
                    <SelectItem value="2">2 курс</SelectItem>
                    <SelectItem value="3">3 курс</SelectItem>
                    <SelectItem value="4">4 курс</SelectItem>
                    <SelectItem value="5">5 курс</SelectItem>
                    <SelectItem value="6">6 курс</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Факультет *</Label>
                <Select value={newFile.faculty} onValueChange={(value) => setNewFile(prev => ({ ...prev, faculty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите факультет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Лечебный</SelectItem>
                    <SelectItem value="pediatric">Педиатрический</SelectItem>
                    <SelectItem value="dental">Стоматологический</SelectItem>
                    <SelectItem value="pharmacy">Фармацевтический</SelectItem>
                    <SelectItem value="preventive">Медико-профилактический</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Описание</Label>
              <Input
                value={newFile.description}
                onChange={(e) => setNewFile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание файла"
              />
            </div>

            <div>
              <Label>Содержимое файла *</Label>
              <div className="flex gap-2 mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить файл
                </Button>
              </div>
              <Textarea
                value={newFile.content}
                onChange={(e) => setNewFile(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Введите содержимое в формате Markdown или загрузите файл любого формата"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Файл будет доступен всем студентам выбранного курса и факультета.
                Поддерживаются любые форматы файлов (PDF, DOCX, XLSX, изображения, видео и т.д.). 
                Для Markdown файлов доступны внутренние ссылки [[#заголовок]].
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={editingFile ? handleUpdateFile : handleAddFile}>
                <Save className="h-4 w-4 mr-2" />
                {editingFile ? 'Обновить' : 'Добавить'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFile(null);
                  setNewFile({
                    name: '',
                    content: '',
                    course: '',
                    faculty: '',
                    description: '',
                    type: 'lesson',
                    fileType: ''
                  });
                }}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список добавленных файлов */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Добавленные файлы ({adminFiles.length})</h3>
        
        {adminFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                Файлы не добавлены
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                Добавьте первый файл для студентов
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить файл
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {adminFiles.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{file.name}</h4>
                        {file.description && (
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                        )}
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <Badge variant="default" className="text-xs">
                            {file.course} курс
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {file.faculty === 'medical' ? 'Лечебный' :
                             file.faculty === 'pediatric' ? 'Педиатрический' :
                             file.faculty === 'dental' ? 'Стоматологический' :
                             file.faculty === 'pharmacy' ? 'Фармацевтический' :
                             file.faculty === 'preventive' ? 'Медико-профилактический' : file.faculty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {file.type === 'lesson' ? 'Урок' :
                             file.type === 'assignment' ? 'Задание' : 'Материал'}
                          </Badge>
                          {file.fileType && (
                            <Badge variant="outline" className="text-xs">
                              {file.name.split('.').pop()?.toUpperCase() || 'Файл'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Добавлен: {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditFile(file)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}