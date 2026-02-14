# CLAUDE.md - AI Assistant Guide for CYBER ARENA

## Project Overview

CYBER ARENA Enhanced Edition (v2.0) is a browser-based 2D space shooter built with **Phaser 3** and **vanilla ES6 JavaScript**. There is no build system, no package manager, and no transpilation — all scripts are loaded directly via `<script>` tags in `index.html`.

## Running the Game

Serve the root directory over HTTP and open in a browser:

```bash
python3 -m http.server 8000
# or
npx http-server
```

Then visit `http://localhost:8000`. Opening `index.html` directly via `file://` will fail due to CORS restrictions on the Phaser CDN script.

## Project Structure

```
spaceshooter/
├── index.html              # Entry point — loads all scripts in dependency order
├── styles/main.css         # Game container styling (25 lines)
├── src/
│   ├── config.js           # Constants: canvas size, ship defs, achievements, upgrades, difficulty
│   ├── utils.js            # Math helpers, drawing functions, audio synthesis
│   ├── systems.js          # localStorage persistence, achievement unlocking
│   ├── main.js             # Phaser.Game initialization (loaded last)
│   ├── gameplay/
│   │   ├── player.js       # PlayerSystem — movement (WASD), dash (Space), damage, regen
│   │   ├── weapons.js      # WeaponSystem — 5 base weapon types + special properties
│   │   ├── enemies.js      # EnemySystem — 12 regular enemy types, 4 boss variants, spawning, AI
│   │   ├── upgrades.js     # UpgradeSystem — 16 mid-game upgrades, selection UI
│   │   └── effects.js      # EffectsSystem — particles, pickups, explosions, screen shake
│   └── scenes/
│       ├── MenuScene.js    # Ship selection, difficulty selection, menu UI
│       ├── GameScene.js    # Main game loop orchestrator (~1077 lines)
│       ├── AchievementsScene.js  # Achievement display screen
│       └── GameOverScene.js      # Game over / score screen
├── CODE_GUIDE.md           # Developer-friendly learning guide
└── README.md               # Minimal readme
```

## Architecture

### Script Load Order (Critical)

Scripts are loaded via `<script>` tags in `index.html` in strict dependency order. Adding a new file requires updating `index.html` in the correct position:

1. Phaser 3 (CDN: `phaser/3.60.0`)
2. `config.js` — global constants (`W`, `H`, `SHIPS`, `ACHIEVEMENTS`, `PERSISTENT_UPGRADES`, `DIFFICULTIES`)
3. `utils.js` — helper functions used everywhere
4. `systems.js` — persistence layer
5. `gameplay/*` — player, weapons, enemies, upgrades, effects
6. `scenes/*` — Menu, Achievements, Game, GameOver
7. `main.js` — creates the `Phaser.Game` instance (must be last)

### System Pattern

Gameplay logic is split into independent **System classes** that are instantiated and orchestrated by `GameScene`:

- `PlayerSystem` — owns the player object, handles movement/dash/damage
- `WeaponSystem` — manages bullets array, firing logic, laser beam
- `EnemySystem` — manages enemies array, spawning waves, AI behaviors
- `UpgradeSystem` — handles between-wave upgrade selection screen
- `EffectsSystem` — manages particles array, pickups, visual effects

Each system receives a reference to the scene and exposes `update(dt)` and `draw(gfx)` methods called from `GameScene`.

### Scene Flow

`MenuScene` → `GameScene` → `GameOverScene` → back to `MenuScene`

`AchievementsScene` is accessible from the menu.

### Game Loop (GameScene.update)

1. Process input (WASD, mouse position, Space for dash)
2. `playerSystem.update(dt)` — movement, dash cooldown, regen
3. `weaponSystem.update(dt)` — fire bullets, update bullet positions
4. `enemySystem.update(dt)` — spawn enemies, run AI, move enemies
5. Collision detection (bullets↔enemies, enemies↔player, pickups↔player)
6. `effectsSystem.update(dt)` — animate particles, manage pickups
7. Score/combo/wave tracking
8. `draw()` — render everything using Phaser Graphics

### Draw Layers (depth order)

| Layer | Graphics Object | Depth | Content |
|-------|----------------|-------|---------|
| Background | `gBg` | 0 | Background and vignette |
| Vignette | `gVig` | 1 | Screen edge darkening |
| Pickups | `gPk` | 3 | Health/shield/score pickups |
| Enemies | `gEn` | 5 | All enemy types |
| Bullets | `gBu` | 7 | Player projectiles |
| Particles | `gPa` | 9 | Explosion particles |
| Player | `gPl` | 10 | Player ship |
| HUD | `gHu` | 20 | Score, health, wave info |
| Upgrades | `gUp` | 30 | Upgrade selection overlay |
| Slow-mo | `gSlow` | 31 | Slow-motion effect overlay |

### Persistence

Uses `localStorage` under key `'cyberArenaEnhanced'`. Managed by `loadPersistent()` and `savePersistent()` in `systems.js`.

**Stored data:**
- `persistentUpgrades` — 4 upgrade types, each with a level (0 to max)
- `achievements` — 10 achievement types, each with `unlocked` boolean
- `totalEnemiesKilled` — lifetime kill counter
- `highScore` — best score achieved
- `selectedShip` — last chosen ship
- `selectedDifficulty` — last chosen difficulty

**Key functions in `systems.js`:**
- `loadPersistent()` / `savePersistent()` — read/write localStorage
- `unlockAchievement(key)` — award achievement and save
- `applyPersistentBonuses(ship)` — calculate ship stats with persistent upgrades applied
- `trackEnemyKill()` — increment kills, check achievement thresholds

## Coding Conventions

- **No build tools** — vanilla JS only, no modules/imports
- **ES6 classes** for systems and scenes; plain functions for utilities
- **Global constants** in UPPER_CASE (`W`, `H`, `SHIPS`, `ACHIEVEMENTS`)
- **camelCase** for variables, functions, and methods
- **Hex color literals** for game rendering (e.g., `0x00ffff`, `0xff6600`)
- **CSS color strings** in config objects (e.g., `'#00ffff'`)
- **JSDoc comments** on major functions and class methods
- **Delta-time based** movement — all speeds multiply by `dt` (seconds)
- Semicolons are inconsistently used — match the style of the file you're editing
- Comments use `//` for inline and `/** */` for doc blocks
- Section separators use `// ====...====` comment bars

## Key Game Data (in config.js)

### Canvas
- Width: 900px (`W`), Height: 680px (`H`)

### Ships (3)

| Ship | Color | HP | Speed | Damage | Fire Rate | Dash CD | Perk |
|------|-------|----|-------|--------|-----------|---------|------|
| VIPER | cyan `#00ffff` | 100 | 240 | 24 | 145ms | 0.75s | RAPID STRIKE — every 8th shot fires instantly |
| TANKS | purple `#7733ff` | 150 | 185 | 22 | 155ms | 0.90s | ARMOR PLATING — reduce damage taken by 30% |
| RAZOR | orange `#ff6600` | 70 | 310 | 28 | 155ms | 0.55s | AFTERBURNER — move 15% faster after dashing |

### Difficulty Modes (4)

| Mode | HP Mult | Speed Mult | Count Mult | Damage Mult | Score Mult |
|------|---------|------------|------------|-------------|------------|
| EASY | 0.7 | 0.85 | 0.7 | 0.7 | 0.75 |
| MEDIUM | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| HARD | 1.4 | 1.15 | 1.5 | 1.3 | 1.5 |
| INSANE | 2.0 | 1.3 | 2.0 | 1.6 | 2.5 |

### Enemy Types (12 regular + 4 bosses)

**Regular enemies:** drone, scout, tank, shieldE, swarm, sniper, healer, spawner, bomber, teleporter, kamikaze, artillery

**Bosses (spawned every 5 waves):**
- `boss` — multi-layered hexagon, orbits center, ring shot attack
- `boss2` — circular body with rotating blades, spiral movement, spread shots
- `boss3` — octagon with pulsing core, spawns scouts in phase 2

**Mini-boss (spawned every 3 waves, except boss waves):**
- `miniboss` — rotating diamond, pulsing orbit, variable firing

All bosses have 2-phase behavior (increased fire rate at low HP). Boss HP scales exponentially (1.14–1.15x multiplier) after wave 10.

### Weapon System

**5 base weapon types:** single → double → spread → quad → shotgun (8-pellet)

**Special weapon properties** (gained via upgrades):
- `pierce` — bullets pass through enemies (75% damage)
- `homing` — bullets track the nearest enemy
- `mega` — every 10th shot explodes (2x damage, AoE)
- `ricochet` — bullets bounce off walls (max 2 bounces)
- `bulletSize` — larger projectiles (+0.4 per upgrade, max 2.0x)

### Mid-Game Upgrades (16 total, 3 offered per wave)

**Weapon upgrades (10):** Dual Shot, Spread, Quad Shot, Ricochet, Shotgun Blast, Rapid Fire (-12% fire interval), Piercing, Homing, Mega Blast, Bullet Size

**Player upgrades (6):** Max Health (+30 HP, max 2x), Speed Up (+18%, max 1.5x base), Energy Shield (+50, max 150), Regen (+1.5/s, max 4.0), Quick Dash (-30% cooldown), Teleport (dash becomes 120px instant teleport)

### Persistent Upgrades (4, purchased between runs)

| Upgrade | Max Level | Bonus per Level | Cost |
|---------|-----------|-----------------|------|
| Max HP Bonus | 5 | +15 HP | 100 |
| Damage Bonus | 5 | +8 damage | 150 |
| Speed Bonus | 5 | +5% speed | 120 |
| Starting Shield | 3 | +20 shield | 180 |

### Achievements (10)

First Blood, Survivor (wave 5), Veteran (wave 10), Legend (wave 20), Boss Slayer, Combo Master (10x), Exterminator (100 kills), Annihilator (500 kills), Untouchable (flawless wave), Fully Loaded (10 upgrades in one run)

### Wave Structure

- **Boss waves** every 5 waves (boss, boss2, boss3 rotate)
- **Mini-boss waves** every 3 waves (except boss waves)
- Regular waves spawn combinations of enemy types with increasing counts and HP

## Audio

Sound effects are generated programmatically using the Web Audio API — see `beep()` and `sfx()` in `utils.js`. There are no audio files; all sounds are synthesized oscillators (sine, square, sawtooth, triangle).

**Available sound effects via `sfx(name)`:** shoot, hit, enemyHit, enemyDie, enemyDieTank, enemyDieScout, enemyDieSniper, dash, pickup, upgrade, slowmo, heartbeat, bossDie, bossBegin, playerDie, shieldHit, shotgun, ricochet, gravityWell, teleport

## Testing

There are no automated tests. All QA is manual — run the game in a browser and verify behavior. When making changes, manually test:

1. Ship selection and difficulty selection in MenuScene
2. Core gameplay loop (movement, shooting, enemy spawning)
3. Upgrade selection between waves
4. Boss encounters (waves 5, 10, 15...)
5. Mini-boss encounters (waves 3, 6, 9... excluding boss waves)
6. Persistence (reload browser, verify saved data)
7. Game over flow and score display
8. Achievement unlocking

## Common Modification Patterns

### Adding a new enemy type
1. Add enemy config/stats to the spawn logic in `src/gameplay/enemies.js`
2. Add drawing logic in the `drawEnemy()` method of `EnemySystem`
3. Add to the wave composition tables in `spawnWave()`

### Adding a new upgrade
1. Define the upgrade in `src/gameplay/upgrades.js`
2. Apply its effect in the relevant system (e.g., `WeaponSystem` for weapon upgrades)
3. If persistent, add to `PERSISTENT_UPGRADES` in `config.js`

### Adjusting game balance
All balance numbers are in `config.js` (ship stats, upgrade costs/bonuses, difficulty multipliers) and at the top of gameplay files (enemy HP scaling, fire rates, damage values).

### Adding a new scene
1. Create `src/scenes/NewScene.js` extending `Phaser.Scene`
2. Add a `<script>` tag in `index.html` before `main.js`
3. Add the scene class to the `scene` array in `src/main.js`

### Adding a new sound effect
1. Add a new case to the `sfx()` function in `src/utils.js`
2. Compose the sound using `beep(freq, type, vol, dur, delay)` calls

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| Phaser 3.60.0 | CDN (`cdnjs.cloudflare.com`) | Game engine (rendering, input, scenes, tweens) |

No npm packages. No other external dependencies.
