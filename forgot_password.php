<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Восстановление пароля - LizaApp</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="register-body">
    <div class="register-container">
        <!-- Логотип -->
        <div class="auth-logo">
            <img src="logo.png" alt="LizaApp" class="auth-logo-image">
        </div>
        
        <h1 class="register-title">Восстановление пароля</h1>
        
        <div id="step1" class="password-reset-step">
            <p class="register-description">Введите номер телефона, на который зарегистрирован аккаунт</p>
            
            <form id="forgotPasswordForm">
                <div class="premium-form-group">
                    <label for="phoneNumber" class="premium-form-label">
                        <i class="fas fa-phone"></i> Номер телефона
                    </label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" class="premium-form-input" 
                           placeholder="+7 (999) 123-45-67" required>
                </div>
                
                <button type="submit" class="premium-form-button">
                    <i class="fas fa-phone"></i> Подтвердить номер
                </button>
            </form>
        </div>
        
        <div id="step2" class="password-reset-step" style="display: none;">
            <div class="call-instructions">
                <h3><i class="fas fa-phone"></i> Позвоните на номер:</h3>
                <div class="call-number-display">
                    <span id="callNumber">+7 (800) 500-8275</span>
                    <button id="callButton" class="call-button">
                        <i class="fas fa-phone"></i> Позвонить
                    </button>
                </div>
                <p class="call-info">
                    <i class="fas fa-info-circle"></i> 
                    Звонок бесплатный. У вас есть 5 минут на подтверждение.
                </p>
                <div class="status-indicator">
                    <div class="spinner"></div>
                    <span>Ожидание подтверждения...</span>
                </div>
            </div>
        </div>
        
        <div id="step3" class="password-reset-step" style="display: none;">
            <div class="password-form">
                <h3><i class="fas fa-key"></i> Задайте новый пароль</h3>
                <p>Номер подтвержден! Теперь введите новый пароль:</p>
                
                <div class="register-form-group">
                    <label for="newPasswordInput" class="register-form-label"><i class="fas fa-lock"></i> Новый пароль</label>
                    <input type="password" id="newPasswordInput" class="register-form-input" placeholder="Введите новый пароль" required>
                </div>
                
                <div class="register-form-group">
                    <label for="confirmPasswordInput" class="register-form-label"><i class="fas fa-lock"></i> Подтвердите пароль</label>
                    <input type="password" id="confirmPasswordInput" class="register-form-input" placeholder="Повторите пароль" required>
                </div>
                
                <button id="savePasswordBtn" class="register-button"><i class="fas fa-save"></i> Задать новый пароль</button>
                <div id="errorMessage" class="error-message" style="display: none; margin-top: 15px;"></div>
            </div>
        </div>
        
        <div id="step4" class="password-reset-step" style="display: none;">
            <div class="success-message">
                <h3><i class="fas fa-check-circle"></i> Пароль успешно изменен!</h3>
                <p>Ваш пароль был успешно обновлен. Теперь вы можете войти в систему с новым паролем.</p>
                <div class="password-actions">
                    <a href="login.php" class="register-button"><i class="fas fa-sign-in-alt"></i> Войти в систему</a>
                </div>
            </div>
        </div>
        
        <div class="register-link">
            <a href="login.php"><i class="fas fa-arrow-left"></i> Вернуться к входу</a>
        </div>
    </div>
    
    <script src="js/password-reset.js"></script>
</body>
</html>
