import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X, Trophy, Star } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  points: number;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

const ICON_MAP = {
  Trophy,
  Star,
  // Можно добавить больше иконок по мере необходимости
};

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Показываем уведомление с небольшой задержкой для анимации
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Автоматически скрываем через 5 секунд
    const hideTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Даем время для анимации закрытия
  };

  const IconComponent = ICON_MAP[achievement.icon as keyof typeof ICON_MAP] || Trophy;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="w-80 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500 text-white rounded-full">
              <IconComponent className="h-5 w-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">🎉 Новое достижение!</h3>
                <Badge variant="secondary" className="text-xs">
                  +{achievement.points} баллов
                </Badge>
              </div>
              
              <h4 className="font-medium text-lg mb-1">{achievement.title}</h4>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Компонент-контейнер для управления уведомлениями
export function AchievementNotificationManager() {
  const [notifications, setNotifications] = useState<{ id: string; achievement: Achievement }[]>([]);

  useEffect(() => {
    const handleAchievementEarned = (event: CustomEvent) => {
      try {
        const { achievement } = event.detail;
        if (!achievement || typeof achievement !== 'object') {
          console.warn('Invalid achievement data received');
          return;
        }
        
        const notificationId = `${achievement.id}_${Date.now()}`;
        
        setNotifications(prev => {
          // Ограничиваем количество уведомлений
          const newNotifications = [...prev, { id: notificationId, achievement }];
          return newNotifications.slice(-3); // Показываем максимум 3 уведомления
        });
      } catch (error) {
        console.error('Error handling achievement notification:', error);
      }
    };

    window.addEventListener('achievementEarned', handleAchievementEarned as EventListener);
    
    return () => {
      window.removeEventListener('achievementEarned', handleAchievementEarned as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <>
      {notifications.map(notification => (
        <AchievementNotification
          key={notification.id}
          achievement={notification.achievement}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
}