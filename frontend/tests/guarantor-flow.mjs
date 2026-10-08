// Isolated real browser + API smoke test. Uses a fresh local SQLite DB and fake Telegram signatures.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temp = await mkdtemp(resolve(tmpdir(), "betton-guarantor-browser-"));
const output = process.env.BETTON_QA_OUTPUT || resolve(temp, "screenshots");
await mkdir(output, { recursive: true });
const listener = createServer();
await new Promise((r) => listener.listen(0, "127.0.0.1", r));
const port = listener.address().port;
await new Promise((r) => listener.close(r));
const base = `http://127.0.0.1:${port}`;
const token = "123456:TEST_BOT_TOKEN";
const server = spawn(
  process.env.BETTON_TEST_PYTHON || "python",
  [
    "-m",
    "uvicorn",
    "app.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: `sqlite:///${temp}/qa.db`,
      BOT_TOKEN: token,
      ADMIN_TELEGRAM_ID: "990001",
      MINI_APP_URL: base,
      PUBLIC_BASE_URL: base,
      RENDER_EXTERNAL_URL: "",
      PANDASCORE_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
server.stderr.on("data", (b) => {
  logs += b;
});
let browser;
const signatures = {};
function sign(id, name) {
  const fields = {
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({ id, first_name: name }),
  };
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret)
    .update(
      Object.entries(fields)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("\n"),
    )
    .digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}
async function api(id, path, body, method = "POST") {
  const response = await fetch(base + path, {
    method,
    headers: {
      Authorization: `tma ${signatures[id]}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, `${path}: ${JSON.stringify(data)}`);
  return data;
}
async function pageFor(id, width = 390) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
  });
  await context.addInitScript(
    ({ data }) => {
      localStorage.setItem("betton.onboarding.v1", "done");
      window.Telegram = {
        WebApp: {
          initData: data,
          colorScheme: "light",
          ready() {},
          expand() {},
        },
      };
    },
    { data: signatures[id] },
  );
  const page = await context.newPage();
  await page.route("https://telegram.org/**", (r) => r.abort());
  page.on("pageerror", (e) => {
    throw e;
  });
  return page;
}
try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode != null) throw Error(logs);
    try {
      if ((await fetch(base + "/health")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const users = {};
  for (const [id, name] of [
    [990001, "Администратор"],
    [990002, "Создатель"],
    [990003, "Гарант Анна"],
  ]) {
    signatures[id] = sign(id, name);
    users[id] = await api(id, "/auth/telegram");
  }
  await api(
    990003,
    "/guarantors/me",
    {
      bio: "Проверяю результаты по записям и официальным источникам.",
      topics: "Игры и дружеские пари",
      accept_rules: true,
    },
    "PUT",
  );
  await api(990003, "/guarantors/me/availability", { available: true });
  const market = await api(990002, "/markets", {
    question: "Кто победит в дружеском матче?",
    outcomes: ["Команда A", "Команда B"],
    visibility: "unlisted",
    close_at: new Date(Date.now() + 7200000).toISOString(),
    guarantor_id: users[990003].id,
    resolution_criteria:
      "Победитель определяется по финальному счёту. При ничьей — отмена.",
    resolution_source: "Записи обоих участников и страница матча.",
    result_due_at: new Date(Date.now() + 86400000).toISOString(),
  });
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BETTON_CHROMIUM_PATH
      ? { executablePath: process.env.BETTON_CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const g = await pageFor(990003);
  await g.goto(base + "/v2/?share=" + market.share_token);
  await g
    .getByRole("button", { name: "Рассмотреть пари", exact: true })
    .waitFor();
  const hide = g.getByRole("button", { name: "Скрыть", exact: true });
  if (await hide.isVisible()) await hide.click();
  await g
    .getByRole("button", { name: "Рассмотреть пари", exact: true })
    .click();
  await g
    .getByRole("button", {
      name: "Принять условия и открыть пари",
      exact: true,
    })
    .waitFor();
  await g.screenshot({
    path: resolve(output, "review-mobile.png"),
    fullPage: true,
  });
  const c = await pageFor(990002);
  await c.goto(base + "/v2/?share=" + market.share_token);
  await c
    .getByRole("button", { name: "Уточнить условия", exact: true })
    .waitFor();
  const chide = c.getByRole("button", { name: "Скрыть", exact: true });
  if (await chide.isVisible()) await chide.click();
  await c
    .getByRole("button", { name: "Уточнить условия", exact: true })
    .click();
  await c
    .getByRole("textbox", { name: /^Условия/ })
    .fill(
      "Нужны записи обоих участников с веб-камерой. Победитель по финальному счёту.",
    );
  await c
    .getByRole("button", { name: "Сохранить новую версию", exact: true })
    .click();
  await c
    .getByRole("button", { name: "Подтвердить условия", exact: true })
    .click();
  await g.reload();
  await g
    .getByRole("button", {
      name: "Принять условия и открыть пари",
      exact: true,
    })
    .waitFor();
  if (await hide.isVisible()) await hide.click();
  await g
    .getByRole("button", {
      name: "Принять условия и открыть пари",
      exact: true,
    })
    .click();
  await g.getByRole("heading", { name: "Гарант принял пари" }).waitFor();
  await c.reload();
  await c
    .getByRole("button", { name: "Условия прочитал, гаранту доверяю" })
    .waitFor();
  if (await chide.isVisible()) await chide.click();
  await c
    .getByRole("button", { name: "Условия прочитал, гаранту доверяю" })
    .click();
  await c
    .getByRole("button", { name: "Условия прочитал, гаранту доверяю" })
    .waitFor({ state: "hidden" });
  await c.screenshot({
    path: resolve(output, "active-mobile.png"),
    fullPage: true,
  });
  assert.equal(
    await c.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  const desktop = await pageFor(990003, 1280);
  await desktop.goto(base + "/v2/");
  await desktop.getByRole("button", { name: "Профиль", exact: true }).click();
  await desktop.getByRole("button", { name: /Гаранты Профиль/ }).click();
  await desktop.getByRole("heading", { name: "Мой профиль гаранта" }).waitFor();
  const dhide = desktop.getByRole("button", { name: "Скрыть", exact: true });
  if (await dhide.isVisible()) await dhide.click();
  await desktop.screenshot({
    path: resolve(output, "directory-desktop.png"),
    fullPage: true,
  });
  await desktop.setViewportSize({ width: 320, height: 844 });
  await desktop.screenshot({
    path: resolve(output, "directory-small.png"),
    fullPage: true,
  });
  assert.equal(
    await desktop.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  console.log(
    `PASS: invitation → review → edit → both confirmations → open → informed consent. Screenshots: ${output}`,
  );
} catch (e) {
  console.error(e);
  if (browser) {
    for (const [i, context] of browser.contexts().entries()) {
      for (const page of context.pages()) {
        console.error(
          "Page",
          i,
          (await page.locator("body").innerText()).slice(0, 5000),
        );
        await page.screenshot({
          path: resolve(output, `failure-${i}.png`),
          fullPage: true,
        });
      }
    }
  }
  console.error(logs.slice(-2500));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  await new Promise((r) => server.once("exit", r));
  await rm(resolve(temp, "qa.db"), { force: true });
}
