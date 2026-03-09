#!/bin/bash
# 전체 연도 순차 프리워밍 + Telegram 알림
# 사용법: bash prewarm_all.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON=python3
PREWARM="$SCRIPT_DIR/prewarm.py"

R2_ACCOUNT_ID="0b1b9a73d21cc9095a9b3d5618cc359d"
R2_ACCESS_KEY="6d1ad0c9c7f616f9702aae0edfe4baf2"
R2_SECRET_KEY="fab81fe49fc1c7df29fc0aeac97aea4f2810cdd4174d7f21e7163b8fa19ecbad"
R2_BUCKET="f1-cashe"

BOT_TOKEN="8604511383:AAGOe4Jfo9RkAMpN9-d-6-4jJvBRctHEkNE"
CHAT_ID="@f1324ing"

LOCAL_CACHE="/tmp/f1-diskcache"
BASE_URL="http://localhost:8001"

# 2025는 이미 실행 중이므로 완료 대기 후 2024~2018 순차 실행
YEARS=(2024 2023 2022 2021 2020 2019 2018)

send_telegram() {
  local msg="$1"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${msg}" \
    -d "parse_mode=HTML" > /dev/null
}

echo "=== 전체 연도 프리워밍 시작 (2024~2018) ==="
echo "2025는 별도로 실행 중..."
echo ""

# 2025 완료 알림은 prewarm_notify_2025.sh에서 처리
# 여기서는 2024~2018 처리

for YEAR in "${YEARS[@]}"; do
  echo "======================================"
  echo "[$YEAR] 프리워밍 시작: $(date)"
  echo "======================================"

  $PYTHON "$PREWARM" \
    --year "$YEAR" \
    --base-url "$BASE_URL" \
    --local-cache "$LOCAL_CACHE" \
    --r2-account-id "$R2_ACCOUNT_ID" \
    --r2-access-key "$R2_ACCESS_KEY" \
    --r2-secret-key "$R2_SECRET_KEY" \
    --r2-bucket "$R2_BUCKET"

  EXIT_CODE=$?
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

  if [ $EXIT_CODE -eq 0 ]; then
    MSG="✅ F1 프리워밍 완료: ${YEAR}년
📅 ${TIMESTAMP}
🗄️ R2 버킷: ${R2_BUCKET}"
    echo "$MSG"
    send_telegram "$MSG"
  else
    MSG="❌ F1 프리워밍 실패: ${YEAR}년 (종료 코드: ${EXIT_CODE})
📅 ${TIMESTAMP}"
    echo "$MSG"
    send_telegram "$MSG"
  fi

  echo ""
done

send_telegram "🏁 전체 F1 프리워밍 완료 (2018~2025)
📅 $(date '+%Y-%m-%d %H:%M')
🚀 Railway 서버에서 즉시 로드 가능합니다"
echo "=== 전체 완료 ==="
