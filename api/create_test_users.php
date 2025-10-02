<?php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Ошибка подключения к базе данных');
    }
    
    // Создаем тестовых пользователей
    $testUsers = [
        [
            'phone' => '+79182725362',
            'password' => '12345',
            'name' => 'user1'
        ],
        [
            'phone' => '+79182725363', 
            'password' => '12345',
            'name' => 'user2'
        ]
    ];
    
    $createdUsers = [];
    
    foreach ($testUsers as $user) {
        // Проверяем, существует ли пользователь
        $checkQuery = "SELECT id FROM users WHERE phone = :phone";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':phone', $user['phone']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            // Пользователь уже существует, обновляем пароль
            $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE phone = :phone";
            $updateStmt = $conn->prepare($updateQuery);
            $passwordHash = password_hash($user['password'], PASSWORD_DEFAULT);
            $updateStmt->bindParam(':password_hash', $passwordHash);
            $updateStmt->bindParam(':phone', $user['phone']);
            $updateStmt->execute();
            
            $createdUsers[] = [
                'name' => $user['name'],
                'phone' => $user['phone'],
                'status' => 'updated'
            ];
        } else {
            // Создаем нового пользователя
            $insertQuery = "INSERT INTO users (phone, password_hash) VALUES (:phone, :password_hash)";
            $insertStmt = $conn->prepare($insertQuery);
            $passwordHash = password_hash($user['password'], PASSWORD_DEFAULT);
            $insertStmt->bindParam(':phone', $user['phone']);
            $insertStmt->bindParam(':password_hash', $passwordHash);
            $insertStmt->execute();
            
            $createdUsers[] = [
                'name' => $user['name'],
                'phone' => $user['phone'],
                'status' => 'created'
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Тестовые пользователи созданы/обновлены',
        'users' => $createdUsers
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
