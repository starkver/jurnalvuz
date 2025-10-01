import { supabase, isSupabaseConnected } from './supabaseClient'
import { createUserProfile, getUserProfile } from './database'
import type { UserProfile } from './supabaseClient'

// === АУТЕНТИФИКАЦИЯ ===

// Регистрация через email/password
export const signUpWithEmail = async (email: string, password: string, profile: Omit<UserProfile, 'id' | 'registration_date' | 'supabase_id'>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    // Регистрация в Supabase Auth
    const { data: authData, error: authError } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: profile.username,
          role: profile.role,
          course: profile.course
        }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // Создание профиля пользователя
      const profileResult = await createUserProfile({
        ...profile,
        supabase_id: authData.user.id
      })

      if (!profileResult.success) {
        console.error('Failed to create profile:', profileResult.error)
      }

      return { 
        success: true, 
        data: {
          user: authData.user,
          profile: profileResult.data,
          needsEmailConfirmation: !authData.session
        }
      }
    }

    return { success: false, error: 'User creation failed' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}

// Вход через email/password
export const signInWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Получение профиля пользователя
    if (data.user) {
      const profileResult = await getUserProfile(data.user.id)
      
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          profile: profileResult.success ? profileResult.data : null
        }
      }
    }

    return { success: false, error: 'Sign in failed' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign in failed' }
  }
}

// Вход через Google OAuth
export const signInWithGoogle = async () => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Google sign in failed' }
  }
}

// Выход
export const signOut = async () => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { error } = await supabase!.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign out failed' }
  }
}

// Получение текущей сессии
export const getCurrentSession = async () => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data: { session }, error } = await supabase!.auth.getSession()
    
    if (error) throw error

    if (session?.user) {
      const profileResult = await getUserProfile(session.user.id)
      
      return {
        success: true,
        data: {
          session,
          user: session.user,
          profile: profileResult.success ? profileResult.data : null
        }
      }
    }

    return { success: true, data: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get session' }
  }
}

// Сброс пароля
export const resetPassword = async (email: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Password reset failed' }
  }
}

// Обновление пароля
export const updatePassword = async (newPassword: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { error } = await supabase!.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Password update failed' }
  }
}

// Подписка на изменения авторизации
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase not connected - auth state changes disabled')
    return { data: { subscription: { unsubscribe: () => {} } } }
  }

  return supabase!.auth.onAuthStateChange(async (event, session) => {
    if (session?.user && event === 'SIGNED_IN') {
      const profileResult = await getUserProfile(session.user.id)
      callback(event, {
        ...session,
        profile: profileResult.success ? profileResult.data : null
      })
    } else {
      callback(event, session)
    }
  })
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Проверка валидности email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Проверка силы пароля
export const checkPasswordStrength = (password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Пароль должен содержать минимум 8 символов')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Добавьте строчные буквы')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Добавьте заглавные буквы')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Добавьте цифры')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Добавьте специальные символы')
  } else {
    score += 1
  }

  return {
    isValid: score >= 3 && password.length >= 8,
    score,
    feedback
  }
}