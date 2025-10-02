# Liza3 - Advanced P2P Messaging System

## 🚀 Version 1.0.0 - Advanced Message Deletion System

A comprehensive peer-to-peer messaging application with advanced message deletion capabilities, WebRTC video calls, and real-time communication.

## ✨ Key Features

### 🔐 Authentication & User Management
- User registration and login system
- Contact management with friend requests
- Secure session management

### 💬 Advanced Messaging System
- **Real-time P2P messaging** with WebSocket signaling
- **Advanced message deletion** with automatic P2P reconnection
- **Time-based deletion restrictions** (1 hour limit for global deletion)
- **Status-based message filtering** (deleted messages are hidden)
- **Message queuing system** for reliable delivery
- **File and emoji support**

### 📞 Video Calling
- **WebRTC video calls** with STUN/TURN servers
- **P2P connection management**
- **Automatic connection establishment**: ping → pong → offer → answer
- **Connection monitoring and retry mechanisms**

### 🗄️ Data Storage
- **IndexedDB** for local message storage
- **localStorage** for user data and settings
- **MySQL database** for server-side data
- **Hybrid storage approach** for optimal performance

## 🏗️ Architecture

### Frontend
- **Vanilla JavaScript** with modular architecture
- **WebRTC** for P2P connections
- **WebSocket** for signaling and real-time communication
- **IndexedDB** for local data persistence

### Backend
- **PHP REST API** for user management and authentication
- **MySQL database** for persistent data storage
- **WebSocket servers** for real-time communication
- **STUN/TURN servers** for NAT traversal

### Key Components
- `app.js` - Main application logic
- `del.js` - Advanced deletion system
- `api/` - PHP backend API
- `js/` - Modular JavaScript components

## 🔧 Technical Features

### Message Deletion System
- **Global deletion** with P2P reconnection
- **Automatic P2P establishment** when connection is lost
- **Status-based filtering** to hide deleted messages
- **Time-based restrictions** for message age
- **Enhanced error handling** with user notifications

### P2P Connection Management
- **Automatic reconnection** when P2P is lost
- **Connection retry mechanisms** with exponential backoff
- **Ping-pong monitoring** for connection health
- **Queue system** for reliable message delivery

### Data Persistence
- **Message status tracking** (sent, not_sent, cancelled, deleted)
- **Automatic history refresh** after operations
- **Cross-session persistence** with localStorage
- **Optimized storage** with file-based overflow

## 🚀 Getting Started

### Prerequisites
- Web server with PHP support
- MySQL database
- WebSocket server support
- Modern web browser with WebRTC support

### Installation
1. Clone the repository
2. Configure database connection in `config/database.php`
3. Set up WebSocket servers for signaling
4. Deploy to web server
5. Access the application through your web browser

### Configuration
- **Database**: Update credentials in `config/database.php`
- **WebSocket**: Configure servers in `app.js`
- **STUN/TURN**: Update server configurations as needed

## 📱 Usage

### Messaging
1. **Register/Login** to create an account
2. **Add contacts** by searching for users
3. **Send friend requests** to connect with others
4. **Start messaging** with P2P connections
5. **Delete messages** with advanced deletion system

### Video Calls
1. **Establish P2P connection** with contact
2. **Initiate video call** through the interface
3. **Enjoy high-quality video** with WebRTC
4. **Automatic connection management**

## 🔒 Security Features

- **P2P encryption** for message privacy
- **Session-based authentication**
- **Secure WebSocket connections**
- **Input validation** and sanitization

## 🐛 Debugging

### Console Logging
- Detailed logging for P2P connections
- Message delivery tracking
- Deletion process monitoring
- Error handling and reporting

### Debug Functions
- `debugLocalStorage()` - Check local storage
- `debugP2PConnections()` - Monitor P2P status
- `debugMessageQueues()` - Check message queues

## 📊 Performance

- **Optimized IndexedDB** usage for large message histories
- **Efficient P2P connection** management
- **Smart message queuing** for reliability
- **Automatic cleanup** of old data

## 🏷️ Version History

### v1.0.0-deletion-system
- Advanced message deletion system
- P2P reconnection mechanisms
- Status-based message filtering
- Enhanced error handling
- Modular deletion system

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

## 📄 License

Private project - All rights reserved.

---

**Built with ❤️ using WebRTC, WebSocket, PHP, and modern web technologies.**
