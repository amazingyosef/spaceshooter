class GameOverScene extends Phaser.Scene {
  constructor(){ super('GameOver'); }

  create(){
    this.cameras.main.setBackgroundColor('#000000');
    
    this.add.text(W/2,120,'GAME OVER',{fontSize:'56px',fontFamily:'"Courier New"',color:'#ff4444'}).setOrigin(0.5);
    
    this.add.text(W/2,220,'SCORE',{fontSize:'16px',fontFamily:'"Courier New"',color:'#66ffff'}).setOrigin(0.5);
    this.add.text(W/2,250,`${lastScore}`,{fontSize:'48px',fontFamily:'"Courier New"',color:'#00ffff'}).setOrigin(0.5);
    
    this.add.text(W/2,320,'WAVE REACHED',{fontSize:'16px',fontFamily:'"Courier New"',color:'#66ffff'}).setOrigin(0.5);
    this.add.text(W/2,350,`${lastWave}`,{fontSize:'36px',fontFamily:'"Courier New"',color:'#ffaa00'}).setOrigin(0.5);
    
    this.add.text(W/2,410,'STATS',{fontSize:'18px',fontFamily:'"Courier New"',color:'#ffffff'}).setOrigin(0.5);
    
    let y=450;
    const stats=[
      `Enemies Killed: ${lastStats.enemiesKilled||0}`,
      `Upgrades Taken: ${lastStats.upgradesTaken||0}`,
      `Dashes Used: ${lastStats.dashesUsed||0}`,
      `Peak Combo: ${lastStats.peakCombo||0}x`
    ];
    stats.forEach(s=>{
      this.add.text(W/2,y,s,{fontSize:'14px',fontFamily:'"Courier New"',color:'#aaccff'}).setOrigin(0.5);
      y+=26;
    });
    
    const retryBtn=this.add.text(W/2-90,H-80,'↻ RETRY',{fontSize:'18px',fontFamily:'"Courier New"',color:'#00ff00'}).setOrigin(0.5).setInteractive();
    retryBtn.on('pointerdown',()=>this.scene.start('Game'));
    
    const menuBtn=this.add.text(W/2+90,H-80,'← MENU',{fontSize:'18px',fontFamily:'"Courier New"',color:'#00ffff'}).setOrigin(0.5).setInteractive();
    menuBtn.on('pointerdown',()=>this.scene.start('Menu'));
  }
}
