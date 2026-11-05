"""
backend-reward-validation.py - 게임 클리어 보상 검증 및 처리 예제

이 모듈은 커플카드 사이트의 백엔드에서 게임 클리어 이벤트를 검증하고
보상을 지급하는 방법을 보여줍니다.

보안 고려사항:
1. 모든 게임 결과는 서버에서 재검증
2. 점수 범위 검증 (명백한 부정행위 탐지)
3. 난이도별 보상 배율 관리
4. 플레이 시간 검증 (너무 빠른 클리어 감지)
5. 유저별 일일 클리어 제한 (스팸 방지)
"""

import json
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from enum import Enum

# Django 또는 Flask를 사용한다고 가정
# from django.http import JsonResponse
# from django.views.decorators.http import require_http_methods
# from django.contrib.auth.decorators import login_required


class GameDifficulty(Enum):
    EASY = "EASY"
    NORMAL = "NORMAL"
    HARD = "HARD"


class GameRewardValidator:
    """
    게임 클리어 이벤트를 검증하고 보상을 계산하는 클래스
    """

    # 난이도별 최대 점수 (점수 검증용)
    MAX_SCORES = {
        GameDifficulty.EASY: 3000,
        GameDifficulty.NORMAL: 5000,
        GameDifficulty.HARD: 8000,
    }

    # 난이도별 최소 플레이 시간 (초, 너무 빠른 클리어 감지용)
    MIN_PLAY_TIME = {
        GameDifficulty.EASY: 30,      # 최소 30초
        GameDifficulty.NORMAL: 60,    # 최소 1분
        GameDifficulty.HARD: 90,      # 최소 1분 30초
    }

    # 난이도별 기본 보상 (게임 포인트)
    BASE_REWARDS = {
        GameDifficulty.EASY: 100,
        GameDifficulty.NORMAL: 250,
        GameDifficulty.HARD: 500,
    }

    # 난이도별 최대 일일 클리어 수 (스팸 방지)
    MAX_DAILY_CLEARS = {
        GameDifficulty.EASY: 5,
        GameDifficulty.NORMAL: 3,
        GameDifficulty.HARD: 1,
    }

    # 보상 서명용 비밀 키 (환경 변수에서 로드해야 함)
    SECRET_KEY = "your-secret-key-change-in-production"

    @classmethod
    def validate_and_calculate_reward(
        cls,
        user_id: int,
        difficulty: str,
        player_score: int,
        play_time: int,
        player_hp: int,
        player_lives: int,
        verification_token: str,
        db_connection=None
    ) -> Tuple[bool, int, Optional[str]]:
        """
        게임 클리어 이벤트를 검증하고 보상을 계산합니다.

        반환값:
            (성공 여부, 보상 포인트, 에러 메시지)
        """

        # 1. 난이도 검증
        try:
            difficulty_enum = GameDifficulty[difficulty]
        except KeyError:
            return False, 0, "Invalid difficulty level"

        # 2. 점수 범위 검증 (명백한 부정행위 탐지)
        max_score = cls.MAX_SCORES[difficulty_enum]
        if player_score < 0 or player_score > max_score:
            return False, 0, f"Invalid score: {player_score} (max: {max_score})"

        # 3. 플레이 시간 검증
        min_playtime = cls.MIN_PLAY_TIME[difficulty_enum]
        if play_time < min_playtime:
            return False, 0, f"Play time too short: {play_time}s (min: {min_playtime}s)"

        # 4. HP/Lives 검증
        if player_hp < 0 or player_hp > 100:
            return False, 0, f"Invalid player HP: {player_hp}"

        if player_lives < 0:
            return False, 0, f"Invalid player lives: {player_lives}"

        # 5. 검증 토큰 확인 (옵션: JWT나 HMAC 서명 사용)
        # if not cls.verify_token(verification_token):
        #     return False, 0, "Invalid verification token"

        # 6. 일일 클리어 제한 확인
        if db_connection:
            daily_clears = cls.count_daily_clears(user_id, difficulty_enum, db_connection)
            max_daily = cls.MAX_DAILY_CLEARS[difficulty_enum]

            if daily_clears >= max_daily:
                return False, 0, f"Daily clear limit reached: {daily_clears}/{max_daily}"

        # 7. 보상 계산
        base_reward = cls.BASE_REWARDS[difficulty_enum]

        # 점수 기반 보상 (점수가 높을수록 더 많은 보상)
        score_ratio = player_score / max_score
        score_bonus = int(base_reward * score_ratio * 0.5)  # 최대 50% 보너스

        # HP 기반 보상 (피해를 덜 입을수록 더 많은 보상)
        hp_bonus = int(base_reward * (player_hp / 100) * 0.3)  # 최대 30% 보너스

        # 목숨 보존 보상 (목숨을 많이 남길수록)
        lives_bonus = player_lives * 50  # 목숨 하나당 50포인트

        # 시간 보너스 (빠르게 클리어할수록)
        max_playtime = min_playtime * 3  # 예: NORMAL은 3분 이내
        if play_time < max_playtime:
            time_bonus = int(base_reward * 0.2)  # 20% 보너스
        else:
            time_bonus = 0

        total_reward = base_reward + score_bonus + hp_bonus + lives_bonus + time_bonus

        return True, total_reward, None

    @classmethod
    def count_daily_clears(
        cls,
        user_id: int,
        difficulty: GameDifficulty,
        db_connection
    ) -> int:
        """
        사용자의 오늘 클리어 수를 조회합니다.
        """
        today = datetime.now().date()

        # Django ORM 예제:
        # from django.db.models import Q
        # from .models import GameRecord
        # count = GameRecord.objects.filter(
        #     user_id=user_id,
        #     difficulty=difficulty.value,
        #     created_at__date=today,
        #     cleared=True
        # ).count()

        # 여기서는 0을 반환 (실제 구현에서는 DB 쿼리 필요)
        return 0

    @classmethod
    def verify_token(cls, token: str) -> bool:
        """
        게임에서 보낸 검증 토큰을 확인합니다.

        실제 구현:
        - JWT 토큰 검증
        - HMAC 서명 검증
        - 타임스탬프 기반 토큰 유효성 검증
        """
        try:
            # Base64 디코드
            import base64
            data = base64.b64decode(token).decode('utf-8')
            # 토큰 형식: "timestamp-random"
            parts = data.split('-')
            if len(parts) < 2:
                return False

            # 타임스탬프 검증 (1시간 유효)
            token_time = int(parts[0])
            current_time = int(time.time() * 1000)
            age_ms = current_time - token_time

            if age_ms > 3600000:  # 1시간 초과
                return False

            return True
        except Exception as e:
            print(f"Token verification error: {e}")
            return False

    @classmethod
    def create_reward_signature(cls, user_id: int, reward: int) -> str:
        """
        보상 지급을 위한 서명을 생성합니다.
        (이중 검증용)
        """
        data = f"{user_id}:{reward}:{int(time.time())}"
        signature = hmac.new(
            cls.SECRET_KEY.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{data}:{signature}"


# ============================================
# Django 뷰 예제
# ============================================

def example_django_view():
    """
    Django에서 게임 보상 요청을 처리하는 예제 뷰
    """
    # 실제 코드:
    # from django.http import JsonResponse
    # from django.views.decorators.http import require_http_methods
    # from django.contrib.auth.decorators import login_required
    #
    # @require_http_methods(["POST"])
    # @login_required
    # def claim_game_reward(request):
    #     try:
    #         data = json.loads(request.body)
    #
    #         # 요청 데이터 추출
    #         difficulty = data.get('difficulty')
    #         player_score = data.get('player_score', 0)
    #         play_time = data.get('play_time', 0)
    #         player_hp = data.get('player_hp', 0)
    #         player_lives = data.get('player_lives', 0)
    #         verification_token = data.get('verification_token')
    #
    #         # 검증 및 보상 계산
    #         success, reward, error = GameRewardValidator.validate_and_calculate_reward(
    #             user_id=request.user.id,
    #             difficulty=difficulty,
    #             player_score=player_score,
    #             play_time=play_time,
    #             player_hp=player_hp,
    #             player_lives=player_lives,
    #             verification_token=verification_token
    #         )
    #
    #         if not success:
    #             return JsonResponse({
    #                 'success': False,
    #                 'error': error
    #             }, status=400)
    #
    #         # 사용자 보상 지급
    #         from .models import UserGameProfile
    #         profile = UserGameProfile.objects.get_or_create(user=request.user)[0]
    #         profile.total_points += reward
    #         profile.save()
    #
    #         # 게임 기록 저장
    #         from .models import GameRecord
    #         GameRecord.objects.create(
    #             user=request.user,
    #             difficulty=difficulty,
    #             score=player_score,
    #             play_time=play_time,
    #             player_hp=player_hp,
    #             player_lives=player_lives,
    #             cleared=True
    #         )
    #
    #         # 응답
    #         return JsonResponse({
    #             'success': True,
    #             'reward_amount': reward,
    #             'total_points': profile.total_points,
    #             'signature': GameRewardValidator.create_reward_signature(
    #                 request.user.id,
    #                 reward
    #             )
    #         })
    #
    #     except json.JSONDecodeError:
    #         return JsonResponse({
    #             'success': False,
    #             'error': 'Invalid JSON'
    #         }, status=400)
    #     except Exception as e:
    #         return JsonResponse({
    #             'success': False,
    #             'error': str(e)
    #         }, status=500)

    print("Django 뷰 예제는 주석 참조")


# ============================================
# Flask 예제
# ============================================

def example_flask_view():
    """
    Flask에서 게임 보상 요청을 처리하는 예제
    """
    # 실제 코드:
    # from flask import request, jsonify
    # from flask_login import login_required, current_user
    #
    # @app.route('/api/game-rewards/claim', methods=['POST'])
    # @login_required
    # def claim_game_reward():
    #     try:
    #         data = request.json
    #
    #         # 요청 데이터 추출
    #         difficulty = data.get('difficulty')
    #         player_score = data.get('player_score', 0)
    #         play_time = data.get('play_time', 0)
    #         player_hp = data.get('player_hp', 0)
    #         player_lives = data.get('player_lives', 0)
    #         verification_token = data.get('verification_token')
    #
    #         # 검증 및 보상 계산
    #         success, reward, error = GameRewardValidator.validate_and_calculate_reward(
    #             user_id=current_user.id,
    #             difficulty=difficulty,
    #             player_score=player_score,
    #             play_time=play_time,
    #             player_hp=player_hp,
    #             player_lives=player_lives,
    #             verification_token=verification_token
    #         )
    #
    #         if not success:
    #             return jsonify({
    #                 'success': False,
    #                 'error': error
    #             }), 400
    #
    #         # 사용자 보상 지급
    #         current_user.game_points += reward
    #         db.session.commit()
    #
    #         # 게임 기록 저장
    #         game_record = GameRecord(
    #             user_id=current_user.id,
    #             difficulty=difficulty,
    #             score=player_score,
    #             play_time=play_time,
    #             player_hp=player_hp,
    #             player_lives=player_lives,
    #             cleared=True
    #         )
    #         db.session.add(game_record)
    #         db.session.commit()
    #
    #         return jsonify({
    #             'success': True,
    #             'reward_amount': reward,
    #             'total_points': current_user.game_points,
    #             'signature': GameRewardValidator.create_reward_signature(
    #                 current_user.id,
    #                 reward
    #             )
    #         })
    #
    #     except Exception as e:
    #         return jsonify({
    #             'success': False,
    #             'error': str(e)
    #         }), 500

    print("Flask 예제는 주석 참조")


# ============================================
# 테스트
# ============================================

if __name__ == "__main__":
    # 테스트 케이스
    print("게임 보상 검증 테스트\n")

    test_cases = [
        {
            "name": "정상 NORMAL 클리어",
            "user_id": 1,
            "difficulty": "NORMAL",
            "player_score": 3500,
            "play_time": 180,
            "player_hp": 75,
            "player_lives": 1,
            "verification_token": "test-token"
        },
        {
            "name": "HARD 클리어",
            "user_id": 2,
            "difficulty": "HARD",
            "player_score": 6000,
            "play_time": 240,
            "player_hp": 50,
            "player_lives": 0,
            "verification_token": "test-token"
        },
        {
            "name": "점수가 너무 높은 부정행위",
            "user_id": 3,
            "difficulty": "NORMAL",
            "player_score": 10000,
            "play_time": 300,
            "player_hp": 100,
            "player_lives": 5,
            "verification_token": "test-token"
        },
        {
            "name": "플레이 시간이 너무 짧은 경우",
            "user_id": 4,
            "difficulty": "NORMAL",
            "player_score": 2000,
            "play_time": 5,
            "player_hp": 100,
            "player_lives": 2,
            "verification_token": "test-token"
        }
    ]

    for test in test_cases:
        success, reward, error = GameRewardValidator.validate_and_calculate_reward(
            user_id=test["user_id"],
            difficulty=test["difficulty"],
            player_score=test["player_score"],
            play_time=test["play_time"],
            player_hp=test["player_hp"],
            player_lives=test["player_lives"],
            verification_token=test["verification_token"]
        )

        print(f"테스트: {test['name']}")
        print(f"  결과: {'✓ 성공' if success else '✗ 실패'}")
        if success:
            print(f"  보상: {reward} 포인트")
        else:
            print(f"  에러: {error}")
        print()
