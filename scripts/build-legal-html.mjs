/**
 * Генерирует public/legal/*.html из docs/legal/*.md (простой MD → HTML).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs/legal");
const outDir = path.join(root, "public/legal");

const files = [
  { md: "privacy-policy.md", title: "Политика конфиденциальности — NeedRa", badge: "v2.0" },
  { md: "personal-data-consent.md", title: "Согласие на обработку ПД — NeedRa", badge: "v2.0" },
  { md: "terms-of-service.md", title: "Пользовательское соглашение — NeedRa", badge: "v2.0" },
  { md: "public-offer.md", title: "Публичная оферта — NeedRa", badge: "v2.0" },
  { md: "cookie-policy.md", title: "Политика cookie — NeedRa", badge: "v2.0" },
];

/** Экранирует HTML. */
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Inline markdown: **bold**, [text](url), `code`. */
function inline(s) {
  let t = esc(s);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const local = href.replace(/^\.\//, "").replace(/\.md$/, ".html");
    const url = href.startsWith("http") || href.startsWith("mailto:") ? href : local;
    return `<a href="${esc(url)}">${esc(text)}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

/** Конвертирует markdown в HTML-тело (начиная с первого ##). */
function mdToHtml(md) {
  let raw = md.replace(/\r\n/g, "\n");
  const start = raw.search(/\n##\s/);
  if (start >= 0) raw = raw.slice(start + 1);
  const lines = raw.split("\n");
  const out = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let inCode = false;
  let codeBuf = [];
  let para = [];

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inline(para.join(" ").trim())}</p>`);
    para = [];
  };

  const closeTable = () => {
    if (!inTable) return;
    out.push("</tbody></table>");
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushPara();
      closeLists();
      closeTable();
      if (inCode) {
        out.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      i += 1;
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      i += 1;
      continue;
    }

    if (line.trim() === "---") {
      flushPara();
      closeLists();
      closeTable();
      out.push("<hr>");
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      flushPara();
      closeLists();
      closeTable();
      // H1 уже в шаблоне — пропускаем первый заголовок документа
      if (out.length === 0) {
        i += 1;
        continue;
      }
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      flushPara();
      closeLists();
      closeTable();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      flushPara();
      closeLists();
      closeTable();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      i += 1;
      continue;
    }

    if (line.startsWith("|")) {
      flushPara();
      closeLists();
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-: ]+$/.test(c))) {
        i += 1;
        continue;
      }
      if (!inTable) {
        out.push("<table><thead><tr>");
        cells.forEach((c) => out.push(`<th>${inline(c)}</th>`));
        out.push("</tr></thead><tbody>");
        inTable = true;
        i += 1;
        continue;
      }
      out.push("<tr>");
      cells.forEach((c) => out.push(`<td>${inline(c)}</td>`));
      out.push("</tr>");
      i += 1;
      continue;
    }
    closeTable();

    const ul = line.match(/^[-*] (.+)$/);
    if (ul) {
      flushPara();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      i += 1;
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      flushPara();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      i += 1;
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      closeLists();
      i += 1;
      continue;
    }

    closeLists();
    para.push(line.trim());
    i += 1;
  }

  flushPara();
  closeLists();
  closeTable();
  if (inCode) {
    out.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`);
  }

  return out.join("\n");
}

/** Извлекает meta-строки из начала MD (версия / сервис). */
function extractMeta(md) {
  const lines = md.split("\n").filter((l) => l.trim());
  const meta = [];
  for (const line of lines.slice(1, 8)) {
    if (line.startsWith("#") || line.startsWith("---")) break;
    if (line.startsWith("**") || line.startsWith("Версия")) meta.push(line);
  }
  return meta.map((l) => `<p class="legal-meta-line">${inline(l)}</p>`).join("\n") ||
    `<p class="legal-meta">NeedRa · https://needra.ru</p>`;
}

for (const file of files) {
  const mdPath = path.join(docsDir, file.md);
  const md = fs.readFileSync(mdPath, "utf8");
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const h1 = titleMatch ? titleMatch[1] : file.title;
  const body = mdToHtml(md);
  const meta = extractMeta(md);

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(file.title)}</title>
  <link rel="stylesheet" href="legal.css">
</head>
<body>
  <div class="legal-wrap">
    <a class="legal-back" href="https://needra.ru/">← На главную</a>
    <h1>${inline(h1)}</h1>
    <div class="legal-meta">${meta}</div>
${body}
  </div>
</body>
</html>
`;

  const outName = file.md.replace(/\.md$/, ".html");
  fs.writeFileSync(path.join(outDir, outName), html, "utf8");
  console.log("wrote", outName);
}
