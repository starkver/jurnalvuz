import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { 
  Settings, Database, Palette, Bell, 
  Shield, Globe, Monitor, Download, 
  Upload, RotateCcw, Trash2 
} from "lucide-react";
import { toast } from "../lib/toast";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  defaultCourse: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  notifications: {
    achievements: boolean;
    announcements: boolean;
    reminders: boolean;
  };
  theme: {
    defaultTheme: 'light' | 'dark' | 'system';
    allowThemeSwitch: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupInterval: number; // в днях
  };
}

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "Образовательный портал",
    siteDescription: "Портал для студентов и преподавателей",
    maintenanceMode: false,
    registrationEnabled: true,
    defaultCourse: "1",
    maxFileSize: 10, // MB
    allowedFileTypes: ["pdf", "doc", "docx", "txt", "md"],
    notifications: {
      achievements: true,
      announcements: true,
      reminders: true
    },
    theme: {
      defaultTheme: 'system',
      allowThemeSwitch: true
    },
    backup: {
      autoBackup: false,
      backupInterval: 7
    }
  });

  const [customCSS, setCustomCSS] = useState("");
  const [customJS, setCustomJS] = useState("");

  // Загрузка настроек при запуске
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('system_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const savedCSS = localStorage.getItem('custom_css');
    if (savedCSS) {
      setCustomCSS(savedCSS);
    }

    const savedJS = localStorage.getItem('custom_js');
    if (savedJS) {
      setCustomJS(savedJS);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('system_settings', JSON.stringify(settings));
    toast.success("Настройки сохранены");
  };

  const saveCustomCSS = () => {
    localStorage.setItem('custom_css', customCSS);
    
    // Применяем CSS к странице
    let existingStyle = document.getElementById('custom-admin-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (customCSS.trim()) {
      const style = document.createElement('style');
      style.id = 'custom-admin-css';
      style.textContent = customCSS;
      document.head.appendChild(style);
    }

    toast.success("Пользовательские стили применены");
  };

  const saveCustomJS = () => {
    localStorage.setItem('custom_js', customJS);
    
    if (customJS.trim()) {
      try {
        // Осторожно выполняем JavaScript
        new Function(customJS)();
        toast.success("Пользовательский JavaScript выполнен");
      } catch (error) {
        toast.error("Ошибка в JavaScript коде");
        console.error(error);
      }
    }
  };

  // Создание полной резервной копии
  const createFullBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      users: localStorage.getItem('users'),
      system_settings: localStorage.getItem('system_settings'),
      achievements: localStorage.getItem('achievements'),
      custom_css: localStorage.getItem('custom_css'),
      custom_js: localStorage.getItem('custom_js'),
      courses: localStorage.getItem('courses'),
      files: localStorage.getItem('files'),
      // Собираем все пользовательские секции
      custom_sections: {}
    };

    // Добавляем пользовательские секции
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('admin_section_')) {
        (backup.custom_sections as any)[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Полная резервная копия создана");
  };

  // Восстановление из резервной копии
  const restoreFromBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        
        if (confirm("Это действие перезапишет все текущие данные. Продолжить?")) {
          // Восстанавливаем основные данные
          if (backup.users) localStorage.setItem('users', backup.users);
          if (backup.system_settings) localStorage.setItem('system_settings', backup.system_settings);
          if (backup.achievements) localStorage.setItem('achievements', backup.achievements);
          if (backup.custom_css) localStorage.setItem('custom_css', backup.custom_css);
          if (backup.custom_js) localStorage.setItem('custom_js', backup.custom_js);
          if (backup.courses) localStorage.setItem('courses', backup.courses);
          if (backup.files) localStorage.setItem('files', backup.files);

          // Восстанавливаем пользовательские секции
          if (backup.custom_sections) {
            Object.entries(backup.custom_sections).forEach(([key, value]) => {
              if (typeof value === 'string') {
                localStorage.setItem(key, value);
              }
            });
          }

          toast.success("Данные восстановлены. Страница будет перезагружена.");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (error) {
        toast.error("Ошибка при восстановлении данных");
      }
    };
    reader.readAsText(file);
  };

  // Очистка всех данных
  const clearAllData = () => {
    if (confirm("ВНИМАНИЕ! Это действие удалит ВСЕ данные системы. Продолжить?")) {
      if (confirm("Последнее предупреждение! Все пользователи, файлы и настройки будут удалены.")) {
        // Сохраняем только данные текущего админа
        const currentUser = localStorage.getItem('currentUser');
        const adminKey = 'Starkver_123';
        const adminData = {
          role: 'admin',
          username: 'Starkver',
          created: new Date().toISOString()
        };

        localStorage.clear();
        
        // Восстанавливаем админа
        localStorage.setItem('users', JSON.stringify({ [adminKey]: adminData }));
        if (currentUser) {
          localStorage.setItem('currentUser', currentUser);
        }

        toast.success("Все данные очищены. Страница будет перезагружена.");
        setTimeout(() => window.location.reload(), 2000);
      }
    }
  };

  // Получение размера данных в localStorage
  const getStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  };

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl mb-2">Системные настройки</h2>
        <p className="text-muted-foreground">
          Управление глобальными настройками портала
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Основные</TabsTrigger>
          <TabsTrigger value="features">Функции</TabsTrigger>
          <TabsTrigger value="theme">Внешний вид</TabsTrigger>
          <TabsTrigger value="backup">Резервные копии</TabsTrigger>
          <TabsTrigger value="advanced">Расширенные</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Название сайта:</Label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  placeholder="Образовательный портал"
                />
              </div>
              
              <div>
                <Label>Описание сайта:</Label>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  placeholder="Описание вашего образовательного портала"
                  rows={3}
                />
              </div>

              <div>
                <Label>Курс по умолчанию для новых пользователей:</Label>
                <Input
                  value={settings.defaultCourse}
                  onChange={(e) => updateSetting('defaultCourse', e.target.value)}
                  placeholder="1"
                />
              </div>

              <Button onClick={saveSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Сохранить основные настройки
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Управление функциями
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Режим обслуживания</Label>
                  <p className="text-sm text-muted-foreground">
                    Закрыть доступ к сайту для всех кроме администраторов
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Регистрация новых пользователей</Label>
                  <p className="text-sm text-muted-foreground">
                    Разрешить самостоятельную регистрацию
                  </p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => updateSetting('registrationEnabled', checked)}
                />
              </div>

              <Separator />

              <div>
                <Label>Максимальный размер файла (MB):</Label>
                <Input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <Label>Разрешенные типы файлов (через запятую):</Label>
                <Input
                  value={settings.allowedFileTypes.join(', ')}
                  onChange={(e) => updateSetting('allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="pdf, doc, docx, txt, md"
                />
              </div>

              <Button onClick={saveSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Сохранить настройки функций
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Уведомления
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Уведомления о достижениях</Label>
                <Switch
                  checked={settings.notifications.achievements}
                  onCheckedChange={(checked) => updateSetting('notifications.achievements', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Уведомления об объявлениях</Label>
                <Switch
                  checked={settings.notifications.announcements}
                  onCheckedChange={(checked) => updateSetting('notifications.announcements', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Напоминания</Label>
                <Switch
                  checked={settings.notifications.reminders}
                  onCheckedChange={(checked) => updateSetting('notifications.reminders', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Пользовательские стили
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Пользовательский CSS:</Label>
                <Textarea
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="/* Ваши пользовательские стили */
.custom-button {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border: none;
  color: white;
}"
                />
              </div>
              
              <Button onClick={saveCustomCSS}>
                <Palette className="h-4 w-4 mr-2" />
                Применить стили
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Управление данными
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Размер данных в localStorage: {getStorageSize()} KB
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={createFullBackup} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Создать полную резервную копию
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={restoreFromBackup}
                    className="hidden"
                    id="restore-backup"
                  />
                  <Button
                    onClick={() => document.getElementById('restore-backup')?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Восстановить из копии
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-destructive">Опасная зона</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Действия в этой зоне необратимы
                </p>
                
                <Button
                  onClick={clearAllData}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Очистить все данные системы
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Пользовательский JavaScript
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Осторожно! Неправильный JavaScript может нарушить работу сайта.
                </AlertDescription>
              </Alert>

              <div>
                <Label>JavaScript код:</Label>
                <Textarea
                  value={customJS}
                  onChange={(e) => setCustomJS(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="// Ваш пользовательский JavaScript
console.log('Пользовательский скрипт загружен');

// Например, добавление кастомного поведения
document.addEventListener('DOMContentLoaded', function() {
  // Ваш код здесь
});"
                />
              </div>
              
              <Button onClick={saveCustomJS} variant="outline">
                <Monitor className="h-4 w-4 mr-2" />
                Выполнить JavaScript
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Информация о системе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Версия:</strong> 1.0.0
              </div>
              <div className="text-sm">
                <strong>Последнее обновление:</strong> {new Date().toLocaleDateString()}
              </div>
              <div className="text-sm">
                <strong>Браузер:</strong> {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                  navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Другой'}
              </div>
              <div className="text-sm">
                <strong>Поддержка localStorage:</strong> {typeof(Storage) !== "undefined" ? 'Да' : 'Нет'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}