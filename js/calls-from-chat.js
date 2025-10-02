// ===== ЗВОНКИ ИЗ ЧАТА =====

// Видеозвонок из чата
function callFriendFromChat() {
    if (currentChatFriend) {
        callFriend(currentChatFriend);
    }
}

// Аудиозвонок из чата
function callFriendAudioFromChat() {
    if (currentChatFriend) {
        callFriendAudio(currentChatFriend);
    }
}
