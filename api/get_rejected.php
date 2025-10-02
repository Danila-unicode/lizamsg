<?php
header('Content-Type: application/json');
session_start();

if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit();
}

require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Ошибка подключения к базе данных');
    }
    
    // Получаем отклоненные запросы (где текущий пользователь - отправитель)
    $query = "SELECT c.*, u.phone 
              FROM contacts c 
              JOIN users u ON c.contact_id = u.id 
              WHERE c.user_id = :user_id AND c.status = 'rejected'";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    
    $rejected = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'rejected' => $rejected
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
