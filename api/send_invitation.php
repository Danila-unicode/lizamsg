<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit();
}

// Подключение к базе данных
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ошибка подключения к базе данных']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$fromUsername = $data['from_username'] ?? '';
$targetUsername = $data['target_username'] ?? '';

if(empty($fromUsername) || empty($targetUsername)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Логины обязательны']);
    exit();
}

try {
    // Найти ID отправителя
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$fromUsername]);
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Отправитель не найден']);
        exit();
    }
    $fromUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $fromUserId = $fromUser['id'];
    
    // Найти ID получателя
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$targetUsername]);
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Получатель не найден']);
        exit();
    }
    $toUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $toUserId = $toUser['id'];
    
    if($fromUserId == $toUserId) {
        echo json_encode(['success' => false, 'message' => 'Нельзя добавить самого себя']);
        exit();
    }
    
    // Проверить, не существует ли уже контакт
    $query = "SELECT id FROM contacts WHERE user_id = ? AND contact_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$fromUserId, $toUserId]);
    
    if($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Контакт уже существует']);
        exit();
    }
    
    // Создать приглашение
    $query = "INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, 'pending')";
    $stmt = $pdo->prepare($query);
    
    if($stmt->execute([$fromUserId, $toUserId])) {
        echo json_encode(['success' => true, 'message' => 'Приглашение отправлено']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка при отправке приглашения']);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
}
?>
