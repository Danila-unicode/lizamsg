<?php
// API для отправки подтверждения номера телефона через Telegram
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$phoneNumber = $input['phone'] ?? '';
$telegramUsername = $input['telegram_username'] ?? '';

if (empty($phoneNumber)) {
    http_response_code(400);
    echo json_encode(['error' => 'Phone number is required']);
    exit;
}

// Подключение к базе данных
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username_db = 'lizaapp_1w1d2sd3268';
$password_db = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Проверяем, существует ли пользователь
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$phoneNumber]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Просто возвращаем успех - пользователь сам перейдет в бота
    echo json_encode([
        'success' => true,
        'telegram_url' => 'https://t.me/Lizaapp_bot',
        'message' => 'Please open Telegram to confirm your phone number',
        'phone' => $phoneNumber
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
