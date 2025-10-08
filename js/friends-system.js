// ===== СИСТЕМА ДРУЗЕЙ =====

// Обновление списка друзей
function updateFriendsList() {
    const friendsList = document.getElementById('friendsList');
    if (!friendsList) return;
    
    friendsList.innerHTML = '';
    
    // Получаем список друзей из localStorage или другого источника
    const friends = getFriendsList();
    
    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.setAttribute('data-friend', friend.username);
        friendElement.style.cssText = `
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const unreadCount = unreadMessages[friend.username] || 0;
        const unreadHTML = unreadCount > 0 ? `<span class="unread-indicator">${unreadCount}</span>` : '';
        
        friendElement.innerHTML = `
            <div>
                <strong>${friend.username}</strong>
                ${unreadHTML}
            </div>
        `;
        
        friendElement.onclick = () => openChat(friend.username);
        friendsList.appendChild(friendElement);
    });
}

// Получение списка друзей
function getFriendsList() {
    // Здесь должна быть логика получения списка друзей
    // Пока возвращаем пустой массив
    return [];
}

// Добавление друга
function addFriend(username) {
    // Логика добавления друга
    console.log(`👥 Добавлен друг: ${username}`);
    updateFriendsList();
}

// Удаление друга
function removeFriend(username) {
    // Логика удаления друга
    console.log(`👥 Удален друг: ${username}`);
    updateFriendsList();
}
