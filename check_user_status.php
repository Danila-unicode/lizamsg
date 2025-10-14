<?php
// Скрипт для проверки статуса пользователя в базе данных

// Подключение к базе данных
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Получаем номер телефона из параметра
    $phone = $_GET['phone'] ?? '';
    
    if (empty($phone)) {
        echo "Укажите номер телефона: ?phone=+79991234567";
        exit;
    }
    
    // Нормализуем номер - добавляем + если его нет
    if (!str_starts_with($phone, '+')) {
        $phone = '+' . $phone;
    }
    
    echo "<h3>Поиск пользователя с номером: $phone</h3>";
    
    // Ищем пользователя
    $stmt = $pdo->prepare("SELECT id, username, phone_verified FROM users WHERE username = ?");
    $stmt->execute([$phone]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "Пользователь с номером $phone не найден<br><br>";
        
        // Показываем всех пользователей для отладки
        echo "<h4>Все пользователи в базе данных:</h4>";
        $stmt = $pdo->prepare("SELECT id, username, phone_verified FROM users ORDER BY id DESC LIMIT 10");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($users) {
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>ID</th><th>Username</th><th>Phone Verified</th></tr>";
            foreach ($users as $u) {
                echo "<tr>";
                echo "<td>" . $u['id'] . "</td>";
                echo "<td>" . $u['username'] . "</td>";
                echo "<td>" . $u['phone_verified'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "В базе данных нет пользователей";
        }
    } else {
        echo "<h3>Информация о пользователе:</h3>";
        echo "<p><strong>ID:</strong> " . $user['id'] . "</p>";
        echo "<p><strong>Username:</strong> " . $user['username'] . "</p>";
        echo "<p><strong>Phone Verified:</strong> " . $user['phone_verified'] . " (тип: " . gettype($user['phone_verified']) . ")</p>";
        echo "<p><strong>Phone Verified (int):</strong> " . (int)$user['phone_verified'] . "</p>";
        
        if ($user['phone_verified'] == 1) {
            echo "<p style='color: green;'><strong>✅ Номер подтвержден - вход разрешен</strong></p>";
        } else {
            echo "<p style='color: red;'><strong>❌ Номер не подтвержден - требуется подтверждение</strong></p>";
        }
    }
    
} catch(PDOException $e) {
    echo "Ошибка подключения к базе данных: " . $e->getMessage();
}
?>
