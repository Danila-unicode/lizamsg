<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// API ключ SMS.ru
const SMS_RU_API_ID = 'A0C8B6F7-FCD4-EAD4-3345-33789535E8EC';
const SMS_RU_API_URL = 'https://sms.ru/callcheck/add';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Получаем данные из запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['phone']) || empty($input['phone'])) {
    echo json_encode(['success' => false, 'error' => 'Номер телефона не указан']);
    exit;
}

$phone = $input['phone'];

// Нормализуем номер телефона (убираем + и пробелы)
$phone = preg_replace('/[^0-9]/', '', $phone);

// Проверяем формат номера
if (!preg_match('/^7[0-9]{10}$/', $phone)) {
    echo json_encode(['success' => false, 'error' => 'Неверный формат номера телефона']);
    exit;
}

try {
    // Подготавливаем параметры для SMS.ru API
    $params = [
        'api_id' => SMS_RU_API_ID,
        'phone' => $phone,
        'json' => 1
    ];
    
    // Создаем URL с параметрами
    $url = SMS_RU_API_URL . '?' . http_build_query($params);
    
    // Отправляем запрос к SMS.ru API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'LizaApp/1.0');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception('Ошибка cURL: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('HTTP ошибка: ' . $httpCode);
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        throw new Exception('Неверный ответ от SMS.ru API');
    }
    
    // Проверяем статус ответа
    if ($data['status'] !== 'OK') {
        $errorMessage = $data['status_text'] ?? 'Неизвестная ошибка';
        echo json_encode([
            'success' => false, 
            'error' => 'SMS.ru API ошибка: ' . $errorMessage
        ]);
        exit;
    }
    
    // Сохраняем check_id в сессии для последующей проверки
    session_start();
    $_SESSION['call_check_id'] = $data['check_id'];
    $_SESSION['call_phone'] = '+' . $phone; // Добавляем + для соответствия формату в БД
    $_SESSION['call_start_time'] = time();
    
    // Логируем для отладки
    error_log('Call verification started: phone=' . $_SESSION['call_phone'] . ', check_id=' . $data['check_id']);
    
    // Возвращаем успешный ответ
    echo json_encode([
        'success' => true,
        'check_id' => $data['check_id'],
        'call_phone' => $data['call_phone'],
        'call_phone_pretty' => $data['call_phone_pretty'],
        'call_phone_html' => $data['call_phone_html']
    ]);
    
} catch (Exception $e) {
    error_log('SMS.ru API Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ]);
}
?>