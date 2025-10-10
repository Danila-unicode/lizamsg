<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

$user_id = $_POST['user_id'] ?? '';

if(empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'ID пользователя не указан']);
    exit();
}

// Проверяем, что файл был загружен
if (!isset($_FILES['avatar'])) {
    echo json_encode(['success' => false, 'message' => 'Файл не был загружен']);
    exit();
}

if ($_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    $error_messages = [
        UPLOAD_ERR_INI_SIZE => 'Файл слишком большой (INI)',
        UPLOAD_ERR_FORM_SIZE => 'Файл слишком большой (FORM)',
        UPLOAD_ERR_PARTIAL => 'Файл загружен частично',
        UPLOAD_ERR_NO_FILE => 'Файл не был загружен',
        UPLOAD_ERR_NO_TMP_DIR => 'Временная папка не найдена',
        UPLOAD_ERR_CANT_WRITE => 'Не удалось записать файл',
        UPLOAD_ERR_EXTENSION => 'Загрузка остановлена расширением'
    ];
    
    $error_message = $error_messages[$_FILES['avatar']['error']] ?? 'Неизвестная ошибка';
    echo json_encode(['success' => false, 'message' => 'Ошибка загрузки файла: ' . $error_message]);
    exit();
}

try {
    // Пути от корня сайта
    $avatars_dir = '../avatars';
    $time_dir = '../avatars/time';
    
    // Проверяем права доступа к папке avatars
    if (!is_dir($avatars_dir)) {
        if (!mkdir($avatars_dir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'Не удалось создать папку avatars']);
            exit();
        }
    }
    
    if (!is_writable($avatars_dir)) {
        echo json_encode(['success' => false, 'message' => 'Папка avatars недоступна для записи']);
        exit();
    }
    
    // Проверяем права доступа к папке time для временных файлов
    if (!is_dir($time_dir)) {
        if (!mkdir($time_dir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'Не удалось создать папку time']);
            exit();
        }
    }
    
    if (!is_writable($time_dir)) {
        echo json_encode(['success' => false, 'message' => 'Папка time недоступна для записи']);
        exit();
    }
    
    // Получаем текущий аватар пользователя для удаления
    $stmt = $pdo->prepare("SELECT avatar_path FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $current_avatar = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Удаляем старый аватар если он существует
    if ($current_avatar && $current_avatar['avatar_path'] && file_exists($current_avatar['avatar_path'])) {
        unlink($current_avatar['avatar_path']);
    }
    
    // Генерируем уникальное случайное имя файла (16 символов)
    do {
        $random_name = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 16);
        $avatar_filename = $random_name . '.jpg';
        $avatar_path = "avatars/" . $avatar_filename;
    } while (file_exists($avatars_dir . '/' . $avatar_filename));
    
    // Получаем абсолютный путь
    $absolute_path = realpath($avatars_dir) . DIRECTORY_SEPARATOR . $avatar_filename;
    
    // Сначала сохраняем временный файл в папку time
    $temp_filename = 'temp_' . time() . '_' . $user_id . '.jpg';
    $temp_path = "avatars/time/" . $temp_filename;
    $temp_absolute_path = realpath($time_dir) . DIRECTORY_SEPARATOR . $temp_filename;
    
    error_log("DEBUG: Сохраняем временный файл в: " . $temp_absolute_path);
    
    // Пробуем сохранить временный файл
    $temp_success = false;
    
    if (move_uploaded_file($_FILES['avatar']['tmp_name'], $temp_absolute_path)) {
        error_log("DEBUG: Временный файл сохранен успешно");
        $temp_success = true;
    } else {
        error_log("DEBUG: move_uploaded_file не сработал, пробуем copy");
        
        if (copy($_FILES['avatar']['tmp_name'], $temp_absolute_path)) {
            error_log("DEBUG: Временный файл скопирован успешно");
            $temp_success = true;
        } else {
            error_log("DEBUG: copy не сработал, пробуем file_put_contents");
            
            $content = file_get_contents($_FILES['avatar']['tmp_name']);
            if ($content !== false && file_put_contents($temp_absolute_path, $content)) {
                error_log("DEBUG: Временный файл сохранен через file_put_contents");
                $temp_success = true;
            } else {
                error_log("DEBUG: Все способы сохранения временного файла не сработали");
            }
        }
    }
    
    if (!$temp_success) {
        echo json_encode(['success' => false, 'message' => 'Ошибка сохранения временного файла']);
        exit();
    }
    
    // Теперь перемещаем из time в avatars
    error_log("DEBUG: Перемещаем файл из $temp_absolute_path в $absolute_path");
    
    if (rename($temp_absolute_path, $absolute_path)) {
        error_log("DEBUG: Файл успешно перемещен в avatars");
        $success = true;
    } else {
        error_log("DEBUG: rename не сработал, пробуем copy + unlink");
        
        if (copy($temp_absolute_path, $absolute_path)) {
            error_log("DEBUG: Файл скопирован в avatars");
            unlink($temp_absolute_path); // Удаляем временный файл
            $success = true;
        } else {
            error_log("DEBUG: Не удалось переместить файл в avatars");
            $success = false;
        }
    }
    
    if ($success) {
        // Проверяем, что файл действительно создался
        if (file_exists($absolute_path)) {
            $file_size = filesize($absolute_path);
            error_log("DEBUG: Файл создан, размер: " . $file_size . " байт");
            error_log("DEBUG: Абсолютный путь: " . $absolute_path);
            error_log("DEBUG: Относительный путь: " . $avatar_path);
            
            // Обновляем путь к аватару в базе данных
            $stmt = $pdo->prepare("UPDATE users SET avatar_path = ? WHERE id = ?");
            $stmt->execute([$avatar_path, $user_id]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Аватар успешно загружен',
                'avatar_path' => $avatar_path,
                'file_size' => $file_size,
                'absolute_path' => $absolute_path
            ]);
        } else {
            error_log("DEBUG: Файл не найден после сохранения");
            error_log("DEBUG: Искали файл по пути: " . $absolute_path);
            echo json_encode(['success' => false, 'message' => 'Файл не был создан']);
        }
    } else {
        error_log("DEBUG: Все способы сохранения не сработали");
        echo json_encode(['success' => false, 'message' => 'Ошибка сохранения файла']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
}
?>
