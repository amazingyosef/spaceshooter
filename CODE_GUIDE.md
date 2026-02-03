# CYBER ARENA - Code Guide 🚀

Welcome! This guide will help you understand how the game is organized and how to make changes.

## 📁 File Structure

The game is now split into **logical, easy-to-find modules**:

```
spaceshooter/
├── index.html              # Main HTML file
├── CODE_GUIDE.md          # This file!
├── styles/
│   └── main.css           # Game styling
└── src/
    ├── config.js          # ⚙️ Game settings (ships, achievements, upgrades)
    ├── utils.js           # 🔧 Helper functions (math, drawing, audio)
    ├── systems.js         # 💾 Save/load system
    ├── gameplay/          # 🎮 GAMEPLAY SYSTEMS (this is where you edit!)
    │   ├── player.js      #    🚀 Player movement, dash, damage
    │   ├── weapons.js     #    💥 Weapon firing, bullets, lasers
    │   ├── enemies.js     #    👾 Enemy spawning, AI, behaviors
    │   ├── upgrades.js    #    ⬆️  Upgrade pool and effects
    │   └── effects.js     #    ✨ Particles, pickups, explosions
    ├── scenes/            # 🎬 GAME SCREENS
    │   ├── MenuScene.js           # Main menu
    │   ├── AchievementsScene.js   # Achievements
    │   ├── GameScene.js           # Main game (orchestrates everything)
    │   └── GameOverScene.js       # Game over screen
    └── main.js            # 🎯 Starts the game
```

---

## 🎮 What Each File Does

### 📄 `index.html` (22 lines)
- Loads the CSS and all JavaScript files
- **You rarely need to change this!**

### 🎨 `styles/main.css` (25 lines)
- Controls how the game looks on the page
- Black background, centered layout
- **Change this for different page styling**

### ⚙️ `src/config.js` (106 lines) - GAME SETTINGS
**This is where you change game balance!**

**What's inside:**
- `W` and `H` - Canvas width and height (900x680)
- `SHIPS` array - All three playable ships
  - **VIPER**: Balanced fighter (HP: 100, Speed: 240)
  - **TANKS**: Heavy tank (HP: 150, Speed: 185)
  - **RAZOR**: Fast glass cannon (HP: 70, Speed: 310)
- `ACHIEVEMENTS` - All 10 unlockable achievements
- `PERSISTENT_UPGRADES` - Permanent upgrades (HP, damage, speed, shield)

**Example: Make VIPER ship faster**
```javascript
{
  name: 'VIPER',
  baseSpeed: 300,  // Changed from 240!
  // ... other properties
}
```

### 🔧 `src/utils.js` (389 lines) - HELPER FUNCTIONS
Utility functions used throughout the game.

**What's inside:**
- **Math functions**: `clamp()`, `rand()`, `dist()`, `norm()`, `angDiff()`
- **Ship drawing**: `drawShipPreview()`, `drawShipInGame()`
- **Audio system**: `initAudio()`, `beep()`, `sfx()`

**Tip:** Add new sound effects to the `sfx()` function!

### 💾 `src/systems.js` (122 lines) - SAVE SYSTEM
Handles saving progress and achievements.

**What's inside:**
- `loadPersistent()` / `savePersistent()` - Save/load from browser
- `unlockAchievement()` - Award achievements
- `trackEnemyKill()` - Count kills for achievements

**Don't modify unless you know what you're doing!**

---

## 🎮 GAMEPLAY FOLDER - Where the Fun Happens!

### 🚀 `src/gameplay/player.js` (246 lines) - PLAYER SYSTEM
**This controls everything about the player ship!**

**Key Methods:**
- `init(shipIdx)` - Creates the player with ship bonuses
- `updateMovement(dt, keys)` - WASD movement
  - Line ~64: Speed applied here!
- `updateDash(dt, ...)` - Dash/teleport ability
  - Regular dash: 0.16s duration, 550px/s speed
  - Teleport: Instant 120px movement
- `takeDamage(amount)` - Apply damage with ship perks
  - TANKS perk: 25% damage reduction (line ~211)
  - Shields absorb first!
- `updateRegen(dt, regenRate)` - Passive healing

**Want to change player speed?** → Line ~64
**Want to change dash cooldown?** → Line ~116
**Want to change damage reduction?** → Line ~211

### 💥 `src/gameplay/weapons.js` (444 lines) - WEAPON SYSTEM
**This controls all weapons and bullets!**

**Key Methods:**
- `init(shipIdx)` - Initialize weapon stats
- `fire(time, player, wave, rapidStrike)` - Main firing logic
  - Shotgun: 8 pellets (line ~75)
  - Laser: Continuous beam (line ~84)
  - Standard: Single/double/spread/quad (line ~92)
- `createBullet(...)` - Spawn a bullet
- `updateBullets(dt, enemies)` - Move bullets, homing, ricochet
  - Homing logic: Line ~172
  - Ricochet: Line ~194
- `updateLaser(dt, ...)` - Laser beam damage
  - 600px range, continuous damage

**Want to change bullet speed?** → Line ~68 (`spd` calculation)
**Want to change damage?** → Line ~69 (`dmg` calculation)
**Want to change shotgun pellets?** → Line ~77 (change the `8`)

### 👾 `src/gameplay/enemies.js` (654 lines) - ENEMY SYSTEM
**This controls all enemy types and AI!**

**Enemy Types (13 total):**
- **Basic**: drone, scout, tank, shieldE, swarm
- **Special**: sniper, healer, spawner, bomber, teleporter, kamikaze, artillery
- **Bosses**: boss, boss2, boss3, miniboss

**Key Methods:**
- `spawn(type, wave)` - Create enemy with stats
  - **Drone** (line ~28): HP=30+wave×8, Speed=90+wave×3
  - **Tank** (line ~44): HP=120+wave×22, Speed=52+wave
  - **Boss** (line ~151): HP=800+wave×180
- `update(dt, player, wave)` - Update all enemies
- `updateHealer()` - Heals nearby allies every 2s
- `updateBomber()` - Explodes on contact
- `updateBoss1()` - Orbits and fires ring pattern
- `updateBoss2()` - Spiral movement and shooting
- `updateBoss3()` - Random chase, spawns scouts

**Want to make enemies easier?** → Change HP formulas (line ~30, ~46, etc.)
**Want to change boss patterns?** → Edit `updateBoss*()` methods
**Want to add a new enemy?** → Add a new case in `spawn()` method!

### ⬆️ `src/gameplay/upgrades.js` (201 lines) - UPGRADE SYSTEM
**This controls all upgrades you can choose!**

**16 Upgrade Types:**

**Weapon Upgrades:**
- DUAL SHOT - Fire two bullets
- SPREAD - Three-shot cone
- QUAD SHOT - Four-shot burst
- PIERCING - Bullets pass through
- HOMING - Bullets track enemies
- MEGA BLAST - Every 7th shot explodes
- RICOCHET - Bullets bounce off walls
- SHOTGUN BLAST - 8-pellet spread
- LASER BEAM - Continuous beam
- RAPID FIRE - +18% fire rate
- BULLET SIZE - +40% projectile size

**Player Upgrades:**
- MAX HEALTH - +30 HP
- SPEED UP - +18% movement
- ENERGY SHIELD - +50 shield
- REGEN - +2.2 HP/sec
- QUICK DASH - -30% dash cooldown
- TELEPORT - Dash becomes teleport

**Key Methods:**
- `getPool(weapon, player, stats)` - Generate 3 random upgrades
- `handleClick(...)` - Apply selected upgrade

**Want to add a new upgrade?**
1. Add to the `all` array in `getPool()` (line ~24)
2. Give it a name, description, condition (`ok`), and effect (`apply`)

**Example new upgrade:**
```javascript
{
  name: 'SUPER SPEED',
  desc: 'Double your speed!',
  ok: () => true,  // Always available
  apply: () => { p.speed *= 2; }  // Double speed
}
```

### ✨ `src/gameplay/effects.js` (246 lines) - EFFECTS SYSTEM
**This controls visual effects!**

**Key Methods:**
- `burst(x, y, color, count, speed)` - Particle explosion
  - Used for dashes, enemy deaths, etc.
- `explodeMega(...)` - Large explosion (80+wave×4 radius)
- `spawnPickup(x, y, type)` - Create a pickup
  - **Types**: health, shield, speed, score, slowmo
- `collectPickup(...)` - Apply pickup effect
  - Health: +30 HP
  - Shield: +25 shield
  - Speed: +18% for 5 seconds
  - Score: +15 points (×1.5 with combo)
  - Slowmo: 3.5 seconds of slow-mo
- `shake(amount, duration)` - Camera shake

**Want to change pickup effects?** → Edit `collectPickup()` (line ~56)
**Want more particles?** → Change `count` in `burst()` calls
**Want bigger explosions?** → Edit radius formula (line ~48)

---

## 🎬 SCENES FOLDER - Game Screens

### 📋 `src/scenes/MenuScene.js` (152 lines)
Main menu with ship selection.
- Shows all 3 ships with stats
- Ship preview drawings
- Achievements button
- Start game button

### 🏆 `src/scenes/AchievementsScene.js` (63 lines)
Displays all achievements and unlock status.

### 🎮 `src/scenes/GameScene.js` (779 lines)
**The main game orchestrator!**

This scene **coordinates** all the gameplay systems but doesn't implement them directly. The actual logic is in the `gameplay/` folder!

**Key Responsibilities:**
- Initialize all game systems (player, weapons, enemies, upgrades, effects)
- Run the main game loop (`update()`)
- Handle input (keyboard, mouse)
- Coordinate wave progression
- Draw everything (`draw()` method)

**Methods:**
- `create()` - Set up game
- `update(time, delta)` - Main game loop (60 FPS)
- `nextWave()` - Progress to next wave
- `showUpgradeScreen()` - Show upgrade choices
- `killEnemy(e, idx)` - Handle enemy death
- `die()` - Handle player death
- `draw()` - Render everything

**This file ties everything together but doesn't have the details!**

### 💀 `src/scenes/GameOverScene.js` (40 lines)
Shows final score, wave reached, and stats.

### 🎯 `src/main.js` (20 lines)
Initializes Phaser and starts the game. **You rarely change this!**

---

## 🛠️ Common Changes You Might Want to Make

### 🚀 Change Ship Stats
**File:** `src/config.js`

Find the `SHIPS` array and modify:
```javascript
{
  name: 'VIPER',
  baseHp: 150,      // More health!
  baseSpeed: 300,   // Faster!
  baseDmg: 40,      // More damage!
  baseRate: 100,    // Faster fire rate!
}
```

### 👾 Make Enemies Easier/Harder
**File:** `src/gameplay/enemies.js`

Find `spawn()` method and change HP/speed formulas:
```javascript
case 'drone':
  enemy.hp = 20 + wave * 5;  // Less HP!
  enemy.speed = 70 + wave * 2;  // Slower!
  break;
```

### 💥 Change Weapon Damage
**File:** `src/gameplay/weapons.js`

Line ~69 in the `fire()` method:
```javascript
const dmg = w.dmg + wave * 5;  // More damage per wave!
```

### ⬆️ Add New Upgrade
**File:** `src/gameplay/upgrades.js`

Add to the `all` array in `getPool()` method:
```javascript
{
  name: 'TRIPLE DAMAGE',
  desc: 'Deal 3x damage!',
  ok: () => true,
  apply: () => { w.dmg *= 3; }
}
```

### ✨ Change Particle Effects
**File:** `src/gameplay/effects.js`

Modify `burst()` parameters when calling it:
```javascript
this.burst(x, y, 0xff00ff, 50, 300);  // More particles, faster!
```

### 🎨 Change Colors
**File:** `src/config.js`

Colors are in hex format:
- `0x00ffff` = Cyan
- `0xff0000` = Red
- `0x00ff00` = Green
- `0xffaa00` = Orange
- `0xff00ff` = Magenta

### 🔊 Add New Sound Effect
**File:** `src/utils.js`

Add a new case to `sfx()` function:
```javascript
case 'mySound':
  beep(440, 'sine', 0.1, 0.2);  // freq, type, volume, duration
  break;
```

Then call it: `sfx('mySound')`

---

## 🐛 Debugging Tips

### Game won't load?
1. Open browser console (F12)
2. Look for red error messages
3. Check file paths in `index.html`

### Changed something but nothing happened?
1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. Check console for errors
3. Make sure you saved the file!

### Want to see what's happening?
Add `console.log()` statements:
```javascript
console.log('Player HP:', this.p.hp);
console.log('Enemy count:', this.enemies.length);
```

---

## 📚 File Size Reference

| File | Lines | Purpose |
|------|-------|---------|
| config.js | 106 | Game data |
| utils.js | 389 | Helpers |
| systems.js | 122 | Save/load |
| **gameplay/player.js** | 246 | Player logic |
| **gameplay/weapons.js** | 444 | Weapon logic |
| **gameplay/enemies.js** | 654 | Enemy logic |
| **gameplay/upgrades.js** | 201 | Upgrades |
| **gameplay/effects.js** | 246 | Particles |
| scenes/MenuScene.js | 152 | Menu |
| scenes/AchievementsScene.js | 63 | Achievements |
| **scenes/GameScene.js** | 779 | Main game |
| scenes/GameOverScene.js | 40 | Game over |
| main.js | 20 | Init |
| **TOTAL** | **3,462** | All code |

---

## 🎉 Learning Path

**Want to learn by doing? Try these challenges:**

1. **Beginner**: Change a ship's speed in `config.js`
2. **Beginner**: Change enemy HP in `enemies.js`
3. **Intermediate**: Add a new upgrade in `upgrades.js`
4. **Intermediate**: Create a new pickup type in `effects.js`
5. **Advanced**: Create a new enemy type in `enemies.js`
6. **Advanced**: Add a new weapon type in `weapons.js`

---

## 📖 Learning Resources

- **Phaser Docs**: https://photonstorm.github.io/phaser3-docs/
- **JavaScript Guide**: https://javascript.info/
- **Game Dev for Kids**: https://www.khanacademy.org/computing/computer-programming

---

## 🎉 Have Fun!

Remember: **The best way to learn is by experimenting!**
- Try changing numbers
- See what breaks
- Figure out how to fix it
- Repeat!

Don't be afraid to make mistakes - you can always undo with Git!

**Happy coding! 🚀👾**
