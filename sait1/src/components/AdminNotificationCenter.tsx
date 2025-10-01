import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Bell, 
  Plus, 
  Send, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "../lib/toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetUsers: 'all' | 'students' | 'teachers' | 'specific';
  specificUsers?: string[];
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetUsers: 'all' as const,
    specificUsers: '',
    expiryDate: ''
  });

  // Загружаем уведомления при монтировании
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const stored = localStorage.getItem('adminNotifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    localStorage.setItem('adminNotifications', JSON.stringify(notifs));
    setNotifications(notifs);
  };

  const handleCreateNotification = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      message: formData.message.trim(),
      type: formData.type,
      targetUsers: formData.targetUsers,
      specificUsers: formData.specificUsers ? formData.specificUsers.split(',').map(u => u.trim()) : undefined,
      expiryDate: formData.expiryDate || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      isActive: true
    };

    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(updatedNotifications);

    // Очищаем форму
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetUsers: 'all',
      specificUsers: '',
      expiryDate: ''
    });
    setShowCreateForm(false);

    toast.success('Уведомление создано успешно');
  };

  const handleDeleteNotification = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить это уведомление?')) {
      const updatedNotifications = notifications.filter(n => n.id !== id);
      saveNotifications(updatedNotifications);
      toast.success('Уведомление удалено');
    }
  };

  const toggleNotificationStatus = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, isActive: !n.isActive } : n
    );
    saveNotifications(updatedNotifications);
    toast.success('Статус уведомления изменен');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTargetUsersText = (notification: Notification) => {
    switch (notification.targetUsers) {
      case 'all': return 'Все пользователи';
      case 'students': return 'Студенты';
      case 'teachers': return 'Преподаватели';
      case 'specific': return `Конкретные пользователи: ${notification.specificUsers?.join(', ')}`;
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Центр уведомлений</h2>
          <p className="text-muted-foreground">
            Создавайте и управляйте уведомлениями для пользователей портала
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать уведомление
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Создать новое уведомление
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Введите заголовок уведомления"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Тип уведомления</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Информация</SelectItem>
                    <SelectItem value="warning">Предупреждение</SelectItem>
                    <SelectItem value="success">Успех</SelectItem>
                    <SelectItem value="error">Ошибка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Сообщение *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Введите текст уведомления"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetUsers">Целевая аудитория</Label>
                <Select 
                  value={formData.targetUsers} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, targetUsers: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все пользователи</SelectItem>
                    <SelectItem value="students">Только студенты</SelectItem>
                    <SelectItem value="teachers">Только преподаватели</SelectItem>
                    <SelectItem value="specific">Конкретные пользователи</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Дата истечения (опционально)</Label>
                <Input
                  id="expiryDate"
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            {formData.targetUsers === 'specific' && (
              <div className="space-y-2">
                <Label htmlFor="specificUsers">Имена пользователей (через запятую)</Label>
                <Input
                  id="specificUsers"
                  value={formData.specificUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, specificUsers: e.target.value }))}
                  placeholder="user1, user2, user3"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCreateNotification}>
                <Send className="h-4 w-4 mr-2" />
                Создать уведомление
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Активные уведомления ({notifications.length})</h3>
        
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Уведомлений пока нет. Создайте первое уведомление для пользователей.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={!notification.isActive ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(notification.type)}>
                        {getTypeIcon(notification.type)}
                        <span className="ml-1 capitalize">{notification.type}</span>
                      </Badge>
                      {!notification.isActive && (
                        <Badge variant="secondary">Неактивно</Badge>
                      )}
                      {notification.expiryDate && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          До {new Date(notification.expiryDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <span>Аудитория: {getTargetUsersText(notification)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleNotificationStatus(notification.id)}
                    >
                      {notification.isActive ? 'Деактивировать' : 'Активировать'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}