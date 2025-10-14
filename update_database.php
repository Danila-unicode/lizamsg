<?php
// Скрипт для добавления поля phone_verified в таблицу users
echo "🔄 Обновление базы данных...\n";

// Подключение к базе данных
$host = 'localhost';
$dbname = 'lizaapp_dsfg12df1121q5sd2694';
$username_db = 'lizaapp_1w1d2sd3268';
$password_db = 'aM1oX3yE0j';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username_db, $password_db);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Подключение к базе данных успешно\n";
    
    // Проверяем, существует ли уже поле phone_verified
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'phone_verified'");
    $columnExists = $stmt->fetch();
    
    if ($columnExists) {
        echo "⚠️  Поле phone_verified уже существует\n";
    } else {
        // Добавляем поле phone_verified
        $sql = "ALTER TABLE users ADD COLUMN phone_verified TINYINT(1) DEFAULT 0";
        $pdo->exec($sql);
        echo "✅ Поле phone_verified успешно добавлено\n";
    }
    
    // Показываем структуру таблицы
    echo "\n📋 Структура таблицы users:\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']}) - {$column['Null']} - {$column['Default']}\n";
    }
    
    echo "\n🎉 Обновление базы данных завершено!\n";
    
} catch(PDOException $e) {
    echo "❌ Ошибка: " . $e->getMessage() . "\n";
}
?>
