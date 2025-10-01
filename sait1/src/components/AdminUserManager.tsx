import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { 
  Users, UserPlus, UserMinus, Edit, Save, 
  Trash2, Search, Filter, Download, 
  Shield, User, GraduationCap 
} from "lucide-react";
import { toast } from "../lib/toast";

interface UserData {
  username: string;
  role: 'student' | 'teacher' | 'admin';
  course?: string;
  created: string;
  lastLogin?: string;
  email?: string;
}

export function AdminUserManager() {
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [filteredUsers, setFilteredUsers] = useState<Array<[string, UserData]>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student" as const,
    course: "",
    email: ""
  });

  // Загрузка пользователей
  useEffect(() => {
    loadUsers();
  }, []);

  // Фильтрация пользователей
  useEffect(() => {
    let filtered = Object.entries(users);

    if (searchTerm) {
      filtered = filtered.filter(([, user]) => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(([, user]) => user.role === roleFilter);
    }

    if (courseFilter !== "all") {
      filtered = filtered.filter(([, user]) => user.course === courseFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, courseFilter]);

  const loadUsers = () => {
    const usersData = localStorage.getItem('users');
    if (usersData) {
      const parsedUsers = JSON.parse(usersData);
      const usersList: Record<string, UserData> = {};
      
      // Преобразуем формат ключей "username_password" в удобный для отображения
      Object.entries(parsedUsers).forEach(([key, userData]: [string, any]) => {
        const [username] = key.split('_');
        if (!usersList[username]) {
          usersList[username] = {
            username,
            role: userData.role,
            course: userData.course,
            created: userData.created || new Date().toISOString(),
            lastLogin: userData.lastLogin,
            email: userData.email
          };
        }
      });
      
      setUsers(usersList);
    }
  };

  // Создание нового пользователя
  const createUser = () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Заполните имя пользователя и пароль");
      return;
    }

    const usersData = JSON.parse(localStorage.getItem('users') || '{}');
    const userKey = `${newUser.username}_${newUser.password}`;
    
    if (usersData[userKey]) {
      toast.error("Пользователь с таким именем уже существует");
      return;
    }

    const userData = {
      role: newUser.role,
      course: newUser.course,
      email: newUser.email,
      created: new Date().toISOString()
    };

    usersData[userKey] = userData;
    localStorage.setItem('users', JSON.stringify(usersData));
    
    setNewUser({
      username: "",
      password: "",
      role: "student",
      course: "",
      email: ""
    });
    
    loadUsers();
    toast.success("Пользователь создан");
  };

  // Удаление пользователя
  const deleteUser = (username: string) => {
    if (username === 'Starkver') {
      toast.error("Нельзя удалить главного администратора");
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
      return;
    }

    const usersData = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Удаляем все записи этого пользователя (с разными паролями)
    Object.keys(usersData).forEach(key => {
      if (key.startsWith(`${username}_`)) {
        delete usersData[key];
      }
    });

    localStorage.setItem('users', JSON.stringify(usersData));
    loadUsers();
    toast.success("Пользователь удален");
  };

  // Изменение роли пользователя
  const changeUserRole = (username: string, newRole: string) => {
    if (username === 'Starkver' && newRole !== 'admin') {
      toast.error("Нельзя изменить роль главного администратора");
      return;
    }

    const usersData = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Обновляем роль во всех записях этого пользователя
    Object.keys(usersData).forEach(key => {
      if (key.startsWith(`${username}_`)) {
        usersData[key].role = newRole;
      }
    });

    localStorage.setItem('users', JSON.stringify(usersData));
    loadUsers();
    toast.success("Роль пользователя изменена");
  };

  // Сброс пароля пользователя
  const resetUserPassword = (username: string, newPassword: string) => {
    if (!newPassword) {
      toast.error("Введите новый пароль");
      return;
    }

    const usersData = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Находим старую запись пользователя
    let oldUserData = null;
    let oldKey = null;
    
    Object.entries(usersData).forEach(([key, userData]) => {
      if (key.startsWith(`${username}_`)) {
        oldUserData = userData;
        oldKey = key;
      }
    });

    if (!oldUserData || !oldKey) {
      toast.error("Пользователь не найден");
      return;
    }

    // Удаляем старую запись и создаем новую с новым паролем
    delete usersData[oldKey];
    const newKey = `${username}_${newPassword}`;
    usersData[newKey] = oldUserData;

    localStorage.setItem('users', JSON.stringify(usersData));
    toast.success("Пароль изменен");
  };

  // Экспорт пользователей
  const exportUsers = () => {
    const usersList = Object.entries(users).map(([username, data]) => ({
      username,
      role: data.role,
      course: data.course,
      created: data.created,
      email: data.email
    }));

    const blob = new Blob([JSON.stringify(usersList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Список пользователей экспортирован");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'teacher': return GraduationCap;
      default: return User;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl mb-2">Управление пользователями</h2>
        <p className="text-muted-foreground">
          Создавайте, редактируйте и управляйте пользователями системы
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Список пользователей</TabsTrigger>
          <TabsTrigger value="create">Создать пользователя</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Фильтры и поиск */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фильтры и поиск
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Поиск:</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Имя или email..."
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Роль:</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все роли</SelectItem>
                      <SelectItem value="student">Студенты</SelectItem>
                      <SelectItem value="teacher">Преподаватели</SelectItem>
                      <SelectItem value="admin">Администраторы</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Курс:</Label>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все курсы</SelectItem>
                      <SelectItem value="1">1 курс</SelectItem>
                      <SelectItem value="2">2 курс</SelectItem>
                      <SelectItem value="3">3 курс</SelectItem>
                      <SelectItem value="4">4 курс</SelectItem>
                      <SelectItem value="5">5 курс</SelectItem>
                      <SelectItem value="6">6 курс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={exportUsers} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Список пользователей */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Пользователи ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map(([username, user]) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <div
                      key={username}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{username}</div>
                            {user.email && (
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role) as any}>
                            {user.role === 'admin' ? 'Админ' : 
                             user.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                          </Badge>
                          {user.course && (
                            <Badge variant="outline">{user.course} курс</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => changeUserRole(username, newRole)}
                          disabled={username === 'Starkver'}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Студент</SelectItem>
                            <SelectItem value="teacher">Преподаватель</SelectItem>
                            <SelectItem value="admin">Админ</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newPassword = prompt("Введите новый пароль:");
                            if (newPassword) {
                              resetUserPassword(username, newPassword);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(username)}
                          disabled={username === 'Starkver'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Пользователи не найдены
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Создать нового пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Имя пользователя:</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="username"
                  />
                </div>
                
                <div>
                  <Label>Пароль:</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Пароль"
                  />
                </div>
                
                <div>
                  <Label>Роль:</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(role: any) => setNewUser({...newUser, role})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Студент</SelectItem>
                      <SelectItem value="teacher">Преподаватель</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Курс (для студентов):</Label>
                  <Select
                    value={newUser.course}
                    onValueChange={(course) => setNewUser({...newUser, course})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Не указан</SelectItem>
                      <SelectItem value="1">1 курс</SelectItem>
                      <SelectItem value="2">2 курс</SelectItem>
                      <SelectItem value="3">3 курс</SelectItem>
                      <SelectItem value="4">4 курс</SelectItem>
                      <SelectItem value="5">5 курс</SelectItem>
                      <SelectItem value="6">6 курс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label>Email (опционально):</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <Button onClick={createUser} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Создать пользователя
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Всего пользователей
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(users).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Студенты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Object.values(users).filter(u => u.role === 'student').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Преподаватели
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Object.values(users).filter(u => u.role === 'teacher').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              Статистика обновляется автоматически при изменении пользователей.
              Данные хранятся в localStorage браузера.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}