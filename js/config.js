// ===== КОНФИГУРАЦИЯ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====

console.log('Script started');

// WebSocket соединение (только для звонков)
const WEBSOCKET_URL = 'wss://lizamsg.ru:9000';

// Конфигурация для чатов
const CHAT_WEBSOCKET_URL = 'wss://lizamsg.ru:9002';

// WebRTC конфигурация
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { 
            urls: 'turn:89.169.141.202:3478',
            username: 'lizaapp',
            credential: 'lizaapp123'
        },
        { 
            urls: 'turns:62.84.126.200:3479',
            username: 'lizaapp',
            credential: 'lizaapp123'
        }
    ]
};

// Глобальный пользователь
let currentUser = {
    id: null,
    ws: null,
    state: 'idle', // idle, connecting, connected, calling
    targetUser: null,
    peerConnection: null,
    localStream: null,
    sessionToken: null,
    isInitiator: false,
    webrtcInitiated: false,
    wsConnected: false,
    wsUserId: null,
    log: (msg, type = 'info') => {
        const logEl = document.getElementById('log');
        const time = new Date().toLocaleTimeString();
        const className = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
        logEl.innerHTML += `<div class="${className}">[${time}] ${msg}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    }
};
