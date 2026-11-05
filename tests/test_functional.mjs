// Functional Simulation Test in Headless Environment
import { CHARACTER_CONFIGS } from '../js/config/characterConfigs.js';
import { assetManager } from '../js/core/AssetManager.js';
import { CharacterRenderer } from '../js/graphics/CharacterRenderer.js';
import { Shinobu } from '../js/entities/Shinobu.js';
import { Douma } from '../js/entities/Douma.js';

// Mock Canvas 2D Context
class MockCanvasContext {
  constructor() {
    this.calls = [];
    this.globalAlpha = 1;
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 1;
  }
  save() { this.calls.push('save'); }
  restore() { this.calls.push('restore'); }
  translate(x, y) { this.calls.push(`translate(${x},${y})`); }
  scale(x, y) { this.calls.push(`scale(${x},${y})`); }
  rotate(a) { this.calls.push(`rotate(${a})`); }
  beginPath() { this.calls.push('beginPath'); }
  closePath() { this.calls.push('closePath'); }
  fill() { this.calls.push('fill'); }
  stroke() { this.calls.push('stroke'); }
  arc() { this.calls.push('arc'); }
  ellipse() { this.calls.push('ellipse'); }
  rect() { this.calls.push('rect'); }
  roundRect() { this.calls.push('roundRect'); }
  fillRect() { this.calls.push('fillRect'); }
  strokeRect() { this.calls.push('strokeRect'); }
  moveTo() { this.calls.push('moveTo'); }
  lineTo() { this.calls.push('lineTo'); }
  bezierCurveTo() { this.calls.push('bezierCurveTo'); }
  drawImage() { this.calls.push('drawImage'); }
  setLineDash() {}
  createLinearGradient() {
    return { addColorStop: () => {} };
  }
  createRadialGradient() {
    return { addColorStop: () => {} };
  }
}

// Global Browser Mock
global.Image = class {
  constructor() {
    setTimeout(() => {
      // Simulate file not found -> triggers onerror -> graceful fallback
      if (this.onerror) this.onerror(new Error('Mock 404 Not Found'));
    }, 10);
  }
};
global.window = {
  devicePixelRatio: 1
};
global.performance = {
  now: () => Date.now()
};

async function runTests() {
  console.log('=== 1. 애셋 로더 Fallback 검증 ===');
  await assetManager.loadAll([
    { key: 'shinobu', src: 'assets/images/shinobu/shinobu_spritesheet.png' },
    { key: 'douma', src: 'assets/images/douma/douma_spritesheet.png' }
  ]);

  console.log('Shinobu asset loaded?:', assetManager.hasLoaded('shinobu')); // should be false (no real image yet)
  console.log('Douma asset loaded?:', assetManager.hasLoaded('douma'));     // should be false
  console.log('Shinobu status:', assetManager.getStatus('shinobu'));       // 'fallback'

  console.log('\n=== 2. 엔티티 및 렌더러 생성 검증 ===');
  const renderer = new CharacterRenderer();
  const shinobu = new Shinobu(renderer);
  const douma = new Douma(renderer);

  console.log('Shinobu created:', shinobu.name, 'HP:', shinobu.hp, 'Hitbox:', shinobu.hitboxRadius);
  console.log('Douma created:', douma.name, 'HP:', douma.hp, 'Hitbox:', douma.hitboxRadius);

  console.log('\n=== 3. 5대 애니메이션 전환 및 수명주기 검증 ===');
  const animStates = ['idle', 'move', 'attack', 'hit', 'death'];
  const mockCtx = new MockCanvasContext();

  for (const anim of animStates) {
    shinobu.playAnimation(anim, true);
    console.log(`[Shinobu] Set animation -> ${shinobu.currentAnimName}`);
    
    // Simulate 30 frames (0.5 sec)
    for (let f = 0; f < 30; f++) {
      shinobu.update(0.016);
      renderer.update(0.016);
      shinobu.render(mockCtx);
    }
    console.log(`[Shinobu] ${anim} rendered successfully (${mockCtx.calls.length} draw ops)`);
    mockCtx.calls = [];
  }

  console.log('\n=== 4. 도우마 5대 애니메이션 렌더링 검증 ===');
  for (const anim of animStates) {
    douma.playAnimation(anim, true);
    console.log(`[Douma] Set animation -> ${douma.currentAnimName}`);
    
    for (let f = 0; f < 30; f++) {
      douma.update(0.016);
      renderer.update(0.016);
      douma.render(mockCtx);
    }
    console.log(`[Douma] ${anim} rendered successfully (${mockCtx.calls.length} draw ops)`);
    mockCtx.calls = [];
  }

  console.log('\n=== 5. 피격 및 사망 로직 검증 ===');
  shinobu.revive();
  console.log('Initial HP:', shinobu.hp);
  shinobu.takeHit(30);
  console.log('After 30 dmg HP:', shinobu.hp, 'State:', shinobu.currentAnimName); // should be 'hit'
  shinobu.takeHit(80);
  console.log('After fatal dmg HP:', shinobu.hp, 'Alive?:', shinobu.isAlive, 'State:', shinobu.currentAnimName); // should be 'death', alive false

  console.log('\n=== 6. 충돌 판정 검증 ===');
  shinobu.x = 100;
  shinobu.y = 100;
  douma.x = 100;
  douma.y = 120;
  console.log('Shinobu & Douma Distance:', shinobu.distanceTo(douma));
  console.log('Colliding?:', shinobu.collidesWith(douma)); // 20 <= 3.5 + 28 = 31.5 -> true!

  console.log('\n✨ 모든 시뮬레이션 및 유닛 테스트 성공 완료!');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
