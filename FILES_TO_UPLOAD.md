# 📁 Файлы для загрузки на хостинг

## ✅ Обновленные файлы с HTTPS поддержкой

### 🎯 Основные WebRTC приложения:
- `webrtc-test-simple.html` - Простой тест WebRTC с HTTPS сигналингом
- `contacts-app.html` - Основное приложение контактов
- `contacts-app3.html` - Улучшенная версия контактов
- `contacts-app-improved.html` - Дополнительно улучшенная версия
- `contacts-app1.html` - Альтернативная версия контактов

### 🧪 Тестовые страницы:
- `webrtc-simple-test.html` - Простой тест WebRTC
- `simple-signal-test.html` - Тест сигналинга
- `simple-ping-pong-test.html` - Тест ping-pong
- `debug-signals.html` - Отладка сигналов
- `test-server-actions.html` - Тест действий сервера

### 🎥 Демо страницы:
- `webrtc-demo-fixed.html` - Исправленное демо
- `webrtc-demo-cloud.html` - Облачное демо
- `webrtc-demo.html` - Основное демо

### 🔧 Диагностические страницы:
- `diagnostic.html` - Диагностика
- `test-turn.html` - Тест TURN сервера
- `webrtc-test.html` - Общий тест WebRTC

### 📂 JavaScript файлы:
- `assets/js/webrtc.js` - Основной WebRTC код
- `assets/js/webrtc-http.js` - HTTP сигналинг
- `assets/js/websocket-client.js` - WebSocket клиент
- `assets/js/websocket-client-wss-vkcloud.js` - WSS клиент

## 🔄 Что изменилось:

### ✅ Обновлено:
- **Сигналинг URL:** `https://functions.yandexcloud.net/d4ec0rusp5blvc9pucd4` → `https://lizamsg.ru:3000/api/signaling`
- **WebSocket URL:** `wss://62.84.126.200:8080` → `wss://lizamsg.ru:8080`
- **WebSocket URL:** `wss://62.84.126.200:3479` → `wss://lizamsg.ru:8080`

### 🔒 Осталось без изменений (правильно):
- **TURN серверы:** `turn:62.84.126.200:3478` и `turns:62.84.126.200:3479` (используют VK Cloud)

## 🚀 Готово к загрузке!

Все файлы обновлены и готовы для загрузки на ваш хостинг. HTTPS WebSocket сервер работает на `lizamsg.ru:8080`, а HTTPS API на `lizamsg.ru:3000`.

## 📋 Инструкция по загрузке:

1. Загрузите все перечисленные HTML файлы в корень хостинга
2. Загрузите папку `assets/js/` со всеми JavaScript файлами
3. Убедитесь, что структура папок сохранена
4. Протестируйте основную страницу: `webrtc-test-simple.html`

## 🎯 Рекомендуемые страницы для тестирования:
1. `webrtc-test-simple.html` - основной тест
2. `contacts-app.html` - основное приложение
3. `simple-signal-test.html` - тест сигналинга
