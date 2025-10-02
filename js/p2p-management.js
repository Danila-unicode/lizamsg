// ===== УПРАВЛЕНИЕ P2P СОЕДИНЕНИЯМИ =====

// Закрытие P2P соединения
function closeP2PConnection(friendUsername) {
    if (p2pConnections[friendUsername]) {
        const connection = p2pConnections[friendUsername];
        
        if (connection.dataChannel) {
            connection.dataChannel.close();
        }
        
        if (connection.connection) {
            connection.connection.close();
        }
        
        if (connection.connectionTimeout) {
            clearTimeout(connection.connectionTimeout);
        }
        
        delete p2pConnections[friendUsername];
        console.log(`🔌 P2P соединение с ${friendUsername} закрыто`);
    }
    
    // Останавливаем ping-понг мониторинг
    stopPingPongMonitoring(friendUsername);
    
    // Очищаем таймауты
    clearConnectionTimeout(friendUsername);
}

// Проверка, нужно ли поддерживать P2P соединение
function shouldMaintainP2PConnection(friendUsername) {
    const connection = p2pConnections[friendUsername];
    if (!connection) return false;
    
    const now = Date.now();
    const lastActivity = connection.lastActivity || 0;
    const inactiveTime = now - lastActivity;
    
    // Если неактивность больше 5 минут - закрываем соединение
    return inactiveTime < P2P_CONFIG.inactiveTimeout;
}

// Периодическая очистка неактивных P2P соединений
function startP2PCleanup() {
    setInterval(() => {
        Object.keys(p2pConnections).forEach(friendUsername => {
            if (!shouldMaintainP2PConnection(friendUsername)) {
                console.log(`🧹 Закрываем неактивное P2P соединение с ${friendUsername}`);
                closeP2PConnection(friendUsername);
            }
        });
    }, 60000); // Проверяем каждую минуту
}
