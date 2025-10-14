-- Добавление полей для личного кабинета пользователя
-- Поле для статуса пользователя
ALTER TABLE users ADD COLUMN user_status VARCHAR(255) DEFAULT 'Соединение установлено';

-- Поле для пути к аватару
ALTER TABLE users ADD COLUMN avatar_path VARCHAR(500) DEFAULT NULL;
