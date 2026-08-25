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

fail_check() { echo "error: $1" >&2; exit 1; }

grep -q 'Аналитика кабинета ВБ и Озон' dist/index.html || fail_check "dist/index.html без h1 сайта 2.0"
grep -q 'stage--how' dist/index.html || fail_check "dist/index.html без .stage--how"
grep -q 'class="site"' dist/index.html || fail_check "dist/index.html без .site"
grep -q 'hero-v31-page' dist/index.html && fail_check "dist/index.html всё ещё лендинг hero v3.1"
grep -q 'noindex' dist/index.html && fail_check "dist/index.html с noindex"

grep -q 'hero-v31-page' dist/landing-v1/index.html || fail_check "dist/landing-v1/index.html не лендинг v1"
grep -q 'noindex' dist/landing-v1/index.html || fail_check "dist/landing-v1 без noindex"

[[ -f dist/analitika-ozon/index.html ]] || fail_check "нет dist/analitika-ozon/index.html"
[[ -f dist/analitika-wb/index.html ]] || fail_check "нет dist/analitika-wb/index.html"
[[ -f dist/legal/privacy-policy.html ]] || fail_check "нет dist/legal/privacy-policy.html"
[[ -f dist/assets/lab/NeedRa_movie.mp4 ]] || fail_check "нет видео NeedRa_movie.mp4"
[[ -f dist/assets/lab/NeedRa.xlsx ]] || fail_check "нет NeedRa.xlsx"
grep -q 'data-lk-endpoint="https://lk.needra.ru/dev/auth/landing-register"' dist/index.html \
  || fail_check "форма без data-lk-endpoint"

echo "==> проверки dist/ ок"

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
