<?php
header('Content-Type: application/json');

// Получение данных
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['phone'])) {
    echo json_encode(['success' => false, 'message' => 'Phone number required']);
    exit;
}

$phoneNumber = $data['phone'];

// Подключение к базе данных
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username_db = 'lizaapp_1w1d2sd3268';
$password_db = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Проверяем статус подтверждения
    $stmt = $pdo->prepare("SELECT phone_verified FROM users WHERE username = ?");
    $stmt->execute([$phoneNumber]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo json_encode([
            'success' => true,
            'verified' => (bool)$user['phone_verified']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
    }
    
} catch(PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error'
    ]);
}
?>