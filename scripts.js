const grid = document.getElementById('grid');
const message = document.getElementById('message');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');

const tileTypes = ['straight', 'elbow'];
const directions = {
  'straight': [[0, 1], [0, -1]],
  'elbow': [[0, 1], [1, 0]]
};

const levels = [
  { size: 4, time: 40 }, // Level 1: 4x4, 40s
  { size: 5, time: 50 }, // Level 2: 5x5, 50s
  { size: 6, time: 60 }  // Level 3: 6x6, 60s
];

let tiles = [];
let currentLevel = 0;
let gridSize = levels[currentLevel].size;
let timer = null;
let timeLeft = levels[currentLevel].time;
let gameActive = true;

function createTile(type, rotation) {
  const tile = document.createElement('div');
  tile.classList.add('tile');
  tile.dataset.type = type;
  tile.dataset.rotation = rotation;
  tile.style.transform = `rotate(${rotation}deg)`;

  if (type === 'straight') {
    tile.style.backgroundImage = "url('https://i.imgur.com/6R0Kijq.png')";
  } else if (type === 'elbow') {
    tile.style.backgroundImage = "url('https://i.imgur.com/WHTCUAq.png')";
  }

  tile.addEventListener('click', () => {
    const newRotation = (parseInt(tile.dataset.rotation) + 90) % 360;
    tile.dataset.rotation = newRotation;
    tile.style.transform = `rotate(${newRotation}deg)`;
    checkFlow();
  });

  return tile;
}

function updateLevelIndicator() {
  let indicator = document.getElementById('level-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'level-indicator';
    indicator.className = 'level-indicator';
    grid.parentNode.insertBefore(indicator, grid);
  }
  indicator.textContent = `Level ${currentLevel + 1} of ${levels.length}`;
}

function startTimer() {
  clearInterval(timer);
  timeLeft = levels[currentLevel].time;
  timerDisplay.textContent = `⏱️ ${timeLeft}s`;
  timer = setInterval(() => {
    if (!gameActive) return;
    timeLeft--;
    timerDisplay.textContent = `⏱️ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      gameOver();
    }
  }, 1000);
}

function buildGrid() {
  grid.innerHTML = '';
  tiles = [];
  gridSize = levels[currentLevel].size;
  grid.style.setProperty('--grid-size', gridSize);
  for (let row = 0; row < gridSize; row++) {
    tiles[row] = [];
    for (let col = 0; col < gridSize; col++) {
      let tile;
      if (row === 0 && col === 0) {
        tile = document.createElement('div');
        tile.classList.add('tile', 'source');
      } else if (row === gridSize - 1 && col === gridSize - 1) {
        tile = document.createElement('div');
        tile.classList.add('tile', 'target');
      } else {
        const type = tileTypes[Math.floor(Math.random() * tileTypes.length)];
        const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        tile = createTile(type, rotation);
      }
      grid.appendChild(tile);
      tiles[row][col] = tile;
    }
  }
  updateLevelIndicator();
}

function resetGame() {
  message.textContent = '';
  gameActive = true;
  currentLevel = 0;
  buildGrid();
  startTimer();
  resetBtn.textContent = 'Reset Puzzle';
  resetBtn.style.display = '';
}

function nextLevel() {
  currentLevel++;
  if (currentLevel < levels.length) {
    buildGrid();
    startTimer();
    message.innerHTML = `<span style='color:#0077c2'>Great! Next level...</span>`;
  } else {
    gameActive = false;
    clearInterval(timer);
    message.innerHTML = `
      <span style='color:#00bfff;font-size:1.3em'>🎉 You delivered clean water to every village! 🎉</span><br>
      <small>Thank you for playing. <a href='https://www.charitywater.org' target='_blank'>Learn how you can help →</a></small><br>
      <button class='btn' onclick='resetGame()'>Play Again</button>
    `;
    resetBtn.style.display = 'none';
  }
}

function gameOver() {
  gameActive = false;
  message.innerHTML = `
    <span style='color:#d32f2f;font-size:1.2em'>Game Over!</span><br>
    <small>Time's up. <a href='https://www.charitywater.org' target='_blank'>Learn how you can help →</a></small><br>
    <button class='btn' onclick='resetGame()'>Try Again</button>
  `;
  resetBtn.style.display = 'none';
}

function checkFlow() {
  if (!gameActive) return;
  // --- Simulated win condition: 1% chance per click, for demo ---
  if (Math.random() > 0.99) {
    message.innerHTML = `
      <span style='color:#ffd700'>💧 You delivered clean water!</span><br>
      <small>1 in 10 people still lack access. <a href='https://www.charitywater.org' target='_blank'>Learn how you can help →</a></small>
    `;
    setTimeout(nextLevel, 1200);
  }
}

// --- Initial load ---
resetGame();
