<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h2>Проверка путей для аватаров</h2>";

echo "<h3>Текущая директория:</h3>";
echo "<p>" . getcwd() . "</p>";

echo "<h3>Проверка папки avatars:</h3>";
$avatars_dir = 'avatars';
if (is_dir($avatars_dir)) {
    echo "<p style='color: green;'>✅ Папка avatars существует</p>";
    echo "<p>Абсолютный путь: " . realpath($avatars_dir) . "</p>";
} else {
    echo "<p style='color: red;'>❌ Папка avatars не существует</p>";
}

echo "<h3>Проверка папки avatars/time:</h3>";
$time_dir = 'avatars/time';
if (is_dir($time_dir)) {
    echo "<p style='color: green;'>✅ Папка avatars/time существует</p>";
    echo "<p>Абсолютный путь: " . realpath($time_dir) . "</p>";
} else {
    echo "<p style='color: red;'>❌ Папка avatars/time не существует</p>";
}

echo "<h3>Проверка прав доступа:</h3>";
if (is_dir($avatars_dir)) {
    if (is_writable($avatars_dir)) {
        echo "<p style='color: green;'>✅ Папка avatars доступна для записи</p>";
    } else {
        echo "<p style='color: red;'>❌ Папка avatars недоступна для записи</p>";
    }
}

if (is_dir($time_dir)) {
    if (is_writable($time_dir)) {
        echo "<p style='color: green;'>✅ Папка avatars/time доступна для записи</p>";
    } else {
        echo "<p style='color: red;'>❌ Папка avatars/time недоступна для записи</p>";
    }
}

echo "<h3>Содержимое папки avatars:</h3>";
if (is_dir($avatars_dir)) {
    $files = scandir($avatars_dir);
    echo "<p>Файлы: " . implode(', ', $files) . "</p>";
} else {
    echo "<p>Папка не существует</p>";
}

echo "<h3>Содержимое папки avatars/time:</h3>";
if (is_dir($time_dir)) {
    $files = scandir($time_dir);
    echo "<p>Файлы: " . implode(', ', $files) . "</p>";
} else {
    echo "<p>Папка не существует</p>";
}
?>
