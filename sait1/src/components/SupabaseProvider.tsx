import React, { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConnected, type UserProfile } from '../lib/supabaseClient'
import { getCurrentSession, onAuthStateChange } from '../lib/supabaseAuth'
import { toast } from 'sonner'

interface SupabaseContextType {
  isConnected: boolean
  user: any | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType>({
  isConnected: false,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {}
})

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const isConnected = isSupabaseConnected()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        if (!isConnected) {
          console.log('Supabase not connected - running in localStorage mode')
          setLoading(false)
          return
        }

        // Получаем текущую сессию
        const sessionResult = await getCurrentSession()
        
        if (mounted) {
          if (sessionResult.success && sessionResult.data) {
            setUser(sessionResult.data.user)
            setProfile(sessionResult.data.profile)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Подписка на изменения авторизации (только если Supabase подключен)
    let subscription: any = null
    
    if (isConnected) {
      const authSubscription = onAuthStateChange((event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          setProfile(session.profile || null)
        } else {
          setUser(null)
          setProfile(null)
        }

        // Показываем уведомления о состоянии авторизации
        if (event === 'SIGNED_IN') {
          toast.success('Успешный вход в систему')
        } else if (event === 'SIGNED_OUT') {
          toast.info('Вы вышли из системы')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
      })
      
      subscription = authSubscription.data.subscription
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [isConnected])

  const handleSignOut = async () => {
    if (!isConnected) {
      console.log('Supabase not connected - cannot sign out')
      return
    }

    try {
      const { signOut } = await import('../lib/supabaseAuth')
      const result = await signOut()
      
      if (result.success) {
        setUser(null)
        setProfile(null)
        toast.success('Вы успешно вышли из системы')
      } else {
        toast.error(`Ошибка выхода: ${result.error}`)
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Ошибка при выходе из системы')
    }
  }

  const value = {
    isConnected,
    user,
    profile,
    loading,
    signOut: handleSignOut
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}