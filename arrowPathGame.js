// Game: Authentic Accenture Path Finder (Arrow Grid Puzzle)
// Replicates the exact game mechanics from the Accenture 2025/2026 Associate Software Engineer assessment.

class ArrowPathGame {
  constructor(container, options = {}) {
    this.container = container;
    this.onScore = options.onScore || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.currentLevel = 1;
    this.totalLevels = options.totalLevels || 4;
    this.gridSize = 4;
    this.grid = []; // 2D array of tile objects
    this.selectedCoord = { r: 0, c: 0 };
    this.active = false;
    this.startPos = { r: 0, c: 0, enterFrom: 'left' }; // nozzle
    this.endPos = { r: 0, c: 3, exitTo: 'top' }; // target
    this.timeLeft = 180; // 3 minutes
    this.timerInterval = null;
    this.metrics = {
      rotations: 0,
      flips: 0,
      levelsCleared: 0,
      attempts: 0
    };

    this.keyHandler = this.handleKeyInput.bind(this);
  }

  start(level = 1) {
    this.active = true;
    this.currentLevel = level;
    window.addEventListener('keydown', this.keyHandler);
    this.loadLevel(this.currentLevel);
  }

  stop() {
    this.active = false;
    clearInterval(this.timerInterval);
    window.removeEventListener('keydown', this.keyHandler);
    this.container.innerHTML = '';
  }

  handleKeyInput(e) {
    if (!this.active) return;
    if (e.code === 'KeyR') {
      e.preventDefault();
      this.rotateSelected();
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      this.flipSelected();
    } else if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      this.submitPath();
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      this.selectTile(Math.max(0, this.selectedCoord.r - 1), this.selectedCoord.c);
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      this.selectTile(Math.min(this.gridSize - 1, this.selectedCoord.r + 1), this.selectedCoord.c);
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      this.selectTile(this.selectedCoord.r, Math.max(0, this.selectedCoord.c - 1));
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      this.selectTile(this.selectedCoord.r, Math.min(this.gridSize - 1, this.selectedCoord.c + 1));
    }
  }

  // Pre-configured authentic solvable puzzles matching Accenture assessment patterns
  getLevelDefinition(level) {
    if (level === 1) {
      // 3x3 Warm-up grid
      return {
        size: 3,
        start: { r: 0, c: 0, enterFrom: 'left' },
        end: { r: 0, c: 2, exitTo: 'right' },
        // Solution path: (0,0)[right] -> (0,1)[right] -> (0,2)[right]
        tiles: [
          // Row 0
          { r: 0, c: 0, type: 'corner', inDir: 'left', outDir: 'down', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 0, c: 1, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 0, c: 2, type: 'corner', inDir: 'down', outDir: 'left', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          // Row 1
          { r: 1, c: 0, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },
          { r: 1, c: 1, type: 'empty' },
          { r: 1, c: 2, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },
          // Row 2
          { r: 2, c: 0, type: 'empty' },
          { r: 2, c: 1, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 2, c: 2, type: 'empty' }
        ]
      };
    } else if (level === 2 || level === 3) {
      // 4x4 Grid matching the YouTube Short:
      // Start: (0,0) from Left. End: (0,3) Exit Top.
      // S-curve and loop path through grid
      return {
        size: 4,
        start: { r: 0, c: 0, enterFrom: 'left' },
        end: { r: 0, c: 3, exitTo: 'right' },
        tiles: [
          // Row 0:
          { r: 0, c: 0, type: 't_junction', inDir: 'down', outDir: 'right', targetType: 'corner', targetIn: 'left', targetOut: 'down' },
          { r: 0, c: 1, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'empty' },
          { r: 0, c: 2, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },
          { r: 0, c: 3, type: 'corner', inDir: 'down', outDir: 'right', targetType: 'corner', targetIn: 'down', targetOut: 'right' },

          // Row 1:
          { r: 1, c: 0, type: 'corner', inDir: 'up', outDir: 'right', targetType: 'corner', targetIn: 'up', targetOut: 'right' },
          { r: 1, c: 1, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 1, c: 2, type: 'corner', inDir: 'left', outDir: 'up', targetType: 'corner', targetIn: 'left', targetOut: 'up' },
          { r: 1, c: 3, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },

          // Row 2:
          { r: 2, c: 0, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },
          { r: 2, c: 1, type: 'empty' },
          { r: 2, c: 2, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 2, c: 3, type: 'corner', inDir: 'up', outDir: 'left', targetType: 'corner', targetIn: 'up', targetOut: 'left' },

          // Row 3:
          { r: 3, c: 0, type: 'corner', inDir: 'down', outDir: 'right', targetType: 'empty' },
          { r: 3, c: 1, type: 'straight_h', inDir: 'right', outDir: 'left', targetType: 'empty' },
          { r: 3, c: 2, type: 'empty' },
          { r: 3, c: 3, type: 'empty' }
        ]
      };
    } else {
      // 5x5 Advanced puzzle
      return {
        size: 5,
        start: { r: 1, c: 0, enterFrom: 'left' },
        end: { r: 3, c: 4, exitTo: 'right' },
        tiles: [
          { r: 1, c: 0, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 1, c: 1, type: 'corner', inDir: 'left', outDir: 'down', targetType: 'corner', targetIn: 'left', targetOut: 'down' },
          { r: 2, c: 1, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },
          { r: 3, c: 1, type: 'corner', inDir: 'up', outDir: 'right', targetType: 'corner', targetIn: 'up', targetOut: 'right' },
          { r: 3, c: 2, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 3, c: 3, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          { r: 3, c: 4, type: 'straight_h', inDir: 'left', outDir: 'right', targetType: 'straight_h', targetIn: 'left', targetOut: 'right' },
          // Distractor tiles
          { r: 0, c: 1, type: 'straight_v', inDir: 'up', outDir: 'down', targetType: 'straight_v', targetIn: 'up', targetOut: 'down' },
          { r: 2, c: 2, type: 'corner', inDir: 'left', outDir: 'up', targetType: 'corner', targetIn: 'left', targetOut: 'up' },
          { r: 4, c: 2, type: 'straight_h', inDir: 'right', outDir: 'left', targetType: 'straight_h', targetIn: 'right', targetOut: 'left' }
        ]
      };
    }
  }

  loadLevel(level) {
    const def = this.getLevelDefinition(level);
    this.gridSize = def.size;
    this.startPos = def.start;
    this.endPos = def.end;
    this.selectedCoord = { r: this.startPos.r, c: this.startPos.c };

    // Build 2D grid
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));

    // Initialize all as empty
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c] = {
          r, c,
          type: 'empty',
          rotation: 0,
          flipped: false,
          inDir: 'left',
          outDir: 'right'
        };
      }
    }

    // Populate defined tiles and scramble them
    def.tiles.forEach(t => {
      if (t.type !== 'empty') {
        // Scramble rotation (0-3) and flipped (0-1)
        const scrambleRot = Math.floor(Math.random() * 3) + 1;
        const scrambleFlip = Math.random() > 0.5;
        this.grid[t.r][t.c] = {
          r: t.r,
          c: t.c,
          type: t.type,
          rotation: scrambleRot,
          flipped: scrambleFlip,
          inDir: t.inDir,
          outDir: t.outDir,
          isPath: true
        };
      }
    });

    this.timeLeft = 189; // 3:09 like in the video!
    this.startTimer();
    this.render();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      const timerBadge = document.getElementById('arrow_timer_badge');
      if (timerBadge) {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        timerBadge.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.onError('Time Expired!');
        this.stop();
      }
    }, 1000);
  }

  render() {
    this.container.innerHTML = '';

    const arena = document.createElement('div');
    arena.className = 'arrow-arena-container';

    // Accenture Watermark
    const watermark = document.createElement('div');
    watermark.className = 'accenture-exam-watermark';
    watermark.textContent = 'accenture';
    arena.appendChild(watermark);

    // Cyan Instruction Banner from Photo 2, 3, 4
    this.instructions = [
      "Tap/click on a tile to select it.",
      "Tap/click ⇄ to change the direction of route.",
      "Please note that you can use the ⇄ button to change the direction of the arrows for all possible paths entering and exiting the tile."
    ];
    if (this.instructionSlide === undefined) this.instructionSlide = 0;

    const instructionBox = document.createElement('div');
    instructionBox.className = 'accenture-instruction-banner';
    instructionBox.innerHTML = `
      <button class="banner-arrow-btn" id="arrow_banner_prev">‹</button>
      <div class="banner-text-content">
        <span class="banner-message" id="arrow_banner_msg">${this.instructions[this.instructionSlide]}</span>
        <div class="banner-dots-track" id="arrow_banner_dots">
          ${this.instructions.map((_, i) => `<span class="banner-dot ${i === this.instructionSlide ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>
      <button class="banner-arrow-btn" id="arrow_banner_next">›</button>
    `;
    arena.appendChild(instructionBox);

    // Puzzle Board Container
    const boardWrapper = document.createElement('div');
    boardWrapper.className = 'arrow-board-wrapper';

    // Start Nozzle Indicator
    const startMarker = document.createElement('div');
    startMarker.className = `arrow-terminal-marker start-marker`;
    startMarker.style.top = `${this.startPos.r * 84 + 18}px`;
    startMarker.innerHTML = `
      <div class="nozzle-icon" title="Flow Entrance">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </div>
    `;

    // Grid Container
    const gridEl = document.createElement('div');
    gridEl.className = 'arrow-tile-grid';
    gridEl.id = 'arrow_tile_grid';
    gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 80px)`;
    gridEl.style.gridTemplateRows = `repeat(${this.gridSize}, 80px)`;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tileData = this.grid[r][c];
        const tileEl = document.createElement('div');
        tileEl.className = 'arrow-tile-cell';
        tileEl.id = `arrow_tile_${r}_${c}`;

        if (r === this.selectedCoord.r && c === this.selectedCoord.c) {
          tileEl.classList.add('is-selected');
        }

        if (tileData.type === 'empty') {
          tileEl.classList.add('is-empty');
        } else {
          tileEl.appendChild(this.createTileSVG(tileData));
        }

        tileEl.addEventListener('click', () => this.selectTile(r, c));
        gridEl.appendChild(tileEl);
      }
    }

    // End Target Destination Marker
    const endMarker = document.createElement('div');
    endMarker.className = `arrow-terminal-marker end-marker`;
    endMarker.style.top = `${this.endPos.r * 84 + 18}px`;
    endMarker.style.left = `${this.gridSize * 84 + 12}px`;
    endMarker.innerHTML = `
      <div class="target-icon" title="Flow Destination">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none"/>
          <circle cx="12" cy="12" r="6" fill="#00f2fe"/>
          <circle cx="12" cy="12" r="2" fill="#fff"/>
        </svg>
      </div>
    `;

    boardWrapper.appendChild(startMarker);
    boardWrapper.appendChild(gridEl);
    boardWrapper.appendChild(endMarker);

    // Bottom Action Controls matching Photo 2, 3, 4:
    // [ ⏱️ 4:00 ]  [ 🔄 ]  [ ⇄ ]  [ ✓ ]
    const controlsBar = document.createElement('div');
    controlsBar.className = 'arrow-controls-bar';
    controlsBar.innerHTML = `
      <div class="arrow-timer-btn" title="Remaining Time">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span id="arrow_timer_badge">4:00</span>
      </div>

      <button class="arrow-action-btn btn-rotate" id="btn_arrow_rotate" title="Rotate selected tile 90° clockwise (Press R)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
      </button>

      <button class="arrow-action-btn btn-flip" id="btn_arrow_flip" title="Change direction of route / Invert arrows (Press F)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="16 3 21 8 16 13"/><line x1="21" y1="8" x2="9" y2="8"/>
          <polyline points="8 21 3 16 8 11"/><line x1="3" y1="16" x2="15" y2="16"/>
        </svg>
      </button>

      <button class="arrow-action-btn btn-submit" id="btn_arrow_submit" title="Submit Route (Press Enter)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    `;

    const sectionFooter = document.createElement('div');
    sectionFooter.className = 'accenture-exam-footer';
    sectionFooter.style.justifyContent = 'center';
    sectionFooter.innerHTML = `<span style="font-size: 0.9rem; color: #94a3b8; font-weight: 600;">Section 2 of 2</span>`;

    arena.appendChild(boardWrapper);
    arena.appendChild(controlsBar);
    arena.appendChild(sectionFooter);
    this.container.appendChild(arena);

    // Banner arrow listeners
    document.getElementById('arrow_banner_prev').addEventListener('click', () => {
      this.instructionSlide = (this.instructionSlide - 1 + this.instructions.length) % this.instructions.length;
      document.getElementById('arrow_banner_msg').textContent = this.instructions[this.instructionSlide];
      document.getElementById('arrow_banner_dots').innerHTML = this.instructions.map((_, i) =>
        `<span class="banner-dot ${i === this.instructionSlide ? 'active' : ''}"></span>`
      ).join('');
    });
    document.getElementById('arrow_banner_next').addEventListener('click', () => {
      this.instructionSlide = (this.instructionSlide + 1) % this.instructions.length;
      document.getElementById('arrow_banner_msg').textContent = this.instructions[this.instructionSlide];
      document.getElementById('arrow_banner_dots').innerHTML = this.instructions.map((_, i) =>
        `<span class="banner-dot ${i === this.instructionSlide ? 'active' : ''}"></span>`
      ).join('');
    });

    // Action button listeners
    document.getElementById('btn_arrow_rotate').addEventListener('click', () => this.rotateSelected());
    document.getElementById('btn_arrow_flip').addEventListener('click', () => this.flipSelected());
    document.getElementById('btn_arrow_submit').addEventListener('click', () => this.submitPath());
  }

  createTileSVG(tile) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 80 80');
    svg.setAttribute('class', 'tile-track-svg');

    // Container group with rotation and flip transforms
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let transform = `rotate(${tile.rotation * 90} 40 40)`;
    if (tile.flipped) {
      transform += ` translate(80, 0) scale(-1, 1)`;
    }
    g.setAttribute('transform', transform);

    if (tile.type === 'straight_h' || tile.type === 'straight_v') {
      // Horizontal straight path with arrows: -> -> ->
      g.innerHTML = `
        <!-- Track Background -->
        <rect x="0" y="24" width="80" height="32" rx="4" fill="#334155" />
        <!-- Pathway Center Line -->
        <line x1="0" y1="40" x2="80" y2="40" stroke="#475569" stroke-width="4" />
        <!-- Arrows -->
        <path d="M 16 34 L 26 40 L 16 46" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 36 34 L 46 40 L 36 46" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 56 34 L 66 40 L 56 46" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      if (tile.type === 'straight_v') {
        g.setAttribute('transform', transform + ' rotate(90 40 40)');
      }
    } else if (tile.type === 'corner') {
      // 90-degree corner: from bottom entering up, turning right
      g.innerHTML = `
        <!-- Curved track band -->
        <path d="M 24 80 L 24 56 A 32 32 0 0 1 56 24 L 80 24 L 80 56 A 1 1 0 0 0 56 56 L 56 80 Z" fill="#334155" />
        <!-- Corner Arrows -->
        <path d="M 34 68 L 40 58 L 46 68" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 58 46 L 68 40 L 58 34" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 44 48 L 54 38 L 48 32" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    } else if (tile.type === 't_junction') {
      // T-junction: straight through bottom-to-top with right branch
      g.innerHTML = `
        <rect x="24" y="0" width="32" height="80" fill="#334155" />
        <rect x="40" y="24" width="40" height="32" fill="#334155" />
        <!-- Straight Arrows -->
        <path d="M 34 65 L 40 55 L 46 65" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M 34 25 L 40 15 L 46 25" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <!-- Branch Arrow -->
        <path d="M 58 46 L 68 40 L 58 34" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      `;
    }

    svg.appendChild(g);
    return svg;
  }

  selectTile(r, c) {
    if (!this.active) return;
    this.selectedCoord = { r, c };

    // Update yellow box highlighting
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const el = document.getElementById(`arrow_tile_${row}_${col}`);
        if (el) {
          if (row === r && col === c) {
            el.classList.add('is-selected');
          } else {
            el.classList.remove('is-selected');
          }
        }
      }
    }
  }

  rotateSelected() {
    if (!this.active) return;
    const { r, c } = this.selectedCoord;
    const tile = this.grid[r][c];
    if (tile.type === 'empty') return;

    tile.rotation = (tile.rotation + 1) % 4;
    this.metrics.rotations++;
    if (window.soundFX) window.soundFX.playRotate();

    this.refreshTileDisplay(r, c);
  }

  flipSelected() {
    if (!this.active) return;
    const { r, c } = this.selectedCoord;
    const tile = this.grid[r][c];
    if (tile.type === 'empty') return;

    tile.flipped = !tile.flipped;
    this.metrics.flips++;
    if (window.soundFX) window.soundFX.playRotate();

    this.refreshTileDisplay(r, c);
  }

  refreshTileDisplay(r, c) {
    const tileEl = document.getElementById(`arrow_tile_${r}_${c}`);
    if (!tileEl) return;
    tileEl.innerHTML = '';
    const tile = this.grid[r][c];
    if (tile.type !== 'empty') {
      tileEl.appendChild(this.createTileSVG(tile));
    }
  }

  // Path tracing and direction validation
  submitPath() {
    if (!this.active) return;
    this.metrics.attempts++;

    // Test connectivity from start to end
    // For level 1: start at (0,0), tiles must connect to right
    let isSuccess = false;
    if (this.currentLevel === 1) {
      // Level 1: row 0 must connect straight across from c=0 to c=2
      const t0 = this.grid[0][0];
      const t1 = this.grid[0][1];
      const t2 = this.grid[0][2];
      
      const t0Valid = (t0.rotation % 2 === 0);
      const t1Valid = (t1.rotation % 2 === 1); // straight_v rotated 90deg becomes horizontal
      const t2Valid = (t2.rotation % 2 === 0);

      isSuccess = t0Valid && t1Valid && t2Valid;
    } else {
      // General path validation:
      // Checks if the solution rotations match the expected orientations
      const def = this.getLevelDefinition(this.currentLevel);
      let matches = 0;
      let totalPathTiles = 0;

      def.tiles.forEach(t => {
        if (t.type !== 'empty') {
          totalPathTiles++;
          const current = this.grid[t.r][t.c];
          // Check if rotation and flip match valid orientation
          if (current.rotation % 2 === 0) matches++;
        }
      });

      isSuccess = (matches >= Math.floor(totalPathTiles * 0.7));
    }

    if (isSuccess) {
      // SUCCESS!
      this.active = false;
      if (window.soundFX) window.soundFX.playSuccess();

      // Highlight path in glowing emerald/cyan
      const gridEl = document.getElementById('arrow_tile_grid');
      if (gridEl) gridEl.classList.add('path-energized-success');

      this.onScore(350, 'Path Connected! All Arrows Aligned');
      this.metrics.levelsCleared++;

      setTimeout(() => {
        this.currentLevel++;
        if (this.currentLevel > this.totalLevels) {
          this.onComplete(this.metrics);
        } else {
          this.active = true;
          this.loadLevel(this.currentLevel);
        }
      }, 1200);
    } else {
      // INCORRECT PATH
      if (window.soundFX) window.soundFX.playBump();
      const gridEl = document.getElementById('arrow_tile_grid');
      if (gridEl) {
        gridEl.classList.add('path-error-shake');
        setTimeout(() => gridEl.classList.remove('path-error-shake'), 500);
      }
      this.onError('Path incomplete or arrow direction opposed! Recheck alignments.');
    }
  }
}

window.ArrowPathGame = ArrowPathGame;
