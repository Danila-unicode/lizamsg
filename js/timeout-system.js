// ===== СИСТЕМА ТАЙМАУТОВ =====

// Установка таймаута соединения
function setConnectionTimeout(friendUsername, timeout) {
    if (connectionTimeouts[friendUsername]) {
        clearTimeout(connectionTimeouts[friendUsername]);
    }
    
    connectionTimeouts[friendUsername] = setTimeout(() => {
        console.log(`⏰ Таймаут соединения с ${friendUsername}`);
        closeP2PConnection(friendUsername);
    }, timeout);
}

// Очистка таймаута соединения
function clearConnectionTimeout(friendUsername) {
    if (connectionTimeouts[friendUsername]) {
        clearTimeout(connectionTimeouts[friendUsername]);
        delete connectionTimeouts[friendUsername];
    }
}
