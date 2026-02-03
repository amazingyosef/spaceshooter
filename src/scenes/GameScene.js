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
    this.upgradeAnimT = 0;
    this.bossesDefeated = 0;
    this.currentBoss = null;
    this.heartbeatTimer = 0;
    this.playerMoving = false;

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

    this.txtWeapon = this.add.text(10, H - 80, '', {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
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

    // Pause functionality
    this.isPaused = false;
    this.pauseKey = this.input.keyboard.addKey('ESC');
    this.pauseOverlay = null;
    this.pauseText = null;
    this.pauseSubText = null;

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

    // Handle pause toggle
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
    }

    if (this.isPaused) {
      this.drawPauseScreen();
      return;
    }

    // Delta time management
    const dtS = Math.min(delta / 1000, 0.033);
    let dt = dtS;
    if (this.slowT > 0) {
      this.slowT -= dt;
      dt *= 0.4;
    }
    if (this.bossKillSlowT > 0) {
      this.bossKillSlowT -= dt;
      dt *= 0.4;
    }

    // Muzzle flash timer
    if (this.muzzleT > 0) this.muzzleT -= dt;

    if (!this.upgradeMode) {
      // Update systems
      this.weaponSystem.updateLaser(dt, this.p, this.enemySystem.enemies);
      this.weaponSystem.updateGravityWells(dt, this.enemySystem.enemies);

      // Player movement
      this.playerSystem.updateMovement(dt, this.keys);
      this.playerMoving = this.keys.W.isDown || this.keys.A.isDown || this.keys.S.isDown || this.keys.D.isDown;
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
        const slowActive = this.slowT > 0 || this.bossKillSlowT > 0;
        if (this.weaponSystem.fire(time, this.p, this.wave, rapidStrike, slowActive)) {
          this.muzzleT = 0.08;
        }
      } else {
        this.weaponSystem.deactivateLaser();
      }

      // Update combo timer
      if (this.combo > 0) {
        this.comboTimer -= dtS;
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

      // Update enemy hit flash timers
      for (const e of this.enemySystem.enemies) {
        if (e.hitFlash > 0) e.hitFlash -= dt;
      }

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

      // Low health heartbeat
      if (this.p.hp < this.p.maxHp * 0.25 && !this.gameOver) {
        this.heartbeatTimer -= dt;
        if (this.heartbeatTimer <= 0) {
          sfx('heartbeat');
          this.heartbeatTimer = 0.8;
        }
      }
    }

    // Notification text timer
    if (this.notifTimer > 0) {
      this.notifTimer -= dtS;
      if (this.notifTimer <= 0 && this.notifText) {
        this.notifText.setAlpha(0);
      }
    }

    // Update upgrade screen animation
    if (this.upgradeMode && this.upgradeAnimT < 0.6) {
      this.upgradeAnimT += Math.min(delta / 1000, 0.033);

      for (let i = 0; i < this.upgrades.length; i++) {
        const cardDelay = i * 0.12;
        const cardAlpha = Math.min(1, Math.max(0, (this.upgradeAnimT - cardDelay) * 4));

        if (this.upTexts[i * 3]) this.upTexts[i * 3].setAlpha(cardAlpha);
        if (this.upTexts[i * 3 + 1]) this.upTexts[i * 3 + 1].setAlpha(cardAlpha);
        if (this.upTexts[i * 3 + 2]) this.upTexts[i * 3 + 2].setAlpha(cardAlpha * 0.7);
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
      this.currentBoss = null;
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
      color: col,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: this.waveMsg,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(dur * 1000, () => {
      if (this.waveMsg) {
        this.tweens.add({
          targets: this.waveMsg,
          alpha: 0,
          scale: 1.5,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            if (this.waveMsg) {
              this.waveMsg.destroy();
              this.waveMsg = null;
            }
          }
        });
      }
    });
  }

  showUpgradeScreen() {
    this.upgradeMode = true;
    this.upgradeAnimT = 0;
    this.upgrades = this.upgradeSystem.getPool(this.w, this.p, this.stats);

    this.txtUpTitle.setVisible(true);
    this.txtUpSub.setVisible(true);

    if (this.upTexts && this.upTexts.length > 0) {
      this.upTexts.forEach(t => { if (t && t.destroy) t.destroy(); });
    }
    this.upTexts = [];

    for (let i = 0; i < this.upgrades.length; i++) {
      const ux = 190 + i * 240;
      const uy = H / 2 + 60;

      const nameText = this.add.text(ux + 90, uy + 50, this.upgrades[i].name, {
        fontSize: '16px',
        fontFamily: '"Courier New"',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(36).setAlpha(0);

      const descText = this.add.text(ux + 90, uy + 85, this.upgrades[i].desc, {
        fontSize: '12px',
        fontFamily: '"Courier New"',
        color: '#aaccff',
        wordWrap: { width: 160, useAdvancedWrap: true },
        align: 'center'
      }).setOrigin(0.5).setDepth(36).setAlpha(0);

      const hintText = this.add.text(ux + 90, uy + 200, '[ CLICK ]', {
        fontSize: '10px',
        fontFamily: '"Courier New"',
        color: '#00ffff'
      }).setOrigin(0.5).setDepth(36).setAlpha(0);

      this.upTexts.push(nameText, descText, hintText);
    }
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
      this.currentBoss = null;
      if (this.bossesDefeated === 1) unlockAchievement('boss1');
    }
    if (e === this.currentBoss) {
      this.currentBoss = null;
    }

    // Update score with combo multiplier
    const comboMultiplier = 1 + (this.combo * 0.1);
    const pointsEarned = Math.floor(e.pts * comboMultiplier);
    this.score += pointsEarned;

    if (this.combo >= 3) {
      this.showFloatingText(e.x, e.y - 20, `+${pointsEarned}`, '#ffaa00');
    }

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
      const soundMap = {
        tank: 'enemyDieTank',
        scout: 'enemyDieScout',
        sniper: 'enemyDieSniper'
      };
      sfx(soundMap[e.type] || 'enemyDie');
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

  showFloatingText(x, y, text, color = '#ffffff') {
    const floatText = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: color,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(24);

    this.tweens.add({
      targets: floatText,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => floatText.destroy()
    });
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

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      if (!this.pauseOverlay) {
        this.pauseOverlay = this.add.graphics().setDepth(50);
      }
      if (!this.pauseText) {
        this.pauseText = this.add.text(W / 2, H / 2 - 50, 'PAUSED', {
          fontSize: '48px',
          fontFamily: '"Courier New"',
          color: '#00ffff'
        }).setOrigin(0.5).setDepth(51);

        this.pauseSubText = this.add.text(W / 2, H / 2 + 20, 'Press ESC to resume', {
          fontSize: '16px',
          fontFamily: '"Courier New"',
          color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(51);
      }
      this.pauseText.setVisible(true);
      this.pauseSubText.setVisible(true);
    } else {
      if (this.pauseText) this.pauseText.setVisible(false);
      if (this.pauseSubText) this.pauseSubText.setVisible(false);
      if (this.pauseOverlay) this.pauseOverlay.clear();
    }
  }

  drawPauseScreen() {
    if (this.pauseOverlay) {
      this.pauseOverlay.clear();
      this.pauseOverlay.fillStyle(0x000000, 0.7);
      this.pauseOverlay.fillRect(0, 0, W, H);
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
    let shakeX = 0;
    let shakeY = 0;
    if (this.effectsSystem.shakeT > 0) {
      shakeX = rand(-this.effectsSystem.shakeAmt, this.effectsSystem.shakeAmt);
      shakeY = rand(-this.effectsSystem.shakeAmt, this.effectsSystem.shakeAmt);
      this.effectsSystem.shakeT -= 0.016;
    }

    // Draw grid background
    const gridAlpha = (this.slowT > 0 || this.bossKillSlowT > 0) ? 0.35 : 0.15;
    this.gBg.lineStyle(1, 0x00ffff, gridAlpha);
    for (let x = 0; x <= W; x += 40) {
      this.gBg.moveTo(x + shakeX, 0);
      this.gBg.lineTo(x + shakeX, H);
    }
    for (let y = 0; y <= H; y += 40) {
      this.gBg.moveTo(0, y + shakeY);
      this.gBg.lineTo(W, y + shakeY);
    }
    this.gBg.strokePath();

    // Draw vignette
    this.gVig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.0, 0.0, 0.6, 0.6);
    this.gVig.fillRect(0, 0, W, 80);
    this.gVig.fillRect(0, H - 80, W, 80);
    this.gVig.fillRect(0, 0, 80, H);
    this.gVig.fillRect(W - 80, 0, 80, H);

    // Low health warning vignette
    if (this.p.hp < this.p.maxHp * 0.3) {
      const pulseAlpha = 0.15 + Math.sin(t * 6) * 0.1;
      this.gVig.fillStyle(0xff0000, pulseAlpha);
      this.gVig.fillRect(0, 0, W, 40);
      this.gVig.fillRect(0, H - 40, W, 40);
      this.gVig.fillRect(0, 0, 40, H);
      this.gVig.fillRect(W - 40, 0, 40, H);
    }

    // Draw gravity wells
    for (const gw of this.weaponSystem.gravityWells) {
      const alpha = gw.life / gw.maxLife;
      const gx = gw.x + shakeX;
      const gy = gw.y + shakeY;
      this.gPk.lineStyle(2, 0xaa44ff, alpha * 0.6);
      this.gPk.strokeCircle(gx, gy, gw.radius);
      this.gPk.fillStyle(0xaa44ff, alpha * 0.15);
      this.gPk.fillCircle(gx, gy, gw.radius);
    }

    // Draw pickups
    for (const p of this.effectsSystem.pickups) {
      const s = 12;
      const a = p.a || 0;
      const bobY = p.y + Math.sin(p.a) * 4;
      const px = p.x + shakeX;
      const py = bobY + shakeY;
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
        this.gPk.lineTo(px + Math.cos(ang) * s, py + Math.sin(ang) * s);
      }
      this.gPk.closePath();
      this.gPk.fillPath();
      this.gPk.strokePath();
    }

    // Draw enemies
    for (const e of this.enemySystem.enemies) {
      if (!e.alive) continue;
      const hpPct = e.hp / e.maxHp;
      const ex = e.x + shakeX;
      const ey = e.y + shakeY;
      const flashColor = e.hitFlash > 0 ? 0xffffff : e.color;
      const flashAlpha = e.hitFlash > 0 ? 1.0 : 0.75;

      // Boss types
      if (e.type === 'boss' || e.type === 'boss2' || e.type === 'boss3' || e.type === 'miniboss') {
        this.gEn.fillStyle(flashColor, flashAlpha);
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(3, e.glow, 0.9);
        this.gEn.strokePath();
        this.gEn.lineStyle(2, 0xffffff, 0.4 + Math.sin(t * 3) * 0.2);
        this.gEn.strokeCircle(ex, ey, e.size - 4);

        // Boss HP bar
        const barW = e.size * 2.2;
        const barH = 6;
        const barY = ey + e.size + 18;
        this.gEn.fillStyle(0x220000, 0.7);
        this.gEn.fillRect(ex - barW / 2, barY, barW, barH);
        this.gEn.fillStyle(0xff0000, 0.9);
        this.gEn.fillRect(ex - barW / 2, barY, barW * hpPct, barH);
      }
      // Special enemy types
      else if (e.type === 'healer') {
        this.gEn.fillStyle(flashColor, e.hitFlash > 0 ? 1.0 : 0.8);
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.7);
        this.gEn.strokePath();
        this.gEn.fillStyle(0xffffff, 0.9);
        this.gEn.fillRect(ex - 6, ey - 2, 12, 4);
        this.gEn.fillRect(ex - 2, ey - 6, 4, 12);
      }
      else if (e.type === 'spawner') {
        this.gEn.fillStyle(flashColor, flashAlpha);
        this.gEn.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + t;
          this.gEn.lineTo(ex + Math.cos(a) * e.size, ey + Math.sin(a) * e.size);
        }
        this.gEn.closePath();
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.8);
        this.gEn.strokePath();
      }
      else if (e.type === 'bomber') {
        this.gEn.fillStyle(flashColor, e.hitFlash > 0 ? 1.0 : 0.85);
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, 0xff0000, 0.6 + Math.sin(t * 6) * 0.3);
        this.gEn.strokePath();
        this.gEn.fillStyle(0xff0000, 0.9);
        this.gEn.fillRect(ex - 1.5, ey - 6, 3, 10);
        this.gEn.fillRect(ex - 1.5, ey + 4, 3, 3);
      }
      else if (e.type === 'teleporter') {
        const fade = Math.sin(t * 4) * 0.3 + 0.7;
        this.gEn.fillStyle(flashColor, e.hitFlash > 0 ? 1.0 : fade * 0.8);
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, fade * 0.9);
        this.gEn.strokePath();
      }
      else if (e.type === 'kamikaze') {
        const a = e.angle;
        this.gEn.fillStyle(flashColor, e.hitFlash > 0 ? 1.0 : 0.9);
        this.gEn.beginPath();
        this.gEn.moveTo(ex + Math.cos(a) * e.size * 1.5, ey + Math.sin(a) * e.size * 1.5);
        this.gEn.lineTo(ex + Math.cos(a + 2.0) * e.size * 0.6, ey + Math.sin(a + 2.0) * e.size * 0.6);
        this.gEn.lineTo(ex + Math.cos(a - 2.0) * e.size * 0.6, ey + Math.sin(a - 2.0) * e.size * 0.6);
        this.gEn.closePath();
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.9);
        this.gEn.strokePath();
      }
      else if (e.type === 'artillery') {
        this.gEn.fillStyle(flashColor, e.hitFlash > 0 ? 1.0 : 0.8);
        this.gEn.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + t * 0.5;
          this.gEn.lineTo(ex + Math.cos(a) * e.size, ey + Math.sin(a) * e.size);
        }
        this.gEn.closePath();
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.75);
        this.gEn.strokePath();
      }
      else if (e.type === 'shieldE') {
        this.gEn.fillStyle(flashColor, e.hitFlash > 0 ? 1.0 : 0.7);
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.75);
        this.gEn.strokePath();
        this.gEn.lineStyle(3, 0x33ccff, 0.6 + Math.sin(t * 4) * 0.2);
        this.gEn.beginPath();
        const sa = e.shieldA || 0;
        const arc = Math.PI * 0.7;
        this.gEn.arc(ex, ey, e.size + 6, sa, sa + arc);
        this.gEn.strokePath();
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size + 6, sa + Math.PI, sa + Math.PI + arc);
        this.gEn.strokePath();
      }
      else {
        // Standard enemy
        this.gEn.fillStyle(flashColor, flashAlpha);
        this.gEn.beginPath();
        this.gEn.arc(ex, ey, e.size, 0, Math.PI * 2);
        this.gEn.fillPath();
        this.gEn.lineStyle(2, e.glow, 0.8);
        this.gEn.strokePath();
      }
    }

    // Draw sniper warnings
    for (const sw of this.enemySystem.sniperWarnings) {
      const a = 1.0 - sw.t / 0.6;
      this.gEn.lineStyle(2, 0xff0000, a * 0.8);
      this.gEn.strokeCircle(sw.x + shakeX, sw.y + shakeY, 30 + a * 20);
    }

    // Draw bullets
    for (const b of this.weaponSystem.bullets) {
      const bx = b.x + shakeX;
      const by = b.y + shakeY;
      if (b.mega) {
        this.gBu.fillStyle(0xffaa00, 0.85);
        this.gBu.beginPath();
        this.gBu.arc(bx, by, 10, 0, Math.PI * 2);
        this.gBu.fillPath();
        this.gBu.lineStyle(2, 0xffff00, 0.9);
        this.gBu.strokePath();
      } else {
        const size = 6 * b.size;
        const bulletColor = b.homing ? 0xaa44ff : b.pierce ? 0xff44aa : 0x00ffff;
        this.gBu.fillStyle(bulletColor, 0.85);
        this.gBu.beginPath();
        this.gBu.arc(bx, by, size, 0, Math.PI * 2);
        this.gBu.fillPath();
        if (b.trail && b.trail.length > 1) {
          this.gBu.lineStyle(size * 0.8, bulletColor, 0.3);
          this.gBu.beginPath();
          this.gBu.moveTo(b.trail[0].x + shakeX, b.trail[0].y + shakeY);
          for (const tr of b.trail) this.gBu.lineTo(tr.x + shakeX, tr.y + shakeY);
          this.gBu.strokePath();
        }
      }
    }

    // Draw enemy bullets
    for (const eb of this.weaponSystem.enemyBullets) {
      const ex = eb.x + shakeX;
      const ey = eb.y + shakeY;
      this.gBu.fillStyle(0xff3333, 0.85);
      this.gBu.beginPath();
      this.gBu.arc(ex, ey, 5, 0, Math.PI * 2);
      this.gBu.fillPath();
      this.gBu.lineStyle(1, 0xff6666, 0.7);
      this.gBu.strokePath();
    }

    // Draw laser beam
    if (this.weaponSystem.laserActive && this.weaponSystem.laserCharge >= 0.1) {
      const range = 600;
      const px = this.p.x + shakeX;
      const py = this.p.y + shakeY;
      const x2 = px + Math.cos(this.p.angle) * range;
      const y2 = py + Math.sin(this.p.angle) * range;

      this.gBu.lineStyle(8, 0xff0088, 0.3);
      this.gBu.beginPath();
      this.gBu.moveTo(px, py);
      this.gBu.lineTo(x2, y2);
      this.gBu.strokePath();

      this.gBu.lineStyle(3, 0xff44ff, 0.9);
      this.gBu.beginPath();
      this.gBu.moveTo(px, py);
      this.gBu.lineTo(x2, y2);
      this.gBu.strokePath();
    }

    // Draw particles
    for (const p of this.effectsSystem.particles) {
      const a = Math.min(1, p.life * 3);
      this.gPa.fillStyle(p.color, a * 0.8);
      this.gPa.fillCircle(p.x + shakeX, p.y + shakeY, p.size);
    }

    // Draw thruster flame when moving
    if (this.playerMoving && !this.p.dashing) {
      const thrustAngle = this.p.angle + Math.PI;
      const thrustX = this.p.x + Math.cos(thrustAngle) * 22 + shakeX;
      const thrustY = this.p.y + Math.sin(thrustAngle) * 22 + shakeY;
      const flicker = 0.7 + Math.random() * 0.3;

      this.gPl.fillStyle(0xff6600, 0.6 * flicker);
      this.gPl.beginPath();
      this.gPl.moveTo(thrustX + Math.cos(thrustAngle) * 18, thrustY + Math.sin(thrustAngle) * 18);
      this.gPl.lineTo(thrustX + Math.cos(thrustAngle + 0.4) * 8, thrustY + Math.sin(thrustAngle + 0.4) * 8);
      this.gPl.lineTo(thrustX + Math.cos(thrustAngle - 0.4) * 8, thrustY + Math.sin(thrustAngle - 0.4) * 8);
      this.gPl.closePath();
      this.gPl.fillPath();

      this.gPl.fillStyle(0xffff00, 0.8 * flicker);
      this.gPl.beginPath();
      this.gPl.moveTo(thrustX + Math.cos(thrustAngle) * 10, thrustY + Math.sin(thrustAngle) * 10);
      this.gPl.lineTo(thrustX + Math.cos(thrustAngle + 0.3) * 5, thrustY + Math.sin(thrustAngle + 0.3) * 5);
      this.gPl.lineTo(thrustX + Math.cos(thrustAngle - 0.3) * 5, thrustY + Math.sin(thrustAngle - 0.3) * 5);
      this.gPl.closePath();
      this.gPl.fillPath();
    }

    // Draw player
    const flash = (this.p.invuln > 0 && Math.floor(t * 20) % 2 === 0);
    if (!flash) {
      drawShipInGame(
        this.gPl,
        SHIPS[this.p.shipIdx].name,
        this.p.x + shakeX,
        this.p.y + shakeY,
        this.p.angle,
        SHIPS[this.p.shipIdx].color,
        this.p.upgradeStage
      );

      if (this.muzzleT > 0) {
        const fa = this.p.angle;
        this.gPl.fillStyle(0xffffff, this.muzzleT / 0.08);
        this.gPl.beginPath();
        this.gPl.arc(this.p.x + Math.cos(fa) * 28 + shakeX, this.p.y + Math.sin(fa) * 28 + shakeY, 6, 0, Math.PI * 2);
        this.gPl.fillPath();
      }
    }

    // Update HUD text
    this.txtScore.setText(`SCORE: ${this.score}`);
    this.txtWave.setText(`WAVE: ${this.wave}`);

    let hpCol = '#ff4444';
    if (this.p.hp / this.p.maxHp > 0.5) hpCol = '#44ff44';
    else if (this.p.hp / this.p.maxHp > 0.25) hpCol = '#ffaa00';
    this.txtHp.setText(`HP: ${this.p.hp | 0}/${this.p.maxHp | 0}  SHIELD: ${this.p.shield | 0}`).setColor(hpCol);
    this.txtEnemies.setText(`ENEMIES: ${this.enemySystem.enemies.length}`);

    // Weapon type display
    let weaponName = this.w.type.toUpperCase();
    if (this.w.shotgun) weaponName = 'SHOTGUN';
    if (this.w.laser) weaponName = 'LASER';
    const extras = [];
    if (this.w.pierce) extras.push('PIERCE');
    if (this.w.homing) extras.push('HOMING');
    if (this.w.mega) extras.push('MEGA');
    if (this.w.ricochet) extras.push('RICO');
    const extraStr = extras.length > 0 ? ' [' + extras.join('+') + ']' : '';
    this.txtWeapon.setText(`WEAPON: ${weaponName}${extraStr}`);

    // Combo display
    if (this.combo > 1) {
      const comboAlpha = Math.min(1, this.comboTimer / this.comboMaxTime);
      this.txtCombo.setText(`${this.combo}x COMBO`).setAlpha(comboAlpha);

      const arcX = W / 2;
      const arcY = 40;
      const arcRadius = 35;
      const arcProgress = this.comboTimer / this.comboMaxTime;

      this.gHu.lineStyle(4, 0x333333, 0.5);
      this.gHu.beginPath();
      this.gHu.arc(arcX, arcY, arcRadius, 0, Math.PI * 2);
      this.gHu.strokePath();

      this.gHu.lineStyle(4, 0xffaa00, comboAlpha);
      this.gHu.beginPath();
      this.gHu.arc(arcX, arcY, arcRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * arcProgress);
      this.gHu.strokePath();
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

    // Boss health bar
    if (this.currentBoss && this.currentBoss.alive) {
      const boss = this.currentBoss;
      const bossBarW = 400;
      const bossBarH = 20;
      const bossBarX = (W - bossBarW) / 2;
      const bossBarY = 60;

      const bossNames = {
        boss: 'GUARDIAN',
        boss2: 'DESTROYER',
        boss3: 'OVERLORD'
      };

      this.gHu.fillStyle(0x220000, 0.8);
      this.gHu.fillRect(bossBarX, bossBarY, bossBarW, bossBarH);

      const hpPercent = boss.hp / boss.maxHp;
      const hpColor = hpPercent > 0.5 ? 0xff4444 : hpPercent > 0.25 ? 0xff8800 : 0xff0000;
      this.gHu.fillStyle(hpColor, 0.9);
      this.gHu.fillRect(bossBarX, bossBarY, bossBarW * hpPercent, bossBarH);

      this.gHu.lineStyle(2, 0xff0000, 0.8);
      this.gHu.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);

      if (!this.bossNameText) {
        this.bossNameText = this.add.text(W / 2, bossBarY - 15, '', {
          fontSize: '14px',
          fontFamily: '"Courier New"',
          color: '#ff4444',
          fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(26);
      }
      this.bossNameText.setText(bossNames[boss.type] || 'BOSS').setVisible(true);
    } else {
      if (this.bossNameText) this.bossNameText.setVisible(false);
    }

    // Slow-mo overlay
    if (this.slowT > 0 || this.bossKillSlowT > 0) {
      this.gSlow.fillStyle(0x8844ff, 0.08);
      this.gSlow.fillRect(0, 0, W, H);
    }

    // Notification text
    // Upgrade screen
    if (this.upgradeMode) {
      const overlayAlpha = Math.min(0.85, this.upgradeAnimT * 2.5);
      this.gUp.fillStyle(0x000000, overlayAlpha);
      this.gUp.fillRect(0, 0, W, H);

      for (let i = 0; i < this.upgrades.length; i++) {
        const cardDelay = i * 0.12;
        const cardAlpha = Math.min(1, Math.max(0, (this.upgradeAnimT - cardDelay) * 4));

        if (cardAlpha <= 0) continue;

        const ux = 190 + i * 240;
        const uy = H / 2 + 60;
        const cardW = 180;
        const cardH = 240;

        this.gUp.fillStyle(0x000000, 0.5 * cardAlpha);
        this.gUp.fillRect(ux + 4, uy + 4, cardW, cardH);

        this.gUp.fillStyle(0x001122, 0.95 * cardAlpha);
        this.gUp.fillRect(ux, uy, cardW, cardH);

        this.gUp.fillStyle(0x002244, 0.5 * cardAlpha);
        this.gUp.fillRect(ux + 2, uy + 2, cardW - 4, 40);

        this.gUp.lineStyle(2, 0x00ffff, 0.8 * cardAlpha);
        this.gUp.strokeRect(ux, uy, cardW, cardH);

        const mx = this.input.activePointer.x;
        const my = this.input.activePointer.y;
        if (mx >= ux && mx <= ux + cardW && my >= uy && my <= uy + cardH) {
          this.gUp.fillStyle(0x00ffff, 0.15 * cardAlpha);
          this.gUp.fillRect(ux, uy, cardW, cardH);

          this.gUp.lineStyle(3, 0x44ffff, cardAlpha);
          this.gUp.strokeRect(ux - 1, uy - 1, cardW + 2, cardH + 2);
        }

        const iconColor = this.getUpgradeIconColor(this.upgrades[i].name);
        this.gUp.fillStyle(iconColor, 0.8 * cardAlpha);
        this.gUp.beginPath();
        this.gUp.arc(ux + cardW / 2, uy + 140, 25, 0, Math.PI * 2);
        this.gUp.fillPath();
        this.gUp.lineStyle(2, 0xffffff, 0.5 * cardAlpha);
        this.gUp.strokePath();
      }
    }
  }

  /**
   * Get icon color based on upgrade type
   */
  getUpgradeIconColor(upgradeName) {
    const colors = {
      'DUAL SHOT': 0x00ffff,
      'SPREAD': 0x00ffff,
      'QUAD SHOT': 0x00ffff,
      'RICOCHET': 0xffaa00,
      'SHOTGUN BLAST': 0xff6600,
      'LASER BEAM': 0xff00ff,
      'RAPID FIRE': 0xffff00,
      'PIERCING': 0xff44aa,
      'HOMING': 0xaa44ff,
      'MEGA BLAST': 0xff8800,
      'BULLET SIZE': 0x44aaff,
      'MAX HEALTH': 0x00ff00,
      'SPEED UP': 0xffff00,
      'ENERGY SHIELD': 0x4444ff,
      'REGEN': 0x44ff44,
      'QUICK DASH': 0x44ffcc,
      'TELEPORT': 0xff00ff
    };
    return colors[upgradeName] || 0x888888;
  }
}
