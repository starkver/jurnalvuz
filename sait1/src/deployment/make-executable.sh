#!/bin/bash

# Скрипт для установки прав на исполнение всех скриптов развертывания

echo "🔧 Установка прав на исполнение для скриптов развертывания..."

# Делаем все .sh файлы исполняемыми
chmod +x deployment/*.sh

# Проверяем результат
echo "📋 Статус файлов в папке deployment:"
ls -la deployment/*.sh

echo "✅ Все скрипты готовы к использованию!"
echo ""
echo "📝 Доступные команды:"
echo "   bash deployment/diagnose-system.sh    - диагностика системы"
echo "   sudo bash deployment/fix-repositories.sh - исправление репозиториев"  
echo "   sudo bash deployment/deploy.sh        - развертывание портала"
echo "   bash deployment/backup.sh             - создание резервной копии"
echo "   bash deployment/update.sh             - обновление портала"