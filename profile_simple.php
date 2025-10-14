<?php
session_start();
require_once 'config/database.php';

// Получаем ID пользователя из URL
$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo "Ошибка: ID пользователя не указан";
    exit;
}

// Получаем данные пользователя
try {
    $stmt = $pdo->prepare("SELECT username, user_status FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "Пользователь не найден";
        exit;
    }
} catch (PDOException $e) {
    echo "Ошибка: " . $e->getMessage();
    exit;
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профиль - LizaApp</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .profile { max-width: 600px; margin: 0 auto; }
        .info { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .status { font-size: 18px; color: #333; }
        .username { font-size: 16px; color: #666; }
    </style>
</head>
<body>
    <div class="profile">
        <h1>👤 Профиль пользователя</h1>
        
        <div class="info">
            <div class="username"><strong>Номер телефона:</strong> <?php echo htmlspecialchars($user['username']); ?></div>
        </div>
        
        <div class="info">
            <div class="status"><strong>Статус:</strong> <?php echo htmlspecialchars($user['user_status'] ?? 'Не установлен'); ?></div>
        </div>
        
        <div style="margin-top: 20px;">
            <a href="simple-signal-test-websocket-external-js.html" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Вернуться в приложение</a>
        </div>
    </div>
</body>
</html>
