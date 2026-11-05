import fs from 'fs';
import path from 'path';

const files = [
  '../js/config/characterConfigs.js',
  '../js/config/backgroundConfig.js',
  '../js/config/difficultyConfig.js',
  '../js/config/storyData.js',
  '../js/core/AssetManager.js',
  '../js/core/GameLoop.js',
  '../js/graphics/Animation.js',
  '../js/graphics/SpriteSheet.js',
  '../js/graphics/ProceduralCharacterRenderer.js',
  '../js/graphics/CharacterRenderer.js',
  '../js/graphics/BackgroundRenderer.js',
  '../js/entities/Entity.js',
  '../js/entities/Character.js',
  '../js/entities/Shinobu.js',
  '../js/entities/Douma.js',
  '../js/entities/Bullet.js',
  '../js/entities/BulletPool.js',
  '../js/systems/DanmakuPatterns.js',
  '../js/systems/CombatSystem.js',
  '../js/systems/CutsceneDirector.js',
  '../js/ui/CombatHud.js',
  '../js/main.js'
];

async function check() {
  console.log('Testing ES Module imports and syntax...');
  let hasError = false;

  for (const file of files) {
    try {
      // Dynamic import to test ESM parsing
      await import(path.resolve(file));
      console.log(`[PASS] ${file}`);
    } catch (err) {
      // DOM-specific errors like window / Image / document are expected in pure node,
      // but syntax errors or unresolved local imports are real errors.
      if (err instanceof SyntaxError) {
        console.error(`[SYNTAX ERROR] in ${file}:`, err);
        hasError = true;
      } else if (err.code === 'ERR_MODULE_NOT_FOUND') {
        console.error(`[MODULE NOT FOUND] in ${file}:`, err);
        hasError = true;
      } else {
        // ReferenceError: window/document is not defined -> syntax is fine!
        console.log(`[PASS (Syntax valid, Browser API referenced)] ${file}: ${err.name}`);
      }
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log('\nAll files passed syntax and module resolution validation!');
  }
}

check();
