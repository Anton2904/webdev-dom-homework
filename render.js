import { escapeHtml } from './utils.js'
import { comments } from './data.js'

// Функция для рендера комментариев
export function renderComments() {
    const commentsListEl = document.querySelector('.comments')
    commentsListEl.innerHTML = ''

    comments.forEach((comment, index) => {
        const likeClass = comment.isLiked ? ' -active-like' : ''

        const commentHTML = `
          <li class="comment" data-index="${index}">
            <div class="comment-header">
              <div>${escapeHtml(comment.name)}</div>
             <div>${comment.date}</div>
            </div>
            <div class="comment-body">
              <div class="comment-text">
                ${comment.text} <!-- Убрано escapeHtml, так как текст уже безопасен -->
              </div>
            </div>
            <div class="comment-footer">
              <div class="likes">
                <span class="likes-counter">${comment.likes}</span>
                <button class="like-button${likeClass}"></button>
              </div>
            </div>
          </li>
        `

        commentsListEl.innerHTML += commentHTML
    })
}
