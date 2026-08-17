# Hero v3 — реестр версий

## Три сохранённые версии

| # | Имя | Страница | Backup | Что внутри |
|---|-----|----------|--------|------------|
| 1 | **excellent** | [hero-v3-excellent.html](../hero-v3-excellent.html) | `backup/hero-v3-excellent/` | 47 PNG, плавная спираль, без невесомости |
| 3 | **v3.1 final** | [hero-v3.1-final.html](../hero-v3.1-final.html) | `backup/hero-v3.1-final/` | PNG + спираль + zero-g (покачивание, scale, 3–4°) |

Версия **2** (промежуточный `hero-v3.html`) удалена.

## Разработка

- Рабочие файлы: `public/landing-hero-v3.1-*.js/css`
- Песочница: [hero-v3.1.html](../hero-v3.1.html)

## Полный лендинг (hero v3.1 + секции)

| Файл | Назначение |
|------|------------|
| [landing-v3.html](../landing-v3.html) | Полная страница (не прод; `noindex`) |
| `public/landing-v3-main.js` | Hero v3.1 + `initBeatProgress` |
| `public/landing-v3.css` | Отступ под sticky-cta; sticky виден (в sandbox hero скрыт) |
| `public/landing-below.js` | Интерактив секций ниже fold |

Прод v1 по-прежнему: [index.html](../index.html). Редирект с `/` на v3 — только после явного согласия.

Открыть: `http://localhost:5173/landing-v3.html`

## Ассеты

`public/assets/hero-v3/cards/` — 47 утверждённых PNG

## v1 rollback

`index.html` + `landing-main.js` + `landing-hero-widgets.js` — не трогать без явного согласия.
