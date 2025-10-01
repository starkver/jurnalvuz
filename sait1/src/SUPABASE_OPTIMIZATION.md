# Рекомендации по оптимизации Supabase

## Настройки сохранения данных для экономии места

### 1. Автоматическая очистка старых данных активности

Создайте функцию в Supabase для автоматической очистки старых записей:

```sql
-- Функция для очистки старых записей активности (старше 90 дней)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_activities 
  WHERE timestamp < (NOW() - INTERVAL '90 days');
  
  DELETE FROM user_sessions 
  WHERE session_start < (NOW() - INTERVAL '90 days');
END;
$$;

-- Создание расписания для автоматической очистки (раз в неделю)
SELECT cron.schedule('cleanup-old-activity', '0 2 * * 0', 'SELECT cleanup_old_activity();');
```

### 2. Ограничение количества записей на пользователя

```sql
-- Триггер для ограничения количества записей активности на пользователя
CREATE OR REPLACE FUNCTION limit_user_activities()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Удаляем старые записи, оставляя только последние 1000
  DELETE FROM user_activities 
  WHERE user_id = NEW.user_id 
  AND id NOT IN (
    SELECT id FROM user_activities 
    WHERE user_id = NEW.user_id 
    ORDER BY timestamp DESC 
    LIMIT 1000
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER limit_activities_trigger
  AFTER INSERT ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION limit_user_activities();
```

### 3. Агрегация данных для экономии места

```sql
-- Таблица для хранения агрегированных данных по дням
CREATE TABLE daily_activity_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_activities INTEGER DEFAULT 0,
  total_session_time_minutes INTEGER DEFAULT 0,
  pages_visited INTEGER DEFAULT 0,
  activity_types JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Функция для агрегации ежедневных данных
CREATE OR REPLACE FUNCTION aggregate_daily_activity()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO daily_activity_summary (user_id, date, total_activities, total_session_time_minutes, pages_visited, activity_types)
  SELECT 
    user_id,
    DATE(timestamp) as date,
    COUNT(*) as total_activities,
    COALESCE(SUM(CASE WHEN activity_type = 'session' THEN (details->>'duration_minutes')::INTEGER ELSE 0 END), 0) as total_session_time_minutes,
    COUNT(DISTINCT CASE WHEN activity_type = 'page_visit' THEN details->>'page' END) as pages_visited,
    json_object_agg(activity_type, COUNT(*)) as activity_types
  FROM user_activities 
  WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY user_id, DATE(timestamp)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    total_activities = EXCLUDED.total_activities,
    total_session_time_minutes = EXCLUDED.total_session_time_minutes,
    pages_visited = EXCLUDED.pages_visited,
    activity_types = EXCLUDED.activity_types;
  
  -- Удаляем агрегированные записи старше 1 дня
  DELETE FROM user_activities 
  WHERE DATE(timestamp) < CURRENT_DATE;
END;
$$;
```

### 4. Настройки RLS (Row Level Security)

```sql
-- Включаем RLS для таблиц
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid()::text = user_id);
```

## Рекомендации по использованию в коде

### 1. Батчинг операций

```typescript
// Группируем операции для уменьшения количества запросов
const batchActivities = [];
const BATCH_SIZE = 10;

function trackActivityBatch(activity: UserActivity) {
  batchActivities.push(activity);
  
  if (batchActivities.length >= BATCH_SIZE) {
    flushActivities();
  }
}

async function flushActivities() {
  if (batchActivities.length > 0) {
    await supabase.from('user_activities').insert(batchActivities);
    batchActivities.length = 0;
  }
}
```

### 2. Кэширование в localStorage

```typescript
// Используем localStorage как буфер для уменьшения нагрузки на Supabase
const ACTIVITY_CACHE_KEY = 'activity_cache';
const CACHE_FLUSH_INTERVAL = 60000; // 1 минута

function cacheActivity(activity: UserActivity) {
  const cached = JSON.parse(localStorage.getItem(ACTIVITY_CACHE_KEY) || '[]');
  cached.push(activity);
  localStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(cached));
}

async function flushCachedActivities() {
  const cached = JSON.parse(localStorage.getItem(ACTIVITY_CACHE_KEY) || '[]');
  if (cached.length > 0) {
    await supabase.from('user_activities').insert(cached);
    localStorage.removeItem(ACTIVITY_CACHE_KEY);
  }
}

// Периодическая отправка данных
setInterval(flushCachedActivities, CACHE_FLUSH_INTERVAL);
```

### 3. Условное логирование

```typescript
// Логируем только важные действия для экономии места
const IMPORTANT_ACTIVITIES = ['login', 'logout', 'achievement_earned', 'journal_access'];

function shouldLogActivity(activityType: string): boolean {
  return IMPORTANT_ACTIVITIES.includes(activityType) || Math.random() < 0.1; // 10% остальных действий
}
```

## Мониторинг использования

### 1. Запрос для проверки размера таблиц

```sql
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('user_activities', 'user_sessions');
```

### 2. Проверка количества записей

```sql
SELECT 
  'user_activities' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', MIN(timestamp)) as oldest_record,
  DATE_TRUNC('day', MAX(timestamp)) as newest_record
FROM user_activities
UNION ALL
SELECT 
  'user_sessions' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', MIN(session_start)) as oldest_record,
  DATE_TRUNC('day', MAX(session_start)) as newest_record
FROM user_sessions;
```

## Предложения по экономии места

1. **Сэмплинг данных**: Логируйте только каждое 10-е действие обычных пользователей
2. **Агрегация**: Переводите детальные данные в агрегированные сводки
3. **Архивирование**: Переносите старые данные в более дешевое хранилище
4. **Компрессия**: Используйте JSONB вместо JSON для экономии места
5. **Индексы**: Создавайте индексы только для часто используемых запросов

## Автоматические задачи

```sql
-- Еженедельная очистка
SELECT cron.schedule('weekly-cleanup', '0 3 * * 1', 'SELECT cleanup_old_activity();');

-- Ежедневная агрегация
SELECT cron.schedule('daily-aggregation', '0 1 * * *', 'SELECT aggregate_daily_activity();');

-- Ежемесячная статистика
SELECT cron.schedule('monthly-stats', '0 4 1 * *', 'SELECT generate_monthly_reports();');
```