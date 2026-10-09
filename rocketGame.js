// Game 2: Rocket Launch (Path Finder / Conduit Network)
class RocketGame {
  constructor(container, options = {}) {
    this.container = container;
    this.onScore = options.onScore || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.currentRound = 1;
    this.totalRounds = options.totalRounds || 4;
    this.active = false;
    this.grid = [];
    this.gridSize = 3;
    this.startRow = 1;
    this.endRow = 1;
    this.metrics = {
      rotations: 0,
      levelsCleared: 0,
      totalSolveTime: 0
    };
    this.roundStartTime = 0;
  }

  start(round = 1) {
    this.active = true;
    this.currentRound = round;
    this.loadRound(this.currentRound);
  }

  stop() {
    this.active = false;
    this.container.innerHTML = '';
  }

  // Directions: 0: UP, 1: RIGHT, 2: DOWN, 3: LEFT
  getRotatedConnections(connections, rotation) {
    // rotation in units of 90 degrees (0, 1, 2, 3)
    const res = [false, false, false, false];
    for (let i = 0; i < 4; i++) {
      if (connections[i]) {
        res[(i + rotation) % 4] = true;
      }
    }
    return res;
  }

  generateLevel(size) {
    this.gridSize = size;
    this.startRow = Math.floor(Math.random() * size);
    this.endRow = Math.floor(Math.random() * size);

    // Create a guaranteed random path from (startRow, 0) to (endRow, size - 1)
    const path = [];
    let r = this.startRow;
    let c = 0;
    path.push({ r, c });

    while (c < size - 1 || r !== this.endRow) {
      const moves = [];
      // Prefer moving right
      if (c < size - 1) moves.push({ r, c: c + 1 });
      if (r < this.endRow) moves.push({ r: r + 1, c });
      if (r > this.endRow) moves.push({ r: r - 1, c });
      if (c === size - 1 && r === this.endRow) break;

      // Randomly pick a valid progression move
      const nextMove = moves[Math.floor(Math.random() * moves.length)];
      r = nextMove.r;
      c = nextMove.c;
      // Avoid duplicate consecutive node
      if (!path.some(p => p.r === r && p.c === c)) {
        path.push({ r, c });
      }
    }

    // Initialize blank grid
    this.grid = Array(size).fill(null).map(() => Array(size).fill(null));

    // For each cell in path, determine required connections
    for (let i = 0; i < path.length; i++) {
      const curr = path[i];
      const conn = [false, false, false, false]; // [UP, RIGHT, DOWN, LEFT]

      if (i === 0) {
        // First tile must connect to left (power source)
        conn[3] = true;
      } else {
        const prev = path[i - 1];
        if (prev.r < curr.r) conn[0] = true; // Prev was above
        if (prev.c > curr.c) conn[1] = true; // Prev was right
        if (prev.r > curr.r) conn[2] = true; // Prev was below
        if (prev.c < curr.c) conn[3] = true; // Prev was left
      }

      if (i === path.length - 1) {
        // Last tile must connect to right (rocket)
        conn[1] = true;
      } else {
        const next = path[i + 1];
        if (next.r < curr.r) conn[0] = true;
        if (next.c > curr.c) conn[1] = true;
        if (next.r > curr.r) conn[2] = true;
        if (next.c < curr.c) conn[3] = true;
      }

      this.grid[curr.r][curr.c] = {
        baseConnections: conn,
        rotation: 0,
        currentRotationDeg: 0,
        inSolution: true
      };
    }

    // Fill remaining cells with randomized pipe types
    const pipePresets = [
      [true, false, true, false],   // Straight
      [true, true, false, false],   // Corner
      [true, true, true, false],    // T-junction
      [false, true, false, true]    // Horizontal
    ];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!this.grid[row][col]) {
          const preset = pipePresets[Math.floor(Math.random() * pipePresets.length)];
          this.grid[row][col] = {
            baseConnections: [...preset],
            rotation: 0,
            currentRotationDeg: 0,
            inSolution: false
          };
        }
      }
    }

    // Now scramble rotations (1 to 3 clockwise turns for each cell)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const scrambleTurns = Math.floor(Math.random() * 3) + 1;
        this.grid[row][col].rotation = scrambleTurns;
        this.grid[row][col].currentRotationDeg = scrambleTurns * 90;
      }
    }
  }

  loadRound(round) {
    this.roundStartTime = Date.now();
    const size = round <= 1 ? 3 : (round <= 3 ? 4 : 5);
    this.generateLevel(size);
    this.render();
    this.updatePowerFlow();
  }

  render() {
    this.container.innerHTML = '';

    const arenaWrapper = document.createElement('div');
    arenaWrapper.className = 'rocket-arena-container';

    // Left: Power Generator Node
    const generatorNode = document.createElement('div');
    generatorNode.className = 'power-generator';
    generatorNode.innerHTML = `
      <div class="generator-core">
        <svg viewBox="0 0 24 24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <span class="generator-label">Power Core</span>
    `;

    // Center: Conduit Grid
    const gridEl = document.createElement('div');
    gridEl.className = 'conduit-grid';
    gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 80px)`;
    gridEl.style.gridTemplateRows = `repeat(${this.gridSize}, 80px)`;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cellData = this.grid[r][c];
        const tile = document.createElement('div');
        tile.className = 'conduit-tile';
        tile.id = `tile_${r}_${c}`;
        tile.style.transform = `rotate(${cellData.currentRotationDeg}deg)`;

        // Draw SVG representation of pipe
        tile.innerHTML = this.renderTileSVG(cellData.baseConnections);

        tile.addEventListener('click', () => this.rotateTile(r, c, tile));
        gridEl.appendChild(tile);
      }
    }

    // Right: Rocket Launchpad Station
    const launchpad = document.createElement('div');
    launchpad.className = 'launchpad-station';
    launchpad.innerHTML = `
      <div class="rocket-vehicle" id="rocket_vehicle">
        <svg viewBox="0 0 64 96" fill="none">
          <!-- Rocket Body -->
          <path d="M32 4 C32 4 16 28 16 64 L48 64 C48 28 32 4 32 4 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
          <!-- Cockpit Window -->
          <circle cx="32" cy="36" r="8" fill="#00f2fe" stroke="#0284c7" stroke-width="2"/>
          <circle cx="30" cy="34" r="3" fill="#ffffff"/>
          <!-- Left Fin -->
          <path d="M16 52 L4 76 L16 72 Z" fill="#9d4edd"/>
          <!-- Right Fin -->
          <path d="M48 52 L60 76 L48 72 Z" fill="#9d4edd"/>
          <!-- Thruster Nozzle -->
          <polygon points="24 64 40 64 36 74 28 74" fill="#64748b"/>
        </svg>
        <div class="rocket-thrust" id="rocket_thrust"></div>
      </div>
      <div class="launchpad-base"></div>
      <span class="generator-label" style="color: var(--accent-purple);">Launchpad</span>
    `;

    arenaWrapper.appendChild(generatorNode);
    arenaWrapper.appendChild(gridEl);
    arenaWrapper.appendChild(launchpad);
    this.container.appendChild(arenaWrapper);
  }

  renderTileSVG(baseConn) {
    // 0:UP, 1:RIGHT, 2:DOWN, 3:LEFT
    // Center point is (40, 40)
    let paths = '';
    const cx = 40, cy = 40;

    if (baseConn[0]) paths += `<path d="M ${cx} ${cy} L ${cx} 0" />`;
    if (baseConn[1]) paths += `<path d="M ${cx} ${cy} L 80 ${cy}" />`;
    if (baseConn[2]) paths += `<path d="M ${cx} ${cy} L ${cx} 80" />`;
    if (baseConn[3]) paths += `<path d="M ${cx} ${cy} L 0 ${cy}" />`;

    return `<svg viewBox="0 0 80 80">${paths}</svg>`;
  }

  rotateTile(r, c, tileEl) {
    if (!this.active) return;
    const cell = this.grid[r][c];

    cell.rotation = (cell.rotation + 1) % 4;
    cell.currentRotationDeg += 90;
    tileEl.style.transform = `rotate(${cell.currentRotationDeg}deg)`;

    this.metrics.rotations++;
    if (window.soundFX) window.soundFX.playRotate();

    this.updatePowerFlow();
  }

  updatePowerFlow() {
    // Clear all energized classes
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const el = document.getElementById(`tile_${r}_${c}`);
        if (el) el.classList.remove('energized');
      }
    }

    // BFS from Power Source into (startRow, 0)
    const queue = [];
    const visited = new Set();

    // Check if tile at (startRow, 0) has an open Left connection (dir 3)
    const startCell = this.grid[this.startRow][0];
    const startConn = this.getRotatedConnections(startCell.baseConnections, startCell.rotation);

    if (startConn[3]) { // Open on Left
      queue.push({ r: this.startRow, c: 0 });
      visited.add(`${this.startRow},0`);
    }

    let rocketEnergized = false;

    // Opposite direction mapping
    const opposite = [2, 3, 0, 1];
    const dr = [-1, 0, 1, 0];
    const dc = [0, 1, 0, -1];

    while (queue.length > 0) {
      const curr = queue.shift();
      const currEl = document.getElementById(`tile_${curr.r}_${curr.c}`);
      if (currEl) currEl.classList.add('energized');

      const currCell = this.grid[curr.r][curr.c];
      const currConn = this.getRotatedConnections(currCell.baseConnections, currCell.rotation);

      // Check if current tile reaches rocket at (endRow, gridSize - 1) on Right (dir 1)
      if (curr.r === this.endRow && curr.c === this.gridSize - 1 && currConn[1]) {
        rocketEnergized = true;
      }

      // Check 4 neighbors
      for (let dir = 0; dir < 4; dir++) {
        if (!currConn[dir]) continue;

        const nr = curr.r + dr[dir];
        const nc = curr.c + dc[dir];

        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            const nextCell = this.grid[nr][nc];
            const nextConn = this.getRotatedConnections(nextCell.baseConnections, nextCell.rotation);

            // They must connect reciprocally
            if (nextConn[opposite[dir]]) {
              visited.add(key);
              queue.push({ r: nr, c: nc });
            }
          }
        }
      }
    }

    if (rocketEnergized) {
      this.triggerRocketLaunch();
    }
  }

  triggerRocketLaunch() {
    this.active = false;
    const solveTime = (Date.now() - this.roundStartTime) / 1000;
    this.metrics.totalSolveTime += solveTime;
    this.metrics.levelsCleared++;

    if (window.soundFX) {
      window.soundFX.playEnergize();
      setTimeout(() => window.soundFX.playLaunch(), 300);
    }

    const rocket = document.getElementById('rocket_vehicle');
    if (rocket) {
      rocket.classList.add('launching');
    }

    this.onScore(250, 'Rocket Launch Successful!');

    setTimeout(() => {
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.onComplete(this.metrics);
      } else {
        this.active = true;
        this.loadRound(this.currentRound);
      }
    }, 1400);
  }
}

window.RocketGame = RocketGame;
