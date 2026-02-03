/**
 * ENEMY SYSTEM
 * Handles enemy spawning, AI behavior, and different enemy types.
 *
 * For a young learner: This is where you can change enemy stats,
 * create new enemy types, and modify how enemies behave!
 */

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
        enemy.hp = 30 + wave * 8;
        enemy.maxHp = enemy.hp;
        enemy.speed = 90 + wave * 3;
        enemy.size = 14;
        enemy.color = 0x44aaff;
        enemy.glow = 0x6688cc;
        enemy.pts = 10 + wave * 2;
        break;

      case 'scout':
        enemy.hp = 18 + wave * 4;
        enemy.maxHp = enemy.hp;
        enemy.speed = 155 + wave * 4;
        enemy.size = 9;
        enemy.color = 0x88ff44;
        enemy.glow = 0x66cc44;
        enemy.pts = 15 + wave * 2;
        break;

      case 'tank':
        enemy.hp = 120 + wave * 22;
        enemy.maxHp = enemy.hp;
        enemy.speed = 52 + wave;
        enemy.size = 26;
        enemy.color = 0xff4444;
        enemy.glow = 0xcc4444;
        enemy.pts = 35 + wave * 3;
        break;

      case 'shieldE':
        enemy.hp = 55 + wave * 10;
        enemy.maxHp = enemy.hp;
        enemy.speed = 48 + wave;
        enemy.size = 20;
        enemy.color = 0xffaa00;
        enemy.glow = 0xcc8800;
        enemy.pts = 25 + wave * 2;
        enemy.shieldA = 0;
        break;

      case 'swarm':
        enemy.hp = 70 + wave * 12;
        enemy.maxHp = enemy.hp;
        enemy.speed = 75 + wave * 3;
        enemy.size = 18;
        enemy.color = 0xff88ff;
        enemy.glow = 0xcc66cc;
        enemy.pts = 28 + wave * 3;
        break;

      case 'sniper':
        enemy.hp = 40 + wave * 7;
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
        enemy.hp = 50 + wave * 8;
        enemy.maxHp = enemy.hp;
        enemy.speed = 60 + wave * 2;
        enemy.size = 16;
        enemy.color = 0x00ff88;
        enemy.glow = 0x00cc66;
        enemy.pts = 40 + wave * 4;
        enemy.healT = 2.0;
        break;

      case 'spawner':
        enemy.hp = 80 + wave * 15;
        enemy.maxHp = enemy.hp;
        enemy.speed = 55 + wave;
        enemy.size = 22;
        enemy.color = 0xffff00;
        enemy.glow = 0xcccc00;
        enemy.pts = 50 + wave * 5;
        enemy.spawnT = 4.0;
        enemy.spawnCount = 0;
        break;

      case 'bomber':
        enemy.hp = 35 + wave * 6;
        enemy.maxHp = enemy.hp;
        enemy.speed = 85 + wave * 3;
        enemy.size = 13;
        enemy.color = 0xff6600;
        enemy.glow = 0xcc5500;
        enemy.pts = 35 + wave * 3;
        enemy.pulseT = 0;
        break;

      case 'teleporter':
        enemy.hp = 45 + wave * 7;
        enemy.maxHp = enemy.hp;
        enemy.speed = 70 + wave * 2;
        enemy.size = 14;
        enemy.color = 0xff00ff;
        enemy.glow = 0xcc00cc;
        enemy.pts = 38 + wave * 3;
        enemy.teleT = 2.5;
        break;

      case 'kamikaze':
        enemy.hp = 25 + wave * 5;
        enemy.maxHp = enemy.hp;
        enemy.speed = 100 + wave * 3;
        enemy.size = 11;
        enemy.color = 0xff2266;
        enemy.glow = 0xcc1144;
        enemy.pts = 30 + wave * 3;
        enemy.charging = false;
        enemy.chargeSpeed = 280;
        break;

      case 'artillery':
        enemy.hp = 60 + wave * 10;
        enemy.maxHp = enemy.hp;
        enemy.speed = 50 + wave;
        enemy.size = 18;
        enemy.color = 0x8844ff;
        enemy.glow = 0x6633cc;
        enemy.pts = 45 + wave * 4;
        enemy.minRange = 200;
        enemy.shootT = 1.8;
        enemy.rotAngle = 0;
        break;

      case 'boss':
        enemy.hp = 800 + wave * 180;
        enemy.maxHp = enemy.hp;
        enemy.speed = 85;
        enemy.size = 45;
        enemy.color = 0xff0066;
        enemy.glow = 0xff4488;
        enemy.pts = 500 + wave * 50;
        enemy.phase = 1;
        enemy.shootT = 1.5;
        enemy.orbitA = 0;
        enemy.chargeT = 5.0;
        break;

      case 'boss2':
        enemy.hp = 900 + wave * 200;
        enemy.maxHp = enemy.hp;
        enemy.speed = 95;
        enemy.size = 48;
        enemy.color = 0x00ff88;
        enemy.glow = 0x44ffaa;
        enemy.pts = 600 + wave * 60;
        enemy.phase = 1;
        enemy.shootT = 1.2;
        enemy.spiralA = 0;
        break;

      case 'boss3':
        enemy.hp = 750 + wave * 160;
        enemy.maxHp = enemy.hp;
        enemy.speed = 100;
        enemy.size = 42;
        enemy.color = 0xff8800;
        enemy.glow = 0xffaa44;
        enemy.pts = 550 + wave * 55;
        enemy.phase = 1;
        enemy.shootT = 1.0;
        enemy.spawnT = 8.0;
        enemy.chaseT = 0;
        break;

      case 'miniboss':
        enemy.hp = 350 + wave * 80;
        enemy.maxHp = enemy.hp;
        enemy.speed = 80;
        enemy.size = 35;
        enemy.color = 0xff44ff;
        enemy.glow = 0xff88ff;
        enemy.pts = 300 + wave * 40;
        enemy.shootT = 1.8;
        enemy.orbitA = 0;
        enemy.pulseT = 0;
        break;
    }

    this.enemies.push(enemy);
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

  // ... (continued in next part due to length)
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
        pts: 8 + wave
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
}
