<?php
// API для проверки аватаров на сервере
header('Content-Type: text/html; charset=utf-8');

echo "<h3>Проверка аватаров на сервере</h3>";

// Пути от корня сайта
$avatars_dir = '../avatars';
$time_dir = '../avatars/time';

// Проверяем папку avatars
if (!is_dir($avatars_dir)) {
    echo "<p style='color: red;'>❌ Папка avatars не существует</p>";
    exit();
}

echo "<p style='color: green;'>✅ Папка avatars существует</p>";

// Проверяем содержимое папки avatars
echo "<h4>Детальная проверка папки avatars:</h4>";
echo "<p>Текущая директория: " . getcwd() . "</p>";
echo "<p>Абсолютный путь к avatars: " . realpath($avatars_dir) . "</p>";

if (!is_dir($avatars_dir)) {
    echo "<p style='color: red;'>❌ Папка avatars не существует</p>";
} else {
    echo "<p style='color: green;'>✅ Папка avatars существует</p>";
    
    $files = scandir($avatars_dir);
    echo "<p>Все файлы в папке: " . implode(', ', $files) . "</p>";
    
    $avatar_files = array_filter($files, function($file) {
        return $file != '.' && $file != '..' && pathinfo($file, PATHINFO_EXTENSION) == 'jpg';
    });
    
    echo "<h4>Файлы аватаров в папке avatars:</h4>";
    if (empty($avatar_files)) {
        echo "<p style='color: orange;'>⚠️ Файлов аватаров не найдено</p>";
    } else {
        foreach ($avatar_files as $file) {
            $file_path = $avatars_dir . '/' . $file;
            $absolute_path = realpath($file_path);
            $exists = file_exists($file_path);
            $size = $exists ? filesize($file_path) : 0;
            $modified = $exists ? date('Y-m-d H:i:s', filemtime($file_path)) : 'не существует';
            
            echo "<p>- $file</p>";
            echo "<p>&nbsp;&nbsp;Путь: $file_path</p>";
            echo "<p>&nbsp;&nbsp;Абсолютный путь: $absolute_path</p>";
            echo "<p>&nbsp;&nbsp;Существует: " . ($exists ? 'да' : 'нет') . "</p>";
            echo "<p>&nbsp;&nbsp;Размер: $size байт</p>";
            echo "<p>&nbsp;&nbsp;Изменен: $modified</p>";
            echo "<br>";
        }
    }
}

// Проверяем содержимое папки time
if (is_dir($time_dir)) {
    $time_files = scandir($time_dir);
    $temp_files = array_filter($time_files, function($file) {
        return $file != '.' && $file != '..' && pathinfo($file, PATHINFO_EXTENSION) == 'jpg';
    });
    
    echo "<h4>Временные файлы в папке time:</h4>";
    if (empty($temp_files)) {
        echo "<p style='color: green;'>✅ Временных файлов нет</p>";
    } else {
        foreach ($temp_files as $file) {
            $file_path = $time_dir . '/' . $file;
            $size = filesize($file_path);
            $exists = file_exists($file_path);
            $modified = date('Y-m-d H:i:s', filemtime($file_path));
            echo "<p>- $file (размер: $size байт, существует: " . ($exists ? 'да' : 'нет') . ", изменен: $modified)</p>";
        }
    }
} else {
    echo "<p style='color: red;'>❌ Папка time не существует</p>";
}

// Проверяем БД
echo "<h4>Аватары в базе данных:</h4>";
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->prepare("SELECT id, username, avatar_path, created_at FROM users WHERE avatar_path IS NOT NULL ORDER BY created_at DESC");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "<p style='color: orange;'>⚠️ В БД нет записей с аватарами</p>";
    } else {
        foreach ($users as $user) {
            echo "<p>Пользователь {$user['id']} ({$user['username']}): {$user['avatar_path']} (создан: {$user['created_at']})</p>";
            if ($user['avatar_path'] && file_exists($user['avatar_path'])) {
                echo "<p style='color: green;'>✅ Файл существует</p>";
            } else {
                echo "<p style='color: red;'>❌ Файл не найден</p>";
            }
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Ошибка БД: " . $e->getMessage() . "</p>";
}

// Проверяем права доступа
echo "<h4>Права доступа:</h4>";
$perms = fileperms('avatars');
echo "<p>Права папки avatars: " . decoct($perms & 0777) . "</p>";

// Проверяем, можем ли мы создавать файлы
$test_file = 'avatars/test_' . time() . '.txt';
if (file_put_contents($test_file, 'test')) {
    echo "<p style='color: green;'>✅ Можем создавать файлы</p>";
    unlink($test_file);
} else {
    echo "<p style='color: red;'>❌ Не можем создавать файлы</p>";
}
?>
