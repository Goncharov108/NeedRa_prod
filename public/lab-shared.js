/**
 * NeedRa lab-flow: packets along SVG wires + reference overlay.
 * Isolated lab — does not touch index.html.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const tracks = [];
  let faqTypeTimer = 0;
  let vidThinkTimer = 0;
  if (new URLSearchParams(location.search).has("capture")) {
    document.documentElement.dataset.capture = "1";
  }

  document.querySelectorAll("[data-ico]").forEach((el) => {
    const id = `ico-${el.getAttribute("data-ico")}`;
    const symbol = document.getElementById(id);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", (symbol && symbol.getAttribute("viewBox")) || "0 0 24 24");
    svg.setAttribute("fill", "none");
    if (symbol) {
      Array.from(symbol.childNodes).forEach((node) => {
        svg.appendChild(node.cloneNode(true));
      });
    }
    el.appendChild(svg);
  });

  /**
   * Skeleton of a seller cabinet: filter chips + product rows.
   */
  function fillCabinet(root) {
    const filters = root.querySelector("[data-win-filters]");
    const list = root.querySelector("[data-win-list]");
    if (!filters || !list) return;

    const filterWidths = [72, 48, 58, 36, 64, 42, 52];
    filters.innerHTML = filterWidths
      .map((width) => `<span style="--w:${width}%"></span>`)
      .join("");

    const row = `<div class="win__row">
      <span class="win__thumb"></span>
      <span class="win__copy"><i></i><i></i></span>
      <span class="win__metrics"><i></i><i></i><i></i></span>
    </div>`;
    list.innerHTML = row.repeat(8);
  }

  document.querySelectorAll(".win").forEach(fillCabinet);

  /**
   * Excel chrome: letter row + numbered grid of value pills.
   */
  function fillXlsSheet(root) {
    const grid = root.querySelector("[data-xls-grid]");
    if (!grid) return;
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const rows = [
      [70, 42, 58, 36, 64, 48, 52],
      [54, 66, 38, 62, 50, 74, 46],
      [68, 40, 56, 72, 44, 60, 34],
      [46, 70, 50, 58, 64, 40, 72],
      [62, 48, 74, 36, 58, 52, 44],
      [40, 56, 48, 70, 38, 64, 60],
    ];
    const head = `<span class="xls__cell xls__cell--corner"></span>${letters
      .map((letter) => `<span class="xls__cell xls__cell--col">${letter}</span>`)
      .join("")}`;
    const body = rows
      .map(
        (cells, index) =>
          `<span class="xls__cell xls__cell--row">${index + 1}</span>${cells
            .map((width) => `<span class="xls__cell"><i style="--w:${width}%"></i></span>`)
            .join("")}`
      )
      .join("");
    grid.innerHTML = head + body;
  }

  document.querySelectorAll("[data-xls]").forEach(fillXlsSheet);

  /**
   * S-curve: drop from the window, then sweep into the hub port.
   */
  function sCurve(x0, y0, x1, y1) {
    const dy = y1 - y0;
    const c1x = x0 + (x1 - x0) * 0.06;
    const c1y = y0 + dy * 0.55;
    const c2x = x1 - (x1 - x0) * 0.04;
    const c2y = y1 - dy * 0.18;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function packInner(t, towardHigh) {
    return towardHigh ? 1 - (1 - t) ** 0.7 : t ** 0.7;
  }

  /**
   * Calm cubic: ease out of the hub, ease into the card.
   */
  function calmCurve(x0, y0, x1, y1) {
    const c1x = x0 + (x1 - x0) * 0.42;
    const c2x = x1 - (x1 - x0) * 0.42;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${y0.toFixed(1)} ${c2x.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  /**
   * Straight horizontal cable. Caller must pass the same Y at both ends
   * so the stroke goes through both node centres.
   */
  function flatLine(x0, y0, x1) {
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x1.toFixed(1)} ${y0.toFixed(1)}`;
  }

  /**
   * Drop down from a cabinet, then sweep inward to the table rim.
   */
  function dropCurve(x0, y0, x1, y1) {
    const dy = y1 - y0;
    const c1x = x0;
    const c1y = y0 + dy * 0.62;
    const c2x = x1;
    const c2y = y1 - dy * 0.18;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  /**
   * X on a pill outline at py. Box is {x,y,w,h} in stage viewBox units.
   */
  function stadiumEdgeX(box, py, side) {
    const radius = Math.min(box.h / 2, box.w / 2);
    const cy = box.y + box.h / 2;
    const chord = Math.sqrt(Math.max(0, radius * radius - (py - cy) ** 2));
    return side === "left" ? box.x + radius - chord : box.x + box.w - radius + chord;
  }

  /**
   * Outward unit normal of the pill at py, plus the edge X.
   * Cable leaves the hub along this so the stroke aims through the node centre.
   */
  function stadiumOutward(box, py, side) {
    const radius = Math.min(box.h / 2, box.w / 2);
    const cy = box.y + box.h / 2;
    const cx = side === "left" ? box.x + radius : box.x + box.w - radius;
    const x = stadiumEdgeX(box, py, side);
    const nx = x - cx;
    const ny = py - cy;
    const len = Math.hypot(nx, ny) || 1;
    return { x, nx: nx / len, ny: ny / len };
  }

  /**
   * Cubic: leave the hub along the pill normal, enter the card horizontally.
   */
  function aimedCalm(nx, ny) {
    return function askAimedCalm(x0, y0, x1, y1) {
      const run = Math.hypot(x1 - x0, y1 - y0) || 1;
      const pull = run * 0.38;
      const inward = x1 > x0 ? -1 : 1;
      const c1x = x0 + nx * pull;
      const c1y = y0 + ny * pull;
      const c2x = x1 + inward * Math.abs(x1 - x0) * 0.42;
      const c2y = y1;
      return `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
  }

  function makePath(d, attrs) {
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", d);
    el.setAttribute("fill", "none");
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  /**
   * SVG circle in the same user space as footer rails.
   */
  function makeCircle(cx, cy, r, attrs) {
    const el = document.createElementNS(NS, "circle");
    el.setAttribute("cx", String(cx));
    el.setAttribute("cy", String(cy));
    el.setAttribute("r", String(r));
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  /**
   * Hero-style cable bundle: S-curves, halo + neon + dashed core.
   * Coords are user units of the stage SVG (viewBox 1024×576).
   */
  function bundle(layers, theme, kind, count, x0a, x0b, y0, x1a, x1b, y1, packHigh, live, curve) {
    const look = theme[kind];
    const neonGroup = layers.neon[kind];
    const draw = curve || sCurve;
    if (!look || !layers.halo || !layers.core || !neonGroup) return;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const p = packInner(t, packHigh);
      const d = draw(lerp(x0a, x0b, p), y0, lerp(x1a, x1b, t), y1);
      const ghost = live && i % 4 === 3;
      layers.halo.appendChild(makePath(d, { stroke: look.stroke, "stroke-width": String(look.haloWidth) }));
      const neonPath = makePath(d, {
        stroke: look.stroke,
        "stroke-width": ghost ? "0.7" : String(look.neonWidth),
        opacity: ghost ? "0.4" : "1",
      });
      if (live && !ghost) neonPath.setAttribute("data-flow", kind);
      neonGroup.appendChild(neonPath);
      layers.core.appendChild(makePath(d, {
        class: live ? "flow-dash" : "flow-core",
        stroke: look.core,
        "stroke-width": ghost ? "0.35" : (live ? "0.55" : "0.45"),
        opacity: ghost ? "0.45" : (live ? "0.9" : "0.55"),
      }));
    }
  }

  /**
   * Cable bundle like the reference: many thin S-curves into the hub, mint fan out.
   */
  function drawFlowWires() {
    const layers = {
      halo: document.querySelector("[data-wires-halo]"),
      core: document.querySelector("[data-wires-core]"),
      neon: {
        wb: document.querySelector('[data-wires-neon="wb"]'),
        oz: document.querySelector('[data-wires-neon="oz"]'),
        mint: document.querySelector('[data-wires-neon="mint"]'),
      },
    };
    if (!layers.halo || !layers.core || !layers.neon.wb || !layers.neon.oz || !layers.neon.mint) return;

    const theme = {
      wb: { stroke: "url(#g-wb)", core: "#ffe3f7", haloWidth: 5.5, neonWidth: 1.15 },
      oz: { stroke: "url(#g-oz)", core: "#e4f0ff", haloWidth: 5.5, neonWidth: 1.15 },
      mint: { stroke: "url(#g-mint)", core: "#f3fffb", haloWidth: 5, neonWidth: 1.2 },
    };

    // WB/Ozon: along window bottoms → tight port at hub center.
    bundle(layers, theme, "wb", 12, 438, 670, 208, 668, 724, 302, true, true);
    bundle(layers, theme, "oz", 12, 758, 986, 208, 698, 754, 302, false, true);
    // Mint: from hub center, fan to table columns.
    bundle(layers, theme, "mint", 9, 688, 734, 347, 448, 986, 376, false, true);
  }

  /**
   * Cluster hero: shop on the left, Excel on the right, same ports as home.
   */
  function drawClusterHeroWires(root, prefix, shop) {
    if (!root) return;
    const layers = {
      halo: root.querySelector(`[data-${prefix}-wires-halo]`),
      core: root.querySelector(`[data-${prefix}-wires-core]`),
      neon: {
        [shop]: root.querySelector(`[data-${prefix}-wires-neon="${shop}"]`),
        xls: root.querySelector(`[data-${prefix}-wires-neon="xls"]`),
        mint: root.querySelector(`[data-${prefix}-wires-neon="mint"]`),
      },
    };
    if (!layers.halo || !layers.core || !layers.neon[shop] || !layers.neon.xls || !layers.neon.mint) return;

    const theme = {
      wb: { stroke: `url(#${prefix}-g-wb)`, core: "#ffe3f7", haloWidth: 5.5, neonWidth: 1.15 },
      oz: { stroke: `url(#${prefix}-g-oz)`, core: "#e4f0ff", haloWidth: 5.5, neonWidth: 1.15 },
      xls: { stroke: `url(#${prefix}-g-xls)`, core: "#e3fff0", haloWidth: 5.5, neonWidth: 1.15 },
      mint: { stroke: `url(#${prefix}-g-mint)`, core: "#f3fffb", haloWidth: 5, neonWidth: 1.2 },
    };

    bundle(layers, theme, shop, 12, 438, 670, 208, 668, 724, 302, true, true);
    bundle(layers, theme, "xls", 12, 758, 986, 208, 698, 754, 302, false, true);
    bundle(layers, theme, "mint", 9, 688, 734, 347, 448, 986, 376, false, true);
  }

  /**
   * Same bundle as hero, in the air between chat and output (not inside widgets).
   * y 179 → 216 = ask bottom / views top of `.how__play` in 1024×576.
   * Site chess puts play on the right (+416px from the lab-left slot).
   */
  function drawHowWires() {
    const layers = {
      halo: document.querySelector("[data-how-wires-halo]"),
      core: document.querySelector("[data-how-wires-core]"),
      neon: {
        mint: document.querySelector('[data-how-wires-neon="mint"]'),
      },
    };
    if (!layers.halo || !layers.core || !layers.neon.mint) return;

    const theme = {
      mint: { stroke: "url(#how-g-mint)", core: "#f3fffb", haloWidth: 5, neonWidth: 1.2 },
    };

    bundle(layers, theme, "mint", 9, 706, 734, 179, 486, 954, 216, false, true);
  }

  /**
   * Widget box in the 1024×576 stage viewBox from live layout.
   */
  function stageBox(stageRect, el) {
    const box = el.getBoundingClientRect();
    const w = stageRect.width || 1;
    const h = stageRect.height || 1;
    return {
      x: ((box.left - stageRect.left) / w) * 1024,
      y: ((box.top - stageRect.top) / h) * 576,
      w: (box.width / w) * 1024,
      h: (box.height / h) * 576,
    };
  }

  /**
   * Hub → six cards. Cables in the air; dots sit on each card's hub-facing edge.
   */
  /**
   * Sandbox landing on a phone: skip 16:9 cable geometry.
   */
  function isSiteNarrow() {
    return document.body.classList.contains("site") && window.matchMedia("(max-width: 720px)").matches;
  }

  function drawAskWires() {
    if (isSiteNarrow()) return;
    const stageEl = document.querySelector(".stage--ask");
    if (!stageEl) return;
    const layers = {
      halo: stageEl.querySelector("[data-ask-wires-halo]"),
      core: stageEl.querySelector("[data-ask-wires-core]"),
      neon: {
        mint: stageEl.querySelector('[data-ask-wires-neon="mint"]'),
      },
    };
    const nodes = stageEl.querySelector("[data-ask-nodes]");
    if (!layers.halo || !layers.core || !layers.neon.mint || !nodes) return;

    layers.halo.replaceChildren();
    layers.core.replaceChildren();
    layers.neon.mint.replaceChildren();
    nodes.replaceChildren();
    for (let i = tracks.length - 1; i >= 0; i -= 1) {
      if (tracks[i].path.closest(".stage--ask") === stageEl) tracks.splice(i, 1);
    }

    const stageRect = stageEl.getBoundingClientRect();
    if (stageRect.width < 8) return;

    const theme = {
      mint: { stroke: "url(#ask-g-mint)", core: "#f3fffb", haloWidth: 3.2, neonWidth: 0.95 },
    };

    const hubEl = stageEl.querySelector(".ask__hub");
    if (!hubEl) return;
    const hub = stageBox(stageRect, hubEl);
    const midY = hub.y + hub.h / 2;
    const spread = hub.h * (18 / 51);
    const hubYs = [midY - spread, midY, midY + spread];
    const specs = [
      { card: "l1", side: "right", hubSide: "left", yi: 0 },
      { card: "l2", side: "right", hubSide: "left", yi: 1 },
      { card: "l3", side: "right", hubSide: "left", yi: 2 },
      { card: "r1", side: "left", hubSide: "right", yi: 0 },
      { card: "r2", side: "left", hubSide: "right", yi: 1 },
      { card: "r3", side: "left", hubSide: "right", yi: 2 },
    ];

    const ports = [];
    specs.forEach((spec) => {
      const el = stageEl.querySelector(`[data-ask-card="${spec.card}"]`);
      if (!el) return;
      const box = stageBox(stageRect, el);
      const inset = 2.7;
      const yHub = hubYs[spec.yi];
      const yCard = spec.yi === 1 ? yHub : box.y + box.h / 2;
      const cap = stadiumOutward(hub, yHub, spec.hubSide);
      ports.push({
        x0: cap.x,
        y0: yHub,
        x1: spec.side === "right" ? box.x + box.w - inset : box.x + inset,
        y1: yCard,
        curve: spec.yi === 1 ? flatLine : aimedCalm(cap.nx, cap.ny),
      });
    });

    ports.forEach((port) => {
      bundle(layers, theme, "mint", 1, port.x0, port.x0, port.y0, port.x1, port.x1, port.y1, false, false, port.curve);
    });

    /**
     * Glowing node at a cable end, matching the PNG sparks.
     */
    function portDot(x, y) {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("cx", x.toFixed(1));
      node.setAttribute("cy", y.toFixed(1));
      node.setAttribute("r", "2.7");
      node.setAttribute("fill", "url(#ask-node-mint)");
      node.setAttribute("class", "ask-node");
      nodes.appendChild(node);
    }

    ports.forEach((port) => {
      portDot(port.x0, port.y0);
      portDot(port.x1, port.y1);
    });
  }

  /**
   * Cabinets → table rim. Same bundle as hero, in the air, not inside the table.
   */
  function drawUspWires() {
    if (isSiteNarrow()) return;
    const layers = {
      halo: document.querySelector("[data-usp-wires-halo]"),
      core: document.querySelector("[data-usp-wires-core]"),
      neon: {
        wb: document.querySelector('[data-usp-wires-neon="wb"]'),
        oz: document.querySelector('[data-usp-wires-neon="oz"]'),
      },
    };
    const nodes = document.querySelector("[data-usp-nodes]");
    if (!layers.halo || !layers.core || !layers.neon.wb || !layers.neon.oz || !nodes) return;

    const theme = {
      wb: { stroke: "url(#usp-g-wb)", core: "#ffe3f7", haloWidth: 4.2, neonWidth: 1.15 },
      oz: { stroke: "url(#usp-g-oz)", core: "#e4f0ff", haloWidth: 4.2, neonWidth: 1.15 },
    };

    bundle(layers, theme, "wb", 1, 577, 577, 160, 649, 649, 289, false, true, dropCurve);
    bundle(layers, theme, "oz", 1, 866, 866, 160, 794, 794, 289, true, true, dropCurve);

    /**
     * Glowing node at a cable end on the table rim.
     */
    function portDot(x, y, fill) {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("cx", x.toFixed(1));
      node.setAttribute("cy", y.toFixed(1));
      node.setAttribute("r", "3.1");
      node.setAttribute("fill", fill);
      node.setAttribute("class", "usp-node");
      nodes.appendChild(node);
    }

    portDot(649, 289, "url(#usp-dot-wb)");
    portDot(794, 289, "url(#usp-dot-oz)");
  }

  /**
   * Cluster #ask: badge → markers → hub → table. Same ports as ozon-ask-block-ref.png.
   */
  function drawClusterAskWires(root, prefix, shop) {
    if (!root) return;
    const layers = {
      halo: root.querySelector(`[data-${prefix}-wires-halo]`),
      core: root.querySelector(`[data-${prefix}-wires-core]`),
      neon: {
        [shop]: root.querySelector(`[data-${prefix}-wires-neon="${shop}"]`),
        mint: root.querySelector(`[data-${prefix}-wires-neon="mint"]`),
      },
    };
    const nodes = root.querySelector(`[data-${prefix}-nodes]`);
    if (!layers.halo || !layers.core || !layers.neon[shop] || !layers.neon.mint || !nodes) return;

    const theme = {
      wb: { stroke: `url(#${prefix}-g-wb)`, core: "#ffe3f7", haloWidth: 4.2, neonWidth: 1.15 },
      oz: { stroke: `url(#${prefix}-g-oz)`, core: "#e4f0ff", haloWidth: 4.2, neonWidth: 1.15 },
      mint: { stroke: `url(#${prefix}-g-mint)`, core: "#f3fffb", haloWidth: 4.2, neonWidth: 1.2 },
    };
    const y = 283;

    bundle(layers, theme, shop, 1, 109, 109, y, 219, 219, y, false, true, flatLine);
    bundle(layers, theme, shop, 1, 237, 237, y, 377, 377, y, false, true, flatLine);
    bundle(layers, theme, shop, 1, 392, 392, y, 509, 509, y, false, true, flatLine);
    bundle(layers, theme, "mint", 1, 544, 544, y, 633, 633, y, false, true, flatLine);
    bundle(layers, theme, "mint", 1, 649, 649, y, 779, 779, y, false, true, flatLine);

    /**
     * Hollow marker on the spine, matching the PNG rings.
     */
    function ring(x, stroke) {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("cx", x.toFixed(1));
      node.setAttribute("cy", String(y));
      node.setAttribute("r", "8.5");
      node.setAttribute("fill", "none");
      node.setAttribute("stroke", stroke);
      node.setAttribute("stroke-width", "1.7");
      node.setAttribute("class", `${prefix}-node`);
      nodes.appendChild(node);
    }

    const shopInk = shop === "wb" ? "#ff4eb8" : "#4da3ff";
    ring(228, shopInk);
    ring(383.5, shopInk);
    ring(641, "#5dffc8");
  }

  /**
   * SVG id prefix for a tariff stage (home / Ozon / WB).
   */
  function pricePrefix(stageEl) {
    if (stageEl.classList.contains("stage--ozprice")) return "ozprice";
    if (stageEl.classList.contains("stage--wbprice")) return "wbprice";
    return "price";
  }

  /**
   * Tariff → selected shops (mint) → board (WB pink / Ozon blue). Ports from live boxes.
   */
  function drawPriceWires(stageEl) {
    if (isSiteNarrow()) return;
    if (!stageEl) {
      document.querySelectorAll(".stage--price, .stage--ozprice, .stage--wbprice").forEach(drawPriceWires);
      return;
    }
    const prefix = pricePrefix(stageEl);
    const layers = {
      halo: stageEl.querySelector(`[data-${prefix}-wires-halo]`),
      core: stageEl.querySelector(`[data-${prefix}-wires-core]`),
      neon: {
        mint: stageEl.querySelector(`[data-${prefix}-wires-neon="mint"]`),
        wb: stageEl.querySelector(`[data-${prefix}-wires-neon="wb"]`),
        oz: stageEl.querySelector(`[data-${prefix}-wires-neon="oz"]`),
      },
    };
    const nodes = stageEl.querySelector(`[data-${prefix}-nodes]`);
    const particles = stageEl.querySelector(`[data-${prefix}-particles]`);
    if (!layers.halo || !layers.core || !layers.neon.mint || !nodes) return;

    layers.halo.replaceChildren();
    layers.core.replaceChildren();
    Object.values(layers.neon).forEach((group) => group && group.replaceChildren());
    nodes.replaceChildren();
    particles?.replaceChildren();
    for (let i = tracks.length - 1; i >= 0; i -= 1) {
      if (tracks[i].path.closest(".stage") === stageEl) tracks.splice(i, 1);
    }

    const stage = stageEl.getBoundingClientRect();
    if (stage.width < 8) return;

    /**
     * Mid-edge of a widget in the price viewBox.
     */
    function edge(el, side) {
      const box = el.getBoundingClientRect();
      const x = side === "right" ? box.right : box.left;
      return {
        x: ((x - stage.left) / stage.width) * 1024,
        y: ((box.top + box.bottom) / 2 - stage.top) / stage.height * 576,
      };
    }

    /**
     * Point a userSpace gradient at the live cable.
     */
    function aimGrad(id, a, b) {
      const grad = document.getElementById(id);
      if (!grad) return;
      grad.setAttribute("x1", a.x.toFixed(1));
      grad.setAttribute("y1", a.y.toFixed(1));
      grad.setAttribute("x2", b.x.toFixed(1));
      grad.setAttribute("y2", b.y.toFixed(1));
    }

    const plan = stageEl.querySelector(".price-plan.is-on");
    const shops = [...stageEl.querySelectorAll(".price-mp[data-shop].is-on")];
    const board = stageEl.querySelector(".price__board");
    if (!plan || !board || !shops.length) return;

    const theme = {
      mint: { stroke: `url(#${prefix}-g-mint)`, core: "#eafff6", haloWidth: 4.2, neonWidth: 1.15 },
      wb: { stroke: `url(#${prefix}-g-wb)`, core: "#ffe3f7", haloWidth: 4.2, neonWidth: 1.15 },
      oz: { stroke: `url(#${prefix}-g-oz)`, core: "#e4f0ff", haloWidth: 4.2, neonWidth: 1.15 },
    };
    const dots = {
      mint: `url(#${prefix}-dot-mint)`,
      wb: `url(#${prefix}-dot-wb)`,
      oz: `url(#${prefix}-dot-oz)`,
    };
    const fromPlan = edge(plan, "right");
    const toBoard = edge(board, "left");
    const spread = shops.length > 1 ? 11 : 0;

    /**
     * Glowing node at a cable end in the column gap.
     */
    function portDot(x, y, fill) {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("cx", x.toFixed(1));
      node.setAttribute("cy", y.toFixed(1));
      node.setAttribute("r", "2.7");
      node.setAttribute("fill", fill);
      node.setAttribute("class", "price-node");
      nodes.appendChild(node);
    }

    shops.forEach((shop, index) => {
      const kind = shop.dataset.shop === "oz" ? "oz" : "wb";
      const left = edge(shop, "left");
      const right = edge(shop, "right");
      const py = fromPlan.y + (index === 0 ? -spread : spread);
      const a = { x: fromPlan.x, y: py };
      const b = { x: left.x, y: left.y };
      const c = { x: right.x, y: right.y };
      const d = { x: toBoard.x, y: right.y };
      if (index === 0) aimGrad(`${prefix}-g-mint`, a, b);
      aimGrad(kind === "oz" ? `${prefix}-g-oz` : `${prefix}-g-wb`, c, d);
      bundle(layers, theme, "mint", 1, a.x, a.x, a.y, b.x, b.x, b.y, false, true, calmCurve);
      bundle(layers, theme, kind, 1, c.x, c.x, c.y, d.x, d.x, d.y, false, true, calmCurve);
      portDot(a.x, a.y, dots.mint);
      portDot(b.x, b.y, dots.mint);
      portDot(c.x, c.y, dots[kind]);
      portDot(d.x, d.y, dots[kind]);
    });

    stageEl.querySelectorAll("[data-flow]").forEach((path) => {
      tracks.push(spawnPackets(path, 3));
    });
  }

  drawFlowWires();
  drawClusterHeroWires(document.querySelector('[data-pane="wb-hero"]'), "wbh", "wb");
  drawClusterHeroWires(document.querySelector('[data-pane="ozon-hero"]'), "ozh", "oz");
  drawHowWires();
  drawAskWires();
  drawUspWires();
  drawClusterAskWires(document.querySelector('[data-pane="ozon-ask"]'), "ozask", "oz");
  drawClusterAskWires(document.querySelector('[data-pane="wb-ask"]'), "wbask", "wb");
  drawPriceWires();

  const stage = document.querySelector("[data-stage]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-flow]").forEach((path) => {
    if (path.closest(".stage--price, .stage--ozprice, .stage--wbprice, .stage--signup")) return;
    tracks.push(spawnPackets(path, path.getAttribute("data-flow") === "mint" ? 3 : 4));
  });

  /**
   * Particle fill ids live in the same SVG as the path (hero vs how).
   */
  function particleFill(path, kind) {
    const stage = path.closest(".stage--wbhero, .stage--ozhero, .stage--how, .stage--ask, .stage--usp, .stage--price, .stage--ozprice, .stage--wbprice, .stage--signup, .stage--ozask, .stage--wbask");
    if (stage && stage.classList.contains("stage--wbhero")) {
      if (kind === "wb") return "url(#wbh-dot-wb)";
      if (kind === "xls") return "url(#wbh-dot-xls)";
      return "url(#wbh-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--ozhero")) {
      if (kind === "oz") return "url(#ozh-dot-oz)";
      if (kind === "xls") return "url(#ozh-dot-xls)";
      return "url(#ozh-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--wbask")) {
      return kind === "wb" ? "url(#wbask-dot-wb)" : "url(#wbask-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--ozask")) {
      return kind === "oz" ? "url(#ozask-dot-oz)" : "url(#ozask-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--signup")) return "url(#signup-dot-mint)";
    if (stage && stage.classList.contains("stage--wbprice")) {
      if (kind === "wb") return "url(#wbprice-dot-wb)";
      if (kind === "oz") return "url(#wbprice-dot-oz)";
      return "url(#wbprice-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--ozprice")) {
      if (kind === "wb") return "url(#ozprice-dot-wb)";
      if (kind === "oz") return "url(#ozprice-dot-oz)";
      return "url(#ozprice-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--price")) {
      if (kind === "wb") return "url(#price-dot-wb)";
      if (kind === "oz") return "url(#price-dot-oz)";
      return "url(#price-dot-mint)";
    }
    if (stage && stage.classList.contains("stage--usp")) {
      return kind === "oz" ? "url(#usp-dot-oz)" : "url(#usp-dot-wb)";
    }
    if (stage && stage.classList.contains("stage--ask")) return "url(#ask-dot-mint)";
    if (stage && stage.classList.contains("stage--how")) {
      if (kind === "wb") return "url(#how-dot-wb)";
      if (kind === "oz") return "url(#how-dot-oz)";
      return "url(#how-dot-mint)";
    }
    if (kind === "wb") return "url(#dot-wb)";
    if (kind === "oz") return "url(#dot-oz)";
    return "url(#dot-mint)";
  }

  /**
   * Spawn glowing packets on a path and keep them looping.
   */
  function spawnPackets(path, count) {
    const kind = path.getAttribute("data-flow");
    const svg = path.ownerSVGElement;
    const layer = svg && svg.querySelector("[data-wbask-particles], [data-ozask-particles], [data-wbprice-particles], [data-ozprice-particles], [data-price-particles], [data-usp-particles], [data-ask-particles], [data-how-particles], [data-signup-particles], [data-particles]");
    if (!layer) return { path, length: 0, packets: [] };
    const fill = particleFill(path, kind);
    const length = path.getTotalLength();
    const packets = [];

    for (let i = 0; i < count; i += 1) {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("r", kind === "mint" ? "2.1" : "2.4");
      node.setAttribute("fill", fill);
      node.setAttribute("class", "particle");
      layer.appendChild(node);
      packets.push({
        node,
        offset: (i / count + Math.random() * 0.12) % 1,
        speed: (kind === "mint" ? 0.18 : 0.14) + Math.random() * 0.08,
      });
    }

    return { path, length, packets };
  }

  if (!reduced) {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tracks.forEach((track) => {
        track.packets.forEach((packet) => {
          packet.offset = (packet.offset + packet.speed * dt) % 1;
          const point = track.path.getPointAtLength(packet.offset * track.length);
          packet.node.setAttribute("cx", point.x.toFixed(2));
          packet.node.setAttribute("cy", point.y.toFixed(2));
        });
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else {
    tracks.forEach((track) => {
      track.packets.forEach((packet, index) => {
        const point = track.path.getPointAtLength(((index + 0.4) / track.packets.length) * track.length);
        packet.node.setAttribute("cx", point.x);
        packet.node.setAttribute("cy", point.y);
      });
    });
  }

  const range = document.querySelector("[data-ref-range]");
  const ref = document.querySelector("[data-ref]");
  if (range && ref) {
    const apply = () => {
      const opacity = String(Number(range.value) / 100);
      document.querySelectorAll("[data-ref]").forEach((el) => {
        el.style.opacity = opacity;
      });
    };
    range.addEventListener("input", apply);
    apply();
  }

  if (stage) stage.dataset.ready = "1";

  /**
   * Page/block tabs. Labels match the owner; section ids map to karkas, not shown.
   */
  function bindLabShell() {
    const pages = {
      home: {
        label: "Главная",
        tone: "",
        blocks: [
          { id: "header", label: "Хедер", section: "header", chrome: true },
          { id: "hero", label: "Херо", section: "top", pane: "home-hero", ref: true },
          { id: "video", label: "Видео", section: "video", pane: "home-video", ref: true },
          { id: "2", label: "Блок 2", section: "how", pane: "home-how", ref: true },
          { id: "3", label: "Блок 3", section: "ask", pane: "home-ask", ref: true },
          { id: "4", label: "Блок 4", section: "usp", pane: "home-usp", ref: true },
          { id: "5", label: "Блок 5", section: "pricing", pane: "home-price", ref: true },
          { id: "6", label: "Блок 6", section: "signup", pane: "home-signup", ref: true },
          { id: "7", label: "Блок 7", section: "faq", pane: "home-faq", ref: true },
          { id: "footer", label: "Футер", section: "footer", pane: "home-foot", ref: true, chrome: true },
        ],
      },
      wb: {
        label: "ВБ",
        tone: "wb",
        blocks: [
          { id: "header", label: "Хедер", section: "header", chrome: true },
          { id: "hero", label: "Херо", section: "top", pane: "wb-hero" },
          { id: "video", label: "Видео", section: "video", pane: "home-video", ref: true },
          { id: "2", label: "Блок 2", section: "ask", pane: "wb-ask" },
          { id: "3", label: "Блок 3", section: "pricing", pane: "wb-price" },
          { id: "4", label: "Блок 4", section: "signup", pane: "home-signup" },
          { id: "5", label: "Блок 5", section: "faq", pane: "home-faq" },
          { id: "footer", label: "Футер", section: "footer", pane: "home-foot", ref: true, chrome: true },
        ],
      },
      ozon: {
        label: "Озон",
        tone: "oz",
        blocks: [
          { id: "header", label: "Хедер", section: "header", chrome: true },
          { id: "hero", label: "Херо", section: "top", pane: "ozon-hero" },
          { id: "video", label: "Видео", section: "video", pane: "home-video", ref: true },
          { id: "2", label: "Блок 2", section: "ask", pane: "ozon-ask", ref: true },
          { id: "3", label: "Блок 3", section: "pricing", pane: "ozon-price" },
          { id: "4", label: "Блок 4", section: "signup", pane: "home-signup" },
          { id: "5", label: "Блок 5", section: "faq", pane: "home-faq" },
          { id: "footer", label: "Футер", section: "footer", pane: "home-foot", ref: true, chrome: true },
        ],
      },
    };

    const pageRoot = document.querySelector("[data-lab-pages]");
    const blockRoot = document.querySelector("[data-lab-blocks]");
    const panes = [...document.querySelectorAll("[data-pane]")];
    const slot = document.querySelector("[data-slot]");
    const hud = document.querySelector("[data-hud]");
    if (!pageRoot || !blockRoot || !slot || !panes.length) return;

    /**
     * Build a chrome tab button.
     */
    function makeTab(label, extraClass) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = extraClass ? `lab-tab ${extraClass}` : "lab-tab";
      btn.textContent = label;
      return btn;
    }

    /**
     * Read #page/block from the URL, fall back to home/hero.
     */
    function parseHash() {
      const raw = (location.hash || "#home/hero").replace(/^#/, "");
      const [pageId, blockId] = raw.split("/");
      const page = pages[pageId] ? pageId : "home";
      const found = pages[page].blocks.find((item) => item.id === blockId);
      return { page, block: (found || pages[page].blocks[0]).id };
    }

    let current = parseHash();
    let labTool = "";
    let resetLabTool = () => {};

    /**
     * Production header lives only on the Хедер tab.
     */
    function paintProdHeader(pageId, block) {
      const head = document.querySelector("[data-lab-prod-header]");
      if (!head) return;
      if (block.id !== "header") {
        head.hidden = true;
        return;
      }
      if (head.parentElement !== slot) slot.appendChild(head);
      head.hidden = false;
      const tint = pageId === "wb" ? "wb" : pageId === "ozon" ? "ozon" : "home";
      head.dataset.tint = tint;
      const oz = head.querySelector("[data-head-oz]");
      const wb = head.querySelector("[data-head-wb]");
      const both = head.querySelector("[data-head-both]");
      if (oz) oz.hidden = pageId === "ozon";
      if (wb) wb.hidden = pageId === "wb";
      if (both) both.hidden = pageId === "home";
    }

    /**
     * Cluster signup is the home form; only karkas h2/lead change.
     */
    function paintSignupCopy(pageId) {
      const pane = document.querySelector('[data-pane="home-signup"]');
      const h2 = pane && pane.querySelector(".signup__copy h2");
      const lead = pane && pane.querySelector(".signup__copy p");
      if (!h2 || !lead) return;
      const clusterLead = "Первая загрузка данных из API бесплатна. Ежедневное обновление — в Стандарте и Pro.";
      if (pageId === "wb") {
        h2.textContent = "Аналитика ВБ бесплатно";
        lead.textContent = clusterLead;
        return;
      }
      if (pageId === "ozon") {
        h2.textContent = "Аналитика Озон бесплатно";
        lead.textContent = clusterLead;
        return;
      }
      h2.textContent = "Регистрация: аналитика ВБ и Озон бесплатно";
      lead.textContent = "Первая загрузка из API бесплатна. Ежедневное обновление — в Стандарте и Pro.";
    }

    /**
     * Cluster hero lives on the empty slot: karkas h1/lead/micro, no how-link.
     */
    function paintHeroCopy(pageId, block) {
      const copy = document.querySelector("[data-lab-hero-copy]");
      if (!copy) return;
      const texts = {
        ozon: {
          h1: "Аналитика Озон",
          lead: "Свой кабинет Озон. Спросите в чате — таблица, график или дашборд. Данные из API Ozon и ваших файлов.",
          micro: "Бесплатная регистрация · один кабинет Озон",
        },
        wb: {
          h1: "Аналитика ВБ",
          lead: "Кабинет Вайлдберриз. Спросите в чате — таблица, график или дашборд. Данные из API Wildberries и ваших файлов.",
          micro: "Бесплатная регистрация · один кабинет ВБ",
        },
      };
      const pack = texts[pageId];
      if (block.id !== "hero" || !pack || block.pane) {
        copy.hidden = true;
        return;
      }
      if (copy.parentElement !== slot) slot.appendChild(copy);
      copy.hidden = false;
      const h1 = copy.querySelector("[data-hero-h1]");
      const lead = copy.querySelector("[data-hero-lead]");
      const micro = copy.querySelector("[data-hero-micro]");
      const how = copy.querySelector("[data-hero-how]");
      if (h1) h1.textContent = pack.h1;
      if (lead) lead.textContent = pack.lead;
      if (micro) micro.textContent = pack.micro;
      if (how) how.hidden = true;
    }

    /**
     * Show the matching pane (hero scene or empty 16:9 slot).
     */
    function show(pageId, blockId) {
      resetLabTool();
      const page = pages[pageId];
      const block = page.blocks.find((item) => item.id === blockId) || page.blocks[0];
      current = { page: pageId, block: block.id };
      const hash = `#${pageId}/${block.id}`;
      if (location.hash !== hash) history.replaceState(null, "", hash);

      pageRoot.querySelectorAll(".lab-tab").forEach((btn) => {
        if (btn.dataset.page) {
          btn.classList.toggle("is-on", btn.dataset.page === pageId);
        } else {
          btn.classList.toggle("is-on", btn.dataset.block === block.id);
        }
      });
      blockRoot.querySelectorAll(".lab-tab").forEach((btn) => {
        btn.classList.toggle("is-on", btn.dataset.block === block.id);
      });

      const paneId = block.pane || "";
      panes.forEach((el) => {
        el.hidden = el.dataset.pane !== paneId;
      });
      slot.hidden = Boolean(paneId);
      if (!paneId) {
        slot.dataset.odId = `lab-${pageId}-${block.id}`;
        slot.dataset.section = block.section;
      }
      paintProdHeader(pageId, block);
      paintHeroCopy(pageId, block);
      paintSignupCopy(pageId);
      paintFaqCopy(pageId);
      if (hud) hud.hidden = !block.ref;
      if (paneId !== "home-video") pauseLabVideo();
      if (block.pane === "home-price" || block.pane === "ozon-price" || block.pane === "wb-price") {
        const pane = document.querySelector(`[data-pane="${block.pane}"]`);
        const paint = () => layoutPriceStage(pane);
        requestAnimationFrame(() => requestAnimationFrame(paint));
        setTimeout(paint, 80);
      }
      if (block.pane === "home-signup") {
        requestAnimationFrame(() => drawSignupWires());
        setTimeout(() => drawSignupWires(), 80);
      }
      if (block.pane === "home-faq") {
        requestAnimationFrame(() => bindFaqTerm(true));
      }
      if (block.pane === "home-foot") {
        requestAnimationFrame(() => requestAnimationFrame(() => drawFootWires()));
      }
      if (block.pane === "home-video") {
        requestAnimationFrame(() => {
          bindVideoPlayer();
          bindVidThink();
        });
      }
    }

    /**
     * Rebuild the second row when the page tab changes. Header/footer live on the page row.
     */
    function renderBlocks(pageId) {
      blockRoot.replaceChildren();
      pages[pageId].blocks.forEach((block) => {
        if (block.chrome) return;
        const btn = makeTab(block.label);
        btn.dataset.block = block.id;
        btn.dataset.section = block.section;
        btn.addEventListener("click", () => show(pageId, block.id));
        blockRoot.appendChild(btn);
      });
    }

    /**
     * Header and footer sit with Главная / ВБ / Озон, not among the content blocks.
     */
    function renderChrome() {
      const gap = document.createElement("span");
      gap.className = "lab-tabs__gap";
      gap.setAttribute("aria-hidden", "true");
      pageRoot.appendChild(gap);
      pages.home.blocks.filter((block) => block.chrome).forEach((block) => {
        const btn = makeTab(block.label);
        btn.dataset.block = block.id;
        btn.dataset.section = block.section;
        btn.dataset.chrome = "1";
        pageRoot.appendChild(btn);
      });
      pageRoot.addEventListener("click", (event) => {
        const btn = event.target.closest("button.lab-tab[data-chrome]");
        if (!btn) return;
        show(current.page, btn.dataset.block);
      });
    }

    Object.entries(pages).forEach(([id, page]) => {
      const tone = page.tone === "wb" ? "lab-tab--wb" : page.tone === "oz" ? "lab-tab--oz" : "";
      const btn = makeTab(page.label, tone);
      btn.dataset.page = id;
      btn.addEventListener("click", () => {
        if (current.page === id) return;
        renderBlocks(id);
        const fallback = pages[id].blocks.find((item) => item.id === "hero") || pages[id].blocks[0];
        show(id, fallback.id);
      });
      pageRoot.appendChild(btn);
    });

    renderChrome();
    renderBlocks(current.page);
    show(current.page, current.block);

    window.addEventListener("hashchange", () => {
      const next = parseHash();
      renderBlocks(next.page);
      show(next.page, next.block);
    });

    bindLabTools();

    /**
     * Right-half lab tools: button specimens, preview blocks in device frames.
     */
    function bindLabTools() {
      const lab = document.querySelector(".lab");
      const nav = document.querySelector("[data-lab-tabs]");
      const deviceFrame = document.querySelector("[data-lab-device]");
      const devicePanel = document.querySelector("[data-lab-devices]");
      const bgPanel = document.querySelector("[data-lab-bgs]");
      const btnsToggle = nav?.querySelector('[data-lab-tool="btns"]');
      const deviceToggle = nav?.querySelector('[data-lab-tool="devices"]');
      const bgToggle = nav?.querySelector('[data-lab-tool="bg"]');
      const canvas = document.querySelector(".lab-canvas");
      const btnBoard = document.querySelector("[data-lab-btn-board]");
      if (!lab || !nav || !deviceFrame || !devicePanel || !bgPanel || !btnsToggle || !deviceToggle || !bgToggle) return;

      const devices = [
        { id: "desktop", label: "Десктоп", w: 1024, h: 576, bezel: "none" },
        { id: "laptop", label: "Ноутбук", w: 1440, h: 900, bezel: "none" },
        { id: "tablet", label: "Планшет ↔", w: 1024, h: 768, bezel: "tablet" },
        { id: "tablet-v", label: "Планшет ↕", w: 768, h: 1024, bezel: "tablet" },
        { id: "phone", label: "Телефон", w: 390, h: 844, bezel: "phone" },
        { id: "phone-se", label: "SE", w: 375, h: 667, bezel: "phone" },
      ];

      const bgs = [
        { id: "void", label: "Чёрный" },
        { id: "graphite", label: "Графит" },
        { id: "mint", label: "Мята" },
        { id: "split", label: "Сплит" },
        { id: "grid", label: "Сетка" },
        { id: "depth", label: "Глубина" },
        { id: "vignette", label: "Виньетка" },
        { id: "scan", label: "Консоль" },
        { id: "cycle", label: "Цикл" },
        { id: "grain", label: "Зерно" },
      ];

      let deviceId = "desktop";
      let bgId = "void";

      /**
       * Fill a tool panel with pill buttons.
       */
      function fillPanel(root, items, selectedId, onPick) {
        root.replaceChildren();
        items.forEach((item) => {
          const btn = makeTab(item.label);
          btn.dataset.pick = item.id;
          btn.classList.toggle("is-on", item.id === selectedId);
          btn.addEventListener("click", () => onPick(item.id));
          root.appendChild(btn);
        });
      }

      /**
       * Paint Кнопки / Устройства / фон chrome from labTool.
       */
      function paintToolChrome() {
        devicePanel.hidden = labTool !== "devices";
        bgPanel.hidden = labTool !== "bg";
        btnsToggle.setAttribute("aria-expanded", labTool === "btns" ? "true" : "false");
        deviceToggle.setAttribute("aria-expanded", labTool === "devices" ? "true" : "false");
        bgToggle.setAttribute("aria-expanded", labTool === "bg" ? "true" : "false");
        btnsToggle.classList.toggle("is-on", labTool === "btns");
        deviceToggle.classList.toggle("is-on", labTool === "devices" || deviceId !== "desktop");
        bgToggle.classList.toggle("is-on", labTool === "bg" || bgId !== "void");
      }

      /**
       * Show the specimen board. Closing is handled by show().
       */
      function showBtnBoard() {
        const board = document.querySelector('[data-pane="lab-btns"]');
        if (!board) return;
        panes.forEach((el) => {
          el.hidden = el.dataset.pane !== "lab-btns";
        });
        slot.hidden = true;
        if (hud) hud.hidden = true;
        board.hidden = false;
      }

      /**
       * Open one tool, or close both.
       */
      function setOpen(tool) {
        const next = labTool === tool ? "" : tool;
        const was = labTool;
        labTool = next;
        paintToolChrome();
        if (labTool === "btns") showBtnBoard();
        else if (was === "btns") show(current.page, current.block);
      }

      /**
       * Close tool panels without toggling.
       */
      function closeTools() {
        if (!labTool) return;
        const was = labTool;
        labTool = "";
        paintToolChrome();
        if (was === "btns") show(current.page, current.block);
      }

      resetLabTool = () => {
        if (labTool !== "btns") return;
        labTool = "";
        paintToolChrome();
      };

      /**
       * Fit the device frame into the canvas without transform on glass.
       */
      function fitDevice() {
        const box = canvas || document.querySelector(".lab-canvas");
        if (!box || !deviceFrame) return;
        const w = Number(deviceFrame.style.getPropertyValue("--dev-w")) || 1024;
        const h = Number(deviceFrame.style.getPropertyValue("--dev-h")) || 576;
        const cw = box.clientWidth;
        const ch = box.clientHeight;
        if (cw < 8 || ch < 8) return;
        const scale = Math.min(cw / w, ch / h);
        deviceFrame.style.width = `${Math.max(1, Math.floor(w * scale))}px`;
        deviceFrame.style.height = `${Math.max(1, Math.floor(h * scale))}px`;
      }

      /**
       * Letterbox the 16:9 stage inside a device-sized frame (no transform on glass).
       */
      function applyDevice(id) {
        const item = devices.find((entry) => entry.id === id) || devices[0];
        deviceId = item.id;
        deviceFrame.style.setProperty("--dev-w", String(item.w));
        deviceFrame.style.setProperty("--dev-h", String(item.h));
        deviceFrame.dataset.bezel = item.bezel;
        lab.dataset.device = item.id;
        fillPanel(devicePanel, devices, deviceId, applyDevice);
        paintToolChrome();
        fitDevice();
        requestAnimationFrame(() => {
          fitDevice();
          if (labTool !== "btns") show(current.page, current.block);
        });
      }

      /**
       * Paint a lab stage floor. Default is the current black.
       */
      function applyBg(id) {
        const item = bgs.find((entry) => entry.id === id) || bgs[0];
        bgId = item.id;
        lab.dataset.bg = item.id;
        fillPanel(bgPanel, bgs, bgId, applyBg);
        paintToolChrome();
      }

      let ignoreClick = false;

      /**
       * Open a tool panel; ignore the click that follows pointerdown.
       */
      function onToggle(tool, event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === "click" && ignoreClick) {
          ignoreClick = false;
          return;
        }
        if (event.type === "pointerdown") ignoreClick = true;
        setOpen(tool);
      }

      btnsToggle.addEventListener("click", (event) => onToggle("btns", event));
      nav.addEventListener("click", (event) => {
        const toolBtn = event.target.closest("[data-lab-tool='btns']");
        if (!toolBtn) return;
        if (event.target === btnsToggle) return;
        onToggle("btns", event);
      });
      deviceToggle.addEventListener("pointerdown", (event) => onToggle("devices", event));
      deviceToggle.addEventListener("click", (event) => onToggle("devices", event));
      bgToggle.addEventListener("pointerdown", (event) => onToggle("bg", event));
      bgToggle.addEventListener("click", (event) => onToggle("bg", event));
      devicePanel.addEventListener("pointerdown", (event) => event.stopPropagation());
      bgPanel.addEventListener("pointerdown", (event) => event.stopPropagation());
      document.addEventListener("pointerdown", (event) => {
        if (labTool !== "devices" && labTool !== "bg") return;
        if (event.target.closest("[data-lab-tabs]")) return;
        closeTools();
      });
      btnBoard?.addEventListener("click", (event) => {
        if (event.target.closest("a")) event.preventDefault();
      });

      fillPanel(devicePanel, devices, deviceId, applyDevice);
      fillPanel(bgPanel, bgs, bgId, applyBg);
      applyDevice("desktop");
      applyBg("void");

      if (canvas && typeof ResizeObserver !== "undefined") {
        let timer = 0;
        new ResizeObserver(() => {
          fitDevice();
          if (labTool === "btns") return;
          clearTimeout(timer);
          timer = setTimeout(() => show(current.page, current.block), 50);
        }).observe(canvas);
      }
    }
  }

  /**
   * Light the saved-mask card next to «Сохранить маску».
   */
  function bindSaveMask(root) {
    if (!root) return;
    const mask = root.querySelector("[data-how-mask]");
    root.querySelector("[data-how-save]")?.addEventListener("click", () => {
      mask?.classList.add("is-on");
    });
  }

  /**
   * How-block: canon kinds (таблица / график / дашборд) + save-mask glow.
   */
  function bindHowPlay() {
    const root = document.querySelector("[data-how]");
    if (!root) return;

    const steps = [...root.querySelectorAll("[data-how-step]")];
    const views = [...root.querySelectorAll("[data-how-view]")];

    /**
     * Swap the example visual. Default kind is table — karkas «Спросили — таблица».
     */
    function activate(id) {
      root.dataset.step = id;
      steps.forEach((step) => {
        const on = step.dataset.howStep === id;
        step.classList.toggle("is-on", on);
        step.setAttribute("aria-selected", on ? "true" : "false");
      });
      views.forEach((view) => {
        view.classList.toggle("is-on", view.dataset.howView === id);
      });
    }

    steps.forEach((step) => {
      step.addEventListener("click", () => activate(step.dataset.howStep));
    });

    bindSaveMask(root);
    activate("table");
  }

  bindHowPlay();
  document.querySelectorAll("[data-ozask], [data-wbask]").forEach(bindSaveMask);

  /**
   * Space thousands the way tariff cards write prices: 5 000.
   */
  function formatRub(amount) {
    return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  /**
   * Tariff amount with ruble sign: 5 000 ₽.
   */
  function formatPrice(amount) {
    return `${formatRub(amount)} ₽`;
  }

  /**
   * Visible tariff label: 0 ₽ → Бесплатно, else 5 000 ₽.
   */
  function priceLabel(amount) {
    return amount === 0 ? "Бесплатно" : formatPrice(amount);
  }

  /**
   * Active plan: key (start/standard/pro), now price, optional old price for strikethrough.
   */
  function planMeta(stageEl) {
    const plan = stageEl && stageEl.querySelector(".price-plan.is-on");
    const now = Number(plan?.dataset.price || 0);
    const wasRaw = plan?.dataset.wasPrice;
    const was = wasRaw === undefined || wasRaw === "" ? null : Number(wasRaw);
    const key = plan?.dataset.plan || (now === 0 ? "start" : now === 20000 ? "pro" : "standard");
    return { plan, key, now, was };
  }

  /**
   * Paint a promo cell: optional struck old price + current amount.
   */
  function paintPromoAmount(el, now, was) {
    if (!el) return;
    el.replaceChildren();
    if (was != null && was !== now) {
      const old = document.createElement("s");
      old.className = "price-promo__was";
      old.textContent = formatPrice(was);
      el.append(old);
    }
    const cur = document.createElement("span");
    cur.className = "price-promo__now";
    cur.textContent = priceLabel(now);
    el.append(cur);
  }

  /**
   * Shop names at the end of the board note: WB, Ozon, or both.
   */
  function shopNoteEnding(wb, oz) {
    if (wb && oz) return "WB и Ozon";
    if (oz) return "Ozon";
    return "WB";
  }

  /**
   * Live board note: one-time API load on Start, daily refresh on Standard/Pro.
   */
  function calcNoteText(key, wbOn, ozOn) {
    if (key === "start") return "данные из API загружаются 1 раз";
    return `ежедневное обновление кабинета ${shopNoteEnding(wbOn, ozOn)}`;
  }

  /**
   * Live board tally: plan price × selected shops. Canon: one cabinet = one subscription.
   */
  function syncPriceCalc(stageEl) {
    const root = stageEl && stageEl.querySelector("[data-price-calc]");
    if (!root) return;
    const { key, now, was } = planMeta(stageEl);
    let shopsOn = 0;
    let wbOn = false;
    let ozOn = false;
    root.querySelectorAll("[data-calc-line]").forEach((line) => {
      const shop = line.getAttribute("data-calc-line");
      const on = Boolean(stageEl.querySelector(`.price-mp[data-shop="${shop}"].is-on`));
      const addend = line.querySelector("[data-calc-addend]");
      line.classList.toggle("is-on", on);
      if (shop === "wb") wbOn = on;
      if (shop === "oz") ozOn = on;
      if (on) shopsOn += 1;
      if (addend) {
        if (!on) addend.textContent = "—";
        else paintPromoAmount(addend, now, was);
      }
    });
    root.classList.toggle("is-both", wbOn && ozOn);
    const total = now * shopsOn;
    const wasTotal = was == null ? null : was * shopsOn;
    const totalEl = root.querySelector("[data-calc-total]");
    const wasEl = root.querySelector("[data-calc-was]");
    const unitEl = root.querySelector("[data-calc-unit]");
    const noteEl = root.querySelector("[data-calc-note]");
    if (totalEl) totalEl.textContent = priceLabel(total);
    if (wasEl) {
      const showWas = wasTotal != null && wasTotal !== total;
      wasEl.hidden = !showWas;
      if (showWas) wasEl.textContent = formatPrice(wasTotal);
    }
    if (unitEl) unitEl.hidden = total === 0;
    if (noteEl) noteEl.textContent = calcNoteText(key, wbOn, ozOn);
  }

  /**
   * Board feature rows: docs and storage keep one icon each and swap canon copy.
   */
  function syncPriceFeats(stageEl) {
    if (!stageEl) return;
    const { key } = planMeta(stageEl);
    const on = {
      start: ["docs"],
      standard: ["dashboards", "docs", "store"],
      pro: ["dashboards", "docs", "store"],
    }[key];
    const docsCopy = {
      start: "подгрузка 1 своего документа",
      standard: "подгрузка 10 документов",
      pro: "подгрузка до 100 своих документов",
    }[key];
    const storeCopy = {
      start: "глубина хранения — 3 месяца",
      standard: "глубина хранения — 3 месяца",
      pro: "глубина хранения — 1 год",
    }[key];
    const docsEl = stageEl.querySelector("[data-feat='docs'] [data-feat-copy]");
    const storeEl = stageEl.querySelector("[data-feat='store'] [data-feat-copy]");
    if (docsEl) docsEl.textContent = docsCopy;
    if (storeEl) storeEl.textContent = storeCopy;
    stageEl.querySelectorAll("[data-feat]").forEach((row) => {
      row.classList.toggle("is-on", Boolean(on) && on.includes(row.dataset.feat));
    });
  }

  /**
   * Pin the mint frame to a plan. Percent of the stack so it survives resize.
   */
  function placePriceFrame(root, plan, animate) {
    if (isSiteNarrow()) return;
    const frame = root && root.querySelector("[data-price-frame]");
    if (!root || !frame || !plan) return;
    const box = root.getBoundingClientRect();
    const rect = plan.getBoundingClientRect();
    if (box.width < 8) return;
    const inset = Math.max(5, Math.min(rect.width, rect.height) * 0.032);
    if (!animate) frame.style.transition = "none";
    frame.style.left = `${((rect.left - box.left + inset) / box.width) * 100}%`;
    frame.style.top = `${((rect.top - box.top + inset) / box.height) * 100}%`;
    frame.style.width = `${((rect.width - inset * 2) / box.width) * 100}%`;
    frame.style.height = `${((rect.height - inset * 2) / box.height) * 100}%`;
    if (!animate) {
      frame.getBoundingClientRect();
      frame.style.transition = "";
    }
  }

  /**
   * Redraw cables, frame and the board tally after a plan or shop change.
   */
  function refreshPriceScene(stageEl) {
    if (!stageEl) return;
    const root = stageEl.querySelector(".price__plans");
    const plan = root && root.querySelector(".price-plan.is-on");
    placePriceFrame(root, plan, true);
    drawPriceWires(stageEl);
    syncPriceCalc(stageEl);
    syncPriceFeats(stageEl);
  }

  /**
   * Layout a visible tariff pane (hidden stages have width 0).
   */
  function layoutPriceStage(stageEl) {
    if (!stageEl) return;
    const root = stageEl.querySelector(".price__plans");
    const plan = root && root.querySelector(".price-plan.is-on");
    placePriceFrame(root, plan, false);
    drawPriceWires(stageEl);
    syncPriceCalc(stageEl);
    syncPriceFeats(stageEl);
  }

  /**
   * Mint frame slides to the clicked tariff. Icon tint follows is-on.
   */
  function bindPricePlans(root) {
    const stageEl = root && root.closest(".stage");
    const plans = root ? [...root.querySelectorAll(".price-plan")] : [];
    if (!root || !stageEl || !plans.length || root.dataset.wired === "1") return;
    root.dataset.wired = "1";

    /**
     * Select a tariff and slide the frame onto it.
     */
    function select(plan) {
      if (plan.classList.contains("is-on")) return;
      plans.forEach((el) => el.classList.toggle("is-on", el === plan));
      refreshPriceScene(stageEl);
    }

    plans.forEach((plan) => {
      plan.addEventListener("click", () => select(plan));
    });

    const current = root.querySelector(".price-plan.is-on") || plans[1];
    current.classList.add("is-on");
    requestAnimationFrame(() => placePriceFrame(root, current, false));
  }

  document.querySelectorAll("[data-price] .price__plans").forEach(bindPricePlans);

  /**
   * WB and Ozon toggle independently. At least one shop stays on so cables have a sink.
   */
  function bindPriceMarkets(root) {
    const stageEl = root && root.closest(".stage");
    if (!root || !stageEl || root.dataset.wired === "1") return;
    root.dataset.wired = "1";

    /**
     * Sync pressed state so the whole card (logo, name, tick) stays a toggle.
     */
    function syncPressed() {
      root.querySelectorAll(".price-mp[data-shop]").forEach((el) => {
        el.setAttribute("aria-pressed", el.classList.contains("is-on") ? "true" : "false");
      });
    }

    /**
     * Toggle one shop. Keep at least one selected so wires have a sink.
     */
    function toggle(btn) {
      const selected = [...root.querySelectorAll(".price-mp[data-shop].is-on")];
      if (btn.classList.contains("is-on")) {
        if (selected.length < 2) return;
        btn.classList.remove("is-on");
      } else {
        btn.classList.add("is-on");
      }
      syncPressed();
      refreshPriceScene(stageEl);
    }

    root.querySelectorAll(".price-mp[data-shop]").forEach((btn) => {
      btn.addEventListener("click", () => toggle(btn));
    });
    syncPressed();
  }

  document.querySelectorAll("[data-price] .price__markets").forEach(bindPriceMarkets);

  /**
   * Hold the empty slot to peek Yandex Market coming-soon; release restores the plus.
   */
  function bindAddSoon(btn) {
    if (!btn || btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";
    const press = (on) => btn.classList.toggle("is-press", on);

    btn.addEventListener("pointerdown", (event) => {
      if (event.button) return;
      btn.setPointerCapture(event.pointerId);
      press(true);
    });
    btn.addEventListener("pointerup", () => press(false));
    btn.addEventListener("pointercancel", () => press(false));
    btn.addEventListener("lostpointercapture", () => press(false));
  }

  document.querySelectorAll(".price-mp--add").forEach(bindAddSoon);

  window.addEventListener("resize", () => {
    document.querySelectorAll(".stage--price, .stage--ozprice, .stage--wbprice").forEach((stageEl) => {
      if (stageEl.hidden) return;
      layoutPriceStage(stageEl);
    });
  });

  /**
   * Quiet mint on the form contour, strongest where the hub line docks.
   */
  function tintSignupCardEdge(layer, x, yDock, yTop, yBot) {
    const span = 88;
    const y0 = Math.max(yTop + 12, yDock - span);
    const y1 = Math.min(yBot - 12, yDock + span);
    const grad = document.getElementById("signup-edge-fade");
    if (grad) {
      grad.setAttribute("x1", x.toFixed(1));
      grad.setAttribute("x2", x.toFixed(1));
      grad.setAttribute("y1", y0.toFixed(1));
      grad.setAttribute("y2", y1.toFixed(1));
    }
    layer.appendChild(makePath(`M ${x.toFixed(1)} ${y0.toFixed(1)} L ${x.toFixed(1)} ${y1.toFixed(1)}`, {
      stroke: "url(#signup-edge-fade)",
      "stroke-width": "2",
      "stroke-linecap": "butt",
    }));
  }

  /**
   * L-arrow from the form's right edge up into the cloud, as on signup-block-ref.
   */
  function drawSignupCloudArrow(layer, pt, form, cloud) {
    const from = pt(form, "right");
    const formTop = pt(form, "top");
    const mid = pt(cloud, "center");
    const tip = pt(cloud, "bottom");
    const x0 = from.x;
    const y0 = formTop.y + 41;
    const x1 = mid.x;
    const apexY = tip.y - 1.2;
    const wing = 4.6;
    const depth = 3.4;
    const y1 = apexY + depth + 1.6;
    const radius = Math.min(9, Math.max(5, (x1 - x0) / 3), Math.max(5, (y0 - y1) / 3));
    const grey = "rgba(214, 222, 218, 0.62)";
    const d = [
      `M ${x0.toFixed(1)} ${y0.toFixed(1)}`,
      `L ${(x1 - radius).toFixed(1)} ${y0.toFixed(1)}`,
      `Q ${x1.toFixed(1)} ${y0.toFixed(1)} ${x1.toFixed(1)} ${(y0 - radius).toFixed(1)}`,
      `L ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    ].join(" ");
    layer.appendChild(makePath(d, {
      class: "signup__cloud-arrow",
      "stroke-width": "1.2",
      "stroke-dasharray": "5 3.8",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }));
    layer.appendChild(makePath(
      `M ${(x1 - wing).toFixed(1)} ${(apexY + depth).toFixed(1)} L ${x1.toFixed(1)} ${apexY.toFixed(1)} L ${(x1 + wing).toFixed(1)} ${(apexY + depth).toFixed(1)}`,
      {
        class: "signup__cloud-arrow",
        "stroke-width": "1.15",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }
    ));
  }

  /**
   * Aim a rail fade gradient at the two circle-edge points.
   */
  function aimSignupRailGrad(id, x0, y, x1) {
    const grad = document.getElementById(id);
    if (!grad) return;
    grad.setAttribute("x1", x0.toFixed(1));
    grad.setAttribute("x2", x1.toFixed(1));
    grad.setAttribute("y1", y.toFixed(1));
    grad.setAttribute("y2", y.toFixed(1));
  }

  /**
   * Horizontal rail aimed at circle edges: air gap + fade to transparent.
   */
  function drawSignupStepperRail(layer, id, from, to) {
    const y = (from.y + to.y) / 2;
    const x0 = from.x;
    const x1 = to.x;
    if (x1 - x0 < 8) return;
    aimSignupRailGrad(id, x0, y, x1);
    const d = `M ${x0.toFixed(1)} ${y.toFixed(1)} L ${x1.toFixed(1)} ${y.toFixed(1)}`;
    layer.appendChild(makePath(d, {
      class: "signup__rail-mint",
      "data-signup-rail": id.endsWith("0") ? "0" : "1",
      stroke: `url(#${id})`,
      "stroke-width": "1.2",
      "stroke-linecap": "butt",
    }));
  }

  /**
   * Stepper rails plus dashed mint line from the form into the API/DB hub.
   */
  function drawSignupWires() {
    if (isSiteNarrow()) return;
    const stageEl = document.querySelector(".stage--signup");
    const layer = document.querySelector("[data-signup-stepper]");
    const particles = document.querySelector("[data-signup-particles]");
    if (!stageEl || stageEl.hidden || !layer) return;

    layer.replaceChildren();
    particles?.replaceChildren();
    document.querySelector("[data-signup-wires-halo]")?.replaceChildren();
    document.querySelector("[data-signup-wires-core]")?.replaceChildren();
    document.querySelector('[data-signup-wires-neon="mint"]')?.replaceChildren();
    document.querySelector("[data-signup-port-dots]")?.replaceChildren();
    for (let i = tracks.length - 1; i >= 0; i -= 1) {
      if (tracks[i].path.closest(".stage--signup")) tracks.splice(i, 1);
    }

    const svg = layer.ownerSVGElement || layer.closest("svg") || stageEl;
    const space = svg.getBoundingClientRect();
    if (space.width < 8) return;

    /**
     * Point on a node in the stepper SVG viewBox, not the outer scene box.
     */
    function pt(el, side) {
      const box = el.getBoundingClientRect();
      const x = side === "right" ? box.right : side === "left" ? box.left : (box.left + box.right) / 2;
      const y = side === "bottom" ? box.bottom : side === "top" ? box.top : (box.top + box.bottom) / 2;
      return {
        x: ((x - space.left) / space.width) * 1024,
        y: ((y - space.top) / space.height) * 576,
      };
    }

    const user = document.querySelector('[data-signup-node="user"]');
    const shield = document.querySelector('[data-signup-node="shield"]');
    const cloud = document.querySelector('[data-signup-node="cloud"]');
    if (!user || !shield || !cloud) return;

    const pair = [
      [pt(user, "right"), pt(shield, "left"), "signup-rail-0"],
      [pt(shield, "right"), pt(cloud, "left"), "signup-rail-1"],
    ];
    pair.forEach(([a, b, id]) => drawSignupStepperRail(layer, id, a, b));

    const hub = document.querySelector("[data-signup-deco-hub]");
    const form = document.querySelector("[data-signup-form]");
    if (form) drawSignupCloudArrow(layer, pt, form, cloud);
    if (hub && form) {
      const to = pt(hub, "center");
      const from = pt(form, "right");
      const dock = pt(hub, "left");
      const xEnd = dock.x - 3.5;
      tintSignupCardEdge(layer, from.x, to.y, pt(form, "top").y, pt(form, "bottom").y);
      layer.appendChild(makePath(`M ${from.x.toFixed(1)} ${to.y.toFixed(1)} L ${xEnd.toFixed(1)} ${to.y.toFixed(1)}`, {
        stroke: "rgba(93, 255, 200, 0.55)",
        "stroke-width": "1.25",
        "stroke-dasharray": "4 3.2",
        "stroke-linecap": "round",
      }));
    }
    if (form) syncSignupStepper(form, false);
  }

  /**
   * Toggle one password field between masked and visible.
   */
  function setSignupPasswordShown(btn, shown) {
    const input = btn.parentElement?.querySelector("input");
    if (!input) return;
    input.type = shown ? "text" : "password";
    btn.classList.toggle("is-on", shown);
    btn.setAttribute("aria-pressed", shown ? "true" : "false");
    btn.setAttribute("aria-label", shown ? "Скрыть пароль" : "Показать пароль");
  }

  /**
   * Click handler for signup password eye buttons (also used from HTML onclick).
   */
  function needraToggleSignupEye(btn) {
    const input = btn.parentElement?.querySelector("input");
    if (!input) return;
    setSignupPasswordShown(btn, input.type === "password");
  }
  window.needraToggleSignupEye = needraToggleSignupEye;

  const SIGNUP_EMAIL_MASK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Email mask: local@domain.tld, no spaces.
   */
  function isSignupEmailOk(value) {
    return SIGNUP_EMAIL_MASK.test(String(value).trim());
  }

  /**
   * Whether a signup input currently counts as successfully filled.
   */
  function isSignupFieldOk(input, form) {
    if (input.name === "email") return isSignupEmailOk(input.value);
    if (input.name === "password") return input.value.length >= 8;
    if (input.name === "password_confirmation") {
      const pass = form.querySelector("[name='password']");
      const passValue = pass ? pass.value : "";
      if (!passValue.trim()) return false;
      return input.value.length >= 8 && input.value === passValue;
    }
    return input.checkValidity();
  }

  /**
   * Mint if filled and valid; red only after leave with invalid text.
   * Empty always stays grey.
   */
  function paintSignupField(input, form) {
    if (!input.value.trim()) {
      input.classList.remove("is-ok", "is-bad");
      input.dataset.err = "";
      return;
    }
    const ok = isSignupFieldOk(input, form);
    input.classList.toggle("is-ok", ok);
    input.classList.toggle("is-bad", !ok);
    input.dataset.err = ok ? "" : "1";
  }

  /**
   * Hint above the user node when email is red.
   */
  function signupUserHint(form) {
    const email = form.querySelector("[name='email']");
    if (email?.dataset.err !== "1") return "";
    return "это не почта";
  }

  /**
   * Hint above the shield: length first, then mismatch.
   */
  function signupShieldHint(form) {
    const pass = form.querySelector("[name='password']");
    const confirm = form.querySelector("[name='password_confirmation']");
    const passErr = pass?.dataset.err === "1";
    const confirmErr = confirm?.dataset.err === "1";
    if (!passErr && !confirmErr) return "";
    if ((passErr && pass.value.length < 8) || (confirmErr && confirm.value.length < 8)) {
      return "минимум 8 символов";
    }
    return "Пароль не совпал";
  }

  /**
   * Show or hide a stepper hint.
   */
  function paintSignupHint(name, text) {
    const el = document.querySelector(`[data-signup-hint="${name}"]`);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-on", Boolean(text));
  }

  /**
   * Current signup stepper: email → passwords → consent.
   */
  function signupProgress(form) {
    const email = form.querySelector("[name='email']");
    const pass = form.querySelector("[name='password']");
    const confirm = form.querySelector("[name='password_confirmation']");
    const consent = form.querySelector("[name='consent']");
    return {
      email: isSignupEmailOk(email?.value || ""),
      pass: Boolean(pass && confirm && isSignupFieldOk(pass, form) && isSignupFieldOk(confirm, form)),
      consent: Boolean(consent?.checked),
    };
  }

  const signupRailTweens = { 0: null, 1: null };
  const SIGNUP_RAIL_GREY = [214, 222, 218];
  const SIGNUP_RAIL_MINT = [93, 255, 200];
  const SIGNUP_RAIL_SOFT = 0.46;

  /**
   * End-cap shape so the rail never touches the stepper circles.
   */
  function signupRailCap(x) {
    if (x <= 0.10) return 0;
    if (x < 0.22) return (x - 0.10) / 0.12;
    if (x <= 0.78) return 1;
    if (x < 0.90) return 1 - (x - 0.78) / 0.12;
    return 0;
  }

  /**
   * Left-to-right fill: 1 = mint, 0 = grey, linear bloom after the head.
   */
  function signupRailFill(x, t) {
    if (t <= 0) return 0;
    if (x <= t) return 1;
    const fade = (x - t) / SIGNUP_RAIL_SOFT;
    if (fade >= 1) return 0;
    return 1 - fade;
  }

  /**
   * Mix grey rail into mint at fill 0…1.
   */
  function signupRailColor(fill) {
    const rgb = SIGNUP_RAIL_GREY.map((g, i) => Math.round(g + (SIGNUP_RAIL_MINT[i] - g) * fill));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  /**
   * Map 0–1 time onto cubic-bezier(0.22, 0.12, 0.18, 1).
   */
  function cubicBezierEase(p1x, p1y, p2x, p2y, t) {
    let lo = 0;
    let hi = 1;
    let u = t;
    for (let i = 0; i < 14; i += 1) {
      const x = 3 * (1 - u) * (1 - u) * u * p1x + 3 * (1 - u) * u * u * p2x + u * u * u;
      if (x < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return 3 * (1 - u) * (1 - u) * u * p1y + 3 * (1 - u) * u * u * p2y + u * u * u;
  }

  /**
   * Paint one rail as a mint→grey color gradient at progress t.
   */
  function paintSignupMintRail(id, t) {
    const grad = document.getElementById(id);
    if (!grad) return;
    const head = Math.max(0, Math.min(1, t));
    const keys = [0, 0.06, 0.1, 0.16, 0.22, 0.35, 0.5, 0.65, 0.78, 0.84, 0.9, 1];
    keys.push(
      head,
      Math.max(0, head - 0.04),
      head + SIGNUP_RAIL_SOFT * 0.2,
      head + SIGNUP_RAIL_SOFT * 0.4,
      head + SIGNUP_RAIL_SOFT * 0.6,
      head + SIGNUP_RAIL_SOFT * 0.8,
      head + SIGNUP_RAIL_SOFT,
    );
    const uniq = [...new Set(keys.map((k) => Math.max(0, Math.min(1, Number(k.toFixed(4))))))].sort((a, b) => a - b);
    grad.replaceChildren();
    uniq.forEach((x) => {
      const fill = signupRailFill(x, head);
      const stop = document.createElementNS(NS, "stop");
      stop.setAttribute("offset", String(x));
      stop.setAttribute("stop-color", signupRailColor(fill));
      stop.setAttribute("stop-opacity", (signupRailCap(x) * (0.62 + 0.33 * fill)).toFixed(3));
      grad.appendChild(stop);
    });
    grad.dataset.t = String(head);
  }

  /**
   * Soft-gradient bloom along one stepper rail.
   */
  function tweenSignupMintRail(index, to, animate) {
    const id = `signup-rail-${index}`;
    const grad = document.getElementById(id);
    if (!grad) return;
    const from = Number(grad.dataset.t || 0);
    if (signupRailTweens[index]) cancelAnimationFrame(signupRailTweens[index]);
    if (!animate || Math.abs(from - to) < 0.001) {
      paintSignupMintRail(id, to);
      return;
    }
    const start = performance.now();
    const dur = 2600;
    function tick(now) {
      const u = Math.min(1, (now - start) / dur);
      const t = from + (to - from) * cubicBezierEase(0.45, 0.08, 0.55, 0.92, u);
      paintSignupMintRail(id, t);
      if (u < 1) signupRailTweens[index] = requestAnimationFrame(tick);
      else signupRailTweens[index] = null;
    }
    signupRailTweens[index] = requestAnimationFrame(tick);
  }

  /**
   * Light nodes, bloom rails left-to-right, neon the CTA when consent is on.
   */
  function syncSignupStepper(form, animate) {
    const root = document.querySelector(".signup");
    const go = form.querySelector(".signup__go");
    const progress = signupProgress(form);
    const userHint = signupUserHint(form);
    const shieldHint = signupShieldHint(form);
    const user = document.querySelector('[data-signup-node="user"]');
    const shield = document.querySelector('[data-signup-node="shield"]');
    user?.classList.toggle("is-on", progress.email);
    user?.classList.toggle("is-bad", Boolean(userHint));
    shield?.classList.toggle("is-on", progress.pass);
    shield?.classList.toggle("is-bad", Boolean(shieldHint));
    document.querySelector('[data-signup-node="cloud"]')?.classList.toggle("is-on", progress.consent);
    paintSignupHint("user", userHint);
    paintSignupHint("shield", shieldHint);
    root?.classList.toggle("is-ready", progress.consent);
    go?.classList.toggle("is-ready", progress.consent);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    [["0", progress.email], ["1", progress.pass]].forEach(([idx, lit]) => {
      const to = lit ? 1 : 0;
      const grad = document.getElementById(`signup-rail-${idx}`);
      if (!grad) return;
      const cur = Number(grad.dataset.t || 0);
      if (grad.dataset.lit === String(lit) && Math.abs(cur - to) < 0.02) return;
      grad.dataset.lit = String(lit);
      tweenSignupMintRail(idx, to, animate && !reduced);
    });
  }

  /**
   * Check only after the user leaves a filled field.
   */
  function bindSignupFieldGlow(form) {
    const fields = [...form.querySelectorAll(".signup__field input")];
    fields.forEach((input) => {
      input.addEventListener("focus", () => {
        input.classList.remove("is-bad");
      });
      input.addEventListener("blur", () => {
        paintSignupField(input, form);
        if (input.name === "password") {
          const confirm = form.querySelector("[name='password_confirmation']");
          if (confirm) paintSignupField(confirm, form);
        }
        syncSignupStepper(form, true);
      });
      input.addEventListener("input", () => {
        if (!input.value.trim()) {
          input.classList.remove("is-ok", "is-bad");
          input.dataset.err = "";
          if (input.name === "password") {
            const confirm = form.querySelector("[name='password_confirmation']");
            if (confirm) paintSignupField(confirm, form);
          }
        } else if (input.dataset.err === "1" && isSignupFieldOk(input, form)) {
          input.dataset.err = "";
          input.classList.add("is-ok");
          input.classList.remove("is-bad");
        }
        syncSignupStepper(form, true);
      });
    });
    form.querySelector("[name='consent']")?.addEventListener("change", () => {
      syncSignupStepper(form, true);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      fields.forEach((input) => paintSignupField(input, form));
      syncSignupStepper(form, true);
    });
  }

  const METRIKA_ID = 94171170;
  const ATTR_STORAGE = "needra_attr";
  const ATTR_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "yclid",
    "ysclid",
  ];

  /** Читает сохранённые UTM и yclid. */
  function getAttribution() {
    try {
      const raw = sessionStorage.getItem(ATTR_STORAGE);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const match = document.cookie.match(/(?:^|; )needra_attr=([^;]*)/);
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[1]));
      } catch (_) {}
    }
    return {};
  }

  /** Кладёт UTM/yclid из URL в sessionStorage и cookie на .needra.ru. */
  function captureAttribution() {
    const params = new URLSearchParams(location.search);
    const found = {};
    ATTR_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) found[key] = value;
    });
    if (Object.keys(found).length === 0) return getAttribution();
    const json = JSON.stringify(found);
    try {
      sessionStorage.setItem(ATTR_STORAGE, json);
    } catch (_) {}
    document.cookie =
      "needra_attr=" +
      encodeURIComponent(json) +
      ";domain=.needra.ru;path=/;max-age=" +
      String(90 * 24 * 60 * 60) +
      ";SameSite=Lax";
    return found;
  }

  /** Отправляет цель Метрики вместе с UTM/yclid. */
  function ymReach(name, extra) {
    if (typeof ym !== "function") return;
    ym(METRIKA_ID, "reachGoal", name, { ...getAttribution(), ...(extra || {}) });
  }

  /** Добавляет UTM/yclid к URL редиректа в ЛК. */
  function withAttribution(url) {
    const attr = getAttribution();
    try {
      const parsed = new URL(url, location.origin);
      Object.entries(attr).forEach(([key, value]) => {
        if (value && !parsed.searchParams.has(key)) parsed.searchParams.set(key, String(value));
      });
      return parsed.toString();
    } catch (_) {
      return url;
    }
  }

  /** Текст ошибки из JSON ответа landing-register. */
  function landingRegisterErrorMessage(data, status) {
    const raw = data && data.message;
    if (Array.isArray(raw) && raw.length) {
      return raw
        .map((item) => (typeof item === "string" ? item : item && item.message))
        .filter(Boolean)
        .join(". ");
    }
    if (typeof raw === "string" && raw) return raw;
    if (raw && typeof raw.message === "string" && raw.message) return raw.message;
    if (data && data.error) return String(data.error);
    if (data && data.detail) return String(data.detail);
    if (data && data.code) return String(data.code);
    if (status === 429) return "Слишком много попыток. Попробуйте позже.";
    if (!status || status >= 500) return "Попробуйте позже";
    return `Ошибка ЛК: ${status}`;
  }

  /** Аккаунт уже есть — по коду или тексту ответа ЛК. */
  function isExistingUserError(data, message) {
    const blob = `${(data && data.code) || ""} ${message}`.toLowerCase();
    return /already exists|уже есть|уже зарегистрир/.test(blob);
  }

  /**
   * Регистрация: тот же контракт, что landing-below.js (JSON POST в ЛК).
   * Визуальный stepper не трогаем.
   */
  function bindSignupForm() {
    const form = document.querySelector("[data-signup-form]");
    if (!form || form.dataset.wired === "1") return;
    form.dataset.wired = "1";
    bindSignupFieldGlow(form);
    captureAttribution();

    const statusEl = form.querySelector("[data-signup-status]");
    const go = form.querySelector(".signup__go");
    const lkUrl = "https://lk.needra.ru";
    let signupStarted = false;

    /** Первое фокусирование поля — цель signup_start. */
    const markSignupStart = () => {
      if (signupStarted) return;
      signupStarted = true;
      ymReach("signup_start");
    };

    form.querySelectorAll("input").forEach((el) => {
      el.addEventListener("focus", markSignupStart);
    });

    /** Тело POST: только whitelist-поля landing-register. */
    const buildPayload = () => ({
      email: form.querySelector("[name='email']")?.value.trim() || "",
      password: form.querySelector("[name='password']")?.value || "",
      password_confirmation: form.querySelector("[name='password_confirmation']")?.value || "",
      consent: Boolean(form.querySelector("[name='consent']")?.checked),
    });

    /** Показывает статус под кнопкой, не ломая stepper. */
    const paintStatus = (ok, htmlOrText, asHtml) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.classList.toggle("is-ok", Boolean(ok));
      statusEl.classList.toggle("is-error", !ok);
      if (asHtml) statusEl.innerHTML = htmlOrText;
      else statusEl.textContent = htmlOrText;
    };

    form.addEventListener("submit", async () => {
      const progress = signupProgress(form);
      if (!progress.email || !progress.pass) return;
      if (!progress.consent) {
        paintStatus(false, "Нужно согласие на обработку персональных данных");
        return;
      }

      const endpoint = (form.dataset.lkEndpoint || "").trim();
      if (!endpoint) {
        paintStatus(false, "Нет адреса регистрации");
        return;
      }

      if (go) go.disabled = true;
      try {
        ymReach("signup_submit");
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(buildPayload()),
          credentials: "omit",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = landingRegisterErrorMessage(data, res.status);
          const err = new Error(msg);
          err.existingUser = isExistingUserError(data, msg);
          throw err;
        }
        paintStatus(true, "Готово. Перенаправляем в личный кабинет…");
        ymReach("signup_success");
        const redirectUrl = data?.redirectUrl || data?.data?.redirectUrl;
        if (!redirectUrl) throw new Error("Нет redirectUrl в ответе");
        window.location.href = withAttribution(redirectUrl);
      } catch (err) {
        ymReach("signup_error", { existing: Boolean(err?.existingUser) });
        if (err?.existingUser) {
          paintStatus(
            false,
            'Аккаунт уже есть — войдите в <a href="' + lkUrl + '">личный кабинет</a>',
            true
          );
        } else {
          paintStatus(false, err?.message || "Не удалось отправить. Попробуйте ещё раз.");
        }
      } finally {
        if (go) go.disabled = false;
      }
    });
  }

  /**
   * Footer schematic: hub forks into three rows of ports.
   * Circles and rails share one SVG; a mask punches lines out of each disc
   * so the stroke cannot mix with the ring.
   */
  function drawFootWires() {
    if (isSiteNarrow()) return;
    const stageEl = document.querySelector(".stage--foot");
    const foot = stageEl?.querySelector(".foot");
    const svg = foot?.querySelector("[data-foot-svg]");
    const halo = svg?.querySelector("[data-foot-halo]");
    const neon = svg?.querySelector("[data-foot-neon]");
    const nodes = svg?.querySelector("[data-foot-nodes]");
    const maskBg = svg?.querySelector("[data-foot-mask-bg]");
    const maskHoles = svg?.querySelector("[data-foot-mask-holes]");
    const haloBg = svg?.querySelector("[data-foot-halo-bg]");
    const haloHoles = svg?.querySelector("[data-foot-halo-holes]");
    if (!stageEl || stageEl.hidden || !foot || !svg || !halo || !neon || !nodes || !maskBg || !maskHoles || !haloBg || !haloHoles) return;

    halo.replaceChildren();
    neon.replaceChildren();
    nodes.replaceChildren();
    maskHoles.replaceChildren();
    haloHoles.replaceChildren();

    const svgBox = svg.getBoundingClientRect();
    if (svgBox.width < 8) {
      requestAnimationFrame(() => drawFootWires());
      return;
    }

    svg.setAttribute("viewBox", `0 0 ${svgBox.width} ${svgBox.height}`);
    [maskBg, haloBg].forEach((rect) => {
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(svgBox.width));
      rect.setAttribute("height", String(svgBox.height));
    });

    const unit = stageEl.getBoundingClientRect().width / 1024;
    const snap = (v) => Math.round(v) + 0.5;
    const n = (v) => v.toFixed(2);
    const HALO_PAD = 4.2;
    const FLAT = 40;

    /**
     * Client point → SVG user units (1 unit = 1 CSS pixel of the panel SVG).
     */
    function xy(clientX, clientY) {
      return { x: clientX - svgBox.left, y: clientY - svgBox.top };
    }

    const hubEl = foot.querySelector("[data-foot-hub]");
    const rows = [...foot.querySelectorAll("[data-foot-row]")];
    if (!hubEl || !rows.length) return;

    /**
     * One geometry object per port: lines and circles use these exact numbers.
     */
    function geomOf(el, y) {
      const box = el.getBoundingClientRect();
      const c = xy(box.left + box.width / 2, box.top + box.height / 2);
      const cx = snap(c.x);
      const tail = el.closest(".foot__more");
      const r = tail ? 1 : Math.max(4, Math.round(box.width / 2));
      return { cx, cy: y, r, left: cx - r, right: cx + r };
    }

    const hubY = snap(xy(0, hubEl.getBoundingClientRect().top + hubEl.getBoundingClientRect().height / 2).y);
    const geom = new Map();
    geom.set(hubEl, geomOf(hubEl, hubY));

    rows.forEach((row) => {
      const ports = [...row.querySelectorAll("[data-foot-port]")];
      if (!ports.length) return;
      const first = ports[0].getBoundingClientRect();
      let y = snap(xy(0, first.top + first.height / 2).y);
      if (Math.abs(y - hubY) < 3) y = hubY;
      ports.forEach((p) => geom.set(p, geomOf(p, y)));
    });

    /**
     * Leave a node: after a text label, or at the right tangent of a button out-port.
     */
    function railLeave(port) {
      const g = geom.get(port);
      const label = port.closest(".foot__link");
      if (label) {
        const box = label.getBoundingClientRect();
        return { x: xy(box.right, 0).x + 3, y: g.cy };
      }
      return { x: g.right, y: g.cy };
    }

    /**
     * Straight rail on one Y; halo stops short of the disc.
     */
    function hLine(x0, x1, y) {
      const neonD = `M ${n(x0)} ${n(y)} L ${n(x1)} ${n(y)}`;
      const span = x1 - x0;
      const pad = span > HALO_PAD * 2 + 2 ? HALO_PAD : Math.max(0, span / 4);
      return { neon: neonD, halo: `M ${n(x0 + pad)} ${n(y)} L ${n(x1 - pad)} ${n(y)}` };
    }

    /**
     * Hub elbow: cubic, then a long horizontal run into the leftmost point of the first disc.
     */
    function fork(toPort) {
      const origin = geom.get(hubEl);
      const dest = geom.get(toPort);
      const y = dest.cy;
      if (Math.abs(y - hubY) < 3 * unit) return hLine(origin.right, dest.left, y);
      const p1x = origin.cx + 40 * unit;
      const p2x = origin.cx + 54 * unit;
      let p3x = origin.cx + 87 * unit;
      const flatX = dest.left - FLAT;
      if (p3x > flatX) p3x = Math.max(origin.right + 16, flatX);
      const cubic = `C ${n(p1x)} ${n(hubY)} ${n(p2x)} ${n(y)} ${n(p3x)} ${n(y)}`;
      return {
        neon: `M ${n(origin.right)} ${n(hubY)} ${cubic} L ${n(dest.left)} ${n(y)}`,
        halo: `M ${n(origin.right + HALO_PAD)} ${n(hubY)} ${cubic} L ${n(dest.left - HALO_PAD)} ${n(y)}`,
      };
    }

    const stroke = {
      stroke: "rgba(168, 188, 186, 0.92)",
      "stroke-width": "1",
      "stroke-linecap": "butt",
      "stroke-linejoin": "round",
    };

    const ds = [];
    rows.forEach((row) => {
      const ports = [...row.querySelectorAll("[data-foot-port]")];
      if (!ports.length) return;
      const y = geom.get(ports[0]).cy;
      ds.push(fork(ports[0]));
      for (let i = 0; i < ports.length - 1; i += 1) {
        const aBtn = ports[i].closest(".foot__btn");
        const bBtn = ports[i + 1].closest(".foot__btn");
        if (aBtn && aBtn === bBtn) continue;
        const a = railLeave(ports[i]);
        const b = geom.get(ports[i + 1]);
        if (b.left - a.x < 2) continue;
        ds.push(hLine(a.x, b.left, y));
      }
    });

    ds.forEach(({ neon: d, halo: glow }) => {
      halo.appendChild(makePath(glow, { ...stroke, "stroke-width": "2.4", stroke: "rgba(186, 222, 214, 0.22)" }));
      neon.appendChild(makePath(d, stroke));
    });

    /**
     * Growing dots on the rail after the last node — not a text ellipsis.
     */
    function drawTail(g) {
      const start = g.cx + 5.5;
      [
        { dx: 0, r: 2.25, fill: "rgba(210, 224, 220, 0.7)" },
        { dx: 8.6, r: 3.05, fill: "rgba(214, 228, 224, 0.86)" },
        { dx: 18.2, r: 4.0, fill: "rgba(220, 234, 228, 0.98)" },
      ].forEach((d) => {
        nodes.appendChild(makeCircle(n(start + d.dx), n(g.cy), n(d.r), { fill: d.fill }));
      });
    }

    geom.forEach((g, el) => {
      if (el.closest?.(".foot__more")) return;
      maskHoles.appendChild(makeCircle(n(g.cx), n(g.cy), n(g.r + 0.5), { fill: "#000" }));
      haloHoles.appendChild(makeCircle(n(g.cx), n(g.cy), n(g.r + 3.5), { fill: "#000" }));
      nodes.appendChild(makeCircle(n(g.cx), n(g.cy), n(g.r), {
        fill: "#070a0c",
        stroke: "rgba(184, 230, 220, 0.82)",
        "stroke-width": "1",
      }));
    });

    rows.forEach((row) => {
      const last = [...row.querySelectorAll("[data-foot-port]")].at(-1);
      if (last?.closest(".foot__more")) drawTail(geom.get(last));
    });
  }

  if (!document.querySelector(".stage--foot")?.hidden) {
    requestAnimationFrame(() => drawFootWires());
    setTimeout(() => drawFootWires(), 50);
  }

  bindSignupForm();
  window.addEventListener("resize", () => {
    if (!document.querySelector(".stage--signup")?.hidden) drawSignupWires();
    if (!document.querySelector(".stage--foot")?.hidden) drawFootWires();
  });

  const FAQ_HOME = {
    h2: "Частые вопросы по аналитике ВБ и Озон",
    items: [
      {
        q: "Можно ли купить подписку сразу на год?",
        a: "Да, внутри кабинета вы можете пополнить баланс на любой период. Средства будут автоматически списываться каждый месяц из вашего баланса в личном кабинете (не с карты)",
      },
      {
        q: "Можно ли анализировать данные, загруженные на бесплатном тарифе, несколько дней?",
        a: "Да. Бесплатно — первая загрузка из API и чат по этому срезу. Свежие данные каждый день — в тарифах Стандарт и Pro",
      },
      {
        q: "Можно ли купить подписку PRO на OZON и Стандарт на WB?",
        a: "Да. Один тариф — один кабинет. ВБ и Озон — две подписки, уровни можно разные",
      },
      {
        q: "Как связаться с технической поддержкой?",
        a: "Через наш телеграм бот: https://t.me/NeedRabot в любой момент",
      },
      {
        q: "Какие API ключи нужны для сервиса и где их взять?",
        a: "Ключ API на чтение: в кабинете продавца Wildberries и/или Ozon, раздел API",
      },
      {
        q: "Если я дам API на запись, сервис сможет записать мои задачи в кабинет?",
        a: "Нет. Нужен ключ на чтение. Возможно позже",
      },
      {
        q: "Смогу ли я подключить к сервису своего агента и обучить его?",
        a: "Нет. В чате агент NeedRa по данным вашего кабинета. Своего агента подключить нельзя",
      },
      {
        q: "Могу ли я получить доступ к аналитике Яндекс Маркета через ваш сервис?",
        a: "Пока нет. Сейчас ВБ и Озон. Яндекс Маркет — скоро",
      },
    ],
  };

  const FAQ_WB = {
    h2: "Частые вопросы по аналитике Вайлдберриз",
    items: FAQ_HOME.items,
  };

  const FAQ_OZON = {
    h2: "Частые вопросы по аналитике Озон",
    items: FAQ_HOME.items,
  };

  /**
   * Cluster FAQ: home questions, karkas h2 for the page.
   */
  function faqCopyFor(pageId) {
    if (pageId === "wb") return FAQ_WB;
    if (pageId === "ozon") return FAQ_OZON;
    return FAQ_HOME;
  }

  /**
   * One terminal FAQ command row.
   */
  function makeFaqRow(item, index, open) {
    const row = document.createElement("article");
    row.className = open ? "faq__row is-on" : "faq__row";
    row.dataset.faqRow = "";
    row.dataset.answer = item.a;
    const num = String(index + 1).padStart(2, "0");
    const cmd = document.createElement("button");
    cmd.className = "faq__cmd";
    cmd.type = "button";
    cmd.setAttribute("aria-expanded", open ? "true" : "false");
    const n = document.createElement("span");
    n.className = "faq__num";
    n.textContent = num;
    const gt = document.createElement("span");
    gt.className = "faq__gt";
    gt.textContent = ">";
    const h3 = document.createElement("h3");
    h3.textContent = item.q;
    cmd.append(n, gt, h3);
    const out = document.createElement("p");
    out.className = "faq__out";
    if (!open) out.hidden = true;
    const typed = document.createElement("span");
    typed.dataset.faqTyped = "";
    const cursor = document.createElement("span");
    cursor.className = "faq__cursor";
    cursor.setAttribute("aria-hidden", "true");
    out.append(typed, cursor);
    row.append(cmd, out);
    return row;
  }

  /**
   * Cluster FAQ reuses the home terminal and home Q&A; only h2 follows the page.
   */
  function paintFaqCopy(pageId) {
    const pane = document.querySelector('[data-pane="home-faq"]');
    const h2 = pane && pane.querySelector(".faq__copy h2");
    const list = pane && pane.querySelector("[data-faq-list]");
    if (!h2 || !list) return;
    const copy = faqCopyFor(pageId);
    h2.textContent = copy.h2;
    list.replaceChildren(...copy.items.map((item, i) => makeFaqRow(item, i, i === 0)));
  }

  bindLabShell();

  const FAQ_URL = /https?:\/\/[^\s]+/g;

  /**
   * The span that holds printed FAQ stdout.
   */
  function faqTypedNode(out) {
    return out?.querySelector("[data-faq-typed]") || out;
  }

  /**
   * Split an FAQ answer into plain text and http(s) URL runs.
   */
  function faqSegments(text) {
    const parts = [];
    let last = 0;
    FAQ_URL.lastIndex = 0;
    let match = FAQ_URL.exec(text);
    while (match) {
      if (match.index > last) parts.push({ kind: "text", value: text.slice(last, match.index) });
      parts.push({ kind: "url", value: match[0] });
      last = match.index + match[0].length;
      match = FAQ_URL.exec(text);
    }
    if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
    return parts;
  }

  /**
   * Render printed FAQ text, wrapping URLs as links as soon as they appear.
   */
  function setFaqTyped(typed, text, count) {
    if (!typed) return;
    typed.replaceChildren();
    let left = count == null ? text.length : count;
    for (const part of faqSegments(text)) {
      if (left <= 0) break;
      const take = part.value.slice(0, left);
      left -= take.length;
      if (part.kind === "url") {
        const a = document.createElement("a");
        a.className = "faq__link";
        a.href = part.value;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = take;
        typed.append(a);
      } else {
        typed.append(take);
      }
    }
  }

  /**
   * Keep the active FAQ row inside the terminal pane, like a tty.
   */
  function scrollFaqRow(list, row) {
    if (!list || !row) return;
    const out = row.querySelector(".faq__out");
    const target = out && !out.hidden ? out : row;
    const listBox = list.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const pad = 10;
    if (box.bottom > listBox.bottom - pad) list.scrollTop += box.bottom - listBox.bottom + pad;
    else if (box.top < listBox.top + pad) list.scrollTop -= listBox.top - box.top + pad;
  }

  /**
   * Print FAQ answer like stdout. Skip the crawl if motion is reduced.
   */
  function typeFaqOut(node, text, onTick, done) {
    window.clearTimeout(faqTypeTimer);
    const typed = faqTypedNode(node);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !text) {
      setFaqTyped(typed, text);
      onTick?.();
      done?.();
      return;
    }
    let i = 0;
    setFaqTyped(typed, text, 0);
    function tick() {
      i += 1;
      setFaqTyped(typed, text, i);
      onTick?.();
      if (i < text.length) faqTypeTimer = window.setTimeout(tick, 18);
      else done?.();
    }
    tick();
  }

  /**
   * Terminal FAQ: one open command, blinking block, typed answer.
   */
  function bindFaqTerm(replay) {
    const root = document.querySelector("[data-faq]");
    const stage = document.querySelector(".stage--faq");
    if (!root || !stage || stage.hidden) return;
    const list = root.querySelector("[data-faq-list]");
    const pager = root.querySelector("[data-faq-pager]");

    /**
     * Live FAQ rows after cluster copy swap.
     */
    function rows() {
      return [...root.querySelectorAll("[data-faq-row]")];
    }

    function openRow(index, typeOut) {
      const all = rows();
      if (!all.length) return;
      const i = Math.max(0, Math.min(all.length - 1, index));
      const total = String(all.length).padStart(2, "0");
      all.forEach((row, n) => {
        const on = n === i;
        row.classList.toggle("is-on", on);
        row.querySelector(".faq__cmd")?.setAttribute("aria-expanded", on ? "true" : "false");
        const out = row.querySelector(".faq__out");
        if (!out) return;
        if (!on) {
          faqTypedNode(out).replaceChildren();
          out.hidden = true;
        }
      });
      if (pager) pager.textContent = `${String(i + 1).padStart(2, "0")} / ${total}`;
      const out = all[i].querySelector(".faq__out");
      const full = all[i].dataset.answer || "";
      if (!out) return;
      out.hidden = false;
      const follow = () => scrollFaqRow(list, all[i]);
      if (typeOut) typeFaqOut(out, full, follow);
      else {
        setFaqTyped(faqTypedNode(out), full);
        follow();
      }
    }

    rows().forEach((row) => {
      const out = row.querySelector(".faq__out");
      if (out && !row.dataset.answer) row.dataset.answer = faqTypedNode(out).textContent.trim();
    });

    if (root.dataset.wired !== "1") {
      root.dataset.wired = "1";
      list?.addEventListener("click", (event) => {
        const cmd = event.target.closest(".faq__cmd");
        if (!cmd || !root.contains(cmd)) return;
        const n = rows().indexOf(cmd.closest("[data-faq-row]"));
        if (n >= 0) openRow(n, true);
      });
      document.addEventListener("keydown", (event) => {
        if (stage.hidden) return;
        const all = rows();
        const on = all.findIndex((row) => row.classList.contains("is-on"));
        if (event.key === "ArrowDown" || event.key === "j") {
          event.preventDefault();
          openRow(on + 1, true);
        } else if (event.key === "ArrowUp" || event.key === "k") {
          event.preventDefault();
          openRow(on - 1, true);
        }
      });
    }
    openRow(0, replay !== false);
  }

  /**
   * Pause the lab demo if the video pane is left.
   */
  function pauseLabVideo() {
    stopVidThink();
    const video = document.querySelector("[data-vid-el]");
    if (video && !video.paused) video.pause();
  }

  /**
   * Format mm:ss for the custom control bar.
   */
  function formatVidTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const total = Math.floor(sec);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  /**
   * Video pane: custom chrome, click-to-play, no autoplay with sound.
   */
  function bindVideoPlayer() {
    const root = document.querySelector("[data-video]");
    const video = root?.querySelector("[data-vid-el]");
    if (!root || !video) return;

    const fill = root.querySelector("[data-vid-fill]");
    const time = root.querySelector("[data-vid-time]");
    const progress = root.querySelector("[data-vid-progress]");
    const playIco = root.querySelector("[data-vid-play-ico]");

    /**
     * Sync play icon, overlay and root state with the video element.
     */
    function syncPlay() {
      const on = !video.paused && !video.ended;
      root.classList.toggle("is-play", on);
      root.querySelectorAll("[data-vid-play]").forEach((btn) => {
        btn.setAttribute("aria-label", on ? "Пауза" : "Смотреть");
      });
      if (playIco) {
        playIco.innerHTML = on
          ? '<path fill="currentColor" d="M7 5 H10.2 V19 H7 Z M13.8 5 H17 V19 H13.8 Z"/>'
          : '<path fill="currentColor" d="M8 5 L19 12 L8 19 Z"/>';
      }
    }

    /**
     * Write current / duration into the bar.
     */
    function syncTime() {
      const now = video.currentTime || 0;
      const dur = video.duration || 0;
      if (fill) fill.style.width = dur ? `${(now / dur) * 100}%` : "0%";
      if (time) time.textContent = `${formatVidTime(now)} / ${formatVidTime(dur)}`;
    }

    /**
     * Toggle playback; sound only after a click.
     */
    function togglePlay() {
      if (video.paused) {
        video.muted = false;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      } else {
        video.pause();
      }
    }

    if (root.dataset.wired !== "1") {
      root.dataset.wired = "1";
      root.querySelectorAll("[data-vid-play]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          togglePlay();
        });
      });
      video.addEventListener("play", syncPlay);
      video.addEventListener("pause", syncPlay);
      video.addEventListener("ended", syncPlay);
      video.addEventListener("timeupdate", syncTime);
      video.addEventListener("loadedmetadata", syncTime);
      progress?.addEventListener("click", (event) => {
        const box = progress.getBoundingClientRect();
        const ratio = box.width ? (event.clientX - box.left) / box.width : 0;
        if (Number.isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(1, ratio)) * video.duration;
      });
      root.querySelector("[data-vid-mute]")?.addEventListener("click", () => {
        video.muted = !video.muted;
      });
      root.querySelector("[data-vid-full]")?.addEventListener("click", () => {
        const player = root.querySelector(".vid__player");
        if (!player) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else player.requestFullscreen?.();
      });
      root.querySelector("[data-vid-pip]")?.addEventListener("click", () => {
        if (!document.pictureInPictureEnabled) return;
        if (document.pictureInPictureElement) document.exitPictureInPicture();
        else video.requestPictureInPicture().catch(() => {});
      });
    }

    syncPlay();
    syncTime();
  }

  /**
   * Stop the thinking-list loop when leaving the video pane.
   */
  function stopVidThink() {
    window.clearTimeout(vidThinkTimer);
    vidThinkTimer = 0;
  }

  /**
   * Paint one thinking row: done behind, mint on previous, on = current.
   */
  function paintVidThink(list, active) {
    [...list.children].forEach((row, i) => {
      row.classList.toggle("is-done", i < active);
      row.classList.toggle("is-mint", i === active - 1);
      row.classList.toggle("is-on", i === active);
    });
  }

  /**
   * App-style thinking list: linger on the screenshot pose, then cycle.
   */
  function bindVidThink() {
    const list = document.querySelector("[data-vid-think]");
    const stage = document.querySelector(".stage--video");
    if (!list || !stage || stage.hidden) {
      stopVidThink();
      return;
    }

    const last = list.children.length - 1;
    let active = 2;
    paintVidThink(list, active);
    stopVidThink();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dwell = [720, 820, 2400, 960, 1100];
    function tick() {
      if (stage.hidden) return;
      active = active >= last ? 0 : active + 1;
      paintVidThink(list, active);
      vidThinkTimer = window.setTimeout(tick, dwell[active] || 900);
    }
    vidThinkTimer = window.setTimeout(tick, dwell[active]);
  }

  /**
   * Open/close the overlay header burger on narrow viewports.
   */
  function bindSiteHead() {
    const head = document.querySelector(".site-head");
    const btn = head && head.querySelector("[data-head-burger]");
    const nav = head && head.querySelector(".stage-head__nav");
    if (!head || !btn || !nav) return;
    const close = () => {
      head.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", () => {
      const open = !head.classList.contains("is-open");
      head.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    document.addEventListener("click", (event) => {
      if (!head.contains(event.target)) close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) close();
    });
  }

  /**
   * Sandbox landing: stack every scene, skip lab tabs / bg picker.
   */
  function bindSitePage() {
    const pageId = document.body.dataset.page;
    if (!pageId) return;
    captureAttribution();
    bindSiteHead();
    paintFaqCopy(pageId);
    document.querySelectorAll(".stage--price, .stage--ozprice, .stage--wbprice").forEach((pane) => {
      const paint = () => layoutPriceStage(pane);
      requestAnimationFrame(() => requestAnimationFrame(paint));
      setTimeout(paint, 80);
    });
    requestAnimationFrame(() => drawSignupWires());
    setTimeout(() => drawSignupWires(), 80);
    requestAnimationFrame(() => requestAnimationFrame(() => drawAskWires()));
    setTimeout(() => drawAskWires(), 80);
    requestAnimationFrame(() => bindFaqTerm(true));
    requestAnimationFrame(() => requestAnimationFrame(() => drawFootWires()));
    requestAnimationFrame(() => {
      bindVideoPlayer();
      bindVidThink();
    });
  }

  bindSitePage();

})();
