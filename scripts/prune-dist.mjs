/**
 * Убирает из dist/ лабораторный мусор и дубликаты,
 * чтобы на VPS уходила только прод-статика лендинга.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

/** Пути относительно dist/, которые не нужны на проде. */
const REMOVE = [
  "assets/hero-v3/cards-muted",
  "ads-cards.css",
  "ads-cards.js",
  "finance-cards.css",
  "finance-cards.js",
  "orbit-chips-base.css",
  "orbit-chips-gallery.css",
  "orbit-chips-gallery.js",
  "noise-to-chat.html",
  "index.v1.html",
  "seo-prototype.html",
  "seo-prototype.css",
  "seo-prototype-v0.html",
  "karkas-home.html",
  "karkas-ozon.html",
  "karkas-wb.html",
  "backup/seo-prototype-v0",
  "assets/seo-prototype",
  "landing-hero-blackhole.js",
  "landing-hero-orbit-canvas.js",
  "landing-hero-widgets.js",
  "landing-main.js",
  "landing-hero-v3.1-main.js",
  "landing-hero-v2-backdrop.js",
  "landing-hero-v2-cards.js",
  "landing-hero-v2-data.js",
  "landing-hero-v2-field.js",
  "landing-hero-v2-links.js",
  "landing-hero-v2-main.js",
  "landing-hero-v2-stars.js",
  "landing-hero-v2-styles.css",
];

/** Удаляет файл или каталог, если есть. */
function rm(rel) {
  const full = path.join(dist, rel);
  if (!fs.existsSync(full)) return false;
  fs.rmSync(full, { recursive: true, force: true });
  return true;
}

if (!fs.existsSync(dist)) {
  console.error("prune-dist: dist/ не найден — сначала vite build");
  process.exit(1);
}

const removed = REMOVE.filter((rel) => rm(rel));
console.log(
  `prune-dist: удалено ${removed.length}/${REMOVE.length} путей из dist/`
);
if (removed.length) {
  for (const rel of removed) console.log(`  - ${rel}`);
}

const archiveV1 = path.join(root, "archive", "landing-v1");
const distV1 = path.join(dist, "landing-v1");
if (!fs.existsSync(path.join(archiveV1, "index.html"))) {
  console.error("prune-dist: нет archive/landing-v1/index.html — лендинг v1 не попадёт в dist");
  process.exit(1);
}
fs.cpSync(archiveV1, distV1, { recursive: true });
console.log("prune-dist: archive/landing-v1 → dist/landing-v1");
