# 🦋 시노부 스프라이트 시트 애셋 가이드

이 폴더에 아래 규격의 투명 배경 PNG 이미지를 배치하면 **별도의 코드 수정 없이 시노부의 외형이 즉시 교체**됩니다.

---

## 1. 권장 파일명 및 경로
- **파일 경로**: `assets/images/shinobu/shinobu_spritesheet.png`
- **형식**: 32비트 투명 배경 PNG (`RGBA`)

## 2. 기본 스프라이트 시트 규격
- **단일 프레임 크기**: `64 x 64` px
- **배치 구조 (행 기반 그리드)**:

| 행 (Row) | 애니메이션 상태 | 기본 프레임 수 | 기본 FPS | 루프 여부 | 설명 |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **Row 0** | `idle` | 4 프레임 | 6 fps | Loop (반복) | 호흡 및 나비 날개 하오리 대기 모션 |
| **Row 1** | `move` | 6 프레임 | 10 fps | Loop (반복) | 전방/공중 이동 모션 |
| **Row 2** | `attack` | 5 프레임 | 14 fps | Once (단발) | 봉아의 호흡 - 일륜도 독침 찌르기 |
| **Row 3** | `hit` | 3 프레임 | 8 fps | Once (단발) | 피격 점멸 및 경직 |
| **Row 4** | `death` | 7 프레임 | 6 fps | Once (단발) | 나비 입자로 흩어지는 최후 |

## 3. 프레임 수치나 크기가 다른 이미지를 사용하는 경우
프레임 크기나 프레임 수가 다른 이미지를 사용하는 경우, [js/config/characterConfigs.js](../../../js/config/characterConfigs.js) 파일의 `shinobu` 섹션에서 수치만 변경해주시면 자동으로 정렬 및 렌더링됩니다.

```javascript
// 예시: 128x128 크기에 8프레임 idle인 경우
shinobu: {
  frameWidth: 128,
  frameHeight: 128,
  animations: {
    idle: { row: 0, frames: 8, fps: 8, loop: true },
    // ...
  }
}
```

> [!NOTE]
> 파일이 아직 없거나 로드되지 않은 상태에서는 Canvas 기반의 **고품질 절차적 벡터 렌더러(Procedural Fallback)**가 자동으로 작동하여 게임이 정상 실행됩니다.
