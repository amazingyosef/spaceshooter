class AchievementsScene extends Phaser.Scene {
  constructor() { super('Achievements'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    
    this.add.text(W / 2, 60, 'ACHIEVEMENTS', {
      fontSize: '36px',
      fontFamily: '"Courier New"',
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    const achKeys = Object.keys(achievements);
    const unlockedCount = achKeys.filter(k => achievements[k].unlocked).length;
    
    this.add.text(W / 2, 105, `${unlockedCount} / ${achKeys.length} Unlocked`, {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#66ffff'
    }).setOrigin(0.5);
    
    // Achievement list
    let y = 160;
    achKeys.forEach((key, i) => {
      const ach = achievements[key];
      const unlocked = ach.unlocked;
      
      const bg = this.add.graphics();
      bg.fillStyle(unlocked ? 0x003344 : 0x1a1a1a, 0.5);
      bg.fillRect(150, y - 22, 600, 50);
      
      const icon = this.add.text(170, y, unlocked ? '🏆' : '🔒', {
        fontSize: '24px'
      });
      
      this.add.text(220, y - 12, ach.name, {
        fontSize: '16px',
        fontFamily: '"Courier New"',
        color: unlocked ? '#ffaa00' : '#555555'
      });
      
      this.add.text(220, y + 8, ach.desc, {
        fontSize: '12px',
        fontFamily: '"Courier New"',
        color: unlocked ? '#aaccff' : '#444444'
      });
      
      y += 58;
    });
    
    // Back button
    const backBtn = this.add.text(W / 2, H - 60, '← BACK', {
      fontSize: '16px',
      fontFamily: '"Courier New"',
      color: '#00ffff'
    }).setOrigin(0.5).setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('Menu'));
  }
}

// ============================================================
// GAME SCENE
// ============================================================
