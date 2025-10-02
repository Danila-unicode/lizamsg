<?php
session_start();

function registerUser($phone, $password) {
    $db = new Database();
    $conn = $db->getConnection();
    
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    $query = "INSERT INTO users (phone, password_hash) VALUES (:phone, :password_hash)";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":password_hash", $password_hash);
        return $stmt->execute();
    } catch(PDOException $e) {
        return false;
    }
}

function loginUser($phone, $password) {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "SELECT id, phone, password_hash FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":phone", $phone);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if(password_verify($password, $row['password_hash'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['user_phone'] = $row['phone'];
            return true;
        }
    }
    return false;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUser() {
    if(!isLoggedIn()) return null;
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "SELECT id, phone FROM users WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":id", $_SESSION['user_id']);
    $stmt->execute();
    
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function logout() {
    session_destroy();
}
?>
