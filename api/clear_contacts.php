<?php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Ошибка подключения к базе данных');
    }
    
    // Очищаем все контакты
    $query = "DELETE FROM contacts";
    $conn->exec($query);
    
    // Получаем количество удаленных записей
    $deletedCount = $conn->exec($query);
    
    echo json_encode([
        'success' => true,
        'message' => 'Все контакты очищены',
        'deleted_count' => $deletedCount
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
