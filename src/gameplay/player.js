/**
 * PLAYER SYSTEM
 * Handles player movement, dash mechanics, damage, and regeneration.
 *
 * For a young learner: This is where you can change how the player ship moves,
 * how much damage it takes, and how the dash ability works!
 */

class PlayerSystem {
  constructor(scene) {
    this.scene = scene;
    this.player = null;
    this.afterburnerT = 0;  // Timer for RAZOR ship afterburner boost
  }

  /**
   * Initialize the player object
   * @param {number} shipIdx - Ship index (0=VIPER, 1=TANKS, 2=RAZOR)
   */
  init(shipIdx) {
    const ship = SHIPS[shipIdx];
    const bonuses = applyPersistentBonuses(ship);

    this.player = {
      x: W / 2,
      y: H / 2,
      angle: 0,
      hp: bonuses.hp,
      maxHp: bonuses.maxHp,
      shield: bonuses.shield,
      maxShield: bonuses.maxShield,
      speed: bonuses.speed,
      invuln: 0,
      dashCD: 0,
      dashing: false,
      dashT: 0,
      dashA: 0,
      shipIdx: shipIdx,
      idleT: 0,
      upgradeStage: 0,
      hasTeleport: false,
      shotCount: 0  // For VIPER rapid strike perk
    };

    return this.player;
  }

  /**
   * Update player position based on keyboard input
   * @param {number} dt - Delta time in seconds
   * @param {object} keys - Keyboard input object {W, A, S, D}
   */
  updateMovement(dt, keys) {
    const p = this.player;

    // Get input direction
    let vx = 0, vy = 0;
    if (keys.W.isDown) vy -= 1;
    if (keys.S.isDown) vy += 1;
    if (keys.A.isDown) vx -= 1;
    if (keys.D.isDown) vx += 1;

    // Normalize and apply speed
    const [nx, ny] = norm(vx, vy);
    let spd = p.speed;

    // RAZOR perk: Afterburner - 15% speed boost after dashing
    if (p.shipIdx === 2 && this.afterburnerT > 0) {
      spd *= 1.15;
      this.afterburnerT -= dt;
    }

    p.x += nx * spd * dt;
    p.y += ny * spd * dt;

    // Keep player in bounds
    p.x = clamp(p.x, 28, W - 28);
    p.y = clamp(p.y, 28, H - 28);

    // Update idle timer
    if (nx !== 0 || ny !== 0) p.idleT = 0;
    else p.idleT += dt;
  }

  /**
   * Handle dash/teleport ability
   * @param {number} dt - Delta time
   * @param {boolean} spacePressed - Is space key pressed
   * @param {object} keys - Keyboard input
   * @param {number} dashCdDur - Dash cooldown duration
   */
  updateDash(dt, spacePressed, keys, dashCdDur) {
    const p = this.player;

    // Update cooldown
    if (p.dashCD > 0) p.dashCD -= dt;

    // Handle dashing state
    if (p.dashing) {
      p.dashT -= dt;
      if (p.dashT <= 0) {
        p.dashing = false;
        p.invuln = 0;
      } else {
        // Move during dash
        if (!p.hasTeleport) {
          p.x += Math.cos(p.dashA) * 550 * dt;
          p.y += Math.sin(p.dashA) * 550 * dt;
          p.x = clamp(p.x, 28, W - 28);
          p.y = clamp(p.y, 28, H - 28);
        }
      }
    }

    // Start dash if space pressed
    if (spacePressed && p.dashCD <= 0 && !p.dashing) {
      let vx = 0, vy = 0;
      if (keys.W.isDown) vy -= 1;
      if (keys.S.isDown) vy += 1;
      if (keys.A.isDown) vx -= 1;
      if (keys.D.isDown) vx += 1;

      const [nx, ny] = norm(vx, vy);

      if (nx !== 0 || ny !== 0) {
        p.dashA = Math.atan2(ny, nx);

        if (p.hasTeleport) {
          // Teleport dash: instant movement
          p.x += nx * 120;
          p.y += ny * 120;
          p.x = clamp(p.x, 28, W - 28);
          p.y = clamp(p.y, 28, H - 28);
          p.invuln = 0.25;
          this.scene.burst(p.x, p.y, 0xff00ff, 20, 180);
          sfx('teleport');
        } else {
          // Regular dash
          p.dashing = true;
          p.dashT = 0.16;
          p.invuln = 0.20;
          this.scene.burst(p.x, p.y, SHIPS[p.shipIdx].color, 15, 150);
          sfx('dash');

          // 30% chance to spawn gravity well
          if (Math.random() < 0.30) {
            this.scene.spawnGravityWell(p.x, p.y);
          }
        }

        p.dashCD = dashCdDur;

        // RAZOR perk: Activate afterburner
        if (p.shipIdx === 2) {
          this.afterburnerT = 2.0;
        }
      }
    }
  }

  /**
   * Update player aiming angle based on mouse position
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  updateAiming(mouseX, mouseY) {
    this.player.angle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
  }

  /**
   * Apply passive health regeneration
   * @param {number} dt - Delta time
   * @param {number} regenRate - HP per second
   */
  updateRegen(dt, regenRate) {
    if (this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + regenRate * dt);
    }
  }

  /**
   * Decrease invulnerability timer
   * @param {number} dt - Delta time
   */
  updateInvuln(dt) {
    if (this.player.invuln > 0) {
      this.player.invuln -= dt;
    }
  }

  /**
   * Apply damage to the player
   * @param {number} amount - Damage amount
   * @returns {boolean} - True if player died
   */
  takeDamage(amount) {
    const p = this.player;

    if (p.invuln > 0) return false;

    // TANKS perk: Armor Plating - reduce damage by 25%
    if (p.shipIdx === 1) {
      amount *= 0.75;
    }

    // Shield absorbs damage first
    if (p.shield > 0) {
      const shieldDmg = Math.min(p.shield, amount);
      p.shield -= shieldDmg;
      amount -= shieldDmg;
      sfx('shieldHit');
    }

    // Apply remaining damage to HP
    if (amount > 0) {
      p.hp -= amount;
      sfx('hit');
      this.scene.shake(12, 0.12);
    }

    p.invuln = 0.35;

    // Check if dead
    if (p.hp <= 0) {
      return true;
    }

    return false;
  }

  /**
   * Check if player can fire rapid strike (VIPER perk)
   * @returns {boolean}
   */
  canRapidStrike() {
    if (this.player.shipIdx === 0) {  // VIPER
      this.player.shotCount++;
      if (this.player.shotCount >= 5) {
        this.player.shotCount = 0;
        return true;
      }
    }
    return false;
  }
}
