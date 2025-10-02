<?php
header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit();
}

require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$phone = $data['phone'] ?? '';

if(empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Номер телефона обязателен']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Найти пользователя по номеру
    $query = "SELECT id FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":phone", $phone);
    $stmt->execute();
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        exit();
    }
    
    $toUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $toUserId = $toUser['id'];
    
    // Для тестирования используем user_id = 1
    $fromUserId = 1;
    
    if($fromUserId == $toUserId) {
        echo json_encode(['success' => false, 'message' => 'Нельзя добавить самого себя']);
        exit();
    }
    
    // Проверить, не существует ли уже контакт
    $query = "SELECT id FROM contacts WHERE user_id = :user_id AND contact_id = :contact_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $fromUserId);
    $stmt->bindParam(":contact_id", $toUserId);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Контакт уже существует']);
        exit();
    }
    
    // Создать приглашение
    $query = "INSERT INTO contacts (user_id, contact_id, status) VALUES (:user_id, :contact_id, 'pending')";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $fromUserId);
    $stmt->bindParam(":contact_id", $toUserId);
    
    if($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Приглашение отправлено']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка при отправке приглашения']);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
}
?>
