import { supabase } from './supabaseClient';

export interface UserActivity {
  id?: string;
  user_id: string;
  activity_type: 'login' | 'logout' | 'page_visit' | 'file_view' | 'journal_access' | 'profile_edit' | 'achievement_earned' | 'course_material_access';
  details: any;
  timestamp: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface UserSession {
  id?: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  pages_visited: number;
  activities_count: number;
  last_activity: string;
}

export interface DetailedUserProfile {
  id: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  course: string;
  registration_date: string;
  last_login?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  supabase_id?: string;
  // Extended tracking fields
  total_login_count: number;
  total_session_time_minutes: number;
  last_activity?: string;
  favorite_sections?: string[];
  achievements_earned?: string[];
  files_accessed?: string[];
  journal_entries_count: number;
  profile_completion_percentage: number;
  is_active: boolean;
  preferences?: any;
  learning_progress?: any;
}

class UserActivityTracker {
  private currentSessionId: string | null = null;
  private currentUserId: string | null = null;
  private sessionStartTime: Date | null = null;
  private activityCount = 0;
  private pagesVisited = new Set<string>();
  
  // Настройки оптимизации
  private batchActivities: UserActivity[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly CACHE_FLUSH_INTERVAL = 60000; // 1 минута
  private readonly IMPORTANT_ACTIVITIES = ['login', 'logout', 'achievement_earned', 'journal_access'];
  private flushTimer: NodeJS.Timeout | null = null;

  async startSession(userId: string): Promise<void> {
    try {
      this.currentUserId = userId;
      this.sessionStartTime = new Date();
      this.currentSessionId = `session_${userId}_${Date.now()}`;
      this.activityCount = 0;
      this.pagesVisited.clear();

      // Record login activity
      await this.trackActivity('login', {
        session_id: this.currentSessionId,
        user_agent: navigator.userAgent,
        timestamp: this.sessionStartTime.toISOString()
      });

      // Update user's last login
      await this.updateUserLastLogin(userId);

      // Create session record
      if (supabase) {
        await supabase.from('user_sessions').insert({
          user_id: userId,
          session_start: this.sessionStartTime.toISOString(),
          pages_visited: 0,
          activities_count: 0,
          last_activity: this.sessionStartTime.toISOString()
        });
      }

      console.log('🎯 Session started for user:', userId);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSessionId || !this.currentUserId || !this.sessionStartTime) {
      return;
    }

    try {
      // Принудительно отправляем все накопленные активности
      await this.flushActivities();

      const sessionEnd = new Date();
      const durationMinutes = Math.round((sessionEnd.getTime() - this.sessionStartTime.getTime()) / (1000 * 60));

      // Record logout activity
      await this.trackActivity('logout', {
        session_id: this.currentSessionId,
        session_duration_minutes: durationMinutes,
        pages_visited: this.pagesVisited.size,
        activities_count: this.activityCount
      });

      // Update session record
      if (supabase) {
        await supabase.from('user_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_minutes: durationMinutes,
            pages_visited: this.pagesVisited.size,
            activities_count: this.activityCount
          })
          .eq('user_id', this.currentUserId)
          .eq('session_start', this.sessionStartTime.toISOString());

        // Update user's total session time
        await supabase.rpc('update_user_session_stats', {
          user_id: this.currentUserId,
          additional_minutes: durationMinutes,
          additional_login: 1
        });
      }

      console.log('🔚 Session ended. Duration:', durationMinutes, 'minutes');
      this.resetSession();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  async trackActivity(activityType: UserActivity['activity_type'], details: any = {}): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    // Проверяем, нужно ли логировать это действие (оптимизация)
    if (!this.shouldLogActivity(activityType)) {
      return;
    }

    try {
      this.activityCount++;

      const activity: UserActivity = {
        user_id: this.currentUserId,
        activity_type: activityType,
        details: {
          ...details,
          session_id: this.currentSessionId,
          user_agent: navigator.userAgent
        },
        timestamp: new Date().toISOString()
      };

      // Добавляем в батч для оптимизации
      this.batchActivities.push(activity);
      
      // Если батч полный или это важное действие, отправляем немедленно
      if (this.batchActivities.length >= this.BATCH_SIZE || this.IMPORTANT_ACTIVITIES.includes(activityType)) {
        await this.flushActivities();
      } else {
        // Иначе запускаем таймер для отложенной отправки
        this.scheduleFlush();
      }

      // Save to localStorage as backup
      const localActivities = JSON.parse(localStorage.getItem('user_activities') || '[]');
      localActivities.push(activity);
      // Keep only last 50 activities in localStorage (уменьшено для экономии места)
      if (localActivities.length > 50) {
        localActivities.splice(0, localActivities.length - 50);
      }
      localStorage.setItem('user_activities', JSON.stringify(localActivities));

      // Update last activity time
      await this.updateUserLastActivity();

      console.log('📊 Activity tracked:', activityType, details);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  private shouldLogActivity(activityType: string): boolean {
    // Всегда логируем важные действия
    if (this.IMPORTANT_ACTIVITIES.includes(activityType)) {
      return true;
    }
    
    // Для остальных действий логируем только каждое 10-е (10% экономия места)
    return Math.random() < 0.1;
  }

  private async flushActivities(): Promise<void> {
    if (this.batchActivities.length === 0) {
      return;
    }

    try {
      if (supabase) {
        await supabase.from('user_activities').insert(this.batchActivities);
      }
      this.batchActivities = [];
      
      // Очищаем таймер если он был установлен
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
    } catch (error) {
      console.error('Error flushing activities:', error);
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      return; // Таймер уже установлен
    }

    this.flushTimer = setTimeout(async () => {
      await this.flushActivities();
    }, this.CACHE_FLUSH_INTERVAL);
  }

  async trackPageVisit(pageName: string): Promise<void> {
    this.pagesVisited.add(pageName);
    await this.trackActivity('page_visit', { page: pageName });
  }

  async trackFileView(fileName: string, fileType: string): Promise<void> {
    await this.trackActivity('file_view', { 
      file_name: fileName, 
      file_type: fileType 
    });
  }

  async trackJournalAccess(journalId?: string): Promise<void> {
    await this.trackActivity('journal_access', { journal_id: journalId });
  }

  async trackProfileEdit(changedFields: string[]): Promise<void> {
    await this.trackActivity('profile_edit', { changed_fields: changedFields });
  }

  async trackAchievementEarned(achievementId: string): Promise<void> {
    await this.trackActivity('achievement_earned', { achievement_id: achievementId });
  }

  async trackCourseMaterialAccess(materialId: string, materialType: string): Promise<void> {
    await this.trackActivity('course_material_access', { 
      material_id: materialId, 
      material_type: materialType 
    });
  }

  private async updateUserLastLogin(userId: string): Promise<void> {
    try {
      if (supabase) {
        await supabase.from('users_profiles')
          .update({ 
            last_login: new Date().toISOString(),
            total_login_count: supabase.sql`total_login_count + 1`
          })
          .eq('id', userId);
      }

      // Update localStorage backup
      // Users in localStorage are stored as object, not array
      const localUsersData = localStorage.getItem('users') || '{}';
      let localUsers;
      
      try {
        localUsers = JSON.parse(localUsersData);
      } catch (parseError) {
        console.warn('Failed to parse users from localStorage:', parseError);
        localUsers = {};
      }
      
      // If it's an object (expected format), iterate through keys
      if (typeof localUsers === 'object' && !Array.isArray(localUsers)) {
        for (const [key, userData] of Object.entries(localUsers)) {
          if ((userData as any).id === userId) {
            (userData as any).last_login = new Date().toISOString();
            (userData as any).total_login_count = ((userData as any).total_login_count || 0) + 1;
            localUsers[key] = userData;
            localStorage.setItem('users', JSON.stringify(localUsers));
            break;
          }
        }
      }
      // If it's an array (legacy format), handle as before
      else if (Array.isArray(localUsers)) {
        const userIndex = localUsers.findIndex((u: any) => u.id === userId);
        if (userIndex !== -1) {
          localUsers[userIndex].last_login = new Date().toISOString();
          localUsers[userIndex].total_login_count = (localUsers[userIndex].total_login_count || 0) + 1;
          localStorage.setItem('users', JSON.stringify(localUsers));
        }
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  private async updateUserLastActivity(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const now = new Date().toISOString();

      if (supabase) {
        await supabase.from('users_profiles')
          .update({ last_activity: now })
          .eq('id', this.currentUserId);
      }

      // Update localStorage backup
      // Users in localStorage are stored as object, not array
      const localUsersData = localStorage.getItem('users') || '{}';
      let localUsers;
      
      try {
        localUsers = JSON.parse(localUsersData);
      } catch (parseError) {
        console.warn('Failed to parse users from localStorage:', parseError);
        localUsers = {};
      }
      
      // If it's an object (expected format), iterate through keys
      if (typeof localUsers === 'object' && !Array.isArray(localUsers)) {
        for (const [key, userData] of Object.entries(localUsers)) {
          if ((userData as any).id === this.currentUserId) {
            (userData as any).last_activity = now;
            localUsers[key] = userData;
            localStorage.setItem('users', JSON.stringify(localUsers));
            break;
          }
        }
      }
      // If it's an array (legacy format), handle as before
      else if (Array.isArray(localUsers)) {
        const userIndex = localUsers.findIndex((u: any) => u.id === this.currentUserId);
        if (userIndex !== -1) {
          localUsers[userIndex].last_activity = now;
          localStorage.setItem('users', JSON.stringify(localUsers));
        }
      }
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }

  async getUserActivities(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      }

      // Fallback to localStorage
      const localActivities = JSON.parse(localStorage.getItem('user_activities') || '[]');
      return localActivities
        .filter((activity: UserActivity) => activity.user_id === userId)
        .sort((a: UserActivity, b: UserActivity) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async getUserSessions(userId: string, limit: number = 10): Promise<UserSession[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('session_start', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  async getDetailedUserProfile(userId: string): Promise<DetailedUserProfile | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      }

      // Fallback to localStorage
      const localUsersData = localStorage.getItem('users') || '{}';
      let localUsers;
      let user = null;
      
      try {
        localUsers = JSON.parse(localUsersData);
      } catch (parseError) {
        console.warn('Failed to parse users from localStorage:', parseError);
        localUsers = {};
      }
      
      // If it's an object (expected format), search through values
      if (typeof localUsers === 'object' && !Array.isArray(localUsers)) {
        user = Object.values(localUsers).find((u: any) => u.id === userId);
      }
      // If it's an array (legacy format), handle as before
      else if (Array.isArray(localUsers)) {
        user = localUsers.find((u: any) => u.id === userId);
      }
      
      if (user) {
        return {
          ...user,
          total_login_count: user.total_login_count || 0,
          total_session_time_minutes: user.total_session_time_minutes || 0,
          journal_entries_count: user.journal_entries_count || 0,
          profile_completion_percentage: user.profile_completion_percentage || 0,
          is_active: user.is_active !== false
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting detailed user profile:', error);
      return null;
    }
  }

  private resetSession(): void {
    this.currentSessionId = null;
    this.currentUserId = null;
    this.sessionStartTime = null;
    this.activityCount = 0;
    this.pagesVisited.clear();
    
    // Очищаем таймер и батч при сбросе сессии
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.batchActivities = [];
  }

  // Activity analytics methods
  async getActivitySummary(userId: string, days: number = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      if (supabase) {
        const { data, error } = await supabase
          .from('user_activities')
          .select('activity_type, timestamp')
          .eq('user_id', userId)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString());

        if (error) throw error;

        // Analyze data
        const summary = {
          total_activities: data?.length || 0,
          activity_types: {} as any,
          daily_breakdown: {} as any,
          most_active_day: '',
          avg_daily_activities: 0
        };

        data?.forEach(activity => {
          // Count by type
          summary.activity_types[activity.activity_type] = 
            (summary.activity_types[activity.activity_type] || 0) + 1;

          // Count by day
          const date = new Date(activity.timestamp).toDateString();
          summary.daily_breakdown[date] = (summary.daily_breakdown[date] || 0) + 1;
        });

        // Find most active day
        let maxActivities = 0;
        Object.entries(summary.daily_breakdown).forEach(([date, count]) => {
          if (count > maxActivities) {
            maxActivities = count;
            summary.most_active_day = date;
          }
        });

        summary.avg_daily_activities = Math.round(summary.total_activities / days);

        return summary;
      }

      return {
        total_activities: 0,
        activity_types: {},
        daily_breakdown: {},
        most_active_day: '',
        avg_daily_activities: 0
      };
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return null;
    }
  }

  getCurrentSession() {
    return {
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      startTime: this.sessionStartTime,
      activityCount: this.activityCount,
      pagesVisited: Array.from(this.pagesVisited)
    };
  }
}

// Create singleton instance
export const userActivityTracker = new UserActivityTracker();

// Auto-cleanup when page unloads
window.addEventListener('beforeunload', () => {
  userActivityTracker.endSession();
});

// Track page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    userActivityTracker.trackActivity('page_hidden', { timestamp: new Date().toISOString() });
  } else {
    userActivityTracker.trackActivity('page_visible', { timestamp: new Date().toISOString() });
  }
});