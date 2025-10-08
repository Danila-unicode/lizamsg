// ===== P2P ФУНКЦИИ =====

// Установка P2P соединения с другом
// Защита от множественных вызовов establishP2PConnection
const establishingConnections = new Set();

async function establishP2PConnection(friendUsername) {
    console.log(`🔧 establishP2PConnection вызвана для ${friendUsername}`);
    console.log(`🔍 Состояние перед установкой:`, {
        isEstablishing: establishingConnections.has(friendUsername),
        hasConnection: !!p2pConnections[friendUsername],
        connectionStatus: p2pConnections[friendUsername]?.status,
        establishingConnections: Array.from(establishingConnections)
    });
    
    // Проверяем, не устанавливается ли уже соединение
    if (establishingConnections.has(friendUsername)) {
        console.log(`⚠️ P2P соединение с ${friendUsername} уже устанавливается, пропускаем`);
        return;
    }
    
    // Проверяем, есть ли уже соединение
    if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
        console.log(`P2P соединение с ${friendUsername} уже активно`);
        return;
    }
    
    // Добавляем в список устанавливаемых соединений
    establishingConnections.add(friendUsername);
    
    try {
        
        updateChatStatus('Установка P2P соединения...', '');
        
        // Создаем RTCPeerConnection
        const connection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 5 // Ограничиваем пул ICE кандидатов
        });
        
        // Создаем Data Channel
        const dataChannel = connection.createDataChannel('chat', {
            ordered: true
        });
        
        // Настройка обработчиков Data Channel
        setupDataChannelHandlers(dataChannel, friendUsername);
        
        // Настройка обработчиков соединения
        setupP2PHandlers(connection, dataChannel, friendUsername);
        
        // Сохраняем соединение
        p2pConnections[friendUsername] = {
            connection: connection,
            dataChannel: dataChannel,
            status: 'connecting',
            lastActivity: Date.now(),
            connectionTimeout: null
        };
        
        // Устанавливаем таймаут для соединения (30 секунд)
        p2pConnections[friendUsername].connectionTimeout = setTimeout(() => {
            if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connecting') {
                console.log(`⏰ Таймаут P2P соединения с ${friendUsername}`);
                updateChatStatus('Таймаут P2P соединения', 'error');
                closeP2PConnection(friendUsername);
            }
        }, 30000);
        
        // Создаем offer
        console.log(`📤 Создаем offer для ${friendUsername}`);
        const offerStartTime = Date.now();
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        console.log(`⏱️ Offer создан за ${Date.now() - offerStartTime}ms`);
        console.log(`✅ Offer создан и установлен для ${friendUsername}`);
        
        // Отправляем offer через сервер координации
        sendP2PSignal('offer', {
            to: friendUsername,
            offer: offer
        });
        console.log(`📤 Offer отправлен к ${friendUsername}`);
        
        // Если Chat WebSocket недоступен, пробуем прямую установку через STUN
        if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
            console.log('⚠️ Chat WebSocket недоступен, используем только STUN серверы');
            updateChatStatus('P2P через STUN серверы...', '');
        }
        
        // Убираем из списка устанавливаемых соединений после успешной отправки offer
        establishingConnections.delete(friendUsername);
        
    } catch (error) {
        console.error('Ошибка установки P2P соединения:', error);
        updateChatStatus('Ошибка P2P соединения', 'error');
    } finally {
        // Убираем из списка устанавливаемых соединений
        establishingConnections.delete(friendUsername);
    }
}

// Настройка обработчиков P2P соединения
function setupP2PHandlers(connection, dataChannel, friendUsername) {
    // Обработчик входящих соединений
    connection.ondatachannel = (event) => {
        const incomingChannel = event.channel;
        setupDataChannelHandlers(incomingChannel, friendUsername);
    };
    
    // Обработчик ICE кандидатов
    connection.onicecandidate = (event) => {
        if (event.candidate) {
            sendP2PSignal('ice-candidate', {
                to: friendUsername,
                candidate: event.candidate
            });
        }
    };
    
    // Обработчик изменения состояния соединения
    connection.onconnectionstatechange = () => {
        const state = connection.connectionState;
        console.log(`P2P соединение с ${friendUsername}: ${state}`);
        
        if (state === 'connected') {
            if (p2pConnections[friendUsername]) {
                p2pConnections[friendUsername].status = 'connected';
            }
            updateChatStatus('P2P соединение установлено', 'connected');
            
            // Начинаем ping-понг мониторинг
            startPingPongMonitoring(friendUsername);
            
            // Отправляем сообщения из очереди
            sendQueuedMessages(friendUsername);
        } else if (state === 'disconnected' || state === 'failed') {
            if (p2pConnections[friendUsername]) {
                p2pConnections[friendUsername].status = 'disconnected';
            }
            updateChatStatus('P2P соединение потеряно', 'error');
            
            // Останавливаем ping-понг
            stopPingPongMonitoring(friendUsername);
        }
    };
    
    // Настройка Data Channel
    setupDataChannelHandlers(dataChannel, friendUsername);
}

// Настройка обработчиков Data Channel
function setupDataChannelHandlers(dataChannel, friendUsername) {
    if (!dataChannel) {
        console.log(`⚠️ Data Channel для ${friendUsername} не создан, пропускаем настройку обработчиков`);
        return;
    }
    
    dataChannel.onopen = () => {
        console.log(`Data Channel с ${friendUsername} открыт`);
        if (p2pConnections[friendUsername]) {
            p2pConnections[friendUsername].status = 'connected';
            p2pConnections[friendUsername].dataChannel = dataChannel; // Сохраняем Data Channel
            p2pConnections[friendUsername].lastActivity = Date.now(); // Обновляем активность
        }
        updateChatStatus('P2P соединение установлено', 'connected');
        
        // Отправляем сообщения из очереди
        sendQueuedMessages(friendUsername);
        
        // Запускаем ping-понг мониторинг
        startPingPongMonitoring(friendUsername);
    };
    
    dataChannel.onclose = () => {
        console.log(`Data Channel с ${friendUsername} закрыт`);
        if (p2pConnections[friendUsername]) {
            p2pConnections[friendUsername].status = 'disconnected';
        }
    };
    
    dataChannel.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleP2PMessage(message, friendUsername);
        } catch (error) {
            console.error('Ошибка обработки P2P сообщения:', error);
        }
    };
}

// Отправка P2P сигнала через chat сервер
function sendP2PSignal(type, data) {
    if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
        window.chatWs.send(JSON.stringify({
            type: `p2p_${type}`,
            from: currentUser.id,
            to: data.to,
            data: data
        }));
        console.log(`📤 P2P сигнал отправлен: ${type} к ${data.to}`);
    } else {
        console.log(`⚠️ Chat WebSocket недоступен для P2P сигнала ${type}, пропускаем`);
    }
}

// Обработка входящих P2P сигналов
function handleP2PSignal(signal) {
    const { type, from, data } = signal;
    
    console.log(`📨 Получен P2P сигнал: ${type} от ${from}`);
    
    switch (type) {
        case 'p2p_offer':
            handleP2POffer(from, data.offer);
            break;
        case 'p2p_answer':
            handleP2PAnswer(from, data.answer);
            break;
        case 'p2p_ice-candidate':
            handleP2PICECandidate(from, data.candidate);
            break;
        case 'p2p_ping':
            handleP2PPing(from);
            break;
        case 'p2p_pong':
            handleP2PPong(from);
            break;
        case 'p2p_error':
            console.log(`❌ P2P ошибка: ${data ? data.error : 'Неизвестная ошибка'}`);
            updateChatStatus('P2P ошибка: ' + (data ? data.error : 'Неизвестная ошибка'), 'error');
            
            // Если получатель недоступен - сообщение уже в очереди
            if (data && data.error === 'Получатель недоступен') {
                console.log('📬 Получатель недоступен, сообщение в очереди для доставки');
                // Сообщение уже добавлено в очередь в sendChatMessage
                // НЕ показываем уведомление - получатель недоступен
            }
            break;
        default:
            console.log(`❓ Неизвестный P2P сигнал: ${type}`);
    }
}

// Обработка P2P offer
async function handleP2POffer(from, offer) {
    try {
        console.log(`📥 Получен P2P offer от ${from}`);
        
        if (!p2pConnections[from]) {
            // Создаем новое соединение для входящего
            const connection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            // Создаем Data Channel для ответа
            const dataChannel = connection.createDataChannel('chat', {
                ordered: true
            });
            
            p2pConnections[from] = {
                connection: connection,
                dataChannel: dataChannel,
                status: 'connecting',
                lastActivity: Date.now()
            };
            
            setupP2PHandlers(connection, dataChannel, from);
        }
        
        await p2pConnections[from].connection.setRemoteDescription(offer);
        const answer = await p2pConnections[from].connection.createAnswer();
        await p2pConnections[from].connection.setLocalDescription(answer);
        
        // Добавляем отложенные ICE кандидаты
        if (p2pConnections[from].pendingCandidates) {
            for (const candidate of p2pConnections[from].pendingCandidates) {
                try {
                    await p2pConnections[from].connection.addIceCandidate(candidate);
                } catch (error) {
                    console.error('Ошибка добавления отложенного ICE кандидата:', error);
                }
            }
            p2pConnections[from].pendingCandidates = [];
        }
        
        console.log(`📤 Отправляем P2P answer к ${from}`);
        sendP2PSignal('answer', {
            to: from,
            answer: answer
        });
        
    } catch (error) {
        console.error('Ошибка обработки P2P offer:', error);
    }
}

// Обработка P2P answer
async function handleP2PAnswer(from, answer) {
    try {
        console.log(`📥 Получен P2P answer от ${from}`);
        
        if (p2pConnections[from]) {
            await p2pConnections[from].connection.setRemoteDescription(answer);
            console.log(`✅ P2P соединение с ${from} установлено`);
        }
    } catch (error) {
        console.error('Ошибка обработки P2P answer:', error);
    }
}

// Обработка P2P ICE кандидата
async function handleP2PICECandidate(from, candidate) {
    try {
        if (p2pConnections[from] && p2pConnections[from].connection) {
            // Ограничиваем количество ICE кандидатов
            const MAX_ICE_CANDIDATES = 10;
            if (!p2pConnections[from].iceCandidateCount) {
                p2pConnections[from].iceCandidateCount = 0;
            }
            
            if (p2pConnections[from].iceCandidateCount >= MAX_ICE_CANDIDATES) {
                console.log(`⚠️ Превышен лимит ICE кандидатов для ${from} (${MAX_ICE_CANDIDATES}), игнорируем`);
                return;
            }
            
            // Проверяем, что remote description установлен
            if (p2pConnections[from].connection.remoteDescription) {
                await p2pConnections[from].connection.addIceCandidate(candidate);
                p2pConnections[from].iceCandidateCount++;
                console.log(`✅ ICE кандидат добавлен для ${from} (${p2pConnections[from].iceCandidateCount}/${MAX_ICE_CANDIDATES})`);
            } else {
                console.log(`⏳ ICE кандидат отложен для ${from} (ждем remote description)`);
                // Сохраняем кандидата для добавления позже
                if (!p2pConnections[from].pendingCandidates) {
                    p2pConnections[from].pendingCandidates = [];
                }
                p2pConnections[from].pendingCandidates.push(candidate);
            }
        }
    } catch (error) {
        console.error('Ошибка обработки P2P ICE кандидата:', error);
    }
}

// Обработка P2P ping
function handleP2PPing(from) {
    console.log(`📨 Получен ping от ${from}, отправляем pong через WebSocket`);
    
    // Отправляем pong через WebSocket сервер, а не через P2P
    if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
        const pongMessage = {
            type: 'p2p_signal',
            to: from,
            signal: {
                type: 'p2p_pong',
                to: from,
                timestamp: Date.now()
            }
        };
        
        window.chatWs.send(JSON.stringify(pongMessage));
        console.log(`✅ Pong отправлен через WebSocket к ${from}`);
    } else {
        console.log(`❌ Chat WebSocket недоступен для отправки pong`);
    }
}

// Обработка P2P pong
function handleP2PPong(from) {
    console.log(`✅ Получен pong от ${from} - пользователь онлайн`);
    
    // Обновляем статус соединения
    if (p2pConnections[from]) {
        p2pConnections[from].lastPong = Date.now();
    }
    
    // Устанавливаем P2P соединение
    console.log(`🔧 Устанавливаем P2P соединение с ${from} после получения pong`);
    console.log(`🔍 Проверка состояния перед установкой P2P:`, {
        hasConnection: !!p2pConnections[from],
        connectionStatus: p2pConnections[from]?.status,
        isEstablishing: establishingConnections.has(from)
    });
    establishP2PConnection(from);
}

// Обработка P2P сообщений
function handleP2PMessage(message, friendUsername) {
    // Проверяем, что это не наше собственное сообщение
    if (message.data && message.data.from === currentUser.id) {
        console.log(`⚠️ Получено собственное сообщение от ${friendUsername}, игнорируем`);
        return;
    }
    
    // Проверяем, что сообщение предназначено нам
    if (message.to && message.to !== currentUser.id) {
        console.log(`⚠️ Сообщение предназначено другому пользователю (${message.to}), игнорируем`);
        return;
    }
    
    switch (message.type) {
        case 'chat_message':
            // Сохраняем входящее сообщение в IndexedDB
            saveIncomingMessage(friendUsername, message.data.message, friendUsername, message.data.timestamp, message.data.type);
            
            // Добавляем в чат, если он открыт
            if (currentChatFriend === friendUsername) {
                addChatMessage(message.data.message, friendUsername, message.data.timestamp, message.data.type);
            } else {
                // Чат не открыт - показываем уведомление
                showChatNotification(friendUsername, message.data.message);
            }
            
            // Отправляем подтверждение получения
            sendP2PMessage(friendUsername, {
                type: 'message_received',
                to: friendUsername,
                timestamp: Date.now(),
                originalTimestamp: message.data.timestamp
            });
            break;
        case 'message_received':
            // Обновляем статус сообщения на "доставлено" только если это подтверждение от правильного получателя
            if (message.data && message.data.originalTimestamp) {
                console.log(`📨 Получено подтверждение доставки:`, {
                    from: message.from,
                    friendUsername,
                    originalTimestamp: message.data.originalTimestamp,
                    currentChatFriend,
                    isCorrectSender: message.from === friendUsername,
                    isActiveChat: currentChatFriend === friendUsername
                });
                
                // Дополнительная проверка: убеждаемся, что это подтверждение от того, кому мы отправляли
                if (message.from === friendUsername) {
                    console.log(`✅ Получено подтверждение доставки от ${friendUsername}`);
                } else {
                    console.log(`⚠️ Подтверждение от неправильного отправителя: ожидали ${friendUsername}, получили ${message.from}`);
                }
            }
            break;
        case 'ping':
            // Автоматически отвечаем pong
            sendP2PMessage(friendUsername, {
                type: 'pong',
                to: friendUsername,
                timestamp: Date.now()
            });
            break;
        case 'pong':
            console.log(`Получен pong от ${friendUsername}`);
            if (p2pConnections[friendUsername]) {
                p2pConnections[friendUsername].lastPong = Date.now();
            }
            break;
        case 'delete_message':
            console.log(`🗑️ Получена команда удаления сообщения от ${friendUsername}:`, message.data);
            if (message.data && message.data.timestamp) {
                // Удаляем сообщение из IndexedDB
                deleteMessageFromDB(message.data.timestamp, friendUsername);
                
                // Скрываем сообщение в UI, если чат открыт
                if (currentChatFriend === friendUsername) {
                    hideMessageInUI(message.data.timestamp);
                }
                
                console.log(`✅ Сообщение ${message.data.timestamp} удалено по команде от ${friendUsername}`);
            }
            break;
    }
}

// Отправка P2P сообщения
function sendP2PMessage(friendUsername, message) {
    if (p2pConnections[friendUsername] && 
        p2pConnections[friendUsername].dataChannel && 
        p2pConnections[friendUsername].dataChannel.readyState === 'open') {
        
        try {
            p2pConnections[friendUsername].dataChannel.send(JSON.stringify(message));
            // Обновляем время последней активности
            p2pConnections[friendUsername].lastActivity = Date.now();
            console.log(`📤 P2P сообщение отправлено к ${friendUsername}:`, message.type);
            return true;
        } catch (error) {
            console.error('❌ Ошибка отправки P2P сообщения:', error);
            return false;
        }
    }
    console.log(`❌ P2P соединение с ${friendUsername} недоступно`);
    return false;
}

// Подключение к чат-серверу
function connectChatWebSocket() {
    if (!currentUser.id) return;
    
    // Если уже подключены, не создаем новое соединение
    if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
        console.log('✅ Chat WebSocket уже подключен');
        return;
    }
    
    // Если соединение в процессе подключения, ждем
    if (window.chatWs && window.chatWs.readyState === WebSocket.CONNECTING) {
        console.log('⏳ Chat WebSocket уже подключается...');
        return;
    }
    
    try {
        console.log('🔌 Пытаемся подключиться к wss://lizacom.ru:9002');
        const chatWs = new WebSocket('wss://lizacom.ru:9002');
        
        chatWs.onopen = () => {
            console.log(`✅ Chat WebSocket подключен для пользователя ${currentUser.id}`);
            window.chatWs = chatWs; // Сохраняем ссылку на WebSocket
            updateChatStatus('Подключено к чат-серверу', 'connected');
            
            // Аутентификация
            chatWs.send(JSON.stringify({
                type: 'auth',
                data: { userId: currentUser.id }
            }));
            console.log(`🔐 Отправлена аутентификация для пользователя ${currentUser.id}`);
        };
        
        chatWs.onerror = (error) => {
            console.error('❌ Ошибка Chat WebSocket:', error);
            updateChatStatus('Ошибка подключения к чат-серверу', 'error');
        };
        
        chatWs.onclose = (event) => {
            console.log('❌ Chat WebSocket закрыт:', event.code, event.reason);
            updateChatStatus('Соединение с чат-сервером закрыто', 'disconnected');
            
            // Автоматическое переподключение через 3 секунды
            if (currentUser.id) {
                setTimeout(() => {
                    if (currentUser.id && (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN)) {
                        console.log('🔄 Переподключение к Chat WebSocket...');
                        connectChatWebSocket();
                    }
                }, 3000);
            }
        };
        
        chatWs.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log(`📨 Получено сообщение от Chat WebSocket для ${currentUser.id}:`, message.type);
                
                // Проверяем, является ли сообщение P2P сигналом
                if (message.type && message.type.startsWith('p2p_')) {
                    handleP2PSignal(message);
                } else if (message.type === 'auth_success') {
                    console.log(`✅ Аутентификация успешна для пользователя ${currentUser.id}`);
                } else {
                    handleChatMessage(message);
                }
            } catch (error) {
                console.error('Ошибка парсинга сообщения чата:', error);
            }
        };
        
        
        // Сохраняем соединение
        window.chatWs = chatWs;
        
    } catch (error) {
        console.error('❌ Ошибка создания Chat WebSocket:', error);
        updateChatStatus('Ошибка создания WebSocket соединения', 'error');
    }
}

// Обработка сообщений чата
function handleChatMessage(message) {
    switch (message.type) {
        case 'auth_success':
            updateChatStatus('Чат готов к использованию', 'connected');
            break;
        case 'chat_message':
            // Обрабатываем входящие сообщения
            if (message.from !== currentUser.id) {
                // Это сообщение от другого пользователя
                const senderUsername = message.from;
                
                // Сохраняем сообщение в историю (всегда)
                saveIncomingMessage(senderUsername, message.data.message, message.from, message.data.timestamp, message.data.type);
                
                // Добавляем в чат, если он открыт с этим пользователем
                if (currentChatFriend === senderUsername) {
                    addChatMessage(message.data.message, message.from, message.data.timestamp, message.data.type);
                } else {
                    // Чат не открыт - показываем уведомление
                    showChatNotification(senderUsername, message.data.message);
                }
            }
            break;
        case 'error':
            updateChatStatus('Ошибка чат-сервера: ' + message.message, 'error');
            break;
    }
}

// Добавление сообщения в чат
function addChatMessage(message, from, timestamp, type, isFromHistory = false, status = null) {
    console.log('🔍 addChatMessage вызвана:', {
        message: message,
        from: from,
        timestamp: timestamp,
        type: type,
        isFromHistory: isFromHistory,
        currentUser: currentUser
    });
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.error('❌ Элемент chatMessages не найден!');
        return;
    }
    
    const messageDiv = document.createElement('div');
    
    const isOwn = from === currentUser.id;
    const messageId = `${from}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    messageDiv.setAttribute('data-timestamp', timestamp);
    messageDiv.setAttribute('data-message-id', messageId);
    messageDiv.className = 'message-item';
    messageDiv.style.cssText = `
        margin: 10px 0;
        padding: 10px 15px;
        border-radius: 15px;
        max-width: 70%;
        word-wrap: break-word;
        background: ${isOwn ? '#4CAF50' : '#e0e0e0'};
        color: ${isOwn ? 'white' : '#333'};
        margin-left: ${isOwn ? 'auto' : '0'};
        text-align: ${isOwn ? 'right' : 'left'};
    `;
    
    // Добавляем обработчик клика для выделения
    messageDiv.onclick = () => toggleMessageSelection(timestamp.toString());
    
    if (type === 'emoji') {
        // Проверяем, содержит ли сообщение только эмодзи или смешанный контент
        const isOnlyEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]+$/u.test(message);
        
        if (isOnlyEmoji) {
            // Только эмодзи - больший размер
            const statusHTML = isOwn ? getMessageStatusHTML(status, timestamp) : '';
            messageDiv.innerHTML = `
                <div style="font-size: 24px;">${message}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(timestamp).toLocaleTimeString()}</div>
                ${statusHTML}
            `;
        } else {
            // Смешанный контент - обычный размер
            const statusHTML = isOwn ? getMessageStatusHTML(status, timestamp) : '';
            messageDiv.innerHTML = `
                <div style="font-size: 16px;">${message}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(timestamp).toLocaleTimeString()}</div>
                ${statusHTML}
            `;
        }
    } else {
        const statusHTML = isOwn ? getMessageStatusHTML(status, timestamp) : '';
        messageDiv.innerHTML = `
            <div>${message}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(timestamp).toLocaleTimeString()}</div>
            ${statusHTML}
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Оптимизируем скролл - только для новых сообщений, не для истории
    if (!isFromHistory) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Если чат открыт с этим пользователем - сбрасываем счетчик непрочитанных
    if (currentChatFriend === from) {
        unreadMessages[from] = 0;
        updateUnreadIndicator(from);
        updateFriendsList();
        console.log(`🔴 Сброшен счетчик в addChatMessage для ${from}:`, unreadMessages[from]);
    }
}

// Получение HTML для статуса сообщения
function getMessageStatusHTML(status, timestamp) {
    if (!status) return '';
    
    switch (status) {
        case 'not_sent':
            return `<div class="message-status" style="font-size: 10px; opacity: 0.8; margin-top: 3px; color: #ff9800;">⏳ Отправляется</div>`;
        case 'sent':
            return `<div class="message-status" style="font-size: 10px; opacity: 0.8; margin-top: 3px; color: #4caf50;">✅ Отправлено</div>`;
        case 'cancelled':
            return `<div class="message-status" style="font-size: 10px; opacity: 0.8; margin-top: 3px; color: #f44336;">
                <span style="color: #f44336;">❌ Отменено</span>
                <span onclick="retryMessage('${timestamp}')" style="color: #2196f3; cursor: pointer; margin-left: 5px;" title="Повторить отправку">🔄</span>
            </div>`;
        default:
            return '';
    }
}

// Обновление статуса сообщения в UI
function updateMessageStatusInUI(timestamp, status) {
    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
    if (messageElement) {
        const statusElement = messageElement.querySelector('.message-status');
        if (statusElement) {
            statusElement.outerHTML = getMessageStatusHTML(status, timestamp);
        }
    }
}

// Обновление статуса сообщения в IndexedDB
async function updateMessageStatusInDB(friendUsername, timestamp, status) {
    try {
        if (!currentUser || !currentUser.id) {
            console.error('❌ currentUser не определен для обновления статуса в IndexedDB');
            return;
        }
        
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${friendUsername}`;
        
        // Получаем все сообщения из чата
        const messages = await db.getRecentMessages(chatId, 1000);
        
        // Ищем сообщение с нужным timestamp
        const messageIndex = messages.findIndex(msg => msg.timestamp === timestamp);
        
        if (messageIndex !== -1) {
            // Обновляем статус сообщения
            messages[messageIndex].status = status;
            
            // Сохраняем обновленное сообщение обратно в IndexedDB
            await db.saveMessage(chatId, messages[messageIndex]);
            console.log(`✅ Статус сообщения обновлен в IndexedDB: ${status}`);
        } else {
            console.log(`⚠️ Сообщение с timestamp ${timestamp} не найдено в IndexedDB для обновления статуса`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка обновления статуса сообщения в IndexedDB:', error);
    }
}

// Повторная отправка сообщения
function retryMessage(timestamp) {
    console.log(`🔄 Повторная отправка сообщения ${timestamp}`);
    
    // Находим сообщение в очереди
    if (messageQueues[currentChatFriend]) {
        const queuedMessage = messageQueues[currentChatFriend].find(msg => msg.timestamp === timestamp);
        if (queuedMessage) {
            // Обновляем статус на "not_sent"
            updateMessageStatusInUI(timestamp, 'not_sent');
            updateMessageStatusInDB(currentChatFriend, timestamp, 'not_sent');
            
            // Сбрасываем счетчик попыток
            queuedMessage.retries = 0;
            
            // Пытаемся отправить снова
            if (p2pConnections[currentChatFriend] && p2pConnections[currentChatFriend].status === 'connected') {
                const success = sendP2PMessage(currentChatFriend, {
                    type: 'chat_message',
                    to: currentChatFriend,
                    data: {
                        message: queuedMessage.message,
                        from: currentUser.id,
                        timestamp: timestamp,
                        type: queuedMessage.type
                    }
                });
                
                if (success) {
                    updateMessageStatusInUI(timestamp, 'sent');
                    updateMessageStatusInDB(currentChatFriend, timestamp, 'sent');
                    
                    // Удаляем из очереди
                    const index = messageQueues[currentChatFriend].indexOf(queuedMessage);
                    if (index > -1) {
                        messageQueues[currentChatFriend].splice(index, 1);
                    }
                }
            } else {
                // P2P нет - отправляем ping
                sendP2PSignal('ping', { to: currentChatFriend });
            }
        }
    }
}
