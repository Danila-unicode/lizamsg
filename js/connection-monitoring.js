// ===== МОНИТОРИНГ СОЕДИНЕНИЯ =====

// Периодическая проверка соединения с чат-сервером
let connectionCheckInterval = null;

// Запуск мониторинга соединения
function startConnectionMonitoring() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
    
    connectionCheckInterval = setInterval(() => {
        checkChatConnection();
    }, 30000); // Проверяем каждые 30 секунд
}

// Остановка мониторинга соединения
function stopConnectionMonitoring() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
    }
}

// Проверка соединения с чат-сервером
function checkChatConnection() {
    if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
        console.log('🔄 Chat WebSocket неактивен, переподключаемся...');
        connectChatWebSocket();
    }
}
