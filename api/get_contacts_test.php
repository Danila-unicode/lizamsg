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
    
    // Получаем принятые контакты
    $query = "SELECT c.*, u.phone 
              FROM contacts c 
              JOIN users u ON c.contact_id = u.id 
              WHERE c.user_id = :user_id AND c.status = 'accepted'";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'contacts' => $contacts
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
