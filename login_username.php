<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Войти по логину - LizaApp</title>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- Основные стили -->
    <link rel="stylesheet" href="styles.css">
</head>
<body class="register-body">
    <div class="register-container">
        <div class="auth-logo">
            <img src="logo.png" alt="LizaApp" class="auth-logo-image">
        </div>
        <h1 class="register-title">Войти по логину</h1>

        <form id="loginForm" method="POST" autocomplete="off">
            <div class="register-form-group">
                <label for="username" class="register-form-label">Логин</label>
                <input type="text" name="username" id="username" class="register-form-input" placeholder="Введите логин" required autocomplete="off">
            </div>

            <div class="register-form-group">
                <label for="password" class="register-form-label">Пароль</label>
                <input type="password" name="password" id="password" class="register-form-input" placeholder="Введите пароль" required autocomplete="new-password">
            </div>

            <button type="submit" class="register-button">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
        </form>

        <div class="register-link">
            <a href="login.php">Войти по номеру телефона</a> | 
            <a href="premium.php">Зарегистрировать логин</a>
        </div>
        
        <div class="register-link" style="margin-top: 15px;">
            <a href="forgot_password.php" style="color: #e74c3c;">
                <i class="fas fa-key"></i> Забыли пароль?
            </a>
        </div>
        
        <div class="register-link" style="margin-top: 20px;">
            <a href="premium.php" style="color: var(--accent); font-weight: 600;">
                <i class="fas fa-crown"></i> Премиум-аккаунт для организаций
            </a>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            if (!username) {
                showError('Введите логин');
                return;
            }
            
            if (!password) {
                showError('Введите пароль');
                return;
            }
            
            // Отправляем данные на сервер
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
                    // Сохраняем данные пользователя
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
                console.error('Ошибка при авторизации:', error);
                showError('Ошибка соединения с сервером');
            });
        });
        
        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = 'color: #e74c3c; background: #fdf2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; margin: 10px 0; text-align: center;';
            
            const form = document.getElementById('loginForm');
            const existingError = form.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            form.insertBefore(errorDiv, form.firstChild);
        }
    </script>
</body>
</html>
