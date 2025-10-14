<?php
require_once 'config/database.php';

echo "🔍 Проверка пользователей в базе данных...\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Не удалось подключиться к базе данных");
    }
    
    echo "✅ Подключение к базе данных успешно\n\n";
    
    // Показываем всех пользователей
    echo "📋 Все пользователи в базе данных:\n";
    $stmt = $conn->query("SELECT id, phone, password_hash, created_at FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "❌ Пользователи не найдены\n";
    } else {
        foreach ($users as $user) {
            echo "ID: {$user['id']}, Телефон: {$user['phone']}, Создан: {$user['created_at']}\n";
            
            // Проверяем пароль
            $testPassword = 'password123';
            if (password_verify($testPassword, $user['password_hash'])) {
                echo "  ✅ Пароль 'password123' правильный\n";
            } else {
                echo "  ❌ Пароль 'password123' неверный\n";
                
                // Пробуем другие пароли
                $commonPasswords = ['123456', 'password', 'admin', 'test', 'qwerty'];
                foreach ($commonPasswords as $pwd) {
                    if (password_verify($pwd, $user['password_hash'])) {
                        echo "  ✅ Пароль '$pwd' правильный\n";
                        break;
                    }
                }
            }
            echo "\n";
        }
    }
    
    // Тестируем вход
    echo "🧪 Тестирование входа...\n";
    $testPhone = '+79182725362';
    $testPassword = 'password123';
    
    $query = "SELECT id, phone, password_hash FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':phone', $testPhone);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        echo "❌ Пользователь $testPhone не найден\n";
    } else {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Пользователь $testPhone найден (ID: {$user['id']})\n";
        
        if (password_verify($testPassword, $user['password_hash'])) {
            echo "✅ Пароль '$testPassword' правильный\n";
        } else {
            echo "❌ Пароль '$testPassword' неверный\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Ошибка: " . $e->getMessage() . "\n";
}
?>
