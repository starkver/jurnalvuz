#!/bin/bash

echo "🚀 Быстрое исправление проблем с модулями..."

# Удаляем все кеши и модули
echo "Очистка node_modules и кешей..."
rm -rf node_modules
rm -rf deployment/node_modules
rm -f package-lock.json
rm -f deployment/package-lock.json

# Очищаем npm кеш
echo "Очистка npm кеша..."
npm cache clean --force

# Устанавливаем зависимости
echo "Установка зависимостей..."
npm install

# Проверяем установку
echo "Проверка установки..."
if command -v npm run dev &> /dev/null; then
    echo "✅ Зависимости установлены успешно!"
    echo "🚀 Запускаем проект..."
    npm run dev
else
    echo "❌ Проблема с установкой. Попробуйте команды вручную:"
    echo "1. rm -rf node_modules"
    echo "2. rm -f package-lock.json"  
    echo "3. npm cache clean --force"
    echo "4. npm install"
    echo "5. npm run dev"
fi