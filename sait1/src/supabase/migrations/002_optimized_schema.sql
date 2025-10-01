-- =====================================================
-- ОПТИМИЗИРОВАННАЯ СХЕМА БАЗЫ ДАННЫХ
-- Версия: 2.0
-- Дата: 2025-10-01
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Для быстрого поиска

-- =====================================================
-- ТАБЛИЦА: users_profiles (Профили пользователей)
-- =====================================================
-- Оптимизация: Убраны избыточные поля, добавлены индексы
CREATE TABLE IF NOT EXISTS users_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    course VARCHAR(100) NOT NULL,
    
    -- Личная информация (минимальная)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Временные метки
    registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Индексы для быстрого поиска
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_role ON users_profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_course ON users_profiles(course);
CREATE INDEX IF NOT EXISTS idx_users_username ON users_profiles(username);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users_profiles(last_login);

-- Индекс для полнотекстового поиска
CREATE INDEX IF NOT EXISTS idx_users_search ON users_profiles 
    USING gin(to_tsvector('russian', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || username));

-- =====================================================
-- ТАБЛИЦА: articles (Статьи/Посты)
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    course VARCHAR(100) NOT NULL,
    published BOOLEAN DEFAULT false,
    
    -- Временные метки
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_course ON articles(course);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);

-- Индекс для полнотекстового поиска
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles 
    USING gin(to_tsvector('russian', title || ' ' || content));

-- =====================================================
-- ТАБЛИЦА: journals (Журналы)
-- =====================================================
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    course VARCHAR(100) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    
    -- JSON данные (оптимизировано)
    columns JSONB DEFAULT '[]'::jsonb,
    students JSONB DEFAULT '[]'::jsonb,
    
    -- Временные метки
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT name_not_empty CHECK (char_length(name) > 0),
    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_journals_teacher ON journals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_journals_course ON journals(course);
CREATE INDEX IF NOT EXISTS idx_journals_year ON journals(year);
CREATE INDEX IF NOT EXISTS idx_journals_created ON journals(created_at DESC);

-- Индекс для JSONB данных
CREATE INDEX IF NOT EXISTS idx_journals_columns ON journals USING gin(columns);
CREATE INDEX IF NOT EXISTS idx_journals_students ON journals USING gin(students);

-- =====================================================
-- ТАБЛИЦА: notifications (Уведомления)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT false,
    
    -- Временные метки
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT title_not_empty CHECK (char_length(title) > 0)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- ТАБЛИЦА: user_activity (Активность пользователей)
-- =====================================================
-- Оптимизированная таблица для отслеживания активности
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Временная метка
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity(created_at DESC);

-- Партиционирование по месяцам для оптимизации (опционально)
-- CREATE TABLE user_activity_2025_01 PARTITION OF user_activity
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- =====================================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- =====================================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_profiles_updated_at ON users_profiles;
CREATE TRIGGER update_users_profiles_updated_at
    BEFORE UPDATE ON users_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journals_updated_at ON journals;
CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (Row Level Security)
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Политики для users_profiles
CREATE POLICY "Users can view all profiles" ON users_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON users_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Политики для articles
CREATE POLICY "Anyone can view published articles" ON articles
    FOR SELECT USING (published = true);

CREATE POLICY "Authors can view own articles" ON articles
    FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Authors can create articles" ON articles
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own articles" ON articles
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all articles" ON articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Политики для journals
CREATE POLICY "Teachers can view own journals" ON journals
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Students can view journals for their course" ON journals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE id = auth.uid() AND course = journals.course
        )
    );

CREATE POLICY "Teachers can create journals" ON journals
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

CREATE POLICY "Teachers can update own journals" ON journals
    FOR UPDATE USING (teacher_id = auth.uid());

-- Политики для notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Политики для user_activity
CREATE POLICY "Users can view own activity" ON user_activity
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON user_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ФУНКЦИИ ДЛЯ ОЧИСТКИ ДАННЫХ
-- =====================================================

-- Функция для удаления старых уведомлений
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND read = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для удаления старой активности
CREATE OR REPLACE FUNCTION cleanup_old_activity(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_activity
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS) ДЛЯ АНАЛИТИКИ
-- =====================================================

-- Представление для статистики пользователей
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    role,
    course,
    COUNT(*) as user_count,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 days' THEN 1 END) as active_last_month
FROM users_profiles
GROUP BY role, course;

-- Представление для статистики контента
CREATE OR REPLACE VIEW content_statistics AS
SELECT 
    'articles' as content_type,
    course,
    COUNT(*) as total_count,
    COUNT(CASE WHEN published THEN 1 END) as published_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as created_last_week
FROM articles
GROUP BY course
UNION ALL
SELECT 
    'journals' as content_type,
    course,
    COUNT(*) as total_count,
    COUNT(*) as published_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as created_last_week
FROM journals
GROUP BY course;

-- =====================================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- =====================================================

COMMENT ON TABLE users_profiles IS 'Оптимизированная таблица профилей пользователей';
COMMENT ON TABLE articles IS 'Статьи и посты с полнотекстовым поиском';
COMMENT ON TABLE journals IS 'Журналы преподавателей с JSONB данными';
COMMENT ON TABLE notifications IS 'Система уведомлений';
COMMENT ON TABLE user_activity IS 'Отслеживание активности пользователей';

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Обновляем статистику для оптимизатора запросов
ANALYZE users_profiles;
ANALYZE articles;
ANALYZE journals;
ANALYZE notifications;
ANALYZE user_activity;