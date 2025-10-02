<?php
require_once 'config/database.php';

$message = '';

if($_POST) {
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if(empty($phone) || empty($password)) {
        $message = 'Заполните все поля';
    } else {
        try {
            $db = new Database();
            $conn = $db->getConnection();
            
            $query = "SELECT id, phone, password_hash FROM users WHERE phone = :phone";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(":phone", $phone);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if(password_verify($password, $row['password_hash'])) {
                    session_start();
                    $_SESSION['user_id'] = $row['id'];
                    $_SESSION['user_phone'] = $row['phone'];
                    
                    header('Location: index.php');
                    exit();
                } else {
                    $message = 'Неверный пароль';
                }
            } else {
                $message = 'Пользователь не найден';
            }
        } catch(PDOException $e) {
            $message = 'Ошибка: ' . $e->getMessage();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход - WebRTC Звонки</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <div class="auth-form">
            <h1>Вход в систему</h1>
            
            <?php if($message): ?>
                <div class="message error"><?php echo htmlspecialchars($message); ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label for="phone">Номер телефона:</label>
                    <input type="tel" id="phone" name="phone" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Пароль:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Войти</button>
            </form>
            
            <p>Нет аккаунта? <a href="register.php">Зарегистрироваться</a></p>
        </div>
    </div>
</body>
</html>