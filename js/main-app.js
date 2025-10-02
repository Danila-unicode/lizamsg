// ===== ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ =====

// Глобальные переменные
let currentUser = null;
let selectedMessages = new Set();
let deleteButton = null;
let deleteCommandQueue = {};
let fileStorageEnabled = false;

// Инициализация приложения
function initApp() {
    console.log('🚀 Инициализация LizaApp...');
    
    // Проверяем авторизацию
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserInterface();
    }
    
    // Инициализируем системы
    initDeleteSystem();
    startConnectionMonitoring();
    startP2PCleanup();
    startDeleteCommandProcessor();
    
    // Проверяем первый запуск
    if (!localStorage.getItem('lizaapp_first_run_completed')) {
        showFileStorageModal();
    }
    
    console.log('✅ LizaApp инициализирован');
}

// Показать интерфейс пользователя
function showUserInterface() {
    document.getElementById('headerUserInfo').style.display = 'flex';
    document.getElementById('currentUserId').textContent = currentUser.username;
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    
    // Подключаемся к чат-серверу
    connectChatWebSocket();
    
    // Обновляем списки
    updateFriendsList();
}

// Выход из системы
function resetUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    location.reload();
}

// Переключение вкладок
function switchTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-panel').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    if (tabName === 'friends') {
        document.getElementById('friendsTab').style.display = 'block';
        document.querySelector('[onclick="switchTab(\'friends\')"]').classList.add('active');
    } else if (tabName === 'requests') {
        document.getElementById('requestsTab').style.display = 'block';
        document.querySelector('[onclick="switchTab(\'requests\')"]').classList.add('active');
    } else if (tabName === 'invitations') {
        document.getElementById('invitationsTab').style.display = 'block';
        document.querySelector('[onclick="switchTab(\'invitations\')"]').classList.add('active');
    }
}

// Поиск пользователя
function searchUser() {
    const username = document.getElementById('searchUsername').value.trim();
    if (!username) return;
    
    // Здесь должна быть логика поиска пользователя
    console.log(`🔍 Поиск пользователя: ${username}`);
}

// Показать поле пароля
function showPasswordField(event) {
    const passwordField = document.getElementById('userPassword');
    passwordField.style.display = 'block';
    event.target.textContent = 'Войти с паролем';
    event.target.onclick = login;
}

// Вход в систему
function login() {
    const username = document.getElementById('userId').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    
    if (!username) {
        alert('Введите логин');
        return;
    }
    
    currentUser = { id: username, username: username };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showUserInterface();
}

// Закрыть чат
function closeChat() {
    document.getElementById('chatContainer').style.display = 'none';
}

// Очистить лог
function clearLog() {
    document.getElementById('log').innerHTML = '';
}

// Показать модальное окно файлового хранения
function showFileStorageModal() {
    const modal = document.createElement('div');
    modal.id = 'fileStorageModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 500px; width: 90%;">
            <h2 style="margin: 0 0 20px 0; color: #333;">📁 Файловое хранение</h2>
            <p style="margin: 0 0 20px 0; color: #666;">
                LizaApp может создавать файлы на вашем устройстве для улучшения производительности и хранения данных.
            </p>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; margin: 15px 0; border-radius: 5px; font-size: 14px;">
                ⚠️ <strong>Внимание:</strong> Файлы создаются только на вашем устройстве и не передаются в интернет.
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="acceptFileStorage()" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 14px;">✅ Разрешить</button>
                <button onclick="declineFileStorage()" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 14px;">❌ Отказаться</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Принять файловое хранение
function acceptFileStorage() {
    fileStorageEnabled = true;
    localStorage.setItem('lizaapp_file_storage_enabled', 'true');
    updateFileStorageButton();
    
    // Закрываем модальное окно
    const modal = document.getElementById('fileStorageModal');
    if (modal) {
        modal.remove();
    }
    
    // Отмечаем, что первый запуск завершен
    localStorage.setItem('lizaapp_first_run_completed', 'true');
}

// Отказ от файлового хранения
function declineFileStorage() {
    localStorage.setItem('lizaapp_first_run_completed', 'true');
    
    // Закрываем модальное окно
    const modal = document.getElementById('fileStorageModal');
    if (modal) {
        modal.remove();
    }
    
    // Обновляем кнопку
    updateFileStorageButton();
}

// Обновление кнопки файлового хранения
function updateFileStorageButton() {
    const btn = document.getElementById('fileStorageBtn');
    if (btn) {
        if (fileStorageEnabled) {
            btn.textContent = '✅ Файлы';
            btn.style.background = '#4CAF50';
            btn.title = 'Файловое хранение активно';
        } else {
            btn.textContent = '📁 Файлы';
            btn.style.background = '#2196F3';
            btn.title = 'Нажмите для включения файлового хранения';
        }
    }
}

// Переключение файлового хранения
function toggleFileStorage() {
    if (fileStorageEnabled) {
        fileStorageEnabled = false;
        localStorage.removeItem('lizaapp_file_storage_enabled');
    } else {
        fileStorageEnabled = true;
        localStorage.setItem('lizaapp_file_storage_enabled', 'true');
    }
    updateFileStorageButton();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
