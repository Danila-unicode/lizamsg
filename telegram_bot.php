<?php
// Telegram Bot для подтверждения номеров телефона LizaApp
// Bot Token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz (замените на реальный токен)
// Bot Username: @LizaAppBot

class LizaAppTelegramBot {
    private $botToken;
    private $webhookUrl;
    
    public function __construct($botToken) {
        $this->botToken = $botToken;
        $this->webhookUrl = 'https://lizaapp.ru/telegram_webhook.php';
    }
    
    // Установка webhook для получения обновлений
    public function setWebhook() {
        $url = "https://api.telegram.org/bot{$this->botToken}/setWebhook";
        $data = [
            'url' => $this->webhookUrl
        ];
        
        return $this->sendRequest($url, $data);
    }
    
    // Отправка сообщения с кнопкой подтверждения
    public function sendConfirmationMessage($chatId, $phoneNumber) {
        $url = "https://api.telegram.org/bot{$this->botToken}/sendMessage";
        
        $keyboard = [
            'inline_keyboard' => [
                [
                    [
                        'text' => '✅ Подтвердить',
                        'callback_data' => 'confirm_' . $phoneNumber
                    ]
                ],
                [
                    [
                        'text' => '❌ Отменить',
                        'callback_data' => 'cancel_' . $phoneNumber
                    ]
                ]
            ]
        ];
        
        $data = [
            'chat_id' => $chatId,
            'text' => "🔐 *Подтверждение номера телефона*\n\n" .
                     "Привет! Подтверди, что ты хочешь связать свой Telegram с LizaApp.\n\n" .
                     "Номер: `{$phoneNumber}`\n\n" .
                     "Нажми кнопку ниже для подтверждения:",
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode($keyboard)
        ];
        
        return $this->sendRequest($url, $data);
    }
    
    // Получение информации о пользователе
    public function getUserInfo($userId) {
        $url = "https://api.telegram.org/bot{$this->botToken}/getChat";
        $data = ['chat_id' => $userId];
        
        $response = $this->sendRequest($url, $data);
        return $response;
    }
    
    // Отправка простого сообщения
    public function sendMessage($chatId, $text, $parseMode = null, $replyMarkup = null) {
        $url = "https://api.telegram.org/bot{$this->botToken}/sendMessage";
        $data = [
            'chat_id' => $chatId,
            'text' => $text
        ];
        
        if ($parseMode) {
            $data['parse_mode'] = $parseMode;
        }
        
        if ($replyMarkup) {
            $data['reply_markup'] = $replyMarkup;
        }
        
        return $this->sendRequest($url, $data);
    }
    
    // Ответ на callback query
    public function answerCallbackQuery($callbackQueryId, $text, $showAlert = false) {
        $url = "https://api.telegram.org/bot{$this->botToken}/answerCallbackQuery";
        $data = [
            'callback_query_id' => $callbackQueryId,
            'text' => $text,
            'show_alert' => $showAlert
        ];
        
        return $this->sendRequest($url, $data);
    }
    
    // Отправка HTTP запроса
    private function sendRequest($url, $data) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return json_decode($response, true);
        }
        
        return false;
    }
}

// Инициализация бота
$botToken = '8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w';
$bot = new LizaAppTelegramBot($botToken);

// Установка webhook (выполнить один раз)
if (isset($_GET['setup'])) {
    $result = $bot->setWebhook();
    echo json_encode($result);
    exit;
}

echo "Telegram Bot для LizaApp готов к работе!";
?>
