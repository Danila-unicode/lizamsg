<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
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

$user_id = $_POST['user_id'] ?? '';
$user_status = $_POST['user_status'] ?? '';

if(empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'ID пользователя не указан']);
    exit();
}

if(empty($user_status)) {
    echo json_encode(['success' => false, 'message' => 'Статус не может быть пустым']);
    exit();
}

// Проверяем, что пользователь существует
$check_stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
$check_stmt->execute([$user_id]);
if($check_stmt->rowCount() == 0) {
    echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
    exit();
}

try {
    // Обновляем статус пользователя
    $stmt = $pdo->prepare("UPDATE users SET user_status = ? WHERE id = ?");
    $update_result = $stmt->execute([$user_status, $user_id]);
    $affected_rows = $stmt->rowCount();
    
    error_log("DEBUG: Обновление статуса - user_id: $user_id, user_status: $user_status");
    error_log("DEBUG: Результат обновления: " . ($update_result ? 'true' : 'false'));
    error_log("DEBUG: Затронуто строк: $affected_rows");
    
    if ($affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Статус успешно обновлен',
            'user_status' => $user_status
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Статус не был обновлен'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Ошибка обновления статуса: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка обновления статуса: ' . $e->getMessage()
    ]);
}
?>
