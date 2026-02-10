class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#060612');

    // Grid background
    this.gBg = this.add.graphics();
    this.gBg.lineStyle(1, 0x00ffff, 0.04);
    for(let x = 0; x <= W; x += 40) {
      this.gBg.moveTo(x, 0);
      this.gBg.lineTo(x, H);
    }
    for(let y = 0; y <= H; y += 40) {
      this.gBg.moveTo(0, y);
      this.gBg.lineTo(W, y);
    }
    this.gBg.strokePath();

    // Title
    this.add.text(W / 2, 50, 'CYBER ARENA', {
      fontSize: '62px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, 92, 'ENHANCED EDITION', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#66ffff'
    }).setOrigin(0.5).setDepth(10).setAlpha(0.8);

    // High score
    this.add.text(W / 2, 116, `HIGH SCORE: ${highScore}`, {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(10);

    // Divider
    const divG = this.add.graphics().setDepth(10);
    divG.lineStyle(1, 0x00ffff, 0.15);
    divG.beginPath();
    divG.moveTo(W / 2 - 160, 138);
    divG.lineTo(W / 2 + 160, 138);
    divG.strokePath();

    // Ship selection
    this.add.text(W / 2, 158, 'SELECT YOUR SHIP', {
      fontSize: '18px',
      fontFamily: '"Courier New"',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(10);

    // Layout variables
    const cardTopY = 180;
    const cardH = 320;
    const cardW = 250;
    const cardSpacing = 280;

    this.shipGraphics = [];
    SHIPS.forEach((s, i) => {
      const cx = W / 2 + (i - 1) * cardSpacing;
      const isSelected = (i === selectedShip);
      const g = this.add.graphics().setDepth(11);
      const shipColorNum = Phaser.Display.Color.ValueToColor(s.color).color;

      // Selection highlight
      if (isSelected) {
        g.lineStyle(3, shipColorNum, 0.8);
        g.strokeRoundedRect(cx - cardW / 2, cardTopY, cardW, cardH, 6);
        // Outer glow
        g.lineStyle(1, shipColorNum, 0.15);
        g.strokeRoundedRect(cx - cardW / 2 - 3, cardTopY - 3, cardW + 6, cardH + 6, 8);
      }

      // Ship preview
      const shipPreviewY = cardTopY + 70;
      drawShipPreview(g, s.name, cx, shipPreviewY, 0, s.color, isSelected ? 1.6 : 1.0);

      // Ship name
      this.add.text(cx, cardTopY + 132, s.name, {
        fontSize: '21px',
        fontFamily: '"Courier New"',
        color: s.col2,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12);

      // Description
      this.add.text(cx, cardTopY + 156, s.desc, {
        fontSize: '13px',
        fontFamily: '"Courier New"',
        color: '#aab6c4'
      }).setOrigin(0.5).setDepth(12).setAlpha(0.9);

      // Stats bars
      const stats = ['firepower', 'speed', 'defense', 'mobility'];
      const statNames = ['FIRE', 'SPEED', 'DEF', 'MOB'];
      const statStartY = cardTopY + 178;
      const statRowH = 22;
      const barFullW = 100;
      const barH = 7;
      stats.forEach((stat, si) => {
        const sy = statStartY + si * statRowH;
        const val = s.stats[stat];

        this.add.text(cx - 80, sy, statNames[si], {
          fontSize: '12px',
          fontFamily: '"Courier New"',
          color: '#99aabb'
        }).setDepth(12);

        const barG = this.add.graphics().setDepth(12);
        barG.fillStyle(0x223344, 0.5);
        barG.fillRoundedRect(cx - 32, sy - 3, barFullW, barH, 3);
        barG.fillStyle(shipColorNum, 0.8);
        barG.fillRoundedRect(cx - 32, sy - 3, val, barH, 3);

        // Stat value number
        this.add.text(cx - 32 + barFullW + 8, sy, `${val}`, {
          fontSize: '10px',
          fontFamily: '"Courier New"',
          color: '#99aabb'
        }).setDepth(12).setAlpha(0.7);
      });

      // Perk separator
      const perkSepY = cardTopY + 270;
      const perkG = this.add.graphics().setDepth(12);
      perkG.lineStyle(1, shipColorNum, 0.2);
      perkG.beginPath();
      perkG.moveTo(cx - cardW * 0.3, perkSepY);
      perkG.lineTo(cx + cardW * 0.3, perkSepY);
      perkG.strokePath();

      // Ship perk
      this.add.text(cx, cardTopY + 284, s.perk, {
        fontSize: '12px',
        fontFamily: '"Courier New"',
        color: s.perkColor,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12).setAlpha(0.95);

      this.add.text(cx, cardTopY + 302, s.perkDesc, {
        fontSize: '12px',
        fontFamily: '"Courier New"',
        color: '#a8b4c2',
        wordWrap: {width: 200}
      }).setOrigin(0.5).setDepth(12).setAlpha(0.85);

      // Click zone
      const zone = this.add.zone(
        cx,
        cardTopY + cardH / 2,
        cardW,
        cardH
      ).setInteractive();
      zone.on('pointerdown', () => {
        selectedShip = i;
        savePersistent();
        this.scene.restart();
      });

      this.shipGraphics.push(g);
    });

    // Difficulty section
    const section3Y = cardTopY + cardH + 15;
    this.add.text(W / 2, section3Y, 'DIFFICULTY', {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: '#667788'
    }).setOrigin(0.5).setDepth(10);

    const diffSpacing = 110;
    const diffStartX = W / 2 - diffSpacing * 1.5;
    const diffRowY = section3Y + 26;
    DIFFICULTY_MODES.forEach((d, i) => {
      const dx = diffStartX + i * diffSpacing;
      const isSelected = (i === selectedDifficulty);

      if (isSelected) {
        const bg = this.add.graphics().setDepth(11);
        bg.lineStyle(2, d.colorHex, 0.8);
        bg.strokeRoundedRect(dx - 45, diffRowY - 14, 90, 28, 4);
        bg.fillStyle(d.colorHex, 0.1);
        bg.fillRoundedRect(dx - 45, diffRowY - 14, 90, 28, 4);
      }

      const txt = this.add.text(dx, diffRowY, d.name, {
        fontSize: '14px',
        fontFamily: '"Courier New"',
        color: isSelected ? d.color : '#556677',
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setOrigin(0.5).setDepth(12).setInteractive();

      txt.on('pointerdown', () => {
        selectedDifficulty = i;
        savePersistent();
        this.scene.restart();
      });
      txt.on('pointerover', () => { if (i !== selectedDifficulty) txt.setColor(d.color); });
      txt.on('pointerout', () => { if (i !== selectedDifficulty) txt.setColor('#556677'); });
    });

    // Selected difficulty description
    const selDiff = DIFFICULTY_MODES[selectedDifficulty];
    this.add.text(W / 2, diffRowY + 28, selDiff.desc, {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: selDiff.color
    }).setOrigin(0.5).setDepth(10).setAlpha(0.7);

    // Bottom bar
    const bottomBarY = H - 68;

    // Start button with background
    const startBtnW = 210;
    const startBtnH = 42;
    const startBtnG = this.add.graphics().setDepth(11);
    startBtnG.fillStyle(0x00ff88, 0.1);
    startBtnG.fillRoundedRect(W / 2 - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 6);
    startBtnG.lineStyle(2, 0x00ff88, 0.6);
    startBtnG.strokeRoundedRect(W / 2 - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 6);

    const startBtn = this.add.text(W / 2, bottomBarY, '▶ START GAME', {
      fontSize: '18px',
      fontFamily: '"Courier New"',
      color: '#00ff88'
    }).setOrigin(0.5).setDepth(12);

    const startZone = this.add.zone(W / 2, bottomBarY, startBtnW, startBtnH).setInteractive();
    startZone.on('pointerdown', () => {
      if(!audioCtx) initAudio();
      this.scene.start('Game');
    });
    startZone.on('pointerover', () => {
      startBtn.setColor('#66ffaa');
      startBtnG.clear();
      startBtnG.fillStyle(0x00ff88, 0.2);
      startBtnG.fillRoundedRect(W / 2 - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 6);
      startBtnG.lineStyle(2, 0x00ff88, 0.8);
      startBtnG.strokeRoundedRect(W / 2 - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 6);
    });
    startZone.on('pointerout', () => {
      startBtn.setColor('#00ff88');
      startBtnG.clear();
      startBtnG.fillStyle(0x00ff88, 0.1);
      startBtnG.fillRoundedRect(W / 2 - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 6);
      startBtnG.lineStyle(2, 0x00ff88, 0.6);
      startBtnG.strokeRoundedRect(W / 2 - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 6);
    });

    // Achievements button
    const achBtn = this.add.text(W / 2 - 220, bottomBarY, '🏆 ACHIEVEMENTS', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(12).setInteractive();
    achBtn.on('pointerdown', () => this.scene.start('Achievements'));
    achBtn.on('pointerover', () => achBtn.setColor('#ffcc44'));
    achBtn.on('pointerout', () => achBtn.setColor('#ffaa00'));

    // Version
    this.add.text(W / 2 + 220, bottomBarY, 'v2.0 Enhanced | Kills: ' + totalEnemiesKilled, {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: '#445566'
    }).setOrigin(0.5).setDepth(10);
  }
}

// ============================================================
// ACHIEVEMENTS SCENE
// ============================================================
