<?php
header('Content-Type: application/json');
session_start();

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true && isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'phone' => $_SESSION['user_phone']
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Не авторизован'
    ]);
}
?>
