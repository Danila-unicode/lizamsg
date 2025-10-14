<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$user_id = $_GET['user_id'] ?? '';

if(empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'ID пользователя не указан']);
    exit();
}

try {
    // Создаем подключение к БД
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        echo json_encode(['success' => false, 'message' => 'Ошибка подключения к БД']);
        exit();
    }
    
    // Получаем данные пользователя
    $query = "SELECT username, user_status, avatar_path FROM users WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        exit();
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
