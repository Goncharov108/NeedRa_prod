#!/usr/bin/env bash
# Деплой статики NeedRa на VPS (сборка + rsync + проверка).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${NEEDRA_DEPLOY_HOST:-93.183.71.67}"
USER="${NEEDRA_DEPLOY_USER:-root}"
REMOTE_PATH="${NEEDRA_DEPLOY_PATH:-/var/www/needra}"
CHECK_URL="${NEEDRA_DEPLOY_URL:-https://needra.ru/}"
SSH_TARGET="${USER}@${HOST}"

cd "$ROOT"

echo "==> SSH check: ${SSH_TARGET}"
ssh -o BatchMode=yes -o ConnectTimeout=15 "$SSH_TARGET" 'echo ok' >/dev/null

echo "==> npm run build"
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "error: dist/index.html не найден после сборки" >&2
  exit 1
fi

echo "==> rsync → ${SSH_TARGET}:${REMOTE_PATH}/"
rsync -az --delete -e "ssh -o BatchMode=yes" \
  dist/ "${SSH_TARGET}:${REMOTE_PATH}/"

echo "==> права www-data"
ssh -o BatchMode=yes "$SSH_TARGET" \
  "chown -R www-data:www-data '${REMOTE_PATH}'"

echo "==> проверка ${CHECK_URL}"
HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 15 "$CHECK_URL")"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "error: ожидался HTTP 200, получено ${HTTP_CODE}" >&2
  exit 1
fi

echo "OK: задеплоено, ${CHECK_URL} → ${HTTP_CODE}"
