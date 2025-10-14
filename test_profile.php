<?php
// Простая тестовая страница для проверки profile.php
echo "<h1>Тест profile.php</h1>";

// Проверяем подключение к БД
try {
    require_once 'config/database.php';
    echo "✅ Подключение к БД: OK<br>";
    echo "✅ Переменная pdo создана<br>";
    
    // Проверяем существование полей
    echo "🔍 Проверяем поле user_status...<br>";
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM users");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('user_status', $columns)) {
            echo "✅ Поле user_status: существует<br>";
        } else {
            echo "❌ Поле user_status: НЕ существует<br>";
        }
    } catch (Exception $e) {
        echo "❌ Ошибка проверки user_status: " . $e->getMessage() . "<br>";
    }
    
    echo "🔍 Проверяем поле avatar_path...<br>";
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM users");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('avatar_path', $columns)) {
            echo "✅ Поле avatar_path: существует<br>";
        } else {
            echo "❌ Поле avatar_path: НЕ существует<br>";
        }
    } catch (Exception $e) {
        echo "❌ Ошибка проверки avatar_path: " . $e->getMessage() . "<br>";
    }
    
    // Проверяем пользователей
    echo "🔍 Загружаем пользователей...<br>";
    $stmt = $pdo->query("SELECT id, username, user_status, avatar_path FROM users LIMIT 3");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✅ Пользователи в БД:<br>";
    foreach ($users as $user) {
        echo "- ID: {$user['id']}, Username: {$user['username']}, Status: {$user['user_status']}, Avatar: {$user['avatar_path']}<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Ошибка: " . $e->getMessage();
}

echo "<br><a href='profile.php?user_id=28'>Тест profile.php с user_id=28</a>";
?>
