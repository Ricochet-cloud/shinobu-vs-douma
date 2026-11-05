# 빠른 시작 가이드 (5분 안에 시작하기)

이 가이드는 게임을 커플카드 사이트에 통합하는 가장 빠른 방법을 제시합니다.

## 1단계: 게임 파일 호스팅

```bash
# 게임 디렉토리를 웹 서버에 배포
cp -r douma-vs-shinobu/ /var/www/html/game/
```

## 2단계: 부모 페이지에 iframe 추가

```html
<!DOCTYPE html>
<html>
<head>
  <title>커플카드 게임</title>
</head>
<body>
  <h1>게임을 플레이하세요</h1>
  
  <!-- 게임 iframe -->
  <iframe 
    id="gameFrame"
    src="https://your-domain.com/game/index.html"
    width="540"
    height="960"
    style="border: none;"
  ></iframe>

  <script src="game-handler.js"></script>
</body>
</html>
```

## 3단계: 게임 이벤트 리스너 추가 (game-handler.js)

```javascript
class GameEventHandler {
  constructor() {
    window.addEventListener('message', async (event) => {
      // Origin 검증
      if (event.origin !== 'https://your-domain.com') return;

      const { type, payload } = event.data;

      if (type === 'GAME_CLEAR') {
        // 보상 처리
        const response = await fetch('/api/game-rewards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log('보상 지급:', result.reward_amount);
      }
    });
  }
}

new GameEventHandler();
```

## 4단계: 백엔드 API 구현

```python
# Django 예제
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required

@require_http_methods(["POST"])
@login_required
def claim_game_reward(request):
    data = request.json
    
    # 기본 검증
    if data['difficulty'] not in ['EASY', 'NORMAL', 'HARD']:
        return JsonResponse({'success': False}, status=400)
    
    # 보상 계산
    rewards = {
        'EASY': 100,
        'NORMAL': 250,
        'HARD': 500
    }
    reward = rewards.get(data['difficulty'], 0)
    
    # 사용자에게 포인트 추가
    user = request.user
    user.game_points = (user.game_points or 0) + reward
    user.save()
    
    return JsonResponse({
        'success': True,
        'reward_amount': reward,
        'total_points': user.game_points
    })
```

## 5단계: 테스트

```bash
# 1. 게임 서버 실행
cd douma-vs-shinobu
python -m http.server 8000

# 2. 부모 페이지 서버 실행 (다른 터미널)
python -m http.server 8001

# 3. 브라우저에서 열기
# http://localhost:8001/parent-page-example.html
```

## 게임 이벤트

### GAME_START
```javascript
{
  type: 'GAME_START',
  payload: {
    difficulty: 'NORMAL',
    timestamp: 1699123456789
  }
}
```

### GAME_CLEAR (승리)
```javascript
{
  type: 'GAME_CLEAR',
  payload: {
    difficulty: 'NORMAL',
    player_score: 2500,
    player_hp: 85,
    player_lives: 1,
    play_time: 145,
    verification_token: 'base64...',
    timestamp: 1699123456789
  }
}
```

### GAME_OVER (패배)
```javascript
{
  type: 'GAME_OVER',
  payload: {
    difficulty: 'NORMAL',
    play_time: 87,
    timestamp: 1699123456789
  }
}
```

## 주요 파일

- **index.html** - 게임 메인 페이지
- **js/main.js** - 게임 진입점 (GameMessenger 통합)
- **js/core/GameMessenger.js** - postMessage 통신 처리
- **IFRAME_INTEGRATION.md** - 상세 통합 가이드
- **DEPLOYMENT.md** - 보안 및 배포 가이드
- **examples/parent-page-example.html** - iframe 부모 페이지 예제
- **examples/backend-reward-validation.py** - 백엔드 검증 예제

## 보안 체크리스트

- [ ] Origin 검증 설정 ✓ (GameMessenger에서 자동)
- [ ] 백엔드에서 게임 결과 재검증
- [ ] 난이도별 보상 레이트 제한
- [ ] 사용자별 일일 클리어 제한
- [ ] HTTPS 사용
- [ ] CSP 헤더 설정

## 다음 단계

1. **상세 가이드 읽기**: [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md)
2. **보안 설정**: [DEPLOYMENT.md](DEPLOYMENT.md)
3. **백엔드 구현**: [examples/backend-reward-validation.py](examples/backend-reward-validation.py) 참조
4. **부모 페이지 예제**: [examples/parent-page-example.html](examples/parent-page-example.html) 참조

## FAQ

**Q: 게임이 localhost에서 테스트할 때는 되는데 배포 후 안 됨**
A: GameMessenger의 신뢰 origin 목록을 업데이트하세요.

**Q: postMessage가 작동하지 않음**
A: 브라우저 콘솔에서 origin을 확인하고, iframe의 src가 올바른지 확인하세요.

**Q: 보상이 지급되지 않음**
A: 백엔드 API가 실행 중인지, 네트워크 요청이 성공했는지 확인하세요.

**Q: 사용자가 보상을 두 번 받을 수 있나?**
A: 아니오, 백엔드에서 일일 제한과 중복 방지를 구현했습니다.

## 지원

문제가 발생하면:
1. 브라우저 개발자 도구에서 콘솔 로그 확인
2. 네트워크 탭에서 postMessage 통신 확인
3. IFRAME_INTEGRATION.md의 트러블슈팅 섹션 참조
