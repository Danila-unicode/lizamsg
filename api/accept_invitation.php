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
$accepterUsername = $data['accepter_username'] ?? '';
$senderUsername = $data['sender_username'] ?? '';

if(empty($accepterUsername) || empty($senderUsername)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Логины обязательны']);
    exit();
}

try {
    // Найти ID принимающего
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$accepterUsername]);
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Принимающий не найден']);
        exit();
    }
    $accepter = $stmt->fetch(PDO::FETCH_ASSOC);
    $accepterId = $accepter['id'];
    
    // Найти ID отправителя
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$senderUsername]);
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Отправитель не найден']);
        exit();
    }
    $sender = $stmt->fetch(PDO::FETCH_ASSOC);
    $senderId = $sender['id'];
    
    // Принять приглашение
    $query = "UPDATE contacts SET status = 'accepted' WHERE user_id = ? AND contact_id = ? AND status = 'pending'";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$senderId, $accepterId]);
    
    if($stmt->rowCount() > 0) {
        // Создаем обратную связь (дружба взаимна)
        $query = "INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, 'accepted') ON DUPLICATE KEY UPDATE status = 'accepted'";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$accepterId, $senderId]);
        
        echo json_encode(['success' => true, 'message' => 'Запрос принят']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Запрос не найден']);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
}
?>