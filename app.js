// Main Application Coordinator: Accenture Cognitive Assessment Simulator
class App {
  constructor() {
    this.mode = 'idle'; // 'simulation' | 'practice'
    this.activeGameKey = null; // 'bubble' | 'rocket' | 'maze'
    this.activeGameInstance = null;
    
    this.totalScore = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.assessmentTimeLeft = 900; // 15 mins in seconds
    this.timerInterval = null;
    
    // Performance analytics
    this.sessionMetrics = {
      bubble: null,
      rocket: null,
      maze: null,
      totalTimeSpent: 0
    };

    this.initDOM();
  }

  initDOM() {
    // Views
    this.dashboardView = document.getElementById('dashboard_view');
    this.stageView = document.getElementById('game_stage_view');
    this.arenaContainer = document.getElementById('stage_arena');
    this.resultsModal = document.getElementById('results_modal');

    // Status elements
    this.timerEl = document.getElementById('timer_display');
    this.scoreEl = document.getElementById('score_display');
    this.streakEl = document.getElementById('streak_display');
    this.gameTitleEl = document.getElementById('current_game_title');
    this.gameDescEl = document.getElementById('current_game_desc');
    this.progressPillEl = document.getElementById('round_progress_pill');

    // Sound toggle
    this.audioBtn = document.getElementById('btn_toggle_audio');
    this.audioBtn.addEventListener('click', () => {
      const enabled = window.soundFX.toggle();
      this.audioBtn.innerHTML = enabled 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    });

    // Navigation buttons
    document.getElementById('btn_start_full_sim').addEventListener('click', () => this.startFullSimulation());
    document.getElementById('btn_practice_bubble').addEventListener('click', () => this.startPractice('bubble'));
    document.getElementById('btn_practice_rocket').addEventListener('click', () => this.startPractice('rocket'));
    document.getElementById('btn_practice_maze').addEventListener('click', () => this.startPractice('maze'));
    const arrowBtn = document.getElementById('btn_practice_arrow');
    if (arrowBtn) arrowBtn.addEventListener('click', () => this.startPractice('arrow'));
    document.getElementById('btn_quit_stage').addEventListener('click', () => this.quitToDashboard());
    document.getElementById('btn_modal_close').addEventListener('click', () => this.closeResultsModal());
    document.getElementById('btn_modal_retry').addEventListener('click', () => {
      this.closeResultsModal();
      this.startFullSimulation();
    });
  }

  updateScore(points, reason = '') {
    this.totalScore += points;
    this.streak++;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;

    this.scoreEl.textContent = this.totalScore;
    this.streakEl.textContent = `${this.streak}x`;

    this.showToast(`+${points} pts: ${reason}`, 'success');
  }

  handleGameError(msg) {
    this.streak = 0;
    this.streakEl.textContent = `0x`;
    this.showToast(msg, 'error');
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('app_toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app_toast';
      document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(244, 63, 94, 0.95)'};
      color: #fff;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      animation: fadeIn 0.2s ease-out;
      pointer-events: none;
    `;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 2200);
    toast.style.display = 'block';
  }

  startFullSimulation() {
    this.mode = 'simulation';
    this.totalScore = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.scoreEl.textContent = '0';
    this.streakEl.textContent = '0x';
    this.assessmentTimeLeft = 900; // 15 mins
    this.startGlobalTimer();

    this.dashboardView.style.display = 'none';
    this.stageView.style.display = 'flex';

    // Sequence: Bubble Sort -> Rocket Launch -> Lock & Key
    this.launchSimulationStep('bubble');
  }

  startGlobalTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.assessmentTimeLeft--;
      const mins = Math.floor(this.assessmentTimeLeft / 60);
      const secs = this.assessmentTimeLeft % 60;
      this.timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      if (this.assessmentTimeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.finishAssessment();
      }
    }, 1000);
  }

  launchSimulationStep(gameKey) {
    this.activeGameKey = gameKey;
    if (this.activeGameInstance) {
      this.activeGameInstance.stop();
    }

    if (gameKey === 'bubble') {
      this.gameTitleEl.textContent = 'Game 1 of 3: Bubble Sort (Quick-Fire Math)';
      this.gameDescEl.textContent = 'Mental Arithmetic • Pop bubbles in ascending numerical order';
      this.progressPillEl.textContent = 'Section 1/3';

      this.activeGameInstance = new window.BubbleGame(this.arenaContainer, {
        totalRounds: 5,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.sessionMetrics.bubble = metrics;
          this.showToast('Section 1 Complete! Advancing to Rocket Launch...', 'success');
          setTimeout(() => this.launchSimulationStep('rocket'), 1200);
        }
      });
      this.activeGameInstance.start();
    } else if (gameKey === 'rocket') {
      this.gameTitleEl.textContent = 'Game 2 of 3: Rocket Launch (Path Finder)';
      this.gameDescEl.textContent = 'Spatial Reasoning • Rotate conduit tiles to route energy into the rocket';
      this.progressPillEl.textContent = 'Section 2/3';

      this.activeGameInstance = new window.RocketGame(this.arenaContainer, {
        totalRounds: 4,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.sessionMetrics.rocket = metrics;
          this.showToast('Section 2 Complete! Advancing to Lock & Key...', 'success');
          setTimeout(() => this.launchSimulationStep('maze'), 1200);
        }
      });
      this.activeGameInstance.start();
    } else if (gameKey === 'maze') {
      this.gameTitleEl.textContent = 'Game 3 of 3: Lock & Key (Memory Maze)';
      this.gameDescEl.textContent = 'Spatial Working Memory • Memorize obstacles, collect key, and unlock door';
      this.progressPillEl.textContent = 'Section 3/3';

      this.activeGameInstance = new window.MazeGame(this.arenaContainer, {
        totalRounds: 4,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.sessionMetrics.maze = metrics;
          this.finishAssessment();
        }
      });
      this.activeGameInstance.start();
    }
  }

  startPractice(gameKey) {
    this.mode = 'practice';
    this.totalScore = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.scoreEl.textContent = '0';
    this.streakEl.textContent = '0x';
    this.assessmentTimeLeft = 300; // 5 mins practice
    this.startGlobalTimer();

    this.dashboardView.style.display = 'none';
    this.stageView.style.display = 'flex';

    if (this.activeGameInstance) {
      this.activeGameInstance.stop();
    }

    if (gameKey === 'bubble') {
      this.gameTitleEl.textContent = 'Practice Mode: Bubble Sort (Quick-Fire Math)';
      this.gameDescEl.textContent = 'Solve arithmetic and select bubbles from lowest to highest value.';
      this.progressPillEl.textContent = 'Free Drill';

      this.activeGameInstance = new window.BubbleGame(this.arenaContainer, {
        totalRounds: 5,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.sessionMetrics.bubble = metrics;
          this.finishAssessment();
        }
      });
      this.activeGameInstance.start();
    } else if (gameKey === 'rocket') {
      this.gameTitleEl.textContent = 'Practice Mode: Rocket Launch (Path Finder)';
      this.gameDescEl.textContent = 'Rotate conduit tiles to establish continuous circuit to the launchpad.';
      this.progressPillEl.textContent = 'Free Drill';

      this.activeGameInstance = new window.RocketGame(this.arenaContainer, {
        totalRounds: 4,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.sessionMetrics.rocket = metrics;
          this.finishAssessment();
        }
      });
      this.activeGameInstance.start();
    } else if (gameKey === 'maze') {
      this.gameTitleEl.textContent = 'Practice Mode: Lock & Key (Memory Maze)';
      this.gameDescEl.textContent = 'Memorize the preview walls, fetch the key, and unlock the exit.';
      this.progressPillEl.textContent = 'Free Drill';

      this.activeGameInstance = new window.MazeGame(this.arenaContainer, {
        totalRounds: 4,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.sessionMetrics.maze = metrics;
          this.finishAssessment();
        }
      });
      this.activeGameInstance.start();
    } else if (gameKey === 'arrow') {
      this.gameTitleEl.textContent = 'Accenture Arrow Path Puzzle (Official 2026 Format)';
      this.gameDescEl.textContent = 'Select tile (yellow box), use Rotate [🔄] and Flip [⇄] to align all arrows to the target.';
      this.progressPillEl.textContent = 'Official Exam Drill';

      this.activeGameInstance = new window.ArrowPathGame(this.arenaContainer, {
        totalLevels: 4,
        onScore: (pts, reason) => this.updateScore(pts, reason),
        onError: (msg) => this.handleGameError(msg),
        onComplete: (metrics) => {
          this.showToast('All 4 Puzzle Levels Cleared! Superb job!', 'success');
          this.finishAssessment();
        }
      });
      this.activeGameInstance.start();
    }
  }

  finishAssessment() {
    clearInterval(this.timerInterval);
    if (this.activeGameInstance) {
      this.activeGameInstance.stop();
    }

    if (window.soundFX) window.soundFX.playSuccess();
    this.displayDiagnosticsModal();
  }

  displayDiagnosticsModal() {
    const finalScoreEl = document.getElementById('diag_final_score');
    const percentileEl = document.getElementById('diag_percentile');
    const accuracyEl = document.getElementById('diag_accuracy');
    const bestStreakEl = document.getElementById('diag_best_streak');
    const mathScoreEl = document.getElementById('diag_math_score');
    const mathBarEl = document.getElementById('diag_math_bar');
    const spatialScoreEl = document.getElementById('diag_spatial_score');
    const spatialBarEl = document.getElementById('diag_spatial_bar');
    const memoryScoreEl = document.getElementById('diag_memory_score');
    const memoryBarEl = document.getElementById('diag_memory_bar');
    const recTextEl = document.getElementById('diag_recommendation');

    finalScoreEl.textContent = this.totalScore;
    bestStreakEl.textContent = `${this.bestStreak}x`;

    // Compute estimated domain ratings (0 - 100%)
    const bubbleM = this.sessionMetrics.bubble || { correctPops: 12, errors: 1 };
    const rocketM = this.sessionMetrics.rocket || { levelsCleared: 4, rotations: 24 };
    const mazeM = this.sessionMetrics.maze || { roundsCleared: 4, collisions: 2 };

    const mathAcc = Math.min(100, Math.round(((bubbleM.correctPops) / (bubbleM.correctPops + bubbleM.errors || 1)) * 100));
    const spatialAcc = Math.min(100, Math.round((rocketM.levelsCleared / 4) * 95));
    const memoryAcc = Math.max(30, Math.min(100, Math.round(100 - (mazeM.collisions * 8))));

    const overallAcc = Math.round((mathAcc + spatialAcc + memoryAcc) / 3);
    accuracyEl.textContent = `${overallAcc}%`;

    mathScoreEl.textContent = `${mathAcc}%`;
    mathBarEl.style.width = `${mathAcc}%`;

    spatialScoreEl.textContent = `${spatialAcc}%`;
    spatialBarEl.style.width = `${spatialAcc}%`;

    memoryScoreEl.textContent = `${memoryAcc}%`;
    memoryBarEl.style.width = `${memoryAcc}%`;

    // Estimate Percentile
    let percentile = 75;
    if (this.totalScore > 2400 && overallAcc >= 85) percentile = 97;
    else if (this.totalScore > 1800 && overallAcc >= 75) percentile = 91;
    else if (this.totalScore > 1200) percentile = 84;
    else percentile = 78;

    percentileEl.textContent = `Top ${100 - percentile}% (Percentile: ${percentile}th)`;

    // Recommendation
    if (mathAcc < 80) {
      recTextEl.textContent = 'Focus on rapid mental arithmetic approximation for Bubble Sort. Avoid rush clicking until extreme values (lowest/highest) are mentally locked.';
    } else if (memoryAcc < 80) {
      recTextEl.textContent = 'In Lock & Key, dedicate the entire 3-second preview to memorizing the bottleneck tiles surrounding the Golden Key and Door.';
    } else {
      recTextEl.textContent = 'Outstanding performance! You are operating well above the expected Accenture cognitive threshold across Numerical, Spatial, and Working Memory parameters.';
    }

    this.resultsModal.style.display = 'flex';
  }

  closeResultsModal() {
    this.resultsModal.style.display = 'none';
    this.quitToDashboard();
  }

  quitToDashboard() {
    clearInterval(this.timerInterval);
    if (this.activeGameInstance) {
      this.activeGameInstance.stop();
      this.activeGameInstance = null;
    }
    this.timerEl.textContent = '15:00';
    this.scoreEl.textContent = '0';
    this.streakEl.textContent = '0x';
    this.stageView.style.display = 'none';
    this.dashboardView.style.display = 'flex';
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
