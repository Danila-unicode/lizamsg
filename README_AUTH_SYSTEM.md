# 🔐 Система авторизации WebRTC Контакты

## 📋 Обзор

Полная система авторизации и регистрации пользователей для WebRTC приложения видеозвонков.

## 🗂️ Структура файлов

### Основные страницы
- `main.html` - Главная страница с проверкой авторизации
- `auth.html` - Страница входа в систему
- `register.html` - Страница регистрации
- `index.php` - Основное приложение (требует авторизации)

### API файлы
- `api/login.php` - API для входа в систему
- `api/register.php` - API для регистрации
- `api/check_auth.php` - API для проверки авторизации
- `api/logout.php` - API для выхода из системы
- `api/create_test_users.php` - Создание тестовых пользователей

### База данных
- `database_structure.sql` - Структура базы данных для импорта
- `update_database.php` - Скрипт обновления существующей БД
- `config/database.php` - Конфигурация подключения к БД

## 🚀 Установка и настройка

### 1. Импорт базы данных

```bash
# Импортируйте структуру базы данных
mysql -u lizaapp_q2f112f1c -p lizaapp_fgdg1c1d551v1d < database_structure.sql
```

### 2. Обновление существующей БД

Если у вас уже есть база данных, используйте скрипт обновления:

```bash
# Откройте в браузере
https://your-domain.com/update_database.php
```

### 3. Проверка конфигурации

Убедитесь, что в `config/database.php` указаны правильные данные подключения:

```php
private $host = 'localhost';
private $db_name = 'lizaapp_bd';
private $username = 'lizaapp_user';
private $password = 'aG6lJ9uR5g';
```

## 🧪 Тестирование

### 1. Создание тестовых пользователей

Откройте `auth.html` - тестовые пользователи создаются автоматически:
- **User 1:** +79182725362 / 12345
- **User 2:** +79182725363 / 12345

### 2. Проверка системы

1. Откройте `main.html` - главная страница
2. Нажмите "Войти в систему"
3. Используйте тестовые данные или зарегистрируйтесь
4. После входа вы увидите кнопку "Открыть приложение"

## 📊 Структура базы данных

### Таблица `users`
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Таблица `active_sessions`
```sql
CREATE TABLE active_sessions (
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 API Endpoints

### POST /api/login.php
Вход в систему
```json
{
    "phone": "+79182725362",
    "password": "12345"
}
```

### POST /api/register.php
Регистрация пользователя
```json
{
    "phone": "+79182725364",
    "password": "123456"
}
```

### GET /api/check_auth.php
Проверка авторизации

### POST /api/logout.php
Выход из системы

## 🎯 Использование

### 1. Регистрация нового пользователя
1. Откройте `register.html`
2. Заполните номер телефона и пароль
3. Нажмите "Зарегистрироваться"
4. После успешной регистрации перенаправит на страницу входа

### 2. Вход в систему
1. Откройте `auth.html`
2. Введите номер телефона и пароль
3. Нажмите "Войти"
4. После успешного входа перенаправит в приложение

### 3. Основное приложение
1. После входа откройте `index.php`
2. Используйте функции поиска пользователей
3. Добавляйте контакты и совершайте видеозвонки

## 🔒 Безопасность

- Пароли хешируются с помощью `password_hash()`
- Используются подготовленные запросы (PDO)
- Сессии защищены от CSRF атак
- Валидация входных данных

## 🐛 Отладка

### Проверка подключения к БД
```bash
# Откройте в браузере
https://your-domain.com/update_database.php
```

### Проверка API
```bash
# Тест входа
curl -X POST https://your-domain.com/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"phone":"+79182725362","password":"12345"}'
```

## 📝 Логи

Все действия логируются в консоль браузера и на страницах приложения.

## ✅ Готово!

Система авторизации полностью интегрирована с WebRTC приложением. Пользователи могут регистрироваться, входить в систему и использовать все функции видеозвонков.
