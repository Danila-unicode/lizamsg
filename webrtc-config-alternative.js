// Альтернативная конфигурация WebRTC с множественными серверами

const alternativeConfigurations = [
    // Конфигурация 1: Основной TURN сервер VK Cloud
    {
        name: "VK Cloud TURN",
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { 
                urls: 'turn:109.120.183.43:3478', 
                username: 'webrtc', 
                credential: 'password123' 
            },
            { 
                urls: 'turns:109.120.183.43:3479', 
                username: 'webrtc', 
                credential: 'password123' 
            }
        ]
    },
    
    // Конфигурация 2: Альтернативные STUN серверы
    {
        name: "Multiple STUN",
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    },
    
    // Конфигурация 3: Только Google STUN
    {
        name: "Google STUN Only",
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    },
    
    // Конфигурация 4: Публичные TURN серверы
    {
        name: "Public TURN",
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { 
                urls: 'turn:openrelay.metered.ca:80', 
                username: 'openrelayproject', 
                credential: 'openrelayproject' 
            },
            { 
                urls: 'turn:openrelay.metered.ca:443', 
                username: 'openrelayproject', 
                credential: 'openrelayproject' 
            }
        ]
    }
];

// Функция для тестирования ICE серверов
async function testIceServers(config) {
    console.log(`🧪 Тестирование конфигурации: ${config.name}`);
    
    try {
        const pc = new RTCPeerConnection(config);
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                pc.close();
                resolve({ success: false, error: 'Timeout' });
            }, 5000);
            
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    clearTimeout(timeout);
                    pc.close();
                    resolve({ success: true, candidate: event.candidate });
                }
            };
            
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete') {
                    clearTimeout(timeout);
                    pc.close();
                    resolve({ success: true, message: 'ICE gathering complete' });
                }
            };
            
            // Создаем dummy offer для запуска ICE gathering
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
            }).catch(error => {
                clearTimeout(timeout);
                pc.close();
                resolve({ success: false, error: error.message });
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Функция для выбора лучшей конфигурации
async function selectBestConfiguration() {
    console.log('🔍 Поиск рабочей конфигурации ICE серверов...');
    
    for (let i = 0; i < alternativeConfigurations.length; i++) {
        const config = alternativeConfigurations[i];
        const result = await testIceServers(config);
        
        if (result.success) {
            console.log(`✅ Найдена рабочая конфигурация: ${config.name}`);
            return config;
        } else {
            console.log(`❌ Конфигурация ${config.name} не работает: ${result.error}`);
        }
    }
    
    console.log('⚠️ Ни одна конфигурация не работает, используем базовую');
    return alternativeConfigurations[2]; // Google STUN Only
}

// Экспорт функций
window.alternativeConfigurations = alternativeConfigurations;
window.testIceServers = testIceServers;
window.selectBestConfiguration = selectBestConfiguration;
