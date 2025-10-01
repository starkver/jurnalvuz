#!/bin/bash

# Скрипт для очистки и переустановки зависимостей
# Решает проблемы с модулями и кешем

set -e

echo "🧹 Очистка кеша и переустановка зависимостей..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Проверяем, что мы в корневой директории проекта
if [ ! -f "package.json" ]; then
    error "Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Удаляем node_modules и lock-файлы
log "Удаление node_modules и lock-файлов..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Очищаем кеш npm
log "Очистка кеша npm..."
npm cache clean --force

# Очищаем кеш Vite (если существует)
if [ -d "node_modules/.vite" ]; then
    log "Очистка кеша Vite..."
    rm -rf node_modules/.vite
fi

# Очищаем dist папку
if [ -d "dist" ]; then
    log "Очистка папки dist..."
    rm -rf dist
fi

# Переустанавливаем зависимости
log "Переустановка зависимостей..."
npm install

# Проверяем на уязвимости
log "Проверка на уязвимости..."
npm audit

# Автоматически исправляем уязвимости
if npm audit | grep -q "vulnerabilities"; then
    warning "Найдены уязвимости, попытка автоматического исправления..."
    npm audit fix
fi

# Проверяем версии
log "Проверка версий основных пакетов:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  React: $(npm list react --depth=0 2>/dev/null | grep react || echo 'не установлен')"
echo "  Vite: $(npm list vite --depth=0 2>/dev/null | grep vite || echo 'не установлен')"
echo "  TypeScript: $(npm list typescript --depth=0 2>/dev/null | grep typescript || echo 'не установлен')"

log "✅ Очистка и переустановка завершена!"
log "🚀 Теперь можно запустить: npm run dev"

echo ""
echo "📝 Если проблемы остались, попробуйте:"
echo "   1. Перезапустить терминал"
echo "   2. Убедиться в версии Node.js >= 18"
echo "   3. Запустить: npm run dev"