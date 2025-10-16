# Правила базы данных проекта LizaApp

## 🔧 Настройки подключения к БД

### Основная база данных:
- **Хост**: localhost
- **База**: `lizaapp_dsfg12df1121q5sd2694`
- **Пользователь**: lizaapp_1w1d2sd3268
- **Пароль**: aM1oX3yE0j

### Важные правила:
1. **ВСЕГДА используй эти настройки** для подключения к БД в любых API файлах
2. **НЕ используй** настройки из config/database.php (они устарели)
3. **Проверяй подключение** перед созданием новых API
4. **Используй PDO** с правильными настройками charset=utf8mb4

### Пример подключения:
```php
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

### Обновлено: 02.10.2025
