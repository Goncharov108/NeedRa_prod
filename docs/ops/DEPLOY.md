# Деплой лендинга NeedRa

Прод: **https://needra.ru**  
На сервере только статика. Сборка — локально (или в CI), выкладка — rsync в `/var/www/needra`.

## Предусловия

- Есть SSH-доступ: `ssh root@93.183.71.67` без пароля (ключ).
- Локально: Node.js, зависимости `npm install`.
- DNS `needra.ru` / `www.needra.ru` → IP VPS (см. [VPS.md](./VPS.md)).

## Обычный деплой (рекомендуется)

Из корня репозитория:

```bash
npm run deploy
```

Скрипт `scripts/deploy.sh`:

1. `npm run build` → каталог `dist/`
2. `rsync` на `root@93.183.71.67:/var/www/needra/`
3. `chown -R www-data:www-data`
4. Проверка HTTP-статуса `https://needra.ru/`

### Переменные окружения (опционально)

| Переменная | По умолчанию | Смысл |
|------------|--------------|--------|
| `NEEDRA_DEPLOY_HOST` | `93.183.71.67` | Хост SSH |
| `NEEDRA_DEPLOY_USER` | `root` | Пользователь SSH |
| `NEEDRA_DEPLOY_PATH` | `/var/www/needra` | Корень сайта |
| `NEEDRA_DEPLOY_URL` | `https://needra.ru/` | URL проверки после выкладки |

Пример:

```bash
NEEDRA_DEPLOY_HOST=needra.ru npm run deploy
```

## Вручную (если скрипт недоступен)

```bash
npm run build
rsync -az --delete -e "ssh -o BatchMode=yes" \
  dist/ root@93.183.71.67:/var/www/needra/
ssh root@93.183.71.67 'chown -R www-data:www-data /var/www/needra'
curl -sI https://needra.ru/ | head -10
```

Флаг `--delete` убирает на сервере файлы, которых больше нет в `dist/`. Не клади на сервер ничего «ручного» вне деплоя — сотрётся.

## Что попадает на прод

- Содержимое `dist/` после `vite build` **и** `scripts/prune-dist.mjs`
  (лабораторные hero-v2/orbit/ads и дубликаты `cards-muted` с сервера не уезжают).
- `dist/` в git **не коммитим** (см. `.gitignore`).

Локальный превью перед выкладкой:

```bash
npm run build && npm run preview
```

## Откат

Быстрого автоотката нет (нет релизов на сервере). Варианты:

1. **Git:** `git checkout <хороший-коммит>` → `npm run deploy`
2. **Бэкап:** перед рискованным релизом скопировать каталог на сервере:

```bash
ssh root@93.183.71.67 \
  'cp -a /var/www/needra /var/www/needra.bak-$(date +%Y%m%d-%H%M)'
```

Восстановление:

```bash
ssh root@93.183.71.67 \
  'rm -rf /var/www/needra && mv /var/www/needra.bak-YYYYMMDD-HHMM /var/www/needra && chown -R www-data:www-data /var/www/needra'
```

## Первый подъём сервера (один раз)

Если сервер новый (nginx ещё нет) — см. чеклист в [VPS.md](./VPS.md). Кратко:

```bash
# на сервере
apt update && apt install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/needra
# конфиг sites-available/needra → sites-enabled, убрать default
nginx -t && systemctl reload nginx
certbot --nginx -d needra.ru -d www.needra.ru --redirect
```

Затем с Mac: `npm run deploy`.

## Проверки после деплоя

- [ ] https://needra.ru открывается, title NeedRa
- [ ] https://www.needra.ru → 301 на https://needra.ru (канон — apex)
- [ ] http → https редирект
- [ ] CTA на https://lk.needra.ru/ живой
- [ ] Нет смешанного контента (всё по https)
- [ ] В `<head>`: `yandex-verification` = `6bd627d9a4511651`, canonical `https://needra.ru/`, og:url, og:image
- [ ] `/robots.txt` и `/sitemap.xml` — `text/plain` и `text/xml`, не HTML

## Типичные проблемы

| Симптом | Что проверить |
|---------|----------------|
| `Permission denied (publickey)` | Ключ в `authorized_keys`, `ssh-add -l` |
| Старый сайт после деплоя | Hard refresh / CDN-кэш; `ls -la` дату файлов на сервере |
| 502 / пусто | `systemctl status nginx`, `nginx -t`, права на `/var/www/needra` |
| SSL ошибка | `certbot certificates`, DNS, порт 80 для renew |
| `rsync` стёр лишнее | Не хранить ручные файлы в `/var/www/needra` |

## Связь с Git

Деплой **не** привязан к push автоматически. Порядок «как положено»:

1. Правки → коммит (см. [GIT.md](./GIT.md))
2. Локально проверить `npm run build` / preview
3. `npm run deploy`
4. В описании релиза/чата — URL и короткий список изменений

CI (GitHub Actions → rsync) можно добавить позже; пока источник правды — ручной `npm run deploy` с машины с SSH-ключом.
