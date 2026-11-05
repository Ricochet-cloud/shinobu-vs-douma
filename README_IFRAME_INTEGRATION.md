# 게임 iframe 통합 - 전체 구현 완료

## 📋 개요

게임이 다음과 같이 구현되었습니다:

✅ **독립 실행 가능** - 일반 웹 페이지로 직접 열 수 있음
✅ **iframe 임베드 가능** - 커플카드 사이트에 iframe으로 통합
✅ **postMessage 통신** - 안전한 부모-자식 페이지 메시지 교환
✅ **보안 검증** - Origin 검증, 메시지 데이터 검증
✅ **보상 분리** - 게임은 보상 처리를 하지 않음 (부모/서버에서 처리)

## 🏗️ 아키텍처

```
게임 (iframe)          부모 페이지                 백엔드 서버
    │                    │                           │
    ├──GAME_START───────>│ 게임 시작 감지              │
    │                    │                           │
    ├──GAME_CLEAR───────>│ 클리어 이벤트              │
    │                    ├──API 요청────────────────>│
    │                    │<──보상 지급────────────────┤
    │                    │                           │
    └──GAME_OVER───────>│ 게임 오버 이벤트          │
```

## 📁 파일 구조

```
douma-vs-shinobu/
├── index.html                           # 게임 메인 페이지
├── js/
│   ├── main.js                         # 게임 진입점 (✨ GameMessenger 통합)
│   ├── core/
│   │   └── GameMessenger.js            # ✨ NEW: postMessage 통신 시스템
│   ├── entities/
│   ├── systems/
│   ├── graphics/
│   └── ui/
├── css/
├── assets/
├── QUICK_START.md                       # ✨ NEW: 빠른 시작 (5분)
├── IFRAME_INTEGRATION.md                # ✨ NEW: 상세 통합 가이드
├── DEPLOYMENT.md                        # ✨ NEW: 보안 & 배포 가이드
└── examples/
    ├── parent-page-example.html         # ✨ NEW: iframe 부모 페이지 예제
    └── backend-reward-validation.py     # ✨ NEW: 백엔드 검증 로직
```

## 🚀 빠른 시작

### 1분 안에 시작하기

```html
<!-- 부모 페이지 -->
<iframe src="https://your-domain.com/game/index.html"></iframe>

<script>
window.addEventListener('message', (e) => {
  if (e.data.type === 'GAME_CLEAR') {
    // 보상 처리
    fetch('/api/rewards', {
      method: 'POST',
      body: JSON.stringify(e.data.payload)
    });
  }
});
</script>
```

자세한 내용: [QUICK_START.md](QUICK_START.md)

## 🔐 보안 기능

### 1. Origin 검증
```javascript
// GameMessenger가 자동으로 처리
const messenger = new GameMessenger({
  trustedOrigins: [
    'https://www.your-couple-card-site.com',
    'https://your-couple-card-site.com'
  ]
});
```

### 2. 메시지 데이터 검증
- 게임은 구조화된 데이터만 전송
- 검증 토큰 포함 (백엔드 재검증용)
- 타임스탬프 기록

### 3. 보상 처리 분리
- 게임은 보상을 직접 처리하지 않음
- GAME_CLEAR 이벤트만 전송
- 부모 페이지/백엔드에서 재검증 및 지급

```python
# 백엔드 검증 예제 (examples/backend-reward-validation.py 참조)
def validate_game_clear(data):
    # 1. 점수 범위 검증
    # 2. 플레이 시간 검증
    # 3. 사용자별 일일 제한 검증
    # 4. 부정행위 탐지
    # ...
    return reward_amount
```

## 🎮 게임 이벤트

### GAME_START
게임 전투 시작 시 발생

```javascript
{
  type: 'GAME_START',
  payload: {
    difficulty: 'NORMAL',        // EASY, NORMAL, HARD
    difficultyLevel: 'NORMAL',
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

### GAME_CLEAR
게임 성공 클리어 시 발생 (⭐ 보상 처리 시작)

```javascript
{
  type: 'GAME_CLEAR',
  payload: {
    difficulty: 'NORMAL',
    player_score: 2500,           // 계산된 점수
    player_hp: 85,                // 남은 HP (0-100)
    player_lives: 1,              // 남은 목숨
    boss_phase: 3,                // 도우마 페이즈 (1-3)
    play_time: 145,               // 플레이 시간 (초)
    verification_token: 'base64...', // 검증용 토큰
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

### GAME_OVER
게임 오버 (패배) 시 발생

```javascript
{
  type: 'GAME_OVER',
  payload: {
    difficulty: 'NORMAL',
    player_hp: 0,
    player_lives: 0,
    boss_phase: 2,
    play_time: 87,
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

### GAME_RESTART
게임 재시작 시 발생

```javascript
{
  type: 'GAME_RESTART',
  payload: {
    difficulty: 'NORMAL',
    timestamp: 1699123456789
  }
}
```

### DIFFICULTY_CHANGED
난이도 변경 시 발생

```javascript
{
  type: 'DIFFICULTY_CHANGED',
  payload: {
    difficulty: 'HARD',
    timestamp: 1699123456789
  }
}
```

## 📚 문서

| 문서 | 목적 | 읽기 시간 |
|------|------|---------|
| [QUICK_START.md](QUICK_START.md) | 5분 안에 시작 | 5분 |
| [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md) | 상세 통합 가이드 | 15분 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 보안 & 배포 | 20분 |
| [examples/parent-page-example.html](examples/parent-page-example.html) | 부모 페이지 예제 | 참고용 |
| [examples/backend-reward-validation.py](examples/backend-reward-validation.py) | 백엔드 구현 | 참고용 |

## 💡 구현 포인트

### GameMessenger 클래스
**위치**: `js/core/GameMessenger.js`

주요 메서드:
```javascript
// postMessage 전송
messenger.sendToParent(type, payload)

// 특정 이벤트 발생
messenger.notifyGameStart(difficulty)
messenger.notifyGameClear(difficulty, playerStats)
messenger.notifyGameOver(difficulty, playerStats)
messenger.notifyGameRestart(difficulty)
messenger.notifyDifficultyChange(difficulty)

// Origin 관리
messenger.addTrustedOrigin(origin)
messenger.getTrustedOrigins()

// 상태 확인
messenger.isEmbedded()  // iframe 여부
```

### main.js 통합 포인트

1. **GameMessenger 초기화** (constructor)
```javascript
this.messenger = new GameMessenger({
  trustedOrigins: [...]
});
```

2. **GAME_START 이벤트** (startCombat)
```javascript
this.gameStartTime = Date.now();
this.messenger.notifyGameStart(this.currentDifficulty);
```

3. **GAME_CLEAR 이벤트** (handleVictory)
```javascript
this.messenger.notifyGameClear(this.currentDifficulty, {
  hp: this.shinobu.hp,
  lives: this.shinobu.lives,
  score: this._calculateScore(),
  bossPhase: this.douma.phase,
  playTime: this.playTime
});
```

4. **GAME_OVER 이벤트** (handleDefeat)
```javascript
this.messenger.notifyGameOver(this.currentDifficulty, {
  hp: this.shinobu.hp,
  lives: this.shinobu.lives,
  bossPhase: this.douma.phase,
  playTime: this.playTime
});
```

## ✅ 체크리스트

### 개발 환경
- [x] GameMessenger 구현
- [x] main.js 통합
- [x] postMessage 통신 테스트
- [x] 이벤트 문서화
- [x] 예제 파일 작성

### 배포 준비
- [ ] Origin 목록 업데이트 (프로덕션 URL)
- [ ] https 적용 확인
- [ ] CORS 헤더 설정
- [ ] CSP 정책 설정

### 백엔드
- [ ] 게임 클리어 API 엔드포인트 구현
- [ ] 데이터 검증 로직 구현
- [ ] 점수/시간 범위 검증
- [ ] 부정행위 탐지 로직
- [ ] 일일 제한 구현
- [ ] 데이터베이스 테이블 생성

### 모니터링
- [ ] 게임 이벤트 로깅
- [ ] 보상 지급 기록
- [ ] 부정행위 알림 설정
- [ ] 모니터링 대시보드 구성

## 🔧 설치 및 테스트

```bash
# 게임 디렉토리 진입
cd douma-vs-shinobu

# 로컬 서버 실행
python -m http.server 8000

# 부모 페이지 예제 열기
# http://localhost:8000/examples/parent-page-example.html
```

## 🎯 다음 단계

### 1단계: 로컬 테스트
1. [QUICK_START.md](QUICK_START.md) 읽기
2. examples/parent-page-example.html 실행
3. 게임 이벤트 콘솔에서 확인

### 2단계: 백엔드 구현
1. [examples/backend-reward-validation.py](examples/backend-reward-validation.py) 참조
2. 보상 검증 API 구현
3. 데이터베이스 스키마 생성

### 3단계: 프로덕션 배포
1. [DEPLOYMENT.md](DEPLOYMENT.md) 읽기
2. Origin 검증 설정 업데이트
3. 보안 헤더 설정
4. 모니터링 활성화

## 🐛 트러블슈팅

### 게임이 iframe에서 로드되지 않음
→ [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md) 트러블슈팅 섹션 참조

### postMessage 메시지가 전송되지 않음
→ Origin 검증 확인 (콘솔에서 경고 메시지 확인)

### 보상이 지급되지 않음
→ 백엔드 API 로그 확인 (서버 로그에서 검증 오류 확인)

## 📞 문의

질문이나 문제가 있으면:
1. [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md)의 FAQ 확인
2. [DEPLOYMENT.md](DEPLOYMENT.md)의 트러블슈팅 섹션 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## 📝 라이선스 및 주의사항

- 게임의 기존 Firebase 구조는 수정하지 않았습니다
- GameMessenger는 추가 모듈로 제공됩니다
- 모든 보안 책임은 구현자(커플카드 사이트)에 있습니다
- 백엔드 검증 로직은 필수적으로 구현해야 합니다

---

**마지막 업데이트**: 2024년
**상태**: ✅ 구현 완료
