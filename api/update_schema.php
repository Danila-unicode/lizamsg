<?php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Ошибка подключения к базе данных');
    }
    
    // Обновляем ENUM для статуса контактов
    $query = "ALTER TABLE contacts MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'";
    $conn->exec($query);
    
    echo json_encode([
        'success' => true,
        'message' => 'Схема базы данных обновлена'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
