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
    echo json_encode(['success' => false, 'message' => 'Ошибка подключения к базе данных: ' . $e->getMessage()]);
    exit;
}

// Проверка авторизации через session token
$sessionToken = $_GET['session_token'] ?? '';
if(empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Session token не указан']);
    exit();
}

// Проверяем сессию
$stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()");
$stmt->execute([$sessionToken]);
$session = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$session) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Сессия не найдена или истекла']);
    exit();
}

echo json_encode([
    'success' => true, 
    'message' => 'Авторизация успешна',
    'user_id' => $session['user_id']
]);
?>
