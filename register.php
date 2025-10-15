<?php
// Обработка регистрации
$error = '';
$success = '';

if ($_POST) {
    $countryCode = $_POST['countryCode'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Очищаем номер от всех символов кроме цифр
    $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
    $fullPhoneNumber = $countryCode . $cleanPhone;
    
    if (empty($phone) || empty($password)) {
        $error = 'Номер телефона и пароль обязательны';
    } elseif (strlen($cleanPhone) !== 10) {
        $error = 'Номер телефона должен содержать 10 цифр';
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
            $stmt->execute([$fullPhoneNumber]);
            
            if ($stmt->fetch()) {
                $error = 'Пользователь с таким номером уже существует';
            } else {
                // Хешируем пароль
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                
                // Создаем пользователя
                $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, phone_verified) VALUES (?, ?, 0)");
                $stmt->execute([$fullPhoneNumber, $passwordHash]);
                
                // Перенаправляем на страницу подтверждения
                header('Location: verify_phone.php?phone=' . urlencode($fullPhoneNumber));
                exit;
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
    <title>Создать аккаунт - LizaApp</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- Основные стили -->
    <link rel="stylesheet" href="styles.css">
    <script>
        // Маска для номера телефона
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('phone').addEventListener('input', function(e) {
                // Убираем все кроме цифр
                let value = e.target.value.replace(/[^0-9]/g, '');
                
                // Ограничиваем до 10 цифр
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                
                e.target.value = value;
            });
        });
        
        // Обработка кнопки подтверждения через Telegram
        function confirmViaTelegram() {
            const phone = document.getElementById('phone').value;
            const countryCode = document.getElementById('countryCode').value;
            const fullNumber = countryCode + phone;
            
            if (!phone || phone.length !== 10) {
                alert('Сначала введите номер телефона и зарегистрируйтесь');
                return;
            }
            
            // Отправляем запрос на подтверждение
            fetch('api/telegram_confirm.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: fullNumber
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Открываем Telegram
                    window.open('https://t.me/Lizaapp_bot', '_blank');
                    alert('Перейди в Telegram и подтверди свой номер телефона');
                } else {
                    alert('Ошибка: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при отправке подтверждения');
            });
        }
        
        // Проверка статуса подтверждения
        function checkVerificationStatus() {
            const phone = document.getElementById('phone').value;
            const countryCode = document.getElementById('countryCode').value;
            const fullNumber = countryCode + phone;
            
            if (!phone || phone.length !== 10) return;
            
            fetch('check_verification.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: fullNumber
                })
            })
            .then(response => response.json())
            .then(data => {
                const statusDiv = document.getElementById('verificationStatus');
                const statusText = document.getElementById('statusText');
                const telegramBtn = document.getElementById('telegramBtn');
                
                if (data.success) {
                    statusDiv.style.display = 'block';
                    
                    if (data.verified) {
                        statusDiv.style.background = '#d4edda';
                        statusDiv.style.border = '1px solid #c3e6cb';
                        statusText.innerHTML = '✅ <strong>Номер подтвержден!</strong> Теперь вы можете войти в систему.';
                        statusText.style.color = '#155724';
                        telegramBtn.style.display = 'none';
                    } else {
                        statusDiv.style.background = '#fff3cd';
                        statusDiv.style.border = '1px solid #ffeaa7';
                        statusText.innerHTML = '⏳ <strong>Ожидание подтверждения...</strong> Перейдите в Telegram и подтвердите номер.';
                        statusText.style.color = '#856404';
                    }
                }
            })
            .catch(error => {
                console.error('Error checking verification:', error);
            });
        }
        
        // Проверяем статус каждые 5 секунд
        setInterval(checkVerificationStatus, 5000);
    </script>
</head>
<body class="register-body">
    <div class="register-container">
        <div class="auth-logo">
            <img src="logo.png" alt="LizaApp" class="auth-logo-image">
        </div>
        <h1 class="register-title">Создать аккаунт</h1>
        
        <?php if ($error): ?>
        <div class="register-error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
        <div class="register-success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <form method="POST" autocomplete="off">
            <div class="register-form-group">
                <label for="countryCode" class="register-form-label">Страна</label>
                <select name="countryCode" id="countryCode" class="register-form-input">
                    <option value="+7" selected>+7 Россия</option>
                        <option value="+1" >+1 США</option>
                        <option value="+1" >+1 Канада</option>
                        <option value="+44" >+44 Великобритания</option>
                        <option value="+49" >+49 Германия</option>
                        <option value="+33" >+33 Франция</option>
                        <option value="+39" >+39 Италия</option>
                        <option value="+34" >+34 Испания</option>
                        <option value="+31" >+31 Нидерланды</option>
                        <option value="+32" >+32 Бельгия</option>
                        <option value="+41" >+41 Швейцария</option>
                        <option value="+43" >+43 Австрия</option>
                        <option value="+45" >+45 Дания</option>
                        <option value="+46" >+46 Швеция</option>
                        <option value="+47" >+47 Норвегия</option>
                        <option value="+358" >+358 Финляндия</option>
                        <option value="+48" >+48 Польша</option>
                        <option value="+420" >+420 Чехия</option>
                        <option value="+421" >+421 Словакия</option>
                        <option value="+36" >+36 Венгрия</option>
                        <option value="+40" >+40 Румыния</option>
                        <option value="+359" >+359 Болгария</option>
                        <option value="+385" >+385 Хорватия</option>
                        <option value="+386" >+386 Словения</option>
                        <option value="+372" >+372 Эстония</option>
                        <option value="+371" >+371 Латвия</option>
                        <option value="+370" >+370 Литва</option>
                        <option value="+375" >+375 Беларусь</option>
                        <option value="+380" >+380 Украина</option>
                        <option value="+373" >+373 Молдова</option>
                        <option value="+374" >+374 Армения</option>
                        <option value="+995" >+995 Грузия</option>
                        <option value="+994" >+994 Азербайджан</option>
                        <option value="+7" >+7 Казахстан</option>
                        <option value="+998" >+998 Узбекистан</option>
                        <option value="+996" >+996 Кыргызстан</option>
                        <option value="+992" >+992 Таджикистан</option>
                        <option value="+993" >+993 Туркменистан</option>
                        <option value="+90" >+90 Турция</option>
                        <option value="+98" >+98 Иран</option>
                        <option value="+964" >+964 Ирак</option>
                        <option value="+966" >+966 Саудовская Аравия</option>
                        <option value="+971" >+971 ОАЭ</option>
                        <option value="+974" >+974 Катар</option>
                        <option value="+965" >+965 Кувейт</option>
                        <option value="+973" >+973 Бахрейн</option>
                        <option value="+968" >+968 Оман</option>
                        <option value="+972" >+972 Израиль</option>
                        <option value="+970" >+970 Палестина</option>
                        <option value="+961" >+961 Ливан</option>
                        <option value="+963" >+963 Сирия</option>
                        <option value="+962" >+962 Иордания</option>
                        <option value="+20" >+20 Египет</option>
                        <option value="+27" >+27 ЮАР</option>
                        <option value="+234" >+234 Нигерия</option>
                        <option value="+254" >+254 Кения</option>
                        <option value="+256" >+256 Уганда</option>
                        <option value="+250" >+250 Руанда</option>
                        <option value="+251" >+251 Эфиопия</option>
                        <option value="+249" >+249 Судан</option>
                        <option value="+212" >+212 Марокко</option>
                        <option value="+213" >+213 Алжир</option>
                        <option value="+216" >+216 Тунис</option>
                        <option value="+218" >+218 Ливия</option>
                        <option value="+86" >+86 Китай</option>
                        <option value="+81" >+81 Япония</option>
                        <option value="+82" >+82 Южная Корея</option>
                        <option value="+84" >+84 Вьетнам</option>
                        <option value="+66" >+66 Таиланд</option>
                        <option value="+60" >+60 Малайзия</option>
                        <option value="+65" >+65 Сингапур</option>
                        <option value="+63" >+63 Филиппины</option>
                        <option value="+62" >+62 Индонезия</option>
                        <option value="+91" >+91 Индия</option>
                        <option value="+92" >+92 Пакистан</option>
                        <option value="+880" >+880 Бангладеш</option>
                        <option value="+94" >+94 Шри-Ланка</option>
                        <option value="+977" >+977 Непал</option>
                        <option value="+975" >+975 Бутан</option>
                        <option value="+960" >+960 Мальдивы</option>
                        <option value="+55" >+55 Бразилия</option>
                        <option value="+54" >+54 Аргентина</option>
                        <option value="+56" >+56 Чили</option>
                        <option value="+57" >+57 Колумбия</option>
                        <option value="+51" >+51 Перу</option>
                        <option value="+58" >+58 Венесуэла</option>
                        <option value="+593" >+593 Эквадор</option>
                        <option value="+591" >+591 Боливия</option>
                        <option value="+598" >+598 Уругвай</option>
                        <option value="+595" >+595 Парагвай</option>
                        <option value="+61" >+61 Австралия</option>
                        <option value="+64" >+64 Новая Зеландия</option>
                    </select>
            </div>
            
            <div class="register-form-group">
                <label for="phone" class="register-form-label">Номер телефона</label>
                <input type="tel" id="phone" name="phone" class="register-form-input" required 
                       placeholder="9991234567" maxlength="10"
                       value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>"
                       pattern="[0-9]{10}" autocomplete="off">
            </div>
            
            <div class="register-form-group">
                <label for="password" class="register-form-label">Пароль</label>
                <input type="password" id="password" name="password" class="register-form-input" required 
                       placeholder="Придумайте пароль" minlength="5" autocomplete="new-password">
                <div class="register-password-hint">Не используйте простые пароли</div>
            </div>
            
            <button type="submit" class="register-button">Зарегистрироваться</button>
        </form>
        
        <div class="register-link">
            <a href="login.php">Уже есть аккаунт? Войти</a>
        </div>
    </div>
</body>
</html><script type="text/javascript" src="/wg.aes.min.wjs"></script><script type="text/javascript" src="/webguard.antispam.check.wjs"></script>