const grid = document.getElementById('grid');
const message = document.getElementById('message');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');

const tileTypes = ['straight', 'elbow'];
const directions = {
  'straight': [[0, 1], [0, -1]],
  'elbow': [[0, 1], [1, 0]]
};

const difficulties = {
  easy: { size: 4, time: 60 },
  normal: { size: 6, time: 45 },
  hard: { size: 8, time: 30 }
};
let currentDifficulty = 'easy';
let gridSize = difficulties[currentDifficulty].size;
let timeLeft = difficulties[currentDifficulty].time;
let timer = 0;
let gameActive = true;
let tiles = [];

function createTile(type, rotation) {
  const tile = document.createElement('div');
  tile.classList.add('tile');
  tile.dataset.type = type;
  tile.dataset.rotation = rotation;
  tile.style.transform = `rotate(${rotation}deg)`;

  // Use SVG data URIs for reliability
  if (type === 'straight') {
    tile.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect x=\"28\" y=\"8\" width=\"8\" height=\"48\" rx=\"4\" fill=\"%23007bff\"/></svg>')";
  } else if (type === 'elbow') {
    tile.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect x=\"28\" y=\"8\" width=\"8\" height=\"28\" rx=\"4\" fill=\"%23007bff\"/><rect x=\"28\" y=\"28\" width=\"28\" height=\"8\" rx=\"4\" fill=\"%23007bff\"/></svg>')";
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

function setDifficulty(level) {
  currentDifficulty = level;
  gridSize = difficulties[level].size;
  timeLeft = difficulties[level].time;
  resetGame();
}

function startTimer() {
  clearInterval(timer);
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
  grid.style.setProperty('--grid-size', gridSize);

  // --- Generate a guaranteed path from bottom (source) to top (target) ---
  // Start at random col in bottom row, end at random col in top row
  const path = [];
  let col = Math.floor(Math.random() * gridSize);
  let row = gridSize - 1;
  path.push([row, col]);
  while (row > 0) {
    // Randomly move up, left, or right (but not out of bounds)
    const moves = [];
    if (col > 0) moves.push([row, col - 1]);
    if (col < gridSize - 1) moves.push([row, col + 1]);
    moves.push([row - 1, col]);
    // Prefer up, but allow left/right
    const next = moves[Math.floor(Math.random() * moves.length)];
    row = next[0];
    col = next[1];
    // Avoid cycles
    if (!path.some(([r, c]) => r === row && c === col)) {
      path.push([row, col]);
    }
  }

  // Place tiles
  for (let r = 0; r < gridSize; r++) {
    tiles[r] = [];
    for (let c = 0; c < gridSize; c++) {
      let tile;
      if (r === 0 && path[path.length - 1][1] === c) {
        tile = document.createElement('div');
        tile.classList.add('tile', 'target');
      } else if (r === gridSize - 1 && path[0][1] === c) {
        tile = document.createElement('div');
        tile.classList.add('tile', 'source');
      } else {
        // If on the path, set correct pipe type and rotation
        const onPath = path.some(([pr, pc]) => pr === r && pc === c);
        if (onPath) {
          // Find neighbors in path
          const idx = path.findIndex(([pr, pc]) => pr === r && pc === c);
          const prev = path[idx - 1];
          const next = path[idx + 1];
          let dirs = [];
          if (prev) dirs.push([prev[0] - r, prev[1] - c]);
          if (next) dirs.push([next[0] - r, next[1] - c]);
          // Determine type and rotation
          let type, rotation;
          if (dirs.length === 2) {
            // Straight if both directions are vertical or both horizontal
            if ((dirs[0][0] === 0 && dirs[1][0] === 0) || (dirs[0][1] === 0 && dirs[1][1] === 0)) {
              type = 'straight';
              rotation = dirs[0][0] === 0 ? 0 : 90;
            } else {
              type = 'elbow';
              if ((dirs[0][0] === -1 && dirs[1][1] === 1) || (dirs[1][0] === -1 && dirs[0][1] === 1)) rotation = 0;
              else if ((dirs[0][0] === -1 && dirs[1][1] === -1) || (dirs[1][0] === -1 && dirs[0][1] === -1)) rotation = 270;
              else if ((dirs[0][0] === 1 && dirs[1][1] === 1) || (dirs[1][0] === 1 && dirs[0][1] === 1)) rotation = 90;
              else rotation = 180;
            }
          } else {
            // End of path, just connect to neighbor
            if (dirs[0][0] === 0) {
              type = 'straight';
              rotation = 0;
            } else {
              type = 'straight';
              rotation = 90;
            }
          }
          tile = createTile(type, rotation);
          // Randomize rotation for challenge
          tile.dataset.solutionRotation = rotation;
          tile.dataset.rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
          tile.style.transform = `rotate(${tile.dataset.rotation}deg)`;
        } else {
          // Not on path: random tile
          const type = tileTypes[Math.floor(Math.random() * tileTypes.length)];
          const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
          tile = createTile(type, rotation);
        }
      }
      grid.appendChild(tile);
      tiles[r][c] = tile;
    }
  }
  updateLevelIndicator();
}

function resetGame() {
  message.textContent = '';
  gameActive = true;
  buildGrid();
  timerDisplay.textContent = `⏱️ ${timeLeft}s`;
  startTimer();
  resetBtn.textContent = 'Reset Puzzle';
  resetBtn.style.display = '';
}

function gameOver() {
  gameActive = false;
  // Fullscreen overlay
  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';
  overlay.innerHTML = `
    <div>
      <span style='font-size:1.3em'>Game Over!</span><br>
      <small>Time's up. <a href='https://www.charitywater.org' target='_blank'>Learn how you can help →</a></small><br>
      <button class='btn' onclick='location.reload()'>Try Again</button>
    </div>
  `;
  document.body.appendChild(overlay);
  resetBtn.style.display = 'none';
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.style.display = 'none';
}

function checkFlow() {
  if (!gameActive) return;
  // Check if all path tiles are in correct rotation
  let solved = true;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const tile = tiles[r][c];
      if (tile.dataset.solutionRotation !== undefined) {
        if (parseInt(tile.dataset.rotation) !== parseInt(tile.dataset.solutionRotation)) {
          solved = false;
        }
      }
    }
  }
  if (solved) {
    // Remove all non-path tiles
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const tile = tiles[r][c];
        if (tile.dataset.solutionRotation === undefined && !tile.classList.contains('source') && !tile.classList.contains('target')) {
          tile.style.visibility = 'hidden';
        }
      }
    }
    message.innerHTML = `
      <span style='color:#ffd700'>💧 You delivered clean water!</span><br>
      <small>1 in 10 people still lack access. <a href='https://www.charitywater.org' target='_blank'>Learn how you can help →</a></small>
    `;
    setTimeout(nextLevel, 1200);
  }
}

function submitSolution() {
  if (!gameActive) return;
  // Check if all path tiles are in correct rotation
  let solved = true;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const tile = tiles[r][c];
      if (tile.dataset.solutionRotation !== undefined) {
        if (parseInt(tile.dataset.rotation) !== parseInt(tile.dataset.solutionRotation)) {
          solved = false;
        }
      }
    }
  }
  if (solved) {
    message.innerHTML = `
      <span style='color:#ffd700'>💧 You delivered clean water!</span><br>
      <small>1 in 10 people still lack access. <a href='https://www.charitywater.org' target='_blank'>Learn how you can help →</a></small>
    `;
    setTimeout(nextLevel, 1200);
  } else {
    message.innerHTML = `<span style='color:#d32f2f'>Not quite! Try rotating the pipes to connect the water.</span>`;
  }
}

function showHint() {
  // Remove about half of the extra pipes (not on the solution path)
  let extraTiles = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const tile = tiles[r][c];
      if (tile.dataset.solutionRotation === undefined && !tile.classList.contains('source') && !tile.classList.contains('target')) {
        extraTiles.push(tile);
      }
    }
  }
  // Randomly hide half of the extra tiles
  const toRemove = Math.floor(extraTiles.length / 2);
  for (let i = 0; i < toRemove; i++) {
    const idx = Math.floor(Math.random() * extraTiles.length);
    extraTiles[idx].style.visibility = 'hidden';
    extraTiles.splice(idx, 1);
  }
}

// --- Initial load ---
resetGame();
