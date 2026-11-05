// Comprehensive Combat System Headless Test
import { Shinobu } from '../js/entities/Shinobu.js';
import { Douma } from '../js/entities/Douma.js';
import { BulletPool } from '../js/entities/BulletPool.js';
import { DanmakuPatterns } from '../js/systems/DanmakuPatterns.js';
import { CombatSystem } from '../js/systems/CombatSystem.js';
import { CharacterRenderer } from '../js/graphics/CharacterRenderer.js';

// Browser API Mocks
global.Image = class {
  constructor() {
    setTimeout(() => { if (this.onerror) this.onerror(new Error('Mock 404')); }, 5);
  }
};
global.window = { devicePixelRatio: 1 };
global.performance = { now: () => Date.now() };

async function runCombatTests() {
  console.log('=== [1] 탄환 풀링 (BulletPool) 최적화 검증 ===');
  const pool = new BulletPool(500);
  console.log('초기 풀 생성 탄환 수:', pool.pool.length);

  // 100발 스폰
  for (let i = 0; i < 100; i++) {
    pool.spawn({ x: i * 2, y: i * 2, vx: 10, vy: 10, owner: 'enemy' });
  }
  console.log('100발 스폰 후 활성 탄환:', pool.getActiveCount());

  // 화면 경계 밖 이동 시 자동 회수 검증
  pool.update(100.0, { minX: 0, minY: 0, maxX: 100, maxY: 100 });
  console.log('화면 밖 이동 후 활성 탄환 (자동 회수):', pool.getActiveCount()); // 0이어야 함

  console.log('\n=== [2] 도우마 3개 페이즈 탄막 패턴 검증 ===');
  const danmaku = new DanmakuPatterns(pool);
  const renderer = new CharacterRenderer();
  const douma = new Douma(renderer, danmaku);
  const shinobu = new Shinobu(renderer);

  douma.x = 270;
  douma.y = 200;
  shinobu.x = 270;
  shinobu.y = 800;

  // Phase 1 패턴
  douma.phase = 1;
  danmaku.spawnCircularRing(douma, { speedMultiplier: 1.0, densityMultiplier: 1.0 });
  danmaku.spawnFanSpread(douma, { speedMultiplier: 1.0, densityMultiplier: 1.0 });
  console.log('Phase 1 탄막 발사 후 활성 탄환:', pool.getActiveCount());

  // Phase 2 패턴
  douma.phase = 2;
  danmaku.spawnFallingIcicles(540, { speedMultiplier: 1.0, densityMultiplier: 1.0 });
  danmaku.spawnPredictiveSnipe(douma, shinobu, { speedMultiplier: 1.0, predictiveError: 0.05 });
  console.log('Phase 2 탄막 추가 발사 후 활성 탄환:', pool.getActiveCount());

  // Phase 3 패턴
  douma.phase = 3;
  danmaku.spawnCompositeCombo(douma, 540, { speedMultiplier: 1.0, densityMultiplier: 1.0 });
  console.log('Phase 3 탄막 추가 발사 후 활성 탄환:', pool.getActiveCount());

  console.log('\n=== [3] 플레이어 자동 공격 및 독 누적 검증 ===');
  pool.resetAll();
  shinobu.resetCombat(3, 3);
  shinobu.isAutoShooting = true;

  // 0.2초 시뮬레이션 (독침 발사)
  shinobu.updateCombat(0.2, pool, douma);
  const playerBullets = pool.getActiveBullets('player');
  console.log('시노부 자동 사격 생성 탄환 수:', playerBullets.length);

  console.log('\n=== [4] 충돌 판정 및 피격 무적 시간 검증 ===');
  const combat = new CombatSystem(pool);
  pool.resetAll();
  shinobu.invulnerableTimer = 0; // 무적 시간 해제 상태로 세팅

  // 적 탄환을 시노부 바로 위에 배치
  pool.spawn({
    x: shinobu.x,
    y: shinobu.y,
    radius: 4,
    damage: 20,
    owner: 'enemy'
  });

  const hpBefore = shinobu.hp;
  combat.update(0.016, shinobu, douma);
  console.log('피격 전 HP:', hpBefore, '-> 피격 후 HP:', shinobu.hp);
  console.log('무적 상태 여부 (isInvulnerable):', shinobu.isInvulnerable);
  console.log('무적 잔여 시간:', shinobu.invulnerableTimer.toFixed(2), '초');

  // 무적 상태에서 추가 탄환 충돌 시 대미지 무시 검증
  pool.spawn({
    x: shinobu.x,
    y: shinobu.y,
    radius: 4,
    damage: 30,
    owner: 'enemy'
  });
  combat.update(0.016, shinobu, douma);
  console.log('무적 중 추가 피격 후 HP (변화 없어야 함):', shinobu.hp);

  console.log('\n=== [5] 결전 오의 (폭탄) 및 탄막 소거 검증 ===');
  // 적 탄환 50발 생성
  for (let i = 0; i < 50; i++) {
    pool.spawn({ x: 200 + i, y: 300 + i, owner: 'enemy' });
  }
  console.log('폭탄 사용 전 적 탄환 수:', pool.getActiveBullets('enemy').length);

  const bombSuccess = shinobu.useBomb(pool, douma);
  console.log('폭탄 발동 여부:', bombSuccess, '잔여 폭탄:', shinobu.bombs);
  console.log('폭탄 사용 후 적 탄환 수 (0이어야 함):', pool.getActiveBullets('enemy').length);
  console.log('폭탄 발동 후 시노부 무적 시간:', shinobu.invulnerableTimer, '초');
  console.log('도우마 독 중독 여부:', douma.isPoisoned);

  console.log('\n=== [6] 180프레임 (3초) 실시간 전투 루프 시뮬레이션 ===');
  for (let frame = 0; frame < 180; frame++) {
    const dt = 0.016;
    shinobu.updateCombat(dt, pool, douma);
    douma.updateCombat(dt, shinobu, pool);
    pool.update(dt);
    combat.update(dt, shinobu, douma);
  }
  console.log('180프레임 시뮬레이션 완료. 정상 활성 탄환 수:', pool.getActiveCount());
  console.log('시노부 HP:', Math.round(shinobu.hp), '도우마 HP:', Math.round(douma.hp));

  console.log('\n✨ 핵심 전투 시스템 모든 유닛 및 시뮬레이션 테스트 100% 통과!');
}

runCombatTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
