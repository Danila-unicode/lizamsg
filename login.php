<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Войти - LizaApp</title>
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
        <h1 class="register-title">Войти</h1>

        <form id="loginForm" method="POST" autocomplete="off">
                <div class="register-form-group">
                    <label for="countryCode" class="register-form-label">Страна</label>
                    <select name="countryCode" id="countryCode" class="register-form-input" required>
                    <option value="+7" selected>+7 Россия</option>
                    <option value="+1">+1 США/Канада</option>
                    <option value="+44">+44 Великобритания</option>
                    <option value="+49">+49 Германия</option>
                    <option value="+33">+33 Франция</option>
                    <option value="+39">+39 Италия</option>
                    <option value="+34">+34 Испания</option>
                    <option value="+31">+31 Нидерланды</option>
                    <option value="+32">+32 Бельгия</option>
                    <option value="+41">+41 Швейцария</option>
                    <option value="+43">+43 Австрия</option>
                    <option value="+45">+45 Дания</option>
                    <option value="+46">+46 Швеция</option>
                    <option value="+47">+47 Норвегия</option>
                    <option value="+48">+48 Польша</option>
                    <option value="+420">+420 Чехия</option>
                    <option value="+421">+421 Словакия</option>
                    <option value="+36">+36 Венгрия</option>
                    <option value="+40">+40 Румыния</option>
                    <option value="+359">+359 Болгария</option>
                    <option value="+385">+385 Хорватия</option>
                    <option value="+386">+386 Словения</option>
                    <option value="+372">+372 Эстония</option>
                    <option value="+371">+371 Латвия</option>
                    <option value="+370">+370 Литва</option>
                    <option value="+7">+7 Казахстан</option>
                    <option value="+998">+998 Узбекистан</option>
                    <option value="+996">+996 Кыргызстан</option>
                    <option value="+992">+992 Таджикистан</option>
                    <option value="+993">+993 Туркменистан</option>
                    <option value="+374">+374 Армения</option>
                    <option value="+995">+995 Грузия</option>
                    <option value="+994">+994 Азербайджан</option>
                    <option value="+380">+380 Украина</option>
                    <option value="+375">+375 Беларусь</option>
                    <option value="+373">+373 Молдова</option>
                    <option value="+381">+381 Сербия</option>
                    <option value="+382">+382 Черногория</option>
                    <option value="+383">+383 Косово</option>
                    <option value="+387">+387 Босния и Герцеговина</option>
                    <option value="+389">+389 Македония</option>
                    <option value="+355">+355 Албания</option>
                    <option value="+30">+30 Греция</option>
                    <option value="+90">+90 Турция</option>
                    <option value="+86">+86 Китай</option>
                    <option value="+81">+81 Япония</option>
                    <option value="+82">+82 Южная Корея</option>
                    <option value="+65">+65 Сингапур</option>
                    <option value="+60">+60 Малайзия</option>
                    <option value="+66">+66 Таиланд</option>
                    <option value="+84">+84 Вьетнам</option>
                    <option value="+63">+63 Филиппины</option>
                    <option value="+62">+62 Индонезия</option>
                    <option value="+91">+91 Индия</option>
                    <option value="+92">+92 Пакистан</option>
                    <option value="+880">+880 Бангладеш</option>
                    <option value="+94">+94 Шри-Ланка</option>
                    <option value="+977">+977 Непал</option>
                    <option value="+975">+975 Бутан</option>
                    <option value="+880">+880 Бангладеш</option>
                    <option value="+93">+93 Афганистан</option>
                    <option value="+98">+98 Иран</option>
                    <option value="+964">+964 Ирак</option>
                    <option value="+963">+963 Сирия</option>
                    <option value="+961">+961 Ливан</option>
                    <option value="+962">+962 Иордания</option>
                    <option value="+972">+972 Израиль</option>
                    <option value="+970">+970 Палестина</option>
                    <option value="+966">+966 Саудовская Аравия</option>
                    <option value="+971">+971 ОАЭ</option>
                    <option value="+974">+974 Катар</option>
                    <option value="+973">+973 Бахрейн</option>
                    <option value="+965">+965 Кувейт</option>
                    <option value="+968">+968 Оман</option>
                    <option value="+967">+967 Йемен</option>
                    <option value="+20">+20 Египет</option>
                    <option value="+218">+218 Ливия</option>
                    <option value="+216">+216 Тунис</option>
                    <option value="+213">+213 Алжир</option>
                    <option value="+212">+212 Марокко</option>
                    <option value="+27">+27 ЮАР</option>
                    <option value="+234">+234 Нигерия</option>
                    <option value="+254">+254 Кения</option>
                    <option value="+256">+256 Уганда</option>
                    <option value="+250">+250 Руанда</option>
                    <option value="+255">+255 Танзания</option>
                    <option value="+258">+258 Мозамбик</option>
                    <option value="+260">+260 Замбия</option>
                    <option value="+263">+263 Зимбабве</option>
                    <option value="+264">+264 Намибия</option>
                    <option value="+267">+267 Ботсвана</option>
                    <option value="+268">+268 Свазиленд</option>
                    <option value="+266">+266 Лесото</option>
                    <option value="+27">+27 ЮАР</option>
                    <option value="+55">+55 Бразилия</option>
                    <option value="+54">+54 Аргентина</option>
                    <option value="+56">+56 Чили</option>
                    <option value="+57">+57 Колумбия</option>
                    <option value="+58">+58 Венесуэла</option>
                    <option value="+51">+51 Перу</option>
                    <option value="+52">+52 Мексика</option>
                    <option value="+53">+53 Куба</option>
                    <option value="+1">+1 США/Канада</option>
                    <option value="+61">+61 Австралия</option>
                    <option value="+64">+64 Новая Зеландия</option>
                </select>
            </div>

            <div class="register-form-group">
                <label for="phone" class="register-form-label">Номер телефона</label>
                <input type="tel" id="phone" name="phone" class="register-form-input" placeholder="9991234567" maxlength="10" pattern="[0-9]{10}" required autocomplete="off">
            </div>

            <div class="register-form-group">
                <label for="password" class="register-form-label">Пароль</label>
                <input type="password" id="password" name="password" class="register-form-input" placeholder="Введите ваш пароль" required autocomplete="new-password">
            </div>

            <button type="submit" class="register-button">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
        </form>

        <div class="register-link">
            <a href="login_username.php">Войти по логину</a> | 
            <a href="register.php">Зарегистрироваться</a>
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
            
            const countryCode = document.getElementById('countryCode').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            
            if (!phone) {
                showError('Введите номер телефона');
                return;
            }
            
            if (!password) {
                showError('Введите пароль');
                return;
            }
            
            // Валидация номера телефона
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            
            if (!cleanPhone) {
                showError('Введите корректный номер телефона');
                return;
            }
            
            if (cleanPhone.length !== 10) {
                showError('Номер телефона должен содержать 10 цифр');
                return;
            }
            
            const username = countryCode + cleanPhone;
            
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
                    // Проверяем, подтвержден ли номер телефона
                    console.log('Phone verified status:', data.phone_verified, 'Type:', typeof data.phone_verified);
                    if (data.phone_verified == 1 || data.phone_verified === 1 || data.phone_verified === '1' || data.phone_verified === true) {
                        // Номер подтвержден - сохраняем данные пользователя
                        localStorage.setItem('userData', JSON.stringify({
                            username: username,
                            userId: data.userId,
                            sessionToken: data.sessionToken
                        }));
                        
                        // Перенаправляем на главную страницу
                        window.location.href = 'simple-signal-test-websocket-external-js.html';
                    } else {
                        // Номер не подтвержден - перенаправляем на страницу подтверждения
                        window.location.href = 'verify_phone.php?phone=' + encodeURIComponent(username);
                    }
                } else {
                    showError(data.message || 'Ошибка авторизации');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showError('Ошибка соединения с сервером');
            });
        });
        
        // Валидация номера телефона в реальном времени
        document.getElementById('phone').addEventListener('input', function(e) {
            // Убираем все кроме цифр
            let value = e.target.value.replace(/[^0-9]/g, '');
            
            // Ограничиваем до 10 цифр
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            
            e.target.value = value;
        });
        
        function showError(message) {
            // Удаляем предыдущие сообщения
            const existingError = document.querySelector('.register-error');
            if (existingError) {
                existingError.remove();
            }
            
            const existingSuccess = document.querySelector('.register-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            
            // Создаем новое сообщение об ошибке
            const errorDiv = document.createElement('div');
            errorDiv.className = 'register-error';
            errorDiv.textContent = message;
            
            // Вставляем перед формой
            const form = document.getElementById('loginForm');
            form.parentNode.insertBefore(errorDiv, form);
        }
        
        function showSuccess(message) {
            // Удаляем предыдущие сообщения
            const existingError = document.querySelector('.register-error');
            if (existingError) {
                existingError.remove();
            }
            
            const existingSuccess = document.querySelector('.register-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            
            // Создаем новое сообщение об успехе
            const successDiv = document.createElement('div');
            successDiv.className = 'register-success';
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
