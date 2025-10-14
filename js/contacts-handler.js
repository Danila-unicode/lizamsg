// Функции для работы с контактами и IndexedDB
let contactsDB = null;

// Инициализация IndexedDB для контактов
async function initContactsDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LizaAppContacts', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            contactsDB = request.result;
            resolve(contactsDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('contacts')) {
                const store = db.createObjectStore('contacts', { keyPath: 'phone' });
                store.createIndex('name', 'name', { unique: false });
            }
            if (!db.objectStoreNames.contains('avatars')) {
                const store = db.createObjectStore('avatars', { keyPath: 'user_id' });
                store.createIndex('username', 'username', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Сохранение имени контакта в IndexedDB
async function saveContactName(phone, name) {
    if (!contactsDB) {
        await initContactsDB();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = contactsDB.transaction(['contacts'], 'readwrite');
        const store = transaction.objectStore('contacts');
        const request = store.put({ phone: phone, name: name, timestamp: Date.now() });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Получение имени контакта из IndexedDB
async function getContactName(phone) {
    if (!contactsDB) {
        await initContactsDB();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = contactsDB.transaction(['contacts'], 'readonly');
        const store = transaction.objectStore('contacts');
        const request = store.get(phone);
        
        request.onsuccess = () => {
            resolve(request.result ? request.result.name : null);
        };
        request.onerror = () => reject(request.error);
    });
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        min-width: 300px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
        </div>
    `;
    
    // Добавляем стили для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Функция для выбора контакта из записной книжки
async function selectFromContacts() {
    // Проверяем поддержку Contacts API
    if (!('contacts' in navigator)) {
        showNotification('Ваш браузер не поддерживает доступ к контактам. Пожалуйста, введите номер вручную.', 'error');
        return;
    }

    try {
        // Запрашиваем разрешение на доступ к контактам
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        
        if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            const phoneNumber = contact.tel && contact.tel.length > 0 ? contact.tel[0] : null;
            
            if (phoneNumber) {
                // Очищаем номер от лишних символов и форматируем
                let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
                
                // Если номер не начинается с +, добавляем +7 для российских номеров
                if (!cleanNumber.startsWith('+')) {
                    if (cleanNumber.startsWith('8')) {
                        cleanNumber = '+7' + cleanNumber.substring(1);
                    } else if (cleanNumber.startsWith('7')) {
                        cleanNumber = '+' + cleanNumber;
                    } else {
                        cleanNumber = '+7' + cleanNumber;
                    }
                }
                
                // Подставляем номер в поле поиска
                document.getElementById('searchUsername').value = cleanNumber;
                
                // Сохраняем имя контакта в IndexedDB
                if (contact.name) {
                    try {
                        await saveContactName(cleanNumber, contact.name);
                        showNotification('Номер выбран из контактов: ' + contact.name, 'success');
                    } catch (error) {
                        console.error('Ошибка сохранения имени контакта:', error);
                        showNotification('Номер выбран: ' + contact.name, 'success');
                    }
                } else {
                    showNotification('Номер выбран из контактов', 'success');
                }
            } else {
                showNotification('У выбранного контакта нет номера телефона.', 'error');
            }
        }
    } catch (error) {
        console.error('Ошибка при выборе контакта:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Доступ к контактам запрещен. Пожалуйста, разрешите доступ в настройках браузера.', 'error');
        } else if (error.name === 'NotSupportedError') {
            showNotification('Ваш браузер не поддерживает доступ к контактам.', 'error');
        } else {
            showNotification('Ошибка при выборе контакта: ' + error.message, 'error');
        }
    }
}

// Функция для получения отображаемого имени контакта
async function getDisplayName(phone) {
    try {
        const contactName = await getContactName(phone);
        return contactName || phone;
    } catch (error) {
        console.error('Ошибка получения имени контакта:', error);
        return phone;
    }
}

// Функция для обновления отображения имени в списке друзей
async function updateFriendDisplayName(phone, element) {
    try {
        const displayName = await getDisplayName(phone);
        if (displayName !== phone) {
            // Обновляем отображение имени
            const nameElement = element.querySelector('.username');
            if (nameElement) {
                nameElement.innerHTML = `👤 ${displayName}`;
            }
        }
    } catch (error) {
        console.error('Ошибка обновления отображения имени:', error);
    }
}

// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С АВАТАРАМИ ====================

// Сохранение аватара в IndexedDB
async function saveAvatar(user_id, username, avatarData, avatarPath) {
    if (!contactsDB) {
        await initContactsDB();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = contactsDB.transaction(['avatars'], 'readwrite');
        const store = transaction.objectStore('avatars');
        const request = store.put({ 
            user_id: user_id, 
            username: username, 
            avatarData: avatarData, 
            avatarPath: avatarPath,
            timestamp: Date.now() 
        });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Получение аватара из IndexedDB
async function getAvatar(user_id) {
    if (!contactsDB) {
        await initContactsDB();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = contactsDB.transaction(['avatars'], 'readonly');
        const store = transaction.objectStore('avatars');
        const request = store.get(user_id);
        
        request.onsuccess = () => {
            const result = request.result;
            if (result && result.avatarData) {
                resolve(result);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Проверка, нужно ли обновить аватар (старше 24 часов)
function isAvatarStale(timestamp) {
    const oneDay = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    return Date.now() - timestamp > oneDay;
}

// Загрузка аватара с сервера и сохранение в IndexedDB
async function loadAndCacheAvatar(user_id, username) {
    try {
        console.log(`🔄 Загружаем аватар для ${username} (ID: ${user_id})...`);
        
        // Получаем данные пользователя с сервера
        const response = await fetch(`avtr/api/get_user_data.php?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log(`📊 Данные пользователя ${username}:`, userData);
        
        if (userData.success && userData.user && userData.user.avatar_path && userData.user.avatar_path.trim() !== '') {
            console.log(`🖼️ Найден аватар для ${username}: ${userData.user.avatar_path}`);
            
            // Загружаем изображение аватара
            const avatarResponse = await fetch(userData.user.avatar_path);
            if (!avatarResponse.ok) {
                throw new Error(`Ошибка загрузки аватара: ${avatarResponse.status}`);
            }
            
            const avatarBlob = await avatarResponse.blob();
            const avatarData = await blobToBase64(avatarBlob);
            
            // Сохраняем в IndexedDB
            await saveAvatar(user_id, username, avatarData, userData.user.avatar_path);
            console.log(`✅ Аватар для ${username} сохранен в кэш (размер: ${Math.round(avatarBlob.size/1024)}KB)`);
            
            return { avatarData, avatarPath: userData.user.avatar_path };
        } else {
            console.log(`⚠️ У пользователя ${username} нет аватара или данные некорректны`);
            // Сохраняем информацию о том, что аватара нет
            await saveAvatar(user_id, username, null, null);
            return null;
        }
    } catch (error) {
        console.error(`❌ Ошибка загрузки аватара для ${username}:`, error);
        return null;
    }
}

// Конвертация Blob в Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Загрузка аватара из кэша или с сервера
async function getCachedAvatar(user_id, username) {
    try {
        console.log(`[DEBUG] getCachedAvatar: Попытка получить аватар для ${username} (ID: ${user_id})`);
        
        // Сначала проверяем кэш
        const cachedAvatar = await getAvatar(user_id);
        console.log(`[DEBUG] getCachedAvatar для ${username}: cachedAvatar =`, cachedAvatar);
        
        if (cachedAvatar && !isAvatarStale(cachedAvatar.timestamp)) {
            if (cachedAvatar.avatarData) {
                console.log(`⚡ Аватар для ${username} загружен из кэша`);
                return cachedAvatar.avatarData;
            } else {
                console.log(`⚠️ В кэше записано, что у ${username} нет аватара`);
                return null;
            }
        }
        
        // Если в кэше нет или устарел - загружаем с сервера
        console.log(`🔄 Аватар для ${username} устарел или отсутствует, загружаем с сервера`);
        const avatarData = await loadAndCacheAvatar(user_id, username);
        console.log(`[DEBUG] getCachedAvatar для ${username}: avatarData после загрузки =`, avatarData);
        return avatarData ? avatarData.avatarData : null;
        
    } catch (error) {
        console.error(`❌ Ошибка получения аватара для ${username}:`, error);
        return null;
    }
}

// Предзагрузка аватаров всех друзей
async function preloadFriendsAvatars() {
    try {
        console.log('🚀 Начинаем предзагрузку аватаров друзей...');
        
        // Проверяем, есть ли данные друзей в глобальной переменной
        if (typeof friendsData === 'undefined' || !friendsData.friends || friendsData.friends.length === 0) {
            console.log('⚠️ Данные друзей не загружены, пропускаем предзагрузку аватаров');
            return;
        }
        
        const friends = friendsData.friends;
        console.log(`📋 Найдено ${friends.length} друзей для предзагрузки аватаров`);
        console.log(`👥 Список друзей:`, friends.map(f => f.username));
        
        if (friends.length === 0) {
            console.log('⚠️ У пользователя нет друзей для предзагрузки аватаров');
            return;
        }
        
        // Загружаем аватары параллельно (но не более 3 одновременно для стабильности)
        const batchSize = 3;
        for (let i = 0; i < friends.length; i += batchSize) {
            const batch = friends.slice(i, i + batchSize);
            const promises = batch.map(async (friend) => {
                try {
                    console.log(`🔄 Загружаем аватар для ${friend.username} (ID: ${friend.contact_user_id})`);
                    await loadAndCacheAvatar(friend.contact_user_id, friend.username);
                } catch (error) {
                    console.error(`❌ Ошибка загрузки аватара для ${friend.username}:`, error);
                }
            });
            
            await Promise.all(promises);
            console.log(`✅ Загружена партия ${Math.floor(i/batchSize) + 1} из ${Math.ceil(friends.length/batchSize)}`);
        }
        
        console.log('🎉 Предзагрузка аватаров завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка предзагрузки аватаров:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем IndexedDB
    initContactsDB().catch(error => {
        console.error('Ошибка инициализации IndexedDB для контактов:', error);
    });
});
