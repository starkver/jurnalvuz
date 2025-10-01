import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения с fallback
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
const appMode = import.meta.env?.VITE_APP_MODE || 'localhost'

// Проверяем наличие credentials
const hasSupabaseCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 50 && // Реальные ключи Supabase длинные
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key'

// Логирование в зависимости от режима
if (appMode === 'localhost' || !hasSupabaseCredentials) {
  console.info('🔧 Режим работы: localStorage (автономный)')
  console.info('📝 Для включения Supabase настройте переменные VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
} else {
  console.info('🚀 Режим работы: Supabase (полная интеграция)')
}

// Создаем клиент Supabase (если credentials доступны)
export const supabase = hasSupabaseCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Проверка подключения к Supabase
export const isSupabaseConnected = () => {
  return supabase !== null && hasSupabaseCredentials
}

// Типы для Supabase
export interface SupabaseUser {
  id: string
  email?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  username: string
  role: 'student' | 'teacher' | 'admin'
  course: string
  registration_date: string
  last_login?: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  supabase_id?: string
}

export interface Article {
  id: string
  title: string
  content: string
  author_id: string
  course: string
  created_at: string
  updated_at: string
  published: boolean
}

export interface Journal {
  id: string
  teacher_id: string
  name: string
  course: string
  semester: string
  year: number
  description?: string
  columns: any[]
  students: any[]
  created_at: string
  updated_at: string
}

// Database типы для TypeScript
export interface Database {
  public: {
    Tables: {
      users_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'registration_date'>
        Update: Partial<Omit<UserProfile, 'id'>>
      }
      articles: {
        Row: Article
        Insert: Omit<Article, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Article, 'id' | 'created_at'>>
      }
      journals: {
        Row: Journal
        Insert: Omit<Journal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Journal, 'id' | 'created_at'>>
      }
    }
  }
}