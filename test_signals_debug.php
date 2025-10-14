<?php
// Тест для отладки сигналов
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$signalsFile = __DIR__ . '/api/signals.json';
$signals = [];

echo "=== ОТЛАДКА СИГНАЛОВ ===\n";
echo "Файл сигналов: $signalsFile\n";
echo "Файл существует: " . (file_exists($signalsFile) ? 'ДА' : 'НЕТ') . "\n";

if (file_exists($signalsFile)) {
    $content = file_get_contents($signalsFile);
    echo "Размер файла: " . strlen($content) . " байт\n";
    echo "Содержимое файла:\n";
    echo $content . "\n";
    
    $data = json_decode($content, true);
    if ($data) {
        $signals = $data['signals'] ?? [];
        echo "Всего сигналов в файле: " . count($signals) . "\n";
        
        foreach ($signals as $signal) {
            echo "Сигнал: {$signal['type']} от {$signal['from']} к {$signal['to']} (ID: {$signal['id']}, timestamp: {$signal['timestamp']})\n";
        }
    } else {
        echo "Ошибка парсинга JSON\n";
    }
} else {
    echo "Файл сигналов не найден!\n";
}

echo "=== КОНЕЦ ОТЛАДКИ ===\n";
?>
