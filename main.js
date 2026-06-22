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

// ---- 당첨 번호 조회 ----
const LOTTO_API = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';

// 추첨은 매주 토요일 20:35 KST — 아직 추첨 안 된 회차 요청을 피하기 위해
// 가장 최근에 완료된 토요일 기준으로 회차 계산
function estimateLatestRound() {
  const round1 = new Date('2002-12-07T20:35:00+09:00').getTime();
  const now    = Date.now();
  return Math.max(1, Math.floor((now - round1) / (7 * 24 * 60 * 60 * 1000)));
}

async function tryFetch(proxyUrl) {
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error('network');
  return res;
}

async function fetchLottoResult(drwNo) {
  const encoded = encodeURIComponent(LOTTO_API + drwNo);
  let data;

  // 1순위: corsproxy.io (raw JSON 반환, 단순)
  try {
    const res = await tryFetch('https://corsproxy.io/?' + encoded);
    data = await res.json();
  } catch {
    // 2순위: allorigins.win (래퍼 JSON 반환)
    const res = await tryFetch('https://api.allorigins.win/get?url=' + encoded);
    const wrapper = await res.json();
    data = JSON.parse(wrapper.contents);
  }

  if (data.returnValue !== 'success') throw new Error('not found');
  return data;
}

function formatPrize(won) {
  return Number(won).toLocaleString('ko-KR') + '원';
}

function renderLookupResult(data) {
  const el = document.getElementById('lookup-result');
  const nums = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];

  const card = document.createElement('div');
  card.className = 'win-card';

  const info = document.createElement('div');
  info.className = 'win-info';
  info.innerHTML = `<span class="win-round">제 ${data.drwNo}회</span><span class="win-date">${data.drwNoDate}</span>`;

  const ballsRow = document.createElement('div');
  ballsRow.className = 'win-balls-row';

  nums.forEach((n, i) => {
    const b = document.createElement('div');
    b.className = `ball ${ballClass(n)}`;
    b.textContent = n;
    b.style.animationDelay = `${i * 0.07}s`;
    ballsRow.appendChild(b);
  });

  const sep = document.createElement('div');
  sep.className = 'bonus-sep';
  sep.textContent = '+';
  ballsRow.appendChild(sep);

  const bonus = document.createElement('div');
  bonus.className = `ball ${ballClass(data.bnusNo)} bonus`;
  bonus.textContent = data.bnusNo;
  bonus.style.animationDelay = '0.49s';
  ballsRow.appendChild(bonus);

  const prize = document.createElement('div');
  prize.className = 'win-prize';
  prize.innerHTML = `<div>1등 당첨금 <span>${formatPrize(data.firstWinamnt)}</span></div><div>1등 당첨자 <span>${data.firstPrzwnerCo}명</span></div>`;

  card.appendChild(info);
  card.appendChild(ballsRow);
  card.appendChild(prize);

  el.innerHTML = '';
  el.appendChild(card);
}

function setLookupStatus(msg, loading = false) {
  const el = document.getElementById('lookup-result');
  el.innerHTML = `<div class="lookup-status">${loading ? '<div class="spinner"></div>' : ''}${msg}</div>`;
}

function setLookupError(msg) {
  document.getElementById('lookup-result').innerHTML = `<div class="lookup-error">${msg}</div>`;
}

async function lookup(drwNo, autoRetry = false) {
  setLookupStatus('조회 중...', true);
  try {
    let data;
    try {
      data = await fetchLottoResult(drwNo);
    } catch (e) {
      // 회차가 아직 발표 전인 경우 이전 회차 자동 재시도 (최신 회차 버튼 한정)
      if (e.message === 'not found' && autoRetry && drwNo > 1) {
        data = await fetchLottoResult(drwNo - 1);
        document.getElementById('round-input').value = drwNo - 1;
      } else {
        throw e;
      }
    }
    renderLookupResult(data);
  } catch {
    setLookupError('조회에 실패했습니다. 회차 번호를 확인하거나 잠시 후 다시 시도해주세요.');
  }
}

document.getElementById('lookup-btn').addEventListener('click', () => {
  const val = parseInt(document.getElementById('round-input').value, 10);
  if (!val || val < 1) { setLookupError('유효한 회차 번호를 입력해주세요.'); return; }
  lookup(val);
});

document.getElementById('round-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('lookup-btn').click();
});

document.getElementById('latest-btn').addEventListener('click', () => {
  const est = estimateLatestRound();
  document.getElementById('round-input').value = est;
  lookup(est, true); // autoRetry: 발표 전이면 이전 회차 자동 조회
});
