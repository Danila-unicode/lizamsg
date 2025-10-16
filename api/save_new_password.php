<?php
error_log("=== SAVE NEW PASSWORD API CALLED ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Content type: " . ($_SERVER['CONTENT_TYPE'] ?? 'NOT SET'));

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

// Получаем данные из POST (как в рабочем коде профиля)
$new_password = $_POST['new_password'] ?? '';

error_log("=== SAVE NEW PASSWORD START ===");
error_log("POST data: " . json_encode($_POST));
error_log("New password: " . $new_password);

if (empty($new_password)) {
    echo json_encode(['success' => false, 'message' => 'Новый пароль обязателен']);
    exit;
}

$new_password = trim($new_password);

if (strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Пароль должен содержать минимум 6 символов']);
    exit;
}

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
    
    // Хешируем пароль
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    error_log("Password hashed successfully");
    
    // Обновляем пароль в базе данных по ID пользователя
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $result = $stmt->execute([$password_hash, $user_id]);
    $affected_rows = $stmt->rowCount();
    
    error_log("Password update - user_id: $user_id");
    error_log("Password update result: " . ($result ? 'SUCCESS' : 'FAILED'));
    error_log("Affected rows: $affected_rows");
    error_log("Password hash length: " . strlen($password_hash));
    
    if (!$result || $affected_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Не удалось обновить пароль в базе данных']);
        exit;
    }
    
    // Логируем смену пароля
    error_log("Password reset completed for user ID: $user_id at " . date('Y-m-d H:i:s'));
    
    // Очищаем сессию после успешного сохранения пароля
    unset($_SESSION['password_reset_verified']);
    unset($_SESSION['password_reset_user_id']);
    unset($_SESSION['password_reset_phone']);
    unset($_SESSION['password_reset_original_phone']);
    unset($_SESSION['password_reset_time']);
    unset($_SESSION['password_reset_check_id']);
    
    error_log("=== PASSWORD SAVE SUCCESS ===");
    error_log("=== SAVE NEW PASSWORD END ===");
    
    echo json_encode([
        'success' => true,
        'message' => 'Пароль успешно изменен'
    ]);
    
} catch (PDOException $e) {
    error_log("=== PDO ERROR ===");
    error_log("PDO Error message: " . $e->getMessage());
    error_log("PDO Error code: " . $e->getCode());
    error_log("PDO Error file: " . $e->getFile() . " line " . $e->getLine());
    
    // Очищаем сессию при ошибке
    unset($_SESSION['password_reset_verified']);
    unset($_SESSION['password_reset_user_id']);
    unset($_SESSION['password_reset_phone']);
    unset($_SESSION['password_reset_original_phone']);
    unset($_SESSION['password_reset_time']);
    unset($_SESSION['password_reset_check_id']);
    
    echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("=== GENERAL ERROR ===");
    error_log("Error message: " . $e->getMessage());
    error_log("Error code: " . $e->getCode());
    error_log("Error file: " . $e->getFile() . " line " . $e->getLine());
    error_log("Error trace: " . $e->getTraceAsString());
    
    // Очищаем сессию при ошибке
    unset($_SESSION['password_reset_verified']);
    unset($_SESSION['password_reset_user_id']);
    unset($_SESSION['password_reset_phone']);
    unset($_SESSION['password_reset_original_phone']);
    unset($_SESSION['password_reset_time']);
    unset($_SESSION['password_reset_check_id']);
    
    echo json_encode(['success' => false, 'message' => 'Ошибка сервера: ' . $e->getMessage()]);
}
?>
