<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Личный кабинет - LizaApp</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="avtr/css/avatar-styles.css">
    <link rel="stylesheet" href="avtr/css/password-styles.css">
    <link rel="stylesheet" href="avtr/css/profile-styles.css?v=2">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        // Переменные для аватара
        let originalImage = null;
        let compressedImage = null;
        let cropData = { x: 0, y: 0, size: 200 };
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };

        // Инициализация
        document.addEventListener('DOMContentLoaded', function() {
            console.log('AvatarHandler инициализирован');
            console.log('localStorage userId:', localStorage.getItem('userId'));
            console.log('localStorage userData:', localStorage.getItem('userData'));
            
            const uploadBtn = document.getElementById('uploadAvatarBtn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    document.getElementById('avatarInput').click();
                });
            }

            const avatarInput = document.getElementById('avatarInput');
            if (avatarInput) {
                avatarInput.addEventListener('change', handleFileSelect);
            }
        });

        // Шаг 1: Обработка выбора файла
        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            console.log('Начинаем обработку аватара:', file.name);

            const reader = new FileReader();
            reader.onload = (e) => {
                originalImage = new Image();
                originalImage.onload = () => {
                    console.log('Изображение загружено:', originalImage.width, 'x', originalImage.height);
                    compressImage(); // Автоматически сжимаем
                };
                originalImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Шаг 2: Автоматическое сжатие до 1000px
        function compressImage() {
            console.log('Сжимаем изображение до 1000px');
            console.log('Оригинальные размеры:', originalImage.width, 'x', originalImage.height);
            
            const maxSize = 1000;
            let { width, height } = originalImage;
            
            if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
                console.log('Масштаб:', scale.toFixed(3));
            } else {
                console.log('Сжатие не требуется');
            }
            
            console.log('Новые размеры:', width, 'x', height);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(originalImage, 0, 0, width, height);
            
            compressedImage = canvas.toDataURL('image/jpeg', 0.8);
            console.log('Изображение сжато до:', width, 'x', height);
            
            // Автоматически показываем модальное окно обрезки
            showCropModal();
        }

        // Шаг 3: Показать модальное окно обрезки
        function showCropModal() {
            console.log('Открываем модальное окно обрезки');
            
            // Удаляем существующее модальное окно если есть
            const existingModal = document.getElementById('cropModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Создаем модальное окно
            const modal = document.createElement('div');
            modal.id = 'cropModal';
            modal.className = 'crop-modal';
            modal.innerHTML = `
                <div class="crop-modal-content">
                    <div class="crop-modal-header">
                        <h3>Выберите область для аватара</h3>
                        <button onclick="closeCropModal()" class="crop-close">&times;</button>
                    </div>
                    <div class="crop-container">
                        <img id="cropImage" src="${compressedImage}" alt="Изображение для обрезки">
                        <div id="cropArea" class="crop-area"></div>
                    </div>
                    <div class="crop-buttons">
                        <button onclick="closeCropModal()" class="crop-cancel">Отмена</button>
                        <button onclick="cropAndUpload()" class="crop-confirm">Обрезать</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const cropImage = document.getElementById('cropImage');
            const cropArea = document.getElementById('cropArea');
            
            // Ждем загрузки изображения
            const checkImageLoad = () => {
                if (cropImage.offsetWidth > 0 && cropImage.offsetHeight > 0) {
                    console.log('Размеры изображения в модальном окне:', cropImage.offsetWidth, 'x', cropImage.offsetHeight);
                    
                    // Настраиваем область обрезки
                    const imgWidth = cropImage.offsetWidth;
                    const imgHeight = cropImage.offsetHeight;
                    const cropSize = Math.min(imgWidth, imgHeight, 200);
                    
                    cropData = {
                        x: (imgWidth - cropSize) / 2,
                        y: (imgHeight - cropSize) / 2,
                        size: cropSize
                    };
                    
                    console.log('Область обрезки:', cropData);
                    updateCropArea();
                    setupCropEventListeners();
                } else {
                    console.log('Ждем загрузки изображения...');
                    setTimeout(checkImageLoad, 100);
                }
            };
            
            cropImage.onload = checkImageLoad;
            if (cropImage.complete) {
                checkImageLoad();
            }
        }

        // Обновить область обрезки
        function updateCropArea() {
            const cropArea = document.getElementById('cropArea');
            if (!cropArea) return;
            
            cropArea.style.left = cropData.x + 'px';
            cropArea.style.top = cropData.y + 'px';
            cropArea.style.width = cropData.size + 'px';
            cropArea.style.height = cropData.size + 'px';
        }

        // Настройка обработчиков событий
        function setupCropEventListeners() {
            const cropArea = document.getElementById('cropArea');
            if (!cropArea) return;
            
            // Обработка перетаскивания
            cropArea.addEventListener('mousedown', function(e) {
                isDragging = true;
                const cropImage = document.getElementById('cropImage');
                const rect = cropImage.getBoundingClientRect();
                
                dragStart.x = e.clientX - rect.left - cropData.x;
                dragStart.y = e.clientY - rect.top - cropData.y;
                console.log('Начало перетаскивания:', dragStart);
            });

            document.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    const cropImage = document.getElementById('cropImage');
                    const rect = cropImage.getBoundingClientRect();
                    
                    const newX = e.clientX - rect.left - dragStart.x;
                    const newY = e.clientY - rect.top - dragStart.y;
                    
                    cropData.x = Math.max(0, Math.min(cropImage.offsetWidth - cropData.size, newX));
                    cropData.y = Math.max(0, Math.min(cropImage.offsetHeight - cropData.size, newY));
                    
                    updateCropArea();
                }
            });

            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    console.log('Окончание перетаскивания:', cropData);
                }
            });
        }

        // Закрыть модальное окно
        function closeCropModal() {
            const modal = document.getElementById('cropModal');
            if (modal) {
                modal.remove();
            }
        }

        // Шаги 4-6: Автоматическая обрезка, сжатие до 100x100 и загрузка
        function cropAndUpload() {
            console.log('Начинаем обрезку и загрузку');
            
            const cropImage = document.getElementById('cropImage');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;

            // Получаем исходное изображение (сжатое до 1000px)
            const sourceImage = new Image();
            sourceImage.onload = function() {
                console.log('Исходное изображение:', sourceImage.width, 'x', sourceImage.height);
                console.log('Отображаемое изображение:', cropImage.offsetWidth, 'x', cropImage.offsetHeight);
                
                // Рассчитываем масштаб между исходным и отображаемым изображением
                const scaleX = sourceImage.width / cropImage.offsetWidth;
                const scaleY = sourceImage.height / cropImage.offsetHeight;
                
                console.log('Масштаб: scaleX=' + scaleX.toFixed(3) + ', scaleY=' + scaleY.toFixed(3));
                
                // Пересчитываем координаты для исходного изображения
                const sourceX = cropData.x * scaleX;
                const sourceY = cropData.y * scaleY;
                const sourceSize = cropData.size * scaleX;
                
                console.log('Координаты в исходном изображении: x=' + sourceX.toFixed(1) + ', y=' + sourceY.toFixed(1) + ', size=' + sourceSize.toFixed(1));
                
                // Финальное сжатие до 100x100
                ctx.drawImage(
                    sourceImage,
                    sourceX, sourceY, sourceSize, sourceSize,
                    0, 0, 100, 100
                );

                const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                uploadAvatar(finalDataUrl);
            };
            sourceImage.src = compressedImage;
        }

        // Загрузка на сервер
        function uploadAvatar(dataUrl) {
            console.log('Загружаем аватар на сервер');
            
            // Конвертируем Data URL в Blob
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            
            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.jpg');
            // Получаем ID пользователя из userData
            const userData = localStorage.getItem('userData');
            let userId = null;
            if (userData) {
                const data = JSON.parse(userData);
                userId = data.userId;
            }
            console.log('ID пользователя из userData:', userId);
            formData.append('user_id', userId);
            
            fetch('avtr/api/upload_avatar.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Аватар успешно загружен:', data.avatar_path);
                    // Обновляем аватар на странице
                    if (window.updateAvatarAfterUpload) {
                        window.updateAvatarAfterUpload(data.avatar_path);
                    }
                    closeCropModal();
                } else {
                    console.error('Ошибка загрузки аватара:', data.message);
                    alert('Ошибка загрузки аватара: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Ошибка сети при загрузке аватара:', error);
                alert('Ошибка сети при загрузке аватара.');
            });
        }

        // Функции для редактирования статуса
        function toggleStatusEdit() {
            const statusDisplay = document.getElementById('userStatus');
            const statusEdit = document.getElementById('statusEdit');
            const statusInput = document.getElementById('statusInput');
            
            // Скрываем отображение статуса и показываем поле редактирования
            statusDisplay.parentElement.style.display = 'none';
            statusEdit.style.display = 'flex';
            
            // Заполняем поле текущим статусом
            statusInput.value = statusDisplay.textContent;
            statusInput.focus();
            statusInput.select();
        }
        
        // Мобильная функция переключения статуса
        function toggleMobileStatus() {
            const statusDisplay = document.getElementById('userStatus');
            const statusEdit = document.getElementById('statusEdit');
            const statusInput = document.getElementById('statusInput');
            const mobileBtn = document.getElementById('mobileStatusBtn');
            
            if (statusEdit.style.display === 'none' || statusEdit.style.display === '') {
                // Переключаемся в режим редактирования
                statusDisplay.parentElement.style.display = 'none';
                statusEdit.style.display = 'flex';
                statusInput.value = statusDisplay.textContent;
                statusInput.focus();
                statusInput.select();
                
                // Меняем кнопку на "Сохранить"
                mobileBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
                mobileBtn.onclick = saveMobileStatus;
            } else {
                // Сохраняем изменения
                saveMobileStatus();
            }
        }
        
        // Мобильная функция сохранения
        function saveMobileStatus() {
            const statusInput = document.getElementById('statusInput');
            const newStatus = statusInput.value.trim();
            
            if (!newStatus) {
                showNotification('Статус не может быть пустым', 'error');
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
                showNotification('Ошибка: ID пользователя не найден', 'error');
                return;
            }
            
            // Отправляем запрос на обновление статуса
            fetch('avtr/api/update_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `user_id=${userId}&user_status=${encodeURIComponent(newStatus)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновляем отображение статуса
                    document.getElementById('userStatus').textContent = newStatus;
                    
                    // Возвращаемся к режиму просмотра
                    const statusDisplay = document.getElementById('userStatus');
                    const statusEdit = document.getElementById('statusEdit');
                    const mobileBtn = document.getElementById('mobileStatusBtn');
                    
                    statusDisplay.parentElement.style.display = 'flex';
                    statusEdit.style.display = 'none';
                    
                    // Меняем кнопку обратно на "Изменить"
                    mobileBtn.innerHTML = '<i class="fas fa-edit"></i> Изменить';
                    mobileBtn.onclick = toggleMobileStatus;
                    
                    showNotification('Статус успешно обновлен!', 'success');
                } else {
                    showNotification('Ошибка обновления статуса: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка сети:', error);
                showNotification('Ошибка сети при обновлении статуса', 'error');
            });
        }

        function cancelStatusEdit() {
            const statusDisplay = document.getElementById('userStatus');
            const statusEdit = document.getElementById('statusEdit');
            
            // Показываем отображение статуса и скрываем поле редактирования
            statusDisplay.parentElement.style.display = 'flex';
            statusEdit.style.display = 'none';
        }

        function saveStatus() {
            const statusInput = document.getElementById('statusInput');
            const newStatus = statusInput.value.trim();
            
            if (!newStatus) {
                showNotification('Статус не может быть пустым', 'error');
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
                showNotification('Ошибка: ID пользователя не найден', 'error');
                return;
            }
            
            // Отправляем запрос на обновление статуса
            fetch('avtr/api/update_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `user_id=${userId}&user_status=${encodeURIComponent(newStatus)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновляем отображение статуса
                    document.getElementById('userStatus').textContent = newStatus;
                    cancelStatusEdit();
                } else {
                    showNotification('Ошибка обновления статуса: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка сети:', error);
                showNotification('Ошибка сети при обновлении статуса', 'error');
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

    </script>
    <script src="avtr/js/password-handler.js"></script>
</head>
<body class="register-body">
    <div class="profile-container">
        <!-- Заголовок -->
        <div class="profile-header">
            <h1 class="profile-title">Личная информация</h1>
            <p class="profile-subtitle">Управляйте своим именем, аватаром и личным статусом.</p>
        </div>

        <!-- Личная информация -->
        <div class="profile-section">
            <h2 class="section-title">
                <i class="fas fa-user"></i> Личная информация
            </h2>
            <p class="section-description">Управляйте своим именем, аватаром и личным статусом.</p>
            
            <div class="user-info-section">
                <div id="currentAvatar" class="user-avatar-large">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <h3 class="user-name" id="userPhone">Загрузка...</h3>
                    <p class="user-username">@<span id="userCreatedAt">Загрузка...</span></p>
                </div>
            </div>

            <!-- Статус пользователя -->
            <div class="status-section">
                <p class="status-label">Личное сообщение статуса</p>
                <div class="status-display">
                    <div class="status-container">
                        <p class="current-status" id="userStatus">Загрузка...</p>
                        <button class="edit-status-btn" id="editStatusBtn" onclick="toggleStatusEdit()">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="status-edit" id="statusEdit" style="display: none;">
                        <input type="text" id="statusInput" class="status-input" placeholder="Введите ваше сообщение статуса">
                        <button class="save-status-btn" id="saveStatusBtn" onclick="saveStatus()">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="cancel-status-btn" id="cancelStatusBtn" onclick="cancelStatusEdit()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Мобильные кнопки для статуса -->
                <div class="mobile-status-buttons">
                    <button class="mobile-status-btn" id="mobileStatusBtn" onclick="toggleMobileStatus()">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                </div>
            </div>
        </div>

        <!-- Аватар -->
        <div class="profile-section">
            <h2 class="section-title">
                <i class="fas fa-image"></i> Аватар
            </h2>
            <p class="section-description">Обновите свою фотографию профиля.</p>
            
            <div class="avatar-section">
                <div class="avatar-display">
                    <div id="currentAvatar" class="avatar-placeholder">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="avatar-upload">
                        <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                        <button id="uploadAvatarBtn" class="upload-btn">
                            <i class="fas fa-upload"></i> Изменить аватар
                        </button>
                        <p id="avatarStatus" class="avatar-status" style="display: none;"></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Безопасность аккаунта -->
        <div class="profile-section">
            <h2 class="section-title">
                <i class="fas fa-shield-alt"></i> Безопасность аккаунта
            </h2>
            <p class="section-description">Управляйте своим паролем и другими настройками безопасности.</p>
            
            <div class="password-section">
                <div class="password-field">
                    <label for="currentPassword">Текущий пароль</label>
                    <input type="password" id="currentPassword" class="password-input" placeholder="Введите текущий пароль">
                </div>
                <div class="password-field">
                    <label for="newPassword">Новый пароль</label>
                    <input type="password" id="newPassword" class="password-input" placeholder="Введите новый пароль">
                </div>
                <div class="password-field">
                    <label for="confirmPassword">Подтвердите новый пароль</label>
                    <input type="password" id="confirmPassword" class="password-input" placeholder="Подтвердите новый пароль">
                </div>
                <div class="password-field">
                    <button class="change-password-btn" onclick="changePassword()">
                        <i class="fas fa-key"></i> Изменить пароль
                    </button>
                </div>
            </div>
        </div>

        <!-- Навигация -->
        <div class="profile-navigation">
            <button onclick="goBackToApp()" class="nav-button return">
                <i class="fas fa-arrow-left"></i> Вернуться к чату
            </button>
        </div>
    </div>


    <script>
        // Загружаем данные пользователя из БД
        function loadUserData() {
            const userData = localStorage.getItem('userData');
            if (!userData) {
                document.getElementById('userPhone').textContent = 'Неизвестно';
                document.getElementById('userCreatedAt').textContent = 'Неизвестно';
                return;
            }

            const data = JSON.parse(userData);
            const userId = data.userId;
            const username = data.username;

            // Показываем номер телефона из localStorage
            document.getElementById('userPhone').textContent = username || 'Неизвестно';

            // Загружаем данные из БД
            fetch(`avtr/api/get_user_data.php?user_id=${userId}`)
                .then(response => response.json())
                .then(result => {
                    console.log('Данные пользователя:', result);
                    console.log('Аватар пользователя:', result.user?.avatar_path);
                    if (result.success) {
                        // Форматируем дату регистрации
                        const createdDate = new Date(result.user.created_at);
                        const formattedDate = createdDate.toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        document.getElementById('userCreatedAt').textContent = formattedDate;
                        
                        // Отображаем статус из БД
                        document.getElementById('userStatus').textContent = result.user.user_status || 'Соединение установлено';
                        
                        // Отображаем аватар если есть
                        if (result.user.avatar_path) {
                            updateAvatarAfterUpload(result.user.avatar_path);
                        } else {
                            updateAvatarAfterUpload(null);
                        }
                    } else {
                        document.getElementById('userCreatedAt').textContent = 'Ошибка загрузки';
                        document.getElementById('userStatus').textContent = 'Ошибка загрузки';
                    }
                })
                .catch(error => {
                    document.getElementById('userCreatedAt').textContent = 'Ошибка загрузки';
                    document.getElementById('userStatus').textContent = 'Ошибка загрузки';
                });
        }

        // Возврат к приложению
        function goBackToApp() {
            window.location.href = 'simple-signal-test-websocket-external-js.html';
        }

        // Функция для обновления аватара после загрузки
        function updateAvatarAfterUpload(avatarPath) {
            const avatarElements = document.querySelectorAll('#currentAvatar');
            const statusElement = document.getElementById('avatarStatus');
            
            avatarElements.forEach(avatarElement => {
                if (avatarPath) {
                    avatarElement.innerHTML = `<img src="${avatarPath}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                } else {
                    avatarElement.innerHTML = '<i class="fas fa-user-circle"></i>';
                }
            });
            
            // Скрываем статус аватара
            if (statusElement) {
                statusElement.style.display = 'none';
            }
        }


        // Глобальная функция для обновления аватара (вызывается из avatar-handler.js)
        window.updateAvatarAfterUpload = updateAvatarAfterUpload;

        // Загружаем данные при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            loadUserData();
        });
    </script>

</body>
</html>
