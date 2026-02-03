/**
 * UTILITY FUNCTIONS
 * This file contains math utilities, drawing functions, and audio system.
 *
 * For a young learner: These are helper functions used throughout the game.
 * - Math functions help with calculations (distance, angles, random numbers)
 * - Drawing functions create the ship graphics
 * - Audio functions make sound effects
 */

// ============================================================
// MATH UTILITY FUNCTIONS
// ============================================================

// Clamp a value between min and max
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Random number between a and b
const rand = (a, b) => a + Math.random() * (b - a);

// Random integer between a and b (inclusive)
const randI = (a, b) => (a + (Math.random() * (b - a + 1) | 0));

// Distance squared between two points (faster than dist)
const dist2 = (x1, y1, x2, y2) => {
  let dx = x2 - x1, dy = y2 - y1;
  return dx * dx + dy * dy;
};

// Distance between two points
const dist = (x1, y1, x2, y2) => Math.sqrt(dist2(x1, y1, x2, y2));

// Normalize a vector (make it length 1)
const norm = (x, y) => {
  const l = Math.sqrt(x * x + y * y);
  return l > 0 ? [x / l, y / l] : [0, 0];
};

// Get the smallest difference between two angles
const angDiff = (a, b) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

// ============================================================
// SHIP DRAWING FUNCTIONS
// ============================================================

/**
 * Draw a ship preview (used in menu)
 * @param {Phaser.GameObjects.Graphics} g - Graphics object
 * @param {string} shipType - Ship name (VIPER, TANKS, or RAZOR)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} angle - Rotation angle
 * @param {number} color - Ship color
 * @param {number} size - Size multiplier
 */
function drawShipPreview(g, shipType, x, y, angle, color, size = 0.85) {
  const s = 16 * size;

  if (shipType === 'VIPER') {
    // Draw body
    g.fillStyle(0x0a0a2a, 1);
    g.beginPath();
    g.moveTo(x, y - s);
    g.lineTo(x + s * 0.5, y + s * 0.3);
    g.lineTo(x + s * 0.35, y + s * 0.6);
    g.lineTo(x - s * 0.35, y + s * 0.6);
    g.lineTo(x - s * 0.5, y + s * 0.3);
    g.closePath();
    g.fillPath();

    // Draw outline
    g.lineStyle(2, color, 0.85);
    g.strokePath();

    // Draw cockpit
    g.fillStyle(color, 0.9);
    g.beginPath();
    g.arc(x, y - s * 0.4, 3 * size, 0, Math.PI * 2);
    g.fillPath();
  }
  else if (shipType === 'TANKS') {
    // Draw hexagonal body
    g.fillStyle(0x0a0a2a, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(ang) * s * 0.7;
      const py = y + Math.sin(ang) * s * 0.7;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    // Draw outline
    g.lineStyle(2.5, color, 0.85);
    g.strokePath();

    // Draw inner hexagon
    g.fillStyle(color, 0.3);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      g.lineTo(x + Math.cos(ang) * s * 0.35, y + Math.sin(ang) * s * 0.35);
    }
    g.closePath();
    g.fillPath();
  }
  else if (shipType === 'RAZOR') {
    // Draw sharp triangular body
    g.fillStyle(0x0a0a2a, 1);
    g.beginPath();
    g.moveTo(x, y - s * 1.1);
    g.lineTo(x + s * 0.35, y + s * 0.5);
    g.lineTo(x, y + s * 0.3);
    g.lineTo(x - s * 0.35, y + s * 0.5);
    g.closePath();
    g.fillPath();

    // Draw outline
    g.lineStyle(1.8, color, 0.9);
    g.strokePath();

    // Draw cockpit
    g.fillStyle(color, 0.9);
    g.fillRect(x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.7);
  }
}

/**
 * Draw a ship in-game (with upgrades)
 * @param {Phaser.GameObjects.Graphics} g - Graphics object
 * @param {string} shipType - Ship name
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} angle - Rotation angle in radians
 * @param {number} color - Ship color
 * @param {number} stage - Upgrade stage (0, 1, or 2)
 */
function drawShipInGame(g, shipType, x, y, angle, color, stage = 0) {
  const s = 18;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);

  if (shipType === 'VIPER') {
    // Core body
    g.fillStyle(0x0a0a2a, 1);
    g.beginPath();
    g.moveTo(x + ca * s, y + sa * s);
    g.lineTo(x + ca * (-s * 0.4) + sa * (s * 0.5), y + sa * (-s * 0.4) - ca * (s * 0.5));
    g.lineTo(x + ca * (-s * 0.6) + sa * (s * 0.35), y + sa * (-s * 0.6) - ca * (s * 0.35));
    g.lineTo(x + ca * (-s * 0.6) - sa * (s * 0.35), y + sa * (-s * 0.6) + ca * (s * 0.35));
    g.lineTo(x + ca * (-s * 0.4) - sa * (s * 0.5), y + sa * (-s * 0.4) + ca * (s * 0.5));
    g.closePath();
    g.fillPath();

    g.lineStyle(2, color, 0.85);
    g.strokePath();

    // Cockpit
    g.fillStyle(color, 0.9);
    g.beginPath();
    g.arc(x + ca * (s * 0.4), y + sa * (s * 0.4), 3.5, 0, Math.PI * 2);
    g.fillPath();

    // Stage 1 upgrade: Wing boosters
    if (stage >= 1) {
      g.fillStyle(0xff8800, 0.6);
      g.fillRect(x + ca * (-s * 0.5) + sa * (s * 0.4) - 2, y + sa * (-s * 0.5) - ca * (s * 0.4) - 2, 4, 4);
      g.fillRect(x + ca * (-s * 0.5) - sa * (s * 0.4) - 2, y + sa * (-s * 0.5) + ca * (s * 0.4) - 2, 4, 4);
    }

    // Stage 2 upgrade: Energy trails
    if (stage >= 2) {
      g.lineStyle(1.5, 0x00ffff, 0.5);
      g.strokePath();
    }
  }
  else if (shipType === 'TANKS') {
    // Hexagonal body
    g.fillStyle(0x0a0a2a, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = angle + (i / 6) * Math.PI * 2;
      const px = x + Math.cos(ang) * s * 0.75;
      const py = y + Math.sin(ang) * s * 0.75;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    g.lineStyle(2.5, color, 0.85);
    g.strokePath();

    // Inner hexagon
    g.fillStyle(color, 0.35);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = angle + (i / 6) * Math.PI * 2 + Math.PI / 6;
      g.lineTo(x + Math.cos(ang) * s * 0.4, y + Math.sin(ang) * s * 0.4);
    }
    g.closePath();
    g.fillPath();

    // Stage 1 upgrade: Armor panels
    if (stage >= 1) {
      g.lineStyle(2, color, 0.9);
      g.beginPath();
      g.arc(x, y, s * 0.9, 0, Math.PI * 2);
      g.strokePath();
    }

    // Stage 2 upgrade: Turrets
    if (stage >= 2) {
      for (let i = 0; i < 4; i++) {
        const ang = angle + (i / 4) * Math.PI * 2;
        g.fillStyle(0xff4444, 0.7);
        g.fillRect(x + Math.cos(ang) * s * 0.8 - 2, y + Math.sin(ang) * s * 0.8 - 2, 4, 4);
      }
    }
  }
  else if (shipType === 'RAZOR') {
    // Sharp triangular body
    g.fillStyle(0x0a0a2a, 1);
    g.beginPath();
    g.moveTo(x + ca * (s * 1.15), y + sa * (s * 1.15));
    g.lineTo(x + ca * (-s * 0.5) + sa * (s * 0.45), y + sa * (-s * 0.5) - ca * (s * 0.45));
    g.lineTo(x + ca * (-s * 0.3), y + sa * (-s * 0.3));
    g.lineTo(x + ca * (-s * 0.5) - sa * (s * 0.45), y + sa * (-s * 0.5) + ca * (s * 0.45));
    g.closePath();
    g.fillPath();

    g.lineStyle(2, color, 0.9);
    g.strokePath();

    // Cockpit
    g.fillStyle(color, 0.9);
    g.fillRect(x + ca * (s * 0.2) - 2.5, y + sa * (s * 0.2) - 6, 5, 12);

    // Stage 1 upgrade: Afterburners
    if (stage >= 1) {
      g.fillStyle(0xff6600, 0.7);
      g.fillRect(x + ca * (-s * 0.4) + sa * (s * 0.3) - 2, y + sa * (-s * 0.4) - ca * (s * 0.3) - 2, 4, 4);
      g.fillRect(x + ca * (-s * 0.4) - sa * (s * 0.3) - 2, y + sa * (-s * 0.4) + ca * (s * 0.3) - 2, 4, 4);
    }

    // Stage 2 upgrade: Blades
    if (stage >= 2) {
      g.lineStyle(1.5, color, 0.8);
      g.beginPath();
      g.moveTo(x + ca * (s * 1.2) + sa * (s * 0.5), y + sa * (s * 1.2) - ca * (s * 0.5));
      g.lineTo(x + ca * (s * 0.8) + sa * (s * 0.7), y + sa * (s * 0.8) - ca * (s * 0.7));
      g.strokePath();

      g.beginPath();
      g.moveTo(x + ca * (s * 1.2) - sa * (s * 0.5), y + sa * (s * 1.2) + ca * (s * 0.5));
      g.lineTo(x + ca * (s * 0.8) - sa * (s * 0.7), y + sa * (s * 0.8) + ca * (s * 0.7));
      g.strokePath();
    }
  }
}

// ============================================================
// AUDIO SYSTEM
// ============================================================

let audioCtx = null;

/**
 * Initialize the audio context
 * Must be called after user interaction (like a click)
 */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log('Audio initialized');
  }
}

/**
 * Create a beep sound
 * @param {number} freq - Frequency in Hz
 * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
 * @param {number} vol - Volume (0-1)
 * @param {number} dur - Duration in seconds
 * @param {number} delay - Delay before playing in seconds
 */
function beep(freq, type, vol, dur, delay = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + dur);
}

/**
 * Play a sound effect by name
 * @param {string} name - Sound effect name
 */
function sfx(name) {
  if (!audioCtx) return;
  switch (name) {
    case 'shoot':
      beep(280, 'square', 0.05, 0.05);
      beep(320, 'square', 0.03, 0.06, 0.01);
      break;
    case 'hit':
      beep(150, 'sawtooth', 0.10, 0.08);
      beep(80, 'sawtooth', 0.06, 0.10, 0.02);
      break;
    case 'enemyHit':
      beep(200, 'triangle', 0.06, 0.05);
      beep(120, 'triangle', 0.04, 0.07, 0.01);
      break;
    case 'enemyDie':
      beep(180, 'sawtooth', 0.12, 0.15);
      beep(90, 'sawtooth', 0.08, 0.20, 0.05);
      break;
    case 'enemyDieTank':
      beep(80, 'sawtooth', 0.15, 0.25);
      beep(50, 'sawtooth', 0.12, 0.35, 0.08);
      break;
    case 'enemyDieScout':
      beep(300, 'triangle', 0.10, 0.10);
      beep(200, 'triangle', 0.08, 0.15, 0.03);
      break;
    case 'enemyDieSniper':
      beep(400, 'sine', 0.08, 0.12);
      beep(200, 'sine', 0.06, 0.18, 0.04);
      break;
    case 'dash':
      beep(600, 'sine', 0.08, 0.12);
      beep(800, 'sine', 0.06, 0.15, 0.03);
      break;
    case 'pickup':
      beep(440, 'sine', 0.08, 0.10);
      beep(660, 'sine', 0.08, 0.12, 0.08);
      beep(880, 'sine', 0.06, 0.10, 0.16);
      break;
    case 'upgrade':
      beep(440, 'triangle', 0.10, 0.15);
      beep(660, 'triangle', 0.10, 0.15, 0.08);
      beep(880, 'triangle', 0.08, 0.15, 0.16);
      break;
    case 'slowmo':
      beep(60, 'sine', 0.08, 0.35);
      beep(40, 'sine', 0.06, 0.50, 0.15);
      break;
    case 'heartbeat':
      beep(60, 'sine', 0.12, 0.15);
      beep(50, 'sine', 0.08, 0.12, 0.12);
      break;
    case 'bossDie':
      beep(100, 'sawtooth', 0.15, 0.40);
      beep(60, 'sawtooth', 0.12, 0.60, 0.15);
      beep(40, 'sawtooth', 0.10, 0.80, 0.30);
      break;
    case 'bossBegin':
      beep(200, 'square', 0.12, 0.25);
      beep(150, 'square', 0.12, 0.25, 0.12);
      beep(100, 'square', 0.12, 0.30, 0.24);
      break;
    case 'playerDie':
      beep(220, 'sawtooth', 0.12, 0.30);
      beep(110, 'sawtooth', 0.10, 0.50, 0.15);
      beep(55, 'sawtooth', 0.08, 0.70, 0.30);
      break;
    case 'shieldHit':
      beep(500, 'sine', 0.08, 0.08);
      beep(400, 'sine', 0.06, 0.10, 0.02);
      break;
    case 'laser':
      beep(800, 'sine', 0.05, 0.15);
      beep(1200, 'sine', 0.03, 0.20, 0.02);
      break;
    case 'shotgun':
      beep(120, 'square', 0.08, 0.08);
      beep(80, 'square', 0.05, 0.10, 0.01);
      break;
    case 'ricochet':
      beep(400, 'triangle', 0.05, 0.05);
      beep(600, 'triangle', 0.03, 0.06, 0.02);
      break;
    case 'gravityWell':
      beep(60, 'sine', 0.06, 0.30);
      beep(40, 'sine', 0.04, 0.40, 0.10);
      break;
    case 'teleport':
      beep(800, 'sine', 0.07, 0.08);
      beep(400, 'sine', 0.05, 0.10, 0.03);
      break;
  }
}
