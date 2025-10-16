        console.log('Script started');
        // WebSocket серверы согласно правилам
        const CALLS_WEBSOCKET_URL = 'wss://lizamsg.ru:9000';  // Для звонков
        const CHAT_WEBSOCKET_URL = 'wss://lizacom.ru:9002';   // Для чатов
        
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
            isFrontCamera: true, // true = фронтальная, false = основная
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
        
        // Подключение к WebSocket серверу для звонков
        function connectCallsWebSocket() {
            console.log('🔌 [CALLS-WS] ===== ПОДКЛЮЧЕНИЕ К CALLS WEBSOCKET =====');
            console.log('🔌 [CALLS-WS] URL:', CALLS_WEBSOCKET_URL);
            console.log('🔌 [CALLS-WS] Пользователь:', currentUser.id);
            
            return new Promise((resolve, reject) => {
                try {
                    const wsUrl = `${CALLS_WEBSOCKET_URL}?username=${encodeURIComponent(currentUser.id)}`;
                    console.log('🔌 [CALLS-WS] Полный URL:', wsUrl);
                    currentUser.callsWs = new WebSocket(wsUrl);
                    
                    currentUser.callsWs.onopen = () => {
                        console.log('✅ [CALLS-WS] WebSocket для звонков подключен!');
                        console.log('✅ [CALLS-WS] Состояние:', currentUser.callsWs.readyState);
                        currentUser.callsWsConnected = true;
                        currentUser.log('🔌 WebSocket для звонков подключен', 'success');
                        resolve();
                    };
                    
                    currentUser.callsWs.onmessage = (event) => {
                        console.log('📨 [CALLS-WS] Получено сообщение от Calls WebSocket');
                        console.log('📨 [CALLS-WS] Данные:', event.data);
                        try {
                            const message = JSON.parse(event.data);
                            console.log('📨 [CALLS-WS] Парсированное сообщение:', message);
                            handleCallsWebSocketMessage(message);
                        } catch (error) {
                            console.log('❌ [CALLS-WS] Ошибка парсинга сообщения:', error);
                            currentUser.log(`❌ Ошибка парсинга сообщения звонков: ${error.message}`, 'error');
                        }
                    };
                    
                    currentUser.callsWs.onclose = () => {
                        currentUser.callsWsConnected = false;
                        currentUser.log('🔌 WebSocket для звонков отключен', 'warning');
                        
                        // Автоматическое переподключение через 3 секунды
                        if (currentUser.id) {
                            setTimeout(() => {
                                if (currentUser.id && !currentUser.callsWsConnected) {
                                    currentUser.log('🔄 Переподключение к WebSocket звонков...', 'info');
                                    connectCallsWebSocket().catch(error => {
                                        currentUser.log(`❌ Ошибка переподключения звонков: ${error.message}`, 'error');
                                    });
                                }
                            }, 3000);
                        }
                    };
                    
                    currentUser.callsWs.onerror = (error) => {
                        currentUser.log(`❌ Ошибка WebSocket звонков: ${error.message}`, 'error');
                        // Останавливаем все звуки при ошибке WebSocket
                        stopIncomingCallSound();
                        stopOutgoingCallSound();
                        reject(error);
                    };
                
            } catch (error) {
                    reject(error);
                }
            });
        }
        
        
        // Обработка сообщений WebSocket для звонков
        function handleCallsWebSocketMessage(message) {
            console.log('📨 [CALLS-WS] ===== ОБРАБОТКА СООБЩЕНИЯ CALLS WEBSOCKET =====');
            console.log('📨 [CALLS-WS] Полное сообщение:', message);
            console.log('📨 [CALLS-WS] Тип сообщения:', message.type);
            console.log('📨 [CALLS-WS] От кого:', message.from);
            console.log('📨 [CALLS-WS] Кому:', message.to);
            console.log('📨 [CALLS-WS] Данные:', message.data);
            
            // Обрабатываем системные сообщения
            if (message.type === 'connected') {
                console.log('✅ [CALLS-WS] Подключение к серверу подтверждено');
                currentUser.log(`✅ Подключение к серверу подтверждено`, 'success');
                // Сохраняем userId от сервера для WebSocket сообщений
                if (message.userId) {
                    currentUser.wsUserId = message.userId;
                    console.log('🆔 [CALLS-WS] WebSocket ID:', message.userId);
                    currentUser.log(`🆔 WebSocket ID: ${message.userId}`, 'info');
                }
                return;
            }
            
            if (message.type === 'error') {
                currentUser.log(`❌ Ошибка сервера: ${message.message}`, 'error');
                return;
            }
            
            // Обрабатываем P2P сигналы
            if (message.type.startsWith('p2p_')) {
                handleP2PSignal(message);
                return;
            }
            
            // Обрабатываем сигналы
            if (message.from) {
                currentUser.log(`📨 Получено: ${message.type} от ${message.from}`, 'info');
            }
            
            switch (message.type) {
                case 'ping':
                    handlePing(message);
                    break;
                case 'pong':
                    handlePong(message);
                    break;
                case 'offer':
                    handleOffer(message);
                    break;
                case 'answer':
                    handleAnswer(message);
                    break;
                case 'ice-candidate':
                    handleIceCandidate(message);
                    break;
                case 'disconnect':
                    handleDisconnect(message);
                    break;
                case 'chat_message':
                    handleChatMessage(message);
                    break;
                default:
                    if (message.from) {
                        currentUser.log(`⚠️ Неизвестный тип сообщения: ${message.type}`, 'warning');
                    }
            }
        }
        
        
        // Отправка сообщения через WebSocket для звонков
        function sendCallsWebSocketMessage(type, data, to = null) {
            console.log('📤 [CALLS-WS] ===== ОТПРАВКА СООБЩЕНИЯ ЧЕРЕЗ CALLS WEBSOCKET =====');
            console.log('📤 [CALLS-WS] Тип сообщения:', type);
            console.log('📤 [CALLS-WS] Данные:', data);
            console.log('📤 [CALLS-WS] Получатель:', to);
            console.log('📤 [CALLS-WS] Calls WebSocket подключен:', currentUser.callsWsConnected);
            console.log('📤 [CALLS-WS] Calls WebSocket объект:', !!currentUser.callsWs);
            console.log('📤 [CALLS-WS] Calls WebSocket состояние:', currentUser.callsWs?.readyState);
            
            if (!currentUser.callsWsConnected || !currentUser.callsWs) {
                console.log('❌ [CALLS-WS] WebSocket для звонков не подключен!');
                currentUser.log('❌ WebSocket для звонков не подключен', 'error');
                return;
            }
            
            const message = {
                type: type,
                from: currentUser.wsUserId || currentUser.id,
                to: to || currentUser.targetUser,
                data: data,
                timestamp: Date.now()
            };
            
            console.log('📤 [CALLS-WS] Полное сообщение:', message);
            console.log('📤 [CALLS-WS] JSON строка:', JSON.stringify(message));
            
            try {
                currentUser.callsWs.send(JSON.stringify(message));
                console.log('✅ [CALLS-WS] Сообщение успешно отправлено через Calls WebSocket');
                currentUser.log(`✅ ${type} отправлен`, 'success');
            } catch (error) {
                currentUser.log(`❌ Ошибка отправки ${type}: ${error.message}`, 'error');
            }
        }
        
        
        // Функция для показа поля пароля
        function showPasswordField(event) {
            const passwordField = document.getElementById('userPassword');
            const loginButton = event.target;
            
            if (passwordField.style.display === 'none') {
                passwordField.style.display = 'block';
                loginButton.textContent = 'Войти';
                loginButton.onclick = () => startUser();
            }
        }
        
        // Функция для запуска пользователя
        async function startUser() {
            const username = document.getElementById('userId').value;
            const password = document.getElementById('userPassword').value;
            
            if (!username) {
                currentUser.log(`❌ Введите логин`, 'error');
                return;
            }
            
            if (!password) {
                currentUser.log(`❌ Введите пароль`, 'error');
                return;
            }
            
            // Авторизация пользователя
            currentUser.log(`🔐 Авторизация пользователя ${username}...`, 'info');
            
            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentUser.id = username;
                    currentUser.sessionToken = data.sessionToken;
                    
                    
                    // Подключаемся к Chat WebSocket сразу после авторизации
                    connectChatWebSocket();
                    
                    // Запускаем мониторинг соединения
                    startConnectionMonitoring();
                    
                    // Сохраняем данные в localStorage
                    localStorage.setItem('userData', JSON.stringify({
                        username: username,
                        userId: data.userId,
                        sessionToken: data.sessionToken
                    }));
                    
                    currentUser.log(`✅ Авторизация успешна`, 'success');
                    
                    // Предзагружаем аватар текущего пользователя
                    const currentUsername = username;
                    const currentUserId = data.userId;
                    loadAndCacheAvatar(currentUserId, currentUsername).then(() => {
                        console.log('✅ Аватар текущего пользователя загружен в кэш');
                        // Обновляем отображение аватара
                        displayCachedAvatar('userAvatar', currentUserId, currentUsername);
                    }).catch(error => {
                        console.error('Ошибка загрузки аватара текущего пользователя:', error);
                    });
                    
                    // Предзагрузка аватаров будет происходить после загрузки данных друзей
                        } else {
                    currentUser.log(`❌ Ошибка авторизации: ${data.error}`, 'error');
                    return;
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка соединения с сервером`, 'error');
                return;
            }
            
            currentUser.lastSignalId = Math.floor(Date.now() / 1000) - 60; // Получаем сигналы за последнюю минуту
            currentUser.state = 'idle';
            currentUser.targetUser = null;
            currentUser.isInitiator = false;
            currentUser.webrtcInitiated = false;
            currentUser.log(`🚀 Пользователь ${currentUser.id} готов к звонкам`, 'success');
            currentUser.log(`⏰ Игнорируем сигналы старше: ${currentUser.lastSignalId}`, 'info');
            currentUser.log(`📊 Состояние: ${currentUser.state}`, 'info');
            
            // Подключаемся к WebSocket серверам
            try {
                await connectCallsWebSocket();
            } catch (error) {
                currentUser.log(`❌ Ошибка подключения к WebSocket: ${error.message}`, 'error');
                return;
            }
            
            // Обновляем UI
            updateUI();
            
            // Показываем систему друзей
            showFriendsSection();
            
            // Загружаем сообщения из localStorage
            loadChatMessagesFromStorage();
            
            currentUser.log(`📹 Камера и микрофон будут запущены при звонке`, 'info');
        }
        
        
        // Функция для обновления UI
        function updateUI() {
            const loginSection = document.getElementById('loginSection');
            const userInfo = document.getElementById('userInfo');
            const headerUserInfo = document.getElementById('headerUserInfo');
            const userStatus = document.getElementById('userStatus');
            const currentUserId = document.getElementById('currentUserId');
            const userAvatar = document.getElementById('userAvatar');
            const startCallBtn = document.getElementById('startCallBtn');
            const disconnectBtn = document.getElementById('disconnectBtn');
            const resetBtn = document.querySelector('button[onclick="resetUser()"]');
            
            if (currentUser.id) {
                // Пользователь авторизован
                loginSection.style.display = 'none';
                userInfo.style.display = 'block';
                headerUserInfo.style.display = 'flex';
                currentUserId.textContent = currentUser.id;
                
                // Загружаем аватар из БД
                loadUserAvatar();
                
                // Обновляем статус
                userStatus.textContent = getStatusText();
                userStatus.className = `status ${currentUser.state}`;
                
                // Обновляем кнопки
                if (currentUser.state === 'idle') {
                startCallBtn.style.display = 'inline-block';
                startCallBtn.disabled = false;
                disconnectBtn.style.display = 'none';
                    resetBtn.style.display = 'inline-block';
                } else if (currentUser.state === 'connecting' || currentUser.state === 'connected' || currentUser.state === 'calling') {
                    startCallBtn.style.display = 'none';
                    disconnectBtn.style.display = 'inline-block';
                    disconnectBtn.disabled = false;
                    resetBtn.style.display = 'inline-block';
                }
                } else {
                // Пользователь не авторизован
                loginSection.style.display = 'block';
                userInfo.style.display = 'none';
            }
        }
        
        function getStatusText() {
            switch (currentUser.state) {
                case 'idle': return 'Готов к звонкам';
                case 'connecting': return 'Подключение...';
                case 'connected': return 'Соединение установлено';
                case 'calling': return 'Звонок активен';
                default: return 'Отключен';
            }
        }
        
        // Функция для начала звонка
        async function startAudioCall() {
            const targetId = document.getElementById('targetUserId').value;
            
            if (!targetId) {
                currentUser.log('❌ Не указан целевой пользователь', 'error');
                return;
            }
            
            if (currentUser.state !== 'idle') {
                currentUser.log(`❌ Нельзя начать вызов - состояние: ${currentUser.state}`, 'error');
                return;
            }
            
            currentUser.log(`🎵 Начинаем аудио звонок к ${targetId}`, 'info');
            currentUser.state = 'connecting';
            currentUser.targetUser = targetId;
            currentUser.isInitiator = true;
            currentUser.webrtcInitiated = false;
            updateUI();
            
            // Запускаем звук гудков для звонящего
            playOutgoingCallSound();
            
            // Запускаем таймаут звонка
            startCallTimeout();
            
            // Обновляем имя звонящего для аудиозвонка
            await updateAudioCallerName(targetId);
            
            // Отправляем ping через WebSocket с типом аудио
            currentUser.log(`📤 Отправляем ping к ${targetId}`, 'info');
            sendCallsWebSocketMessage('ping', { timestamp: Date.now(), callType: 'audio' }, targetId);
        }
        
        async function startCall() {
            const targetId = document.getElementById('targetUserId').value;
            
            if (!targetId) {
                currentUser.log('❌ Не указан целевой пользователь', 'error');
                return;
            }
            
            if (currentUser.state !== 'idle') {
                currentUser.log(`❌ Нельзя начать вызов - состояние: ${currentUser.state}`, 'error');
                return;
            }
            
            currentUser.log(`📞 Начинаем звонок к ${targetId}`, 'info');
            currentUser.state = 'connecting';
            currentUser.targetUser = targetId;
            currentUser.isInitiator = true;
            currentUser.webrtcInitiated = false;
            updateUI();
            
            // Запускаем звук гудков для звонящего
            playOutgoingCallSound();
            
            // Запускаем таймаут звонка
            startCallTimeout();
            
            // Отправляем ping через WebSocket
            currentUser.log(`📤 Отправляем ping к ${targetId}`, 'info');
            sendCallsWebSocketMessage('ping', { timestamp: Date.now(), callType: 'video' }, targetId);
        }
        
        
        // Обработка ping
        async function handlePing(signal) {
            if (currentUser.state !== 'idle') {
                currentUser.log(`⚠️ Игнорируем ping от ${signal.from} - состояние: ${currentUser.state}`, 'warning');
                    return;
                }
                
            currentUser.log(`🏓 Получен ping от ${signal.from}`, 'info');
            
            // Определяем тип звонка
            const callType = signal.data.callType || 'video';
            const isAudioCall = callType === 'audio';
            
            // Показываем окно входящего звонка
            incomingCall.isActive = true;
            incomingCall.caller = signal.from;
            incomingCall.offer = null; // offer еще не получен
            incomingCall.iceCandidates = [];
            
            // Обновляем имя звонящего в модальном окне
            await updateIncomingCallerName(signal.from, callType);
            document.getElementById('incomingCallModal').style.display = 'flex';
            
            // Воспроизводим звук входящего звонка
            playIncomingCallSound();
            
            currentUser.log(`📞 Входящий звонок от ${signal.from}`, 'info');
            
            // Сохраняем тип звонка для использования при принятии
            incomingCall.callType = callType;
            
            console.log('📞 [INCOMING] ===== ВХОДЯЩИЙ ЗВОНОК =====');
            console.log('📞 [INCOMING] От кого:', signal.from);
            console.log('📞 [INCOMING] Тип звонка из данных:', signal.data.callType);
            console.log('📞 [INCOMING] Определенный тип звонка:', callType);
            console.log('📞 [INCOMING] Это аудиозвонок:', isAudioCall);
            console.log('📞 [INCOMING] Сохранен в incomingCall.callType:', incomingCall.callType);
            
            // Запускаем медиа потоки в зависимости от типа звонка
            try {
                if (isAudioCall) {
                    currentUser.log(`🎵 Запуск микрофона для аудио звонка...`, 'info');
                    currentUser.localStream = await navigator.mediaDevices.getUserMedia({ 
                        video: false,  // Только аудио!
                        audio: true 
                    });
                    } else {
                    currentUser.log(`📹 Запуск камеры и микрофона для видео звонка...`, 'info');
                    currentUser.localStream = await navigator.mediaDevices.getUserMedia({ 
                        video: true, 
                        audio: true 
                    });
                }
                
                // Устанавливаем только видео для локального отображения (без аудио)
                const localVideoStream = createLocalVideoStream(currentUser.localStream);
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = localVideoStream;
                
                // Явно отключаем аудио для локального видео
                localVideo.muted = true;
                localVideo.volume = 0;
                localVideo.setAttribute('muted', 'true');
                
                currentUser.log(`✅ Медиа потоки получены: ${currentUser.localStream.getTracks().length} треков`, 'success');
                
                // Логируем детали треков
                currentUser.localStream.getTracks().forEach(track => {
                    currentUser.log(`📹 Трек: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`, 'info');
                });
                
            } catch (error) {
                currentUser.log(`❌ Ошибка получения медиа: ${error.message}`, 'error');
                // Скрываем окно входящего звонка при ошибке
                hideIncomingCallModal();
            }
        }
        
        // Обработка pong
        function handlePong(signal) {
            if (currentUser.state === 'connecting' && currentUser.targetUser === signal.from) {
                currentUser.log(`🏓 Получен pong от ${signal.from} - связь установлена!`, 'success');
                currentUser.state = 'connected';
                updateUI();
                
                // Останавливаем звук гудков для звонящего
                stopOutgoingCallSound();
                
                // Останавливаем таймаут звонка
                stopCallTimeout();
                
                // Запускаем таймер звонка для звонящего
                startCallTimer();
                
                // Сбрасываем состояние кнопок аудио
                resetAudioControls();
                
                // Только инициатор звонка отправляет offer после pong
                if (currentUser.isInitiator) {
                    initiateWebRTC();
                }
                    } else {
                currentUser.log(`⚠️ Игнорируем pong от ${signal.from} - состояние: ${currentUser.state}`, 'warning');
            }
        }
        
        // Инициация WebRTC соединения
        async function initiateWebRTC() {
            if (currentUser.state !== 'connected' || currentUser.webrtcInitiated) {
                currentUser.log(`⚠️ Не можем инициировать WebRTC - состояние: ${currentUser.state}, initiated: ${currentUser.webrtcInitiated}`, 'warning');
                return;
            }
            
            currentUser.webrtcInitiated = true;
            currentUser.log(`🎥 Инициируем WebRTC соединение`, 'info');
            
            try {
                // Создаем PeerConnection
                currentUser.peerConnection = new RTCPeerConnection(rtcConfig);
                
                // Добавляем локальный поток
                if (currentUser.localStream) {
                    currentUser.localStream.getTracks().forEach(track => {
                        currentUser.peerConnection.addTrack(track, currentUser.localStream);
                        currentUser.log(`📹 Добавлен трек: ${track.kind}`, 'info');
                    });
                    currentUser.log(`📹 Добавлено ${currentUser.localStream.getTracks().length} треков в PeerConnection`, 'success');
                } else {
                    currentUser.log(`❌ Нет локального потока для добавления в PeerConnection`, 'error');
                }
                
                // Обработчики событий
                currentUser.peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendSignal('ice-candidate', event.candidate);
                    }
                };
                
                currentUser.peerConnection.ontrack = (event) => {
                    currentUser.log('📹 Получен удаленный поток', 'success');
                    currentUser.log(`📹 Количество потоков: ${event.streams.length}`, 'info');
                    currentUser.log(`📹 Количество треков: ${event.track.kind}`, 'info');
                    document.getElementById('remoteVideo').srcObject = event.streams[0];
                };
                
                currentUser.peerConnection.onconnectionstatechange = () => {
                    currentUser.log(`🔗 Состояние соединения: ${currentUser.peerConnection.connectionState}`, 'info');
                    if (currentUser.peerConnection.connectionState === 'connected') {
                        currentUser.log('✅ P2P соединение установлено!', 'success');
                        currentUser.state = 'calling';
                        updateUI();
                    }
                };
                
                // Создаем и отправляем offer
                const offer = await currentUser.peerConnection.createOffer();
                await currentUser.peerConnection.setLocalDescription(offer);
                
                await sendSignal('offer', offer);
                currentUser.log('✅ Offer отправлен', 'success');
                
            } catch (error) {
                currentUser.log(`❌ Ошибка инициации WebRTC: ${error.message}`, 'error');
            }
        }
        
        // Обработка offer
        async function handleOffer(signal) {
            if (currentUser.state !== 'connecting' || currentUser.targetUser !== signal.from) {
                currentUser.log(`⚠️ Игнорируем offer - состояние: ${currentUser.state}, target: ${currentUser.targetUser}`, 'warning');
                return;
            }
            
            currentUser.log(`📥 Получен offer от ${signal.from}`, 'info');
            
            // Проверяем наличие медиа потоков
            if (!currentUser.localStream) {
                currentUser.log(`❌ Нет локального потока для добавления в PeerConnection (получатель)`, 'error');
                return;
            }
            
            try {
                // Создаем PeerConnection
                currentUser.peerConnection = new RTCPeerConnection(rtcConfig);
                
                // Добавляем локальный поток
                currentUser.localStream.getTracks().forEach(track => {
                    currentUser.peerConnection.addTrack(track, currentUser.localStream);
                    currentUser.log(`📹 Добавлен трек: ${track.kind} (получатель)`, 'info');
                });
                currentUser.log(`📹 Добавлено ${currentUser.localStream.getTracks().length} треков в PeerConnection (получатель)`, 'success');
                
                // Обработчики событий
                currentUser.peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendSignal('ice-candidate', event.candidate);
                    }
                };
                
                currentUser.peerConnection.ontrack = (event) => {
                    currentUser.log('📹 Получен удаленный поток (получатель)', 'success');
                    currentUser.log(`📹 Количество потоков: ${event.streams.length} (получатель)`, 'info');
                    currentUser.log(`📹 Количество треков: ${event.track.kind} (получатель)`, 'info');
                    document.getElementById('remoteVideo').srcObject = event.streams[0];
                };
                
                currentUser.peerConnection.onconnectionstatechange = () => {
                    currentUser.log(`🔗 Состояние соединения: ${currentUser.peerConnection.connectionState}`, 'info');
                    if (currentUser.peerConnection.connectionState === 'connected') {
                        currentUser.log('✅ P2P соединение установлено!', 'success');
                        currentUser.state = 'calling';
                        updateUI();
                    }
                };
                
                // Устанавливаем удаленное описание
                await currentUser.peerConnection.setRemoteDescription(signal.data);
                
                // Создаем и отправляем answer
                const answer = await currentUser.peerConnection.createAnswer();
                await currentUser.peerConnection.setLocalDescription(answer);
                
                await sendSignal('answer', answer);
                currentUser.log('✅ Answer отправлен', 'success');
                
                // Показываем кнопку "Завершить" у получателя
                const disconnectBtn = document.getElementById(`disconnectBtn_${signal.from}`);
                const callBtn = document.getElementById(`callBtn_${signal.from}`);
                
                if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
                if (callBtn) callBtn.style.display = 'none';
                
                                } catch (error) {
                currentUser.log(`❌ Ошибка обработки offer: ${error.message}`, 'error');
            }
        }
        
        // Принятие входящего звонка
        async function acceptIncomingCall() {
            if (!incomingCall.isActive) return;
            
            // Останавливаем звук входящего звонка
            stopIncomingCallSound();
            
            // Останавливаем звук гудков для звонящего (если он был инициатором)
            stopOutgoingCallSound();
            
            // Останавливаем таймаут звонка
            stopCallTimeout();
            
            currentUser.log(`✅ Принимаем звонок от ${incomingCall.caller}`, 'success');
            
            // Отправляем pong для подтверждения принятия звонка
            sendCallsWebSocketMessage('pong', { received: true }, incomingCall.caller);
            currentUser.log('✅ pong отправлен', 'success');
            
            // Определяем тип звонка
            const callType = incomingCall.callType || 'video';
            
            // Устанавливаем состояние
            currentUser.state = 'connecting';
            currentUser.targetUser = incomingCall.caller;
            currentUser.isInitiator = false;
            currentUser.webrtcInitiated = false;
            currentUser.callType = callType; // Устанавливаем тип звонка
            updateUI();
            
            // Сохраняем caller перед скрытием модального окна
            const callerUsername = incomingCall.caller;
            
            // Скрываем окно входящего звонка
            hideIncomingCallModal();
            
            console.log('✅ [ACCEPT] ===== ПРИНЯТИЕ ЗВОНКА =====');
            console.log('✅ [ACCEPT] incomingCall.callType:', incomingCall.callType);
            console.log('✅ [ACCEPT] Определенный тип звонка:', callType);
            console.log('✅ [ACCEPT] Это аудиозвонок:', callType === 'audio');
            console.log('✅ [ACCEPT] Сохраненный callerUsername:', callerUsername);
            
            if (callType === 'audio') {
                console.log('🎵 [ACCEPT] Показываем аудио контейнер');
                document.getElementById('audioCallContainer').style.display = 'block';
                // Обновляем имя звонящего для аудиозвонка
                await updateAudioCallerName(callerUsername);
            } else {
                console.log('🎬 [ACCEPT] Показываем видео контейнер');
                document.getElementById('videoCallContainer').style.display = 'block';
                
                // Принудительно переключаем на основной динамик для видеозвонка
                setTimeout(() => {
                    forceSpeakerForVideoCall();
                }, 500);
            }
            
            // Запускаем таймер звонка
            startCallTimer();
            
            // Сбрасываем состояние кнопок аудио
            resetAudioControls();
            
            currentUser.log(`⏳ Ждем offer от ${incomingCall.caller}...`, 'info');
        }
        
        // Переменные для таймера звонка
        let callStartTime = null;
        let callTimerInterval = null;
        
        // Запуск таймера звонка
        function startCallTimer() {
            if (callTimerInterval) {
                clearInterval(callTimerInterval);
            }
            
            callStartTime = Date.now();
            console.log('⏰ [TIMER] Запуск таймера звонка');
            
            callTimerInterval = setInterval(() => {
                updateCallTimer();
            }, 1000);
        }
        
        // Обновление таймера звонка
        function updateCallTimer() {
            if (!callStartTime) return;
            
            const elapsed = Date.now() - callStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Обновляем таймер в аудиозвонке
            const audioTimer = document.getElementById('audioCallTimer');
            if (audioTimer) {
                audioTimer.textContent = timeString;
            }
            
            // Обновляем таймер в видеозвонке (если есть)
            const videoTimer = document.getElementById('videoCallTimer');
            if (videoTimer) {
                videoTimer.textContent = timeString;
            }
        }
        
        // Остановка таймера звонка
        function stopCallTimer() {
            if (callTimerInterval) {
                clearInterval(callTimerInterval);
                callTimerInterval = null;
            }
            callStartTime = null;
            console.log('⏰ [TIMER] Остановка таймера звонка');
            
            // Останавливаем все звуки при остановке таймера
            stopIncomingCallSound();
            stopOutgoingCallSound();
            
            // Останавливаем таймаут звонка
            stopCallTimeout();
            
            // Сбрасываем таймеры
            const audioTimer = document.getElementById('audioCallTimer');
            if (audioTimer) {
                audioTimer.textContent = '00:00';
            }
            
            const videoTimer = document.getElementById('videoCallTimer');
            if (videoTimer) {
                videoTimer.textContent = '00:00';
            }
        }
        
        // Переменные для управления аудио
        let isMicrophoneMuted = false;
        let isSpeakerphoneOn = false;
        let isVideoMicrophoneMuted = false;
        let isVideoCameraMuted = false;
        
        // Функция для создания локального видео потока без аудио
        function createLocalVideoStream(stream) {
            const localVideoStream = new MediaStream();
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach(track => localVideoStream.addTrack(track));
            return localVideoStream;
        }
        
        // Функция для принудительного переключения на основной динамик при видеозвонке
        // ПРИМЕЧАНИЕ: Работает только в нативном мобильном приложении, в браузере не поддерживается
        async function forceSpeakerForVideoCall() {
            console.log('📱 [VIDEO-AUDIO] Принудительное переключение аудио доступно только в нативном приложении');
            console.log('🌐 [VIDEO-AUDIO] В браузере пользователь должен вручную переключить на динамик');
            
            // В браузере показываем уведомление пользователю
            if (navigator.userAgent.includes('Mobile')) {
                console.log('📱 [VIDEO-AUDIO] Мобильное устройство обнаружено - рекомендуется переключить на динамик вручную');
            }
        }
        
        
        // Сброс состояния кнопок аудио
        function resetAudioControls() {
            isMicrophoneMuted = false;
            isSpeakerphoneOn = false;
            isVideoMicrophoneMuted = false;
            isVideoCameraMuted = false;
            
            // Сбрасываем кнопку микрофона аудиозвонка
            const micBtn = document.getElementById('audioMicrophoneBtn');
            if (micBtn) {
                const micIcon = micBtn.querySelector('i');
                micIcon.className = 'fas fa-microphone';
                micBtn.classList.remove('muted', 'active');
            }
            
            // Сбрасываем кнопку громкой связи
            const speakerBtn = document.getElementById('speakerphoneBtn');
            if (speakerBtn) {
                const speakerIcon = speakerBtn.querySelector('i');
                speakerIcon.className = 'fas fa-volume-down';
                speakerBtn.classList.remove('active');
            }
            
            // Сбрасываем кнопку микрофона видеозвонка
            const videoMicBtn = document.getElementById('videoMicrophoneBtn');
            if (videoMicBtn) {
                const videoMicIcon = videoMicBtn.querySelector('i');
                videoMicIcon.className = 'fas fa-microphone';
                videoMicBtn.classList.remove('muted', 'active');
            }
            
            // Сбрасываем кнопку камеры видеозвонка
            const videoCamBtn = document.getElementById('videoCameraBtn');
            if (videoCamBtn) {
                const videoCamIcon = videoCamBtn.querySelector('i');
                videoCamIcon.className = 'fas fa-video';
                videoCamBtn.classList.remove('muted', 'active');
            }
            
            console.log('🔄 [AUDIO] Состояние кнопок аудио сброшено');
        }
        
        // Переключение микрофона
        function toggleMicrophone() {
            if (!currentUser.localStream) {
                console.log('❌ [MIC] Нет локального потока');
                return;
            }
            
            const audioTracks = currentUser.localStream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.log('❌ [MIC] Нет аудио треков');
                return;
            }
            
            isMicrophoneMuted = !isMicrophoneMuted;
            audioTracks.forEach(track => {
                track.enabled = !isMicrophoneMuted;
            });
            
            const micBtn = document.getElementById('audioMicrophoneBtn');
            const micIcon = micBtn.querySelector('i');
            
            if (isMicrophoneMuted) {
                micIcon.className = 'fas fa-microphone-slash';
                micBtn.classList.add('muted');
                micBtn.classList.remove('active');
                console.log('🔇 [MIC] Микрофон отключен');
            } else {
                micIcon.className = 'fas fa-microphone';
                micBtn.classList.remove('muted');
                micBtn.classList.add('active');
                console.log('🎤 [MIC] Микрофон включен');
            }
        }
        
        // Переключение громкой связи (только для мобильных устройств)
        function toggleSpeakerphone() {
            // Проверяем, что это мобильное устройство
            if (window.innerWidth >= 769) {
                console.log('⚠️ [SPEAKER] Кнопка громкой связи недоступна на ПК');
                return;
            }
            
            isSpeakerphoneOn = !isSpeakerphoneOn;
            
            const speakerBtn = document.getElementById('speakerphoneBtn');
            const speakerIcon = speakerBtn.querySelector('i');
            
            if (isSpeakerphoneOn) {
                speakerIcon.className = 'fas fa-volume-up';
                speakerBtn.classList.add('active');
                console.log('🔊 [SPEAKER] Громкая связь включена');
                // Здесь можно добавить логику для переключения на внешний динамик
            } else {
                speakerIcon.className = 'fas fa-volume-down';
                speakerBtn.classList.remove('active');
                console.log('🔉 [SPEAKER] Громкая связь отключена');
                // Здесь можно добавить логику для переключения на наушники
            }
        }
        
        // Переключение микрофона в видеозвонке
        function toggleVideoMicrophone() {
            if (!currentUser.localStream) {
                console.log('❌ [VIDEO-MIC] Нет локального потока');
                return;
            }
            
            const audioTracks = currentUser.localStream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.log('❌ [VIDEO-MIC] Нет аудио треков');
                return;
            }
            
            isVideoMicrophoneMuted = !isVideoMicrophoneMuted;
            audioTracks.forEach(track => {
                track.enabled = !isVideoMicrophoneMuted;
            });
            
            const micBtn = document.getElementById('videoMicrophoneBtn');
            const micIcon = micBtn.querySelector('i');
            
            if (isVideoMicrophoneMuted) {
                micIcon.className = 'fas fa-microphone-slash';
                micBtn.classList.add('muted');
                micBtn.classList.remove('active');
                console.log('🔇 [VIDEO-MIC] Микрофон отключен');
            } else {
                micIcon.className = 'fas fa-microphone';
                micBtn.classList.remove('muted');
                micBtn.classList.add('active');
                console.log('🎤 [VIDEO-MIC] Микрофон включен');
            }
        }
        
        // Переключение камеры в видеозвонке
        function toggleVideoCamera() {
            if (!currentUser.localStream) {
                console.log('❌ [VIDEO-CAM] Нет локального потока');
                return;
            }
            
            const videoTracks = currentUser.localStream.getVideoTracks();
            if (videoTracks.length === 0) {
                console.log('❌ [VIDEO-CAM] Нет видео треков');
                return;
            }
            
            isVideoCameraMuted = !isVideoCameraMuted;
            videoTracks.forEach(track => {
                track.enabled = !isVideoCameraMuted;
            });
            
            const camBtn = document.getElementById('videoCameraBtn');
            const camIcon = camBtn.querySelector('i');
            
            if (isVideoCameraMuted) {
                camIcon.className = 'fas fa-video-slash';
                camBtn.classList.add('muted');
                camBtn.classList.remove('active');
                console.log('📹 [VIDEO-CAM] Камера отключена');
            } else {
                camIcon.className = 'fas fa-video';
                camBtn.classList.remove('muted');
                camBtn.classList.add('active');
                console.log('📹 [VIDEO-CAM] Камера включена');
            }
        }
        
        // Обновление имени звонящего для аудиозвонка
        async function updateAudioCallerName(callerUsername) {
            console.log('🚀 [AUDIO-CALL] ФУНКЦИЯ ВЫЗВАНА! callerUsername:', callerUsername);
            const audioCallerName = document.getElementById('audioCallerName');
            const audioCallerAvatar = document.getElementById('audioCallerAvatar');
            const chatFriendName = document.getElementById('chatFriendName');
            
            console.log('👤 [AUDIO-CALL] ===== ОТЛАДКА ИМЕНИ =====');
            console.log('👤 [AUDIO-CALL] callerUsername:', callerUsername);
            console.log('👤 [AUDIO-CALL] audioCallerName элемент:', !!audioCallerName);
            console.log('👤 [AUDIO-CALL] audioCallerAvatar элемент:', !!audioCallerAvatar);
            console.log('👤 [AUDIO-CALL] chatFriendName элемент:', !!chatFriendName);
            console.log('👤 [AUDIO-CALL] chatFriendName содержимое:', chatFriendName?.textContent);
            console.log('👤 [AUDIO-CALL] chatFriendName длина:', chatFriendName?.textContent?.length);
            console.log('👤 [AUDIO-CALL] chatFriendName равен "Другом":', chatFriendName?.textContent === 'Другом');
            
            if (audioCallerName) {
                if (chatFriendName && chatFriendName.textContent && chatFriendName.textContent !== 'Другом') {
                    // Берем имя собеседника из chatFriendName
                    audioCallerName.textContent = chatFriendName.textContent;
                    console.log('👤 [AUDIO-CALL] ✅ Используем имя собеседника из chatFriendName:', chatFriendName.textContent);
                } else {
                    // Пытаемся загрузить имя из IndexedDB
                    try {
                        const contactName = await getContactName(callerUsername);
                        if (contactName) {
                            audioCallerName.textContent = contactName;
                            console.log('👤 [AUDIO-CALL] ✅ Используем имя из IndexedDB:', contactName);
                        } else {
                            // Если имени нет в IndexedDB, используем username
                            const displayName = callerUsername || 'Неизвестный пользователь';
                            audioCallerName.textContent = displayName;
                            console.log('👤 [AUDIO-CALL] ⚠️ Используем username или fallback:', displayName);
                        }
                    } catch (error) {
                        console.error('👤 [AUDIO-CALL] Ошибка загрузки имени из IndexedDB:', error);
                        // Fallback на username при ошибке
                        const displayName = callerUsername || 'Неизвестный пользователь';
                        audioCallerName.textContent = displayName;
                        console.log('👤 [AUDIO-CALL] Fallback на username:', displayName);
                    }
                }
                console.log('👤 [AUDIO-CALL] Итоговое содержимое audioCallerName:', audioCallerName.textContent);
            } else {
                console.log('❌ [AUDIO-CALL] audioCallerName элемент не найден!');
            }
            
            // Загружаем аватар абонента из кэша
            try {
                console.log('🖼️ [AUDIO-CALL] Загружаем аватар для абонента:', callerUsername);
                
                // Находим ID абонента в списке друзей
                const callerFriend = friendsData.friends.find(f => f.username === callerUsername);
                if (callerFriend && audioCallerAvatar) {
                    console.log('🖼️ [AUDIO-CALL] Найден друг в списке, ID:', callerFriend.contact_user_id);
                    
                    // Получаем кэшированный аватар
                    const avatarData = await getCachedAvatar(callerFriend.contact_user_id, callerUsername);
                    if (avatarData) {
                        // Заменяем placeholder на аватар
                        audioCallerAvatar.innerHTML = `<img src="${avatarData}" alt="Аватар абонента" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                        console.log('✅ [AUDIO-CALL] Аватар абонента загружен из кэша');
                    } else {
                        console.log('⚠️ [AUDIO-CALL] Аватар абонента не найден в кэше, оставляем placeholder');
                    }
                } else {
                    console.log('⚠️ [AUDIO-CALL] Абонент не найден в списке друзей или элемент аватара не найден');
                }
            } catch (error) {
                console.error('❌ [AUDIO-CALL] Ошибка загрузки аватара абонента:', error);
            }
        }
        
        // Обновление имени звонящего в модальном окне входящего звонка
        async function updateIncomingCallerName(callerUsername, callType = 'video') {
            const callerName = document.getElementById('callerName');
            const chatFriendName = document.getElementById('chatFriendName');
            const callerAvatarPlaceholder = document.getElementById('callerAvatarPlaceholder');
            const callTypeText = document.getElementById('callTypeText');
            
            console.log('👤 [INCOMING-CALL] ===== ОТЛАДКА ИМЕНИ =====');
            console.log('👤 [INCOMING-CALL] callerUsername:', callerUsername);
            console.log('👤 [INCOMING-CALL] callType:', callType);
            console.log('👤 [INCOMING-CALL] callerName элемент:', !!callerName);
            console.log('👤 [INCOMING-CALL] chatFriendName элемент:', !!chatFriendName);
            console.log('👤 [INCOMING-CALL] chatFriendName содержимое:', chatFriendName?.textContent);
            console.log('👤 [INCOMING-CALL] chatFriendName длина:', chatFriendName?.textContent?.length);
            
            // Обновляем тип звонка
            if (callTypeText) {
                if (callType === 'audio') {
                    callTypeText.textContent = 'Аудиозвонок';
                    console.log('📞 [INCOMING-CALL] Установлен тип: Аудиозвонок');
                } else {
                    callTypeText.textContent = 'Видеозвонок';
                    console.log('📞 [INCOMING-CALL] Установлен тип: Видеозвонок');
                }
            }
            
            if (callerName && chatFriendName && chatFriendName.textContent && chatFriendName.textContent !== 'Другом') {
                // Берем имя собеседника из chatFriendName
                callerName.textContent = chatFriendName.textContent;
                console.log('👤 [INCOMING-CALL] Используем имя собеседника из chatFriendName:', chatFriendName.textContent);
            } else {
                // Пытаемся загрузить имя из IndexedDB
                try {
                    const contactName = await getContactName(callerUsername);
                    if (contactName) {
                        callerName.textContent = contactName;
                        console.log('👤 [INCOMING-CALL] Используем имя из IndexedDB:', contactName);
                    } else {
                        // Если имени нет в IndexedDB, используем username
                        callerName.textContent = callerUsername;
                        console.log('👤 [INCOMING-CALL] Используем username:', callerUsername);
                    }
                } catch (error) {
                    console.error('👤 [INCOMING-CALL] Ошибка загрузки имени из IndexedDB:', error);
                    // Fallback на username при ошибке
                    callerName.textContent = callerUsername;
                    console.log('👤 [INCOMING-CALL] Fallback на username:', callerUsername);
                }
            }
            
            // Загружаем аватар звонящего из кэша
            try {
                console.log('🖼️ [INCOMING-CALL] Загружаем аватар для звонящего:', callerUsername);
                
                // Находим ID звонящего в списке друзей
                const callerFriend = friendsData.friends.find(f => f.username === callerUsername);
                if (callerFriend && callerAvatarPlaceholder) {
                    console.log('🖼️ [INCOMING-CALL] Найден друг в списке, ID:', callerFriend.contact_user_id);
                    
                    // Получаем кэшированный аватар
                    const avatarData = await getCachedAvatar(callerFriend.contact_user_id, callerUsername);
                    if (avatarData) {
                        // Заменяем placeholder на аватар
                        callerAvatarPlaceholder.innerHTML = `<img src="${avatarData}" alt="Аватар звонящего" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                        console.log('✅ [INCOMING-CALL] Аватар звонящего загружен из кэша');
                    } else {
                        console.log('⚠️ [INCOMING-CALL] Аватар звонящего не найден в кэше, оставляем placeholder');
                    }
                } else {
                    console.log('⚠️ [INCOMING-CALL] Звонящий не найден в списке друзей или элемент placeholder не найден');
                }
            } catch (error) {
                console.error('❌ [INCOMING-CALL] Ошибка загрузки аватара звонящего:', error);
            }
        }
        
        // Воспроизведение звука входящего звонка
        let incomingCallSound = null;
        let incomingCallSoundInterval = null;
        
        function playIncomingCallSound() {
            // Создаем звук входящего звонка программно
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Функция для создания одного гудка
            function createBeep(frequency, duration) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }
            
            // Воспроизводим гудки каждые 2 секунды
            function playBeepSequence() {
                // Первый гудок (высокий тон)
                createBeep(800, 0.5);
                setTimeout(() => {
                    // Второй гудок (низкий тон)
                    createBeep(600, 0.5);
                }, 600);
            }
            
            // Запускаем первый гудок сразу
            playBeepSequence();
            
            // Повторяем гудки каждые 2 секунды
            incomingCallSoundInterval = setInterval(playBeepSequence, 2000);
            
            console.log('🔊 Воспроизведение звука входящего звонка');
        }
        
        function stopIncomingCallSound() {
            if (incomingCallSoundInterval) {
                clearInterval(incomingCallSoundInterval);
                incomingCallSoundInterval = null;
                console.log('🔇 Остановка звука входящего звонка');
            }
        }
        
        // Воспроизведение звука гудков для звонящего
        let outgoingCallSound = null;
        let outgoingCallSoundInterval = null;
        
        // Таймаут звонка
        let callTimeoutInterval = null;
        const CALL_TIMEOUT_DURATION = 30000; // 30 секунд (как в WhatsApp/Telegram)
        
        function playOutgoingCallSound() {
            // Создаем звук гудков программно
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Функция для создания одного гудка
            function createRingingBeep(frequency, duration) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }
            
            // Воспроизводим гудки каждые 2.5 секунды (как в WhatsApp/Telegram)
            function playRingingSequence() {
                // Длинный гудок (1 секунда)
                createRingingBeep(440, 1.0);
                setTimeout(() => {
                    // Пауза 0.5 секунды
                }, 1000);
                setTimeout(() => {
                    // Короткий гудок (0.5 секунды)
                    createRingingBeep(440, 0.5);
                }, 1500);
            }
            
            // Запускаем первый гудок сразу
            playRingingSequence();
            
            // Повторяем гудки каждые 2.5 секунды (как в WhatsApp)
            outgoingCallSoundInterval = setInterval(playRingingSequence, 2500);
            
            console.log('📞 Воспроизведение звука гудков для звонящего');
        }
        
        function stopOutgoingCallSound() {
            if (outgoingCallSoundInterval) {
                clearInterval(outgoingCallSoundInterval);
                outgoingCallSoundInterval = null;
                console.log('🔇 Остановка звука гудков для звонящего');
            }
        }
        
        // Запуск таймаута звонка
        function startCallTimeout() {
            // Очищаем предыдущий таймаут если есть
            if (callTimeoutInterval) {
                clearTimeout(callTimeoutInterval);
            }
            
            callTimeoutInterval = setTimeout(() => {
                currentUser.log('⏰ Таймаут звонка - абонент не отвечает', 'warning');
                
                // Останавливаем все звуки
                stopIncomingCallSound();
                stopOutgoingCallSound();
                
                // Завершаем звонок
                if (currentUser.state === 'connecting') {
                    endCall();
                }
                
                // Скрываем модальное окно входящего звонка если оно открыто
                if (incomingCall.isActive) {
                    hideIncomingCallModal();
                    incomingCall.isActive = false;
                }
                
                console.log('⏰ Звонок автоматически завершен по таймауту');
            }, CALL_TIMEOUT_DURATION);
            
            console.log(`⏰ Запущен таймаут звонка на ${CALL_TIMEOUT_DURATION/1000} секунд`);
        }
        
        // Остановка таймаута звонка
        function stopCallTimeout() {
            if (callTimeoutInterval) {
                clearTimeout(callTimeoutInterval);
                callTimeoutInterval = null;
                console.log('⏰ Таймаут звонка отменен');
            }
        }
        
        // Отклонение входящего звонка
        async function rejectIncomingCall() {
            if (!incomingCall.isActive) return;
            
            // Останавливаем звук входящего звонка
            stopIncomingCallSound();
            
            // Останавливаем звук гудков для звонящего (если он был инициатором)
            stopOutgoingCallSound();
            
            // Останавливаем таймаут звонка
            stopCallTimeout();
            
            currentUser.log(`❌ Отклоняем звонок от ${incomingCall.caller}`, 'warning');
            
            // Останавливаем таймер звонка
            stopCallTimer();
            
            // Сбрасываем состояние кнопок аудио
            resetAudioControls();
            
            // Останавливаем медиа потоки
            if (currentUser.localStream) {
                currentUser.localStream.getTracks().forEach(track => track.stop());
                currentUser.localStream = null;
                document.getElementById('localVideo').srcObject = null;
                currentUser.log('📹 Медиа потоки остановлены', 'info');
            }
            
            // Отправляем disconnect сигнал конкретно инициатору звонка
            sendCallsWebSocketMessage('disconnect', { reason: 'call_rejected' }, incomingCall.caller);
            
            // Скрываем окно входящего звонка
            hideIncomingCallModal();
        }
        
        // Скрытие окна входящего звонка
        function hideIncomingCallModal() {
            document.getElementById('incomingCallModal').style.display = 'none';
            incomingCall.isActive = false;
            incomingCall.caller = null;
            incomingCall.offer = null;
            incomingCall.iceCandidates = [];
            
            // Очищаем таймаут если есть
            if (incomingCall.callTimeout) {
                clearTimeout(incomingCall.callTimeout);
                incomingCall.callTimeout = null;
            }
        }
        
        // Обработка answer
        async function handleAnswer(signal) {
            if (currentUser.state !== 'connected') {
                currentUser.log(`⚠️ Игнорируем answer - состояние: ${currentUser.state}`, 'warning');
                return;
            }

            currentUser.log(`📥 Получен answer от ${signal.from}`, 'info');
            
            try {
                if (currentUser.peerConnection) {
                    await currentUser.peerConnection.setRemoteDescription(signal.data);
                    currentUser.log('✅ Offer/Answer обмен завершен!', 'success');
                    currentUser.state = 'calling';
                    
                    // Показываем кнопку "Завершить" у инициатора
                    const disconnectBtn = document.getElementById(`disconnectBtn_${signal.from}`);
                    const callBtn = document.getElementById(`callBtn_${signal.from}`);
                    
                    if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
                    if (callBtn) callBtn.style.display = 'none';
                    
                    updateUI();
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка обработки answer: ${error.message}`, 'error');
            }
        }
        
        // Обработка ICE кандидатов
        async function handleIceCandidate(signal) {
            if (currentUser.peerConnection) {
                try {
                    await currentUser.peerConnection.addIceCandidate(signal.data);
                    currentUser.log(`🧊 ICE кандидат добавлен от ${signal.from}`, 'info');
                                } catch (error) {
                    currentUser.log(`❌ Ошибка добавления ICE кандидата: ${error.message}`, 'error');
                }
                            } else {
                currentUser.log(`⚠️ PeerConnection не создан, игнорируем ICE кандидат`, 'warning');
            }
        }
        
        // Обработка disconnect
        async function handleDisconnect(signal) {
            currentUser.log(`📥 Получен disconnect от ${signal.from}`, 'warning');
            
            // Проверяем, что это от целевого пользователя или от того, кто звонил
            if (currentUser.targetUser === signal.from || (incomingCall.isActive && incomingCall.caller === signal.from)) {
                
                // Останавливаем все звуки при любом разрыве соединения
                stopIncomingCallSound();
                stopOutgoingCallSound();
                
                // Если это отклонение звонка на ранней стадии
                if (signal.data && signal.data.reason === 'call_rejected') {
                    currentUser.log(`❌ ${signal.from} отклонил звонок`, 'warning');
                            } else {
                    currentUser.log(`🔌 Соединение разорвано`, 'warning');
                }
                
                // Завершаем только звонок, не сбрасываем пользователя
                if (currentUser.peerConnection) {
                    currentUser.peerConnection.close();
                    currentUser.peerConnection = null;
                }
                
                // Показываем сообщение о завершении звонка
                currentUser.log('📞 Разговор завершен', 'info');
                
                // Останавливаем медиа потоки
                if (currentUser.localStream) {
                    currentUser.localStream.getTracks().forEach(track => track.stop());
                    currentUser.localStream = null;
                    document.getElementById('localVideo').srcObject = null;
                    currentUser.log('📹 Медиа потоки остановлены', 'info');
                }
                
                // Скрываем окна звонков и чата с задержкой
                setTimeout(() => {
                    document.getElementById('videoCallContainer').style.display = 'none';
                    document.getElementById('audioCallContainer').style.display = 'none';
                    document.getElementById('chatContainer').style.display = 'none';
                    currentChatFriend = null; // Сбрасываем текущий чат
                }, 1500);
                
                // Восстанавливаем кнопки друзей
                restoreFriendButtons();
                
                // Сбрасываем только состояние звонка
                currentUser.state = 'idle';
                currentUser.targetUser = null;
                currentUser.isInitiator = false;
                currentUser.webrtcInitiated = false;
                
                document.getElementById('remoteVideo').srcObject = null;
                
                // Скрываем окно входящего звонка если оно открыто
                if (incomingCall.isActive) {
                    hideIncomingCallModal();
                }
                
                updateUI();
            }
        }
        
        // Отправка сигнала через WebSocket для звонков
        function sendSignal(type, data) {
            sendCallsWebSocketMessage(type, data);
        }
        
        // ===== СИСТЕМА СООБЩЕНИЙ =====
        
        // Переменные для чата
        let currentChatFriend = null;
        let chatMessages = {}; // Хранилище сообщений по друзьям
        let unreadMessages = {}; // Счетчик непрочитанных сообщений
        let chatNotificationSound = null; // Звук уведомления
        
        // ===== P2P СИСТЕМА =====
        
        // P2P соединения (один на друга)
        let p2pConnections = {}; // {friendUsername: {connection, dataChannel, status}}
        let messageQueues = {}; // {friendUsername: [messages]} - очереди недоставленных сообщений
        let pingIntervals = {}; // {friendUsername: intervalId} - интервалы ping-понг
        let connectionTimeouts = {}; // {friendUsername: timeoutId} - таймауты соединений
        
        // Конфигурация P2P
        const P2P_CONFIG = {
            pingInterval: 30000, // 30 секунд
            pingTimeout: 10000,  // 10 секунд ожидания pong
            maxRetries: 5,       // 5 попыток доставки
            retryTimeout: 300000, // 5 минут общий таймаут
            inactiveTimeout: 300000 // 5 минут неактивности
        };
        
        // Открытие чата с другом
        async function openChat(friendUsername) {
            // Показываем встроенный чат в правой части
            document.getElementById('chatFriendName').textContent = friendUsername;
            document.getElementById('chatContainer').style.display = 'block';
            
            // Загружаем имя из записной книжки
            if (typeof loadChatFriendName === 'function') {
                await loadChatFriendName(friendUsername);
            }
            
            // Загружаем аватар друга в заголовок чата
            loadChatFriendAvatar(friendUsername);
            
            // Загружаем статус друга в заголовок чата (неблокирующе)
            setTimeout(() => {
                loadChatFriendStatus(friendUsername);
            }, 100);
            
            // Сохраняем текущий чат в localStorage
            localStorage.setItem('currentChatFriend', friendUsername);
            console.log(`💾 Сохранен текущий чат: ${friendUsername}`);
            
            // Сбрасываем счетчик непрочитанных СРАЗУ при открытии чата
            unreadMessages[friendUsername] = 0;
            updateUnreadIndicator(friendUsername);
            updateFriendsList();
            
            console.log(`🔴 Сброшен счетчик для ${friendUsername}:`, unreadMessages[friendUsername]);
            
            // Инициализируем чат
            initializeChat(friendUsername);
        }
        
        // Инициализация встроенного чата
        // Счетчик попыток подключения к Chat WebSocket
        let chatConnectionAttempts = 0;
        const maxChatConnectionAttempts = 3;
        
        function initializeChat(friendUsername) {
            currentChatFriend = friendUsername;
            
            // Сбрасываем счетчик непрочитанных сообщений
            unreadMessages[friendUsername] = 0;
            updateUnreadIndicator(friendUsername);
            updateFriendsList();
            
            console.log(`🔴 Сброшен счетчик в initializeChat для ${friendUsername}:`, unreadMessages[friendUsername]);
            
            // Очищаем сообщения
            document.getElementById('chatMessages').innerHTML = '';
            
            // Загружаем историю сообщений СРАЗУ, без ожидания подключения
            loadChatHistory(friendUsername);
            
            // Проверяем, есть ли команды удаления в очереди для этого пользователя
            if (messageQueues[friendUsername] && messageQueues[friendUsername].length > 0) {
                const deleteCommands = messageQueues[friendUsername].filter(cmd => cmd.type === 'delete_message');
                if (deleteCommands.length > 0) {
                    console.log(`🗑️ Найдено ${deleteCommands.length} команд удаления в очереди для ${friendUsername}`);
                }
            }
            
            // Отладка localStorage
            debugLocalStorage();
            
            // Проверяем, что Chat WebSocket подключен для P2P
            if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
                console.log('✅ Chat WebSocket готов для P2P');
                
                // Проверяем, есть ли уже P2P соединение
                const hasP2PConnection = p2pConnections[friendUsername] && 
                                      p2pConnections[friendUsername].dataChannel && 
                                      p2pConnections[friendUsername].dataChannel.readyState === 'open' &&
                                      p2pConnections[friendUsername].status === 'connected';
                
                if (hasP2PConnection) {
                    console.log(`✅ P2P соединение с ${friendUsername} уже установлено`);
                } else {
                    console.log(`📡 P2P соединения с ${friendUsername} нет, отправляем ping`);
                    sendP2PSignal('ping', { to: friendUsername });
                }
            } else {
                console.log('❌ Chat WebSocket не готов для P2P, подключаемся...');
                connectChatWebSocket();
                
                // Ждем подключения и повторяем P2P логику
                setTimeout(() => {
                    if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
                        sendP2PSignal('ping', { to: friendUsername });
                    }
                }, 2000);
            }
        }
        
        // ===== P2P ФУНКЦИИ =====
        
        // Установка P2P соединения с другом
        // Защита от множественных вызовов establishP2PConnection
        const establishingConnections = new Set();
        
        async function establishP2PConnection(friendUsername) {
            console.log(`🔧 establishP2PConnection вызвана для ${friendUsername}`);
            console.log(`🔍 Состояние перед установкой:`, {
                isEstablishing: establishingConnections.has(friendUsername),
                hasConnection: !!p2pConnections[friendUsername],
                connectionStatus: p2pConnections[friendUsername]?.status,
                establishingConnections: Array.from(establishingConnections)
            });
            
            // Проверяем, не устанавливается ли уже соединение
            if (establishingConnections.has(friendUsername)) {
                console.log(`⚠️ P2P соединение с ${friendUsername} уже устанавливается, пропускаем`);
                return;
            }
            
            // Проверяем, есть ли уже соединение
            if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
                console.log(`P2P соединение с ${friendUsername} уже активно`);
                return;
            }
            
            // Добавляем в список устанавливаемых соединений
            establishingConnections.add(friendUsername);
            
            try {
                
                updateChatStatus('Установка P2P соединения...', '');
                
                // Создаем RTCPeerConnection
                const connection = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 5 // Ограничиваем пул ICE кандидатов
                });
                
                // Создаем Data Channel
                const dataChannel = connection.createDataChannel('chat', {
                    ordered: true
                });
                
                // Настройка обработчиков Data Channel
                setupDataChannelHandlers(dataChannel, friendUsername);
                
                // Настройка обработчиков соединения
                setupP2PHandlers(connection, dataChannel, friendUsername);
                
                // Сохраняем соединение
                p2pConnections[friendUsername] = {
                    connection: connection,
                    dataChannel: dataChannel,
                    status: 'connecting',
                    lastActivity: Date.now(),
                    connectionTimeout: null
                };
                
                // Устанавливаем таймаут для соединения (30 секунд)
                p2pConnections[friendUsername].connectionTimeout = setTimeout(() => {
                    if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connecting') {
                        console.log(`⏰ Таймаут P2P соединения с ${friendUsername}`);
                        updateChatStatus('Таймаут P2P соединения', 'error');
                        closeP2PConnection(friendUsername);
                    }
                }, 30000);
                
                // Создаем offer
                console.log(`📤 Создаем offer для ${friendUsername}`);
                const offerStartTime = Date.now();
                const offer = await connection.createOffer();
                await connection.setLocalDescription(offer);
                console.log(`⏱️ Offer создан за ${Date.now() - offerStartTime}ms`);
                console.log(`✅ Offer создан и установлен для ${friendUsername}`);
                
                // Отправляем offer через сервер координации
                sendP2PSignal('offer', {
                    to: friendUsername,
                    offer: offer
                });
                console.log(`📤 Offer отправлен к ${friendUsername}`);
                
                // Если Chat WebSocket недоступен, пробуем прямую установку через STUN
                if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
                    console.log('⚠️ Chat WebSocket недоступен, используем только STUN серверы');
                    updateChatStatus('P2P через STUN серверы...', '');
                    
                    // Пытаемся переподключиться к Chat WebSocket
                    setTimeout(() => {
                        if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
                            console.log('🔄 Пытаемся переподключиться к Chat WebSocket...');
                            connectChatWebSocket();
                        }
                    }, 2000);
                }
                
                // Убираем из списка устанавливаемых соединений после успешной отправки offer
                establishingConnections.delete(friendUsername);
                
            } catch (error) {
                console.error('Ошибка установки P2P соединения:', error);
                updateChatStatus('Ошибка P2P соединения', 'error');
            } finally {
                // Убираем из списка устанавливаемых соединений
                establishingConnections.delete(friendUsername);
            }
        }
        
        // Настройка обработчиков P2P соединения
        function setupP2PHandlers(connection, dataChannel, friendUsername) {
            // Обработчик входящих соединений
            connection.ondatachannel = (event) => {
                const incomingChannel = event.channel;
                setupDataChannelHandlers(incomingChannel, friendUsername);
            };
            
            // Обработчик ICE кандидатов
            connection.onicecandidate = (event) => {
                if (event.candidate) {
                    sendP2PSignal('ice-candidate', {
                        to: friendUsername,
                        candidate: event.candidate
                    });
                }
            };
            
            // Обработчик изменения состояния соединения
            connection.onconnectionstatechange = () => {
                const state = connection.connectionState;
                console.log(`P2P соединение с ${friendUsername}: ${state}`);
                
                if (state === 'connected') {
                    if (p2pConnections[friendUsername]) {
                        p2pConnections[friendUsername].status = 'connected';
                    }
                    updateChatStatus('P2P соединение установлено', 'connected');
                    
                    // Начинаем ping-понг мониторинг
                    startPingPongMonitoring(friendUsername);
                    
                    // Отправляем сообщения из очереди
                    sendQueuedMessages(friendUsername);
                } else if (state === 'disconnected' || state === 'failed') {
                    if (p2pConnections[friendUsername]) {
                        p2pConnections[friendUsername].status = 'disconnected';
                    }
                    updateChatStatus('P2P соединение потеряно', 'error');
                    
                    // Останавливаем ping-понг
                    stopPingPongMonitoring(friendUsername);
                }
            };
            
            // Настройка Data Channel
            setupDataChannelHandlers(dataChannel, friendUsername);
        }
        
        // Настройка обработчиков Data Channel
        function setupDataChannelHandlers(dataChannel, friendUsername) {
            if (!dataChannel) {
                console.log(`⚠️ Data Channel для ${friendUsername} не создан, пропускаем настройку обработчиков`);
                return;
            }
            
            dataChannel.onopen = () => {
                console.log(`Data Channel с ${friendUsername} открыт`);
                if (p2pConnections[friendUsername]) {
                    p2pConnections[friendUsername].status = 'connected';
                    p2pConnections[friendUsername].dataChannel = dataChannel; // Сохраняем Data Channel
                    p2pConnections[friendUsername].lastActivity = Date.now(); // Обновляем активность
                }
                updateChatStatus('P2P соединение установлено', 'connected');
                
                // Отправляем сообщения из очереди
                sendQueuedMessages(friendUsername);
                
                // Запускаем ping-понг мониторинг
                startPingPongMonitoring(friendUsername);
            };
            
            dataChannel.onclose = () => {
                console.log(`Data Channel с ${friendUsername} закрыт`);
                if (p2pConnections[friendUsername]) {
                    p2pConnections[friendUsername].status = 'disconnected';
                }
            };
            
            dataChannel.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleP2PMessage(message, friendUsername);
                } catch (error) {
                    console.error('Ошибка обработки P2P сообщения:', error);
                }
            };
        }
        
        // Отправка P2P сигнала через chat сервер
        function sendP2PSignal(type, data) {
            if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
                const signalData = {
                    type: `p2p_${type}`,
                    from: currentUser.id,
                    to: data.to,
                    data: data
                };
                console.log(`📤 Отправляем P2P сигнал:`, signalData);
                window.chatWs.send(JSON.stringify(signalData));
                console.log(`📤 P2P сигнал отправлен: ${type} к ${data.to}`);
            } else {
                console.log(`⚠️ Chat WebSocket недоступен для P2P сигнала ${type}, пропускаем`);
                console.log(`⚠️ Состояние Chat WebSocket:`, window.chatWs ? window.chatWs.readyState : 'не определено');
            }
        }
        
        // Функция для проверки, с каким пользователем открыт чат
        function getCurrentChatUserId() {
            // Проверяем, что чат действительно открыт физически
            const chatContainer = document.getElementById('chatContainer');
            if (!chatContainer || chatContainer.style.display === 'none' || !currentChatFriend) {
                return 0;
            }
            
            // Получаем ID пользователя по username
            const friend = friendsData.friends.find(f => f.username === currentChatFriend);
            return friend ? friend.contact_user_id : 0;
        }
        
        // Обработка входящих P2P сигналов
        function handleP2PSignal(signal) {
            const { type, from, data } = signal;
            
            console.log(`📨 Получен P2P сигнал: ${type} от ${from}`);
            
            switch (type) {
                case 'p2p_offer':
                    handleP2POffer(from, data.offer);
                    break;
                case 'p2p_answer':
                    handleP2PAnswer(from, data.answer);
                    break;
                case 'p2p_ice-candidate':
                    handleP2PICECandidate(from, data.candidate);
                    break;
                case 'p2p_ping':
                    handleP2PPing(from);
                    break;
                case 'p2p_pong':
                    handleP2PPong(from);
                    break;
                case 'p2p_error':
                    console.log(`❌ P2P ошибка: ${data ? data.error : 'Неизвестная ошибка'}`);
                    console.log(`❌ P2P детали ошибки:`, data);
                    updateChatStatus('P2P ошибка: ' + (data ? data.error : 'Неизвестная ошибка'), 'error');
                    
                    // Если получатель недоступен - сообщение уже в очереди
                    if (data && data.error === 'Получатель недоступен') {
                        console.log('📬 Получатель недоступен, сообщение в очереди для доставки');
                        // Сообщение уже добавлено в очередь в sendChatMessage
                        // НЕ показываем уведомление - получатель недоступен
                    }
                    break;
                default:
                    console.log(`❓ Неизвестный P2P сигнал: ${type}`);
            }
        }
        
        // Обработка P2P offer
        async function handleP2POffer(from, offer) {
            try {
                console.log(`📥 Получен P2P offer от ${from}`);
                
                if (!p2pConnections[from]) {
                    // Создаем новое соединение для входящего
                    const connection = new RTCPeerConnection({
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' }
                        ]
                    });
                    
                    // Создаем Data Channel для ответа
                    const dataChannel = connection.createDataChannel('chat', {
                        ordered: true
                    });
                    
                    p2pConnections[from] = {
                        connection: connection,
                        dataChannel: dataChannel,
                        status: 'connecting',
                        lastActivity: Date.now()
                    };
                    
                    setupP2PHandlers(connection, dataChannel, from);
                }
                
                await p2pConnections[from].connection.setRemoteDescription(offer);
                const answer = await p2pConnections[from].connection.createAnswer();
                await p2pConnections[from].connection.setLocalDescription(answer);
                
                // Добавляем отложенные ICE кандидаты
                if (p2pConnections[from].pendingCandidates) {
                    for (const candidate of p2pConnections[from].pendingCandidates) {
                        try {
                            await p2pConnections[from].connection.addIceCandidate(candidate);
                        } catch (error) {
                            console.error('Ошибка добавления отложенного ICE кандидата:', error);
                        }
                    }
                    p2pConnections[from].pendingCandidates = [];
                }
                
                console.log(`📤 Отправляем P2P answer к ${from}`);
                sendP2PSignal('answer', {
                    to: from,
                    answer: answer
                });
                
            } catch (error) {
                console.error('Ошибка обработки P2P offer:', error);
            }
        }
        
        // Обработка P2P answer
        async function handleP2PAnswer(from, answer) {
            try {
                console.log(`📥 Получен P2P answer от ${from}`);
                
                if (p2pConnections[from]) {
                    await p2pConnections[from].connection.setRemoteDescription(answer);
                    console.log(`✅ P2P соединение с ${from} установлено`);
                }
            } catch (error) {
                console.error('Ошибка обработки P2P answer:', error);
            }
        }
        
        // Обработка P2P ICE кандидата
        async function handleP2PICECandidate(from, candidate) {
            try {
                if (p2pConnections[from] && p2pConnections[from].connection) {
                    // Ограничиваем количество ICE кандидатов
                    const MAX_ICE_CANDIDATES = 10;
                    if (!p2pConnections[from].iceCandidateCount) {
                        p2pConnections[from].iceCandidateCount = 0;
                    }
                    
                    if (p2pConnections[from].iceCandidateCount >= MAX_ICE_CANDIDATES) {
                        console.log(`⚠️ Превышен лимит ICE кандидатов для ${from} (${MAX_ICE_CANDIDATES}), игнорируем`);
                        return;
                    }
                    
                    // Проверяем, что remote description установлен
                    if (p2pConnections[from].connection.remoteDescription) {
                        await p2pConnections[from].connection.addIceCandidate(candidate);
                        p2pConnections[from].iceCandidateCount++;
                        console.log(`✅ ICE кандидат добавлен для ${from} (${p2pConnections[from].iceCandidateCount}/${MAX_ICE_CANDIDATES})`);
                    } else {
                        console.log(`⏳ ICE кандидат отложен для ${from} (ждем remote description)`);
                        // Сохраняем кандидата для добавления позже
                        if (!p2pConnections[from].pendingCandidates) {
                            p2pConnections[from].pendingCandidates = [];
                        }
                        p2pConnections[from].pendingCandidates.push(candidate);
                    }
                }
            } catch (error) {
                console.error('Ошибка обработки P2P ICE кандидата:', error);
            }
        }
        
        // Обработка P2P ping
        function handleP2PPing(from) {
            console.log(`📨 Получен ping от ${from}, отправляем pong через WebSocket`);
            
            // Отправляем pong через WebSocket сервер
            if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
                const pongMessage = {
                    type: 'p2p_pong',
                    from: currentUser.id,
                    to: from,
                    data: {
                        timestamp: Date.now()
                    }
                };
                
                window.chatWs.send(JSON.stringify(pongMessage));
                console.log(`✅ Pong отправлен через WebSocket к ${from}`);
            } else {
                console.log(`❌ Chat WebSocket недоступен для отправки pong`);
            }
        }
        
        // Обработка P2P pong
        function handleP2PPong(from) {
            console.log(`✅ Получен pong от ${from} - пользователь онлайн`);
            
            // Обновляем статус соединения
            if (p2pConnections[from]) {
                p2pConnections[from].lastPong = Date.now();
            }
            
            // Устанавливаем P2P соединение
            console.log(`🔧 Устанавливаем P2P соединение с ${from} после получения pong`);
            console.log(`🔍 Проверка состояния перед установкой P2P:`, {
                hasConnection: !!p2pConnections[from],
                connectionStatus: p2pConnections[from]?.status,
                isEstablishing: establishingConnections.has(from)
            });
            establishP2PConnection(from);
        }
        
        // Обработка P2P сообщений
        function handleP2PMessage(message, friendUsername) {
            // Проверяем, что это не наше собственное сообщение
            if (message.data && message.data.from === currentUser.id) {
                console.log(`⚠️ Получено собственное сообщение от ${friendUsername}, игнорируем`);
                return;
            }
            
            // Проверяем, что сообщение предназначено нам
            if (message.to && message.to !== currentUser.id) {
                console.log(`⚠️ Сообщение предназначено другому пользователю (${message.to}), игнорируем`);
                return;
            }
            
            switch (message.type) {
                case 'chat_message':
                    // Сохраняем входящее сообщение в IndexedDB
                    saveIncomingMessage(friendUsername, message.data.message, friendUsername, message.data.timestamp, message.data.type);
                    
                    // Добавляем в чат, если он открыт
                    if (currentChatFriend === friendUsername) {
                        addChatMessage(message.data.message, friendUsername, message.data.timestamp, message.data.type);
                    } else {
                        // Чат не открыт - показываем уведомление
                        showChatNotification(friendUsername, message.data.message);
                    }
                    
                    // Отправляем подтверждение получения
                    sendP2PMessage(friendUsername, {
                        type: 'message_received',
                        to: friendUsername,
                        timestamp: Date.now(),
                        originalTimestamp: message.data.timestamp
                    });
                    break;
                case 'message_received':
                    // Обновляем статус сообщения на "доставлено" только если это подтверждение от правильного получателя
                    if (message.data && message.data.originalTimestamp) {
                        console.log(`📨 Получено подтверждение доставки:`, {
                            from: message.from,
                            friendUsername,
                            originalTimestamp: message.data.originalTimestamp,
                            currentChatFriend,
                            isCorrectSender: message.from === friendUsername,
                            isActiveChat: currentChatFriend === friendUsername
                        });
                        
                        // Дополнительная проверка: убеждаемся, что это подтверждение от того, кому мы отправляли
                        if (message.from === friendUsername) {
                            console.log(`✅ Получено подтверждение доставки от ${friendUsername}`);
                        } else {
                            console.log(`⚠️ Подтверждение от неправильного отправителя: ожидали ${friendUsername}, получили ${message.from}`);
                        }
                    }
                    break;
                case 'ping':
                    // Автоматически отвечаем pong
                    sendP2PMessage(friendUsername, {
                        type: 'pong',
                        to: friendUsername,
                        timestamp: Date.now()
                    });
                    break;
                case 'pong':
                    console.log(`Получен pong от ${friendUsername}`);
                    if (p2pConnections[friendUsername]) {
                        p2pConnections[friendUsername].lastPong = Date.now();
                    }
                    break;
                case 'delete_message':
                    console.log(`🗑️ Получена команда удаления сообщения от ${friendUsername}:`, message.data);
                    if (message.data && message.data.timestamp) {
                        // Используем новую систему удаления
                        window.deleteSystem.handleDeleteCommand(message.data.timestamp, friendUsername);
                    }
                    break;
            }
        }
        
        // Отправка P2P сообщения
        function sendP2PMessage(friendUsername, message) {
            if (p2pConnections[friendUsername] && 
                p2pConnections[friendUsername].dataChannel && 
                p2pConnections[friendUsername].dataChannel.readyState === 'open') {
                
                try {
                    p2pConnections[friendUsername].dataChannel.send(JSON.stringify(message));
                    // Обновляем время последней активности
                    p2pConnections[friendUsername].lastActivity = Date.now();
                    console.log(`📤 P2P сообщение отправлено к ${friendUsername}:`, message.type);
                    return true;
                } catch (error) {
                    console.error('❌ Ошибка отправки P2P сообщения:', error);
                    return false;
                }
            }
            console.log(`❌ P2P соединение с ${friendUsername} недоступно`);
            return false;
        }
        
        // Подключение к чат-серверу
        function connectChatWebSocket() {
            if (!currentUser.id) return;
            
            // Если уже подключены, не создаем новое соединение
            if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
                console.log('✅ Chat WebSocket уже подключен');
                return;
            }
            
            // Если соединение в процессе подключения, ждем
            if (window.chatWs && window.chatWs.readyState === WebSocket.CONNECTING) {
                console.log('⏳ Chat WebSocket уже подключается...');
                return;
            }
            
            try {
                console.log(`🔌 Пытаемся подключиться к ${CHAT_WEBSOCKET_URL}`);
                const chatWs = new WebSocket(CHAT_WEBSOCKET_URL);
                
                chatWs.onopen = () => {
                    console.log(`✅ Chat WebSocket подключен для пользователя ${currentUser.id}`);
                    window.chatWs = chatWs; // Сохраняем ссылку на WebSocket
                    updateChatStatus('Подключено к чат-серверу', 'connected');
                    
                    // Аутентификация
                    chatWs.send(JSON.stringify({
                        type: 'auth',
                        data: { userId: currentUser.id }
                    }));
                    console.log(`🔐 Отправлена аутентификация для пользователя ${currentUser.id}`);
                };
                
                chatWs.onerror = (error) => {
                    console.error('❌ Ошибка Chat WebSocket:', error);
                    updateChatStatus('Ошибка подключения к чат-серверу', 'error');
                    // Останавливаем все звуки при ошибке чат WebSocket
                    stopIncomingCallSound();
                    stopOutgoingCallSound();
                };
                
                chatWs.onclose = (event) => {
                    console.log('❌ Chat WebSocket закрыт:', event.code, event.reason);
                    updateChatStatus('Соединение с чат-сервером закрыто', 'disconnected');
                    
                    // Автоматическое переподключение через 3 секунды
                    if (currentUser.id) {
                        setTimeout(() => {
                            if (currentUser.id && (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN)) {
                                console.log('🔄 Переподключение к Chat WebSocket...');
                                connectChatWebSocket();
                            }
                        }, 3000);
                    }
                };
                
                chatWs.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log(`📨 Получено сообщение от Chat WebSocket для ${currentUser.id}:`, message.type);
                        console.log(`📨 Полное сообщение:`, message);
                        
                        // Обрабатываем ошибки
                        if (message.type === 'error') {
                            console.log(`❌ Ошибка Chat WebSocket: ${message.message || 'Неизвестная ошибка'}`);
                            console.log(`❌ Детали ошибки:`, message);
                            updateChatStatus(`Ошибка: ${message.message || 'Неизвестная ошибка'}`, 'error');
                            return;
                        }
                        
                        // Проверяем, является ли сообщение P2P сигналом
                        if (message.type && message.type.startsWith('p2p_')) {
                            handleP2PSignal(message);
                        } else if (message.type === 'auth_success') {
                            console.log(`✅ Аутентификация успешна для пользователя ${currentUser.id}`);
                        } else {
                            handleChatMessage(message);
                        }
                    } catch (error) {
                        console.error('Ошибка парсинга сообщения чата:', error);
                    }
                };
                
                
                // Сохраняем соединение
                window.chatWs = chatWs;
                
            } catch (error) {
                console.error('❌ Ошибка создания Chat WebSocket:', error);
                updateChatStatus('Ошибка создания WebSocket соединения', 'error');
            }
        }
        
        // Обработка сообщений чата
        function handleChatMessage(message) {
            switch (message.type) {
                case 'auth_success':
                    updateChatStatus('Чат готов к использованию', 'connected');
                    break;
                case 'chat_message':
                    // Обрабатываем входящие сообщения
                    if (message.from !== currentUser.id) {
                        // Это сообщение от другого пользователя
                        const senderUsername = message.from;
                        
                        // Сохраняем сообщение в историю (всегда)
                        saveIncomingMessage(senderUsername, message.data.message, message.from, message.data.timestamp, message.data.type);
                        
                        // Добавляем в чат, если он открыт с этим пользователем
                        if (currentChatFriend === senderUsername) {
                            addChatMessage(message.data.message, message.from, message.data.timestamp, message.data.type);
                        } else {
                            // Чат не открыт - показываем уведомление
                            showChatNotification(senderUsername, message.data.message);
                        }
                    }
                    break;
                case 'error':
                    updateChatStatus('Ошибка чат-сервера: ' + message.message, 'error');
                    break;
            }
        }
        
        // Добавление сообщения в чат
        function addChatMessage(message, from, timestamp, type, isFromHistory = false, status = null) {
            console.log('🔍 addChatMessage вызвана:', {
                message: message,
                from: from,
                timestamp: timestamp,
                type: type,
                isFromHistory: isFromHistory,
                currentUser: currentUser
            });
            
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) {
                console.error('❌ Элемент chatMessages не найден!');
                return;
            }
            
            const messageDiv = document.createElement('div');
            
            const isOwn = from === currentUser.id;
            const messageId = `${from}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            messageDiv.setAttribute('data-timestamp', timestamp);
            messageDiv.setAttribute('data-message-id', messageId);
            messageDiv.className = 'message-item';
            messageDiv.style.cssText = `
                margin: 10px 0;
                padding: 10px 15px;
                border-radius: 15px;
                max-width: 70%;
                word-wrap: break-word;
                background: ${isOwn ? 'rgb(255, 169, 90)' : '#F6F6F6'};
                color: ${isOwn ? '#101010' : '#1A1A1A'};
                margin-left: ${isOwn ? 'auto' : '0'};
                text-align: ${isOwn ? 'right' : 'left'};
            `;
            
            // Добавляем обработчик клика для выделения
            messageDiv.onclick = () => toggleMessageSelection(timestamp.toString());
            
            if (type === 'emoji') {
                // Проверяем, содержит ли сообщение только эмодзи или смешанный контент
                const isOnlyEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]+$/u.test(message);
                
                if (isOnlyEmoji) {
                    // Только эмодзи - больший размер
                    const statusHTML = isOwn ? getMessageStatusHTML(status, timestamp) : '';
                    messageDiv.innerHTML = `
                        <div style="font-size: 24px;">${message}</div>
                        <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(timestamp).toLocaleTimeString()}</div>
                        ${statusHTML}
                    `;
                } else {
                    // Смешанный контент - обычный размер
                    const statusHTML = isOwn ? getMessageStatusHTML(status, timestamp) : '';
                    messageDiv.innerHTML = `
                        <div style="font-size: 16px;">${message}</div>
                        <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(timestamp).toLocaleTimeString()}</div>
                        ${statusHTML}
                    `;
                }
            } else {
                const statusHTML = isOwn ? getMessageStatusHTML(status, timestamp) : '';
                messageDiv.innerHTML = `
                    <div>${message}</div>
                    <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(timestamp).toLocaleTimeString()}</div>
                    ${statusHTML}
                `;
            }
            
            chatMessages.appendChild(messageDiv);
            
            // Оптимизируем скролл - только для новых сообщений, не для истории
            if (!isFromHistory) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            
            // Если чат открыт с этим пользователем - сбрасываем счетчик непрочитанных
            if (currentChatFriend === from) {
                unreadMessages[from] = 0;
                updateUnreadIndicator(from);
                updateFriendsList();
                console.log(`🔴 Сброшен счетчик в addChatMessage для ${from}:`, unreadMessages[from]);
            }
        }
        
        // Получение HTML для статуса сообщения
        function getMessageStatusHTML(status, timestamp) {
            if (!status) return '';
            
            switch (status) {
                case 'not_sent':
                    return `<div class="message-status" style="font-size: 12px; opacity: 0.8; margin-top: 3px; color: white;"><i class="fas fa-clock"></i> Отправляется</div>`;
                case 'sent':
                    return `<div class="message-status" style="font-size: 12px; opacity: 0.8; margin-top: 3px; color: #4caf50;"><i class="fas fa-check-circle"></i> Отправлено</div>`;
                case 'cancelled':
                    return `<div class="message-status" style="font-size: 12px; opacity: 0.8; margin-top: 3px; color: #f44336;"><i class="fas fa-times"></i> Отменено</div>`;
                default:
                    return '';
            }
        }
        
        // Обновление статуса сообщения в UI
        function updateMessageStatusInUI(timestamp, status) {
            const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
            if (messageElement) {
                const statusElement = messageElement.querySelector('.message-status');
                if (statusElement) {
                    statusElement.outerHTML = getMessageStatusHTML(status, timestamp);
                }
            }
        }
        
        // Обновление статуса сообщения в IndexedDB
        async function updateMessageStatusInDB(friendUsername, timestamp, status) {
            try {
                if (!currentUser || !currentUser.id) {
                    console.error('❌ currentUser не определен для обновления статуса в IndexedDB');
                    return;
                }
                
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${friendUsername}`;
                
                // Получаем все сообщения из чата
                const messages = await db.getRecentMessages(chatId, 1000);
                
                // Ищем сообщение с нужным timestamp
                const messageIndex = messages.findIndex(msg => msg.timestamp === timestamp);
                
                if (messageIndex !== -1) {
                    // Обновляем статус сообщения
                    messages[messageIndex].status = status;
                    
                    // Сохраняем обновленное сообщение обратно в IndexedDB
                    await db.saveMessage(chatId, messages[messageIndex]);
                    console.log(`✅ Статус сообщения обновлен в IndexedDB: ${status}`);
                } else {
                    console.log(`⚠️ Сообщение с timestamp ${timestamp} не найдено в IndexedDB для обновления статуса`);
                }
                
            } catch (error) {
                console.error('❌ Ошибка обновления статуса сообщения в IndexedDB:', error);
            }
        }
        
        
        // ===== СИСТЕМА УДАЛЕНИЯ СООБЩЕНИЙ =====
        
        // Инициализация системы удаления
        function initDeleteSystem() {
            // Инициализация меню выделенных сообщений
            updateSelectionMenu();
        }
        
        // Выделение/снятие выделения сообщения
        function toggleMessageSelection(timestamp) {
            const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
            if (!messageElement) return;
            
            if (selectedMessages.has(timestamp)) {
                // Снимаем выделение
                selectedMessages.delete(timestamp);
                messageElement.classList.remove('selected');
            } else {
                // Добавляем выделение
                selectedMessages.add(timestamp);
                messageElement.classList.add('selected');
            }
            
            updateSelectionMenu();
        }
        
        // Обновление меню выделенных сообщений
        function updateSelectionMenu() {
            const inputPanel = document.getElementById('chatInputPanel');
            const menu = document.getElementById('selectedMessagesMenu');
            const count = document.getElementById('selectedCount');
            
            if (!menu || !count || !inputPanel) return;
            
            if (selectedMessages.size > 0) {
                // Показываем меню, скрываем панель ввода
                inputPanel.classList.add('hidden');
                menu.style.display = 'flex';
                count.textContent = selectedMessages.size;
            } else {
                // Показываем панель ввода, скрываем меню
                inputPanel.classList.remove('hidden');
                menu.style.display = 'none';
            }
        }
        
        // Очистка выделения
        function clearSelection() {
            // Убираем визуальное выделение со всех сообщений
            document.querySelectorAll('.message.selected').forEach(element => {
                element.classList.remove('selected');
            });
            
            // Очищаем Set
            selectedMessages.clear();
            
            // Обновляем меню
            updateSelectionMenu();
        }
        
        // Переключение меню выделенных сообщений
        function toggleSelectionMenu() {
            const menu = document.getElementById('selectionMenu');
            if (!menu) return;
            
            menu.classList.toggle('show');
        }
        
        // Копирование выделенных сообщений
        function copySelectedMessages() {
            if (selectedMessages.size === 0) return;
            
            const messages = [];
            selectedMessages.forEach(timestamp => {
                const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
                if (messageElement) {
                    // Берем только текст сообщения (первый div), без времени и статуса
                    const messageText = messageElement.querySelector('div:first-child')?.textContent || '';
                    if (messageText.trim()) {
                        messages.push(messageText.trim());
                    }
                }
            });
            
            const textToCopy = messages.join('\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log('📋 Сообщения скопированы в буфер обмена');
                
                // Снимаем выделение со всех сообщений
                selectedMessages.forEach(timestamp => {
                    const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
                    if (messageElement) {
                        messageElement.classList.remove('selected');
                    }
                });
                
                // Очищаем выделенные сообщения
                selectedMessages.clear();
                
                // Обновляем меню (оно исчезнет)
                updateSelectionMenu();
                
                // Закрываем меню
                const menu = document.getElementById('selectionMenu');
                if (menu) menu.classList.remove('show');
            }).catch(err => {
                console.error('Ошибка копирования:', err);
            });
        }
        
        // Повторная отправка выделенных сообщений
        function resendSelectedMessages() {
            if (selectedMessages.size === 0) return;
            
            const messages = [];
            selectedMessages.forEach(timestamp => {
                const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
                if (messageElement) {
                    // Берем только текст сообщения (первый div), без времени и статуса
                    const messageText = messageElement.querySelector('div:first-child')?.textContent || '';
                    if (messageText.trim()) {
                        messages.push(messageText.trim());
                    }
                }
            });
            
            if (messages.length === 0) {
                console.log('❌ Нет сообщений для повторной отправки');
                return;
            }
            
            // Отправляем каждое сообщение
            messages.forEach((messageText, index) => {
                setTimeout(() => {
                    // Вставляем текст в поле ввода
                    const messageInput = document.getElementById('chatMessageInput');
                    if (messageInput) {
                        messageInput.value = messageText;
                        // Отправляем сообщение
                        sendChatMessage();
                    }
                }, index * 500); // Задержка между отправками 500мс
            });
            
            console.log(`📤 Повторная отправка ${messages.length} сообщений`);
            
            // Снимаем выделение со всех сообщений
            selectedMessages.forEach(timestamp => {
                const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
                if (messageElement) {
                    messageElement.classList.remove('selected');
                }
            });
            
            // Очищаем выделенные сообщения
            selectedMessages.clear();
            
            // Обновляем меню (оно исчезнет)
            updateSelectionMenu();
            
            // Закрываем меню
            const menu = document.getElementById('selectionMenu');
            if (menu) menu.classList.remove('show');
        }
        
        // Удаление выделенных сообщений
        async function deleteSelectedMessages() {
            if (selectedMessages.size === 0) return;
            
            // Закрываем меню
            const menu = document.getElementById('selectionMenu');
            if (menu) menu.classList.remove('show');
            
            // Показываем модальное окно с опциями удаления
            showDeleteOptionsModal();
        }
        
        // Показать модальное окно с опциями удаления
        function showDeleteOptionsModal() {
            const modal = document.createElement('div');
            modal.id = 'deleteMessagesModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
            `;
            
            const selectedCount = selectedMessages.size;
            const canDeleteFromRecipient = canDeleteMessagesFromRecipient();
            
            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px; width: 90%;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">Удалить ${selectedCount} сообщений</h3>
                    <p style="margin: 0 0 20px 0; color: #666;">Выберите вариант удаления:</p>
                    
                    <button onclick="deleteMessagesLocally()" 
                            style="width: 100%; padding: 12px; margin: 5px 0; background: #ff9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-trash"></i> Удалить только у меня (${selectedCount} сообщений)
                    </button>
                    
                    ${canDeleteFromRecipient ? `
                    <button onclick="deleteMessagesGlobally()" 
                            style="width: 100%; padding: 12px; margin: 5px 0; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-trash"></i> Удалить у меня и получателя (${selectedCount} сообщений)
                    </button>
                    ` : ''}
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px; display: flex; align-items: flex-start; gap: 8px;">
                        <i class="fas fa-exclamation-triangle" style="color: #f39c12; font-size: 14px; margin-top: 2px;"></i>
                        <div>
                            <strong>Внимание:</strong> ${canDeleteFromRecipient ? 
                            'Сообщения у получателя могут быть не удалены, если получатель не в сети или сообщения старше 1 часа' : 
                            'Некоторые сообщения старше 1 часа - их можно удалить только у себя'}
                        </div>
                    </div>
                    
                    <button onclick="closeDeleteModal()" 
                            style="width: 100%; padding: 12px; margin: 5px 0; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; justify-content: center;">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Закрыть модальное окно удаления
        function closeDeleteModal() {
            const modal = document.getElementById('deleteMessagesModal');
            if (modal) {
                modal.remove();
            }
        }
        
        // Проверить, можно ли удалить сообщения у получателя
        function canDeleteMessagesFromRecipient() {
            // Проверяем, есть ли среди выделенных сообщений входящие (не собственные)
            let hasIncomingMessages = false;
            
            for (const timestamp of selectedMessages) {
                const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
                if (messageElement) {
                    // Проверяем, является ли сообщение входящим (не собственным)
                    const isOwn = messageElement.style.marginLeft === 'auto';
                    if (!isOwn) {
                        hasIncomingMessages = true;
                    }
                }
            }
            
            // Если есть входящие сообщения - глобальное удаление недоступно
            if (hasIncomingMessages) {
                return false;
            }
            
            // Используем новую систему проверки для исходящих сообщений
            const outgoingMessages = Array.from(selectedMessages).map(timestamp => {
                return {
                    timestamp: parseInt(timestamp),
                    status: 'sent'
                };
            });
            
            return window.deleteSystem.canDeleteGlobally(outgoingMessages);
        }
        
        // Удалить сообщения только у отправителя
        async function deleteMessagesLocally() {
            console.log(`🗑️ deleteMessagesLocally вызвана для ${selectedMessages.size} сообщений`);
            console.log(`🔍 Выделенные сообщения:`, Array.from(selectedMessages));
            console.log(`🔍 Текущий чат: ${currentChatFriend}`);
            console.log(`🔍 window.deleteSystem доступен:`, typeof window.deleteSystem);
            console.log(`🔍 performLocalDeletion доступна:`, typeof window.deleteSystem?.performLocalDeletion);
            
            try {
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
                const messages = await db.getRecentMessages(chatId, 1000);
                
                console.log(`📚 Найдено ${messages.length} сообщений в IndexedDB`);
                
                // Находим сообщения для удаления
                const messagesToDelete = [];
                for (const message of messages) {
                    const isSelected = selectedMessages.has(message.timestamp.toString());
                    console.log(`🔍 Сообщение ${message.timestamp}: isSelected = ${isSelected}`);
                    if (isSelected) {
                        messagesToDelete.push(message);
                    }
                }
                
                console.log(`📊 Найдено ${messagesToDelete.length} сообщений для удаления:`, messagesToDelete);
                
                // Проверяем доступность функции из del.js
                if (typeof window.deleteSystem.performLocalDeletion === 'function') {
                    console.log(`✅ Функция performLocalDeletion доступна, вызываем...`);
                    await window.deleteSystem.performLocalDeletion(messagesToDelete, currentChatFriend);
                } else {
                    console.log(`❌ Функция performLocalDeletion недоступна!`);
                }
                
                // Очищаем выделение
                clearSelection();
                
            } catch (error) {
                console.error('❌ Ошибка локального удаления:', error);
            }
            
            closeDeleteModal();
        }
        
        // Удалить сообщения у отправителя и получателя
        async function deleteMessagesGlobally() {
            console.log(`🗑️ Глобальное удаление ${selectedMessages.size} сообщений`);
            
            try {
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
                const messages = await db.getRecentMessages(chatId, 1000);
                
                // Анализируем каждое сообщение
                const messagesToDelete = [];
                const messagesToCancel = [];
                
                for (const message of messages) {
                    if (selectedMessages.has(message.timestamp.toString())) {
                        if (message.status === 'sent') {
                            // Проверяем возраст сообщения
                            if (window.deleteSystem.isMessageTooOld(message.timestamp)) {
                                console.log(`⚠️ Сообщение ${message.timestamp} слишком старое для глобального удаления`);
                                window.deleteSystem.showDeleteWarning('Удаление у получателя невозможно - время истекло (более 1 часа)');
                                continue;
                            }
                            messagesToDelete.push(message);
                        } else if (message.status === 'not_sent' || message.status === 'cancelled') {
                            messagesToCancel.push(message);
                        }
                    }
                }
                
                // Обрабатываем отмену отправки
                if (messagesToCancel.length > 0) {
                    console.log(`🚫 Отменяем отправку ${messagesToCancel.length} неотправленных сообщений`);
                    messagesToCancel.forEach(message => {
                        updateMessageStatusInUI(message.timestamp, 'cancelled');
                        updateMessageStatusInDB(currentChatFriend, message.timestamp, 'cancelled');
                    });
                }
                
                // Обрабатываем глобальное удаление
                if (messagesToDelete.length > 0) {
                    // Проверяем возможность глобального удаления
                    if (!window.deleteSystem.checkMessageAgeAndShowWarning(messagesToDelete)) {
                        closeDeleteModal();
                        return;
                    }
                    
                    // Выполняем глобальное удаление
                    await window.deleteSystem.performGlobalDeletion(messagesToDelete, currentChatFriend);
                }
                
                // Очищаем выделение
                clearSelection();
                
            } catch (error) {
                console.error('❌ Ошибка глобального удаления:', error);
            }
            
            closeDeleteModal();
        }
        
        // Скрыть сообщение в UI
        function hideMessageInUI(timestamp) {
            const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }
        
        // Очистить выделение
        function clearSelection() {
            selectedMessages.forEach(timestamp => {
                const messageElement = document.querySelector(`[data-timestamp="${timestamp}"]`);
                if (messageElement) {
                    messageElement.classList.remove('selected');
                }
            });
            selectedMessages.clear();
            updateSelectionMenu();
        }
        
        // Удалить сообщение из IndexedDB
        async function deleteMessageFromDB(timestamp, friendUsername) {
            try {
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${friendUsername}`;
                
                console.log(`🗑️ Удаляем сообщение ${timestamp} из IndexedDB для ${friendUsername}`);
                
                // Получаем все сообщения
                const messages = await db.getRecentMessages(chatId, 1000);
                console.log(`📚 Найдено ${messages.length} сообщений в IndexedDB`);
                
                // Фильтруем сообщения, исключая удаляемое
                const filteredMessages = messages.filter(msg => msg.timestamp.toString() !== timestamp.toString());
                
                console.log(`📚 После фильтрации: ${filteredMessages.length} сообщений`);
                
                if (filteredMessages.length < messages.length) {
                    // Очищаем все сообщения и сохраняем отфильтрованные
                    await db.clearMessages(chatId);
                    
                    for (const message of filteredMessages) {
                        await db.saveMessage(chatId, message);
                    }
                    
                    console.log(`✅ Сообщение ${timestamp} удалено из IndexedDB`);
                } else {
                    console.log(`⚠️ Сообщение ${timestamp} не найдено в IndexedDB`);
                }
            } catch (error) {
                console.error('❌ Ошибка удаления сообщения из IndexedDB:', error);
            }
        }
        
        // Добавить команду удаления в очередь
        function addDeleteCommandToQueue(friendUsername, timestamp) {
            if (!deleteCommandQueue[friendUsername]) {
                deleteCommandQueue[friendUsername] = [];
            }
            
            const deleteCommand = {
                timestamp: timestamp,
                from: currentUser.id,
                addedAt: Date.now(),
                attempts: 0
            };
            
            deleteCommandQueue[friendUsername].push(deleteCommand);
            console.log(`📋 Команда удаления добавлена в очередь для ${friendUsername}: ${timestamp}`);
        }
        
        // Отправить команду удаления через WebSocket
        function sendDeleteCommandViaWebSocket(friendUsername, timestamp) {
            if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
                console.log(`⚠️ WebSocket недоступен для отправки команды удаления`);
                return false;
            }
            
            const deleteCommand = {
                type: 'delete_message',
                to: friendUsername,
                from: currentUser.id,
                data: {
                    timestamp: timestamp,
                    from: currentUser.id
                },
                timestamp: Date.now()
            };
            
            try {
                window.chatWs.send(JSON.stringify(deleteCommand));
                console.log(`📤 Команда удаления отправлена через WebSocket к ${friendUsername}: ${timestamp}`);
                return true;
            } catch (error) {
                console.error('❌ Ошибка отправки команды удаления через WebSocket:', error);
                return false;
            }
        }
        
        // Обработать очередь команд удаления
        function processDeleteCommandQueue(friendUsername) {
            if (!deleteCommandQueue[friendUsername] || deleteCommandQueue[friendUsername].length === 0) {
                return;
            }
            
            console.log(`🔄 Обрабатываем очередь команд удаления для ${friendUsername}: ${deleteCommandQueue[friendUsername].length} команд`);
            
            const commands = deleteCommandQueue[friendUsername];
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 минут максимальный возраст команды
            
            // Фильтруем команды по возрасту
            const validCommands = commands.filter(cmd => (now - cmd.addedAt) < maxAge);
            
            if (validCommands.length === 0) {
                console.log(`⏰ Все команды удаления для ${friendUsername} устарели, очищаем очередь`);
                deleteCommandQueue[friendUsername] = [];
                return;
            }
            
            // Отправляем команды через WebSocket
            validCommands.forEach(command => {
                command.attempts++;
                const success = sendDeleteCommandViaWebSocket(friendUsername, command.timestamp);
                
                if (success) {
                    console.log(`✅ Команда удаления ${command.timestamp} отправлена (попытка ${command.attempts})`);
                } else {
                    console.log(`❌ Не удалось отправить команду удаления ${command.timestamp} (попытка ${command.attempts})`);
                }
            });
            
            // Удаляем успешно отправленные команды
            deleteCommandQueue[friendUsername] = validCommands.filter(cmd => cmd.attempts < 3);
        }
        
        // Периодическая обработка очереди команд удаления
        function startDeleteCommandProcessor() {
            setInterval(() => {
                Object.keys(deleteCommandQueue).forEach(friendUsername => {
                    if (deleteCommandQueue[friendUsername].length > 0) {
                        processDeleteCommandQueue(friendUsername);
                    }
                });
            }, 10000); // Проверяем каждые 10 секунд
        }
        
        // Проверка онлайн статуса получателя
        async function checkRecipientOnlineStatus(friendUsername) {
            console.log(`🔍 Проверяем онлайн статус получателя ${friendUsername}`);
            
            // Проверяем наличие P2P соединения
            if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
                console.log(`✅ Получатель ${friendUsername} онлайн (P2P соединение активно)`);
                return true;
            }
            
            // Отправляем ping для проверки онлайн статуса
            try {
                console.log(`📤 Отправляем ping к ${friendUsername}`);
                sendP2PSignal('ping', { to: friendUsername });
                
                // Ждем pong в течение 10 секунд
                const maxWaitTime = 10000;
                const startTime = Date.now();
                
                return new Promise((resolve) => {
                    const checkPong = () => {
                        console.log(`🔍 Проверяем pong от ${friendUsername}, прошло времени: ${Date.now() - startTime}мс`);
                        
                        if (p2pConnections[friendUsername] && p2pConnections[friendUsername].lastPong) {
                            const pongTime = p2pConnections[friendUsername].lastPong;
                            const timeSincePong = Date.now() - pongTime;
                            console.log(`📨 Pong получен ${timeSincePong}мс назад`);
                            
                            if (timeSincePong < 5000) { // Pong получен в течение последних 5 секунд
                                console.log(`✅ Получатель ${friendUsername} онлайн (получен pong)`);
                                resolve(true);
                                return;
                            }
                        }
                        
                        if (Date.now() - startTime > maxWaitTime) {
                            console.log(`❌ Получатель ${friendUsername} офлайн (нет pong за ${maxWaitTime}мс)`);
                            resolve(false);
                            return;
                        }
                        
                        setTimeout(checkPong, 100);
                    };
                    checkPong();
                });
                
            } catch (error) {
                console.error(`❌ Ошибка проверки онлайн статуса ${friendUsername}:`, error);
                return false;
            }
        }
        
        // Удаление доставленных сообщений
        async function deleteDeliveredMessages(messagesToDelete) {
            console.log(`🗑️ Удаляем ${messagesToDelete.length} доставленных сообщений`);
            
            try {
                // Устанавливаем P2P соединение для удаления
                await establishP2PForDeletion(currentChatFriend, messagesToDelete);
                
                // Удаляем сообщения из IndexedDB
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
                const messages = await db.getRecentMessages(chatId, 1000);
                
                const filteredMessages = messages.filter(msg => 
                    !messagesToDelete.some(toDelete => toDelete.timestamp === msg.timestamp)
                );
                
                // Сохраняем отфильтрованные сообщения
                for (const message of filteredMessages) {
                    await db.saveMessage(chatId, message);
                }
                
                console.log(`✅ ${messagesToDelete.length} доставленных сообщений удалено`);
                
            } catch (error) {
                console.error('❌ Ошибка удаления доставленных сообщений:', error);
            }
        }
        
        // Показать предупреждение об офлайн получателе
        function showOfflineRecipientWarning(messageCount) {
            const modal = document.getElementById('deleteMessagesModal');
            if (modal) {
                modal.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px; width: 90%;">
                        <h3 style="margin: 0 0 15px 0; color: #333;">⚠️ Невозможно удалить сообщения</h3>
                        <p style="margin: 0 0 20px 0; color: #666;">
                            Удалить ${messageCount} сообщений у получателя невозможно, так как он не в сети.
                        </p>
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px; display: flex; align-items: flex-start; gap: 8px;">
                            <i class="fas fa-lightbulb" style="color: #f39c12; font-size: 14px; margin-top: 2px;"></i>
                            <div>
                                <strong>Совет:</strong> Попробуйте удалить сообщения позже, когда получатель будет онлайн
                            </div>
                        </div>
                        <button onclick="closeDeleteModal()" 
                                style="width: 100%; padding: 12px; margin: 5px 0; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; justify-content: center;">
                            <i class="fas fa-times"></i> Понятно
                        </button>
                    </div>
                `;
            }
        }
        
        // Установление P2P соединения для удаления сообщений
        async function establishP2PForDeletion(friendUsername, messagesToDelete) {
            console.log(`🔧 Устанавливаем P2P соединение с ${friendUsername} для удаления ${messagesToDelete.length} сообщений`);
            
            try {
                // Устанавливаем P2P соединение
                await establishP2PConnection(friendUsername);
                
                // Ждем установления соединения (максимум 30 секунд)
                const maxWaitTime = 30000;
                const startTime = Date.now();
                
                const waitForConnection = () => {
                    return new Promise((resolve, reject) => {
                        const checkConnection = () => {
                            if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
                                console.log(`✅ P2P соединение установлено для удаления с ${friendUsername}`);
                                resolve();
                            } else if (Date.now() - startTime > maxWaitTime) {
                                console.log(`⏰ Таймаут установления P2P для удаления с ${friendUsername}`);
                                reject(new Error('P2P connection timeout'));
                            } else {
                                setTimeout(checkConnection, 100); // Проверяем каждые 100мс
                            }
                        };
                        checkConnection();
                    });
                };
                
                await waitForConnection();
                
                // Отправляем команды удаления
                messagesToDelete.forEach(message => {
                    sendP2PMessage(friendUsername, {
                        type: 'delete_message',
                        to: friendUsername,
                        data: {
                            timestamp: message.timestamp,
                            from: currentUser.id
                        }
                    });
                });
                
                console.log(`📤 Команды удаления отправлены через P2P к ${friendUsername}`);
                
                // P2P соединение автоматически разорвется через 5 минут неактивности
                // благодаря существующей логике shouldMaintainP2PConnection
                
            } catch (error) {
                console.error(`❌ Ошибка установления P2P для удаления с ${friendUsername}:`, error);
                throw error; // Пробрасываем ошибку для обработки в вызывающей функции
            }
        }
        
        // ===== ЗВОНКИ ИЗ ЧАТА =====
        
        // Видеозвонок из чата
        function callFriendFromChat() {
            console.log('🎬 [CHAT] Кнопка видеозвонка нажата в чате');
            console.log('🎬 [CHAT] Текущий собеседник:', currentChatFriend);
            
            if (currentChatFriend) {
                console.log('🎬 [CHAT] Инициируем видеозвонок через Calls WebSocket к:', currentChatFriend);
                callFriend(currentChatFriend);
            } else {
                console.log('❌ [CHAT] Нет активного собеседника для видеозвонка');
            }
        }
        
        // Аудиозвонок из чата
        function callFriendAudioFromChat() {
            console.log('🎵 [CHAT] Кнопка аудиозвонка нажата в чате');
            console.log('🎵 [CHAT] Текущий собеседник:', currentChatFriend);
            
            if (currentChatFriend) {
                console.log('🎵 [CHAT] Инициируем аудиозвонок через Calls WebSocket к:', currentChatFriend);
                callFriendAudio(currentChatFriend);
            } else {
                console.log('❌ [CHAT] Нет активного собеседника для аудиозвонка');
            }
        }
        
        // ===== МОНИТОРИНГ СОЕДИНЕНИЯ =====
        
        // Периодическая проверка соединения с чат-сервером
        let connectionCheckInterval = null;
        let lastReconnectAttempt = 0;
        const RECONNECT_DELAY = 5000; // 5 секунд между попытками переподключения
        
        // Переменные для системы удаления сообщений
        let selectedMessages = new Set(); // Set для хранения timestamp выделенных сообщений
        let deleteCommandQueue = {}; // Очередь команд удаления для каждого пользователя
        let deleteRetryAttempts = {}; // Счетчик попыток повторной отправки
        
        function startConnectionMonitoring() {
            if (connectionCheckInterval) return;
            
            connectionCheckInterval = setInterval(() => {
                if (currentUser.id) {
                    // Проверяем состояние Chat WebSocket
                    if (!window.chatWs || window.chatWs.readyState !== WebSocket.OPEN) {
                        const now = Date.now();
                        if (now - lastReconnectAttempt > RECONNECT_DELAY) {
                            console.log('🔄 Chat WebSocket неактивен, переподключаемся...');
                            lastReconnectAttempt = now;
                            connectChatWebSocket();
                        } else {
                            console.log('⏳ Слишком рано для переподключения, пропускаем...');
                        }
                    }
                }
            }, 10000); // Проверяем каждые 10 секунд
        }
        
        function stopConnectionMonitoring() {
            if (connectionCheckInterval) {
                clearInterval(connectionCheckInterval);
                connectionCheckInterval = null;
            }
        }
        
        // ===== PING-PONG МОНИТОРИНГ =====
        
        // Запуск ping-понг мониторинга
        function startPingPongMonitoring(friendUsername) {
            if (pingIntervals[friendUsername]) {
                clearInterval(pingIntervals[friendUsername]);
            }
            
            let pingAttempts = 0;
            const maxPingAttempts = 12; // 12 попыток (1 час / 5 минут)
            
            pingIntervals[friendUsername] = setInterval(() => {
                // Отправляем ping только если есть сообщения в очереди
                if (messageQueues[friendUsername] && messageQueues[friendUsername].length > 0) {
                    pingAttempts++;
                    console.log(`📡 Ping попытка ${pingAttempts}/${maxPingAttempts} к ${friendUsername}`);
                    sendP2PPing(friendUsername);
                    
                    // Если превысили лимит попыток - помечаем сообщения как неотправленные
                    if (pingAttempts >= maxPingAttempts) {
                        console.log(`❌ Превышен лимит ping попыток для ${friendUsername}, помечаем сообщения как неотправленные`);
                        markMessagesAsFailed(friendUsername);
                        stopPingPongMonitoring(friendUsername);
                    }
                } else {
                    // Нет сообщений в очереди - останавливаем ping
                    stopPingPongMonitoring(friendUsername);
                }
            }, 5 * 60 * 1000); // Каждые 5 минут
        }
        
        // Остановка ping-понг мониторинга
        function stopPingPongMonitoring(friendUsername) {
            if (pingIntervals[friendUsername]) {
                clearInterval(pingIntervals[friendUsername]);
                delete pingIntervals[friendUsername];
            }
        }
        
        
        // Пометка сообщений как неотправленные
        function markMessagesAsFailed(friendUsername) {
            if (messageQueues[friendUsername]) {
                console.log(`❌ Соединение с ${friendUsername} потеряно, очищаем очередь из ${messageQueues[friendUsername].length} сообщений`);
                // Очищаем очередь
                messageQueues[friendUsername] = [];
            }
        }
        
        // Отправка P2P ping
        function sendP2PPing(friendUsername) {
            if (p2pConnections[friendUsername] && p2pConnections[friendUsername].status === 'connected') {
                const success = sendP2PMessage(friendUsername, {
                    type: 'ping',
                    to: friendUsername,
                    timestamp: Date.now()
                });
                
                if (!success) {
                    console.log(`Ping не отправлен ${friendUsername}, соединение потеряно`);
                    if (p2pConnections[friendUsername]) {
                        p2pConnections[friendUsername].status = 'disconnected';
                    }
                }
            }
        }
        
        // ===== СИСТЕМА ОЧЕРЕДЕЙ =====
        
        // Добавление сообщения в очередь
        function addMessageToQueue(friendUsername, message, timestamp, type) {
            if (!messageQueues[friendUsername]) {
                messageQueues[friendUsername] = [];
            }
            
            messageQueues[friendUsername].push({
                message: message,
                timestamp: timestamp,
                type: type,
                retries: 0,
                maxRetries: P2P_CONFIG.maxRetries
            });
            
            console.log(`Сообщение добавлено в очередь для ${friendUsername}`);
        }
        
        // Добавление команды удаления в очередь
        function addDeleteCommandToQueue(friendUsername, timestamp) {
            if (!messageQueues[friendUsername]) {
                messageQueues[friendUsername] = [];
            }
            
            messageQueues[friendUsername].push({
                type: 'delete_message',
                timestamp: timestamp,
                retries: 0,
                maxRetries: P2P_CONFIG.maxRetries
            });
            
            // Сохраняем команду удаления в localStorage для сохранения между сессиями
            saveDeleteCommandToStorage(friendUsername, timestamp);
            
            console.log(`🗑️ Команда удаления добавлена в очередь для ${friendUsername}:`, {
                timestamp: timestamp
            });
        }
        
        // Сохранение команды удаления в localStorage
        function saveDeleteCommandToStorage(friendUsername, timestamp) {
            const deleteCommandsKey = `delete_commands_${currentUser.id}_${friendUsername}`;
            let deleteCommands = JSON.parse(localStorage.getItem(deleteCommandsKey) || '[]');
            
            // Добавляем новую команду удаления
            deleteCommands.push({
                timestamp: timestamp,
                addedAt: Date.now()
            });
            
            // Сохраняем в localStorage
            localStorage.setItem(deleteCommandsKey, JSON.stringify(deleteCommands));
            
            console.log(`💾 Команда удаления сохранена в localStorage для ${friendUsername}:`, {
                timestamp: timestamp,
                totalCommands: deleteCommands.length
            });
        }
        
        // Загрузка команд удаления из localStorage
        function loadDeleteCommandsFromStorage(friendUsername) {
            const deleteCommandsKey = `delete_commands_${currentUser.id}_${friendUsername}`;
            const deleteCommands = JSON.parse(localStorage.getItem(deleteCommandsKey) || '[]');
            
            console.log(`📂 Загружено ${deleteCommands.length} команд удаления из localStorage для ${friendUsername}`);
            
            return deleteCommands;
        }
        
        // Очистка команд удаления из localStorage
        function clearDeleteCommandsFromStorage(friendUsername) {
            const deleteCommandsKey = `delete_commands_${currentUser.id}_${friendUsername}`;
            localStorage.removeItem(deleteCommandsKey);
            
            console.log(`🗑️ Команды удаления очищены из localStorage для ${friendUsername}`);
        }
        
        // Применение команд удаления из очереди к загруженным сообщениям
        function applyDeleteCommandsFromQueue(friendUsername, messages) {
            console.log(`🔍 applyDeleteCommandsFromQueue вызвана для ${friendUsername}:`, {
                messagesCount: messages.length,
                messageQueues: messageQueues[friendUsername]?.length || 0
            });
            
            // Получаем команды удаления из очереди
            let deleteCommands = [];
            if (messageQueues[friendUsername] && messageQueues[friendUsername].length > 0) {
                deleteCommands = messageQueues[friendUsername].filter(cmd => cmd.type === 'delete_message');
                console.log(`🔍 Команды удаления из очереди:`, deleteCommands);
            }
            
            // Получаем команды удаления из localStorage
            const storedDeleteCommands = loadDeleteCommandsFromStorage(friendUsername);
            console.log(`🔍 Команды удаления из localStorage:`, storedDeleteCommands);
            
            // Объединяем команды из очереди и localStorage
            const allDeleteCommands = [
                ...deleteCommands.map(cmd => cmd.timestamp),
                ...storedDeleteCommands.map(cmd => cmd.timestamp)
            ];
            
            console.log(`🔍 Все команды удаления:`, allDeleteCommands);
            
            if (allDeleteCommands.length === 0) {
                console.log(`🔍 Нет команд удаления для ${friendUsername}`);
                return messages;
            }
            
            console.log(`🗑️ Применяем ${allDeleteCommands.length} команд удаления (${deleteCommands.length} из очереди, ${storedDeleteCommands.length} из localStorage) для ${friendUsername}`);
            
            // Фильтруем сообщения, исключая те, которые помечены для удаления
            const filteredMessages = messages.filter(message => {
                const shouldDelete = allDeleteCommands.includes(message.timestamp);
                if (shouldDelete) {
                    console.log(`🗑️ Скрываем сообщение ${message.timestamp} из-за команды удаления`);
                }
                return !shouldDelete;
            });
            
            console.log(`🔍 Результат фильтрации: ${filteredMessages.length} сообщений из ${messages.length}`);
            
            return filteredMessages;
        }
        
        // Отправка сообщений из очереди
        function sendQueuedMessages(friendUsername) {
            if (messageQueues[friendUsername] && messageQueues[friendUsername].length > 0) {
                console.log(`Отправка ${messageQueues[friendUsername].length} сообщений из очереди для ${friendUsername}`);
                
                messageQueues[friendUsername].forEach(queuedMessage => {
                    let success = false;
                    
                    if (queuedMessage.type === 'delete_message') {
                        // Отправляем команду удаления
                        success = sendP2PMessage(friendUsername, {
                            type: 'delete_message',
                            to: friendUsername,
                            data: {
                                timestamp: queuedMessage.timestamp,
                                from: currentUser.id
                            }
                        });
                        
                        if (success) {
                            console.log(`✅ Команда удаления из очереди отправлена к ${friendUsername}`);
                            
                            // Очищаем команду удаления из localStorage после успешной отправки
                            const deleteCommandsKey = `delete_commands_${currentUser.id}_${friendUsername}`;
                            let storedDeleteCommands = JSON.parse(localStorage.getItem(deleteCommandsKey) || '[]');
                            storedDeleteCommands = storedDeleteCommands.filter(cmd => cmd.timestamp !== queuedMessage.timestamp);
                            localStorage.setItem(deleteCommandsKey, JSON.stringify(storedDeleteCommands));
                            
                            console.log(`🗑️ Команда удаления ${queuedMessage.timestamp} очищена из localStorage для ${friendUsername}`);
                        }
                    } else {
                        // Отправляем обычное сообщение
                        success = sendP2PMessage(friendUsername, {
                        type: 'chat_message',
                        to: friendUsername,
                        data: {
                            message: queuedMessage.message,
                            from: currentUser.id,
                            timestamp: queuedMessage.timestamp,
                            type: queuedMessage.type
                        }
                    });
                    
                    if (success) {
                        // Обновляем статус на "sent" при успешной отправке
                        updateMessageStatusInUI(queuedMessage.timestamp, 'sent');
                        updateMessageStatusInDB(friendUsername, queuedMessage.timestamp, 'sent');
                            console.log(`✅ Сообщение из очереди отправлено к ${friendUsername}`);
                        }
                    }
                        
                    if (success) {
                        // Удаляем из очереди
                        const index = messageQueues[friendUsername].indexOf(queuedMessage);
                        if (index > -1) {
                            messageQueues[friendUsername].splice(index, 1);
                        }
                    } else {
                        // Увеличиваем счетчик попыток
                        queuedMessage.retries++;
                        
                        // Проверяем лимит попыток
                        if (queuedMessage.retries >= queuedMessage.maxRetries) {
                            console.log(`Сообщение для ${friendUsername} не удалось доставить после ${queuedMessage.maxRetries} попыток`);
                            
                            // Устанавливаем статус "cancelled"
                            updateMessageStatusInUI(queuedMessage.timestamp, 'cancelled');
                            updateMessageStatusInDB(friendUsername, queuedMessage.timestamp, 'cancelled');
                            
                            // Удаляем из очереди
                            const index = messageQueues[friendUsername].indexOf(queuedMessage);
                            if (index > -1) {
                                messageQueues[friendUsername].splice(index, 1);
                            }
                        }
                    }
                });
            }
        }
        
        // ===== СИСТЕМА ТАЙМАУТОВ =====
        
        // Запуск таймаута для сообщения
        function startMessageTimeout(friendUsername, timestamp) {
            const timeoutId = setTimeout(() => {
                console.log(`Таймаут для сообщения ${timestamp} пользователю ${friendUsername}`);
            }, P2P_CONFIG.retryTimeout);
            
            connectionTimeouts[`${friendUsername}_${timestamp}`] = timeoutId;
        }
        
        // Очистка таймаута для сообщения
        function clearMessageTimeout(friendUsername, timestamp) {
            const timeoutKey = `${friendUsername}_${timestamp}`;
            if (connectionTimeouts[timeoutKey]) {
                clearTimeout(connectionTimeouts[timeoutKey]);
                delete connectionTimeouts[timeoutKey];
            }
        }
        
        // Периодическая проверка очередей
        function checkMessageQueues() {
            Object.keys(messageQueues).forEach(friendUsername => {
                if (messageQueues[friendUsername] && messageQueues[friendUsername].length > 0) {
                    // Пытаемся установить P2P соединение
                    if (!p2pConnections[friendUsername] || p2pConnections[friendUsername].status !== 'connected') {
                        establishP2PConnection(friendUsername);
                    }
                }
            });
        }
        
        // Запуск периодической проверки очередей
        // Глобальная переменная для хранения интервала мониторинга
        let queueMonitoringInterval = null;
        
        function startQueueMonitoring() {
            // Очищаем предыдущий интервал, если он есть
            if (queueMonitoringInterval) {
                clearInterval(queueMonitoringInterval);
            }
            
            queueMonitoringInterval = setInterval(checkMessageQueues, 30000); // Каждые 30 секунд
            console.log('🔄 Запущен мониторинг очередей сообщений');
        }
        
        function stopQueueMonitoring() {
            if (queueMonitoringInterval) {
                clearInterval(queueMonitoringInterval);
                queueMonitoringInterval = null;
                console.log('⏹️ Остановлен мониторинг очередей сообщений');
            }
        }
        
        // Отправка сообщения
        function sendChatMessage() {
            console.log('🔍 sendChatMessage вызвана');
            const messageInput = document.getElementById('chatMessageInput');
            const message = messageInput.value.trim();
            
            if (!message) return;
            
            console.log('📤 Отправляем сообщение:', {
                message: message,
                currentChatFriend: currentChatFriend,
                currentUser: currentUser
            });
            
            const timestamp = Date.now();
            
            // Определяем тип сообщения (содержит ли эмодзи)
            const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message);
            const messageType = hasEmoji ? 'emoji' : 'text';
            
            // Добавляем сообщение в чат и сохраняем сразу
            addChatMessage(message, currentUser.id, timestamp, messageType, false, 'not_sent');
            saveChatMessage(message, currentUser.id, timestamp, messageType);
            
            // Проверяем, есть ли уже P2P соединение
            const hasP2PConnection = p2pConnections[currentChatFriend] && 
                                  p2pConnections[currentChatFriend].dataChannel && 
                                  p2pConnections[currentChatFriend].dataChannel.readyState === 'open' &&
                                  p2pConnections[currentChatFriend].status === 'connected';
            
            console.log(`🔍 Проверка P2P соединения с ${currentChatFriend}:`, {
                hasConnection: !!p2pConnections[currentChatFriend],
                hasDataChannel: !!(p2pConnections[currentChatFriend] && p2pConnections[currentChatFriend].dataChannel),
                dataChannelState: p2pConnections[currentChatFriend]?.dataChannel?.readyState,
                connectionStatus: p2pConnections[currentChatFriend]?.status,
                isOpen: hasP2PConnection
            });
            
            if (hasP2PConnection) {
                // P2P соединение есть - отправляем сообщение сразу
                console.log(`✅ P2P соединение с ${currentChatFriend} установлено, отправляем сообщение напрямую`);
                const p2pSuccess = sendP2PMessage(currentChatFriend, {
                    type: 'chat_message',
                    to: currentChatFriend,
                    data: {
                        message: message,
                        from: currentUser.id,
                        timestamp: timestamp,
                        type: messageType
                    }
                });
                
                if (p2pSuccess) {
                    // Обновляем статус на "sent" при успешной отправке
                    updateMessageStatusInUI(timestamp, 'sent');
                    updateMessageStatusInDB(currentChatFriend, timestamp, 'sent');
                    console.log(`✅ Сообщение отправлено через P2P к ${currentChatFriend}`);
                } else {
                    // Ошибка отправки - добавляем в очередь
                    addMessageToQueue(currentChatFriend, message, timestamp, messageType);
                    console.log(`❌ Ошибка P2P отправки, добавлено в очередь для ${currentChatFriend}`);
                }
            } else {
                // P2P соединения нет - добавляем в очередь и отправляем ping
                console.log(`📡 P2P соединения с ${currentChatFriend} нет, добавляем в очередь`);
                
                // Добавляем сообщение в очередь для доставки
                addMessageToQueue(currentChatFriend, message, timestamp, messageType);
                
                // Отправляем ping для проверки онлайн статуса
                sendP2PSignal('ping', { to: currentChatFriend });
                
                // Запускаем таймаут для сообщения
                startMessageTimeout(currentChatFriend, timestamp);
                
                console.log(`📬 Сообщение добавлено в очередь для ${currentChatFriend}, отправлен ping`);
            }
            
            // Очищаем поле ввода
            messageInput.value = '';
        }
        
        // Вставка эмодзи в поле ввода (новая функция)
        function sendChatEmoji(emoji) {
            const messageInput = document.getElementById('chatMessageInput');
            const currentText = messageInput.value;
            const cursorPosition = messageInput.selectionStart;
            
            // Вставляем эмодзи в текущую позицию курсора
            const newText = currentText.slice(0, cursorPosition) + emoji + currentText.slice(cursorPosition);
            messageInput.value = newText;
            
            // Устанавливаем курсор после вставленного эмодзи
            const newCursorPosition = cursorPosition + emoji.length;
            messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // Фокусируемся на поле ввода
            messageInput.focus();
            
            // Скрываем панель эмодзи
            document.getElementById('chatEmojiPanel').style.display = 'none';
        }
        
        // Старая функция для совместимости
        function sendEmoji(emoji) {
            sendChatEmoji(emoji);
        }
        
        // Сохранение сообщения в IndexedDB
        async function saveChatMessage(message, from, timestamp, type) {
            console.log('🔍 saveChatMessage вызвана:', {
                message: message,
                from: from,
                timestamp: timestamp,
                type: type,
                currentChatFriend: currentChatFriend,
                currentUser: currentUser
            });
            
            if (!currentChatFriend) {
                console.error('❌ currentChatFriend не определен для сохранения сообщения');
                return;
            }
            
            if (!currentUser || !currentUser.id) {
                console.error('❌ currentUser не определен для сохранения сообщения');
                return;
            }
            
            try {
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${currentChatFriend}`;
                
                const messageObj = {
                    text: message,
                    from: from,
                    timestamp: timestamp,
                    type: type || 'text',
                    status: 'not_sent' // Статус по умолчанию - не отправлено
                };
                
                await db.saveMessage(chatId, messageObj);
                console.log('✅ Сообщение сохранено в IndexedDB:', messageObj);
                
            } catch (error) {
                console.error('❌ Ошибка сохранения сообщения в IndexedDB:', error);
                currentUser.log('❌ Ошибка сохранения сообщения', 'error');
            }
        }
        
        // Сохранение входящего сообщения
        async function saveIncomingMessage(senderUsername, message, from, timestamp, type) {
            console.log('🔍 saveIncomingMessage вызвана:', {
                senderUsername: senderUsername,
                message: message,
                from: from,
                timestamp: timestamp,
                type: type,
                currentUser: currentUser
            });
            
            if (!currentUser || !currentUser.id) {
                console.error('❌ currentUser не определен для сохранения входящего сообщения');
                return;
            }
            
            try {
                const db = await initMessageDB();
                const chatId = `chat_${currentUser.id}_${senderUsername}`;
                
                const messageObj = {
                    text: message,
                    from: from,
                    timestamp: timestamp,
                    type: type || 'text',
                    status: 'sent' // Входящие сообщения считаются отправленными
                };
                
                await db.saveMessage(chatId, messageObj);
                console.log('✅ Входящее сообщение сохранено в IndexedDB:', messageObj);
                
            } catch (error) {
                console.error('❌ Ошибка сохранения входящего сообщения в IndexedDB:', error);
                currentUser.log('❌ Ошибка сохранения входящего сообщения', 'error');
            }
            
            // Получаем ID отправителя сообщения
            const senderFriend = friendsData.friends.find(f => f.username === senderUsername);
            const senderUserId = senderFriend ? senderFriend.contact_user_id : 0;
            
            // Проверяем, открыт ли чат с этим пользователем
            const currentChatUserId = getCurrentChatUserId();
            
            // Увеличиваем счетчик непрочитанных только если чат НЕ открыт с этим пользователем
            if (currentChatUserId !== senderUserId) {
                if (!unreadMessages[senderUsername]) {
                    unreadMessages[senderUsername] = 0;
                }
                unreadMessages[senderUsername]++;
                
                // Обновляем индикатор непрочитанных
                updateUnreadIndicator(senderUsername);
                console.log(`🔴 Увеличен счетчик для неактивного чата ${senderUsername} (ID: ${senderUserId}):`, unreadMessages[senderUsername]);
                console.log(`🔍 Текущий открытый чат с ID: ${currentChatUserId}`);
            } else {
                console.log(`✅ Чат активен с ${senderUsername} (ID: ${senderUserId}), счетчик не увеличивается`);
            }
        }
        
        // Показ уведомления о новом сообщении
        function showChatNotification(senderUsername, message) {
            // Проверяем, что это не наше собственное сообщение
            if (senderUsername === currentUser.id) {
                console.log(`⚠️ Попытка показать уведомление от самого себя, игнорируем`);
                return;
            }
            
            // Создаем уведомление
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2c3e50;
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                cursor: pointer;
                animation: slideIn 0.3s ease-out;
            `;
            
            // Обрезаем длинное сообщение
            const shortMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
            
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">💬 ${senderUsername}</div>
                <div style="font-size: 14px; opacity: 0.9;">${shortMessage}</div>
                <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">Нажмите, чтобы открыть чат</div>
            `;
            
            // Добавляем анимацию
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // Обработчик клика - открываем чат
            notification.onclick = () => {
                openChat(senderUsername);
                document.body.removeChild(notification);
            };
            
            document.body.appendChild(notification);
            
            // Автоматически скрываем через 5 секунд
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.style.animation = 'slideIn 0.3s ease-out reverse';
                    setTimeout(() => {
                        if (document.body.contains(notification)) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                }
            }, 5000);
            
            // Воспроизводим звук уведомления
            playNotificationSound();
        }
        
        // Воспроизведение звука уведомления
        function playNotificationSound() {
            try {
                // Создаем простой звук уведомления
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (error) {
                console.log('Не удалось воспроизвести звук уведомления');
            }
        }
        
        // Обновление индикатора непрочитанных сообщений
        function updateUnreadIndicator(friendUsername) {
            const friendElement = document.querySelector(`[data-friend="${friendUsername}"]`);
            if (friendElement) {
                // Удаляем старый индикатор
                const oldIndicator = friendElement.querySelector('.unread-indicator');
                if (oldIndicator) {
                    oldIndicator.remove();
                }
                
                // Добавляем новый индикатор
                if (unreadMessages[friendUsername] > 0) {
                    const indicator = document.createElement('span');
                    indicator.className = 'unread-indicator';
                    // Стили теперь в CSS классе .unread-indicator
                    indicator.textContent = unreadMessages[friendUsername];
                    friendElement.appendChild(indicator);
                }
            }
        }
        
        // Загрузка непрочитанных сообщений при инициализации
        function loadUnreadMessages() {
            if (!currentUser.id) return;
            
            // Проходим по всем друзьям и считаем непрочитанные сообщения
            friendsData.friends.forEach(friend => {
                const chatKey = `chat_${currentUser.id}_${friend.username}`;
                const chatHistory = JSON.parse(localStorage.getItem(chatKey) || '[]');
                
                // Считаем сообщения от этого друга (не от текущего пользователя)
                const unreadCount = chatHistory.filter(msg => 
                    msg.from === friend.username && 
                    msg.from !== currentUser.id
                ).length;
                
                if (unreadCount > 0) {
                    unreadMessages[friend.username] = unreadCount;
                }
            });
            
            // Обновляем список друзей с индикаторами
            updateFriendsList();
        }
        
        // Переключение панели эмодзи
        function toggleChatEmojiPanel() {
            const panel = document.getElementById('chatEmojiPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Обработка нажатия Enter
        function handleChatKeyPress(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        }
        
        // Обновление статуса чата
        function updateChatStatus(message, type) {
            const status = document.getElementById('chatStatus');
            if (status) {
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.cssText = `
                padding: 10px 20px;
                background: ${type === 'connected' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd'};
                color: ${type === 'connected' ? '#155724' : type === 'error' ? '#721c24' : '#856404'};
                border-bottom: 1px solid ${type === 'connected' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeaa7'};
                font-size: 14px;
            `;
            } else {
                console.log(`📊 Статус чата: ${message} (тип: ${type})`);
            }
        }
        
        // Загрузка истории сообщений из IndexedDB с ленивой загрузкой
        async function loadChatHistory(friendUsername) {
            console.log('🔍 loadChatHistory вызвана для:', friendUsername);
            console.log('🔍 loadChatHistory - currentChatFriend:', currentChatFriend);
            const chatId = `chat_${currentUser.id}_${friendUsername}`;
            
            // Сбрасываем счетчик непрочитанных сообщений при загрузке истории
            unreadMessages[friendUsername] = 0;
            updateUnreadIndicator(friendUsername);
            updateFriendsList();
            
            // Очищаем контейнер сообщений перед загрузкой
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
            
            try {
                const db = await initMessageDB();
                
                // Показываем индикатор загрузки
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'loadingMessages';
                loadingDiv.style.cssText = `
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-style: italic;
                `;
                loadingDiv.innerHTML = '<div>Загружаем сообщения...</div>';
                chatMessages.appendChild(loadingDiv);
                
                // Загружаем последние 50 сообщений
                const messages = await db.getRecentMessages(chatId, 50);
                console.log(`📚 Загружено ${messages.length} сообщений для ${chatId}`);
                
                // Фильтруем сообщения: исключаем удаленные (статус "deleted")
                const filteredMessages = messages.filter(message => {
                    if (message.status === 'deleted') {
                        console.log(`🗑️ Скрываем сообщение ${message.timestamp} со статусом "deleted"`);
                        return false;
                    }
                    return true;
                });
                
                console.log(`📚 После фильтрации удаленных сообщений: ${filteredMessages.length} из ${messages.length} сообщений`);
                
                // Применяем команды удаления из очереди (для глобального удаления)
                console.log(`🔍 Применяем команды удаления для ${friendUsername}:`, {
                    originalMessages: filteredMessages.length,
                    messageQueues: messageQueues[friendUsername]?.length || 0,
                    localStorage: loadDeleteCommandsFromStorage(friendUsername).length
                });
                
                const finalFilteredMessages = applyDeleteCommandsFromQueue(friendUsername, filteredMessages);
                console.log(`📚 После применения команд удаления: ${finalFilteredMessages.length} сообщений`);
                
                // Убираем индикатор загрузки
                loadingDiv.remove();
                
                if (finalFilteredMessages.length > 0) {
                    // Отображаем сообщения
                    for (const message of finalFilteredMessages) {
                        addChatMessage(
                            message.text,
                            message.from,
                            message.timestamp,
                            message.type,
                            true, // isFromHistory
                            message.status // передаем статус из IndexedDB
                        );
                    }
                    
                    // Прокручиваем к последним сообщениям после загрузки истории
                    setTimeout(() => {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        console.log('📜 Прокручено к последним сообщениям');
                    }, 100);
                    
                    // Если есть больше сообщений, добавляем кнопку "Загрузить больше"
                    if (messages.length === 50) {
                        addLoadMoreButton(chatId, messages[messages.length - 1].timestamp);
                    }
                }
                
            } catch (error) {
                console.error('❌ Ошибка загрузки истории чата:', error);
                currentUser.log('❌ Ошибка загрузки истории чата', 'error');
            }
        }
        
        // Добавление кнопки "Загрузить больше"
        function addLoadMoreButton(chatId, oldestTimestamp) {
            const chatMessages = document.getElementById('chatMessages');
            const loadMoreDiv = document.createElement('div');
            loadMoreDiv.id = 'loadMoreMessages';
            loadMoreDiv.style.cssText = `
                text-align: center;
                padding: 10px;
                border-top: 1px solid #eee;
            `;
            loadMoreDiv.innerHTML = `
                <button onclick="loadOlderMessages('${chatId}', ${oldestTimestamp})" 
                        style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    📚 Загрузить больше сообщений
                </button>
            `;
            chatMessages.insertBefore(loadMoreDiv, chatMessages.firstChild);
        }
        
        // Ленивая загрузка старых сообщений
        async function loadOlderMessages(chatId, beforeTimestamp) {
            try {
                const db = await initMessageDB();
                const olderMessages = await db.getOlderMessages(chatId, beforeTimestamp, 50);
                
                if (olderMessages.length > 0) {
                    // Вставляем старые сообщения в начало чата
                    const chatMessages = document.getElementById('chatMessages');
                    const loadMoreDiv = document.getElementById('loadMoreMessages');
                    
                    for (let i = olderMessages.length - 1; i >= 0; i--) {
                        const message = olderMessages[i];
                        // Создаем элемент сообщения
                        const messageDiv = document.createElement('div');
                        const isOwn = message.from === currentUser.id;
                        messageDiv.setAttribute('data-timestamp', message.timestamp);
                        messageDiv.style.cssText = `
                            margin: 10px 0;
                            padding: 10px 15px;
                            border-radius: 15px;
                            max-width: 70%;
                            word-wrap: break-word;
                            background: ${isOwn ? 'rgb(255, 169, 90)' : '#F6F6F6'};
                            color: ${isOwn ? '#101010' : '#1A1A1A'};
                            margin-left: ${isOwn ? 'auto' : '0'};
                            text-align: ${isOwn ? 'right' : 'left'};
                        `;
                        
                        if (message.type === 'emoji') {
                            const isOnlyEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]+$/u.test(message.text);
                            if (isOnlyEmoji) {
                                messageDiv.innerHTML = `
                                    <div style="font-size: 24px;">${message.text}</div>
                                    <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(message.timestamp).toLocaleTimeString()}</div>
                                `;
                            } else {
                                messageDiv.innerHTML = `
                                    <div style="font-size: 16px;">${message.text}</div>
                                    <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(message.timestamp).toLocaleTimeString()}</div>
                                `;
                            }
                        } else {
                            messageDiv.innerHTML = `
                                <div>${message.text}</div>
                                <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${new Date(message.timestamp).toLocaleTimeString()}</div>
                            `;
                        }
                        
                        chatMessages.insertBefore(messageDiv, loadMoreDiv);
                    }
                    
                    // Обновляем кнопку или убираем её
                    if (olderMessages.length === 50) {
                        loadMoreDiv.querySelector('button').onclick = () => 
                            loadOlderMessages(chatId, olderMessages[0].timestamp);
                    } else {
                        loadMoreDiv.remove();
                    }
                    
                    console.log(`📚 Загружено ${olderMessages.length} старых сообщений для ${chatId}`);
                } else {
                    // Убираем кнопку, если больше нет сообщений
                    const loadMoreDiv = document.getElementById('loadMoreMessages');
                    if (loadMoreDiv) loadMoreDiv.remove();
                }
                
            } catch (error) {
                console.error('❌ Ошибка загрузки старых сообщений:', error);
                currentUser.log('❌ Ошибка загрузки старых сообщений', 'error');
            }
        }
        
        // Загрузка сообщений из файла (старая история)
        async function loadMoreMessages(friendUsername) {
            const chatKey = `chat_${currentUser.id}_${friendUsername}`;
            const chatMessages = document.getElementById('chatMessages');
            
            // Показываем индикатор загрузки
            const loadingDiv = document.getElementById('loadingMessages');
            if (loadingDiv) {
                loadingDiv.innerHTML = '<div>Загружаем старую историю из файла...</div>';
            }
            
            try {
                // Загружаем старые сообщения из файла
                const fileMessages = await loadMessagesFromFile(chatKey);
                console.log(`📁 Найдено ${fileMessages.length} старых сообщений в файле для ${chatKey}`);
                
                if (fileMessages.length > 0) {
                    // Добавляем старые сообщения в начало чата
                    const firstMessage = chatMessages.querySelector('.message');
                    if (firstMessage) {
                        // Вставляем перед первым сообщением
                        await loadMessagesBatch(fileMessages, chatMessages, true);
                    } else {
                        // Если чат пустой, загружаем как обычно
                        await loadMessagesBatch(fileMessages, chatMessages);
                    }
                    
                    // Убираем кнопку "Загрузить больше"
                    const loadMoreBtn = chatMessages.querySelector('button');
                    if (loadMoreBtn) {
                        loadMoreBtn.remove();
                    }
                } else {
                    currentUser.log('📁 Старая история не найдена в файле', 'info');
                }
            } catch (error) {
                console.error('❌ Ошибка загрузки из файла:', error);
                currentUser.log('❌ Ошибка загрузки старой истории', 'error');
            } finally {
                // Убираем индикатор загрузки
                const loadingDiv = document.getElementById('loadingMessages');
                if (loadingDiv) {
                    loadingDiv.remove();
                }
            }
        }
        
        // Пакетная загрузка сообщений
        async function loadMessagesBatch(messages, container, prepend = false) {
            const batchSize = 10;
            let loadedCount = 0;
            
            const loadBatch = () => {
                const endIndex = Math.min(loadedCount + batchSize, messages.length);
                
                for (let i = loadedCount; i < endIndex; i++) {
                    const msg = messages[i];
                    addChatMessage(msg.message, msg.from, msg.timestamp, msg.type, true);
                }
                
                loadedCount = endIndex;
                
                if (loadedCount < messages.length) {
                    setTimeout(loadBatch, 10);
                } else {
                    console.log(`✅ Загружено ${loadedCount} сообщений`);
                    
                    // Прокручиваем к последнему сообщению
                    container.scrollTop = container.scrollHeight;
                }
            };
            
            loadBatch();
        }
        
        // ===== INDEXEDDB ХРАНЕНИЕ СООБЩЕНИЙ =====
        
        // Переменные для IndexedDB
        let messageDB = null;
        let dbInitialized = false;
        const DB_NAME = 'LizaAppDB';
        const DB_VERSION = 1;
        
        // Класс для работы с IndexedDB
        class MessageDB {
            constructor() {
                this.db = null;
                this.dbName = DB_NAME;
                this.dbVersion = DB_VERSION;
            }
            
            // Инициализация базы данных
            async init() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, this.dbVersion);
                    
                    request.onerror = () => {
                        console.error('❌ Ошибка открытия IndexedDB:', request.error);
                        reject(request.error);
                    };
                    
                    request.onsuccess = () => {
                        this.db = request.result;
                        console.log('✅ IndexedDB инициализирована');
                        resolve(this.db);
                    };
                    
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        console.log('🔧 Создание структуры IndexedDB');
                        
                        // Создаем таблицу чатов
                        if (!db.objectStoreNames.contains('chats')) {
                            const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
                            chatStore.createIndex('participants', 'participants', { unique: false });
                            chatStore.createIndex('lastMessage', 'lastMessageTimestamp', { unique: false });
                        }
                        
                        // Создаем таблицу сообщений
                        if (!db.objectStoreNames.contains('messages')) {
                            const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                            messageStore.createIndex('chatId', 'chatId', { unique: false });
                            messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                            messageStore.createIndex('from', 'from', { unique: false });
                        }
                        
                        // Создаем таблицу метаданных
                        if (!db.objectStoreNames.contains('metadata')) {
                            db.createObjectStore('metadata', { keyPath: 'key' });
                        }
                    };
                });
            }
            
            // Сохранение сообщения
            async saveMessage(chatId, message) {
                if (!this.db) await this.init();
                
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['messages', 'chats'], 'readwrite');
                    const messageStore = transaction.objectStore('messages');
                    const chatStore = transaction.objectStore('chats');
                    
                    // Сохраняем сообщение
                    const messageData = {
                        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        chatId: chatId,
                        from: message.from,
                        text: message.text,
                        timestamp: message.timestamp,
                        type: message.type || 'text',
                        status: message.status || 'sent'
                    };
                    
                    // Сохраняем сообщение
                    const messageRequest = messageStore.put(messageData);
                    messageRequest.onsuccess = () => {
                        // Обновляем информацию о чате
                        const chatData = {
                            id: chatId,
                            participants: chatId.split('_').slice(1),
                            lastMessage: message.text,
                            lastMessageTimestamp: message.timestamp,
                            messageCount: 0 // Будет обновлено отдельно
                        };
                        
                        const chatRequest = chatStore.put(chatData);
                        chatRequest.onsuccess = () => {
                            console.log('💾 Сообщение сохранено в IndexedDB:', messageData.id);
                            resolve(messageData);
                        };
                        chatRequest.onerror = () => reject(chatRequest.error);
                    };
                    messageRequest.onerror = () => reject(messageRequest.error);
                    
                    transaction.onerror = () => reject(transaction.error);
                });
            }
            
            // Очистка всех сообщений чата
            async clearMessages(chatId) {
                if (!this.db) await this.init();
                
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['messages'], 'readwrite');
                    const messageStore = transaction.objectStore('messages');
                    const index = messageStore.index('chatId');
                    const request = index.openCursor(IDBKeyRange.only(chatId));
                    
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            cursor.delete();
                            cursor.continue();
                        } else {
                            console.log(`🗑️ Все сообщения чата ${chatId} очищены из IndexedDB`);
                            resolve();
                        }
                    };
                    
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                });
            }
            
            // Получение последних сообщений чата
            async getRecentMessages(chatId, limit = 50) {
                if (!this.db) await this.init();
                
                const transaction = this.db.transaction(['messages'], 'readonly');
                const store = transaction.objectStore('messages');
                const index = store.index('chatId');
                
                return new Promise((resolve, reject) => {
                    const request = index.getAll(chatId);
                    request.onsuccess = () => {
                        const messages = request.result
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, limit)
                            .reverse();
                        console.log(`📚 Загружено ${messages.length} сообщений для ${chatId}`);
                        resolve(messages);
                    };
                    request.onerror = () => reject(request.error);
                });
            }
            
            // Получение старых сообщений
            async getOlderMessages(chatId, beforeTimestamp, limit = 50) {
                if (!this.db) await this.init();
                
                const transaction = this.db.transaction(['messages'], 'readonly');
                const store = transaction.objectStore('messages');
                const index = store.index('chatId');
                
                return new Promise((resolve, reject) => {
                    const request = index.getAll(chatId);
                    request.onsuccess = () => {
                        const messages = request.result
                            .filter(msg => msg.timestamp < beforeTimestamp)
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, limit)
                            .reverse();
                        console.log(`📚 Загружено ${messages.length} старых сообщений для ${chatId}`);
                        resolve(messages);
                    };
                    request.onerror = () => reject(request.error);
                });
            }
            
            // Получение списка чатов
            async getChatList() {
                if (!this.db) await this.init();
                
                const transaction = this.db.transaction(['chats'], 'readonly');
                const store = transaction.objectStore('chats');
                const index = store.index('lastMessage');
                
                return new Promise((resolve, reject) => {
                    const request = index.getAll();
                    request.onsuccess = () => {
                        const chats = request.result
                            .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
                        console.log(`💬 Загружено ${chats.length} чатов`);
                        resolve(chats);
                    };
                    request.onerror = () => reject(request.error);
                });
            }
            
            // Подсчет сообщений в чате
            async getMessageCount(chatId) {
                if (!this.db) await this.init();
                
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['messages'], 'readonly');
                    const store = transaction.objectStore('messages');
                    const index = store.index('chatId');
                    
                    const request = index.count(chatId);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                });
            }
            
            // Поиск сообщений
            async searchMessages(query, chatId = null) {
                if (!this.db) await this.init();
                
                const transaction = this.db.transaction(['messages'], 'readonly');
                const store = transaction.objectStore('messages');
                const index = store.index('chatId');
                
                return new Promise((resolve, reject) => {
                    const request = chatId ? index.getAll(chatId) : store.getAll();
                    request.onsuccess = () => {
                        const messages = request.result.filter(msg => 
                            msg.text.toLowerCase().includes(query.toLowerCase())
                        );
                        console.log(`🔍 Найдено ${messages.length} сообщений по запросу "${query}"`);
                        resolve(messages);
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        }
        
        // Инициализация IndexedDB
        async function initMessageDB() {
            if (!dbInitialized) {
                messageDB = new MessageDB();
                await messageDB.init();
                dbInitialized = true;
                console.log('✅ IndexedDB готова к работе');
                currentUser.log('✅ Система хранения сообщений инициализирована', 'success');
            }
            return messageDB;
        }
        
        // Очистка старых данных localStorage
        function clearOldLocalStorage() {
            const keys = Object.keys(localStorage);
            const chatKeys = keys.filter(key => key.startsWith('chat_'));
            
            chatKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ Удален старый ключ: ${key}`);
            });
            
            // Удаляем старые ключи файлового хранения
            localStorage.removeItem('lizaapp_file_storage');
            localStorage.removeItem('lizaapp_first_run_completed');
            
            console.log('🧹 Очищены старые данные localStorage');
        }
        async function findExistingFile() {
            try {
                if (!('showOpenFilePicker' in window)) {
                    return null;
                }
                
                // Пытаемся найти существующий файл LizaApp
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Файлы LizaApp',
                        accept: { 'application/json': ['.json'] }
                    }],
                    excludeAcceptAllOption: false,
                    multiple: false,
                    startIn: 'downloads'
                });
                
                // Проверяем, что это файл LizaApp
                const file = await fileHandle.getFile();
                const content = await file.text();
                let fileData;
                
                try {
                    fileData = JSON.parse(content);
                } catch (e) {
                    return null;
                }
                
                // Проверяем, что это файл LizaApp
                if (fileData.metadata && fileData.metadata.appName === 'LizaApp') {
                    return fileHandle;
                }
                
                return null;
            } catch (error) {
                return null;
            }
        }
        
        // Автоматическое создание нового файла
        async function createNewFile() {
            try {
                if (!('showSaveFilePicker' in window)) {
                    return null;
                }
                
                // Создаем файл с фиксированным именем (без даты)
                const fileName = 'lizaapp_messages.json';
                
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    startIn: 'downloads',
                    types: [{
                        description: 'JSON файлы',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                
                // Создаем начальную структуру файла
                const initialData = {
                    chats: {},
                    metadata: {
                        created: Date.now(),
                        lastUpdated: Date.now(),
                        version: "1.0",
                        appName: "LizaApp",
                        description: "История сообщений LizaApp"
                    }
                };
                
                // Записываем начальную структуру в файл
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(initialData, null, 2));
                await writable.close();
                
                return fileHandle;
            } catch (error) {
                return null;
            }
        }
        
        // Автоматическая инициализация файлового хранения
        async function initializeFileStorage() {
            try {
                // Сначала пытаемся найти существующий файл
                let fileHandle = await findExistingFile();
                
                if (fileHandle) {
                    // Файл найден, используем его
                    messageFileHandle = fileHandle;
                    fileStorageEnabled = true;
                    
                    // Обновляем информацию о файле
                    localStorage.setItem('lizaapp_file_storage', JSON.stringify({
                        enabled: true,
                        fileName: fileHandle.name,
                        lastUsed: Date.now()
                    }));
                    
                    console.log('✅ Найден существующий файл LizaApp:', fileHandle.name);
                    currentUser.log('✅ История сообщений загружена из файла', 'success');
                    return true;
                } else {
                    // Файл не найден, создаем новый
                    fileHandle = await createNewFile();
                    
                    if (fileHandle) {
                        messageFileHandle = fileHandle;
                        fileStorageEnabled = true;
                        
                        // Сохраняем информацию о файле
                        localStorage.setItem('lizaapp_file_storage', JSON.stringify({
                            enabled: true,
                            fileName: fileHandle.name,
                            lastUsed: Date.now()
                        }));
                        
                        console.log('✅ Создан новый файл LizaApp:', fileHandle.name);
                        currentUser.log('⚠️ Возможно, это первый вход на этом устройстве. История не будет загружена', 'warning');
                        return true;
                    } else {
                        // Не удалось создать файл
                        fileStorageEnabled = false;
                        console.log('❌ Не удалось создать файл хранения');
                        currentUser.log('❌ Файловое хранение недоступно', 'error');
                        return false;
                    }
                }
            } catch (error) {
                console.error('❌ Ошибка инициализации файлового хранения:', error);
                fileStorageEnabled = false;
                return false;
            }
        }
        
        // Сохранение сообщений в файл
        async function saveMessagesToFile(chatKey, messages) {
            if (!fileStorageEnabled || !messageFileHandle) {
                return false;
            }
            
            try {
                // Читаем существующие данные из файла
                let fileData = {};
                try {
                    const file = await messageFileHandle.getFile();
                    const content = await file.text();
                    if (content) {
                        fileData = JSON.parse(content);
                    }
                } catch (error) {
                    // Файл пустой или не существует, начинаем с пустого объекта
                    fileData = {};
                }
                
                // Структура файла: { "chats": { "chatKey": [messages] }, "metadata": {...} }
                if (!fileData.chats) {
                    fileData.chats = {};
                }
                if (!fileData.metadata) {
                    fileData.metadata = {
                        created: Date.now(),
                        lastUpdated: Date.now(),
                        version: "1.0"
                    };
                }
                
                // Добавляем новые сообщения к существующим
                if (!fileData.chats[chatKey]) {
                    fileData.chats[chatKey] = [];
                }
                
                // Добавляем только новые сообщения (проверяем по timestamp)
                const existingTimestamps = new Set(fileData.chats[chatKey].map(msg => msg.timestamp));
                const newMessages = messages.filter(msg => !existingTimestamps.has(msg.timestamp));
                
                fileData.chats[chatKey].push(...newMessages);
                fileData.metadata.lastUpdated = Date.now();
                
                // Сортируем сообщения по времени
                fileData.chats[chatKey].sort((a, b) => a.timestamp - b.timestamp);
                
                // Сохраняем обновленные данные
                const writable = await messageFileHandle.createWritable();
                await writable.write(JSON.stringify(fileData, null, 2));
                await writable.close();
                
                console.log(`💾 Сохранено ${newMessages.length} новых сообщений в файл для ${chatKey}`);
                return true;
            } catch (error) {
                console.error('❌ Ошибка сохранения в файл:', error);
                return false;
            }
        }
        
        // Загрузка сообщений из файла
        async function loadMessagesFromFile(chatKey) {
            if (!fileStorageEnabled || !messageFileHandle) {
                return [];
            }
            
            try {
                const file = await messageFileHandle.getFile();
                const content = await file.text();
                
                if (!content) {
                    return [];
                }
                
                const fileData = JSON.parse(content);
                
                // Проверяем новую структуру файла
                if (fileData.chats && fileData.chats[chatKey]) {
                    console.log(`📁 Загружено ${fileData.chats[chatKey].length} сообщений из файла для ${chatKey}`);
                    return fileData.chats[chatKey];
                }
                
                // Совместимость со старой структурой
                if (fileData[chatKey]) {
                    console.log(`📁 Загружено ${fileData[chatKey].length} сообщений из файла (старая структура) для ${chatKey}`);
                    return fileData[chatKey];
                }
                
                return [];
            } catch (error) {
                console.error('❌ Ошибка загрузки из файла:', error);
                return [];
            }
        }
        
        // Проверка статуса файлового хранения
        function checkFileStorageStatus() {
            const storageInfo = localStorage.getItem('lizaapp_file_storage');
            if (storageInfo) {
                const info = JSON.parse(storageInfo);
                fileStorageEnabled = info.enabled;
                console.log('📁 Статус файлового хранения:', info);
                return info.enabled;
            }
            return false;
        }
        
        
        // Переключение файлового хранения
        async function toggleFileStorage() {
            if (fileStorageEnabled) {
                // Отключаем файловое хранение
                fileStorageEnabled = false;
                messageFileHandle = null;
                localStorage.removeItem('lizaapp_file_storage');
                
                const btn = document.getElementById('fileStorageBtn');
                btn.textContent = '📁 Файлы';
                btn.style.background = '#2196F3';
                
                currentUser.log('📁 Файловое хранение отключено', 'info');
            } else {
                // Включаем файловое хранение
                const success = await initializeFileStorage();
                if (success) {
                    const btn = document.getElementById('fileStorageBtn');
                    btn.textContent = '✅ Файлы';
                    btn.style.background = '#4CAF50';
                }
            }
        }
        
        // ===== ОПТИМИЗАЦИЯ LOCALSTORAGE =====
        
        // Очистка старых сообщений для оптимизации производительности
        async function cleanupOldMessages() {
            // Получаем все ключи localStorage
            const keys = Object.keys(localStorage);
            const chatKeys = keys.filter(key => key.startsWith('chat_'));
            
            for (const chatKey of chatKeys) {
                const chatHistory = JSON.parse(localStorage.getItem(chatKey) || '[]');
                
                if (chatHistory.length > MAX_LOCALSTORAGE_MESSAGES) {
                    // Если файловое хранение включено, сохраняем старые сообщения в файл
                    if (fileStorageEnabled) {
                        const oldMessages = chatHistory.slice(0, -MAX_LOCALSTORAGE_MESSAGES);
                        const recentMessages = chatHistory.slice(-MAX_LOCALSTORAGE_MESSAGES);
                        
                        // Сохраняем старые сообщения в файл
                        await saveMessagesToFile(chatKey, oldMessages);
                        
                        // Оставляем только последние сообщения в localStorage
                        localStorage.setItem(chatKey, JSON.stringify(recentMessages));
                        
                        console.log(`📁 Перенесено ${oldMessages.length} старых сообщений в файл для ${chatKey}`);
                        console.log(`💾 Оставлено ${recentMessages.length} последних сообщений в localStorage для ${chatKey}`);
                    } else {
                        // Если файловое хранение отключено, просто обрезаем
                        const cleanedHistory = chatHistory.slice(-MAX_LOCALSTORAGE_MESSAGES);
                        localStorage.setItem(chatKey, JSON.stringify(cleanedHistory));
                        console.log(`🧹 Очищено ${chatHistory.length - cleanedHistory.length} старых сообщений для ${chatKey}`);
                    }
                }
            }
        }
        
        // Функция для отладки localStorage
        function debugLocalStorage() {
            console.log('🔍 Отладка localStorage:');
            console.log('📊 Все ключи в localStorage:', Object.keys(localStorage));
            
            // Ищем все ключи чатов
            const chatKeys = Object.keys(localStorage).filter(key => key.startsWith('chat_'));
            console.log('💬 Найденные ключи чатов:', chatKeys);
            
            chatKeys.forEach(key => {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                console.log(`📚 ${key}: ${data.length} сообщений`, data);
            });
            
            // Ищем все ключи команд удаления
            const deleteKeys = Object.keys(localStorage).filter(key => key.startsWith('delete_commands_'));
            console.log('🗑️ Найденные ключи команд удаления:', deleteKeys);
            
            deleteKeys.forEach(key => {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                console.log(`🗑️ ${key}: ${data.length} команд удаления`, data);
            });
            
            // Проверяем unreadMessages
            console.log('🔴 Непрочитанные сообщения:', unreadMessages);
        }
        
        // ===== УПРАВЛЕНИЕ P2P СОЕДИНЕНИЯМИ =====
        
        // Закрытие P2P соединения
        function closeP2PConnection(friendUsername) {
            if (p2pConnections[friendUsername]) {
                // Останавливаем ping-понг
                stopPingPongMonitoring(friendUsername);
                
                // Закрываем соединение
                if (p2pConnections[friendUsername].connection) {
                    p2pConnections[friendUsername].connection.close();
                }
                
                // Удаляем из списка
                delete p2pConnections[friendUsername];
                
                console.log(`P2P соединение с ${friendUsername} закрыто`);
            }
        }
        
        // Проверка необходимости P2P соединения
        function shouldMaintainP2PConnection(friendUsername) {
            // Соединение нужно поддерживать если:
            // 1. Чат открыт с этим другом
            // 2. Есть сообщения в очереди для этого друга
            // 3. Соединение активно (недавно использовалось)
            const connection = p2pConnections[friendUsername];
            const isRecentlyActive = connection && 
                                   connection.lastActivity && 
                                   (Date.now() - connection.lastActivity) < 5 * 60 * 1000; // 5 минут
            
            const shouldMaintain = (currentChatFriend === friendUsername) || 
                   (messageQueues[friendUsername] && messageQueues[friendUsername].length > 0) ||
                   isRecentlyActive;
            
            // Если соединение неактивно более 5 минут и чат открыт - закрываем чат
            if (!shouldMaintain && currentChatFriend === friendUsername) {
                console.log(`⏰ P2P соединение с ${friendUsername} неактивно более 5 минут, закрываем чат`);
                closeChat();
            }
            
            return shouldMaintain;
        }
        
        // Умное управление P2P соединениями
        function manageP2PConnections() {
            Object.keys(p2pConnections).forEach(friendUsername => {
                if (!shouldMaintainP2PConnection(friendUsername)) {
                    console.log(`Закрываем P2P соединение с ${friendUsername} - не нужно`);
                    closeP2PConnection(friendUsername);
                }
            });
        }
        
        // ===== UI ИНДИКАТОРЫ СТАТУСА =====
        
        
        // Закрытие чата
        function closeChat() {
            // Управляем P2P соединениями
            if (currentChatFriend) {
                if (!shouldMaintainP2PConnection(currentChatFriend)) {
                    closeP2PConnection(currentChatFriend);
                }
            }
            
            document.getElementById('chatContainer').style.display = 'none';
            document.getElementById('chatEmojiPanel').style.display = 'none';
            
            // НЕ закрываем Chat WebSocket - он должен оставаться подключенным
            // if (window.chatWs) {
            //     window.chatWs.close();
            //     window.chatWs = null;
            // }
            
            currentChatFriend = null;
        }
        
        // Загрузка истории сообщений
        
        // Добавление сообщения в чат
        function addMessageToChat(text, from, timestamp, type = 'text') {
            const messagesContainer = document.getElementById('chatMessages');
            const isOwn = from === currentUser.id;
            
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                margin: 10px 0;
                display: flex;
                justify-content: ${isOwn ? 'flex-end' : 'flex-start'};
            `;
            
            const messageBubble = document.createElement('div');
            messageBubble.className = isOwn ? 'message outgoing' : 'message incoming';
            messageBubble.style.cssText = `
                max-width: 70%;
                padding: 10px 15px;
                border-radius: var(--radius);
                word-wrap: break-word;
            `;
            
            if (type === 'emoji') {
                messageBubble.style.fontSize = '24px';
                messageBubble.textContent = text;
            } else {
                messageBubble.textContent = text;
            }
            
            messageDiv.appendChild(messageBubble);
            messagesContainer.appendChild(messageDiv);
            
            // Прокручиваем вниз
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Отправка сообщения
        async function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (!message || !currentChatFriend) return;
            
            // Добавляем сообщение в чат
            const timestamp = Date.now();
            addMessageToChat(message, currentUser.id, timestamp, 'text');
            
            // Сохраняем в localStorage
            if (!chatMessages[currentChatFriend]) {
                chatMessages[currentChatFriend] = [];
            }
            chatMessages[currentChatFriend].push({
                text: message,
                from: currentUser.id,
                timestamp: timestamp,
                type: 'text'
            });
            localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
            
            // Отправляем через PHP API
            try {
                const response = await fetch('chat-api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'send_message',
                        from: currentUser.id,
                        to: currentChatFriend,
                        message: message
                    })
                });

                const result = await response.json();
                if (result.success) {
                    currentUser.log(`✅ Сообщение отправлено через API`, 'success');
                } else {
                    currentUser.log(`❌ Ошибка отправки: ${result.message}`, 'error');
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка API: ${error.message}`, 'error');
            }
            
            // Очищаем поле ввода
            messageInput.value = '';
        }
        
        // Отправка эмодзи
        async function sendEmoji(emoji) {
            if (!currentChatFriend) return;
            
            // Добавляем эмодзи в чат
            const timestamp = Date.now();
            addMessageToChat(emoji, currentUser.id, timestamp, 'emoji');
            
            // Сохраняем в localStorage
            if (!chatMessages[currentChatFriend]) {
                chatMessages[currentChatFriend] = [];
            }
            chatMessages[currentChatFriend].push({
                text: emoji,
                from: currentUser.id,
                timestamp: timestamp,
                type: 'emoji'
            });
            localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
            
            // Отправляем через PHP API
            try {
                const response = await fetch('chat-api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'send_emoji',
                        from: currentUser.id,
                        to: currentChatFriend,
                        emoji: emoji
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    currentUser.log(`✅ Эмодзи отправлено через API`, 'success');
                } else {
                    currentUser.log(`❌ Ошибка отправки эмодзи: ${result.message}`, 'error');
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка API: ${error.message}`, 'error');
            }
            
            // Скрываем панель эмодзи
            document.getElementById('emojiPanel').style.display = 'none';
        }
        
        // Переключение панели эмодзи
        function toggleEmojiPanel() {
            const emojiPanel = document.getElementById('emojiPanel');
            emojiPanel.style.display = emojiPanel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Обработка нажатия Enter в поле ввода
        function handleMessageKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        // Обработка входящих сообщений
        function handleChatMessage(signal) {
            if (!currentChatFriend || signal.from !== currentChatFriend) return;
            
            // Добавляем сообщение в чат
            addMessageToChat(signal.data.message, signal.from, signal.data.timestamp, signal.data.type);
            
            // Сохраняем в localStorage
            if (!chatMessages[currentChatFriend]) {
                chatMessages[currentChatFriend] = [];
            }
            chatMessages[currentChatFriend].push({
                text: signal.data.message,
                from: signal.from,
                timestamp: signal.data.timestamp,
                type: signal.data.type
            });
            localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
        }
        
        // Загрузка сообщений из localStorage при инициализации
        function loadChatMessagesFromStorage() {
            const stored = localStorage.getItem('chatMessages');
            if (stored) {
                chatMessages = JSON.parse(stored);
            }
        }
        
        
        // Разрыв соединения
        async function disconnectCall() {
            currentUser.log('🔌 Разрываем соединение', 'warning');
            
            // Останавливаем все звуки при разрыве соединения
            stopIncomingCallSound();
            stopOutgoingCallSound();
            
            // Останавливаем таймаут звонка
            stopCallTimeout();
            
            // Останавливаем таймер звонка
            stopCallTimer();
            
            // Сбрасываем состояние кнопок аудио
            resetAudioControls();
            
            if (currentUser.peerConnection) {
                currentUser.peerConnection.close();
                currentUser.peerConnection = null;
            }
            
            // Отправляем disconnect сигнал
            if (currentUser.targetUser) {
                await sendSignal('disconnect', { reason: 'user_disconnected' });
            }
            
            // Останавливаем медиа потоки
            if (currentUser.localStream) {
                currentUser.localStream.getTracks().forEach(track => track.stop());
                currentUser.localStream = null;
                document.getElementById('localVideo').srcObject = null;
                currentUser.log('📹 Медиа потоки остановлены', 'info');
            }
            
            // Восстанавливаем кнопки друзей
            restoreFriendButtons();
            
            // Сбрасываем только состояние звонка, не весь пользователь
            currentUser.state = 'idle';
            currentUser.targetUser = null;
            currentUser.isInitiator = false;
            currentUser.webrtcInitiated = false;
            
            document.getElementById('remoteVideo').srcObject = null;
            
            updateUI();
        }
        
        // Завершение звонка (только P2P соединение)
        async function endCall() {
            currentUser.log('🔌 Завершаем звонок', 'warning');
            
            // Останавливаем звук входящего звонка
            stopIncomingCallSound();
            
            // Останавливаем звук гудков для звонящего
            stopOutgoingCallSound();
            
            // Останавливаем таймаут звонка
            stopCallTimeout();
            
            // Останавливаем таймер звонка
            stopCallTimer();
            
            // Сбрасываем состояние кнопок аудио
            resetAudioControls();
            
            if (currentUser.peerConnection) {
                currentUser.peerConnection.close();
                currentUser.peerConnection = null;
            }
            
            // Отправляем disconnect сигнал
            if (currentUser.targetUser) {
                await sendSignal('disconnect', { reason: 'user_disconnected' });
            }
            
            // Показываем сообщение о завершении звонка
            currentUser.log('📞 Разговор завершен', 'info');
            
            // Скрываем окна звонков и чата с задержкой
            setTimeout(() => {
                document.getElementById('videoCallContainer').style.display = 'none';
                document.getElementById('audioCallContainer').style.display = 'none';
                document.getElementById('chatContainer').style.display = 'none';
            }, 1500);
            
            // Останавливаем медиа потоки
            if (currentUser.localStream) {
                currentUser.localStream.getTracks().forEach(track => track.stop());
                currentUser.localStream = null;
                document.getElementById('localVideo').srcObject = null;
                currentUser.log('📹 Медиа потоки остановлены', 'info');
            }
            
            // Восстанавливаем кнопки друзей
            restoreFriendButtons();
            
            // Сбрасываем только состояние звонка, не весь пользователь
            currentUser.state = 'idle';
            currentUser.targetUser = null;
            currentUser.isInitiator = false;
            currentUser.webrtcInitiated = false;
            
            document.getElementById('remoteVideo').srcObject = null;
            
            updateUI();
        }
        
        // Сброс пользователя
        async function resetUser() {
            // Останавливаем все звуки при сбросе пользователя
            stopIncomingCallSound();
            stopOutgoingCallSound();
            
            // Останавливаем таймаут звонка
            stopCallTimeout();
            
            if (currentUser.peerConnection) {
                currentUser.peerConnection.close();
                currentUser.peerConnection = null;
            }
            
            if (currentUser.localStream) {
                currentUser.localStream.getTracks().forEach(track => track.stop());
                currentUser.localStream = null;
            }
            
            // Останавливаем все интервалы
            stopQueueMonitoring();
            
            // Очищаем все ping-понг интервалы
            Object.keys(pingIntervals).forEach(friendUsername => {
                clearInterval(pingIntervals[friendUsername]);
                delete pingIntervals[friendUsername];
            });
            
            // Закрываем WebSocket соединения
            if (currentUser.callsWs) {
                currentUser.callsWs.close();
                currentUser.callsWs = null;
                currentUser.callsWsConnected = false;
                currentUser.wsUserId = null;
            }
            if (currentUser.chatWs) {
                currentUser.chatWs.close();
                currentUser.chatWs = null;
                currentUser.chatWsConnected = false;
            }
            
            currentUser.state = 'idle';
            currentUser.targetUser = null;
            currentUser.isInitiator = false;
            currentUser.webrtcInitiated = false;
            
            document.getElementById('localVideo').srcObject = null;
            document.getElementById('remoteVideo').srcObject = null;
            
            currentUser.log('🔄 Пользователь сброшен', 'warning');
            
            // Очищаем сохраненные данные
            localStorage.removeItem('userData');
            
            // Восстанавливаем кнопки друзей
            restoreFriendButtons();
            
            // Скрываем систему друзей
            hideFriendsSection();
            
            updateUI();
            
            // Перенаправляем на страницу входа
            window.location.href = 'login.php';
        }
        
        // Копирование логов
        function copyLogs() {
            const log = document.getElementById('log').innerText;
            const allLogs = `=== ЛОГИ ПОЛЬЗОВАТЕЛЯ ===\n${log}\n\n=== ИНФОРМАЦИЯ О ТЕСТЕ ===\nВремя теста: ${new Date().toLocaleString()}\nСервер: ${CALLS_WEBSOCKET_URL}\nПользователь: ${currentUser.id || 'не авторизован'}`;
            
            navigator.clipboard.writeText(allLogs).then(() => {
                alert('Логи скопированы в буфер обмена!');
            });
        }
        
        // ===== СИСТЕМА ДРУЗЕЙ =====
        
        // Данные системы друзей
        let friendsData = {
            friends: [],           // Список друзей
            requests: [],          // Входящие запросы
            sentRequests: []       // Исходящие запросы
        };
        
        // Делаем friendsData глобальной для доступа из других модулей
        window.friendsData = friendsData;
        
        // Состояние входящего звонка
        let incomingCall = {
            isActive: false,
            caller: null,
            offer: null,
            iceCandidates: [],  // Буфер для ICE кандидатов
            maxIceCandidates: 10,  // Максимум ICE кандидатов в буфере
            callTimeout: null  // Таймаут для автоматического отклонения
        };
        
        // Показать секцию друзей после авторизации
        function showFriendsSection() {
            // Теперь данные друзей отображаются в табах левой панели
            loadFriendsData();
        }
        
        // Скрыть секцию друзей при выходе
        function hideFriendsSection() {
            // Секция друзей теперь встроена в левую панель
        }
        
        // Переключение типа поиска
        function switchSearchType(type) {
            const phoneFields = document.getElementById('phoneSearchFields');
            const usernameFields = document.getElementById('usernameSearchFields');
            const phoneBtn = document.querySelector('.search-type-btn[onclick="switchSearchType(\'phone\')"]');
            const usernameBtn = document.querySelector('.search-type-btn[onclick="switchSearchType(\'username\')"]');
            
            if (type === 'phone') {
                phoneFields.style.display = 'block';
                usernameFields.style.display = 'none';
                phoneBtn.classList.add('active');
                usernameBtn.classList.remove('active');
            } else {
                phoneFields.style.display = 'none';
                usernameFields.style.display = 'block';
                phoneBtn.classList.remove('active');
                usernameBtn.classList.add('active');
            }
        }

        // Поиск пользователя по номеру телефона
        async function searchUser() {
            const username = document.getElementById('searchUsername').value.trim();
            if (!username) {
                alert('Введите номер телефона в международном формате (+79991234567)');
                return;
            }
            
            if (username === currentUser.id) {
                alert('Нельзя искать самого себя');
                return;
            }
            
            // Проверяем формат номера телефона
            if (!username.startsWith('+') || username.length < 10) {
                alert('Введите номер телефона в международном формате (+79991234567)');
                return;
            }
            
            currentUser.log(`🔍 Поиск пользователя: ${username}`, 'info');
            
            try {
                // Поиск пользователя через API
                const response = await fetch(`https://lizaapp.ru/api/search_user.php?username=${encodeURIComponent(username)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        displaySearchResult(data.user);
                    } else {
                        currentUser.log(`❌ Пользователь ${username} не найден`, 'error');
                        document.getElementById('searchResults').innerHTML = createInviteButton(username, 'Пользователь не найден');
                    }
            } else {
                    const errorText = await response.text();
                    currentUser.log(`❌ HTTP ошибка: ${response.status} - ${errorText}`, 'error');
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка поиска: ${error.message}`, 'error');
                const username = document.getElementById('searchUsername').value.trim();
                document.getElementById('searchResults').innerHTML = createInviteButton(username, 'Ошибка поиска');
            }
        }
        
        // Отображение результата поиска
        function displaySearchResult(user) {
            const searchResults = document.getElementById('searchResults');
            
            // Проверяем, не является ли пользователь уже другом или в запросах
            const isFriend = friendsData.friends.some(f => f.username === user.username);
            const hasRequest = friendsData.requests.some(r => r.username === user.username);
            const hasSentRequest = friendsData.sentRequests.some(r => r.username === user.username);
            
            let buttonHtml = '';
            if (isFriend) {
                buttonHtml = '<span style="color: green;">✓ Уже в друзьях</span>';
            } else if (hasRequest) {
                buttonHtml = '<span style="color: orange;"><i class="fas fa-inbox"></i> Есть входящий запрос</span>';
            } else if (hasSentRequest) {
                buttonHtml = '<span style="color: blue;"><i class="fas fa-paper-plane"></i> Запрос отправлен</span>';
                } else {
                buttonHtml = `<button onclick="sendFriendRequest('${user.username}')" class="btn-success btn-small"><i class="fas fa-user-plus"></i> Добавить в друзья</button>`;
            }
            
            searchResults.innerHTML = `
                <div class="user-item">
                    <div class="username"><i class="fas fa-user"></i> ${user.username}</div>
                    <div class="actions">${buttonHtml}</div>
                </div>
            `;
        }

        // Поиск пользователя по логину (простая логика без валидации)
        async function searchUserByUsername() {
            const username = document.getElementById('searchUsernameField').value.trim();
            if (!username) {
                alert('Введите логин для поиска');
                return;
            }
            
            if (username === currentUser.id) {
                alert('Нельзя искать самого себя');
                return;
            }
            
            currentUser.log(`🔍 Поиск пользователя по логину: ${username}`, 'info');
            
            try {
                // Поиск пользователя через API
                const response = await fetch(`https://lizaapp.ru/api/search_user.php?username=${encodeURIComponent(username)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    currentUser.log('📋 Ответ API поиска:', data);
                    
                    if (data.success && data.user) {
                        displaySearchResult(data.user);
                    } else {
                        // Пользователь не найден - показываем варианты приглашения
                        displayInviteOptions(username);
                    }
                } else {
                    currentUser.log('❌ Ошибка HTTP при поиске пользователя:', response.status);
                    alert('Ошибка при поиске пользователя');
                }
            } catch (error) {
                currentUser.log('❌ Ошибка при поиске пользователя:', error);
                alert('Ошибка при поиске пользователя');
            }
        }
        
        // Отправка запроса в друзья
        async function sendFriendRequest(username) {
            currentUser.log(`📤 Отправка запроса в друзья: ${username}`, 'info');
            
            try {
                const response = await fetch('https://lizaapp.ru/api/send_invitation.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from_username: currentUser.id,
                        target_username: username
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        currentUser.log(`✅ Запрос в друзья отправлен: ${username}`, 'success');
                        
                        // Добавляем в список отправленных запросов
                        friendsData.sentRequests.push({
                            username: username,
                            timestamp: new Date().toISOString()
                        });
                        
                        await updateSentRequestsList();
                        document.getElementById('searchResults').innerHTML = '<p style="color: green;">Запрос отправлен!</p>';
                } else {
                        currentUser.log(`❌ Ошибка отправки запроса: ${data.message}`, 'error');
                        alert(data.message);
                    }
                } else {
                    throw new Error('Ошибка отправки запроса');
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка отправки запроса: ${error.message}`, 'error');
                alert('Ошибка отправки запроса');
            }
        }
        
        // Загрузка данных друзей
        async function loadFriendsData() {
            if (!currentUser.id) return;
            
            try {
                // Загружаем друзей
                const friendsResponse = await fetch(`https://lizaapp.ru/api/get_contacts.php?username=${encodeURIComponent(currentUser.id)}`, {
                    method: 'GET'
                });
                if (friendsResponse.ok) {
                    const friendsResponseData = await friendsResponse.json();
                    if (friendsResponseData.success) {
                        friendsData.friends = friendsResponseData.contacts || [];
                        updateFriendsList();
                    }
                }
                
                // Загружаем входящие запросы
                console.log('🔍 currentUser.id для API:', currentUser.id);
                console.log('🔍 Тип currentUser.id:', typeof currentUser.id);
                
                const requestsResponse = await fetch(`https://lizaapp.ru/api/get_requests.php?username=${encodeURIComponent(currentUser.id)}`, {
                    method: 'GET'
                });
                if (requestsResponse.ok) {
                    const requestsResponseData = await requestsResponse.json();
                    console.log('📥 Ответ API для запросов:', requestsResponseData);
                    
                    if (requestsResponseData.success) {
                        friendsData.requests = requestsResponseData.requests || [];
                        console.log('✅ Запросы загружены:', friendsData.requests);
                        await updateRequestsList();
                    } else {
                        console.log('❌ Ошибка загрузки запросов:', requestsResponseData.message);
                    }
                } else {
                    console.log('❌ Ошибка HTTP при загрузке запросов:', requestsResponse.status);
                }
                
                // Загружаем отправленные запросы
                const sentRequestsResponse = await fetch(`https://lizaapp.ru/api/get_sent_requests.php?username=${encodeURIComponent(currentUser.id)}`, {
                    method: 'GET'
                });
                if (sentRequestsResponse.ok) {
                    const sentRequestsResponseData = await sentRequestsResponse.json();
                    if (sentRequestsResponseData.success) {
                        friendsData.sentRequests = sentRequestsResponseData.requests || [];
                        await updateSentRequestsList();
                    }
                }
                
            } catch (error) {
                currentUser.log(`❌ Ошибка загрузки данных друзей: ${error.message}`, 'error');
            }
            
            // Предзагружаем аватары друзей после загрузки данных
            if (friendsData.friends && friendsData.friends.length > 0) {
                console.log('🚀 Начинаем предзагрузку аватаров после загрузки данных друзей');
                preloadFriendsAvatars().catch(error => {
                    console.error('Ошибка предзагрузки аватаров:', error);
                });
            }
            
            // Обновляем счетчик заявок после загрузки всех данных
            if (window.updateRequestsCounter) {
                window.updateRequestsCounter();
            }
        }
        
        // Обновление списка друзей
        function updateFriendsList() {
            const friendsList = document.getElementById('friendsList');
            
            if (friendsData.friends.length === 0) {
                friendsList.innerHTML = '<p style="color: #666; text-align: center; margin: 20px 0;">Нет друзей</p>';
                return;
            }
            
            const friendsHtml = friendsData.friends.map(friend => {
                const unreadCount = unreadMessages[friend.username] || 0;
                const unreadIndicator = unreadCount > 0 ? `<span class="unread-indicator">${unreadCount}</span>` : '';
                
                return `
                    <div class="friend-item" data-friend="${friend.username}" onclick="openChat('${friend.username}')" style="cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='white'">
                        <div class="username" style="position: relative;">
                            <div class="friend-avatar" style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: #ddd; margin-right: 8px; vertical-align: middle; text-align: center; line-height: 20px; font-size: 12px; color: #666;" data-user-id="${friend.contact_user_id}">
                                <i class="fas fa-user" style="font-size: 10px;"></i>
                            </div>
                            <span class="friend-display-name" data-phone="${friend.username}">${friend.username}</span>${unreadIndicator}
                        </div>
                        <div class="actions" onclick="event.stopPropagation()">
                            <div class="call-buttons">
                                <button onclick="callFriend('${friend.username}')" class="btn-primary btn-small" id="callBtn_${friend.username}"><i class="fas fa-video"></i> Видеозвонок</button>
                                <button onclick="callFriendAudio('${friend.username}')" class="btn-secondary btn-small" id="audioCallBtn_${friend.username}"><i class="fas fa-microphone"></i> Аудиозвонок</button>
                            </div>
                            <button onclick="endCall()" class="btn-danger btn-small" id="disconnectBtn_${friend.username}" style="display: none;"><i class="fas fa-phone-slash"></i> Завершить</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            friendsList.innerHTML = friendsHtml;
            
            // Загружаем аватары для всех друзей
            loadFriendsAvatars();
            
            // Загружаем имена контактов из IndexedDB
            loadContactNames();
        }
        
        // Функция для загрузки аватаров друзей
        async function loadFriendsAvatars() {
            const friendAvatars = document.querySelectorAll('.friend-avatar');
            
            for (let avatarDiv of friendAvatars) {
                const userId = avatarDiv.getAttribute('data-user-id');
                if (!userId) continue;

                try {
                    // Получаем username из данных друзей
                    const friend = friendsData.friends.find(f => f.contact_user_id == userId);
                    if (friend) {
                        console.log(`🔄 Загружаем аватар для друга ${friend.username} (ID: ${userId})`);
                        // Используем кэшированный аватар
                        const avatarData = await getCachedAvatar(userId, friend.username);
                        if (avatarData) {
                            avatarDiv.innerHTML = `<img src="${avatarData}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                            console.log(`✅ Аватар для ${friend.username} отображен`);
                        } else {
                            console.log(`⚠️ Аватар для ${friend.username} не найден в кэше`);
                        }
                    } else {
                        console.log(`⚠️ Друг с ID ${userId} не найден в списке друзей`);
                    }
                } catch (error) {
                    console.error('Ошибка загрузки аватара для user_id', userId, error);
                }
            }
        }
        
        // Универсальная функция для отображения аватара с кэшированием
        async function displayCachedAvatar(elementId, userId, username) {
            try {
                console.log(`🔄 Загружаем аватар для ${username} (ID: ${userId})`);
                
                // Получаем аватар из кэша или загружаем с сервера
                const avatarData = await getCachedAvatar(userId, username);
                
                if (avatarData) {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.innerHTML = `<img src="${avatarData}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                        console.log(`✅ Аватар для ${username} отображен из кэша`);
                    }
                } else {
                    console.log(`⚠️ Аватар для ${username} не найден, показываем placeholder`);
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.innerHTML = '<i class="fas fa-user-circle"></i>';
                    }
                }
            } catch (error) {
                console.error(`❌ Ошибка отображения аватара для ${username}:`, error);
                const element = document.getElementById(elementId);
                if (element) {
                    element.innerHTML = '<i class="fas fa-user-circle"></i>';
                }
            }
        }
        
        // Обновление списка входящих запросов
        async function updateRequestsList() {
            console.log('🔄 updateRequestsList вызвана');
            console.log('📊 friendsData.requests:', friendsData.requests);
            console.log('📊 Количество запросов:', friendsData.requests.length);
            
            const requestsList = document.getElementById('requestsList');
            
            if (friendsData.requests.length === 0) {
                console.log('❌ Нет запросов для отображения');
                requestsList.innerHTML = '<p style="color: #666; text-align: center; margin: 20px 0;">Нет запросов</p>';
                
                // Обновляем счетчик заявок (должен быть 0)
                if (window.updateRequestsCounter) {
                    window.updateRequestsCounter();
                }
                return;
            }
            
            // Сначала отображаем с номерами телефонов
            const requestsHtml = friendsData.requests.map(request => `
                <div class="request-item">
                    <div class="username" data-phone="${request.username}">👤 ${request.username}</div>
                    <div class="actions">
                        <button onclick="acceptFriendRequest('${request.username}')" class="btn-success btn-small">✓</button>
                        <button onclick="rejectFriendRequest('${request.username}')" class="btn-danger btn-small">✗</button>
                    </div>
                </div>
            `).join('');
            
            requestsList.innerHTML = requestsHtml;
            
            // Загружаем имена из записной книжки
            if (typeof loadRequestNames === 'function') {
                await loadRequestNames();
            }
            
            
            // Загружаем аватары для запросов
            loadRequestsAvatars();
            
            // Обновляем счетчик заявок
            if (window.updateRequestsCounter) {
                window.updateRequestsCounter();
            }
        }
        
        
        
        // Функция для загрузки аватаров запросов
        async function loadRequestsAvatars() {
            const requestAvatars = document.querySelectorAll('.request-avatar');
            
            for (let avatarDiv of requestAvatars) {
                const userId = avatarDiv.getAttribute('data-user-id');
                if (!userId) continue;

                try {
                    // Получаем username из данных запросов
                    const request = friendsData.requests.find(r => r.user_id == userId);
                    if (request) {
                        console.log(`🔄 Загружаем аватар для запроса ${request.username} (ID: ${userId})`);
                        // Используем кэшированный аватар
                        const avatarData = await getCachedAvatar(userId, request.username);
                        if (avatarData) {
                            avatarDiv.innerHTML = `<img src="${avatarData}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                            console.log(`✅ Аватар для ${request.username} отображен`);
                        } else {
                            console.log(`⚠️ Аватар для ${request.username} не найден в кэше`);
                        }
                    } else {
                        console.log(`⚠️ Запрос с ID ${userId} не найден в списке запросов`);
                    }
                } catch (error) {
                    console.error('Ошибка загрузки аватара для user_id', userId, error);
                }
            }
        }
        
        // Обновление списка отправленных запросов
        async function updateSentRequestsList() {
            const sentRequestsList = document.getElementById('sentRequestsList');
            
            if (friendsData.sentRequests.length === 0) {
                sentRequestsList.innerHTML = '<p style="color: #666; text-align: center; margin: 20px 0;">Нет отправленных приглашений</p>';
                return;
            }
            
            // Сначала отображаем с номерами телефонов
            const sentRequestsHtml = friendsData.sentRequests.map(request => `
                <div class="request-item">
                    <div class="username" data-phone="${request.username}">👤 ${request.username}</div>
                    <div class="actions">
                        <span style="color: #666; font-size: 12px;">Ожидает</span>
                    </div>
                </div>
            `).join('');
            
            sentRequestsList.innerHTML = sentRequestsHtml;
            
            // Загружаем имена из записной книжки
            if (typeof loadSentRequestNames === 'function') {
                await loadSentRequestNames();
            }
        }
        
        
        // Функция для загрузки имен контактов из IndexedDB
        async function loadContactNames() {
            const friendNames = document.querySelectorAll('.friend-display-name');
            
            for (const nameElement of friendNames) {
                const phone = nameElement.getAttribute('data-phone');
                if (phone) {
                    try {
                        const contactName = await getContactName(phone);
                        if (contactName) {
                            nameElement.textContent = contactName;
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки имени контакта для', phone, error);
                    }
                }
            }
        }
        
        // Функция для загрузки аватара пользователя
        function loadUserAvatar() {
            const userData = localStorage.getItem('userData');
            if (!userData) return;

            try {
                const data = JSON.parse(userData);
                const userId = data.userId;
                
                if (!userId) return;

                // Загружаем аватар из кэша
                const username = data.username;
                displayCachedAvatar('userAvatar', userId, username);
            } catch (error) {
                console.error('Ошибка парсинга userData:', error);
            }
        }
        
        // Принятие запроса в друзья
        async function acceptFriendRequest(username) {
            currentUser.log(`✅ Принятие запроса в друзья: ${username}`, 'info');
            
            try {
                const response = await fetch('https://lizaapp.ru/api/accept_invitation.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accepter_username: currentUser.id,
                        sender_username: username
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        currentUser.log(`✅ Запрос в друзья принят: ${username}`, 'success');
                        
                        // Удаляем из входящих запросов
                        friendsData.requests = friendsData.requests.filter(r => r.username !== username);
                        
                        // Обновляем счетчик заявок
                        if (window.updateRequestsCounter) {
                            window.updateRequestsCounter();
                        }
                        
                        // Добавляем в друзья
                        friendsData.friends.push({
                            username: username,
                            timestamp: new Date().toISOString()
                        });
                        
                        await updateRequestsList();
                        updateFriendsList();
                } else {
                        currentUser.log(`❌ Ошибка принятия запроса: ${data.message}`, 'error');
                        alert(data.message);
                    }
                } else {
                    throw new Error('Ошибка принятия запроса');
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка принятия запроса: ${error.message}`, 'error');
                alert('Ошибка принятия запроса');
            }
        }
        
        // Отклонение запроса в друзья
        async function rejectFriendRequest(username) {
            currentUser.log(`❌ Отклонение запроса в друзья: ${username}`, 'warning');
            
            try {
                const response = await fetch('https://lizaapp.ru/api/reject_invitation.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        rejecter_username: currentUser.id,
                        sender_username: username
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        currentUser.log(`✅ Запрос в друзья отклонен: ${username}`, 'success');
                        
                        // Удаляем из входящих запросов
                        friendsData.requests = friendsData.requests.filter(r => r.username !== username);
                        
                        // Обновляем счетчик заявок
                        if (window.updateRequestsCounter) {
                            window.updateRequestsCounter();
                        }
                        
                        await updateRequestsList();
                } else {
                        currentUser.log(`❌ Ошибка отклонения запроса: ${data.message}`, 'error');
                        alert(data.message);
                    }
                } else {
                    throw new Error('Ошибка отклонения запроса');
                }
            } catch (error) {
                currentUser.log(`❌ Ошибка отклонения запроса: ${error.message}`, 'error');
                alert('Ошибка отклонения запроса');
            }
        }
        
        // Аудио звонок другу
        async function callFriendAudio(username) {
            console.log('🎵 [CALLS] ===== НАЧАЛО АУДИОЗВОНКА =====');
            console.log('🎵 [CALLS] Пользователь:', username);
            console.log('🎵 [CALLS] Calls WebSocket подключен:', currentUser.callsWsConnected);
            console.log('🎵 [CALLS] Calls WebSocket объект:', !!currentUser.callsWs);
            console.log('🎵 [CALLS] Calls WebSocket состояние:', currentUser.callsWs?.readyState);
            
            currentUser.log(`🎵 Аудио звонок другу: ${username}`, 'info');
            
            // Скрываем кнопки "Аудиозвонок" и показываем "Завершить"
            const audioCallBtn = document.getElementById(`audioCallBtn_${username}`);
            const disconnectBtn = document.getElementById(`disconnectBtn_${username}`);
            
            if (audioCallBtn) audioCallBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
            
            // Запускаем только аудио потоки у инициатора
            try {
                currentUser.log(`🎵 Запуск микрофона...`, 'info');
                currentUser.localStream = await navigator.mediaDevices.getUserMedia({ 
                    video: false,  // Только аудио!
                    audio: true 
                });
                
                // Устанавливаем только видео для локального отображения (без аудио)
                const localVideoStream = createLocalVideoStream(currentUser.localStream);
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = localVideoStream;
                
                // Явно отключаем аудио для локального видео
                localVideo.muted = true;
                localVideo.volume = 0;
                localVideo.setAttribute('muted', 'true');
                
                currentUser.log(`✅ Аудио поток получен: ${currentUser.localStream.getTracks().length} треков (инициатор)`, 'success');
                
                // Логируем детали треков
                currentUser.localStream.getTracks().forEach(track => {
                    currentUser.log(`🎵 Трек: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState} (инициатор)`, 'info');
                });
                
                // Показываем окно аудиозвонка в правой части
                document.getElementById('audioCallContainer').style.display = 'block';
                
                // Используем существующий функционал звонков, но с аудио типом
                document.getElementById('targetUserId').value = username;
                startAudioCall();
                
            } catch (error) {
                currentUser.log(`❌ Ошибка получения аудио: ${error.message}`, 'error');
                
                // Восстанавливаем кнопки при ошибке
                if (audioCallBtn) audioCallBtn.style.display = 'inline-block';
                if (disconnectBtn) disconnectBtn.style.display = 'none';
            }
        }
        
        // Звонок другу
        async function callFriend(username) {
            console.log('🎬 [CALLS] ===== НАЧАЛО ВИДЕОЗВОНКА =====');
            console.log('🎬 [CALLS] Пользователь:', username);
            console.log('🎬 [CALLS] Calls WebSocket подключен:', currentUser.callsWsConnected);
            console.log('🎬 [CALLS] Calls WebSocket объект:', !!currentUser.callsWs);
            console.log('🎬 [CALLS] Calls WebSocket состояние:', currentUser.callsWs?.readyState);
            
            currentUser.log(`📞 Звонок другу: ${username}`, 'info');
            
            // Скрываем кнопку "Видеозвонок" и показываем "Завершить"
            const callBtn = document.getElementById(`callBtn_${username}`);
            const disconnectBtn = document.getElementById(`disconnectBtn_${username}`);
            
            if (callBtn) callBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
            
            // Запускаем медиа потоки у инициатора
            try {
                currentUser.log(`📹 Запуск камеры и микрофона...`, 'info');
                currentUser.localStream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: true 
                });
                
                // Устанавливаем только видео для локального отображения (без аудио)
                const localVideoStream = createLocalVideoStream(currentUser.localStream);
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = localVideoStream;
                
                // Явно отключаем аудио для локального видео
                localVideo.muted = true;
                localVideo.volume = 0;
                localVideo.setAttribute('muted', 'true');
                
                currentUser.log(`✅ Медиа потоки получены: ${currentUser.localStream.getTracks().length} треков (инициатор)`, 'success');
                
            // Показываем окно видеозвонка в правой части
            document.getElementById('videoCallContainer').style.display = 'block';
            
            // Принудительно переключаем на основной динамик для видеозвонка
            setTimeout(() => {
                forceSpeakerForVideoCall();
            }, 500);
                
                // Логируем детали треков
                currentUser.localStream.getTracks().forEach(track => {
                    currentUser.log(`📹 Трек: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState} (инициатор)`, 'info');
                });
                
                // Используем существующий функционал звонков
                document.getElementById('targetUserId').value = username;
                startCall();
                
            } catch (error) {
                currentUser.log(`❌ Ошибка получения медиа: ${error.message}`, 'error');
                
                // Восстанавливаем кнопки при ошибке
                if (callBtn) callBtn.style.display = 'inline-block';
                if (disconnectBtn) disconnectBtn.style.display = 'none';
            }
        }
        
        // Восстановление кнопок друзей после завершения звонка
        function restoreFriendButtons() {
            // Восстанавливаем все кнопки друзей
            friendsData.friends.forEach(friend => {
                const callBtn = document.getElementById(`callBtn_${friend.username}`);
                const audioCallBtn = document.getElementById(`audioCallBtn_${friend.username}`);
                const disconnectBtn = document.getElementById(`disconnectBtn_${friend.username}`);
                
                if (callBtn) callBtn.style.display = 'inline-block';
                if (audioCallBtn) audioCallBtn.style.display = 'inline-block';
                if (disconnectBtn) disconnectBtn.style.display = 'none';
            });
        }
        
        // Восстановление данных пользователя из localStorage
        function restoreUserData() {
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const data = JSON.parse(userData);
                    if (data.username && data.sessionToken) {
                        // Заполняем поля формы
                        document.getElementById('userId').value = data.username;
                        
                        // Восстанавливаем данные пользователя
                        currentUser.id = data.username;
                        currentUser.sessionToken = data.sessionToken;
                        currentUser.userId = data.userId;
                        
                        // Восстанавливаем текущий чат
                        const savedChatFriend = localStorage.getItem('currentChatFriend');
                        if (savedChatFriend) {
                            currentChatFriend = savedChatFriend;
                            console.log(`💬 Восстановлен текущий чат: ${currentChatFriend}`);
                        }
                        
                        
                        // Подключаемся к Chat WebSocket при восстановлении сессии
                        connectChatWebSocket();
                        
                        // Запускаем мониторинг соединения
                        startConnectionMonitoring();
                        
                        currentUser.log(`🔄 Восстановлены данные пользователя: ${data.username}`, 'info');
                        
                        // Автоматически подключаемся
                        autoConnect();
                        return true;
                }
            } catch (error) {
                    currentUser.log(`❌ Ошибка восстановления данных: ${error.message}`, 'error');
                    localStorage.removeItem('userData');
                }
            }
            return false;
        }
        
        // Автоматическое подключение без повторной авторизации
        async function autoConnect() {
            currentUser.log(`🚀 Автоматическое подключение...`, 'info');
            
            currentUser.lastSignalId = Math.floor(Date.now() / 1000) - 60;
            currentUser.state = 'idle';
            currentUser.targetUser = null;
            currentUser.isInitiator = false;
            currentUser.webrtcInitiated = false;
            
            // Подключаемся к WebSocket серверам
            try {
                await connectCallsWebSocket();
                } catch (error) {
                currentUser.log(`❌ Ошибка подключения к WebSocket: ${error.message}`, 'error');
                return;
            }
            
            // Обновляем UI
            updateUI();
            
            // Показываем систему друзей
            showFriendsSection();
            
            // Загружаем сообщения из localStorage
            loadChatMessagesFromStorage();
            
            currentUser.log(`📹 Камера и микрофон будут запущены при звонке`, 'info');
            
            currentUser.log(`🚀 Пользователь ${currentUser.id} готов к звонкам`, 'success');
        }
        
        // Функция переключения табов
        async function switchTab(tabName) {
            // Убираем активный класс со всех табов
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            
            // Скрываем все панели
            document.querySelectorAll('.tab-panel').forEach(panel => panel.style.display = 'none');
            
            // Активируем выбранный таб
            event.target.classList.add('active');
            
            // Показываем соответствующую панель
            if (tabName === 'friends') {
                document.getElementById('friendsTab').style.display = 'block';
                loadFriendsData();
            } else if (tabName === 'search') {
                document.getElementById('searchTab').style.display = 'block';
            } else if (tabName === 'requests') {
                document.getElementById('requestsTab').style.display = 'block';
                await loadFriendsData();
            } else if (tabName === 'invitations') {
                document.getElementById('invitationsTab').style.display = 'block';
                loadFriendsData();
            }
        }


        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', async function() {
            // Инициализируем IndexedDB
            await initMessageDB();
            
            // Инициализируем систему удаления сообщений
            initDeleteSystem();
            
            // Очищаем старые данные localStorage
            clearOldLocalStorage();
            
            // Пытаемся восстановить данные пользователя
            if (!restoreUserData()) {
                currentUser.log('🔐 Войдите в систему', 'info');
            } else {
                // Загружаем непрочитанные сообщения
                loadUnreadMessages();
                
                // Запускаем мониторинг очередей
                startQueueMonitoring();
                
                // Если чат уже открыт, загружаем историю с применением команд удаления
                console.log(`🔍 Проверка currentChatFriend при инициализации:`, currentChatFriend);
                if (currentChatFriend) {
                    console.log(`🔍 При инициализации загружаем историю для ${currentChatFriend}`);
                    loadChatHistory(currentChatFriend);
                } else {
                    console.log(`🔍 currentChatFriend не установлен при инициализации`);
                }
            }
        });
        
        // Модальное окно для запроса разрешения на файловое хранение
        function showFileStoragePermissionModal() {
            // Создаем модальное окно
            const modal = document.createElement('div');
            modal.id = 'fileStorageModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">📁</div>
                    <h2 style="margin: 0 0 15px 0; color: #333;">Файловое хранение сообщений</h2>
                    <p style="color: #666; line-height: 1.5; margin-bottom: 25px;">
                        Для оптимальной работы приложения мы рекомендуем сохранять историю сообщений в файл на вашем устройстве.<br><br>
                        <strong>Файл будет создан в папке Downloads:</strong><br>
                        • <code>lizaapp_messages.json</code><br>
                        • Доступен на любом устройстве<br>
                        • Автоматическое резервное копирование<br><br>
                        <strong>Преимущества:</strong><br>
                        • Быстрая загрузка приложения<br>
                        • Неограниченная история сообщений<br>
                        • Данные остаются на вашем устройстве
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="acceptFileStorage()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">✅ Разрешить</button>
                        <button onclick="declineFileStorage()" style="
                            background: #f44336;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">❌ Отказаться</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Принятие файлового хранения
        async function acceptFileStorage() {
            const success = await initializeFileStorage();
            if (success) {
                // Отмечаем, что первый запуск завершен
                localStorage.setItem('lizaapp_first_run_completed', 'true');
                
                // Закрываем модальное окно
                const modal = document.getElementById('fileStorageModal');
                if (modal) {
                    modal.remove();
                }
                
                // Обновляем кнопку
                updateFileStorageButton();
                
                currentUser.log('✅ Файловое хранение активировано!', 'success');
            } else {
                // Если не удалось создать файл, показываем предупреждение
                currentUser.log('⚠️ Не удалось создать файл. Используется только localStorage', 'warning');
                
                // Закрываем модальное окно
                const modal = document.getElementById('fileStorageModal');
                if (modal) {
                    modal.remove();
                }
                
                // Отмечаем, что первый запуск завершен
                localStorage.setItem('lizaapp_first_run_completed', 'true');
            }
        }
        
        // Отказ от файлового хранения
        function declineFileStorage() {
            // Отмечаем, что первый запуск завершен
            localStorage.setItem('lizaapp_first_run_completed', 'true');
            
            // Закрываем модальное окно
            const modal = document.getElementById('fileStorageModal');
            if (modal) {
                modal.remove();
            }
            
            // Обновляем кнопку
            updateFileStorageButton();
            
            currentUser.log('⚠️ Файловое хранение отключено. Можно включить позже через кнопку "📁 Файлы"', 'warning');
        }
        
        // Обновление кнопки файлового хранения
        function updateFileStorageButton() {
            const btn = document.getElementById('fileStorageBtn');
            if (btn) {
                if (fileStorageEnabled) {
                    btn.textContent = '✅ Файлы';
                    btn.style.background = '#4CAF50';
                    btn.title = 'Файловое хранение активно';
                } else {
                    btn.textContent = '📁 Файлы';
                    btn.style.background = '#2196F3';
                    btn.title = 'Нажмите для включения файлового хранения';
                }
            }
        }
        
        // Смена камеры (фронтальная/основная)
        async function switchCamera() {
            if (!currentUser.peerConnection || !currentUser.localStream) {
                currentUser.log('❌ Нет активного соединения для смены камеры', 'error');
                return;
            }
            
            try {
                currentUser.log('🔄 Переключение камеры...', 'info');
                
                // Сохраняем состояние микрофона перед переключением
                const wasMicrophoneMuted = isVideoMicrophoneMuted;
                console.log('🎤 [SWITCH-CAM] Состояние микрофона перед переключением:', wasMicrophoneMuted);
                
                // Останавливаем текущий поток
                currentUser.localStream.getTracks().forEach(track => track.stop());
                
                // Получаем новый поток с другой камеры
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: currentUser.isFrontCamera ? 'environment' : 'user'
                    },
                    audio: true
                });
                
                // Обновляем флаг камеры
                currentUser.isFrontCamera = !currentUser.isFrontCamera;
                
                // Заменяем треки в существующем соединении
                const videoTrack = newStream.getVideoTracks()[0];
                const audioTrack = newStream.getAudioTracks()[0];
                
                // Заменяем видео трек
                const videoSender = currentUser.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(videoTrack);
                }
                
                // Заменяем аудио трек
                const audioSender = currentUser.peerConnection.getSenders().find(s => s.track && s.track.kind === 'audio');
                if (audioSender) {
                    await audioSender.replaceTrack(audioTrack);
                }
                
                // Восстанавливаем состояние микрофона
                if (wasMicrophoneMuted) {
                    audioTrack.enabled = false;
                    console.log('🔇 [SWITCH-CAM] Микрофон отключен после переключения камеры');
                } else {
                    audioTrack.enabled = true;
                    console.log('🎤 [SWITCH-CAM] Микрофон включен после переключения камеры');
                }
                
                // Обновляем локальное видео (только видео, без аудио)
                const localVideoStream = createLocalVideoStream(newStream);
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = localVideoStream;
                
                // Явно отключаем аудио для локального видео
                localVideo.muted = true;
                localVideo.volume = 0;
                localVideo.setAttribute('muted', 'true');
                
                currentUser.localStream = newStream;
                
                // Обновляем состояние кнопки микрофона
                const micBtn = document.getElementById('videoMicrophoneBtn');
                const micIcon = micBtn.querySelector('i');
                if (wasMicrophoneMuted) {
                    micIcon.className = 'fas fa-microphone-slash';
                    micBtn.classList.add('muted');
                    micBtn.classList.remove('active');
                } else {
                    micIcon.className = 'fas fa-microphone';
                    micBtn.classList.remove('muted');
                    micBtn.classList.add('active');
                }
                
                currentUser.log(`📹 Камера переключена на ${currentUser.isFrontCamera ? 'фронтальную' : 'основную'}`, 'success');
                
            } catch (error) {
                currentUser.log(`❌ Ошибка переключения камеры: ${error.message}`, 'error');
            }
        }

        // ===== ПОИСК ПО ДРУЗЬЯМ =====
        
        // Фильтрация друзей по поисковому запросу
        async function filterFriends() {
            const searchInput = document.getElementById('friendsSearchInput');
            let searchQuery = searchInput.value.toLowerCase().trim();
            
            // Убираем символ + из поискового запроса
            searchQuery = searchQuery.replace(/\+/g, '');
            
            const friendsList = document.getElementById('friendsList');
            
            if (!searchQuery) {
                // Если поиск пустой, показываем всех друзей
                updateFriendsList();
                return;
            }
            
            currentUser.log(`🔍 Поиск по друзьям: "${searchQuery}"`, 'info');
            
            try {
                // Получаем всех друзей
                const allFriends = friendsData.friends || [];
                const filteredFriends = [];
                
                for (const friend of allFriends) {
                    let matches = false;
                    
                    // Поиск по номеру телефона (упрощенная логика)
                    if (friend.username) {
                        const phoneNumber = friend.username;
                        
                        // Убираем + из номера для сравнения
                        const phoneWithoutPlus = phoneNumber.replace(/\+/g, '');
                        
                        // Поиск по номеру без +
                        if (phoneWithoutPlus.includes(searchQuery)) {
                            matches = true;
                        }
                        
                        // Поиск по последним цифрам (без кода страны)
                        if (!matches) {
                            const lastDigits = phoneWithoutPlus.replace(/^7/, ''); // Убираем 7
                            if (lastDigits.includes(searchQuery)) {
                                matches = true;
                            }
                        }
                    }
                    
                    // Поиск по имени из записной книжки
                    if (!matches && friend.username) {
                        try {
                            const contactName = await getContactName(friend.username);
                            if (contactName && contactName.toLowerCase().includes(searchQuery)) {
                                matches = true;
                            }
                        } catch (error) {
                            currentUser.log(`⚠️ Ошибка получения имени контакта для ${friend.username}: ${error.message}`, 'warn');
                        }
                    }
                    
                    if (matches) {
                        filteredFriends.push(friend);
                    }
                }
                
                // Отображаем отфильтрованных друзей
                displayFilteredFriends(filteredFriends, searchQuery);
                
            } catch (error) {
                currentUser.log(`❌ Ошибка фильтрации друзей: ${error.message}`, 'error');
                friendsList.innerHTML = '<p style="color: red; text-align: center;">Ошибка поиска</p>';
            }
        }
        
        // Отображение отфильтрованных друзей
        async function displayFilteredFriends(friends, searchQuery) {
            const friendsList = document.getElementById('friendsList');
            
            if (friends.length === 0) {
                friendsList.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                        <p>По запросу "<strong>${searchQuery}</strong>" ничего не найдено</p>
                        <p style="font-size: 12px; margin-top: 10px;">Попробуйте изменить поисковый запрос</p>
                    </div>
                `;
                return;
            }
            
            // Используем тот же стиль, что и обычный список друзей
            const friendsHtml = friends.map(friend => {
                const unreadCount = unreadMessages[friend.username] || 0;
                const unreadIndicator = unreadCount > 0 ? `<span class="unread-indicator">${unreadCount}</span>` : '';
                
                return `
                    <div class="friend-item" data-friend="${friend.username}" onclick="openChat('${friend.username}')" style="cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='white'">
                        <div class="username" style="position: relative;">
                            <div class="friend-avatar" style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: #ddd; margin-right: 8px; vertical-align: middle; text-align: center; line-height: 20px; font-size: 12px; color: #666;" data-user-id="${friend.contact_user_id}">
                                <i class="fas fa-user" style="font-size: 10px;"></i>
                            </div>
                            <span class="friend-display-name" data-phone="${friend.username}">${friend.username}</span>${unreadIndicator}
                        </div>
                        <div class="actions" onclick="event.stopPropagation()">
                            <div class="call-buttons">
                                <button onclick="callFriend('${friend.username}')" class="btn-primary btn-small" id="callBtn_${friend.username}"><i class="fas fa-video"></i> Видеозвонок</button>
                                <button onclick="callFriendAudio('${friend.username}')" class="btn-secondary btn-small" id="audioCallBtn_${friend.username}"><i class="fas fa-microphone"></i> Аудиозвонок</button>
                            </div>
                            <button onclick="endCall()" class="btn-danger btn-small" id="disconnectBtn_${friend.username}" style="display: none;"><i class="fas fa-phone-slash"></i> Завершить</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            friendsList.innerHTML = friendsHtml;
            
            // Загружаем аватары для отфильтрованных друзей
            loadFilteredFriendsAvatars(friends);
        }
        
        // Подсветка найденного текста
        function highlightSearchText(text, searchQuery) {
            if (!searchQuery) return text;
            
            const regex = new RegExp(`(${searchQuery})`, 'gi');
            return text.replace(regex, '<mark style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</mark>');
        }
        
        // Загрузка аватаров для отфильтрованных друзей
        async function loadFilteredFriendsAvatars(friends) {
            const friendAvatars = document.querySelectorAll('.friend-avatar');
            
            for (let avatarDiv of friendAvatars) {
                const userId = avatarDiv.getAttribute('data-user-id');
                if (!userId) continue;

                try {
                    // Получаем username из данных друзей
                    const friend = friends.find(f => f.contact_user_id == userId);
                    if (friend) {
                        console.log(`🔄 Загружаем аватар для друга ${friend.username} (ID: ${userId})`);
                        // Используем кэшированный аватар
                        const avatarData = await getCachedAvatar(userId, friend.username);
                        if (avatarData) {
                            avatarDiv.innerHTML = `<img src="${avatarData}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                            console.log(`✅ Аватар для ${friend.username} отображен`);
                        } else {
                            console.log(`⚠️ Аватар для ${friend.username} не найден в кэше`);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Ошибка загрузки аватара для ID ${userId}:`, error);
                }
            }
        }
        
        // Защита от повторной загрузки аватаров
        const loadingAvatars = new Set();
        
        // Загрузка аватара друга в заголовок чата
        async function loadChatFriendAvatar(friendUsername) {
            try {
                // Проверяем, не загружается ли уже аватар для этого пользователя
                if (loadingAvatars.has(friendUsername)) {
                    console.log(`⚠️ Аватар для ${friendUsername} уже загружается, пропускаем`);
                    return;
                }
                
                loadingAvatars.add(friendUsername);
                
                // Находим друга в списке друзей
                const friend = friendsData.friends.find(f => f.username === friendUsername);
                if (!friend) {
                    console.log(`⚠️ Друг ${friendUsername} не найден в списке друзей`);
                    loadingAvatars.delete(friendUsername);
                    return;
                }
                
                console.log(`🖼️ Загружаем аватар для чата с ${friendUsername} (ID: ${friend.contact_user_id})`);
                
                // Получаем аватар из кэша
                const avatarData = await getCachedAvatar(friend.contact_user_id, friendUsername);
                
                const avatarElement = document.getElementById('chatFriendAvatar');
                if (avatarElement) {
                    if (avatarData) {
                        avatarElement.innerHTML = `<img src="${avatarData}" alt="Аватар ${friendUsername}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                        console.log(`✅ Аватар для чата с ${friendUsername} загружен`);
                    } else {
                        avatarElement.innerHTML = `<i class="fas fa-user"></i>`;
                        console.log(`⚠️ Аватар для чата с ${friendUsername} не найден, показываем placeholder`);
                    }
                }
                
                loadingAvatars.delete(friendUsername);
            } catch (error) {
                console.error(`❌ Ошибка загрузки аватара для чата с ${friendUsername}:`, error);
                loadingAvatars.delete(friendUsername);
            }
        }

        // Загрузка статуса собеседника из БД
        async function loadChatFriendStatus(friendUsername) {
            try {
                console.log(`🔄 Загружаем статус собеседника для ${friendUsername}...`);
                
                // Получаем данные пользователя с сервера
                const response = await fetch(`avtr/api/get_user_data.php?username=${encodeURIComponent(friendUsername)}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const userData = await response.json();
                console.log(`📊 Данные пользователя ${friendUsername}:`, userData);
                
                if (userData.success && userData.user) {
                    let status = userData.user.user_status || 'В сети';
                    
                    // Обрезаем слишком длинные статусы (более 50 символов)
                    if (status.length > 50) {
                        status = status.substring(0, 47) + '...';
                    }
                    
                    console.log(`✅ Статус ${friendUsername}: ${status}`);
                    
                    // Обновляем статус в заголовке чата
                    const statusElement = document.getElementById('chatFriendStatus');
                    if (statusElement) {
                        statusElement.textContent = status;
                    }
                } else {
                    console.log(`❌ Не удалось получить статус для ${friendUsername}`);
                    const statusElement = document.getElementById('chatFriendStatus');
                    if (statusElement) {
                        statusElement.textContent = 'Соединение установлено';
                    }
                }
                
            } catch (error) {
                console.error(`❌ Ошибка загрузки статуса собеседника для ${friendUsername}:`, error);
                const statusElement = document.getElementById('chatFriendStatus');
                if (statusElement) {
                    statusElement.textContent = 'Соединение установлено';
                }
            }
        }

        
