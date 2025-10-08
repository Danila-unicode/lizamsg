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

try {
    // Получаем username из GET параметра
    $searchUsername = $_GET['username'] ?? '';
    
    if(empty($searchUsername)) {
        echo json_encode(['success' => false, 'message' => 'Логин не указан']);
        exit();
    }
    
    // Ищем пользователя по логину (username)
    $query = "SELECT id, username FROM users WHERE username = ? AND is_active = 1";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$searchUsername]);
    
    if($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
}
?>
