<?php
// Отладочный скрипт для проверки запросов

// Подключение к базе данных
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Отладка системы запросов</h2>";
    
    // 1. Показываем всех пользователей
    echo "<h3>1. Все пользователи в системе:</h3>";
    $stmt = $pdo->prepare("SELECT id, username FROM users ORDER BY id");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Username</th><th>Длина</th><th>Первый символ</th></tr>";
    foreach ($users as $user) {
        $length = strlen($user['username']);
        $firstChar = substr($user['username'], 0, 1);
        echo "<tr><td>{$user['id']}</td><td>{$user['username']}</td><td>{$length}</td><td>'{$firstChar}'</td></tr>";
    }
    echo "</table>";
    
    // 2. Показываем все записи в contacts
    echo "<h3>2. Все записи в таблице contacts:</h3>";
    $stmt = $pdo->prepare("SELECT * FROM contacts ORDER BY id");
    $stmt->execute();
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>User ID</th><th>Contact ID</th><th>Status</th><th>Created</th></tr>";
    foreach ($contacts as $contact) {
        echo "<tr>";
        echo "<td>{$contact['id']}</td>";
        echo "<td>{$contact['user_id']}</td>";
        echo "<td>{$contact['contact_id']}</td>";
        echo "<td>{$contact['status']}</td>";
        echo "<td>{$contact['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 3. Тестируем API для пользователя с ID 28 (получатель)
    echo "<h3>3. Тест API для пользователя с ID 28:</h3>";
    
    // Найдем username для ID 28
    $stmt = $pdo->prepare("SELECT username FROM users WHERE id = 28");
    $stmt->execute();
    $user28 = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user28) {
        echo "<p>Username для ID 28: <strong>{$user28['username']}</strong></p>";
        
        // Тестируем запрос как в API
        $query = "SELECT c.*, u.username
                  FROM contacts c
                  JOIN users u ON c.user_id = u.id
                  WHERE c.contact_id = 28 AND c.status = 'pending'";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Найдено запросов: <strong>" . count($requests) . "</strong></p>";
        
        if (count($requests) > 0) {
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>Contact ID</th><th>User ID</th><th>Username</th><th>Status</th></tr>";
            foreach ($requests as $request) {
                echo "<tr>";
                echo "<td>{$request['contact_id']}</td>";
                echo "<td>{$request['user_id']}</td>";
                echo "<td>{$request['username']}</td>";
                echo "<td>{$request['status']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: red;'>❌ Запросы не найдены!</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Пользователь с ID 28 не найден!</p>";
    }
    
    // 4. Тестируем API для пользователя с ID 29 (отправитель)
    echo "<h3>4. Тест API для пользователя с ID 29:</h3>";
    
    $stmt = $pdo->prepare("SELECT username FROM users WHERE id = 29");
    $stmt->execute();
    $user29 = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user29) {
        echo "<p>Username для ID 29: <strong>{$user29['username']}</strong></p>";
        
        // Тестируем запрос как в API
        $query = "SELECT c.*, u.username
                  FROM contacts c
                  JOIN users u ON c.user_id = u.id
                  WHERE c.contact_id = 29 AND c.status = 'pending'";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Найдено запросов: <strong>" . count($requests) . "</strong></p>";
        
        if (count($requests) > 0) {
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>Contact ID</th><th>User ID</th><th>Username</th><th>Status</th></tr>";
            foreach ($requests as $request) {
                echo "<tr>";
                echo "<td>{$request['contact_id']}</td>";
                echo "<td>{$request['user_id']}</td>";
                echo "<td>{$request['username']}</td>";
                echo "<td>{$request['status']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: red;'>❌ Запросы не найдены!</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Пользователь с ID 29 не найден!</p>";
    }
    
    // 5. Тестируем API с разными вариантами username
    echo "<h3>5. Тест API с разными вариантами username:</h3>";
    
    $testUsernames = [
        '+79298290753',
        '79298290753', 
        '+79182725362',
        '79182725362'
    ];
    
    foreach ($testUsernames as $testUsername) {
        echo "<h4>Тест для username: '{$testUsername}'</h4>";
        
        // Симулируем API запрос
        $query = "SELECT id FROM users WHERE username = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$testUsername]);
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p style='color: green;'>✅ Пользователь найден! ID: {$user['id']}</p>";
            
            // Тестируем получение запросов
            $query = "SELECT c.*, u.username
                      FROM contacts c
                      JOIN users u ON c.user_id = u.id
                      WHERE c.contact_id = ? AND c.status = 'pending'";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$user['id']]);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<p>Найдено запросов: <strong>" . count($requests) . "</strong></p>";
            
        } else {
            echo "<p style='color: red;'>❌ Пользователь не найден!</p>";
        }
    }
    
} catch(PDOException $e) {
    echo "Ошибка подключения к базе данных: " . $e->getMessage();
}
?>
