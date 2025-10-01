import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Bell, Send, X } from "lucide-react";
import { toast } from "../lib/toast";

interface QuickNotificationCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

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

export function QuickNotificationCreator({ onClose, onSuccess }: QuickNotificationCreatorProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetUsers: 'all' as const,
    specificUsers: '',
    expiryDate: ''
  });

  const handleSubmit = () => {
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

    // Сохраняем в localStorage
    const existing = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    const updated = [newNotification, ...existing];
    localStorage.setItem('adminNotifications', JSON.stringify(updated));

    toast.success('Уведомление создано успешно');
    onSuccess();
    onClose();
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'info': return 'Информационное сообщение';
      case 'warning': return 'Предупреждение или важная информация';
      case 'success': return 'Успешное завершение или достижение';
      case 'error': return 'Ошибка или критическая информация';
      default: return '';
    }
  };

  const getAudienceDescription = (audience: string) => {
    switch (audience) {
      case 'all': return 'Все пользователи портала';
      case 'students': return 'Только студенты';
      case 'teachers': return 'Только преподаватели';
      case 'specific': return 'Конкретные пользователи';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Быстрое уведомление
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-title">Заголовок *</Label>
            <Input
              id="quick-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Краткий заголовок уведомления"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-message">Сообщение *</Label>
            <Textarea
              id="quick-message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Подробное описание..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.message.length}/500
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-type">Тип уведомления</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">📢 Информация</SelectItem>
                <SelectItem value="warning">⚠️ Предупреждение</SelectItem>
                <SelectItem value="success">✅ Успех</SelectItem>
                <SelectItem value="error">❌ Ошибка</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {getTypeDescription(formData.type)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-audience">Аудитория</Label>
            <Select 
              value={formData.targetUsers} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, targetUsers: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 Все пользователи</SelectItem>
                <SelectItem value="students">🎓 Только студенты</SelectItem>
                <SelectItem value="teachers">👨‍🏫 Только преподаватели</SelectItem>
                <SelectItem value="specific">👤 Конкретные пользователи</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {getAudienceDescription(formData.targetUsers)}
            </div>
          </div>

          {formData.targetUsers === 'specific' && (
            <div className="space-y-2">
              <Label htmlFor="quick-users">Имена пользователей</Label>
              <Input
                id="quick-users"
                value={formData.specificUsers}
                onChange={(e) => setFormData(prev => ({ ...prev, specificUsers: e.target.value }))}
                placeholder="user1, user2, user3"
              />
              <div className="text-xs text-muted-foreground">
                Введите имена пользователей через запятую
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quick-expiry">Срок действия (опционально)</Label>
            <Input
              id="quick-expiry"
              type="datetime-local"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
            <div className="text-xs text-muted-foreground">
              Оставьте пустым для постоянного уведомления
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Отправить
            </Button>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}