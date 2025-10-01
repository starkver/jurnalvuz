#!/bin/bash

# Скрипт резервного копирования образовательного портала
# Запуск: bash backup.sh

PROJECT_PATH="/var/www/educational-portal"
BACKUP_PATH="/var/backups/educational-portal"
RETENTION_DAYS=7

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Создание директории для бэкапов
mkdir -p $BACKUP_PATH

# Создание архива
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_PATH/backup-$DATE.tar.gz"

log "🗂️  Создание резервной копии..."
log "📁 Архивируем: $PROJECT_PATH"
log "💾 Сохраняем в: $BACKUP_FILE"

# Создание архива с исключениями
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    -czf "$BACKUP_FILE" \
    -C "$(dirname $PROJECT_PATH)" \
    "$(basename $PROJECT_PATH)"

# Проверка успешности создания архива
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Резервная копия создана успешно (размер: $SIZE)"
else
    log "❌ Ошибка создания резервной копии"
    exit 1
fi

# Удаление старых бэкапов
log "🧹 Удаление резервных копий старше $RETENTION_DAYS дней..."
DELETED=$(find $BACKUP_PATH -name "backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ $DELETED -gt 0 ]; then
    log "🗑️  Удалено старых резервных копий: $DELETED"
else
    log "📦 Старых резервных копий для удаления не найдено"
fi

# Показать список всех бэкапов
log "📋 Список всех резервных копий:"
ls -lah $BACKUP_PATH/backup-*.tar.gz 2>/dev/null | while read line; do
    echo "   $line"
done

log "🎉 Резервное копирование завершено!"