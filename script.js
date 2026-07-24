// ========== Версия приложения ==========
const APP_VERSION = '1.0';

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
  selected: null,
  matchedPairs: new Set(),
  wrongTimeout: null,
  mode: 'match',
  // для квиза
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  quizQuestions: [],
  // для аудио-теста (обычного)
  audioCards: [],
  audioIndex: 0,
  audioScore: 0,
  audioResults: [],
  audioSpeaking: false,
  // для аудио на время
  timedAudioCards: [],
  timedAudioIndex: 0,
  timedAudioScore: 0,
  timedAudioResults: [],
  timedAudioSpeaking: false,
  timedAudioTimeLimit: 10,
  timedAudioTimeRemaining: 10,
  timedAudioTimerId: null,
  timedAudioStarted: false,
  timedAudioFinished: false,
  // Для фиксации вариантов ответов в текущем вопросе
  timedCurrentOptions: [],      // массив строк вариантов
  timedCurrentCorrect: '',      // правильный ответ для текущего вопроса
  timedCurrentQuestionIndex: -1 // индекс вопроса, для которого сгенерированы варианты
};

// ========== Загрузка / сохранение ==========
function loadCards() {
  const saved = localStorage.getItem('flashcards');
  const savedVersion = localStorage.getItem('flashcards_version');
  if (saved && savedVersion === APP_VERSION) {
    cards = JSON.parse(saved);
  } else {
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
  gameState.audioCards = [];
  gameState.audioIndex = 0;
  gameState.audioScore = 0;
  gameState.audioResults = [];
  gameState.audioSpeaking = false;
  if (gameState.timedAudioTimerId) {
    clearInterval(gameState.timedAudioTimerId);
    gameState.timedAudioTimerId = null;
  }
  gameState.timedAudioCards = [];
  gameState.timedAudioIndex = 0;
  gameState.timedAudioScore = 0;
  gameState.timedAudioResults = [];
  gameState.timedAudioSpeaking = false;
  gameState.timedAudioStarted = false;
  gameState.timedAudioFinished = false;
  gameState.timedAudioTimeRemaining = gameState.timedAudioTimeLimit;
  // Сброс зафиксированных вариантов
  gameState.timedCurrentOptions = [];
  gameState.timedCurrentCorrect = '';
  gameState.timedCurrentQuestionIndex = -1;
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
  renderGame();
  questionInput.value = '';
  answerInput.value = '';
  questionInput.focus();
}

function deleteCard(index) {
  cards.splice(index, 1);
  saveCards();
  render();
  resetGame();
  renderGame();
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

// ========== Общая функция рендеринга игры ==========
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
      <button class="game-mode-btn ${gameState.mode === 'audioQuiz' ? 'active' : ''}" data-mode="audioQuiz">🎧 Аудио-тест</button>
      <button class="game-mode-btn ${gameState.mode === 'timedAudio' ? 'active' : ''}" data-mode="timedAudio">⏱ Аудио на время</button>
    </div>
  `;

  let content = '';
  if (gameState.mode === 'match') {
    content = renderMatch();
  } else if (gameState.mode === 'quiz') {
    content = renderQuiz();
  } else if (gameState.mode === 'matchAll') {
    content = renderMatchAll();
  } else if (gameState.mode === 'audioQuiz') {
    content = renderAudioQuiz();
  } else if (gameState.mode === 'timedAudio') {
    content = renderTimedAudioQuiz();
  }

  gameContainer.innerHTML = modeTabs + content;

  document.querySelectorAll('.game-mode-btn').forEach(btn => {
    btn.removeEventListener('click', handleModeSwitch);
    btn.addEventListener('click', handleModeSwitch);
  });
}

function handleModeSwitch(e) {
  const btn = e.currentTarget;
  const newMode = btn.dataset.mode;
  if (newMode === gameState.mode) return;
  gameState.mode = newMode;
  resetGame();
  if (gameState.mode === 'audioQuiz') {
    prepareAudioQuiz();
  } else if (gameState.mode === 'timedAudio') {
    prepareTimedAudioQuiz();
  }
  renderGame();
}

// ========== Режим 1: Сопоставь пару ==========
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

  let questions = shuffleArray(activeCards.map(card => ({ text: card.question, cardIndex: cards.indexOf(card) })));
  let answers = shuffleArray(activeCards.map(card => ({ text: card.answer, cardIndex: cards.indexOf(card) })));

  const questionsHtml = questions.map(item => `
    <div class="game-item" data-type="question" data-cardindex="${item.cardIndex}">${item.text}</div>
  `).join('');
  const answersHtml = answers.map(item => `
    <div class="game-item" data-type="answer" data-cardindex="${item.cardIndex}">${item.text}</div>
  `).join('');

  return `
    <div class="game-controls">
      <span class="game-stats">Осталось пар: ${activeCards.length}</span>
      <button class="reset-btn" id="resetGameBtn">🔄 Перемешать заново</button>
    </div>
    <div class="game-board">
      <div class="game-col"><h3>Вопросы</h3>${questionsHtml}</div>
      <div class="game-col"><h3>Ответы</h3>${answersHtml}</div>
    </div>
  `;
}

// ========== Режим 2: Тест ==========
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

// ========== Режим 3: Сопоставь все ==========
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

  let questions = shuffleArray(cards.map(card => ({ text: card.question, cardIndex: cards.indexOf(card) })));
  let answers = shuffleArray(cards.map(card => ({ text: card.answer, cardIndex: cards.indexOf(card) })));

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

// ========== Режим 4: Обычный аудио-тест ==========
function prepareAudioQuiz() {
  gameState.audioCards = shuffleArray([...cards]);
  gameState.audioIndex = 0;
  gameState.audioScore = 0;
  gameState.audioResults = [];
  gameState.audioSpeaking = false;
}

function renderAudioQuiz() {
  if (gameState.audioCards.length === 0) {
    prepareAudioQuiz();
  }

  const total = gameState.audioCards.length;
  const currentIndex = gameState.audioIndex;

  if (currentIndex >= total) {
    const errors = gameState.audioResults.filter(r => r.selectedAnswer !== r.correctAnswer);
    let errorHtml = '';
    if (errors.length > 0) {
      errorHtml = `
        <div style="margin-top:16px; text-align:left; max-width:500px; margin-left:auto; margin-right:auto;">
          <h3 style="color:#dc3545;">Ошибки (${errors.length}):</h3>
          ${errors.map(e => `
            <div style="background:#fff; border-radius:8px; padding:12px; margin-bottom:8px; border-left:4px solid #dc3545;">
              <div><strong>ГОСТ:</strong> ${e.question}</div>
              <div><span style="color:#dc3545;">✘ Ваш ответ:</span> ${e.selectedAnswer}</div>
              <div><span style="color:#28a745;">✔ Правильный:</span> ${e.correctAnswer}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="quiz-finish">
        <h2>🎧 Аудио-тест завершён!</h2>
        <p style="font-size:20px; margin:16px 0;">Правильных: ${gameState.audioScore} из ${total}</p>
        ${errors.length > 0 ? `<p style="color:#dc3545; font-weight:600;">Ошибок: ${errors.length}</p>` : '<p style="color:#28a745; font-weight:600;">🎉 Все верно! Молодец!</p>'}
        ${errorHtml}
        <button class="reset-btn" id="resetAudioQuizBtn" style="margin-top:20px;">🔄 Пройти заново</button>
      </div>
    `;
  }

  const currentCard = gameState.audioCards[currentIndex];
  const correctAnswer = currentCard.answer;

  const allAnswers = cards.map(c => c.answer);
  const distractors = allAnswers.filter(a => a !== correctAnswer);
  let options = [correctAnswer];
  const shuffledDistractors = shuffleArray(distractors);
  for (let i = 0; i < Math.min(3, shuffledDistractors.length); i++) {
    options.push(shuffledDistractors[i]);
  }
  while (options.length < 4) {
    options.push('???');
  }
  shuffleArray(options);

  const optionsHtml = options.map((opt, idx) => `
    <div class="audio-option" data-option="${opt}" data-index="${idx}">${opt}</div>
  `).join('');

  const speakBtnDisabled = gameState.audioSpeaking ? 'disabled' : '';
  const speakBtnText = gameState.audioSpeaking ? '🔊 Говорю...' : '🔊 Прослушать номер';

  return `
    <div class="quiz-stats">Вопрос ${currentIndex + 1} из ${total} | Правильных: ${gameState.audioScore}</div>
    <div class="audio-controls" style="display:flex; flex-direction:column; align-items:center; gap:16px; margin-top:10px;">
      <button class="audio-speak-btn" id="audioSpeakBtn" ${speakBtnDisabled}>
        ${speakBtnText}
      </button>
      <div class="audio-options">
        ${optionsHtml}
      </div>
    </div>
  `;
}

// ========== Режим 5: Аудио на время (с настройкой секунд) ==========
function prepareTimedAudioQuiz() {
  gameState.timedAudioCards = shuffleArray([...cards]);
  gameState.timedAudioIndex = 0;
  gameState.timedAudioScore = 0;
  gameState.timedAudioResults = [];
  gameState.timedAudioSpeaking = false;
  gameState.timedAudioStarted = false;
  gameState.timedAudioFinished = false;
  gameState.timedAudioTimeRemaining = gameState.timedAudioTimeLimit;
  if (gameState.timedAudioTimerId) {
    clearInterval(gameState.timedAudioTimerId);
    gameState.timedAudioTimerId = null;
  }
  // Сброс зафиксированных вариантов
  gameState.timedCurrentOptions = [];
  gameState.timedCurrentCorrect = '';
  gameState.timedCurrentQuestionIndex = -1;
}

// Функция генерации вариантов для текущего вопроса (вызывается только при смене вопроса)
function generateTimedOptions() {
  const index = gameState.timedAudioIndex;
  if (index >= gameState.timedAudioCards.length) return;
  const card = gameState.timedAudioCards[index];
  const correct = card.answer;
  const allAnswers = cards.map(c => c.answer);
  const distractors = allAnswers.filter(a => a !== correct);
  let options = [correct];
  const shuffledDistractors = shuffleArray(distractors);
  for (let i = 0; i < Math.min(3, shuffledDistractors.length); i++) {
    options.push(shuffledDistractors[i]);
  }
  while (options.length < 4) {
    options.push('???');
  }
  shuffleArray(options);
  gameState.timedCurrentOptions = options;
  gameState.timedCurrentCorrect = correct;
  gameState.timedCurrentQuestionIndex = index;
}

function renderTimedAudioQuiz() {
  if (gameState.timedAudioCards.length === 0 && !gameState.timedAudioFinished) {
    prepareTimedAudioQuiz();
  }

  const total = gameState.timedAudioCards.length;
  const currentIndex = gameState.timedAudioIndex;
  const started = gameState.timedAudioStarted;
  const finished = gameState.timedAudioFinished;

  // Если игра завершена или все вопросы пройдены
  if (finished || (started && currentIndex >= total)) {
    if (currentIndex >= total && !finished) {
      finishTimedAudioQuiz(true);
    }
    const errors = gameState.timedAudioResults.filter(r => r.selectedAnswer !== r.correctAnswer);
    let errorHtml = '';
    if (errors.length > 0) {
      errorHtml = `
        <div style="margin-top:16px; text-align:left; max-width:500px; margin-left:auto; margin-right:auto;">
          <h3 style="color:#dc3545;">Ошибки (${errors.length}):</h3>
          ${errors.map(e => `
            <div style="background:#fff; border-radius:8px; padding:12px; margin-bottom:8px; border-left:4px solid #dc3545;">
              <div><strong>ГОСТ:</strong> ${e.question}</div>
              <div><span style="color:#dc3545;">✘ Ваш ответ:</span> ${e.selectedAnswer}</div>
              <div><span style="color:#28a745;">✔ Правильный:</span> ${e.correctAnswer}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="quiz-finish">
        <h2>⏱ Аудио на время завершено!</h2>
        <p style="font-size:20px; margin:16px 0;">Правильных: ${gameState.timedAudioScore} из ${total}</p>
        ${errors.length > 0 ? `<p style="color:#dc3545; font-weight:600;">Ошибок: ${errors.length}</p>` : '<p style="color:#28a745; font-weight:600;">🎉 Все верно! Молодец!</p>'}
        ${errorHtml}
        <button class="reset-btn" id="resetTimedAudioBtn" style="margin-top:20px;">🔄 Пройти заново</button>
      </div>
    `;
  }

  // Если ещё не начали – настройка времени
  if (!started) {
    return `
      <div class="timed-setup" style="text-align:center; padding:20px 0;">
        <h3>⏱ Выберите время на прохождение всех карточек</h3>
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px; margin:16px 0;">
          <label style="font-size:16px; font-weight:500;">Время в секундах:</label>
          <input type="number" id="timedTimeInput" value="${gameState.timedAudioTimeLimit}" min="1" max="9999" 
                 style="padding:12px; font-size:18px; border-radius:12px; border:2px solid #ddd; width:120px; text-align:center;">
          <button class="timed-start-btn" id="timedStartBtn" 
                  style="padding:14px 32px; background:#4a6cf7; color:white; border:none; border-radius:50px; font-size:18px; font-weight:600; cursor:pointer;">
            🚀 Старт!
          </button>
        </div>
        <p style="color:#888; font-size:14px;">Всего карточек: ${total}</p>
      </div>
    `;
  }

  // Игра идёт – проверяем, нужно ли сгенерировать варианты для текущего вопроса
  if (gameState.timedCurrentQuestionIndex !== currentIndex || gameState.timedCurrentOptions.length === 0) {
    generateTimedOptions();
  }

  const options = gameState.timedCurrentOptions;
  const correctAnswer = gameState.timedCurrentCorrect;

  const optionsHtml = options.map((opt, idx) => `
    <div class="audio-option" data-option="${opt}" data-index="${idx}">${opt}</div>
  `).join('');

  const speakBtnDisabled = gameState.timedAudioSpeaking ? 'disabled' : '';
  const speakBtnText = gameState.timedAudioSpeaking ? '🔊 Говорю...' : '🔊 Прослушать номер';

  const progress = ((currentIndex) / total * 100).toFixed(0);
  const timeDisplay = gameState.timedAudioTimeRemaining > 0 ? gameState.timedAudioTimeRemaining : 0;

  return `
    <div class="timed-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <span class="quiz-stats">Вопрос ${currentIndex + 1} из ${total}</span>
      <span class="timed-timer" style="font-size:20px; font-weight:bold; color:${timeDisplay <= 3 ? '#dc3545' : '#4a6cf7'}">
        ⏱ ${timeDisplay} с
      </span>
      <span class="quiz-stats">Правильных: ${gameState.timedAudioScore}</span>
    </div>
    <div class="progress-bar" style="width:100%; height:6px; background:#e8ecf1; border-radius:3px; margin-bottom:16px;">
      <div style="width:${progress}%; height:100%; background:#4a6cf7; border-radius:3px; transition:width 0.3s;"></div>
    </div>
    <div class="audio-controls" style="display:flex; flex-direction:column; align-items:center; gap:16px; margin-top:10px;">
      <button class="audio-speak-btn" id="timedAudioSpeakBtn" ${speakBtnDisabled}>
        ${speakBtnText}
      </button>
      <div class="audio-options">
        ${optionsHtml}
      </div>
    </div>
  `;
}

function finishTimedAudioQuiz(success = false) {
  if (gameState.timedAudioTimerId) {
    clearInterval(gameState.timedAudioTimerId);
    gameState.timedAudioTimerId = null;
  }
  gameState.timedAudioFinished = true;
  renderGame();
}

// ========== Озвучивание с разбивкой ==========
function speakText(text) {
  if (!window.speechSynthesis) {
    alert('Ваш браузер не поддерживает синтез речи.');
    return;
  }
  const digits = text.replace(/\D/g, '');
  if (!digits) {
    alert('Не удалось распознать номер.');
    return;
  }

  let spoken = digits;
  const len = digits.length;
  if (len === 4) {
    const part1 = digits.substring(0, 2);
    const part2 = digits.substring(2, 4);
    spoken = part1 + ' ' + part2;
  } else if (len === 5) {
    const part1 = digits.substring(0, 2);
    const part2 = digits.substring(2, 5);
    spoken = part1 + ' ' + part2;
  } else {
    spoken = digits;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = 'ru-RU';
  utterance.rate = 1.2;
  utterance.pitch = 1;

  const isTimed = (gameState.mode === 'timedAudio');
  if (isTimed) {
    gameState.timedAudioSpeaking = true;
    renderGame();
    utterance.onend = () => {
      gameState.timedAudioSpeaking = false;
      renderGame();
    };
    utterance.onerror = () => {
      gameState.timedAudioSpeaking = false;
      renderGame();
      alert('Не удалось воспроизвести речь.');
    };
  } else {
    gameState.audioSpeaking = true;
    renderGame();
    utterance.onend = () => {
      gameState.audioSpeaking = false;
      renderGame();
    };
    utterance.onerror = () => {
      gameState.audioSpeaking = false;
      renderGame();
      alert('Не удалось воспроизвести речь.');
    };
  }

  window.speechSynthesis.speak(utterance);
}

// ========== Обработчики кликов ==========
gameContainer.addEventListener('click', (e) => {
  const target = e.target.closest('.game-item');
  if (target) {
    handleGameItemClick(target);
    return;
  }

  // Кнопки сброса
  if (e.target.id === 'resetGameBtn' || e.target.id === 'resetMatchAllBtn' || e.target.id === 'resetQuizBtn' || e.target.id === 'resetGameBtnMatch' || e.target.id === 'resetAudioQuizBtn' || e.target.id === 'resetTimedAudioBtn') {
    resetGame();
    if (gameState.mode === 'audioQuiz') prepareAudioQuiz();
    else if (gameState.mode === 'timedAudio') prepareTimedAudioQuiz();
    renderGame();
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

  // Обычный аудио-тест
  if (e.target.id === 'audioSpeakBtn') {
    const currentIndex = gameState.audioIndex;
    if (currentIndex < gameState.audioCards.length) {
      const questionText = gameState.audioCards[currentIndex].question;
      if (!gameState.audioSpeaking) {
        speakText(questionText);
      }
    }
    return;
  }

  const audioOpt = e.target.closest('.audio-option');
  if (audioOpt && gameState.mode === 'audioQuiz') {
    const currentIndex = gameState.audioIndex;
    if (currentIndex >= gameState.audioCards.length) return;
    const currentCard = gameState.audioCards[currentIndex];
    const selectedText = audioOpt.dataset.option;
    const correct = currentCard.answer;
    gameState.audioResults.push({
      question: currentCard.question,
      correctAnswer: correct,
      selectedAnswer: selectedText,
    });
    if (selectedText === correct) {
      gameState.audioScore++;
    }
    gameState.audioIndex++;
    renderGame();
    return;
  }

  // Аудио на время
  if (e.target.id === 'timedStartBtn') {
    const input = document.getElementById('timedTimeInput');
    if (input) {
      let seconds = parseInt(input.value);
      if (isNaN(seconds) || seconds < 1) seconds = 10;
      gameState.timedAudioTimeLimit = seconds;
      gameState.timedAudioTimeRemaining = seconds;
    }
    gameState.timedAudioStarted = true;
    gameState.timedAudioFinished = false;
    if (gameState.timedAudioTimerId) {
      clearInterval(gameState.timedAudioTimerId);
    }
    gameState.timedAudioTimerId = setInterval(() => {
      gameState.timedAudioTimeRemaining--;
      if (gameState.timedAudioTimeRemaining <= 0) {
        gameState.timedAudioTimeRemaining = 0;
        finishTimedAudioQuiz(false);
      } else {
        renderGame();
      }
    }, 1000);
    renderGame();
    return;
  }

  if (e.target.id === 'timedAudioSpeakBtn') {
    const currentIndex = gameState.timedAudioIndex;
    if (currentIndex < gameState.timedAudioCards.length && !gameState.timedAudioSpeaking && !gameState.timedAudioFinished) {
      const questionText = gameState.timedAudioCards[currentIndex].question;
      speakText(questionText);
    }
    return;
  }

  const timedOpt = e.target.closest('.audio-option');
  if (timedOpt && gameState.mode === 'timedAudio' && gameState.timedAudioStarted && !gameState.timedAudioFinished) {
    const currentIndex = gameState.timedAudioIndex;
    if (currentIndex >= gameState.timedAudioCards.length) return;
    const currentCard = gameState.timedAudioCards[currentIndex];
    const selectedText = timedOpt.dataset.option;
    const correct = gameState.timedCurrentCorrect; // используем сохранённый правильный ответ
    gameState.timedAudioResults.push({
      question: currentCard.question,
      correctAnswer: correct,
      selectedAnswer: selectedText,
    });
    if (selectedText === correct) {
      gameState.timedAudioScore++;
    }
    gameState.timedAudioIndex++;
    // Сброс зафиксированных вариантов для следующего вопроса
    gameState.timedCurrentOptions = [];
    gameState.timedCurrentCorrect = '';
    gameState.timedCurrentQuestionIndex = -1;
    if (gameState.timedAudioIndex >= gameState.timedAudioCards.length) {
      finishTimedAudioQuiz(true);
    } else {
      renderGame();
    }
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

// ========== Логика "Сопоставь пару" и "Сопоставь все" (без изменений) ==========
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

// ========== Общие утилиты ==========
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
