<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

/**
 * Генерация случайного пароля
 */
function generatePassword($length = 10) {
    $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $password = '';
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $characters[rand(0, strlen($characters) - 1)];
    }
    
    return $password;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// Получаем данные из JSON (номер не нужен - SMS.ru уже подтвердил)
$input = json_decode(file_get_contents('php://input'), true);

error_log("=== GENERATE NEW PASSWORD START ===");
error_log("Input data: " . json_encode($input));

// КРИТИЧЕСКИ ВАЖНО: Проверяем, что номер был подтвержден через звонок
session_start();
error_log("Session ID: " . session_id());
error_log("Session data: " . json_encode($_SESSION));

if (!isset($_SESSION['password_reset_verified']) || $_SESSION['password_reset_verified'] !== true) {
    error_log("=== SESSION VERIFICATION FAILED ===");
    error_log("password_reset_verified: " . ($_SESSION['password_reset_verified'] ?? 'NOT SET'));
    error_log("All session keys: " . implode(', ', array_keys($_SESSION)));
    echo json_encode(['success' => false, 'message' => 'Номер не подтвержден. Сначала подтвердите номер через звонок.']);
    exit;
}

error_log("Phone verified in session: YES");

    // Проверяем, что у нас есть ID пользователя из сессии
    if (!isset($_SESSION['password_reset_user_id'])) {
        error_log("User ID not found in session");
        echo json_encode(['success' => false, 'message' => 'Сессия истекла. Повторите процесс восстановления.']);
        exit;
    }
    
    $user_id = $_SESSION['password_reset_user_id'];
    error_log("User ID from session: $user_id");
    
    // SMS.ru уже подтвердил, что звонок поступил с правильного номера
    // Дополнительная проверка номера не нужна
    error_log("Phone verification by SMS.ru: CONFIRMED");

// Проверяем, что подтверждение не истекло (максимум 10 минут)
if (!isset($_SESSION['password_reset_time']) || (time() - $_SESSION['password_reset_time']) > 600) {
    echo json_encode(['success' => false, 'message' => 'Время подтверждения истекло. Повторите процесс восстановления.']);
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
    
    // Проверяем, что пользователь с таким ID существует и активен
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Пользователь не найден или неактивен']);
        exit;
    }
    
    // Генерируем новый пароль
    $new_password = generatePassword(10);
    error_log("Generated password: $new_password for user ID: $user_id");
    
    // Хешируем пароль
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    error_log("Password hashed successfully");
    
    // Обновляем пароль в базе данных по ID пользователя
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$password_hash, $user_id]);
    $affected_rows = $stmt->rowCount();
    
    error_log("Password update result: " . ($result ? 'SUCCESS' : 'FAILED') . ", affected rows: $affected_rows");
    
    if (!$result || $affected_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Не удалось обновить пароль в базе данных']);
        exit;
    }
    
    // Логируем смену пароля
    error_log("Password reset completed for user ID: $user_id at " . date('Y-m-d H:i:s'));
    
    // Очищаем сессию после успешной генерации пароля
    unset($_SESSION['password_reset_verified']);
    unset($_SESSION['password_reset_user_id']);
    unset($_SESSION['password_reset_phone']);
    unset($_SESSION['password_reset_original_phone']);
    unset($_SESSION['password_reset_time']);
    unset($_SESSION['password_reset_check_id']);
    
    error_log("=== PASSWORD GENERATION SUCCESS ===");
    error_log("New password: $new_password");
    error_log("=== GENERATE NEW PASSWORD END ===");
    
    echo json_encode([
        'success' => true,
        'new_password' => $new_password,
        'message' => 'Новый пароль сгенерирован'
    ]);
    
} catch (PDOException $e) {
    error_log("Ошибка базы данных: " . $e->getMessage());
    // Очищаем сессию при ошибке
    unset($_SESSION['password_reset_verified']);
    unset($_SESSION['password_reset_user_id']);
    unset($_SESSION['password_reset_phone']);
    unset($_SESSION['password_reset_original_phone']);
    unset($_SESSION['password_reset_time']);
    unset($_SESSION['password_reset_check_id']);
    echo json_encode(['success' => false, 'message' => 'Ошибка сервера. Попробуйте позже.']);
} catch (Exception $e) {
    error_log("Общая ошибка: " . $e->getMessage());
    // Очищаем сессию при ошибке
    unset($_SESSION['password_reset_verified']);
    unset($_SESSION['password_reset_user_id']);
    unset($_SESSION['password_reset_phone']);
    unset($_SESSION['password_reset_original_phone']);
    unset($_SESSION['password_reset_time']);
    unset($_SESSION['password_reset_check_id']);
    echo json_encode(['success' => false, 'message' => 'Произошла ошибка. Попробуйте позже.']);
}
?>
