// ===== СИСТЕМА АВТОРИЗАЦИИ И ИНИЦИАЛИЗАЦИИ =====

// Функция для показа поля пароля
function showPasswordField(event) {
    const passwordField = document.getElementById('userPassword');
    const loginButton = event.target;
    
    if (passwordField.style.display === 'none') {
        passwordField.style.display = 'block';
        loginButton.textContent = 'Войти';
        loginButton.onclick = () => startUser();
    }
}

// Функция для запуска пользователя
async function startUser() {
    const username = document.getElementById('userId').value;
    const password = document.getElementById('userPassword').value;
    
    if (!username) {
        currentUser.log(`❌ Введите логин`, 'error');
        return;
    }
    
    if (!password) {
        currentUser.log(`❌ Введите пароль`, 'error');
        return;
    }
    
    // Авторизация пользователя
    currentUser.log(`🔐 Авторизация пользователя ${username}...`, 'info');
    
    try {
        const response = await fetch('https://lizaapp.ru/api/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser.id = username;
            currentUser.sessionToken = data.sessionToken;
            
            // Подключаемся к Chat WebSocket сразу после авторизации
            connectChatWebSocket();
            
            // Запускаем мониторинг соединения
            startConnectionMonitoring();
            
            // Сохраняем данные в localStorage
            localStorage.setItem('userData', JSON.stringify({
                username: username,
                userId: data.userId,
                sessionToken: data.sessionToken
            }));
            
            currentUser.log(`✅ Авторизация успешна`, 'success');
        } else {
            currentUser.log(`❌ Ошибка авторизации: ${data.error}`, 'error');
            return;
        }
    } catch (error) {
        currentUser.log(`❌ Ошибка соединения с сервером`, 'error');
        return;
    }
    
    currentUser.lastSignalId = Math.floor(Date.now() / 1000) - 60; // Получаем сигналы за последнюю минуту
    currentUser.state = 'idle';
    currentUser.targetUser = null;
    currentUser.isInitiator = false;
    currentUser.webrtcInitiated = false;
    currentUser.log(`🚀 Пользователь ${currentUser.id} готов к звонкам`, 'success');
    currentUser.log(`⏰ Игнорируем сигналы старше: ${currentUser.lastSignalId}`, 'info');
    currentUser.log(`📊 Состояние: ${currentUser.state}`, 'info');
    
    // Подключаемся к WebSocket серверам
    try {
        await connectCallsWebSocket();
    } catch (error) {
        currentUser.log(`❌ Ошибка подключения к WebSocket: ${error.message}`, 'error');
        return;
    }
    
    // Обновляем UI
    updateUI();
    
    // Показываем систему друзей
    showFriendsSection();
    
    // Загружаем сообщения из localStorage
    loadChatMessagesFromStorage();
    
    currentUser.log(`📹 Камера и микрофон будут запущены при звонке`, 'info');
}
