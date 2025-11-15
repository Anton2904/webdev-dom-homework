import { comments } from './data.js'
import { renderComments } from './render.js'
import { escapeHtml, getCurrentDateTime } from './utils.js'

// Переменная для хранения информации о цитируемом комментарии
let quotedComment = null

// Функция для добавления обработчиков на комментарии
export function addCommentListeners() {
    const commentElements = document.querySelectorAll('.comment')
    const formNameEl = document.querySelector('.add-form-name')
    const formCommentEl = document.querySelector('.add-form-text')
    const quoteIndicatorEl = document.getElementById('quote-indicator')

    commentElements.forEach((commentEl) => {
        commentEl.addEventListener('click', (event) => {
            // Проверяем, был ли клик на кнопке лайка
            if (event.target.closest('.like-button')) {
                return // Прерываем выполнение, если клик был на лайке
            }

            const index = parseInt(commentEl.dataset.index)
            const comment = comments[index]

            // Устанавливаем имя автора в поле ввода
            formNameEl.value = comment.name

            // Добавляем текст комментария с символом ">" перед каждой строкой
            const quotedText = `> ${comment.text.replaceAll('\n', '\n> ')}\n\n`
            formCommentEl.value = quotedText

            // Сохраняем информацию о цитируемом комментарии
            quotedComment = {
                index: index,
                name: comment.name,
                text: comment.text,
            }

            // Показываем индикатор цитирования
            quoteIndicatorEl.textContent = `Ответ на комментарий ${escapeHtml(comment.name)}`
            quoteIndicatorEl.style.display = 'block'

            // Фокусируемся на поле ввода комментария
            formCommentEl.focus()
        })
    })
}

// Функция для добавления обработчиков на кнопки лайков
export function addLikeListeners() {
    const likeButtons = document.querySelectorAll('.like-button')

    likeButtons.forEach((button, index) => {
        button.addEventListener('click', (event) => {
            // Останавливаем всплытие события, чтобы не сработал обработчик комментария
            event.stopPropagation()

            // Меняем состояние лайка в массиве
            if (comments[index].isLiked) {
                comments[index].likes--
                comments[index].isLiked = false
            } else {
                comments[index].likes++
                comments[index].isLiked = true
            }

            // Перерендериваем комментарии
            renderComments()
            // Добавляем обработчики после рендера
            addCommentListeners()
            addLikeListeners()
        })
    })
}

// Функция для добавления обработчика на кнопку отправки
export function addSubmitHandler() {
    const formNameEl = document.querySelector('.add-form-name')
    const formCommentEl = document.querySelector('.add-form-text')
    const buttonEl = document.querySelector('.add-form-button')
    const quoteIndicatorEl = document.getElementById('quote-indicator')

    buttonEl.addEventListener('click', () => {
        const name = formNameEl.value.trim()
        let commentText = formCommentEl.value.trim()

        if (!name || !commentText) {
            alert('Пожалуйста, заполните все поля')
            return
        }

        // Экранируем только имя пользователя (текст комментария оставляем как есть)
        const safeName = escapeHtml(name)

        // Сохраняем текст комментария без экранирования, так как он уже безопасен
        // (пользователь не может вставить HTML через текстовое поле)

        // Добавляем новый комментарий в массив
        comments.push({
            name: safeName,
            date: getCurrentDateTime(),
            text: commentText, // Сохраняем как есть, без экранирования
            likes: 0,
            isLiked: false,
        })

        // Перерендериваем все комментарии
        renderComments()

        // Очищаем форму и сбрасываем цитирование
        formNameEl.value = ''
        formCommentEl.value = ''
        quotedComment = null
        quoteIndicatorEl.style.display = 'none'

        // Добавляем обработчики после рендера
        addCommentListeners()
        addLikeListeners()
    })
}

// Функция для добавления обработчиков на поля ввода
export function addInputHandlers() {
    const formNameEl = document.querySelector('.add-form-name')
    const formCommentEl = document.querySelector('.add-form-text')

    formNameEl.addEventListener('input', () => {
        console.log('Имя изменено:', formNameEl.value)
    })

    formCommentEl.addEventListener('input', () => {
        console.log('Комментарий изменен:', formCommentEl.value)
    })
}
