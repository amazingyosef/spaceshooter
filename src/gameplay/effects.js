/**
 * EFFECTS SYSTEM
 * Handles visual effects: particles, pickups, explosions, camera shake.
 *
 * For a young learner: This is where you can change particle effects,
 * pickup types, explosion sizes, and camera shake intensity!
 */

class EffectsSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.pickups = [];
    this.shakeAmt = 0;
    this.shakeT = 0;
  }

  /**
   * Create a particle burst effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} color - Particle color
   * @param {number} count - Number of particles
   * @param {number} speed - Base speed
   */
  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = speed * rand(0.6, 1.4);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: rand(0.25, 0.55),
        color: color,
        size: rand(1.5, 3.5)
      });
    }
  }

  /**
   * Create a mega explosion
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} baseDamage - Base damage amount
   * @param {array} enemies - Enemy array
   * @param {object} player - Player object
   * @param {number} wave - Current wave
   * @returns {number} - Damage dealt to player
   */
  explodeMega(x, y, baseDamage, enemies, player, wave) {
    const radius = 80 + wave * 4;
    let playerDamage = 0;

    // Damage enemies in radius
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < radius) {
        e.hp -= baseDamage;
        this.burst(e.x, e.y, e.color, 5, 80);
      }
    }

    // Damage player if in range
    const pd = dist(x, y, player.x, player.y);
    if (pd < radius) {
      playerDamage = pd < 30 ? 3 : baseDamage * 0.3;
    }

    // Visual effects
    this.burst(x, y, 0xff8800, 30, 180);
    this.shake(15, 0.18);

    return playerDamage;
  }

  /**
   * Spawn a pickup
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} forcedType - Force specific type (optional)
   */
  spawnPickup(x, y, forcedType = null) {
    let type = forcedType;

    if (!type) {
      const r = Math.random();
      if (r < 0.40) type = 'health';
      else if (r < 0.58) type = 'shield';
      else if (r < 0.73) type = 'speed';
      else if (r < 0.88) type = 'score';
      else type = 'slowmo';
    }

    this.pickups.push({
      x: x,
      y: y,
      type: type,
      life: 9.5,
      a: rand(0, Math.PI * 2)
    });
  }

  /**
   * Collect a pickup and apply its effect
   * @param {object} pickup - Pickup object
   * @param {object} player - Player object
   * @param {object} stats - Game stats
   * @param {number} combo - Current combo
   * @returns {object} - Effect results {score, slowmo}
   */
  collectPickup(pickup, player, stats, combo) {
    const result = { score: 0, slowmo: 0 };

    switch (pickup.type) {
      case 'health':
        player.hp = Math.min(player.maxHp, player.hp + 30);
        this.burst(pickup.x, pickup.y, 0x00ff00, 10, 80);
        break;

      case 'shield':
        if (player.maxShield < 50) {
          player.maxShield = 50;
        }
        player.shield = Math.min(player.maxShield, player.shield + 25);
        this.burst(pickup.x, pickup.y, 0x00aaff, 10, 80);
        break;

      case 'speed':
        player.speed *= 1.18;
        stats.speedBoostT = 5.0;
        this.burst(pickup.x, pickup.y, 0xffff00, 10, 100);
        break;

      case 'score':
        const bonus = 15 * (combo > 5 ? 1.5 : 1);
        result.score = bonus;
        this.burst(pickup.x, pickup.y, 0xffaa00, 10, 80);
        break;

      case 'slowmo':
        result.slowmo = 3.5;
        this.burst(pickup.x, pickup.y, 0xff00ff, 15, 120);
        sfx('slowmo');
        break;
    }

    sfx('pickup');
    return result;
  }

  /**
   * Update all particles
   * @param {number} dt - Delta time
   */
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;  // Gravity
    }
  }

  /**
   * Update all pickups
   * @param {number} dt - Delta time
   * @param {object} player - Player object
   * @param {object} stats - Game stats
   * @param {number} combo - Current combo
   * @returns {object} - Collection results {collected, score, slowmo}
   */
  updatePickups(dt, player, stats, combo) {
    const result = { collected: [], score: 0, slowmo: 0 };

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;
      p.a += dt * 2;

      if (p.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Check collection
      const d = dist(p.x, p.y, player.x, player.y);
      if (d < 28) {
        const collectResult = this.collectPickup(p, player, stats, combo);
        result.score += collectResult.score;
        result.slowmo = Math.max(result.slowmo, collectResult.slowmo);
        result.collected.push(p.type);
        this.pickups.splice(i, 1);
      }
    }

    return result;
  }

  /**
   * Trigger camera shake
   * @param {number} amount - Shake intensity
   * @param {number} duration - Shake duration in seconds
   */
  shake(amount, duration) {
    this.shakeAmt = amount;
    this.shakeT = duration;
  }

  /**
   * Update camera shake
   * @param {number} dt - Delta time
   * @returns {object} - Shake offset {x, y}
   */
  updateShake(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      if (this.shakeT <= 0) {
        return { x: 0, y: 0 };
      }
      return {
        x: rand(-this.shakeAmt, this.shakeAmt),
        y: rand(-this.shakeAmt, this.shakeAmt)
      };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Get particle color as RGB
   * @param {number} hexColor - Hex color value
   * @returns {string} - RGB color string
   */
  getColorString(hexColor) {
    const r = (hexColor >> 16) & 0xFF;
    const g = (hexColor >> 8) & 0xFF;
    const b = hexColor & 0xFF;
    return `rgb(${r},${g},${b})`;
  }
}
