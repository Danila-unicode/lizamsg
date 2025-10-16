// Система восстановления пароля через SMS.ru обратный звонок
class PasswordReset {
    constructor() {
        this.checkId = null;
        this.phoneNumber = null;
        this.checkInterval = null;
        this.init();
    }

    init() {
        // Обработчик формы ввода номера
        document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.requestPasswordReset();
        });

        // Обработчик кнопки звонка (если существует)
        const callBtn = document.getElementById('callButton');
        if (callBtn) {
            callBtn.addEventListener('click', () => {
                this.makeCall();
            });
        }

        // Обработчик кнопки копирования пароля (если существует)
        const copyPasswordBtn = document.getElementById('copyPassword');
        if (copyPasswordBtn) {
            copyPasswordBtn.addEventListener('click', () => {
                this.copyPassword();
            });
        }

        // Обработчик кнопки входа (если существует)
        const loginBtn = document.getElementById('loginButton');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.goToLogin();
            });
        }

        // Обработчик кнопки сохранения пароля добавляется динамически в showPasswordForm()
    }

    async requestPasswordReset() {
        const phoneInput = document.getElementById('phoneNumber');
        const phoneNumber = phoneInput.value.trim();

        console.log('=== REQUEST PASSWORD RESET START ===');
        console.log('Phone input:', phoneNumber);

        if (!phoneNumber) {
            this.showError('Введите номер телефона');
            return;
        }

        // Валидация номера телефона
        if (!this.validatePhone(phoneNumber)) {
            this.showError('Введите корректный номер телефона');
            return;
        }

        this.phoneNumber = phoneNumber;
        console.log('Phone number stored:', this.phoneNumber);
        this.showLoading('Отправка запроса...');

        try {
            const response = await fetch('api/request_password_reset.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phoneNumber })
            });

            const data = await response.json();
            console.log('API response:', data);

            if (data.success) {
                this.checkId = data.check_id;
                console.log('Check ID stored:', this.checkId);
                this.showCallStep(data.call_phone);
                this.startStatusChecking();
            } else {
                this.showError(data.message || 'Ошибка при отправке запроса');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Ошибка соединения. Попробуйте позже.');
        }
    }

    showCallStep(callPhone) {
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        document.getElementById('callNumber').textContent = callPhone;
    }

    makeCall() {
        const callNumber = document.getElementById('callNumber').textContent;
        // Создаем ссылку для звонка
        const callLink = `tel:${callNumber.replace(/[^\d+]/g, '')}`;
        window.open(callLink, '_self');
    }

    startStatusChecking() {
        // Даем пользователю время позвонить - начинаем проверку через 10 секунд
        setTimeout(() => {
            // Проверяем статус каждые 2 секунды
            this.checkInterval = setInterval(() => {
                this.checkCallStatus();
            }, 2000);
        }, 10000); // 10 секунд задержки

        // Автоматически останавливаем проверку через 5 минут
        setTimeout(() => {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
                this.showError('Время ожидания истекло. Попробуйте снова.');
            }
        }, 300000); // 5 минут
    }

    async checkCallStatus() {
        if (!this.checkId || !this.checkInterval) {
            console.log('Check call status stopped - no checkId or interval cleared');
            return;
        }

        console.log('=== CHECKING CALL STATUS ===');
        console.log('Check ID:', this.checkId);

        try {
            const response = await fetch('api/check_call_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ check_id: this.checkId })
            });

            const data = await response.json();
            console.log('Call status response:', data);

            if (data.success) {
                if (data.status === 'confirmed') {
                    console.log('Call confirmed! Showing password form...');
                    if (this.checkInterval) {
                        clearInterval(this.checkInterval);
                        this.checkInterval = null;
                        console.log('Check interval cleared');
                    }
                    // Только после подтверждения номера показываем форму для ввода пароля
                    this.showPasswordForm();
                } else if (data.status === 'expired') {
                    console.log('Call expired');
                    if (this.checkInterval) {
                        clearInterval(this.checkInterval);
                        this.checkInterval = null;
                    }
                    this.showError('Время ожидания истекло. Попробуйте снова.');
                } else {
                    console.log('Call status:', data.status, '- waiting...');
                }
            }
        } catch (error) {
            console.error('Ошибка проверки статуса:', error);
        }
    }

    showPasswordForm() {
        console.log('=== SHOW PASSWORD FORM ===');
        console.log('Phone number:', this.phoneNumber);
        
        // Показываем форму для ввода нового пароля
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'block';
        
        // Очищаем поле пароля
        document.getElementById('newPasswordInput').value = '';
        document.getElementById('confirmPasswordInput').value = '';
        
        // Добавляем обработчик кнопки сохранения пароля
        const saveBtn = document.getElementById('savePasswordBtn');
        console.log('Looking for savePasswordBtn:', saveBtn);
        
        if (saveBtn) {
            // Удаляем старый обработчик если есть
            saveBtn.removeEventListener('click', this.saveNewPassword);
            // Добавляем новый обработчик
            saveBtn.addEventListener('click', () => {
                console.log('Save password button clicked!');
                this.saveNewPassword();
            });
            console.log('Save password button handler added');
        } else {
            console.error('Save password button not found!');
            console.log('Available elements with IDs:');
            const allElements = document.querySelectorAll('[id]');
            allElements.forEach(el => {
                console.log('Element ID:', el.id);
            });
        }
        
        // Добавляем обработчик Enter в полях пароля
        const newPasswordInput = document.getElementById('newPasswordInput');
        const confirmPasswordInput = document.getElementById('confirmPasswordInput');
        
        if (newPasswordInput) {
            newPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveNewPassword();
                }
            });
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveNewPassword();
                }
            });
        }
    }

    async saveNewPassword() {
        const newPassword = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;

        console.log('=== SAVE NEW PASSWORD ===');
        console.log('New password length:', newPassword.length);

        if (!newPassword) {
            this.showError('Введите новый пароль');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('Пароли не совпадают');
            return;
        }

        this.showLoading('Сохранение нового пароля...');

        try {
            const response = await fetch('api/save_new_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `new_password=${encodeURIComponent(newPassword)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Save password response:', data);

            if (data.success) {
                console.log('Password saved successfully');
                this.showSuccessMessage();
            } else {
                console.error('Password save failed:', data.message);
                this.showError(data.message || 'Ошибка при сохранении пароля');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Ошибка соединения. Попробуйте позже.');
        }
    }

    showSuccessMessage() {
        document.getElementById('step3').style.display = 'none';
        document.getElementById('step4').style.display = 'block';
    }

    showSuccessStep(newPassword) {
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'block';
        document.getElementById('newPassword').value = newPassword;
    }

    copyPassword() {
        const passwordInput = document.getElementById('newPassword');
        passwordInput.select();
        document.execCommand('copy');
        
        // Показываем уведомление о копировании
        const button = document.getElementById('copyPassword');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    goToLogin() {
        window.location.href = 'login.php';
    }

    validatePhone(phone) {
        // Простая валидация российского номера
        const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        return phoneRegex.test(phone);
    }

    showLoading(message) {
        // Можно добавить индикатор загрузки
        console.log('Loading:', message);
    }

    showError(message) {
        alert(message); // В будущем можно заменить на красивые уведомления
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PasswordReset();
});
