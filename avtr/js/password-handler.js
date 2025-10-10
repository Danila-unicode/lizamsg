// Функция смены пароля
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Валидация
    if (!currentPassword) {
        alert('Введите текущий пароль');
        return;
    }
    
    if (!newPassword) {
        alert('Введите новый пароль');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Новый пароль должен содержать минимум 6 символов');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Новые пароли не совпадают');
        return;
    }
    
    if (currentPassword === newPassword) {
        alert('Новый пароль должен отличаться от текущего');
        return;
    }
    
    // Получаем ID пользователя
    const userData = localStorage.getItem('userData');
    let userId = null;
    if (userData) {
        const data = JSON.parse(userData);
        userId = data.userId;
    }
    
    if (!userId) {
        alert('Ошибка: ID пользователя не найден');
        return;
    }
    
    // Отключаем кнопку на время запроса
    const btn = document.querySelector('.change-password-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    
    // Отправляем запрос на смену пароля
    fetch('avtr/api/change_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user_id=${userId}&current_password=${encodeURIComponent(currentPassword)}&new_password=${encodeURIComponent(newPassword)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Очищаем поля
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            showNotification('Пароль успешно изменен!', 'success');
        } else {
            showNotification('Ошибка смены пароля: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка сети:', error);
        showNotification('Ошибка сети при смене пароля', 'error');
    })
    .finally(() => {
        // Восстанавливаем кнопку
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Сохранить пароль';
    });
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Добавляем стили для уведомления
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .custom-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                min-width: 300px;
                background: #2c3e50;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .notification-icon i.fa-check-circle {
                color: #27ae60;
            }
            
            .notification-icon i.fa-exclamation-circle {
                color: #e74c3c;
            }
            
            .notification-icon i.fa-info-circle {
                color: #3498db;
            }
            
            .notification-message {
                flex: 1;
                color: white;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #bdc3c7;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}
