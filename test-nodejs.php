<?php
echo "<h2>Проверка поддержки Node.js на хостинге</h2>";

// Проверяем версию PHP
echo "<p><strong>PHP версия:</strong> " . phpversion() . "</p>";

// Проверяем доступные функции
echo "<p><strong>Доступные функции:</strong></p>";
echo "<ul>";
echo "<li>exec(): " . (function_exists('exec') ? '✅ Доступна' : '❌ Недоступна') . "</li>";
echo "<li>shell_exec(): " . (function_exists('shell_exec') ? '✅ Доступна' : '❌ Недоступна') . "</li>";
echo "<li>system(): " . (function_exists('system') ? '✅ Доступна' : '❌ Недоступна') . "</li>";
echo "</ul>";

// Проверяем Node.js
echo "<p><strong>Проверка Node.js:</strong></p>";
if (function_exists('exec')) {
    $node_version = exec('node --version 2>&1');
    if ($node_version && !strpos($node_version, 'command not found')) {
        echo "<p>✅ Node.js доступен: " . htmlspecialchars($node_version) . "</p>";
    } else {
        echo "<p>❌ Node.js недоступен</p>";
    }
    
    $npm_version = exec('npm --version 2>&1');
    if ($npm_version && !strpos($npm_version, 'command not found')) {
        echo "<p>✅ npm доступен: " . htmlspecialchars($npm_version) . "</p>";
    } else {
        echo "<p>❌ npm недоступен</p>";
    }
}

// Проверяем доступные порты
echo "<p><strong>Проверка портов:</strong></p>";
$ports = [80, 443, 8080, 3000, 5000];
foreach ($ports as $port) {
    $connection = @fsockopen('localhost', $port, $errno, $errstr, 5);
    if ($connection) {
        echo "<p>✅ Порт $port: Открыт</p>";
        fclose($connection);
    } else {
        echo "<p>❌ Порт $port: Закрыт</p>";
    }
}

// Дополнительная информация о хостинге
echo "<p><strong>Информация о хостинге:</strong></p>";
echo "<ul>";
echo "<li>Сервер: " . $_SERVER['SERVER_SOFTWARE'] . "</li>";
echo "<li>ОС: " . php_uname() . "</li>";
echo "<li>Временная зона: " . date_default_timezone_get() . "</li>";
echo "</ul>";

// Проверяем права на запись
echo "<p><strong>Права на запись:</strong></p>";
$test_file = 'test_write.tmp';
if (file_put_contents($test_file, 'test')) {
    echo "<p>✅ Запись в корень: Разрешена</p>";
    unlink($test_file);
} else {
    echo "<p>❌ Запись в корень: Запрещена</p>";
}

// Проверяем доступные директории
echo "<p><strong>Доступные директории:</strong></p>";
$dirs = ['/', '/tmp', '/var/tmp', './'];
foreach ($dirs as $dir) {
    if (is_writable($dir)) {
        echo "<p>✅ $dir: Доступна для записи</p>";
    } else {
        echo "<p>❌ $dir: Недоступна для записи</p>";
    }
}
?>
