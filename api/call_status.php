<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// API ключ SMS.ru
const SMS_RU_API_ID = 'A0C8B6F7-FCD4-EAD4-3345-33789535E8EC';
const SMS_RU_STATUS_URL = 'https://sms.ru/callcheck/status';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Получаем данные из запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['check_id']) || empty($input['check_id'])) {
    echo json_encode(['success' => false, 'error' => 'ID проверки не указан']);
    exit;
}

$checkId = $input['check_id'];

try {
    // Подготавливаем параметры для SMS.ru API
    $params = [
        'api_id' => SMS_RU_API_ID,
        'check_id' => $checkId,
        'json' => 1
    ];
    
    // Создаем URL с параметрами
    $url = SMS_RU_STATUS_URL . '?' . http_build_query($params);
    
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
    
    // Проверяем статус авторизации
    $checkStatus = $data['check_status'];
    $verified = false;
    
    switch ($checkStatus) {
        case '401':
            // Номер подтвержден
            $verified = true;
            break;
        case '400':
            // Номер пока не подтвержден
            $verified = false;
            break;
        case '402':
            // Истекло время
            $verified = false;
            break;
        default:
            $verified = false;
    }
    
    // Если номер подтвержден, обновляем статус в базе данных
    if ($verified) {
        session_start();
        $phone = $_SESSION['call_phone'] ?? null;
        
        // Логируем для отладки
        error_log('Call verification: phone=' . $phone . ', verified=' . ($verified ? 'true' : 'false'));
        
        if ($phone) {
            try {
                // Подключение к базе данных
                $host = 'localhost';
                $dbname = 'lizaapp_dsfg12df1121q5sd2694';
                $username_db = 'lizaapp_1w1d2sd3268';
                $password_db = 'aM1oX3yE0j';
                
                $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Обновляем статус подтверждения
                $stmt = $pdo->prepare("UPDATE users SET phone_verified = 1 WHERE username = ?");
                $result = $stmt->execute([$phone]);
                
                // Логируем результат обновления
                error_log('Database update result: ' . ($result ? 'success' : 'failed') . ' for phone: ' . $phone);
                
                if ($result) {
                    // Очищаем сессию
                    unset($_SESSION['call_check_id']);
                    unset($_SESSION['call_phone']);
                    unset($_SESSION['call_start_time']);
                }
            } catch (Exception $e) {
                error_log('Database update error: ' . $e->getMessage());
            }
        } else {
            error_log('No phone number in session for call verification');
        }
    }
    
    // Возвращаем результат
    echo json_encode([
        'success' => true,
        'verified' => $verified,
        'status' => $checkStatus,
        'status_text' => $data['check_status_text'] ?? ''
    ]);
    
} catch (Exception $e) {
    error_log('SMS.ru Status API Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ]);
}
?>