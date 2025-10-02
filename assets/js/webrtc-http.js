// WebRTC с HTTP сигналингом через Yandex Cloud Functions

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

// HTTP сигналинг сервер - Yandex Cloud Functions
const SIGNALING_SERVER = 'https://functions.yandexcloud.net/d4ec0rusp5blvc9pucd4';

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentCallId = null;
let currentCallTarget = null;
let isConnected = false;
let lastSignalId = 0;
let signalCheckInterval = null;
let currentUserId = null;

// Инициализация HTTP сигналинга
function initHttpSignaling(userId) {
    currentUserId = userId;
    updateConnectionStatus('disconnected');
    console.log('HTTP сигналинг инициализирован для пользователя:', userId);
}

// Обновление статуса соединения
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.className = `connection-status ${status}`;
        statusElement.textContent = status === 'connected' ? 'Подключен' : 
                                   status === 'connecting' ? 'Подключение...' : 'Отключен';
    }
}

// Инициализация сигналинга (без комнат)
async function initSignaling() {
    try {
        isConnected = true;
        updateConnectionStatus('connected');
        console.log('Сигналинг инициализирован для пользователя:', currentUserId);
        
        // Начинаем проверку сигналов
        startSignalPolling();
        return true;
    } catch (error) {
        console.error('Ошибка инициализации сигналинга:', error);
        updateConnectionStatus('disconnected');
        return false;
    }
}

// Начало проверки сигналов
function startSignalPolling() {
    if (signalCheckInterval) {
        clearInterval(signalCheckInterval);
    }
    
    // Проверяем сигналы каждые 3 секунды
    signalCheckInterval = setInterval(() => {
        checkSignals();
    }, 3000);
    
    console.log('Начата проверка сигналов');
}

// Остановка проверки сигналов
function stopSignalPolling() {
    if (signalCheckInterval) {
        clearInterval(signalCheckInterval);
        signalCheckInterval = null;
        console.log('Остановлена проверка сигналов');
    }
}

// Проверка сигналов
async function checkSignals() {
    if (!isConnected) return;
    
    try {
        const url = `${SIGNALING_SERVER}?action=signals&userId=${currentUserId}&since=${lastSignalId}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.signals.length > 0) {
            data.signals.forEach(signal => {
                handleWebRTCSignal(signal);
                lastSignalId = Math.max(lastSignalId, signal.id);
            });
        }
    } catch (error) {
        console.error('Ошибка проверки сигналов:', error);
    }
}

// Обработка WebRTC сигналов
async function handleWebRTCSignal(signal) {
    console.log('Получен сигнал:', signal.type, 'от', signal.from);
    
    if (signal.type === 'offer' && signal.from !== currentUserId) {
        // Входящий звонок
        handleIncomingCall(signal.from, signal.data);
    } else if (signal.type === 'answer') {
        // Ответ на звонок
        await handleRemoteAnswer(signal.data);
    } else if (signal.type === 'ice-candidate') {
        // ICE кандидат
        await handleRemoteIceCandidate(signal.data);
    } else if (signal.type === 'end-call') {
        // Завершение звонка
        handleCallEnded();
    }
}

// Отправка сигнала
async function sendSignal(to, type, data) {
    try {
        const signalData = {
            action: 'signal',
            from: currentUserId,
            to: to,
            type: type,
            data: data
        };
        
        const response = await fetch(SIGNALING_SERVER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signalData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Сигнал отправлен:', type, 'к', to);
            return true;
        } else {
            console.error('Ошибка отправки сигнала:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Ошибка отправки сигнала:', error);
        return false;
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
                sendSignal(contactId, 'ice-candidate', {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                    timestamp: new Date().toISOString()
                });
            }
        };
        
        // Создаем offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Генерируем ID звонка
        currentCallId = generateCallId();
        currentCallTarget = contactId;
        
        // Инициализируем сигналинг
        await initSignaling();
        
        // Отправляем offer
        await sendSignal(contactId, 'offer', {
            sdp: offer.sdp,
            type: offer.type,
            callId: currentCallId,
            timestamp: new Date().toISOString()
        });
        
        console.log('Звонок инициирован к пользователю:', contactId);
        
    } catch (error) {
        console.error('Ошибка при инициации звонка:', error);
        alert('Не удалось получить доступ к камере/микрофону');
    }
}

// Обработка входящего звонка
function handleIncomingCall(callerId, offerData) {
    console.log('Входящий звонок от:', callerId);
    
    // Показываем уведомление о входящем звонке
    if (confirm(`Входящий звонок от пользователя ${callerId}. Принять?`)) {
        acceptCall(callerId, offerData);
    } else {
        rejectCall(callerId);
    }
}

// Принятие входящего звонка
async function acceptCall(callerId, offerData) {
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
                sendSignal(callerId, 'ice-candidate', {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                    timestamp: new Date().toISOString()
                });
            }
        };
        
        // Устанавливаем удаленный offer
        const offer = new RTCSessionDescription({
            type: offerData.type,
            sdp: offerData.sdp
        });
        
        await peerConnection.setRemoteDescription(offer);
        
        // Создаем answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Отправляем answer
        await sendSignal(callerId, 'answer', {
            sdp: answer.sdp,
            type: answer.type,
            callId: offerData.callId,
            timestamp: new Date().toISOString()
        });
        
        currentCallId = offerData.callId;
        currentCallTarget = callerId;
        
        console.log('Звонок принят от пользователя:', callerId);
        
    } catch (error) {
        console.error('Ошибка при принятии звонка:', error);
        alert('Не удалось принять звонок');
    }
}

// Отклонение входящего звонка
async function rejectCall(callerId) {
    console.log('Звонок отклонен от пользователя:', callerId);
    await sendSignal(callerId, 'reject', {
        timestamp: new Date().toISOString()
    });
}

// Обработка удаленного ICE кандидата
async function handleRemoteIceCandidate(candidateData) {
    if (peerConnection) {
        try {
            const candidate = new RTCIceCandidate({
                candidate: candidateData.candidate,
                sdpMLineIndex: candidateData.sdpMLineIndex,
                sdpMid: candidateData.sdpMid
            });
            
            await peerConnection.addIceCandidate(candidate);
            console.log('ICE кандидат добавлен');
        } catch (error) {
            console.error('Ошибка добавления ICE кандидата:', error);
        }
    }
}

// Обработка удаленного answer
async function handleRemoteAnswer(answerData) {
    if (peerConnection) {
        try {
            const answer = new RTCSessionDescription({
                type: answerData.type,
                sdp: answerData.sdp
            });
            
            await peerConnection.setRemoteDescription(answer);
            console.log('Удаленное описание answer установлено');
        } catch (error) {
            console.error('Ошибка обработки answer:', error);
        }
    }
}

// Обработка завершения звонка
function handleCallEnded() {
    console.log('Звонок завершен');
    endCall();
}

// Показать секцию звонка
function showCallSection() {
    const callSection = document.getElementById('callSection');
    if (callSection) {
        callSection.style.display = 'block';
    }
}

// Скрыть секцию звонка
function hideCallSection() {
    const callSection = document.getElementById('callSection');
    if (callSection) {
        callSection.style.display = 'none';
    }
}

// Завершение звонка
async function endCall() {
    // Отправляем сигнал о завершении звонка
    if (currentCallTarget) {
        await sendSignal(currentCallTarget, 'end-call', {
            timestamp: new Date().toISOString()
        });
    }
    
    // Останавливаем медиа поток
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Закрываем соединение
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Останавливаем проверку сигналов
    stopSignalPolling();
    
    // Очищаем видео элементы
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    
    currentCallId = null;
    currentCallTarget = null;
    isConnected = false;
    updateConnectionStatus('disconnected');
    
    // Скрываем секцию звонка
    hideCallSection();
    
    console.log('Звонок завершен');
}

// Генерация ID звонка
function generateCallId() {
    return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('WebRTC с HTTP сигналингом готов к работе');
    
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
window.initHttpSignaling = initHttpSignaling;
