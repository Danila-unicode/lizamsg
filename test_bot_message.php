<?php
// Тест отправки сообщения боту
require_once 'telegram_bot.php';

$bot = new LizaAppTelegramBot('8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w');

// Замените на ваш реальный chat_id (получите его из логов webhook)
$testChatId = 123456789; // Замените на реальный chat_id

echo "<h1>Тест отправки сообщения боту</h1>";

// Простое сообщение
$result1 = $bot->sendMessage($testChatId, "Тестовое сообщение от LizaApp Bot!");
echo "<h3>Простое сообщение:</h3>";
echo "<pre>" . json_encode($result1, JSON_PRETTY_PRINT) . "</pre>";

// Сообщение с кнопкой
$keyboard = [
    'inline_keyboard' => [
        [
            [
                'text' => '✅ Тест',
                'callback_data' => 'test_button'
            ]
        ]
    ]
];

$result2 = $bot->sendMessage($testChatId, 
    "Тестовое сообщение с кнопкой:",
    'Markdown',
    json_encode($keyboard)
);

echo "<h3>Сообщение с кнопкой:</h3>";
echo "<pre>" . json_encode($result2, JSON_PRETTY_PRINT) . "</pre>";

echo "<p><strong>Инструкция:</strong></p>";
echo "<ol>";
echo "<li>Напишите боту @Lizaapp_bot команду /start</li>";
echo "<li>Скопируйте ваш chat_id из логов сервера</li>";
echo "<li>Замените 123456789 на ваш реальный chat_id в этом файле</li>";
echo "<li>Обновите страницу для тестирования</li>";
echo "</ol>";
?>
