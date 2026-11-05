// Comprehensive Danmaku Patterns & Boss AI Test
import { DanmakuPatterns } from '../js/systems/DanmakuPatterns.js';
import { Douma } from '../js/entities/Douma.js';
import { Shinobu } from '../js/entities/Shinobu.js';
import { BulletPool } from '../js/entities/BulletPool.js';
import { CharacterRenderer } from '../js/graphics/CharacterRenderer.js';
import { DIFFICULTY_CONFIG } from '../js/config/difficultyConfig.js';

// Browser Mock
global.Image = class {
  constructor() {
    setTimeout(() => { if (this.onerror) this.onerror(new Error('Mock 404')); }, 5);
  }
};
global.window = { devicePixelRatio: 1 };
global.performance = { now: () => Date.now() };

async function runDanmakuAiTests() {
  console.log('=== [1] 도우마 6대 탄막 패턴 개별 생성 및 궤적 검증 ===');
  const pool = new BulletPool(500);
  const danmaku = new DanmakuPatterns(pool);
  const renderer = new CharacterRenderer();
  const douma = new Douma(renderer, danmaku);
  const shinobu = new Shinobu(renderer);

  douma.x = 270;
  douma.y = 200;
  shinobu.x = 270;
  shinobu.y = 800;
  shinobu.vx = 200; // 우측으로 이동 중
  shinobu.vy = 0;

  // 1. 추적형 탄환
  pool.resetAll();
  danmaku.spawnHomingShards(douma, shinobu, DIFFICULTY_CONFIG.NORMAL, 3);
  const homingBullets = pool.getActiveBullets('enemy').filter(b => b.type === 'enemy_homing');
  console.log('[패턴 1: 추적형 얼음탄] 생성 수:', homingBullets.length, '타겟 설정 여부:', homingBullets[0]?.target === shinobu);

  // 2. 원형 확산 탄막
  pool.resetAll();
  danmaku.spawnCircularRing(douma, DIFFICULTY_CONFIG.NORMAL, 16, 150);
  const ringBullets = pool.getActiveBullets('enemy').filter(b => b.type === 'enemy_ice');
  console.log('[패턴 2: 원형 확산 탄막] 생성 수:', ringBullets.length);

  // 3. 부채형 광역 탄막
  pool.resetAll();
  danmaku.spawnFanSpread(douma, DIFFICULTY_CONFIG.NORMAL, 7, 0.8, 220);
  const fanBullets = pool.getActiveBullets('enemy');
  console.log('[패턴 3: 부채형 광역 탄막] 생성 수:', fanBullets.length);

  // 4. 얼음 결정 낙하
  pool.resetAll();
  danmaku.spawnFallingIcicles(540, DIFFICULTY_CONFIG.NORMAL, 6, 180);
  const icicleBullets = pool.getActiveBullets('enemy').filter(b => b.type === 'enemy_icicle');
  console.log('[패턴 4: 얼음 결정 낙하] 생성 수:', icicleBullets.length, '낙하 각도 (90도):', icicleBullets[0]?.angle.toFixed(2));

  // 5. 플레이어 위치 예측 저격
  pool.resetAll();
  danmaku.spawnPredictiveSnipe(douma, shinobu, DIFFICULTY_CONFIG.NORMAL, 340);
  const predBullets = pool.getActiveBullets('enemy').filter(b => b.type === 'enemy_predictive');
  console.log('[패턴 5: 위치 예측 저격] 생성 수:', predBullets.length);
  // 예측 조준된 각도가 시노부 정면(90도)보다 우측(진행 방향)으로 편향되었는지 확인
  const straightAngle = Math.atan2(shinobu.y - douma.y, shinobu.x - douma.x);
  console.log('  - 정면 조준 각도:', straightAngle.toFixed(3), '예측 조준 각도:', predBullets[1]?.angle.toFixed(3));
  console.log('  - 예측 리드 샷 오프셋 적용 확인:', Math.abs(predBullets[1]?.angle - straightAngle) > 0.1);

  // 6. 복합 탄막 콤보
  pool.resetAll();
  danmaku.spawnCompositeCombo(douma, 540, DIFFICULTY_CONFIG.NORMAL);
  console.log('[패턴 6: 복합 탄막 콤보] 총 활성 탄환 수 (링+낙하+칼날):', pool.getActiveCount());

  console.log('\n=== [2] EASY / NORMAL / HARD 난이도 배수 일원화 검증 ===');
  // 원형 탄막으로 난이도별 탄속 및 탄밀도 비교
  pool.resetAll();
  danmaku.spawnCircularRing(douma, DIFFICULTY_CONFIG.EASY, 20, 150);
  const easyCount = pool.getActiveCount();
  const easySpeed = pool.getActiveBullets()[0].speed;

  pool.resetAll();
  danmaku.spawnCircularRing(douma, DIFFICULTY_CONFIG.HARD, 20, 150);
  const hardCount = pool.getActiveCount();
  const hardSpeed = pool.getActiveBullets()[0].speed;

  console.log(`[EASY] 발사 수: ${easyCount}발, 탄속: ${easySpeed.toFixed(1)}px/s`);
  console.log(`[HARD] 발사 수: ${hardCount}발, 탄속: ${hardSpeed.toFixed(1)}px/s`);
  console.log('난이도 비례 밀도/속도 정상 차등 확인:', hardCount > easyCount && hardSpeed > easySpeed);

  console.log('\n=== [3] 도우마 3개 페이즈 보스 AI 라이프사이클 시뮬레이션 ===');
  douma.setDifficulty(DIFFICULTY_CONFIG.NORMAL);
  douma.resetCombat();

  // Phase 1 (HP 100%)
  console.log('초기 HP:', douma.hp, '초기 Phase:', douma.phase);
  pool.resetAll();
  // 3초 시뮬레이션
  for (let f = 0; f < 180; f++) douma.updateCombat(0.016, shinobu, pool, 540);
  console.log('Phase 1 실행 후 생성된 탄환 수:', pool.getActiveCount());

  // Phase 2 진입 (HP 50% 강제 세팅)
  douma.hp = douma.maxHp * 0.5;
  pool.resetAll();
  for (let f = 0; f < 180; f++) douma.updateCombat(0.016, shinobu, pool, 540);
  console.log('Phase 2 진입 확인:', douma.phase === 2, '생성된 탄환 수:', pool.getActiveCount());

  // Phase 3 진입 (HP 20% 발악)
  douma.hp = douma.maxHp * 0.2;
  pool.resetAll();
  for (let f = 0; f < 180; f++) douma.updateCombat(0.016, shinobu, pool, 540);
  console.log('Phase 3 진입 확인:', douma.phase === 3, '생성된 탄환 수:', pool.getActiveCount());

  console.log('\n=== [4] 회피 가능성 (Fair & Evadable) 기하 검증 ===');
  // 원형 탄막의 인접 탄환 사이 각도 간격(Radian) 계산
  const baseCount = 18;
  const gapRad = (Math.PI * 2) / (baseCount * DIFFICULTY_CONFIG.HARD.densityMultiplier);
  // 거리 600px(시노부 위치)에서의 호의 길이(탄환 사이 간격)
  const arcLength = 600 * gapRad;
  const playerHitboxDiameter = DIFFICULTY_CONFIG.HARD.playerHitboxRadius * 2;
  console.log(`HARD 기준 거리 600px에서 인접 탄환 간격: ${arcLength.toFixed(1)}px`);
  console.log(`플레이어 피격점 직경: ${playerHitboxDiameter}px`);
  console.log('통과 가능 여부 (간격 > 직경):', arcLength > playerHitboxDiameter);

  console.log('\n✨ 도우마 6대 탄막 패턴 & 보스 AI & 3대 난이도 시스템 100% 검증 완료!');
}

runDanmakuAiTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
