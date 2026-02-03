/**
 * GAME CONFIGURATION
 * This file contains all the game's constants, ship definitions,
 * achievements, and upgrade definitions.
 *
 * For a young learner: This is where you can change game settings like
 * canvas size, ship stats, achievement requirements, etc.
 */

// ============================================================
// GAME DIMENSIONS
// ============================================================
const W = 900;  // Canvas width
const H = 680;  // Canvas height

// ============================================================
// GLOBAL GAME STATE
// ============================================================
let highScore = 0;
let lastScore = 0;
let lastWave = 0;
let lastStats = {};
let selectedShip = 0;

// ============================================================
// PERSISTENT UPGRADES
// These are permanent upgrades that persist between games
// BALANCED: Reduced bonuses to prevent early-game trivialization
// ============================================================
const PERSISTENT_UPGRADES = {
  maxHpBonus: {name: 'Max HP Boost', max: 5, bonus: 15, cost: 100},
  damageBonus: {name: 'Damage Boost', max: 5, bonus: 8, cost: 150},
  speedBonus: {name: 'Speed Boost', max: 5, bonus: 5, cost: 120},
  startingShield: {name: 'Starting Shield', max: 3, bonus: 20, cost: 180}
};

// ============================================================
// ACHIEVEMENTS
// Define all achievements and their unlock conditions
// ============================================================
const ACHIEVEMENTS = {
  firstKill: {name: 'First Blood', desc: 'Kill your first enemy', unlocked: false},
  wave5: {name: 'Survivor', desc: 'Reach wave 5', unlocked: false},
  wave10: {name: 'Veteran', desc: 'Reach wave 10', unlocked: false},
  wave20: {name: 'Legend', desc: 'Reach wave 20', unlocked: false},
  boss1: {name: 'Boss Slayer', desc: 'Defeat your first boss', unlocked: false},
  combo10: {name: 'Combo Master', desc: 'Achieve 10x combo', unlocked: false},
  enemies100: {name: 'Exterminator', desc: 'Kill 100 enemies', unlocked: false},
  enemies500: {name: 'Annihilator', desc: 'Kill 500 enemies', unlocked: false},
  noDamageWave: {name: 'Untouchable', desc: 'Complete a wave without taking damage', unlocked: false},
  allUpgrades: {name: 'Fully Loaded', desc: 'Take 10 upgrades in one run', unlocked: false}
};

// ============================================================
// SHIP DEFINITIONS
// Each ship has different stats and a special perk
// ============================================================
const SHIPS = [
  {
    name: 'VIPER',
    color: 0x00ffff,
    glow: 0x44ffff,
    desc: 'Balanced fighter',
    baseHp: 100,
    baseSpeed: 240,
    baseDmg: 24,
    baseRate: 145,
    dashCD: 0.75,
    col2: '#00ffff',
    stats: {firepower: 75, speed: 80, defense: 65, mobility: 85},
    perk: 'RAPID STRIKE',
    perkDesc: 'Every 8th shot fires instantly',
    perkColor: '#00ffff'
  },
  {
    name: 'TANKS',
    color: 0x7733ff,
    glow: 0x9955ff,
    desc: 'Heavy — slow & sturdy',
    baseHp: 150,
    baseSpeed: 185,
    baseDmg: 22,
    baseRate: 155,
    dashCD: 0.90,
    col2: '#7733ff',
    stats: {firepower: 60, speed: 50, defense: 95, mobility: 45},
    perk: 'ARMOR PLATING',
    perkDesc: 'Reduce damage taken by 30%',
    perkColor: '#7733ff'
  },
  {
    name: 'RAZOR',
    color: 0xff6600,
    glow: 0xff8844,
    desc: 'Fast — glass cannon',
    baseHp: 70,
    baseSpeed: 310,
    baseDmg: 28,
    baseRate: 155,
    dashCD: 0.55,
    col2: '#ff6600',
    stats: {firepower: 95, speed: 100, defense: 35, mobility: 90},
    perk: 'AFTERBURNER',
    perkDesc: 'Move 15% faster after dashing',
    perkColor: '#ff6600'
  }
];
