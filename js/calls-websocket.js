// ===== WEBSOCKET ДЛЯ ЗВОНКОВ =====

// Подключение к WebSocket серверу для звонков
function connectCallsWebSocket() {
    return new Promise((resolve, reject) => {
        try {
            const wsUrl = `${WEBSOCKET_URL}?username=${encodeURIComponent(currentUser.id)}`;
            currentUser.callsWs = new WebSocket(wsUrl);
            
            currentUser.callsWs.onopen = () => {
                currentUser.callsWsConnected = true;
                currentUser.log('🔌 WebSocket для звонков подключен', 'success');
                resolve();
            };
            
            currentUser.callsWs.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleCallsWebSocketMessage(message);
                } catch (error) {
                    currentUser.log(`❌ Ошибка парсинга сообщения звонков: ${error.message}`, 'error');
                }
            };
            
            currentUser.callsWs.onclose = () => {
                currentUser.callsWsConnected = false;
                currentUser.log('🔌 WebSocket для звонков отключен', 'warning');
                
                // Автоматическое переподключение через 3 секунды
                if (currentUser.id) {
                    setTimeout(() => {
                        if (currentUser.id && !currentUser.callsWsConnected) {
                            currentUser.log('🔄 Переподключение к WebSocket звонков...', 'info');
                            connectCallsWebSocket().catch(error => {
                                currentUser.log(`❌ Ошибка переподключения звонков: ${error.message}`, 'error');
                            });
                        }
                    }, 3000);
                }
            };
            
            currentUser.callsWs.onerror = (error) => {
                currentUser.log(`❌ Ошибка WebSocket звонков: ${error.message}`, 'error');
                reject(error);
            };
        
        } catch (error) {
                reject(error);
            }
        });
}

// Обработка сообщений WebSocket для звонков
function handleCallsWebSocketMessage(message) {
    // Обрабатываем системные сообщения
    if (message.type === 'connected') {
        currentUser.log(`✅ Подключение к серверу подтверждено`, 'success');
        // Сохраняем userId от сервера для WebSocket сообщений
        if (message.userId) {
            currentUser.wsUserId = message.userId;
            currentUser.log(`🆔 WebSocket ID: ${message.userId}`, 'info');
        }
        return;
    }
    
    if (message.type === 'error') {
        currentUser.log(`❌ Ошибка сервера: ${message.message}`, 'error');
        return;
    }
    
    // Обрабатываем P2P сигналы
    if (message.type.startsWith('p2p_')) {
        handleP2PSignal(message);
        return;
    }
    
    // Обрабатываем сигналы
    if (message.from) {
        currentUser.log(`📨 Получено: ${message.type} от ${message.from}`, 'info');
    }
    
    switch (message.type) {
        case 'ping':
            handlePing(message);
            break;
        case 'pong':
            handlePong(message);
            break;
        case 'offer':
            handleOffer(message);
            break;
        case 'answer':
            handleAnswer(message);
            break;
        case 'ice-candidate':
            handleIceCandidate(message);
            break;
        case 'disconnect':
            handleDisconnect(message);
            break;
        case 'chat_message':
            handleChatMessage(message);
            break;
        default:
            if (message.from) {
                currentUser.log(`⚠️ Неизвестный тип сообщения: ${message.type}`, 'warning');
            }
    }
}

// Отправка сообщения через WebSocket для звонков
function sendCallsWebSocketMessage(type, data, to = null) {
    if (!currentUser.callsWsConnected || !currentUser.callsWs) {
        currentUser.log('❌ WebSocket для звонков не подключен', 'error');
        return;
    }
    
    const message = {
        type: type,
        from: currentUser.wsUserId || currentUser.id,
        to: to || currentUser.targetUser,
        data: data,
        timestamp: Date.now()
    };
    
    try {
        currentUser.callsWs.send(JSON.stringify(message));
        currentUser.log(`✅ ${type} отправлен`, 'success');
    } catch (error) {
        currentUser.log(`❌ Ошибка отправки ${type}: ${error.message}`, 'error');
    }
}
