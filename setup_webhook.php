<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Настройка Webhook - LizaApp</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .step { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
        button { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .result { margin-top: 15px; padding: 15px; background: #e9ecef; border-radius: 5px; font-family: monospace; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Настройка Webhook для Telegram-бота</h1>
        
        <div class="step">
            <h3>1. Проверка текущего webhook</h3>
            <button onclick="checkWebhook()">Проверить webhook</button>
            <div id="checkResult" class="result"></div>
        </div>
        
        <div class="step">
            <h3>2. Установка webhook</h3>
            <button onclick="setWebhook()">Установить webhook</button>
            <div id="setResult" class="result"></div>
        </div>
        
        <div class="step">
            <h3>3. Тестирование webhook</h3>
            <button onclick="testWebhook()">Тестировать webhook</button>
            <div id="testResult" class="result"></div>
        </div>
        
        <div class="step">
            <h3>4. Информация о боте</h3>
            <div class="code">
                <strong>Bot Token:</strong> 8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w<br>
                <strong>Bot Username:</strong> @Lizaapp_bot<br>
                <strong>Webhook URL:</strong> https://lizaapp.ru/telegram_webhook.php
            </div>
        </div>
    </div>

    <script>
        const botToken = '8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w';
        const webhookUrl = 'https://lizaapp.ru/telegram_webhook.php';
        
        function checkWebhook() {
            const resultDiv = document.getElementById('checkResult');
            resultDiv.innerHTML = 'Проверка webhook...';
            
            fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    resultDiv.innerHTML = '<div class="success"><strong>Webhook Info:</strong><br>' + JSON.stringify(data.result, null, 2) + '</div>';
                } else {
                    resultDiv.innerHTML = '<div class="error"><strong>Ошибка:</strong><br>' + JSON.stringify(data, null, 2) + '</div>';
                }
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="error"><strong>Ошибка:</strong><br>' + error + '</div>';
            });
        }
        
        function setWebhook() {
            const resultDiv = document.getElementById('setResult');
            resultDiv.innerHTML = 'Установка webhook...';
            
            const formData = new FormData();
            formData.append('url', webhookUrl);
            
            fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    resultDiv.innerHTML = '<div class="success"><strong>Webhook установлен!</strong><br>' + JSON.stringify(data, null, 2) + '</div>';
                } else {
                    resultDiv.innerHTML = '<div class="error"><strong>Ошибка:</strong><br>' + JSON.stringify(data, null, 2) + '</div>';
                }
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="error"><strong>Ошибка:</strong><br>' + error + '</div>';
            });
        }
        
        function testWebhook() {
            const resultDiv = document.getElementById('testResult');
            resultDiv.innerHTML = 'Тестирование webhook...';
            
            // Симулируем сообщение от Telegram
            const testData = {
                message: {
                    chat: { id: 123456789 },
                    text: '/start'
                }
            };
            
            fetch('telegram_webhook.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            })
            .then(response => response.text())
            .then(data => {
                resultDiv.innerHTML = '<div class="success"><strong>Webhook работает!</strong><br>Ответ: ' + data + '</div>';
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="error"><strong>Ошибка:</strong><br>' + error + '</div>';
            });
        }
    </script>
</body>
</html>
