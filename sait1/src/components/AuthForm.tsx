import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Eye, EyeOff, Mail, Lock, User, Chrome, ArrowLeft } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, checkPasswordStrength, isValidEmail } from '../lib/supabaseAuth'
import { isSupabaseConnected } from '../lib/supabaseClient'
import { toast } from 'sonner'

interface AuthFormProps {
  onBack?: () => void
  defaultTab?: 'login' | 'register'
}

export const AuthForm: React.FC<AuthFormProps> = ({ onBack, defaultTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Состояние для формы входа
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  
  // Состояние для формы регистрации
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    role: 'student' as 'student' | 'teacher',
    course: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const courses = [
    'Веб-разработка',
    'Мобильная разработка',
    'Data Science',
    'Кибербезопасность',
    'UI/UX дизайн'
  ]

  // Валидация формы входа
  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {}

    if (!loginForm.email) {
      newErrors.email = 'Email обязателен'
    } else if (!isValidEmail(loginForm.email)) {
      newErrors.email = 'Некорректный email'
    }

    if (!loginForm.password) {
      newErrors.password = 'Пароль обязателен'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Валидация формы регистрации
  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {}

    if (!registerForm.email) {
      newErrors.email = 'Email обязателен'
    } else if (!isValidEmail(registerForm.email)) {
      newErrors.email = 'Некорректный email'
    }

    if (!registerForm.username) {
      newErrors.username = 'Имя пользователя обязательно'
    }

    if (!registerForm.course) {
      newErrors.course = 'Выберите курс'
    }

    const passwordCheck = checkPasswordStrength(registerForm.password)
    if (!passwordCheck.isValid) {
      newErrors.password = passwordCheck.feedback.join(', ')
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Обработка входа
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateLoginForm()) return
    
    setLoading(true)
    setErrors({})

    try {
      if (!isSupabaseConnected()) {
        toast.error('Supabase не подключен. Используйте локальный вход.')
        return
      }

      const result = await signInWithEmail(loginForm.email, loginForm.password)
      
      if (result.success) {
        toast.success('Успешный вход в систему!')
        onBack?.()
      } else {
        setErrors({ general: result.error })
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Произошла ошибка при входе' })
    } finally {
      setLoading(false)
    }
  }

  // Обработка регистрации
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateRegisterForm()) return
    
    setLoading(true)
    setErrors({})

    try {
      if (!isSupabaseConnected()) {
        toast.error('Supabase не подключен. Используйте локальную регистрацию.')
        return
      }

      const result = await signUpWithEmail(
        registerForm.email,
        registerForm.password,
        {
          username: registerForm.username,
          role: registerForm.role,
          course: registerForm.course,
          first_name: registerForm.firstName,
          last_name: registerForm.lastName
        }
      )
      
      if (result.success) {
        if (result.data.needsEmailConfirmation) {
          toast.success('Проверьте email для подтверждения регистрации')
        } else {
          toast.success('Регистрация успешна!')
          onBack?.()
        }
      } else {
        setErrors({ general: result.error })
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Register error:', error)
      setErrors({ general: 'Произошла ошибка при регистрации' })
    } finally {
      setLoading(false)
    }
  }

  // Обработка входа через Google
  const handleGoogleLogin = async () => {
    setLoading(true)
    
    try {
      if (!isSupabaseConnected()) {
        toast.error('Supabase не подключен. Google OAuth недоступен.')
        return
      }

      const result = await signInWithGoogle()
      
      if (result.success) {
        toast.success('Перенаправление на Google...')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Google login error:', error)
      toast.error('Ошибка входа через Google')
    } finally {
      setLoading(false)
    }
  }

  // Сброс пароля
  const handlePasswordReset = async () => {
    if (!loginForm.email) {
      setErrors({ email: 'Введите email для сброса пароля' })
      return
    }

    if (!isValidEmail(loginForm.email)) {
      setErrors({ email: 'Некорректный email' })
      return
    }

    setLoading(true)
    
    try {
      if (!isSupabaseConnected()) {
        toast.error('Supabase не подключен. Сброс пароля недоступен.')
        return
      }

      const result = await resetPassword(loginForm.email)
      
      if (result.success) {
        setResetEmailSent(true)
        toast.success('Ссылка для сброса пароля отправлена на email')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Ошибка при сбросе пароля')
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseConnected()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>Supabase не подключен</CardTitle>
            <CardDescription>
              Для использования расширенной аутентификации необходимо настроить Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Приложение работает в режиме localStorage. Используйте существующие формы входа/регистрации.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={onBack} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к обычному входу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Образовательный портал</CardTitle>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Войдите в систему или создайте новый аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
                      className="pl-10 pr-10"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {errors.general && (
                  <Alert className="border-destructive">
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                {resetEmailSent && (
                  <Alert>
                    <AlertDescription>
                      Ссылка для сброса пароля отправлена на ваш email
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Войти через Google
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handlePasswordReset}
                  disabled={loading || !loginForm.email}
                >
                  Забыли пароль?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      placeholder="Иван"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      placeholder="Иванов"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username">Имя пользователя</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-username"
                      placeholder="username"
                      className="pl-10"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Роль</Label>
                    <Select
                      value={registerForm.role}
                      onValueChange={(value: 'student' | 'teacher') => 
                        setRegisterForm({ ...registerForm, role: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Студент</SelectItem>
                        <SelectItem value="teacher">Преподаватель</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course">Курс</Label>
                    <Select
                      value={registerForm.course}
                      onValueChange={(value) => setRegisterForm({ ...registerForm, course: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите курс" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {errors.course && (
                  <p className="text-sm text-destructive">{errors.course}</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Создайте пароль"
                      className="pl-10 pr-10"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Повторите пароль"
                      className="pl-10 pr-10"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                {errors.general && (
                  <Alert className="border-destructive">
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Регистрация через Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}