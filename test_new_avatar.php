<?php
// Тест новой логики аватаров
echo "<h2>Тест новой логики аватаров</h2>";

// Проверяем папку avatars
if (!is_dir('avatars')) {
    echo "<p style='color: red;'>❌ Папка avatars не существует!</p>";
} else {
    echo "<p style='color: green;'>✅ Папка avatars существует</p>";
}

// Проверяем права на запись
if (is_writable('avatars')) {
    echo "<p style='color: green;'>✅ Папка avatars доступна для записи</p>";
} else {
    echo "<p style='color: red;'>❌ Папка avatars недоступна для записи</p>";
}

// Тестируем генерацию случайного имени
echo "<h3>Тест генерации случайных имен:</h3>";
for ($i = 0; $i < 5; $i++) {
    $random_name = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 16);
    $filename = $random_name . '.jpg';
    echo "<p>Тест $i: $filename</p>";
}

// Проверяем содержимое папки avatars
echo "<h3>Содержимое папки avatars:</h3>";
$files = scandir('avatars');
foreach ($files as $file) {
    if ($file != '.' && $file != '..') {
        $file_path = "avatars/$file";
        $size = file_exists($file_path) ? filesize($file_path) : 0;
        echo "<p>- $file (размер: $size байт)</p>";
    }
}

// Проверяем БД
echo "<h3>Проверка БД:</h3>";
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username = 'lizaapp_1w1d2sd3268';
$password = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->prepare("SELECT id, username, avatar_path FROM users WHERE avatar_path IS NOT NULL");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        echo "<p>Пользователь {$user['id']} ({$user['username']}): {$user['avatar_path']}</p>";
        if ($user['avatar_path'] && file_exists($user['avatar_path'])) {
            echo "<p style='color: green;'>✅ Файл существует</p>";
        } else {
            echo "<p style='color: red;'>❌ Файл не найден</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Ошибка БД: " . $e->getMessage() . "</p>";
}
?>
