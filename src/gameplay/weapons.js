/**
 * WEAPON SYSTEM
 * Handles weapon firing, bullet updates, and special weapons (laser, shotgun).
 *
 * For a young learner: This is where you can change weapon damage, fire rate,
 * bullet speed, and how special weapons work!
 */

class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.weapon = null;
    this.bullets = [];
    this.enemyBullets = [];
    this.gravityWells = [];
    this.lastFired = 0;
    this.megaCounter = 0;
    this.laserActive = false;
    this.laserCharge = 0;
  }

  /**
   * Initialize weapon with base stats
   * @param {number} shipIdx - Ship index
   */
  init(shipIdx) {
    const ship = SHIPS[shipIdx];
    const bonuses = applyPersistentBonuses(ship);

    this.weapon = {
      type: 'single',
      rate: ship.baseRate,
      dmg: bonuses.baseDmg,
      spd: 580,
      pierce: false,
      homing: false,
      mega: false,
      shots: 0,
      ricochet: false,
      ricochetsLeft: 2,
      shotgun: false,
      laser: false,
      bulletSize: 1.0,
      totalDamageDealt: 0,
      bulletsExpired: 0
    };

    return this.weapon;
  }

  /**
   * Fire weapon based on type
   * @param {number} time - Current game time
   * @param {object} player - Player object
   * @param {number} wave - Current wave number
   * @param {boolean} rapidStrike - VIPER rapid strike active
   * @returns {boolean} - True if fired
   */
  fire(time, player, wave, rapidStrike, slowActive = false) {
    const w = this.weapon;

    const effectiveRate = slowActive ? w.rate * 0.35 : w.rate;
    const minFireRate = 85;
    const safeRate = Math.max(minFireRate, effectiveRate);

    // Check if can fire
    if (time - this.lastFired < safeRate && !rapidStrike) return false;

    const ang = player.angle;
    const spd = w.spd + wave * 5;
    const waveDamageBonus = wave <= 10
      ? wave * 1.5
      : 15 + (wave - 10) * 1.0;
    const dmg = w.dmg + waveDamageBonus;

    // VIPER perk: Rapid strike - fire immediately
    if (rapidStrike) {
      this.lastFired = time - safeRate;
    } else {
      this.lastFired = time;
    }

    // Handle different weapon types
    if (w.shotgun) {
      this.fireShotgun(player, ang, spd, dmg);
    } else if (w.laser) {
      this.activateLaser();
    } else {
      this.fireStandard(player, ang, spd, dmg);
    }

    w.shots++;
    sfx('shoot');
    return true;
  }

  /**
   * Fire shotgun blast (8 pellets)
   */
  fireShotgun(player, ang, spd, dmg) {
    for (let i = 0; i < 8; i++) {
      const spread = (i - 3.5) * 0.15;
      const a = ang + spread;
      this.createBullet(
        player.x,
        player.y,
        a,
        spd * 0.7,
        dmg * 0.6,
        false
      );
    }
    sfx('shotgun');
  }

  /**
   * Activate laser beam
   */
  activateLaser() {
    this.laserActive = true;
    this.laserCharge = 0;
    sfx('laser');
  }

  /**
   * Fire standard bullets based on weapon type
   */
  fireStandard(player, ang, spd, dmg) {
    const w = this.weapon;

    // Check if this is a mega shot (every 10th)
    const isMega = w.mega && this.megaCounter >= 9;
    if (w.mega) {
      this.megaCounter = isMega ? 0 : this.megaCounter + 1;
    }

    // Adjust for mega shot
    if (isMega) {
      spd *= 0.78;
      dmg *= 2;
    }

    // Fire based on weapon type
    switch (w.type) {
      case 'single':
        this.createBullet(player.x, player.y, ang, spd, dmg, isMega);
        break;

      case 'double':
        this.createBullet(player.x + Math.cos(ang + Math.PI / 2) * 6, player.y + Math.sin(ang + Math.PI / 2) * 6, ang, spd, dmg, isMega);
        this.createBullet(player.x - Math.cos(ang + Math.PI / 2) * 6, player.y - Math.sin(ang + Math.PI / 2) * 6, ang, spd, dmg, isMega);
        break;

      case 'spread':
        for (let i = -1; i <= 1; i++) {
          this.createBullet(player.x, player.y, ang + i * 0.25, spd, dmg, isMega);
        }
        break;

      case 'quad':
        for (let i = 0; i < 4; i++) {
          const offset = i * Math.PI / 2;
          this.createBullet(
            player.x + Math.cos(ang + offset) * 8,
            player.y + Math.sin(ang + offset) * 8,
            ang,
            spd,
            dmg,
            isMega
          );
        }
        break;
    }
  }

  /**
   * Create a bullet object
   */
  createBullet(x, y, angle, speed, damage, isMega) {
    this.bullets.push({
      x: x,
      y: y,
      angle: angle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      dmg: damage,
      life: isMega ? 2.1 : 1.6,
      pierce: this.weapon.pierce || isMega,
      homing: this.weapon.homing,
      mega: isMega,
      trail: [],
      shotgun: this.weapon.shotgun,
      size: this.weapon.bulletSize,
      ricochet: this.weapon.ricochet,
      ricochetsLeft: this.weapon.ricochetsLeft
    });
  }

  /**
   * Update all bullets
   * @param {number} dt - Delta time
   * @param {array} enemies - Enemy array
   */
  updateBullets(dt, enemies) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      // Update position
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Homing behavior
      if (b.homing && enemies.length > 0) {
        const nearest = this.findNearestEnemy(b, enemies);
        if (nearest) {
          const dx = nearest.x - b.x;
          const dy = nearest.y - b.y;
          const [nx, ny] = norm(dx, dy);
          const accel = 300;
          b.vx += nx * accel * dt;
          b.vy += ny * accel * dt;

          // Cap speed
          const curSpd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          const maxSpd = this.weapon.spd + this.scene.wave * 5;
          if (curSpd > maxSpd) {
            b.vx = (b.vx / curSpd) * maxSpd;
            b.vy = (b.vy / curSpd) * maxSpd;
          }
        }
      }

      // Ricochet off walls
      if (b.ricochet && b.ricochetsLeft > 0) {
        let bounced = false;
        if (b.x < 0 || b.x > W) {
          b.vx = -b.vx;
          b.x = clamp(b.x, 0, W);
          bounced = true;
        }
        if (b.y < 0 || b.y > H) {
          b.vy = -b.vy;
          b.y = clamp(b.y, 0, H);
          bounced = true;
        }
        if (bounced) {
          b.ricochetsLeft--;
          sfx('ricochet');
        }
      }

      // Update trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      // Check collision with enemies
      let hit = false;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (!e.alive) continue;

        const d = dist(b.x, b.y, e.x, e.y);
        if (d < e.size + 3 * b.size) {
          const damageMultiplier = b.pierce ? 0.75 : 1;
          e.hp -= b.dmg * damageMultiplier;
          e.hitFlash = 0.08;
          this.scene.burst(e.x, e.y, e.color, 5, 60);
          sfx('enemyHit');

          if (b.mega) {
            this.scene.explodeMega(b.x, b.y, b.dmg);
          }

          if (!b.pierce) {
            hit = true;
            break;
          }
        }
      }

      // Remove bullet if hit or out of bounds/life
      if (hit || b.life <= 0 || (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20)) {
        this.bullets.splice(i, 1);
      }
    }
  }

  /**
   * Find nearest enemy to a bullet
   */
  findNearestEnemy(bullet, enemies) {
    let nearest = null;
    let minDist = Infinity;

    for (const e of enemies) {
      if (!e.alive) continue;
      const d = dist2(bullet.x, bullet.y, e.x, e.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }

    return nearest;
  }

  /**
   * Update laser beam damage
   * @param {number} dt - Delta time
   * @param {object} player - Player object
   * @param {array} enemies - Enemy array
   */
  updateLaser(dt, player, enemies) {
    if (!this.laserActive) return;

    this.laserCharge += dt;

    if (this.laserCharge < 0.1) return;

    const range = 600;
    const x1 = player.x;
    const y1 = player.y;
    const x2 = player.x + Math.cos(player.angle) * range;
    const y2 = player.y + Math.sin(player.angle) * range;

    const dmg = (this.weapon.dmg * 0.5 + this.scene.wave) * dt * 10;

    for (const e of enemies) {
      if (!e.alive) continue;
      const d = this.pointLineDistance(e.x, e.y, x1, y1, x2, y2);
      if (d < e.size + 5) {
        e.hp -= dmg;
        if (Math.random() < 0.15) {
          this.scene.burst(e.x, e.y, e.color, 2, 40);
        }
      }
    }
  }

  /**
   * Deactivate laser
   */
  deactivateLaser() {
    this.laserActive = false;
    this.laserCharge = 0;
  }

  /**
   * Create enemy bullet
   */
  spawnEnemyBullet(x, y, angle, speed, damage) {
    this.enemyBullets.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      dmg: damage,
      life: 4.0
    });
  }

  /**
   * Update enemy bullets
   * @param {number} dt - Delta time
   * @param {object} player - Player object
   * @returns {number} - Damage dealt to player
   */
  updateEnemyBullets(dt, player) {
    let damageTaken = 0;

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Check collision with player
      const d = dist(b.x, b.y, player.x, player.y);
      if (d < 18) {
        damageTaken += b.dmg;
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Remove if out of bounds or dead
      if (b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
        this.enemyBullets.splice(i, 1);
      }
    }

    return damageTaken;
  }

  /**
   * Spawn gravity well
   */
  spawnGravityWell(x, y) {
    this.gravityWells.push({
      x: x,
      y: y,
      radius: 100,
      strength: 150,
      life: 3.0,
      maxLife: 3.0
    });
    sfx('gravityWell');
  }

  /**
   * Update gravity wells and apply force to enemies
   */
  updateGravityWells(dt, enemies) {
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const gw = this.gravityWells[i];
      gw.life -= dt;

      if (gw.life <= 0) {
        this.gravityWells.splice(i, 1);
        continue;
      }

      // Pull enemies toward well
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = gw.x - e.x;
        const dy = gw.y - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < gw.radius) {
          const strength = gw.strength * (1 - d / gw.radius);
          const [nx, ny] = norm(dx, dy);
          e.x += nx * strength * dt;
          e.y += ny * strength * dt;
        }
      }
    }
  }

  /**
   * Calculate distance from point to line segment
   */
  pointLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return dist(px, py, xx, yy);
  }
}
