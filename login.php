<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Войти - LizaApp</title>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .login-container {
            background: #f8f9fa;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            position: relative;
            overflow: hidden;
        }

        .login-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }

        .login-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }

        .login-title {
            font-size: 28px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .login-subtitle {
            color: #6c757d;
            font-size: 16px;
            line-height: 1.4;
        }

        .form-group {
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: white;
        }

        .form-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .login-button {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }

        .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .register-link {
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            position: relative;
            z-index: 2;
        }

        .register-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }

        .register-link a:hover {
            color: #764ba2;
        }

        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
            font-size: 14px;
            position: relative;
            z-index: 2;
        }

        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #c3e6cb;
            font-size: 14px;
            position: relative;
            z-index: 2;
        }

        @media (max-width: 480px) {
            .login-container {
                padding: 30px 20px;
                margin: 10px;
            }
            
            .login-title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1 class="login-title">Войти</h1>
            <p class="login-subtitle">
                Добро пожаловать обратно!<br>
                Пожалуйста, войдите в свой аккаунт.
            </p>
        </div>

        <form id="loginForm" method="POST">
            <div class="form-group">
                <label for="username" class="form-label">Имя пользователя</label>
                <input type="text" id="username" name="username" class="form-input" placeholder="Введите ваше имя пользователя" required>
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Пароль</label>
                <input type="password" id="password" name="password" class="form-input" placeholder="Введите ваш пароль" required>
            </div>

            <button type="submit" class="login-button">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
        </form>

        <div class="register-link">
            Нет аккаунта? <a href="register.php">Зарегистрироваться</a>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username) {
                showError('Введите логин');
                return;
            }
            
            if (!password) {
                showError('Введите пароль');
                return;
            }
            
            // Используем тот же API и логику, что и в app.js
            fetch('https://lizaapp.ru/api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Сохраняем данные пользователя как в app.js
                    localStorage.setItem('userData', JSON.stringify({
                        username: username,
                        userId: data.userId,
                        sessionToken: data.sessionToken
                    }));
                    
                    // Перенаправляем на главную страницу
                    window.location.href = 'simple-signal-test-websocket-external-js.html';
                } else {
                    showError(data.message || 'Ошибка авторизации');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showError('Ошибка соединения с сервером');
            });
        });
        
        function showError(message) {
            // Удаляем предыдущие сообщения
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            const existingSuccess = document.querySelector('.success-message');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            
            // Создаем новое сообщение об ошибке
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            // Вставляем перед формой
            const form = document.getElementById('loginForm');
            form.parentNode.insertBefore(errorDiv, form);
        }
        
        function showSuccess(message) {
            // Удаляем предыдущие сообщения
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            const existingSuccess = document.querySelector('.success-message');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            
            // Создаем новое сообщение об успехе
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            
            // Вставляем перед формой
            const form = document.getElementById('loginForm');
            form.parentNode.insertBefore(successDiv, form);
        }
        
        // Проверяем, если пользователь уже авторизован
        window.addEventListener('load', function() {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                // Пользователь уже авторизован, перенаправляем на главную
                window.location.href = 'simple-signal-test-websocket-external-js.html';
            }
        });
    </script>
</body>
</html>
