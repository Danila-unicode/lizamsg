<?php
// Webhook для обработки сообщений от Telegram Bot
require_once 'telegram_bot.php';

// Получение данных от Telegram
$input = file_get_contents('php://input');

// Логирование для отладки
error_log("Telegram webhook called: " . $input);

// Если это GET запрос (проверка webhook), возвращаем OK
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo "OK";
    exit;
}

// Если нет данных, возвращаем OK
if (empty($input)) {
    echo "OK";
    exit;
}

$update = json_decode($input, true);

if (!$update) {
    error_log("Invalid update data: " . $input);
    http_response_code(400);
    exit('Invalid data');
}

error_log("Update received: " . json_encode($update));

// Обработка callback query (нажатие кнопок)
if (isset($update['callback_query'])) {
    $callbackQuery = $update['callback_query'];
    $data = $callbackQuery['data'];
    $chatId = $callbackQuery['from']['id'];
    
    error_log("Callback query data: " . $data);
    
    // Обработка отмены
    if (strpos($data, 'cancel_') === 0) {
        $bot = new LizaAppTelegramBot('8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w');
        $bot->sendMessage($chatId, 
            "❌ *Подтверждение отменено*\n\n" .
            "Вы отменили подтверждение номера телефона.\n\n" .
            "💡 Для завершения регистрации в LizaApp необходимо подтвердить номер.\n" .
            "Попробуйте снова, когда будете готовы.",
            'Markdown'
        );
        $bot->answerCallbackQuery($callbackQuery['id'], "❌ Подтверждение отменено", true);
    }
}

// Обработка обычных сообщений
if (isset($update['message'])) {
    $message = $update['message'];
    $chatId = $message['chat']['id'];
    $text = $message['text'] ?? '';
    $user = $message['from'];
    
    error_log("Received message from chat $chatId: $text");
    
    // Если нет текста, считаем это приветствием
    if (empty($text)) {
        $text = '/start';
    }
    
    // Обработка команды /start с токеном
    if (strpos($text, '/start ') === 0) {
        $token = substr($text, 7); // Убираем '/start '
        
        error_log("Processing /start command with token: " . $token);
        
        $bot = new LizaAppTelegramBot('8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w');
        
        // Отправляем сообщение с кнопкой "Поделиться номером"
        $keyboard = [
            'keyboard' => [
                [
                    [
                        'text' => '📱 ПОДЕЛИТЬСЯ НОМЕРОМ',
                        'request_contact' => true
                    ]
                ]
            ],
            'one_time_keyboard' => true,
            'resize_keyboard' => true
        ];
        
        $bot->sendMessage($chatId, 
            "🔐 *Подтверждение номера телефона*\n\n" .
            "Привет! 👋\n\n" .
            "Для завершения регистрации в LizaApp необходимо подтвердить ваш номер телефона.\n\n" .
            "📱 *Нажмите синюю кнопку ниже*, чтобы поделиться номером телефона:",
            'Markdown',
            json_encode($keyboard)
        );
        
        // Сохраняем токен для этого пользователя
        saveUserToken($chatId, $token);
        
    } else {
        // Обычное приветствие
        $bot = new LizaAppTelegramBot('8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w');
        
        $bot->sendMessage($chatId, 
            "🤖 *Добро пожаловать в LizaApp Bot!*\n\n" .
            "👋 Привет! Я помогаю подтверждать номера телефонов для регистрации в LizaApp.",
            'Markdown'
        );
    }
}

// Обработка контакта (номер телефона)
if (isset($update['message']['contact'])) {
    $contact = $update['message']['contact'];
    $chatId = $update['message']['chat']['id'];
    $phoneNumber = $contact['phone_number'];
    
    error_log("Received contact: " . $phoneNumber);
    
    // Получаем токен для этого пользователя
    $token = getUserToken($chatId);
    
    if ($token) {
        // Парсим токен
        $tokenData = parseToken($token);
        
        if ($tokenData) {
            $expectedPhone = $tokenData['phone'];
            
            // Нормализуем номера для сравнения
            $normalizedReceived = normalizePhone($phoneNumber);
            $normalizedExpected = normalizePhone($expectedPhone);
            
            error_log("Normalized received: " . $normalizedReceived);
            error_log("Normalized expected: " . $normalizedExpected);
            
            $bot = new LizaAppTelegramBot('8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w');
            
            if ($normalizedReceived === $normalizedExpected) {
                // Номера совпадают - подтверждаем
                if (confirmPhoneNumber($expectedPhone)) {
                    $bot->sendMessage($chatId, 
                        "🎉 *Номер успешно подтвержден!*\n\n" .
                        "🚀 Теперь вы можете войти в LizaApp\n\n" .
                        "Вернитесь обратно в приложение Liza",
                        'Markdown'
                    );
                } else {
                    $bot->sendMessage($chatId, 
                        "❌ *Ошибка подтверждения*\n\n" .
                        "Произошла ошибка при подтверждении номера. Попробуйте позже.",
                        'Markdown'
                    );
                }
            } else {
                // Номера не совпадают
                $bot->sendMessage($chatId, 
                    "❌ *Номера не совпадают*\n\n" .
                    "🔍 Полученный номер: `{$phoneNumber}`\n" .
                    "📞 Ожидаемый номер: `{$expectedPhone}`\n\n" .
                    "💡 Убедитесь, что вы используете тот же номер, что указали при регистрации.",
                    'Markdown'
                );
            }
        } else {
            $bot->sendMessage($chatId, 
                "❌ *Ошибка токена*\n\n" .
                "Не удалось обработать запрос. Попробуйте заново с сайта LizaApp.",
                'Markdown'
            );
        }
    } else {
        $bot->sendMessage($chatId, 
            "❌ *Токен не найден*\n\n" .
            "Для подтверждения номера перейдите на сайт LizaApp и нажмите 'Подтвердить через Telegram'.",
            'Markdown'
        );
    }
}

// Функции для работы с токенами
function saveUserToken($chatId, $token) {
    // Сохраняем токен в файл или базу данных
    $data = [
        'chat_id' => $chatId,
        'token' => $token,
        'timestamp' => time()
    ];
    
    $tokensFile = 'telegram_tokens.json';
    $tokens = [];
    
    if (file_exists($tokensFile)) {
        $tokens = json_decode(file_get_contents($tokensFile), true) ?: [];
    }
    
    $tokens[$chatId] = $data;
    file_put_contents($tokensFile, json_encode($tokens));
}

function getUserToken($chatId) {
    $tokensFile = 'telegram_tokens.json';
    
    if (file_exists($tokensFile)) {
        $tokens = json_decode(file_get_contents($tokensFile), true) ?: [];
        return $tokens[$chatId]['token'] ?? null;
    }
    
    return null;
}

function parseToken($token) {
    try {
        $decoded = base64_decode($token);
        $parts = explode('_', $decoded);
        
        if (count($parts) >= 3) {
            return [
                'user_id' => $parts[0],
                'timestamp' => $parts[1],
                'phone' => $parts[2]
            ];
        }
    } catch (Exception $e) {
        error_log("Token parsing error: " . $e->getMessage());
    }
    
    return null;
}

function normalizePhone($phone) {
    // Убираем все не-цифры
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Если номер начинается с 7 и имеет 11 цифр, убираем первую 7
    if (strpos($phone, '7') === 0 && strlen($phone) === 11) {
        $phone = substr($phone, 1);
    }
    
    return $phone;
}

function confirmPhoneNumber($phoneNumber) {
    // Подключение к базе данных
    $host = 'localhost';
    $dbname = 'lizaapp_dsfg12df1121q5sd2694';
    $username_db = 'lizaapp_1w1d2sd3268';
    $password_db = 'aM1oX3yE0j';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Обновляем статус подтверждения
        $stmt = $pdo->prepare("UPDATE users SET phone_verified = 1 WHERE username = ?");
        $result = $stmt->execute([$phoneNumber]);
        
        return $result;
        
    } catch(PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

http_response_code(200);
echo 'OK';
?>