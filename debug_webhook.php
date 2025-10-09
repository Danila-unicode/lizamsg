<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отладка Webhook</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .result { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🔍 Отладка Webhook</h1>
    
    <div class="test">
        <h3>1. Проверка webhook</h3>
        <button onclick="testWebhook()">Тестировать webhook</button>
        <div id="result1" class="result"></div>
    </div>
    
    <div class="test">
        <h3>2. Симуляция сообщения /start</h3>
        <button onclick="simulateStart()">Симулировать /start</button>
        <div id="result2" class="result"></div>
    </div>

    <script>
        function testWebhook() {
            const resultDiv = document.getElementById('result1');
            resultDiv.innerHTML = 'Тестирование...';
            
            fetch('telegram_webhook.php')
            .then(response => response.text())
            .then(data => {
                resultDiv.innerHTML = '<strong>Результат:</strong><br>' + data;
            })
            .catch(error => {
                resultDiv.innerHTML = '<strong>Ошибка:</strong><br>' + error;
            });
        }
        
        function simulateStart() {
            const resultDiv = document.getElementById('result2');
            resultDiv.innerHTML = 'Симуляция...';
            
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
    </script>
</body>
</html>
