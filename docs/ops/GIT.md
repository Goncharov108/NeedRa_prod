# Git — ветки, коммиты, релизы

Репозиторий лендинга NeedRa. Цель: понятная история и безопасные выкладки на https://needra.ru.

## Первый запуск репозитория

Если `.git` ещё нет:

```bash
cd /Users/mac108/Documents/CURSOR/NeedRa/NeedRa_prod
git init
git add .
git status   # убедиться, что нет .env, ключей, dist/
git commit -m "$(cat <<'EOF'
Initial commit: NeedRa landing and ops docs.

EOF
)"
```

Remote (когда будет репозиторий на GitHub):

```bash
git remote add origin https://github.com/Goncharov108/NeedRa_prod.git
git branch -M main
git push -u origin main
```

Секреты и `dist/` в коммит не попадают (см. `.gitignore`).

## Ветки

| Ветка | Назначение |
|-------|------------|
| `main` | То, что можно выкатывать на прод |
| `feat/<коротко>` | Новая фича / блок лендинга |
| `fix/<коротко>` | Багфикс |
| `chore/<коротко>` | Документация, скрипты, зависимости |

Короткий поток:

```bash
git checkout main
git pull
git checkout -b feat/hero-copy
# …правки…
git add -p
git commit
git checkout main
git merge feat/hero-copy
npm run deploy
```

Пока один основной разработчик — merge в `main` локально нормален. Когда появится remote и ревью — через PR.

## Сообщения коммитов

Стиль: **зачем**, не пересказ diff. 1–2 предложения. Язык: русский или английский — единообразно в рамках серии.

Примеры:

```text
Уточнить CTA hero: ведём сразу в lk.needra.ru.

Добавить ops-доки и скрипт деплоя на VPS.

Починить кэш статики nginx для CSS после выкладки.
```

Префиксы по желанию (удобно в логе):

- `feat:` новая возможность на лендинге  
- `fix:` исправление  
- `docs:` только документация  
- `chore:` инфраструктура, скрипты, зависимости  
- `perf:` скорость / вес ассетов  

Не коммитить:

- пароли, `.env`, приватные ключи  
- `node_modules/`, `dist/`  
- огромные бинарники без нужды (лучше CDN / сжатие)

## Что коммитить перед деплоем

1. Рабочее состояние на `main` (или явный hotfix-коммит).
2. Документация, если менялись домен, пути, скрипт деплоя.
3. Не полагаться на «только на сервере поправил» — правка должна жить в git, иначе следующий `rsync --delete` или чужой деплой затрёт.

## Релизный чеклист

- [ ] `git status` чистый (или осознанный WIP не на прод)
- [ ] `npm run build` без ошибок
- [ ] `npm run preview` — визуально ок
- [ ] коммит(ы) с понятным сообщением
- [ ] `npm run deploy`
- [ ] проверка https://needra.ru
- [ ] при remote: `git push origin main`

## Теги (по желанию)

После стабильной выкладки:

```bash
git tag -a v0.1.0 -m "Лендинг на needra.ru, nginx+SSL"
git push origin v0.1.0
```

Откат к состоянию тега: checkout/тег → `npm run deploy` (см. [DEPLOY.md](./DEPLOY.md)).

## Связь с GitHub SSH

Для `git clone git@github.com:…` нужен ключ в аккаунте GitHub (не путать с ключом на VPS):

- Локальный ключ: `~/.ssh/id_ed25519`
- На GitHub: Settings → SSH and GPG keys  
- Проверка: `ssh -T git@github.com`

VPS и GitHub могут использовать **один и тот же** публичный ключ с Mac — это нормально: два разных `authorized_keys` / аккаунта.
