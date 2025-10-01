#!/bin/bash

# Образовательный портал - Скрипт развертывания для Ubuntu 24.04
# Версия: 1.0
# Автор: Образовательный портал

set -e  # Останавливает выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Проверка прав суперпользователя
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        error "Этот скрипт должен запускаться с правами суперпользователя (sudo)"
        exit 1
    fi
}

# Исправление DNS если необходимо
fix_dns() {
    log "Проверка и исправление DNS настроек..."
    
    # Создаем резервную копию
    cp /etc/resolv.conf /etc/resolv.conf.backup 2>/dev/null || true
    
    # Добавляем Google DNS как fallback
    if ! grep -q "8.8.8.8" /etc/resolv.conf; then
        echo "nameserver 8.8.8.8" >> /etc/resolv.conf
        echo "nameserver 8.8.4.4" >> /etc/resolv.conf
        log "DNS настройки обновлены"
    fi
}

# Обновление системы
update_system() {
    log "Обновление системы Ubuntu 24.04..."
    
    # Исправляем DNS перед обновлением
    fix_dns
    
    # Исправляем возможные проблемы с dpkg
    log "Исправление проблем с пакетами..."
    dpkg --configure -a || true
    apt --fix-broken install -y || true
    
    # Обновляем списки пакетов
    apt update || {
        warning "Обновление списков пакетов не удалось, пробуем исправить..."
        apt --fix-broken install -y
        apt update
    }
    
    # Обновляем систему
    apt upgrade -y
    
    log "Система успешно обновлена"
}

# Установка необходимых пакетов
install_packages() {
    log "Установка необходимых пакетов..."
    
    # Основные пакеты
    local packages=(
        "curl"
        "wget" 
        "unzip"
        "git"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
        "build-essential"
        "python3"
        "python3-pip"
        "nginx"
    )
    
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $package "; then
            log "Установка $package..."
            apt install -y "$package" || {
                error "Не удалось установить $package"
                apt --fix-broken install -y
                apt install -y "$package"
            }
        else
            info "$package уже установлен"
        fi
    done
    
    log "Все пакеты успешно установлены"
}

# Установка Node.js и npm
install_nodejs() {
    log "Установка Node.js и npm..."
    
    # Проверяем, установлен ли Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        info "Node.js уже установлен: $node_version"
        
        # Проверяем версию (должна быть >= 18)
        local version_number=$(echo $node_version | sed 's/v//' | cut -d. -f1)
        if [ "$version_number" -lt 18 ]; then
            warning "Версия Node.js устарела ($node_version), обновляем..."
        else
            log "Версия Node.js подходящая: $node_version"
            return 0
        fi
    fi
    
    # Добавляем репозиторий NodeSource для Node.js 20.x LTS
    log "Добавление репозитория NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Устанавливаем Node.js
    apt install -y nodejs
    
    # Проверяем установку
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log "Node.js $(node --version) и npm $(npm --version) успешно установлены"
    else
        error "Установка Node.js/npm не удалась"
        exit 1
    fi
    
    # Обновляем npm до последней версии
    log "Обновление npm..."
    npm install -g npm@latest
}

# Клонирование или обновление репозитория
setup_repository() {
    local repo_url="$1"
    local project_dir="$2"
    
    if [ -z "$repo_url" ]; then
        warning "URL репозитория не указан, пропускаем клонирование"
        return 0
    fi
    
    log "Настройка репозитория проекта..."
    
    if [ -d "$project_dir" ]; then
        log "Директория проекта существует, обновляем..."
        cd "$project_dir"
        git pull origin main || git pull origin master || {
            warning "Не удалось обновить репозиторий, делаем fresh clone..."
            cd ..
            rm -rf "$project_dir"
            git clone "$repo_url" "$project_dir"
        }
    else
        log "Клонирование репозитория..."
        git clone "$repo_url" "$project_dir"
    fi
    
    cd "$project_dir"
    log "Репозиторий настроен в $(pwd)"
}

# Установка зависимостей проекта
install_dependencies() {
    local project_dir="$1"
    
    log "Установка зависимостей проекта..."
    
    if [ ! -f "$project_dir/package.json" ]; then
        error "package.json не найден в $project_dir"
        exit 1
    fi
    
    cd "$project_dir"
    
    # Очищаем кеш npm и node_modules при необходимости
    if [ -d "node_modules" ]; then
        log "Очистка существующих node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        log "Удаление старого package-lock.json..."
        rm -f package-lock.json
    fi
    
    # Очистка npm кеша
    npm cache clean --force
    
    # Установка зависимостей
    log "Установка npm зависимостей..."
    npm install || {
        error "Установка зависимостей не удалась"
        
        # Попытка исправления
        log "Попытка исправления с помощью npm audit..."
        npm audit fix --force || true
        npm install
    }
    
    log "Зависимости успешно установлены"
}

# Сборка проекта
build_project() {
    local project_dir="$1"
    
    log "Сборка проекта..."
    
    cd "$project_dir"
    
    # Проверяем наличие скрипта сборки
    if ! npm run build --dry-run &> /dev/null; then
        error "Скрипт сборки не найден в package.json"
        exit 1
    fi
    
    # Запускаем сборку
    log "Запуск npm run build..."
    npm run build || {
        error "Сборка проекта не удалась"
        
        # Показываем дополнительную информацию для отладки
        log "Информация для отладки:"
        echo "Node.js version: $(node --version)"
        echo "npm version: $(npm --version)"
        echo "Рабочая директория: $(pwd)"
        echo "Содержимое package.json (scripts):"
        cat package.json | grep -A 10 "scripts" || true
        
        exit 1
    }
    
    # Проверяем, что директория dist/build создана
    if [ ! -d "dist" ] && [ ! -d "build" ]; then
        error "Директория сборки (dist или build) не найдена"
        exit 1
    fi
    
    log "Проект успешно собран"
}

# Настройка Nginx
setup_nginx() {
    local project_dir="$1"
    local domain="${2:-localhost}"
    
    log "Настройка Nginx..."
    
    # Определяем директорию сборки
    local build_dir
    if [ -d "$project_dir/dist" ]; then
        build_dir="$project_dir/dist"
    elif [ -d "$project_dir/build" ]; then
        build_dir="$project_dir/build"
    else
        error "Директория сборки не найдена"
        exit 1
    fi
    
    # Создаем конфигурацию Nginx
    local nginx_config="/etc/nginx/sites-available/educational-portal"
    
    cat > "$nginx_config" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $domain;
    
    root $build_dir;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate max-age=0;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: Hide nginx version
    server_tokens off;
    
    # Logs
    access_log /var/log/nginx/educational-portal.access.log;
    error_log /var/log/nginx/educational-portal.error.log;
}
EOF
    
    # Включаем сайт
    ln -sf "$nginx_config" /etc/nginx/sites-enabled/
    
    # Удаляем дефолтный сайт если существует
    rm -f /etc/nginx/sites-enabled/default
    
    # Проверяем конфигурацию Nginx
    nginx -t || {
        error "Конфигурация Nginx содержит ошибки"
        exit 1
    }
    
    # Перезапускаем Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log "Nginx успешно настроен для домена $domain"
    log "Сайт доступен по адресу: http://$domain"
}

# Альтернативная настройка с serve (если Nginx не подходит)
setup_serve() {
    local project_dir="$1"
    local port="${2:-3000}"
    
    log "Настройка serve для статической отдачи..."
    
    # Устанавливаем serve глобально
    npm install -g serve
    
    # Определяем директорию сборки
    local build_dir
    if [ -d "$project_dir/dist" ]; then
        build_dir="$project_dir/dist"
    elif [ -d "$project_dir/build" ]; then
        build_dir="$project_dir/build"
    else
        error "Директория сборки не найдена"
        exit 1
    fi
    
    # Создаем systemd service для serve
    cat > /etc/systemd/system/educational-portal.service << EOF
[Unit]
Description=Educational Portal Static Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$build_dir
ExecStart=/usr/bin/serve -s . -l $port
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    # Запускаем и включаем сервис
    systemctl daemon-reload
    systemctl enable educational-portal
    systemctl start educational-portal
    
    log "Serve настроен и запущен на порту $port"
    log "Сайт доступен по адресу: http://localhost:$port"
}

# Создание .env файла с примерами
create_env_example() {
    local project_dir="$1"
    
    log "Создание примера .env файла..."
    
    cat > "$project_dir/.env.example" << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom domain for OAuth redirects
VITE_APP_URL=http://localhost:3000

# Development/Production mode
NODE_ENV=production
EOF
    
    info "Создан файл .env.example с примерами переменных окружения"
    info "Скопируйте его в .env и укажите ваши реальные значения Supabase"
}

# Финальные проверки
final_checks() {
    local project_dir="$1"
    
    log "Выполнение финальных проверок..."
    
    # Проверяем статус сервисов
    if systemctl is-active nginx &> /dev/null; then
        log "✓ Nginx запущен и работает"
    elif systemctl is-active educational-portal &> /dev/null; then
        log "✓ Serve запущен и работает"
    else
        warning "Не удалось определить статус веб-сервера"
    fi
    
    # Проверяем порты
    if netstat -tlnp | grep -q ":80 "; then
        log "✓ Порт 80 открыт"
    elif netstat -tlnp | grep -q ":3000 "; then
        log "✓ Порт 3000 открыт"
    else
        warning "Веб-сервер может быть недоступен"
    fi
    
    # Проверяем файлы сборки
    local build_dir
    if [ -d "$project_dir/dist" ]; then
        build_dir="$project_dir/dist"
    elif [ -d "$project_dir/build" ]; then
        build_dir="$project_dir/build"
    fi
    
    if [ -f "$build_dir/index.html" ]; then
        log "✓ Файлы сборки найдены"
    else
        error "Файл index.html не найден в директории сборки"
    fi
}

# Показ итоговой информации
show_summary() {
    local project_dir="$1"
    local domain="${2:-localhost}"
    
    echo
    log "==================== РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО ===================="
    echo
    log "Образовательный портал успешно развернут!"
    echo
    info "📁 Директория проекта: $project_dir"
    
    if systemctl is-active nginx &> /dev/null; then
        info "🌐 Веб-сервер: Nginx"
        info "🔗 URL: http://$domain"
    elif systemctl is-active educational-portal &> /dev/null; then
        info "🌐 Веб-сервер: Serve"
        info "🔗 URL: http://localhost:3000"
    fi
    
    echo
    info "⚙️  Дальнейшие шаги:"
    echo "   1. Настройте Supabase (скопируйте .env.example в .env)"
    echo "   2. Укажите URL и ключи Supabase в .env файле"
    echo "   3. Перезапустите веб-сервер после изменения .env"
    echo
    info "📚 Документация: README.md в директории проекта"
    info "🔧 Логи Nginx: /var/log/nginx/educational-portal.*.log"
    echo
    log "==============================================================="
}

# Основная функция
main() {
    local repo_url="$1"
    local project_dir="${2:-/var/www/educational-portal}"
    local domain="${3:-localhost}"
    local use_serve="${4:-false}"
    
    log "Начало развертывания образовательного портала..."
    log "Проект: $project_dir"
    log "Домен: $domain"
    
    # Проверки
    check_sudo
    
    # Основные шаги
    update_system
    install_packages
    install_nodejs
    
    # Настройка проекта (если указан репозиторий)
    if [ -n "$repo_url" ]; then
        setup_repository "$repo_url" "$project_dir"
    else
        log "Работаем с существующим проектом в $project_dir"
        if [ ! -d "$project_dir" ]; then
            error "Директория проекта не существует: $project_dir"
            exit 1
        fi
    fi
    
    install_dependencies "$project_dir"
    build_project "$project_dir"
    create_env_example "$project_dir"
    
    # Настройка веб-сервера
    if [ "$use_serve" = "true" ]; then
        setup_serve "$project_dir"
    else
        setup_nginx "$project_dir" "$domain"
    fi
    
    final_checks "$project_dir"
    show_summary "$project_dir" "$domain"
}

# Обработка аргументов командной строки
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Использование: $0 [REPO_URL] [PROJECT_DIR] [DOMAIN] [USE_SERVE]"
    echo
    echo "Аргументы:"
    echo "  REPO_URL    URL git репозитория (опционально)"
    echo "  PROJECT_DIR Директория проекта (по умолчанию: /var/www/educational-portal)"
    echo "  DOMAIN      Доменное имя (по умолчанию: localhost)"
    echo "  USE_SERVE   Использовать serve вместо Nginx (true/false, по умолчанию: false)"
    echo
    echo "Примеры:"
    echo "  $0"
    echo "  $0 https://github.com/user/repo.git"
    echo "  $0 https://github.com/user/repo.git /opt/myproject"
    echo "  $0 '' /opt/myproject example.com"
    echo "  $0 '' /opt/myproject localhost true"
    exit 0
fi

# Запуск основной функции с переданными аргументами
main "$@"