// WebSocket клиент для WebRTC сигналинга
class WebSocketClient {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.sessionId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Callbacks для обработки событий
        this.onIncomingCall = null;
        this.onCallAnswered = null;
        this.onCallEnded = null;
        this.onIceCandidate = null;
        this.onOffer = null;
        this.onAnswer = null;
        this.onError = null;
    }
    
    // Подключение к WebSocket серверу
    connect(userId) {
        this.userId = userId;
        
        try {
                    // Подключаемся к WSS серверу на VK Cloud через порт 3479
        this.ws = new WebSocket('wss://lizamsg.ru:8080');
            
                            this.ws.onopen = () => {
                    console.log('WebSocket подключение установлено к VK Cloud серверу (WSS) на порту 3479');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Аутентифицируемся
                this.authenticate();
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket подключение закрыто');
                this.isConnected = false;
                this.handleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket ошибка:', error);
                this.isConnected = false;
            };
            
        } catch (error) {
            console.error('Ошибка подключения к WebSocket:', error);
            this.handleError('Ошибка подключения к серверу');
        }
    }
    
    // Аутентификация пользователя
    authenticate() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'auth',
                userId: this.userId
            }));
        }
    }
    
    // Обработка входящих сообщений
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Получено WebSocket сообщение:', message.type);
            
            switch (message.type) {
                case 'auth_success':
                    console.log('Аутентификация успешна');
                    break;
                    
                case 'incoming_call':
                    console.log('Входящий звонок от:', message.callerId);
                    if (this.onIncomingCall) {
                        this.onIncomingCall(message.callerId, message.callId);
                    }
                    break;
                    
                case 'call_answered':
                    console.log('Звонок принят пользователем:', message.userId);
                    if (this.onCallAnswered) {
                        this.onCallAnswered(message.userId, message.callId);
                    }
                    break;
                    
                case 'call_ended':
                    console.log('Звонок завершен пользователем:', message.userId);
                    if (this.onCallEnded) {
                        this.onCallEnded(message.userId);
                    }
                    break;
                    
                case 'ice_candidate':
                    console.log('Получен ICE кандидат от:', message.userId);
                    if (this.onIceCandidate) {
                        this.onIceCandidate(message.userId, message.candidate);
                    }
                    break;
                    
                case 'offer':
                    console.log('Получен WebRTC offer от:', message.userId);
                    if (this.onOffer) {
                        this.onOffer(message.userId, message.offer);
                    }
                    break;
                    
                case 'answer':
                    console.log('Получен WebRTC answer от:', message.userId);
                    if (this.onAnswer) {
                        this.onAnswer(message.userId, message.answer);
                    }
                    break;
                    
                case 'error':
                    console.error('WebSocket ошибка:', message.message);
                    this.handleError(message.message);
                    break;
                    
                default:
                    console.log('Неизвестный тип сообщения:', message.type);
            }
            
        } catch (error) {
            console.error('Ошибка обработки WebSocket сообщения:', error);
        }
    }
    
    // Отправка запроса на звонок
    sendCallRequest(receiverId, callId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'call_request',
                receiverId: receiverId,
                callId: callId
            }));
        }
    }
    
    // Отправка ответа на звонок
    sendCallAnswer(callerId, callId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'call_answer',
                callerId: callerId,
                callId: callId
            }));
        }
    }
    
    // Отправка ICE кандидата
    sendIceCandidate(targetId, candidate) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'ice_candidate',
                targetId: targetId,
                candidate: candidate
            }));
        }
    }
    
    // Отправка WebRTC offer
    sendOffer(targetId, offer) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'offer',
                targetId: targetId,
                offer: offer
            }));
        }
    }
    
    // Отправка WebRTC answer
    sendAnswer(targetId, answer) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'answer',
                targetId: targetId,
                answer: answer
            }));
        }
    }
    
    // Завершение звонка
    endCall(targetId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'end_call',
                targetId: targetId
            }));
        }
    }
    
    // Обработка переподключения
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect(this.userId);
            }, 2000 * this.reconnectAttempts);
        } else {
            console.error('Превышено максимальное количество попыток переподключения');
            this.handleError('Не удалось переподключиться к серверу');
        }
    }
    
    // Обработка ошибок
    handleError(message) {
        if (this.onError) {
            this.onError(message);
        }
    }
    
    // Отключение
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.isConnected = false;
        this.userId = null;
        this.sessionId = null;
    }
    
    // Проверка состояния подключения
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            userId: this.userId,
            sessionId: this.sessionId
        };
    }
}

// Экспортируем класс для использования
window.WebSocketClient = WebSocketClient;
