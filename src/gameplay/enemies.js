/**
 * ENEMY SYSTEM
 * Handles enemy spawning, AI behavior, and different enemy types.
 *
 * For a young learner: This is where you can change enemy stats,
 * create new enemy types, and modify how enemies behave!
 */

/**
 * Calculate enemy HP with hybrid linear/exponential scaling.
 * Linear growth for waves 1-10, exponential growth for waves 11+.
 * @param {number} baseHP - Base HP value.
 * @param {number} hpPerWave - HP increase per wave (linear portion).
 * @param {number} wave - Current wave number.
 * @param {number} lateGameMultiplier - Exponential multiplier for waves 11+.
 * @returns {number} - Calculated HP.
 */
function calculateEnemyHP(baseHP, hpPerWave, wave, lateGameMultiplier = 1.12) {
  if (wave <= 10) {
    return baseHP + wave * hpPerWave;
  }

  const wave10HP = baseHP + 10 * hpPerWave;
  const additionalWaves = wave - 10;
  return Math.floor(wave10HP * Math.pow(lateGameMultiplier, additionalWaves));
}

class EnemySystem {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.sniperWarnings = [];
  }

  /**
   * Spawn an enemy of the specified type
   * @param {string} type - Enemy type name
   * @param {number} wave - Current wave number
   */
  spawn(type, wave) {
    // Spawn from random edge
    const side = randI(0, 3);
    let x, y;
    if (side === 0) { x = rand(0, W); y = -30; }
    else if (side === 1) { x = W + 30; y = rand(0, H); }
    else if (side === 2) { x = rand(0, W); y = H + 30; }
    else { x = -30; y = rand(0, H); }

    const enemy = { x, y, angle: 0, type, alive: true };

    // Set stats based on enemy type
    switch (type) {
      case 'drone':
        enemy.hp = calculateEnemyHP(30, 12, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 90 + wave * 3;
        enemy.size = 14;
        enemy.color = 0x44aaff;
        enemy.glow = 0x6688cc;
        enemy.pts = 10 + wave * 2;
        enemy.rotAngle = 0; // For rotation animation
        break;

      case 'scout':
        enemy.hp = calculateEnemyHP(18, 7, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 155 + wave * 4;
        enemy.size = 9;
        enemy.color = 0x88ff44;
        enemy.glow = 0x66cc44;
        enemy.pts = 15 + wave * 2;
        enemy.thrusterT = 0; // For thruster animation
        break;

      case 'tank':
        enemy.hp = calculateEnemyHP(120, 30, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 52 + wave;
        enemy.size = 26;
        enemy.color = 0xff4444;
        enemy.glow = 0xcc4444;
        enemy.pts = 35 + wave * 3;
        break;

      case 'shieldE':
        enemy.hp = calculateEnemyHP(55, 15, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 48 + wave;
        enemy.size = 20;
        enemy.color = 0xffaa00;
        enemy.glow = 0xcc8800;
        enemy.pts = 25 + wave * 2;
        enemy.shieldA = 0;
        break;

      case 'swarm':
        enemy.hp = calculateEnemyHP(70, 18, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 75 + wave * 3;
        enemy.size = 18;
        enemy.color = 0xff88ff;
        enemy.glow = 0xcc66cc;
        enemy.pts = 28 + wave * 3;
        enemy.orbitA = 0; // For orbiting triangles
        break;

      case 'sniper':
        enemy.hp = calculateEnemyHP(40, 11, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 65 + wave * 2;
        enemy.size = 12;
        enemy.color = 0x00ffff;
        enemy.glow = 0x00cccc;
        enemy.pts = 30 + wave * 3;
        enemy.minRange = 180;
        enemy.charging = false;
        enemy.chargeT = 0;
        enemy.chargeDur = 0.6;
        break;

      case 'healer':
        enemy.hp = calculateEnemyHP(50, 12, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 60 + wave * 2;
        enemy.size = 16;
        enemy.color = 0x00ff88;
        enemy.glow = 0x00cc66;
        enemy.pts = 40 + wave * 4;
        enemy.healT = 2.0;
        enemy.pulseT = 0; // For pulsing animation
        break;

      case 'spawner':
        enemy.hp = calculateEnemyHP(80, 22, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 55 + wave;
        enemy.size = 22;
        enemy.color = 0xffff00;
        enemy.glow = 0xcccc00;
        enemy.pts = 50 + wave * 5;
        enemy.spawnT = 4.0;
        enemy.spawnCount = 0;
        enemy.rotAngle = 0; // For star rotation
        break;

      case 'bomber':
        enemy.hp = calculateEnemyHP(35, 9, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 85 + wave * 3;
        enemy.size = 13;
        enemy.color = 0xff6600;
        enemy.glow = 0xcc5500;
        enemy.pts = 35 + wave * 3;
        enemy.pulseT = 0;
        break;

      case 'teleporter':
        enemy.hp = calculateEnemyHP(45, 11, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 70 + wave * 2;
        enemy.size = 14;
        enemy.color = 0xff00ff;
        enemy.glow = 0xcc00cc;
        enemy.pts = 38 + wave * 3;
        enemy.teleT = 2.5;
        enemy.flickerT = 0; // For flicker effect
        break;

      case 'kamikaze':
        enemy.hp = calculateEnemyHP(25, 8, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 100 + wave * 3;
        enemy.size = 11;
        enemy.color = 0xff2266;
        enemy.glow = 0xcc1144;
        enemy.pts = 30 + wave * 3;
        enemy.charging = false;
        enemy.chargeSpeed = 280;
        enemy.thrusterT = 0; // For thruster animation
        break;

      case 'artillery':
        enemy.hp = calculateEnemyHP(60, 15, wave);
        enemy.maxHp = enemy.hp;
        enemy.speed = 50 + wave;
        enemy.size = 18;
        enemy.color = 0x8844ff;
        enemy.glow = 0x6633cc;
        enemy.pts = 45 + wave * 4;
        enemy.minRange = 200;
        enemy.shootT = 1.8;
        enemy.rotAngle = 0;
        enemy.turretAngle = 0; // For turret rotation
        break;

      case 'boss':
        enemy.hp = calculateEnemyHP(800, 220, wave, 1.15);
        enemy.maxHp = enemy.hp;
        enemy.speed = wave <= 10 ? 85 : 85 + (wave - 10) * 2;
        enemy.size = 45;
        enemy.color = 0xff0066;
        enemy.glow = 0xff4488;
        enemy.pts = 500 + wave * 50;
        enemy.phase = 1;
        enemy.shootT = 1.5;
        enemy.orbitA = 0;
        enemy.chargeT = 5.0;
        enemy.rotAngle = 0; // For rotation
        enemy.ringRotAngle = 0; // For outer ring
        break;

      case 'boss2':
        enemy.hp = calculateEnemyHP(900, 250, wave, 1.15);
        enemy.maxHp = enemy.hp;
        enemy.speed = wave <= 10 ? 95 : 95 + (wave - 10) * 2;
        enemy.size = 48;
        enemy.color = 0x00ff88;
        enemy.glow = 0x44ffaa;
        enemy.pts = 600 + wave * 60;
        enemy.phase = 1;
        enemy.shootT = 1.2;
        enemy.spiralA = 0;
        enemy.rotAngle = 0;
        enemy.bladeAngle = 0; // For rotating blades
        break;

      case 'boss3':
        enemy.hp = calculateEnemyHP(750, 200, wave, 1.15);
        enemy.maxHp = enemy.hp;
        enemy.speed = wave <= 10 ? 100 : 100 + (wave - 10) * 2;
        enemy.size = 42;
        enemy.color = 0xff8800;
        enemy.glow = 0xffaa44;
        enemy.pts = 550 + wave * 55;
        enemy.phase = 1;
        enemy.shootT = 1.0;
        enemy.spawnT = 8.0;
        enemy.chaseT = 0;
        enemy.rotAngle = 0;
        enemy.pulseT = 0; // For pulsing core
        break;

      case 'miniboss':
        enemy.hp = calculateEnemyHP(350, 110, wave, 1.14);
        enemy.maxHp = enemy.hp;
        enemy.speed = wave <= 10 ? 80 : 80 + (wave - 10) * 1.5;
        enemy.size = 35;
        enemy.color = 0xff44ff;
        enemy.glow = 0xff88ff;
        enemy.pts = 300 + wave * 40;
        enemy.shootT = 1.8;
        enemy.orbitA = 0;
        enemy.pulseT = 0;
        enemy.rotAngle = 0;
        break;
    }

    enemy.hitFlash = 0;
    if (type === 'boss' || type === 'boss2' || type === 'boss3') {
      this.scene.currentBoss = enemy;
    }

    this.enemies.push(enemy);
  }

  /**
   * Trigger hit flash on an enemy
   * @param {object} enemy - Enemy object
   */
  triggerHitFlash(enemy) {
    enemy.hitFlash = 0.08;
  }

  /**
   * Update all enemies
   * @param {number} dt - Delta time
   * @param {object} player - Player object
   * @param {number} wave - Current wave
   */
  update(dt, player, wave) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (!e.alive) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Check if dead
      if (e.hp <= 0) {
        this.scene.killEnemy(e, i);
        continue;
      }

      // Update rotation animations
      if (e.rotAngle !== undefined) e.rotAngle += dt * 2;
      if (e.ringRotAngle !== undefined) e.ringRotAngle += dt * 1.5;
      if (e.bladeAngle !== undefined) e.bladeAngle += dt * 3;
      if (e.turretAngle !== undefined) e.turretAngle += dt * 0.5;
      if (e.orbitA !== undefined) e.orbitA += dt * 4;
      if (e.pulseT !== undefined) e.pulseT += dt * 3;
      if (e.flickerT !== undefined) e.flickerT += dt * 8;
      if (e.thrusterT !== undefined) e.thrusterT += dt * 10;

      // Update based on type
      switch (e.type) {
        case 'healer': this.updateHealer(e, dt, player); break;
        case 'spawner': this.updateSpawner(e, dt, player, wave); break;
        case 'bomber': this.updateBomber(e, dt, player); break;
        case 'teleporter': this.updateTeleporter(e, dt); break;
        case 'kamikaze': this.updateKamikaze(e, dt, player); break;
        case 'artillery': this.updateArtillery(e, dt, player); break;
        case 'boss': this.updateBoss1(e, dt, player); break;
        case 'boss2': this.updateBoss2(e, dt, player); break;
        case 'boss3': this.updateBoss3(e, dt, player, wave); break;
        case 'miniboss': this.updateMiniBoss(e, dt, player); break;
        default: this.updateStandard(e, dt, player);
      }

      // Keep in bounds
      e.x = clamp(e.x, 30, W - 30);
      e.y = clamp(e.y, 30, H - 30);
    }

    // Update sniper warnings
    for (let i = this.sniperWarnings.length - 1; i >= 0; i--) {
      const sw = this.sniperWarnings[i];
      sw.t -= dt;
      if (sw.t <= 0) {
        this.sniperWarnings.splice(i, 1);
      }
    }
  }

  /**
   * Standard enemy AI - chase player
   */
  updateStandard(e, dt, player) {
    let targetDist = 0;

    if (e.type === 'sniper') {
      const d = dist(e.x, e.y, player.x, player.y);
      if (d < e.minRange) {
        // Move away
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const [nx, ny] = norm(dx, dy);
        e.x += nx * e.speed * dt;
        e.y += ny * e.speed * dt;
      }

      // Charge shot
      if (!e.charging && d >= e.minRange) {
        e.charging = true;
        e.chargeT = 0;
        // Create warning indicator
        this.sniperWarnings.push({
          x: player.x,
          y: player.y,
          t: e.chargeDur,
          enemy: e
        });
      }
      if (e.charging) {
        e.chargeT += dt;
        if (e.chargeT >= e.chargeDur) {
          const ang = Math.atan2(player.y - e.y, player.x - e.x);
          this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, ang, 350, 12);
          e.charging = false;
        }
      }
    } else if (e.type === 'shieldE') {
      e.shieldA += dt * Math.PI;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    } else if (e.type === 'swarm') {
      const d = dist(e.x, e.y, player.x, player.y);
      if (d < 100) {
        // Flee
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const [nx, ny] = norm(dx, dy);
        e.x += nx * e.speed * dt;
        e.y += ny * e.speed * dt;
      } else {
        // Chase
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const [nx, ny] = norm(dx, dy);
        e.x += nx * e.speed * dt;
        e.y += ny * e.speed * dt;
      }
    } else {
      // Default chase behavior
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    }
  }

  /**
   * Healer AI - keeps distance and heals allies
   */
  updateHealer(e, dt, player) {
    const d = dist(e.x, e.y, player.x, player.y);
    const targetDist = 160;

    if (d < 140) {
      // Move away
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    } else if (d > 180) {
      // Move closer
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    }

    // Heal nearby allies
    e.healT -= dt;
    if (e.healT <= 0) {
      e.healT = 2.0;
      for (const other of this.enemies) {
        if (other === e || !other.alive) continue;
        const d2 = dist(e.x, e.y, other.x, other.y);
        if (d2 < 120 && other.hp < other.maxHp) {
          other.hp = Math.min(other.maxHp, other.hp + 25);
          this.scene.burst(other.x, other.y, 0x00ff88, 8, 80);
        }
      }
    }
  }

  /**
   * Spawner AI - spawns drones
   */
  updateSpawner(e, dt, player, wave) {
    const d = dist(e.x, e.y, player.x, player.y);

    if (d < 160) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    } else if (d > 200) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    }

    e.spawnT -= dt;
    if (e.spawnT <= 0 && e.spawnCount < 3) {
      e.spawnT = 4.0;
      e.spawnCount++;
      const spawnX = e.x + rand(-30, 30);
      const spawnY = e.y + rand(-30, 30);
      const drone = {
        x: spawnX,
        y: spawnY,
        angle: 0,
        type: 'drone',
        alive: true,
        hp: 20 + wave * 5,
        maxHp: 20 + wave * 5,
        speed: 90 + wave * 3,
        size: 12,
        color: 0x44aaff,
        glow: 0x6688cc,
        pts: 8 + wave,
        hitFlash: 0,
        rotAngle: 0
      };
      this.enemies.push(drone);
      this.scene.burst(spawnX, spawnY, 0xffff00, 12, 100);
    }
  }

  /**
   * Bomber AI - explodes on contact
   */
  updateBomber(e, dt, player) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const [nx, ny] = norm(dx, dy);
    e.x += nx * e.speed * dt;
    e.y += ny * e.speed * dt;

    e.pulseT += dt * 6;

    // Check collision with player
    const d = dist(e.x, e.y, player.x, player.y);
    if (d < 25) {
      this.scene.explodeMega(e.x, e.y, 18 + this.scene.wave * 2);
      e.alive = false;
    }
  }

  /**
   * Teleporter AI - randomly teleports
   */
  updateTeleporter(e, dt) {
    e.teleT -= dt;
    if (e.teleT <= 0) {
      e.teleT = 2.5;
      e.x = rand(50, W - 50);
      e.y = rand(50, H - 50);
      this.scene.burst(e.x, e.y, e.color, 15, 120);
      sfx('teleport');
    }
  }

  /**
   * Kamikaze AI - charges at player when close
   */
  updateKamikaze(e, dt, player) {
    const d = dist(e.x, e.y, player.x, player.y);

    if (d < 150) {
      e.charging = true;
    }

    const spd = e.charging ? e.chargeSpeed : e.speed;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const [nx, ny] = norm(dx, dy);
    e.x += nx * spd * dt;
    e.y += ny * spd * dt;
  }

  /**
   * Artillery AI - keeps range and shoots
   */
  updateArtillery(e, dt, player) {
    const d = dist(e.x, e.y, player.x, player.y);

    if (d < e.minRange) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    }

    e.rotAngle += dt * Math.PI * 0.5;

    // Aim turret at player
    e.turretAngle = Math.atan2(player.y - e.y, player.x - e.x);

    e.shootT -= dt;
    if (e.shootT <= 0 && d >= e.minRange) {
      e.shootT = 1.8;
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, ang, 280, 10);
    }
  }

  /**
   * Boss 1 AI - orbits and charges, ring shot
   */
  updateBoss1(e, dt, player) {
    if (e.hp < e.maxHp * 0.4 && e.phase === 1) {
      e.phase = 2;
      e.shootT = 0.9;
    }

    e.orbitA += dt * 0.8;
    const cx = W / 2;
    const cy = H / 2;
    const radius = 150;
    const targetX = cx + Math.cos(e.orbitA) * radius;
    const targetY = cy + Math.sin(e.orbitA) * radius;
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const [nx, ny] = norm(dx, dy);
    e.x += nx * e.speed * dt;
    e.y += ny * e.speed * dt;

    e.chargeT -= dt;
    if (e.chargeT <= 0) {
      e.chargeT = 5.0;
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      const bullets = e.phase === 1 ? 6 : 8;
      for (let i = 0; i < bullets; i++) {
        const a = ang + (i / bullets) * Math.PI * 2;
        this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, a, 200, 15);
      }
    }
  }

  /**
   * Boss 2 AI - spiral movement and shooting
   */
  updateBoss2(e, dt, player) {
    if (e.hp < e.maxHp * 0.45 && e.phase === 1) {
      e.phase = 2;
      e.shootT = 0.7;
    }

    e.spiralA += dt * 1.5;
    const cx = W / 2;
    const cy = H / 2;
    const radius = 100 + Math.sin(e.spiralA * 0.5) * 80;
    e.x = cx + Math.cos(e.spiralA) * radius;
    e.y = cy + Math.sin(e.spiralA) * radius;

    e.shootT -= dt;
    if (e.shootT <= 0) {
      e.shootT = e.phase === 1 ? 1.2 : 0.7;
      const bulletCount = e.phase === 1 ? 3 : 5;
      for (let i = 0; i < bulletCount; i++) {
        const a = e.spiralA + (i / bulletCount) * Math.PI * 2;
        this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, a, 180, 14);
      }
    }
  }

  /**
   * Boss 3 AI - random chase and spawns scouts
   */
  updateBoss3(e, dt, player, wave) {
    if (e.hp < e.maxHp * 0.5 && e.phase === 1) {
      e.phase = 2;
      e.shootT = 0.6;
    }

    e.chaseT -= dt;
    if (e.chaseT <= 0) {
      e.chaseT = rand(1.5, 3.5);
      e.targetX = rand(100, W - 100);
      e.targetY = rand(100, H - 100);
    }

    if (e.targetX && e.targetY) {
      const dx = e.targetX - e.x;
      const dy = e.targetY - e.y;
      const [nx, ny] = norm(dx, dy);
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    }

    e.shootT -= dt;
    if (e.shootT <= 0) {
      e.shootT = e.phase === 1 ? 1.0 : 0.6;
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, ang, 250, 15);
    }

    if (e.phase === 2) {
      e.spawnT -= dt;
      if (e.spawnT <= 0) {
        e.spawnT = 8.0;
        for (let i = 0; i < 3; i++) {
          this.spawn('scout', wave);
        }
      }
    }
  }

  /**
   * Mini-boss AI - pulsing orbit and shooting
   */
  updateMiniBoss(e, dt, player) {
    e.pulseT += dt * 2;
    e.orbitA += dt * 1.2;
    const cx = W / 2;
    const cy = H / 2;
    const radius = 120 + Math.sin(e.pulseT) * 40;
    const targetX = cx + Math.cos(e.orbitA) * radius;
    const targetY = cy + Math.sin(e.orbitA) * radius;
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const [nx, ny] = norm(dx, dy);
    e.x += nx * e.speed * dt;
    e.y += ny * e.speed * dt;

    e.shootT -= dt;
    if (e.shootT <= 0) {
      e.shootT = 1.8;
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      if (Math.random() < 0.5) {
        this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, ang, 220, 12);
      } else {
        for (let i = -1; i <= 1; i++) {
          this.scene.weaponSystem.spawnEnemyBullet(e.x, e.y, ang + i * 0.3, 220, 12);
        }
      }
    }
  }

  /**
   * Check collision with player and apply damage
   * @param {object} player - Player object
   * @returns {number} - Total damage dealt
   */
  checkPlayerCollision(player) {
    let totalDamage = 0;

    for (const e of this.enemies) {
      if (!e.alive) continue;

      const d = dist(e.x, e.y, player.x, player.y);
      if (d < e.size + 18) {
        let dmg = 10;
        if (e.type === 'tank') dmg = 12;
        if (e.type === 'scout') dmg = 6;
        if (e.type === 'swarm') dmg = 8;
        if (e.type === 'healer' || e.type === 'bomber') dmg = 8;
        if (e.type === 'spawner' || e.type === 'teleporter') dmg = 10;
        if (e.type === 'artillery') dmg = 8;
        if (e.type === 'boss' || e.type === 'boss2' || e.type === 'boss3') dmg = 15;
        if (e.type === 'miniboss') dmg = 12;

        totalDamage += dmg;
      }
    }

    return totalDamage;
  }

  /**
   * Draw an enemy with its unique shape
   * @param {Phaser.GameObjects.Graphics} g - Graphics object
   * @param {object} e - Enemy object
   * @param {number} x - X position (with shake)
   * @param {number} y - Y position (with shake)
   * @param {number} t - Current time
   */
  drawEnemy(g, e, x, y, t) {
    const hpPct = e.hp / e.maxHp;
    const flashColor = e.hitFlash > 0 ? 0xffffff : e.color;
    const flashAlpha = e.hitFlash > 0 ? 1.0 : 0.75;

    switch (e.type) {
      case 'drone':
        this.drawDrone(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'scout':
        this.drawScout(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'tank':
        this.drawTank(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'shieldE':
        this.drawShieldEnemy(g, e, x, y, flashColor, flashAlpha, t);
        break;
      case 'swarm':
        this.drawSwarm(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'sniper':
        this.drawSniper(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'healer':
        this.drawHealer(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'spawner':
        this.drawSpawner(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'bomber':
        this.drawBomber(g, e, x, y, flashColor, flashAlpha, t);
        break;
      case 'teleporter':
        this.drawTeleporter(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'kamikaze':
        this.drawKamikaze(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'artillery':
        this.drawArtillery(g, e, x, y, flashColor, flashAlpha);
        break;
      case 'boss':
        this.drawBoss1(g, e, x, y, flashColor, flashAlpha, hpPct, t);
        break;
      case 'boss2':
        this.drawBoss2(g, e, x, y, flashColor, flashAlpha, hpPct, t);
        break;
      case 'boss3':
        this.drawBoss3(g, e, x, y, flashColor, flashAlpha, hpPct, t);
        break;
      case 'miniboss':
        this.drawMiniBoss(g, e, x, y, flashColor, flashAlpha, hpPct, t);
        break;
    }
  }

  // ============================================================
  // ENEMY DRAWING FUNCTIONS
  // ============================================================

  drawDrone(g, e, x, y, color, alpha) {
    // Triangle with rotating ring
    g.fillStyle(color, alpha);
    g.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * e.size;
      const py = y + Math.sin(a) * e.size;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.lineStyle(2, e.glow, 0.8);
    g.strokePath();

    // Rotating ring
    g.lineStyle(1.5, e.glow, 0.6);
    g.beginPath();
    g.arc(x, y, e.size * 1.3, e.rotAngle, e.rotAngle + Math.PI);
    g.strokePath();
  }

  drawScout(g, e, x, y, color, alpha) {
    // Elongated diamond/dart
    const length = e.size * 1.8;
    const width = e.size * 0.7;
    
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(x + length, y);
    g.lineTo(x, y - width);
    g.lineTo(x - length * 0.5, y);
    g.lineTo(x, y + width);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.5, e.glow, 0.9);
    g.strokePath();

    // Thruster flames
    if (Math.sin(e.thrusterT) > 0) {
      g.fillStyle(0xff6600, 0.7);
      g.beginPath();
      g.moveTo(x - length * 0.5, y);
      g.lineTo(x - length * 0.8, y - width * 0.3);
      g.lineTo(x - length * 0.8, y + width * 0.3);
      g.closePath();
      g.fillPath();
    }
  }

  drawTank(g, e, x, y, color, alpha) {
    // Hexagon with armor plates
    g.fillStyle(0x0a0a2a, alpha);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineTo(x + Math.cos(a) * e.size, y + Math.sin(a) * e.size);
    }
    g.closePath();
    g.fillPath();
    
    g.lineStyle(2.5, color, 0.85);
    g.strokePath();

    // Inner hexagon
    g.fillStyle(color, 0.35);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      g.lineTo(x + Math.cos(a) * e.size * 0.5, y + Math.sin(a) * e.size * 0.5);
    }
    g.closePath();
    g.fillPath();

    // Armor plates on corners
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillStyle(e.glow, 0.7);
      g.fillRect(
        x + Math.cos(a) * e.size * 0.9 - 2,
        y + Math.sin(a) * e.size * 0.9 - 2,
        4, 4
      );
    }
  }

  drawShieldEnemy(g, e, x, y, color, alpha, t) {
    // Circle with rotating shield arcs
    g.fillStyle(color, alpha * 0.7);
    g.beginPath();
    g.arc(x, y, e.size, 0, Math.PI * 2);
    g.fillPath();
    g.lineStyle(2, e.glow, 0.75);
    g.strokePath();

    // Rotating shield arcs
    const sa = e.shieldA || 0;
    const arc = Math.PI * 0.7;
    g.lineStyle(3, 0x33ccff, 0.6 + Math.sin(t * 4) * 0.2);
    g.beginPath();
    g.arc(x, y, e.size + 6, sa, sa + arc);
    g.strokePath();
    g.beginPath();
    g.arc(x, y, e.size + 6, sa + Math.PI, sa + Math.PI + arc);
    g.strokePath();
  }

  drawSwarm(g, e, x, y, color, alpha) {
    // Main body
    g.fillStyle(color, alpha * 0.6);
    g.beginPath();
    g.arc(x, y, e.size * 0.7, 0, Math.PI * 2);
    g.fillPath();

    // Orbiting triangles
    for (let i = 0; i < 3; i++) {
      const a = e.orbitA + (i / 3) * Math.PI * 2;
      const ox = x + Math.cos(a) * e.size;
      const oy = y + Math.sin(a) * e.size;
      
      g.fillStyle(color, alpha);
      g.beginPath();
      for (let j = 0; j < 3; j++) {
        const ta = a + (j / 3) * Math.PI * 2;
        const px = ox + Math.cos(ta) * e.size * 0.3;
        const py = oy + Math.sin(ta) * e.size * 0.3;
        if (j === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
    }

    g.lineStyle(2, e.glow, 0.8);
    g.strokeCircle(x, y, e.size * 0.7);
  }

  drawSniper(g, e, x, y, color, alpha) {
    // Long narrow rectangle with scope line
    const length = e.size * 2.2;
    const width = e.size * 0.5;
    
    g.fillStyle(color, alpha);
    g.fillRect(x - length / 2, y - width / 2, length, width);
    g.lineStyle(2, e.glow, 0.8);
    g.strokeRect(x - length / 2, y - width / 2, length, width);

    // Scope line extending forward
    if (e.charging) {
      g.lineStyle(1, 0xff0000, 0.5);
      g.beginPath();
      g.moveTo(x + length / 2, y);
      g.lineTo(x + length * 3, y);
      g.strokePath();
    }

    // Lens/eye
    g.fillStyle(e.charging ? 0xff0000 : 0x00ffff, 0.9);
    g.fillCircle(x, y, width * 0.6);
  }

  drawHealer(g, e, x, y, color, alpha) {
    // Cross/plus shape with pulsing center
    const pulseScale = 1 + Math.sin(e.pulseT) * 0.15;
    const size = e.size * pulseScale;
    
    g.fillStyle(color, alpha * 0.8);
    g.beginPath();
    g.arc(x, y, size, 0, Math.PI * 2);
    g.fillPath();
    g.lineStyle(2, e.glow, 0.7);
    g.strokePath();

    // Cross symbol
    const crossSize = size * 0.6;
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(x - crossSize, y - crossSize * 0.25, crossSize * 2, crossSize * 0.5);
    g.fillRect(x - crossSize * 0.25, y - crossSize, crossSize * 0.5, crossSize * 2);

    // Healing aura
    if (e.healT < 0.3) {
      const auraAlpha = 1 - (e.healT / 0.3);
      g.lineStyle(2, 0x00ff88, auraAlpha * 0.5);
      g.strokeCircle(x, y, size * (1 + auraAlpha * 0.5));
    }
  }

  drawSpawner(g, e, x, y, color, alpha) {
    // Star/pentagon with rotating angle
    const points = 5;
    g.fillStyle(color, alpha);
    g.beginPath();
    for (let i = 0; i < points; i++) {
      const a = e.rotAngle + (i / points) * Math.PI * 2;
      const radius = i % 2 === 0 ? e.size : e.size * 0.5;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.lineStyle(2, e.glow, 0.8);
    g.strokePath();

    // Spawn ports at each point
    for (let i = 0; i < points; i++) {
      if (i % 2 === 0) {
        const a = e.rotAngle + (i / points) * Math.PI * 2;
        const px = x + Math.cos(a) * e.size;
        const py = y + Math.sin(a) * e.size;
        g.fillStyle(e.glow, 0.8);
        g.fillCircle(px, py, 3);
      }
    }
  }

  drawBomber(g, e, x, y, color, alpha, t) {
    // Circle with jagged/spiky outer ring
    const pulseSize = e.size * (1 + Math.sin(e.pulseT) * 0.2);
    
    g.fillStyle(color, alpha * 0.85);
    g.beginPath();
    g.arc(x, y, pulseSize, 0, Math.PI * 2);
    g.fillPath();
    
    // Jagged outer ring
    const spikes = 8;
    g.lineStyle(2, 0xff0000, 0.6 + Math.sin(t * 6) * 0.3);
    g.beginPath();
    for (let i = 0; i <= spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const radius = i % 2 === 0 ? pulseSize * 1.3 : pulseSize * 1.1;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();

    // Warning fuse
    g.fillStyle(0xff0000, 0.9);
    g.fillRect(x - 1.5, y - pulseSize * 0.6, 3, pulseSize * 0.4);
    g.fillCircle(x, y - pulseSize * 0.7, 3);
  }

  drawTeleporter(g, e, x, y, color, alpha) {
    // Fragmented diamond with flickering edges
    const flicker = Math.sin(e.flickerT) * 0.3 + 0.7;
    
    g.fillStyle(color, alpha * flicker * 0.8);
    g.beginPath();
    g.moveTo(x, y - e.size);
    g.lineTo(x + e.size * 0.7, y);
    g.lineTo(x, y + e.size);
    g.lineTo(x - e.size * 0.7, y);
    g.closePath();
    g.fillPath();

    // Flickering outline segments
    const segments = 4;
    for (let i = 0; i < segments; i++) {
      if (Math.sin(e.flickerT + i) > 0) {
        g.lineStyle(2, e.glow, flicker * 0.9);
        g.beginPath();
        if (i === 0) { g.moveTo(x, y - e.size); g.lineTo(x + e.size * 0.7, y); }
        if (i === 1) { g.moveTo(x + e.size * 0.7, y); g.lineTo(x, y + e.size); }
        if (i === 2) { g.moveTo(x, y + e.size); g.lineTo(x - e.size * 0.7, y); }
        if (i === 3) { g.moveTo(x - e.size * 0.7, y); g.lineTo(x, y - e.size); }
        g.strokePath();
      }
    }

    // Core
    g.fillStyle(0xff00ff, flicker);
    g.fillCircle(x, y, e.size * 0.4);
  }

  drawKamikaze(g, e, x, y, color, alpha) {
    // Pointed arrow/chevron shape
    const length = e.size * 1.5;
    const width = e.size * 0.8;
    
    g.fillStyle(color, alpha * 0.9);
    g.beginPath();
    g.moveTo(x + length, y);
    g.lineTo(x - length * 0.3, y - width);
    g.lineTo(x - length * 0.3, y + width);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, e.glow, 0.9);
    g.strokePath();

    // Thruster flames (more intense when charging)
    const thrusterIntensity = e.charging ? 1.0 : 0.6;
    if (Math.sin(e.thrusterT) > -0.3) {
      g.fillStyle(0xff6600, thrusterIntensity * 0.8);
      g.beginPath();
      g.moveTo(x - length * 0.3, y);
      g.lineTo(x - length * 0.9, y - width * 0.5);
      g.lineTo(x - length * 0.9, y + width * 0.5);
      g.closePath();
      g.fillPath();

      g.fillStyle(0xffff00, thrusterIntensity);
      g.beginPath();
      g.moveTo(x - length * 0.3, y);
      g.lineTo(x - length * 0.7, y - width * 0.3);
      g.lineTo(x - length * 0.7, y + width * 0.3);
      g.closePath();
      g.fillPath();
    }
  }

  drawArtillery(g, e, x, y, color, alpha) {
    // Square base with rotating turret
    g.fillStyle(color, alpha * 0.8);
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = e.rotAngle + (i / 4) * Math.PI * 2;
      g.lineTo(x + Math.cos(a) * e.size, y + Math.sin(a) * e.size);
    }
    g.closePath();
    g.fillPath();
    g.lineStyle(2, e.glow, 0.75);
    g.strokePath();

    // Turret barrel
    const barrelLength = e.size * 1.2;
    const barrelWidth = e.size * 0.3;
    g.fillStyle(e.glow, 0.9);
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(e.turretAngle);
    g.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
    g.restore();

    // Center mount
    g.fillStyle(0x0a0a2a, 1);
    g.fillCircle(x, y, e.size * 0.5);
    g.lineStyle(2, color, 0.8);
    g.strokeCircle(x, y, e.size * 0.5);
  }

  drawBoss1(g, e, x, y, color, alpha, hpPct, t) {
    // Multi-layered compound shape with core + rotating outer rings
    
    // Outer rotating ring
    g.lineStyle(4, e.glow, 0.7);
    g.beginPath();
    g.arc(x, y, e.size * 1.2, e.ringRotAngle, e.ringRotAngle + Math.PI * 1.5);
    g.strokePath();

    // Main body - hexagon
    g.fillStyle(color, alpha);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = e.rotAngle + (i / 6) * Math.PI * 2;
      g.lineTo(x + Math.cos(a) * e.size, y + Math.sin(a) * e.size);
    }
    g.closePath();
    g.fillPath();
    g.lineStyle(3, e.glow, 0.9);
    g.strokePath();

    // Inner core
    g.fillStyle(0xff0066, 0.8);
    g.fillCircle(x, y, e.size * 0.5);
    g.lineStyle(2, 0xffffff, 0.4 + Math.sin(t * 3) * 0.2);
    g.strokeCircle(x, y, e.size * 0.4);

    // Detail elements at points
    for (let i = 0; i < 6; i++) {
      const a = e.rotAngle + (i / 6) * Math.PI * 2;
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(
        x + Math.cos(a) * e.size * 0.9,
        y + Math.sin(a) * e.size * 0.9,
        4
      );
    }

    // Boss HP bar
    this.drawBossHPBar(g, e, x, y, hpPct);
  }

  drawBoss2(g, e, x, y, color, alpha, hpPct, t) {
    // Core with rotating blades
    
    // Rotating blades
    for (let i = 0; i < 4; i++) {
      const a = e.bladeAngle + (i / 4) * Math.PI * 2;
      g.lineStyle(5, e.glow, 0.8);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * e.size * 1.4, y + Math.sin(a) * e.size * 1.4);
      g.strokePath();
    }

    // Main circular body
    g.fillStyle(color, alpha);
    g.beginPath();
    g.arc(x, y, e.size, 0, Math.PI * 2);
    g.fillPath();
    g.lineStyle(3, e.glow, 0.9);
    g.strokePath();

    // Pulsing inner rings
    const pulseSize = 1 + Math.sin(t * 3) * 0.1;
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(x, y, e.size * 0.7 * pulseSize);
    g.strokeCircle(x, y, e.size * 0.4 * pulseSize);

    // Boss HP bar
    this.drawBossHPBar(g, e, x, y, hpPct);
  }

  drawBoss3(g, e, x, y, color, alpha, hpPct, t) {
    // Pulsing core with energy corona
    
    // Energy corona
    const coronaSize = e.size * (1.4 + Math.sin(e.pulseT) * 0.2);
    g.lineStyle(3, e.glow, 0.5);
    g.strokeCircle(x, y, coronaSize);

    // Main octagon body
    g.fillStyle(color, alpha);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = e.rotAngle + (i / 8) * Math.PI * 2;
      g.lineTo(x + Math.cos(a) * e.size, y + Math.sin(a) * e.size);
    }
    g.closePath();
    g.fillPath();
    g.lineStyle(3, e.glow, 0.9);
    g.strokePath();

    // Pulsing core
    const coreSize = e.size * 0.5 * (1 + Math.sin(e.pulseT) * 0.15);
    g.fillStyle(0xff8800, 0.9);
    g.fillCircle(x, y, coreSize);

    // Detail rings
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeCircle(x, y, e.size * 0.7);

    // Boss HP bar
    this.drawBossHPBar(g, e, x, y, hpPct);
  }

  drawMiniBoss(g, e, x, y, color, alpha, hpPct, t) {
    // Rotating diamond with pulsing core
    
    const pulseScale = 1 + Math.sin(e.pulseT) * 0.1;
    
    // Outer diamond
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(x, y - e.size * pulseScale);
    g.lineTo(x + e.size * 0.8 * pulseScale, y);
    g.lineTo(x, y + e.size * pulseScale);
    g.lineTo(x - e.size * 0.8 * pulseScale, y);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, e.glow, 0.9);
    g.strokePath();

    // Inner rotating diamond
    g.fillStyle(0xff44ff, 0.7);
    g.beginPath();
    const innerSize = e.size * 0.5;
    g.moveTo(x, y - innerSize);
    g.lineTo(x + innerSize * 0.8, y);
    g.lineTo(x, y + innerSize);
    g.lineTo(x - innerSize * 0.8, y);
    g.closePath();
    g.fillPath();

    // Pulsing center
    g.fillStyle(0xffffff, pulseScale * 0.8);
    g.fillCircle(x, y, e.size * 0.2);

    // Boss HP bar (mini version)
    this.drawBossHPBar(g, e, x, y, hpPct);
  }

  drawBossHPBar(g, e, x, y, hpPct) {
    const barW = e.size * 2.2;
    const barH = 6;
    const barY = y + e.size + 18;
    
    g.fillStyle(0x220000, 0.7);
    g.fillRect(x - barW / 2, barY, barW, barH);
    g.fillStyle(0xff0000, 0.9);
    g.fillRect(x - barW / 2, barY, barW * hpPct, barH);
  }
}
