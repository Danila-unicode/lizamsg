<?php
require_once 'auth.php';

function sendInvitation($fromUserId, $toPhone) {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "SELECT id FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":phone", $toPhone);
    $stmt->execute();
    
    if($stmt->rowCount() == 0) {
        return ['success' => false, 'message' => 'Пользователь не найден'];
    }
    
    $toUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $toUserId = $toUser['id'];
    
    if($fromUserId == $toUserId) {
        return ['success' => false, 'message' => 'Нельзя добавить самого себя'];
    }
    
    $query = "SELECT id FROM contacts WHERE user_id = :user_id AND contact_id = :contact_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $fromUserId);
    $stmt->bindParam(":contact_id", $toUserId);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        return ['success' => false, 'message' => 'Контакт уже существует'];
    }
    
    $query = "INSERT INTO contacts (user_id, contact_id, status) VALUES (:user_id, :contact_id, 'pending')";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $fromUserId);
    $stmt->bindParam(":contact_id", $toUserId);
    
    if($stmt->execute()) {
        return ['success' => true, 'message' => 'Приглашение отправлено'];
    }
    
    return ['success' => false, 'message' => 'Ошибка при отправке приглашения'];
}

function acceptInvitation($userId, $contactId) {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "UPDATE contacts SET status = 'accepted' WHERE user_id = :contact_id AND contact_id = :user_id AND status = 'pending'";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->bindParam(":contact_id", $contactId);
    
    if($stmt->execute() && $stmt->rowCount() > 0) {
        $query = "INSERT INTO contacts (user_id, contact_id, status) VALUES (:user_id, :contact_id, 'accepted')";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":contact_id", $contactId);
        $stmt->execute();
        
        return true;
    }
    
    return false;
}

function getTrustedContacts($userId) {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "SELECT u.id, u.phone FROM users u 
              INNER JOIN contacts c ON u.id = c.contact_id 
              WHERE c.user_id = :user_id AND c.status = 'accepted'";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getPendingInvitations($userId) {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "SELECT u.id, u.phone FROM users u 
              INNER JOIN contacts c ON u.id = c.user_id 
              WHERE c.contact_id = :user_id AND c.status = 'pending'";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
