// ===== PING-PONG МОНИТОРИНГ =====

// Запуск ping-понг мониторинга для друга
function startPingPongMonitoring(friendUsername) {
    if (pingIntervals[friendUsername]) {
        clearInterval(pingIntervals[friendUsername]);
    }
    
    pingIntervals[friendUsername] = setInterval(() => {
        sendPingToFriend(friendUsername);
    }, P2P_CONFIG.pingInterval);
    
    console.log(`🏓 Ping-понг мониторинг запущен для ${friendUsername}`);
}

// Остановка ping-понг мониторинга для друга
function stopPingPongMonitoring(friendUsername) {
    if (pingIntervals[friendUsername]) {
        clearInterval(pingIntervals[friendUsername]);
        delete pingIntervals[friendUsername];
        console.log(`🏓 Ping-понг мониторинг остановлен для ${friendUsername}`);
    }
}

// Отправка ping другу
function sendPingToFriend(friendUsername) {
    if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
        sendP2PMessage(friendUsername, {
            type: 'ping',
            to: friendUsername,
            timestamp: Date.now()
        });
        console.log(`🏓 Ping отправлен к ${friendUsername}`);
    }
}
