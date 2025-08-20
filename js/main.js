document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.querySelector('.start-content button');

    startBtn.addEventListener('click', () => {
        const wrap = document.querySelector('#startOverlay .start-content');
        const btnRect = startBtn.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();

        // центр кнопки относительно контейнера
        const cx = btnRect.left + btnRect.width / 2 - wrapRect.left;
        const cy = btnRect.top + btnRect.height / 2 - wrapRect.top;

        // 1) вспышка
        wrap.style.setProperty('--x', cx + 'px');
        wrap.style.setProperty('--y', cy + 'px');
        wrap.classList.add('flash');

        // 2) искры
        const hues = [0, 45, 200, 120, 300]; // красный, жёлтый, зелёный, синий, розовый
        const count = 40;  // размер фейерверка, много искр
        for (let i = 0; i < count; i++) {
            const s = document.createElement('span');
            s.className = 'spark';
            s.style.left = cx + 'px';
            s.style.top = cy + 'px';

            // угол + скорость
            const angle = (Math.PI * 2) * (i / count);

            // 🎇 случайный размер искры (от 6px до 16px)
            const size = 4 + (Math.random() + 1) * 8;
            s.style.width = size + 'px';
            s.style.height = size + 'px';

            // базовая скорость (150–250)
            const base = 250 + (Math.random() + 1.0) * 200; //скорость 250–450 px

            // множитель: крупнее искра → медленнее летит (0.9..1.3)
            const factor = 0.9 + (size / 16.0) * 0.4;  // Связь размера и скорости

            // итоговая скорость
            const speed = base * factor;

            // ⏱ длительность: крупнее искра — дольше живёт (0.9s..1.8s)
            const dur = 1.5 + (size / 16.0) * 4;  // 1.5–3s
            s.style.setProperty('--dur', dur + 's');

            // направление
            s.style.setProperty('--dx', Math.cos(angle) * speed + 'px');
            s.style.setProperty('--dy', Math.sin(angle) * speed + 'px');

            // цвет
            s.style.setProperty('--h', hues[i % hues.length]);

            wrap.appendChild(s);
            // s.addEventListener('animationend', () => s.remove());
        }

        setTimeout(() => {
            // 3) исчезновение оверлея
            const overlay = document.getElementById('startOverlay');
            // Сначала запускаем анимацию исчезновения
            overlay.classList.add('hidden');
        }, 1500);
    });

});

let currentWord = null;
let modalOpen = false;

const modal = document.createElement('div');
modal.id = 'modal';
modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <p id="question-text"></p>
        <img id="question-image" src="" alt="" style="max-width: 100%; display: none;"/>
        <input type="text" id="user-answer" placeholder="Введите слово...">
        <button id="submit-answer">ОК</button>
      </div>
    `;
document.body.appendChild(modal);
const
    modalOk = document.getElementById('submit-answer'),
    modalInput = document.getElementById('user-answer');

const container = document.getElementById('crossword');

const rows = 19, cols = 11;
const words = [
    { text: 'СНЕГОВИК', q: '✨ Стоит во дворе с морковкой вместо носа. (8 букв)', row: 0, col: 1, img: 'img/snegovik.jpg', m: 5 },
    { text: 'КАКАО', q: '✨ Какой волшебный шоколадный напиток пьют, чтобы согреться? (5 букв)', row: 1, col: 2, img: 'img/kakao.jpg', m: 4 },
    { text: 'ЕЛКА', q: '✨ Как зовут новогоднее нарядное дерево? (4 буквы)', row: 2, col: 5, img: 'img/elka.jpg', m: 1 },
    { text: 'МЕШОК', q: '✨ В чём Дед Мороз носит чудо и подарки? (5 букв)', row: 3, col: 4, img: 'img/meshok.jpg', m: 2 },
    { text: 'СНЕГ', q: '✨ Он падает с неба и тает в ладошке. (4 буквы)', row: 4, col: 4, img: 'img/sneg.jpg', m: 2 },
    { text: 'БЫЧОК', q: '✨ Идет ... качается, вздыхает на ходу (5 букв)', row: 5, col: 6, img: 'img/bai-bai.jpg', m: 0 },
    { text: 'САНКИ', q: '✨ Что мчится с горки и делает детей счастливыми? (5 букв)', row: 6, col: 6, img: 'img/sanki.jpg', m: 0 },
    { text: 'КОНФЕТЫ', q: '✨ Яркие и сладкие, прячутся под ёлкой. (7 букв)', row: 7, col: 1, img: 'img/konfeti.jpg', m: 5 },
    { text: 'ОЛИВЬЕ', q: '✨ Какой салат обязательно стоит на новогоднем столе? (6 букв)', row: 8, col: 3, img: 'img/olive.jpg', m: 3 },
    { text: 'СНЕГУРОЧКА', q: '✨ Кто помогает Деду Морозу дарить подарки? (10 букв)', row: 9, col: 0, img: 'img/sneguroshka.jpg', m: 6 },
    { text: '', q: '', row: 10, col: 0, m: 0 },
    { text: 'СЕВЕР', q: '✨ Где живёт Дед Мороз? (5 букв)', row: 11, col: 4, img: 'img/sever.jpg', m: 2 },
    { text: '', q: '', row: 12, col: 0, m: 0 },
    { text: 'САНТА', q: '✨ Кто летает на санях с оленями? (5 букв)', row: 13, col: 6, img: 'img/santa.jpg', m: 0 },
    { text: 'ДЕТИ', q: '✨ Кто верит в чудо и лепит снеговика? (4 буквы)', row: 14, col: 5, img: 'img/deti.jpg', m: 1 },
    { text: 'ПОДАРОК', q: '✨ Что блестящее стоит под ёлкой? (7 букв)', row: 15, col: 2, img: 'img/podarok.jpg', m: 4 },
    { text: 'ЗВЕЗДА', q: '✨ Что сверкает на макушке ёлки? (6 букв)', row: 16, col: 2, img: 'img/zvezda.jpg', m: 4 },
    { text: 'ЗАЯЦ', q: '✨ Кто скачет по снегу с длинными ушами? (4 букв)', row: 17, col: 3, img: 'img/zayaz.jpg', m: 3 },
    { text: 'ВЕДРО', q: '✨ Что стоит вместо шапки у снеговика? (5 букв)', row: 18, col: 5, img: 'img/vedro.jpg', m: 1 }
];

const grid = [];
for (let r = 0; r < words.length; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell blank';
        cell.dataset.r = r;
        cell.dataset.c = c;
        container.appendChild(cell);
        grid[r][c] = cell;
    }
}

words.forEach((w, i) => {
    const wordLength = w.text.length;

    for (let k = 0; k < wordLength; k++) {
        const r = w.row;
        const c = w.col + k;
        const cell = grid[r][c];

        cell.classList.remove('blank');
        cell.classList.add('cell');
        cell.dataset.letter = w.text[k];
        // cell.textContent = w.text[k];

        if (k === 0) {
            cell.classList.add('start');
            cell.title = 'Нажмите, чтобы ответить';
            cell.dataset.index = i;
            cell.addEventListener('click', startInput);

            // ⬇️ Добавляем номер слова в ячейку
            const number = document.createElement('div');
            number.textContent = (i + 1);
            number.classList.add('number');
            cell.appendChild(number);
        }

        // if (w.m === k) {
        //     cell.classList.add('mainWord');
        // }
    }
});



// подсвечивает клетку буквы главной фразы после заполнения правильного слова
function mainWordLetterShow() {
    const cells = getCurrentWordInGrid();

    if (cells) {
        const highlightCell = cells[currentWord.col + currentWord.m];
        if (highlightCell) {
            highlightCell.classList.add('mainWord');
        }
    }
}

// функция удаления клика по первой букве, вызывается после того, как ввели правильное слово
function removeCellClick() {
    const cells = getCurrentWordInGrid();
    if (cells) {
        cells[currentWord.col].removeEventListener('click', startInput);
    }
}

// тыкнули на цифру
function startInput(e) {
    e.preventDefault();
    const idx = e.currentTarget.dataset.index;
    currentWord = words[idx];

    document.getElementById('question-text').textContent = currentWord.q || 'Введите слово:';
    modalInput.value = '';
    document.getElementById('submit-answer').dataset.index = idx;

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show')); // плавно показать
    document.body.classList.add('modal-open');
    const imagePath = currentWord.img || `img/${currentWord.text.toLowerCase()}.jpg`;
    const img = document.getElementById('question-image');
    img.src = imagePath;
    img.style.display = 'block';

    document.getElementById('modal').style.display = 'flex';
    modalInput.focus();
    modalOpen = true;
}

// проверка ответа
modalOk.onclick = checkAnswer;

// Закрытие модального окна
modal.querySelector('.close').onclick = closeModal;
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        return;
    }
    if (e.key === 'Enter' && modalOpen) {
        checkAnswer();

        return;
    }
});

function checkAnswer() {
    if (!currentWord) return;

    const userAnswer = modalInput.value.trim().toUpperCase();

    if (userAnswer === currentWord.text) {
        // 0) Удаляем обработчик клика по первой букве
        removeCellClick();
        // 1) заполняем клетки + запускаем "Правильно!" и искры
        fillWord(currentWord);
        // 1.1) подсвечиваем букву главной фразы
        mainWordLetterShow();
        // 2) даём анимации секунду поработать, затем прячем баннер и закрываем модалку
        requestAnimationFrame(() => {
            setTimeout(() => {
                const msg = document.getElementById('correctMsg');
                if (msg) msg.style.display = 'none';
                closeModal();             // <— без аргументов
            }, 1200);                   // подгони под длительность искр/баннера
        });

    } else {
        alert('❄️ Ой! Почти угадал, попробуй ещё разок');
        modalInput.focus();
    }
}

function closeModal() {
    if (!modalOpen) return;

    modal.classList.remove('show');
    setTimeout(() => {               // дождаться CSS-анимации закрытия
        modal.style.display = 'none';
    }, 200);

    document.body.classList.remove('modal-open');
    currentWord = null;
    modalOpen = false;
}

// Заполняет клетки если правильно ввели
function fillWord(w) {
    for (let k = 0; k < w.text.length; k++) {
        const r = w.row;
        const c = w.col + k;
        const cell = grid[r][c];

        cell.textContent = w.text[k];
        cell.classList.add('filled');
    }
    // вызываем анимацию
    showCorrectAtWord(w);
}

// показываем "Правильно!" и запускаем искры из центра угаданного слова

function showCorrectAtWord(w) {
    // 1) Центр слова в пикселях
    const first = grid[w.row][w.col].getBoundingClientRect();
    const last = grid[w.row][w.col + w.text.length - 1].getBoundingClientRect();
    const cx = (first.left + last.right) / 2;
    const cy = first.top - 10; // чуть выше слова

    // 2) Сообщение "Правильно!"
    const msg = document.getElementById('correctMsg');
    msg.style.display = 'block';
    msg.classList.remove('pop');
    void msg.offsetWidth;   // перезапуск анимации
    msg.classList.add('pop');

    // 3) Искры
    const layer = document.getElementById('fxLayer');
    const hues = [45, 0, 200, 120, 300]; // цвета: золото, красный, синий, зелёный, розовый
    const count = 18;

    for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'spark';

        // стартовая точка
        s.style.left = cx + 'px';
        s.style.top = cy + 'px';

        // угол разлёта
        const angle = (Math.PI * 2) * (i / count);
        const base = 150 + Math.random() * 100;
        const size = 6 + Math.random() * 10;
        const factor = 0.9 + (size / 16) * 0.4;
        const speed = base * factor;
        const dur = 1.1 + (size / 16) * 1.1;

        // свойства частицы
        s.style.setProperty('--dx', Math.cos(angle) * speed + 'px');
        s.style.setProperty('--dy', Math.sin(angle) * speed + 'px');
        s.style.setProperty('--h', hues[i % hues.length]);
        s.style.setProperty('--dur', dur.toFixed(2));

        s.style.width = size + 'px';
        s.style.height = size + 'px';

        layer.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
    }

}

// получает текущий элемент текущего слова (вспомогательная функция)
function getCurrentWordInGrid() {
    const r = currentWord.row;
    return grid[r];
}