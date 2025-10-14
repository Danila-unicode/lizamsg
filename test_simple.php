<?php
require_once 'config/database.php';

echo "<h1>Простой тест</h1>";

// Создаем подключение к БД
$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo "Ошибка подключения к БД!";
    exit;
}

echo "✅ Подключение к БД: OK<br>";

// Просто получаем статус пользователя с ID 28
$stmt = $pdo->query("SELECT user_status FROM users WHERE id = 28");
$result = $stmt->fetch();

echo "Статус пользователя 28: " . ($result['user_status'] ?? 'NULL') . "<br>";

// Получаем статус пользователя с ID 29
$stmt = $pdo->query("SELECT user_status FROM users WHERE id = 29");
$result = $stmt->fetch();

echo "Статус пользователя 29: " . ($result['user_status'] ?? 'NULL') . "<br>";

echo "Готово!";
?>
