<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$user_id = $_GET['user_id'] ?? '';
$username = $_GET['username'] ?? '';

if(empty($user_id) && empty($username)) {
    echo json_encode(['success' => false, 'message' => 'ID пользователя или username не указан']);
    exit();
}

try {
    
    // Получаем данные пользователя по ID или username
    if (!empty($user_id)) {
        $query = "SELECT username, created_at, user_status, avatar_path FROM users WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$user_id]);
    } else {
        $query = "SELECT username, created_at, user_status, avatar_path FROM users WHERE username = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$username]);
    }
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        exit();
    }
    
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Добавляем отладочную информацию
            error_log("User data for ID $user_id: " . json_encode($user));

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
