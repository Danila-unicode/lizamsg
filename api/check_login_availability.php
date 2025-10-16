<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// Получаем данные из JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['login'])) {
    echo json_encode(['success' => false, 'message' => 'Логин не указан']);
    exit;
}

$login = trim($input['login']);

// Валидация логина
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $login)) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат логина']);
    exit;
}

if (strlen($login) < 3) {
    echo json_encode(['success' => false, 'message' => 'Логин слишком короткий']);
    exit;
}

try {
    // Подключение к базе данных
    $host = 'localhost';
    $dbname = 'lizaapp_dsfg12df1121q5sd2694';
    $username = 'lizaapp_1w1d2sd3268';
    $password = 'aM1oX3yE0j';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Проверяем, не занят ли логин
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$login]);
    
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => true, 
            'available' => false,
            'message' => 'Логин уже занят'
        ]);
    } else {
        echo json_encode([
            'success' => true, 
            'available' => true,
            'message' => 'Логин доступен'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Ошибка базы данных: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ошибка сервера. Попробуйте позже.']);
} catch (Exception $e) {
    error_log("Общая ошибка: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Произошла ошибка. Попробуйте позже.']);
}
?>
