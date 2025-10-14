<?php
session_start();

// Проверка авторизации
if (!isset($_SESSION['user_id'])) {
    header('Location: auth.html');
    exit();
}

require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Получаем данные пользователя
    $query = "SELECT id, phone FROM users WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":id", $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Получаем доверенные контакты
    $query = "SELECT u.id, u.phone FROM users u 
              INNER JOIN contacts c ON u.id = c.contact_id 
              WHERE c.user_id = :user_id AND c.status = 'accepted'";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    $stmt->execute();
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Получаем входящие приглашения
    $query = "SELECT u.id, u.phone FROM users u 
              INNER JOIN contacts c ON u.id = c.user_id 
              WHERE c.contact_id = :user_id AND c.status = 'pending'";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    $stmt->execute();
    $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} catch(PDOException $e) {
    $error = 'Ошибка базы данных: ' . $e->getMessage();
    $contacts = [];
    $invitations = [];
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebRTC Звонки</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>WebRTC Звонки</h1>
            <div class="user-info">
                <span>Пользователь: <?php echo htmlspecialchars($user['phone']); ?></span>
                <span id="connectionStatus" class="connection-status disconnected">Отключен</span>
                <a href="logout.php" class="logout-btn">Выйти</a>
            </div>
        </header>

        <main>
            <!-- Поиск пользователей -->
            <section class="search-section">
                <h2>Найти пользователя</h2>
                <div class="search-form">
                    <input type="text" id="searchPhone" placeholder="Введите номер телефона">
                    <button onclick="searchUser()">Найти</button>
                </div>
                <div id="searchResult"></div>
            </section>

            <!-- Доверенные контакты -->
            <section class="contacts-section">
                <h2>Доверенные контакты</h2>
                <?php if (empty($contacts)): ?>
                    <p>У вас пока нет доверенных контактов</p>
                <?php else: ?>
                    <div class="contacts-list">
                        <?php foreach ($contacts as $contact): ?>
                            <div class="contact-item">
                                <span><?php echo htmlspecialchars($contact['phone']); ?></span>
                                <button onclick="initiateCall(<?php echo $contact['id']; ?>)">Позвонить</button>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </section>

            <!-- Входящие приглашения -->
            <section class="invitations-section">
                <h2>Входящие приглашения</h2>
                <?php if (empty($invitations)): ?>
                    <p>Нет входящих приглашений</p>
                <?php else: ?>
                    <div class="invitations-list">
                        <?php foreach ($invitations as $invitation): ?>
                            <div class="invitation-item">
                                <span><?php echo htmlspecialchars($invitation['phone']); ?></span>
                                <button onclick="acceptInvitation(<?php echo $invitation['id']; ?>)">Принять</button>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </section>

            <!-- Видео звонок -->
            <section class="call-section" id="callSection" style="display: none;">
                <h2>Звонок</h2>
                <div class="video-container">
                    <div class="local-video">
                        <h3>Вы</h3>
                        <video id="localVideo" autoplay muted></video>
                    </div>
                    <div class="remote-video">
                        <h3>Собеседник</h3>
                        <video id="remoteVideo" autoplay></video>
                    </div>
                </div>
                <div class="call-controls">
                    <button onclick="endCall()" class="end-call-btn">Завершить звонок</button>
                </div>
            </section>
        </main>
    </div>

    <script>
        // Устанавливаем глобальную переменную с ID пользователя
        window.currentUserId = <?php echo $_SESSION['user_id']; ?>;
        window.currentUser = {
            id: <?php echo $_SESSION['user_id']; ?>,
            phone: '<?php echo htmlspecialchars($user['phone']); ?>'
        };
    </script>
    <script src="assets/js/webrtc-http.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
