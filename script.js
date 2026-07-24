// ========== Версия приложения (меняйте при обновлении карточек) ==========
const APP_VERSION = '1.0'; // если захотите обновить карточки — увеличьте число

// ========== Хранилище ==========
let cards = [];

// Элементы
const container = document.getElementById('cardContainer');
const gameContainer = document.getElementById('gameContainer');
const questionInput = document.getElementById('questionInput');
const answerInput = document.getElementById('answerInput');
const addBtn = document.getElementById('addBtn');

// Состояние игры
let gameState = {
  selected: null,       // для режима match и matchAll
  matchedPairs: new Set(),
  wrongTimeout: null,
  mode: 'match',        // 'match' | 'quiz' | 'matchAll'
  // для квиза
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  quizQuestions: [],
};

// ========== Загрузка / сохранение ==========
function loadCards() {
  const saved = localStorage.getItem('flashcards');
  const savedVersion = localStorage.getItem('flashcards_version');

  // Если данные есть и версия совпадает — загружаем их, иначе — используем новые карточки
  if (saved && savedVersion === APP_VERSION) {
    cards = JSON.parse(saved);
  } else {
    // ===== НОВЫЙ НАБОР КАРТОЧЕК (ГОСТ → описание) =====
    cards = [
      { question: 'ГОСТ Р 57837', answer: 'Двутавры стальные горячекатаные с параллельными гранями полок' },
      { question: 'ГОСТ 8239', answer: 'Двутавры стальные горячекатаные (с уклоном внутренних граней полок)' },
      { question: 'ГОСТ 8240', answer: 'Швеллеры стальные горячекатаные' },
      { question: 'ГОСТ 8278', answer: 'Швеллеры стальные гнутые равнополочные' },
      { question: 'ГОСТ 8509', answer: 'Уголки стальные горячекатаные равнополочные' },
      { question: 'ГОСТ 8510', answer: 'Уголки стальные горячекатаные неравнополочные' },
      { question: 'ГОСТ 19771', answer: 'Уголки стальные гнутые равнополочные' },
      { question: 'ГОСТ 19772', answer: 'Уголки стальные гнутые неравнополочные' },
      { question: 'ГОСТ 30245', answer: 'Профили стальные гнутые замкнутые сварные квадратные и прямоугольные для строительных конструкций' },
      { question: 'ГОСТ 2590', answer: 'Прокат сортовой стальной горячекатаный круглый' },
      { question: 'ГОСТ 2591', answer: 'Прокат сортовой стальной горячекатаный квадратный' },
      { question: 'ГОСТ 103', answer: 'Прокат сортовой горячекатаный полосовой' },
      { question: 'ГОСТ 535', answer: 'Прокат сортовой и фасонный из стали углеродистой обыкновенного качества' },
      { question: 'ГОСТ 1050', answer: 'Прокат сортовой, калиброванный (из углеродистой качественной конструкционной стали)' },
      { question: 'ГОСТ 4543', answer: 'Прокат из легированной конструкционной стали' },
      { question: 'ГОСТ 19903', answer: 'Прокат листовой горячекатаный' },
      { question: 'ГОСТ 19904', answer: 'Прокат листовой холоднокатаный' },
      { question: 'ГОСТ 3282', answer: 'Проволока стальная низкоуглеродистая общего назначения' },
      { question: 'ГОСТ 3560', answer: 'Лента стальная упаковочная' },
      { question: 'ГОСТ 7417', answer: 'Сталь калиброванная круглая' },
      { question: 'ГОСТ 3262', answer: 'Трубы стальные водогазопроводные' },
      { question: 'ГОСТ 8732', answer: 'Трубы стальные бесшовные горячедеформированные' },
      { question: 'ГОСТ 8734', answer: 'Трубы стальные бесшовные холоднодеформированные' },
      { question: 'ГОСТ 10704', answer: 'Трубы стальные электросварные прямошовные' },
      { question: 'ГОСТ 8639', answer: 'Трубы стальные квадратные' },
    ];
    // ===== КОНЕЦ НОВОГО НАБОРА =====
    // Сохраняем новые карточки с текущей версией
    saveCards();
  }
  render();
  renderGame();
  switchTab('cards');
}

function saveCards() {
  localStorage.setItem('flashcards', JSON.stringify(cards));
  localStorage.setItem('flashcards_version', APP_VERSION);
}

function resetGame() {
  gameState.matchedPairs = new Set();
  gameState.selected = null;
  if (gameState.wrongTimeout) {
    clearTimeout(gameState.wrongTimeout);
    gameState.wrongTimeout = null;
  }
  gameState.quizIndex = 0;
  gameState.quizScore = 0;
  gameState.quizAnswered = false;
  gameState.quizQuestions = [];
  renderGame();
}

// ========== Вкладки ==========
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  if (tab === 'cards') {
    container.style.display = 'grid';
    gameContainer.style.display = 'none';
    document.getElementById('addForm').style.display = 'flex';
  } else {
    container.style.display = 'none';
    gameContainer.style.display = 'block';
    document.getElementById('addForm').style.display = 'none';
    renderGame();
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ========== Карточки ==========
function addCard() {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();
  if (!question || !answer) {
    alert('Заполни оба поля!');
    return;
  }
  cards.push({ question, answer });
  saveCards();
  render();
  resetGame();
  questionInput.value = '';
  answerInput.value = '';
  questionInput.focus();
}

function deleteCard(index) {
  cards.splice(index, 1);
  saveCards();
  render();
  resetGame();
}

function flipCard(index) {
  const cardElement = document.querySelectorAll('.card')[index];
  if (cardElement) {
    cardElement.classList.toggle('flipped');
  }
}

function render() {
  if (cards.length === 0) {
    container.innerHTML = `<div class="empty">Нет карточек. Добавь первую! ✨</div>`;
    return;
  }
  container.innerHTML = cards.map((card, index) => `
    <div class="card" data-index="${index}">
      <div class="card-inner">
        <div class="card-front">
          ${card.question}
          <button class="delete-btn" data-index="${index}">✕</button>
        </div>
        <div class="card-back">
          ${card.answer}
          <button class="delete-btn" data-index="${index}">✕</button>
        </div>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) return;
      const index = parseInt(el.dataset.index);
      flipCard(index);
    });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      deleteCard(index);
    });
  });
}

// ========== Общая функция рендеринга игры (выбор режима) ==========
function renderGame() {
  if (cards.length === 0) {
    gameContainer.innerHTML = `<div class="game-empty">Нет карточек для игры. Добавьте их на вкладке "Карточки".</div>`;
    return;
  }

  const modeTabs = `
    <div class="game-mode-tabs">
      <button class="game-mode-btn ${gameState.mode === 'match' ? 'active' : ''}" data-mode="match">🧩 Сопоставь пару</button>
      <button class="game-mode-btn ${gameState.mode === 'quiz' ? 'active' : ''}" data-mode="quiz">📝 Тест</button>
      <button class="game-mode-btn ${gameState.mode === 'matchAll' ? 'active' : ''}" data-mode="matchAll">🔗 Сопоставь все</button>
    </div>
  `;

  let content = '';
  if (gameState.mode === 'match') {
    content = renderMatch();
  } else if (gameState.mode === 'quiz') {
    content = renderQuiz();
  } else if (gameState.mode === 'matchAll') {
    content = renderMatchAll();
  }

  gameContainer.innerHTML = modeTabs + content;

  document.querySelectorAll('.game-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      gameState.mode = btn.dataset.mode;
      resetGame();
    });
  });
}

// ========== Режим 1: Сопоставь пару (оригинал) ==========
function renderMatch() {
  const activeCards = cards.filter((_, idx) => !gameState.matchedPairs.has(idx));
  if (activeCards.length === 0) {
    return `
      <div class="game-empty">🎉 Все пары найдены!</div>
      <div class="game-controls" style="margin-top: 12px;">
        <button class="reset-btn" id="resetGameBtnMatch">🔄 Сыграть ещё раз</button>
      </div>
    `;
  }

  let questions = activeCards.map(card => ({ text: card.question, cardIndex: cards.indexOf(card) }));
  let answers = activeCards.map(card => ({ text: card.answer, cardIndex: cards.indexOf(card) }));
  shuffleArray(answers);

  const questionsHtml = questions.map(item => `
    <div class="game-item" data-type="question" data-cardindex="${item.cardIndex}">${item.text}</div>
  `).join('');
  const answersHtml = answers.map(item => `
    <div class="game-item" data-type="answer" data-cardindex="${item.cardIndex}">${item.text}</div>
  `).join('');

  return `
    <div class="game-controls">
      <span class="game-stats">Осталось пар: ${activeCards.length}</span>
      <button class="reset-btn" id="resetGameBtn">🔄 Перемешать ответы</button>
    </div>
    <div class="game-board">
      <div class="game-col"><h3>Вопросы</h3>${questionsHtml}</div>
      <div class="game-col"><h3>Ответы</h3>${answersHtml}</div>
    </div>
  `;
}

// ========== Режим 2: Тест (викторина) ==========
function renderQuiz() {
  if (gameState.quizQuestions.length === 0) {
    gameState.quizQuestions = shuffleArray([...cards]);
    gameState.quizIndex = 0;
    gameState.quizScore = 0;
    gameState.quizAnswered = false;
  }

  if (gameState.quizIndex >= gameState.quizQuestions.length) {
    return `
      <div class="quiz-finish">
        <h2>🎉 Тест завершён!</h2>
        <p style="font-size:20px; margin:16px 0;">Правильных ответов: ${gameState.quizScore} из ${gameState.quizQuestions.length}</p>
        <button class="reset-btn" id="resetQuizBtn">🔄 Пройти заново</button>
      </div>
    `;
  }

  const current = gameState.quizQuestions[gameState.quizIndex];
  const allAnswers = cards.map(c => c.answer);
  const distractors = allAnswers.filter(a => a !== current.answer);
  let options = [current.answer];
  const shuffledDistractors = shuffleArray(distractors);
  for (let i = 0; i < Math.min(3, shuffledDistractors.length); i++) {
    options.push(shuffledDistractors[i]);
  }
  while (options.length < 4) {
    options.push('???');
  }
  shuffleArray(options);

  const optionsHtml = options.map((opt, idx) => {
    let classes = 'quiz-option';
    if (gameState.quizAnswered) {
      if (opt === current.answer) classes += ' correct';
      else if (opt === gameState.selectedOption) classes += ' wrong';
    }
    return `<div class="${classes}" data-option="${opt}" data-index="${idx}">${opt}</div>`;
  }).join('');

  const nextButton = gameState.quizAnswered
    ? `<button class="quiz-next-btn" id="quizNextBtn">Далее ➜</button>`
    : '';

  return `
    <div class="quiz-stats">Вопрос ${gameState.quizIndex + 1} из ${gameState.quizQuestions.length} | Правильных: ${gameState.quizScore}</div>
    <div class="quiz-question">${current.question}</div>
    <div class="quiz-options">${optionsHtml}</div>
    ${nextButton}
  `;
}

// ========== Режим 3: Сопоставь все (карточки не исчезают) ==========
function renderMatchAll() {
  const totalPairs = cards.length;
  const matchedCount = gameState.matchedPairs.size;
  if (matchedCount === totalPairs && totalPairs > 0) {
    return `
      <div class="game-empty">🎉 Все пары соединены!</div>
      <div class="game-controls" style="margin-top: 12px;">
        <button class="reset-btn" id="resetMatchAllBtn">🔄 Играть заново</button>
      </div>
    `;
  }

  let questions = cards.map(card => ({ text: card.question, cardIndex: cards.indexOf(card) }));
  let answers = shuffleArray([...cards]).map(card => ({ text: card.answer, cardIndex: cards.indexOf(card) }));

  const questionsHtml = questions.map(item => {
    const matched = gameState.matchedPairs.has(item.cardIndex);
    return `<div class="game-item ${matched ? 'matched' : ''}" data-type="question" data-cardindex="${item.cardIndex}">${item.text}</div>`;
  }).join('');

  const answersHtml = answers.map(item => {
    const matched = gameState.matchedPairs.has(item.cardIndex);
    return `<div class="game-item ${matched ? 'matched' : ''}" data-type="answer" data-cardindex="${item.cardIndex}">${item.text}</div>`;
  }).join('');

  return `
    <div class="game-controls">
      <span class="game-stats">Соединено пар: ${matchedCount} из ${totalPairs}</span>
      <button class="reset-btn" id="resetMatchAllBtn">🔄 Перемешать и начать заново</button>
    </div>
    <div class="game-board">
      <div class="game-col"><h3>Вопросы</h3>${questionsHtml}</div>
      <div class="game-col"><h3>Ответы</h3>${answersHtml}</div>
    </div>
  `;
}

// ========== Общие утилиты ==========
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== Обработчики кликов в играх (делегирование) ==========
gameContainer.addEventListener('click', (e) => {
  const target = e.target.closest('.game-item');
  if (target) {
    handleGameItemClick(target);
    return;
  }
  if (e.target.id === 'resetGameBtn' || e.target.id === 'resetMatchAllBtn' || e.target.id === 'resetQuizBtn') {
    resetGame();
    return;
  }
  if (e.target.id === 'quizNextBtn') {
    gameState.quizIndex++;
    gameState.quizAnswered = false;
    gameState.selectedOption = null;
    renderGame();
    return;
  }
  const option = e.target.closest('.quiz-option');
  if (option && !gameState.quizAnswered) {
    const selectedText = option.dataset.option;
    const current = gameState.quizQuestions[gameState.quizIndex];
    if (selectedText === current.answer) {
      gameState.quizScore++;
    }
    gameState.quizAnswered = true;
    gameState.selectedOption = selectedText;
    renderGame();
    return;
  }
});

function handleGameItemClick(el) {
  if (gameState.mode === 'match') {
    handleMatchClick(el);
  } else if (gameState.mode === 'matchAll') {
    handleMatchAllClick(el);
  }
}

// ========== Логика "Сопоставь пару" ==========
function handleMatchClick(el) {
  if (el.classList.contains('matched')) return;
  if (gameState.wrongTimeout) return;

  const type = el.dataset.type;
  const cardIndex = parseInt(el.dataset.cardindex);

  if (gameState.selected === null) {
    el.classList.add('selected');
    gameState.selected = { type, cardIndex, element: el };
    return;
  }

  const selected = gameState.selected;
  if (selected.element === el) {
    el.classList.remove('selected');
    gameState.selected = null;
    return;
  }

  if (selected.type === type) {
    selected.element.classList.remove('selected');
    el.classList.add('selected');
    gameState.selected = { type, cardIndex, element: el };
    return;
  }

  let questionEl, answerEl, questionCardIndex, answerCardIndex;
  if (selected.type === 'question') {
    questionEl = selected.element;
    answerEl = el;
    questionCardIndex = selected.cardIndex;
    answerCardIndex = cardIndex;
  } else {
    questionEl = el;
    answerEl = selected.element;
    questionCardIndex = cardIndex;
    answerCardIndex = selected.cardIndex;
  }

  if (questionCardIndex === answerCardIndex) {
    gameState.matchedPairs.add(questionCardIndex);
    questionEl.classList.remove('selected');
    questionEl.classList.add('matched');
    answerEl.classList.add('matched');
    gameState.selected = null;
    renderGame();
  } else {
    questionEl.classList.add('wrong');
    answerEl.classList.add('wrong');
    questionEl.classList.remove('selected');
    gameState.wrongTimeout = setTimeout(() => {
      questionEl.classList.remove('wrong');
      answerEl.classList.remove('wrong');
      gameState.wrongTimeout = null;
      if (gameState.selected) {
        gameState.selected.element.classList.remove('selected');
        gameState.selected = null;
      }
    }, 400);
    if (gameState.selected) {
      gameState.selected.element.classList.remove('selected');
      gameState.selected = null;
    }
  }
}

// ========== Логика "Сопоставь все" ==========
function handleMatchAllClick(el) {
  if (el.classList.contains('matched')) return;
  if (gameState.wrongTimeout) return;

  const type = el.dataset.type;
  const cardIndex = parseInt(el.dataset.cardindex);

  if (gameState.selected === null) {
    el.classList.add('selected');
    gameState.selected = { type, cardIndex, element: el };
    return;
  }

  const selected = gameState.selected;
  if (selected.element === el) {
    el.classList.remove('selected');
    gameState.selected = null;
    return;
  }

  if (selected.type === type) {
    selected.element.classList.remove('selected');
    el.classList.add('selected');
    gameState.selected = { type, cardIndex, element: el };
    return;
  }

  let questionEl, answerEl, questionCardIndex, answerCardIndex;
  if (selected.type === 'question') {
    questionEl = selected.element;
    answerEl = el;
    questionCardIndex = selected.cardIndex;
    answerCardIndex = cardIndex;
  } else {
    questionEl = el;
    answerEl = selected.element;
    questionCardIndex = cardIndex;
    answerCardIndex = selected.cardIndex;
  }

  if (questionCardIndex === answerCardIndex) {
    gameState.matchedPairs.add(questionCardIndex);
    questionEl.classList.remove('selected');
    questionEl.classList.add('matched');
    answerEl.classList.add('matched');
    gameState.selected = null;
    renderGame();
  } else {
    questionEl.classList.add('wrong');
    answerEl.classList.add('wrong');
    questionEl.classList.remove('selected');
    gameState.wrongTimeout = setTimeout(() => {
      questionEl.classList.remove('wrong');
      answerEl.classList.remove('wrong');
      gameState.wrongTimeout = null;
      if (gameState.selected) {
        gameState.selected.element.classList.remove('selected');
        gameState.selected = null;
      }
    }, 400);
    if (gameState.selected) {
      gameState.selected.element.classList.remove('selected');
      gameState.selected = null;
    }
  }
}

// ========== События ==========
addBtn.addEventListener('click', addCard);
questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); answerInput.focus(); }
});
answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); addCard(); }
});

// ========== Запуск ==========
loadCards();
