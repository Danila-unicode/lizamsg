// ===== INDEXEDDB ХРАНЕНИЕ СООБЩЕНИЙ =====

// Инициализация IndexedDB для сообщений
let messageDB = null;

async function initMessageDB() {
    if (messageDB) {
        return messageDB;
    }
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ChatMessages', 1);
        
        request.onerror = () => {
            console.error('❌ Ошибка открытия IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            messageDB = request.result;
            console.log('✅ IndexedDB для сообщений инициализирован');
            resolve(messageDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('messages')) {
                const store = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                store.createIndex('chatId', 'chatId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Сохранение сообщения в IndexedDB
async function saveMessageToDB(chatId, message) {
    try {
        const db = await initMessageDB();
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        
        const messageData = {
            chatId: chatId,
            message: message.message,
            from: message.from,
            timestamp: message.timestamp,
            type: message.type || 'text',
            status: message.status || 'sent'
        };
        
        await store.add(messageData);
        console.log('✅ Сообщение сохранено в IndexedDB');
    } catch (error) {
        console.error('❌ Ошибка сохранения сообщения в IndexedDB:', error);
    }
}

// Загрузка сообщений из IndexedDB
async function loadMessagesFromDB(chatId, limit = 100) {
    try {
        const db = await initMessageDB();
        const transaction = db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('chatId');
        
        const request = index.getAll(chatId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const messages = request.result
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(-limit);
                resolve(messages);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений из IndexedDB:', error);
        return [];
    }
}
