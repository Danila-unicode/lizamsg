<?php
header('Content-Type: application/json');

// Тестируем signaling сервер
$signaling_server = 'https://lizamsg.ru:3000/api/signaling';

echo "=== ТЕСТ SIGNALING СЕРВЕРА ===\n\n";

// Тест 1: Отправляем ping
echo "1. Отправляем ping...\n";
$pingData = [
    'action' => 'ping',
    'from' => 'test_user_1',
    'to' => 'test_user_2',
    'data' => ['timestamp' => time() * 1000]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $signaling_server);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pingData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Тест 2: Проверяем сигналы для test_user_2
echo "2. Проверяем сигналы для test_user_2...\n";
$checkUrl = $signaling_server . '?action=signals&userId=test_user_2&since=0';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $checkUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Тест 3: Проверяем сигналы для test_user_1
echo "3. Проверяем сигналы для test_user_1...\n";
$checkUrl = $signaling_server . '?action=signals&userId=test_user_1&since=0';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $checkUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

echo "=== ТЕСТ ЗАВЕРШЕН ===\n";
?>
