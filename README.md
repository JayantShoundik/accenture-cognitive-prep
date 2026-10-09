# Accenture Cognitive Assessment Arena (2025 - 2026 Practice Simulator)

Interactive gamified assessment simulator designed to prepare candidates for **Accenture's Cognitive & Gamified Assessment Round** (Associate Software Engineer / Full Stack Engineer hiring drives).

Live Web App: **[https://jayantshoundik.github.io/accenture-cognitive-prep/](https://jayantshoundik.github.io/accenture-cognitive-prep/)**

---

## 🎮 Included Games

### 1. Arrow Path Puzzle (Official 2026 Format)
* **Goal**: Align direction arrows and tracks from the **Start Pointer [⯈]** on the left to the **Target Destination [🎯]** on the top/right.
* **Controls**:
  * Click any tile to select with the **Yellow Outline Box**.
  * **Rotate [🔄]** (Hotkey: `R`): Rotates selected tile 90° clockwise.
  * **Flip [⇄]** (Hotkey: `F`): Mirrors the selected tile horizontally and reverses horizontal arrow directions.
  * **Submit [✓]** (Hotkey: `Enter`): Validates continuous unbroken path.

### 2. Bubble Sort (Quick-Fire Math)
* **Goal**: Mental arithmetic under speed pressure.
* **Rule**: Solve arithmetic expressions inside floating bubbles and select them in **strictly ascending order** (lowest value to highest value).

### 3. Rocket Launch (Conduit Path Finder)
* **Goal**: Route power from the Power Core on the left to the Rocket Launchpad on the right.
* **Mechanics**: Rotate conduit tiles to complete the circuit and ignite the rocket thrusters.

### 4. Lock & Key (Memory Maze)
* **Goal**: Memorize obstacle barriers during a 3-second flash preview before they cloak.
* **Mechanics**: Retrieve the Golden Key and unlock the Exit Door. Hitting a cloaked barrier resets you to the start point while re-cloaking all obstacles.

---

## 🛠️ Tech Stack
* **HTML5 & Vanilla CSS**: Cyberpunk glassmorphic cockpit UI, responsive design.
* **Vanilla JavaScript**: Pure modular game engines, DFS/BFS path routing, state machine.
* **Web Audio API**: Native sound effect synthesis (zero external audio files).

---

## 🚀 Running Locally
```bash
git clone https://github.com/JayantShoundik/accenture-cognitive-prep.git
cd accenture-cognitive-prep
python3 -m http.server 8085
```
Open [http://localhost:8085](http://localhost:8085) in your browser.
