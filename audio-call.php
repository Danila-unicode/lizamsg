<?php
// Аудио звонки - PHP скрипт для обработки аудио звонков
// Использует те же функции что и видеозвонки, но только для аудио

// Функция для инициации аудио звонка
function initiateAudioCall($from, $to) {
    // Используем те же WebSocket функции, но с аудио только
    return [
        'success' => true,
        'message' => 'Аудио звонок инициирован',
        'type' => 'audio_call',
        'from' => $from,
        'to' => $to
    ];
}

// Функция для принятия аудио звонка
function acceptAudioCall($from, $to) {
    return [
        'success' => true,
        'message' => 'Аудио звонок принят',
        'type' => 'audio_call_accepted',
        'from' => $from,
        'to' => $to
    ];
}

// Функция для отклонения аудио звонка
function rejectAudioCall($from, $to) {
    return [
        'success' => true,
        'message' => 'Аудио звонок отклонен',
        'type' => 'audio_call_rejected',
        'from' => $from,
        'to' => $to
    ];
}

// Обработка POST запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Неверный JSON']);
        exit;
    }
    
    $action = $input['action'] ?? '';
    $from = $input['from'] ?? '';
    $to = $input['to'] ?? '';
    
    switch ($action) {
        case 'initiate':
            $result = initiateAudioCall($from, $to);
            break;
        case 'accept':
            $result = acceptAudioCall($from, $to);
            break;
        case 'reject':
            $result = rejectAudioCall($from, $to);
            break;
        default:
            $result = ['success' => false, 'message' => 'Неизвестное действие'];
    }
    
    header('Content-Type: application/json');
    echo json_encode($result);
} else {
    // GET запрос - возвращаем информацию о скрипте
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Аудио звонки API',
        'version' => '1.0',
        'endpoints' => [
            'POST /audio-call.php' => 'Обработка аудио звонков',
            'actions' => ['initiate', 'accept', 'reject']
        ]
    ]);
}
?>
