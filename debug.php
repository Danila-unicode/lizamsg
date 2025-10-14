<?php
echo "<h1>🔧 Диагностика системы</h1>";

// Проверка PHP
echo "<h2>1. PHP информация</h2>";
echo "Версия PHP: " . phpversion() . "<br>";
echo "PDO доступен: " . (extension_loaded('pdo') ? 'Да' : 'Нет') . "<br>";
echo "PDO MySQL доступен: " . (extension_loaded('pdo_mysql') ? 'Да' : 'Нет') . "<br>";

// Проверка подключения к базе данных
echo "<h2>2. Подключение к базе данных</h2>";
try {
    require_once 'config/database.php';
    $db = new Database();
    $conn = $db->getConnection();
    
    if ($conn) {
        echo "✅ Подключение к базе данных успешно!<br>";
        
        // Проверка таблиц
        $tables = ['users', 'contacts', 'calls'];
        foreach ($tables as $table) {
            $stmt = $conn->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table]);
            if ($stmt->rowCount() > 0) {
                echo "✅ Таблица '$table' существует<br>";
            } else {
                echo "❌ Таблица '$table' не найдена<br>";
            }
        }
        
        // Проверка пользователей
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "👥 Количество пользователей: " . $result['count'] . "<br>";
        
    } else {
        echo "❌ Ошибка подключения к базе данных<br>";
    }
} catch (Exception $e) {
    echo "❌ Ошибка: " . $e->getMessage() . "<br>";
}

// Проверка сессий
echo "<h2>3. Сессии</h2>";
session_start();
echo "Сессия активна: " . (session_status() === PHP_SESSION_ACTIVE ? 'Да' : 'Нет') . "<br>";
echo "ID сессии: " . session_id() . "<br>";

// Проверка файлов
echo "<h2>4. Файлы</h2>";
$files = [
    'auth.html',
    'contacts-app.html',
    'api/login.php',
    'api/check_auth.php',
    'api/logout.php'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "✅ $file существует<br>";
    } else {
        echo "❌ $file не найден<br>";
    }
}

echo "<h2>5. Тест API</h2>";
echo '<a href="api/check_auth.php" target="_blank">Проверить авторизацию</a><br>';
echo '<a href="auth.html" target="_blank">Страница входа</a><br>';
echo '<a href="contacts-app.html" target="_blank">Приложение контактов</a><br>';

echo "<h2>6. Создать тестовых пользователей</h2>";
echo '<form method="post">';
echo '<input type="submit" name="create_users" value="Создать user1 и user2 с паролем 12345">';
echo '</form>';

if (isset($_POST['create_users'])) {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        // Удаляем старых тестовых пользователей
        $conn->exec("DELETE FROM users WHERE phone IN ('+79182725362', '+79182725363')");
        
        // Создаем новых
        $users = [
            ['+79182725362', password_hash('12345', PASSWORD_DEFAULT)],
            ['+79182725363', password_hash('12345', PASSWORD_DEFAULT)]
        ];
        
        $stmt = $conn->prepare("INSERT INTO users (phone, password_hash) VALUES (?, ?)");
        foreach ($users as $user) {
            $stmt->execute($user);
        }
        
        echo "✅ Тестовые пользователи созданы:<br>";
        echo "- +79182725362 (пароль: 12345)<br>";
        echo "- +79182725363 (пароль: 12345)<br>";
        
    } catch (Exception $e) {
        echo "❌ Ошибка создания пользователей: " . $e->getMessage() . "<br>";
    }
}
?>
