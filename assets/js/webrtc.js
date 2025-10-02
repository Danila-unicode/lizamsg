const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
            urls: 'turn:62.84.126.200:3478', 
            username: 'webrtc', 
            credential: 'password123' 
        },
        { 
            urls: 'turns:62.84.126.200:3479', 
            username: 'webrtc', 
            credential: 'password123' 
        }
    ]
};

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentCallId = null;
let websocketClient = null;
let currentCallTarget = null;

// Инициализация WebSocket клиента
function initWebSocket(userId) {
    if (!websocketClient) {
        websocketClient = window.vkCloudWssClient;
        
        if (websocketClient) {
            // Настройка обработчиков событий
            websocketClient.onIncomingCall = handleIncomingCall;
            websocketClient.onCallAnswered = handleCallAnswered;
            websocketClient.onCallEnded = handleCallEnded;
            websocketClient.onIceCandidate = handleRemoteIceCandidate;
            websocketClient.onOffer = handleRemoteOffer;
            websocketClient.onAnswer = handleRemoteAnswer;
            websocketClient.onError = handleWebSocketError;
        }
    }
}

// Инициация звонка
async function initiateCall(contactId) {
    try {
        // Получаем доступ к медиа устройствам
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        // Показываем локальное видео
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Показываем секцию звонка
        showCallSection();
        
        // Создаем RTCPeerConnection
        peerConnection = new RTCPeerConnection(configuration);
        
        // Добавляем локальные треки
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Обработка удаленного потока
        peerConnection.ontrack = function(event) {
            remoteStream = event.streams[0];
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            }
        };
        
        // Обработка ICE кандидатов
        peerConnection.onicecandidate = function(event) {
            if (event.candidate) {
                console.log('Локальный ICE кандидат:', event.candidate);
                if (websocketClient && currentCallTarget) {
                    websocketClient.sendIceCandidate(currentCallTarget, event.candidate);
                }
            }
        };
        
        // Создаем offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Генерируем ID звонка
        currentCallId = generateCallId();
        currentCallTarget = contactId;
        
        // Отправляем запрос на звонок через WebSocket
        if (websocketClient) {
            websocketClient.sendCallRequest(contactId, currentCallId);
        }
        
        // Отправляем offer
        if (websocketClient && currentCallTarget) {
            websocketClient.sendOffer(currentCallTarget, offer);
        }
        
        console.log('Звонок инициирован к пользователю:', contactId);
        
    } catch (error) {
        console.error('Ошибка при инициации звонка:', error);
        alert('Не удалось получить доступ к камере/микрофону');
    }
}

// Обработка входящего звонка
function handleIncomingCall(callerId, callId) {
    console.log('Входящий звонок от:', callerId, 'ID:', callId);
    
    // Показываем уведомление о входящем звонке
    if (confirm(`Входящий звонок от пользователя ${callerId}. Принять?`)) {
        acceptCall(callerId, callId);
    } else {
        rejectCall(callerId, callId);
    }
}

// Принятие входящего звонка
async function acceptCall(callerId, callId) {
    try {
        // Получаем доступ к медиа устройствам
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        // Показываем локальное видео
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Показываем секцию звонка
        showCallSection();
        
        // Создаем RTCPeerConnection
        peerConnection = new RTCPeerConnection(configuration);
        
        // Добавляем локальные треки
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Обработка удаленного потока
        peerConnection.ontrack = function(event) {
            remoteStream = event.streams[0];
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            }
        };
        
        // Обработка ICE кандидатов
        peerConnection.onicecandidate = function(event) {
            if (event.candidate) {
                console.log('Локальный ICE кандидат:', event.candidate);
                if (websocketClient && callerId) {
                    websocketClient.sendIceCandidate(callerId, event.candidate);
                }
            }
        };
        
        // Отправляем подтверждение
        if (websocketClient) {
            websocketClient.sendCallAnswer(callerId, callId);
        }
        
        currentCallId = callId;
        currentCallTarget = callerId;
        
        console.log('Звонок принят от пользователя:', callerId);
        
    } catch (error) {
        console.error('Ошибка при принятии звонка:', error);
        alert('Не удалось принять звонок');
    }
}

// Отклонение входящего звонка
function rejectCall(callerId, callId) {
    console.log('Звонок отклонен от пользователя:', callerId);
    // Можно добавить логику для уведомления звонящего
}

// Обработка ответа на звонок
function handleCallAnswered(userId, callId) {
    console.log('Пользователь принял звонок:', userId);
    // Здесь можно обновить UI
}

// Обработка завершения звонка
function handleCallEnded(userId) {
    console.log('Пользователь завершил звонок:', userId);
    endCall();
}

// Обработка удаленного ICE кандидата
function handleRemoteIceCandidate(userId, candidate) {
    if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .then(() => console.log('ICE кандидат добавлен'))
            .catch(error => console.error('Ошибка добавления ICE кандидата:', error));
    }
}

// Обработка удаленного offer
async function handleRemoteOffer(userId, offer) {
    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Удаленное описание установлено');
            
            // Создаем answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            // Отправляем answer
            if (websocketClient) {
                websocketClient.sendAnswer(userId, answer);
            }
            
        } catch (error) {
            console.error('Ошибка обработки offer:', error);
        }
    }
}

// Обработка удаленного answer
async function handleRemoteAnswer(userId, answer) {
    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Удаленное описание answer установлено');
        } catch (error) {
            console.error('Ошибка обработки answer:', error);
        }
    }
}

// Показать секцию звонка
function showCallSection() {
    document.getElementById('callSection').style.display = 'block';
}

// Скрыть секцию звонка
function hideCallSection() {
    document.getElementById('callSection').style.display = 'none';
}

// Завершение звонка
function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (websocketClient && currentCallTarget) {
        websocketClient.endCall(currentCallTarget);
    }
    
    // Очищаем видео элементы
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    
    currentCallId = null;
    currentCallTarget = null;
    
    // Скрываем секцию звонка
    hideCallSection();
    
    console.log('Звонок завершен');
}

// Обработка ошибок WebSocket
function handleWebSocketError(message) {
    console.error('WebSocket ошибка:', message);
    alert('Ошибка соединения: ' + message);
}

// Генерация ID звонка
function generateCallId() {
    return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('WebRTC готов к работе');
    
    // Проверяем поддержку WebRTC
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Ваш браузер не поддерживает WebRTC');
        return;
    }
    
    console.log('WebRTC поддерживается');
});

// Экспортируем функции для использования в HTML
window.initiateCall = initiateCall;
window.endCall = endCall;
window.initWebSocket = initWebSocket;
