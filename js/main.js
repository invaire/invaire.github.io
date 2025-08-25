// Стартовая точка
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
        <div class="wrong-answer">❄️ Ой! Почти угадал, попробуй ещё разок</div>
        <button class="btns" id="submit-answer">ОК</button>
      </div>
    `;
document.body.appendChild(modal);
const wrongText = modal.getElementsByClassName("wrong-answer");
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

// Считаем только непустые слова
const TOTAL_WORDS = words.filter(w => w.text && w.text.trim().length > 0).length;

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

// тыкнули на цифру
function startInput(e) {
    e.preventDefault();

    if (e.target.classList.contains('filled')) {
        return;
    }

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

    keyboardSafeModal();
}

// Прогресс и флаг финала
const solvedWords = new Set();
let finalShown = false;

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

// Проверяем ответ
function checkAnswer() {
    if (!currentWord) return;

    const userAnswer = modalInput.value.trim().toUpperCase();

    hideWrongText();

    if (userAnswer === currentWord.text) {
        // засчитываем прогресс
        solvedWords.add(currentWord.text);

        // 1) заполняем клетки 
        fillWord();

        // 1.1) подсвечиваем букву главной фразы
        mainWordLetterShow();

        if (!finalShown && solvedWords.size === TOTAL_WORDS) {
            finalShown = true;
            setTimeout(showFinalCelebration, 300);
        } else {
            // запускаем "Правильно!" и искры
            // вызываем анимацию
            showCorrectAtWord();
            // 2) даём анимации секунду поработать, затем прячем баннер и закрываем модалку
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const msg = document.getElementById('correctMsg');
                    if (msg) msg.style.display = 'none';
                }, 1200);                   // подгони под длительность искр/баннера
            });
        }

        // 1.2) Закрываем окно ввода
        closeModal();
    } else {
        showWrongText();
        modalInput.focus();
    }
    console.log(`Solved: ${solvedWords.size}/${TOTAL_WORDS}`);
}

function closeModal() {
    if (!modalOpen) return;

    hideWrongText();

    modal.classList.remove('show');
    setTimeout(() => {               // дождаться CSS-анимации закрытия
        modal.style.display = 'none';
    }, 200);

    document.body.classList.remove('modal-open');
    currentWord = null;
    modalOpen = false;
}

// --- iOS: чтобы модалка была ровно над клавиатурой ---
function keyboardSafeModal() {
    const vv = window.visualViewport;        // iOS Safari: есть почти всегда
    if (!vv) return;                         // если API нет — ничего не делаем

    // запомним исходный padding-bottom у оверлея-модалки (#modal)
    const basePadding = parseFloat(getComputedStyle(modal).paddingBottom) || 0;

    function isOpen() {
        return !!modalOpen && modal.style.display !== 'none';
    }

    // оценка высоты клавиатуры = разница между layout viewport и visual viewport
    function keyboardHeight() {
        const kb = window.innerHeight - (vv.height + vv.offsetTop);
        return kb > 0 ? kb : 0;
    }

    function adjust() {
        if (!isOpen()) return;

        const kb = keyboardHeight();
        const card = modal.querySelector('.modal-content');

        if (kb > 0) {
            // Поднимем всё содержимое модалки за счёт нижнего padding:
            modal.style.paddingBottom = (basePadding + kb + 8) + 'px';

            // Чтобы карточка гарантированно влезала в видимую область:
            if (card) {
                card.style.maxHeight = `min(86vh, ${Math.floor(vv.height - 24)}px)`;
            } else {
                // Клавиатура скрыта — возвращаем значения
                modal.style.paddingBottom = basePadding + 'px';
                if (card) card.style.maxHeight = '';
            }
        }

        // Изменение видимого вьюпорта и его «прокрутка» во время показа клавиатуры
        vv.addEventListener('resize', adjust);
        vv.addEventListener('scroll', adjust);

        // При фокусе на поле — чуть позже, когда клавиатура уже поднялась
        modalInput.addEventListener('focus', () => setTimeout(adjust, 60));

        // Вернуть значения при закрытии
        const _close = closeModal;
        window.closeModal = function () {
            _close();
            modal.style.paddingBottom = basePadding + 'px';
            const card = modal.querySelector('.modal-content');
            if (card) card.style.maxHeight = '';
        };
        // Вызовем подстройку сразу после открытия в startInput
        window.__iosAdjustModal = adjust;
    };

    // Оборачиваем открытие/закрытие, чтобы подстроиться вовремя
    const _open = startInput;
    window.startInput = function (w) {
        _open(w);
        setTimeout(adjust, 60);
    };

    const _close = closeModal;
    window.closeModal = function () {
        _close();
        modal.style.paddingBottom = basePadding + 'px';
        const card = modal.querySelector('.modal-content');
        if (card) card.style.maxHeight = '';
    };

    // На смену ориентации — пересчитать через паузу
    window.addEventListener('orientationchange', () => setTimeout(adjust, 300));
}

// Заполняет клетки если правильно ввели
function fillWord() {
    const w = currentWord;
    if (!currentWord) {
        return;
    }

    for (let k = 0; k < w.text.length; k++) {
        const r = w.row;
        const c = w.col + k;
        const cell = grid[r][c];

        cell.textContent = w.text[k];
        cell.classList.add('filled');
    }
}

// показываем "Правильно!" и запускаем искры из центра угаданного слова
function showCorrectAtWord() {
    const w = currentWord;
    if (!currentWord) {
        return;
    }

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
// --- Финальный салют и поздравление ---
function showFinalCelebration() {
    const layer = document.getElementById('fxLayer');

    // Canvas-эффекты: быстрее и плавнее, чем куча DOM-частиц
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    layer.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    function resize() {
        const rect = layer.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // масштабирование контекста
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    let running = true;

    function burst(x, y, n = 80) {
        for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            particles.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 1.2,
                life: 60 + Math.random() * 20,
                r: 2 + Math.random() * 2.2,
                color: `hsl(${Math.floor(Math.random() * 360)},90%,60%)`
            });
        }
    }

    function tick() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.life -= 1;
            ctx.globalAlpha = Math.max(p.life / 80, 0);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color; ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        }
        requestAnimationFrame(tick);
    }

    // Периодические залпы в разных точках
    const timer = setInterval(() => {
        const x = canvas.width * (0.15 + Math.random() * 0.7);
        const y = canvas.height * (0.12 + Math.random() * 0.28);
        burst(x, y, 80);
    }, 500);

    // Поздравительный баннер
    const congr = document.createElement('div');
    congr.id = 'finalCongrats';
    congr.innerHTML = '✨Ура!✨<br>Все слова разгаданы!<br>Загадай желание🧚‍♀️';
    document.body.appendChild(congr);

    // Закрытие по клику
    congr.addEventListener('click', () => {
        running = false;
        clearInterval(timer);
        window.removeEventListener('resize', resize);
        layer.removeChild(canvas);
        congr.remove();
    }, { once: true });

    tick();

    Автозакрытие
    setTimeout(() => {
        running = false;
        clearInterval(timer);
        window.removeEventListener('resize', resize);
        layer.removeChild(canvas);
        setTimeout(() => congr.remove(), 800);
    }, 4500);
}

// получает текущий элемент текущего слова (вспомогательная функция)
function getCurrentWordInGrid() {
    const r = currentWord.row;
    return grid[r];
}

function showWrongText() {
    if (wrongText && wrongText[0]) {
        wrongText[0].classList.add("show");
    }
}

function hideWrongText() {
    if (wrongText && wrongText[0]) {
        wrongText[0].classList.remove("show");
    }
}
