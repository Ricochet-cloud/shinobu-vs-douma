# 🦋 시노부 vs 도우마 ❄️

세로 화면 2D 탄막 보스전 미니게임. 바닐라 JS + Canvas로 만들었고, 커플카드 사이트의 이벤트 게임으로 iframe에 넣어 쓴다.

## 실행

ES 모듈을 쓰기 때문에 `index.html`을 더블클릭하면 안 되고, 로컬 서버가 필요하다.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 조작

| 입력 | 동작 |
|---|---|
| 방향키 / WASD | 이동 |
| Shift | 저속 이동 (히트박스 표시) |
| 터치 드래그 | 모바일 이동 |
| 공격 | 자동 연사 |

난이도는 시작 전에 **EASY / NORMAL / HARD** 중에서 고른다.

## iframe 연동

```html
<iframe src="https://게임주소/index.html" width="540" height="960"></iframe>
```

게임은 부모 페이지로 `postMessage`를 보낸다. **보상은 게임이 아니라 부모 페이지(서버)에서 처리한다.**

```js
{ type: 'GAME_CLEAR', payload: { timestamp, source: 'game', ... } }
```

| type | 시점 |
|---|---|
| `GAME_START` | 게임 시작 |
| `GAME_CLEAR` | 보스 격파 (난이도, 점수, 남은 HP/목숨, 플레이 시간, `verification_token` 포함) |
| `GAME_OVER` | 패배 |
| `GAME_RESTART` | 재시작 |
| `DIFFICULTY_CHANGED` | 난이도 변경 |

iframe이 아닌 단독 실행 때는 `document`에 `game:GAME_CLEAR` 같은 이름의 CustomEvent로 발생한다.

### 배포 전 설정

`js/main.js`의 `trustedOrigins`에 **부모 사이트 주소를 맨 앞에** 넣는다. 메시지는 이 목록의 첫 번째 주소로만 전송된다.

## 폴더

```
index.html        진입점
css/              스타일
js/               config · core · entities · graphics · systems · ui
assets/images/    스프라이트, 배경, 컷신 이미지
```

이미지가 없으면 Canvas 절차적 렌더러가 대신 그려 주기 때문에 게임은 그대로 실행된다.
