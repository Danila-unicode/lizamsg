<?php
// Обработка регистрации
$error = '';
$success = '';

if ($_POST) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirmPassword'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'Логин и пароль обязательны';
    } elseif ($password !== $confirmPassword) {
        $error = 'Пароли не совпадают';
    } elseif (strlen($username) < 3) {
        $error = 'Логин должен содержать минимум 3 символа';
    } elseif (strlen($password) < 5) {
        $error = 'Пароль должен содержать минимум 5 символов';
    } else {
        // Подключение к базе данных
        $host = 'localhost';
        $dbname = 'lizaapp_dsfg12df1121q5sd2694';
        $username_db = 'lizaapp_1w1d2sd3268';
        $password_db = 'aM1oX3yE0j';
        
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Проверяем, существует ли пользователь
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            
            if ($stmt->fetch()) {
                $error = 'Пользователь уже существует';
            } else {
                // Хешируем пароль
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                
                // Создаем пользователя
                $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
                $stmt->execute([$username, $passwordHash]);
                
                $success = 'Аккаунт создан успешно!';
            }
        } catch(PDOException $e) {
            $error = 'Ошибка создания пользователя: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Регистрация - WebRTC Звонки</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 400px; 
            margin: 50px auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 30px; 
        }
        .form-group { 
            margin-bottom: 20px; 
        }
        label { 
            display: block; 
            margin-bottom: 5px; 
            color: #555; 
        }
        input { 
            width: 100%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            font-size: 16px; 
        }
        button { 
            width: 100%; 
            padding: 12px; 
            background: #4CAF50; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            font-size: 16px; 
            cursor: pointer; 
        }
        button:hover { 
            background: #45a049; 
        }
        .error { 
            background: #ffebee; 
            color: #c62828; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
        }
        .success { 
            background: #e8f5e8; 
            color: #2e7d32; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
        }
        .back-link { 
            text-align: center; 
            margin-top: 20px; 
        }
        .back-link a { 
            color: #666; 
            text-decoration: none; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📞 Регистрация</h1>
        
        <?php if ($error): ?>
        <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
        <div class="success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="username">Логин:</label>
                <input type="text" id="username" name="username" required 
                       placeholder="Введите логин" minlength="3" maxlength="50"
                       value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
            </div>
            
            <div class="form-group">
                <label for="password">Пароль:</label>
                <input type="password" id="password" name="password" required 
                       placeholder="Введите пароль" minlength="5">
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Подтвердите пароль:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required 
                       placeholder="Подтвердите пароль">
            </div>
            
            <button type="submit">Создать аккаунт</button>
        </form>
        
        <div class="back-link">
            <a href="simple-signal-test-websocket.html">← Назад к звонкам</a>
        </div>
    </div>
</body>
</html>