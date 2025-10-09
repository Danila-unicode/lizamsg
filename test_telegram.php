<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест Telegram-бота</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        button { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🤖 Тест Telegram-бота LizaApp</h1>
    
    <div class="test-section">
        <h3>1. Проверка webhook</h3>
        <button onclick="testWebhook()">Тестировать webhook</button>
        <div id="webhookResult" class="result"></div>
    </div>
    
    <div class="test-section">
        <h3>2. Проверка бота</h3>
        <button onclick="openBot()">Открыть бота</button>
        <p>После открытия бота напишите /start</p>
    </div>
    
    <div class="test-section">
        <h3>3. Проверка API</h3>
        <button onclick="testAPI()">Тестировать API</button>
        <div id="apiResult" class="result"></div>
    </div>

    <script>
        function testWebhook() {
            const resultDiv = document.getElementById('webhookResult');
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
                resultDiv.innerHTML = '<strong>Результат:</strong><br>' + data;
            })
            .catch(error => {
                resultDiv.innerHTML = '<strong>Ошибка:</strong><br>' + error;
            });
        }
        
        function openBot() {
            window.open('https://t.me/Lizaapp_bot', '_blank');
        }
        
        function testAPI() {
            const resultDiv = document.getElementById('apiResult');
            resultDiv.innerHTML = 'Тестирование API...';
            
            fetch('api/telegram_confirm.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: '+79991234567'
                })
            })
            .then(response => response.json())
            .then(data => {
                resultDiv.innerHTML = '<strong>Результат:</strong><br>' + JSON.stringify(data, null, 2);
            })
            .catch(error => {
                resultDiv.innerHTML = '<strong>Ошибка:</strong><br>' + error;
            });
        }
    </script>
</body>
</html>
