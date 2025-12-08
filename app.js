const API_URL = 'https://wedev-api.sky.pro/api/v2';
const PERSONAL_KEY = 'Антон-Манякин'.replace(/\s+/g, '-');
const USER_API_URL = 'https://wedev-api.sky.pro/api/user';

// DOM элементы
const commentsList = document.querySelector('.comments');
const addForm = document.getElementById('add-form');
const textInput = document.getElementById('comment-text');
const submitButton = document.getElementById('submit-comment');
const quoteIndicator = document.getElementById('quote-indicator');
const addFormLock = document.getElementById('add-form-lock');

const authModal = document.getElementById('auth-modal');
const openAuthButton = document.getElementById('open-auth-button');
const openAuthButton2 = document.getElementById('open-auth-button-2');
const closeAuthButton = document.getElementById('close-auth');
const loginInput = document.getElementById('login-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const authStatus = document.getElementById('auth-status');

const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');

let token = null;
let currentUser = null;
let currentFormData = { text: '' };

// --- Утилиты ---
function escapeHtml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getFullYear()).slice(-2)} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function getHeaders() {
  const headers = {};
  if(token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function readResponse(res) {
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch(e){ data = null; }
  return { ok: res.ok, status: res.status, text, data };
}

function toggleAddingIndicator(show, text = '') {
  quoteIndicator.style.display = show ? 'block' : 'none';
  quoteIndicator.textContent = text;
}

function toggleFormDisabled(disabled) {
  textInput.disabled = disabled;
  submitButton.disabled = disabled;
  submitButton.textContent = disabled ? 'Добавляется...' : 'Написать';
  submitButton.style.backgroundColor = disabled ? '#cccccc' : '';
}

function saveFormData() { currentFormData = { text: textInput.value }; }
function restoreFormData() { textInput.value = currentFormData.text || ''; }

// --- API ---
function loginUser(login, password) {
  return fetch(`${USER_API_URL}/login`, { method: 'POST', body: JSON.stringify({login,password}) })
    .then(readResponse)
    .then(({ok, data, status})=>{
      if(!ok) throw new Error(data?.error||`Ошибка входа (${status})`);
      token = data.user.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return data;
    });
}

function registerUser(name, login, password) {
  return fetch(`${USER_API_URL}`, { method: 'POST', body: JSON.stringify({name,login,password}) })
    .then(readResponse)
    .then(({ok,data,status})=>{
      if(!ok) throw new Error(data?.error||`Ошибка регистрации (${status})`);
      token = data.user.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return data;
    });
}

function getCommentsList() {
  return fetch(`${API_URL}/${PERSONAL_KEY}/comments`, { method:'GET', headers: getHeaders() })
    .then(readResponse)
    .then(({ok, data, status})=>{
      if(!ok) throw new Error(data?.error || `Ошибка загрузки комментариев (${status})`);
      return data.comments || [];
    });
}

function addComment(text) {
  return fetch(`${API_URL}/${PERSONAL_KEY}/comments`, { method:'POST', headers: getHeaders(), body: JSON.stringify({text}) })
    .then(readResponse)
    .then(({ok, data, status})=>{
      if(!ok) throw new Error(data?.error || `Ошибка добавления комментария (${status})`);
      return data;
    });
}

function toggleLike(commentId) {
  const btn = document.querySelector(`.like-button[data-id="${commentId}"]`);
  const counter = btn.previousElementSibling;
  fetch(`${API_URL}/${PERSONAL_KEY}/comments/${commentId}/toggle-like`, { method:'POST', headers:getHeaders() })
    .then(readResponse)
    .then(({ok,data})=>{
      if(!ok) throw new Error(data?.error || 'Ошибка лайка');
      if(counter) counter.textContent = data.result.likes;
      if(btn) btn.classList.toggle('-active-like', data.result.isLiked);
    })
    .catch(err=>alert(err.message));
}

// --- Рендер ---
function renderComments(comments) {
  if(!comments || comments.length===0) {
    commentsList.innerHTML = '<div class="no-comments">Пока нет комментариев</div>';
    return;
  }

  commentsList.innerHTML = comments.map(c=>`
    <li class="comment" data-id="${c.id}">
      <div class="comment-header">
        <div class="author">${escapeHtml(c.author.name)}</div>
        <div class="date">${formatDate(c.date)}</div>
      </div>
      <div class="comment-body">
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
      <div class="comment-footer">
        <div class="likes">
          <span class="likes-counter">${c.likes}</span>
          <button class="like-button ${c.isLiked ? '-active-like' : ''}" data-id="${c.id}" ${!token ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
              2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
              C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
              c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>
    </li>
  `).join('');

  document.querySelectorAll('.like-button').forEach(btn=>{
    if(!btn.disabled) btn.addEventListener('click',()=>toggleLike(btn.dataset.id));
  });
}

// --- Обновление комментариев ---
function refreshComments() {
  commentsList.innerHTML = '<div class="loading">Комментарии загружаются...</div>';
  getCommentsList()
    .then(renderComments)
    .catch(err=>{
      commentsList.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    });
}

// --- Авторизация UI ---
function updateAuthUI() {
  if(token && currentUser){
    userInfo.textContent = `${currentUser.name} (${currentUser.login})`;
    logoutButton.style.display='inline-block';
    openAuthButton.style.display='none';
    openAuthButton2.style.display='none';
    addFormLock.style.display='none';
    textInput.disabled=false;
    submitButton.disabled=false;
  } else {
    userInfo.textContent='Гость';
    logoutButton.style.display='none';
    openAuthButton.style.display='inline-block';
    openAuthButton2.style.display='inline-block';
    addFormLock.style.display='block';
    textInput.disabled=true;
    submitButton.disabled=true;
  }
  refreshComments();
}

function openAuthModal() { authModal.style.display='flex'; authStatus.textContent='Введите логин и пароль'; authStatus.style.color='#bcec30'; }
function closeAuthModal(){ authModal.style.display='none'; loginInput.value=''; passwordInput.value=''; }

// --- События ---
textInput.addEventListener('keydown', e=>{if(e.key==='Enter'&&e.ctrlKey)addForm.dispatchEvent(new Event('submit'));});
addForm.addEventListener('submit', e=>{
  e.preventDefault();
  if(!token){ openAuthModal(); return; }
  const text = textInput.value.trim();
  if(!text){ alert('Введите текст'); return; }
  saveFormData();
  toggleAddingIndicator(true,'Комментарий добавляется...');
  toggleFormDisabled(true);
  addComment(text)
    .then(()=>{ textInput.value=''; currentFormData.text=''; refreshComments(); })
    .catch(err=>{ alert(err.message); restoreFormData(); })
    .finally(()=>{ toggleAddingIndicator(false); toggleFormDisabled(false); });
});

openAuthButton.addEventListener('click', openAuthModal);
openAuthButton2.addEventListener('click', openAuthModal);
closeAuthButton.addEventListener('click', closeAuthModal);

// Login
loginButton.addEventListener('click', ()=>{
  const login=loginInput.value.trim();
  const password=passwordInput.value.trim();
  if(!login||!password){ alert('Введите логин и пароль'); return; }
  authStatus.textContent='Авторизация...'; authStatus.style.color='white';
  loginUser(login,password)
    .then(()=>{ closeAuthModal(); updateAuthUI(); })
    .catch(err=>{ alert(err.message); authStatus.textContent='Ошибка'; authStatus.style.color='#ff6b6b'; });
});

// Register
registerButton.addEventListener('click', ()=>{
  const login=loginInput.value.trim();
  const password=passwordInput.value.trim();
  if(!login||!password){ alert('Введите логин и пароль'); return; }
  const name=prompt('Введите ваше имя:'); if(!name){ alert('Введите имя'); return; }
  authStatus.textContent='Регистрация...'; authStatus.style.color='white';
  registerUser(name.trim(), login, password)
    .then(()=>{ closeAuthModal(); updateAuthUI(); alert('Вы вошли автоматически'); })
    .catch(err=>{ alert(err.message); authStatus.textContent='Ошибка'; authStatus.style.color='#ff6b6b'; });
});

// Enter в форме авторизации
loginInput.addEventListener('keypress', e=>{if(e.key==='Enter') loginButton.click();});
passwordInput.addEventListener('keypress', e=>{if(e.key==='Enter') loginButton.click();});

// Logout
logoutButton.addEventListener('click', ()=>{
  token=null; currentUser=null; localStorage.removeItem('token'); localStorage.removeItem('user'); updateAuthUI();
});

// Восстановление сессии
document.addEventListener('DOMContentLoaded', ()=>{
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if(savedToken && savedUser){ try{ token=savedToken; currentUser=JSON.parse(savedUser); } catch(e){ token=null; currentUser=null; } }
  updateAuthUI();
});
