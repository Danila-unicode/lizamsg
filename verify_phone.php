<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение номера - LizaApp</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container { 
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 500px;
            text-align: center;
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        
        .phone-display {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-size: 18px;
            font-weight: 500;
            color: #495057;
        }
        
        .telegram-btn {
            background: #0088cc;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            font-size: 16px;
            display: inline-block;
            margin: 20px 0;
            border: none;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .telegram-btn:hover {
            background: #006ba3;
        }
        
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }
        
        .status.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .status.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .status.pending {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        
        .back-link {
            margin-top: 30px;
        }
        
        .back-link a {
            color: #666;
            text-decoration: none;
        }
        
        .back-link a:hover {
            color: #333;
        }
        
        .alternative-verification {
            text-align: center;
            margin-top: 15px;
        }
        
        .call-link {
            color: #666;
            text-decoration: none;
            font-size: 14px;
            opacity: 0.8;
        }
        
        .call-link:hover {
            color: #333;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Подтверждение номера</h1>
        
        <div class="phone-display" id="phoneDisplay">
            Номер: <span id="phoneNumber"><?php echo htmlspecialchars($_GET['phone'] ?? ''); ?></span>
        </div>
        
        <button class="telegram-btn" onclick="confirmViaTelegram()">
            <i class="fab fa-telegram"></i> Подтвердить номер через Telegram
        </button>
        
        <div class="alternative-verification">
            <a href="verify_phone_call.php?phone=<?php echo urlencode($_GET['phone'] ?? ''); ?>" class="call-link">
                У меня нет Telegram
            </a>
        </div>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="back-link">
            <a href="login.php">← Вернуться к входу</a>
        </div>
    </div>

    <script>
        const phoneNumber = '<?php echo htmlspecialchars($_GET['phone'] ?? ''); ?>';
        
        function confirmViaTelegram() {
            if (!phoneNumber) {
                alert('Номер телефона не указан');
                return;
            }
            
            // Генерируем уникальный токен (user_id + timestamp)
            const userId = '<?php echo session_id() ?: uniqid(); ?>';
            const timestamp = Date.now();
            const token = btoa(userId + '_' + timestamp + '_' + phoneNumber);
            
            // Открываем Telegram с уникальным токеном
            window.open('https://t.me/Lizaapp_bot?start=' + encodeURIComponent(token), '_blank');
            
            // Показываем статус ожидания
            showStatus('Ожидание подтверждения...', 'pending');
        }
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
            statusDiv.style.display = 'block';
        }
        
        // Проверка статуса подтверждения
        function checkVerificationStatus() {
            if (!phoneNumber) return;
            
            fetch('check_verification.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: phoneNumber
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.verified) {
                    showStatus('✅ Номер успешно подтвержден!', 'success');
                    
                    // Сразу перенаправляем на страницу входа
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 1500);
                } else if (data.success && !data.verified) {
                    showStatus('⏳ Ожидание подтверждения...', 'pending');
                } else {
                    showStatus('❌ Ошибка при проверке статуса', 'error');
                }
            })
            .catch(error => {
                console.error('Error checking verification:', error);
                showStatus('❌ Ошибка при проверке статуса', 'error');
            });
        }
        
        // Проверяем статус каждые 3 секунды
        setInterval(checkVerificationStatus, 3000);
        
        // Первая проверка при загрузке
        checkVerificationStatus();
    </script>
</body>
</html>