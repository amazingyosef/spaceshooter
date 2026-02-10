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

Then visit `http://localhost:8000`. Opening `index.html` directly via `file://` may fail due to CORS restrictions on the Phaser CDN script.

## Project Structure

```
spaceshooter/
├── index.html              # Entry point — loads all scripts in dependency order
├── styles/main.css         # Game container styling
├── src/
│   ├── config.js           # Constants: canvas size (900x680), ship defs, achievements, upgrades
│   ├── utils.js            # Math helpers, drawing functions, audio (beep/sfx)
│   ├── systems.js          # localStorage persistence, achievement unlocking
│   ├── main.js             # Phaser.Game initialization (loaded last)
│   ├── gameplay/
│   │   ├── player.js       # PlayerSystem — movement (WASD), dash (Space), damage, regen
│   │   ├── weapons.js      # WeaponSystem — 6 weapon types, bullets, laser, gravity wells
│   │   ├── enemies.js      # EnemySystem — 13+ enemy types, 4 bosses, spawning, AI
│   │   ├── upgrades.js     # UpgradeSystem — 16 mid-game upgrades, selection UI
│   │   └── effects.js      # EffectsSystem — particles, pickups, explosions, screen shake
│   └── scenes/
│       ├── MenuScene.js    # Ship selection menu
│       ├── GameScene.js    # Main game loop orchestrator (~1090 lines)
│       ├── AchievementsScene.js  # Achievement display screen
│       └── GameOverScene.js      # Game over / score screen
├── CODE_GUIDE.md           # Developer-friendly learning guide
└── README.md               # Minimal readme
```

## Architecture

### Script Load Order (Critical)

Scripts are loaded via `<script>` tags in `index.html` in strict dependency order. Adding a new file requires updating `index.html` in the correct position:

1. Phaser 3 (CDN: `phaser/3.60.0`)
2. `config.js` — global constants (`W`, `H`, `SHIPS`, `ACHIEVEMENTS`, `PERSISTENT_UPGRADES`)
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
7. Score/combo tracking
8. `draw()` — render everything using Phaser Graphics

### Persistence

Uses `localStorage` under key `'cyberArenaEnhanced'`. Stores persistent upgrades, achievements, high score, total kills, and selected ship. Managed by `loadPersistent()` and `savePersistent()` in `systems.js`.

## Coding Conventions

- **No build tools** — vanilla JS only, no modules/imports
- **ES6 classes** for systems and scenes; plain functions for utilities
- **Global constants** in UPPER_CASE (`W`, `H`, `SHIPS`, `ACHIEVEMENTS`)
- **camelCase** for variables, functions, and methods
- **Hex color literals** for game colors (e.g., `0x00ffff`, `0xff6600`)
- **CSS color strings** in config objects (e.g., `'#00ffff'`)
- **JSDoc comments** on major functions and class methods
- **Delta-time based** movement — all speeds multiply by `dt` (seconds)
- **No semicolons are sometimes omitted** — the codebase is inconsistent; match the style of the file you're editing
- Comments use `//` for inline and `/** */` for doc blocks
- Section separators use `// ====...====` comment bars

## Key Game Data (in config.js)

- **Canvas**: 900x680 pixels
- **3 Ships**: VIPER (balanced/cyan), TANKS (heavy/purple), RAZOR (fast/orange)
- **13+ enemy types**: drone, scout, tank, shield, swarm, sniper, healer, spawner, bomber, teleporter, kamikaze, artillery, plus bosses
- **Boss waves** every 5 waves; mini-boss waves every 3 (except boss waves)
- **16 upgrade types**: weapon upgrades (dual shot, spread, laser, homing, etc.) and player upgrades (health, speed, shield, regen, dash)
- **10 achievements** tracked persistently

## Testing

There are no automated tests. All QA is manual — run the game in a browser and verify behavior. When making changes, manually test:

1. Ship selection in MenuScene
2. Core gameplay loop (movement, shooting, enemy spawning)
3. Upgrade selection between waves
4. Boss encounters (waves 5, 10, 15...)
5. Persistence (reload browser, verify saved data)
6. Game over flow and score display

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
All balance numbers are in `config.js` (ship stats, upgrade costs/bonuses) and at the top of gameplay files (enemy HP scaling, fire rates, damage values).

### Adding a new scene
1. Create `src/scenes/NewScene.js` extending `Phaser.Scene`
2. Add a `<script>` tag in `index.html` before `main.js`
3. Add the scene class to the `scene` array in `src/main.js`

## Audio

Sound effects are generated programmatically using the Web Audio API — see `beep()` and `sfx()` in `utils.js`. There are no audio files; all sounds are synthesized oscillators (sine, square, sawtooth, triangle).

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| Phaser 3.60.0 | CDN | Game engine (rendering, input, scenes, tweens) |

No npm packages. No other external dependencies.
