/**
 * UPGRADE SYSTEM
 * Handles upgrade pool generation and upgrade selection screen.
 *
 * For a young learner: This is where you can add new upgrades,
 * change existing ones, or modify upgrade costs/effects!
 */

class UpgradeSystem {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Get 3 random available upgrades
   * @param {object} weapon - Weapon object
   * @param {object} player - Player object
   * @param {number} stats - Game stats object
   * @returns {array} - Array of 3 upgrade objects
   */
  getPool(weapon, player, stats) {
    const w = weapon;
    const p = player;

    const all = [
      {
        name: 'DUAL SHOT',
        desc: 'Fire two bullets',
        ok: () => w.type === 'single',
        apply: () => { w.type = 'double'; }
      },
      {
        name: 'SPREAD',
        desc: 'Three-shot cone',
        ok: () => w.type !== 'spread' && w.type !== 'quad',
        apply: () => { w.type = 'spread'; }
      },
      {
        name: 'QUAD SHOT',
        desc: 'Four-shot burst',
        ok: () => w.type !== 'quad',
        apply: () => { w.type = 'quad'; }
      },
      {
        name: 'RICOCHET',
        desc: 'Bullets bounce off walls',
        ok: () => !w.ricochet,
        apply: () => { w.ricochet = true; w.ricochetsLeft = 2; }
      },
      {
        name: 'SHOTGUN BLAST',
        desc: 'Wide 8-pellet spread',
        ok: () => !w.shotgun && !w.laser,
        apply: () => { w.shotgun = true; w.type = 'single'; }
      },
      {
        name: 'LASER BEAM',
        desc: 'Continuous damage beam',
        ok: () => !w.laser && !w.shotgun,
        apply: () => { w.laser = true; w.type = 'single'; }
      },
      {
        name: 'RAPID FIRE',
        desc: 'Increase fire rate',
        ok: () => w.rate > 65,
        apply: () => { w.rate = Math.max(65, w.rate - w.rate * 0.18); }
      },
      {
        name: 'PIERCING',
        desc: 'Bullets pass through',
        ok: () => !w.pierce,
        apply: () => { w.pierce = true; }
      },
      {
        name: 'HOMING',
        desc: 'Bullets track enemies',
        ok: () => !w.homing,
        apply: () => { w.homing = true; }
      },
      {
        name: 'MEGA BLAST',
        desc: 'Every 7th shot explodes',
        ok: () => !w.mega,
        apply: () => { w.mega = true; }
      },
      {
        name: 'BULLET SIZE',
        desc: 'Larger projectiles',
        ok: () => w.bulletSize < 2.0,
        apply: () => { w.bulletSize += 0.4; }
      },
      {
        name: 'MAX HEALTH',
        desc: '+30 HP and heal',
        ok: () => true,
        apply: () => { p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 30); }
      },
      {
        name: 'SPEED UP',
        desc: '+18% movement speed',
        ok: () => true,
        apply: () => { p.speed *= 1.18; }
      },
      {
        name: 'ENERGY SHIELD',
        desc: '+50 shield capacity',
        ok: () => true,
        apply: () => {
          p.maxShield += 50;
          p.shield = Math.min(p.maxShield, p.shield + 50);
        }
      },
      {
        name: 'REGEN',
        desc: 'Passive heal',
        ok: () => true,
        apply: () => { stats.regenRate += 2.2; }
      },
      {
        name: 'QUICK DASH',
        desc: 'Reduce dash cooldown',
        ok: () => !stats.hasDashUpgrade,
        apply: () => {
          stats.dashCdDur *= 0.7;
          stats.hasDashUpgrade = true;
        }
      },
      {
        name: 'TELEPORT',
        desc: 'Dash becomes teleport',
        ok: () => !p.hasTeleport,
        apply: () => {
          p.hasTeleport = true;
          stats.dashCdDur *= 0.85;
        }
      }
    ];

    const available = all.filter(u => u.ok());
    const chosen = [];

    while (chosen.length < 3 && available.length > 0) {
      const idx = randI(0, available.length - 1);
      chosen.push(available[idx]);
      available.splice(idx, 1);
    }

    return chosen;
  }

  /**
   * Show the upgrade selection screen
   * @param {array} upgrades - Array of 3 upgrade objects
   */
  show(upgrades) {
    this.scene.upgradeMode = true;
    this.scene.upgrades = upgrades;

    // Create upgrade UI (will be drawn in draw() method)
  }

  /**
   * Hide the upgrade selection screen
   */
  hide() {
    this.scene.upgradeMode = false;
    this.scene.upgrades = [];

    if (this.scene.txtUpTitle) this.scene.txtUpTitle.setVisible(false);
    if (this.scene.txtUpSub) this.scene.txtUpSub.setVisible(false);

    if (this.scene.upTexts && this.scene.upTexts.length > 0) {
      this.scene.upTexts.forEach(t => {
        if (t && t.destroy) t.destroy();
      });
      this.scene.upTexts = [];
    }

    if (this.scene.gUp) this.scene.gUp.clear();
  }

  /**
   * Handle upgrade selection click
   * @param {number} mx - Mouse X
   * @param {number} my - Mouse Y
   * @param {array} upgrades - Available upgrades
   * @param {object} stats - Game stats
   * @returns {boolean} - True if an upgrade was selected
   */
  handleClick(mx, my, upgrades, stats) {
    const layout = this.scene.getUpgradeCardLayout(upgrades.length);
    for (let i = 0; i < upgrades.length; i++) {
      const ux = layout.startX + i * (layout.cardW + layout.gap);
      const uy = layout.startY;
      const uw = layout.cardW;
      const uh = layout.cardH;

      if (mx >= ux && mx <= ux + uw && my >= uy && my <= uy + uh) {
        upgrades[i].apply();
        stats.upgradesTaken++;

        if (stats.upgradesTaken >= 10) {
          unlockAchievement('allUpgrades');
        }

        sfx('upgrade');
        this.hide();
        return true;
      }
    }

    return false;
  }
}
