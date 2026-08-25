/**
 * Интерактив секций ниже hero: relief, essence, onboard, signup, faq.
 */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      api: "API WB",
      ozon: "API Ozon",
      match: "метчит",
      rag: "RAG",
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

  /** Секция тарифов без JS: подсветка карточек через CSS :hover. */

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

  /** Прогресс-звёзды, валидация и POST /auth/landing-register. */
  function initSignup() {
    const form = document.getElementById("signupForm");
    const email = document.getElementById("signupEmail");
    const password = document.getElementById("signupPassword");
    const passwordConfirm = document.getElementById("signupPasswordConfirm");
    const consent = document.getElementById("signupConsent");
    const statusEl = document.getElementById("signupStatus");
    const stars = document.querySelectorAll(".signup-star");
    const lkUrl = "https://lk.needra.ru";

    if (!form) return;

    const fieldMap = { email, password, consent };

    /** Снимает подсветку ошибок с полей пароля. */
    const clearPasswordInvalid = () => {
      password?.classList.remove("is-invalid");
      passwordConfirm?.classList.remove("is-invalid");
    };

    /** Подсвечивает звёзды заполненных полей. */
    const updateStars = () => {
      stars.forEach((star) => {
        const key = star.dataset.field;
        const el = fieldMap[key];
        if (!el) return;
        let filled = false;
        if (el.type === "checkbox") {
          filled = el.checked;
        } else if (key === "password") {
          filled =
            String(password?.value || "").length >= 8 &&
            password?.value === passwordConfirm?.value;
        } else if (key === "email") {
          filled = Boolean(email?.validity.valid && String(email.value || "").trim());
        } else {
          filled = String(el.value || "").trim().length > 0;
        }
        star.classList.toggle("is-lit", filled);
      });
    };

    /** Очищает тексты ошибок у полей формы. */
    const clearErrors = () => {
      ["emailError", "passwordError", "passwordConfirmError"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
      });
      clearPasswordInvalid();
      if (statusEl) {
        statusEl.hidden = true;
        statusEl.textContent = "";
        statusEl.classList.remove("is-ok", "is-error");
      }
    };

    /** Подсвечивает оба поля пароля при несовпадении. */
    const markPasswordMismatch = () => {
      password?.classList.add("is-invalid");
      passwordConfirm?.classList.add("is-invalid");
      const confirmErr = document.getElementById("passwordConfirmError");
      if (confirmErr) confirmErr.textContent = "Пароли не совпадают";
    };

    /** Клиентская проверка email / пароля / согласия до запроса. */
    const validate = () => {
      clearErrors();
      let ok = true;

      if (email && !email.validity.valid) {
        ok = false;
        const emailErr = document.getElementById("emailError");
        if (emailErr) emailErr.textContent = "Укажите корректный email";
      }
      if (password && password.value.length < 8) {
        ok = false;
        const passwordErr = document.getElementById("passwordError");
        if (passwordErr) passwordErr.textContent = "Пароль — минимум 8 символов";
      }
      if (password && passwordConfirm && password.value !== passwordConfirm.value) {
        ok = false;
        markPasswordMismatch();
      }
      if (consent && !consent.checked) {
        ok = false;
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.classList.add("is-error");
          statusEl.textContent = "Нужно согласие на обработку персональных данных";
        }
        consent.focus();
      }
      return ok;
    };

    /** Тело POST: только whitelist-поля landing-register. */
    const buildPayload = () => ({
      email: email?.value.trim() || "",
      password: password?.value || "",
      password_confirmation: passwordConfirm?.value || "",
      consent: Boolean(consent?.checked),
    });

    /** Отправляет регистрацию в ЛК (JSON, без cookies лендинга). */
    const submitToLk = async (payload) => {
      const endpoint = (form.dataset.lkEndpoint || "").trim();
      if (!endpoint) {
        return { ok: true, stub: true };
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = landingRegisterErrorMessage(data, res.status);
        const err = new Error(msg);
        err.code = data && data.code;
        err.existingUser = isExistingUserError(data, msg);
        err.passwordMismatch = data && data.code === "PASSWORD_MISMATCH";
        throw err;
      }
      return { ok: true, stub: false, data };
    };

    let signupStarted = false;
    const markSignupStart = () => {
      if (signupStarted) return;
      signupStarted = true;
      ymReach("signup_start");
    };

    [email, password, passwordConfirm, consent].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", updateStars);
      el.addEventListener("change", updateStars);
      el.addEventListener("focus", markSignupStart);
    });
    updateStars();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const submitBtn = form.querySelector(".signup-submit");
      if (submitBtn) submitBtn.disabled = true;

      try {
        ymReach("signup_submit");
        const result = await submitToLk(buildPayload());
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.classList.add("is-ok");
          statusEl.textContent = result.stub
            ? "Форма готова. API личного кабинета подключим позже — данные пока не уходят."
            : "Готово. Перенаправляем в личный кабинет…";
        }
        if (!result.stub) {
          ymReach("signup_success");
          const redirectUrl = result.data?.redirectUrl || result.data?.data?.redirectUrl;
          if (redirectUrl) {
            window.location.href = withAttribution(redirectUrl);
          } else {
            throw new Error("Нет redirectUrl в ответе");
          }
        }
      } catch (err) {
        if (err?.passwordMismatch) markPasswordMismatch();
        ymReach("signup_error", { existing: Boolean(err?.existingUser) });
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.classList.add("is-error");
          if (err?.existingUser) {
            statusEl.innerHTML =
              'Аккаунт уже есть — войдите в <a href="' + lkUrl + '">личный кабинет</a>';
          } else {
            statusEl.textContent = err?.message || "Не удалось отправить. Попробуйте ещё раз.";
          }
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
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

  /** Клики CTA и первый просмотр — цели Метрики для Директа. */
  function initAdsTracking() {
    captureAttribution();
    ymReach("landing_view");
    document.getElementById("stickyCta")?.addEventListener("click", () => {
      ymReach("cta_signup_click", { source: "sticky" });
    });
    document.querySelector("[data-od-id='header-cta']")?.addEventListener("click", () => {
      ymReach("login_click");
    });
    document.querySelector(".beat-dot[data-beat='signup']")?.addEventListener("click", () => {
      ymReach("cta_signup_click", { source: "nav" });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAdsTracking();
    initRelief();
    initEssence();
    initOnboard();
    initSignup();
    initFaq();
    initStickyCta();
  });
})();
