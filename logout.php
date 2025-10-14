<?php
session_start();

// Очищаем все данные сессии
session_destroy();

// Перенаправляем на страницу входа
header('Location: login.php');
exit;
?>
