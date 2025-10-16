/**
 * Система приглашений для LizaApp
 * Позволяет отправлять приглашения через SMS, WhatsApp, Telegram и VK
 */



/**
 * Отправляет приглашение выбранным способом
 * @param {string} method - Способ отправки (sms, whatsapp, telegram, vk)
 * @param {string} phoneNumber - Номер телефона для приглашения
 */
function sendInvite(method, phoneNumber) {
    const message = "Привет! Я использую новый мессенджер Liza от российских разработчиков для звонков родственникам и друзьям. Присоединяйся! Скачай приложение: https://www.lizaapp.ru";
    
    switch(method) {
        case 'sms':
            sendSMSInvite(phoneNumber, message);
            break;
        case 'whatsapp':
            sendWhatsAppInvite(phoneNumber, message);
            break;
        case 'telegram':
            sendTelegramInvite(phoneNumber, message);
            break;
        case 'vk':
            sendVKInvite(message);
            break;
        default:
            console.error('Неизвестный способ отправки:', method);
    }
}

/**
 * Отправляет приглашение через SMS
 * @param {string} phoneNumber - Номер телефона
 * @param {string} message - Текст сообщения
 */
function sendSMSInvite(phoneNumber, message) {
    try {
        // Убираем + из номера для SMS
        const cleanPhone = phoneNumber.replace('+', '');
        const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
        showNotification('SMS приложение открыто', 'success');
    } catch (error) {
        console.error('Ошибка отправки SMS:', error);
        showNotification('Ошибка открытия SMS', 'error');
    }
}

/**
 * Отправляет приглашение через WhatsApp
 * @param {string} phoneNumber - Номер телефона
 * @param {string} message - Текст сообщения
 */
function sendWhatsAppInvite(phoneNumber, message) {
    try {
        // Убираем + из номера для WhatsApp
        const cleanPhone = phoneNumber.replace('+', '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        showNotification('WhatsApp открыт', 'success');
    } catch (error) {
        console.error('Ошибка отправки WhatsApp:', error);
        showNotification('Ошибка открытия WhatsApp', 'error');
    }
}

/**
 * Отправляет приглашение через Telegram
 * @param {string} phoneNumber - Номер телефона
 * @param {string} message - Текст сообщения
 */
function sendTelegramInvite(phoneNumber, message) {
    try {
        // Для Telegram формируем сообщение без дублирования ссылки
        const telegramMessage = `Привет! 👋

Я использую новый мессенджер Liza от российских разработчиков для звонков родственникам и друзьям.

Присоединяйся! Скачай приложение:

#Liza #мессенджер #Звонки в России через мессенджер`;
        
        const telegramUrl = `https://t.me/share/url?url=https://www.lizaapp.ru&text=${encodeURIComponent(telegramMessage)}`;
        window.open(telegramUrl, '_blank');
        showNotification('Telegram открыт - выберите получателя', 'success');
    } catch (error) {
        console.error('Ошибка отправки Telegram:', error);
        showNotification('Ошибка открытия Telegram', 'error');
    }
}

/**
 * Отправляет приглашение через ВКонтакте
 * @param {string} message - Текст сообщения
 */
function sendVKInvite(message) {
    try {
        console.log('Отправка приглашения через ВКонтакте...');
        
        // Для ВКонтакте формируем более информативное сообщение
        const vkMessage = `Привет! 👋

Я использую новый мессенджер Liza от российских разработчиков для звонков родственникам и друзьям.

Присоединяйся! Скачай приложение:

#Liza #мессенджер #Звонки в России через мессенджер`;
        
        console.log('Сообщение для ВК:', vkMessage);
        
        // Открываем VK с предложением поделиться
        const vkUrl = `https://vk.com/share.php?url=https://www.lizaapp.ru&title=LizaApp - Российский мессенджер для звонков и чатов &comment=${encodeURIComponent(vkMessage)}`;
        console.log('URL для ВК:', vkUrl);
        
        window.open(vkUrl, '_blank');
        showNotification('ВКонтакте открыт - выберите получателя', 'success');
    } catch (error) {
        console.error('Ошибка отправки VK:', error);
        showNotification('Ошибка открытия ВКонтакте', 'error');
    }
}

/**
 * Создает HTML для вариантов приглашения
 * @param {string} phoneNumber - Номер телефона
 * @param {string} statusText - Текст статуса (например, "Пользователь не найден")
 * @returns {string} HTML код с вариантами приглашения
 */
function createInviteButton(phoneNumber, statusText = 'Пользователь не найден') {
    return `
        <div class="search-result-not-found">
            <div class="user-item-compact">
                <div class="user-info">
                    <i class="fas fa-user user-icon"></i>
                    <div class="user-details">
                        <div class="user-phone">${phoneNumber}</div>
                        <div class="user-status">${statusText}</div>
                    </div>
                </div>
            </div>
            
            <div class="invite-section">
                <h4 class="invite-subtitle">
                    <i class="fas fa-paper-plane"></i> Отправить приглашение
                </h4>
                <div class="invite-options-horizontal">
                    <button onclick="sendInvite('sms', '${phoneNumber}')" class="invite-option-horizontal sms">
                        <i class="fas fa-sms"></i>
                        <span>SMS</span>
                    </button>
                    <button onclick="sendInvite('whatsapp', '${phoneNumber}')" class="invite-option-horizontal whatsapp">
                        <i class="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </button>
                    <button onclick="sendInvite('telegram', '${phoneNumber}')" class="invite-option-horizontal telegram">
                        <i class="fab fa-telegram"></i>
                        <span>Telegram</span>
                    </button>
                    <button onclick="sendInvite('vk', '${phoneNumber}')" class="invite-option-horizontal vk">
                        <i class="fab fa-vk"></i>
                        <span>ВКонтакте</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Инициализация системы приглашений
 * Добавляет обработчики событий
 */
function initInviteSystem() {
    console.log('✅ Система приглашений инициализирована');
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Небольшая задержка для загрузки основного приложения
    setTimeout(initInviteSystem, 100);
});
