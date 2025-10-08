// ===== СИСТЕМА ОЧЕРЕДЕЙ =====

// Отправка сообщений из очереди
function sendQueuedMessages(friendUsername) {
    if (!messageQueues[friendUsername] || messageQueues[friendUsername].length === 0) {
        return;
    }
    
    console.log(`📤 Отправляем ${messageQueues[friendUsername].length} сообщений из очереди для ${friendUsername}`);
    
    const messages = [...messageQueues[friendUsername]];
    messageQueues[friendUsername] = [];
    
    messages.forEach(message => {
        sendP2PMessage(friendUsername, message);
    });
}

// Добавление сообщения в очередь
function addMessageToQueue(friendUsername, message) {
    if (!messageQueues[friendUsername]) {
        messageQueues[friendUsername] = [];
    }
    
    messageQueues[friendUsername].push(message);
    console.log(`📋 Сообщение добавлено в очередь для ${friendUsername}`);
}
