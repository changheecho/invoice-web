#!/bin/bash

# Claude Code 권한 요청 Slack 알림 Hook
# 목적: 도구 사용 권한 요청 및 민감한 정보 조회 시도 감지 시 Slack으로 알림 전송
# Hook 이벤트: PermissionRequest, PreToolUse

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_PROJECT_DIR="$(pwd)"

# 슬랙 유틸리티 라이브러리 로드
source "$SCRIPT_DIR/lib/slack-utils.sh"

# 민감한 파일/정보 목록
SENSITIVE_PATTERNS=(".env" "package-lock.json" ".claude" "secrets" "credentials" "token" "password" "api_key" "private_key")

# 민감한 정보 조회 시도 감지
check_sensitive_access() {
  local file_path="$1"

  for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if [[ "$file_path" == *"$pattern"* ]]; then
      return 0  # 민감한 정보 접근 감지
    fi
  done

  return 1  # 민감한 정보 아님
}

# stdin으로 JSON 읽기
INPUT_JSON=$(cat)
log_debug "Hook 이벤트 발생: $INPUT_JSON"

# 프로젝트 이름 추출
PROJECT_NAME="claude-nextjs-starters"
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  PROJECT_NAME=$(jq -r '.name // "claude-nextjs-starters"' "$CLAUDE_PROJECT_DIR/package.json")
fi

# JSON 필드 추출
MESSAGE=$(jq -r '.message // "알림"' <<< "$INPUT_JSON")
HOOK_EVENT=$(jq -r '.hook_event_name // "unknown"' <<< "$INPUT_JSON")
TOOL_NAME=$(jq -r '.tool_name // ""' <<< "$INPUT_JSON")

# 민감한 정보 접근 시도 감지
FILE_PATH=$(jq -r '.tool_input.file_path // ""' <<< "$INPUT_JSON")
IS_SENSITIVE_ACCESS=0

if [ -n "$FILE_PATH" ] && check_sensitive_access "$FILE_PATH"; then
  IS_SENSITIVE_ACCESS=1
  log_debug "민감한 정보 조회 시도 감지: $FILE_PATH"
fi

# 상태 요약 생성
generate_status_summary() {
  local event="$1"
  local tool="$2"
  local is_sensitive="$3"

  local summary=""

  # 민감한 정보 접근 시도 확인
  if [ "$is_sensitive" -eq 1 ]; then
    summary="🚨 민감한 정보 조회 시도 감지"
  else
    # 이벤트 타입별 기본 상태
    case "$event" in
      PermissionRequest)
        summary="🔔 도구 사용 권한 요청"
        ;;
      Stop)
        summary="✅ 작업 완료"
        ;;
      TaskCompleted)
        summary="✅ 작업 완료"
        ;;
      PostToolUse)
        summary="🔧 도구 실행 완료"
        ;;
      *)
        summary="📢 알림"
        ;;
    esac
  fi

  # 도구 이름이 있으면 추가
  if [ -n "$tool" ]; then
    summary="$summary (도구: $tool)"
  fi

  echo "$summary"
}

STATUS_SUMMARY=$(generate_status_summary "$HOOK_EVENT" "$TOOL_NAME" "$IS_SENSITIVE_ACCESS")

# 간결한 포맷으로 메시지 구성
MESSAGE_BODY=$(cat <<EOF
*프로젝트*: $PROJECT_NAME

*상태 요약*: $STATUS_SUMMARY
*메시지*: $MESSAGE
EOF
)

# PreToolUse 이벤트에서는 민감한 파일만 알림 전송
if [ "$HOOK_EVENT" = "PreToolUse" ] && [ "$IS_SENSITIVE_ACCESS" -eq 0 ]; then
  log_debug "일반 파일 접근 - 알림 스킵: $FILE_PATH"
  exit 0  # 민감한 파일 아니면 조용히 종료
fi

# 민감한 정보 접근 시도 시 추가 정보 포함
if [ "$IS_SENSITIVE_ACCESS" -eq 1 ]; then
  ACCESS_ACTION="읽기"
  if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write" ]]; then
    ACCESS_ACTION="수정"
  fi

  MESSAGE_BODY="$MESSAGE_BODY

⚠️ *접근 시도 파일*: \`$FILE_PATH\`
🔍 *접근 타입*: $ACCESS_ACTION
🔒 *차단 여부*: $(if [[ "$ACCESS_ACTION" == "수정" ]]; then echo "차단됨 (PreToolUse 정책)"; else echo "읽기는 허용됨"; fi)"
fi

MESSAGE_BODY="$MESSAGE_BODY

*시간*: $(date '+%Y-%m-%d %H:%M:%S')"

# 이벤트 타입 및 민감한 정보 접근 시도 여부에 따른 타이틀
if [ "$IS_SENSITIVE_ACCESS" -eq 1 ]; then
  NOTIFICATION_TITLE="🚨 보안 알림 - 민감한 정보 조회 시도"
else
  NOTIFICATION_TITLE="📢 알림 - $HOOK_EVENT"
fi

# 민감한 정보 접근 시도 시 메시지 타입을 다르게 설정
MESSAGE_TYPE="notification"
if [ "$IS_SENSITIVE_ACCESS" -eq 1 ]; then
  MESSAGE_TYPE="permission_request"  # 주황색으로 강조
fi

# Slack 메시지 전송
if send_slack_message \
  "$MESSAGE_TYPE" \
  "$NOTIFICATION_TITLE" \
  "$MESSAGE_BODY"; then
  if [ "$IS_SENSITIVE_ACCESS" -eq 1 ]; then
    log_debug "민감한 정보 조회 시도 알림 전송 완료"
  else
    log_debug "일반 알림 전송 완료"
  fi
else
  if [ "$IS_SENSITIVE_ACCESS" -eq 1 ]; then
    log_debug "민감한 정보 조회 시도 알림 전송 실패"
  else
    log_debug "일반 알림 전송 실패"
  fi
fi

# 항상 성공 (Claude Code 작업 방해 방지)
exit 0
