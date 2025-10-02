// Основные функции приложения

// Поиск пользователя
function searchUser() {
    const phone = document.getElementById('searchPhone').value.trim();
    if (!phone) {
        alert('Введите номер телефона');
        return;
    }

    // Отправляем запрос на поиск
    fetch('api/search_user.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSearchResult(data.user, phone);
        } else {
            document.getElementById('searchResult').innerHTML = 
                `<p class="error">${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Ошибка поиска:', error);
        document.getElementById('searchResult').innerHTML = 
            '<p class="error">Ошибка при поиске пользователя</p>';
    });
}

// Показать результат поиска
function showSearchResult(user, phone) {
    const resultDiv = document.getElementById('searchResult');
    resultDiv.innerHTML = `
        <div class="search-result">
            <p>Найден пользователь: ${phone}</p>
            <button onclick="sendInvitation(${user.id})">Отправить приглашение</button>
        </div>
    `;
}

// Отправить приглашение
function sendInvitation(userId) {
    fetch('api/send_invitation.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Приглашение отправлено!');
            location.reload(); // Обновляем страницу
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка отправки приглашения:', error);
        alert('Ошибка при отправке приглашения');
    });
}

// Принять приглашение
function acceptInvitation(userId) {
    fetch('api/accept_invitation.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Приглашение принято!');
            location.reload(); // Обновляем страницу
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка принятия приглашения:', error);
        alert('Ошибка при принятии приглашения');
    });
}

// Показать секцию звонка
function showCallSection() {
    document.getElementById('callSection').style.display = 'block';
}

// Скрыть секцию звонка
function hideCallSection() {
    document.getElementById('callSection').style.display = 'none';
}

// Обработка ошибок
function handleError(message) {
    console.error('Ошибка:', message);
    alert('Ошибка: ' + message);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение загружено');
    
    // Проверяем поддержку WebRTC
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Ваш браузер не поддерживает WebRTC');
        return;
    }
    
    console.log('WebRTC поддерживается');
});

// Инициализация HTTP сигналинга
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, загружен ли HTTP сигналинг
    if (typeof initHttpSignaling !== 'undefined') {
        console.log('HTTP сигналинг загружен');
        
        // Получаем userId из глобальной переменной, установленной в HTML
        const userId = window.currentUserId;
        if (userId) {
            window.initHttpSignaling(userId);
            console.log('HTTP сигналинг инициализирован для пользователя:', userId);
        } else {
            console.warn('userId не найден');
        }
        
        console.log('HTTP сигналинг готов к работе');
    } else {
        console.warn('HTTP сигналинг не загружен');
    }
});
