class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    
    // Grid background
    this.gBg = this.add.graphics();
    this.gBg.lineStyle(1, 0x00ffff, 0.15);
    for(let x = 0; x <= W; x += 40) {
      this.gBg.lineTo(x, 0);
      this.gBg.lineTo(x, H);
      this.gBg.moveTo(x + 40, 0);
    }
    for(let y = 0; y <= H; y += 40) {
      this.gBg.moveTo(0, y);
      this.gBg.lineTo(W, y);
    }
    this.gBg.strokePath();
    
    // Title
    this.add.text(W / 2, 90, 'CYBER ARENA', {
      fontSize: '64px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
    }).setOrigin(0.5).setDepth(10);
    
    this.add.text(W / 2, 135, 'ENHANCED EDITION', {
      fontSize: '16px',
      fontFamily: '"Courier New"',
      color: '#66ffff'
    }).setOrigin(0.5).setDepth(10).setAlpha(0.8);
    
    // High score
    this.add.text(W / 2, 175, `HIGH SCORE: ${highScore}`, {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(10);
    
    // Ship selection
    this.add.text(W / 2, 230, 'SELECT YOUR SHIP', {
      fontSize: '20px',
      fontFamily: '"Courier New"',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(10);
    
    this.shipGraphics = [];
    SHIPS.forEach((s, i) => {
      const cx = 200 + i * 250;
      const cy = 345;
      const g = this.add.graphics().setDepth(11);
      
      // Selection highlight
      if(i === selectedShip) {
        g.lineStyle(3, Phaser.Display.Color.ValueToColor(s.color).color, 0.8);
        g.strokeRect(cx - 95, cy - 125, 190, 260);
      }
      
      // Ship preview
      drawShipPreview(g, s.name, cx, cy - 40, 0, s.color, 1.2);
      
      // Ship name
      this.add.text(cx, cy + 50, s.name, {
        fontSize: '18px',
        fontFamily: '"Courier New"',
        color: s.col2
      }).setOrigin(0.5).setDepth(12);
      
      // Description
      this.add.text(cx, cy + 72, s.desc, {
        fontSize: '11px',
        fontFamily: '"Courier New"',
        color: '#889999'
      }).setOrigin(0.5).setDepth(12).setAlpha(0.85);
      
      // Stats bars
      const stats = ['firepower', 'speed', 'defense', 'mobility'];
      const statNames = ['FIRE', 'SPEED', 'DEF', 'MOB'];
      stats.forEach((stat, si) => {
        const sy = cy + 95 + si * 16;
        const val = s.stats[stat];
        
        this.add.text(cx - 75, sy, statNames[si], {
          fontSize: '8px',
          fontFamily: '"Courier New"',
          color: '#667788'
        }).setDepth(12);
        
        const barG = this.add.graphics().setDepth(12);
        barG.fillStyle(0x223344, 0.5);
        barG.fillRect(cx - 32, sy - 4, 100, 10);
        barG.fillStyle(Phaser.Display.Color.ValueToColor(s.color).color, 0.8);
        barG.fillRect(cx - 32, sy - 4, val, 10);
      });
      
      // Ship perk
      this.add.text(cx, cy + 170, s.perk, {
        fontSize: '10px',
        fontFamily: '"Courier New"',
        color: s.perkColor
      }).setOrigin(0.5).setDepth(12).setAlpha(0.9);
      
      this.add.text(cx, cy + 183, s.perkDesc, {
        fontSize: '8px',
        fontFamily: '"Courier New"',
        color: '#889999',
        wordWrap: {width: 160}
      }).setOrigin(0.5).setDepth(12).setAlpha(0.7);
      
      // Click zone
      const zone = this.add.zone(cx, cy, 190, 260).setInteractive();
      zone.on('pointerdown', () => {
        selectedShip = i;
        savePersistent();
        this.scene.restart();
      });
      
      this.shipGraphics.push(g);
    });
    
    // Achievements button
    const achBtn = this.add.text(W / 2 - 110, H - 80, '🏆 ACHIEVEMENTS', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(12).setInteractive();
    achBtn.on('pointerdown', () => this.scene.start('Achievements'));
    
    // Start button
    const startBtn = this.add.text(W / 2 + 110, H - 80, '▶ START GAME', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#00ff00'
    }).setOrigin(0.5).setDepth(12).setInteractive();
    startBtn.on('pointerdown', () => {
      if(!audioCtx) initAudio();
      this.scene.start('Game');
    });
    
    // Version
    this.add.text(W / 2, H - 30, 'v2.0 Enhanced | Total Enemies Killed: ' + totalEnemiesKilled, {
      fontSize: '10px',
      fontFamily: '"Courier New"',
      color: '#445566'
    }).setOrigin(0.5).setDepth(10);
  }
}

// ============================================================
// ACHIEVEMENTS SCENE
// ============================================================
