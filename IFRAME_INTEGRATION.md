# iframe 통합 가이드

이 문서는 게임을 커플카드 사이트의 iframe에 통합하고 게임 이벤트를 처리하는 방법을 설명합니다.

## 개요

게임은 다음과 같이 작동합니다:

1. **독립 실행 모드**: 일반 웹 페이지로 직접 열 수 있음
2. **iframe 임베드 모드**: 부모 페이지에서 iframe으로 로드 가능
3. **postMessage 통신**: 부모 페이지와 안전한 메시지 교환

## 보안 기능

- **Origin 검증**: 신뢰할 수 있는 origin에서만 메시지 수신
- **메시지 서명**: 게임 결과에 검증 토큰 포함 (백엔드 재검증용)
- **보상 미처리**: 게임 클리어 이벤트는 데이터 전달만 하고, 보상 처리는 부모/서버에서 수행

## 게임 이벤트 종류

### 1. GAME_START
게임 전투가 시작될 때 발생합니다.

```javascript
{
  type: 'GAME_START',
  payload: {
    difficulty: 'NORMAL',           // 난이도: EASY, NORMAL, HARD
    difficultyLevel: 'NORMAL',      // 난이도 (다중 형식)
    timestamp: 1699123456789,       // Unix 타임스탬프
    source: 'game'
  }
}
```

### 2. GAME_CLEAR
게임을 성공적으로 클리어했을 때 발생합니다.

```javascript
{
  type: 'GAME_CLEAR',
  payload: {
    difficulty: 'NORMAL',
    difficulty_level: 'NORMAL',
    player_hp: 85,                  // 남은 HP (0-100)
    player_lives: 1,                // 남은 목숨 (0+)
    player_score: 2500,             // 계산된 점수
    boss_phase: 3,                  // 도우마 페이즈 (1-3)
    play_time: 145,                 // 플레이 시간 (초)
    verification_token: 'base64...',// 검증용 토큰
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

### 3. GAME_OVER
게임 오버 (패배)가 발생했을 때 발생합니다.

```javascript
{
  type: 'GAME_OVER',
  payload: {
    difficulty: 'NORMAL',
    difficulty_level: 'NORMAL',
    player_hp: 0,
    player_lives: 0,
    boss_phase: 2,                  // 도우마 현재 페이즈
    play_time: 87,
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

### 4. GAME_RESTART
게임 재시작 (재도전)이 요청되었을 때 발생합니다.

```javascript
{
  type: 'GAME_RESTART',
  payload: {
    difficulty: 'NORMAL',
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

### 5. DIFFICULTY_CHANGED
난이도가 변경되었을 때 발생합니다.

```javascript
{
  type: 'DIFFICULTY_CHANGED',
  payload: {
    difficulty: 'HARD',
    timestamp: 1699123456789,
    source: 'game'
  }
}
```

## 부모 페이지에서 사용법

### 1. 기본 HTML (iframe 로드)

```html
<!DOCTYPE html>
<html>
<head>
  <title>커플카드 게임</title>
</head>
<body>
  <h1>도우마 vs 시노부 게임</h1>
  
  <!-- 게임 iframe -->
  <iframe 
    id="gameFrame"
    src="https://your-domain.com/game/index.html"
    width="540"
    height="960"
    style="border: none; display: block;"
  ></iframe>

  <script src="game-event-handler.js"></script>
</body>
</html>
```

### 2. 게임 이벤트 리스너 등록 (game-event-handler.js)

```javascript
// 부모 페이지에서 게임 이벤트를 수신하고 처리
class GameEventHandler {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.addEventListener('message', async (event) => {
      // Origin 검증 (보안)
      if (event.origin !== 'https://your-domain.com') {
        return;
      }

      const { type, payload } = event.data;
      console.log(`[게임 이벤트] ${type}:`, payload);

      switch (type) {
        case 'GAME_START':
          this.handleGameStart(payload);
          break;
        case 'GAME_CLEAR':
          this.handleGameClear(payload);
          break;
        case 'GAME_OVER':
          this.handleGameOver(payload);
          break;
        case 'GAME_RESTART':
          this.handleGameRestart(payload);
          break;
        case 'DIFFICULTY_CHANGED':
          this.handleDifficultyChanged(payload);
          break;
      }
    });
  }

  handleGameStart(payload) {
    console.log(`[게임 시작] 난이도: ${payload.difficulty}`);
    // 게임 시작 시 UI 업데이트 (예: 카운트다운 표시)
  }

  async handleGameClear(payload) {
    console.log(`[게임 클리어] 점수: ${payload.player_score}`);
    
    // 1. 로컬 UI 업데이트
    this.showClearReward(payload);
    
    // 2. 백엔드 보상 처리 요청
    const response = await fetch('/api/game-rewards/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'GAME_CLEAR',
        difficulty: payload.difficulty,
        player_score: payload.player_score,
        play_time: payload.play_time,
        verification_token: payload.verification_token
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log(`보상 지급 완료: ${result.reward_amount}`);
      // UI에 보상 표시
    }
  }

  handleGameOver(payload) {
    console.log(`[게임 오버] 도우마 페이즈: ${payload.boss_phase}`);
    // 게임 오버 UI 처리
  }

  handleGameRestart(payload) {
    console.log(`[게임 재시작] 난이도: ${payload.difficulty}`);
    // 게임 재시작 전 필요한 처리
  }

  handleDifficultyChanged(payload) {
    console.log(`[난이도 변경] ${payload.difficulty}`);
    // 난이도 표시 업데이트
  }

  showClearReward(payload) {
    // 클리어 보상 UI 표시
    const modal = document.createElement('div');
    modal.className = 'reward-modal';
    modal.innerHTML = `
      <h2>게임 클리어!</h2>
      <p>점수: ${payload.player_score}</p>
      <p>플레이 시간: ${payload.play_time}초</p>
      <button>확인</button>
    `;
    document.body.appendChild(modal);
  }
}

// 초기화
const gameHandler = new GameEventHandler();
```

### 3. 스탠드얼론 모드 지원

게임을 직접 열 때도 정상 작동합니다 (postMessage 없음):

```bash
# 단순히 HTML 파일을 열기
open index.html
```

## 백엔드 보상 검증 (권장)

게임 클리어 이벤트를 받을 때는 반드시 백엔드에서 재검증하세요:

```python
# Python Django 예제
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["POST"])
def claim_game_reward(request):
    data = json.loads(request.body)
    
    # 1. 난이도 및 점수 검증
    if data['difficulty'] not in ['EASY', 'NORMAL', 'HARD']:
        return JsonResponse({'success': False, 'error': 'Invalid difficulty'})
    
    # 2. 검증 토큰 확인 (선택: 서명된 JWT 사용)
    # verify_token(data['verification_token'])
    
    # 3. 점수 범위 검증
    max_score = get_max_score(data['difficulty'])
    if data['player_score'] > max_score:
        return JsonResponse({'success': False, 'error': 'Score too high'})
    
    # 4. 보상 지급
    user = request.user
    reward_amount = calculate_reward(data['difficulty'], data['player_score'])
    user.game_points += reward_amount
    user.save()
    
    # 5. 게임 기록 저장
    GameRecord.objects.create(
        user=user,
        difficulty=data['difficulty'],
        score=data['player_score'],
        play_time=data['play_time'],
        cleared=True
    )
    
    return JsonResponse({
        'success': True,
        'reward_amount': reward_amount,
        'total_points': user.game_points
    })
```

## 신뢰 origin 설정

게임의 `GameMessenger`에서 신뢰하는 origin을 설정할 수 있습니다:

```javascript
// index.html에서 설정
const gameApp = new DanmakuGameApp();
gameApp.messenger.addTrustedOrigin('https://your-couple-card-site.com');
gameApp.init();
```

또는 생성자에서:

```javascript
const messenger = new GameMessenger({
  trustedOrigins: [
    'https://your-couple-card-site.com',
    'https://www.your-couple-card-site.com',
    'http://localhost:3000'
  ]
});
```

## 개발 중 테스트

로컬 개발 환경에서 iframe 통합을 테스트하려면:

1. 게임 서버 실행:
```bash
# Python SimpleHTTPServer 또는 다른 로컬 서버
python -m http.server 8000
```

2. 부모 페이지도 다른 포트에서 실행:
```bash
python -m http.server 8001
```

3. 부모 페이지에서 iframe 로드:
```html
<iframe src="http://localhost:8000/index.html"></iframe>
```

4. 브라우저 콘솔에서 메시지 확인:
```javascript
// 부모 페이지 콘솔에서
window.addEventListener('message', (e) => {
  console.log('받은 메시지:', e.data);
});
```

## 트러블슈팅

### iframe에서 메시지가 전송되지 않음
- 부모 페이지의 origin이 신뢰 목록에 있는지 확인
- 브라우저 콘솔에서 에러 확인
- CORS 정책 확인

### 게임이 iframe 안에서 제대로 표시되지 않음
- CSS `width/height` 확인
- Canvas 해상도 (540x960) 확인
- 게임 렌더링 문제는 브라우저 개발자 도구의 Console 탭에서 확인

### postMessage 보안 경고
- origin 검증이 정상적으로 작동하는지 확인
- 신뢰 origin 목록이 올바른지 확인

## 추가 정보

- 게임은 항상 540x960 해상도로 작동
- 모바일/데스크톱 모두 지원 (반응형 UI 포함)
- 게임 상태는 기록되지 않음 (매번 처음부터 시작)
- 게임 내 Firebase 구조는 수정되지 않음
