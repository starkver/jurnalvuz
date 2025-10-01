import { supabase, isSupabaseConnected, type UserProfile, type Article, type Journal } from './supabaseClient'

// Утилита для обработки ошибок Supabase
export const handleSupabaseError = (error: any, fallbackMessage: string) => {
  console.error('Supabase error:', error)
  return {
    success: false,
    error: error?.message || fallbackMessage
  }
}

// === ПОЛЬЗОВАТЕЛИ ===

// Создание профиля пользователя
export const createUserProfile = async (profile: Omit<UserProfile, 'id' | 'registration_date'>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('users_profiles')
      .insert([{
        ...profile,
        registration_date: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to create user profile')
  }
}

// Получение профиля пользователя
export const getUserProfile = async (userId: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('users_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to get user profile')
  }
}

// Обновление профиля пользователя
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('users_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to update user profile')
  }
}

// Получение всех пользователей (для админов)
export const getAllUsers = async () => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('users_profiles')
      .select('*')
      .order('registration_date', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to get users')
  }
}

// === СТАТЬИ/ПОСТЫ ===

// Создание статьи
export const createArticle = async (article: Omit<Article, 'id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('articles')
      .insert([article])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to create article')
  }
}

// Получение статей по курсу
export const getArticlesByCourse = async (course: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('articles')
      .select(`
        *,
        users_profiles:author_id (
          username,
          first_name,
          last_name
        )
      `)
      .eq('course', course)
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to get articles')
  }
}

// Обновление статьи
export const updateArticle = async (articleId: string, updates: Partial<Article>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('articles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to update article')
  }
}

// Удаление статьи
export const deleteArticle = async (articleId: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { error } = await supabase!
      .from('articles')
      .delete()
      .eq('id', articleId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to delete article')
  }
}

// === ЖУРНАЛЫ ===

// Создание журнала
export const createJournal = async (journal: Omit<Journal, 'id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('journals')
      .insert([journal])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to create journal')
  }
}

// Получение журналов преподавателя
export const getTeacherJournals = async (teacherId: string) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('journals')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to get journals')
  }
}

// Обновление журнала
export const updateJournal = async (journalId: string, updates: Partial<Journal>) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('journals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', journalId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to update journal')
  }
}

// === REAL-TIME ПОДПИСКИ ===

// Подписка на изменения в журналах
export const subscribeToJournalChanges = (journalId: string, callback: (payload: any) => void) => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase not connected - real-time updates disabled')
    return null
  }

  return supabase!
    .channel(`journal-${journalId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'journals',
      filter: `id=eq.${journalId}`
    }, callback)
    .subscribe()
}

// Подписка на новые статьи
export const subscribeToArticles = (course: string, callback: (payload: any) => void) => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase not connected - real-time updates disabled')
    return null
  }

  return supabase!
    .channel(`articles-${course}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'articles',
      filter: `course=eq.${course}`
    }, callback)
    .subscribe()
}

// Подписка на изменения профилей пользователей (для админов)
export const subscribeToUserProfiles = (callback: (payload: any) => void) => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase not connected - real-time updates disabled')
    return null
  }

  return supabase!
    .channel('user-profiles-all')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users_profiles'
    }, callback)
    .subscribe()
}

// Подписка на изменения контента (для всех пользователей)
export const subscribeToContentChanges = (callback: (payload: any) => void) => {
  if (!isSupabaseConnected()) {
    console.warn('Supabase not connected - real-time updates disabled')
    return null
  }

  const channel = supabase!.channel('content-changes')
  
  // Подписываемся на изменения в статьях
  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'articles'
  }, (payload) => callback({ ...payload, table: 'articles' }))
  
  // Подписываемся на изменения в журналах
  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'journals'
  }, (payload) => callback({ ...payload, table: 'journals' }))
  
  return channel.subscribe()
}

// === СТАТИСТИКА ===

// Получение статистики пользователей
export const getUserStats = async () => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const { data, error } = await supabase!
      .from('users_profiles')
      .select('role, course, registration_date')

    if (error) throw error

    // Обработка статистики
    const stats = {
      total: data.length,
      students: data.filter(u => u.role === 'student').length,
      teachers: data.filter(u => u.role === 'teacher').length,
      admins: data.filter(u => u.role === 'admin').length,
      byCourse: data.reduce((acc: any, user) => {
        acc[user.course] = (acc[user.course] || 0) + 1
        return acc
      }, {}),
      recentRegistrations: data.filter(u => {
        const regDate = new Date(u.registration_date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return regDate > weekAgo
      }).length
    }

    return { success: true, data: stats }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to get user stats')
  }
}

// Получение статистики контента
export const getContentStats = async () => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const [articlesResult, journalsResult] = await Promise.all([
      supabase!.from('articles').select('*', { count: 'exact', head: true }),
      supabase!.from('journals').select('*', { count: 'exact', head: true })
    ])

    return {
      success: true,
      data: {
        totalArticles: articlesResult.count || 0,
        totalJournals: journalsResult.count || 0
      }
    }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to get content stats')
  }
}

// === ОЧИСТКА И ОПТИМИЗАЦИЯ ===

// Удаление старых неактивных пользователей (для админов)
export const cleanupInactiveUsers = async (daysInactive: number = 365) => {
  if (!isSupabaseConnected()) {
    return { success: false, error: 'Supabase not connected' }
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

    const { data, error } = await supabase!
      .from('users_profiles')
      .delete()
      .lt('last_login', cutoffDate.toISOString())
      .select()

    if (error) throw error

    return { success: true, data, count: data?.length || 0 }
  } catch (error) {
    return handleSupabaseError(error, 'Failed to cleanup inactive users')
  }
}