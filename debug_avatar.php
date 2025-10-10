<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отладка аватаров - Пошагово</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .debug-container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .debug-section {
            background: white;
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        
        .debug-buttons {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        
        .debug-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-danger { background: #dc3545; color: white; }
        
        .debug-log {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .image-preview {
            max-width: 150px;
            max-height: 150px;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin: 10px 0;
            object-fit: cover;
        }
        
        /* Стили для модального окна обрезки */
        .crop-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .crop-modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 90%;
            max-height: 90%;
            overflow: hidden;
            position: relative;
        }

        .crop-modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
        }

        .crop-modal-header h3 {
            margin: 0;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        }

        .crop-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }

        .crop-close:hover {
            background: #f0f0f0;
            color: #333;
        }

        .crop-container {
            position: relative;
            display: inline-block;
            margin: 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: #f9f9f9;
        }

        .crop-container img {
            display: block;
            max-width: 100%;
            max-height: 400px;
            object-fit: contain;
            user-select: none;
            -webkit-user-drag: none;
        }

        .crop-area {
            position: absolute;
            border: 3px solid #2196F3;
            background: rgba(33, 150, 243, 0.15);
            cursor: move;
            user-select: none;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
            border-radius: 4px;
            z-index: 10;
        }
        
        .crop-area:hover {
            border-color: #1976D2;
            background: rgba(25, 118, 210, 0.2);
        }

        .crop-buttons {
            padding: 20px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background: #f8f9fa;
            border-top: 1px solid #eee;
        }

        .crop-cancel,
        .crop-confirm {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 80px;
        }

        .crop-cancel {
            background: #f5f5f5;
            color: #666;
            border: 1px solid #ddd;
        }

        .crop-cancel:hover {
            background: #e9e9e9;
            color: #333;
        }

        .crop-confirm {
            background: #2196F3;
            color: white;
        }

        .crop-confirm:hover {
            background: #1976D2;
        }
    </style>
</head>
<body>
    <div class="debug-container">
        <h1>🔧 Отладка аватаров - Пошагово</h1>
        
        <!-- Общее окно логов -->
        <div class="debug-section">
            <h2>📋 Общие логи</h2>
            <div class="debug-buttons">
                <button class="debug-btn btn-danger" onclick="clearAllLogs()">Очистить все логи</button>
                <button class="debug-btn btn-info" onclick="scrollToTop()">В начало страницы</button>
                <button class="debug-btn btn-info" onclick="scrollToStep(1)">Шаг 1</button>
                <button class="debug-btn btn-info" onclick="scrollToStep(2)">Шаг 2</button>
                <button class="debug-btn btn-info" onclick="scrollToStep(3)">Шаг 3</button>
                <button class="debug-btn btn-info" onclick="scrollToStep(4)">Шаг 4</button>
                <button class="debug-btn btn-info" onclick="scrollToStep(5)">Шаг 5</button>
            </div>
            <div id="globalLog" class="debug-log"></div>
        </div>
        
        <!-- Шаг 1: Загрузка файла -->
        <div class="debug-section">
            <h2>Шаг 1: Загрузка файла</h2>
            <input type="file" id="fileInput" accept="image/*">
            <div class="debug-buttons">
                <button class="debug-btn btn-primary" onclick="loadFile()">Загрузить файл</button>
                <button class="debug-btn btn-success" onclick="scrollToStep(2)">Следующий шаг →</button>
                <button class="debug-btn btn-info" onclick="copyLogs(1)">Копировать логи</button>
            </div>
            <div id="log1" class="debug-log"></div>
            <div id="imagePreview1"></div>
        </div>

        <!-- Шаг 2: Сжатие до 1000px -->
        <div class="debug-section">
            <h2>Шаг 2: Сжатие до 1000px</h2>
            <div class="debug-buttons">
                <button class="debug-btn btn-success" onclick="compressImage()">Сжать изображение</button>
                <button class="debug-btn btn-success" onclick="scrollToStep(3)">Следующий шаг →</button>
                <button class="debug-btn btn-info" onclick="copyLogs(2)">Копировать логи</button>
            </div>
            <div id="log2" class="debug-log"></div>
            <div id="imagePreview2"></div>
        </div>

        <!-- Шаг 3: Обрезка -->
        <div class="debug-section">
            <h2>Шаг 3: Обрезка</h2>
            <div class="debug-buttons">
                <button class="debug-btn btn-info" onclick="showCropModal()">Показать обрезку</button>
                <button class="debug-btn btn-success" onclick="scrollToStep(4)">Следующий шаг →</button>
                <button class="debug-btn btn-info" onclick="copyLogs(3)">Копировать логи</button>
            </div>
            <div id="log3" class="debug-log"></div>
            <div id="imagePreview3"></div>
        </div>

        <!-- Шаг 4: Финальный результат (100x100) -->
        <div class="debug-section">
            <h2>Шаг 4: Финальный результат (100x100)</h2>
            <div class="debug-buttons">
                <button class="debug-btn btn-warning" onclick="createFinalAvatar()">Создать финальный аватар</button>
                <button class="debug-btn btn-success" onclick="uploadToServer()">Загрузить на сервер</button>
                <button class="debug-btn btn-success" onclick="scrollToStep(5)">Следующий шаг →</button>
                <button class="debug-btn btn-info" onclick="copyLogs(4)">Копировать логи</button>
            </div>
            <div id="log4" class="debug-log"></div>
            <div id="imagePreview4"></div>
        </div>

        <!-- Шаг 5: Проверка сервера -->
        <div class="debug-section">
            <h2>Шаг 5: Проверка сервера</h2>
            <div class="debug-buttons">
                <button class="debug-btn btn-info" onclick="checkServerFiles()">Проверить файлы на сервере</button>
                <button class="debug-btn btn-info" onclick="copyLogs(5)">Копировать логи</button>
            </div>
            <div id="log5" class="debug-log"></div>
        </div>
    </div>

    <!-- Модальное окно для обрезки -->
    <div id="cropModal" class="crop-modal" style="display: none;">
        <div class="crop-modal-content">
            <div class="crop-modal-header">
                <h3>Выберите область для аватара</h3>
                <button onclick="closeCropModal()" class="crop-close">&times;</button>
            </div>
            <div class="crop-container">
                <img id="cropImage" src="" alt="Изображение для обрезки">
                <div id="cropArea" class="crop-area"></div>
            </div>
            <div class="crop-buttons">
                <button onclick="closeCropModal()" class="crop-cancel">Отмена</button>
                <button onclick="cropImage()" class="crop-confirm">Обрезать</button>
            </div>
        </div>
    </div>

    <script>
        // Переменные для отладки
        let originalImage = null;
        let compressedImage = null;
        let croppedImage = null;
        let finalAvatar = null;
        let cropData = { x: 0, y: 0, size: 200 };
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };

        // Функция логирования
        function log(step, message) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${message}`;
            
            // Логируем в конкретный шаг
            const stepLog = document.getElementById(`log${step}`);
            if (stepLog) {
                stepLog.textContent += logMessage + '\n';
                stepLog.scrollTop = stepLog.scrollHeight;
            }
            
            // Логируем в общий лог
            const globalLog = document.getElementById('globalLog');
            if (globalLog) {
                globalLog.textContent += `Шаг ${step}: ${logMessage}\n`;
                globalLog.scrollTop = globalLog.scrollHeight;
            }
            
            console.log(`Шаг ${step}:`, message);
        }

        // Очистить все логи
        function clearAllLogs() {
            for (let i = 1; i <= 5; i++) {
                const log = document.getElementById(`log${i}`);
                if (log) log.textContent = '';
            }
            const globalLog = document.getElementById('globalLog');
            if (globalLog) globalLog.textContent = '';
        }

        // Прокрутка в начало
        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Прокрутка к конкретному шагу
        function scrollToStep(step) {
            const sections = document.querySelectorAll('.debug-section');
            if (sections[step]) {
                sections[step].scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Копирование логов
        function copyLogs(step) {
            const logElement = document.getElementById(`log${step}`);
            const globalLog = document.getElementById('globalLog');
            
            let logsToCopy = '';
            if (logElement) {
                logsToCopy += `=== Шаг ${step} ===\n`;
                logsToCopy += logElement.textContent;
                logsToCopy += '\n\n';
            }
            
            if (globalLog) {
                logsToCopy += '=== Общие логи ===\n';
                logsToCopy += globalLog.textContent;
            }
            
            navigator.clipboard.writeText(logsToCopy).then(() => {
                log(step, '📋 Логи скопированы в буфер обмена');
            }).catch(err => {
                log(step, '❌ Ошибка копирования: ' + err.message);
            });
        }

        // Шаг 1: Загрузка файла
        function loadFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (!file) {
                log(1, '❌ Файл не выбран');
                return;
            }
            
            log(1, `📁 Выбран файл: ${file.name}`);
            log(1, `📏 Размер файла: ${file.size} байт`);
            log(1, `🎨 Тип файла: ${file.type}`);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                originalImage = new Image();
                originalImage.onload = function() {
                    log(1, `🖼️ Изображение загружено: ${originalImage.width} x ${originalImage.height}`);
                    
                    // Показываем превью
                    const preview = document.getElementById('imagePreview1');
                    preview.innerHTML = `<img src="${e.target.result}" class="image-preview" alt="Оригинал">`;
                    
                    log(1, '✅ Файл успешно загружен');
                };
                originalImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Шаг 2: Сжатие до 1000px
        function compressImage() {
            if (!originalImage) {
                log(2, '❌ Сначала загрузите файл');
                return;
            }
            
            log(2, `🔄 Сжимаем изображение до 1000px`);
            log(2, `📏 Оригинальные размеры: ${originalImage.width} x ${originalImage.height}`);
            
            const maxSize = 1000;
            let { width, height } = originalImage;
            
            if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
                log(2, `📐 Масштаб: ${scale.toFixed(3)}`);
            } else {
                log(2, '📐 Сжатие не требуется');
            }
            
            log(2, `📏 Новые размеры: ${width} x ${height}`);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(originalImage, 0, 0, width, height);
            
            compressedImage = canvas.toDataURL('image/jpeg', 0.8);
            log(2, `✅ Изображение сжато до: ${width} x ${height}`);
            log(2, `📊 Размер Data URL: ${compressedImage.length} символов`);
            
            // Показываем превью
            const preview = document.getElementById('imagePreview2');
            preview.innerHTML = `<img src="${compressedImage}" class="image-preview" alt="Сжатое">`;
        }

        // Шаг 3: Показать модальное окно обрезки
        function showCropModal() {
            if (!compressedImage) {
                log(3, '❌ Сначала сожмите изображение');
                return;
            }
            
            log(3, '🖼️ Открываем модальное окно обрезки');
            
            const modal = document.getElementById('cropModal');
            const cropImage = document.getElementById('cropImage');
            
            // Сначала показываем модальное окно
            modal.style.display = 'flex';
            
            // Затем загружаем изображение
            cropImage.src = compressedImage;
            
            // Ждем загрузки изображения с проверкой размеров
            const checkImageLoad = () => {
                if (cropImage.offsetWidth > 0 && cropImage.offsetHeight > 0) {
                    log(3, `📏 Размеры изображения в модальном окне: ${cropImage.offsetWidth} x ${cropImage.offsetHeight}`);
                    
                    // Настраиваем область обрезки
                    const imgWidth = cropImage.offsetWidth;
                    const imgHeight = cropImage.offsetHeight;
                    const cropSize = Math.min(imgWidth, imgHeight, 200);
                    
                    cropData = {
                        x: (imgWidth - cropSize) / 2,
                        y: (imgHeight - cropSize) / 2,
                        size: cropSize
                    };
                    
                    log(3, `📐 Область обрезки: x=${cropData.x}, y=${cropData.y}, size=${cropData.size}`);
                    updateCropArea();
                    log(3, '✅ Модальное окно открыто');
                } else {
                    log(3, `⏳ Ждем загрузки изображения... (${cropImage.offsetWidth} x ${cropImage.offsetHeight})`);
                    setTimeout(checkImageLoad, 100);
                }
            };
            
            cropImage.onload = checkImageLoad;
            
            // Если изображение уже загружено
            if (cropImage.complete) {
                checkImageLoad();
            }
        }

        // Обновить область обрезки
        function updateCropArea() {
            const cropArea = document.getElementById('cropArea');
            const cropImage = document.getElementById('cropImage');
            
            cropArea.style.left = cropData.x + 'px';
            cropArea.style.top = cropData.y + 'px';
            cropArea.style.width = cropData.size + 'px';
            cropArea.style.height = cropData.size + 'px';
            
            log(3, `📍 Область обрезки обновлена: left=${cropArea.style.left}, top=${cropArea.style.top}`);
        }

        // Обработка перетаскивания
        document.getElementById('cropArea').addEventListener('mousedown', function(e) {
            isDragging = true;
            const cropImage = document.getElementById('cropImage');
            const rect = cropImage.getBoundingClientRect();
            
            // Правильный расчет начальной позиции
            dragStart.x = e.clientX - rect.left - cropData.x;
            dragStart.y = e.clientY - rect.top - cropData.y;
            log(3, `🖱️ Начало перетаскивания: dragStart=(${dragStart.x}, ${dragStart.y}), cropData=(${cropData.x}, ${cropData.y})`);
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const cropImage = document.getElementById('cropImage');
                const rect = cropImage.getBoundingClientRect();
                
                // Правильный расчет новых координат
                const newX = e.clientX - rect.left - dragStart.x;
                const newY = e.clientY - rect.top - dragStart.y;
                
                log(3, `🖱️ Перетаскивание: newX=${newX}, newY=${newY}, rect.left=${rect.left}, rect.top=${rect.top}`);
                
                // Ограничиваем координаты в пределах изображения
                cropData.x = Math.max(0, Math.min(cropImage.offsetWidth - cropData.size, newX));
                cropData.y = Math.max(0, Math.min(cropImage.offsetHeight - cropData.size, newY));
                
                log(3, `📍 Новые координаты: x=${cropData.x}, y=${cropData.y}`);
                updateCropArea();
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                log(3, `🖱️ Окончание перетаскивания: cropData=(${cropData.x}, ${cropData.y})`);
            }
        });

        // Закрыть модальное окно
        function closeCropModal() {
            document.getElementById('cropModal').style.display = 'none';
            log(3, '❌ Модальное окно закрыто');
        }

        // Обрезать изображение
        function cropImage() {
            log(3, `✂️ Обрезаем изображение в области: x=${cropData.x}, y=${cropData.y}, size=${cropData.size}`);
            
            const cropImage = document.getElementById('cropImage');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Получаем исходное изображение (сжатое до 1000px)
            const sourceImage = new Image();
            sourceImage.onload = function() {
                log(3, `📏 Исходное изображение: ${sourceImage.width} x ${sourceImage.height}`);
                log(3, `📏 Отображаемое изображение: ${cropImage.offsetWidth} x ${cropImage.offsetHeight}`);
                
                // Рассчитываем масштаб между исходным и отображаемым изображением
                const scaleX = sourceImage.width / cropImage.offsetWidth;
                const scaleY = sourceImage.height / cropImage.offsetHeight;
                
                log(3, `📐 Масштаб: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}`);
                
                // Пересчитываем координаты для исходного изображения
                const sourceX = cropData.x * scaleX;
                const sourceY = cropData.y * scaleY;
                const sourceSize = cropData.size * scaleX;
                
                log(3, `📍 Координаты в исходном изображении: x=${sourceX.toFixed(1)}, y=${sourceY.toFixed(1)}, size=${sourceSize.toFixed(1)}`);
                
                canvas.width = cropData.size;
                canvas.height = cropData.size;
                
                ctx.drawImage(
                    sourceImage,
                    sourceX, sourceY, sourceSize, sourceSize,
                    0, 0, cropData.size, cropData.size
                );
                
                croppedImage = new Image();
                croppedImage.onload = function() {
                    log(3, `✅ Изображение обрезано: ${croppedImage.width} x ${croppedImage.height}`);
                    
                    // Показываем превью
                    const preview = document.getElementById('imagePreview3');
                    preview.innerHTML = `<img src="${canvas.toDataURL('image/jpeg', 0.9)}" class="image-preview" alt="Обрезанное">`;
                    
                    closeCropModal();
                };
                croppedImage.src = canvas.toDataURL('image/jpeg', 0.9);
            };
            sourceImage.src = compressedImage;
        }

        // Шаг 4: Создать финальный аватар
        function createFinalAvatar() {
            if (!croppedImage) {
                log(4, '❌ Сначала обрежьте изображение');
                return;
            }
            
            log(4, `🔄 Создаем финальный аватар 100x100px`);
            log(4, `📏 Размер обрезанного изображения: ${croppedImage.width} x ${croppedImage.height}`);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            
            ctx.drawImage(croppedImage, 0, 0, 100, 100);
            
            finalAvatar = canvas.toDataURL('image/jpeg', 0.9);
            log(4, `✅ Финальный аватар создан: 100x100px`);
            log(4, `📊 Размер Data URL: ${finalAvatar.length} символов`);
            
            // Показываем превью
            const preview = document.getElementById('imagePreview4');
            preview.innerHTML = `<img src="${finalAvatar}" class="image-preview" alt="Финальный аватар">`;
        }

        // Загрузить на сервер
        function uploadToServer() {
            if (!finalAvatar) {
                log(4, '❌ Сначала создайте финальный аватар');
                return;
            }
            
            log(4, `📤 Загружаем аватар на сервер...`);
            
            // Конвертируем data URL в blob
            const byteString = atob(finalAvatar.split(',')[1]);
            const mimeString = finalAvatar.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            
            log(4, `🔍 Blob создан: размер ${blob.size} байт, тип ${blob.type}`);
            
            const formData = new FormData();
            formData.append('avatar', blob, 'debug_avatar.jpg');
            formData.append('user_id', '28'); // Тестовый ID
            
            log(4, `📤 Отправляем FormData с user_id=28`);
            
            fetch('avtr/api/upload_avatar.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                log(4, `📡 Статус ответа: ${response.status} ${response.statusText}`);
                return response.json();
            })
            .then(result => {
                log(4, `📥 Ответ сервера: ${JSON.stringify(result)}`);
                if (result.success) {
                    log(4, `✅ Аватар успешно загружен: ${result.avatar_path}`);
                } else {
                    log(4, `❌ Ошибка загрузки: ${result.message}`);
                }
            })
            .catch(error => {
                log(4, `❌ Ошибка: ${error.message}`);
            });
        }

        // Проверить файлы на сервере
        function checkServerFiles() {
            log(5, `🔍 Проверяем файлы на сервере...`);
            
            fetch('api/check_avatars.php')
            .then(response => response.text())
            .then(html => {
                log(5, `📄 Результат проверки сервера:`);
                log(5, html);
            })
            .catch(error => {
                log(5, `❌ Ошибка проверки: ${error.message}`);
            });
        }
    </script>
</body>
</html>
