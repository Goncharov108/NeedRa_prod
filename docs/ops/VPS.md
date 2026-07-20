# VPS — паспорт продакшен-сервера

Лендинг NeedRa крутится на отдельном VPS: статика через nginx + HTTPS (Let's Encrypt).

## Реквизиты

| Параметр | Значение |
|----------|----------|
| Тариф | RU-1-NVMe (KVM, NVMe) |
| Хостнейм | `vps1784543502.tech0.ru` |
| IPv4 | `93.183.71.67` |
| IPv6 | `2a13:a500::105` |
| ОС | Ubuntu 24.04 LTS (`x86_64`) |
| CPU | 1 × Intel Xeon |
| RAM | 1 GB |
| Диск | ~10 GB NVMe (на практике ~8.7 GB) |
| Сеть | от 200 Mbps (shared) |

Этого хватает для **статического** лендинга. Не ставить на этот же тариф тяжёлые сервисы (БД, n8n, несколько Node-приложений) без апгрейда RAM.

## Домены и DNS

| Имя | Тип | Куда |
|-----|-----|------|
| `needra.ru` | A | `93.183.71.67` |
| `www.needra.ru` | A | `93.183.71.67` |
| `lk.needra.ru` | — | **не** на этот VPS (личный кабинет снаружи) |

Проверка с Mac:

```bash
dscacheutil -q host -a name needra.ru
# ожидаемо: ip_address: 93.183.71.67
```

## SSH

### Как заходить

```bash
ssh root@93.183.71.67
# или
ssh root@needra.ru
```

Аутентификация: **публичный ключ** с рабочей машины (`~/.ssh/id_ed25519`).  
Комментарий ключа на GitHub/машине: `mac108-model-deploy`.

Файл на сервере: `/root/.ssh/authorized_keys`.

### Добавить новый ключ (с Mac)

```bash
# показать свой публичный ключ
cat ~/.ssh/id_ed25519.pub

# на сервере (если уже есть доступ)
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ВСТАВЬ_СЮДА_ПУБЛИЧНЫЙ_КЛЮЧ' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Либо вставить тот же ключ в панели хостера (раздел SSH-ключи) и при необходимости перезагрузить VPS.

### Важно

- Root-пароль из панели **не хранить** в git/чатах/доках.
- Если пароль светился — сразу сменить: `passwd` на сервере или сброс в панели.
- После настройки ключа предпочтительно отключить вход по паролю (когда команда готова к этому шагу).

## Раскладка на диске

| Путь | Назначение |
|------|------------|
| `/var/www/needra/` | Корень сайта (содержимое `dist/` после деплоя) |
| `/etc/nginx/sites-available/needra` | Конфиг сайта |
| `/etc/nginx/sites-enabled/needra` | Симлинк на конфиг |
| `/etc/letsencrypt/live/needra.ru/` | Сертификат SSL |

Владелец файлов сайта: `www-data:www-data`.

## Nginx

- Слушает `80` (редирект на HTTPS) и `443` (SSL).
- `server_name`: `needra.ru` `www.needra.ru`.
- Статика: `try_files`; кэш для js/css/картинок ~7 дней; gzip для текста.

Проверки:

```bash
ssh root@93.183.71.67 'nginx -t && systemctl status nginx --no-pager'
curl -sI https://needra.ru/ | head -15
```

Перезагрузка конфига после правок:

```bash
ssh root@93.183.71.67 'nginx -t && systemctl reload nginx'
```

## SSL (Let's Encrypt)

- Выпущен через `certbot --nginx` для `needra.ru` и `www.needra.ru`.
- Автообновление: таймер/cron certbot на Ubuntu.
- Срок смотреть: `ssh root@93.183.71.67 'certbot certificates'`

Ручное обновление (если нужно):

```bash
ssh root@93.183.71.67 'certbot renew --dry-run'
```

## Firewall

На момент первого деплоя `ufw` был **inactive**. Порты 80/443/22 должны быть доступны снаружи (через панель хостера или ufw).

Если включать ufw:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

## Что крутится / чего нет

| Есть | Нет (осознанно) |
|------|-----------------|
| nginx | Node/Vite на проде |
| статика лендинга | БД |
| certbot | CI на самом VPS |

Сборка всегда на локальной машине (или в CI), на сервер уезжает только `dist/`.

## Чеклист после выдачи нового VPS

1. DNS A на IP сервера  
2. SSH-ключ в `authorized_keys`  
3. `apt update` → nginx + certbot  
4. Каталог `/var/www/needra`  
5. Конфиг nginx + `nginx -t` + reload  
6. `certbot --nginx -d needra.ru -d www.needra.ru`  
7. `npm run deploy` с Mac  
8. Проверка https://needra.ru  

Подробный деплой: [DEPLOY.md](./DEPLOY.md).
