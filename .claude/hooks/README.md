# Claude Code Hooks - Slack 웹훅 통합 가이드

Claude Code의 Hook 시스템을 활용하여 Slack으로 실시간 알림을 받을 수 있습니다. 이 가이드는 설정 방법과 사용법을 설명합니다.

## 목차

- [개요](#개요)
- [설정 방법](#설정-방법)
- [사용 방법](#사용-방법)
- [수동 테스트](#수동-테스트)
- [트러블슈팅](#트러블슈팅)
- [보안](#보안)
- [파일 구조](#파일-구조)

---

## 개요

### 알림 시나리오

이 Hook 시스템은 다음 두 가지 시나리오에서 Slack 알림을 전송합니다:

1. **권한 요청 알림** (`PermissionRequest`)
   - Claude Code가 도구 사용 권한을 요청할 때 발생
   - 예: Bash 명령어 실행, 파일 수정, 웹 검색 등
   - 모바일에서 즉시 확인 가능

2. **작업 완료 알림** (`TaskCompleted`)
   - Claude Code의 작업이 완료되었을 때 발생
   - 작업 정보를 함께 전송
   - 다음 작업을 즉시 지시할 수 있음

### 기대 효과

- ✅ 모바일에서 Claude Code의 진행 상황 실시간 파악
- ✅ 권한 요청을 미리 인지하고 준비 가능
- ✅ 작업 완료 시 즉시 확인하여 다음 작업 지시
- ✅ 데스크톱을 떠나 있어도 중요한 알림 놓치지 않음

---

## 설정 방법

### 1단계: Slack Incoming Webhook 생성

1. [Slack API 페이지](https://api.slack.com/messaging/webhooks) 접속
2. **Create New App** 클릭
   - **From scratch** 선택
   - App 이름 입력: "Claude Code Notifications"
   - Workspace 선택
3. **Incoming Webhooks** 메뉴 클릭
4. **Toggle On** → **Add New Webhook to Workspace** 클릭
5. 알림을 받을 채널 선택 (예: #claude-code)
6. **Allow** 클릭
7. **Webhook URL** 복사
   ```
   https://hooks.slack.com/services/[WORKSPACE-ID]/[CHANNEL-ID]/[WEBHOOK-TOKEN]
   ```

### 2단계: 환경변수 설정

프로젝트 루트의 `.env` 파일에 Webhook URL 입력:

```bash
# .env 파일
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

> **주의**: `.env` 파일은 Git에 자동으로 무시됩니다. Slack Webhook URL이 노출되지 않습니다.

### 3단계: 파일 권한 확인

Hook 스크립트가 실행 가능한지 확인:

```bash
# 실행 권한이 있는지 확인
ls -l .claude/hooks/*.sh .claude/hooks/lib/*.sh

# 결과: -rwxr-xr-x 로 시작해야 함
# 권한이 없으면 다음 명령어 실행:
chmod +x .claude/hooks/*.sh .claude/hooks/lib/*.sh
```

### 4단계: 설정 완료

Claude Code를 다시 시작하면 Hook이 자동으로 활성화됩니다.

---

## 사용 방법

### 권한 요청 알림

Claude Code가 도구 사용 권한을 요청하면 Slack에 자동으로 알림이 전송됩니다:

```
🔔 :question: Claude Code 권한 요청

도구: `Bash`
설명: npm 패키지 설치
명령어:
```
npm install lodash
```

Claude Code가 도구 사용 권한을 요청하고 있습니다.

_2026-02-07 14:30:45_
```

**Slack 모바일에서**:
1. 알림 수신
2. 데스크톱의 Claude Code에서 권한 승인/거부
3. 작업 진행

### 작업 완료 알림

TaskCreate 또는 TaskUpdate를 사용하여 작업을 관리하면, 작업 완료 시 자동으로 알림이 전송됩니다:

```
✅ Claude Code 작업 완료

작업 ID: #1
제목: npm 패키지 설치 완료
상태: `completed`

설명:
lodash 패키지가 성공적으로 설치되었습니다.

작업이 완료되었습니다.

_2026-02-07 14:31:22_
```

---

## 수동 테스트

### 테스트 1: 권한 요청 Hook

Hook 스크립트를 직접 실행하여 테스트합니다:

```bash
cd /Users/changhee/Documents/WorkSpace/claude-nextjs-starters

# 테스트 JSON 입력 생성
echo '{
  "hook_event_name": "PermissionRequest",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm install test-package",
    "description": "테스트 패키지 설치"
  }
}' | bash .claude/hooks/permission-request-slack.sh
```

**예상 결과**:
- Slack 채널에 "Claude Code 권한 요청" 메시지 수신
- 도구: `Bash`
- 명령어: `npm install test-package`

### 테스트 2: 작업 완료 Hook

```bash
echo '{
  "hook_event_name": "TaskCompleted",
  "task_id": "test-001",
  "subject": "테스트 작업",
  "status": "completed",
  "description": "이것은 테스트 작업입니다."
}' | bash .claude/hooks/task-completed-slack.sh
```

**예상 결과**:
- Slack 채널에 "Claude Code 작업 완료" 메시지 수신
- 작업 ID: #test-001
- 제목: 테스트 작업

### 로그 확인

Hook 실행 로그를 확인합니다:

```bash
# 모든 로그 보기
cat .claude/hooks/logs/slack-hooks.log

# 최근 5개 로그만 보기
tail -5 .claude/hooks/logs/slack-hooks.log

# 예상 로그:
# [2026-02-07 14:30:45] PermissionRequest 이벤트 발생: {"tool_name":"Bash",...}
# [2026-02-07 14:30:46] TaskCompleted 이벤트 발생: {"task_id":"1",...}
```

---

## 트러블슈팅

### 문제 1: Slack 알림이 오지 않음

**원인별 해결 방법**:

#### A. Webhook URL이 설정되지 않음

```bash
# .env 파일 확인
cat .env | grep SLACK_WEBHOOK_URL

# URL이 비어있으면 설정
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" >> .env
```

#### B. 잘못된 Webhook URL

Slack Webhook URL을 직접 테스트합니다:

```bash
source .env
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"테스트 메시지"}'

# 성공: "ok" 응답
# 실패: "invalid_token" 등의 에러
```

#### C. 로그 파일 확인

```bash
cat .claude/hooks/logs/slack-hooks.log | tail -10
```

### 문제 2: "permission denied" 에러

Hook 스크립트의 실행 권한이 없는 경우:

```bash
# 권한 부여
chmod +x .claude/hooks/*.sh
chmod +x .claude/hooks/lib/*.sh

# 재확인
ls -l .claude/hooks/*.sh
# -rwxr-xr-x 로 시작해야 함
```

### 문제 3: Hook이 실행되지 않음

`.claude/settings.local.json` 설정을 확인합니다:

```bash
# JSON 문법 검증
jq . < .claude/settings.local.json

# 문법 에러가 있으면 수정
# Hook 설정 확인
jq '.hooks.PermissionRequest, .hooks.TaskCompleted' < .claude/settings.local.json
```

**자주 발생하는 오류**:
- Hook 경로가 잘못됨
- JSON 문법 오류 (따옴표, 쉼표 누락)
- 실행 권한 없음

### 문제 4: 중복 알림

`.claude/settings.local.json`에서 Hook이 중복으로 정의되지 않았는지 확인:

```bash
# Hook 설정 확인
jq '.hooks | keys' < .claude/settings.local.json

# PermissionRequest와 TaskCompleted가 한 번만 나타나야 함
```

### 문제 5: 네트워크 오류

Slack Webhook 호출이 실패해도 Claude Code 작업은 계속됩니다 (exit 0):

```bash
# 네트워크 문제 확인
curl -s -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H 'Content-Type: application/json' \
  --max-time 5 \
  -d '{"text":"test"}'

# 실패하면 인터넷 연결 확인
```

---

## 보안

### Webhook URL 보호

Slack Webhook URL은 민감한 정보입니다:

- ✅ `.env` 파일에 저장 (Git 무시)
- ✅ 파일 권한 제한:
  ```bash
  chmod 600 .env
  ls -l .env  # -rw------- 여야 함
  ```
- ✅ 팀원과 공유 시 개인별로 Webhook URL 생성 권장
- ❌ `.env`를 Git 저장소에 커밋하지 않음
- ❌ Webhook URL을 코드나 주석에 직접 입력하지 않음

### 로그 파일 관리

Hook 실행 로그는 `.claude/hooks/logs/slack-hooks.log`에 저장됩니다:

- ⚠️ 민감한 정보(명령어, 파일 경로 등)가 포함될 수 있음
- ✅ `.gitignore`에 추가되어 Git에 커밋되지 않음
- 권장: 정기적으로 로그 파일 삭제
  ```bash
  rm .claude/hooks/logs/slack-hooks.log
  ```

---

## 파일 구조

```
.claude/hooks/
├── README.md                          # 이 파일 (사용 가이드)
├── permission-request-slack.sh        # 권한 요청 Hook 스크립트
├── task-completed-slack.sh            # 작업 완료 Hook 스크립트
├── lib/
│   └── slack-utils.sh                 # Slack 유틸리티 라이브러리
└── logs/
    └── slack-hooks.log                # Hook 실행 로그 (Git 무시)

.env                                   # Slack Webhook URL (Git 무시)
.claude/settings.local.json            # Claude Code Hook 설정
.gitignore                             # Git 무시 파일 목록
```

### 각 파일의 역할

| 파일 | 역할 | 수정 필요 |
|------|------|---------|
| `permission-request-slack.sh` | 권한 요청 알림 전송 | ❌ |
| `task-completed-slack.sh` | 작업 완료 알림 전송 | ❌ |
| `lib/slack-utils.sh` | 공통 함수 (URL 로드, 메시지 전송) | ❌ |
| `.env` | Slack Webhook URL | ✅ 필요 |
| `.claude/settings.local.json` | Hook 설정 | ✅ 이미 설정됨 |

---

## 향후 확장 가능성

### 추가 가능한 Hook 이벤트

- `Stop`: Claude 응답 완료 시
- `PostToolUse`: 도구 사용 성공 후
- `PostToolUseFailure`: 도구 사용 실패 후

### 다른 알림 채널

- Discord Webhook
- Telegram Bot
- 이메일 (sendmail, SMTP)

### 메시지 커스터마이징

- 메시지 템플릿 시스템
- 사용자별 메시지 형식 설정
- 조건부 알림 (특정 도구만, 특정 시간대만)

---

## 참고 자료

- [Claude Code Hooks 가이드](https://code.claude.com/docs/en/hooks-guide.md)
- [Slack Incoming Webhooks API](https://api.slack.com/messaging/webhooks)
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder)

---

## 체크리스트

초기 설정 완료 확인:

- [x] Slack Webhook URL 생성
- [x] `.env` 파일에 Webhook URL 입력
- [x] `.claude/hooks/` 디렉토리 구조 생성
- [x] 스크립트 파일 생성 및 권한 부여
- [x] `.claude/settings.local.json` 업데이트
- [x] `.gitignore` 업데이트
- [ ] 수동 테스트 - 권한 요청 Hook
- [ ] 수동 테스트 - 작업 완료 Hook
- [ ] 통합 테스트 - Claude Code에서 권한 요청
- [ ] 통합 테스트 - Claude Code에서 작업 완료
- [ ] Slack 모바일 앱에서 알림 수신 확인

---

**작성일**: 2026-02-07
**작성자**: Claude Code
**버전**: 1.0
