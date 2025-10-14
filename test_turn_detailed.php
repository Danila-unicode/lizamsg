<?php
echo "<h1>🔍 Детальная диагностика TURN сервера VK Cloud</h1>";

$turnHost = '109.120.183.43';
$turnPorts = [3478, 3479, 5349, 5350]; // UDP и TCP порты

echo "<h2>Проверка доступности портов TURN сервера:</h2>";

foreach ($turnPorts as $port) {
    echo "<h3>Порт $port:</h3>";
    
    // Проверка TCP соединения
    $connection = @fsockopen($turnHost, $port, $errno, $errstr, 5);
    
    if ($connection) {
        echo "<p style='color: green;'>✅ TCP соединение успешно ($turnHost:$port)</p>";
        fclose($connection);
    } else {
        echo "<p style='color: red;'>❌ TCP соединение неудачно ($turnHost:$port)</p>";
        echo "<p>Ошибка: $errstr ($errno)</p>";
    }
    
    // Проверка через cURL (HTTP запрос)
    $url = "http://$turnHost:$port";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "<p style='color: orange;'>⚠️ cURL ошибка: $error</p>";
    } else {
        echo "<p style='color: blue;'>ℹ️ HTTP код: $httpCode</p>";
    }
}

echo "<h2>Проверка DNS разрешения:</h2>";
$ip = gethostbyname($turnHost);
if ($ip === $turnHost) {
    echo "<p style='color: red;'>❌ DNS не разрешается для $turnHost</p>";
} else {
    echo "<p style='color: green;'>✅ DNS разрешен: $turnHost -> $ip</p>";
}

echo "<h2>Проверка сетевых интерфейсов:</h2>";
$interfaces = net_get_interfaces();
foreach ($interfaces as $name => $interface) {
    if (isset($interface['unicast'])) {
        foreach ($interface['unicast'] as $addr) {
            if (filter_var($addr['address'], FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                echo "<p>Интерфейс $name: {$addr['address']}</p>";
            }
        }
    }
}

echo "<h2>Рекомендации:</h2>";
echo "<p>1. Проверьте настройки файрвола хостинга</p>";
echo "<p>2. Убедитесь, что исходящие соединения на порты 3478, 3479 разрешены</p>";
echo "<p>3. Проверьте, что TURN сервер VK Cloud запущен и доступен</p>";
echo "<p>4. Возможно, нужно настроить прокси или VPN</p>";

echo "<h2>Альтернативные STUN серверы:</h2>";
$stunServers = [
    'stun.l.google.com:19302',
    'stun1.l.google.com:19302',
    'stun2.l.google.com:19302',
    'stun3.l.google.com:19302',
    'stun4.l.google.com:19302'
];

foreach ($stunServers as $stun) {
    list($host, $port) = explode(':', $stun);
    $connection = @fsockopen($host, $port, $errno, $errstr, 3);
    
    if ($connection) {
        echo "<p style='color: green;'>✅ $stun доступен</p>";
        fclose($connection);
    } else {
        echo "<p style='color: red;'>❌ $stun недоступен</p>";
    }
}
?>
