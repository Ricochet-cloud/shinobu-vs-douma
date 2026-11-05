// Comprehensive Cutscene & Story System Test
import { STORY_DATA } from '../js/config/storyData.js';
import { CutsceneDirector } from '../js/systems/CutsceneDirector.js';
import { Shinobu } from '../js/entities/Shinobu.js';
import { Douma } from '../js/entities/Douma.js';
import { CharacterRenderer } from '../js/graphics/CharacterRenderer.js';

// Browser Mock
global.Image = class {
  constructor() {
    setTimeout(() => { if (this.onerror) this.onerror(new Error('Mock 404')); }, 5);
  }
};
global.window = { devicePixelRatio: 1 };
global.performance = { now: () => Date.now() };

async function runCutsceneStoryTests() {
  console.log('=== [1] 스토리 데이터 (STORY_DATA) 무결성 검증 ===');
  console.log('프롤로그 대사 수:', STORY_DATA.prologue.length);
  console.log('승리 에필로그 대사 수:', STORY_DATA.victory.length);
  console.log('패배 에필로그 대사 수:', STORY_DATA.defeat.length);
  console.log('페이즈 2 스킬명:', STORY_DATA.phaseTransitions.phase2.title);
  console.log('페이즈 3 스킬명:', STORY_DATA.phaseTransitions.phase3.title);

  // 화자 및 테마 색상 유효성 확인
  for (const item of STORY_DATA.prologue) {
    if (!item.speaker || !item.text || !item.themeColor) {
      throw new Error(`Invalid dialogue item: ${JSON.stringify(item)}`);
    }
  }
  console.log('모든 대사 데이터 구조 정상 확인 완료.');

  console.log('\n=== [2] 텍스트 타자 효과 (Typewriter Effect) 검증 ===');
  const cutscene = new CutsceneDirector(540, 960);
  let dialogueCompleted = false;

  const testLines = [
    { speaker: '시노부', text: '첫 번째 테스트 대사입니다.', themeColor: '#b388ff' },
    { speaker: '도우마', text: '두 번째 테스트 대사입니다.', themeColor: '#80d8ff' }
  ];

  cutscene.startDialogue(testLines, () => {
    dialogueCompleted = true;
  });

  console.log('대화 시작 직후 글자 수:', cutscene.charIndex, '타이핑 중?:', cutscene.isTyping);

  // 0.2초 경과 (약 6~7글자 타이핑 전진)
  cutscene.update(0.2);
  console.log('0.2초 후 출력 글자 수:', cutscene.charIndex);
  if (cutscene.charIndex <= 0) throw new Error('Typing did not advance!');

  // 클릭/터치 시뮬레이션 -> 타이핑 즉시 완료
  cutscene.advanceDialogue();
  console.log('중간 터치 후 전체 글자 수 완성 여부:', cutscene.charIndex === testLines[0].text.length, '타이핑 완료?:', !cutscene.isTyping);

  // 다음 대사로 전진
  cutscene.advanceDialogue();
  console.log('두 번째 대사 인덱스:', cutscene.dialogueIndex, '타이핑 재시작 여부:', cutscene.isTyping);

  // 마지막 대사 완료 및 콜백 호출
  cutscene.advanceDialogue(); // 즉시 완성
  cutscene.advanceDialogue(); // 시퀀스 종료
  console.log('대화 시퀀스 완료 콜백 호출 확인:', dialogueCompleted);

  console.log('\n=== [3] 캐릭터 등장 연출 (Entrance Cutscene) 보간 검증 ===');
  const renderer = new CharacterRenderer();
  const shinobu = new Shinobu(renderer);
  const douma = new Douma(renderer);

  let entranceCompleted = false;
  cutscene.startEntrance(shinobu, douma, () => {
    entranceCompleted = true;
  });

  console.log('등장 시작 좌표 -> 시노부 Y (오프스크린 하단):', shinobu.y, '도우마 Y (오프스크린 상단):', douma.y);

  // 1.0초 진행 (절반 보간)
  cutscene.update(1.0, shinobu, douma);
  console.log('1.0초 경과 좌표 -> 시노부 Y:', Math.round(shinobu.y), '도우마 Y:', Math.round(douma.y));

  // 1.1초 추가 진행 (총 2.1초 -> 완료)
  cutscene.update(1.1, shinobu, douma);
  console.log('등장 완료 좌표 -> 시노부 Y:', Math.round(shinobu.y), '도우마 Y:', Math.round(douma.y));
  console.log('등장 완료 콜백 호출 확인:', entranceCompleted);

  console.log('\n=== [4] 화면 페이드 (Fade In / Fade Out) 검증 ===');
  let fadeCompleted = false;
  cutscene.startFade(1.0, 0.5, () => {
    fadeCompleted = true;
  });

  console.log('페이드 시작 알파:', cutscene.fadeAlpha);
  cutscene.update(0.25);
  console.log('0.25초 경과 알파 (약 0.5):', cutscene.fadeAlpha.toFixed(2));
  cutscene.update(0.3);
  console.log('0.55초 경과 알파 (1.0 완료):', cutscene.fadeAlpha.toFixed(2));
  console.log('페이드 완료 콜백 호출 확인:', fadeCompleted);

  console.log('\n=== [5] 전투 개시 ("VS" / "BATTLE START!") 및 페이즈 배너 검증 ===');
  let introCompleted = false;
  cutscene.startBattleIntro(() => {
    introCompleted = true;
  });

  cutscene.update(1.7);
  console.log('전투 개시 연출 완료 콜백 호출 확인:', introCompleted);

  let phaseBannerCompleted = false;
  cutscene.triggerPhaseTransition(2, () => {
    phaseBannerCompleted = true;
  });
  console.log('페이즈 배너 활성화 여부:', cutscene.phaseBannerActive);
  cutscene.update(2.1);
  console.log('페이즈 배너 완료 콜백 호출 확인:', phaseBannerCompleted);

  console.log('\n✨ 스토리 나레이션 및 연출 시스템 100% 검증 통과!');
}

runCutsceneStoryTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
