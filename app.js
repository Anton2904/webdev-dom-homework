// Конфигурация API v2
const API_URL = 'https://wedev-api.sky.pro/api/v2';
const PERSONAL_KEY = 'Антон-Манякин'.replace(/\s+/g, '-'); // Автоматически заменяем пробелы на дефисы

// URL для авторизации
const USER_API_URL = 'https://wedev-api.sky.pro/api/user';

// Элементы DOM
const commentsList = document.querySelector('.comments');
const addForm = document.querySelector('.add-form');
const textInput = document.querySelector('.add-form-text');
const submitButton = document.querySelector('.add-form-button');
const quoteIndicator = document.getElementById('quote-indicator');

// Элементы для авторизации
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginInput = document.getElementById('login-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const authStatus = document.getElementById('auth-status');
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');

// Переменные для хранения данных
let token = null;
let currentUser = null;
let currentFormData = {
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
    textInput.disabled = disabled;
    submitButton.disabled = disabled;
    
    if (disabled) {
        submitButton.textContent = 'Добавляется...';
        submitButton.style.backgroundColor = '#cccccc';
    } else {
        submitButton.textContent = 'Написать';
        submitButton.style.backgroundColor = '#4CAF50';
    }
}

// Функция для сохранения данных формы
function saveFormData() {
    currentFormData = {
        text: textInput.value
    };
}

// Функция для восстановления данных формы
function restoreFormData() {
    textInput.value = currentFormData.text;
}

// Функция для обновления интерфейса авторизации
function updateAuthUI() {
    if (token && currentUser) {
        // Пользователь авторизован
        authContainer.style.display = 'none';
        mainContainer.style.display = 'block';
        userInfo.textContent = `Вы вошли как: ${currentUser.name} (${currentUser.login})`;
        authStatus.textContent = 'Авторизован';
        authStatus.style.color = 'green';
        
        // Загружаем комментарии
        refreshComments();
    } else {
        // Пользователь не авторизован
        authContainer.style.display = 'block';
        mainContainer.style.display = 'none';
        authStatus.textContent = 'Не авторизован';
        authStatus.style.color = 'red';
        loginInput.value = '';
        passwordInput.value = '';
    }
}

// Функция для авторизации (исправлено согласно документации)
function loginUser(login, password) {
    return fetch(`${USER_API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: login,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('Неверный логин или пароль');
            }
            throw new Error('Ошибка сервера');
        }
        return response.json();
    })
    .then(data => {
        token = data.user.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    });
}

// Функция для регистрации (исправлено согласно документации)
function registerUser(name, login, password) {
    return fetch(`${USER_API_URL}`, {  // POST на основной URL пользователей
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            login: login,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('Такой пользователь уже существует');
            }
            throw new Error('Ошибка сервера при регистрации');
        }
        return response.json();
    })
    .then(data => {
        // После успешной регистрации автоматически авторизуем пользователя
        token = data.user.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    });
}

// Функция для выхода
function logoutUser() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    commentsList.innerHTML = '';
    updateAuthUI();
}

// Функция для получения заголовков с авторизацией
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Функция для получения списка комментариев
function getCommentsList() {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments`, {
        headers: getHeaders()
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Требуется авторизация для получения данных');
            }
            throw new Error('Ошибка при загрузке комментариев');
        }
        return response.json();
    })
    .then(data => {
        return data.comments;
    })
    .catch(error => {
        if (error.message === 'Failed to fetch') {
            throw new Error('Проблемы с интернет-соединением');
        }
        throw error;
    });
}

// Функция для рендеринга комментариев
function renderComments(comments) {
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments" style="text-align: center; padding: 20px; color: #666;">Пока нет комментариев</div>';
        return;
    }
    
    const commentsHTML = comments.map(comment => `
        <li class="comment" data-id="${comment.id}" style="
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        ">
            <div class="comment-header" style="
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
                color: #666;
            ">
                <div style="font-weight: bold; color: #333;">${escapeHtml(comment.author.name)}</div>
                <div>${formatDate(comment.date)}</div>
            </div>
            <div class="comment-body">
                <div class="comment-text" style="
                    font-size: 16px;
                    line-height: 1.4;
                    margin-bottom: 10px;
                ">
                    ${escapeHtml(comment.text)}
                </div>
            </div>
            <div class="comment-footer">
                <div class="likes" style="display: flex; align-items: center; gap: 5px;">
                    <span class="likes-counter" style="font-weight: bold;">${comment.likes}</span>
                    <button 
                        class="like-button ${comment.isLiked ? '-active-like' : ''}" 
                        data-id="${comment.id}"
                        style="
                            width: 30px;
                            height: 30px;
                            background: ${comment.isLiked ? '#ff4444' : '#ddd'};
                            border: none;
                            border-radius: 50%;
                            cursor: ${token ? 'pointer' : 'default'};
                            position: relative;
                            opacity: ${token ? '1' : '0.5'};
                        "
                        ${!token ? 'disabled' : ''}
                    >
                        <span style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 18px;
                            color: white;
                        ">♥</span>
                    </button>
                </div>
            </div>
        </li>
    `).join('');
    
    commentsList.innerHTML = commentsHTML;
    
    // Добавляем обработчики для лайков
    document.querySelectorAll('.like-button').forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', () => {
                const commentId = button.dataset.id;
                toggleLike(commentId);
            });
        }
    });
}

// Функция для обновления комментариев
function refreshComments() {
    return getCommentsList()
        .then(comments => {
            renderComments(comments);
            return comments;
        })
        .catch(error => {
            console.error('Ошибка загрузки комментариев:', error);
            
            // Проверяем, если это ошибка авторизации
            if (error.message.includes('401') || error.message.includes('авторизация')) {
                commentsList.innerHTML = `
                    <div class="error" style="color: #ff4444; text-align: center; padding: 20px;">
                        Ошибка загрузки комментариев: требуется авторизация
                    </div>
                `;
            } else {
                commentsList.innerHTML = `
                    <div class="error" style="color: #ff4444; text-align: center; padding: 20px;">
                        ${error.message || 'Ошибка загрузки комментариев'}
                    </div>
                `;
            }
            return [];
        });
}

// Функция для добавления нового комментария
function addComment(text) {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            text: text
        })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Требуется авторизация');
            }
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Ошибка валидации');
                });
            }
            throw new Error('Ошибка сервера');
        }
        return response.json();
    });
}

// Функция для переключения лайка
function toggleLike(commentId) {
    return fetch(`${API_URL}/${PERSONAL_KEY}/comments/${commentId}/toggle-like`, {
        method: 'POST',
        headers: getHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при оценке комментария');
        }
        return response.json();
    })
    .then(result => {
        // Обновляем счетчик лайков и состояние кнопки
        const button = document.querySelector(`.like-button[data-id="${commentId}"]`);
        const counter = button.previousElementSibling;
        
        counter.textContent = result.result.likes;
        
        if (result.result.isLiked) {
            button.classList.add('-active-like');
            button.style.background = '#ff4444';
        } else {
            button.classList.remove('-active-like');
            button.style.background = '#ddd';
        }
        
        return result;
    })
    .catch(error => {
        alert(`Ошибка: ${error.message}`);
    });
}

// Функция для проверки пароля
function validatePassword(password) {
    if (password.length < 6) {
        return 'Пароль должен содержать минимум 6 символов';
    }
    return null;
}

// Функция для проверки логина
function validateLogin(login) {
    if (login.length < 3) {
        return 'Логин должен содержать минимум 3 символа';
    }
    return null;
}

// Обработчики для авторизации
loginButton.addEventListener('click', () => {
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!login || !password) {
        alert('Введите логин и пароль');
        return;
    }
    
    authStatus.textContent = 'Авторизация...';
    authStatus.style.color = 'blue';
    
    loginUser(login, password)
        .then(() => {
            updateAuthUI();
        })
        .catch(error => {
            authStatus.textContent = 'Ошибка авторизации';
            authStatus.style.color = 'red';
            alert(`Ошибка: ${error.message}`);
        });
});

registerButton.addEventListener('click', () => {
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!login || !password) {
        alert('Введите логин и пароль');
        return;
    }
    
    // Проверка логина
    const loginError = validateLogin(login);
    if (loginError) {
        alert(loginError);
        return;
    }
    
    // Проверка пароля
    const passwordError = validatePassword(password);
    if (passwordError) {
        alert(passwordError);
        return;
    }
    
    const name = prompt('Введите ваше имя (как оно будет отображаться в комментариях):');
    if (!name || name.trim().length < 3) {
        alert('Имя должно содержать хотя бы 3 символа');
        return;
    }
    
    authStatus.textContent = 'Регистрация...';
    authStatus.style.color = 'blue';
    
    registerUser(name.trim(), login, password)
        .then(() => {
            authStatus.textContent = 'Регистрация успешна!';
            authStatus.style.color = 'green';
            updateAuthUI();
            alert('Регистрация успешна! Вы автоматически вошли в систему.');
        })
        .catch(error => {
            authStatus.textContent = 'Ошибка регистрации';
            authStatus.style.color = 'red';
            alert(`Ошибка: ${error.message}`);
        });
});

logoutButton.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
        logoutUser();
    }
});

// Обработчик нажатия Enter в полях авторизации
loginInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

// Обработчик нажатия Enter в поле комментария
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        addForm.dispatchEvent(new Event('submit'));
    }
});

// Обработчик отправки формы комментария
addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    // Проверка авторизации
    if (!token) {
        alert('Для добавления комментариев необходимо войти в систему');
        authContainer.style.display = 'block';
        mainContainer.style.display = 'none';
        return;
    }
    
    const text = textInput.value.trim();
    
    // Валидация
    if (!text) {
        alert('Пожалуйста, введите текст комментария');
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
    
    addComment(text)
        .then(() => {
            // Очищаем форму
            textInput.value = '';
            currentFormData.text = '';
            
            // Обновляем список комментариев
            return refreshComments();
        })
        .then(() => {
            // Прокручиваем к последнему комментарию
            const comments = document.querySelectorAll('.comment');
            if (comments.length > 0) {
                comments[comments.length - 1].scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            // Восстанавливаем данные формы при ошибке
            restoreFormData();
            
            // Если ошибка авторизации, разлогиниваем пользователя
            if (error.message.includes('401') || error.message.includes('авторизация')) {
                logoutUser();
                alert('Сессия истекла. Пожалуйста, войдите снова.');
            } else {
                alert(`Ошибка: ${error.message}`);
            }
        })
        .finally(() => {
            // Скрываем индикатор и разблокируем форму
            toggleAddingIndicator(false);
            toggleFormDisabled(false);
        });
});

// Обработчики для сохранения данных формы при вводе
textInput.addEventListener('input', saveFormData);

// Проверяем сохраненную авторизацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        try {
            token = savedToken;
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            console.error('Ошибка при восстановлении сессии:', e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            token = null;
            currentUser = null;
        }
    }
    
    updateAuthUI();
});