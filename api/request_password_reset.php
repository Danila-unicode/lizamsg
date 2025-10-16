<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// Получаем данные из JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['phone'])) {
    echo json_encode(['success' => false, 'message' => 'Номер телефона обязателен']);
    exit;
}

$phone = trim($input['phone']);

// Валидация номера телефона
if (!preg_match('/^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/', $phone)) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат номера телефона']);
    exit;
}

// Нормализация номера телефона
$phone_normalized = preg_replace('/[^\d]/', '', $phone);
if (strlen($phone_normalized) === 10) {
    $phone_normalized = '7' . $phone_normalized;
} elseif (strlen($phone_normalized) === 11 && $phone_normalized[0] === '8') {
    $phone_normalized = '7' . substr($phone_normalized, 1);
}

// ВАЖНО: Сохраняем в сессии номер в том же формате, что приходит из JavaScript
$phone_for_session = $phone; // Сохраняем оригинальный формат с +

try {
    // Подключение к базе данных
    $host = 'localhost';
    $dbname = 'lizaapp_dsfg12df1121q5sd2694';
    $username = 'lizaapp_1w1d2sd3268';
    $password = 'aM1oX3yE0j';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Проверяем, существует ли пользователь с таким номером
    // В базе номера хранятся с +, поэтому ищем с +
    $phone_with_plus = '+' . $phone_normalized;
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND is_active = 1");
    $stmt->execute([$phone_with_plus]);
    $user = $stmt->fetch();

    // Отладочная информация
    error_log("=== REQUEST PASSWORD RESET START ===");
    error_log("Input phone: " . $input['phone']);
    error_log("Original phone: $phone");
    error_log("Normalized phone: $phone_normalized");
    error_log("Phone with plus: $phone_with_plus");
    error_log("User found: " . ($user ? 'YES' : 'NO'));
    if ($user) {
        error_log("User ID: " . $user['id']);
    }

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Пользователь с таким номером не найден']);
        exit;
    }
    
    // Настройки SMS.ru (используем существующие настройки)
    $api_id = 'A0C8B6F7-FCD4-EAD4-3345-33789535E8EC';
    $sms_ru_url = "https://sms.ru/callcheck/add";
    
    // Параметры для запроса к SMS.ru
    $params = [
        'api_id' => $api_id,
        'phone' => $phone_normalized, // Номер для звонка (нормализованный без +)
        'json' => 1
    ];
    
    // Создаем URL с параметрами
    $url = $sms_ru_url . '?' . http_build_query($params);
    
    // Отправляем запрос к SMS.ru
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'LizaApp/1.0');
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($curl_error) {
        echo json_encode(['success' => false, 'message' => 'Ошибка cURL: ' . $curl_error]);
        exit;
    }
    
    if ($http_code !== 200) {
        echo json_encode(['success' => false, 'message' => 'HTTP ошибка: ' . $http_code]);
        exit;
    }
    
    $sms_data = json_decode($response, true);
    
    if (!$sms_data) {
        echo json_encode(['success' => false, 'message' => 'Неверный ответ от SMS.ru API']);
        exit;
    }
    
    if ($sms_data['status'] !== 'OK') {
        $error_message = $sms_data['status_text'] ?? 'Неизвестная ошибка';
        echo json_encode(['success' => false, 'message' => 'SMS.ru API ошибка: ' . $error_message]);
        exit;
    }
    
    // Сохраняем check_id и ID пользователя в сессии для дальнейшей проверки
    session_start();
    $_SESSION['password_reset_check_id'] = $sms_data['check_id'];
    $_SESSION['password_reset_user_id'] = $user['id']; // Сохраняем ID пользователя
    $_SESSION['password_reset_phone'] = $phone_for_session; // Сохраняем оригинальный номер с +
    $_SESSION['password_reset_original_phone'] = $input['phone']; // Сохраняем оригинальный номер
    
    error_log("=== SESSION SAVED ===");
    error_log("Check ID: " . $sms_data['check_id']);
    error_log("User ID: " . $user['id']);
    error_log("Phone in session: $phone_for_session");
    error_log("Original phone: " . $input['phone']);
    error_log("=== REQUEST PASSWORD RESET END ===");
    
    echo json_encode([
        'success' => true,
        'check_id' => $sms_data['check_id'],
        'call_phone' => $sms_data['call_phone_pretty'],
        'message' => 'Запрос на обратный звонок отправлен'
    ]);
    
} catch (PDOException $e) {
    error_log("Ошибка базы данных: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ошибка сервера. Попробуйте позже.']);
} catch (Exception $e) {
    error_log("Общая ошибка: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Произошла ошибка. Попробуйте позже.']);
}
?>
