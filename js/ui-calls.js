// ===== UI И УПРАВЛЕНИЕ ЗВОНКАМИ =====

// Функция для обновления UI
function updateUI() {
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');
    const headerUserInfo = document.getElementById('headerUserInfo');
    const userStatus = document.getElementById('userStatus');
    const currentUserId = document.getElementById('currentUserId');
    const userAvatar = document.getElementById('userAvatar');
    const startCallBtn = document.getElementById('startCallBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const resetBtn = document.querySelector('button[onclick="resetUser()"]');
    
    if (currentUser.id) {
        // Пользователь авторизован
        loginSection.style.display = 'none';
        userInfo.style.display = 'block';
        headerUserInfo.style.display = 'flex';
        currentUserId.textContent = currentUser.id;
        
        // Загружаем аватар из БД
        loadUserAvatar();
        
        // Обновляем статус
        userStatus.textContent = getStatusText();
        userStatus.className = `status ${currentUser.state}`;
        
        // Обновляем кнопки
        if (currentUser.state === 'idle') {
            startCallBtn.style.display = 'inline-block';
            startCallBtn.disabled = false;
            disconnectBtn.style.display = 'none';
            resetBtn.style.display = 'inline-block';
        } else if (currentUser.state === 'connecting' || currentUser.state === 'connected' || currentUser.state === 'calling') {
            startCallBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            disconnectBtn.disabled = false;
            resetBtn.style.display = 'inline-block';
        }
    } else {
        // Пользователь не авторизован
        loginSection.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

function getStatusText() {
    switch (currentUser.state) {
        case 'idle': return 'Готов к звонкам';
        case 'connecting': return 'Подключение...';
        case 'connected': return 'Соединение установлено';
        case 'calling': return 'Звонок активен';
        default: return 'Отключен';
    }
}

// Функция для начала звонка
async function startAudioCall() {
    const targetId = document.getElementById('targetUserId').value;
    
    if (!targetId) {
        currentUser.log('❌ Не указан целевой пользователь', 'error');
        return;
    }
    
    if (currentUser.state !== 'idle') {
        currentUser.log(`❌ Нельзя начать вызов - состояние: ${currentUser.state}`, 'error');
        return;
    }
    
    currentUser.log(`🎵 Начинаем аудио звонок к ${targetId}`, 'info');
    currentUser.state = 'connecting';
    currentUser.targetUser = targetId;
    currentUser.isInitiator = true;
    currentUser.webrtcInitiated = false;
    updateUI();
    
    // Отправляем ping через WebSocket с типом аудио
    currentUser.log(`📤 Отправляем ping к ${targetId}`, 'info');
    sendCallsWebSocketMessage('ping', { timestamp: Date.now(), callType: 'audio' }, targetId);
}

async function startCall() {
    const targetId = document.getElementById('targetUserId').value;
    
    if (!targetId) {
        currentUser.log('❌ Не указан целевой пользователь', 'error');
        return;
    }
    
    if (currentUser.state !== 'idle') {
        currentUser.log(`❌ Нельзя начать вызов - состояние: ${currentUser.state}`, 'error');
        return;
    }
    
    currentUser.log(`📞 Начинаем звонок к ${targetId}`, 'info');
    currentUser.state = 'connecting';
    currentUser.targetUser = targetId;
    currentUser.isInitiator = true;
    currentUser.webrtcInitiated = false;
    updateUI();
    
    // Отправляем ping через WebSocket
    currentUser.log(`📤 Отправляем ping к ${targetId}`, 'info');
    sendCallsWebSocketMessage('ping', { timestamp: Date.now() }, targetId);
}

// Функция для загрузки аватара пользователя
function loadUserAvatar() {
    const userData = localStorage.getItem('userData');
    if (!userData) return;

    try {
        const data = JSON.parse(userData);
        const userId = data.userId;
        
        if (!userId) return;

        // Загружаем данные пользователя из БД
        fetch(`avtr/api/get_user_data.php?user_id=${userId}`)
            .then(response => response.json())
            .then(result => {
                const userAvatar = document.getElementById('userAvatar');
                if (result.success && result.user.avatar_path) {
                    userAvatar.innerHTML = `<img src="${result.user.avatar_path}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                } else {
                    userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки аватара:', error);
            });
    } catch (error) {
        console.error('Ошибка парсинга userData:', error);
    }
}
