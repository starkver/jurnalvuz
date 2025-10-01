import React, { useState, useEffect } from 'react';
import { userActivityTracker, UserActivity, UserSession } from '../lib/userActivityTracker';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  Activity, 
  Clock, 
  FileText, 
  Eye, 
  Calendar, 
  TrendingUp, 
  User,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface ActivitySummary {
  total_activities: number;
  unique_days_active: number;
  most_common_activity: string;
  avg_daily_activities: number;
}

export function UserActivityDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadActivityData();
    }
  }, [user]);

  const loadActivityData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load recent activities
      const userActivities = await userActivityTracker.getUserActivities(user.id, 50);
      setActivities(userActivities);

      // Load recent sessions
      const userSessions = await userActivityTracker.getUserSessions(user.id, 10);
      setSessions(userSessions);

      // Load activity summary
      const activitySummary = await userActivityTracker.getActivitySummary(user.id, 7);
      setSummary(activitySummary);

    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityType = (type: string) => {
    const types = {
      'login': 'Вход в систему',
      'logout': 'Выход из системы',
      'page_visit': 'Посещение страницы',
      'file_view': 'Просмотр файла',
      'journal_access': 'Доступ к журналу',
      'profile_edit': 'Редактирование профиля',
      'achievement_earned': 'Получение достижения',
      'course_material_access': 'Доступ к материалам'
    };
    return types[type as keyof typeof types] || type;
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'login': <User className="h-4 w-4" />,
      'logout': <User className="h-4 w-4" />,
      'page_visit': <Eye className="h-4 w-4" />,
      'file_view': <FileText className="h-4 w-4" />,
      'journal_access': <BarChart3 className="h-4 w-4" />,
      'profile_edit': <User className="h-4 w-4" />,
      'achievement_earned': <TrendingUp className="h-4 w-4" />,
      'course_material_access': <FileText className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      'login': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'logout': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'page_visit': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'file_view': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'journal_access': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'profile_edit': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'achievement_earned': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'course_material_access': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const currentSessionInfo = userActivityTracker.getCurrentSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Загрузка данных активности...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session Info */}
      {currentSessionInfo.sessionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Текущая сессия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Время в сессии</div>
                <div className="text-lg font-semibold">
                  {currentSessionInfo.startTime ? 
                    formatDuration(Math.floor((Date.now() - currentSessionInfo.startTime.getTime()) / (1000 * 60))) 
                    : '0 мин'
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Действий выполнено</div>
                <div className="text-lg font-semibold">{currentSessionInfo.activityCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Страниц посещено</div>
                <div className="text-lg font-semibold">{currentSessionInfo.pagesVisited.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего действий</p>
                  <p className="text-2xl font-bold">{summary.total_activities}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активных дней</p>
                  <p className="text-2xl font-bold">{summary.unique_days_active}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">В среднем за день</p>
                  <p className="text-2xl font-bold">{summary.avg_daily_activities}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Популярное действие</p>
                  <p className="text-sm font-bold">{formatActivityType(summary.most_common_activity)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Последние действия</TabsTrigger>
          <TabsTrigger value="sessions">История сессий</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Последние действия</CardTitle>
                <CardDescription>
                  История ваших действий в системе за последнее время
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadActivityData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет данных об активности
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={getActivityColor(activity.activity_type)}>
                              {formatActivityType(activity.activity_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                          {activity.details && (
                            <div className="text-sm text-muted-foreground">
                              {activity.details.page && `Страница: ${activity.details.page}`}
                              {activity.details.file_name && `Файл: ${activity.details.file_name}`}
                              {activity.details.achievement_id && `Достижение: ${activity.details.achievement_id}`}
                              {activity.details.changed_fields && `Изменено: ${activity.details.changed_fields.join(', ')}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>История сессий</CardTitle>
                <CardDescription>
                  Информация о ваших сессиях в системе
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadActivityData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет данных о сессиях
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div key={session.id || index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {new Date(session.session_start).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {!session.session_end && (
                              <Badge variant="outline" className="text-green-600">
                                Активная
                              </Badge>
                            )}
                          </div>
                          {session.duration_minutes && (
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(session.duration_minutes)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Страниц посещено:</span>
                            <span className="ml-1 font-medium">{session.pages_visited}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Действий выполнено:</span>
                            <span className="ml-1 font-medium">{session.activities_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}