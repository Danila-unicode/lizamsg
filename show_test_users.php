<?php
require_once 'config/database.php';

echo "🔍 Поиск тестовых пользователей...\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Не удалось подключиться к базе данных");
    }
    
    echo "✅ Подключение к базе данных успешно\n";
    
    // Ищем пользователей с нужными номерами
    $testPhones = ['+79182725362', '+79182725363'];
    
    echo "\n📋 Тестовые пользователи:\n";
    foreach ($testPhones as $phone) {
        $stmt = $conn->prepare("SELECT id, phone, created_at FROM users WHERE phone = :phone");
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "✅ ID: {$user['id']}, Телефон: {$user['phone']}, Создан: {$user['created_at']}\n";
        } else {
            echo "❌ Пользователь с номером $phone не найден\n";
        }
    }
    
    // Показываем всех пользователей для справки
    echo "\n📋 Все пользователи в базе:\n";
    $stmt = $conn->query("SELECT id, phone, created_at FROM users ORDER BY id");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']}, Телефон: {$row['phone']}, Создан: {$row['created_at']}\n";
    }
    
    echo "\n🎉 Готово!\n";
    echo "\n📝 Тестовые данные для WebRTC:\n";
    echo "Пользователь 1: +79182725362 (ID: 1)\n";
    echo "Пользователь 2: +79182725363 (ID: 12)\n";
    echo "\n🔑 Пароли: password123 (для обоих пользователей)\n";
    
} catch (Exception $e) {
    echo "❌ Ошибка: " . $e->getMessage() . "\n";
}
?>
