// ===== ОПТИМИЗАЦИЯ LOCALSTORAGE =====

// Оптимизация localStorage
function optimizeLocalStorage() {
    const keys = Object.keys(localStorage);
    const chatKeys = keys.filter(key => key.startsWith('chat_'));
    
    if (chatKeys.length > 50) {
        console.log(`🧹 Очищаем localStorage: найдено ${chatKeys.length} чатов`);
        
        // Сортируем по времени последнего доступа
        const sortedKeys = chatKeys.sort((a, b) => {
            const aTime = localStorage.getItem(a + '_lastAccess') || 0;
            const bTime = localStorage.getItem(b + '_lastAccess') || 0;
            return bTime - aTime;
        });
        
        // Удаляем старые чаты (оставляем только 30 самых активных)
        const keysToDelete = sortedKeys.slice(30);
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_lastAccess');
        });
        
        console.log(`✅ Удалено ${keysToDelete.length} старых чатов из localStorage`);
    }
}

// Обновление времени последнего доступа к чату
function updateChatLastAccess(chatId) {
    localStorage.setItem(chatId + '_lastAccess', Date.now().toString());
}
