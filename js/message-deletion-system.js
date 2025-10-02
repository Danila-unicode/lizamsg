// ===== СИСТЕМА УДАЛЕНИЯ СООБЩЕНИЙ =====

// Инициализация системы удаления
function initDeleteSystem() {
    deleteButton = document.getElementById('deleteSelectedMessages');
    if (deleteButton) {
        updateDeleteButton();
    }
}

// Выделение/снятие выделения сообщения
function toggleMessageSelection(timestamp) {
    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
    if (!messageElement) return;
    
    if (selectedMessages.has(timestamp)) {
        // Снимаем выделение
        selectedMessages.delete(timestamp);
        messageElement.classList.remove('selected');
    } else {
        // Добавляем выделение
        selectedMessages.add(timestamp);
        messageElement.classList.add('selected');
    }
    
    updateDeleteButton();
}

// Обновление кнопки удаления
function updateDeleteButton() {
    if (!deleteButton) return;
    
    if (selectedMessages.size > 0) {
        deleteButton.style.display = 'block';
        deleteButton.textContent = `🗑️ ${selectedMessages.size}`;
    } else {
        deleteButton.style.display = 'none';
    }
}

// Удаление выделенных сообщений
async function deleteSelectedMessages() {
    if (selectedMessages.size === 0) return;
    
    // Показываем модальное окно с опциями удаления
    showDeleteOptionsModal();
}

// Показать модальное окно с опциями удаления
function showDeleteOptionsModal() {
    const modal = document.createElement('div');
    modal.id = 'deleteMessagesModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const selectedCount = selectedMessages.size;
    const canDeleteFromRecipient = canDeleteMessagesFromRecipient();
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px; width: 90%;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Удалить ${selectedCount} сообщений</h3>
            <p style="margin: 0 0 20px 0; color: #666;">Выберите вариант удаления:</p>
            
            <button onclick="deleteMessagesLocally()" 
                    style="width: 100%; padding: 12px; margin: 5px 0; background: #ff9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                🗑️ Удалить только у меня (${selectedCount} сообщений)
            </button>
            
            ${canDeleteFromRecipient ? `
            <button onclick="deleteMessagesGlobally()" 
                    style="width: 100%; padding: 12px; margin: 5px 0; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                🗑️ Удалить у меня и получателя (${selectedCount} сообщений)
            </button>
            ` : ''}
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
                ⚠️ <strong>Внимание:</strong> ${canDeleteFromRecipient ? 
                    'Сообщения у получателя могут быть не удалены, если получатель не в сети или сообщения старше 1 часа' : 
                    'Некоторые сообщения старше 1 часа - их можно удалить только у себя'}
            </div>
            
            <button onclick="closeDeleteModal()" 
                    style="width: 100%; padding: 12px; margin: 5px 0; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                ❌ Отмена
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Закрыть модальное окно удаления
function closeDeleteModal() {
    const modal = document.getElementById('deleteMessagesModal');
    if (modal) {
        modal.remove();
    }
}

// Проверить, можно ли удалить сообщения у получателя
function canDeleteMessagesFromRecipient() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Проверяем, есть ли среди выделенных сообщений входящие (не собственные)
    let hasIncomingMessages = false;
    let hasRecentMessages = false;
    
    for (const timestamp of selectedMessages) {
        const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
        if (messageElement) {
            // Проверяем, является ли сообщение входящим (не собственным)
            const isOwn = messageElement.style.marginLeft === 'auto';
            if (!isOwn) {
                hasIncomingMessages = true;
            }
            
            // Проверяем возраст сообщения
            const messageTime = new Date(parseInt(timestamp));
            if (now - messageTime.getTime() <= oneHour) {
                hasRecentMessages = true;
            }
        }
    }
    
    // Если есть входящие сообщения - глобальное удаление недоступно
    if (hasIncomingMessages) {
        return false;
    }
    
    // Если есть только исходящие сообщения младше часа - глобальное удаление доступно
    return hasRecentMessages;
}

// Удалить сообщения только у отправителя
async function deleteMessagesLocally() {
    console.log(`🗑️ Локальное удаление ${selectedMessages.size} сообщений`);
    
    try {
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
        const messages = await db.getRecentMessages(chatId, 1000);
        
        // Удаляем выделенные сообщения
        const filteredMessages = messages.filter(msg => !selectedMessages.has(msg.timestamp.toString()));
        
        // Сохраняем отфильтрованные сообщения
        for (const message of filteredMessages) {
            await db.saveMessage(chatId, message);
        }
        
        // Скрываем сообщения в UI
        selectedMessages.forEach(timestamp => {
            hideMessageInUI(timestamp);
        });
        
        // Очищаем выделение
        clearSelection();
        
        console.log(`✅ ${selectedMessages.size} сообщений удалено локально`);
        
    } catch (error) {
        console.error('❌ Ошибка локального удаления:', error);
    }
    
    closeDeleteModal();
}

// Удалить сообщения у отправителя и получателя
async function deleteMessagesGlobally() {
    console.log(`🗑️ Умное глобальное удаление ${selectedMessages.size} сообщений`);
    
    try {
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
        const messages = await db.getRecentMessages(chatId, 1000);
        
        // Анализируем каждое сообщение
        const messagesToDelete = [];
        const messagesToCancel = [];
        const messagesToKeep = [];
        
        for (const message of messages) {
            if (selectedMessages.has(message.timestamp.toString())) {
                // Анализируем статус сообщения
                if (message.status === 'sent') {
                    // Сообщение доставлено - проверяем онлайн статус
                    messagesToDelete.push(message);
                } else if (message.status === 'not_sent' || message.status === 'cancelled') {
                    // Сообщение не отправлено - отменяем отправку
                    messagesToCancel.push(message);
                } else {
                    // Неизвестный статус - оставляем как есть
                    messagesToKeep.push(message);
                }
            } else {
                messagesToKeep.push(message);
            }
        }
        
        // Обрабатываем отмену отправки
        if (messagesToCancel.length > 0) {
            console.log(`🚫 Отменяем отправку ${messagesToCancel.length} неотправленных сообщений`);
            messagesToCancel.forEach(message => {
                // Обновляем статус на "cancelled" и добавляем кнопку повтора
                updateMessageStatusInUI(message.timestamp, 'cancelled');
                updateMessageStatusInDB(currentChatFriend, message.timestamp, 'cancelled');
            });
        }
        
        // Обрабатываем удаление доставленных сообщений
        if (messagesToDelete.length > 0) {
            // Проверяем онлайн статус получателя
            const isRecipientOnline = await checkRecipientOnlineStatus(currentChatFriend);
            
            if (isRecipientOnline) {
                // Получатель онлайн - удаляем через P2P
                await deleteDeliveredMessages(messagesToDelete);
            } else {
                // Получатель офлайн - показываем предупреждение
                showOfflineRecipientWarning(messagesToDelete.length);
                return; // Не закрываем модальное окно
            }
        }
        
        // Сохраняем оставшиеся сообщения
        for (const message of messagesToKeep) {
            await db.saveMessage(chatId, message);
        }
        
        // Скрываем сообщения в UI
        selectedMessages.forEach(timestamp => {
            hideMessageInUI(timestamp);
        });
        
        // Очищаем выделение
        clearSelection();
        
        console.log(`✅ Умное удаление завершено: ${messagesToDelete.length} удалено, ${messagesToCancel.length} отменено`);
        
    } catch (error) {
        console.error('❌ Ошибка умного удаления:', error);
    }
    
    closeDeleteModal();
}

// Скрыть сообщение в UI
function hideMessageInUI(timestamp) {
    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
    if (messageElement) {
        messageElement.style.display = 'none';
    }
}

// Очистить выделение
function clearSelection() {
    selectedMessages.forEach(timestamp => {
        const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
        if (messageElement) {
            messageElement.classList.remove('selected');
        }
    });
    selectedMessages.clear();
    updateDeleteButton();
}

// Удалить сообщение из IndexedDB
async function deleteMessageFromDB(timestamp, friendUsername) {
    try {
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${friendUsername}`;
        const messages = await db.getRecentMessages(chatId, 1000);
        const messageIndex = messages.findIndex(msg => msg.timestamp.toString() === timestamp.toString());
        
        if (messageIndex !== -1) {
            messages.splice(messageIndex, 1);
            
            // Сохраняем обновленный массив сообщений
            for (const message of messages) {
                await db.saveMessage(chatId, message);
            }
            
            console.log(`✅ Сообщение ${timestamp} удалено из IndexedDB`);
        }
    } catch (error) {
        console.error('❌ Ошибка удаления сообщения из IndexedDB:', error);
    }
}

// Добавить команду удаления в очередь
function addDeleteCommandToQueue(friendUsername, timestamp) {
    if (!deleteCommandQueue[friendUsername]) {
        deleteCommandQueue[friendUsername] = [];
    }
    
    const deleteCommand = {
        timestamp: timestamp,
        from: currentUser.id,
        addedAt: Date.now(),
        attempts: 0
    };
    
    deleteCommandQueue[friendUsername].push(deleteCommand);
    console.log(`📋 Команда удаления добавлена в очередь для ${friendUsername}: ${timestamp}`);
}

// Отправить команду удаления через WebSocket
function sendDeleteCommandViaWebSocket(friendUsername, timestamp) {
    if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
        console.log(`⚠️ WebSocket недоступен для отправки команды удаления`);
        return false;
    }
    
    const deleteCommand = {
        type: 'delete_message',
        to: friendUsername,
        from: currentUser.id,
        data: {
            timestamp: timestamp,
            from: currentUser.id
        },
        timestamp: Date.now()
    };
    
    try {
        window.chatWs.send(JSON.stringify(deleteCommand));
        console.log(`📤 Команда удаления отправлена через WebSocket к ${friendUsername}: ${timestamp}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки команды удаления через WebSocket:', error);
        return false;
    }
}

// Обработать очередь команд удаления
function processDeleteCommandQueue(friendUsername) {
    if (!deleteCommandQueue[friendUsername] || deleteCommandQueue[friendUsername].length === 0) {
        return;
    }
    
    console.log(`🔄 Обрабатываем очередь команд удаления для ${friendUsername}: ${deleteCommandQueue[friendUsername].length} команд`);
    
    const commands = deleteCommandQueue[friendUsername];
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 минут максимальный возраст команды
    
    // Фильтруем команды по возрасту
    const validCommands = commands.filter(cmd => (now - cmd.addedAt) < maxAge);
    
    if (validCommands.length === 0) {
        console.log(`⏰ Все команды удаления для ${friendUsername} устарели, очищаем очередь`);
        deleteCommandQueue[friendUsername] = [];
        return;
    }
    
    // Отправляем команды через WebSocket
    validCommands.forEach(command => {
        command.attempts++;
        const success = sendDeleteCommandViaWebSocket(friendUsername, command.timestamp);
        
        if (success) {
            console.log(`✅ Команда удаления ${command.timestamp} отправлена (попытка ${command.attempts})`);
        } else {
            console.log(`❌ Не удалось отправить команду удаления ${command.timestamp} (попытка ${command.attempts})`);
        }
    });
    
    // Удаляем успешно отправленные команды
    deleteCommandQueue[friendUsername] = validCommands.filter(cmd => cmd.attempts < 3);
}

// Периодическая обработка очереди команд удаления
function startDeleteCommandProcessor() {
    setInterval(() => {
        Object.keys(deleteCommandQueue).forEach(friendUsername => {
            if (deleteCommandQueue[friendUsername].length > 0) {
                processDeleteCommandQueue(friendUsername);
            }
        });
    }, 10000); // Проверяем каждые 10 секунд
}

// Проверка онлайн статуса получателя
async function checkRecipientOnlineStatus(friendUsername) {
    console.log(`🔍 Проверяем онлайн статус получателя ${friendUsername}`);
    
    // Проверяем наличие P2P соединения
    if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
        console.log(`✅ Получатель ${friendUsername} онлайн (P2P соединение активно)`);
        return true;
    }
    
    // Отправляем ping для проверки онлайн статуса
    try {
        sendP2PSignal('ping', { to: friendUsername });
        
        // Ждем pong в течение 10 секунд
        const maxWaitTime = 10000;
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const checkPong = () => {
                if (p2pConnections[friendUsername] && p2pConnections[friendUsername].lastPong) {
                    const pongTime = p2pConnections[friendUsername].lastPong;
                    if (Date.now() - pongTime < 5000) { // Pong получен в течение последних 5 секунд
                        console.log(`✅ Получатель ${friendUsername} онлайн (получен pong)`);
                        resolve(true);
                        return;
                    }
                }
                
                if (Date.now() - startTime > maxWaitTime) {
                    console.log(`❌ Получатель ${friendUsername} офлайн (нет pong)`);
                    resolve(false);
                    return;
                }
                
                setTimeout(checkPong, 100);
            };
            checkPong();
        });
        
    } catch (error) {
        console.error(`❌ Ошибка проверки онлайн статуса ${friendUsername}:`, error);
        return false;
    }
}

// Удаление доставленных сообщений
async function deleteDeliveredMessages(messagesToDelete) {
    console.log(`🗑️ Удаляем ${messagesToDelete.length} доставленных сообщений`);
    
    try {
        // Устанавливаем P2P соединение для удаления
        await establishP2PForDeletion(currentChatFriend, messagesToDelete);
        
        // Удаляем сообщения из IndexedDB
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
        const messages = await db.getRecentMessages(chatId, 1000);
        
        const filteredMessages = messages.filter(msg => 
            !messagesToDelete.some(toDelete => toDelete.timestamp === msg.timestamp)
        );
        
        // Сохраняем отфильтрованные сообщения
        for (const message of filteredMessages) {
            await db.saveMessage(chatId, message);
        }
        
        console.log(`✅ ${messagesToDelete.length} доставленных сообщений удалено`);
        
    } catch (error) {
        console.error('❌ Ошибка удаления доставленных сообщений:', error);
    }
}

// Показать предупреждение об офлайн получателе
function showOfflineRecipientWarning(messageCount) {
    const modal = document.getElementById('deleteMessagesModal');
    if (modal) {
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 15px 0; color: #333;">⚠️ Невозможно удалить сообщения</h3>
                <p style="margin: 0 0 20px 0; color: #666;">
                    Удалить ${messageCount} сообщений у получателя невозможно, так как он не в сети.
                </p>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
                    💡 <strong>Совет:</strong> Попробуйте удалить сообщения позже, когда получатель будет онлайн
                </div>
                <button onclick="closeDeleteModal()" 
                        style="width: 100%; padding: 12px; margin: 5px 0; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    ❌ Понятно
                </button>
            </div>
        `;
    }
}

// Установление P2P соединения для удаления сообщений
async function establishP2PForDeletion(friendUsername, messagesToDelete) {
    console.log(`🔧 Устанавливаем P2P соединение с ${friendUsername} для удаления ${messagesToDelete.length} сообщений`);
    
    try {
        // Устанавливаем P2P соединение
        await establishP2PConnection(friendUsername);
        
        // Ждем установления соединения (максимум 30 секунд)
        const maxWaitTime = 30000;
        const startTime = Date.now();
        
        const waitForConnection = () => {
            return new Promise((resolve, reject) => {
                const checkConnection = () => {
                    if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
                        console.log(`✅ P2P соединение установлено для удаления с ${friendUsername}`);
                        resolve();
                    } else if (Date.now() - startTime > maxWaitTime) {
                        console.log(`⏰ Таймаут установления P2P для удаления с ${friendUsername}`);
                        reject(new Error('P2P connection timeout'));
                    } else {
                        setTimeout(checkConnection, 100); // Проверяем каждые 100мс
                    }
                };
                checkConnection();
            });
        };
        
        await waitForConnection();
        
        // Отправляем команды удаления
        messagesToDelete.forEach(message => {
            sendP2PMessage(friendUsername, {
                type: 'delete_message',
                to: friendUsername,
                data: {
                    timestamp: message.timestamp,
                    from: currentUser.id
                }
            });
        });
        
        console.log(`📤 Команды удаления отправлены через P2P к ${friendUsername}`);
        
        // P2P соединение автоматически разорвется через 5 минут неактивности
        // благодаря существующей логике shouldMaintainP2PConnection
        
    } catch (error) {
        console.error(`❌ Ошибка установления P2P для удаления с ${friendUsername}:`, error);
        throw error; // Пробрасываем ошибку для обработки в вызывающей функции
    }
}
