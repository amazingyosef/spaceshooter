/**
 * GAME SCENE - Main gameplay
 * This scene orchestrates all the game systems and runs the main game loop.
 *
 * For a young learner: This is the "conductor" that makes all the game
 * systems work together. The actual game logic is in the gameplay/ folder!
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    currentGame = this;
    this.cameras.main.setBackgroundColor('#000000');

    // Create graphics layers
    this.gBg = this.add.graphics().setDepth(0);
    this.gVig = this.add.graphics().setDepth(1);
    this.gPk = this.add.graphics().setDepth(3);
    this.gEn = this.add.graphics().setDepth(5);
    this.gBu = this.add.graphics().setDepth(7);
    this.gPa = this.add.graphics().setDepth(9);
    this.gPl = this.add.graphics().setDepth(10);
    this.gHu = this.add.graphics().setDepth(20);
    this.gUp = this.add.graphics().setDepth(30);
    this.gSlow = this.add.graphics().setDepth(31);

    // Initialize game systems
    this.playerSystem = new PlayerSystem(this);
    this.weaponSystem = new WeaponSystem(this);
    this.enemySystem = new EnemySystem(this);
    this.upgradeSystem = new UpgradeSystem(this);
    this.effectsSystem = new EffectsSystem(this);

    // Initialize player and weapon
    this.p = this.playerSystem.init(selectedShip);
    this.w = this.weaponSystem.init(selectedShip);

    // Game state
    this.wave = 0;
    this.score = 0;
    this.gameOver = false;
    this.spawnQ = [];
    this.spawnT = 0;
    this.waveComplete = false;
    this.upgradeMode = false;
    this.upgrades = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.comboMaxTime = 1.8;
    this.slowT = 0;
    this.bossKillSlowT = 0;
    this.muzzleT = 0;
    this.bossesDefeated = 0;

    // Stats tracking
    this.stats = {
      enemiesKilled: 0,
      upgradesTaken: 0,
      peakCombo: 0,
      waveDamageTaken: 0,
      regenRate: 0,
      dashCdDur: SHIPS[selectedShip].dashCD,
      hasDashUpgrade: false,
      speedBoostT: 0
    };

    // UI Text
    this.txtScore = this.add.text(10, 10, '', {
      fontSize: '16px',
      fontFamily: '"Courier New"',
      color: '#ffffff'
    }).setDepth(25);

    this.txtWave = this.add.text(W - 10, 10, '', {
      fontSize: '16px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
    }).setOrigin(1, 0).setDepth(25);

    this.txtHp = this.add.text(10, H - 50, '', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#ff4444'
    }).setDepth(25);

    this.txtEnemies = this.add.text(W - 10, H - 30, '', {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: '#888888'
    }).setOrigin(1, 0).setDepth(25);

    this.txtCombo = this.add.text(W / 2, 40, '', {
      fontSize: '20px',
      fontFamily: '"Courier New"',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(25);

    this.txtWaveMsg = this.add.text(W / 2, H / 2 - 100, '', {
      fontSize: '36px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    this.txtUpTitle = this.add.text(W / 2, H / 2 - 120, 'CHOOSE UPGRADE', {
      fontSize: '32px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
    }).setOrigin(0.5).setDepth(35).setVisible(false);

    this.txtUpSub = this.add.text(W / 2, H / 2 - 80, 'Select one to continue', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#889999'
    }).setOrigin(0.5).setDepth(35).setVisible(false);

    this.upTexts = [];

    // Input
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.input.on('pointerdown', (pointer) => {
      if (this.upgradeMode) {
        const selected = this.upgradeSystem.handleClick(
          pointer.x,
          pointer.y,
          this.upgrades,
          this.stats
        );
        if (selected) {
          this.nextWave();
        }
      }
    });

    // Start first wave
    this.nextWave();
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Delta time management
    let dt = Math.min(delta / 1000, 0.033);
    if (this.slowT > 0) {
      this.slowT -= dt;
      dt *= 0.4;
    }
    if (this.bossKillSlowT > 0) {
      this.bossKillSlowT -= dt;
      dt *= 0.4;
    }
    const dtS = dt;

    // Muzzle flash timer
    if (this.muzzleT > 0) this.muzzleT -= dt;

    if (!this.upgradeMode) {
      // Update systems
      this.weaponSystem.updateLaser(dt, this.p, this.enemySystem.enemies);
      this.weaponSystem.updateGravityWells(dt, this.enemySystem.enemies);

      // Player movement
      this.playerSystem.updateMovement(dt, this.keys);
      this.playerSystem.updateDash(
        dt,
        this.keys.SPACE.isDown,
        this.keys,
        this.stats.dashCdDur
      );
      this.playerSystem.updateRegen(dt, this.stats.regenRate);
      this.playerSystem.updateInvuln(dt);

      // Aim at mouse
      this.playerSystem.updateAiming(
        this.input.activePointer.x,
        this.input.activePointer.y
      );

      // Fire weapon
      if (this.input.activePointer.isDown) {
        const rapidStrike = this.playerSystem.canRapidStrike();
        if (this.weaponSystem.fire(time, this.p, this.wave, rapidStrike)) {
          this.muzzleT = 0.08;
        }
      } else {
        this.weaponSystem.deactivateLaser();
      }

      // Update combo timer
      if (this.combo > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
        }
      }

      // Spawn enemies from queue
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.spawnQ.length > 0) {
        this.spawnT = 0.28;
        const type = this.spawnQ.shift();
        this.enemySystem.spawn(type, this.wave);
      }

      // Check wave complete
      if (this.spawnQ.length === 0 && this.enemySystem.enemies.length === 0 && !this.waveComplete) {
        this.waveComplete = true;
        this.time.delayedCall(1200, () => {
          this.showUpgradeScreen();
        });
      }

      // Update enemies
      this.enemySystem.update(dt, this.p, this.wave);

      // Update bullets
      this.weaponSystem.updateBullets(dtS, this.enemySystem.enemies);

      // Update enemy bullets
      const bulletDmg = this.weaponSystem.updateEnemyBullets(dt, this.p);
      if (bulletDmg > 0) {
        if (this.playerSystem.takeDamage(bulletDmg)) {
          this.die();
        }
        this.combo = 0;
        this.stats.waveDamageTaken += bulletDmg;
      }

      // Check enemy collision with player
      const enemyDmg = this.enemySystem.checkPlayerCollision(this.p);
      if (enemyDmg > 0) {
        if (this.playerSystem.takeDamage(enemyDmg)) {
          this.die();
        }
        this.combo = 0;
        this.stats.waveDamageTaken += enemyDmg;
      }

      // Update particles
      this.effectsSystem.updateParticles(dt);

      // Update pickups
      const pickupResult = this.effectsSystem.updatePickups(dt, this.p, this.stats, this.combo);
      this.score += pickupResult.score;
      if (pickupResult.slowmo > 0) {
        this.slowT = pickupResult.slowmo;
      }

      // Update speed boost timer
      if (this.stats.speedBoostT > 0) {
        this.stats.speedBoostT -= dt;
        if (this.stats.speedBoostT <= 0) {
          this.p.speed /= 1.18;
        }
      }
    }

    // Always draw
    this.draw();
  }

  nextWave() {
    // Check for no damage achievement
    if (this.wave > 0 && this.stats.waveDamageTaken === 0) {
      unlockAchievement('noDamageWave');
    }
    this.stats.waveDamageTaken = 0;

    this.wave++;
    this.waveComplete = false;

    // Wave achievements
    if (this.wave === 5) unlockAchievement('wave5');
    if (this.wave === 10) unlockAchievement('wave10');
    if (this.wave === 20) unlockAchievement('wave20');

    // Ship visual upgrades at specific waves
    const prevStage = this.p.upgradeStage;
    if (this.wave >= 15) this.p.upgradeStage = 2;
    else if (this.wave >= 10) this.p.upgradeStage = 1;
    else if (this.wave >= 5) this.p.upgradeStage = 1;
    else this.p.upgradeStage = 0;

    if (this.p.upgradeStage > prevStage) {
      const stageName = this.p.upgradeStage === 1 ? 'ENHANCED' : 'ULTIMATE';
      this.showNotif('⬆ SHIP UPGRADED: ' + stageName, '#00ffff', 2.5);
      sfx('upgrade');
      this.effectsSystem.burst(this.p.x, this.p.y, SHIPS[this.p.shipIdx].color, 30, 150);
    }

    this.isBossWave = (this.wave % 5 === 0);
    this.isMiniBossWave = (this.wave % 3 === 0 && !this.isBossWave);
    this.spawnQ = [];

    if (this.isBossWave) {
      const bossType = ['boss', 'boss2', 'boss3'][randI(0, 2)];
      this.spawnQ.push(bossType);
      this.spawnT = 0;
      sfx('bossBegin');
      this.showWaveMsg('— BOSS —', '#ff4444', 1.4);
    } else if (this.isMiniBossWave) {
      this.spawnQ.push('miniboss');
      const extras = Math.min(5 + this.wave, 20) | 0;
      for (let i = 0; i < extras; i++) {
        const r = Math.random();
        if (this.wave <= 4) this.spawnQ.push('drone');
        else if (this.wave <= 7) this.spawnQ.push(r < 0.5 ? 'drone' : 'scout');
        else this.spawnQ.push(r < 0.3 ? 'drone' : r < 0.6 ? 'scout' : 'tank');
      }
      this.spawnT = 0;
      this.showWaveMsg('⚡ MINI-BOSS ⚡', '#ffaa00', 1.2);
    } else {
      const count = Math.min(6 + this.wave * 2.5, 45) | 0;
      for (let i = 0; i < count; i++) {
        const r = Math.random();
        if (this.wave <= 2) this.spawnQ.push('drone');
        else if (this.wave <= 4) this.spawnQ.push(r < 0.6 ? 'drone' : 'scout');
        else if (this.wave <= 7) this.spawnQ.push(r < 0.30 ? 'drone' : r < 0.55 ? 'scout' : r < 0.70 ? 'tank' : r < 0.85 ? 'healer' : 'bomber');
        else if (this.wave <= 10) this.spawnQ.push(r < 0.20 ? 'drone' : r < 0.40 ? 'scout' : r < 0.55 ? 'tank' : r < 0.65 ? 'shieldE' : r < 0.75 ? 'sniper' : r < 0.85 ? 'healer' : r < 0.92 ? 'spawner' : 'teleporter');
        else this.spawnQ.push(r < 0.12 ? 'drone' : r < 0.28 ? 'scout' : r < 0.43 ? 'tank' : r < 0.55 ? 'shieldE' : r < 0.65 ? 'sniper' : r < 0.74 ? 'swarm' : r < 0.82 ? 'healer' : r < 0.88 ? 'spawner' : r < 0.93 ? 'bomber' : r < 0.96 ? 'teleporter' : r < 0.98 ? 'kamikaze' : 'artillery');
      }
      this.spawnT = 0;
      this.showWaveMsg('WAVE ' + this.wave, '#00ffff', 1.0);
    }
  }

  showWaveMsg(txt, col, dur) {
    if (this.waveMsg) this.waveMsg.destroy();
    this.waveMsg = this.add.text(W / 2, H / 2 - 80, txt, {
      fontSize: '34px',
      fontFamily: '"Courier New"',
      color: col
    }).setOrigin(0.5).setDepth(25);
    this.time.delayedCall(dur * 1000, () => {
      if (this.waveMsg) this.waveMsg.setVisible(false);
    });
  }

  showUpgradeScreen() {
    this.upgradeMode = true;
    this.upgrades = this.upgradeSystem.getPool(this.w, this.p, this.stats);
    this.txtUpTitle.setVisible(true);
    this.txtUpSub.setVisible(true);
  }

  killEnemy(e, idx) {
    // Handle bomber explosion
    if (e.type === 'bomber') {
      const explosionDmg = this.effectsSystem.explodeMega(
        e.x, e.y,
        18 + this.wave * 2,
        this.enemySystem.enemies,
        this.p,
        this.wave
      );
      if (explosionDmg > 0 && this.playerSystem.takeDamage(explosionDmg)) {
        this.die();
      }
    }

    // Track boss kills
    if (e.type === 'boss' || e.type === 'boss2' || e.type === 'boss3') {
      this.bossesDefeated++;
      if (this.bossesDefeated === 1) unlockAchievement('boss1');
    }

    // Update score and combo
    this.score += e.pts;
    this.combo++;
    this.comboTimer = this.comboMaxTime;
    if (this.combo > this.stats.peakCombo) this.stats.peakCombo = this.combo;
    if (this.combo === 10) unlockAchievement('combo10');

    // Track stats
    this.stats.enemiesKilled++;
    trackEnemyKill();

    // Visual and audio effects
    const isBoss = (e.type === 'boss' || e.type === 'boss2' || e.type === 'boss3');
    if (isBoss) {
      sfx('bossDie');
      this.bossKillSlowT = 1.2;
      this.effectsSystem.burst(e.x, e.y, e.color, 60, 220);
      this.effectsSystem.shake(25, 0.25);
      this.effectsSystem.spawnPickup(e.x, e.y, 'health');
      this.effectsSystem.spawnPickup(e.x + 30, e.y - 20, 'shield');
    } else {
      sfx('enemyDie');
      this.effectsSystem.burst(e.x, e.y, e.color, 10, 100);
    }

    // Random pickup drop
    if (Math.random() < 0.22 && !isBoss) {
      this.effectsSystem.spawnPickup(e.x, e.y);
    }

    // Remove enemy
    this.enemySystem.enemies.splice(idx, 1);
  }

  showNotif(txt, col = '#00ffff', dur = 1.2) {
    if (!this.notifText) {
      this.notifText = this.add.text(W / 2, 90, '', {
        fontSize: '18px',
        fontFamily: '"Courier New"',
        color: col
      }).setOrigin(0.5).setDepth(23);
    }
    this.notifText.setText(txt).setColor(col).setAlpha(1);
    this.notifTimer = dur;
  }

  die() {
    this.gameOver = true;
    sfx('playerDie');
    this.effectsSystem.shake(20, 0.30);
    lastScore = this.score;
    lastWave = this.wave;
    lastStats = { ...this.stats };
    if (this.score > highScore) {
      highScore = this.score;
    }
    savePersistent();
    this.time.delayedCall(2500, () => {
      this.scene.start('GameOver');
    });
  }

  // Wrapper methods for systems to call
  spawnGravityWell(x, y) {
    this.weaponSystem.spawnGravityWell(x, y);
  }

  burst(x, y, color, count, speed) {
    this.effectsSystem.burst(x, y, color, count, speed);
  }

  shake(amt, dur) {
    this.effectsSystem.shake(amt, dur);
  }

  explodeMega(x, y, dmg) {
    const damage = this.effectsSystem.explodeMega(
      x, y, dmg,
      this.enemySystem.enemies,
      this.p,
      this.wave
    );
    if (damage > 0 && this.playerSystem.takeDamage(damage)) {
      this.die();
    }
  }

  draw() {
    const t = this.time.now / 1000;

    // Clear all graphics
    this.gBg.clear();
    this.gVig.clear();
    this.gPk.clear();
    this.gEn.clear();
    this.gBu.clear();
    this.gPa.clear();
    this.gPl.clear();
    this.gHu.clear();
    this.gSlow.clear();
    if (this.gUp) this.gUp.clear();

    // Apply camera shake
    let shakeOffset = 0;
    if (this.effectsSystem.shakeT > 0) {
      shakeOffset = rand(-this.effectsSystem.shakeAmt, this.effectsSystem.shakeAmt);
    }

    // Draw grid background
    const gridAlpha = (this.slowT > 0 || this.bossKillSlowT > 0) ? 0.35 : 0.15;
    this.gBg.lineStyle(1, 0x00ffff, gridAlpha);
    for (let x = 0; x <= W; x += 40) {
      this.gBg.moveTo(x + shakeOffset, 0);
      this.gBg.lineTo(x + shakeOffset, H);
    }
    for (let y = 0; y <= H; y += 40) {
      this.gBg.moveTo(0, y + shakeOffset);
      this.gBg.lineTo(W, y + shakeOffset);
    }
    this.gBg.strokePath();

    // Draw vignette
    this.gVig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.0, 0.0, 0.6, 0.6);
    this.gVig.fillRect(0, 0, W, 80);
    this.gVig.fillRect(0, H - 80, W, 80);
    this.gVig.fillRect(0, 0, 80, H);
    this.gVig.fillRect(W - 80, 0, 80, H);

    // Draw gravity wells
    for (const gw of this.weaponSystem.gravityWells) {
      const alpha = gw.life / gw.maxLife;
      this.gPk.lineStyle(2, 0xaa44ff, alpha * 0.6);
      this.gPk.strokeCircle(gw.x, gw.y, gw.radius);
      this.gPk.fillStyle(0xaa44ff, alpha * 0.15);
      this.gPk.fillCircle(gw.x, gw.y, gw.radius);
    }

    // Draw pickups
    for (const p of this.effectsSystem.pickups) {
      const s = 12;
      const a = p.a || 0;
      let col;
      switch (p.type) {
        case 'health': col = 0xff4444; break;
        case 'shield': col = 0x4444ff; break;
        case 'speed': col = 0xffff44; break;
        case 'slowmo': col = 0xcc88ff; break;
        default: col = 0x44ff44; break;
      }
      this.gPk.fillStyle(col, 0.85);
      this.gPk.lineStyle(2, col, 0.9);
      this.gPk.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = a + (i / 4) * Math.PI * 2;
        this.gPk.lineTo(p.x + Math.cos(ang) * s, p.y + Math.sin(ang) * s);
      }
      this.gPk.closePath();
      this.gPk.fillPath();
      this.gPk.strokePath();
    }

    // Draw enemies
    for (const e of this.enemySystem.enemies) {
      const hpPct = e.hp / e.maxHp;

      // Boss types
      if (e.type === 'boss' || e.type === 'boss2' || e.type === 'boss3' || e.type === 'miniboss') {
        this.gEn.fillStyle(e.color, 0.75);
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(3, e.glow, 0.9);
        this.gEn.strokePath();
        this.gEn.lineStyle(2, 0xffffff, 0.4 + Math.sin(t * 3) * 0.2);
        this.gEn.strokeCircle(e.x, e.y, e.size - 4);

        // Boss HP bar
        const barW = e.size * 2.2;
        const barH = 6;
        const barY = e.y + e.size + 18;
        this.gEn.fillStyle(0x220000, 0.7);
        this.gEn.fillRect(e.x - barW / 2, barY, barW, barH);
        this.gEn.fillStyle(0xff0000, 0.9);
        this.gEn.fillRect(e.x - barW / 2, barY, barW * hpPct, barH);
      }
      // Special enemy types
      else if (e.type === 'healer') {
        this.gEn.fillStyle(e.color, 0.8);
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.7);
        this.gEn.strokePath();
        this.gEn.fillStyle(0xffffff, 0.9);
        this.gEn.fillRect(e.x - 6, e.y - 2, 12, 4);
        this.gEn.fillRect(e.x - 2, e.y - 6, 4, 12);
      }
      else if (e.type === 'spawner') {
        this.gEn.fillStyle(e.color, 0.75);
        this.gEn.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + t;
          this.gEn.lineTo(e.x + Math.cos(a) * e.size, e.y + Math.sin(a) * e.size);
        }
        this.gEn.closePath();
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.8);
        this.gEn.strokePath();
      }
      else if (e.type === 'bomber') {
        this.gEn.fillStyle(e.color, 0.85);
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, 0xff0000, 0.6 + Math.sin(t * 6) * 0.3);
        this.gEn.strokePath();
        this.gEn.fillStyle(0xff0000, 0.9);
        this.gEn.fillRect(e.x - 1.5, e.y - 6, 3, 10);
        this.gEn.fillRect(e.x - 1.5, e.y + 4, 3, 3);
      }
      else if (e.type === 'teleporter') {
        const fade = Math.sin(t * 4) * 0.3 + 0.7;
        this.gEn.fillStyle(e.color, fade * 0.8);
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, fade * 0.9);
        this.gEn.strokePath();
      }
      else if (e.type === 'kamikaze') {
        const a = e.angle;
        this.gEn.fillStyle(e.color, 0.9);
        this.gEn.beginPath();
        this.gEn.moveTo(e.x + Math.cos(a) * e.size * 1.5, e.y + Math.sin(a) * e.size * 1.5);
        this.gEn.lineTo(e.x + Math.cos(a + 2.0) * e.size * 0.6, e.y + Math.sin(a + 2.0) * e.size * 0.6);
        this.gEn.lineTo(e.x + Math.cos(a - 2.0) * e.size * 0.6, e.y + Math.sin(a - 2.0) * e.size * 0.6);
        this.gEn.closePath();
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.9);
        this.gEn.strokePath();
      }
      else if (e.type === 'artillery') {
        this.gEn.fillStyle(e.color, 0.8);
        this.gEn.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + t * 0.5;
          this.gEn.lineTo(e.x + Math.cos(a) * e.size, e.y + Math.sin(a) * e.size);
        }
        this.gEn.closePath();
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.75);
        this.gEn.strokePath();
      }
      else if (e.type === 'shieldE') {
        this.gEn.fillStyle(e.color, 0.7);
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.75);
        this.gEn.strokePath();
        this.gEn.lineStyle(3, 0x33ccff, 0.6 + Math.sin(t * 4) * 0.2);
        this.gEn.beginPath();
        const sa = e.shieldA || 0;
        const arc = Math.PI * 0.7;
        this.gEn.arc(e.x, e.y, e.size + 6, sa, sa + arc);
        this.gEn.strokePath();
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size + 6, sa + Math.PI, sa + Math.PI + arc);
        this.gEn.strokePath();
      }
      else {
        // Standard enemy
        this.gEn.fillStyle(e.color, 0.75);
        this.gEn.beginPath();
        this.gEn.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.8);
        this.gEn.strokePath();
      }
    }

    // Draw sniper warnings
    for (const sw of this.enemySystem.sniperWarnings) {
      const a = 1.0 - sw.t / 0.6;
      this.gEn.lineStyle(2, 0xff0000, a * 0.8);
      this.gEn.strokeCircle(sw.x, sw.y, 30 + a * 20);
    }

    // Draw bullets
    for (const b of this.weaponSystem.bullets) {
      if (b.mega) {
        this.gBu.fillStyle(0xffaa00, 0.85);
        this.gBu.beginPath();
        this.gBu.arc(b.x, b.y, 10, 0, Math.PI * 2);
        this.gBu.fillPath();
        this.gBu.lineStyle(2, 0xffff00, 0.9);
        this.gBu.strokePath();
      } else {
        const size = 6 * b.size;
        const bulletColor = b.homing ? 0xaa44ff : b.pierce ? 0xff44aa : 0x00ffff;
        this.gBu.fillStyle(bulletColor, 0.85);
        this.gBu.beginPath();
        this.gBu.arc(b.x, b.y, size, 0, Math.PI * 2);
        this.gBu.fillPath();
        if (b.trail && b.trail.length > 1) {
          this.gBu.lineStyle(size * 0.8, bulletColor, 0.3);
          this.gBu.beginPath();
          this.gBu.moveTo(b.trail[0].x, b.trail[0].y);
          for (const tr of b.trail) this.gBu.lineTo(tr.x, tr.y);
          this.gBu.strokePath();
        }
      }
    }

    // Draw enemy bullets
    for (const eb of this.weaponSystem.enemyBullets) {
      this.gBu.fillStyle(0xff3333, 0.85);
      this.gBu.beginPath();
      this.gBu.arc(eb.x, eb.y, 5, 0, Math.PI * 2);
      this.gBu.fillPath();
      this.gBu.lineStyle(1, 0xff6666, 0.7);
      this.gBu.strokePath();
    }

    // Draw laser beam
    if (this.weaponSystem.laserActive && this.weaponSystem.laserCharge >= 0.1) {
      const range = 600;
      const x2 = this.p.x + Math.cos(this.p.angle) * range;
      const y2 = this.p.y + Math.sin(this.p.angle) * range;

      this.gBu.lineStyle(8, 0xff0088, 0.3);
      this.gBu.beginPath();
      this.gBu.moveTo(this.p.x, this.p.y);
      this.gBu.lineTo(x2, y2);
      this.gBu.strokePath();

      this.gBu.lineStyle(3, 0xff44ff, 0.9);
      this.gBu.beginPath();
      this.gBu.moveTo(this.p.x, this.p.y);
      this.gBu.lineTo(x2, y2);
      this.gBu.strokePath();
    }

    // Draw particles
    for (const p of this.effectsSystem.particles) {
      const a = Math.min(1, p.life * 3);
      this.gPa.fillStyle(p.color, a * 0.8);
      this.gPa.fillCircle(p.x, p.y, p.size);
    }

    // Draw player
    const flash = (this.p.invuln > 0 && Math.floor(t * 20) % 2 === 0);
    if (!flash) {
      drawShipInGame(this.gPl, SHIPS[this.p.shipIdx].name, this.p.x, this.p.y, this.p.angle, SHIPS[this.p.shipIdx].color, this.p.upgradeStage);

      if (this.muzzleT > 0) {
        const fa = this.p.angle;
        this.gPl.fillStyle(0xffffff, this.muzzleT / 0.08);
        this.gPl.beginPath();
        this.gPl.arc(this.p.x + Math.cos(fa) * 28, this.p.y + Math.sin(fa) * 28, 6, 0, Math.PI * 2);
        this.gPl.fillPath();
      }
    }

    // Update HUD text
    this.txtScore.setText(`SCORE: ${this.score}`);
    this.txtWave.setText(`WAVE: ${this.wave}`);

    let hpCol = '#ff4444';
    if (this.p.hp / this.p.maxHp > 0.6) hpCol = '#44ff44';
    else if (this.p.hp / this.p.maxHp > 0.3) hpCol = '#ffaa00';
    this.txtHp.setText(`HP: ${this.p.hp | 0}/${this.p.maxHp | 0}  SHIELD: ${this.p.shield | 0}`).setColor(hpCol);
    this.txtEnemies.setText(`ENEMIES: ${this.enemySystem.enemies.length}`);

    // Combo display
    if (this.combo > 1) {
      this.txtCombo.setText(`${this.combo}x COMBO`).setAlpha(Math.min(1, this.comboTimer / this.comboMaxTime));
    } else {
      this.txtCombo.setAlpha(0);
    }

    // HP bar
    const barW = 200;
    const barH = 16;
    const barX = (W - barW) / 2;
    const barY = H - 48;
    this.gHu.fillStyle(0x220000, 0.7);
    this.gHu.fillRect(barX, barY, barW, barH);
    this.gHu.fillStyle(Phaser.Display.Color.HexStringToColor(hpCol).color, 0.9);
    this.gHu.fillRect(barX, barY, barW * (this.p.hp / this.p.maxHp), barH);
    this.gHu.lineStyle(2, 0xffffff, 0.5);
    this.gHu.strokeRect(barX, barY, barW, barH);

    // Shield bar
    if (this.p.maxShield > 0) {
      const shBarY = barY - 20;
      this.gHu.fillStyle(0x000022, 0.7);
      this.gHu.fillRect(barX, shBarY, barW, 10);
      this.gHu.fillStyle(0x4444ff, 0.9);
      this.gHu.fillRect(barX, shBarY, barW * (this.p.shield / this.p.maxShield), 10);
      this.gHu.lineStyle(1, 0x6666ff, 0.6);
      this.gHu.strokeRect(barX, shBarY, barW, 10);
    }

    // Dash cooldown bar
    const cdBarW = 100;
    const cdBarH = 6;
    const cdX = 16;
    const cdY = H - 55;
    this.gHu.fillStyle(0x222222, 0.6);
    this.gHu.fillRect(cdX, cdY, cdBarW, cdBarH);
    const cdPct = Math.max(0, 1 - (this.p.dashCD / this.stats.dashCdDur));
    this.gHu.fillStyle(0x44ffcc, 0.9);
    this.gHu.fillRect(cdX, cdY, cdBarW * cdPct, cdBarH);
    this.gHu.lineStyle(1, 0x66ffee, 0.5);
    this.gHu.strokeRect(cdX, cdY, cdBarW, cdBarH);

    // Slow-mo overlay
    if (this.slowT > 0 || this.bossKillSlowT > 0) {
      this.gSlow.fillStyle(0x8844ff, 0.08);
      this.gSlow.fillRect(0, 0, W, H);
    }

    // Notification text
    if (this.notifTimer > 0) {
      this.notifTimer -= 0.016;
      if (this.notifTimer <= 0 && this.notifText) {
        this.notifText.setAlpha(0);
      }
    }

    // Upgrade screen
    if (this.upgradeMode) {
      // Draw dark overlay
      this.gUp.fillStyle(0x000000, 0.85);
      this.gUp.fillRect(0, 0, W, H);

      // Draw upgrade cards
      for (let i = 0; i < this.upgrades.length; i++) {
        const ux = 190 + i * 240;
        const uy = H / 2 + 60;

        // Card background
        this.gUp.fillStyle(0x001122, 0.9);
        this.gUp.fillRect(ux, uy, 180, 240);

        // Card border
        this.gUp.lineStyle(2, 0x00ffff, 0.7);
        this.gUp.strokeRect(ux, uy, 180, 240);

        // Hover effect
        const mx = this.input.activePointer.x;
        const my = this.input.activePointer.y;
        if (mx >= ux && mx <= ux + 180 && my >= uy && my <= uy + 240) {
          this.gUp.fillStyle(0x00ffff, 0.1);
          this.gUp.fillRect(ux, uy, 180, 240);
        }
      }
    }
  }
}
