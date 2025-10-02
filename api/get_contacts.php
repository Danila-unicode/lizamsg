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

$username = $_GET['username'] ?? '';

if(empty($username)) {
    echo json_encode(['success' => false, 'message' => 'Логин не указан']);
    exit();
}

try {
    // Найти ID пользователя
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$username]);
    
    if($stmt->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        exit();
    }
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $userId = $user['id'];
    
    // Получаем принятые контакты
    $query = "SELECT c.*, u.username 
              FROM contacts c 
              JOIN users u ON c.contact_id = u.id 
              WHERE c.user_id = ? AND c.status = 'accepted'";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    
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
