import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types/database';
import { getStorageData, setStorageData, clearStorageData } from '../utils/storage';
import { isOnline, addOfflineAction, updateLastSync } from '../utils/offline';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile['profile']>) => Promise<void>;
  updateCourse: (course: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  activeUsersCount: number;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  course: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  // Инициализация: проверка сессии Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем сессию в Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Загружаем профиль из Supabase
          await loadUserProfile(session.user.id);
        } else {
          // Если нет сессии Supabase, очищаем localStorage
          clearStorageData();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Подписка на изменения auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        clearStorageData();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Обновляем профиль при обновлении токена
        await loadUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time подписка на изменения профиля текущего пользователя
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users_profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated in real-time:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedProfile = payload.new as any;
            const userProfile: UserProfile = {
              id: updatedProfile.id,
              username: updatedProfile.username,
              role: updatedProfile.role,
              course: updatedProfile.course,
              registrationDate: updatedProfile.registration_date,
              lastLogin: updatedProfile.last_login || undefined,
              supabase_id: updatedProfile.id,
              profile: {
                firstName: updatedProfile.first_name || undefined,
                lastName: updatedProfile.last_name || undefined,
                phone: updatedProfile.phone || undefined,
                avatar_url: updatedProfile.avatar_url || undefined,
              }
            };
            
            setUser(userProfile);
            setStorageData({ currentUser: userProfile });
            toast.info('Профиль обновлен');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Подсчет активных пользователей
  useEffect(() => {
    const updateActiveUsers = async () => {
      try {
        const { count } = await supabase
          .from('users_profiles')
          .select('*', { count: 'exact', head: true });
        setActiveUsersCount(count || 0);
      } catch (error) {
        console.error('Error counting users:', error);
      }
    };

    updateActiveUsers();
    const interval = setInterval(updateActiveUsers, 30000); // Обновление каждые 30 секунд

    return () => clearInterval(interval);
  }, [user]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const userProfile: UserProfile = {
          id: profile.id,
          username: profile.username,
          role: profile.role,
          course: profile.course,
          registrationDate: profile.registration_date,
          lastLogin: profile.last_login || undefined,
          supabase_id: userId,
          profile: {
            firstName: profile.first_name || undefined,
            lastName: profile.last_name || undefined,
            phone: profile.phone || undefined,
            avatar_url: profile.avatar_url || undefined,
          }
        };

        setUser(userProfile);
        // Сохраняем только базовую информацию в localStorage (без паролей!)
        setStorageData({ currentUser: userProfile });

        // Обновляем last_login
        await supabase
          .from('users_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Ошибка загрузки профиля пользователя');
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      // Проверяем, что пароль не пустой
      if (!password || password.trim() === '') {
        throw new Error('Пароль не может быть пустым');
      }

      // Определяем, это email или username
      const isEmail = usernameOrEmail.includes('@');
      
      let email = usernameOrEmail;
      
      // Если это username, находим соответствующий email
      if (!isEmail) {
        const { data: profile, error: profileError } = await supabase
          .from('users_profiles')
          .select('id')
          .eq('username', usernameOrEmail)
          .single();

        if (profileError || !profile) {
          throw new Error('Пользователь не найден. Пожалуйста, зарегистрируйтесь.');
        }

        // Получаем email из auth.users
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError || !authUser?.email) {
          throw new Error('Не удалось найти email пользователя');
        }
        
        email = authUser.email;
      }

      // Вход через Supabase Auth (пароль автоматически хешируется и проверяется)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Неверное имя пользователя или пароль');
        }
        throw error;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        toast.success('Вход выполнен успешно!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Ошибка входа');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      // Валидация пароля
      if (!userData.password || userData.password.length < 6) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }

      // Проверяем, не существует ли уже пользователь с таким username
      const { data: existingProfile, error: checkError } = await supabase
        .from('users_profiles')
        .select('username')
        .eq('username', userData.username)
        .single();

      if (existingProfile) {
        throw new Error('Пользователь с таким именем уже существует');
      }

      // Регистрация через Supabase Auth (пароль автоматически хешируется)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { 
            username: userData.username,
            role: userData.role 
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Пользователь с таким email уже зарегистрирован');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Не удалось создать пользователя');
      }

      // Создаем профиль в users_profiles
      const { error: profileError } = await supabase
        .from('users_profiles')
        .insert({
          id: authData.user.id,
          username: userData.username,
          role: userData.role,
          course: userData.course,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          registration_date: new Date().toISOString()
        });

      if (profileError) {
        // Если не удалось создать профиль, удаляем пользователя из auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Автоматический вход после регистрации
      await loadUserProfile(authData.user.id);
      
      toast.success('Регистрация выполнена успешно!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Ошибка регистрации');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      clearStorageData();
      toast.success('Выход выполнен успешно');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Ошибка при выходе');
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile['profile']>) => {
    if (!user) return;

    try {
      if (isOnline()) {
        const { error } = await supabase
          .from('users_profiles')
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            avatar_url: profileData.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        updateLastSync();
        
        // Real-time подписка автоматически обновит состояние
        toast.success('Профиль обновлен');
      } else {
        addOfflineAction({
          type: 'update',
          table: 'users_profiles',
          data: { id: user.id, ...profileData }
        });
        
        // Обновляем локально
        const updatedUser = {
          ...user,
          profile: { ...user.profile, ...profileData }
        };
        setUser(updatedUser);
        setStorageData({ currentUser: updatedUser });
        toast.info('Изменения будут синхронизированы при подключении к интернету');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Ошибка обновления профиля');
    }
  };

  const updateCourse = async (course: string) => {
    if (!user) return;

    try {
      if (isOnline()) {
        const { error } = await supabase
          .from('users_profiles')
          .update({
            course,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        updateLastSync();
        
        // Real-time подписка автоматически обновит состояние
        toast.success('Курс обновлен');
      } else {
        addOfflineAction({
          type: 'update',
          table: 'users_profiles',
          data: { id: user.id, course }
        });
        
        // Обновляем локально
        const updatedUser = { ...user, course };
        setUser(updatedUser);
        setStorageData({ currentUser: updatedUser });
        toast.info('Изменения будут синхронизированы при подключении к интернету');
      }
    } catch (error: any) {
      console.error('Course update error:', error);
      toast.error('Ошибка обновления курса');
    }
  };

  const syncWithSupabase = async () => {
    if (!isOnline() || !user) return;

    try {
      await loadUserProfile(user.id);
      updateLastSync();
      toast.success('Данные синхронизированы');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Ошибка синхронизации');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateCourse,
    syncWithSupabase,
    activeUsersCount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};