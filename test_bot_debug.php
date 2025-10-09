<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест Telegram Bot - LizaApp</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        button {
            background: #0088cc;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #006ba3;
        }
        .log {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            font-family: monospace;
            white-space: pre-wrap;
        }
        input {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Тест Telegram Bot</h1>
        
        <h3>1. Тест webhook</h3>
        <button onclick="testWebhook()">Проверить webhook</button>
        
        <h3>2. Тест отправки сообщения</h3>
        <input type="text" id="chatId" placeholder="Chat ID (ваш ID в Telegram)" value="">
        <button onclick="sendTestMessage()">Отправить тестовое сообщение</button>
        
        <h3>3. Тест подтверждения номера</h3>
        <input type="text" id="testPhone" placeholder="Номер телефона" value="+79991234567">
        <button onclick="testPhoneConfirmation()">Тест подтверждения номера</button>
        
        <h3>4. Открыть бота</h3>
        <button onclick="openBot()">Открыть @Lizaapp_bot</button>
        
        <div id="log" class="log">Логи будут отображаться здесь...</div>
    </div>

    <script>
        function log(message) {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            logDiv.textContent += `[${timestamp}] ${message}\n`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function testWebhook() {
            log('Проверка webhook...');
            fetch('telegram_webhook.php', {
                method: 'GET'
            })
            .then(response => response.text())
            .then(data => {
                log('Webhook ответ: ' + data);
            })
            .catch(error => {
                log('Ошибка webhook: ' + error);
            });
        }
        
        function sendTestMessage() {
            const chatId = document.getElementById('chatId').value;
            if (!chatId) {
                alert('Введите Chat ID');
                return;
            }
            
            log('Отправка тестового сообщения...');
            fetch('api/telegram_confirm.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: '+79991234567',
                    chat_id: chatId
                })
            })
            .then(response => response.json())
            .then(data => {
                log('Ответ API: ' + JSON.stringify(data));
            })
            .catch(error => {
                log('Ошибка API: ' + error);
            });
        }
        
        function testPhoneConfirmation() {
            const phone = document.getElementById('testPhone').value;
            if (!phone) {
                alert('Введите номер телефона');
                return;
            }
            
            log('Тест подтверждения номера: ' + phone);
            window.open('https://t.me/Lizaapp_bot?start=' + encodeURIComponent(phone), '_blank');
        }
        
        function openBot() {
            log('Открытие бота...');
            window.open('https://t.me/Lizaapp_bot', '_blank');
        }
        
        // Получаем Chat ID при загрузке страницы
        window.onload = function() {
            log('Страница загружена. Для получения Chat ID отправьте /start боту @Lizaapp_bot');
        };
    </script>
</body>
</html>
