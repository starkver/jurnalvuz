#!/bin/bash

# Скрипт диагностики системы для образовательного портала
# Запуск: bash diagnose-system.sh

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[DEBUG] $1${NC}"
}

echo "🔍 Диагностика системы для образовательного портала"
echo "=================================================="

# Системная информация
echo ""
echo "📊 СИСТЕМНАЯ ИНФОРМАЦИЯ"
echo "----------------------"
echo "Дата: $(date)"
echo "Система: $(uname -a)"
echo "Версия Ubuntu: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Не определена')"
echo "Кодовое имя: $(lsb_release -cs 2>/dev/null || echo 'Не определено')"
echo "Архитектура: $(dpkg --print-architecture 2>/dev/null || echo 'Не определена')"
echo "Время работы: $(uptime -p 2>/dev/null || uptime)"

# Использование ресурсов
echo ""
echo "💾 ИСПОЛЬЗОВАНИЕ РЕСУРСОВ"
echo "------------------------"
echo "Память:"
free -h
echo ""
echo "Диск:"
df -h / 2>/dev/null || df -h
echo ""
echo "CPU:"
nproc --all 2>/dev/null && echo "ядер" || echo "Не определено"

# Сеть
echo ""
echo "🌐 СЕТЕВЫЕ НАСТРОЙКИ"
echo "-------------------"
echo "IP адреса:"
ip addr show 2>/dev/null | grep -E 'inet [0-9]' | awk '{print $2}' || ifconfig 2>/dev/null | grep -E 'inet [0-9]'

echo ""
echo "DNS серверы:"
cat /etc/resolv.conf 2>/dev/null | grep nameserver || echo "Не найдены"

echo ""
echo "Тест подключения:"
for host in google.com archive.ubuntu.com security.ubuntu.com; do
    if ping -c 1 -W 3 $host &>/dev/null; then
        log "✅ $host - доступен"
    else
        error "❌ $host - недоступен"
    fi
done

# Проверка apt
echo ""
echo "📦 НАСТРОЙКИ APT"
echo "---------------"
echo "Основные репозитории:"
if [ -f /etc/apt/sources.list ]; then
    grep -v '^#' /etc/apt/sources.list | grep -v '^$' || echo "Пустой или только комментарии"
else
    error "Файл /etc/apt/sources.list не найден"
fi

echo ""
echo "Дополнительные репозитории:"
if [ -d /etc/apt/sources.list.d ]; then
    find /etc/apt/sources.list.d -name "*.list" -exec echo "--- {} ---" \; -exec grep -v '^#' {} \; 2>/dev/null || echo "Нет дополнительных репозиториев"
else
    echo "Папка /etc/apt/sources.list.d не найдена"
fi

echo ""
echo "Тест обновления пакетов:"
if timeout 30 apt update -qq 2>/dev/null; then
    log "✅ apt update - успешно"
else
    error "❌ apt update - ошибка"
fi

# Проверка доступности пакетов
echo ""
echo "🔍 ДОСТУПНОСТЬ ПАКЕТОВ"
echo "---------------------"
REQUIRED_PACKAGES=(nginx nodejs npm curl wget software-properties-common certbot python3-certbot-nginx)

for package in "${REQUIRED_PACKAGES[@]}"; do
    if apt-cache show $package &>/dev/null; then
        VERSION=$(apt-cache policy $package | grep Candidate | cut -d: -f2 | tr -d ' ')
        log "✅ $package - доступен ($VERSION)"
    else
        error "❌ $package - не найден"
    fi
done

# Проверка установленных пакетов
echo ""
echo "📋 УСТАНОВЛЕННЫЕ ПАКЕТЫ"
echo "----------------------"
INSTALLED_PACKAGES=()
NOT_INSTALLED_PACKAGES=()

for package in nginx nodejs npm curl wget; do
    if command -v $package &>/dev/null || dpkg -l | grep -q "^ii.*$package"; then
        VERSION=$(command -v $package &>/dev/null && $package --version 2>/dev/null | head -1 || dpkg -l | grep "^ii.*$package" | awk '{print $3}')
        log "✅ $package установлен: $VERSION"
        INSTALLED_PACKAGES+=($package)
    else
        warning "❌ $package не установлен"
        NOT_INSTALLED_PACKAGES+=($package)
    fi
done

# Проверка snap
echo ""
echo "📦 SNAP ПАКЕТЫ"
echo "-------------"
if command -v snap &>/dev/null; then
    log "✅ snapd установлен"
    echo "Установленные snap пакеты:"
    snap list 2>/dev/null || echo "Нет установленных snap пакетов"
else
    warning "❌ snapd не установлен"
fi

# Проверка веб-сервера
echo ""
echo "🌐 ВЕБ-СЕРВЕР"
echo "------------"
if systemctl is-active --quiet nginx 2>/dev/null; then
    log "✅ nginx запущен"
    echo "Статус: $(systemctl is-active nginx)"
    echo "Порты:"
    netstat -tlnp 2>/dev/null | grep nginx || ss -tlnp | grep nginx
elif command -v nginx &>/dev/null; then
    warning "⚠️ nginx установлен, но не запущен"
else
    error "❌ nginx не установлен"
fi

# Проверка Node.js
echo ""
echo "⚙️ NODE.JS"
echo "---------"
if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version 2>/dev/null || echo "npm не найден")
    log "✅ Node.js: $NODE_VERSION"
    log "✅ npm: $NPM_VERSION"
    
    # Проверяем версию Node.js
    NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        log "✅ Версия Node.js подходящая (>= 18)"
    else
        warning "⚠️ Версия Node.js устарела (нужна >= 18), текущая: $NODE_VERSION"
    fi
else
    error "❌ Node.js не установлен"
fi

# Проверка SSL
echo ""
echo "🔒 SSL/TLS"
echo "---------"
if command -v certbot &>/dev/null; then
    log "✅ certbot установлен"
    echo "Версия: $(certbot --version 2>/dev/null || echo 'Не определена')"
    echo "Сертификаты:"
    certbot certificates 2>/dev/null || echo "Нет сертификатов или ошибка доступа"
else
    warning "❌ certbot не установлен"
fi

# Проверка firewall
echo ""
echo "🛡️ FIREWALL"
echo "----------"
if command -v ufw &>/dev/null; then
    echo "UFW статус:"
    ufw status 2>/dev/null || echo "Не удалось получить статус UFW"
else
    echo "UFW не установлен"
fi

if command -v iptables &>/dev/null; then
    echo "Активные правила iptables:"
    iptables -L INPUT -n 2>/dev/null | head -10 || echo "Не удалось получить правила iptables"
fi

# Проверка логов
echo ""
echo "📝 ЛОГИ"
echo "------"
echo "Последние ошибки системы:"
journalctl --no-pager -p err -n 5 2>/dev/null || echo "Не удалось получить системные логи"

if [ -f /var/log/nginx/error.log ]; then
    echo ""
    echo "Последние ошибки nginx:"
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Нет ошибок nginx"
fi

# Рекомендации
echo ""
echo "💡 РЕКОМЕНДАЦИИ"
echo "================"

if [ ${#NOT_INSTALLED_PACKAGES[@]} -gt 0 ]; then
    echo "❗ Отсутствующие пакеты: ${NOT_INSTALLED_PACKAGES[*]}"
    echo "   Запустите: sudo bash fix-repositories.sh"
    echo "   Затем: sudo bash deploy.sh"
fi

if ! command -v node &>/dev/null || [ "$NODE_MAJOR" -lt 18 ]; then
    echo "❗ Обновите Node.js:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -"
    echo "   sudo apt install -y nodejs"
fi

if ! command -v certbot &>/dev/null; then
    echo "❗ Установите certbot для SSL:"
    echo "   sudo snap install --classic certbot"
fi

if ! systemctl is-active --quiet nginx 2>/dev/null && command -v nginx &>/dev/null; then
    echo "❗ Запустите nginx:"
    echo "   sudo systemctl start nginx"
    echo "   sudo systemctl enable nginx"
fi

echo ""
echo "🎯 ЗАКЛЮЧЕНИЕ"
echo "============"
if [ ${#NOT_INSTALLED_PACKAGES[@]} -eq 0 ] && command -v node &>/dev/null && [ "$NODE_MAJOR" -ge 18 ]; then
    log "✅ Система готова для развертывания образовательного портала!"
    echo "🚀 Запустите: sudo bash deploy.sh"
else
    warning "⚠️ Требуется дополнительная настройка системы"
    echo "🔧 Запустите: sudo bash fix-repositories.sh"
fi

echo ""
echo "📋 Для подробной диагностики сохраните этот вывод в файл:"
echo "   bash diagnose-system.sh > system-diagnosis.txt 2>&1"