<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Настройка Telegram-бота - LizaApp</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            padding: 20px;
            line-height: 1.6;
        }
        .container { 
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        .step {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .code {
            background: #f1f3f4;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Настройка Telegram-бота LizaApp</h1>
        
        <?php
        // Обработка нажатия кнопок
        if (isset($_POST['action'])) {
            $action = $_POST['action'];
            
            // Подключение к базе данных
            $host = 'localhost';
            $dbname = 'lizaapp_dsfg12df1121q5sd2694';
            $username_db = 'lizaapp_1w1d2sd3268';
            $password_db = 'aM1oX3yE0j';
            
            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                if ($action === 'add_column') {
                    // Проверяем, существует ли уже поле phone_verified
                    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'phone_verified'");
                    $columnExists = $stmt->fetch();
                    
                    if ($columnExists) {
                        echo '<div class="step"><span class="warning">⚠️ Поле phone_verified уже существует</span></div>';
                    } else {
                        // Добавляем поле phone_verified
                        $sql = "ALTER TABLE users ADD COLUMN phone_verified TINYINT(1) DEFAULT 0";
                        $pdo->exec($sql);
                        echo '<div class="step"><span class="success">✅ Поле phone_verified успешно добавлено!</span></div>';
                    }
                }
                
                if ($action === 'test_webhook') {
                    // Тестируем webhook
                    $webhookUrl = 'https://lizaapp.ru/telegram_webhook.php';
                    $botToken = '8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w';
                    
                    $url = "https://api.telegram.org/bot{$botToken}/setWebhook";
                    $data = ['url' => $webhookUrl];
                    
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
                        $result = json_decode($response, true);
                        if ($result['ok']) {
                            echo '<div class="step"><span class="success">✅ Webhook успешно настроен!</span></div>';
                        } else {
                            echo '<div class="step"><span class="error">❌ Ошибка настройки webhook: ' . $result['description'] . '</span></div>';
                        }
                    } else {
                        echo '<div class="step"><span class="error">❌ Ошибка HTTP: ' . $httpCode . '</span></div>';
                    }
                }
                
            } catch(PDOException $e) {
                echo '<div class="step"><span class="error">❌ Ошибка базы данных: ' . $e->getMessage() . '</span></div>';
            }
        }
        ?>
        
        <div class="step">
            <h3>📋 Шаг 1: Добавить поле в базу данных</h3>
            <p>Добавляем поле <code>phone_verified</code> в таблицу <code>users</code> для отслеживания подтверждения номеров.</p>
            <form method="POST">
                <button type="submit" name="action" value="add_column">Добавить поле phone_verified</button>
            </form>
        </div>
        
        <div class="step">
            <h3>🔗 Шаг 2: Настроить webhook</h3>
            <p>Настраиваем webhook для получения сообщений от Telegram-бота.</p>
            <div class="code">
                Webhook URL: https://lizaapp.ru/telegram_webhook.php<br>
                Bot Token: 8271591115:AAH-v84kBjd9X08Kq3TEi-jdO3R0vm6UO7w
            </div>
            <form method="POST">
                <button type="submit" name="action" value="test_webhook">Настроить webhook</button>
            </form>
        </div>
        
        <div class="step">
            <h3>🧪 Шаг 3: Тестирование</h3>
            <p>После настройки можно протестировать систему:</p>
            <ol>
                <li>Зарегистрируйтесь в LizaApp</li>
                <li>Нажмите "Подтвердить через Telegram"</li>
                <li>Перейдите в Telegram к боту <a href="https://t.me/Lizaapp_bot" target="_blank">@Lizaapp_bot</a></li>
                <li>Нажмите "✅ Подтвердить"</li>
            </ol>
        </div>
        
        <div class="step">
            <h3>📊 Проверка структуры таблицы</h3>
            <?php
            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                $stmt = $pdo->query("DESCRIBE users");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo '<table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
                echo '<tr><th>Поле</th><th>Тип</th><th>Null</th><th>По умолчанию</th></tr>';
                foreach ($columns as $column) {
                    echo '<tr>';
                    echo '<td>' . $column['Field'] . '</td>';
                    echo '<td>' . $column['Type'] . '</td>';
                    echo '<td>' . $column['Null'] . '</td>';
                    echo '<td>' . $column['Default'] . '</td>';
                    echo '</tr>';
                }
                echo '</table>';
                
            } catch(PDOException $e) {
                echo '<span class="error">Ошибка: ' . $e->getMessage() . '</span>';
            }
            ?>
        </div>
    </div>
</body>
</html>
