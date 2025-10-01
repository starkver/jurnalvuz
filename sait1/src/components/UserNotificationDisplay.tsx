import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Bell, 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react";

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

interface UserNotificationState {
  dismissed: string[];
  lastChecked: string;
}

export function UserNotificationDisplay() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userState, setUserState] = useState<UserNotificationState>({
    dismissed: [],
    lastChecked: new Date().toISOString()
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    loadNotifications();
    loadUserState();
    
    // Автоматически отмечаем уведомления как прочитанные при открытии
    const timer = setTimeout(() => {
      markAsRead();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user]);

  const loadNotifications = () => {
    const stored = localStorage.getItem('adminNotifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const filtered = filterNotificationsForUser(parsed);
        setNotifications(filtered);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  };

  const loadUserState = () => {
    if (!user) return;
    
    const stored = localStorage.getItem(`userNotificationState_${user.username}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserState(parsed);
      } catch (error) {
        console.error('Error loading user notification state:', error);
      }
    }
  };

  const saveUserState = (state: UserNotificationState) => {
    if (!user) return;
    
    localStorage.setItem(`userNotificationState_${user.username}`, JSON.stringify(state));
    setUserState(state);
  };

  const markAsRead = () => {
    const newState = {
      ...userState,
      lastChecked: new Date().toISOString()
    };
    saveUserState(newState);
  };

  const filterNotificationsForUser = (allNotifications: Notification[]): Notification[] => {
    if (!user) return [];

    const now = new Date();
    
    return allNotifications.filter(notification => {
      // Проверяем активность
      if (!notification.isActive) return false;
      
      // Проверяем срок действия
      if (notification.expiryDate && new Date(notification.expiryDate) < now) {
        return false;
      }
      
      // Проверяем целевую аудиторию
      if (notification.targetUsers === 'all') return true;
      if (notification.targetUsers === 'students' && user.role === 'student') return true;
      if (notification.targetUsers === 'teachers' && user.role === 'teacher') return true;
      if (notification.targetUsers === 'specific' && 
          notification.specificUsers?.includes(user.username)) return true;
      
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const dismissNotification = (notificationId: string) => {
    const newState = {
      ...userState,
      dismissed: [...userState.dismissed, notificationId]
    };
    saveUserState(newState);
  };

  const getVisibleNotifications = () => {
    const filtered = notifications.filter(n => !userState.dismissed.includes(n.id));
    return showAll ? filtered : filtered.slice(0, 3);
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

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive' as const;
      default: return 'default' as const;
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

  const visibleNotifications = getVisibleNotifications();
  const hasMore = notifications.filter(n => !userState.dismissed.includes(n.id)).length > 3;

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Уведомления</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {hasMore && (
            <Button size="sm" variant="outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Скрыть' : `Показать все (${notifications.filter(n => !userState.dismissed.includes(n.id)).length})`}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {visibleNotifications.map((notification) => {
          return (
            <Alert 
              key={notification.id} 
              variant={getAlertVariant(notification.type)}
              className="relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-0.5">
                    {getTypeIcon(notification.type)}
                    <Badge className={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                    </div>
                    
                    <AlertDescription className="text-sm">
                      {notification.message}
                    </AlertDescription>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.createdAt).toLocaleString()}
                      {notification.expiryDate && (
                        <span>• Действует до {new Date(notification.expiryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissNotification(notification.id)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          );
        })}
      </div>
    </div>
  );
}