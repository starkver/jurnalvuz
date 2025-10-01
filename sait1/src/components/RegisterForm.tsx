import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthContext';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '../lib/toast';

interface RegisterFormProps {
  onBack: () => void;
}

export function RegisterForm({ onBack }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [course, setCourse] = useState('');
  const [group, setGroup] = useState('');
  const [faculty, setFaculty] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ 
    username: false, 
    password: false, 
    course: false, 
    group: false, 
    faculty: false 
  });
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Сброс ошибок полей
    setFieldErrors({ username: false, password: false, course: false, group: false, faculty: false });

    // Валидация полей
    if (!username.trim()) {
      setError('Введите имя пользователя');
      setFieldErrors(prev => ({ ...prev, username: true }));
      setLoading(false);
      toast.error('Введите имя пользователя');
      return;
    }

    // Имя пользователя может содержать любые символы - ограничений нет

    if (!password.trim()) {
      setError('Введите пароль');
      setFieldErrors(prev => ({ ...prev, password: true }));
      setLoading(false);
      toast.error('Введите пароль');
      return;
    }

    if (password.length < 3) {
      setError('Пароль должен содержать минимум 3 символа');
      setFieldErrors(prev => ({ ...prev, password: true }));
      setLoading(false);
      toast.error('Пароль должен содержать минимум 3 символа');
      return;
    }

    // Валидация для студентов
    if (role === 'student') {
      if (!course) {
        setError('Выберите курс');
        setFieldErrors(prev => ({ ...prev, course: true }));
        setLoading(false);
        toast.error('Пожалуйста, выберите свой курс обучения');
        return;
      }

      if (!group.trim()) {
        setError('Введите номер группы');
        setFieldErrors(prev => ({ ...prev, group: true }));
        setLoading(false);
        toast.error('Поле "Группа" не может быть пустым');
        return;
      }

      if (!faculty) {
        setError('Выберите факультет');
        setFieldErrors(prev => ({ ...prev, faculty: true }));
        setLoading(false);
        toast.error('Пожалуйста, выберите свой факультет');
        return;
      }
    }

    const additionalInfo = role === 'student' ? { course, group, faculty } : {};
    
    try {
      const success = await register(username, password, role, additionalInfo);
      
      if (success) {
        setSuccess('Регистрация успешна! Теперь вы можете войти в систему.');
        setUsername('');
        setPassword('');
        setCourse('');
        setGroup('');
        setFaculty('');
        setFieldErrors({ username: false, password: false, course: false, group: false, faculty: false });
        
        toast.success('Регистрация успешна! Теперь вы можете войти в систему.');
      } else {
        setError('Пользователь с таким именем уже существует');
        toast.error('Пользователь с таким именем уже существует');
      }
    } catch (error) {
      setError('Произошла ошибка при регистрации');
      toast.error('Системная ошибка. Попробуйте еще раз');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Регистрация</CardTitle>
              <CardDescription>
                Создайте новый аккаунт
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors(prev => ({ ...prev, username: false }));
                    setError('');
                  }
                }}
                className={fieldErrors.username ? 'form-input-error' : ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: false }));
                    setError('');
                  }
                }}
                className={fieldErrors.password ? 'form-input-error' : ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select value={role} onValueChange={(value: 'student' | 'teacher') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Студент</SelectItem>
                  <SelectItem value="teacher">Преподаватель</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {role === 'student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="course">Курс</Label>
                  <Select 
                    value={course} 
                    onValueChange={(value) => {
                      setCourse(value);
                      if (fieldErrors.course) {
                        setFieldErrors(prev => ({ ...prev, course: false }));
                        setError('');
                      }
                    }}
                  >
                    <SelectTrigger className={fieldErrors.course ? 'form-input-error' : ''}>
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
                <div className="space-y-2">
                  <Label htmlFor="group">Группа</Label>
                  <Input
                    id="group"
                    type="text"
                    placeholder="Номер группы"
                    value={group}
                    onChange={(e) => {
                      setGroup(e.target.value);
                      if (fieldErrors.group) {
                        setFieldErrors(prev => ({ ...prev, group: false }));
                        setError('');
                      }
                    }}
                    className={fieldErrors.group ? 'form-input-error' : ''}
                    required={role === 'student'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faculty">Факультет</Label>
                  <Select 
                    value={faculty} 
                    onValueChange={(value) => {
                      setFaculty(value);
                      if (fieldErrors.faculty) {
                        setFieldErrors(prev => ({ ...prev, faculty: false }));
                        setError('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите факультет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pediatrics">Педиатрия</SelectItem>
                      <SelectItem value="therapy">Лечебное дело</SelectItem>
                      <SelectItem value="dentistry">Стоматология</SelectItem>
                      <SelectItem value="pharmacy">Фармация</SelectItem>
                      <SelectItem value="nursing">Сестринское дело</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {error && (
              <Alert variant="destructive" className="space-y-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="space-y-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}