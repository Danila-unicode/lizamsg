<?php
// Скрипт для сброса пароля пользователя
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Подключение к базе данных установлено\n";
} catch(PDOException $e) {
    die("❌ Ошибка подключения: " . $e->getMessage() . "\n");
}

// Новый пароль для всех пользователей
$newPassword = '12345';
$passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

try {
    // Обновляем пароли всех пользователей
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?");
    $stmt->execute([$passwordHash]);
    
    $affectedRows = $stmt->rowCount();
    echo "✅ Пароли сброшены для $affectedRows пользователей\n";
    echo "🔑 Новый пароль для всех пользователей: $newPassword\n";
    
    // Показываем всех пользователей
    $stmt = $pdo->prepare("SELECT id, username, created_at FROM users ORDER BY id");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\n📋 Список пользователей:\n";
    foreach ($users as $user) {
        echo "  - ID: {$user['id']}, Логин: {$user['username']}, Создан: {$user['created_at']}\n";
    }
    
} catch(PDOException $e) {
    echo "❌ Ошибка обновления паролей: " . $e->getMessage() . "\n";
}
?>