<?php
header('Content-Type: application/json');
session_start();

if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch($action) {
    case 'offer':
        echo json_encode(['success' => true, 'message' => 'Предложение получено']);
        break;
    case 'answer':
        echo json_encode(['success' => true, 'message' => 'Ответ получен']);
        break;
    case 'ice_candidate':
        echo json_encode(['success' => true, 'message' => 'ICE кандидат получен']);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
}
?>
