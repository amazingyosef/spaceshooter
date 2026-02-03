/**
 * GAME SYSTEMS
 * This file contains the persistence system (saving/loading game data)
 * and achievement tracking.
 *
 * For a young learner: This is how the game remembers your progress!
 * - persistentUpgrades: Permanent upgrades that carry over between games
 * - achievements: Unlock achievements by completing challenges
 * - totalEnemiesKilled: Tracks how many enemies you've destroyed (ever!)
 */

// ============================================================
// GLOBAL STATE
// ============================================================
let persistentUpgrades = {};
let achievements = {};
let totalEnemiesKilled = 0;
let currentGame = null;  // Reference to the current GameScene instance

// ============================================================
// PERSISTENCE SYSTEM
// ============================================================

/**
 * Load saved data from browser storage
 */
function loadPersistent() {
  try {
    const data = localStorage.getItem('cyberArenaEnhanced');
    if (data) {
      const obj = JSON.parse(data);
      persistentUpgrades = obj.persistentUpgrades || {};
      achievements = obj.achievements || {};
      totalEnemiesKilled = obj.totalEnemiesKilled || 0;
      highScore = obj.highScore || 0;
      selectedShip = obj.selectedShip || 0;

      // Initialize achievements with default values
      Object.keys(ACHIEVEMENTS).forEach(key => {
        if (!achievements[key]) achievements[key] = { ...ACHIEVEMENTS[key] };
        else achievements[key] = { ...ACHIEVEMENTS[key], ...achievements[key] };
      });
    }
  } catch (e) {
    console.error('Load error:', e);
  }
}

/**
 * Save current data to browser storage
 */
function savePersistent() {
  try {
    localStorage.setItem('cyberArenaEnhanced', JSON.stringify({
      persistentUpgrades,
      achievements,
      totalEnemiesKilled,
      highScore,
      selectedShip
    }));
  } catch (e) {
    console.error('Save error:', e);
  }
}

/**
 * Unlock an achievement
 * @param {string} key - Achievement key from ACHIEVEMENTS object
 */
function unlockAchievement(key) {
  if (!achievements[key]) achievements[key] = { ...ACHIEVEMENTS[key] };
  if (!achievements[key].unlocked) {
    achievements[key].unlocked = true;
    savePersistent();

    // Show notification if in game
    if (currentGame && currentGame.showNotif) {
      currentGame.showNotif('🏆 ' + achievements[key].name, '#ffaa00', 2.5);
      if (window.sfx) sfx('upgrade');
    }

    console.log('Achievement unlocked:', achievements[key].name);
  }
}

/**
 * Apply persistent bonuses to a ship
 * @param {object} ship - Ship configuration object
 * @returns {object} Ship stats with bonuses applied
 */
function applyPersistentBonuses(ship) {
  const hpBonus = (persistentUpgrades.maxHpBonus || 0) * PERSISTENT_UPGRADES.maxHpBonus.bonus;
  const speedMult = 1 + ((persistentUpgrades.speedBonus || 0) * PERSISTENT_UPGRADES.speedBonus.bonus / 100);
  const damageMult = 1 + ((persistentUpgrades.damageBonus || 0) * PERSISTENT_UPGRADES.damageBonus.bonus / 100);
  const shieldBonus = (persistentUpgrades.startingShield || 0) * PERSISTENT_UPGRADES.startingShield.bonus;

  return {
    hp: ship.baseHp + hpBonus,
    maxHp: ship.baseHp + hpBonus,
    speed: ship.baseSpeed * speedMult,
    baseDmg: ship.baseDmg * damageMult,
    shield: shieldBonus,
    maxShield: shieldBonus
  };
}

/**
 * Track enemy kills and check for achievements
 */
function trackEnemyKill() {
  totalEnemiesKilled++;

  // Check for kill-based achievements
  if (totalEnemiesKilled === 1) unlockAchievement('firstKill');
  if (totalEnemiesKilled === 100) unlockAchievement('enemies100');
  if (totalEnemiesKilled === 500) unlockAchievement('enemies500');

  savePersistent();
}

// Load saved data when the script loads
loadPersistent();
