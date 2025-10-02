<?php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Ошибка подключения к базе данных');
    }
    
    // Для тестирования используем user_id = 1
    $userId = 1;
    
    // Получаем входящие запросы (где текущий пользователь - получатель)
    $query = "SELECT c.*, u.phone 
              FROM contacts c 
              JOIN users u ON c.user_id = u.id 
              WHERE c.contact_id = :user_id AND c.status = 'pending'";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
