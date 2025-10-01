import { useEffect } from "react";
import { useAuth } from "./AuthContext";

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

export function NotificationDemo() {
  const { user } = useAuth();

  useEffect(() => {
    // Создаем демонстрационные уведомления только если их еще нет
    if (!user?.role) return;
    
    try {
      const existing = localStorage.getItem('adminNotifications');
      if (!existing && user.role === 'admin') {
        const demoNotifications: Notification[] = [
          {
            id: 'demo-1',
            title: 'Добро пожаловать в систему уведомлений!',
            message: 'Теперь вы можете создавать и управлять уведомлениями для всех пользователей портала. Эта система позволяет отправлять различные типы сообщений.',
            type: 'info',
            targetUsers: 'all',
            createdAt: new Date().toISOString(),
            createdBy: 'admin',
            isActive: true
          },
          {
            id: 'demo-2',
            title: 'Система уведомлений активна',
            message: 'Студенты и преподаватели теперь могут получать важные сообщения через новую систему уведомлений.',
            type: 'success',
            targetUsers: 'all',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 минут назад
            createdBy: 'admin',
            isActive: true
          },
          {
            id: 'demo-3',
            title: 'Важная информация для студентов',
            message: 'Проверьте расписание экзаменов на следующей неделе. Возможны изменения.',
            type: 'warning',
            targetUsers: 'students',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 минут назад
            createdBy: 'admin',
            isActive: true
          }
        ];

        localStorage.setItem('adminNotifications', JSON.stringify(demoNotifications));
        console.log('Демонстрационные уведомления созданы');
      }
    } catch (error) {
      console.error('Error creating demo notifications:', error);
    }
  }, [user?.role]);

  return null; // Этот компонент ничего не отображает
}