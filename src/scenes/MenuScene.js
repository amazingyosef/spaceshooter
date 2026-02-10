class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#04060e');

    // ── Grid background ──
    const gBg = this.add.graphics();
    gBg.lineStyle(1, 0x00ffff, 0.04);
    for (let x = 0; x <= W; x += 40) { gBg.moveTo(x, 0); gBg.lineTo(x, H); }
    for (let y = 0; y <= H; y += 40) { gBg.moveTo(0, y); gBg.lineTo(W, y); }
    gBg.strokePath();

    // ── Vignette overlay (darken edges) ──
    const vig = this.add.graphics().setDepth(1);
    for (let i = 0; i < 40; i++) {
      const a = (1 - i / 40) * 0.25;
      vig.fillStyle(0x000000, a);
      vig.fillRect(0, i * 2, W, 2);
      vig.fillRect(0, H - i * 2 - 2, W, 2);
    }
    for (let i = 0; i < 30; i++) {
      const a = (1 - i / 30) * 0.2;
      vig.fillStyle(0x000000, a);
      vig.fillRect(i * 2, 0, 2, H);
      vig.fillRect(W - i * 2 - 2, 0, 2, H);
    }

    // ── Divider helper (gradient fade from center) ──
    const drawDivider = (y) => {
      const dg = this.add.graphics().setDepth(5);
      const cx = W / 2;
      const halfW = W * 0.35;
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const alpha = 0.12 * (1 - t * t);
        dg.lineStyle(1, 0x00ffff, alpha);
        dg.beginPath();
        dg.moveTo(cx - halfW * t - halfW / steps, y);
        dg.lineTo(cx - halfW * t, y);
        dg.strokePath();
        dg.beginPath();
        dg.moveTo(cx + halfW * t, y);
        dg.lineTo(cx + halfW * t + halfW / steps, y);
        dg.strokePath();
      }
      dg.lineStyle(1, 0x00ffff, 0.12);
      dg.beginPath();
      dg.moveTo(cx - halfW / steps, y);
      dg.lineTo(cx + halfW / steps, y);
      dg.strokePath();
    };

    // ════════════════════════════════════════════════════════════
    // SECTION 1: TITLE
    // ════════════════════════════════════════════════════════════
    this.add.text(W / 2, 50, 'CYBER ARENA', {
      fontSize: '62px',
      fontFamily: '"Courier New"',
      color: '#00ffff',
      letterSpacing: 10
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, 94, 'BY YOSEF FELLIG', {
      fontSize: '13px',
      fontFamily: '"Courier New"',
      color: '#00ffff',
      letterSpacing: 8
    }).setOrigin(0.5).setDepth(10).setAlpha(0.4);

    if (highScore > 0) {
      this.add.text(W / 2, 118, `★ HIGH SCORE: ${highScore}`, {
        fontSize: '14px',
        fontFamily: '"Courier New"',
        color: '#ffaa00',
        letterSpacing: 2
      }).setOrigin(0.5).setDepth(10).setAlpha(0.7);
    }

    drawDivider(140);

    // ════════════════════════════════════════════════════════════
    // SECTION 2: SHIP SELECTION
    // ════════════════════════════════════════════════════════════
    this.add.text(W / 2, 158, 'SELECT YOUR SHIP', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#3a4a5e',
      letterSpacing: 5
    }).setOrigin(0.5).setDepth(10);

    this.shipGraphics = [];
    const cardW = 250;
    const cardH = 320;
    const cardGap = 18;
    const totalCardsW = cardW * 3 + cardGap * 2;
    const cardsStartX = (W - totalCardsW) / 2 + cardW / 2;
    const cardTopY = 178;

    SHIPS.forEach((s, i) => {
      const cx = cardsStartX + i * (cardW + cardGap);
      const isSelected = (i === selectedShip);
      const g = this.add.graphics().setDepth(11);
      const shipColorNum = Phaser.Display.Color.ValueToColor(s.color).color;

      // ── Card background ──
      if (isSelected) {
        g.fillStyle(0x0c1223, 0.9);
        g.fillRoundedRect(cx - cardW / 2, cardTopY, cardW, cardH, 6);
        g.fillStyle(shipColorNum, 0.03);
        g.fillRoundedRect(cx - cardW / 2, cardTopY, cardW, cardH, 6);
        g.lineStyle(1, shipColorNum, 0.25);
        g.strokeRoundedRect(cx - cardW / 2, cardTopY, cardW, cardH, 6);

        // Corner brackets
        const cLen = 14;
        const cL = cx - cardW / 2;
        const cR = cx + cardW / 2;
        const cT = cardTopY;
        const cB = cardTopY + cardH;
        g.lineStyle(2, shipColorNum, 0.8);
        g.beginPath(); g.moveTo(cL, cT + cLen); g.lineTo(cL, cT); g.lineTo(cL + cLen, cT); g.strokePath();
        g.beginPath(); g.moveTo(cR - cLen, cT); g.lineTo(cR, cT); g.lineTo(cR, cT + cLen); g.strokePath();
        g.beginPath(); g.moveTo(cL, cB - cLen); g.lineTo(cL, cB); g.lineTo(cL + cLen, cB); g.strokePath();
        g.beginPath(); g.moveTo(cR - cLen, cB); g.lineTo(cR, cB); g.lineTo(cR, cB - cLen); g.strokePath();
      } else {
        g.fillStyle(0x080c18, 0.6);
        g.fillRoundedRect(cx - cardW / 2, cardTopY, cardW, cardH, 6);
        g.lineStyle(1, 0x3c5064, 0.2);
        g.strokeRoundedRect(cx - cardW / 2, cardTopY, cardW, cardH, 6);
      }

      // ── Ship preview ──
      const shipPreviewY = cardTopY + 72;
      drawShipPreview(g, s.name, cx, shipPreviewY, 0, s.color, isSelected ? 1.6 : 1.15);
      if (!isSelected) {
        // Dim overlay on unselected ships
        g.fillStyle(0x080c18, 0.55);
        g.fillCircle(cx, shipPreviewY, 28);
      }

      // ── Ship name ──
      this.add.text(cx, cardTopY + 134, s.name, {
        fontSize: '21px',
        fontFamily: '"Courier New"',
        color: isSelected ? s.col2 : '#556677',
        fontStyle: 'bold',
        letterSpacing: 4
      }).setOrigin(0.5).setDepth(12);

      // ── Description ──
      this.add.text(cx, cardTopY + 158, s.desc, {
        fontSize: '13px',
        fontFamily: '"Courier New"',
        color: isSelected ? '#8899aa' : '#3a4a5e'
      }).setOrigin(0.5).setDepth(12);

      // ── Stats ──
      const stats = ['firepower', 'speed', 'defense', 'mobility'];
      const statLabels = ['FIRE', 'SPD', 'DEF', 'MOB'];
      const barFullW = 105;
      const barH = 5;
      const statStartY = cardTopY + 182;
      const statRowH = 20;
      const labelX = cx - 68;
      const barX = cx - 26;

      stats.forEach((stat, si) => {
        const sy = statStartY + si * statRowH;
        const val = s.stats[stat];
        const pct = val / 100;

        this.add.text(labelX, sy, statLabels[si], {
          fontSize: '12px',
          fontFamily: '"Courier New"',
          color: isSelected ? '#8899aa' : '#556677'
        }).setDepth(12);

        const barG = this.add.graphics().setDepth(12);
        barG.fillStyle(0x141e2d, 0.9);
        barG.fillRoundedRect(barX, sy - 1, barFullW, barH, 3);
        barG.fillStyle(shipColorNum, isSelected ? 0.75 : 0.2);
        barG.fillRoundedRect(barX, sy - 1, barFullW * pct, barH, 3);

        this.add.text(barX + barFullW + 8, sy, `${val}`, {
          fontSize: '10px',
          fontFamily: '"Courier New"',
          color: isSelected ? '#556677' : '#3a4a5e'
        }).setDepth(12);
      });

      // ── Perk section ──
      const perkSepY = cardTopY + 268;
      const perkDivG = this.add.graphics().setDepth(12);
      perkDivG.lineStyle(1, isSelected ? shipColorNum : 0x556677, isSelected ? 0.2 : 0.1);
      perkDivG.beginPath();
      perkDivG.moveTo(cx - cardW * 0.3, perkSepY);
      perkDivG.lineTo(cx + cardW * 0.3, perkSepY);
      perkDivG.strokePath();

      this.add.text(cx, cardTopY + 282, s.perk, {
        fontSize: '12px',
        fontFamily: '"Courier New"',
        color: isSelected ? s.perkColor : '#3a4a5e',
        fontStyle: 'bold',
        letterSpacing: 2
      }).setOrigin(0.5).setDepth(12);

      this.add.text(cx, cardTopY + 300, s.perkDesc, {
        fontSize: '12px',
        fontFamily: '"Courier New"',
        color: isSelected ? '#556677' : '#3a4a5e',
        wordWrap: { width: cardW - 40 },
        align: 'center'
      }).setOrigin(0.5).setDepth(12);

      // ── Click zone ──
      const zone = this.add.zone(cx, cardTopY + cardH / 2, cardW, cardH).setInteractive();
      zone.on('pointerdown', () => {
        selectedShip = i;
        savePersistent();
        this.scene.restart();
      });

      this.shipGraphics.push(g);
    });

    // ════════════════════════════════════════════════════════════
    // SECTION 3: DIFFICULTY (inline row)
    // ════════════════════════════════════════════════════════════
    const diffRowY = cardTopY + cardH + 28;

    this.add.text(W / 2 - 225, diffRowY, 'DIFFICULTY', {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: '#3a4a5e',
      letterSpacing: 3
    }).setOrigin(0.5).setDepth(10);

    const diffSpacing = 105;
    const diffStartX = W / 2 - 55;

    DIFFICULTY_MODES.forEach((d, i) => {
      const dx = diffStartX + i * diffSpacing;
      const isSel = (i === selectedDifficulty);

      if (isSel) {
        const bg = this.add.graphics().setDepth(11);
        bg.fillStyle(d.colorHex, 0.05);
        bg.fillRoundedRect(dx - 42, diffRowY - 13, 84, 26, 4);
        bg.lineStyle(1, d.colorHex, 0.35);
        bg.strokeRoundedRect(dx - 42, diffRowY - 13, 84, 26, 4);
      }

      const txt = this.add.text(dx, diffRowY, d.name, {
        fontSize: '14px',
        fontFamily: '"Courier New"',
        color: isSel ? d.color : '#3a4a5e',
        fontStyle: isSel ? 'bold' : 'normal',
        letterSpacing: 1
      }).setOrigin(0.5).setDepth(12).setInteractive();

      txt.on('pointerdown', () => {
        selectedDifficulty = i;
        savePersistent();
        this.scene.restart();
      });
      txt.on('pointerover', () => {
        if (i !== selectedDifficulty) txt.setColor('#556677');
        this.input.setDefaultCursor('pointer');
      });
      txt.on('pointerout', () => {
        if (i !== selectedDifficulty) txt.setColor('#3a4a5e');
        this.input.setDefaultCursor('default');
      });
    });

    const selDiff = DIFFICULTY_MODES[selectedDifficulty];
    this.add.text(W / 2, diffRowY + 24, selDiff.desc, {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: selDiff.color
    }).setOrigin(0.5).setDepth(10).setAlpha(0.45);

    // ════════════════════════════════════════════════════════════
    // SECTION 4: BOTTOM BAR
    // ════════════════════════════════════════════════════════════
    const bottomBarY = H - 38;
    drawDivider(bottomBarY - 28);

    // Achievements (left)
    const achBtn = this.add.text(100, bottomBarY, '🏆 ACHIEVEMENTS', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#3a4a5e',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(12).setInteractive();
    achBtn.on('pointerdown', () => this.scene.start('Achievements'));
    achBtn.on('pointerover', () => { achBtn.setColor('#ffaa00'); this.input.setDefaultCursor('pointer'); });
    achBtn.on('pointerout', () => { achBtn.setColor('#3a4a5e'); this.input.setDefaultCursor('default'); });

    // START GAME (center)
    const startBtnW = 220;
    const startBtnH = 42;
    const startBtnX = W / 2;
    const startBtnG = this.add.graphics().setDepth(11);

    const drawStartBtn = (hovered) => {
      startBtnG.clear();
      startBtnG.fillStyle(0x00ff88, hovered ? 0.1 : 0.05);
      startBtnG.fillRoundedRect(startBtnX - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 5);
      startBtnG.lineStyle(1.5, 0x00ff88, hovered ? 0.7 : 0.4);
      startBtnG.strokeRoundedRect(startBtnX - startBtnW / 2, bottomBarY - startBtnH / 2, startBtnW, startBtnH, 5);
    };
    drawStartBtn(false);

    const startBtn = this.add.text(startBtnX, bottomBarY, '▶  START GAME', {
      fontSize: '18px',
      fontFamily: '"Courier New"',
      color: '#00ff88',
      fontStyle: 'bold',
      letterSpacing: 3
    }).setOrigin(0.5).setDepth(12);

    const startZone = this.add.zone(startBtnX, bottomBarY, startBtnW, startBtnH).setInteractive();
    startZone.on('pointerdown', () => {
      if (!audioCtx) initAudio();
      this.scene.start('Game');
    });
    startZone.on('pointerover', () => {
      startBtn.setColor('#66ffaa');
      drawStartBtn(true);
      this.input.setDefaultCursor('pointer');
    });
    startZone.on('pointerout', () => {
      startBtn.setColor('#00ff88');
      drawStartBtn(false);
      this.input.setDefaultCursor('default');
    });

    // Version (right)
    this.add.text(W - 100, bottomBarY, `v2.0 · ${totalEnemiesKilled} kills`, {
      fontSize: '12px',
      fontFamily: '"Courier New"',
      color: '#3a4a5e'
    }).setOrigin(0.5).setDepth(10).setAlpha(0.5);
  }
}

// ============================================================
// ACHIEVEMENTS SCENE
// ============================================================
