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

error_log("=== CHECK CALL STATUS START ===");
error_log("Input data: " . json_encode($input));

if (!$input || !isset($input['check_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID проверки обязателен']);
    exit;
}

$check_id = trim($input['check_id']);
error_log("Check ID: $check_id");

try {
    // Настройки SMS.ru (используем существующие настройки)
    $api_id = 'A0C8B6F7-FCD4-EAD4-3345-33789535E8EC';
    $sms_ru_url = "https://sms.ru/callcheck/status";
    
    // Параметры для запроса к SMS.ru
    $params = [
        'api_id' => $api_id,
        'check_id' => $check_id,
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
    
    error_log("SMS.ru response: " . json_encode($sms_data));
    
    if (!$sms_data) {
        echo json_encode(['success' => false, 'message' => 'Неверный ответ от SMS.ru API']);
        exit;
    }
    
    if ($sms_data['status'] !== 'OK') {
        $error_message = $sms_data['status_text'] ?? 'Неизвестная ошибка';
        echo json_encode(['success' => false, 'message' => 'SMS.ru API ошибка: ' . $error_message]);
        exit;
    }
    
    $check_status = $sms_data['check_status'];
    error_log("Check status: $check_status");
    
    // Обрабатываем статус проверки
    switch ($check_status) {
        case '401': // Номер подтвержден
            // КРИТИЧЕСКИ ВАЖНО: Устанавливаем флаг подтверждения в сессии
            session_start();
            error_log("Session ID before setting: " . session_id());
            $_SESSION['password_reset_verified'] = true;
            $_SESSION['password_reset_time'] = time();
            
            error_log("=== CALL CONFIRMED ===");
            error_log("Session ID after setting: " . session_id());
            error_log("Session data: " . json_encode($_SESSION));
            error_log("password_reset_verified set to: " . $_SESSION['password_reset_verified']);
            error_log("=== CHECK CALL STATUS END ===");
            
            echo json_encode([
                'success' => true,
                'status' => 'confirmed',
                'message' => 'Номер подтвержден'
            ]);
            break;
            
        case '400': // Номер пока не подтвержден
            echo json_encode([
                'success' => true,
                'status' => 'waiting',
                'message' => 'Ожидание подтверждения'
            ]);
            break;
            
        case '402': // Истекло время
            echo json_encode([
                'success' => true,
                'status' => 'expired',
                'message' => 'Время ожидания истекло'
            ]);
            break;
            
        default:
            echo json_encode([
                'success' => true,
                'status' => 'waiting',
                'message' => 'Ожидание подтверждения'
            ]);
            break;
    }
    
} catch (Exception $e) {
    error_log("Ошибка проверки статуса: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Произошла ошибка. Попробуйте позже.']);
}
?>
