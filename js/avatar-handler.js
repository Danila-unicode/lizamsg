class AvatarHandler {
    constructor() {
        this.cropData = { x: 0, y: 0, size: 100 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.originalImage = null;
        this.compressedImage = null;
        this.cropModal = null;
        this.cropArea = null;
        this.cropImage = null;
    }

    // Инициализация обработчиков
    init() {
        console.log('AvatarHandler инициализирован');
        
        // Обработчик для кнопки загрузки аватара
        const uploadBtn = document.getElementById('uploadAvatarBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('avatarInput').click();
            });
        }

        // Обработчик для выбора файла
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }
    }

    // Обработка выбора файла
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('Начинаем обработку аватара:', file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            this.originalImage = new Image();
            this.originalImage.onload = () => {
                console.log('Изображение загружено:', this.originalImage.width, 'x', this.originalImage.height);
                this.compressImage();
            };
            this.originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Сжатие изображения до 1000px
    compressImage() {
        console.log('Сжимаем изображение до 1000px');
        console.log('Оригинальное изображение:', this.originalImage.width, 'x', this.originalImage.height);

        const maxSize = 1000;
        let { width, height } = this.originalImage;
        
        if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
        }

        console.log('Масштаб:', Math.min(maxSize / this.originalImage.width, maxSize / this.originalImage.height));
        console.log('Новые размеры:', width, 'x', height);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(this.originalImage, 0, 0, width, height);

        this.compressedImage = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Сжатое изображение загружено:', width, 'x', height);
        console.log('Data URL длина:', this.compressedImage.length);

        this.showCropModal();
    }

    // Показать модальное окно обрезки
    showCropModal() {
        console.log('Открываем модальное окно обрезки');
        
        // Удаляем существующее модальное окно если есть
        const existingModal = document.getElementById('cropModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Создаем модальное окно
        this.cropModal = document.createElement('div');
        this.cropModal.id = 'cropModal';
        this.cropModal.className = 'crop-modal';
        this.cropModal.innerHTML = `
            <div class="crop-modal-content">
                <div class="crop-modal-header">
                    <h3>Выберите область для аватара</h3>
                    <button class="crop-close" id="cropClose">&times;</button>
                </div>
                <div class="crop-container">
                    <img id="cropImage" src="${this.compressedImage}" alt="Изображение для обрезки">
                    <div class="crop-area" id="cropArea"></div>
                </div>
                <div class="crop-buttons">
                    <button class="crop-cancel" id="cropCancel">Отмена</button>
                    <button class="crop-confirm" id="cropConfirm">Обрезать</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.cropModal);

        // Получаем элементы
        this.cropImage = document.getElementById('cropImage');
        this.cropArea = document.getElementById('cropArea');

        // Ждем загрузки изображения
        this.cropImage.onload = () => {
            console.log('Изображение загружено в img:', this.cropImage.naturalWidth, 'x', this.cropImage.naturalHeight);
            console.log('Видимый размер img:', this.cropImage.offsetWidth, 'x', this.cropImage.offsetHeight);
            
            // Ждем пока изображение полностью отобразится
            this.waitForImageLoad();
        };

        // Обработчики событий
        this.setupCropEventListeners();
    }

    // Ждем полной загрузки изображения
    waitForImageLoad() {
        const checkSize = () => {
            if (this.cropImage.offsetWidth > 0 && this.cropImage.offsetHeight > 0) {
                console.log('Изображение полностью загружено, размер:', this.cropImage.offsetWidth, 'x', this.cropImage.offsetHeight);
                this.setupCropArea();
            } else {
                setTimeout(checkSize, 50);
            }
        };
        checkSize();
    }

    // Настройка области обрезки
    setupCropArea() {
        const imgWidth = this.cropImage.offsetWidth;
        const imgHeight = this.cropImage.offsetHeight;
        
        // Размер области обрезки (квадрат)
        const cropSize = Math.min(imgWidth, imgHeight, 200);
        this.cropData.size = cropSize;
        
        // Позиция по центру
        this.cropData.x = (imgWidth - cropSize) / 2;
        this.cropData.y = (imgHeight - cropSize) / 2;
        
        console.log('Область обрезки настроена:', this.cropData);
        this.updateCropArea();
    }

    // Обновление позиции области обрезки
    updateCropArea() {
        if (!this.cropArea) return;
        
        this.cropArea.style.left = this.cropData.x + 'px';
        this.cropArea.style.top = this.cropData.y + 'px';
        this.cropArea.style.width = this.cropData.size + 'px';
        this.cropArea.style.height = this.cropData.size + 'px';
        
        console.log('Область обрезки обновлена:', this.cropData);
    }

    // Настройка обработчиков событий
    setupCropEventListeners() {
        // Закрытие модального окна
        document.getElementById('cropClose').addEventListener('click', () => {
            this.closeCropModal();
        });

        document.getElementById('cropCancel').addEventListener('click', () => {
            this.closeCropModal();
        });

        // Подтверждение обрезки
        document.getElementById('cropConfirm').addEventListener('click', () => {
            this.cropAndUpload();
        });

        // Обработчик начала перетаскивания
        this.cropArea.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });

        // Обработчик движения мыши
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleMouseMove(e);
            }
        });

        // Обработчик окончания перетаскивания
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.handleMouseUp();
            }
        });
    }

    // Обработка начала перетаскивания
    handleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        this.dragStart.x = e.clientX - this.cropData.x;
        this.dragStart.y = e.clientY - this.cropData.y;
    }

    // Обработка движения мыши
    handleMouseMove(e) {
        if (!this.isDragging) return;

        const rect = this.cropImage.getBoundingClientRect();
        const newX = e.clientX - rect.left - this.dragStart.x;
        const newY = e.clientY - rect.top - this.dragStart.y;

        // Ограничиваем область в пределах изображения
        this.cropData.x = Math.max(0, Math.min(this.cropImage.offsetWidth - this.cropData.size, newX));
        this.cropData.y = Math.max(0, Math.min(this.cropImage.offsetHeight - this.cropData.size, newY));

        this.updateCropArea();
    }

    // Обработка окончания перетаскивания
    handleMouseUp() {
        this.isDragging = false;
    }

    // Обрезка и загрузка
    cropAndUpload() {
        console.log('Начинаем обрезку и загрузку');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;

        // Создаем изображение для обрезки
        const cropImg = new Image();
        cropImg.onload = () => {
            ctx.drawImage(
                cropImg,
                this.cropData.x, this.cropData.y, this.cropData.size, this.cropData.size,
                0, 0, 100, 100
            );

            const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            this.uploadAvatar(finalDataUrl);
        };
        cropImg.src = this.compressedImage;
    }

    // Загрузка аватара на сервер
    uploadAvatar(dataUrl) {
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

        // Создаем FormData
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');
        formData.append('user_id', localStorage.getItem('userId'));

        // Отправляем на сервер
        fetch('api/upload_avatar.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Аватар успешно загружен!');
                this.closeCropModal();
                this.updateAvatarDisplay(data.avatar_path);
            } else {
                alert('Ошибка загрузки: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Ошибка загрузки аватара');
        });
    }

    // Обновление отображения аватара
    updateAvatarDisplay(avatarPath) {
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement && avatarPath) {
            avatarElement.innerHTML = `<img src="${avatarPath}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }

    // Закрытие модального окна
    closeCropModal() {
        if (this.cropModal) {
            this.cropModal.remove();
            this.cropModal = null;
        }
        
        // Очищаем обработчики событий
        this.isDragging = false;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const avatarHandler = new AvatarHandler();
    avatarHandler.init();
});