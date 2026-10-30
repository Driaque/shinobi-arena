import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, PORT: "4198" },
  stdio: ["ignore", "pipe", "inherit"],
});
let browser;
const url = "http://127.0.0.1:4198/visual-lab.html";
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    server.once("exit", (c) => reject(Error("Server exit " + c)));
  });
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
    ],
  });
  await mkdir("test-results", { recursive: true });
  const errors = [],
    requests = [];
  async function open(mobile = false, reducedMotion = "no-preference") {
    const context = await browser.newContext({
        viewport: mobile
          ? { width: 844, height: 390 }
          : { width: 1440, height: 960 },
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion,
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => {errors.push(e.message);console.error("PAGE ERROR",e.message);});
    page.on("request", (r) => requests.push(r.url()));
    return { context, page };
  }
  const ready = (p) =>
    p.waitForFunction(
      () => document.querySelector("#lab-stage").dataset.ready === "true",
      { timeout: 30000 },
    );
  for (const mobile of [false, true]) {
    const { context, page: p } = await open(mobile);
    await p.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
    await p.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
    await p.goto(url);
    await ready(p);
    await p.clock.runFor(1500);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-renderer"),
      "pixi",
    );
    assert.equal(await p.locator("#lab-stage").getAttribute("data-hits"), "5");
    await p.screenshot({
      path:
        "test-results/visual-lab-combo-" +
        (mobile ? "mobile" : "desktop") +
        ".png",
    });
    await p.clock.runFor(1300);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-awake"),
      "true",
    );
    await p.click("#lab-pause");
    await p.clock.runFor(200);
    const tick = await p.locator("#lab-stage").getAttribute("data-tick");
    await p.selectOption("#lab-renderer", "canvas");
    await p.clock.runFor(200);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-tick"),
      tick,
      "renderer switch preserves paused simulation",
    );
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-renderer"),
      "canvas",
    );
    await p.screenshot({
      path:
        "test-results/visual-lab-canvas-" +
        (mobile ? "mobile" : "desktop") +
        ".png",
    });
    await p.selectOption("#lab-renderer", "pixi");
    await p.selectOption("#lab-mode", "manual");
    await p.click("#lab-reset");
    await p.click("#lab-pause");
    await p.locator("#lab-stage").focus();
    if (!mobile) {
      await p.keyboard.down("KeyA");
      await p.clock.runFor(250);
      await p.keyboard.up("KeyA");
      await p.clock.runFor(32);
      assert.ok(
        Number(await p.locator("#lab-stage").getAttribute("data-x")) < 570,
      );
      await p.keyboard.down("KeyW");
      await p.clock.runFor(40);
      await p.keyboard.up("KeyW");
      await p.clock.runFor(32);
      await p.keyboard.down("KeyW");
      await p.clock.runFor(40);
      await p.keyboard.up("KeyW");
      assert.equal(
        await p.locator("#lab-stage").getAttribute("data-jumps"),
        "2",
      );
      await p.keyboard.down("KeyE");
      await p.clock.runFor(40);
      await p.keyboard.up("KeyE");
      assert.equal(
        await p.locator("#lab-stage").getAttribute("data-dash"),
        "true",
      );
      await p.screenshot({ path: "test-results/visual-lab-airdash.png" });
    } else {
      const stick = await p.locator("#lab-stick").boundingBox();
      await p.mouse.move(stick.x + stick.width / 2, stick.y + stick.height / 2);
      await p.mouse.down();
      await p.mouse.move(stick.x + 8, stick.y + stick.height / 2);
      await p.clock.runFor(220);
      await p.mouse.up();
      assert.ok(
        Number(await p.locator("#lab-stage").getAttribute("data-x")) < 580,
      );
      await p.locator("[data-lab-action=jump]").tap();
      await p.clock.runFor(40);
      assert.ok(
        Number(await p.locator("#lab-stage").getAttribute("data-y")) > 0,
      );
      const battle = await p.locator("#lab-stage").boundingBox();
      for (const b of await p.locator("[data-lab-action]").all()) {
        const rect = await b.boundingBox();
        assert.ok(rect.height >= 44);
        assert.ok(
          rect.y >= battle.y + battle.height,
          "controls stay below the battlefield",
        );
      }
      await p.screenshot({ path: "test-results/visual-lab-touch.png" });
    }
    await p.click("#lab-reset");
    await p.locator("#lab-stage").focus();
    await p.keyboard.down("KeyS");
    await p.keyboard.down("KeyH");
    await p.clock.runFor(60);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-crouching"),
      "true",
    );
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-blocking"),
      "true",
    );
    await p.evaluate(() => window.dispatchEvent(new Event("blur")));
    await p.keyboard.up("KeyS");
    await p.keyboard.up("KeyH");
    await p.clock.runFor(60);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-blocking"),
      "false",
    );
    await p.locator("#lab-details summary").click();
    await p.selectOption("#lab-resolution", "1");
    await ready(p);
    await p.clock.runFor(40);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-renderer"),
      "pixi",
    );
    await p.selectOption("#lab-resolution", "2");
    await ready(p);
    await p.clock.runFor(40);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-renderer"),
      "pixi",
    );
    assert.equal(
      await p.locator("body").evaluate((e) => e.scrollWidth <= innerWidth),
      true,
    );
    await p.evaluate(() =>
      document
        .querySelector("#lab-pixi")
        .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
    await p.clock.runFor(40);
    assert.equal(
      await p.locator("#lab-stage").getAttribute("data-renderer"),
      "canvas",
    );
    assert.equal(await p.locator("#lab-compare").isDisabled(), true);
    assert.match(await p.locator("#lab-loading").innerText(), /context lost/);
    await context.close();
  }
  const { context: benchContext, page: bench } = await open();
  await bench.goto(url);
  await ready(bench);
  await bench.click("#lab-compare");
  await bench.waitForFunction(
    () => document.querySelectorAll("#lab-results tr").length === 2,
    null,
    { timeout: 60000 },
  );
  const rows = await bench.locator("#lab-results tr").allTextContents();
  assert.match(rows[0], /Canvas 2D/);
  assert.match(rows[1], /PixiJS/);
  assert.match(rows.join(" "), /ms/);
  const download = bench.waitForEvent("download");
  await bench.click("#lab-export");
  const file = await download;
  await file.saveAs("test-results/visual-lab-measurements.json");
  const report = JSON.parse(
    await readFile("test-results/visual-lab-measurements.json", "utf8"),
  );
  assert.equal(report.results.length, 2);
  for (const r of report.results) {
    assert.equal(r.ticks, 300);
    // Software WebGL can render few frames while the fixed-step simulation completes.
    // Validate samples and timings without imposing an accidental minimum FPS.
    assert.ok(r.samples > 1);
    assert.ok(r.frameP95 > 0 && r.cpuRenderP95 >= 0);
    assert.ok(Number.isFinite(r.frameP95) && Number.isFinite(r.cpuRenderP95));
  }
  await bench.screenshot({ path: "test-results/visual-lab-benchmark.png" });
  await benchContext.close();
  const { context: fallback, page: f } = await open(true, "reduce");
  await f.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return original.call(this, type, ...args);
    };
    try {
      Object.defineProperty(navigator, "gpu", { value: undefined });
    } catch {}
  });
  await f.goto(url);
  await ready(f);
  await f.waitForFunction(
    () => document.querySelector("#lab-stage").dataset.renderer === "canvas",
  );
  assert.equal(
    await f.locator("#lab-renderer option[value=pixi]").isDisabled(),
    true,
  );
  assert.equal(await f.locator("#lab-compare").isDisabled(), true);
  await f.screenshot({ path: "test-results/visual-lab-fallback-reduced.png" });
  await fallback.close();
  const { context: missing, page: m } = await open();
  await m.route("**/aren-atlas.webp", (r) => r.abort());
  await m.goto(url);
  await m.waitForFunction(
    () => document.querySelector("#lab-stage").dataset.ready === "error",
  );
  assert.match(
    await m.locator("#lab-loading").innerText(),
    /Artwork could not load/,
  );
  assert.equal(await m.locator("header a").getAttribute("href"), "./");
  await missing.close();
  assert.deepEqual(errors, []);
  assert.ok(
    !requests.some(
      (u) =>
        u.includes("/api/") ||
        (u.startsWith("http") && !u.startsWith("http://127.0.0.1:4198/")),
    ),
    "lab makes no API writes, CDN or external asset requests",
  );
  await writeFile(
    "test-results/visual-lab-summary.json",
    JSON.stringify(
      {
        browser: "Chromium (software WebGL in automation)",
        physicalDevice: false,
        results: report.results,
      },
      null,
      2,
    ),
  );
  console.log(
    "Visual Lab browser checks passed: real WebGL, five-hit showcase, awakening, paused A/B state preservation, keyboard/double-jump/air-dash, mobile analog/touch and unobstructed controls, crouch guard/release, resolution rebuild, context-loss and unavailable-WebGL fallback, reduced motion, missing-art recovery, real-time fixed-tick comparison/export; zero API requests. Physical iPhone performance remains unmeasured.",
  );
} finally {
  await browser?.close();
  server.kill();
}
