/**
 * Полный лендинг v3: hero v3.1 (спираль + zero-g) + beat-progress.
 */

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReduced = motionQuery.matches;
const PRELOADER_MIN_MS = prefersReduced ? 0 : 1000;
/** Длительность растворения preloader-шторки. */
const PRELOADER_FADE_MS = prefersReduced ? 0 : 1100;

// Иначе браузер восстанавливает scrollY → герой открывается на середине спирали («куча»).
try {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
} catch (_) {
  /* ignore */
}

let heroScrollProgress = 0;
let sceneIsScrolling = false;
let sceneIsSettled = false;
let lastBhBrightness = null;
/** Cleanup scroll-сцены / zero-G (для live reduced-motion). */
let disposeHeroMotion = null;

/** Синхронизирует backdrop с прогрессом scroll-сцены. */
function syncHeroCanvasPlayback(progress = heroScrollProgress) {
  heroScrollProgress = progress;

  if (prefersReduced) return;

  const inScrub = progress > 0.02 && progress < 0.98;

  if (inScrub) {
    window.NeedRaHeroBackdrop?.freeze?.();
    return;
  }

  window.NeedRaHeroBackdrop?.unfreeze?.();
  lastBhBrightness = null;
}

/** Обновляет CSS-классы сцены только при смене состояния. */
function updateSceneClasses(progress) {
  const scrolling = progress > 0.02 && progress < 0.98;
  const settled = progress >= 0.98;

  if (scrolling !== sceneIsScrolling) {
    sceneIsScrolling = scrolling;
    document.documentElement.classList.toggle("scene-scrolling", scrolling);
  }

  if (settled !== sceneIsSettled) {
    sceneIsSettled = settled;
    document.documentElement.classList.toggle("scene-settled", settled);
  }
}

/** Яркость дыры на snapshot — только при изменении значения. */
function updateBlackholeBrightness(intensity) {
  const rounded = Math.round(intensity * 100) / 100;
  if (rounded === lastBhBrightness) return;
  lastBhBrightness = rounded;
  window.NeedRaHeroBackdrop?.setBlackholeBrightness?.(rounded);
}

/** Ширина финального поля ввода в hero. */
function getChatComposeFullWidth() {
  return Math.min(window.innerWidth * 0.92, 440);
}

/** DOM-узлы поэтапной сборки chat-input. */
function getChatBirthNodes(chat) {
  if (!chat) return {};
  return {
    compose: chat.querySelector(".chat-compose"),
    fill: chat.querySelector(".chat-compose-fill"),
    frame: chat.querySelector(".chat-frame"),
    logo: chat.querySelector(".chat-compose-logo"),
    frameRect: chat.querySelector(".chat-frame-rect"),
    label: chat.querySelector(".chat-compose-label"),
  };
}

/** Финальное состояние chat-input (fallback / reduced motion). */
function setChatBirthFinal(chat) {
  const { compose, fill, frame, logo, frameRect, label } = getChatBirthNodes(chat);
  const fullW = getChatComposeFullWidth();

  gsap?.set?.(chat, { xPercent: -50, yPercent: -50, scale: 1, autoAlpha: 1 });
  gsap?.set?.(compose, { width: fullW });
  gsap?.set?.(fill, { opacity: 1 });
  gsap?.set?.(frame, { opacity: 1 });
  gsap?.set?.(logo, { left: 18, xPercent: 0, yPercent: -50, scale: 1, opacity: 1 });
  gsap?.set?.(frameRect, {
    strokeDasharray: 1,
    strokeDashoffset: 0,
    opacity: 1,
    strokeOpacity: 1,
    stroke: "#5dffc8",
  });
  gsap?.set?.(label, { autoAlpha: 1 });
}

/** Показывает статичный hero без scroll-анимации (fallback). */
function showStaticHero() {
  const chat = document.getElementById("chatSingularity");
  const field = document.getElementById("orbitField");
  const hub = document.getElementById("singularityHub");

  if (field) field.style.display = "none";
  if (hub) {
    if (typeof gsap !== "undefined") gsap.set(hub, { autoAlpha: 0, scale: 0, filter: 0 });
    else hub.style.opacity = "0";
  }
  if (chat) {
    chat.classList.add("is-live", "is-filled");
    setChatBirthFinal(chat);
    if (typeof gsap === "undefined") chat.style.opacity = "1";
  }
}

/**
 * Живое переключение prefers-reduced-motion:
 * reduce → статичный hero; снятие reduce → reload (чистая сборка сцены без дублей карточек).
 */
function applyReducedMotionMode() {
  prefersReduced = true;

  if (typeof disposeHeroMotion === "function") {
    disposeHeroMotion();
    disposeHeroMotion = null;
  }

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.getAll().forEach((st) => st.kill());
  }

  document.documentElement.classList.remove(
    "scene-enhanced",
    "scene-scrolling",
    "scene-settled"
  );
  sceneIsScrolling = false;
  sceneIsSettled = false;

  showStaticHero();
  window.NeedRaHeroBackdrop?.freeze?.();
}

/** Обработчик смены системной настройки движения. */
function onMotionPreferenceChange(event) {
  if (event.matches) {
    applyReducedMotionMode();
    return;
  }
  window.location.reload();
}

/** Подписывается на live-смену prefers-reduced-motion. */
function watchMotionPreference() {
  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", onMotionPreferenceChange);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(onMotionPreferenceChange);
  }
}

/** Создаёт PNG-карточки на hero-поле (v3.1). */
function buildOrbitChips(field) {
  if (window.NeedRaHeroV31Widgets?.buildOrbitWidgets) {
    return window.NeedRaHeroV31Widgets.buildOrbitWidgets(field);
  }
  return [];
}

/** Предвычисляет захват карточек: орбитальный разгон → гравитация в дыру. */
function computeSpiralCollapse(arms, container, focalX = 0.5, focalY = 0.42) {
  // NodeList из querySelectorAll — без Array.from нет .map
  const list = Array.from(arms || []);
  if (!container || !list.length) return new Map();

  const box = container.getBoundingClientRect();
  const fx = box.width * focalX;
  const fy = box.height * focalY;
  const map = new Map();
  const dists = list.map((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left - box.left + r.width / 2;
    const cy = r.top - box.top + r.height / 2;
    return Math.hypot(fx - cx, fy - cy) || 1;
  });
  const distMin = Math.min(...dists);
  const distMax = Math.max(...dists);
  const distSpan = Math.max(distMax - distMin, 1);

  list.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const cx = r.left - box.left + r.width / 2;
    const cy = r.top - box.top + r.height / 2;
    const dist = Math.hypot(fx - cx, fy - cy) || 1;
    const baseAngle = Math.atan2(fy - cy, fx - cx);
    const arm = el.parentElement;
    const slotRot = parseFloat(arm?.style.getPropertyValue("--slot-rot")) || 0;
    const distNorm = (dist - distMin) / distSpan;
    // Дальние чуть дольше на орбите, ближние быстрее срывает.
    const orbitEnd = 0.16 + distNorm * 0.1 + (i % 4) * 0.012;

    map.set(el, {
      dist,
      cx,
      cy,
      fx,
      fy,
      baseAngle,
      baseRot: slotRot,
      orbitEnd,
      orbitTurns: 0.22 + (i % 5) * 0.035 + distNorm * 0.08,
      captureTurns: 0.62 + (i % 6) * 0.07,
      spinOrbit: 10 + (i % 4) * 3,
      spinCapture: 48 + (i % 5) * 10,
      // Выше старт — на орбите читаемы; растворение только у дыры.
      startAlpha: 0.94 + (i % 5) * 0.012,
    });
  });

  return map;
}

/** Плавная кривая 0→1 без рывков на старте и финише. */
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/** Кривая захвата: читаемое начало + ускорение к центру. */
function gravityPull(u) {
  const c = Math.max(0, Math.min(1, u));
  return smoothstep(Math.pow(c, 0.74));
}

/**
 * Прозрачность от оставшегося радиуса: далеко почти непрозрачны,
 * ближе к дыре — резко растворяются.
 */
function alphaFromRadius(radMul, startAlpha) {
  const r = Math.max(0, Math.min(1.05, radMul));
  const hold = 0.58; // до ~42% пути к центру почти не тускнеют
  let visibility;

  if (r >= hold) {
    visibility = 0.9 + 0.1 * ((r - hold) / Math.max(1.05 - hold, 0.001));
  } else {
    const u = r / hold;
    visibility = 0.9 * Math.pow(u, 1.55);
  }

  return startAlpha * Math.max(0.02, visibility);
}

/**
 * Поза карточки на прогрессе t (0 — старт, 1 — центр дыры).
 * Фаза 1: короткий разгон по дуге; фаза 2: гравитационный срыв внутрь.
 */
function collapseAt(meta, t) {
  const p = Math.max(0, Math.min(1, t));
  const orbitEnd = meta.orbitEnd;
  let orbitU = 0;
  let captureU = 0;

  if (p <= orbitEnd) {
    orbitU = p / orbitEnd;
  } else {
    orbitU = 1;
    captureU = (p - orbitEnd) / (1 - orbitEnd);
  }

  const orbitEase = smoothstep(orbitU);
  // Чуть «наружу» на разгоне, затем подтягивание — срыв с орбиты.
  const orbitRadMul = 1 + 0.05 * Math.sin(orbitEase * Math.PI) - 0.07 * orbitEase;
  const pull = gravityPull(captureU);
  const radMul = captureU <= 0 ? orbitRadMul : orbitRadMul * (1 - pull);
  const radius = meta.dist * Math.max(0.001, radMul);

  const wind =
    meta.orbitTurns * Math.PI * 2 * orbitEase + meta.captureTurns * Math.PI * 2 * pull;
  const angle = meta.baseAngle + wind;
  const px = meta.fx - radius * Math.cos(angle);
  const py = meta.fy - radius * Math.sin(angle);

  const scale = 1 - 0.05 * orbitEase - 0.9 * Math.pow(pull, 1.15);
  const alpha = alphaFromRadius(radMul, meta.startAlpha);
  const rotation = meta.baseRot + meta.spinOrbit * orbitEase + meta.spinCapture * pull;

  return {
    x: px - meta.cx,
    y: py - meta.cy,
    rotation,
    scale,
    alpha,
  };
}

/** Добавляет непрерывный tween захвата без keyframe-изломов (scrub-friendly). */
function addSmoothSpiralTween(tl, el, meta, position) {
  const proxy = { t: 0 };

  tl.to(
    proxy,
    {
      t: 1,
      duration: 0.42,
      // Линейный t: драма в collapseAt; scrub предсказуемый.
      ease: "none",
      onUpdate: () => {
        const s = collapseAt(meta, proxy.t);
        gsap.set(el, {
          x: s.x,
          y: s.y,
          rotation: s.rotation,
          scale: Math.max(0.05, s.scale),
          autoAlpha: s.alpha,
          force3D: true,
        });
      },
    },
    position
  );
}

/** Debounce для ScrollTrigger.refresh при resize. */
function debounce(fn, ms = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Еле заметное покачивание карточек в невесомости (GSAP, канон v3.1). */
function initZeroGFloat(arms) {
  const tweens = [];

  arms.forEach((anim, i) => {
    const wrap = anim.querySelector(".orbit-float-wrap");
    if (!wrap) return;

    const sign = i % 2 === 0 ? 1 : -1;
    const ampX = (2.2 + (i % 5) * 0.5) * 2;
    const ampY = (2.8 + (i % 4) * 0.55) * 2;
    const ampR = 3 + (i % 4) * 0.33;
    const ampScale = 0.03 + (i % 4) * 0.012;

    gsap.set(wrap, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1 - ampScale,
      force3D: true,
    });

    tweens.push(
      gsap.to(wrap, {
        x: sign * ampX,
        y: sign * -ampY,
        rotation: sign * ampR,
        scale: 1 + ampScale,
        duration: 4.2 + (i % 6) * 0.85,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: (i % 9) * 0.35,
      })
    );
  });

  return tweens;
}

/** Пин + scrub: виджеты всасываются в дыру, чат вспыхивает mint. */
function initSingularityScene() {
  const scrollRoot = document.getElementById("sceneScroll");
  const stage = document.getElementById("singularityStage");
  const field = document.getElementById("orbitField");
  const hub = document.getElementById("singularityHub");
  const chat = document.getElementById("chatSingularity");
  const voidBg = stage?.querySelector(".void-bg");
  const {
    compose: chatCompose,
    fill: chatFill,
    frame: chatFrame,
    logo: chatLogo,
    frameRect: chatFrameRect,
    label: chatLabel,
  } = getChatBirthNodes(chat);

  if (!scrollRoot || !stage || !field) {
    showStaticHero();
    return null;
  }

  const arms = buildOrbitChips(field);

  if (prefersReduced) {
    showStaticHero();
    return null;
  }

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    showStaticHero();
    return null;
  }

  document.documentElement.classList.add("scene-enhanced");
  gsap.registerPlugin(ScrollTrigger);

  const focalContainer = field || stage;
  let spiralCollapse = computeSpiralCollapse(arms, focalContainer);

  arms.forEach((el, i) => {
    const arm = el.parentElement;
    const slotRot = arm?.style.getPropertyValue("--slot-rot") || "0deg";
    gsap.set(el, {
      autoAlpha: 0.94 + (i % 5) * 0.012,
      scale: 1,
      rotation: parseFloat(slotRot) || 0,
      x: 0,
      y: 0,
      force3D: true,
    });
  });

  const zeroGTweens = initZeroGFloat(arms);

  gsap.set(chat, {
    xPercent: -50,
    yPercent: -50,
    autoAlpha: 0,
    scale: 1,
    force3D: true,
  });
  if (chatCompose) gsap.set(chatCompose, { width: 52 });
  if (chatFill) gsap.set(chatFill, { opacity: 0 });
  if (chatLogo) {
    gsap.set(chatLogo, {
      left: "50%",
      top: "50%",
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 1,
    });
  }
  if (chatFrame) gsap.set(chatFrame, { opacity: 0 });
  if (chatFrameRect) {
    gsap.set(chatFrameRect, {
      strokeDasharray: 1,
      strokeDashoffset: 1,
      opacity: 0,
      strokeOpacity: 0,
      stroke: "rgba(255, 255, 255, 0.14)",
    });
  }
  if (chatLabel) gsap.set(chatLabel, { autoAlpha: 0 });
  gsap.set(hub, { scale: 1, autoAlpha: 1, rotation: 0, force3D: true });
  gsap.set(voidBg, { opacity: 0.32 });

  const blackholeArt = hub?.querySelector(".bh-art");

  const refreshOffsets = () => {
    spiralCollapse = computeSpiralCollapse(arms, focalContainer);
  };

  ScrollTrigger.addEventListener("refreshInit", refreshOffsets);

  const spiralSpread = 0.12;
  const spiralDuration = 0.42;
  // Захват back-loaded: «почти исчезла» чуть позже равномерной спирали.
  const cardAlmostGoneT = 0.64;
  const lastCardStart = spiralSpread;
  const birth = lastCardStart + spiralDuration * cardAlmostGoneT;

  // Рост рамки — как раньше; лого в центре до ~92% ширины, потом уезд; текст строго после приезда.
  const composeWidthAt = birth + 0.05;
  const composeWidthDur = 0.14;
  const logoMoveAt = composeWidthAt + composeWidthDur * 0.92;
  const logoMoveDur = 0.12;
  const birthLabelAt = logoMoveAt + logoMoveDur;
  const birthFillAt = birthLabelAt + 0.02;

  const tl = gsap.timeline({
    defaults: { force3D: true },
    scrollTrigger: {
      trigger: scrollRoot,
      start: "top top",
      end: "bottom bottom",
      // Упругий scrub на границе пина; классы/freeze стабильны (без «стены» при реверсе)
      scrub: 0.45,
      pin: ".scene-pin",
      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: false,
      onUpdate: (self) => {
        const p = self.progress;

        // После старта скролла не снимаем scene-scrolling / freeze / float на unpin
        const classP = p > 0.02 ? 0.5 : p;
        updateSceneClasses(classP);
        syncHeroCanvasPlayback(classP);

        const allowFloat = p <= 0.02;
        zeroGTweens.forEach((tween) => (allowFloat ? tween.play() : tween.pause()));

        if (p > 0.1 && p < birth) {
          updateBlackholeBrightness(1 + (p - 0.1) * 0.55);
        } else if (p >= birth && p < birth + 0.34) {
          updateBlackholeBrightness(1.2 - (p - birth) * 2.4);
        }

        chat?.classList.toggle("is-live", p >= birthLabelAt);
        chat?.classList.toggle("is-filled", p >= 0.96);
      },
    },
  });

  tl.to(blackholeArt, { scale: 1.1, duration: 0.38, ease: "sine.inOut" }, 0.08)
    .to(voidBg, { opacity: 0.88, duration: 0.22, ease: "sine.inOut" }, 0.1);

  const armsByDistance = [...arms].sort(
    (a, b) => (spiralCollapse.get(a)?.dist ?? 0) - (spiralCollapse.get(b)?.dist ?? 0)
  );

  armsByDistance.forEach((el, i) => {
    const meta = spiralCollapse.get(el);
    if (!meta) return;

    // С нуля: иначе первые % скролла «пустые», кажется что анимация запаздывает
    const startAt = (i / Math.max(armsByDistance.length - 1, 1)) * spiralSpread;
    addSmoothSpiralTween(tl, el, meta, startAt);
  });

  // Рождение чата — старт как раньше; финал слоёв в одной точке (visualDone ≈ конец пина).
  // Горизонт под PNG гаснет через setBlackholeBrightness (синхронно с PNG), hub — autoAlpha.
  tl.to(hub, { scale: 0, autoAlpha: 0, filter: 18, duration: 0.22, ease: "power2.inOut" }, birth)
    .to(chat, { autoAlpha: 1, duration: 0.2, ease: "power2.out" }, birth)
    .to(chatLogo, { scale: 1, duration: 0.16, ease: "power2.out" }, birth + 0.02)
    .to(chatFrame, { opacity: 1, duration: 0.18, ease: "power2.out" }, birth + 0.04)
    .to(
      chatFrameRect,
      {
        opacity: 1,
        strokeOpacity: 1,
        strokeDashoffset: 0,
        stroke: "#5dffc8",
        duration: 0.18,
        ease: "power2.out",
      },
      birth + 0.04
    )
    .to(
      chatCompose,
      { width: () => getChatComposeFullWidth(), duration: composeWidthDur, ease: "power2.inOut" },
      composeWidthAt
    )
    // Лого остаётся в центре (left 50% / xPercent -50) пока рамка почти не развернётся
    .to(
      chatLogo,
      { left: 18, xPercent: 0, duration: logoMoveDur, ease: "power2.inOut" },
      logoMoveAt
    )
    // Текст только после прихода логотипа (иначе NeedRa наезжает на иконку)
    .to(chatLabel, { autoAlpha: 1, duration: 0.16, ease: "sine.out" }, birthLabelAt)
    .to(chatFill, { opacity: 1, duration: 0.14, ease: "power2.out" }, birthFillAt)
    .to(voidBg, { opacity: 1, duration: 0.18, ease: "sine.inOut" }, birth + 0.04);

  const debouncedRefresh = debounce(() => ScrollTrigger.refresh(), 200);
  window.addEventListener("resize", debouncedRefresh, { passive: true });

  const onLoadRefresh = () => {
    refreshOffsets();
    ScrollTrigger.refresh();
  };
  window.addEventListener("load", onLoadRefresh, { once: true });

  /** Снимает pin/scrub/zero-G этой сцены (для live reduced-motion). */
  return () => {
    window.removeEventListener("resize", debouncedRefresh);
    window.removeEventListener("load", onLoadRefresh);
    ScrollTrigger.removeEventListener("refreshInit", refreshOffsets);
    zeroGTweens.forEach((tween) => tween.kill());
    tl.scrollTrigger?.kill();
    tl.kill();
  };
}

/** Подсвечивает активную точку прогресса по секциям ниже hero. */
function initBeatProgress() {
  const dots = document.querySelectorAll(".beat-dot");
  const sections = ["top", "essence", "relief", "pricing", "signup", "faq"];

  if (!dots.length || typeof ScrollTrigger === "undefined") return;

  sections.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el || !dots[i]) return;

    ScrollTrigger.create({
      trigger: el,
      start: "top 55%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (self.isActive) {
          dots.forEach((d) => d.classList.remove("is-active"));
          dots[i].classList.add("is-active");
        }
      },
    });
  });
}

/** Инициализирует hero canvas, scroll-сцену и beat-progress. */
function initHeroApp() {
  const starCanvas = document.getElementById("starCanvas");

  if (window.NeedRaHeroStars?.initStarfield) {
    window.NeedRaHeroStars.initStarfield(starCanvas);
  }

  disposeHeroMotion = initSingularityScene();

  if (!prefersReduced && typeof ScrollTrigger !== "undefined") {
    initBeatProgress();
  }

  watchMotionPreference();
}

/** Ждёт ms миллисекунд. */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Ждёт load картинки для шторки. Без img.decode() — на 47 PNG он может зависнуть навсегда. */
function whenImageReady(img) {
  if (!img) return Promise.resolve();

  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    // Уже успела загрузиться между check и listener
    if (img.complete) done();
  });
}

/**
 * Ждёт PNG-карточки hero + blackhole, чтобы сцена не «догружалась» на глазах.
 * Таймаут — страховка, если сеть зависла.
 */
async function waitForHeroAssets({ timeoutMs = 20000 } = {}) {
  const imgs = [
    ...document.querySelectorAll("#orbitField img"),
    document.getElementById("blackholeArt"),
  ].filter(Boolean);

  if (!imgs.length) return;

  // Ждём загрузку картинок под шторкой (чтобы карточки не вспыхнули).
  await Promise.race([Promise.all(imgs.map(whenImageReady)), wait(timeoutMs)]);
  // Даунскейл — в фоне: иначе 47× createImageBitmap может навсегда зависнуть на шторке.
  void downscaleHeroCardBitmaps().catch(() => {});
}

/**
 * Даунскейл PNG до ~2× display width — иначе ~1.5k px при показе ~160 px (~220MB RGBA).
 */
async function downscaleHeroCardBitmaps(maxCssWidth = 420) {
  const imgs = [...document.querySelectorAll("#orbitField img.ow-card-img")];
  if (!imgs.length) return;

  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete || img.naturalWidth <= maxCssWidth) return;

      try {
        const scale = maxCssWidth / img.naturalWidth;
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const bmp = await createImageBitmap(img, {
          resizeWidth: w,
          resizeHeight: h,
          resizeQuality: "high",
        });
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(bmp, 0, 0);
        bmp.close();
        const blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/webp", 0.82)
        );
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const prev = img.src;
        img.src = url;
        img.width = w;
        img.height = h;
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      } catch {
        /* оставляем оригинал */
      }
    })
  );
}

/** Скрывает preloader: сайт уже под шторкой; is-preloading держим до конца fade. */
async function finishPreloader() {
  const preloader = document.getElementById("preloader");
  const html = document.documentElement;

  if (!preloader) {
    html.classList.remove("is-preloading");
    html.classList.add("is-revealed");
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    return;
  }

  preloader.setAttribute("aria-hidden", "true");
  // Не снимаем is-preloading до конца: иначе mid-fade стартуют звёзды/snapshot → вспышка.
  html.classList.add("is-reveal-ready");

  const duration = PRELOADER_FADE_MS / 1000;
  const canTween = !prefersReduced && typeof gsap !== "undefined" && duration > 0;

  if (canTween) {
    gsap.set(preloader, { opacity: 1, visibility: "visible" });
    await new Promise((resolve) => {
      gsap.to(preloader, {
        opacity: 0,
        duration,
        ease: "sine.inOut",
        onComplete: resolve,
      });
    });
  } else if (PRELOADER_FADE_MS > 0) {
    await wait(PRELOADER_FADE_MS);
  }

  preloader.remove();
  html.classList.remove("is-preloading");
  html.classList.remove("is-reveal-ready");
  html.classList.add("is-revealed");

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
}

/**
 * Сбрасывает scroll в начало hero.
 * Важно: при html.is-preloading body { overflow:hidden } обычный scrollTo не двигает Y.
 */
function forceHeroScrollTop() {
  const html = document.documentElement;
  const body = document.body;

  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  } catch (_) {
    /* ignore */
  }

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.clearScrollMemory?.("manual");
  }

  html.classList.add("force-scroll-top");
  html.style.scrollBehavior = "auto";
  body.style.setProperty("overflow", "auto", "important");

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  html.scrollTop = 0;
  body.scrollTop = 0;
  if (typeof window.scroll === "function") window.scroll(0, 0);

  body.style.removeProperty("overflow");
  html.style.removeProperty("scroll-behavior");
  html.classList.remove("force-scroll-top");

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
}

/** Preloader: шрифты + все ассеты hero, затем мягкий fade-in. */
async function runWithPreloader() {
  document.documentElement.classList.add("is-preloading");
  const startedAt = performance.now();

  try {
    forceHeroScrollTop();
    initHeroApp();

    const fontsReady = document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve();
    await Promise.all([fontsReady, waitForHeroAssets()]);

    const elapsed = performance.now() - startedAt;
    if (elapsed < PRELOADER_MIN_MS) {
      await wait(PRELOADER_MIN_MS - elapsed);
    }

    forceHeroScrollTop();
    // Snapshot звёзд под непрозрачной шторкой — иначе смена canvas→freeze вспыхнет после входа.
    window.NeedRaHeroBackdrop?.prepareCapture?.();
  } catch (err) {
    console.error("[NeedRa hero init]", err);
  }

  await finishPreloader();
}

document.addEventListener("DOMContentLoaded", () => {
  runWithPreloader();
});
