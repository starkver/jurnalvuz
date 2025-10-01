import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Users, BookOpen, GraduationCap, Clock, LogIn, UserPlus, Calendar, MapPin, Info, Plus, X, Bell } from 'lucide-react';
import { useAuth } from './AuthContext';
import { StudentAchievements } from "./StudentAchievements";
import { UserNotificationDisplay } from "./UserNotificationDisplay";
import { QuickNotificationCreator } from "./QuickNotificationCreator";

import { useEffect, useState } from 'react';

interface MainPageProps {
  onLogin?: () => void;
  onRegister?: () => void;
  onSectionChange?: (section: string) => void;
}

export function MainPage({ onLogin, onRegister, onSectionChange }: MainPageProps) {
  const { user, getUserCount } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showQuickAddModal, setShowQuickAddModal] = useState<string | null>(null);
  const [showQuickNotification, setShowQuickNotification] = useState(false);

  useEffect(() => {
    setUserCount(getUserCount());
    
    // Загружаем события для студентов
    if (user) {
      const studentEvents = JSON.parse(localStorage.getItem('student_events') || '[]');
      const studentAnnouncements = JSON.parse(localStorage.getItem('student_announcements') || '[]');
      
      // Фильтруем события по курсу пользователя
      const filteredEvents = studentEvents.filter((event: any) => 
        event.targetCourse === 'all' || 
        event.targetCourse === user.course ||
        (event.targetRole === 'all' || event.targetRole === user.role)
      );
      
      // Фильтруем активные объявления
      const activeAnnouncements = studentAnnouncements.filter((ann: any) => 
        !ann.expiresAt || new Date(ann.expiresAt) > new Date()
      );
      
      setEvents(filteredEvents);
      setAnnouncements(activeAnnouncements);
    }
  }, [getUserCount, user]);

  // Функция автоудаления истекших событий
  const cleanupExpiredEvents = () => {
    const studentEvents = JSON.parse(localStorage.getItem('student_events') || '[]');
    const now = new Date();
    
    const activeEvents = studentEvents.filter((event: any) => {
      if (!event.endDate) return true; // События без даты окончания остаются
      return new Date(event.endDate) > now;
    });
    
    if (activeEvents.length !== studentEvents.length) {
      localStorage.setItem('student_events', JSON.stringify(activeEvents));
      console.log(`Удалено ${studentEvents.length - activeEvents.length} истекших событий`);
    }
  };

  // Открытие модального окна быстрого добавления
  const openQuickAddModal = (type: string) => {
    cleanupExpiredEvents(); // Очищаем истекшие события перед добавлением новых
    setShowQuickAddModal(type);
  };

  const handleNavigateToSection = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  if (!user) {
    return (
      <div className="space-y-8">

        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Добро пожаловать в образовательный портал
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Современная платформа для студентов и преподавателей медицинского университета
            </p>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={onLogin}>
              <LogIn className="mr-2 h-5 w-5" />
              Войти
            </Button>
            <Button variant="outline" size="lg" onClick={onRegister}>
              <UserPlus className="mr-2 h-5 w-5" />
              Регистрация
            </Button>

          </div>

          <div className="flex justify-center items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Участников: </span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {userCount}
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Обучающие материалы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Доступ к конспектам лекций, презентациям и дополнительным материалам по курсам
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                Электронный журнал
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Система оценок и успеваемости для студентов и преподавателей
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Актуальная информация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Информация о корпусах, льготах и ответы на часто задаваемые вопросы
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>О портале</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Данный образовательный портал создан для удобства студентов и преподавателей 
              медицинского университета. Здесь вы найдете все необходимые материалы для обучения, 
              сможете отслеживать свою успеваемость и получать актуальную информацию.
            </p>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Возможности портала:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Загрузка и просмотр учебных материалов в формате Markdown</li>
                <li>Обмен файлами между пользователями</li>
                <li>Электронный журнал с системой оценок</li>
                <li>Информация о корпусах университета</li>
                <li>База знаний с ответами на частые вопросы</li>
                <li>Информация о льготах и стипендиях</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Добро пожаловать, {user.username}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user.role === 'teacher' ? 'Панель преподавателя' : 'Панель студента'}
        </p>
        
        <div className="flex justify-center items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Всего участников: </span>
          <Badge variant="secondary">{userCount}</Badge>
        </div>
      </div>

      {/* Быстрое создание уведомлений для админа */}
      {user?.role === 'admin' && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowQuickNotification(true)}
            size="sm"
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Создать уведомление
          </Button>
        </div>
      )}

      {/* Срочные объявления */}
      {announcements.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              📢 Срочные объявления
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((announcement: any) => (
                <div key={announcement.id} className="border-l-4 border-yellow-500 pl-4">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">{announcement.message}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {new Date(announcement.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* События */}
      <Card data-section="events">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Актуальные события
            </div>
            {user?.role === 'admin' && (
              <Button
                onClick={() => openQuickAddModal('event')}
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event: any) => {
                const eventColors = {
                  info: 'border-blue-500',
                  exam: 'border-red-500',
                  lecture: 'border-green-500',
                  event: 'border-purple-500',
                  deadline: 'border-orange-500'
                };
                
                const eventIcons = {
                  info: '📢',
                  exam: '📝',
                  lecture: '📚',
                  event: '🎉',
                  deadline: '⏰'
                };

                return (
                  <div key={event.id} className={`border-l-4 ${eventColors[event.type as keyof typeof eventColors]} pl-4`}>
                    <h4 className="font-medium flex items-center gap-2">
                      <span>{eventIcons[event.type as keyof typeof eventIcons]}</span>
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {event.date} {event.time} {event.location && `• ${event.location}`}
                    </p>
                    {event.description && (
                      <p className="text-sm mt-1">{event.description}</p>
                    )}
                    {event.targetCourse !== 'all' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        🎯 {event.targetCourse}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Нет актуальных событий</p>
              <p className="text-sm">События будут отображаться здесь</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user.role === 'student' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Мои курсы</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {user.course ? `${user.course} курс, ${user.group} группа` : 'Не указано'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Факультет: {user.faculty || 'Не указан'}
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleNavigateToSection('course')}
                >
                  Перейти к материалам
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {user.role === 'teacher' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Журнал оценок</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Управление оценками студентов
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleNavigateToSection('journal')}
                >
                  Открыть журнал
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Управление группами</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Отправка файлов студентам
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleNavigateToSection('groups')}
                >
                  Управление группами
                </Button>
              </CardContent>
            </Card>

            {/* Достижения студента */}
            {user.username && user.course && (
              <StudentAchievements 
                studentId={user.username} 
                studentCourse={user.course}
                compact={true}
              />
            )}
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Информация
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Корпуса, FAQ, льготы
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToSection('campuses')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Корпуса
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToSection('faq')}
              >
                Вопросы и ответы
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToSection('benefits')}
              >
                Льготы
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Файлы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Загруженные материалы и обмен файлами
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleNavigateToSection('files')}
            >
              Перейти к файлам
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Модальное окно быстрого добавления */}
      {showQuickAddModal && (
        <QuickAddModal 
          type={showQuickAddModal} 
          onClose={() => setShowQuickAddModal(null)}
          onSuccess={() => {
            // Обновляем список событий после добавления
            if (user) {
              const studentEvents = JSON.parse(localStorage.getItem('student_events') || '[]');
              const filteredEvents = studentEvents.filter((event: any) => 
                event.targetCourse === 'all' || 
                event.targetCourse === user.course ||
                (event.targetRole === 'all' || event.targetRole === user.role)
              );
              setEvents(filteredEvents);
            }
          }}
        />
      )}
      
      {/* Модальное окно быстрого создания уведомлений */}
      {showQuickNotification && (
        <QuickNotificationCreator
          onClose={() => setShowQuickNotification(false)}
          onSuccess={() => {
            // Можно добавить обновление списка уведомлений
            console.log('Уведомление создано');
          }}
        />
      )}
    </div>
  );
}

// Компонент модального окна быстрого добавления
function QuickAddModal({ type, onClose, onSuccess }: { 
  type: string; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [targetCourse, setTargetCourse] = useState('all');

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Введите название');
      return;
    }

    if (type === 'event') {
      const events = JSON.parse(localStorage.getItem('student_events') || '[]');
      const newEvent = {
        id: Date.now(),
        title,
        description,
        date,
        endDate: date, // Для автоудаления
        location,
        targetCourse,
        type: 'general',
        created: new Date().toISOString()
      };
      events.push(newEvent);
      localStorage.setItem('student_events', JSON.stringify(events));
      console.log('Событие добавлено!');
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            📅 Добавить событие
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Название *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название события"
            />
          </div>
          
          <div>
            <Label>Описание</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание..."
              rows={3}
            />
          </div>
          
          <div>
            <Label>Дата и время</Label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Место</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Аудитория, корпус"
            />
          </div>
          
          <div>
            <Label>Целевая аудитория</Label>
            <select
              value={targetCourse}
              onChange={(e) => setTargetCourse(e.target.value)}
              className="w-full p-2 border rounded bg-background text-foreground"
            >
              <option value="all">Все курсы</option>
              <option value="1">1 курс</option>
              <option value="2">2 курс</option>
              <option value="3">3 курс</option>
              <option value="4">4 курс</option>
              <option value="5">5 курс</option>
              <option value="6">6 курс</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSubmit} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}