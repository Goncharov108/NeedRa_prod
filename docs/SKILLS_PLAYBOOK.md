# NeedRa — Open Design Skills Playbook

Когда и как вызывать skills в Open Design (проект **needra**). Skills **не включаются сами** — указывать в `start_run` или в промпте агента.

## Этап A — стратегия и тексты

### creative-director

**Когда:** старт концепции, критика hero, проверка «шум → фокус».  
**Промпт-шаблон:**

```
Роль: creative-director для NeedRa (WB analytics via AI chat).
Big idea: seller UI clutter collapses into one prompt line.
Аудитория: селлер > менеджер > новичок.
Дай 3 концепта hero и оцени по ясности, отличию от типичных BI-лендингов.
Контекст: docs/LANDING_DRAMATURGY.md в репо NeedRa.
```

### brainstorming

**Когда:** 10+ вариантов H1, «представьте…», CTA.  
**Промпт:**

```
brainstorming: 12 вариантов H1 для NeedRa лендинга.
Боль: много вкладок аналитики WB, нет быстрого ответа.
Тон: прямой B2B SaaS, русский, без клише Elevate/Seamless.
```

### copywriting

**Когда:** черновики секций по 8 битам.  
**Промпт:**

```
copywriting: перепиши секции #problem #goal #imagine для селлера WB.
Источник правды: PRODUCT.md + LANDING_DRAMATURGY.md.
Длина: hero ≤ 12 слов в H1.
```

### marketing-psychology

**Когда:** framing боли/надежды, блок дефицита без манипуляции.  
**Промпт:**

```
marketing-psychology: как сформулировать бит «надежда» без триггера «очередной SaaS»?
Loss aversion — мягко, честно. Русский язык.
```

### ad-creative

**Когда:** короткие hooks для рекламы (после утверждения hero).  
**Промпт:**

```
ad-creative: 5 hooks ≤ 40 символов для таргета селлеров WB. NeedRa = чат вместо дашбордов.
```

---

## Этап B — визуал и прототип

### design-brief

**Когда:** формализация visual brief перед генерацией.  
**Input:** блок I-Lang из [VISUAL_CONCEPT.md](./VISUAL_CONCEPT.md).

### frontend-design

**Когда:** полная страница `landing-dramaturgy.html`.  
**Промпт:**

```
frontend-design: mobile-first лендинг NeedRa, dark theme #2C353F.
Секции по LANDING_DRAMATURGY.md (8 битов).
Типографика Inter. Русский текст из docs.
Включить placeholder блок #proof для скринов.
```

### gsap-scrolltrigger

**Когда:** изолированная сцена `noise-to-chat.html`.  
**Промпт:**

```
gsap-scrolltrigger: scroll-сцена — таблицы и графики (decorative) схлопываются в одну строку чата.
prefers-reduced-motion: static fallback.
Mobile: упрощённая 2-phase анимация.
```

### impeccable-design-polish

**Когда:** после первого прототипа, перед переносом в Vite.  
**Промпт:**

```
impeccable-design-polish: audit landing-dramaturgy.html — иерархия, AI-tells, responsive 360px, a11y focus.
```

---

## Этап C — конверсия

### paywall-upgrade-cro

**Когда:** финальный CTA-блок, sticky mobile, повтор CTA.  
**Промпт:**

```
paywall-upgrade-cro: оптимизируй #cta и sticky bar — friction регистрации, текст кнопок, secondary link.
```

### faq-page

**Когда:** секция FAQ из возражений в LANDING_DRAMATURGY бит 6.  
**Промпт:**

```
faq-page: FAQ для NeedRa — данные WB, Excel, маски, отличие от личного кабинета. Русский, 6–8 вопросов.
```

---

## Не использовать на v1

| Skill | Причина |
|-------|---------|
| gpt-tasteskill | Слишком декоративен для B2B |
| poster-hero | Не формат лендинга |
| video-hyperframes | Overkill для первой итерации |

---

## Вызов из Cursor (MCP)

```text
start_run(
  project: "needra",
  skill: "frontend-design",
  prompt: "<промпт из таблицы выше + ссылка на тексты docs>"
)
```

Polling: `get_run(runId)` каждые 30–60 сек; не отменять без запроса пользователя.

## Порядок runs (рекомендуемый)

1. `noise-to-chat.html` — gsap-scrolltrigger  
2. `landing-dramaturgy.html` — frontend-design (встроить или ссылаться на noise scene)  
3. impeccable-design-polish — на финальный HTML  
