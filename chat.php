<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Чат - LizaApp</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .chat-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        .chat-header { 
            background: #4CAF50; 
            color: white; 
            padding: 15px 20px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        .chat-messages { 
            height: 400px; 
            overflow-y: auto; 
            padding: 20px; 
            background: #fafafa; 
        }
        .message { 
            margin: 10px 0; 
            padding: 10px 15px; 
            border-radius: 15px; 
            max-width: 70%; 
            word-wrap: break-word; 
        }
        .message.own { 
            background: #4CAF50; 
            color: white; 
            margin-left: auto; 
            text-align: right; 
        }
        .message.other { 
            background: #e0e0e0; 
            color: #333; 
        }
        .message-time { 
            font-size: 11px; 
            opacity: 0.7; 
            margin-top: 5px; 
        }
        .chat-input { 
            display: flex; 
            padding: 20px; 
            background: white; 
            border-top: 1px solid #ddd; 
        }
        .message-input { 
            flex: 1; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 20px; 
            outline: none; 
            font-size: 14px; 
        }
        .send-btn { 
            background: #4CAF50; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 20px; 
            margin-left: 10px; 
            cursor: pointer; 
        }
        .emoji-btn { 
            background: #2196F3; 
            color: white; 
            border: none; 
            padding: 10px 15px; 
            border-radius: 20px; 
            margin-left: 10px; 
            cursor: pointer; 
        }
        .emoji-panel { 
            display: none; 
            position: absolute; 
            bottom: 80px; 
            right: 20px; 
            background: white; 
            border: 1px solid #ddd; 
            border-radius: 10px; 
            padding: 15px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            z-index: 1000; 
        }
        .emoji-grid { 
            display: grid; 
            grid-template-columns: repeat(8, 1fr); 
            gap: 5px; 
        }
        .emoji { 
            padding: 5px; 
            cursor: pointer; 
            border-radius: 5px; 
            text-align: center; 
        }
        .emoji:hover { 
            background: #f0f0f0; 
        }
        .status { 
            padding: 10px 20px; 
            background: #fff3cd; 
            color: #856404; 
            border-bottom: 1px solid #ffeaa7; 
        }
        .status.connected { 
            background: #d4edda; 
            color: #155724; 
        }
        .status.error { 
            background: #f8d7da; 
            color: #721c24; 
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h2>💬 Чат с <span id="friendName">Другом</span></h2>
            <button onclick="closeChat()" style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">✕ Закрыть</button>
        </div>
        
        <div id="status" class="status">Подключение к чат-серверу...</div>
        
        <div id="chatMessages" class="chat-messages"></div>
        
        <div class="chat-input">
            <input type="text" id="messageInput" class="message-input" placeholder="Введите сообщение... (эмодзи вставляются в текст)" onkeypress="handleKeyPress(event)">
            <button onclick="sendMessage()" class="send-btn">📤 Отправить</button>
            <button onclick="toggleEmojiPanel()" class="emoji-btn">😀 Эмодзи</button>
        </div>
        
        <div id="emojiPanel" class="emoji-panel">
            <div class="emoji-grid">
                <span class="emoji" onclick="sendEmoji('😀')">😀</span>
                <span class="emoji" onclick="sendEmoji('😂')">😂</span>
                <span class="emoji" onclick="sendEmoji('😍')">😍</span>
                <span class="emoji" onclick="sendEmoji('🤔')">🤔</span>
                <span class="emoji" onclick="sendEmoji('👍')">👍</span>
                <span class="emoji" onclick="sendEmoji('👎')">👎</span>
                <span class="emoji" onclick="sendEmoji('❤️')">❤️</span>
                <span class="emoji" onclick="sendEmoji('🎉')">🎉</span>
                <span class="emoji" onclick="sendEmoji('🔥')">🔥</span>
                <span class="emoji" onclick="sendEmoji('💯')">💯</span>
                <span class="emoji" onclick="sendEmoji('🚀')">🚀</span>
                <span class="emoji" onclick="sendEmoji('⭐')">⭐</span>
                <span class="emoji" onclick="sendEmoji('😎')">😎</span>
                <span class="emoji" onclick="sendEmoji('🤗')">🤗</span>
                <span class="emoji" onclick="sendEmoji('😢')">😢</span>
                <span class="emoji" onclick="sendEmoji('😡')">😡</span>
            </div>
        </div>
    </div>

    <script>
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentUserId = urlParams.get('userId');
        const friendUsername = urlParams.get('friend');
        
        // WebSocket соединение с кэшированием
        let chatWs = null;
        let chatWsConnected = false;
        let chatWsConnecting = false;
        let chatWsReconnectTimeout = null;
        
        // Кэш для быстрого доступа
        const chatCache = {
            connection: null,
            lastConnected: 0,
            reconnectDelay: 1000
        };
        
        // Инициализация
        document.addEventListener('DOMContentLoaded', function() {
            if (!currentUserId || !friendUsername) {
                showError('Ошибка: не указаны параметры пользователя или друга');
                return;
            }
            
            document.getElementById('friendName').textContent = friendUsername;
            
            // Загружаем историю сразу (не ждем WebSocket)
            loadChatHistory();
            
            // Подключаемся к WebSocket с оптимизацией
            connectChatWebSocketOptimized();
        });
        
        // Оптимизированное подключение к WebSocket серверу
        function connectChatWebSocketOptimized() {
            // Проверяем кэш соединения
            if (chatCache.connection && chatCache.connection.readyState === WebSocket.OPEN) {
                chatWs = chatCache.connection;
                chatWsConnected = true;
                updateStatus('Чат готов к использованию', 'connected');
                return;
            }
            
            // Если уже подключаемся, не создаем новое соединение
            if (chatWsConnecting) {
                return;
            }
            
            chatWsConnecting = true;
            updateStatus('Подключение к чат-серверу...', '');
            
            try {
                // Создаем новое соединение с оптимизацией
                chatWs = new WebSocket('wss://lizacom.ru:9002');
                
                chatWs.onopen = () => {
                    chatWsConnected = true;
                    chatWsConnecting = false;
                    chatCache.connection = chatWs;
                    chatCache.lastConnected = Date.now();
                    
                    updateStatus('Чат готов к использованию', 'connected');
                    
                    // Быстрая аутентификация
                    chatWs.send(JSON.stringify({
                        type: 'auth',
                        data: { userId: currentUserId }
                    }));
                };
                
                chatWs.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        handleChatWebSocketMessage(message);
                    } catch (error) {
                        console.error('Ошибка парсинга сообщения чата:', error);
                    }
                };
                
                chatWs.onclose = () => {
                    chatWsConnected = false;
                    chatWsConnecting = false;
                    chatCache.connection = null;
                    
                    // Быстрое переподключение с экспоненциальной задержкой
                    if (chatWsReconnectTimeout) {
                        clearTimeout(chatWsReconnectTimeout);
                    }
                    
                    chatWsReconnectTimeout = setTimeout(() => {
                        if (!chatWsConnected) {
                            updateStatus('Переподключение к чат-серверу...', '');
                            connectChatWebSocketOptimized();
                        }
                    }, Math.min(chatCache.reconnectDelay, 5000));
                    
                    chatCache.reconnectDelay *= 1.5; // Экспоненциальная задержка
                };
                
                chatWs.onerror = (error) => {
                    chatWsConnecting = false;
                    updateStatus('Ошибка подключения к чат-серверу', 'error');
                };
                
            } catch (error) {
                chatWsConnecting = false;
                updateStatus('Ошибка создания WebSocket соединения', 'error');
            }
        }
        
        // Старая функция для совместимости
        function connectChatWebSocket() {
            connectChatWebSocketOptimized();
        }
        
        // Обработка сообщений от WebSocket
        function handleChatWebSocketMessage(message) {
            switch (message.type) {
                case 'auth_success':
                    updateStatus('Чат готов к использованию', 'connected');
                    break;
                case 'chat_message':
                    handleChatMessage(message);
                    break;
                case 'error':
                    updateStatus('Ошибка чат-сервера: ' + message.message, 'error');
                    break;
                default:
                    console.log('Неизвестный тип сообщения чата:', message.type);
            }
        }
        
        // Обработка входящих сообщений
        function handleChatMessage(message) {
            if (message.from !== friendUsername) return;
            
            // Добавляем сообщение в чат
            addMessageToChat(message.data.message, message.from, message.data.timestamp, message.data.type);
            
            // Сохраняем в localStorage
            saveMessageToStorage(message.data.message, message.from, message.data.timestamp, message.data.type);
        }
        
        // Отправка сообщения
        function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (!message) return;
            
            if (!chatWsConnected || !chatWs) {
                updateStatus('Нет соединения с чат-сервером', 'error');
                return;
            }
            
            const timestamp = Date.now();
            
            // Определяем тип сообщения (содержит ли эмодзи)
            const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message);
            const messageType = hasEmoji ? 'emoji' : 'text';
            
            // Отправляем через WebSocket
            chatWs.send(JSON.stringify({
                type: 'chat_message',
                from: currentUserId,
                to: friendUsername,
                data: {
                    message: message,
                    timestamp: timestamp,
                    type: messageType
                }
            }));
            
            // Добавляем в чат
            addMessageToChat(message, currentUserId, timestamp, messageType);
            
            // Сохраняем в localStorage
            saveMessageToStorage(message, currentUserId, timestamp, messageType);
            
            // Очищаем поле ввода
            messageInput.value = '';
        }
        
        // Вставка эмодзи в поле ввода (новая логика)
        function sendEmoji(emoji) {
            const messageInput = document.getElementById('messageInput');
            const currentText = messageInput.value;
            const cursorPosition = messageInput.selectionStart;
            
            // Вставляем эмодзи в текущую позицию курсора
            const newText = currentText.slice(0, cursorPosition) + emoji + currentText.slice(cursorPosition);
            messageInput.value = newText;
            
            // Устанавливаем курсор после вставленного эмодзи
            const newCursorPosition = cursorPosition + emoji.length;
            messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // Фокусируемся на поле ввода
            messageInput.focus();
            
            // Скрываем панель эмодзи
            document.getElementById('emojiPanel').style.display = 'none';
        }
        
        // Добавление сообщения в чат
        function addMessageToChat(message, from, timestamp, type) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            
            messageDiv.className = `message ${from === currentUserId ? 'own' : 'other'}`;
            
            if (type === 'emoji') {
                // Проверяем, содержит ли сообщение только эмодзи или смешанный контент
                const isOnlyEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]+$/u.test(message);
                
                if (isOnlyEmoji) {
                    // Только эмодзи - больший размер
                    messageDiv.innerHTML = `
                        <div style="font-size: 24px;">${message}</div>
                        <div class="message-time">${new Date(timestamp).toLocaleTimeString()}</div>
                    `;
                } else {
                    // Смешанный контент - обычный размер
                    messageDiv.innerHTML = `
                        <div style="font-size: 16px;">${message}</div>
                        <div class="message-time">${new Date(timestamp).toLocaleTimeString()}</div>
                    `;
                }
            } else {
                messageDiv.innerHTML = `
                    <div>${message}</div>
                    <div class="message-time">${new Date(timestamp).toLocaleTimeString()}</div>
                `;
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Сохранение сообщения в localStorage
        function saveMessageToStorage(message, from, timestamp, type) {
            const chatKey = `chat_${currentUserId}_${friendUsername}`;
            let chatHistory = JSON.parse(localStorage.getItem(chatKey) || '[]');
            
            chatHistory.push({
                message: message,
                from: from,
                timestamp: timestamp,
                type: type
            });
            
            localStorage.setItem(chatKey, JSON.stringify(chatHistory));
        }
        
        // Загрузка истории сообщений
        function loadChatHistory() {
            const chatKey = `chat_${currentUserId}_${friendUsername}`;
            const chatHistory = JSON.parse(localStorage.getItem(chatKey) || '[]');
            
            chatHistory.forEach(msg => {
                addMessageToChat(msg.message, msg.from, msg.timestamp, msg.type);
            });
        }
        
        // Переключение панели эмодзи
        function toggleEmojiPanel() {
            const panel = document.getElementById('emojiPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Обработка нажатия Enter
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        // Обновление статуса
        function updateStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = `status ${type}`;
        }
        
        // Показ ошибки
        function showError(message) {
            updateStatus(message, 'error');
        }
        
        // Закрытие чата
        function closeChat() {
            if (chatWs) {
                chatWs.close();
            }
            window.close();
        }
    </script>
</body>
</html>
