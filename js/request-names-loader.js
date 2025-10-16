/**
 * Загрузчик имен из записной книжки для запросов в друзья и чатов
 * Использует существующую функцию getContactName из contacts-handler.js
 */

/**
 * Загружает имя из записной книжки для заголовка чата
 */
async function loadChatFriendName(friendUsername) {
    const chatFriendName = document.getElementById('chatFriendName');
    if (!chatFriendName) return;
    
    try {
        const contactName = await getContactName(friendUsername);
        if (contactName) {
            chatFriendName.textContent = contactName;
            console.log(`👤 [CHAT] Имя из записной книжки: ${contactName}`);
        } else {
            console.log(`👤 [CHAT] Имя не найдено в записной книжке для ${friendUsername}`);
        }
    } catch (error) {
        console.error('Ошибка загрузки имени контакта для чата', friendUsername, error);
    }
}

/**
 * Загружает имена из записной книжки для входящих запросов
 */
async function loadRequestNames() {
    const requestsList = document.getElementById('requestsList');
    if (!requestsList) return;
    
    const requestNames = requestsList.querySelectorAll('.request-item .username[data-phone]');
    
    for (const nameElement of requestNames) {
        const phone = nameElement.getAttribute('data-phone');
        if (phone) {
            try {
                const contactName = await getContactName(phone);
                if (contactName) {
                    nameElement.textContent = `👤 ${contactName}`;
                }
            } catch (error) {
                console.error('Ошибка загрузки имени контакта для', phone, error);
            }
        }
    }
}

/**
 * Загружает имена из записной книжки для исходящих запросов
 */
async function loadSentRequestNames() {
    const sentRequestsList = document.getElementById('sentRequestsList');
    if (!sentRequestsList) return;
    
    const sentRequestNames = sentRequestsList.querySelectorAll('.request-item .username[data-phone]');
    
    for (const nameElement of sentRequestNames) {
        const phone = nameElement.getAttribute('data-phone');
        if (phone) {
            try {
                const contactName = await getContactName(phone);
                if (contactName) {
                    nameElement.textContent = `👤 ${contactName}`;
                }
            } catch (error) {
                console.error('Ошибка загрузки имени контакта для', phone, error);
            }
        }
    }
}

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadChatFriendName,
        loadRequestNames,
        loadSentRequestNames
    };
}
