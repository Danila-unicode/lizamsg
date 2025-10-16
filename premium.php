<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Премиум-аккаунт Liza - Для организаций и публичных людей</title>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- Основные стили -->
    <link rel="stylesheet" href="styles.css">
    <style>
        /* Дополнительные стили для промо-страницы */
        html, body {
            overflow-x: hidden;
        }
        
        body {
            overflow-y: auto;
        }
        .premium-hero {
            background: linear-gradient(135deg, #FFF6EE 0%, #F6F6F6 100%);
            padding: 80px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .premium-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(255, 122, 0, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(255, 122, 0, 0.05) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .premium-hero-content {
            position: relative;
            z-index: 2;
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .premium-logo {
            margin-bottom: 30px;
        }
        
        .premium-logo img {
            height: 80px;
            width: auto;
            object-fit: contain;
        }
        
        .premium-title {
            font-size: 3.5rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        .premium-subtitle {
            font-size: 1.5rem;
            color: var(--muted);
            margin-bottom: 40px;
            line-height: 1.4;
        }
        
        .premium-badge {
            display: inline-block;
            background: var(--accent);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 40px;
            box-shadow: 0 4px 16px rgba(255, 122, 0, 0.3);
        }
        
        .premium-features {
            padding: 80px 0;
            background: var(--bg);
        }
        
        .premium-features-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .premium-feature-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 40px 30px;
            text-align: center;
            transition: var(--transition);
            box-shadow: 0 4px 16px var(--shadow);
        }
        
        .premium-feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 32px rgba(255, 122, 0, 0.15);
            border-color: var(--accent);
        }
        
        .premium-feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--accent), #FFA95A);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 2rem;
            color: white;
            box-shadow: 0 8px 24px rgba(255, 122, 0, 0.3);
        }
        
        .premium-feature-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 16px;
        }
        
        .premium-feature-description {
            color: var(--muted);
            line-height: 1.6;
            font-size: 1rem;
        }
        
        .premium-cta {
            background: linear-gradient(135deg, var(--accent), #FFA95A);
            padding: 80px 0;
            text-align: center;
            color: white;
        }
        
        .premium-cta-content {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .premium-cta-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .premium-cta-subtitle {
            font-size: 1.2rem;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        
        .premium-form {
            background: var(--surface);
            border-radius: var(--radius);
            padding: 40px;
            margin: 40px auto;
            max-width: 500px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
        }
        
        .premium-form-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 24px;
            text-align: center;
        }
        
        .premium-form-group {
            margin-bottom: 24px;
        }
        
        .premium-form-label {
            display: block;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .premium-form-input {
            width: 100%;
            padding: 16px 20px;
            border: 2px solid var(--border);
            border-radius: var(--radius);
            font-size: 1rem;
            transition: var(--transition);
            background: var(--bg);
            color: var(--text);
        }
        
        .premium-form-input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
        }
        
        .premium-form-textarea {
            min-height: 120px;
            resize: vertical;
        }
        
        .premium-form-button {
            width: 100%;
            background: var(--accent);
            color: white;
            border: none;
            padding: 18px 24px;
            border-radius: var(--radius);
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: 0 4px 16px rgba(255, 122, 0, 0.3);
        }
        
        .premium-form-button:hover {
            background: #E66A00;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 122, 0, 0.4);
        }
        
        
        @media (max-width: 1024px) {
            .premium-features-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 30px;
            }
        }
        
        @media (max-width: 768px) {
            .premium-title {
                font-size: 2.5rem;
            }
            
            .premium-subtitle {
                font-size: 1.2rem;
            }
            
            .premium-features-grid {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .premium-form {
                margin: 20px;
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Главный баннер -->
    <section class="premium-hero">
        <div class="premium-hero-content">
            <div class="premium-logo">
                <img src="logo.png" alt="LizaApp">
            </div>
            <h1 class="premium-title">Премиум-аккаунт Liza</h1>
            <p class="premium-subtitle">Для организаций и публичных людей</p>
            <div class="premium-badge">
                <i class="fas fa-crown"></i> Эксклюзивный статус
            </div>
        </div>
    </section>

    <!-- Преимущества -->
    <section class="premium-features">
        <div class="premium-features-grid">
            <div class="premium-feature-card">
                <div class="premium-feature-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3 class="premium-feature-title">Легко найти</h3>
                <p class="premium-feature-description">
                    Пользователи смогут найти вас по логину, а не только по номеру телефона. 
                    Идеально для брендов, организаций и публичных людей.
                </p>
            </div>
            
            <div class="premium-feature-card">
                <div class="premium-feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="premium-feature-title">Приватность</h3>
                <p class="premium-feature-description">
                    Ваш номер телефона остается скрытым. Пользователи общаются с вами через логин, 
                    что обеспечивает дополнительную защиту личных данных.
                </p>
            </div>
            
            <div class="premium-feature-card">
                <div class="premium-feature-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="premium-feature-title">Статус</h3>
                <p class="premium-feature-description">
                    Выделяйтесь среди обычных пользователей. 
                    Премиум-статус показывает вашу серьезность и профессионализм.
                </p>
            </div>
            
            <div class="premium-feature-card">
                <div class="premium-feature-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3 class="premium-feature-title">Приоритет</h3>
                <p class="premium-feature-description">
                    Ваши сообщения доставляются в первую очередь. 
                    Приоритетная обработка всех запросов и операций.
                </p>
            </div>
        </div>
    </section>


    <!-- Форма заявки -->
    <section class="premium-cta">
        <div class="premium-cta-content">
            <h2 class="premium-cta-title">Подать заявку на премиум-аккаунт</h2>
            <p class="premium-cta-subtitle">Заполните форму, и мы свяжемся с вами для оформления</p>
            
            <div class="premium-form">
                <h3 class="premium-form-title">Заявка на регистрацию</h3>
                <form id="premiumApplicationForm">
                    <div class="premium-form-group">
                        <label for="desiredLogin" class="premium-form-label">
                            <i class="fas fa-user"></i> Желаемый логин
                        </label>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" id="desiredLogin" name="desiredLogin" class="premium-form-input" 
                       placeholder="Например: mycompany, support, info" required style="flex: 1;">
                <button type="button" id="checkLoginBtn" class="premium-form-button" 
                        style="width: auto; padding: 16px 20px; margin: 0; height: 48px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-search"></i> Проверить
                </button>
            </div>
                        <small style="color: var(--muted); font-size: 0.9rem; margin-top: 5px; display: block;">
                            Логин должен содержать только латинские буквы, цифры и символы _ и -
                        </small>
                        <div id="loginStatus" style="margin-top: 8px; font-size: 0.9rem;"></div>
                    </div>
                    
                    <div class="premium-form-group">
                        <label for="contactName" class="premium-form-label">
                            <i class="fas fa-id-card"></i> Ваше имя
                        </label>
                        <input type="text" id="contactName" name="contactName" class="premium-form-input" 
                               placeholder="Имя и фамилия" required>
                    </div>
                    
                    <div class="premium-form-group">
                        <label for="contactPhone" class="premium-form-label">
                            <i class="fas fa-phone"></i> Номер телефона
                        </label>
                        <input type="tel" id="contactPhone" name="contactPhone" class="premium-form-input" 
                               placeholder="+7 (999) 123-45-67" required>
                    </div>
                    
                    <div class="premium-form-group">
                        <label for="contactEmail" class="premium-form-label">
                            <i class="fas fa-envelope"></i> Email
                        </label>
                        <input type="email" id="contactEmail" name="contactEmail" class="premium-form-input" 
                               placeholder="your@email.com" required>
                    </div>
                    
                    <div class="premium-form-group">
                        <label for="organization" class="premium-form-label">
                            <i class="fas fa-building"></i> Организация (если применимо)
                        </label>
                        <input type="text" id="organization" name="organization" class="premium-form-input" 
                               placeholder="Название компании или организации">
                    </div>
                    
                    
                    <button type="submit" class="premium-form-button">
                        <i class="fas fa-paper-plane"></i> Отправить заявку
                    </button>
                </form>
            </div>
        </div>
    </section>

    <script>
        // Проверка доступности логина
        document.getElementById('checkLoginBtn').addEventListener('click', function() {
            const login = document.getElementById('desiredLogin').value.trim();
            const statusDiv = document.getElementById('loginStatus');
            const checkBtn = document.getElementById('checkLoginBtn');
            
            if (!login) {
                statusDiv.innerHTML = '<span style="color: #e74c3c;"><i class="fas fa-exclamation-circle"></i> Введите логин для проверки</span>';
                return;
            }
            
            // Валидация логина
            const loginRegex = /^[a-zA-Z0-9_-]+$/;
            if (!loginRegex.test(login)) {
                statusDiv.innerHTML = '<span style="color: #e74c3c;"><i class="fas fa-times-circle"></i> Логин может содержать только латинские буквы, цифры, символы _ и -</span>';
                return;
            }
            
            if (login.length < 3) {
                statusDiv.innerHTML = '<span style="color: #e74c3c;"><i class="fas fa-times-circle"></i> Логин должен содержать минимум 3 символа</span>';
                return;
            }
            
            // Показываем загрузку
            checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем...';
            checkBtn.disabled = true;
            statusDiv.innerHTML = '<span style="color: #f39c12;"><i class="fas fa-spinner fa-spin"></i> Проверяем доступность...</span>';
            
            // Проверяем логин через API
            fetch('api/check_login_availability.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login: login })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    if (data.available) {
                        statusDiv.innerHTML = '<div style="background: #d4edda; border: 2px solid #27ae60; border-radius: 8px; padding: 12px; margin: 8px 0; color: #155724; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="font-size: 18px;"></i> Логин доступен!</div>';
                    } else {
                        statusDiv.innerHTML = '<div style="background: #f8d7da; border: 2px solid #e74c3c; border-radius: 8px; padding: 12px; margin: 8px 0; color: #721c24; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-times-circle" style="font-size: 18px;"></i> Логин уже занят. Выберите другой.</div>';
                    }
                } else {
                    statusDiv.innerHTML = '<div style="background: #f8d7da; border: 2px solid #e74c3c; border-radius: 8px; padding: 12px; margin: 8px 0; color: #721c24; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-exclamation-triangle" style="font-size: 18px;"></i> ' + (data.message || 'Ошибка проверки. Попробуйте позже.') + '</div>';
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                if (error.message.includes('HTTP 500')) {
                    statusDiv.innerHTML = '<div style="background: #f8d7da; border: 2px solid #e74c3c; border-radius: 8px; padding: 12px; margin: 8px 0; color: #721c24; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-exclamation-triangle" style="font-size: 18px;"></i> Ошибка сервера. Попробуйте позже.</div>';
                } else if (error.message.includes('JSON')) {
                    statusDiv.innerHTML = '<div style="background: #f8d7da; border: 2px solid #e74c3c; border-radius: 8px; padding: 12px; margin: 8px 0; color: #721c24; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-exclamation-triangle" style="font-size: 18px;"></i> Ошибка обработки ответа. Попробуйте позже.</div>';
                } else {
                    statusDiv.innerHTML = '<div style="background: #f8d7da; border: 2px solid #e74c3c; border-radius: 8px; padding: 12px; margin: 8px 0; color: #721c24; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-exclamation-triangle" style="font-size: 18px;"></i> Ошибка соединения. Попробуйте позже.</div>';
                }
            })
            .finally(() => {
                checkBtn.innerHTML = '<i class="fas fa-search"></i> Проверить';
                checkBtn.disabled = false;
            });
        });

        document.getElementById('premiumApplicationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                desiredLogin: document.getElementById('desiredLogin').value.trim(),
                contactName: document.getElementById('contactName').value.trim(),
                contactPhone: document.getElementById('contactPhone').value.trim(),
                contactEmail: document.getElementById('contactEmail').value.trim(),
                organization: document.getElementById('organization').value.trim()
            };
            
            // Валидация логина
            const loginRegex = /^[a-zA-Z0-9_-]+$/;
            if (!loginRegex.test(formData.desiredLogin)) {
                showError('Логин может содержать только латинские буквы, цифры, символы _ и -');
                return;
            }
            
            if (formData.desiredLogin.length < 3) {
                showError('Логин должен содержать минимум 3 символа');
                return;
            }
            
            // Отправка заявки
            fetch('api/premium_application.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccess('Заявка успешно отправлена! Мы свяжемся с вами в течение 24 часов.');
                    document.getElementById('premiumApplicationForm').reset();
                } else {
                    showError(data.message || 'Ошибка при отправке заявки');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showError('Ошибка соединения с сервером');
            });
        });
        
        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = 'color: #e74c3c; background: #fdf2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; margin: 10px 0; text-align: center;';
            
            const form = document.getElementById('premiumApplicationForm');
            const existingError = form.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        function showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            successDiv.style.cssText = 'color: #27ae60; background: #d5f4e6; border: 1px solid #a8e6cf; padding: 12px; border-radius: 8px; margin: 10px 0; text-align: center;';
            
            const form = document.getElementById('premiumApplicationForm');
            const existingMessage = form.querySelector('.error-message, .success-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            form.insertBefore(successDiv, form.firstChild);
        }
    </script>
</body>
</html>
