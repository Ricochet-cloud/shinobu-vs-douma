# iframe 통합 테스트 가이드

이 문서는 게임 iframe 통합이 정상적으로 작동하는지 확인하는 방법을 설명합니다.

## 테스트 환경 준비

### 1단계: 필수 파일 확인

```bash
# 게임 디렉토리에 다음 파일이 있는지 확인
ls -la douma-vs-shinobu/
- index.html (메인 페이지)
- js/core/GameMessenger.js (새로 추가됨)
- js/main.js (수정됨)
- examples/parent-page-example.html (새로 추가됨)
- IFRAME_INTEGRATION.md
- QUICK_START.md
- DEPLOYMENT.md
```

### 2단계: 로컬 서버 실행

```bash
cd douma-vs-shinobu
python -m http.server 8000
# 또는
python3 -m http.server 8000
```

```bash
# 다른 터미널에서 부모 페이지 서버 실행
cd douma-vs-shinobu
python -m http.server 8001
```

### 3단계: 브라우저에서 열기

```
http://localhost:8001/examples/parent-page-example.html
```

## 통합 테스트

### 테스트 1: 게임 로드 확인

**목표**: 게임이 iframe에서 정상 로드

1. 부모 페이지 열기 (위 URL)
2. **예상**: 게임이 우측에 540x960 크기의 canvas로 표시됨
3. **확인 방법**: 브라우저 개발자 도구 → Elements → iframe 확인

```html
<iframe id="gameFrame" src="./index.html"></iframe>
```

### 테스트 2: 게임 시작 이벤트

**목표**: 게임 시작 시 GAME_START 이벤트 전송 확인

1. 게임 난이도 선택 (EASY, NORMAL, HARD 중 하나)
2. "게임 시작" 버튼 클릭
3. **예상**: 부모 페이지의 로그에 다음과 같이 표시됨

```
[GAME_EVENT] GAME_START: {
  difficulty: "NORMAL",
  timestamp: 1699123456789,
  ...
}
```

4. **UI 확인**: 우측 사이드바에서 "게임 상태" 배지가 "진행중"으로 변경

### 테스트 3: 게임 클리어 이벤트

**목표**: 게임 클리어 시 GAME_CLEAR 이벤트 발생 확인

#### 방법 A: 짧은 테스트 (권장)

```javascript
// 브라우저 콘솔에서 실행 (게임 iframe 선택 후)
// 게임을 빠르게 클리어하도록 도우마의 HP를 낮춤
top.gameApp.douma.hp = 1;
```

#### 방법 B: 직접 플레이
- 게임을 정상적으로 진행하여 도우마를 모두 제거

**예상 결과**:

```
[GAME_EVENT] GAME_CLEAR: {
  difficulty: "NORMAL",
  player_score: 2500,
  player_hp: 85,
  player_lives: 1,
  boss_phase: 3,
  play_time: 145,
  verification_token: "base64...",
  timestamp: 1699123456789
}
```

**UI 확인**: 
- 우측 사이드바 "보상 현황"이 초록색으로 변경
- "클리어 성공! 🎉" 메시지 표시
- 점수 표시

### 테스트 4: 게임 오버 이벤트

**목표**: 게임 오버 시 GAME_OVER 이벤트 발생 확인

#### 방법 A: 빠른 테스트

```javascript
// 브라우저 콘솔에서 실행
top.gameApp.shinobu.hp = 0;
top.gameApp.shinobu.lives = -1;
```

#### 방법 B: 직접 플레이
- 게임에서 패배할 때까지 진행

**예상 결과**:

```
[GAME_EVENT] GAME_OVER: {
  difficulty: "NORMAL",
  player_hp: 0,
  player_lives: 0,
  boss_phase: 2,
  play_time: 87,
  timestamp: 1699123456789
}
```

**UI 확인**:
- 우측 사이드바 "보상 현황"이 빨간색으로 변경
- "게임 오버 💔" 메시지 표시

### 테스트 5: 난이도 변경

**목표**: 난이도 변경 시 DIFFICULTY_CHANGED 이벤트 발생 확인

1. 게임 초기 상태에서 난이도 선택 창 표시 상태
2. EASY / NORMAL / HARD 중 다른 난이도 선택
3. **예상**: 부모 페이지 로그에 표시

```
[GAME_EVENT] DIFFICULTY_CHANGED: {
  difficulty: "HARD",
  timestamp: 1699123456789
}
```

### 테스트 6: 게임 재시작

**목표**: 게임 재시작 시 GAME_RESTART 이벤트 발생 확인

1. 게임 시작 후 진행
2. 승리/패배 후 "재도전" 또는 "게임 재시작" 클릭
3. **예상**: 부모 페이지 로그에 표시

```
[GAME_EVENT] GAME_RESTART: {
  difficulty: "NORMAL",
  timestamp: 1699123456789
}
```

## Origin 검증 테스트

### 테스트 7: Origin 검증 (보안)

**목표**: 신뢰하지 않는 origin에서 메시지가 무시되는지 확인

#### 준비

1. 부모 페이지를 다른 포트에서 실행
```bash
# 터미널 1
python -m http.server 8002
```

2. 브라우저에서 `http://localhost:8002/examples/parent-page-example.html` 열기

3. 게임을 실행하고 클리어 시도

**예상**:
- 게임에서 메시지가 전송되지 않음 (브라우저 콘솔에 경고 표시)
- 부모 페이지에 이벤트가 수신되지 않음

**확인 방법**:
```javascript
// 게임의 console (iframe)에서
// "검증되지 않은 origin에서 메시지 수신" 경고 표시
```

## 콘솔 로깅 테스트

### 테스트 8: 콘솔 메시지 확인

**목표**: 게임과 부모 페이지의 콘솔 메시지가 정상적으로 표시되는지 확인

1. 부모 페이지 F12 열기 → Console 탭
2. 게임 시작
3. **예상**: 다음과 같은 메시지들이 표시됨

```javascript
// 게임 (iframe) 콘솔:
[DanmakuGame] 스토리 및 전투 시스템 초기화 시작...
[DanmakuGame] 게임 루프 가동 완료.
[GameMessenger] 검증된 메시지 수신: GAME_START
[DanmakuGame] 게임 클리어...

// 부모 페이지 콘솔:
[GameEvent] GAME_START: {difficulty: "NORMAL", ...}
[GameEvent] GAME_CLEAR: {difficulty: "NORMAL", ...}
```

## 성능 테스트

### 테스트 9: 프레임 레이트

**목표**: 게임이 안정적인 FPS로 실행되는지 확인

1. 게임 시작
2. 우측 상단 FPS 디스플레이 확인
3. **예상**: FPS 60 근처에서 안정적으로 유지

**콘솔 확인**:
```javascript
// 게임 콘솔에서
// FPS: 60
// FPS: 59
// FPS: 60
```

### 테스트 10: 메모리 사용량

**목표**: 게임 실행 중 메모리 누수가 없는지 확인

1. 브라우저 DevTools → Performance 탭 열기
2. 기록 시작 후 게임 5분 실행
3. 기록 정지
4. **예상**: 메모리 사용량이 안정적으로 유지 (증가하지 않음)

## 배포 전 체크리스트

### 로컬 테스트 완료

- [ ] 테스트 1: 게임 로드 ✓
- [ ] 테스트 2: GAME_START 이벤트 ✓
- [ ] 테스트 3: GAME_CLEAR 이벤트 ✓
- [ ] 테스트 4: GAME_OVER 이벤트 ✓
- [ ] 테스트 5: 난이도 변경 ✓
- [ ] 테스트 6: 게임 재시작 ✓
- [ ] 테스트 7: Origin 검증 ✓
- [ ] 테스트 8: 콘솔 메시지 ✓
- [ ] 테스트 9: FPS ✓
- [ ] 테스트 10: 메모리 ✓

### 배포 환경 준비

- [ ] Origin 목록 업데이트 (프로덕션 URL)
- [ ] HTTPS 적용
- [ ] CORS 헤더 설정
- [ ] CSP 정책 설정
- [ ] 백엔드 보상 API 준비
- [ ] 모니터링 설정

## 트러블슈팅

### 테스트 2-6에서 이벤트가 수신되지 않음

**확인 사항**:
1. 부모 페이지가 `http://localhost:8001`에서 실행 중인가?
2. 게임이 `http://localhost:8000`에서 실행 중인가?
3. 브라우저 콘솔에 에러가 표시되는가?

**해결 방법**:
```javascript
// 부모 페이지 콘솔에서
window.addEventListener('message', (e) => {
  console.log('Received message:', e);
});
```

### FPS가 낮음

**확인 사항**:
1. 브라우저 개발자 도구가 열려있는가? (닫으면 성능 향상)
2. 다른 탭에서 무거운 작업이 실행 중인가?
3. 시스템 리소스가 부족한가?

### 콘솔에 CORS 에러 표시

**해결 방법**:
- 게임과 부모 페이지가 같은 도메인이거나 다른 도메인에서 CORS 설정을 해야 함
- 로컬 테스트에서는 이 에러가 무시되어도 됨

## 자동 테스트 스크립트

다음은 브라우저 콘솔에서 실행할 수 있는 테스트 스크립트입니다:

```javascript
// 부모 페이지 콘솔에서 실행
class GameIntegrationTest {
  constructor() {
    this.results = [];
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.receivedEvents = [];
    window.addEventListener('message', (e) => {
      if (e.data.type) {
        window.receivedEvents.push(e.data);
        console.log(`Received: ${e.data.type}`);
      }
    });
  }

  testEventReception() {
    // 게임이 이벤트를 전송할 때까지 대기
    const checkInterval = setInterval(() => {
      if (window.receivedEvents.length > 0) {
        console.log('✓ Event reception test passed');
        clearInterval(checkInterval);
      }
    }, 100);

    // 10초 후 실패로 표시
    setTimeout(() => {
      clearInterval(checkInterval);
      if (window.receivedEvents.length === 0) {
        console.log('✗ Event reception test failed');
      }
    }, 10000);
  }

  showReceivedEvents() {
    console.table(window.receivedEvents);
  }
}

const test = new GameIntegrationTest();
test.testEventReception();
```

## 최종 검증

모든 테스트를 통과했다면:

1. [DEPLOYMENT.md](DEPLOYMENT.md)의 체크리스트 확인
2. 프로덕션 배포 준비 시작
3. 백엔드 팀과 함께 보상 검증 로직 최종 검토
