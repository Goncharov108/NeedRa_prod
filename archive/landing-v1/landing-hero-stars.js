/**
 * Звёздное небо hero: статичный canvas (один draw, без rAF и мерцания).
 * Seed PRNG — стабильные позиции при resize и snapshot.
 * Силуэт дыры закрывает .bh-horizon под PNG (не «вырубка» в canvas —
 * иначе после birth остаётся чёрное пятно в freeze-snapshot).
 */

let starfieldPause = null;
let starfieldResume = null;

/** Рисует звёзды один раз — без анимации и drift. */
function initStarfield(canvas) {
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  let stars = [];
  let w = 0;
  let h = 0;
  let ready = false;

  /** Генерирует массив звёзд под размер canvas. */
  function buildStars() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;

    const nextW = Math.floor(rect.width * dpr);
    const nextH = Math.floor(rect.height * dpr);
    if (nextW === w && nextH === h && ready) return true;

    const rand = window.NeedRaHeroRng?.createHeroRng?.(20260715) ?? Math.random;

    w = nextW;
    h = nextH;
    canvas.width = w;
    canvas.height = h;

    const density = w < 600 * dpr ? 1500 : 1100;
    const count = Math.floor((w * h) / density);
    stars = Array.from({ length: count }, () => {
      const layer = rand();
      return {
        x: rand() * w,
        y: rand() * h,
        r:
          layer > 0.94
            ? 2.2 * dpr
            : layer > 0.82
              ? 1.4 * dpr
              : (0.5 + rand() * 1.2) * dpr,
        alpha: 0.55 + rand() * 0.45,
        tint: rand() < 0.08 ? "mint" : rand() < 0.06 ? "warm" : "white",
      };
    });
    ready = true;
    return true;
  }

  /** Статичный кадр звёздного поля (полное небо, без вырубки). */
  function draw() {
    if (!ready || !w || !h) return;

    const glowThreshold = 1.6 * (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      if (s.tint === "mint") {
        ctx.fillStyle = `rgba(93, 255, 200, ${s.alpha * 0.88})`;
      } else if (s.tint === "warm") {
        ctx.fillStyle = `rgba(255, 180, 120, ${s.alpha * 0.72})`;
      } else {
        ctx.fillStyle = `rgba(240, 245, 255, ${s.alpha})`;
      }
      ctx.fill();

      if (s.r > glowThreshold) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * 0.1})`;
        ctx.fill();
      }
    }
  }

  /** Пересобирает поле и синхронизирует snapshot после layout. */
  function rebuild() {
    if (!buildStars()) return;
    draw();
    if (!document.documentElement.classList.contains("is-preloading")) {
      window.NeedRaHeroBackdrop?.refreshCapture?.();
    }
  }

  starfieldPause = () => {};
  starfieldResume = () => {};

  rebuild();

  window.addEventListener("load", rebuild, { once: true });

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => rebuild());
    ro.observe(canvas.parentElement || canvas);
  } else {
    window.addEventListener("resize", rebuild, { passive: true });
  }

  return () => {};
}

window.NeedRaHeroStars = {
  initStarfield,
  pause: () => starfieldPause?.(),
  resume: () => starfieldResume?.(),
};
