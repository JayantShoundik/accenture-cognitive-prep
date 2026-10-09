// Game 1: Bubble Sort (Quick-Fire Math)
class BubbleGame {
  constructor(container, options = {}) {
    this.container = container;
    this.onScore = options.onScore || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    this.currentRound = 1;
    this.totalRounds = options.totalRounds || 5;
    this.bubbles = [];
    this.targetSequence = [];
    this.nextIndex = 0;
    this.active = false;
    this.roundStartTime = 0;
    this.metrics = {
      correctPops: 0,
      errors: 0,
      reactionTimes: []
    };
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

  generateExpressions(count, level) {
    const expressions = [];
    const usedValues = new Set();

    while (expressions.length < count) {
      let expr = '';
      let val = 0;

      if (level === 1) {
        // Simple Add / Sub / Small Mul
        const type = Math.floor(Math.random() * 3);
        if (type === 0) {
          const a = Math.floor(Math.random() * 25) + 5;
          const b = Math.floor(Math.random() * 25) + 5;
          expr = `${a} + ${b}`;
          val = a + b;
        } else if (type === 1) {
          const a = Math.floor(Math.random() * 40) + 15;
          const b = Math.floor(Math.random() * (a - 5)) + 3;
          expr = `${a} - ${b}`;
          val = a - b;
        } else {
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 8) + 2;
          expr = `${a} × ${b}`;
          val = a * b;
        }
      } else if (level === 2) {
        // Multiplications, Div, Two-digit operations
        const type = Math.floor(Math.random() * 4);
        if (type === 0) {
          const a = Math.floor(Math.random() * 12) + 3;
          const b = Math.floor(Math.random() * 9) + 4;
          expr = `${a} × ${b}`;
          val = a * b;
        } else if (type === 1) {
          const div = Math.floor(Math.random() * 9) + 2;
          const res = Math.floor(Math.random() * 12) + 2;
          expr = `${div * res} ÷ ${div}`;
          val = res;
        } else if (type === 2) {
          const a = Math.floor(Math.random() * 50) + 20;
          const b = Math.floor(Math.random() * 40) + 10;
          expr = `${a} + ${b}`;
          val = a + b;
        } else {
          const a = Math.floor(Math.random() * 60) + 30;
          const b = Math.floor(Math.random() * 25) + 10;
          expr = `${a} - ${b}`;
          val = a - b;
        }
      } else {
        // Advanced: Parentheses, combined BODMAS
        const type = Math.floor(Math.random() * 3);
        if (type === 0) {
          const a = Math.floor(Math.random() * 6) + 2;
          const b = Math.floor(Math.random() * 8) + 2;
          const c = Math.floor(Math.random() * 5) + 2;
          expr = `(${a} + ${b}) × ${c}`;
          val = (a + b) * c;
        } else if (type === 1) {
          const a = Math.floor(Math.random() * 20) + 10;
          const b = Math.floor(Math.random() * 4) + 2;
          const c = Math.floor(Math.random() * 6) + 2;
          expr = `${a} + (${b} × ${c})`;
          val = a + (b * c);
        } else {
          const div = Math.floor(Math.random() * 5) + 3;
          const mult = Math.floor(Math.random() * 10) + 4;
          const base = div * mult;
          const sub = Math.floor(Math.random() * 10) + 2;
          expr = `(${base} ÷ ${div}) - ${sub}`;
          val = mult - sub;
        }
      }

      // Ensure distinct values so sorting is strictly defined
      if (!usedValues.has(val)) {
        usedValues.add(val);
        expressions.push({ expr, val, id: 'b_' + Math.random().toString(36).substr(2, 6) });
      }
    }

    return expressions;
  }

  loadRound(round) {
    this.container.innerHTML = '';
    this.nextIndex = 0;
    this.roundStartTime = Date.now();

    // Determine count based on round
    let bubbleCount = 3;
    let difficulty = 1;

    if (round === 2) {
      bubbleCount = 4;
      difficulty = 1;
    } else if (round === 3) {
      bubbleCount = 4;
      difficulty = 2;
    } else if (round === 4) {
      bubbleCount = 5;
      difficulty = 2;
    } else if (round >= 5) {
      bubbleCount = 5;
      difficulty = 3;
    }

    this.bubbles = this.generateExpressions(bubbleCount, difficulty);
    // Sort ascending by value to create the expected target sequence
    this.targetSequence = [...this.bubbles].sort((a, b) => a.val - b.val);

    // Create instruction pill
    const instruction = document.createElement('div');
    instruction.className = 'instruction-strip';
    instruction.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
      Select bubbles in ASCENDING order (lowest value first)
    `;
    this.container.appendChild(instruction);

    // Calculate positions to prevent overlaps
    const positions = this.generatePositions(bubbleCount);

    this.bubbles.forEach((b, index) => {
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'bubble-item';
      bubbleEl.id = b.id;
      bubbleEl.dataset.val = b.val;

      const size = bubbleCount <= 4 ? 120 : 108;
      bubbleEl.style.width = `${size}px`;
      bubbleEl.style.height = `${size}px`;
      bubbleEl.style.left = `${positions[index].x}%`;
      bubbleEl.style.top = `${positions[index].y}%`;
      bubbleEl.style.animationDelay = `${(index * 0.4).toFixed(1)}s`;

      bubbleEl.innerHTML = `
        <span class="bubble-expr">${b.expr}</span>
        <span class="bubble-rank">#${index + 1}</span>
      `;

      bubbleEl.addEventListener('click', () => this.handleBubbleClick(b, bubbleEl));
      this.container.appendChild(bubbleEl);
    });
  }

  generatePositions(count) {
    // Generate organic distinct layout coordinates in percentage
    const presets = {
      3: [
        { x: 18, y: 35 },
        { x: 50, y: 25 },
        { x: 78, y: 40 }
      ],
      4: [
        { x: 15, y: 25 },
        { x: 42, y: 48 },
        { x: 75, y: 22 },
        { x: 68, y: 56 }
      ],
      5: [
        { x: 12, y: 30 },
        { x: 34, y: 18 },
        { x: 56, y: 48 },
        { x: 78, y: 25 },
        { x: 30, y: 60 }
      ],
      6: [
        { x: 12, y: 22 },
        { x: 38, y: 18 },
        { x: 68, y: 20 },
        { x: 22, y: 55 },
        { x: 52, y: 50 },
        { x: 80, y: 55 }
      ]
    };

    return presets[count] || presets[4];
  }

  handleBubbleClick(bubbleData, bubbleEl) {
    if (!this.active || bubbleEl.classList.contains('correct-pop')) return;

    const expected = this.targetSequence[this.nextIndex];
    const reactionTime = (Date.now() - this.roundStartTime) / 1000;
    this.metrics.reactionTimes.push(reactionTime);

    if (bubbleData.id === expected.id) {
      // CORRECT CHOICE!
      this.metrics.correctPops++;
      this.nextIndex++;

      // Dynamic ascending pitch for sound
      const pitch = 1 + (this.nextIndex * 0.25);
      if (window.soundFX) window.soundFX.playPop(pitch);

      bubbleEl.classList.add('correct-pop');
      this.onScore(120, 'Correct Sequence');

      // Check if current round completed
      if (this.nextIndex === this.targetSequence.length) {
        if (window.soundFX) window.soundFX.playSuccess();
        this.currentRound++;

        if (this.currentRound > this.totalRounds) {
          this.active = false;
          setTimeout(() => {
            this.onComplete(this.metrics);
          }, 600);
        } else {
          setTimeout(() => {
            this.loadRound(this.currentRound);
          }, 600);
        }
      }
    } else {
      // WRONG CHOICE!
      this.metrics.errors++;
      if (window.soundFX) window.soundFX.playBump();

      bubbleEl.classList.add('wrong-shake');
      setTimeout(() => bubbleEl.classList.remove('wrong-shake'), 450);

      this.onError('Incorrect order! Expected lowest remaining value.');
    }
  }
}

window.BubbleGame = BubbleGame;
