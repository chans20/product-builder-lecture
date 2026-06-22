const MIN = 1, MAX = 45, PICK = 6;
const MAX_SETS = 10, MIN_SETS = 1;

let setCount = 5;
let history = JSON.parse(localStorage.getItem('lotto-history') || '[]');

const resultsEl = document.getElementById('results');
const historyListEl = document.getElementById('history-list');
const setCountEl = document.getElementById('set-count');

function pickNumbers() {
  const pool = Array.from({ length: MAX }, (_, i) => i + 1);
  const picked = [];
  while (picked.length < PICK) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

function ballClass(n) {
  if (n <= 10) return 'y';
  if (n <= 20) return 'b';
  if (n <= 30) return 'r';
  if (n <= 40) return 'g';
  return 'gr';
}

function renderBalls(numbers, container, small = false) {
  numbers.forEach((n, i) => {
    const ball = document.createElement('div');
    ball.className = `ball ${ballClass(n)}`;
    ball.textContent = n;
    ball.style.animationDelay = `${i * 0.06}s`;
    container.appendChild(ball);
  });
}

function renderResults(sets) {
  resultsEl.innerHTML = '';
  sets.forEach((nums, idx) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.animationDelay = `${idx * 0.05}s`;

    const label = document.createElement('div');
    label.className = 'game-label';
    label.textContent = `${idx + 1}게임`;

    const balls = document.createElement('div');
    balls.className = 'balls';
    renderBalls(nums, balls);

    card.appendChild(label);
    card.appendChild(balls);
    resultsEl.appendChild(card);
  });
}

function saveHistory(sets) {
  const now = new Date();
  const timeStr = now.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  history.unshift({ time: timeStr, sets });
  if (history.length > 20) history.pop();
  localStorage.setItem('lotto-history', JSON.stringify(history));
}

function renderHistory() {
  if (history.length === 0) {
    historyListEl.innerHTML = '<p class="empty-msg">아직 추첨 기록이 없습니다.</p>';
    return;
  }
  historyListEl.innerHTML = '';
  history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = entry.time;
    item.appendChild(time);

    entry.sets.forEach((nums, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:0.7rem;color:#4a5568;min-width:32px';
      lbl.textContent = `${idx + 1}게임`;

      const balls = document.createElement('div');
      balls.className = 'history-balls';
      nums.forEach(n => {
        const b = document.createElement('div');
        b.className = `ball ${ballClass(n)}`;
        b.textContent = n;
        balls.appendChild(b);
      });

      row.appendChild(lbl);
      row.appendChild(balls);
      item.appendChild(row);
    });

    historyListEl.appendChild(item);
  });
}

function generate() {
  const sets = Array.from({ length: setCount }, pickNumbers);
  renderResults(sets);
  saveHistory(sets);
  renderHistory();
}

document.getElementById('generate-btn').addEventListener('click', generate);

document.getElementById('count-up').addEventListener('click', () => {
  if (setCount < MAX_SETS) {
    setCount++;
    setCountEl.textContent = setCount;
  }
});

document.getElementById('count-down').addEventListener('click', () => {
  if (setCount > MIN_SETS) {
    setCount--;
    setCountEl.textContent = setCount;
  }
});

document.getElementById('clear-history').addEventListener('click', () => {
  history = [];
  localStorage.removeItem('lotto-history');
  renderHistory();
});

renderHistory();
