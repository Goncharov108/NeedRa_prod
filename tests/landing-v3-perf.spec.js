import { test, expect } from "@playwright/test";

/** Собирает FPS / long-frames за durationMs через rAF в странице. */
async function sampleFrames(page, durationMs) {
  return page.evaluate(async (ms) => {
    return new Promise((resolve) => {
      const frames = [];
      let last = performance.now();
      const end = last + ms;

      function tick(now) {
        frames.push(now - last);
        last = now;
        if (now < end) {
          requestAnimationFrame(tick);
        } else {
          const long = frames.filter((d) => d > 24);
          const avg =
            frames.reduce((a, b) => a + b, 0) / Math.max(frames.length, 1);
          const fps = 1000 / avg;
          const p95 = [...frames].sort((a, b) => a - b)[
            Math.floor(frames.length * 0.95)
          ];
          resolve({
            frames: frames.length,
            avgMs: Math.round(avg * 10) / 10,
            p95Ms: Math.round((p95 || 0) * 10) / 10,
            fps: Math.round(fps * 10) / 10,
            longFrames: long.length,
            maxMs: Math.round(Math.max(...frames, 0) * 10) / 10,
          });
        }
      }

      requestAnimationFrame(tick);
    });
  }, durationMs);
}

/** Снимок «тяжёлых» факторов сцены. */
async function sceneHeavyStats(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll("#orbitField img")];
    const ambientOrbs = document.querySelectorAll(".lv3-ambient__orb").length;
    const gsapTweens =
      typeof gsap !== "undefined" ? gsap.globalTimeline.getChildren(true, true, false).length : -1;
    const stCount =
      typeof ScrollTrigger !== "undefined" ? ScrollTrigger.getAll().length : -1;

    let pngBytesApprox = 0;
    for (const img of imgs) {
      pngBytesApprox += (img.naturalWidth || 0) * (img.naturalHeight || 0) * 4;
    }

    return {
      pngCount: imgs.length,
      floatWraps: document.querySelectorAll(".orbit-float-wrap").length,
      ambientOrbs,
      gsapTweens,
      scrollTriggers: stCount,
      pngRawPixelsMB: Math.round((pngBytesApprox / (1024 * 1024)) * 10) / 10,
      sceneScrolling: document.documentElement.classList.contains("scene-scrolling"),
      sceneSettled: document.documentElement.classList.contains("scene-settled"),
      scrollY: Math.round(window.scrollY || 0),
    };
  });
}

test.describe("landing-v3 perf", () => {
  test("idle float + hero scrub + below scroll", async ({ page }) => {
    await page.goto("/landing-v3.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !document.documentElement.classList.contains("is-preloading"), {
      timeout: 60_000,
    });
    await page.waitForSelector("#orbitField img", { timeout: 60_000 });
    await page.waitForTimeout(1500);

    const heavy0 = await sceneHeavyStats(page);
    expect(heavy0.pngCount).toBeGreaterThan(40);
    expect(heavy0.scrollY).toBe(0);

    const idle = await sampleFrames(page, 2000);
    // Visual-first: канонный zero-g; headless idle часто низкий — ловим только провал.
    expect(idle.fps).toBeGreaterThan(5);

    const sceneH = await page.evaluate(() => document.getElementById("sceneScroll")?.offsetHeight || 2800);
    const scrubPromise = sampleFrames(page, 2500);
    await page.evaluate(async (h) => {
      const steps = 40;
      for (let i = 1; i <= steps; i++) {
        window.scrollTo(0, Math.round((h * 0.92 * i) / steps));
        await new Promise((r) => requestAnimationFrame(r));
      }
    }, sceneH);
    await scrubPromise;

    const belowPromise = sampleFrames(page, 2000);
    await page.evaluate(async () => {
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      const start = window.scrollY;
      const steps = 30;
      for (let i = 1; i <= steps; i++) {
        window.scrollTo(0, Math.round(start + ((max - start) * i) / steps));
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    await belowPromise;
  });
});
