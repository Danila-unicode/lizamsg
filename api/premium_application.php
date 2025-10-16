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

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат данных']);
    exit;
}

// Валидация обязательных полей
$requiredFields = ['desiredLogin', 'contactName', 'contactPhone', 'contactEmail'];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(['success' => false, 'message' => "Поле {$field} обязательно для заполнения"]);
        exit;
    }
}

// Валидация логина
$desiredLogin = trim($input['desiredLogin']);
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $desiredLogin)) {
    echo json_encode(['success' => false, 'message' => 'Логин может содержать только латинские буквы, цифры, символы _ и -']);
    exit;
}

if (strlen($desiredLogin) < 3) {
    echo json_encode(['success' => false, 'message' => 'Логин должен содержать минимум 3 символа']);
    exit;
}

// Валидация email
if (!filter_var($input['contactEmail'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат email']);
    exit;
}

// Валидация телефона
$phone = preg_replace('/[^0-9+]/', '', $input['contactPhone']);
if (strlen($phone) < 10) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат номера телефона']);
    exit;
}

try {
    // Отправляем заявку на почту
    $adminEmail = 'kovalenko-danila2008@yandex.ru';
    $subject = 'Новая заявка на премиум-аккаунт LizaApp';
    
    $message = "
Новая заявка на премиум-аккаунт LizaApp

ЖЕЛАЕМЫЙ ЛОГИН: {$desiredLogin}
ИМЯ: " . trim($input['contactName']) . "
ТЕЛЕФОН: {$phone}
EMAIL: " . trim($input['contactEmail']) . "
ОРГАНИЗАЦИЯ: " . trim($input['organization'] ?? 'Не указано') . "

Дата подачи: " . date('d.m.Y H:i:s') . "
IP адрес: " . $_SERVER['REMOTE_ADDR'] . "

---
Это автоматическое сообщение с сайта LizaApp
    ";
    
    $headers = "From: info@lizaapp.ru\r\n";
    $headers .= "Reply-To: " . trim($input['contactEmail']) . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    if (mail($adminEmail, $subject, $message, $headers)) {
        echo json_encode([
            'success' => true, 
            'message' => 'Заявка успешно отправлена! Мы свяжемся с вами в течение 24 часов.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка при отправке заявки. Попробуйте позже.']);
    }
    
} catch (Exception $e) {
    error_log("Ошибка отправки заявки: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Произошла ошибка. Попробуйте позже.']);
}
?>
