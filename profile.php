<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Личный кабинет - LizaApp</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="avtr/css/avatar-styles.css">
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
                    alert('Аватар успешно загружен!');
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
    </script>
</head>
<body class="register-body">
    <div class="register-container">
        <h1 class="register-title">
            <i class="fas fa-user-cog"></i> Личный кабинет
        </h1>
        
        <div class="profile-info">
            <p><strong>Номер телефона:</strong> <span id="userPhone">Загрузка...</span></p>
            <p><strong>Дата регистрации:</strong> <span id="userCreatedAt">Загрузка...</span></p>
        </div>

        <!-- Статус пользователя -->
        <div class="profile-section">
            <h2><i class="fas fa-comment"></i> Мой статус</h2>
            <div class="status-display">
                <p class="current-status" id="userStatus">Загрузка...</p>
            </div>
        </div>

        <!-- Аватар -->
        <div class="profile-section">
            <h2><i class="fas fa-image"></i> Аватар</h2>
            <div class="avatar-display">
                <div id="currentAvatar" class="avatar-placeholder">
                    <i class="fas fa-user-circle"></i>
                </div>
                <p id="avatarStatus">Аватар не установлен</p>
            </div>
            
            <div class="avatar-upload">
                <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                <button id="uploadAvatarBtn" class="upload-btn">
                    <i class="fas fa-upload"></i> Загрузить аватар
                </button>
            </div>
        </div>

        <!-- Навигация -->
        <div class="profile-navigation">
            <button onclick="goBackToApp()" class="register-button" style="background: #4CAF50;">
                <i class="fas fa-arrow-left"></i> Вернуться к общению
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
            const avatarElement = document.getElementById('currentAvatar');
            const statusElement = document.getElementById('avatarStatus');
            
            if (avatarPath) {
                avatarElement.innerHTML = `<img src="${avatarPath}" alt="Аватар" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`;
                statusElement.textContent = 'Аватар установлен';
            } else {
                avatarElement.innerHTML = '<i class="fas fa-user-circle"></i>';
                statusElement.textContent = 'Аватар не установлен';
            }
        }

        // Глобальная функция для обновления аватара (вызывается из avatar-handler.js)
        window.updateAvatarAfterUpload = updateAvatarAfterUpload;

        // Загружаем данные при загрузке страницы
        document.addEventListener('DOMContentLoaded', loadUserData);
    </script>

    <style>
        .profile-loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .profile-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #4CAF50;
        }

        .profile-info p {
            margin: 0;
            color: #333;
            font-size: 16px;
        }

        .profile-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
        }

        .profile-section h2 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 8px;
        }

        .status-display {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }

        .current-status {
            margin: 0;
            font-size: 16px;
            color: #333;
            font-style: italic;
        }

        .avatar-display {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }

        .avatar-placeholder {
            font-size: 80px;
            color: #ccc;
            margin-bottom: 10px;
        }

        .avatar-display p {
            margin: 0;
            color: #666;
        }

        .profile-navigation {
            text-align: center;
            margin-top: 20px;
        }

        .profile-navigation button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .profile-navigation button:hover {
            background: #45a049;
            transform: translateY(-1px);
        }

    </style>
</body>
</html>
