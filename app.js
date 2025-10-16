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
  quest: document.getElementById('tab-quest'),
  exam: document.getElementById('tab-exam'),
};
const panels = {
  flash: document.getElementById('panel-flashcards'),
  quiz: document.getElementById('panel-quiz'),
  match: document.getElementById('panel-match'),
  quizAll: document.getElementById('panel-quiz-all'),
  game: document.getElementById('panel-game'),
  quest: document.getElementById('panel-quest'),
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
  tabs.quest.addEventListener('click', () => switchTab('quest'));
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

  // Quest
  initQuest();

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

// ------------------------------
// Knowledge Quest RPG
// ------------------------------
let questState = {
  level: 1,
  xp: 0,
  xpNeeded: 100,
  hp: 100,
  maxHp: 100,
  gold: 0,
  location: 'Startdungeon',
  inBattle: false,
  currentEnemy: null,
  currentQuestion: null,
  inventory: [],
  achievements: [],
  upgrades: [],
  enemiesDefeated: 0,
  questionsAnswered: 0,
  difficulty: 1,
  timeLimit: 0,
  currentTimer: 0,
  timerInterval: null
};

const ENEMIES = [
  { name: 'Dungeon Goblin', emoji: '👹', hp: 50, xpReward: 25, goldReward: 10, difficulty: 1, timeLimit: 0 },
  { name: 'Knowledge Troll', emoji: '🧌', hp: 75, xpReward: 35, goldReward: 15, difficulty: 1, timeLimit: 0 },
  { name: 'Business Dragon', emoji: '🐉', hp: 100, xpReward: 50, goldReward: 25, difficulty: 2, timeLimit: 0 },
  { name: 'Finance Phantom', emoji: '👻', hp: 80, xpReward: 40, goldReward: 20, difficulty: 2, timeLimit: 0 },
  { name: 'Management Beast', emoji: '🦁', hp: 90, xpReward: 45, goldReward: 22, difficulty: 2, timeLimit: 0 },
  { name: 'SWOT Demon', emoji: '😈', hp: 150, xpReward: 75, goldReward: 40, difficulty: 3, timeLimit: 15 },
  { name: 'Leadership Titan', emoji: '👑', hp: 200, xpReward: 100, goldReward: 60, difficulty: 4, timeLimit: 12 },
  { name: 'Final Boss - Knowledge King', emoji: '🧙‍♂️', hp: 300, xpReward: 200, goldReward: 100, difficulty: 5, timeLimit: 10 }
];

const SHOP_ITEMS = [
  { id: 'health_potion', name: '💊 Health Potion', description: 'Heal 50 HP', price: 20, effect: 'heal', value: 50 },
  { id: 'knowledge_boost', name: '📚 Knowledge Boost', description: '+25% XP för 5 strider', price: 50, effect: 'xp_boost', value: 25, duration: 5 },
  { id: 'time_extension', name: '⏰ Time Extension', description: '+5 sekunder på timer', price: 30, effect: 'time_boost', value: 5 },
  { id: 'damage_boost', name: '⚔️ Damage Boost', description: '+50% skada för 3 strider', price: 40, effect: 'damage_boost', value: 50, duration: 3 },
  { id: 'gold_magnet', name: '💰 Gold Magnet', description: '+100% guld för 10 strider', price: 60, effect: 'gold_boost', value: 100, duration: 10 },
  { id: 'wisdom_amulet', name: '🔮 Wisdom Amulet', description: 'Permanent +10% XP', price: 200, effect: 'permanent_xp', value: 10, permanent: true },
  { id: 'speed_ring', name: '💍 Speed Ring', description: 'Permanent +3 sekunder timer', price: 150, effect: 'permanent_time', value: 3, permanent: true },
  { id: 'power_gauntlet', name: '🦾 Power Gauntlet', description: 'Permanent +25% skada', price: 300, effect: 'permanent_damage', value: 25, permanent: true }
];

const LOCATIONS = [
  'Startdungeon', 'Knowledge Cavern', 'Business Forest', 'Finance Mountains', 
  'Management Valley', 'Leadership Peak', 'Final Boss Chamber'
];

function initQuest() {
  document.getElementById('btnQuestStart').addEventListener('click', startQuest);
  document.getElementById('btnQuestAttack').addEventListener('click', attackEnemy);
  document.getElementById('btnQuestContinue').addEventListener('click', continueQuest);
  document.getElementById('btnQuestRestart').addEventListener('click', restartQuest);
  document.getElementById('btnOpenShop').addEventListener('click', openShop);
  document.getElementById('btnShopClose').addEventListener('click', closeShop);
  renderLeaderboard('lbQuest');
  updateQuestUI();
}

function startQuest() {
  questState.inBattle = false;
  questState.currentEnemy = null;
  document.getElementById('questScene').style.display = 'block';
  document.getElementById('questBattle').style.display = 'none';
  document.getElementById('btnQuestStart').style.display = 'none';
  document.getElementById('btnQuestAttack').style.display = 'none';
  document.getElementById('btnQuestContinue').style.display = 'block';
  
  // Spawn random enemy
  spawnEnemy();
  updateQuestUI();
}

function spawnEnemy() {
  // Difficulty increases with level and location
  const locationIndex = LOCATIONS.indexOf(questState.location);
  const difficultyLevel = Math.min(5, Math.floor(questState.level / 2) + locationIndex + 1);
  
  // Filter enemies by difficulty
  const availableEnemies = ENEMIES.filter(e => e.difficulty <= difficultyLevel);
  const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
  
  questState.currentEnemy = { ...enemy, currentHp: enemy.hp };
  questState.difficulty = difficultyLevel;
  questState.timeLimit = enemy.timeLimit;
  
  document.getElementById('questEnemy').style.display = 'block';
  document.getElementById('questEnemy').textContent = enemy.emoji;
  
  let dialogue = `Ett ${enemy.name} har dykt upp! Din kunskap är ditt vapen - svara på frågor för att besegra det!`;
  if (enemy.timeLimit > 0) {
    dialogue += `\n\n⚠️ VARNING: Du har bara ${enemy.timeLimit} sekunder per fråga!`;
  }
  
  document.getElementById('questDialogue').textContent = dialogue;
  
  document.getElementById('btnQuestContinue').style.display = 'none';
  document.getElementById('btnQuestAttack').style.display = 'block';
}

function attackEnemy() {
  if (!questState.currentEnemy) return;
  
  // Show battle interface
  document.getElementById('questScene').style.display = 'none';
  document.getElementById('questBattle').style.display = 'block';
  
  // Generate question based on difficulty
  const availableQuestions = DATA.filter(q => {
    const topicDifficulty = getTopicDifficulty(q.topic);
    return topicDifficulty <= questState.difficulty;
  });
  
  const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  questState.currentQuestion = question;
  
  document.getElementById('battleEnemyAvatar').textContent = questState.currentEnemy.emoji;
  document.getElementById('battleEnemyName').textContent = questState.currentEnemy.name;
  document.getElementById('enemyHP').textContent = `${questState.currentEnemy.currentHp}/${questState.currentEnemy.hp}`;
  document.getElementById('enemyHPFill').style.width = `${(questState.currentEnemy.currentHp / questState.currentEnemy.hp) * 100}%`;
  
  document.getElementById('battleQuestion').textContent = question.question;
  
  // Start timer if needed
  if (questState.timeLimit > 0) {
    startTimer();
  }
  
  // Generate wrong answers
  const wrongAnswers = sampleMany(DATA.filter(x => x.id !== question.id).map(x => x.answer), 3);
  const options = shuffleArray([question.answer, ...wrongAnswers]);
  
  const optionsEl = document.getElementById('battleOptions');
  optionsEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'battle-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleBattleAnswer(btn, opt === question.answer));
    optionsEl.appendChild(btn);
  });
}

function getTopicDifficulty(topic) {
  const difficulties = {
    'Kap 3: Affärsidé': 1,
    'Kap 4: Företagsformer': 2,
    'Kap 5: Finansiering': 3,
    'Kap 6: Organisation & kultur': 4
  };
  return difficulties[topic] || 1;
}

function startTimer() {
  questState.currentTimer = questState.timeLimit;
  updateTimerDisplay();
  
  questState.timerInterval = setInterval(() => {
    questState.currentTimer--;
    updateTimerDisplay();
    
    if (questState.currentTimer <= 0) {
      clearInterval(questState.timerInterval);
      handleTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('battleQuestion');
  if (!timerEl) return;
  
  const timerDisplay = document.createElement('div');
  timerDisplay.className = 'timer-display';
  
  if (questState.currentTimer <= 3) {
    timerDisplay.classList.add('danger');
  } else if (questState.currentTimer <= 5) {
    timerDisplay.classList.add('warning');
  }
  
  timerDisplay.textContent = `⏰ ${questState.currentTimer}s`;
  
  // Remove existing timer
  const existingTimer = document.querySelector('.timer-display');
  if (existingTimer) {
    existingTimer.remove();
  }
  
  timerEl.appendChild(timerDisplay);
}

function handleTimeUp() {
  const options = document.querySelectorAll('.battle-option');
  options.forEach(opt => opt.disabled = true);
  
  document.getElementById('battleResult').style.display = 'block';
  document.getElementById('battleResult').textContent = '⏰ TID SLUT! Du missade frågan!';
  document.getElementById('battleResult').style.color = 'var(--bad)';
  
  // Take damage for time up
  const damage = 15 + Math.floor(Math.random() * 10);
  questState.hp = Math.max(0, questState.hp - damage);
  
  updateQuestUI();
  
  if (questState.hp <= 0) {
    setTimeout(() => gameOver(), 1500);
  } else {
    setTimeout(() => {
      document.getElementById('battleResult').style.display = 'none';
      attackEnemy(); // Try again
    }, 2000);
  }
}

function handleBattleAnswer(btn, isCorrect) {
  // Clear timer
  if (questState.timerInterval) {
    clearInterval(questState.timerInterval);
    questState.timerInterval = null;
  }
  
  const options = document.querySelectorAll('.battle-option');
  options.forEach(opt => opt.disabled = true);
  
  if (isCorrect) {
    btn.classList.add('correct');
    
    // Calculate damage with upgrades
    let baseDamage = 25 + Math.floor(Math.random() * 15); // 25-40 damage
    const damageBoost = questState.upgrades.filter(u => u.effect === 'damage_boost' || u.effect === 'permanent_damage').length;
    const totalDamage = Math.floor(baseDamage * (1 + damageBoost * 0.25));
    
    questState.currentEnemy.currentHp = Math.max(0, questState.currentEnemy.currentHp - totalDamage);
    questState.questionsAnswered++;
    
    document.getElementById('battleResult').style.display = 'block';
    document.getElementById('battleResult').textContent = `Korrekt! Du gjorde ${totalDamage} skada!`;
    document.getElementById('battleResult').style.color = 'var(--good)';
    
    // Update enemy HP
    document.getElementById('enemyHP').textContent = `${questState.currentEnemy.currentHp}/${questState.currentEnemy.hp}`;
    document.getElementById('enemyHPFill').style.width = `${(questState.currentEnemy.currentHp / questState.currentEnemy.hp) * 100}%`;
    
    if (questState.currentEnemy.currentHp <= 0) {
      // Enemy defeated!
      setTimeout(() => defeatEnemy(), 1500);
    } else {
      setTimeout(() => {
        document.getElementById('battleResult').style.display = 'none';
        attackEnemy(); // Next question
      }, 2000);
    }
  } else {
    btn.classList.add('incorrect');
    const damage = 10 + Math.floor(Math.random() * 10); // 10-20 damage to player
    questState.hp = Math.max(0, questState.hp - damage);
    
    document.getElementById('battleResult').style.display = 'block';
    document.getElementById('battleResult').textContent = `Fel svar! Du tog ${damage} skada!`;
    document.getElementById('battleResult').style.color = 'var(--bad)';
    
    updateQuestUI();
    
    if (questState.hp <= 0) {
      setTimeout(() => gameOver(), 1500);
    } else {
      setTimeout(() => {
        document.getElementById('battleResult').style.display = 'none';
        attackEnemy(); // Try again
      }, 2000);
    }
  }
}

function defeatEnemy() {
  questState.enemiesDefeated++;
  
  // Calculate XP and gold with upgrades
  let xpReward = questState.currentEnemy.xpReward;
  let goldReward = questState.currentEnemy.goldReward;
  
  const xpBoost = questState.upgrades.filter(u => u.effect === 'xp_boost' || u.effect === 'permanent_xp').length;
  const goldBoost = questState.upgrades.filter(u => u.effect === 'gold_boost').length;
  
  xpReward = Math.floor(xpReward * (1 + xpBoost * 0.25));
  goldReward = Math.floor(goldReward * (1 + goldBoost));
  
  questState.xp += xpReward;
  questState.gold += goldReward;
  
  // Check for level up
  if (questState.xp >= questState.xpNeeded) {
    levelUp();
  }
  
  // Check achievements
  checkAchievements();
  
  document.getElementById('battleResult').textContent = 
    `Besegrat! +${xpReward} XP, +${goldReward} guld!`;
  document.getElementById('battleResult').style.color = 'var(--good)';
  
  setTimeout(() => {
    document.getElementById('questBattle').style.display = 'none';
    document.getElementById('questScene').style.display = 'block';
    document.getElementById('questEnemy').style.display = 'none';
    document.getElementById('btnQuestAttack').style.display = 'none';
    document.getElementById('btnQuestContinue').style.display = 'block';
    
    // Move to next location
    const currentIndex = LOCATIONS.indexOf(questState.location);
    if (currentIndex < LOCATIONS.length - 1) {
      questState.location = LOCATIONS[currentIndex + 1];
    }
    
    updateQuestUI();
    document.getElementById('questDialogue').textContent = 
      `Bra jobbat! Du har besegrat ${questState.currentEnemy.name}. Fortsätt din resa till ${questState.location}!`;
  }, 2000);
}

function levelUp() {
  questState.level++;
  questState.maxHp += 20;
  questState.hp = questState.maxHp; // Full heal on level up
  questState.xpNeeded = Math.floor(questState.xpNeeded * 1.5);
  
  document.getElementById('questDialogue').textContent = 
    `🎉 LEVEL UP! Du är nu level ${questState.level}! +20 max HP, full healing!`;
}

function checkAchievements() {
  const newAchievements = [];
  
  if (questState.enemiesDefeated === 1 && !questState.achievements.includes('first_kill')) {
    newAchievements.push('first_kill');
    questState.achievements.push('first_kill');
  }
  
  if (questState.questionsAnswered === 10 && !questState.achievements.includes('scholar')) {
    newAchievements.push('scholar');
    questState.achievements.push('scholar');
  }
  
  if (questState.level >= 5 && !questState.achievements.includes('master')) {
    newAchievements.push('master');
    questState.achievements.push('master');
  }
  
  if (newAchievements.length > 0) {
    const achievementNames = {
      'first_kill': '🏆 Första mordet',
      'scholar': '📚 Lärde',
      'master': '👑 Mästare'
    };
    
    const newAchievementText = newAchievements.map(a => achievementNames[a]).join(', ');
    document.getElementById('questDialogue').textContent += `\n\n🏆 Achievement unlocked: ${newAchievementText}!`;
  }
  
  updateQuestUI();
}

function gameOver() {
  document.getElementById('questDialogue').textContent = 
    `💀 GAME OVER! Du besegrade ${questState.enemiesDefeated} fiender och svarade på ${questState.questionsAnswered} frågor.`;
  
  document.getElementById('btnQuestStart').style.display = 'block';
  document.getElementById('btnQuestAttack').style.display = 'none';
  document.getElementById('btnQuestContinue').style.display = 'none';
  
  // Save score
  const name = prompt('Skriv ditt namn för leaderboarden:');
  if (name) {
    const key = 'leaderboard:lbQuest';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ 
      name, 
      score: questState.enemiesDefeated * 10 + questState.questionsAnswered * 5 + questState.level * 20,
      enemies: questState.enemiesDefeated,
      questions: questState.questionsAnswered,
      level: questState.level,
      ts: Date.now() 
    });
    list.sort((a, b) => b.score - a.score || a.ts - b.ts);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
    renderLeaderboard('lbQuest');
  }
}

function continueQuest() {
  if (questState.location === 'Final Boss Chamber') {
    document.getElementById('questDialogue').textContent = 
      '🎉 Grattis! Du har klarat Knowledge Quest! Du är nu en mästare inom företagsekonomi!';
    return;
  }
  
  spawnEnemy();
}

function restartQuest() {
  questState = {
    level: 1,
    xp: 0,
    xpNeeded: 100,
    hp: 100,
    maxHp: 100,
    gold: 0,
    location: 'Startdungeon',
    inBattle: false,
    currentEnemy: null,
    currentQuestion: null,
    inventory: [],
    achievements: [],
    enemiesDefeated: 0,
    questionsAnswered: 0
  };
  
  document.getElementById('questScene').style.display = 'block';
  document.getElementById('questBattle').style.display = 'none';
  document.getElementById('questEnemy').style.display = 'none';
  document.getElementById('btnQuestStart').style.display = 'block';
  document.getElementById('btnQuestAttack').style.display = 'none';
  document.getElementById('btnQuestContinue').style.display = 'none';
  
  updateQuestUI();
  document.getElementById('questDialogue').textContent = 
    'Välkommen till Knowledge Quest! Din uppgift är att utforska dungeons och besegra monster genom att svara på frågor. Klicka "Starta äventyr" för att börja!';
}

function openShop() {
  document.getElementById('questShop').style.display = 'block';
  renderShop();
}

function closeShop() {
  document.getElementById('questShop').style.display = 'none';
}

function renderShop() {
  const shopItemsEl = document.getElementById('shopItems');
  shopItemsEl.innerHTML = '';
  
  SHOP_ITEMS.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'shop-item';
    
    const owned = questState.inventory.some(i => i.id === item.id);
    const affordable = questState.gold >= item.price;
    
    if (owned && item.permanent) {
      itemEl.classList.add('owned');
    } else if (affordable) {
      itemEl.classList.add('affordable');
    } else {
      itemEl.classList.add('expensive');
    }
    
    itemEl.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.description}</p>
      <div class="price">💰 ${item.price} guld</div>
    `;
    
    if (!owned || !item.permanent) {
      itemEl.addEventListener('click', () => buyItem(item));
    }
    
    shopItemsEl.appendChild(itemEl);
  });
}

function buyItem(item) {
  if (questState.gold < item.price) {
    alert('Inte tillräckligt med guld!');
    return;
  }
  
  if (item.permanent && questState.inventory.some(i => i.id === item.id)) {
    alert('Du äger redan denna permanenta uppgradering!');
    return;
  }
  
  questState.gold -= item.price;
  
  if (item.effect === 'heal') {
    questState.hp = Math.min(questState.maxHp, questState.hp + item.value);
    alert(`Du använde ${item.name} och healade ${item.value} HP!`);
  } else {
    questState.inventory.push({ ...item, uses: item.duration || 0 });
    questState.upgrades.push({ ...item, uses: item.duration || 0 });
    alert(`Du köpte ${item.name}!`);
  }
  
  updateQuestUI();
  renderShop();
}

function updateQuestUI() {
  document.getElementById('questLevel').textContent = questState.level;
  document.getElementById('questXP').textContent = questState.xp;
  document.getElementById('questXPNeeded').textContent = questState.xpNeeded;
  document.getElementById('questHP').textContent = questState.hp;
  document.getElementById('questGold').textContent = questState.gold;
  document.getElementById('questLocation').textContent = questState.location;
  
  // Update progress bar
  const progressPercent = (questState.xp / questState.xpNeeded) * 100;
  document.getElementById('questProgressFill').style.width = `${Math.min(100, progressPercent)}%`;
  
  // Update inventory
  const inventoryText = questState.inventory.length > 0 
    ? questState.inventory.map(i => `${i.name} (${i.uses || '∞'})`).join(', ') 
    : 'Tom';
  document.getElementById('questInventory').textContent = inventoryText;
  
  // Update achievements
  const achievementNames = {
    'first_kill': '🏆 Första mordet',
    'scholar': '📚 Lärde', 
    'master': '👑 Mästare',
    'shopaholic': '🛒 Shopaholic',
    'speed_demon': '⚡ Speed Demon',
    'knowledge_king': '👑 Knowledge King'
  };
  
  const achievementText = questState.achievements.length > 0
    ? questState.achievements.map(a => achievementNames[a]).join(', ')
    : 'Inga än';
  document.getElementById('questAchievements').textContent = achievementText;
  
  // Update upgrades
  const upgradeText = questState.upgrades.length > 0
    ? questState.upgrades.map(u => `${u.name} (${u.uses || '∞'})`).join(', ')
    : 'Inga än';
  document.getElementById('questUpgrades').textContent = upgradeText;
}


