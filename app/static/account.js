function profilePhotoUrl() {
  if (me && me.photo_url) return me.photo_url;
  const unsafe = typeof tg !== "undefined" && tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  return unsafe && typeof unsafe.photo_url === "string" ? unsafe.photo_url : "";
}

function initialsFrom(name) {
  const parts = String(name || "").replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "BT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function avatarHtml(sizeClass) {
  const name = (typeof displayName === "function" && displayName()) || tt("player", "игрок");
  const photo = profilePhotoUrl();
  const img = photo
    ? `<img src="${escapeHtml(photo)}" alt="">`
    : escapeHtml(initialsFrom(name));
  return `<span class="${sizeClass || "avatar"}">${img}</span>`;
}

function txLabel(type) {
  const keys = {
    reserve: "tx.reserve",
    fill: "tx.fill",
    refund: "tx.refund",
    cancel: "tx.cancel",
    win: "tx.win",
    loss: "tx.loss",
    fee: "tx.fee",
    void: "tx.void",
    credit: "tx.credit",
    deposit: "tx.deposit",
    withdraw: "tx.withdraw"
  };
  const fallback = {
    reserve: "Заявка создана",
    fill: "Исполнено",
    refund: "Возврат остатка",
    cancel: "Отмена",
    win: "Выигрыш",
    loss: "Проигрыш",
    fee: "Сервисный сбор",
    void: "Возврат события",
    credit: "Зачисление",
    deposit: "Пополнение",
    withdraw: "Вывод"
  };
  return tt(keys[type] || type, fallback[type] || type);
}

function txIcon(type) {
  const map = {
    reserve: "orders", fill: "check", refund: "history", cancel: "close",
    win: "plus", loss: "minus", fee: "info", void: "history", credit: "plus",
    deposit: "wallet", withdraw: "wallet"
  };
  if (typeof icon === "function") return icon(map[type] || "history", {size: 16});
  return ({
    reserve: "↓", fill: "↔", refund: "↑", cancel: "↑",
    win: "+", loss: "−", fee: "%", void: "↑", credit: "+",
    deposit: "↓", withdraw: "↑"
  })[type] || "·";
}

function formatTxDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString((typeof localeTag === "function" ? localeTag() : undefined), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function txRow(row) {
  const amount = Number(row.display_amount);
  const cls = amount > 0 ? "pos" : (amount < 0 ? "neg" : "");
  const sign = amount > 0 ? "+" : "";
  return `<article class="tx-row" data-tx-type="${escapeHtml(row.type)}">
    <div class="tx-icon">${txIcon(row.type)}</div>
    <div>
      <div>${escapeHtml(txLabel(row.type))}</div>
      <div class="muted">${escapeHtml(row.question || "")} · ${escapeHtml(formatTxDate(row.created_at))}</div>
    </div>
    <div class="tx-amt ${cls}">${amount ? (sign + Number(amount).toFixed(2) + " TON") : ""}</div>
  </article>`;
}

function renderTxList(rows, emptyText) {
  if (!rows || !rows.length) {
    return `<div class="empty-state"><strong>${escapeHtml(tt("empty.historyTitle", "История пуста"))}</strong>${escapeHtml(emptyText || tt("empty.historyBody", "Операции по ставкам и выплатам появятся здесь."))}</div>`;
  }
  return rows.map(txRow).join("");
}

function accountHandle() {
  if (me && me.telegram_username) return "@" + me.telegram_username;
  if (me && me.username) return me.username;
  return me ? ("id " + me.id) : "";
}

function paintAccountHeader(account) {
  const root = document.getElementById("account-header");
  if (!root) return;
  const reserved = account ? account.reserved : 0;
  const positions = account ? account.in_positions : 0;
  const earningsNano = account && account.creator_earnings_nano;
  const earnings = account ? account.creator_earnings : 0;
  root.innerHTML = `
    <h2>${escapeHtml(tt("portfolio.title", "Портфель"))}</h2>
    <div class="balance-card">
      <div class="kicker">${escapeHtml(tt("account.available", "ДОСТУПНО"))}</div>
      <div class="lead">${me ? fmtTon(me.balance) : '<span class="skeleton"></span>'}</div>
      <div class="balance-sub">
        <span>${escapeHtml(tt("account.reserved", "В резерве"))} <b>${fmtTon(reserved)}</b></span>
        <span>${escapeHtml(tt("account.inPositionsShort", "В позициях"))} <b>${fmtTon(positions)}</b></span>
      </div>
      ${earningsNano != null ? `<button type="button" class="earnings-row" id="portfolio-earnings">
        <span>${escapeHtml(tt("account.creatorIncome", "Доход автора"))} <span class="muted" title="${escapeHtml(tt("creator.shareNote", "Это не дополнительная комиссия: общий сбор остаётся 1% от чистой прибыли победителя. Автор не получает долю со своего собственного выигрыша."))}">${typeof icon === "function" ? icon("info", {size: 14}) : "ⓘ"}</span></span>
        <b>${escapeHtml(fmtTon(earnings))}</b>
      </button>` : ""}
    </div>`;
}

function paintProfileHeader() {
  const root = document.getElementById("profile-header");
  if (!root) return;
  const admin = me && me.is_admin ? ' <span class="admin-mark">' + escapeHtml(tt("account.admin", "админ")) + "</span>" : "";
  const pending = (typeof moderationMarkets !== "undefined" && moderationMarkets && moderationMarkets.length) || 0;
  const modLabel = pending
    ? tt("profile.moderationN", "Проверка событий ({n})", {n: pending})
    : tt("nav.moderation", "Проверка");
  root.innerHTML = `
    <div class="profile-hero">
      ${avatarHtml("avatar")}
      <div>
        <div class="profile-name">${escapeHtml(displayName())}${admin}</div>
        <div class="profile-handle">${escapeHtml(accountHandle())}</div>
      </div>
    </div>
    <div class="menu-list">
      <button type="button" class="menu-item" data-profile-act="public">${escapeHtml(tt("profile.public", "Публичный профиль"))}${typeof icon === "function" ? icon("chevron", {size: 16}) : ""}</button>
      <button type="button" class="menu-item" data-profile-act="events">${escapeHtml(tt("profile.events", "Мои события"))}${typeof icon === "function" ? icon("chevron", {size: 16}) : ""}</button>
      <button type="button" class="menu-item" data-profile-act="earnings">${escapeHtml(tt("account.creatorIncome", "Доход автора"))}${typeof icon === "function" ? icon("chevron", {size: 16}) : ""}</button>
      ${me && me.is_admin ? `<button type="button" class="menu-item" data-profile-act="moderation">${escapeHtml(modLabel)}${typeof icon === "function" ? icon("chevron", {size: 16}) : ""}</button>` : ""}
    </div>
    <p class="muted lang-row" data-i18n="account.lang">${escapeHtml(tt("account.lang", "Язык"))}</p>
    <div class="chips" id="lang-switch">
      <button type="button" class="chip" data-lang="ru">RU</button>
      <button type="button" class="chip" data-lang="en">EN</button>
      <button type="button" class="chip" data-lang="zh">简体中文</button>
    </div>
    <div class="menu-list">
      <button type="button" class="menu-item" id="profile-help">${escapeHtml(tt("onboard.how", "Как это работает"))}${typeof icon === "function" ? icon("chevron", {size: 16}) : ""}</button>
    </div>`;
  if (typeof applyI18n === "function") applyI18n();
}

function paintWalletSummary(account) {
  const root = document.getElementById("wallet-summary");
  if (!root) return;
  const reserved = account ? account.reserved : 0;
  const positions = account ? account.in_positions : 0;
  root.innerHTML = `<div class="balance-card" id="wallet-balance-card">
    <div class="kicker">${escapeHtml(tt("account.available", "ДОСТУПНО"))}</div>
    <div class="lead">${me ? fmtTon(me.balance) : '<span class="skeleton"></span>'}</div>
    <div class="balance-sub">
      <span>${escapeHtml(tt("account.reserved", "В резерве"))} <b>${fmtTon(reserved)}</b></span>
      <span>${escapeHtml(tt("account.inPositionsShort", "В позициях"))} <b>${fmtTon(positions)}</b></span>
    </div>`;
  const avail = document.getElementById("withdraw-available");
  if (avail) avail.textContent = me ? fmtTon(me.balance) : "";
}

function paintAccountOverview() {
  const overview = document.getElementById("account-overview");
  if (!overview) return;
  overview.innerHTML = "";
}

function showAccountSection(name) {
  document.querySelectorAll("#account-nav [data-account]").forEach(btn => {
    btn.classList.toggle("on", btn.dataset.account === name);
  });
  document.querySelectorAll("[data-account-panel]").forEach(panel => {
    panel.hidden = panel.getAttribute("data-account-panel") !== name;
  });
}

function setWalletNet(net) {
  const sol = net === "solana";
  const label = sol ? "Solana" : "TON";
  const asset = sol ? "SOL" : "TON";
  document.querySelectorAll("#wallet-nets [data-net]").forEach(btn => {
    btn.classList.toggle("on", btn.dataset.net === net);
  });
  ["deposit-net-label", "deposit-net-info", "withdraw-net-label"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });
  const assetEl = document.getElementById("deposit-asset-label");
  if (assetEl) assetEl.textContent = asset;
}

function showWalletTab(name) {
  document.querySelectorAll("#wallet-tabs [data-wtab]").forEach(btn => {
    btn.classList.toggle("on", btn.dataset.wtab === name);
  });
  document.querySelectorAll("[data-wpanel]").forEach(panel => {
    panel.hidden = panel.getAttribute("data-wpanel") !== name;
  });
}

function openWallet(tab) {
  if (typeof showTab === "function") showTab("wallet");
  if (tab) showWalletTab(tab);
}

function previewWithdraw() {
  const receive = document.getElementById("withdraw-receive");
  const amount = Number(document.getElementById("withdraw-amount")?.value || 0);
  if (!receive) return;
  receive.textContent = Number.isFinite(amount) && amount > 0 ? fmtTon(amount) : "";
}
