#!/bin/bash

# Скрипт для исправления формата sources.list
# Запуск: sudo bash fix-sources-format.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    error "Запустите скрипт с правами root (sudo bash fix-sources-format.sh)"
fi

log "🔧 Исправление формата sources.list..."

# Определяем версию Ubuntu
UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "noble")
UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null || echo "24.04")

info "Обнаружена версия Ubuntu: $UBUNTU_VERSION ($UBUNTU_CODENAME)"

# Проверяем существующий файл
if [ ! -f /etc/apt/sources.list ]; then
    warning "Файл /etc/apt/sources.list не найден"
    log "Создаем новый файл..."
else
    log "Файл sources.list найден, проверяем формат..."
    
    # Показываем первые 10 строк
    echo ""
    info "Текущее содержимое (первые 10 строк):"
    head -n 10 /etc/apt/sources.list | sed 's/^/  /'
    echo ""
    
    # Проверяем формат
    if grep -q "^Types:" /etc/apt/sources.list 2>/dev/null; then
        warning "❌ Обнаружен неправильный формат DEB822!"
        info "Формат DEB822 (Types:, URIs:, etc) работает только в .sources файлах"
        info "Для /etc/apt/sources.list нужен традиционный однострочный формат"
        
        # Создаем резервную копию
        BACKUP_FILE="/etc/apt/sources.list.backup-$(date +%Y%m%d-%H%M%S)"
        log "Создаем резервную копию: $BACKUP_FILE"
        cp /etc/apt/sources.list "$BACKUP_FILE"
        
        # Проверяем, есть ли файлы в формате DEB822 в sources.list.d
        if [ -d /etc/apt/sources.list.d ]; then
            SOURCES_FILES=$(find /etc/apt/sources.list.d -name "*.sources" 2>/dev/null | wc -l)
            if [ "$SOURCES_FILES" -gt 0 ]; then
                info "Найдено $SOURCES_FILES .sources файлов в /etc/apt/sources.list.d/"
                info "Они будут использованы вместе с исправленным sources.list"
            fi
        fi
    elif grep -q "^deb " /etc/apt/sources.list 2>/dev/null; then
        log "✅ Формат sources.list правильный (традиционный)"
        info "Ничего исправлять не нужно"
        
        log "Проверяем работоспособность..."
        apt clean
        if apt update; then
            log "✅ Репозитории работают корректно!"
            exit 0
        else
            warning "Есть проблемы с обновлением пакетов"
            info "Попробуем пересоздать sources.list..."
        fi
    else
        warning "Файл sources.list пуст или имеет неизвестный формат"
    fi
    
    # Создаем резервную копию если еще не создали
    if [ ! -f "$BACKUP_FILE" ]; then
        BACKUP_FILE="/etc/apt/sources.list.backup-$(date +%Y%m%d-%H%M%S)"
        log "Создаем резервную копию: $BACKUP_FILE"
        cp /etc/apt/sources.list "$BACKUP_FILE"
    fi
fi

# Создаем правильный sources.list
log "Создаем sources.list в правильном формате..."

tee /etc/apt/sources.list > /dev/null <<EOF
# Ubuntu $UBUNTU_VERSION ($UBUNTU_CODENAME) Main Repositories
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME} main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME} main restricted universe multiverse

# Ubuntu Updates
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-updates main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-updates main restricted universe multiverse

# Ubuntu Backports
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-backports main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-backports main restricted universe multiverse

# Ubuntu Security Updates
deb http://security.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-security main restricted universe multiverse
deb-src http://security.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-security main restricted universe multiverse
EOF

log "✅ Создан новый sources.list в правильном формате"

echo ""
info "Новое содержимое sources.list:"
cat /etc/apt/sources.list | grep -v '^#' | grep -v '^$' | sed 's/^/  /'
echo ""

# Очищаем кэш
log "🗑️ Очистка кэша apt..."
apt clean
apt autoclean

# Проверяем работоспособность
log "🔄 Проверка работоспособности репозиториев..."
if apt update; then
    log "✅ Репозитории работают корректно!"
    
    # Показываем статистику
    echo ""
    info "Доступно пакетов:"
    apt-cache stats | grep "^Packages:" | sed 's/^/  /'
    
    echo ""
    log "🎉 Исправление завершено успешно!"
    
    if [ -f "$BACKUP_FILE" ]; then
        info "Резервная копия сохранена: $BACKUP_FILE"
        info "Для восстановления: sudo cp $BACKUP_FILE /etc/apt/sources.list"
    fi
    
    echo ""
    info "Теперь можно запускать: sudo bash deploy.sh"
else
    error "❌ Не удалось обновить список пакетов"
fi