<?php
// Простой тест загрузки файла
echo "<h2>Простой тест загрузки файла</h2>";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "<h3>Данные POST запроса:</h3>";
    echo "<p>user_id: " . ($_POST['user_id'] ?? 'не указан') . "</p>";
    
    if (isset($_FILES['avatar'])) {
        echo "<h3>Информация о файле:</h3>";
        echo "<p>Имя файла: " . $_FILES['avatar']['name'] . "</p>";
        echo "<p>Размер: " . $_FILES['avatar']['size'] . " байт</p>";
        echo "<p>Тип: " . $_FILES['avatar']['type'] . "</p>";
        echo "<p>Временный файл: " . $_FILES['avatar']['tmp_name'] . "</p>";
        echo "<p>Ошибка: " . $_FILES['avatar']['error'] . "</p>";
        echo "<p>Временный файл существует: " . (file_exists($_FILES['avatar']['tmp_name']) ? 'да' : 'нет') . "</p>";
        
        if (file_exists($_FILES['avatar']['tmp_name'])) {
            echo "<p>Размер временного файла: " . filesize($_FILES['avatar']['tmp_name']) . " байт</p>";
        }
        
        // Сначала сохраняем в папку time
        $temp_file = '../avatars/time/temp_' . time() . '.jpg';
        $final_file = '../avatars/test_' . time() . '.jpg';
        
        echo "<h3>Попытка сохранения:</h3>";
        echo "<p>Временный файл: $temp_file</p>";
        echo "<p>Финальный файл: $final_file</p>";
        
        // Создаем папку time если не существует
        if (!is_dir('../avatars/time')) {
            mkdir('../avatars/time', 0755, true);
        }
        
        if (move_uploaded_file($_FILES['avatar']['tmp_name'], $temp_file)) {
            echo "<p style='color: green;'>✅ Временный файл сохранен</p>";
            
            if (file_exists($temp_file)) {
                echo "<p style='color: green;'>✅ Временный файл существует, размер: " . filesize($temp_file) . " байт</p>";
                
                // Теперь перемещаем в avatars
                if (rename($temp_file, $final_file)) {
                    echo "<p style='color: green;'>✅ Файл перемещен в avatars</p>";
                    if (file_exists($final_file)) {
                        echo "<p style='color: green;'>✅ Финальный файл создан, размер: " . filesize($final_file) . " байт</p>";
                    } else {
                        echo "<p style='color: red;'>❌ Финальный файл не найден</p>";
                    }
                } else {
                    echo "<p style='color: red;'>❌ Не удалось переместить файл</p>";
                }
            } else {
                echo "<p style='color: red;'>❌ Временный файл не найден</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ move_uploaded_file не сработал</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Файл не был загружен</p>";
    }
} else {
    echo "<form method='POST' enctype='multipart/form-data'>";
    echo "<p>Выберите файл для тестирования:</p>";
    echo "<input type='file' name='avatar' accept='image/*'><br><br>";
    echo "<input type='hidden' name='user_id' value='28'>";
    echo "<input type='submit' value='Загрузить файл'>";
    echo "</form>";
}
?>
