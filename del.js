// ===== СИСТЕМА УДАЛЕНИЯ СООБЩЕНИЙ =====

console.log('📦 del.js загружен успешно');

// Глобальные переменные для удаления
let deleteTimeout = null;
let deleteRetryCount = 0;
const MAX_DELETE_RETRIES = 3;
const DELETE_TIMEOUT = 30000; // 30 секунд

// Проверка возможности глобального удаления
function canDeleteGlobally(messages) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 час в миллисекундах
    
    // Проверяем, есть ли сообщения младше часа
    const recentMessages = messages.filter(msg => 
        msg.status === 'sent' && (now - msg.timestamp) < oneHour
    );
    
    return recentMessages.length > 0;
}

// Проверка времени отправки сообщения
function isMessageTooOld(timestamp) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return (now - timestamp) > oneHour;
}

// Установка статуса "удалено" в IndexedDB
async function setMessageDeleted(chatId, timestamp, db) {
    try {
        const messages = await db.getRecentMessages(chatId, 1000);
        const messageIndex = messages.findIndex(msg => msg.timestamp === timestamp);
        
        if (messageIndex !== -1) {
            messages[messageIndex].status = 'deleted';
            await db.saveMessage(chatId, messages[messageIndex]);
            console.log(`✅ Статус сообщения ${timestamp} изменен на "удалено"`);
            return true;
        } else {
            console.log(`⚠️ Сообщение ${timestamp} не найдено в IndexedDB`);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка установки статуса "удалено":', error);
        return false;
    }
}

// Отправка команды удаления через P2P
function sendDeleteCommand(friendUsername, timestamp) {
    if (typeof sendP2PMessage !== 'function') {
        console.log(`❌ Функция sendP2PMessage не найдена`);
        return false;
    }
    
    if (p2pConnections[friendUsername] && 
        p2pConnections[friendUsername].dataChannel && 
        p2pConnections[friendUsername].dataChannel.readyState === 'open' &&
        p2pConnections[friendUsername].status === 'connected') {
        
        // P2P соединение установлено - отправляем команду
        const success = sendP2PMessage(friendUsername, {
            type: 'delete_message',
            to: friendUsername,
            data: {
                timestamp: timestamp,
                from: currentUser.id
            }
        });
        
        if (success) {
            console.log(`✅ Команда удаления отправлена к ${friendUsername} для сообщения ${timestamp}`);
            return true;
        } else {
            console.log(`❌ Ошибка отправки команды удаления к ${friendUsername}`);
            return false;
        }
    } else {
        console.log(`❌ P2P соединение с ${friendUsername} не установлено`);
        return false;
    }
}

// Установка P2P соединения для удаления
async function establishP2PForDeletion(friendUsername) {
    console.log(`🔧 Устанавливаем P2P соединение для удаления с ${friendUsername}`);
    
    // Сбрасываем счетчик попыток
    deleteRetryCount = 0;
    
    // Отправляем ping для проверки онлайн статуса
    if (typeof sendP2PSignal === 'function') {
        sendP2PSignal('ping', { to: friendUsername });
        console.log(`📤 Ping отправлен к ${friendUsername}`);
    } else {
        console.log(`❌ Функция sendP2PSignal не найдена`);
        return Promise.reject(new Error('sendP2PSignal function not available'));
    }
    
    // Ждем установления соединения
    return new Promise((resolve, reject) => {
        const checkConnection = () => {
            console.log(`🔍 Проверяем P2P соединение с ${friendUsername}:`, {
                exists: !!p2pConnections[friendUsername],
                dataChannel: p2pConnections[friendUsername]?.dataChannel?.readyState,
                status: p2pConnections[friendUsername]?.status
            });
            
            if (p2pConnections[friendUsername] && 
                p2pConnections[friendUsername].dataChannel && 
                p2pConnections[friendUsername].dataChannel.readyState === 'open' &&
                p2pConnections[friendUsername].status === 'connected') {
                console.log(`✅ P2P соединение установлено для удаления с ${friendUsername}`);
                resolve(true);
            } else {
                deleteRetryCount++;
                if (deleteRetryCount < MAX_DELETE_RETRIES) {
                    console.log(`⏳ Ожидание P2P соединения... (попытка ${deleteRetryCount}/${MAX_DELETE_RETRIES})`);
                    setTimeout(checkConnection, 3000); // Увеличиваем интервал до 3 секунд
                } else {
                    console.log(`❌ Не удалось установить P2P соединение для удаления с ${friendUsername} за ${MAX_DELETE_RETRIES} попыток`);
                    reject(new Error('P2P connection failed after retries'));
                }
            }
        };
        
        // Начинаем проверку через 2 секунды
        setTimeout(checkConnection, 2000);
    });
}

// Основная функция глобального удаления
async function performGlobalDeletion(messagesToDelete, friendUsername) {
    console.log(`🗑️ Начинаем глобальное удаление ${messagesToDelete.length} сообщений`);
    
    try {
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${friendUsername}`;
        
        // 1. Устанавливаем статус "удалено" у отправителя
        console.log(`📝 Устанавливаем статус "удалено" у отправителя`);
        for (const message of messagesToDelete) {
            await setMessageDeleted(chatId, message.timestamp, db);
        }
        
        // 2. Скрываем сообщения в UI у отправителя
        messagesToDelete.forEach(message => {
            hideMessageInUI(message.timestamp);
        });
        
        // 3. Проверяем P2P соединение с получателем
        console.log(`🔍 Проверяем P2P соединение с ${friendUsername}:`, {
            exists: !!p2pConnections[friendUsername],
            dataChannel: p2pConnections[friendUsername]?.dataChannel?.readyState,
            status: p2pConnections[friendUsername]?.status
        });
        
        if (p2pConnections[friendUsername] && 
            p2pConnections[friendUsername].dataChannel && 
            p2pConnections[friendUsername].dataChannel.readyState === 'open' &&
            p2pConnections[friendUsername].status === 'connected') {
            
            // P2P соединение установлено - отправляем команды удаления
            console.log(`✅ P2P соединение с ${friendUsername} установлено, отправляем команды удаления`);
            
            for (const message of messagesToDelete) {
                const success = sendDeleteCommand(friendUsername, message.timestamp);
                if (!success) {
                    console.log(`❌ Не удалось отправить команду удаления для сообщения ${message.timestamp}`);
                }
            }
            
        } else {
            // P2P соединение не установлено - устанавливаем его
            console.log(`📡 P2P соединение с ${friendUsername} не установлено, устанавливаем...`);
            console.log(`🔍 Состояние P2P:`, {
                exists: !!p2pConnections[friendUsername],
                dataChannel: p2pConnections[friendUsername]?.dataChannel?.readyState,
                status: p2pConnections[friendUsername]?.status
            });
            
            try {
                await establishP2PForDeletion(friendUsername);
                
                // После установления соединения отправляем команды удаления
                console.log(`📤 Отправляем команды удаления после установления P2P`);
                for (const message of messagesToDelete) {
                    const success = sendDeleteCommand(friendUsername, message.timestamp);
                    if (!success) {
                        console.log(`❌ Не удалось отправить команду удаления для сообщения ${message.timestamp}`);
                    }
                }
            } catch (error) {
                console.log(`❌ Не удалось установить P2P соединение для удаления: ${error.message}`);
                showDeleteWarning('Получатель недоступен. Сообщения удалены только у вас.');
            }
        }
        
        // 4. Обновляем историю через 5 секунд
        // setTimeout(() => {
        //     console.log(`🔄 Обновляем историю чата через 5 секунд`);
        //     loadChatHistory(friendUsername);
        // }, 5000);
        
        console.log(`✅ Глобальное удаление завершено`);
        
    } catch (error) {
        console.error('❌ Ошибка глобального удаления:', error);
    }
}

// Обработка команды удаления от получателя
async function handleDeleteCommand(timestamp, fromUsername) {
    console.log(`🗑️ Получена команда удаления сообщения ${timestamp} от ${fromUsername}`);
    
    try {
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${fromUsername}`;
        
        // Устанавливаем статус "удалено" у получателя
        const success = await setMessageDeleted(chatId, timestamp, db);
        
        if (success) {
            // Скрываем сообщение в UI, если чат открыт
            if (currentChatFriend === fromUsername) {
                hideMessageInUI(timestamp);
            }
            
            console.log(`✅ Сообщение ${timestamp} удалено по команде от ${fromUsername}`);
            
            // Обновляем историю через 5 секунд
            // setTimeout(() => {
            //     console.log(`🔄 Обновляем историю чата через 5 секунд`);
            //     loadChatHistory(fromUsername);
            // }, 5000);
        }
        
    } catch (error) {
        console.error('❌ Ошибка обработки команды удаления:', error);
    }
}

// Показать предупреждение об удалении
function showDeleteWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
    `;
    warningDiv.textContent = message;
    
    document.body.appendChild(warningDiv);
    
    // Удаляем предупреждение через 5 секунд
    setTimeout(() => {
        if (warningDiv.parentNode) {
            warningDiv.parentNode.removeChild(warningDiv);
        }
    }, 5000);
}

// Проверка времени сообщения и показ предупреждения
function checkMessageAgeAndShowWarning(messages) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const oldMessages = messages.filter(msg => 
        msg.status === 'sent' && (now - msg.timestamp) > oneHour
    );
    
    if (oldMessages.length > 0) {
        showDeleteWarning(`Удаление у получателя невозможно для ${oldMessages.length} сообщений - время истекло (более 1 часа)`);
        return false;
    }
    
    return true;
}

// Локальное удаление сообщений (только у отправителя)
async function performLocalDeletion(messagesToDelete, friendUsername) {
    console.log(`🗑️ performLocalDeletion вызвана для ${messagesToDelete.length} сообщений от ${friendUsername}`);
    console.log(`🔍 Сообщения для удаления:`, messagesToDelete);
    
    try {
        const db = await initMessageDB();
        const chatId = `chat_${currentUser.id}_${friendUsername}`;
        const messages = await db.getRecentMessages(chatId, 1000);
        
        console.log(`📚 Найдено ${messages.length} сообщений в IndexedDB для локального удаления`);
        console.log(`🔍 Все сообщения в IndexedDB:`, messages);
        
        // Находим сообщения для удаления и меняем их статус на "deleted"
        const messagesToDeleteLocal = [];
        const messagesToKeep = [];
        
        for (const message of messages) {
            const shouldDelete = messagesToDelete.some(toDelete => toDelete.timestamp === message.timestamp);
            console.log(`🔍 Проверяем сообщение ${message.timestamp}: shouldDelete = ${shouldDelete}`);
            
            if (shouldDelete) {
                // Меняем статус на "deleted" вместо физического удаления
                console.log(`🗑️ Меняем статус сообщения ${message.timestamp} с "${message.status}" на "deleted"`);
                message.status = 'deleted';
                messagesToDeleteLocal.push(message);
            } else {
                messagesToKeep.push(message);
            }
        }
        
        console.log(`📊 Результат фильтрации: ${messagesToDeleteLocal.length} для удаления, ${messagesToKeep.length} для сохранения`);
        
        // Сохраняем все сообщения (включая с измененным статусом)
        console.log(`💾 Сохраняем ${messagesToDeleteLocal.length + messagesToKeep.length} сообщений в IndexedDB`);
        for (const message of [...messagesToDeleteLocal, ...messagesToKeep]) {
            await db.saveMessage(chatId, message);
            console.log(`💾 Сохранено сообщение ${message.timestamp} со статусом "${message.status}"`);
        }
        
        // Скрываем сообщения в UI
        console.log(`👁️ Скрываем ${messagesToDeleteLocal.length} сообщений в UI`);
        messagesToDeleteLocal.forEach(message => {
            console.log(`👁️ Скрываем сообщение ${message.timestamp} в UI`);
            hideMessageInUI(message.timestamp);
        });
        
        console.log(`✅ Локальное удаление завершено: ${messagesToDeleteLocal.length} сообщений помечено как удаленные`);
        
        // Обновляем историю через 5 секунд
        // setTimeout(() => {
        //     console.log(`🔄 Обновляем историю чата через 5 секунд после локального удаления`);
        //     loadChatHistory(friendUsername);
        // }, 5000);
        
    } catch (error) {
        console.error('❌ Ошибка локального удаления:', error);
    }
}

// Экспорт функций для использования в основном приложении
window.deleteSystem = {
    canDeleteGlobally,
    isMessageTooOld,
    performGlobalDeletion,
    performLocalDeletion,
    handleDeleteCommand,
    checkMessageAgeAndShowWarning,
    showDeleteWarning
};

console.log('✅ window.deleteSystem создан успешно:', Object.keys(window.deleteSystem));
