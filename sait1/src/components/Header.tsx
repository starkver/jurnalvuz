import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import { ThemeToggle } from './ThemeToggle';
import { NotificationIndicator } from './NotificationIndicator';

import { Menu, Home, Building2, HelpCircle, Gift, BookOpen, FileText, Users, LogOut, User, Lock } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  course?: string;
  group?: string;
  faculty?: string;
}

interface HeaderProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  user: User | null;
  onLogout: () => void;
}

export function Header({ currentSection, onSectionChange, user, onLogout }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Базовые разделы, доступные всем пользователям (включая неавторизованных)
  const menuItems = [
    { id: 'main', label: 'Главная', icon: Home },
    { id: 'campuses', label: 'Корпуса', icon: Building2 },
    { id: 'faq', label: 'Часто задаваемые вопросы', icon: HelpCircle },
    { id: 'benefits', label: 'Льготы', icon: Gift },
  ];

  const courseItems = user && user.role === 'student' ? [
    { id: 'course', label: `${user.course || '1'} курс`, icon: BookOpen },
  ] : [];

  const teacherItems: any[] = [];

  const academicItems = user && user.role !== 'admin' ? [
    { id: 'journal', label: user.role === 'teacher' ? 'Журнал оценок' : 'Мои оценки', icon: Users },
  ] : [];

  // Заблокированные разделы для неавторизованных пользователей
  const lockedItems = !user ? [
    { id: 'course', label: 'Материалы курса', icon: BookOpen, locked: true },
    { id: 'journal', label: 'Журнал оценок', icon: Users, locked: true },
    { id: 'profile', label: 'Профиль', icon: User, locked: true },
  ] : [];

  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Меню</SheetTitle>
                <SheetDescription>
                  Навигация по разделам портала
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={currentSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleMenuClick(item.id)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
                
                {user && user.role === 'student' && (courseItems.length > 0 || teacherItems.length > 0) && (
                  <>
                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2">
                      Обучение
                    </div>
                    {courseItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={currentSection === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                    {teacherItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={currentSection === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </>
                )}

                {user && user.role === 'teacher' && courseItems.length > 0 && (
                  <>
                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                    {courseItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={currentSection === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </>
                )}

                {academicItems.length > 0 && user?.role === 'student' && (
                  <>
                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2">
                      Успеваемость
                    </div>
                    {academicItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={currentSection === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </>
                )}

                {academicItems.length > 0 && user?.role === 'teacher' && (
                  <>
                    {academicItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={currentSection === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </>
                )}

                {/* Заблокированные разделы для неавторизованных пользователей */}
                {lockedItems.length > 0 && (
                  <>
                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Требуется вход
                    </div>
                    {lockedItems.map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start text-gray-500 dark:text-gray-400 cursor-pointer"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                        <Lock className="ml-auto h-3 w-3" />
                      </Button>
                    ))}
                  </>
                )}

                {user && (
                  <>
                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2">
                      Аккаунт
                    </div>
                    <Button
                      variant={currentSection === 'profile' ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleMenuClick('profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Профиль
                    </Button>
                  </>
                )}
              </div>
              
              {user && (
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {user.username} ({
                        user.role === 'teacher' ? 'Преподаватель' : 
                        user.role === 'admin' ? 'Администратор' : 
                        'Студент'
                      })
                    </div>
                    <Button variant="outline" className="w-full" onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Выйти
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Образовательный портал
            </h1>
            {user?.role === 'admin' && (
              <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-md font-medium">
                ADMIN
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">

          {user && <NotificationIndicator />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}