/**
 * MAIN ENTRY POINT
 * This file initializes and starts the Phaser game.
 *
 * For a young learner: This is where the game begins!
 * It tells Phaser what settings to use and which scenes to load.
 */

// Phaser game configuration
const config = {
  type: Phaser.AUTO,           // Use WebGL if available, otherwise Canvas
  width: W,                    // Canvas width (from config.js)
  height: H,                   // Canvas height (from config.js)
  parent: 'game-container',    // HTML element to put the game in
  backgroundColor: '#000000',  // Black background
  scene: [MenuScene, AchievementsScene, GameScene, GameOverScene]  // All game scenes
};

// Create and start the game
const game = new Phaser.Game(config);
