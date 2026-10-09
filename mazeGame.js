// Game 3: Lock & Key (Memory Maze / Door & Key)
class MazeGame {
  constructor(container, options = {}) {
    this.container = container;
    this.onScore = options.onScore || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.currentRound = 1;
    this.totalRounds = options.totalRounds || 4;
    this.active = false;
    this.isMemorizing = false;
    this.hasKey = false;
    this.playerPos = { r: 0, c: 0 };
    this.keyPos = { r: 0, c: 0 };
    this.doorPos = { r: 0, c: 0 };
    this.walls = new Set();
    this.revealedWalls = new Set();
    this.gridSize = 5;
    this.metrics = {
      collisions: 0,
      stepsTaken: 0,
      roundsCleared: 0,
      solveTime: 0
    };
    this.roundStartTime = 0;
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  start(round = 1) {
    this.active = true;
    this.currentRound = round;
    window.addEventListener('keydown', this.keyHandler);
    this.loadRound(this.currentRound);
  }

  stop() {
    this.active = false;
    window.removeEventListener('keydown', this.keyHandler);
    this.container.innerHTML = '';
  }

  generateMaze(size) {
    this.gridSize = size;
    this.hasKey = false;
    this.walls.clear();
    this.revealedWalls.clear();

    // Start at top-left
    this.playerPos = { r: 0, c: 0 };
    // Door at bottom-right
    this.doorPos = { r: size - 1, c: size - 1 };

    // Place key at a distinct location
    let kr = Math.floor(Math.random() * (size - 2)) + 1;
    let kc = Math.floor(Math.random() * (size - 2)) + 1;
    this.keyPos = { r: kr, c: kc };

    // Create a guaranteed clear path from Start -> Key -> Door
    const clearCells = new Set();
    clearCells.add(`0,0`);
    clearCells.add(`${this.keyPos.r},${this.keyPos.c}`);
    clearCells.add(`${this.doorPos.r},${this.doorPos.c}`);

    // Carve path from start to key
    let cr = 0, cc = 0;
    while (cr !== kr || cc !== kc) {
      if (cr < kr && (Math.random() > 0.5 || cc === kc)) cr++;
      else if (cc < kc) cc++;
      else if (cr > kr) cr--;
      else if (cc > kc) cc--;
      clearCells.add(`${cr},${cc}`);
    }

    // Carve path from key to door
    while (cr !== this.doorPos.r || cc !== this.doorPos.c) {
      if (cr < this.doorPos.r && (Math.random() > 0.5 || cc === this.doorPos.c)) cr++;
      else if (cc < this.doorPos.c) cc++;
      clearCells.add(`${cr},${cc}`);
    }

    // Now populate walls on non-path cells with 35% density
    const wallDensity = size === 5 ? 0.35 : 0.32;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = `${r},${c}`;
        if (!clearCells.has(key)) {
          if (Math.random() < wallDensity) {
            this.walls.add(key);
          }
        }
      }
    }
  }

  loadRound(round) {
    this.roundStartTime = Date.now();
    const size = round <= 1 ? 5 : (round <= 3 ? 6 : 7);
    this.generateMaze(size);
    this.render();
    this.startMemorizationPhase();
  }

  startMemorizationPhase() {
    this.isMemorizing = true;
    const overlay = document.getElementById('memory_overlay');
    const countdownEl = document.getElementById('memory_countdown');
    if (!overlay || !countdownEl) return;

    overlay.classList.remove('hidden');

    let secondsLeft = 3;
    countdownEl.textContent = secondsLeft;

    const timer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        countdownEl.textContent = secondsLeft;
      } else {
        clearInterval(timer);
        overlay.classList.add('hidden');
        this.isMemorizing = false;
        // Hide walls now
        this.updateCellVisuals();
      }
    }, 1000);
  }

  render() {
    this.container.innerHTML = '';

    const arenaWrapper = document.createElement('div');
    arenaWrapper.className = 'maze-arena-container';

    // Status bar (Key status + instruction)
    const statusPanel = document.createElement('div');
    statusPanel.className = 'maze-status-panel';
    statusPanel.innerHTML = `
      <div class="key-status ${this.hasKey ? 'obtained' : 'unobtained'}" id="maze_key_status">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14A6 6 0 1 0 7 2a6 6 0 0 0 0 12zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm5-4h9v4h-3v4h-4v-4h-2V8z"/>
        </svg>
        <span id="key_status_text">Key: NOT ACQUIRED</span>
      </div>
      <span style="color: var(--text-dim);">Use Arrow Keys / WASD or D-Pad</span>
    `;

    // Maze grid wrapper
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'maze-grid-wrapper';

    // Memory countdown overlay
    const overlay = document.createElement('div');
    overlay.className = 'memory-overlay';
    overlay.id = 'memory_overlay';
    overlay.innerHTML = `
      <div class="memory-countdown" id="memory_countdown">3</div>
      <div class="memory-desc">MEMORIZE WALLS BEFORE THEY CLOAK!</div>
    `;

    // Maze grid
    const gridEl = document.createElement('div');
    gridEl.className = 'maze-grid';
    gridEl.id = 'maze_grid';
    gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 56px)`;
    gridEl.style.gridTemplateRows = `repeat(${this.gridSize}, 56px)`;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        cell.id = `m_cell_${r}_${c}`;
        gridEl.appendChild(cell);
      }
    }

    gridWrapper.appendChild(overlay);
    gridWrapper.appendChild(gridEl);

    // On-screen D-Pad for touch or mouse users
    const dpad = document.createElement('div');
    dpad.className = 'dpad-container';
    dpad.innerHTML = `
      <button class="dpad-btn dpad-up" id="btn_dpad_up">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>
      <button class="dpad-btn dpad-left" id="btn_dpad_left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <button class="dpad-btn dpad-right" id="btn_dpad_right">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <button class="dpad-btn dpad-down" id="btn_dpad_down">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </button>
    `;

    arenaWrapper.appendChild(statusPanel);
    arenaWrapper.appendChild(gridWrapper);
    arenaWrapper.appendChild(dpad);
    this.container.appendChild(arenaWrapper);

    // Attach D-pad listeners
    document.getElementById('btn_dpad_up').addEventListener('click', () => this.move(-1, 0));
    document.getElementById('btn_dpad_down').addEventListener('click', () => this.move(1, 0));
    document.getElementById('btn_dpad_left').addEventListener('click', () => this.move(0, -1));
    document.getElementById('btn_dpad_right').addEventListener('click', () => this.move(0, 1));

    this.updateCellVisuals();
  }

  updateCellVisuals() {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = document.getElementById(`m_cell_${r}_${c}`);
        if (!cell) continue;

        const key = `${r},${c}`;
        cell.innerHTML = '';
        cell.className = 'maze-cell';

        // Walls: during memorization they are visible; after, only revealed ones are marked
        if (this.isMemorizing && this.walls.has(key)) {
          cell.classList.add('is-wall-visible');
        } else if (this.revealedWalls.has(key)) {
          cell.classList.add('is-wall-revealed');
        }

        // Draw Key
        if (!this.hasKey && r === this.keyPos.r && c === this.keyPos.c) {
          cell.innerHTML = `
            <div class="key-token">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14A6 6 0 1 0 7 2a6 6 0 0 0 0 12zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm5-4h9v4h-3v4h-4v-4h-2V8z"/>
              </svg>
            </div>
          `;
        }

        // Draw Door / Lock
        if (r === this.doorPos.r && c === this.doorPos.c) {
          cell.innerHTML = `
            <div class="door-token ${this.hasKey ? 'unlocked' : ''}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                ${this.hasKey 
                  ? '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>'
                  : '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>'
                }
              </svg>
            </div>
          `;
        }

        // Draw Player Token
        if (r === this.playerPos.r && c === this.playerPos.c) {
          cell.innerHTML = `
            <div class="player-token">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            </div>
          `;
        }
      }
    }
  }

  handleKeyDown(e) {
    if (!this.active || this.isMemorizing || this.isResetting) return;

    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
      this.move(-1, 0);
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      this.move(1, 0);
    } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      e.preventDefault();
      this.move(0, -1);
    } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      this.move(0, 1);
    }
  }

  move(dr, dc) {
    if (!this.active || this.isMemorizing || this.isResetting) return;

    const nr = this.playerPos.r + dr;
    const nc = this.playerPos.c + dc;

    // Check boundary
    if (nr < 0 || nr >= this.gridSize || nc < 0 || nc >= this.gridSize) {
      if (window.soundFX) window.soundFX.playBump();
      return;
    }

    const key = `${nr},${nc}`;

    // Check wall collision
    if (this.walls.has(key)) {
      this.metrics.collisions++;
      this.isResetting = true;
      this.revealedWalls.add(key);
      if (window.soundFX) window.soundFX.playBump();
      this.updateCellVisuals();
      this.onError('Hurdle hit! Resetting to start point...');

      setTimeout(() => {
        // Re-cloak all hurdles so they return to normal and hidden
        this.revealedWalls.clear();
        // Return player to start
        this.playerPos = { r: 0, c: 0 };
        // Reset key status if acquired on this run
        this.hasKey = false;
        const keyStatusEl = document.getElementById('maze_key_status');
        const keyTextEl = document.getElementById('key_status_text');
        if (keyStatusEl && keyTextEl) {
          keyStatusEl.className = 'key-status unobtained';
          keyTextEl.textContent = 'Key: NOT ACQUIRED';
        }
        this.isResetting = false;
        this.updateCellVisuals();
      }, 450);
      return;
    }

    // Valid move!
    this.playerPos = { r: nr, c: nc };
    this.metrics.stepsTaken++;

    // Check if collected Key
    if (!this.hasKey && nr === this.keyPos.r && nc === this.keyPos.c) {
      this.hasKey = true;
      if (window.soundFX) window.soundFX.playKeyCollect();
      const keyStatusEl = document.getElementById('maze_key_status');
      const keyTextEl = document.getElementById('key_status_text');
      if (keyStatusEl && keyTextEl) {
        keyStatusEl.className = 'key-status obtained';
        keyTextEl.textContent = 'Key: ACQUIRED!';
      }
      this.onScore(150, 'Golden Key Acquired!');
    }

    // Check if reached Door
    if (nr === this.doorPos.r && nc === this.doorPos.c) {
      if (this.hasKey) {
        // Vault unlocked and cleared!
        this.active = false;
        if (window.soundFX) window.soundFX.playSuccess();
        const solveTime = (Date.now() - this.roundStartTime) / 1000;
        this.metrics.solveTime += solveTime;
        this.metrics.roundsCleared++;

        this.onScore(300, 'Door Unlocked! Stage Clear');

        setTimeout(() => {
          this.currentRound++;
          if (this.currentRound > this.totalRounds) {
            this.onComplete(this.metrics);
          } else {
            this.active = true;
            this.loadRound(this.currentRound);
          }
        }, 900);
      } else {
        if (window.soundFX) window.soundFX.playBump();
        this.onError('Door is LOCKED! Retrieve the Key first.');
      }
    }

    this.updateCellVisuals();
  }
}

window.MazeGame = MazeGame;
