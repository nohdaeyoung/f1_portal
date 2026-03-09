#!/bin/bash
# 2025 프리워밍 완료 대기 → Telegram 알림 → 2024~2018 순차 실행

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON=python3
PREWARM="$SCRIPT_DIR/prewarm.py"
LOG_FILE="/private/tmp/claude-501/-Volumes-Dev-daeyoung-openclaw-main/tasks/bzwovnto3.output"

R2_ACCOUNT_ID="0b1b9a73d21cc9095a9b3d5618cc359d"
R2_ACCESS_KEY="6d1ad0c9c7f616f9702aae0edfe4baf2"
R2_SECRET_KEY="fab81fe49fc1c7df29fc0aeac97aea4f2810cdd4174d7f21e7163b8fa19ecbad"
R2_BUCKET="f1-cashe"

BOT_TOKEN="8604511383:AAGOe4Jfo9RkAMpN9-d-6-4jJvBRctHEkNE"
CHAT_ID="@f1324ing"

LOCAL_CACHE="/tmp/f1-diskcache"
BASE_URL="http://localhost:8001"

YEARS=(2024 2023 2022 2021 2020 2019 2018)

send_telegram() {
  local msg="$1"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${msg}" \
    -d "parse_mode=HTML" > /dev/null
}

echo "2025 프리워밍 완료 대기 중..."

# 2025 프리워밍 프로세스 완료 대기
while true; do
  if grep -q "=== 완료:" "$LOG_FILE" 2>/dev/null; then
    RESULT=$(grep "=== 완료:" "$LOG_FILE" | tail -1)
    echo "2025 완료 감지: $RESULT"
    break
  fi
  # 프로세스가 종료됐는지 확인
  if ! ps aux | grep -v grep | grep -q "prewarm.py.*2025"; then
    echo "2025 프리워밍 프로세스 종료 감지"
    break
  fi
  sleep 30
done

TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
send_telegram "✅ F1 프리워밍 완료: 2025년
📅 ${TIMESTAMP}
⏭️ 2024~2018 순차 진행 시작..."

echo ""
echo "=== 2024~2018 순차 프리워밍 시작 ==="

for YEAR in "${YEARS[@]}"; do
  echo ""
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
🗄️ R2: ${R2_BUCKET}"
    echo "$MSG"
    send_telegram "$MSG"
  else
    MSG="❌ F1 프리워밍 오류: ${YEAR}년 (코드: ${EXIT_CODE})
📅 ${TIMESTAMP}"
    echo "$MSG"
    send_telegram "$MSG"
  fi
done

send_telegram "🏁 전체 F1 프리워밍 완료! (2018~2025)
📅 $(date '+%Y-%m-%d %H:%M')
🚀 Railway 서버 즉시 로드 준비 완료"
echo ""
echo "=== 전체 완료 ==="
