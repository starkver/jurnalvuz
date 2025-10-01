import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AdminFileManager } from "./AdminFileManager";
import { AchievementsManager } from "./AchievementsManager";
import { StudentAchievements } from "./StudentAchievements";
import { AdminContentManager } from "./AdminContentManager";
import { AdminUserManager } from "./AdminUserManager";
import { AdminSystemSettings } from "./AdminSystemSettings";
import { AdminNotificationCenter } from "./AdminNotificationCenter";
import { User, Lock, BookOpen, Save, CheckCircle, Files, Trophy, Edit, Users, Settings, Bell } from "lucide-react";

export function ProfileSection() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(user?.course || "");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Все поля должны быть заполнены");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Новые пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      alert("Новый пароль должен содержать минимум 6 символов");
      return;
    }

    // Получаем всех пользователей
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentUserKey = `${user?.username}_${currentPassword}`;
    
    if (!users[currentUserKey]) {
      alert("Неверный текущий пароль");
      return;
    }

    // Удаляем старую запись и создаем новую с новым паролем
    const userData = users[currentUserKey];
    delete users[currentUserKey];
    
    const newUserKey = `${user?.username}_${newPassword}`;
    users[newUserKey] = { ...userData, course: selectedCourse };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Обновляем текущего пользователя
    const updatedUser = { ...userData, course: selectedCourse };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    alert("Пароль успешно изменен! Войдите с новым паролем");
    
    // Выходим из систем�� для повторного входа
    setTimeout(() => {
      logout();
    }, 1500);
  };

  const handleCourseChange = () => {
    if (!selectedCourse) {
      alert("Выберите курс");
      return;
    }

    // Получаем текущий пароль (нужно его знать для обновления записи)
    if (!currentPassword) {
      alert("Введите текущий пароль для изменения курса");
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentUserKey = `${user?.username}_${currentPassword}`;
    
    if (!users[currentUserKey]) {
      alert("Неверный пароль");
      return;
    }

    // Обновляем курс
    users[currentUserKey] = { ...users[currentUserKey], course: selectedCourse };
    localStorage.setItem('users', JSON.stringify(users));
    
    // Обновляем текущего пользователя
    const updatedUser = { ...users[currentUserKey] };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    alert("Курс успешно изменен!");
    
    // Перезагружаем страницу для применения изменений
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!user) {
    return <div>Пользователь не найден</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl mb-4">Профиль пользователя</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {user?.role === 'admin' 
            ? 'Управляйте настройками аккаунта и всеми функциями портала' 
            : 'Управляйте настройками вашего аккаунта'
          }
        </p>
      </div>

      {user?.role === 'admin' ? (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="files">Файлы</TabsTrigger>
            <TabsTrigger value="achievements">Достижения</TabsTrigger>
            <TabsTrigger value="content">Контент</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="system">Система</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 max-w-2xl mx-auto">
              {/* Информация о пользователе */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Информация о пользователе
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Имя пользователя</Label>
                      <Input value={user.username} disabled />
                    </div>
                    <div>
                      <Label>Роль</Label>
                      <Input 
                        value={user.role === 'admin' ? 'Администратор' : user.role === 'teacher' ? 'Преподаватель' : 'Студент'} 
                        disabled 
                      />
                    </div>
                  </div>
                  {user.course && (
                    <div>
                      <Label>Текущий курс</Label>
                      <Input value={user.course} disabled />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Смена курса - только для не-администраторов */}
              {user.role !== 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Изменить курс
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Выберите курс</Label>
                      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
                      <Label>Текущий пароль</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Введите текущий пароль"
                      />
                    </div>
                    <Button onClick={handleCourseChange} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить курс
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Смена пароля */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Изменить пароль
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isChangingPassword ? (
                    <Button 
                      onClick={() => setIsChangingPassword(true)}
                      variant="outline" 
                      className="w-full"
                    >
                      Изменить пароль
                    </Button>
                  ) : (
                    <>
                      <div>
                        <Label>Текущий пароль</Label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Введите текущий пароль"
                        />
                      </div>
                      <div>
                        <Label>Новый пароль</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Введите новый пароль"
                        />
                      </div>
                      <div>
                        <Label>Подтвердите новый пароль</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Подтвердите новый пароль"
                        />
                      </div>
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          После смены пароля вы будете автоматически выведены из системы. 
                          Войдите заново с новым паролем.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Button onClick={handlePasswordChange} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Сменить пароль
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsChangingPassword(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          Отмена
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <AdminFileManager />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementsManager />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <AdminContentManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUserManager />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <AdminNotificationCenter />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <AdminSystemSettings />
          </TabsContent>
        </Tabs>
      ) : user?.role === 'student' ? (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Настройки профиля</TabsTrigger>
            <TabsTrigger value="achievements">Мои достижения</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 max-w-2xl mx-auto">
              {/* Информация о пользователе */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Информация о пользователе
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Имя пользователя</Label>
                  <Input value={user?.username || ''} disabled />
                </div>
                <div>
                  <Label>Роль</Label>
                  <Input 
                    value={user?.role === 'admin' ? 'Администратор' : user?.role === 'teacher' ? 'Преподаватель' : 'Студент'} 
                    disabled 
                  />
                </div>
              </div>
              {user?.course && (
                <div>
                  <Label>Текущий курс</Label>
                  <Input value={user.course} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Смена курса - только для не-администраторов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Изменить курс
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Выберите курс</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
                <Label>Текущий пароль</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                />
              </div>
              <Button onClick={handleCourseChange} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Сохранить курс
              </Button>
            </CardContent>
          </Card>

          {/* Смена пароля */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Изменить пароль
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline" 
                  className="w-full"
                >
                  Изменить пароль
                </Button>
              ) : (
                <>
                  <div>
                    <Label>Текущий пароль</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Введите текущий пароль"
                    />
                  </div>
                  <div>
                    <Label>Новый пароль</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Введите новый пароль"
                    />
                  </div>
                  <div>
                    <Label>Подтвердите новый пароль</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Подтвердите новый пароль"
                    />
                  </div>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      После смены пароля вы будете автоматически выведены из системы. 
                      Войдите заново с новым паролем.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Сменить пароль
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {user?.username && user?.course && (
              <StudentAchievements 
                studentId={user.username} 
                studentCourse={user.course}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Для преподавателей */
        <div className="grid gap-6 max-w-2xl mx-auto">
          {/* Информация о пользователе */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Информация о пользователе
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Имя пользователя</Label>
                  <Input value={user?.username || ''} disabled />
                </div>
                <div>
                  <Label>Роль</Label>
                  <Input 
                    value={user?.role === 'admin' ? 'Администратор' : user?.role === 'teacher' ? 'Преподаватель' : 'Студент'} 
                    disabled 
                  />
                </div>
              </div>
              {user?.course && (
                <div>
                  <Label>Текущий курс</Label>
                  <Input value={user.course} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Смена пароля */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Изменить пароль
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline" 
                  className="w-full"
                >
                  Изменить пароль
                </Button>
              ) : (
                <>
                  <div>
                    <Label>Текущий пароль</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Введите текущий пароль"
                    />
                  </div>
                  <div>
                    <Label>Новый пароль</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Введите новый пароль"
                    />
                  </div>
                  <div>
                    <Label>Подтвердите новый пароль</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Подтвердите новый пароль"
                    />
                  </div>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      После смены пароля вы будете автоматически выведены из системы. 
                      Войдите заново с новым паролем.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Сменить пароль
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}