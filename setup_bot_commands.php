<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Настройка команд бота</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .step { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
        .code { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; margin: 10px 0; border-left: 4px solid #007bff; }
        .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        h3 { color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Настройка приветственного сообщения бота</h1>
        
        <div class="important">
            <strong>⚠️ Важно:</strong> Выполните эти команды в Telegram с ботом @BotFather
        </div>
        
        <div class="step">
            <h3>1. Настройка приветственного сообщения</h3>
            <p>Откройте @BotFather в Telegram и выполните команды:</p>
            
            <div class="code">
/setstart<br>
@Lizaapp_bot<br>
🤖 Добро пожаловать в LizaApp Bot!<br><br>
Этот бот помогает подтверждать номера телефонов для регистрации в LizaApp.<br><br>
Нажмите кнопку ниже для подтверждения вашего номера телефона:
            </div>
        </div>
        
        <div class="step">
            <h3>2. Настройка команд бота</h3>
            <div class="code">
/setcommands<br>
@Lizaapp_bot<br>
start - Начать работу с ботом<br>
help - Помощь
            </div>
        </div>
        
        <div class="step">
            <h3>3. Настройка описания бота</h3>
            <div class="code">
/setdescription<br>
@Lizaapp_bot<br>
Официальный бот LizaApp для подтверждения номеров телефонов
            </div>
        </div>
        
        <div class="step">
            <h3>4. Что произойдет после настройки</h3>
            <ul>
                <li>При первом контакте с ботом пользователь увидит приветственное сообщение</li>
                <li>В сообщении будет кнопка "✅ Подтвердить номер"</li>
                <li>Пользователю не нужно писать команды - все автоматически</li>
            </ul>
        </div>
        
        <div class="step">
            <h3>5. Тестирование</h3>
            <p>После выполнения всех команд:</p>
            <ol>
                <li>Откройте <a href="https://t.me/Lizaapp_bot" target="_blank">@Lizaapp_bot</a></li>
                <li>Нажмите кнопку "Старт"</li>
                <li>Должно появиться приветственное сообщение с кнопкой</li>
            </ol>
        </div>
    </div>
</body>
</html>
