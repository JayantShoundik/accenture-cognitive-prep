// Authentic Accenture "Select Bubbles" Game
// Faithfully matches the exact UI and mechanics from the real Accenture assessment screen.

class BubbleGame {
  constructor(container, options = {}) {
    this.container = container;
    this.onScore = options.onScore || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.currentQuestion = 1;
    this.totalQuestions = options.totalRounds || 6;
    this.bubbles = [];
    this.selectedBubbles = []; // Array of selected bubble objects (max 3)
    this.active = false;
    this.roundStartTime = 0;
    this.instructionSlide = 0;

    this.instructions = [
      "You can select a bubble by clicking on it.",
      "You can deselect a bubble by clicking on it again. However, you will automatically advance to the next question after the third bubble is selected.",
      "Select 3 bubbles in ASCENDING order of their values (lowest to highest)."
    ];

    this.metrics = {
      correctAnswers: 0,
      totalAttempts: 0,
      reactionTimes: []
    };
  }

  start(question = 1) {
    this.active = true;
    this.currentQuestion = question;
    this.loadQuestion(this.currentQuestion);
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

      // Realistic mix of single numbers and simple equations like 5 - 1, 2 + 3, 6
      const roll = Math.random();

      if (level === 1) {
        if (roll < 0.35) {
          // Plain integer
          val = Math.floor(Math.random() * 18) + 2;
          expr = `${val}`;
        } else if (roll < 0.7) {
          // Simple addition (e.g., 2 + 3, 4 + 5)
          const a = Math.floor(Math.random() * 9) + 1;
          const b = Math.floor(Math.random() * 9) + 1;
          val = a + b;
          expr = `${a} + ${b}`;
        } else {
          // Simple subtraction (e.g., 5 - 1, 8 - 3)
          const a = Math.floor(Math.random() * 12) + 4;
          const b = Math.floor(Math.random() * (a - 1)) + 1;
          val = a - b;
          expr = `${a} - ${b}`;
        }
      } else if (level === 2) {
        if (roll < 0.25) {
          val = Math.floor(Math.random() * 30) + 5;
          expr = `${val}`;
        } else if (roll < 0.5) {
          const a = Math.floor(Math.random() * 15) + 3;
          const b = Math.floor(Math.random() * 15) + 3;
          val = a + b;
          expr = `${a} + ${b}`;
        } else if (roll < 0.75) {
          const a = Math.floor(Math.random() * 25) + 10;
          const b = Math.floor(Math.random() * 15) + 2;
          val = a - b;
          expr = `${a} - ${b}`;
        } else {
          // Multiplication
          const a = Math.floor(Math.random() * 7) + 2;
          const b = Math.floor(Math.random() * 7) + 2;
          val = a * b;
          expr = `${a} × ${b}`;
        }
      } else {
        // Advanced level: Division & mixed operations
        if (roll < 0.3) {
          const div = Math.floor(Math.random() * 6) + 2;
          const res = Math.floor(Math.random() * 9) + 2;
          val = res;
          expr = `${div * res} ÷ ${div}`;
        } else if (roll < 0.65) {
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 8) + 2;
          val = a * b;
          expr = `${a} × ${b}`;
        } else {
          const a = Math.floor(Math.random() * 35) + 10;
          const b = Math.floor(Math.random() * 20) + 5;
          val = a - b;
          expr = `${a} - ${b}`;
        }
      }

      if (!usedValues.has(val)) {
        usedValues.add(val);
        expressions.push({
          id: 'b_' + Math.random().toString(36).substr(2, 6),
          expr,
          val
        });
      }
    }

    return expressions;
  }

  loadQuestion(question) {
    this.container.innerHTML = '';
    this.selectedBubbles = [];
    this.roundStartTime = Date.now();

    // 5 or 6 bubbles per question as seen in the real exam
    const count = question <= 2 ? 5 : 6;
    const difficulty = question <= 2 ? 1 : (question <= 4 ? 2 : 3);
    this.bubbles = this.generateExpressions(count, difficulty);

    // Render outer arena wrapper
    const arenaWrapper = document.createElement('div');
    arenaWrapper.className = 'accenture-bubble-arena';

    // Top Accenture watermark
    const watermark = document.createElement('div');
    watermark.className = 'accenture-exam-watermark';
    watermark.textContent = 'accenture';
    arenaWrapper.appendChild(watermark);

    // Instruction Banner (Cyan box with < > arrows and dot indicators)
    const instructionBox = document.createElement('div');
    instructionBox.className = 'accenture-instruction-banner';
    instructionBox.innerHTML = `
      <button class="banner-arrow-btn" id="banner_prev">‹</button>
      <div class="banner-text-content">
        <span class="banner-message" id="banner_msg_text">${this.instructions[this.instructionSlide]}</span>
        <div class="banner-dots-track" id="banner_dots">
          ${this.instructions.map((_, i) => `<span class="banner-dot ${i === this.instructionSlide ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>
      <button class="banner-arrow-btn" id="banner_next">›</button>
    `;
    arenaWrapper.appendChild(instructionBox);

    // Floating Bubble Canvas
    const canvas = document.createElement('div');
    canvas.className = 'bubble-canvas-stage';
    canvas.id = 'bubble_canvas_stage';

    // Positions (spread out organically on the screen)
    const positions = this.getLayoutPositions(count);

    this.bubbles.forEach((b, index) => {
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'accenture-bubble-disc';
      bubbleEl.id = b.id;
      bubbleEl.dataset.val = b.val;

      bubbleEl.style.left = `${positions[index].x}%`;
      bubbleEl.style.top = `${positions[index].y}%`;
      bubbleEl.style.width = `${positions[index].size}px`;
      bubbleEl.style.height = `${positions[index].size}px`;

      bubbleEl.innerHTML = `
        <span class="bubble-math-text">${b.expr}</span>
        <span class="bubble-selection-badge"></span>
      `;

      bubbleEl.addEventListener('click', () => this.handleBubbleClick(b, bubbleEl));
      canvas.appendChild(bubbleEl);
    });

    arenaWrapper.appendChild(canvas);

    // Footer section indicator
    const footerInfo = document.createElement('div');
    footerInfo.className = 'accenture-exam-footer';
    footerInfo.innerHTML = `
      <span>Question ${this.currentQuestion} of ${this.totalQuestions}</span>
      <span class="selection-status-indicator" id="selection_status_indicator">Selected: 0 / 3</span>
    `;
    arenaWrapper.appendChild(footerInfo);

    this.container.appendChild(arenaWrapper);

    // Hook up instruction banner arrows
    document.getElementById('banner_prev').addEventListener('click', () => this.prevInstruction());
    document.getElementById('banner_next').addEventListener('click', () => this.nextInstruction());
  }

  prevInstruction() {
    this.instructionSlide = (this.instructionSlide - 1 + this.instructions.length) % this.instructions.length;
    this.updateInstructionBanner();
  }

  nextInstruction() {
    this.instructionSlide = (this.instructionSlide + 1) % this.instructions.length;
    this.updateInstructionBanner();
  }

  updateInstructionBanner() {
    const textEl = document.getElementById('banner_msg_text');
    if (textEl) textEl.textContent = this.instructions[this.instructionSlide];

    const dotsTrack = document.getElementById('banner_dots');
    if (dotsTrack) {
      dotsTrack.innerHTML = this.instructions.map((_, i) =>
        `<span class="banner-dot ${i === this.instructionSlide ? 'active' : ''}"></span>`
      ).join('');
    }
  }

  getLayoutPositions(count) {
    if (count === 5) {
      return [
        { x: 38, y: 18, size: 125 }, // Top-center (like 5-1 in photo)
        { x: 62, y: 32, size: 135 }, // Right-mid (like 2+3 in photo)
        { x: 36, y: 55, size: 145 }, // Bottom-center (like 6 in photo)
        { x: 14, y: 38, size: 120 }, // Left-mid
        { x: 70, y: 64, size: 115 }  // Bottom-right
      ];
    } else {
      return [
        { x: 35, y: 15, size: 125 },
        { x: 65, y: 24, size: 130 },
        { x: 15, y: 32, size: 120 },
        { x: 38, y: 52, size: 140 },
        { x: 72, y: 58, size: 120 },
        { x: 18, y: 66, size: 115 }
      ];
    }
  }

  handleBubbleClick(bubble, bubbleEl) {
    if (!this.active) return;

    const existingIdx = this.selectedBubbles.findIndex(b => b.id === bubble.id);

    if (existingIdx !== -1) {
      // DESELECT BUBBLE! (Exact feature stated in the exam instruction photo)
      this.selectedBubbles.splice(existingIdx, 1);
      bubbleEl.classList.remove('is-selected');
      const badge = bubbleEl.querySelector('.bubble-selection-badge');
      if (badge) badge.textContent = '';
      if (window.soundFX) window.soundFX.playRotate();
      this.refreshSelectionBadges();
      this.updateStatusText();
      return;
    }

    // SELECT BUBBLE!
    if (this.selectedBubbles.length < 3) {
      this.selectedBubbles.push(bubble);
      bubbleEl.classList.add('is-selected');

      const pitch = 1 + (this.selectedBubbles.length * 0.25);
      if (window.soundFX) window.soundFX.playPop(pitch);

      this.refreshSelectionBadges();
      this.updateStatusText();

      // "You will automatically advance to the next question after the third bubble is selected."
      if (this.selectedBubbles.length === 3) {
        this.evaluateSubmission();
      }
    }
  }

  refreshSelectionBadges() {
    this.bubbles.forEach(b => {
      const el = document.getElementById(b.id);
      if (el) {
        const idx = this.selectedBubbles.findIndex(sb => sb.id === b.id);
        const badge = el.querySelector('.bubble-selection-badge');
        if (idx !== -1) {
          el.classList.add('is-selected');
          if (badge) badge.textContent = `${idx + 1}`;
        } else {
          el.classList.remove('is-selected');
          if (badge) badge.textContent = '';
        }
      }
    });
  }

  updateStatusText() {
    const statusEl = document.getElementById('selection_status_indicator');
    if (statusEl) {
      statusEl.textContent = `Selected: ${this.selectedBubbles.length} / 3`;
    }
  }

  evaluateSubmission() {
    this.active = false;
    this.metrics.totalAttempts++;

    const reactionTime = (Date.now() - this.roundStartTime) / 1000;
    this.metrics.reactionTimes.push(reactionTime);

    const [b1, b2, b3] = this.selectedBubbles;
    const isAscending = (b1.val <= b2.val && b2.val <= b3.val);

    const canvas = document.getElementById('bubble_canvas_stage');

    if (isAscending) {
      // CORRECT SEQUENCE!
      this.metrics.correctAnswers++;
      if (window.soundFX) window.soundFX.playSuccess();

      this.selectedBubbles.forEach(b => {
        const el = document.getElementById(b.id);
        if (el) el.classList.add('is-correct');
      });

      this.onScore(150, '3 Bubbles in Ascending Order!');

      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion > this.totalQuestions) {
          this.onComplete(this.metrics);
        } else {
          this.active = true;
          this.loadQuestion(this.currentQuestion);
        }
      }, 800);
    } else {
      // INCORRECT ORDER
      if (window.soundFX) window.soundFX.playBump();

      this.selectedBubbles.forEach(b => {
        const el = document.getElementById(b.id);
        if (el) el.classList.add('is-incorrect');
      });

      if (canvas) {
        canvas.classList.add('canvas-shake');
        setTimeout(() => canvas.classList.remove('canvas-shake'), 500);
      }

      this.onError(`Incorrect Order: (${b1.val}, ${b2.val}, ${b3.val}) is not ascending!`);

      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion > this.totalQuestions) {
          this.onComplete(this.metrics);
        } else {
          this.active = true;
          this.loadQuestion(this.currentQuestion);
        }
      }, 1000);
    }
  }
}

window.BubbleGame = BubbleGame;
