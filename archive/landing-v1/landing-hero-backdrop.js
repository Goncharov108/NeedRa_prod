/**
 * Заморозка hero-backdrop на scroll-scrub: snapshot звёздного поля.
 * Дыра — статичный PNG (#blackholeArt), яркость через CSS filter.
 */

const HeroBackdrop = (() => {
  let starWrap = null;
  let starImg = null;
  let frozen = false;
  let starsCaptured = false;

  /** Возвращает img чёрной дыры в hero. */
  function getBlackholeImg() {
    return document.getElementById("blackholeArt");
  }

  /** Создаёт DOM-слой snapshot звёзд, если его ещё нет. */
  function ensureStarLayer() {
    const starfield = document.getElementById("starfield");
    if (!starfield) return false;

    if (!starWrap) {
      starWrap = document.createElement("div");
      starWrap.className = "hero-backdrop-freeze hero-backdrop-freeze--stars";
      starWrap.setAttribute("aria-hidden", "true");
      starImg = document.createElement("img");
      starImg.alt = "";
      starImg.decoding = "sync";
      starWrap.appendChild(starImg);
      starfield.appendChild(starWrap);
    }

    return true;
  }

  /** Снимает текущий кадр звёздного canvas в img. */
  function captureStars() {
    const starCanvas = document.getElementById("starCanvas");

    try {
      if (starCanvas?.width && starImg) {
        starImg.src = starCanvas.toDataURL("image/webp", 0.92);
        starsCaptured = Boolean(starImg.src);
      }
    } catch {
      starsCaptured = false;
    }
  }

  /** Показывает snapshot звёзд и скрывает live canvas. */
  function showSnapshotLayer() {
    if (!starsCaptured) return;
    document.documentElement.classList.add("hero-backdrop-live");
  }

  /** Обновляет snapshot звёзд после перерисовки canvas. */
  function refreshCapture() {
    if (!ensureStarLayer()) return;
    captureStars();
    showSnapshotLayer();
  }

  /** Заранее снимает snapshot после стабилизации layout. */
  function prepareCapture() {
    refreshCapture();
  }

  /** Scroll-scrub: фиксируем snapshot звёзд. */
  function freeze() {
    if (frozen) return;
    if (!starsCaptured) refreshCapture();
    frozen = true;
    document.documentElement.classList.add("hero-backdrop-frozen");
  }

  /** Подложка-горизонт под PNG (исчезает вместе с дырой). */
  function getHorizon() {
    return document.querySelector(".bh-horizon");
  }

  /** Обратный скролл к началу сцены. */
  function unfreeze() {
    if (!frozen) return;
    frozen = false;
    document.documentElement.classList.remove("hero-backdrop-frozen");
    const bh = getBlackholeImg();
    if (bh) bh.style.filter = "";
    const horizon = getHorizon();
    if (horizon) horizon.style.opacity = "";
  }

  /** Яркость PNG-дыры при scroll-scrub; горизонт гаснет синхронно. */
  function setBlackholeBrightness(intensity) {
    const bh = getBlackholeImg();
    const horizon = getHorizon();
    const clamped = Math.max(0.35, Math.min(1.35, intensity));
    if (bh) bh.style.filter = `brightness(${clamped})`;
    if (horizon) {
      // 1.0+ → полная подложка; к 0.35 → полностью прозрачна (с дырой)
      const fade = Math.max(0, Math.min(1, (clamped - 0.35) / 0.65));
      horizon.style.opacity = String(fade);
    }
  }

  return {
    prepareCapture,
    refreshCapture,
    freeze,
    unfreeze,
    setBlackholeBrightness,
    isFrozen: () => frozen,
  };
})();

window.NeedRaHeroBackdrop = HeroBackdrop;
