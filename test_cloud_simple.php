<?php
echo "<h1>☁️ Проверка облачных сервисов</h1>";

// Проверка 1: Yandex Cloud Functions
echo "<h2>1. Yandex Cloud Functions</h2>";
$signalingUrl = 'https://functions.yandexcloud.net/d4ec0rusp5blvc9pucd4?action=status';

$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'method' => 'GET'
    ]
]);

$response = @file_get_contents($signalingUrl, false, $context);

if ($response !== false) {
    $data = json_decode($response, true);
    if ($data && isset($data['success']) && $data['success']) {
        echo "<p style='color: green;'>✅ Yandex Cloud Functions доступен</p>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p style='color: orange;'>⚠️ Yandex Cloud Functions отвечает, но с ошибкой</p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
    }
} else {
    echo "<p style='color: red;'>❌ Yandex Cloud Functions недоступен</p>";
}

// Проверка 2: TURN сервер
echo "<h2>2. TURN сервер VK Cloud</h2>";
$turnHost = '109.120.183.43';
$turnPort = 3478;

$connection = @fsockopen($turnHost, $turnPort, $errno, $errstr, 5);

if ($connection) {
    echo "<p style='color: green;'>✅ TURN сервер VK Cloud доступен ($turnHost:$turnPort)</p>";
    fclose($connection);
} else {
    echo "<p style='color: red;'>❌ TURN сервер VK Cloud недоступен ($turnHost:$turnPort)</p>";
    echo "<p>Ошибка: $errstr ($errno)</p>";
}

// Проверка 3: STUN сервер
echo "<h2>3. STUN сервер Google</h2>";
$stunHost = 'stun.l.google.com';
$stunPort = 19302;

$connection = @fsockopen($stunHost, $stunPort, $errno, $errstr, 5);

if ($connection) {
    echo "<p style='color: green;'>✅ STUN сервер Google доступен ($stunHost:$stunPort)</p>";
    fclose($connection);
} else {
    echo "<p style='color: red;'>❌ STUN сервер Google недоступен ($stunHost:$stunPort)</p>";
    echo "<p>Ошибка: $errstr ($errno)</p>";
}

// Проверка 4: Тест отправки сигнала
echo "<h2>4. Тест отправки сигнала</h2>";
$testSignal = [
    'action' => 'signal',
    'from' => 'test_user_1',
    'to' => 'test_user_2',
    'type' => 'test',
    'data' => ['message' => 'test signal from ' . date('Y-m-d H:i:s')]
];

$postData = json_encode($testSignal);

$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $postData
    ]
]);

$response = @file_get_contents('https://functions.yandexcloud.net/d4ec0rusp5blvc9pucd4', false, $context);

if ($response !== false) {
    $data = json_decode($response, true);
    if ($data && isset($data['success']) && $data['success']) {
        echo "<p style='color: green;'>✅ Сигнал отправлен успешно</p>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p style='color: orange;'>⚠️ Сервер вернул ошибку</p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
    }
} else {
    echo "<p style='color: red;'>❌ Ошибка отправки сигнала</p>";
}

echo "<h2>🎯 Результат</h2>";
echo "<p>Если все проверки прошли успешно, WebRTC должен работать корректно.</p>";
echo "<p><a href='webrtc-demo-cloud.html'>Перейти к тестированию WebRTC</a></p>";
?>
