# 배포 및 보안 가이드

이 문서는 게임을 프로덕션 환경에 배포할 때 필요한 보안 설정과 고려사항을 설명합니다.

## 목차

1. [보안 아키텍처](#보안-아키텍처)
2. [Origin 검증 설정](#origin-검증-설정)
3. [프로덕션 배포](#프로덕션-배포)
4. [모니터링 및 로깅](#모니터링-및-로깅)
5. [트러블슈팅](#트러블슈팅)

## 보안 아키텍처

### 신뢰 경계

```
┌─────────────────────────────────┐
│  부모 페이지 (커플카드 사이트)    │
│  (보상 지급 로직)                │
└──────────────┬──────────────────┘
               │ postMessage
               │ (검증되지 않은 데이터)
               ↓
┌─────────────────────────────────┐
│  게임 iframe                     │
│  (신뢰할 수 없는 환경)           │
│  - 클라이언트 검증만 가능        │
│  - 보상 직접 처리 불가           │
└─────────────────────────────────┘
               │ postMessage
               │ (서명된 클리어 이벤트)
               ↓
┌─────────────────────────────────┐
│  백엔드 서버 (신뢰 환경)        │
│  - 모든 데이터 재검증            │
│  - 보상 최종 지급                │
│  - 부정행위 탐지                 │
└─────────────────────────────────┘
```

### 보안 원칙

1. **클라이언트 검증 불신**: 게임 클라이언트는 신뢰할 수 없음
2. **서버 재검증 필수**: 모든 게임 결과는 백엔드에서 재검증
3. **데이터 서명**: 게임 결과에 검증 토큰 포함
4. **Origin 격리**: 신뢰할 수 있는 origin에서만 메시지 수신
5. **레이트 제한**: 보상 요청에 일일 제한 설정

## Origin 검증 설정

### 1. 개발 환경

```javascript
// index.html 또는 main.js에서
const messenger = new GameMessenger({
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    window.location.origin
  ]
});
```

### 2. 스테이징 환경

```javascript
const messenger = new GameMessenger({
  trustedOrigins: [
    'https://staging.your-domain.com',
    'https://staging-game.your-domain.com',
    window.location.origin
  ]
});
```

### 3. 프로덕션 환경

```javascript
const messenger = new GameMessenger({
  trustedOrigins: [
    'https://www.your-couple-card-site.com',
    'https://your-couple-card-site.com',
    'https://game.your-couple-card-site.com'
    // ⚠️ localhost는 절대 포함하지 말 것!
  ]
});
```

### 4. 환경 변수 사용 (권장)

```javascript
// config.js
export const getGameMessengerConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    trustedOrigins: isDevelopment
      ? [
          'http://localhost:3000',
          'http://localhost:5000',
          window.location.origin
        ]
      : isProduction
      ? [
          'https://www.your-couple-card-site.com',
          'https://your-couple-card-site.com'
        ]
      : [
          'https://staging.your-domain.com',
          window.location.origin
        ]
  };
};
```

## 프로덕션 배포

### 1. 인프라 설정

#### CDN 배포

```bash
# 게임 파일을 CDN에 업로드
aws s3 sync dist/ s3://your-game-cdn-bucket/

# CloudFront 또는 다른 CDN으로 배포
```

#### CORS 정책

```
Access-Control-Allow-Origin: https://www.your-couple-card-site.com
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

#### CSP (Content Security Policy)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors https://www.your-couple-card-site.com;
  form-action 'self';
">
```

### 2. 백엔드 보안

#### API 엔드포인트 보안

```python
# Django 예제
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.cache import cache_page
from django.contrib.auth.decorators import login_required
from ratelimit.decorators import ratelimit

@require_http_methods(["POST"])
@csrf_protect
@login_required
@ratelimit(key='user', rate='3/d')  # 하루 3회 제한
def claim_game_reward(request):
    """게임 보상 요청 API"""
    # ... 보상 검증 및 지급 로직
```

#### 요청 검증

```python
import json
import hmac
import hashlib

def verify_game_clear_request(data, secret_key):
    """게임 클리어 요청 서명 검증"""
    
    # 1. 필수 필드 확인
    required_fields = [
        'difficulty', 'player_score', 'play_time',
        'player_hp', 'player_lives', 'verification_token'
    ]
    
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # 2. 데이터 타입 검증
    try:
        difficulty = str(data['difficulty'])
        player_score = int(data['player_score'])
        play_time = int(data['play_time'])
        player_hp = int(data['player_hp'])
        player_lives = int(data['player_lives'])
    except (ValueError, TypeError):
        return False, "Invalid data types"
    
    # 3. 값 범위 검증
    if difficulty not in ['EASY', 'NORMAL', 'HARD']:
        return False, "Invalid difficulty"
    
    if not (0 <= player_hp <= 100):
        return False, "Invalid player HP"
    
    if player_lives < 0:
        return False, "Invalid player lives"
    
    # 4. 검증 토큰 확인 (Optional: JWT 또는 HMAC)
    # verify_token(data['verification_token'])
    
    return True, None
```

### 3. 데이터베이스 기록

```python
from django.db import models

class GameRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    difficulty = models.CharField(
        max_length=10,
        choices=[('EASY', 'Easy'), ('NORMAL', 'Normal'), ('HARD', 'Hard')]
    )
    score = models.IntegerField()
    play_time = models.IntegerField()  # 초
    player_hp = models.IntegerField()
    player_lives = models.IntegerField()
    boss_phase = models.IntegerField()
    cleared = models.BooleanField()
    
    # 부정행위 플래그
    flagged_as_suspicious = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'game_records'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['flagged_as_suspicious']),
        ]

class GameRewardTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_record = models.OneToOneField(GameRecord, on_delete=models.CASCADE)
    reward_amount = models.IntegerField()
    
    # 감시 필드
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'game_reward_transactions'
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
```

## 모니터링 및 로깅

### 1. 게임 이벤트 로깅

```python
import logging

logger = logging.getLogger('game_events')

def log_game_event(event_type, user_id, data):
    """게임 이벤트 로깅"""
    logger.info(f"GAME_EVENT", extra={
        'event_type': event_type,
        'user_id': user_id,
        'difficulty': data.get('difficulty'),
        'score': data.get('player_score'),
        'play_time': data.get('play_time'),
        'timestamp': datetime.now().isoformat()
    })

def detect_suspicious_activity(user_id, record_data):
    """부정행위 탐지"""
    
    # 1. 시간당 많은 클리어
    recent_clears = GameRecord.objects.filter(
        user_id=user_id,
        created_at__gte=datetime.now() - timedelta(hours=1)
    ).count()
    
    if recent_clears > 10:
        return True, "Too many clears in 1 hour"
    
    # 2. 비현실적인 점수
    if record_data['play_time'] < 30 and record_data['player_score'] > 5000:
        return True, "Suspiciously high score with very short play time"
    
    # 3. 항상 완벽한 성과 (모든 HP, 모든 목숨 보존)
    user_clears = GameRecord.objects.filter(
        user_id=user_id,
        cleared=True
    ).values_list('player_hp', 'player_lives')
    
    perfect_clears = sum(1 for hp, lives in user_clears if hp == 100 and lives >= 2)
    if perfect_clears > 10:
        return True, "Suspiciously consistent perfect scores"
    
    return False, None
```

### 2. 모니터링 대시보드

```python
from django.db.models import Count, Sum, Avg

def get_game_stats():
    """게임 통계 조회"""
    return {
        'total_plays': GameRecord.objects.count(),
        'total_clears': GameRecord.objects.filter(cleared=True).count(),
        'clear_rate': (
            GameRecord.objects.filter(cleared=True).count() /
            GameRecord.objects.count() * 100
        ),
        'average_score': GameRecord.objects.filter(
            cleared=True
        ).aggregate(avg=Avg('score'))['avg'],
        'suspicious_records': GameRecord.objects.filter(
            flagged_as_suspicious=True
        ).count(),
        'reward_distributed': GameRewardTransaction.objects.aggregate(
            total=Sum('reward_amount')
        )['total']
    }
```

## 트러블슈팅

### 1. Origin 검증 실패

**증상**: iframe에서 메시지가 전송되지 않음

**해결책**:
```javascript
// 브라우저 콘솔에서 확인
window.addEventListener('message', (e) => {
  console.log('Message origin:', e.origin);
  console.log('Expected origin:', window.location.origin);
});

// GameMessenger에서 신뢰 origin 추가
app.messenger.addTrustedOrigin('https://your-domain.com');
```

### 2. 게임이 iframe에서 렌더링되지 않음

**증상**: Canvas가 검은 화면으로 표시됨

**해결책**:
```html
<!-- iframe에 title 속성 추가 (보안) -->
<iframe 
  title="Game Title"
  src="..."
  sandbox="allow-scripts allow-same-origin allow-popups"
></iframe>
```

### 3. 보상이 지급되지 않음

**체크리스트**:
- [ ] 백엔드 API가 실행 중인가?
- [ ] 사용자가 로그인되어 있는가?
- [ ] 데이터 검증이 통과했는가? (서버 로그 확인)
- [ ] 일일 제한에 도달했는가?
- [ ] 검증 토큰이 유효한가?

```python
# 디버그: 클리어 이벤트 로깅
logger.info(f"Claim request: {data}")
success, reward, error = GameRewardValidator.validate_and_calculate_reward(...)
logger.info(f"Validation result: success={success}, error={error}")
```

### 4. CORS 에러

**증상**: 콘솔에 CORS 정책 에러

**해결책**:
```python
# Django CORS 설정
from corsheaders.middleware import CorsMiddleware

CORS_ALLOWED_ORIGINS = [
    "https://www.your-couple-card-site.com",
    "https://your-couple-card-site.com",
]

CORS_ALLOW_METHODS = [
    "GET",
    "HEAD",
    "OPTIONS",
    "POST",
]
```

## 체크리스트

### 배포 전

- [ ] Origin 검증 설정 완료
- [ ] 신뢰 origin 목록 업데이트
- [ ] CSP 헤더 설정
- [ ] 백엔드 보상 검증 로직 구현
- [ ] 레이트 제한 설정
- [ ] 부정행위 탐지 로직 테스트
- [ ] 모니터링 및 로깅 설정
- [ ] 데이터베이스 마이그레이션 완료

### 배포 후

- [ ] 게임 기능 테스트
- [ ] postMessage 통신 확인
- [ ] 보상 지급 테스트
- [ ] 모니터링 대시보드 활성화
- [ ] 로그 수집 확인
- [ ] 부정행위 탐지 알림 설정

## 문의 및 지원

보안 이슈 발견 시 [security-contact@your-domain.com](mailto:security-contact@your-domain.com)으로 연락주세요.
