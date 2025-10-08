// ===== UI ИНДИКАТОРЫ СТАТУСА =====

// Обновление статуса чата
function updateChatStatus(message, type) {
    const statusElement = document.getElementById('chatStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
    }
}

// Обновление индикатора непрочитанных сообщений
function updateUnreadIndicator(friendUsername) {
    const friendElement = document.querySelector(`[data-friend="${friendUsername}"]`);
    if (friendElement) {
        const unreadCount = unreadMessages[friendUsername] || 0;
        const indicator = friendElement.querySelector('.unread-indicator');
        
        if (unreadCount > 0) {
            if (!indicator) {
                const newIndicator = document.createElement('span');
                newIndicator.className = 'unread-indicator';
                newIndicator.style.cssText = `
                    background: #f44336;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 12px;
                    margin-left: 5px;
                `;
                friendElement.appendChild(newIndicator);
            }
            friendElement.querySelector('.unread-indicator').textContent = unreadCount;
        } else if (indicator) {
            indicator.remove();
        }
    }
}

// Показать уведомление о новом сообщении
function showChatNotification(friendUsername, message) {
    // Увеличиваем счетчик непрочитанных
    unreadMessages[friendUsername] = (unreadMessages[friendUsername] || 0) + 1;
    updateUnreadIndicator(friendUsername);
    updateFriendsList();
    
    // Показываем системное уведомление
    if (Notification.permission === 'granted') {
        new Notification(`Новое сообщение от ${friendUsername}`, {
            body: message,
            icon: '/favicon.ico'
        });
    }
}
