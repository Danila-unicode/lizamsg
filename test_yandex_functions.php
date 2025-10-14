<?php
// Тест Yandex Cloud Functions
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$yandexUrl = 'https://functions.yandexcloud.net/d4ec0rusp5blvc9pucd4';

echo "=== ТЕСТ YANDEX CLOUD FUNCTIONS ===\n";

// Тест 1: Отправка сигнала
echo "1. Отправка тестового сигнала...\n";
$signalData = [
    'action' => 'signal',
    'from' => 'test_user1',
    'to' => 'test_user2',
    'type' => 'ping',
    'data' => [
        'from' => 'test_user1',
        'timestamp' => time(),
        'signalId' => 'test_signal_123',
        'test' => true
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $yandexUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($signalData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP код: $httpCode\n";
echo "Ответ: $response\n";
if ($error) {
    echo "Ошибка cURL: $error\n";
}

// Тест 2: Получение сигналов
echo "\n2. Получение сигналов для test_user2...\n";
$getUrl = $yandexUrl . '?action=signals&userId=test_user2&since=0';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $getUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP код: $httpCode\n";
echo "Ответ: $response\n";
if ($error) {
    echo "Ошибка cURL: $error\n";
}

echo "=== КОНЕЦ ТЕСТА ===\n";
?>
