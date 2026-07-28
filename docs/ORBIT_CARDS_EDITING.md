# Редактирование orbit-карточек

## Где что лежит

| Путь | Назначение |
|---|---|
| `design/orbit-cards/согласованное/` | 47 master PNG, прошедших QA |
| `design/orbit-cards/cards/` | production PNG каждой генерации, финальные prompts и check-файлы |
| `design/orbit-cards/docs/` | исходный brief, дизайн-система, workflow, реестр и визуальный план |
| `design/orbit-cards/references/` | референсы карточки, сетки и hero-сцены |
| `design/orbit-cards/audit/` | финальный машинный аудит и контактный лист |
| `public/assets/hero-v3/cards/` | runtime-копии, используемые текущим hero |
| `design/orbit-cards/cards-muted/` | опциональный вывод bake (`scripts/bake-card-css-filter.py`), не в public |
| `backup/hero-v3-cards-original/cards/` | backup карточек до muted-bake |

Главный handoff: [`design/orbit-cards/NEEDRA_HANDOFF.md`](../design/orbit-cards/NEEDRA_HANDOFF.md).

## Важное различие

Master-файлы и текущие runtime-файлы не совпадают побайтно.

- Masters сохраняют исходный утверждённый цвет и максимальное качество.
- Runtime-копии приглушены под hero формулой
  `saturate(0.78) brightness(0.91) contrast(0.98)`.
- Скрипт bake: `scripts/bake-card-css-filter.py`.

Редизайн всегда начинать с master-архива. Не редактировать единственную копию
в `public/assets/hero-v3/cards/`.

## Как изменить одну карточку

1. Найти карточку по номеру в `design/orbit-cards/docs/05_CARD_LIST.md`.
2. Открыть master из `design/orbit-cards/согласованное/`.
3. Найти production-папку в `design/orbit-cards/cards/`.
4. Прочитать `*-prompt.md` и `*-check.md`.
5. Создать новый вариант отдельным файлом `card-NNN-v2.png`; старый не перезаписывать.
6. Проверить прозрачность только снаружи карточки и непрозрачное тело внутри.
7. Сделать premultiplied-alpha preview в display-размере из реестра.
8. После визуального QA положить master в `согласованное/` с суффиксом `-v2`.
9. Только после одобрения обновить runtime-копию и повторить muted-bake.
10. Проверить hero на `/hero-v3.1-final.html` и основной странице.

## Нумерация production-папок

В `cards/` сохранена одна ранняя исследовательская карточка
`001-excel-file`, не входящая в финальный реестр. Поэтому:

- карточка реестра `01` находится в `cards/002-abc-analysis/`;
- карточка реестра `47` находится в `cards/048-rnp/`;
- для финального реестра номер production-папки равен номеру карточки `+1`.

## Минимальный QA

- PNG в режиме RGBA;
- четыре внешних угла полностью прозрачны;
- тело карточки содержит полностью непрозрачные пиксели;
- нет magenta/chroma fringe;
- заголовок и основной визуал читаются в display-размере;
- внутри 3–7 крупных графических элементов и один визуальный смысл;
- нет космоса, чёрной дыры и фоновой сцены;
- красный используется только для отрицательного статуса;
- карточка не превращается в полноценный дашборд.

## Полезные документы

- `design/orbit-cards/docs/01_PRODUCT_BRIEF.md`
- `design/orbit-cards/docs/02_DESIGN_SYSTEM.md`
- `design/orbit-cards/docs/03_PRODUCTION_WORKFLOW.md`
- `design/orbit-cards/docs/05_CARD_LIST.md`
- `design/orbit-cards/docs/06_HERO_CONTEXT.md`
- `design/orbit-cards/docs/07_VISUAL_PLAN.md`
- `design/orbit-cards/docs/08_FINAL_AUDIT.md`

## Состояние на момент переноса

- 47 master PNG;
- нумерация `01–47` без пропусков;
- 47 записей в реестре;
- все PNG имеют alpha-канал;
- автоматический аудит не нашёл ошибок;
- общий контактный лист:
  `design/orbit-cards/audit/final-contact-sheet.jpg`.
