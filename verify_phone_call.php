<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение по звонку - LizaApp</title>
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
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .phone-display {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 18px;
            color: #333;
        }
        
        .instructions {
            text-align: left;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .instructions h3 {
            color: #1a1a1a;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .instructions ol {
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 10px;
            color: #555;
        }
        
        .call-info {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .call-number {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin: 10px 0;
        }
        
        .call-link {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px 0;
            transition: background-color 0.2s;
        }
        
        .call-link:hover {
            background: #1565c0;
        }
        
        .timer {
            font-size: 18px;
            font-weight: bold;
            color: #d32f2f;
            margin: 20px 0;
        }
        
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 500;
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
        
        .loading {
            display: none;
        }
        
        .loading.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📞 Подтверждение по звонку</h1>
        
        <div class="phone-display">
            Номер: <span id="phoneNumber"><?php echo htmlspecialchars($_GET['phone'] ?? ''); ?></span>
        </div>
        
        <div class="instructions">
            <h3>Как подтвердить номер:</h3>
            <ol>
                <li>Нажмите кнопку "Начать подтверждение"</li>
                <li>Вам будет показан номер для звонка</li>
                <li>Позвоните на указанный номер с вашего телефона</li>
                <li>Звонок будет сброшен автоматически (бесплатно)</li>
                <li>Подтверждение произойдет автоматически</li>
            </ol>
        </div>
        
        <button id="startVerification" class="call-link" onclick="startVerification()">
            <i class="fas fa-phone"></i> Начать подтверждение
        </button>
        
        <div id="callInfo" class="call-info" style="display: none;">
            <h3>Позвоните на номер:</h3>
            <div class="call-number" id="callNumber"></div>
            <a href="#" id="callLink" class="call-link">
                <i class="fas fa-phone"></i> Позвонить
            </a>
            <div class="timer" id="timer">Осталось: 5:00</div>
        </div>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="loading" id="loading">
            <i class="fas fa-spinner fa-spin"></i> Обработка запроса...
        </div>
        
        <div class="back-link">
            <a href="verify_phone.php?phone=<?php echo urlencode($_GET['phone'] ?? ''); ?>">← Вернуться к Telegram</a>
        </div>
    </div>

    <script>
        const phoneNumber = '<?php echo htmlspecialchars($_GET['phone'] ?? ''); ?>';
        let checkId = null;
        let timerInterval = null;
        let timeLeft = 300; // 5 минут в секундах
        
        function startVerification() {
            if (!phoneNumber) {
                showStatus('Номер телефона не указан', 'error');
                return;
            }
            
            showLoading(true);
            showStatus('Инициализация подтверждения...', 'pending');
            
            // Отправляем запрос на создание проверки
            fetch('api/call_verification.php', {
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
                showLoading(false);
                
                if (data.success) {
                    checkId = data.check_id;
                    showCallInfo(data.call_phone_pretty, data.call_phone);
                    startTimer();
                    showStatus('Позвоните на указанный номер для подтверждения', 'pending');
                } else {
                    showStatus('Ошибка: ' + (data.error || 'Не удалось создать проверку'), 'error');
                }
            })
            .catch(error => {
                showLoading(false);
                console.error('Error:', error);
                showStatus('Ошибка соединения с сервером', 'error');
            });
        }
        
        function showCallInfo(prettyNumber, callNumber) {
            document.getElementById('callNumber').textContent = prettyNumber;
            document.getElementById('callLink').href = 'tel:' + callNumber;
            document.getElementById('callInfo').style.display = 'block';
            document.getElementById('startVerification').style.display = 'none';
        }
        
        function startTimer() {
            timerInterval = setInterval(() => {
                timeLeft--;
                
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                document.getElementById('timer').textContent = `Осталось: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    showStatus('Время истекло. Попробуйте снова.', 'error');
                    resetVerification();
                } else {
                    // Проверяем статус каждые 10 секунд
                    if (timeLeft % 10 === 0) {
                        checkStatus();
                    }
                }
            }, 1000);
        }
        
        function checkStatus() {
            if (!checkId) return;
            
            fetch('api/call_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    check_id: checkId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.verified) {
                    clearInterval(timerInterval);
                    showStatus('✅ Номер успешно подтвержден!', 'success');
                    
                    // Перенаправляем на страницу входа через 2 секунды
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error checking status:', error);
            });
        }
        
        function resetVerification() {
            checkId = null;
            timeLeft = 300;
            clearInterval(timerInterval);
            document.getElementById('callInfo').style.display = 'none';
            document.getElementById('startVerification').style.display = 'inline-block';
        }
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
            statusDiv.style.display = 'block';
        }
        
        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }
    </script>
</body>
</html>
