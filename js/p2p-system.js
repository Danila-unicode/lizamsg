// ===== P2P СИСТЕМА =====

// P2P соединения (один на друга)
let p2pConnections = {}; // {friendUsername: {connection, dataChannel, status}}
let messageQueues = {}; // {friendUsername: [messages]} - очереди недоставленных сообщений
let pingIntervals = {}; // {friendUsername: intervalId} - интервалы ping-понг
let connectionTimeouts = {}; // {friendUsername: timeoutId} - таймауты соединений

// Конфигурация P2P
const P2P_CONFIG = {
    pingInterval: 30000, // 30 секунд
    pingTimeout: 10000,  // 10 секунд ожидания pong
    maxRetries: 5,       // 5 попыток доставки
    retryTimeout: 300000, // 5 минут общий таймаут
    inactiveTimeout: 300000 // 5 минут неактивности
};

// Открытие чата с другом
function openChat(friendUsername) {
    // Показываем встроенный чат в правой части
    document.getElementById('chatFriendName').textContent = friendUsername;
    document.getElementById('chatContainer').style.display = 'block';
    
    // Сбрасываем счетчик непрочитанных СРАЗУ при открытии чата
    unreadMessages[friendUsername] = 0;
    updateUnreadIndicator(friendUsername);
    updateFriendsList();
    
    console.log(`🔴 Сброшен счетчик для ${friendUsername}:`, unreadMessages[friendUsername]);
    
    // Инициализируем чат
    initializeChat(friendUsername);
}

// Инициализация встроенного чата
// Счетчик попыток подключения к Chat WebSocket
let chatConnectionAttempts = 0;
const maxChatConnectionAttempts = 3;

function initializeChat(friendUsername) {
    currentChatFriend = friendUsername;
    
    // Сбрасываем счетчик непрочитанных сообщений
    unreadMessages[friendUsername] = 0;
    updateUnreadIndicator(friendUsername);
    updateFriendsList();
    
    console.log(`🔴 Сброшен счетчик в initializeChat для ${friendUsername}:`, unreadMessages[friendUsername]);
    
    // Очищаем сообщения
    document.getElementById('chatMessages').innerHTML = '';
    
    // Загружаем историю сообщений СРАЗУ, без ожидания подключения
    loadChatHistory(friendUsername);
    
    // Отладка localStorage
    debugLocalStorage();
    
    // Проверяем, что Chat WebSocket подключен для P2P
    if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
        console.log('✅ Chat WebSocket готов для P2P');
        
        // Проверяем, есть ли уже P2P соединение
        const hasP2PConnection = p2pConnections[friendUsername] && 
                              p2pConnections[friendUsername].dataChannel && 
                              p2pConnections[friendUsername].dataChannel.readyState === 'open' &&
                              p2pConnections[friendUsername].status === 'connected';
        
        if (hasP2PConnection) {
            console.log(`✅ P2P соединение с ${friendUsername} уже установлено`);
        } else {
            console.log(`📡 P2P соединения с ${friendUsername} нет, отправляем ping`);
            sendP2PSignal('ping', { to: friendUsername });
        }
    } else {
        console.log('❌ Chat WebSocket не готов для P2P, подключаемся...');
        connectChatWebSocket();
        
        // Ждем подключения и повторяем P2P логику
        setTimeout(() => {
            if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
                sendP2PSignal('ping', { to: friendUsername });
            }
        }, 2000);
    }
}
