import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, PORT: "4199" },
  stdio: ["ignore", "pipe", "inherit"],
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
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
  const errors = [];
  async function open(mobile = false) {
    const context = await browser.newContext({
        viewport: mobile
          ? { width: 844, height: 390 }
          : { width: 1440, height: 960 },
        isMobile: mobile,
        hasTouch: mobile,
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.error("PAGE ERROR", e.message);
    });
    return { context, page };
  }
  async function graphics(p, value, expected) {
    await p.selectOption("#practice-renderer", value);
    await p.clock.runFor(32);
    await p.waitForFunction(
      () =>
        !document
          .querySelector("#practice-graphics-status")
          .textContent.startsWith("Loading"),
      null,
      { timeout: 30000 },
    );
    await p.clock.runFor(32);
    assert.equal(
      await p.locator("#canvas").getAttribute("data-presentation"),
      expected,
    );
  }
  for (const mobile of [false, true]) {
    const { context, page: p } = await open(mobile),
      requests = [];
    p.on("request", (r) => requests.push(r.url()));
    await p.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
    await p.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
    await p.goto("http://127.0.0.1:4199");
    await p.clock.runFor(32);
    assert.ok(
      !requests.some((u) => u.includes("/practice-pixi.js")),
      "classic game does not download PixiJS",
    );
    await p.selectOption("#mode", "training");
    await p.locator("#character0 input[value=silent]").check();
    await p.click("#edit-loadout0");
    for (const [i, id] of [
      "risingGale",
      "skyCleave",
      "divingFlame",
      "floodField",
      "bindingThreads",
      "venomDart",
      "purifyingCurrent",
    ].entries()) {
      await p.locator('[data-loadout-slot="' + i + '"]').click();
      await p.locator('[data-pick-id="' + id + '"]').click();
    }
    await p.click("#loadout-save");
    await p.click("#play");
    await p.clock.runFor(32);
    await p.click("#training-settings");
    const before = await p.locator("#canvas").getAttribute("data-render-tick"),
      kit = await p.locator("#loadout-summary0").innerText();
    await graphics(p, "pixi", "aren-pixi");
    assert.equal(
      await p.locator("#canvas").getAttribute("data-render-tick"),
      before,
    );
    assert.match(await p.locator("#name0").innerText(), /AREN.*SILENT KIT/);
    assert.equal(await p.locator("#loadout-summary0").innerText(), kit);
    assert.equal(await p.locator("[data-practice-art=pixi]").isVisible(), true);
    await graphics(p, "canvas", "aren-canvas");
    assert.equal(
      await p.locator("#canvas").getAttribute("data-render-tick"),
      before,
    );
    await graphics(p, "pixi", "aren-pixi");
    assert.equal(
      await p.locator("#canvas").getAttribute("data-render-tick"),
      before,
    );
    await p.uncheck("#training-ranges");
    await p.click("#training-start");
    await p.clock.runFor(32);
    if (!mobile) {
      const press = async (key, after = 0) => {
        await p.keyboard.down(key);
        await p.clock.runFor(16);
        await p.keyboard.up(key);
        if (after) await p.clock.runFor(after);
      };
      await press("KeyU", 165);
      await press("KeyW", 32);
      await press("KeyJ", 133);
      await press("KeyJ", 116);
      await press("KeyI", 165);
      await press("KeyO", 200);
      assert.match(await p.locator("#combo0").innerText(), /5 HITS/);
      await p.screenshot({ path: "test-results/practice-pixi-air-route.png" });
      await p.clock.runFor(600);
      await press("Digit1", 400);
      assert.match(
        await p
          .locator("[data-quick-action=jutsu4]")
          .getAttribute("aria-label"),
        /Flood Field/,
      );
      await p.screenshot({ path: "test-results/practice-pixi-field.png" });
      await p.click("#training-settings");
      await p.click("#training-charge");
      await p.click("#training-close");
      await p.click("#play");
      await p.clock.runFor(600);
      await press("KeyT", 100);
      assert.match(
        await p.locator("#awakening-label0").innerText(),
        /ASCENDANT.*s/,
      );
      await press("KeyH", 900);
      await press("KeyF", 240);
      assert.match(await p.locator("#weapon-label").innerText(), /KATANA/);
      for (let n = 0; n < 3; n++) await press("KeyC", 32);
      await press("KeyX", 500);
      assert.match(await p.locator("#effects0").innerText(), /POISON COATED/);
    } else {
      const rect = await p.locator("#joystick").boundingBox();
      await p.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await p.mouse.down();
      await p.mouse.move(rect.x + 5, rect.y + rect.height / 2);
      await p.clock.runFor(200);
      await p.mouse.up();
      await p.locator("[data-action=jump]").tap();
      await p.clock.runFor(40);
      assert.match(await p.locator("#movement-state").innerText(), /AIR/);
      assert.equal(
        await p.locator("#canvas").getAttribute("data-presentation"),
        "aren-pixi",
      );
      await p.screenshot({ path: "test-results/practice-pixi-mobile.png" });
      await p.clock.runFor(600);
      const guard = p.locator("[data-quick-action=crouchGuard]"),
        r = await guard.boundingBox();
      await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
      await p.mouse.down();
      await p.clock.runFor(48);
      assert.match(
        await p.locator("#movement-state").innerText(),
        /CROUCH GUARD/,
      );
      await p.mouse.up();
    }
    await p.click("#training-settings");
    await p.clock.runFor(32);
    const held = await p.locator("#canvas").getAttribute("data-render-tick");
    await p.evaluate(() =>
      document
        .querySelector("[data-practice-art=pixi]")
        .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
    await p.clock.runFor(32);
    assert.equal(
      await p.locator("#canvas").getAttribute("data-presentation"),
      "aren-canvas",
    );
    assert.equal(
      await p.locator("#canvas").getAttribute("data-render-tick"),
      held,
    );
    assert.equal(await p.locator("#practice-graphics-retry").isVisible(), true);
    await p.click("#practice-graphics-retry");
    await p.clock.runFor(32);
    await p.waitForFunction(
      () =>
        !document
          .querySelector("#practice-graphics-status")
          .textContent.startsWith("Loading"),
    );
    await p.clock.runFor(32);
    assert.equal(
      await p.locator("#canvas").getAttribute("data-presentation"),
      "aren-pixi",
    );
    await p.click("#training-close");
    await p.selectOption("#mode", "cpu");
    await p.clock.runFor(32);
    assert.equal(
      await p.locator("#canvas").getAttribute("data-presentation"),
      "classic",
    );
    assert.equal(await p.locator("[data-practice-art]").count(), 0);
    assert.match(await p.locator("#name0").innerText(), /^SILENT$/);
    for (const mode of ["local", "online"]) {
      await p.selectOption("#mode", mode);
      await p.clock.runFor(32);
      assert.equal(
        await p.locator("#canvas").getAttribute("data-presentation"),
        "classic",
      );
      assert.equal(await p.locator("[data-practice-art]").count(), 0);
    }
    const requestStart = requests.length;
    await p.reload();
    await p.clock.runFor(32);
    assert.equal(
      await p.locator("#canvas").getAttribute("data-presentation"),
      "classic",
    );
    assert.equal(await p.locator("#practice-renderer").inputValue(), "pixi");
    assert.ok(!requests.slice(requestStart).some(u=>u.includes("/practice-pixi.js")),"saved Practice graphics do not load in CPU mode");
    await context.close();
  }
  const { context: fallback, page: f } = await open();
  await f.addInitScript(() => {
    localStorage.setItem("fabled.practice.graphics.v1", "pixi");
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await f.goto("http://127.0.0.1:4199");
  await f.selectOption("#mode", "training");
  await f.click("#play");
  await f.waitForFunction(
    () =>
      document.querySelector("#canvas").dataset.presentation === "aren-canvas",
  );
  await f.click("#training-settings");
  assert.match(
    await f.locator("#practice-graphics-status").innerText(),
    /unavailable.*Canvas/,
  );
  await fallback.close();
  const { context: retryContext, page: r } = await open();
  let blocked = true;
  await r.route("**/practice-pixi.js*", (route) =>
    blocked ? route.abort() : route.continue(),
  );
  await r.goto("http://127.0.0.1:4199");
  await r.selectOption("#mode", "training");
  await r.click("#play");
  await r.click("#training-settings");
  await r.selectOption("#practice-renderer", "pixi");
  await r.waitForFunction(() =>
    document
      .querySelector("#practice-graphics-status")
      .textContent.includes("could not load"),
  );
  assert.equal(
    await r.locator("#canvas").getAttribute("data-presentation"),
    "classic",
  );
  blocked = false;
  await r.click("#practice-graphics-retry");
  await r.waitForFunction(
    () =>
      document.querySelector("#canvas").dataset.presentation === "aren-pixi",
  );
  await retryContext.close();
  assert.deepEqual(errors, []);
  console.log(
    "Main Practice Pixi checks passed: lazy versioned bundle, existing 7-jutsu loadout and controls, state-preserving A/B switches, real five-hit air combo, field and awakening, mobile analog/jump/crouch-guard, context loss/retry, persisted preference with CPU isolation, unavailable-WebGL fallback and failed-module recovery.",
  );
} finally {
  await browser?.close();
  server.kill();
}
