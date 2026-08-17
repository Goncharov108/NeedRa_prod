/**
 * Hero: анимация «шум → фокус на чате» при загрузке и при скролле.
 */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Схлопывает декоративные элементы к центру (чат). */
function initNoiseAnimation() {
  const stage = document.getElementById("noiseStage");
  if (!stage || prefersReduced) return;

  const items = stage.querySelectorAll(".noise-item");
  const chat = stage.querySelector(".chat-focus");

  if (typeof gsap === "undefined") return;

  gsap.set(items, { opacity: 0.85, scale: 1 });
  gsap.set(chat, { scale: 0.92, opacity: 0.7 });

  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  tl.to(items, {
    duration: 1.2,
    opacity: 0,
    scale: 0.4,
    x: (i, el) => {
      const rect = el.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const cx = stageRect.width / 2;
      const ex = rect.left - stageRect.left + rect.width / 2;
      return cx - ex;
    },
    y: (i, el) => {
      const rect = el.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const cy = stageRect.height / 2;
      const ey = rect.top - stageRect.top + rect.height / 2;
      return cy - ey;
    },
    stagger: 0.06,
  }).to(
    chat,
    { duration: 0.5, scale: 1, opacity: 1 },
    "-=0.4"
  );

  tl.play();
}

/** Показывает sticky CTA после скролла мимо hero. */
function initStickyCta() {
  const sticky = document.querySelector(".sticky-cta");
  const hero = document.querySelector(".hero");
  if (!sticky || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      sticky.style.opacity = entry.isIntersecting ? "0" : "1";
      sticky.style.pointerEvents = entry.isIntersecting ? "none" : "auto";
    },
    { threshold: 0.1 }
  );

  observer.observe(hero);
}

initNoiseAnimation();
initStickyCta();
