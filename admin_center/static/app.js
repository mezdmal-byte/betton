"use strict";
// Standalone read-only client: no requests to Mini App or financial-action APIs.
const pages = [
  ["overview", "Обзор", "Показатели локальной тестовой базы"],
  ["users", "Пользователи", "Поиск по ID, Telegram ID и имени"],
  ["events", "События", "Состояние и связанные записи"],
  ["orders", "Предложения", "Исполненные и ожидающие части заявок"],
  ["fills", "Исполнения", "Заключённые ставки участников"],
  ["ledger", "Денежный журнал", "Записанные движения P2P в TON"],
  ["settlements", "Результаты расчёта", "Сохранённые результаты backend"],
  ["guarantors", "Гаранты", "Сохранённые профили и доступность на момент снимка"],
  ["cases", "Дела гарантов", "Условия, редакции и сроки"],
  ["revisions", "История согласований", "Редакции и действия участников"],
  ["messages", "Переписка", "Сохранённые сообщения по событиям"],
  ["demo-runs", "Тестовые сценарии", "Состояние автоматических гарантов и ошибки"],
  ["monitor", "Состояние системы"],
  ["errors", "Ошибки и трассировки"],
  ["security", "Безопасность"],
  ["backup", "Резервные копии"],
  ["alerts", "Оповещения"],
  ["reconcile", "Сверка TON"],
  ["onchain", "TON / блокчейн"],
  ["roles", "Доступы и роли"],
];
const app = document.querySelector("#app"),
  navigation = document.querySelector("#navigation");
let current, params, controller;
const money = new Set([
  "balance_nano",
  "pot_nano",
  "lock_nano",
  "amount",
  "remaining",
  "filled",
  "refunded",
  "maker_stake",
  "taker_stake",
]);
const labels = {
  id: "ID",
  username: "Логин",
  telegram_id: "Telegram ID",
  telegram_username: "Имя Telegram",
  display_name: "Имя",
  balance_nano: "Доступно",
  created_at: "Создано (UTC)",
  resolved_at: "Результат (UTC)",
  close_at: "Приём ставок до (UTC)",
  question: "Название события",
  description: "Описание",
  creator_id: "Создатель",
  market_id: "Событие",
  user_id: "Пользователь",
  status: "Статус",
  category: "Категория",
  mechanism: "Механизм",
  visibility: "Доступ",
  outcomes: "Исходы",
  winning_outcome: "Результат",
  p2p_journal_coverage: "Охват журнала",
  pot_nano: "Банк исполненных ставок",
  lock_nano: "Обеспечение LMSR",
  request_id: "Ключ повторного запроса",
  outcome: "Индекс исхода",
  price: "Цена (тики 1 / 1 000 000)",
  amount: "Исходная сумма",
  remaining: "Остаток резерва",
  filled: "Исполнено",
  refunded: "Возвращено",
  kind: "Тип",
  maker_order_id: "Заявка автора",
  taker_order_id: "Встречная заявка",
  maker_user_id: "Автор",
  taker_user_id: "Встречный участник",
  maker_stake: "Взнос автора",
  taker_stake: "Встречный взнос",
  maker_outcome: "Индекс исхода автора",
  entry_key: "Ключ записи",
  op_type: "Движение",
  order_id: "Заявка",
  fill_id: "Исполнение",
  from_kind: "Откуда",
  to_kind: "Куда",
  from_user_id: "От пользователя",
  to_user_id: "Пользователю",
  from_order_id: "Из заявки",
  to_order_id: "В заявку",
  reason: "Основание",
  guarantor_id: "Гарант",
  state: "Состояние",
  revision: "Редакция",
  criteria: "Критерии",
  source: "Источник",
  result_due_at: "Окончание события (UTC)",
  deadline: "Срок решения (UTC)",
  proposed_outcome: "Предложенный исход",
  decision_reason: "Основание решения",
  stakes_total: "Ставки (TON, legacy)",
  payout: "Выплата (TON, legacy)",
  tip: "Сбор (TON, legacy)",
  credited: "Зачислено (TON, legacy)",
};
function el(tag, cls = "", value) {
  const n = document.createElement(tag);
  n.className = cls;
  if (value != null) n.textContent = String(value);
  return n;
}
function add(parent, ...nodes) {
  parent.append(...nodes);
  return parent;
}
function button(text, fn) {
  const b = el("button", "", text);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
function route(name, values = {}) {
  const q = new URLSearchParams(values);
  return "#" + name + (q.size ? "?" + q : "");
}
function nav(name, values = {}) {
  const next = route(name, values);
  if (location.hash === next) render();
  else location.hash = next;
}
function link(text, name, values = {}) {
  const a = el("a", "link", text);
  a.href = route(name, values);
  return a;
}
function panel(name, note) {
  const p = add(el("section", "panel"), el("h2", "", name));
  if (note) p.append(el("p", "muted", note));
  app.append(p);
  return p;
}
function ton(value) {
  if (value == null) return "Нет данных";
  try {
    let v = BigInt(String(value));
    const sign = v < 0n ? "-" : "";
    if (v < 0n) v = -v;
    const fraction = (v % 1000000000n)
      .toString()
      .padStart(9, "0")
      .replace(/0+$/, "");
    return (
      sign +
      (v / 1000000000n).toString() +
      (fraction ? "," + fraction : "") +
      " TON"
    );
  } catch {
    return "Некорректная сумма";
  }
}
function nice(value, key = "") {
  if (value == null || value === "") return "Нет данных";
  if (money.has(key)) return ton(value);
  if (key.endsWith("_at") || key === "deadline")
    return String(value).replace("T", " ").replace(/Z$/, "") + " UTC";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function target(key, kind) {
  if (key === "id") return kind;
  if (
    [
      "user_id",
      "creator_id",
      "guarantor_id",
      "maker_user_id",
      "taker_user_id",
      "from_user_id",
      "to_user_id",
    ].includes(key)
  )
    return "user";
  if (key === "market_id") return "event";
  if (
    [
      "order_id",
      "maker_order_id",
      "taker_order_id",
      "from_order_id",
      "to_order_id",
    ].includes(key)
  )
    return "order";
  if (key === "fill_id") return "fill";
}
function fieldLabel(key, kind) {
  return key === "amount" && kind === "entry"
    ? "Сумма движения"
    : labels[key] || key;
}
function cell(key, value, kind) {
  const name = target(key, kind);
  return name && value != null
    ? link(nice(value, key), name, { id: value })
    : el("span", "", nice(value, key));
}
function table(title, rows, keys, kind) {
  const p = panel(title),
    wrap = el("div", "table-wrap"),
    t = el("table"),
    head = el("tr");
  wrap.tabIndex=0;
  wrap.setAttribute('role','region');
  wrap.setAttribute('aria-label',title+' — таблица с горизонтальной прокруткой');
  for (const key of keys) head.append(el("th", "", fieldLabel(key, kind)));
  t.append(add(el("thead"), head));
  const body = el("tbody");
  for (const record of rows || []) {
    const row = el("tr");
    for (const key of keys)
      row.append(add(el("td"), cell(key, record[key], kind)));
    body.append(row);
  }
  t.append(body);
  wrap.append(t);
  p.append(wrap);
  if (!rows?.length) p.append(el("p", "empty", "Записей нет"));
  return p;
}
function detail(title, record, kind) {
  const p = panel(title),
    dl = el("dl", "details");
  for (const [key, value] of Object.entries(record))
    add(
      dl,
      el("dt", "", fieldLabel(key, kind)),
      add(el("dd"), cell(key, value, kind)),
    );
  p.append(dl);
  return p;
}
async function api(path) {
  const r = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    signal: controller.signal,
  });
  if (!r.ok) {
    let reason = "";
    try {
      reason = (await r.json()).detail || "";
    } catch {}
    throw new Error("HTTP " + r.status + " " + reason);
  }
  return r.json();
}
function search(hint) {
  const form = el("form", "toolbar"),
    input = el("input");
  input.placeholder = hint;
  input.setAttribute("aria-label", hint);
  input.maxLength = 64;
  input.value = params.get("q") || "";
  const submit = el("button", "", "Найти");
  submit.type = "submit";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = Object.fromEntries(params);
    values.q = input.value.trim();
    delete values.offset;
    nav(current, values);
  });
  add(form, input, submit);
  app.append(form);
}
function filters(keys) {
  const form = el("form", "toolbar"),
    inputs = [];
  for (const key of keys) {
    const label = el("label", "filter", labels[key]),
      input = el("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.value = params.get(key) || "";
    inputs.push([key, input]);
    label.append(input);
    form.append(label);
  }
  const submit = el("button", "", "Применить");
  submit.type = "submit";
  form.append(submit);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = {};
    for (const [key, input] of inputs)
      if (input.value) values[key] = input.value;
    nav(current, values);
  });
  form.append(button("Сбросить", () => nav(current)));
  app.append(form);
}
function listUrl(name) {
  const q = new URLSearchParams(params);
  q.delete("id");
  q.delete("q");
  q.set("limit", "30");
  if (["users", "events"].includes(current)) q.set("q", params.get("q") || "");
  if (current === "orders" && params.get("q")) {
    const value = params.get("q");
    if (!/^[1-9]\d{0,18}$/.test(value))
      throw new Error("Введите положительный ID заявки");
    q.set("order_id", value);
  }
  return "/api/" + name + "?" + q;
}
const extensions={
  guarantors:['user_id','status','bio','topics','available_until','last_seen_at'],
  cases:['market_id','guarantor_id','state','revision','deadline'],
  revisions:['id','market_id','actor_id','revision','kind','created_at'],
  messages:['id','market_id','user_id','kind','text','created_at'],
  'demo-runs':['market_id','actor_id','enabled','scenario','next_at','last_error'],
};
async function extensionList() {
  search('ID, статус или тип записи');
  if(current!=='guarantors')filters(['market_id','user_id']);
  const query=new URLSearchParams(params);query.set('limit','30');
  const data=await api('/api/inspect/'+current+'?'+query);
  const p=table(pages.find(p=>p[0]===current)[1],data.items,extensions[current]);
  const key=current==='guarantors'?'user_id':['cases','demo-runs'].includes(current)?'market_id':'id';
  const links=el('div','toolbar');
  for(const row of data.items)links.append(link('Подробнее #'+row[key],'inspection',{section:current,id:row[key]}));
  p.append(links);paging(p,data.items.length);
}
async function diagnosticView() {
  if(current==='monitor') {
    detail('Состояние snapshot-базы',await api('/api/database-status'));
    panel('Границы','Это согласованный снимок, а не живой мониторинг. Workers, matching, миграции, бот и внешние кошельки не запускаются.');
    return;
  }
  const report=await api('/api/reconciliation');
  if(!report.connected) {panel('Сверка не подключена',report.limitations?.join(' '));return;}
  detail('Финансовая диагностика',{status:report.status,schema_revision:report.schema_revision,...report.inventory_nano});
  table('Диагностические замечания',report.findings,['classification','code','count']);
  if(report.limitations)panel('Границы проверки',report.limitations.join(' '));
  const a=el('a','link','Скачать обезличенную сводку');a.href='/api/diagnostic-export';a.download='betton-diagnostic-summary.json';app.append(a);
}
function paging(p, len) {
  const offset = Number(params.get("offset") || 0),
    go = (next) =>
      nav(current, { ...Object.fromEntries(params), offset: next });
  const prev = button("← Назад", () => go(Math.max(0, offset - 30)));
  prev.disabled = offset === 0;
  const next = button("Далее →", () => go(offset + 30));
  next.disabled = len < 30 || offset + 30 > 100000;
  add(
    p,
    add(
      el("div", "pager"),
      prev,
      el(
        "span",
        "",
        len ? "Записи " + (offset + 1) + "–" + (offset + len) : "Записей нет",
      ),
      next,
    ),
  );
}
const orderKeys = [
  "id",
  "user_id",
  "market_id",
  "outcome",
  "amount",
  "remaining",
  "filled",
  "refunded",
  "status",
];
const fillKeys = [
  "id",
  "market_id",
  "maker_order_id",
  "taker_order_id",
  "maker_user_id",
  "taker_user_id",
  "maker_stake",
  "taker_stake",
];
const ledgerKeys = [
  "id",
  "op_type",
  "amount",
  "from_kind",
  "from_user_id",
  "to_kind",
  "to_user_id",
  "market_id",
  "order_id",
  "fill_id",
];
const settlementKeys = [
  "id",
  "market_id",
  "user_id",
  "winning_outcome",
  "stakes_total",
  "payout",
  "tip",
  "credited",
  "resolved_at",
];
function related(name, title, values) {
  app.append(add(el("div", "toolbar"), link(title + " →", name, values)));
}
async function overview() {
  const d = await api("/api/overview");
  app.append(el("h2", "", "Система в цифрах"));
  const cards = el("div", "cards");
  for (const [label, value] of [
    ["Пользователей", d.users],
    ["Событий", d.events],
    ["В активных предложениях", ton(d.open_offers_nano)],
    ["Мониторинг", "Нет данных"],
  ])
    cards.append(
      add(
        el("div", "card"),
        el("div", "number", value),
        el("div", "metric-label", label),
      ),
    );
  app.append(cards);
  panel(
    "Только чтение тестовой базы",
    "Показатели рассчитаны из выбранной базы по сохранённым статусам. Открытые остатки заявок не включают исполненные ставки и будущие выплаты. Панель не закрывает просроченные события и не запускает возвраты.",
  );
  const p = panel(
    "Связанные данные",
    "Найдите пользователя, событие или заявку и перейдите к исполнениям и движениям TON.",
  );
  for (const name of ["users", "events", "orders", "fills", "ledger"])
    p.append(link(pages.find((p) => p[0] === name)[1] + " →", name));
  const m = panel("Работа сервисов", "Внешние источники ещё не подключены");
  for (const label of [
    "Backend API",
    "Telegram-бот",
    "Полная сверка P2P",
    "Резервные копии",
    "TON / блокчейн",
  ])
    m.append(
      add(
        el("div", "service"),
        el("span", "", label),
        el("span", "muted", "Нет данных"),
      ),
    );
}
async function list() {
  let keys, kind, title;
  if (current === "users") {
    search("ID, Telegram ID или @username");
    keys = [
      "id",
      "username",
      "telegram_id",
      "telegram_username",
      "display_name",
      "balance_nano",
      "created_at",
    ];
    kind = "user";
    title = "Пользователи";
  }
  if (current === "events") {
    search("ID или название события");
    keys = [
      "id",
      "question",
      "status",
      "creator_id",
      "mechanism",
      "p2p_journal_coverage",
    ];
    kind = "event";
    title = "События";
  }
  if (current === "orders") {
    search("ID заявки");
    filters(["user_id", "market_id"]);
    keys = orderKeys;
    kind = "order";
    title = "Предложения";
  }
  if (current === "fills") {
    filters(["user_id", "market_id", "order_id"]);
    keys = fillKeys;
    kind = "fill";
    title = "Исполнения";
  }
  if (current === "ledger") {
    filters(["user_id", "market_id", "order_id", "fill_id"]);
    keys = ledgerKeys;
    kind = "entry";
    title = "Денежный журнал";
  }
  if (current === "settlements") {
    filters(["user_id", "market_id"]);
    keys = settlementKeys;
    title = "Сохранённые результаты";
  }
  const d = await api(listUrl(current));
  paging(table(title, d.items, keys, kind), d.items.length);
  if (current === "ledger")
    panel(
      "Охват истории",
      "Журнал хранит фактически записанные движения. История до внедрения журнала не восстанавливается. Это не история внешнего TON-кошелька.",
    );
  if (current === "settlements")
    panel(
      "Legacy-поля",
      "Суммы результатов сохранены backend в TON как числа с плавающей точкой. Панель показывает их без пересчёта и не выдаёт за точный целочисленный журнал.",
    );
}
async function showUser() {
  const d = await api("/api/users/" + params.get("id"));
  detail("Пользователь", d.user, "user");
  table("Предложения (до 50)", d.orders, orderKeys, "order");
  related("orders", "Все предложения пользователя", { user_id: d.user.id });
  table(
    "Созданные события (до 30)",
    d.created_events,
    ["id", "question", "status"],
    "event",
  );
  table("Исполнения (до 50)", d.fills, fillKeys, "fill");
  related("fills", "Все исполнения пользователя", { user_id: d.user.id });
  table("Журнал (до 50)", d.ledger, ledgerKeys, "entry");
  related("ledger", "Весь журнал пользователя", { user_id: d.user.id });
  related("settlements", "Результаты пользователя", { user_id: d.user.id });
}
async function showEvent() {
  const d = await api("/api/events/" + params.get("id"));
  detail("Событие", d.event, "event");
  panel(
    "Охват журнала",
    d.coverage === "full"
      ? "Журнал помечен как ведущийся с создания события. Полная автоматическая сверка здесь не выполняется."
      : "Полнота журнала не подтверждена. Отсутствующую историю восстановить нельзя.",
  );
  if (d.guarantor) detail("Гарант: сохранённые условия", d.guarantor);
  else
    panel("Гарант", "Нет дела гаранта или таблица этого модуля отсутствует.");
  table("Предложения (до 100)", d.orders, orderKeys, "order");
  related("orders", "Все предложения события", { market_id: d.event.id });
  table("Исполнения (до 100)", d.fills, fillKeys, "fill");
  related("fills", "Все исполнения события", { market_id: d.event.id });
  table("Журнал (до 100)", d.ledger, ledgerKeys, "entry");
  related("ledger", "Весь журнал события", { market_id: d.event.id });
  table("Результаты расчёта (до 100)", d.settlements, settlementKeys);
  related("settlements", "Все результаты события", { market_id: d.event.id });
}
async function showOrder() {
  const d = await api("/api/orders/" + params.get("id"));
  detail("Заявка", d.order, "order");
  table("Исполнения (до 50)", d.fills, fillKeys, "fill");
  related("fills", "Все исполнения заявки", { order_id: d.order.id });
  table("Журнал (до 50)", d.ledger, ledgerKeys, "entry");
  related("ledger", "Весь журнал заявки", { order_id: d.order.id });
}
async function showFill() {
  const d = await api("/api/fills/" + params.get("id"));
  detail("Исполнение", d.fill, "fill");
  table("Журнал исполнения (до 50)", d.ledger, ledgerKeys, "entry");
  related("ledger", "Весь журнал исполнения", { fill_id: d.fill.id });
}
function setupNav() {
  for (const [i, [name, label]] of pages.entries()) {
    if (i === 7)
      navigation.append(el("div", "navhead", "МОНИТОРИНГ И КОНТРОЛЬ"));
    const a = link(label, name);
    a.className = "navitem";
    a.dataset.target = name;
    if (i >= 7) {
      const dot = el("img", "nav-dot");
      dot.src = "/assets/dot.svg";
      dot.alt = "";
      dot.width = 4;
      dot.height = 4;
      a.prepend(dot);
    }
    navigation.append(a);
  }
}
async function render() {
  if (controller) controller.abort();
  controller = new AbortController();
  const [name, search = ""] = (location.hash.slice(1) || "overview").split("?");
  current = name;
  params = new URLSearchParams(search);
  app.replaceChildren();
  const meta = pages.find((p) => p[0] === current);
  document.querySelector("#page-title").textContent =
    meta?.[1] ||
    {
      user: "Карточка пользователя",
      event: "Карточка события",
      order: "Карточка заявки",
      fill: "Карточка исполнения",
      entry: "Запись журнала",
    }[current] ||
    "Страница не найдена";
  document.querySelector("#page-desc").textContent =
    meta?.[2] || "Взаимосвязанные записи BetTON · только чтение";
  navigation.querySelectorAll("a").forEach((a) => {
    const active = a.dataset.target === current;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  try {
    if (current === "overview") await overview();
    else if (
      ["users", "events", "orders", "fills", "ledger", "settlements"].includes(
        current,
      )
    )
      await list();
    else if (current === "user") await showUser();
    else if (current === "event") await showEvent();
    else if (current === "order") await showOrder();
    else if (current === "fill") await showFill();
    else if (extensions[current]) await extensionList();
    else if (current==='inspection') {
      const section=params.get('section'), id=params.get('id');
      if(!extensions[section])throw new Error('Неизвестный раздел');
      detail('Подробности записи',await api('/api/inspect/'+section+'/'+id));
    }
    else if (['monitor','reconcile','errors'].includes(current)) await diagnosticView();
    else if (current === "entry")
      detail(
        "Запись журнала",
        await api("/api/ledger/" + params.get("id")),
        "entry",
      );
    else
      panel(
        "Источник данных не подключён",
        "В первой версии здесь нет синтетических статусов. Операции модерации, управления балансом, выплат и изменения прав недоступны.",
      );
  } catch (error) {
    if (error.name !== "AbortError")
      app.append(
        el("div", "error", "Не удалось получить данные: " + error.message),
      );
  }
}
setupNav();
window.addEventListener("hashchange", render);
render();
