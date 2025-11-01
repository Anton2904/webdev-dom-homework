import { renderComments } from './render.js'
import {
    addCommentListeners,
    addLikeListeners,
    addSubmitHandler,
    addInputHandlers,
} from './eventHandlers.js'
import { getCurrentDateTime } from './utils.js'

// Инициализируем приложение
function initApp() {
    // Рендерим комментарии
    renderComments()

    // Добавляем обработчики событий
    addCommentListeners()
    addLikeListeners()
    addSubmitHandler()
    addInputHandlers()

    // Выводим в консоль
    console.log('It works!')
}

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp)
