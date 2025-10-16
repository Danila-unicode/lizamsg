/**
 * Система счетчика заявок в друзья для LizaApp
 * Отображает красный кружок с количеством непрочитанных заявок
 */

class RequestsCounter {
    constructor() {
        this.counterElement = null;
        this.requestsTab = null;
    }
    
    /**
     * Инициализация счетчика
     */
    init() {
        this.requestsTab = document.querySelector('.tab[onclick="switchTab(\'requests\')"]');
    }
    
    /**
     * Обновление счетчика заявок
     * @param {number} count - Количество заявок
     */
    update(count = 0) {
        if (!this.requestsTab) {
            return;
        }
        
        // Удаляем существующий счетчик
        this.removeCounter();
        
        // Добавляем новый счетчик, если есть заявки
        if (count > 0) {
            this.createCounter(count);
        }
    }
    
    /**
     * Создание счетчика
     * @param {number} count - Количество заявок
     */
    createCounter(count) {
        this.counterElement = document.createElement('span');
        this.counterElement.className = 'requests-counter';
        this.counterElement.textContent = count;
        
        // Применяем стили
        this.counterElement.style.cssText = `
            background: #e74c3c !important;
            color: white !important;
            border-radius: 50% !important;
            padding: 1px 4px !important;
            font-size: 10px !important;
            font-weight: bold !important;
            margin-left: 4px !important;
            display: inline-block !important;
            min-width: 14px !important;
            text-align: center !important;
            line-height: 1.1 !important;
        `;
        
        // Добавляем в таб
        this.requestsTab.appendChild(this.counterElement);
    }
    
    /**
     * Удаление счетчика
     */
    removeCounter() {
        if (this.counterElement) {
            this.counterElement.remove();
            this.counterElement = null;
        }
    }
    
    /**
     * Получение текущего количества заявок
     * @returns {number} Количество заявок
     */
    getCurrentCount() {
        if (this.counterElement) {
            return parseInt(this.counterElement.textContent) || 0;
        }
        return 0;
    }
    
    /**
     * Увеличение счетчика на 1
     */
    increment() {
        const currentCount = this.getCurrentCount();
        this.update(currentCount + 1);
    }
    
    /**
     * Уменьшение счетчика на 1
     */
    decrement() {
        const currentCount = this.getCurrentCount();
        if (currentCount > 0) {
            this.update(currentCount - 1);
        }
    }
    
    /**
     * Сброс счетчика
     */
    reset() {
        this.update(0);
    }
    
    /**
     * Проверка, отображается ли счетчик
     * @returns {boolean} true если счетчик видим
     */
    isVisible() {
        return this.counterElement !== null && this.counterElement.parentNode !== null;
    }
    
    /**
     * Анимация появления счетчика
     */
    animateIn() {
        if (this.counterElement) {
            this.counterElement.style.transform = 'scale(0)';
            this.counterElement.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                this.counterElement.style.transform = 'scale(1)';
            }, 10);
        }
    }
    
    /**
     * Анимация исчезновения счетчика
     */
    animateOut() {
        if (this.counterElement) {
            this.counterElement.style.transform = 'scale(0)';
            this.counterElement.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                this.removeCounter();
            }, 300);
        }
    }
}

// Создаем глобальный экземпляр
window.requestsCounter = new RequestsCounter();

// Функции для совместимости с app.js
window.updateRequestsCounter = function() {
    // Получаем данные из глобальной переменной
    const friendsData = window.friendsData;
    
    if (friendsData && friendsData.requests) {
        const count = friendsData.requests.length;
        window.requestsCounter.update(count);
    } else {
        window.requestsCounter.update(0);
    }
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.requestsCounter.init();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RequestsCounter;
}
