#!/bin/bash

# Скрипт для исправления проблем с репозиториями Ubuntu
# Запуск: sudo bash fix-repositories.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    error "Запустите скрипт с правами root (sudo bash fix-repositories.sh)"
fi

log "🔧 Исправление проблем с репозиториями Ubuntu..."

# Проверяем текущий sources.list
log "📋 Проверка текущих репозиториев..."
if [ -f /etc/apt/sources.list ]; then
    log "Найден существующий sources.list"
    
    # Проверяем, не использует ли он новый формат DEB822
    if grep -q "^Types:" /etc/apt/sources.list 2>/dev/null; then
        warning "Обнаружен неправильный формат DEB822 в sources.list"
        log "Создаем резервную копию..."
        cp /etc/apt/sources.list /etc/apt/sources.list.backup-deb822-$(date +%Y%m%d-%H%M%S)
        
        log "Конвертируем в традиционный формат..."
        # Определяем версию Ubuntu
        UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "noble")
        
        # Создаем sources.list в правильном формате
        tee /etc/apt/sources.list > /dev/null <<EOF
# Ubuntu Main Repositories
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME} main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-backports main restricted universe multiverse

# Ubuntu Security Updates
deb http://security.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-security main restricted universe multiverse
EOF
        log "✅ Файл sources.list конвертирован в правильный формат"
    else
        log "Используем существующую конфигурацию"
    fi
    
    log "Содержимое sources.list:"
    grep -v '^#' /etc/apt/sources.list | grep -v '^

# Очищаем кэш apt
log "🗑️ Очистка кэша apt..."
apt clean
apt autoclean

# Обновляем список пакетов
log "🔄 Обновление списка пакетов с существующими репозиториями..."
apt update || error "Не удалось обновить список пакетов с текущими репозиториями"

log "✅ Список пакетов успешно обновлен"

# Проверяем доступность необходимых пакетов
log "🔍 Проверка доступности пакетов..."
MISSING_PACKAGES=()

for package in nginx nodejs npm curl wget software-properties-common; do
    if apt-cache show $package &>/dev/null; then
        log "✅ $package - доступен"
    else
        warning "❌ $package - не найден"
        MISSING_PACKAGES+=($package)
    fi
done

# Если некоторые пакеты недоступны, пробуем добавить дополнительные репозитории
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    log "📦 Добавление дополнительных репозиториев для недостающих пакетов..."
    
    # Для Node.js добавляем официальный репозиторий
    if [[ " ${MISSING_PACKAGES[@]} " =~ " nodejs " ]] || [[ " ${MISSING_PACKAGES[@]} " =~ " npm " ]]; then
        log "Добавление репозитория NodeSource..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt update
    fi
    
    # Повторная проверка
    log "🔍 Повторная проверка пакетов..."
    for package in "${MISSING_PACKAGES[@]}"; do
        if apt-cache show $package &>/dev/null; then
            log "✅ $package - теперь доступен"
        else
            warning "❌ $package - всё ещё недоступен (будет установлен через snap)"
        fi
    done
fi

# Проверяем snap
log "📦 Проверка snapd..."
if ! command -v snap &> /dev/null; then
    log "Установка snapd..."
    apt install -y snapd || warning "Не удалось установить snapd"
    
    if command -v snap &> /dev/null; then
        systemctl enable snapd 2>/dev/null || true
        systemctl start snapd 2>/dev/null || true
        log "✅ snapd установлен и запущен"
    fi
fi

# Тестовая установка пакета для проверки
log "🧪 Тестовая установка curl..."
if apt install -y curl; then
    log "✅ Репозитории работают корректно"
else
    error "❌ Проблемы с репозиториями всё ещё существуют"
fi

log "🎉 Исправление репозиториев завершено!"
log "📋 Резервные копии сохранены:"
ls -la /etc/apt/sources.list.backup-* 2>/dev/null || true
ls -la /etc/apt/sources.list.d.backup-* 2>/dev/null || true

echo ""
echo "🚀 Теперь можно запускать: sudo bash deploy.sh"
echo "📝 Если проблемы продолжаются:"
echo "   1. Проверьте интерн��т-соединение"
echo "   2. Проверьте DNS настройки"
echo "   3. Убедитесь, что используется Ubuntu Noble" | head -n 10 | sed 's/^/  /' || true
else
    warning "Файл sources.list не найден, создаем минимальную конфигурацию"
    
    # Определяем версию Ubuntu
    UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "noble")
    
    tee /etc/apt/sources.list > /dev/null <<EOF
# Ubuntu Main Repositories
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME} main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-backports main restricted universe multiverse

# Ubuntu Security Updates
deb http://security.ubuntu.com/ubuntu/ ${UBUNTU_CODENAME}-security main restricted universe multiverse
EOF
    log "✅ Создан новый sources.list в правильном формате"
fi

# Очищаем кэш apt
log "🗑️ Очистка кэша apt..."
apt clean
apt autoclean

# Обновляем список пакетов
log "🔄 Обновление списка пакетов с существующими репозиториями..."
apt update || error "Не удалось обновить список пакетов с текущими репозиториями"

log "✅ Список пакетов успешно обновлен"

# Проверяем доступность необходимых пакетов
log "🔍 Проверка доступности пакетов..."
MISSING_PACKAGES=()

for package in nginx nodejs npm curl wget software-properties-common; do
    if apt-cache show $package &>/dev/null; then
        log "✅ $package - доступен"
    else
        warning "❌ $package - не найден"
        MISSING_PACKAGES+=($package)
    fi
done

# Если некоторые пакеты недоступны, пробу��м добавить дополнительные репозитории
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    log "📦 Добавление дополнительных репозиториев для недостающих пакетов..."
    
    # Для Node.js добавляем официальный репозиторий
    if [[ " ${MISSING_PACKAGES[@]} " =~ " nodejs " ]] || [[ " ${MISSING_PACKAGES[@]} " =~ " npm " ]]; then
        log "Добавление репозитория NodeSource..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt update
    fi
    
    # Повторная проверка
    log "🔍 Повторная проверка пакетов..."
    for package in "${MISSING_PACKAGES[@]}"; do
        if apt-cache show $package &>/dev/null; then
            log "✅ $package - теперь доступен"
        else
            warning "❌ $package - всё ещё недоступен (будет установлен через snap)"
        fi
    done
fi

# Проверяем snap
log "📦 Проверка snapd..."
if ! command -v snap &> /dev/null; then
    log "Установка snapd..."
    apt install -y snapd || warning "Не удалось установить snapd"
    
    if command -v snap &> /dev/null; then
        systemctl enable snapd 2>/dev/null || true
        systemctl start snapd 2>/dev/null || true
        log "✅ snapd установлен и запущен"
    fi
fi

# Тестовая установка пакета для проверки
log "🧪 Тестовая установка curl..."
if apt install -y curl; then
    log "✅ Репозитории работают корректно"
else
    error "❌ Проблемы с репозиториями всё ещё существуют"
fi

log "🎉 Исправление репозиториев завершено!"
log "📋 Резервные копии сохранены:"
ls -la /etc/apt/sources.list.backup-* 2>/dev/null || true
ls -la /etc/apt/sources.list.d.backup-* 2>/dev/null || true

echo ""
echo "🚀 Теперь можно запускать: sudo bash deploy.sh"
echo "📝 Если проблемы продолжаются:"
echo "   1. Проверьте интерн��т-соединение"
echo "   2. Проверьте DNS настройки"
echo "   3. Убедитесь, что используется Ubuntu Noble"