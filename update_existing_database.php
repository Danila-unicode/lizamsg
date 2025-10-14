<?php
require_once 'config/database.php';

echo "🔧 Обновление существующей базы данных...\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Не удалось подключиться к базе данных");
    }
    
    echo "✅ Подключение к базе данных успешно\n";
    
    // Проверяем существующих пользователей
    echo "\n📋 Текущие пользователи в базе:\n";
    $stmt = $conn->query("SELECT id, phone, created_at FROM users ORDER BY id");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']}, Телефон: {$row['phone']}, Создан: {$row['created_at']}\n";
    }
    
    // Обновляем пользователя с ID 2 на правильный номер
    echo "\n🔄 Обновление пользователя с ID 2...\n";
    $newPhone = '+79182725363';
    $password = 'password123';
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    $updateStmt = $conn->prepare("UPDATE users SET phone = :phone, password_hash = :password_hash WHERE id = 2");
    $updateStmt->bindParam(":phone", $newPhone);
    $updateStmt->bindParam(":password_hash", $password_hash);
    
    if ($updateStmt->execute()) {
        echo "✅ Пользователь с ID 2 обновлен на номер: $newPhone\n";
    } else {
        echo "❌ Ошибка обновления пользователя с ID 2\n";
    }
    
    // Проверяем, есть ли пользователь с ID 1
    echo "\n🔍 Проверка пользователя с ID 1...\n";
    $checkStmt = $conn->prepare("SELECT phone FROM users WHERE id = 1");
    $checkStmt->execute();
    $user1 = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user1 && $user1['phone'] === '+79182725362') {
        echo "✅ Пользователь с ID 1 уже имеет правильный номер: {$user1['phone']}\n";
    } else {
        echo "🔄 Обновление пользователя с ID 1...\n";
        $updateStmt1 = $conn->prepare("UPDATE users SET phone = :phone, password_hash = :password_hash WHERE id = 1");
        $updateStmt1->bindParam(":phone", '+79182725362');
        $updateStmt1->bindParam(":password_hash", $password_hash);
        
        if ($updateStmt1->execute()) {
            echo "✅ Пользователь с ID 1 обновлен\n";
        } else {
            echo "❌ Ошибка обновления пользователя с ID 1\n";
        }
    }
    
    // Показываем обновленных пользователей
    echo "\n📋 Обновленные тестовые пользователи:\n";
    $stmt = $conn->query("SELECT id, phone, created_at FROM users WHERE id IN (1, 2) ORDER BY id");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']}, Телефон: {$row['phone']}, Создан: {$row['created_at']}\n";
    }
    
    echo "\n🎉 Обновление базы данных завершено!\n";
    echo "\n📝 Тестовые данные для входа:\n";
    echo "Пользователь 1: +79182725362 / password123 (ID: 1)\n";
    echo "Пользователь 2: +79182725363 / password123 (ID: 2)\n";
    
} catch (Exception $e) {
    echo "❌ Ошибка: " . $e->getMessage() . "\n";
}
?>
