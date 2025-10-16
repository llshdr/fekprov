// Enkel state
let currentTopic = null;
let flashcards = [];
let cardIndex = 0;
let isFlipped = false;

// Quiz state
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

// Match state
let matchPairs = [];
let selectedCard = null;
let matchedCount = 0;

// DOM refs
const topicSelect = document.getElementById('topicSelect');
const tabs = {
  flash: document.getElementById('tab-flashcards'),
  quiz: document.getElementById('tab-quiz'),
  match: document.getElementById('tab-match'),
  quizAll: document.getElementById('tab-quiz-all'),
  game: document.getElementById('tab-game'),
  exam: document.getElementById('tab-exam'),
};
const panels = {
  flash: document.getElementById('panel-flashcards'),
  quiz: document.getElementById('panel-quiz'),
  match: document.getElementById('panel-match'),
  quizAll: document.getElementById('panel-quiz-all'),
  game: document.getElementById('panel-game'),
  exam: document.getElementById('panel-exam'),
};

// Flashcards DOM
const flashFront = document.getElementById('flashcard-front');
const flashBack = document.getElementById('flashcard-back');
const flashCardEl = document.getElementById('flashcard');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnFlip = document.getElementById('btnFlip');
const btnShuffle = document.getElementById('btnShuffle');
const flashProgress = document.getElementById('flashProgress');

// Quiz DOM
const quizQuestionEl = document.getElementById('quizQuestion');
const quizOptionsEl = document.getElementById('quizOptions');
const quizCounterEl = document.getElementById('quizCounter');
const quizScoreEl = document.getElementById('quizScore');
const btnNextQuestion = document.getElementById('btnNextQuestion');
const btnRestartQuiz = document.getElementById('btnRestartQuiz');

// Match DOM
const matchGrid = document.getElementById('matchGrid');
const matchStatus = document.getElementById('matchStatus');
const btnNewMatch = document.getElementById('btnNewMatch');

function init() {
  // Fyll kapitel-lista
  for (const t of Topics) {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    topicSelect.appendChild(opt);
  }
  currentTopic = Topics[0];
  topicSelect.value = currentTopic;

  // nav lyssnare
  tabs.flash.addEventListener('click', () => switchTab('flash'));
  tabs.quiz.addEventListener('click', () => switchTab('quiz'));
  tabs.match.addEventListener('click', () => switchTab('match'));
  tabs.quizAll.addEventListener('click', () => switchTab('quizAll'));
  tabs.game.addEventListener('click', () => switchTab('game'));
  tabs.exam.addEventListener('click', () => switchTab('exam'));
  topicSelect.addEventListener('change', () => {
    currentTopic = topicSelect.value;
    setupAllModes();
  });

  // Flashcards lyssnare
  btnPrev.addEventListener('click', () => moveCard(-1));
  btnNext.addEventListener('click', () => moveCard(1));
  btnFlip.addEventListener('click', () => flipCard());
  btnShuffle.addEventListener('click', () => shuffleCards());
  flashCardEl.addEventListener('click', () => flipCard());
  document.addEventListener('keydown', (e) => {
    if (panels.flash.classList.contains('active')) {
      if (e.key === 'ArrowRight') moveCard(1);
      if (e.key === 'ArrowLeft') moveCard(-1);
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flipCard(); }
    }
  });

  // Quiz lyssnare
  btnNextQuestion.addEventListener('click', () => nextQuizQuestion());
  btnRestartQuiz.addEventListener('click', () => startQuiz());

  // Match lyssnare
  btnNewMatch.addEventListener('click', () => startMatch());

  // Quiz All lyssnare
  document.getElementById('btnQuizAllNext').addEventListener('click', () => nextQuizAll());
  document.getElementById('btnQuizAllRestart').addEventListener('click', () => startQuizAll());

  // Game lyssnare
  document.getElementById('btnGameStart').addEventListener('click', () => startGame());
  document.getElementById('btnGameRestart').addEventListener('click', () => startGame());

  setupAllModes();
}

function setupAllModes() {
  // Flashcards
  flashcards = getByTopic(currentTopic);
  cardIndex = 0; isFlipped = false;
  renderCard();

  // Quiz
  startQuiz();

  // Match
  startMatch();

  // Quiz All
  startQuizAll();

  // Game
  resetGameUI();

  // Exam
  buildExam();
}

function switchTab(name) {
  for (const key of Object.keys(tabs)) {
    const isActive = key === name;
    tabs[key].classList.toggle('active', isActive);
    panels[key].classList.toggle('active', isActive);
    panels[key].hidden = !isActive;
    tabs[key].setAttribute('aria-selected', String(isActive));
  }
}

// Flashcards
function renderCard() {
  if (flashcards.length === 0) {
    flashFront.textContent = 'Inga kort';
    flashBack.textContent = '';
    flashProgress.textContent = '0 / 0';
    return;
  }
  const item = flashcards[cardIndex];
  flashFront.textContent = item.question;
  flashBack.textContent = item.answer;
  isFlipped = false;
  flashCardEl.classList.toggle('flipped', isFlipped);
  flashProgress.textContent = `${cardIndex + 1} / ${flashcards.length}`;
}

function moveCard(step) {
  if (flashcards.length === 0) return;
  cardIndex = (cardIndex + step + flashcards.length) % flashcards.length;
  renderCard();
}

function flipCard() {
  isFlipped = !isFlipped;
  flashCardEl.classList.toggle('flipped', isFlipped);
}

function shuffleCards() {
  for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
  }
  cardIndex = 0;
  renderCard();
}

// Quiz
function startQuiz() {
  const pool = getByTopic(currentTopic);
  quizQuestions = [...pool];
  // Bygg flervalsalternativ med rätt + 3 fel slumpade
  // Om färre än 4 i pool, återanvänd
  quizIndex = 0; quizScore = 0;
  quizScoreEl.textContent = `Poäng: ${quizScore}`;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizQuestions.length === 0) {
    quizQuestionEl.textContent = 'Inga frågor.';
    quizOptionsEl.innerHTML = '';
    return;
  }
  const q = quizQuestions[quizIndex % quizQuestions.length];
  quizCounterEl.textContent = `Fråga ${quizIndex + 1} / ${quizQuestions.length}`;
  quizQuestionEl.textContent = q.question;
  const wrongPool = DATA.filter(x => x.id !== q.id && x.topic === currentTopic);
  const wrongAnswers = sampleMany(wrongPool.map(x => x.answer), 3);
  const options = shuffleArray([q.answer, ...wrongAnswers]);
  quizOptionsEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectOption(btn, opt === q.answer));
    quizOptionsEl.appendChild(btn);
  });
}

function selectOption(btn, isCorrect) {
  const already = Array.from(quizOptionsEl.children).some(c => c.classList.contains('correct') || c.classList.contains('incorrect'));
  if (already) return;
  if (isCorrect) { btn.classList.add('correct'); quizScore++; }
  else { btn.classList.add('incorrect'); }
  quizScoreEl.textContent = `Poäng: ${quizScore}`;
}

function nextQuizQuestion() {
  if (quizQuestions.length === 0) return;
  quizIndex = (quizIndex + 1) % quizQuestions.length;
  renderQuizQuestion();
}

function sampleMany(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  // om inte tillräckligt, fyll på repetitioner
  while (out.length < n && arr.length) out.push(arr[Math.floor(Math.random() * arr.length)]);
  return out;
}

function shuffleArray(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Matchning
function startMatch() {
  const pool = getByTopic(currentTopic);
  const pairs = pool.map((x, idx) => ({ key: `p${idx}`, q: x.question, a: x.answer }));
  // Ta upp till 8 par för rimlig storlek
  matchPairs = shuffleArray(pairs).slice(0, Math.min(8, pairs.length));
  const cards = [];
  matchPairs.forEach(p => {
    cards.push({ type: 'q', key: p.key, text: p.q });
    cards.push({ type: 'a', key: p.key, text: p.a });
  });
  const shuffled = shuffleArray(cards);
  matchGrid.innerHTML = '';
  selectedCard = null; matchedCount = 0;
  matchStatus.textContent = `${matchedCount} / ${matchPairs.length} par matchade`;
  shuffled.forEach(c => {
    const el = document.createElement('div');
    el.className = 'match-card';
    el.textContent = c.text;
    el.dataset.key = c.key;
    el.dataset.type = c.type;
    el.addEventListener('click', () => onMatchClick(el));
    matchGrid.appendChild(el);
  });
}

function onMatchClick(el) {
  if (el.classList.contains('matched')) return;
  if (!selectedCard) {
    selectedCard = el; el.classList.add('selected'); return;
  }
  if (selectedCard === el) { el.classList.remove('selected'); selectedCard = null; return; }
  const isPair = el.dataset.key === selectedCard.dataset.key && el.dataset.type !== selectedCard.dataset.type;
  if (isPair) {
    el.classList.remove('selected');
    el.classList.add('matched');
    selectedCard.classList.remove('selected');
    selectedCard.classList.add('matched');
    selectedCard = null;
    matchedCount++;
    matchStatus.textContent = `${matchedCount} / ${matchPairs.length} par matchade`;
  } else {
    el.classList.add('selected');
    setTimeout(() => {
      el.classList.remove('selected');
      if (selectedCard) selectedCard.classList.remove('selected');
      selectedCard = null;
    }, 500);
  }
}

// Init
window.addEventListener('DOMContentLoaded', init);

// ------------------------------
// Alla kapitel – Quiz + Leaderboard
// ------------------------------
let quizAllPool = [];
let quizAllIndex = 0;
let quizAllScore = 0;

function startQuizAll() {
  quizAllPool = shuffleArray([...DATA]);
  quizAllIndex = 0;
  quizAllScore = 0;
  document.getElementById('quizAllScore').textContent = `Poäng: ${quizAllScore}`;
  renderQuizAll();
}

function renderQuizAll() {
  const counter = document.getElementById('quizAllCounter');
  const qEl = document.getElementById('quizAllQuestion');
  const optsEl = document.getElementById('quizAllOptions');
  if (quizAllIndex >= quizAllPool.length) {
    qEl.textContent = `Klart! Slutpoäng: ${quizAllScore} / ${quizAllPool.length}`;
    optsEl.innerHTML = '';
    promptNameAndSave('lbQuizAll', quizAllScore);
    return;
  }
  const q = quizAllPool[quizAllIndex];
  counter.textContent = `Fråga ${quizAllIndex + 1} / ${quizAllPool.length}`;
  qEl.textContent = q.question;
  const wrongPool = DATA.filter(x => x.id !== q.id);
  const wrongAnswers = sampleMany(wrongPool.map(x => x.answer), 3);
  const options = shuffleArray([q.answer, ...wrongAnswers]);
  optsEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectQuizAll(btn, opt === q.answer));
    optsEl.appendChild(btn);
  });
}

function selectQuizAll(btn, isCorrect) {
  const optsEl = document.getElementById('quizAllOptions');
  const already = Array.from(optsEl.children).some(c => c.classList.contains('correct') || c.classList.contains('incorrect'));
  if (already) return;
  if (isCorrect) { btn.classList.add('correct'); quizAllScore++; }
  else { btn.classList.add('incorrect'); }
  document.getElementById('quizAllScore').textContent = `Poäng: ${quizAllScore}`;
}

function nextQuizAll() {
  if (quizAllIndex < quizAllPool.length) quizAllIndex++;
  renderQuizAll();
}

function promptNameAndSave(lbId, score) {
  const name = prompt('Skriv ditt namn för leaderboarden:');
  if (!name) return renderLeaderboard(lbId);
  const key = `leaderboard:${lbId}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.push({ name, score, ts: Date.now() });
  list.sort((a, b) => b.score - a.score || a.ts - b.ts);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
  renderLeaderboard(lbId);
}

function renderLeaderboard(lbId) {
  const key = `leaderboard:${lbId}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const ol = document.getElementById(lbId);
  ol.innerHTML = '';
  list.forEach((row, i) => {
    const li = document.createElement('li');
    li.textContent = `#${i + 1} ${row.name} – ${row.score}`;
    ol.appendChild(li);
  });
}

// ------------------------------
// Concept Rush – litet spel + Leaderboard
// ------------------------------
let gameTimeLeft = 60;
let gameScore = 0;
let gameStreak = 0;
let gameTimerId = null;
let currentGameQuestion = null;

function resetGameUI() {
  document.getElementById('gameTimer').textContent = `Tid: 60s`;
  document.getElementById('gameScore').textContent = `Poäng: 0`;
  document.getElementById('gameStreak').textContent = `Streak: 0`;
  document.getElementById('gamePrompt').textContent = 'Matcha rätt svar snabbt!';
  document.getElementById('gameChoices').innerHTML = '';
  renderLeaderboard('lbGame');
}

function startGame() {
  clearInterval(gameTimerId);
  gameTimeLeft = 60; gameScore = 0; gameStreak = 0;
  document.getElementById('gameTimer').textContent = `Tid: ${gameTimeLeft}s`;
  document.getElementById('gameScore').textContent = `Poäng: ${gameScore}`;
  document.getElementById('gameStreak').textContent = `Streak: ${gameStreak}`;
  nextGameRound();
  gameTimerId = setInterval(() => {
    gameTimeLeft--; document.getElementById('gameTimer').textContent = `Tid: ${gameTimeLeft}s`;
    if (gameTimeLeft <= 0) { clearInterval(gameTimerId); endGame(); }
  }, 1000);
}

function nextGameRound() {
  const q = DATA[Math.floor(Math.random() * DATA.length)];
  currentGameQuestion = q;
  document.getElementById('gamePrompt').textContent = q.question;
  const wrong = sampleMany(DATA.filter(x => x.id !== q.id).map(x => x.answer), 3);
  const options = shuffleArray([q.answer, ...wrong]);
  const choicesEl = document.getElementById('gameChoices');
  choicesEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => onGameAnswer(opt === q.answer));
    choicesEl.appendChild(btn);
  });
}

function onGameAnswer(correct) {
  if (correct) {
    gameStreak++;
    const add = 10 + Math.min(40, gameStreak * 2); // ökar med streak
    gameScore += add;
  } else {
    gameStreak = 0;
    gameScore = Math.max(0, gameScore - 5);
  }
  document.getElementById('gameScore').textContent = `Poäng: ${gameScore}`;
  document.getElementById('gameStreak').textContent = `Streak: ${gameStreak}`;
  // bonus tid då och då
  if (correct && gameStreak % 5 === 0) {
    gameTimeLeft = Math.min(90, gameTimeLeft + 3);
    document.getElementById('gameTimer').textContent = `Tid: ${gameTimeLeft}s`;
  }
  nextGameRound();
}

function endGame() {
  document.getElementById('gamePrompt').textContent = `Tid slut! Slutpoäng: ${gameScore}`;
  document.getElementById('gameChoices').innerHTML = '';
  promptNameAndSave('lbGame', gameScore);
}

// ------------------------------
// Prov (Kap 3–6)
// ------------------------------
function buildExam() {
  document.getElementById('btnExamGenerate').addEventListener('click', () => renderExam());
  document.getElementById('btnExamGrade').addEventListener('click', () => gradeExam());
  document.getElementById('btnExamReset').addEventListener('click', () => resetExamAnswers());
  document.getElementById('btnExamSave').addEventListener('click', () => saveExamResult());
  renderLeaderboard('lbExam');
  renderExam();
}

function renderExam() {
  // 4 Sant/Falskt
  const tfCont = document.getElementById('examTF');
  const tfQs = buildTrueFalseQuestions(DATA, 4);
  tfCont.innerHTML = '';
  const tfWrap = document.createElement('div');
  tfWrap.className = 'exam-tf';
  tfQs.forEach((q, i) => {
    const row = document.createElement('div');
    row.className = 'tf-row';
    const label = document.createElement('label');
    label.textContent = `${i + 1}. ${q.statement}`;
    const sel = document.createElement('select');
    sel.innerHTML = '<option value="">Välj</option><option value="true">Sant</option><option value="false">Falskt</option>';
    sel.dataset.correct = String(q.correct);
    row.appendChild(label); row.appendChild(sel);
    tfWrap.appendChild(row);
  });
  tfCont.appendChild(tfWrap);

  // 5 förklara kort
  const shortCont = document.getElementById('examExplainShort');
  const shortQs = sampleMany(DATA, Math.min(5, DATA.length));
  shortCont.innerHTML = '';
  shortQs.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `<h4>${idx + 1}. Förklara kort: ${q.question}</h4><textarea placeholder="Skriv kort förklaring...\n(Tips: kika på dina flashcards)"></textarea>`;
    shortCont.appendChild(item);
  });

  // 2 medellånga
  const medCont = document.getElementById('examExplainMedium');
  const medQs = sampleMany(DATA, Math.min(2, DATA.length));
  medCont.innerHTML = '';
  medQs.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `<h4>${idx + 1}. Förklara mer utförligt: ${q.question}</h4><textarea placeholder="Resonera och utveckla 5–8 meningar..."></textarea>`;
    medCont.appendChild(item);
  });

  // 3 större resonemang
  const bigCont = document.getElementById('examBig');
  const bigQs = buildBigQuestions();
  bigCont.innerHTML = '';
  bigQs.forEach((text, idx) => {
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `<h4>${idx + 1}. ${text}</h4><textarea placeholder="Skriv ett utvecklat svar (minst 8–12 meningar, jämför och resonera)..."></textarea>`;
    bigCont.appendChild(item);
  });

  // Nollställ live-poäng (TF)
  document.getElementById('examScoreLive').textContent = 'Poäng (TF): 0/4';
}

function buildTrueFalseQuestions(pool, n) {
  const base = sampleMany(pool, Math.min(n, pool.length));
  // Skapa påståenden genom att ibland använda korrekt svar och ibland förvanska
  return base.map(item => {
    const flip = Math.random() < 0.5;
    if (!flip) {
      return { statement: item.question + ' – ' + item.answer, correct: true };
    }
    // Förvanska: byt ut svaret mot ett annat
    const wrong = sampleMany(pool.filter(x => x.id !== item.id).map(x => x.answer), 1)[0];
    return { statement: item.question + ' – ' + wrong, correct: false };
  });
}

function gradeExam() {
  // Rätta endast TF automatiskt (4 p)
  const selects = document.querySelectorAll('#examTF select');
  let correct = 0;
  selects.forEach(sel => {
    const val = sel.value;
    if (!val) return;
    if (String(sel.dataset.correct) === val) correct++;
  });
  document.getElementById('examScoreLive').textContent = `Poäng (TF): ${correct}/4`;
  alert('TF-poäng uppdaterad. Övriga frågor bedöms manuellt.');
}

function resetExamAnswers() {
  document.querySelectorAll('#panel-exam textarea').forEach(t => t.value = '');
  document.querySelectorAll('#examTF select').forEach(s => s.value = '');
  document.getElementById('examScoreLive').textContent = 'Poäng (TF): 0/4';
}

function saveExamResult() {
  const name = (document.getElementById('examName').value || '').trim();
  if (!name) { alert('Skriv ett namn först.'); return; }
  const tfScoreText = document.getElementById('examScoreLive').textContent;
  const tfScore = parseInt(tfScoreText.match(/(\d+)\/4/)?.[1] || '0', 10);
  const key = 'leaderboard:lbExam';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.push({ name, score: tfScore, ts: Date.now() });
  list.sort((a, b) => b.score - a.score || a.ts - b.ts);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
  renderLeaderboard('lbExam');
  alert('Resultat sparat (TF-poäng).');
}

function buildBigQuestions() {
  const arr = [
    'Beskriv ett valfritt företags affärsidé utifrån de fyra grundstenarna (problem, målgrupp, lösning, resurser).',
    'Jämför funktionsindelad och produkt-/kundindelad organisation. Resonera kring styrkor och svagheter.',
    'Diskutera hur ett företag kan finansiera expansion jämfört med startfas och motivera valen.',
    'Resonera kring X- och Y-teorin och hur ledarskap kan anpassas i praktiken.',
    'Gör en SWOT-analys av en ny affärsidé och föreslå åtgärder.'
  ];
  return sampleMany(arr, 3);
}


