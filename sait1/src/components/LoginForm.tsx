import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthContext';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '../lib/toast';

interface LoginFormProps {
  onBack: () => void;
}

export function LoginForm({ onBack }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ username: false, password: false });
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({ username: false, password: false });

    // Валидация полей
    if (!username.trim()) {
      setError('Введите имя пользователя');
      setFieldErrors({ username: true, password: false });
      setLoading(false);
      toast.error('Введите имя пользователя');
      return;
    }

    if (!password.trim()) {
      setError('Введите пароль');
      setFieldErrors({ username: false, password: true });
      setLoading(false);
      toast.error('Введите пароль');
      return;
    }

    // Имя пользователя может содержать любые символы - ограничений нет

    console.log('Попытка входа:', { username, password: password ? '***' : 'пустой' });
    
    try {
      const success = await login(username, password);
      
      if (!success) {
        setError('Неверное имя пользователя или пароль');
        setFieldErrors({ username: true, password: true });
        console.log('Вход не удался для:', username);
        toast.error('Неверное имя пользователя или пароль');
      } else {
        console.log('Успешный вход для:', username);
        toast.success(`Добро пожаловать, ${username}!`);
      }
    } catch (error) {
      setError('Произошла ошибка при входе в систему');
      toast.error('Системная ошибка. Попробуйте еще раз');
    }
    
    setLoading(false);
  };

  const clearFields = () => {
    setError('');
    setUsername('');
    setPassword('');
    setFieldErrors({ username: false, password: false });
    console.log('Поля ввода очищены');
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
              <CardTitle>Вход в систему</CardTitle>
              <CardDescription>
                Введите ваши данные для входа
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
            {error && (
              <Alert variant="destructive" className="space-y-2 alert-animation">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
          
          <div className="mt-4 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFields}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Удалить поля ввода
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}