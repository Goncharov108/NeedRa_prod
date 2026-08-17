/**
 * Hero v3 — согласованные PNG-карточки орбиты (47 шт.).
 * Источник: public/assets/hero-v3/cards/
 */

const HERO_V3_CARD_BASE = "/assets/hero-v3/cards";
const HERO_V3_CARD_SCALE = 0.8;

/** Реестр утверждённых карточек: display-размер из docs/05_CARD_LIST.md. */
const HERO_V3_CARDS = [
  { id: "01", label: "ABC-анализ", file: "01-abc-анализ.png", width: 198, height: 112 },
  { id: "02", label: "SKU · выручка", file: "02-sku-выручка.png", width: 237, height: 108 },
  { id: "03", label: "Google Sheets", file: "03-google-sheets.png", width: 192, height: 136 },
  { id: "04", label: "PDF", file: "04-pdf.png", width: 176, height: 112 },
  { id: "05", label: "Отчёт №53", file: "05-отчёт-53.png", width: 212, height: 134 },
  { id: "06", label: "Финансы.xls", file: "06-финансы-xls.png", width: 196, height: 154 },
  { id: "07", label: "Отзывы", file: "07-отзывы.png", width: 150, height: 180 },
  { id: "08", label: "Цена конкурентов", file: "08-цена-конкурентов.png", width: 218, height: 87 },
  { id: "09", label: "SEO", file: "09-seo.png", width: 180, height: 115 },
  { id: "10", label: "Позиции", file: "10-позиции.png", width: 162, height: 120 },
  { id: "11", label: "Продажи вчера", file: "11-продажи-вчера.png", width: 202, height: 109 },
  { id: "12", label: "Продажи месяц", file: "12-продажи-месяц.png", width: 214, height: 87 },
  { id: "13", label: "Выкуп", file: "13-выкуп.png", width: 186, height: 55 },
  { id: "14", label: "ДРР", file: "14-дрр.png", width: 172, height: 113 },
  { id: "15", label: "Остаток бюджета", file: "15-остаток-бюджета.png", width: 204, height: 62 },
  { id: "16", label: "P&L", file: "16-pnl.png", width: 194, height: 125 },
  { id: "17", label: "Хранение", file: "17-хранение.png", width: 192, height: 108 },
  { id: "18", label: "Логистика", file: "18-логистика.png", width: 226, height: 97 },
  { id: "19", label: "пятая вкладка", file: "19-пятая-вкладка.png", width: 210, height: 79 },
  { id: "20", label: "меню", file: "20-меню.png", width: 148, height: 210 },
  { id: "21", label: "склад Коледино", file: "21-склад-коледино.png", width: 198, height: 99 },
  { id: "22", label: "топ-20 SKU", file: "22-топ-20-sku.png", width: 216, height: 122 },
  { id: "23", label: "кампания №12", file: "23-кампания-12.png", width: 200, height: 124 },
  { id: "24", label: "блок остатков", file: "24-блок-остатков.png", width: 208, height: 106 },
  { id: "25", label: "Комиссии WB", file: "25-комиссии-wb.png", width: 182, height: 121 },
  { id: "26", label: "Себестоимость", file: "26-себестоимость.png", width: 190, height: 126 },
  { id: "27", label: "Штрафы", file: "27-штрафы.png", width: 206, height: 102 },
  { id: "28", label: "ROI", file: "28-roi.png", width: 222, height: 126 },
  { id: "29", label: "FBO", file: "29-fbo.png", width: 188, height: 49 },
  { id: "30", label: "FBS", file: "30-fbs.png", width: 196, height: 60 },
  { id: "31", label: "Каталог", file: "31-каталог.png", width: 101, height: 154 },
  { id: "32", label: "Юнит-экономика", file: "32-юнит-экономика.png", width: 220, height: 113 },
  { id: "33", label: "Налоги", file: "33-налоги.png", width: 114, height: 150 },
  { id: "34", label: "Возвраты", file: "34-возвраты.png", width: 220, height: 98 },
  { id: "35", label: "CTR", file: "35-ctr.png", width: 224, height: 127 },
  { id: "36", label: "XYZ", file: "36-xyz.png", width: 174, height: 133 },
  { id: "37", label: "Бренды", file: "37-бренды.png", width: 190, height: 128 },
  { id: "38", label: "Доля рынка", file: "38-доля-рынка.png", width: 153, height: 150 },
  { id: "39", label: "Акции", file: "39-акции.png", width: 210, height: 104 },
  { id: "40", label: "CSV", file: "40-csv.png", width: 214, height: 81 },
  { id: "41", label: "Контент", file: "41-контент.png", width: 200, height: 128 },
  { id: "42", label: "прогноз поставки", file: "42-прогноз-поставки.png", width: 228, height: 103 },
  { id: "43", label: "логистика", file: "43-логистика.png", width: 210, height: 44 },
  { id: "44", label: "комиссия WB", file: "44-комиссия-wb.png", width: 215, height: 57 },
  { id: "45", label: "unit-экономика", file: "45-unit-экономика.png", width: 218, height: 123 },
  { id: "46", label: "копия финальная(3).xlsx", file: "46-копия-финальная-3.xlsx.png", width: 236, height: 104 },
  { id: "47", label: "РНП", file: "47-рнп.png", width: 230, height: 78 },
];

/** Детерминированный PRNG для стабильных позиций орбиты. */
function createStarRng(seed = 20260716) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** Проверяет, попадает ли точка в мёртвую зону логотипа и чата. */
function isHubDeadZone(x, y) {
  const dx = (x - 50) / 20;
  const dy = (y - 36) / 16;
  return dx * dx + dy * dy < 1;
}

/** Расстояние между двумя слотами в % поля. */
function slotDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Генерирует хаотичное звёздное поле для N карточек. */
function generateStarField(count, seed = 20260716) {
  const rand = createStarRng(seed);
  const slots = [];
  const minGap = 6.4;
  let attempts = 0;
  const maxAttempts = count * 140;

  while (slots.length < count && attempts < maxAttempts) {
    attempts += 1;
    const x = 3 + rand() * 94;
    const y = 6 + rand() * 74;
    if (isHubDeadZone(x, y)) continue;
    if (slots.some((s) => slotDistance(s, { x, y }) < minGap)) continue;

    const scale = 0.82 + rand() * 0.26;
    slots.push({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      s: Math.round(scale * 100) / 100,
      r: Math.round((rand() * 28 - 14) * 10) / 10,
      z: 1 + Math.floor(rand() * 7),
      w: 1,
    });
  }

  while (slots.length < count) {
    const i = slots.length;
    const ring = 14 + (i % 5) * 9;
    const angle = (i / count) * Math.PI * 2 + rand() * 0.6;
    slots.push({
      x: Math.round((50 + Math.cos(angle) * ring) * 10) / 10,
      y: Math.round((34 + Math.sin(angle) * ring * 0.85) * 10) / 10,
      s: 0.88 + (i % 4) * 0.06,
      r: (i % 5) * 5 - 10,
      z: 1 + (i % 6),
      w: 1,
    });
  }

  return slots;
}

/** Ширина карточки в hero: design px при viewport 1280, масштаб HERO_V3_CARD_SCALE. */
function cardHeroWidth(px) {
  const w = px * HERO_V3_CARD_SCALE;
  const vmin = Math.max(54, Math.round(w * 0.52));
  const vw = Math.round((w / 1280) * 1000) / 10;
  const vmax = Math.round(w);
  return `clamp(${vmin}px, ${vw}vw, ${vmax}px)`;
}

/** Создаёт DOM-виджет из PNG-карточки. */
function createPngOrbitWidget(card, index) {
  const el = document.createElement("div");
  el.className = "orbit-widget orbit-widget--png";
  el.dataset.index = String(index);
  el.dataset.cardId = card.id;
  el.style.setProperty("--card-w", cardHeroWidth(card.width));
  el.style.setProperty("--card-ar", `${card.width} / ${card.height}`);

  const src = `${HERO_V3_CARD_BASE}/${encodeURIComponent(card.file)}`;
  el.innerHTML = `<img class="ow-card-img" src="${src}" alt="" width="${card.width}" height="${card.height}" decoding="async" draggable="false" />`;
  return el;
}

const STAR_FIELD = generateStarField(HERO_V3_CARDS.length);

/** Рендерит PNG-карточки по hero-полю (обёртка orbit-arm для GSAP). */
function buildOrbitWidgets(field) {
  field.innerHTML = "";

  HERO_V3_CARDS.forEach((card, i) => {
    const slot = STAR_FIELD[i];
    const driftSeed = createStarRng(9100 + i);
    const driftX = (driftSeed() * 4 - 2).toFixed(2);
    const driftY = (driftSeed() * 3.2 - 1.6).toFixed(2);
    const driftRot = (driftSeed() * 0.9 - 0.45).toFixed(2);

    const arm = document.createElement("div");
    arm.className = "orbit-arm";
    arm.style.left = `${slot.x}%`;
    arm.style.top = `${slot.y}%`;
    arm.style.zIndex = String(slot.z);
    arm.style.setProperty("--slot-scale", String(slot.s));
    arm.style.setProperty("--slot-rot", `${slot.r}deg`);
    arm.style.setProperty("--ow-scale", "1");
    arm.style.setProperty("--drift-x", `${driftX}px`);
    arm.style.setProperty("--drift-y", `${driftY}px`);
    arm.style.setProperty("--drift-rot", `${driftRot}deg`);
    arm.style.setProperty("--drift-dur", `${11 + driftSeed() * 8}s`);
    arm.style.setProperty("--drift-delay", `${driftSeed() * 5}s`);
    arm.dataset.index = String(i);
    arm.dataset.x = String(slot.x);
    arm.dataset.y = String(slot.y);

    const anim = document.createElement("div");
    anim.className = "orbit-anim";

    const floatWrap = document.createElement("div");
    floatWrap.className = "orbit-float-wrap";

    const widget = createPngOrbitWidget(card, i);
    floatWrap.appendChild(widget);
    anim.appendChild(floatWrap);
    arm.appendChild(anim);
    field.appendChild(arm);
  });

  return field.querySelectorAll(".orbit-anim");
}

window.NeedRaHeroV31Widgets = {
  HERO_V3_CARDS,
  STAR_FIELD,
  buildOrbitWidgets,
  generateStarField,
  createPngOrbitWidget,
};
