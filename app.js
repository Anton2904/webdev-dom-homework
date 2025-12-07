// Конфигурация API
const API_URL = 'https://wedev-api.sky.pro/api/v1';
const PERSONAL_KEY = 'Антон Манякин'; 

// Элементы DOM
const commentsList = document.querySelector('.comments');
const addForm = document.querySelector('.add-form');
const nameInput = document.querySelector('.add-form-name');
const textInput = document.querySelector('.add-form-text');
const submitButton = document.querySelector('.add-form-button');
const quoteIndicator = document.getElementById('quote-indicator');

// Переменные для хранения данных формы
let currentFormData = {
    name: '',
    text: ''
};

// Функция для экранирования HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Функция для показа/скрытия загрузки
function toggleLoading(show) {
    if (show) {
        commentsList.innerHTML = '<div class="loading">Комментарии загружаются...</div>';
    }
}

// Функция для показа/скрытия индикатора добавления
function toggleAddingIndicator(show, text = '') {
    if (show) {
        quoteIndicator.style.display = 'block';
        quoteIndicator.textContent = text;
    } else {
        quoteIndicator.style.display = 'none';
        quoteIndicator.textContent = '';
    }
}

// Функция для блокировки/разблокировки формы
function toggleFormDisabled(disabled) {
    nameInput.disabled = disabled;
    textInput.disabled = disabled;
    submitButton.disabled = disabled;
    
    if (disabled) {
        submitButton.textContent = 'Добавляется...';
    } else {
        submitButton.textContent = 'Написать';
    }
}

// Функция для сохранения данных формы
function saveFormData() {
    currentFormData = {
        name: nameInput.value,
        text: textInput.value
    };
}

// Функция для восстановления данных формы
function restoreFormData() {
    nameInput.value = currentFormData.name;
    textInput.value = currentFormData.text;
}

// Функция для рендеринга комментариев
function renderComments(comments) {
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">Пока нет комментариев</div>';
        return;
    }
    
    const commentsHTML = comments.map(comment => `
        <li class="comment">
            <div class="comment-header">
                <div>${escapeHtml(comment.author.name)}</div>
                <div>${formatDate(comment.date)}</div>
            </div>
            <div class="comment-body">
                <div class="comment-text">
                    ${escapeHtml(comment.text)}
                </div>
            </div>
            <div class="comment-footer">
                <div class="likes">
                    <span class="likes-counter">${comment.likes}</span>
                    <button class="like-button ${comment.isLiked ? '-active-like' : ''}" data-id="${comment.id}"></button>
                </div>
            </div>
        </li>
    `).join('');
    
    commentsList.innerHTML = commentsHTML;
    
    // Добавляем обработчики для лайков
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', () => {
            const counter = button.previousElementSibling;
            const isActive = button.classList.contains('-active-like');
            
            if (isActive) {
                button.classList.remove('-active-like');
                counter.textContent = parseInt(counter.textContent) - 1;
            } else {
                button.classList.add('-active-like');
                counter.textContent = parseInt(counter.textContent) + 1;
            }
        });
    });
}

// Улучшенная функция для получения списка комментариев с обработкой ошибок
function getCommentsList() {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments`)
        .then(response => {
            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error('Серверная ошибка. Пожалуйста, попробуйте позже.');
                } else {
                    throw new Error('Ошибка при загрузке комментариев');
                }
            }
            return response.json();
        })
        .then(data => {
            return data.comments;
        })
        .catch(error => {
            // Проверяем, является ли ошибка сетевой
            if (error.message === 'Failed to fetch') {
                throw new Error('Проблемы с интернет-соединением. Проверьте подключение к сети.');
            }
            throw error;
        });
}

// Функция для загрузки комментариев (только для первой загрузки)
function fetchInitialComments() {
    toggleLoading(true);
    
    return getCommentsList()
        .catch(error => {
            console.error('Ошибка:', error);
            commentsList.innerHTML = `<div class="error">${error.message}</div>`;
            return [];
        });
}

// Функция для обновления комментариев (без показа загрузки)
function refreshComments() {
    return getCommentsList()
        .then(comments => {
            renderComments(comments);
            return comments;
        })
        .catch(error => {
            console.error('Ошибка:', error);
            commentsList.innerHTML = `<div class="error">${error.message}</div>`;
            return [];
        });
}

// Улучшенная функция для добавления нового комментария с обработкой ошибок
function addComment(name, text, forceError = false) {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments`, {
        method: 'POST',
        body: JSON.stringify({
            name: name,
            text: text,
            forceError: forceError // Добавляем параметр для тестирования ошибок
        })
    })
    .then(response => {
        return response.json().then(data => {
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(data.error || 'Ошибка валидации: проверьте введенные данные');
                } else if (response.status >= 500) {
                    throw new Error('Серверная ошибка. Пожалуйста, попробуйте позже.');
                } else {
                    throw new Error('Ошибка сервера');
                }
            }
            return data;
        });
    })
    .catch(error => {
        // Проверяем, является ли ошибка сетевой
        if (error.message === 'Failed to fetch') {
            throw new Error('Проблемы с интернет-соединением. Проверьте подключение к сети.');
        }
        throw error;
    });
}

// Обработчик отправки формы
addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    // Валидация
    if (!name || !text) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    if (name.length < 3) {
        alert('Имя должно содержать хотя бы 3 символа');
        return;
    }
    
    if (text.length < 3) {
        alert('Текст комментария должен содержать хотя бы 3 символа');
        return;
    }
    
    // Сохраняем данные формы перед отправкой
    saveFormData();
    
    // Показываем индикатор и блокируем форму
    toggleAddingIndicator(true, 'Комментарий добавляется...');
    toggleFormDisabled(true);
    
    // Для тестирования: в 50% случаев добавляем forceError: true
    const forceError = Math.random() > 0.5;
    
    addComment(name, text, forceError)
        .then(() => {
            // Очищаем форму только при успешной отправке
            nameInput.value = '';
            textInput.value = '';
            currentFormData = { name: '', text: '' };
            
            // Обновляем список комментариев без показа загрузки
            return refreshComments();
        })
        .catch(error => {
            // Восстанавливаем данные формы при ошибке
            restoreFormData();
            alert(`Ошибка при добавлении комментария: ${error.message}`);
        })
        .finally(() => {
            // Скрываем индикатор и разблокируем форму
            toggleAddingIndicator(false);
            toggleFormDisabled(false);
        });
});

// Обработчики для сохранения данных формы при вводе
nameInput.addEventListener('input', saveFormData);
textInput.addEventListener('input', saveFormData);

// Инициализация приложения
function initApp() {
    return fetchInitialComments()
        .then(comments => {
            renderComments(comments);
            return comments;
        })
        .catch(error => {
            console.error('Ошибка инициализации:', error);
        });
}

// Запускаем приложение
initApp();