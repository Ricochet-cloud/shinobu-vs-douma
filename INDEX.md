# 게임 iframe 통합 - 완전 구현 가이드

## 📌 요약

**상태**: ✅ **구현 완료**

게임이 다음과 같이 완벽하게 구현되었습니다:
- ✅ 독립 실행 가능 (일반 웹 페이지)
- ✅ iframe 임베드 가능 (커플카드 사이트)
- ✅ postMessage 기반 통신 (보안 검증 포함)
- ✅ 게임 이벤트 전파 (START, CLEAR, OVER, RESTART)
- ✅ 난이도 및 결과 전달
- ✅ 보상 직접 처리 없음 (서버에서 처리)

## 🚀 빠른 시작 (읽기 순서)

### 1️⃣ **5분 안에 시작** 
→ [QUICK_START.md](QUICK_START.md)

### 2️⃣ **상세 통합 가이드**
→ [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md)

### 3️⃣ **보안 & 배포**
→ [DEPLOYMENT.md](DEPLOYMENT.md)

### 4️⃣ **테스트**
→ [TESTING.md](TESTING.md)

### 5️⃣ **프로젝트 전체 개요**
→ [README_IFRAME_INTEGRATION.md](README_IFRAME_INTEGRATION.md)

## 📚 문서 가이드

| 문서 | 대상 | 목적 | 읽기 시간 |
|------|------|------|---------|
| **QUICK_START.md** | 모두 | 5분 안에 시작 | 5분 |
| **IFRAME_INTEGRATION.md** | 프론트엔드 개발자 | 상세 통합 방법 | 15분 |
| **DEPLOYMENT.md** | DevOps/보안팀 | 배포 & 보안 설정 | 20분 |
| **TESTING.md** | QA/테스터 | 테스트 절차 | 20분 |
| **README_IFRAME_INTEGRATION.md** | 모두 | 프로젝트 전체 개요 | 10분 |

## 🎯 역할별 가이드

### 🔷 프론트엔드 개발자
1. [QUICK_START.md](QUICK_START.md) 읽기
2. [examples/parent-page-example.html](examples/parent-page-example.html) 분석
3. [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md)에서 postMessage 처리 방법 학습
4. 부모 페이지에 게임 이벤트 리스너 구현

### 🔷 백엔드 개발자
1. [examples/backend-reward-validation.py](examples/backend-reward-validation.py) 분석
2. 보상 검증 API 엔드포인트 구현
3. 데이터베이스 스키마 설계
4. 부정행위 탐지 로직 구현

### 🔷 DevOps/인프라팀
1. [DEPLOYMENT.md](DEPLOYMENT.md) 읽기
2. Origin 검증 설정
3. CORS, CSP 헤더 구성
4. 모니터링 & 로깅 설정

### 🔷 QA/테스터
1. [TESTING.md](TESTING.md) 따라 테스트 진행
2. 체크리스트 항목 검증
3. 버그 리포트 작성

## 📁 프로젝트 구조

```
douma-vs-shinobu/
├── 📖 문서 (읽기 순서)
│   ├── QUICK_START.md ..................... ⭐ 여기서 시작
│   ├── IFRAME_INTEGRATION.md ............. 상세 가이드
│   ├── DEPLOYMENT.md ..................... 보안 & 배포
│   ├── TESTING.md ........................ 테스트 절차
│   ├── README_IFRAME_INTEGRATION.md ...... 프로젝트 전체 개요
│   └── INDEX.md (이 파일) ................ 문서 네비게이션
│
├── 🎮 게임 코드
│   ├── index.html ........................ 게임 메인 페이지
│   ├── js/
│   │   ├── main.js ....................... ✨ GameMessenger 통합됨
│   │   ├── core/
│   │   │   ├── GameMessenger.js .......... ✨ NEW: postMessage 통신
│   │   │   └── 다른 코어 모듈들
│   │   ├── entities/, systems/, graphics/, ui/
│   │   └── config/
│   ├── css/ .............................. 스타일
│   └── assets/ ........................... 게임 애셋
│
└── 📝 예제 & 참고
    ├── examples/
    │   ├── parent-page-example.html ...... ✨ NEW: 부모 페이지 완전 예제
    │   └── backend-reward-validation.py .. ✨ NEW: 백엔드 검증 로직
    └── 다른 디렉토리
```

## 🔑 핵심 파일

### 새로 추가된 파일

| 파일 | 설명 |
|------|------|
| `js/core/GameMessenger.js` | postMessage 통신 시스템 (핵심) |
| `examples/parent-page-example.html` | 부모 페이지 완전한 워킹 예제 |
| `examples/backend-reward-validation.py` | 백엔드 보상 검증 로직 |
| `QUICK_START.md` | 5분 시작 가이드 |
| `IFRAME_INTEGRATION.md` | 상세 통합 문서 |
| `DEPLOYMENT.md` | 보안 & 배포 가이드 |
| `TESTING.md` | 테스트 절차 |
| `README_IFRAME_INTEGRATION.md` | 프로젝트 개요 |

### 수정된 파일

| 파일 | 변경사항 |
|------|---------|
| `js/main.js` | GameMessenger 초기화 및 게임 이벤트 전송 통합 |

## 🎮 게임 이벤트 플로우

```
사용자 행동              게임                  부모 페이지              백엔드
    │                   │                      │                        │
    ├─ 난이도 선택 ────>│                      │                        │
    │                   ├─ DIFFICULTY_CHANGED ─>                        │
    │                   │                      │                        │
    ├─ 게임 시작 ────>│                      │                        │
    │                   ├─ GAME_START ────────>                        │
    │                   │                      ├─ UI 업데이트          │
    │                   │                      │                        │
    ├─ 게임 플레이 ──>│ (30-300초)           │                        │
    │                   │                      │                        │
    ├─ 게임 클리어 ──>│                      │                        │
    │                   ├─ GAME_CLEAR ────────>                        │
    │                   │                      ├─ API 요청 ─────────>│
    │                   │                      │  (데이터 검증)         │
    │                   │                      │<─ 보상 지급 ──────────┤
    │                   │                      ├─ UI 표시             │
    │                   │                      │                        │
    └─ 재도전 ────────>│                      │                        │
                        └─ GAME_RESTART ────>
```

## ✅ 구현 체크리스트

### 개발 완료
- [x] GameMessenger 클래스 구현
- [x] main.js에 GameMessenger 통합
- [x] 5가지 게임 이벤트 구현
- [x] Origin 검증 시스템
- [x] 모든 문서 작성
- [x] 완전한 예제 코드

### 배포 준비
- [ ] Origin 목록 프로덕션 URL로 업데이트
- [ ] HTTPS 적용
- [ ] 백엔드 보상 검증 API 구현
- [ ] 모니터링 & 로깅 설정
- [ ] 보안 테스트 완료

## 🔒 보안 기능

### 3계층 보안 모델

```
계층 1: 클라이언트 (게임)
  └─ Origin 검증: 신뢰하는 부모 origin만 수락
  └─ 메시지 구조화: 정의된 형식만 전송

계층 2: 부모 페이지
  └─ Origin 재검증: 게임의 origin 확인
  └─ 데이터 타입 체크: 기본 검증

계층 3: 백엔드 (신뢰 환경)
  └─ 완전한 재검증: 점수, 시간, 범위
  └─ 부정행위 탐지: 비정상 패턴 감지
  └─ 최종 보상 지급: 모든 검증 통과 후만 지급
```

## 💻 로컬 테스트

### 1단계: 준비
```bash
cd douma-vs-shinobu
python -m http.server 8000  # 게임 서버

# 다른 터미널
cd douma-vs-shinobu
python -m http.server 8001  # 부모 페이지 서버
```

### 2단계: 테스트
```
http://localhost:8001/examples/parent-page-example.html
```

### 3단계: 확인
- 우측 "이벤트 로그"에서 게임 이벤트 확인
- "게임 상태" 배지 변화 관찰
- 브라우저 콘솔에서 메시지 로그 확인

## 🔗 참고 링크

### 게임 이벤트 명세
- [5가지 게임 이벤트 상세 설명](IFRAME_INTEGRATION.md#게임-이벤트-종류)

### 부모 페이지 구현
- [완전한 부모 페이지 예제](examples/parent-page-example.html)
- [이벤트 리스너 구현 방법](IFRAME_INTEGRATION.md#부모-페이지에서-사용법)

### 백엔드 구현
- [보상 검증 로직](examples/backend-reward-validation.py)
- [백엔드 보안 설정](DEPLOYMENT.md#백엔드-보안)

### 배포
- [프로덕션 체크리스트](DEPLOYMENT.md#체크리스트)
- [Origin 설정 가이드](DEPLOYMENT.md#origin-검증-설정)

### 트러블슈팅
- [일반 문제 해결](IFRAME_INTEGRATION.md#트러블슈팅)
- [배포 문제 해결](DEPLOYMENT.md#트러블슈팅)
- [테스트 실패](TESTING.md#트러블슈팅)

## 🎓 학습 경로

### 초급 (30분)
1. [QUICK_START.md](QUICK_START.md) 읽기
2. 로컬에서 테스트
3. 예제 코드 분석

### 중급 (1-2시간)
1. [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md) 읽기
2. 부모 페이지 구현
3. 이벤트 리스너 작성

### 고급 (2-4시간)
1. [DEPLOYMENT.md](DEPLOYMENT.md) 읽기
2. 백엔드 검증 로직 구현
3. 보안 설정 완료
4. 모니터링 설정

## 📞 지원 및 문의

### 자주 묻는 질문
→ [QUICK_START.md FAQ](QUICK_START.md#faq)

### 문제 해결
→ [IFRAME_INTEGRATION.md 트러블슈팅](IFRAME_INTEGRATION.md#트러블슈팅)

### 배포 관련
→ [DEPLOYMENT.md 트러블슈팅](DEPLOYMENT.md#트러블슈팅)

## 📋 마지막 확인사항

배포 전에 다음을 확인하세요:

- [ ] 모든 문서를 읽었는가?
- [ ] 로컬 테스트를 완료했는가?
- [ ] 부모 페이지 예제를 실행해봤는가?
- [ ] 백엔드 검증 로직을 이해했는가?
- [ ] Origin 목록을 업데이트했는가?
- [ ] 보안 설정을 완료했는가?
- [ ] 모니터링을 활성화했는가?

---

**프로젝트 상태**: ✅ 완료
**마지막 업데이트**: 2024년
**버전**: 1.0

**다음 단계**: [QUICK_START.md](QUICK_START.md) 읽기 시작! 🚀
