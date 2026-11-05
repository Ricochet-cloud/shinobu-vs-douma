# 🏯 무한성 배경 애셋 가이드

이 폴더에 배경 이미지를 배치하면 **별도의 코드 수정 없이 게임의 배경이 즉시 교체**됩니다.

---

## 1. 권장 파일명 및 경로
- **기본 배경**: `assets/images/backgrounds/infinity_castle.png` (또는 `.jpg`, `.webp`)
- **페이즈 3 극빙 배경 (선택 사항)**: `assets/images/backgrounds/ice_temple.png`

## 2. 권장 해상도 및 형식
- **해상도**: `540 x 960` px (세로 9:16 비율) 또는 상하 무한 스크롤을 고려한 `540 x 1920` px
- **형식**: `PNG`, `JPG`, `WebP`
- **스크롤 모드**:
  - 기본적으로 종스크롤(슈팅 게임 특유의 아래로 천천히 흐르는 패럴랙스 무한 루프)이 지원됩니다.
  - 상하 이음새(Seamless)가 자연스럽게 이어지는 텍스처를 사용하면 더욱 뛰어난 연출이 가능합니다.

## 3. 배경 설정 커스터마이징
[js/config/backgroundConfig.js](../../../js/config/backgroundConfig.js) 파일에서 스크롤 속도나 이미지 파일명을 자유롭게 변경할 수 있습니다:

```javascript
export const BACKGROUND_CONFIG = {
  defaultImage: 'assets/images/backgrounds/infinity_castle.png',
  scrollSpeed: 40, // 초당 스크롤 픽셀 수 (0으로 설정 시 정적 배경)
  parallaxLayers: [ ... ]
};
```

> [!NOTE]
> 이미지 파일이 아직 준비되지 않았거나 로드 중일 때는 Canvas 기반의 **절차적 무한성 어둠/목조 격자 & 서리/등꽃 앰비언트 라이트 렌더러(Procedural Fallback)**가 자동으로 작동하여 게임이 정상 실행됩니다.
