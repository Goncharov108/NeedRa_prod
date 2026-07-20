/**
 * Интерактив секций ниже hero: relief, essence, onboard, pricing, signup, faq.
 */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Обновляет split relief по значению ползунка 0–100 (влево — хаос, вправо — порядок).
   * softFade: плавная прозрачность хаоса вместо порога 70%.
   */
  function setReliefSplit(value, { softFade = false } = {}) {
    const split = document.getElementById("reliefSplit");
    const lead = document.getElementById("reliefLead");
    const chaos = document.getElementById("reliefChaos");
    if (!split) return;

    const pct = Math.min(100, Math.max(0, Number(value)));
    const chaosPct = 100 - pct;
    split.style.setProperty("--relief-pct", `${chaosPct}%`);
    split.dataset.order = pct >= 70 ? "high" : "low";

    if (lead) lead.classList.toggle("is-highlight", pct >= 70);

    if (softFade) {
      // 50→100 на слайдере: opacity 1→0.35 (как бывший is-faded, без скачка)
      const t = Math.min(1, Math.max(0, (pct - 50) / 50));
      const chaosOpacity = 1 - t * 0.65;
      split.style.setProperty("--chaos-fade", String(chaosOpacity));
      if (chaos) chaos.classList.remove("is-faded");
    } else if (chaos) {
      chaos.classList.toggle("is-faded", pct >= 70);
    }
  }

  /** Ползунок хаос ↔ порядок в #relief. */
  function initRelief() {
    const slider = document.getElementById("reliefSlider");
    const split = document.getElementById("reliefSplit");
    if (!slider) return;

    const soft =
      document.body.classList.contains("landing-v3") && !prefersReduced;

    if (!soft) {
      const update = () => setReliefSplit(slider.value);
      slider.addEventListener("input", update);
      update();
      return;
    }

    const SETTLE_MS = 140;
    let dragging = false;
    let settleTimer = 0;

    /** Применяет pct к сплиту; duringDrag отключает CSS-transition. */
    const apply = (value, { duringDrag = false, settling = false } = {}) => {
      if (!split) {
        setReliefSplit(value, { softFade: true });
        return;
      }
      split.classList.toggle("is-dragging", duringDrag);
      split.classList.toggle("is-settling", settling && !duringDrag);
      split.classList.toggle("is-relief-busy", duringDrag || settling);
      setReliefSplit(value, { softFade: true });
    };

    const clearSettle = () => {
      if (settleTimer) {
        window.clearTimeout(settleTimer);
        settleTimer = 0;
      }
      split?.classList.remove("is-settling");
      if (!dragging) split?.classList.remove("is-relief-busy");
    };

    const beginDrag = () => {
      clearSettle();
      dragging = true;
      apply(slider.value, { duringDrag: true });
    };

    const onInput = () => {
      if (!dragging) beginDrag();
      apply(slider.value, { duringDrag: true });
    };

    /** После отпускания — короткий settle, затем снова обычный режим. */
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      apply(slider.value, { settling: true });
      settleTimer = window.setTimeout(() => {
        settleTimer = 0;
        split?.classList.remove("is-settling", "is-dragging", "is-relief-busy");
      }, SETTLE_MS);
    };

    slider.addEventListener("pointerdown", beginDrag);
    slider.addEventListener("input", onInput);
    slider.addEventListener("pointerup", endDrag);
    slider.addEventListener("pointercancel", endDrag);
    slider.addEventListener("change", endDrag);

    apply(slider.value);
  }

  /** Тап по ключевым словам в #essence. */
  function initEssence() {
    const card = document.getElementById("kwCard");
    const title = document.getElementById("kwCardTitle");
    const body = document.getElementById("kwCardBody");
    const buttons = document.querySelectorAll(".kw");
    if (!card || !buttons.length) return;

    const labels = {
      prompt: "промпт",
      agent: "агент",
      russian: "русский",
      api: "API WB",
      mask: "маска",
      excel: "Excel",
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const key = btn.dataset.kw || "";
        if (title) title.textContent = labels[key] || btn.textContent.trim();
        if (body) body.textContent = btn.dataset.tip || "";
        card.hidden = false;
      });
    });
  }

  /** Stepper и chips разделов WB в #onboard. */
  function initOnboard() {
    const stepBtns = document.querySelectorAll(".step-btn");
    const panels = document.querySelectorAll(".onboard-panel");
    const chips = document.querySelectorAll(".wb-chip");
    const flowRing = document.getElementById("flowRing");

    stepBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = btn.dataset.step;
        stepBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach((p) => {
          const show = p.dataset.panel === step;
          p.classList.toggle("is-active", show);
          p.hidden = !show;
        });
      });
    });

    const updateFlow = () => {
      const count = document.querySelectorAll(".wb-chip.is-on").length;
      if (flowRing) flowRing.classList.toggle("is-flowing", count >= 1);
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("is-on");
        updateFlow();
      });
    });
  }

  /** Toggle тарифов «Сейчас / Каждый день». */
  function initPricing() {
    const toggle = document.getElementById("pricingToggle");
    const free = document.getElementById("priceFree");
    const paid = document.getElementById("pricePaid");
    const labelNow = document.getElementById("pricingLabelNow");
    const labelDaily = document.getElementById("pricingLabelDaily");

    if (!toggle) return;

    const setMode = (daily) => {
      toggle.setAttribute("aria-checked", daily ? "true" : "false");
      toggle.classList.toggle("is-on", daily);
      if (free) free.classList.toggle("is-glow", !daily);
      if (paid) paid.classList.toggle("is-glow", daily);
      if (labelNow) labelNow.classList.toggle("is-muted", daily);
      if (labelDaily) labelDaily.classList.toggle("is-muted", !daily);
    };

    toggle.addEventListener("click", () => {
      const daily = toggle.getAttribute("aria-checked") !== "true";
      setMode(daily);
    });
  }

  /** Прогресс-звёзды и валидация формы #signup. */
  function initSignup() {
    const form = document.getElementById("signupForm");
    const email = document.getElementById("signupEmail");
    const api = document.getElementById("signupApi");
    const consent = document.getElementById("signupConsent");
    const phone = document.getElementById("signupPhone");
    const apiToggle = document.getElementById("apiToggle");
    const stars = document.querySelectorAll(".signup-star");

    if (!form) return;

    const fieldMap = { email, phone, api, consent };

    const updateStars = () => {
      stars.forEach((star) => {
        const key = star.dataset.field;
        const el = fieldMap[key];
        if (!el) return;
        const filled = el.type === "checkbox" ? el.checked : String(el.value || "").trim().length > 0;
        star.classList.toggle("is-lit", filled);
      });
    };

    [email, api, phone, consent].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", updateStars);
      el.addEventListener("change", updateStars);
    });
    updateStars();

    if (apiToggle && api) {
      apiToggle.addEventListener("click", () => {
        const show = api.type === "password";
        api.type = show ? "text" : "password";
        apiToggle.textContent = show ? "Скрыть" : "Показать";
        apiToggle.setAttribute("aria-label", show ? "Скрыть ключ" : "Показать ключ");
      });
    }

    form.addEventListener("submit", (e) => {
      const emailErr = document.getElementById("emailError");
      const apiErr = document.getElementById("apiError");
      let ok = true;

      if (emailErr) emailErr.textContent = "";
      if (apiErr) apiErr.textContent = "";

      if (email && !email.validity.valid) {
        ok = false;
        if (emailErr) emailErr.textContent = "Укажите корректный email";
      }
      if (api && !api.value.trim()) {
        ok = false;
        if (apiErr) apiErr.textContent = "Ключ API обязателен";
      }
      if (consent && !consent.checked) {
        ok = false;
        e.preventDefault();
        consent.focus();
        return;
      }
      if (!ok) e.preventDefault();
    });
  }

  /** FAQ: одна открытая позиция + поиск. */
  function initFaq() {
    const items = document.querySelectorAll(".faq-item");
    const search = document.getElementById("faqSearch");

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });

    if (!search) return;

    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      items.forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.classList.toggle("is-hidden", q.length > 0 && !text.includes(q));
      });
    });
  }

  /** Sticky CTA: скрыть у формы, иначе «Зарегистрироваться». */
  function initStickyCta() {
    const sticky = document.getElementById("stickyCta");
    const signup = document.getElementById("signup");
    if (!sticky || !signup || typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        sticky.classList.toggle("is-hidden", entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    obs.observe(signup);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initRelief();
    initEssence();
    initOnboard();
    initPricing();
    initSignup();
    initFaq();
    initStickyCta();
  });
})();
