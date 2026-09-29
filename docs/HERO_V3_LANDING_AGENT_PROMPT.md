# Промпт для агента: лендинг с Hero v3.1

Скопируй блок ниже **целиком** в новый чат Cursor (воркспейс NeedRa).

---

```markdown
## Задача

Собери **полный лендинг NeedRa** с hero **v3.1 final** и секциями ниже fold. Репозиторий: `/Users/mac108/Documents/CURSOR/NeedRa/NeedRa_prod`.

## Критично — rollback v1

- **`index.html`** и связанные v1-файлы — **не перезаписывать**.
- Продакшен v1 остаётся на `index.html` (SVG-виджеты, `landing-main.js`).
- Новый лендинг — **отдельный файл**, например `landing-v3.html` или `index-v3.html`.
- Если нужен редирект на прод — только после явного согласия владельца.

## Канон hero (v3.1 final)

**Превью:** `hero-v3.1-final.html` или `hero-v3.1.html`  
**Заморозка:** `backup/hero-v3.1-final/` (не править backup)

### Скрипты hero v3.1

1. GSAP + ScrollTrigger (CDN, как в hero-v3.1.html)
2. `landing-hero-rng.js`
3. `landing-hero-stars.js`
4. `landing-hero-v3.1-widgets.js` — 47 PNG-карточек
5. `landing-hero-backdrop.js`
6. `landing-hero-v3.1-main.js` — спираль + zero-g покачивание

### Стили hero v3.1

- `landing-styles.css` — сцена, orbit-arm, chat, preloader
- `landing-hero-v3.1.css` — PNG-карточки, `hero-v31-page`, float-wrap

### Разметка hero

Скопировать из `hero-v3.1.html` секцию `<main>` hero + preloader.  
Класс body: `hero-v31-page`.  
ID узлов **как в v3.1** (`sceneScroll`, `orbitField`, `chatSingularity`, `blackholeArt`…).

### Ассеты

- `public/assets/hero-v3/cards/` — 47 PNG (утверждённые)
- `/assets/hero/blackhole.png`, `/assets/brand/logo-neon.svg`

## Секции ниже hero

Взять из **`index.html`** (начиная с `<!-- ── Ниже hero ── -->`):

- essence, relief, onboard, pricing, signup, faq
- header, beat-progress, footer, sticky-cta

Подключить **`landing-below.js`** для интерактива ниже fold.

### Адаптации при склейке

1. **beat-progress** — оставить; hero id=`top` совместим.
2. **Preloader** — один на страницу (из v3.1).
3. **Скрипты:** не подключать `landing-main.js` (v1) и не подключать `landing-hero-widgets.js` (SVG v1).
4. **Hero main v3.1** не содержит `initBeatProgress` — **добавь** beat-progress из `landing-main.js` (функция `initBeatProgress`) в конец `landing-v3-main.js` или отдельным модулем, чтобы точки справа работали на полном лендинге.
5. Проверь `padding-bottom` body: у hero-v31-page было `0`, у лендинга нужен отступ под sticky-cta — поправь в CSS лендинга v3.

## Откаты hero (справка)

| Версия | Страница | Папка |
|--------|----------|-------|
| v3 excellent (без невесомости) | `hero-v3-excellent.html` | `backup/hero-v3-excellent/` |
| v3.1 final (канон) | `hero-v3.1-final.html` | `backup/hero-v3.1-final/` |

## Критерий готовности

- [ ] `npm run dev` → новая страница открывается без ошибок в консоли
- [ ] 47 PNG-карточек видны, еле покачиваются в покое
- [ ] Скролл: плавная спираль в дыру → чат
- [ ] Секции ниже hero скроллятся, beat-progress переключается
- [ ] `index.html` (v1) не изменён
- [ ] reduced-motion: статичный чат, без float

## Документация

- `docs/HERO_V3.md` — реестр версий hero
- `backup/hero-v3.1-final/README.md`

Начни с создания `landing-v3.html` + `public/landing-v3-main.js` (v3.1 main + beat-progress), проверь в браузере, потом полируй стыковку секций.
```
