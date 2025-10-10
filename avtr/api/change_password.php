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
$current_password = $_POST['current_password'] ?? '';
$new_password = $_POST['new_password'] ?? '';

if(empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'ID пользователя не указан']);
    exit();
}

if(empty($current_password)) {
    echo json_encode(['success' => false, 'message' => 'Текущий пароль не указан']);
    exit();
}

if(empty($new_password)) {
    echo json_encode(['success' => false, 'message' => 'Новый пароль не указан']);
    exit();
}

if(strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Новый пароль должен содержать минимум 6 символов']);
    exit();
}

try {
    // Получаем текущий пароль пользователя
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        exit();
    }
    
    // Проверяем текущий пароль
    if (!password_verify($current_password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Неверный текущий пароль']);
        exit();
    }
    
    // Хешируем новый пароль
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Обновляем пароль в базе данных
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $update_result = $stmt->execute([$hashed_password, $user_id]);
    $affected_rows = $stmt->rowCount();
    
    error_log("DEBUG: Смена пароля - user_id: $user_id");
    error_log("DEBUG: Результат обновления: " . ($update_result ? 'true' : 'false'));
    error_log("DEBUG: Затронуто строк: $affected_rows");
    
    if ($affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Пароль успешно изменен'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Пароль не был изменен'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Ошибка смены пароля: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка смены пароля: ' . $e->getMessage()
    ]);
}
?>
