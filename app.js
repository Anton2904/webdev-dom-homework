// Конфигурация API
const API_URL = 'https://wedev-api.sky.pro/api/v1';
const PERSONAL_KEY = 'ваше-имя-фамилия'; // Замените на ваше имя и фамилию

// Элементы DOM
const commentsList = document.querySelector('.comments');
const addForm = document.querySelector('.add-form');
const nameInput = document.querySelector('.add-form-name');
const textInput = document.querySelector('.add-form-text');
const submitButton = document.querySelector('.add-form-button');

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

// Функция для рендеринга комментариев
function renderComments(comments) {
    const commentsHTML = comments.map(comment => `
        <li class="comment">
            <div class="comment-header">
                <div>${comment.author.name}</div>
                <div>${formatDate(comment.date)}</div>
            </div>
            <div class="comment-body">
                <div class="comment-text">
                    ${comment.text}
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

// Функция для получения списка комментариев
function getCommentsList() {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке комментариев');
            }
            return response.json();
        })
        .then(data => {
            return data.comments;
        });
}

// Функция для загрузки комментариев
function fetchComments() {
    return getCommentsList()
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить комментарии');
            return [];
        });
}

// Функция для добавления нового комментария
function addComment(name, text) {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments`, {
        method: 'POST',
        body: JSON.stringify({
            name: name,
            text: text
        })
    })
    .then(response => {
        return response.json().then(data => {
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(data.error || 'Ошибка валидации');
                } else {
                    throw new Error('Ошибка сервера');
                }
            }
            return data;
        });
    });
}

// Функция для обновления комментариев
function refreshComments() {
    return fetchComments().then(comments => {
        renderComments(comments);
        return comments;
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
    
    // Блокируем кнопку во время отправки
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';
    
    addComment(name, text)
        .then(() => {
            // Очищаем форму
            nameInput.value = '';
            textInput.value = '';
            
            // Обновляем список комментариев
            return refreshComments();
        })
        .catch(error => {
            alert(`Ошибка при добавлении комментария: ${error.message}`);
        })
        .finally(() => {
            // Разблокируем кнопку
            submitButton.disabled = false;
            submitButton.textContent = 'Написать';
        });
});

// Инициализация приложения
function initApp() {
    return refreshComments()
        .catch(error => {
            console.error('Ошибка инициализации:', error);
        });
}

// Запускаем приложение
initApp();