<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Файловое хранилище сигналов
$signalsFile = __DIR__ . '/signals.json';
$signals = [];
$lastSignalId = 0;

// Загружаем сигналы из файла
if (file_exists($signalsFile)) {
    $data = json_decode(file_get_contents($signalsFile), true);
    if ($data) {
        $signals = $data['signals'] ?? [];
        $lastSignalId = $data['lastSignalId'] ?? 0;
    }
}

// Функция для сохранения сигнала
function saveSignal($from, $to, $type, $data) {
    global $signals, $lastSignalId, $signalsFile;
    
    $signalId = ++$lastSignalId;
    $signal = [
        'id' => $signalId,
        'from' => $from,
        'to' => $to,
        'type' => $type,
        'data' => $data,
        'timestamp' => time()
    ];
    
    $signals[] = $signal;
    
    // Очищаем старые сигналы (старше 5 минут)
    $signals = array_filter($signals, function($s) {
        return (time() - $s['timestamp']) < 300;
    });
    
    // Сохраняем в файл
    $dataToSave = [
        'signals' => $signals,
        'lastSignalId' => $lastSignalId
    ];
    
    // Проверяем права на запись и создаем файл если нужно
    $dir = dirname($signalsFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    $result = file_put_contents($signalsFile, json_encode($dataToSave));
    if ($result === false) {
        error_log("Не удалось сохранить сигналы в файл: $signalsFile");
        // Пробуем альтернативный путь
        $altFile = __DIR__ . '/../signals.json';
        $altResult = file_put_contents($altFile, json_encode($dataToSave));
        error_log("Альтернативное сохранение в $altFile: " . ($altResult ? "успешно" : "неудачно"));
    } else {
        error_log("Сигналы успешно сохранены в файл: $signalsFile");
    }
    
    return $signalId;
}

// Функция для получения сигналов для пользователя
function getSignalsForUser($userId, $since = 0) {
    global $signals, $signalsFile;
    
    // Перезагружаем сигналы из файла на случай изменений
    $fileToRead = $signalsFile;
    if (!file_exists($fileToRead)) {
        // Пробуем альтернативный путь
        $fileToRead = __DIR__ . '/../signals.json';
    }
    
    if (file_exists($fileToRead)) {
        $data = json_decode(file_get_contents($fileToRead), true);
        if ($data) {
            $signals = $data['signals'] ?? [];
        }
    }
    
    // Логируем все сигналы для отладки
    error_log("Всего сигналов в файле: " . count($signals));
    foreach ($signals as $signal) {
        error_log("Сигнал в файле: {$signal['type']} от {$signal['from']} к {$signal['to']} (ID: {$signal['id']}, timestamp: {$signal['timestamp']})");
    }
    
    $filteredSignals = array_filter($signals, function($signal) use ($userId, $since) {
        // Сравниваем по timestamp, а не по id
        $matches = $signal['to'] == $userId && $signal['timestamp'] > $since;
        error_log("Проверка сигнала: {$signal['type']} от {$signal['from']} к {$signal['to']} (ID: {$signal['id']}, timestamp: {$signal['timestamp']}) - ищем для userId=$userId, since=$since");
        error_log("Условие: to==userId (" . ($signal['to'] == $userId ? 'true' : 'false') . ") && timestamp>since (" . ($signal['timestamp'] > $since ? 'true' : 'false') . ") = " . ($matches ? 'true' : 'false'));
        if ($matches) {
            error_log("✓ Сигнал подходит: {$signal['type']} от {$signal['from']} к {$signal['to']} (ID: {$signal['id']}, timestamp: {$signal['timestamp']})");
        }
        return $matches;
    });
    
    return $filteredSignals;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Неверный JSON');
        }
        
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'signal':
                $from = $input['from'] ?? '';
                $to = $input['to'] ?? '';
                $type = $input['type'] ?? '';
                $data = $input['data'] ?? null;
                
                if (empty($from) || empty($to) || empty($type)) {
                    throw new Exception('Недостаточно параметров для сигнала');
                }
                
                // Логируем получение сигнала
                error_log("Получен сигнал: $type от $from к $to");
                
                $signalId = saveSignal($from, $to, $type, $data);
                
                // Логируем сохранение
                error_log("Сигнал сохранен с ID: $signalId");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Сигнал сохранен',
                    'signalId' => $signalId
                ]);
                break;
                
            default:
                throw new Exception('Неизвестное действие: ' . $action);
        }
        
    } elseif ($method === 'GET') {
        switch ($action) {
            case 'signals':
                $userId = $_GET['userId'] ?? '';
                $since = intval($_GET['since'] ?? 0);
                
                if (empty($userId)) {
                    throw new Exception('Не указан userId');
                }
                
                // Логируем запрос
                error_log("=== ЗАПРОС СИГНАЛОВ ===");
                error_log("Запрос сигналов для userId=$userId с ID > $since");
                
                $userSignals = getSignalsForUser($userId, $since);
                
                // Логируем результат
                error_log("Найдено сигналов для $userId: " . count($userSignals));
                foreach ($userSignals as $signal) {
                    error_log("Сигнал: {$signal['type']} от {$signal['from']} к {$signal['to']} (ID: {$signal['id']})");
                }
                error_log("=== КОНЕЦ ЗАПРОСА ===");
                
                echo json_encode([
                    'success' => true,
                    'signals' => array_values($userSignals),
                    'count' => count($userSignals)
                ]);
                break;
                
            case 'status':
                // Перезагружаем сигналы для актуального подсчета
                $fileToRead = $signalsFile;
                if (!file_exists($fileToRead)) {
                    // Пробуем альтернативный путь
                    $fileToRead = __DIR__ . '/../signals.json';
                }
                
                if (file_exists($fileToRead)) {
                    $data = json_decode(file_get_contents($fileToRead), true);
                    if ($data) {
                        $signals = $data['signals'] ?? [];
                    }
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Сигналинг сервер работает',
                    'timestamp' => time(),
                    'totalSignals' => count($signals),
                    'signalsFile' => $fileToRead
                ]);
                break;
                
            default:
                throw new Exception('Неизвестное действие: ' . $action);
        }
        
    } else {
        throw new Exception('Неподдерживаемый метод: ' . $method);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
