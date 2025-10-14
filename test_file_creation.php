<?php
// Тест создания файлов
echo "<h2>Тест создания файлов</h2>";

// Проверяем текущую директорию
echo "<p>Текущая директория: " . getcwd() . "</p>";

// Проверяем папку avatars
if (!is_dir('avatars')) {
    echo "<p>Создаем папку avatars...</p>";
    if (mkdir('avatars', 0755, true)) {
        echo "<p style='color: green;'>✅ Папка создана</p>";
    } else {
        echo "<p style='color: red;'>❌ Не удалось создать папку</p>";
    }
}

// Проверяем права доступа
$perms = fileperms('avatars');
echo "<p>Права доступа: " . decoct($perms & 0777) . "</p>";

// Пробуем создать тестовый файл
$test_file = 'avatars/test.txt';
$test_content = 'test content';

echo "<p>Пробуем создать файл: $test_file</p>";

if (file_put_contents($test_file, $test_content)) {
    echo "<p style='color: green;'>✅ Файл создан</p>";
    
    if (file_exists($test_file)) {
        echo "<p style='color: green;'>✅ Файл существует</p>";
        echo "<p>Размер: " . filesize($test_file) . " байт</p>";
        
        // Удаляем тестовый файл
        unlink($test_file);
        echo "<p>Тестовый файл удален</p>";
    } else {
        echo "<p style='color: red;'>❌ Файл не найден</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Не удалось создать файл</p>";
}

// Проверяем содержимое папки
echo "<h3>Содержимое папки avatars:</h3>";
$files = scandir('avatars');
foreach ($files as $file) {
    if ($file != '.' && $file != '..') {
        echo "<p>- $file</p>";
    }
}
?>
