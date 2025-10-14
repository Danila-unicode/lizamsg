// Функции для работы с контактами и IndexedDB
let contactsDB = null;

// Инициализация IndexedDB для контактов
async function initContactsDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LizaAppContacts', 1);
        
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем IndexedDB
    initContactsDB().catch(error => {
        console.error('Ошибка инициализации IndexedDB для контактов:', error);
    });
});
