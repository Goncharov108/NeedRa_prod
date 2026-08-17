# NeedRa — лендинг

Продающий лендинг сервиса аналитики Wildberries через ИИ-чат.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173).

## Сборка

```bash
npm run build
npm run preview
```

## Деплой на прод

Прод: **https://needra.ru** (VPS + nginx + Let's Encrypt).

```bash
npm run deploy
```

Подробно: [docs/ops/DEPLOY.md](./docs/ops/DEPLOY.md) · паспорт сервера: [docs/ops/VPS.md](./docs/ops/VPS.md) · Git: [docs/ops/GIT.md](./docs/ops/GIT.md).

## Документация

| Файл | Содержание |
|------|------------|
| [docs/README.md](./docs/README.md) | Оглавление |
| [docs/ops/README.md](./docs/ops/README.md) | VPS, деплой, коммиты |
| [docs/PRODUCT.md](./docs/PRODUCT.md) | Суть продукта |
| [docs/LANDING_DRAMATURGY.md](./docs/LANDING_DRAMATURGY.md) | 8 битов драматургии + черновики текстов |
| [docs/HERO_VARIANTS.md](./docs/HERO_VARIANTS.md) | 3 варианта Hero |
| [docs/VISUAL_CONCEPT.md](./docs/VISUAL_CONCEPT.md) | «Шум → строка чата» |
| [docs/ASSETS_CHECKLIST.md](./docs/ASSETS_CHECKLIST.md) | Что нужно от владельца (URL, скрины) |
| [docs/ORBIT_CARDS_EDITING.md](./docs/ORBIT_CARDS_EDITING.md) | Как вернуться к редактированию 47 hero-карточек |

## Open Design

Проект **NeedRa** в Open Design: прототипы `landing-dramaturgy.html`, `noise-to-chat.html`.

Scroll-demo: [http://localhost:5173/noise-to-chat.html](http://localhost:5173/noise-to-chat.html)

Hero v2 «Чёрная дыра» (preview, v1 не затронут): [http://localhost:5173/hero-v2.html](http://localhost:5173/hero-v2.html)

Орбит-чипы (финансы + реклама, шлифовка): [http://localhost:5173/orbit-chips.html](http://localhost:5173/orbit-chips.html)

## CTA

**https://lk.needra.ru/** — личный кабинет. Скрины продукта на лендинге не используем: mock «одна строка».

## Стек

- Vite 6
- HTML / CSS / vanilla JS
- GSAP (CDN) — hero-анимация
