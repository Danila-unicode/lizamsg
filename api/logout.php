<?php
header('Content-Type: application/json');
session_start();

// Уничтожаем сессию
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Выход выполнен успешно'
]);
?>