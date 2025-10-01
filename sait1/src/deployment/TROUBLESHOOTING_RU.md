# 🔧 Устранение проблем с развертыванием

## Проблема: Type 'Types:' is not known in source list

### Описание проблемы

При запуске скрипта развертывания `deploy.sh` возникает ошибка:

```
E: Type 'Types:' is not known on line 1 in source list /etc/apt/sources.list
E: The list of sources could not be read.
```

### Причина

В Ubuntu существует два формата файлов источников пакетов:

1. **Традиционный формат** (однострочный) - используется в `/etc/apt/sources.list`
   ```
   deb http://archive.ubuntu.com/ubuntu/ noble main restricted universe multiverse
   ```

2. **Новый формат DEB822** - используется только в файлах `.sources` в директории `/etc/apt/sources.list.d/`
   ```
   Types: deb
   URIs: http://archive.ubuntu.com/ubuntu/
   Suites: noble
   Components: main restricted universe multiverse
   ```

**Проблема возникает**, когда формат DEB822 используется в файле `/etc/apt/sources.list`, где он не поддерживается.

### Решение 1: Автоматическое исправление (Рекомендуется)

```bash
# Перейдите в директорию с проектом
cd /path/to/educational-portal

# Запустите скрипт исправления
sudo bash deployment/fix-sources-format.sh
```

Скрипт автоматически:
- ✅ Определит версию Ubuntu
- ✅ Создаст резервную копию текущего файла
- ✅ Конвертирует файл в правильный формат
- ✅ Проверит работоспособность репозиториев

После успешного выполнения:
```bash
# Запустите развертывание
sudo bash deployment/deploy.sh
```

### Решение 2: Ручное исправление

#### Шаг 1: Создайте резервную копию

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup-$(date +%Y%m%d)
```

#### Шаг 2: Определите версию Ubuntu

```bash
lsb_release -cs
```

Результат будет, например: `noble`, `jammy`, `focal`

#### Шаг 3: Отредактируйте файл sources.list

```bash
sudo nano /etc/apt/sources.list
```

Замените всё содержимое на следующее (замените `noble` на вашу версию Ubuntu):

```bash
# Ubuntu Main Repositories
deb http://archive.ubuntu.com/ubuntu/ noble main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu/ noble main restricted universe multiverse

# Ubuntu Updates
deb http://archive.ubuntu.com/ubuntu/ noble-updates main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu/ noble-updates main restricted universe multiverse

# Ubuntu Backports
deb http://archive.ubuntu.com/ubuntu/ noble-backports main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu/ noble-backports main restricted universe multiverse

# Ubuntu Security Updates
deb http://security.ubuntu.com/ubuntu/ noble-security main restricted universe multiverse
deb-src http://security.ubuntu.com/ubuntu/ noble-security main restricted universe multiverse
```

#### Шаг 4: Проверьте исправление

```bash
# Очистите кэш
sudo apt clean

# Обновите список пакетов
sudo apt update
```

Если всё прошло успешно, вы увидите:
```
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease
...
Reading package lists... Done
```

#### Шаг 5: Запустите развертывание

```bash
sudo bash deployment/deploy.sh
```

## Дополнительные проблемы

### Проблема: Репозитории недоступны

Если репозитории не отвечают, попробуйте использовать зеркала:

```bash
# Для российских пользователей
sudo sed -i 's|http://archive.ubuntu.com|http://ru.archive.ubuntu.com|g' /etc/apt/sources.list
sudo sed -i 's|http://security.ubuntu.com|http://ru.archive.ubuntu.com|g' /etc/apt/sources.list

# Или используйте локальные зеркала
sudo sed -i 's|http://archive.ubuntu.com|http://mirror.yandex.ru|g' /etc/apt/sources.list
```

### Проблема: Не удается найти пакеты

```bash
# Добавьте компонент universe
sudo add-apt-repository universe
sudo apt update

# Проверьте доступные пакеты
apt-cache policy nginx nodejs
```

### Проблема: Конфликт версий Node.js

```bash
# Используйте NodeSource репозиторий
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Или используйте snap
sudo snap install node --classic
```

## Проверка системы

Для диагностики текущего состояния системы:

```bash
# Запустите диагностический скрипт
sudo bash deployment/diagnose-system.sh
```

Скрипт покажет:
- 🔍 Версию Ubuntu
- 📋 Формат sources.list
- 📦 Доступность необходимых пакетов
- 🌐 Состояние сети
- 💾 Свободное место на диске
- 🔧 Установленные зависимости

## Полезные команды

### Просмотр текущих репозиториев

```bash
# Основные репозитории
cat /etc/apt/sources.list | grep -v '^#' | grep -v '^$'

# Дополнительные репозитории
ls -la /etc/apt/sources.list.d/
```

### Очистка кэша apt

```bash
sudo apt clean
sudo apt autoclean
sudo apt autoremove
```

### Восстановление из резервной копии

```bash
# Найдите резервные копии
ls -la /etc/apt/sources.list.backup*

# Восстановите из резервной копии
sudo cp /etc/apt/sources.list.backup-YYYYMMDD /etc/apt/sources.list
sudo apt update
```

## Альтернативные методы установки

Если проблемы с apt не удается решить, используйте альтернативные методы:

### Использование snap

```bash
# Установка через snap (не требует apt)
sudo snap install nginx --classic
sudo snap install node --classic
```

### Минимальная установка

Если необходимо запустить только сборку:

```bash
# Соберите локально на другой машине
npm install
npm run build

# Скопируйте только папку dist на сервер
scp -r dist/ user@server:/var/www/educational-portal/

# На сервере настройте nginx вручную
```

## Контакты и поддержка

Если проблема не решена:

1. Проверьте логи: `sudo tail -f /var/log/apt/term.log`
2. Убедитесь в стабильности интернет-соединения: `ping archive.ubuntu.com`
3. Проверьте DNS: `nslookup archive.ubuntu.com`
4. Убедитесь в наличии свободного места: `df -h`

## FAQ

**В: Можно ли использовать старые версии Ubuntu?**

О: Да, скрипты поддерживают Ubuntu 20.04+. Для более старых версий может потребоваться ручная настройка.

**В: Безопасно ли заменять sources.list?**

О: Да, скрипт создает резервную копию перед любыми изменениями. Вы всегда можете восстановить оригинальный файл.

**В: Что делать, если проблема повторяется?**

О: Запустите `sudo bash deployment/diagnose-system.sh` для детальной диагностики и отправьте вывод разработчикам.

**В: Можно ли использовать другие дистрибутивы Linux?**

О: Скрипты оптимизированы для Ubuntu. Для Debian потребуются минимальные изменения. Для CentOS/RHEL нужны существенные модификации.