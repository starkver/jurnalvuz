# 🚀 Развертывание образовательного портала

Инструкция по развертыванию образовательного портала на собственном сервере.

## 📋 Требования

- **Сервер**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: минимум 1GB, рекомендуется 2GB+
- **Диск**: минимум 5GB свободного места
- **Доступ**: root или sudo
- **Домен**: зарегистрированный домен, указывающий на ваш сервер

## 🛠 Быстрое развертывание

### 1. Подготовка сервера

```bash
# Подключение к серверу
ssh root@your-server-ip

# Или с ключом
ssh -i /path/to/key.pem root@your-server-ip
```

### 2. Загрузка проекта

```bash
# Скачивание архива проекта
wget https://github.com/your-repo/educational-portal/archive/main.zip
unzip main.zip
cd educational-portal-main

# Или клонирование из git
git clone https://github.com/your-repo/educational-portal.git
cd educational-portal
```

### 3. Настройка домена

Отредактируйте файл `deployment/deploy.sh`:

```bash
nano deployment/deploy.sh
```

Измените строку:
```bash
DOMAIN="your-domain.com"  # Замените на ваш домен
```

### 4. Запуск автоматического развертывания

```bash
chmod +x deployment/deploy.sh
sudo bash deployment/deploy.sh
```

Скрипт автоматически:
- ✅ Установит nginx, Node.js, npm
- ✅ Соберет проект
- ✅ Настроит nginx
- ✅ Установит SSL сертификат
- ✅ Настроит firewall
- ✅ Запустит сайт

## 🔧 Ручная настройка

### 1. Установка зависимостей

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nginx nodejs npm certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y nginx nodejs npm certbot python3-certbot-nginx
```

### 2. Сборка проекта

```bash
cd /path/to/project
npm install
npm run build
```

### 3. Настройка nginx

```bash
# Копирование конфигурации
sudo cp deployment/nginx.conf /etc/nginx/sites-available/educational-portal

# Замена домена
sudo sed -i 's/your-domain.com/example.com/g' /etc/nginx/sites-available/educational-portal

# Активация сайта
sudo ln -s /etc/nginx/sites-available/educational-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Настройка SSL

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

## 🔄 Обновление сайта

### Автоматическое обновление

```bash
sudo bash deployment/update.sh
```

### Ручное обновление

```bash
cd /var/www/educational-portal
sudo npm run build
sudo chown -R www-data:www-data dist/
sudo systemctl reload nginx
```

## 📁 Структура файлов на сервере

```
/var/www/educational-portal/
├── dist/                 # Собранный проект (nginx сервит отсюда)
├── src/                  # Исходный код
├── components/           # React компоненты
├── styles/              # CSS файлы
├── deployment/          # Файлы развертывания
└── package.json         # Зависимости
```

## 🛡 Безопасность

### Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### SSL Auto-renewal

```bash
# Проверка автообновления
sudo certbot renew --dry-run

# Добавление в cron (если не добавлено автоматически)
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Обновления системы

```bash
# Регулярные обновления
sudo apt update && sudo apt upgrade -y

# Настройка автоматических обновлений безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 📊 Мониторинг

### Логи nginx

```bash
# Логи доступа
sudo tail -f /var/log/nginx/access.log

# Логи ошибок
sudo tail -f /var/log/nginx/error.log
```

### Статус сервисов

```bash
sudo systemctl status nginx
sudo systemctl status certbot.timer
```

### Проверка SSL

```bash
# Проверка сертификата
sudo certbot certificates

# Тест SSL рейтинга
curl -I https://your-domain.com
```

## 🚨 Устранение проблем

### Проблемы с репозиториями Ubuntu

Если при выполнении `deploy.sh` возникает ошибка вроде:
```
E: Type 'Types:' is not known on line 1 in source list /etc/apt/sources.list
```

Это означает, что файл `/etc/apt/sources.list` использует неправильный формат. Исправьте это:

```bash
# Автоматическое исправление формата
sudo bash deployment/fix-sources-format.sh
```

Или исправьте вручную:
```bash
# Создайте резервную копию
sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup

# Определите версию Ubuntu
lsb_release -cs

# Отредактируйте файл (замените 'noble' на вашу версию)
sudo nano /etc/apt/sources.list
```

Правильный формат для `/etc/apt/sources.list`:
```
deb http://archive.ubuntu.com/ubuntu/ noble main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu/ noble-updates main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ noble-security main restricted universe multiverse
```

**Неправильный формат** (работает только в `.sources` файлах):
```
Types: deb
URIs: http://archive.ubuntu.com/ubuntu/
Suites: noble
Components: main restricted universe multiverse
```

После исправления:
```bash
sudo apt clean
sudo apt update
sudo bash deployment/deploy.sh
```

### Nginx не запускается

```bash
# Проверка конфигурации
sudo nginx -t

# Проверка логов
sudo journalctl -u nginx -f
```

### SSL проблемы

```bash
# Принудительное обновление
sudo certbot renew --force-renewal

# Проверка статуса
sudo systemctl status certbot.timer
```

### Проблемы с правами доступа

```bash
# Восстановление прав
sudo chown -R www-data:www-data /var/www/educational-portal/dist/
sudo chmod -R 755 /var/www/educational-portal/dist/
```

## 🔧 Настройка производительности

### Nginx оптимизация

Добавьте в `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;

http {
    # Включение кэширования
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Размеры буферов
    client_body_buffer_size 128k;
    client_max_body_size 1m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
}
```

### Оптимизация сборки

В `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['./components/ui/*']
        }
      }
    }
  }
})
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `sudo tail -f /var/log/nginx/error.log`
2. Убедитесь, что домен указывает на ваш сервер
3. Проверьте статус сервисов: `sudo systemctl status nginx`
4. Убедитесь, что порты 80 и 443 открыты

## 📈 Дополнительные возможности

### Настройка мониторинга

```bash
# Установка htop для мониторинга
sudo apt install htop

# Мониторинг дискового пространства
df -h

# Мониторинг использования памяти
free -h
```

### Backup автоматизация

Добавьте в cron ежедневный backup:

```bash
sudo crontab -e
# Добавить: 0 2 * * * /usr/local/bin/backup-educational-portal.sh
```

Создайте скрипт backup:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
tar -czf "/var/backups/educational-portal/backup-$DATE.tar.gz" -C /var/www/educational-portal dist/
find /var/backups/educational-portal/ -name "backup-*.tar.gz" -mtime +7 -delete
```