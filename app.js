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
            // Логика для лайков (если нужно сохранять на сервере, потребуется дополнительный endpoint)
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

// Функция для загрузки комментариев
async function fetchComments() {
    try {
        const response = await fetch(`${API_URL}/${PERSONAL_KEY}/comments`);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке комментариев');
        }
        
        const data = await response.json();
        return data.comments;
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить комментарии');
        return [];
    }
}

// Функция для добавления нового комментария
async function addComment(name, text) {
    try {
        const response = await fetch(`${API_URL}/${PERSONAL_KEY}/comments`, {
            method: 'POST',
            // Убрали заголовок Content-Type
            body: JSON.stringify({
                name: name,
                text: text
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(data.error || 'Ошибка валидации');
            } else {
                throw new Error('Ошибка сервера');
            }
        }
        
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

// Функция для обновления комментариев
async function refreshComments() {
    const comments = await fetchComments();
    renderComments(comments);
}

// Обработчик отправки формы
addForm.addEventListener('submit', async (event) => {
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
    
    try {
        await addComment(name, text);
        
        // Очищаем форму
        nameInput.value = '';
        textInput.value = '';
        
        // Обновляем список комментариев
        await refreshComments();
        
    } catch (error) {
        alert(`Ошибка при добавлении комментария: ${error.message}`);
    } finally {
        // Разблокируем кнопку
        submitButton.disabled = false;
        submitButton.textContent = 'Написать';
    }
});

// Инициализация приложения
async function initApp() {
    try {
        await refreshComments();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

// Запускаем приложение
initApp();