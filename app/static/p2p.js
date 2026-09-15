function tt(key, fallback, vars) {
  if (typeof t === "function") {
    const value = t(key, vars);
    if (value && value !== key) return value;
  }
  let text = fallback == null ? key : fallback;
  if (vars) {
    Object.keys(vars).forEach((name) => {
      text = String(text).split("{" + name + "}").join(String(vars[name]));
    });
  }
  return text;
}

function fmtP2P(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n * 10000) / 10000;
  const digits = Math.abs(rounded * 100 - Math.round(rounded * 100)) < 1e-9 ? 2 : 4;
  return rounded.toLocaleString((typeof localeTag === "function" ? localeTag() : "ru-RU"), {minimumFractionDigits: 2, maximumFractionDigits: digits}) + " TON";
}

function moderationActions(m) {
  if (!me?.is_admin || m.status !== "pending") return "";
  return `<p class="muted">${m.mechanism === "p2p" ? tt("mod.noLock", "Залог для P2P не нужен.") : tt("mod.lock", "Залог: {amt}", {amt: fmtP2P(m.lock_ton || 0)})}</p>
    <textarea class="reject-reason" maxlength="1000" placeholder="${escapeHtml(tt("mod.reasonPh", "Причина отклонения"))}"></textarea>
    <div class="row"><button data-act="approve" class="yes">${escapeHtml(tt("mod.approve", "Одобрить"))}</button>
    <button data-act="reject" class="no">${escapeHtml(tt("mod.reject", "Отклонить"))}</button></div>`;
}

const P2P_CANCEL_WARNING = "Все ставки по событию будут возвращены. Сервисный сбор не удерживается";

function p2pCancelPayload(reason) {
  const text = String(reason || "").trim();
  if (!text) throw new Error(tt("mod.cancelNeed", "Укажите причину отмены"));
  if (text.length > 1000) throw new Error(tt("mod.cancelLong", "Причина отмены слишком длинная"));
  return { reason: text, warning: tt("mod.cancelWarn", P2P_CANCEL_WARNING) };
}

function p2pCancelConfirmText(reason) {
  const payload = p2pCancelPayload(reason);
  return tt("mod.cancelReason", "Причина: {reason}", {reason: payload.reason}) + "\n\n" + payload.warning;
}

function p2pCancelControls(m) {
  if (!me?.is_admin || (m.status !== "open" && m.status !== "closed")) return "";
  return `<textarea class="cancel-reason" maxlength="1000" placeholder="${escapeHtml(tt("mod.cancelPh", "Причина отмены"))}"></textarea>
    <button class="no" data-act="p2p-cancel">${escapeHtml(tt("mod.cancel", "Отменить событие"))}</button>`;
}

function p2pStatusLabel(m) {
  if (m.status === "cancelled") return tt("status.cancelledOne", "Отменено");
  if (typeof feedStatus === "function") return feedStatus(m).text;
  if (m.status === "open") return tt("status.active", "Активно");
  return statusLabel(m.status);
}

function creatorButton(m) {
  if (!m.creator) return "";
  const label = m.creator.telegram_username ? ("@" + m.creator.telegram_username) : m.creator.display_name;
  return `<button type="button" class="ghost compact" data-open-creator="${m.creator.id}">${escapeHtml(label)}</button>`;
}

function marketStatsLine(m) {
  const act = m.activity;
  const volume = act && act.volume != null ? act.volume : (m.pot || 0);
  const people = act && act.unique_participants != null ? act.unique_participants : 0;
  return `<div class="event-stats">
    <span><b>${escapeHtml(typeof fmtTon === "function" ? fmtTon(volume) : fmtP2P(volume))}</b> ${escapeHtml(tt("creators.volume", "оборот"))}</span>
    <span><b>${escapeHtml(String(people))}</b> ${escapeHtml(tt("creators.people", "участники"))}</span>
  </div>`;
}

function eventHead(m) {
  const closeLeft = typeof formatTimeLeft === "function" ? formatTimeLeft(m.close_at) : "";
  const cat = typeof catLabel === "function" ? catLabel(m.category) : (m.category || "");
  const share = (m.share_token || m.visibility === "unlisted")
    ? '<button type="button" class="ghost compact" data-act="share">' + (typeof icon === "function" ? icon("share", {size: 16}) + " " : "") + escapeHtml(tt("share", "Поделиться")) + "</button>"
    : "";
  return `<div class="feed-top">
      <span class="feed-cat">${escapeHtml(cat)}</span>
      <span class="feed-time">${closeLeft ? ((typeof icon === "function" ? icon("clock", {size: 14}) + " " : "") + escapeHtml(closeLeft)) : ""}</span>
    </div>
    <div class="question event-question">${escapeHtml(m.question)}</div>
    <p class="event-meta-line">${creatorButton(m)} ${share}</p>
    ${marketStatsLine(m)}`;
}

function userPnLHtml(m) {
  const settlements = (typeof mineState !== "undefined" && mineState.settlements) || [];
  const row = settlements.find(s => Number(s.market_id) === Number(m.id));
  if (row && typeof historyResultLine === "function") {
    const result = historyResultLine(row);
    if (!result || !result.text) return "";
    if (row.settlement_kind === "void") return "";
    const cls = result.cls === "win" ? "win" : (result.cls === "loss" ? "loss" : "");
    const label = result.cls === "win"
      ? tt("market.yourWin", "Выигрыш {amt}", {amt: result.text.replace(/^\+/, "")})
      : (result.cls === "loss" ? tt("market.yourLoss", "Проигрыш {amt}", {amt: result.text.replace(/^\-/, "").replace(/^\u2212/, "")}) : result.text);
    return `<p class="result-pnl ${cls}">${escapeHtml(result.cls === "win" ? ("+" + result.text.replace(/^\+/, "")) : result.text)}</p><p class="muted">${escapeHtml(label)}</p>`;
  }
  const pos = (typeof myPositions !== "undefined") ? myPositions[m.id] : null;
  if (!pos) return "";
  const parts = p2pPositionParts(pos);
  if (!parts.length) return "";
  const winName = m.winning_outcome;
  const won = parts.some(p => p.outcome === winName);
  if (won) {
    const part = parts.find(p => p.outcome === winName);
    const pnl = Number(part.payout || 0) - Number(part.staked || 0);
    return `<p class="result-pnl win">${escapeHtml(tt("market.yourWin", "Выигрыш {amt}", {amt: fmtP2P(Math.max(0, pnl))}))}</p>`;
  }
  const lost = parts.reduce((s, p) => s + Number(p.staked || 0), 0);
  return `<p class="result-pnl loss">${escapeHtml(tt("market.yourLoss", "Проигрыш {amt}", {amt: fmtP2P(lost)}))}</p>`;
}

function adminEventControls(m) {
  const names = marketOutcomes(m);
  const admin = me?.is_admin;
  const canResolve = admin && m.status === "closed";
  return `${moderationActions(m)}
    ${admin && m.status === "open" ? '<button class="ghost" data-act="close">' + escapeHtml(tt("mod.close", "Стоп ставки")) + "</button>" : ""}
    ${canResolve ? names.map((n,i)=>`<button class="ghost" data-act="resolve" data-outcome="${i}" data-label="${escapeHtml(n)}">${escapeHtml(tt("mod.resolve", "Рассчитать: {name}", {name: n}))}</button>`).join("") : ""}
    ${p2pCancelControls(m)}`;
}

function bookDetails(m) {
  return `<details class="p2p-depth"><summary>${escapeHtml(tt("market.book", "Стакан заявок"))}</summary>
      <div class="p2p-book-full"></div>
    </details>
    <details class="fees-box"><summary>${escapeHtml(tt("market.rules", "Правила события"))}</summary>
      <p>${escapeHtml(tt("create.feesP2p", "Это P2P-рынок: коэффициенты задают сами пользователи, букмекера нет. Заявка резервирует сумму и ждёт встречную."))}</p>
      <p>${escapeHtml(tt("create.feesFee", "0% за создание события и размещение заявки. Сервисный сбор — 1% только с чистой прибыли победителя."))}</p>
      <p>${escapeHtml(tt("create.feesCancel", "Если событие отменят, исполненные ставки и незакрытый остаток заявки вернутся без сервисного сбора."))}</p>
    </details>`;
}

function closedMarketCard(m) {
  const act = m.activity;
  const volume = act && act.volume != null ? act.volume : (m.pot || 0);
  const people = act && act.unique_participants != null ? act.unique_participants : 0;
  return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p" data-share-token="${escapeHtml(m.share_token || "")}" data-trade-mode="closed">
    <div class="result-hero"><div class="kicker">${escapeHtml(tt("market.acceptingEnded", "Приём завершён"))}</div></div>
    <div class="question event-question">${escapeHtml(m.question)}</div>
    ${marketStatsLine(m)}
    <p class="muted">${escapeHtml(tt("market.waitingResult", "Ожидается результат"))}</p>
    ${adminEventControls(m)}
  </div>`;
}

function resolvedMarketCard(m) {
  return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p" data-share-token="${escapeHtml(m.share_token || "")}" data-trade-mode="closed">
    <div class="result-hero"><div class="kicker">${escapeHtml(tt("market.settled", "Завершено"))}</div></div>
    <div class="question event-question">${escapeHtml(m.question)}</div>
    ${m.winning_outcome ? `<p><b>${escapeHtml(tt("market.won", "Победил: {name}", {name: m.winning_outcome}))}</b></p>` : ""}
    ${marketStatsLine(m)}
    ${userPnLHtml(m)}
    ${adminEventControls(m)}
  </div>`;
}

function cancelledMarketCard(m) {
  return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p" data-share-token="${escapeHtml(m.share_token || "")}" data-trade-mode="closed">
    <div class="result-hero"><div class="kicker">${escapeHtml(tt("market.cancelled", "Событие отменено"))}</div></div>
    <div class="question event-question">${escapeHtml(m.question)}</div>
    <p>${escapeHtml(tt("market.refunded", "Средства возвращены."))}</p>
    ${m.cancellation_reason ? `<p class="muted">${escapeHtml(m.cancellation_reason)}</p>` : ""}
    ${adminEventControls(m)}
  </div>`;
}

function simpleP2PCard(m) {
  const names = marketOutcomes(m);
  const yes = names[0] || tt("outcome.yes", "Да");
  const no = names[1] || tt("outcome.no", "Нет");
  return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p" data-share-token="${escapeHtml(m.share_token || "")}" data-trade-mode="simple">
    ${eventHead(m)}
    ${(m.visibility === "unlisted") ? '<span class="status-pill status-wait">' + escapeHtml(tt("private.badge", "Приватное")) + "</span>" : ""}
    <div class="best-board simple-quotes">
      <button type="button" class="quote-cell yes-acc on" data-simple-outcome="0">
        <span class="best-name">${escapeHtml(yes)}</span>
        <span class="best-odds">—</span>
        <span class="best-vol">${escapeHtml(tt("feed.noOffers", "Нет предложений"))}</span>
      </button>
      <button type="button" class="quote-cell no-acc" data-simple-outcome="1">
        <span class="best-name">${escapeHtml(no)}</span>
        <span class="best-odds">—</span>
        <span class="best-vol">${escapeHtml(tt("feed.noOffers", "Нет предложений"))}</span>
      </button>
    </div>
    <div class="p2p-form event-bet">
      <select class="p2p-side">${names.map((n,i)=>`<option value="${i}">${escapeHtml(n)}</option>`).join("")}</select>
      <input class="p2p-odds" type="hidden" value="2">
      <label>${escapeHtml(tt("market.amount", "Сумма"))}</label>
      <div class="amount-wrap">
        ${typeof icon === "function" ? icon("wallet", {size: 18}) : ""}
        <input class="p2p-money" type="number" min="0.01" step="0.01" value="100" inputmode="decimal">
        <span class="amount-unit">TON</span>
      </div>
      <div class="amount-chips">
        <button type="button" data-amt="10">10</button>
        <button type="button" data-amt="50">50</button>
        <button type="button" class="on" data-amt="100">100</button>
        <button type="button" data-amt="500">500</button>
      </div>
      <div class="p2p-preview muted"></div>
      <button class="gold simple-cta" data-act="p2p-simple" disabled>${escapeHtml(tt("market.ownOdds", "Выставить свой коэффициент"))}</button>
      <p class="own-odds-hint">${escapeHtml(tt("market.ownOddsHint", "Не устраивает коэффициент?"))}</p>
      <button type="button" class="ghost own-odds-btn" data-act="open-advanced">${escapeHtml(tt("market.ownOdds", "Выставить свой коэффициент"))}</button>
    </div>
    ${bookDetails(m)}
    ${adminEventControls(m)}
  </div>`;
}

function advancedP2PCard(m) {
  const names = marketOutcomes(m);
  const yes = names[0] || tt("outcome.yes", "Да");
  const no = names[1] || tt("outcome.no", "Нет");
  return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p" data-share-token="${escapeHtml(m.share_token || "")}" data-trade-mode="advanced">
    <div class="question">${escapeHtml(tt("advanced.title", "Свой коэффициент"))}</div>
    <label>${escapeHtml(tt("advanced.pick", "Выберите исход"))}</label>
    <div class="side-picks">
      <button type="button" class="side-pick on-yes" data-outcome="0">${escapeHtml(yes)}</button>
      <button type="button" class="side-pick" data-outcome="1">${escapeHtml(no)}</button>
    </div>
    <select class="p2p-side">${names.map((n,i)=>`<option value="${i}">${escapeHtml(n)}</option>`).join("")}</select>
    <label>${escapeHtml(tt("advanced.yourOdds", "Ваш коэффициент"))}</label>
    <div class="odds-step">
      <button type="button" data-act="odds-dec">${typeof icon === "function" ? icon("minus", {size: 18}) : "−"}</button>
      <input class="p2p-odds" type="number" min="1.00001" step="0.01" value="1.90" inputmode="decimal">
      <button type="button" data-act="odds-inc">${typeof icon === "function" ? icon("plus", {size: 18}) : "+"}</button>
    </div>
    <label>${escapeHtml(tt("market.amount", "Сумма"))}</label>
    <div class="amount-wrap">
      <input class="p2p-money" type="number" min="0.01" step="0.01" value="100" inputmode="decimal">
      <span class="amount-unit">TON</span>
    </div>
    <div class="p2p-preview muted">${escapeHtml(tt("event.previewHint", "Введите сумму и коэффициент — покажем, что исполнится сразу, а что останется заявкой."))}</div>
    <div class="row"><button class="gold" data-act="p2p-limit">${escapeHtml(tt("advanced.place", "Разместить заявку"))}</button></div>
    <details class="p2p-depth" open><summary>${escapeHtml(tt("market.book", "Стакан заявок"))}</summary>
      <div class="p2p-book-full"></div>
    </details>
    ${adminEventControls(m)}
  </div>`;
}

function p2pCard(m, mode) {
  const names = marketOutcomes(m);
  const accepting = !!m.accepting_bets && m.status !== "cancelled";
  if (m.status === "cancelled") return cancelledMarketCard(m);
  if (m.status === "resolved") return resolvedMarketCard(m);
  if (m.status === "closed" || (m.status === "open" && !accepting)) return closedMarketCard(m);
  if (m.status === "pending" || m.status === "rejected") {
    return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p" data-share-token="${escapeHtml(m.share_token || "")}">
      <span class="status-pill status-${m.status === "pending" ? "wait" : "rejected"}">${escapeHtml(p2pStatusLabel(m))}</span>
      <div class="question event-question">${escapeHtml(m.question)}</div>
      ${m.status === "pending" ? '<p class="muted">' + escapeHtml(tt("event.pending", "На проверке. Рынок появится в ленте после одобрения. Залог не нужен.")) + "</p>" : ""}
      ${m.status === "rejected" ? `<p class="muted">${escapeHtml(tt("event.rejected", "Отклонено: {reason}", {reason: m.rejection_reason || ""}))}</p>` : ""}
      ${adminEventControls(m)}
    </div>`;
  }
  const tradeMode = mode || (typeof eventTradeMode !== "undefined" ? eventTradeMode : "simple");
  if (tradeMode === "advanced") return advancedP2PCard(m);
  return simpleP2PCard(m);
}

function p2pPreviewModel(data, terms, balance) {
  const requested = data.requested || {};
  const money = Number(terms.money);
  const odds = Number(terms.odds);
  const name = terms.outcomeName || "";
  const matched = Number(requested.matched || 0);
  const remaining = Number(requested.remaining || (matched > 0 ? 0 : money));
  const rows = [];
  rows.push({label: tt("preview.sum", "Ваша сумма"), value: fmtP2P(money), key: "sum"});
  rows.push({label: tt("preview.odds", "Коэффициент"), value: tt("preview.oddsVal", "не ниже {odds}", {odds: Number(odds).toFixed(2)}) + (name ? (" · «" + name + "»") : ""), key: "odds"});
  rows.push({label: tt("preview.now", "Исполнится сейчас"), value: fmtP2P(matched), key: "now"});
  rows.push({label: tt("preview.rest", "Останется заявкой"), value: fmtP2P(remaining), key: "rest"});
  let note = "";
  if (matched <= 0) {
    note = tt("preview.noMatch", "Сейчас встречного предложения нет. Заявка будет ждать другого пользователя.");
  } else if (remaining > 0) {
    note = tt("preview.split", "Сумма разделится на две части: исполненная — сразу, остаток будет ждать другого пользователя.");
    if (requested.payout) {
      rows.push({label: tt("preview.payout", "Возможная выплата"), value: tt("preview.payoutPart", "{amt} по исполненной части", {amt: fmtP2P(requested.payout)}), key: "payout"});
    }
  } else if (requested.payout) {
    rows.push({label: tt("preview.payout", "Возможная выплата"), value: fmtP2P(requested.payout), key: "payout"});
  }
  if (remaining > 0 && odds > 1 && matched > 0) {
    note += tt("preview.noGuarantee", " Выплата по ещё неисполненной части появится только если найдётся контрагент — это не гарантия.");
  }
  return {rows, note, matched, remaining, balance};
}

function p2pPreviewLines(data, terms, balance) {
  const model = p2pPreviewModel(data, terms, balance);
  const lines = model.rows.map(row => row.label + ": " + row.value);
  if (model.note) lines.push(model.note);
  return lines;
}

function p2pPreviewHtml(data, terms, balance) {
  const model = p2pPreviewModel(data, terms, balance);
  const rows = model.rows.map(row =>
    '<div class="preview-row preview-' + row.key + '"><span>' + escapeHtml(row.label) + "</span><b>" + escapeHtml(row.value) + "</b></div>"
  ).join("");
  const note = model.note ? '<p class="preview-note">' + escapeHtml(model.note) + "</p>" : "";
  return rows + note;
}

function simplePreviewHtml(data, terms) {
  const requested = data.requested || {};
  const money = Number(terms.money);
  const matched = Number(requested.matched || 0);
  const leftover = Math.max(0, money - matched);
  const payout = Number(requested.payout || 0);
  if (matched <= 0) {
    return '<div class="no-liq"><strong>' + escapeHtml(tt("market.noLiq", "Сейчас нет встречного предложения")) +
      '</strong><div><button type="button" class="ghost compact" data-act="open-help">' +
      escapeHtml(tt("market.how", "Как это работает?")) + "</button></div></div>";
  }
  let html = "";
  if (leftover > 0.0001) {
    html += '<div class="preview-row preview-now"><span>' + escapeHtml(tt("market.fillNow", "Исполнится сейчас")) + "</span><b>" + escapeHtml(fmtP2P(matched)) + "</b></div>";
    html += '<div class="preview-row preview-rest"><span>' + escapeHtml(tt("market.rest", "Остаток")) + "</span><b>" + escapeHtml(fmtP2P(leftover)) + "</b></div>";
  }
  if (payout > 0) {
    html += '<div class="payout-row"><span>' + escapeHtml(tt("market.payout", "Возможная выплата")) + "</span><b>" + escapeHtml(fmtP2P(payout)) + "</b></div>";
  }
  return html;
}

function p2pPlaceToast(result) {
  const filled = Number(result.filled || 0);
  const remaining = Number(result.remaining || 0);
  const refunded = Number(result.refunded || 0);
  if (filled > 0 && remaining > 0) {
    return tt("toast.partial", "Заявка частично исполнена: {filled}. Остаток {rest} ждёт контрагента.", {filled: fmtP2P(filled), rest: fmtP2P(remaining)});
  }
  if (filled > 0) return tt("toast.filled", "Заявка полностью исполнена: {filled}.", {filled: fmtP2P(filled)});
  if (remaining > 0) return tt("toast.waiting", "Заявка создана и ожидает контрагента: {rest}.", {rest: fmtP2P(remaining)});
  if (refunded > 0) return tt("toast.refunded", "Исполнить сразу не удалось. Возвращено {amt}.", {amt: fmtP2P(refunded)});
  return tt("toast.created", "Заявка создана.");
}

function p2pOfferLine(name, best) {
  if (!best) return "<b>" + escapeHtml(name) + "</b>: " + escapeHtml(tt("book.noneLine", "нет предложений"));
  return "<b>" + escapeHtml(name) + "</b>: " + tt("book.available", "{amt} доступно", {amt: "до " + fmtP2P(best.available)}) + " · " + Number(best.odds).toFixed(2);
}

function sameOffer(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Number(a.odds) === Number(b.odds) && Number(a.available) === Number(b.available);
}

function bestOfferCell(name, best, mineBest, outcome, authenticated) {
  const empty = !best;
  const cls = outcome === 0 ? "yes-acc" : "no-acc";
  const odds = empty ? "—" : Number(best.odds).toFixed(2);
  const vol = empty ? tt("feed.noOffers", "Нет предложений") : tt("book.available", "{amt} доступно", {amt: fmtP2P(best.available)});
  let mine = "";
  if (authenticated) {
    if (!mineBest) {
      mine = '<span class="best-you">' + escapeHtml(tt("book.youNone", "Доступно вам сейчас: нет предложений")) + "</span>";
    } else if (!sameOffer(best, mineBest)) {
      mine = '<span class="best-you">' + escapeHtml(tt("book.youNow", "Доступно вам сейчас: {odds} · {amt}", {odds: Number(mineBest.odds).toFixed(2), amt: fmtP2P(mineBest.available)})) + "</span>";
    }
  }
  const attrs = empty ? "" : ' data-prefill-outcome="' + outcome + '" data-prefill-odds="' + Number(best.odds) + '"';
  const tag = empty ? "div" : 'button type="button"';
  const close = empty ? "div" : "button";
  return "<" + tag + ' class="best-cell ' + cls + '"' + attrs + ">" +
    '<span class="best-name">' + escapeHtml(name) + "</span>" +
    '<span class="best-odds">' + odds + "</span>" +
    '<span class="best-vol">' + escapeHtml(vol) + "</span>" +
    mine + "</" + close + ">";
}

function paintQuoteCell(cell, best) {
  if (!cell) return;
  const oddsEl = cell.querySelector(".best-odds");
  const volEl = cell.querySelector(".best-vol");
  if (!best) {
    if (oddsEl) oddsEl.textContent = "—";
    if (volEl) volEl.textContent = tt("feed.noOffers", "Нет предложений");
    cell.removeAttribute("data-prefill-odds");
    return;
  }
  if (oddsEl) oddsEl.textContent = Number(best.odds).toFixed(2);
  if (volEl) volEl.textContent = tt("market.available", "доступно {amt}", {amt: fmtP2P(best.available)});
  cell.setAttribute("data-prefill-odds", String(best.odds));
}

function bookDepthTable(name, levels) {
  if (!levels || !levels.length) {
    return '<div class="depth-block"><div class="depth-name">' + escapeHtml(name) +
      '</div><p class="muted">' + escapeHtml(tt("book.noOrders", "нет заявок")) + "</p></div>";
  }
  const rows = levels.map(x =>
    '<tr><td class="num">' + Number(x.odds).toFixed(2) + '</td><td class="num">' + fmtP2P(x.available) + "</td></tr>"
  ).join("");
  return '<div class="depth-block"><div class="depth-name">' + escapeHtml(name) +
    "</div><table class=\"book-table\"><thead><tr><th>" + escapeHtml(tt("book.coef", "Коэф.")) + "</th><th>" + escapeHtml(tt("book.availCol", "Доступно")) + "</th></tr></thead><tbody>" +
    rows + "</tbody></table></div>";
}

function applyBestOddsPrefill(card, outcome, odds) {
  const idx = Number(outcome);
  const select = card.querySelector(".p2p-side");
  if (select) select.value = String(idx);
  card.querySelectorAll(".side-pick").forEach(btn => {
    const i = Number(btn.dataset.outcome);
    btn.classList.toggle("on-yes", i === idx && i === 0);
    btn.classList.toggle("on-no", i === idx && i === 1);
  });
  card.querySelectorAll("[data-simple-outcome]").forEach(btn => {
    btn.classList.toggle("on", Number(btn.dataset.simpleOutcome) === idx);
  });
  if (odds != null && odds !== "") {
    const oddsInput = card.querySelector(".p2p-odds");
    if (oddsInput) {
      const n = Number(odds);
      if (Number.isFinite(n)) oddsInput.value = String(Math.round(n * 100) / 100);
    }
  }
}

function executableLiquidity(data, outcome) {
  if (data && Array.isArray(data.available_to_me)) {
    return !!(data.available_to_me[outcome] && data.available_to_me[outcome][0]);
  }
  if (data && Array.isArray(data.sides)) {
    return !!(data.sides[outcome] && data.sides[outcome][0]);
  }
  return true;
}

function executableBest(data, outcome) {
  if (data && Array.isArray(data.available_to_me)) {
    return data.available_to_me[outcome] && data.available_to_me[outcome][0];
  }
  return data && data.sides && data.sides[outcome] && data.sides[outcome][0];
}

async function hydrateP2P(card) {
  const mode = card.dataset.tradeMode || "simple";
  const data = await api("/markets/" + card.dataset.id + "/orderbook");
  card.orderbookData = data;
  const select = card.querySelector(".p2p-side");
  const names = select ? [...select.options].map(o => o.textContent) : [tt("outcome.yes", "Да"), tt("outcome.no", "Нет")];
  if (mode === "simple") {
    names.forEach((_, i) => {
      const cell = card.querySelector('[data-simple-outcome="' + i + '"]');
      paintQuoteCell(cell, executableBest(data, i));
    });
  }
  const depth = card.querySelector(".p2p-book-full");
  if (depth) {
    const tables = names.map((name, i) => bookDepthTable(name, data.sides[i] || [])).join("");
    depth.innerHTML = '<div class="book-cols">' + tables + "</div>";
  }
  if (me) {
    if (mode === "simple") await p2pSimpleQuote(card);
    else await p2pQuote(card);
  }
}

function p2pTerms(card) {
  const select = card.querySelector(".p2p-side");
  const option = select && select.options[select.selectedIndex];
  return {outcome: Number(select ? select.value : 0),
          money: card.querySelector(".p2p-money").value,
          odds: card.querySelector(".p2p-odds").value,
          outcomeName: option ? option.textContent : ""};
}

async function p2pSimpleQuote(card) {
  const preview = card.querySelector(".p2p-preview");
  const button = card.querySelector("[data-act='p2p-simple']");
  if (!preview) return;
  const version = (card.quoteVersion || 0) + 1;
  card.quoteVersion = version;
  card.availableQuote = null;
  if (button) button.disabled = true;
  if (!me) {
    preview.textContent = typeof OPEN_IN_TG !== "undefined" ? OPEN_IN_TG : tt("err.openInTg", "Откройте BetTON через Telegram");
    return;
  }
  const terms = p2pTerms(card);
  const money = Number(terms.money);
  const best = executableBest(card.orderbookData, terms.outcome);
  if (!best) {
    if (card.classList) card.classList.add("simple-no-liq");
    preview.innerHTML = simplePreviewHtml({requested: {matched: 0}}, terms);
    if (button) {
      button.disabled = false;
      button.textContent = tt("market.ownOdds", "Выставить свой коэффициент");
      button.dataset.fallback = "advanced";
    }
    return;
  }
  if (card.classList) card.classList.remove("simple-no-liq");
  if (button) button.dataset.fallback = "";
  const oddsInput = card.querySelector(".p2p-odds");
  if (oddsInput) oddsInput.value = String(Math.round(Number(best.odds) * 100) / 100);
  if (!money || money <= 0) {
    preview.innerHTML = "";
    return;
  }
  if (Number(me.balance) < money) {
    preview.textContent = tt("err.fundsAvail", "Недостаточно средств. Доступно {amt}.", {amt: fmtP2P(me.balance)});
    return;
  }
  try {
    const payload = {outcome: terms.outcome, money: terms.money, odds: Number(best.odds)};
    const data = await api("/markets/" + card.dataset.id + "/orders/quote", {method: "POST", body: JSON.stringify(payload)});
    if (version !== card.quoteVersion || !me || authBlocked) return;
    preview.classList.remove("preview-error");
    preview.innerHTML = simplePreviewHtml(data, {money: terms.money, outcomeName: terms.outcomeName});
    const matched = Number((data.requested && data.requested.matched) || 0);
    if (matched > 0 && executableLiquidity(card.orderbookData, terms.outcome)) {
      const takeOdds = (data.available && data.available.worst_odds) ? data.available.worst_odds : Number(best.odds);
      card.availableQuote = {terms: JSON.stringify({outcome: terms.outcome, money: terms.money, odds: Number(best.odds)}), odds: Math.min(10000, Math.floor(takeOdds * 1e6) / 1e6)};
      if (button) {
        button.disabled = false;
        button.textContent = tt("market.betCtaOdds", "Поставить {amt} на {name} по {odds}", {
          amt: fmtP2P(matched),
          name: terms.outcomeName,
          odds: Number(best.odds).toFixed(2)
        });
      }
    } else if (button) {
      button.disabled = false;
      button.textContent = tt("market.ownOdds", "Выставить свой коэффициент");
      button.dataset.fallback = "advanced";
    }
  } catch (e) {
    if (version === card.quoteVersion) preview.textContent = (typeof friendlyError === "function" ? friendlyError(e.message) : e.message);
  }
}

async function p2pQuote(card) {
  if ((card.dataset.tradeMode || "simple") === "simple") return p2pSimpleQuote(card);
  const preview = card.querySelector(".p2p-preview");
  if (!preview) return;
  const version = (card.quoteVersion || 0) + 1;
  card.quoteVersion = version;
  const button = card.querySelector("[data-act='p2p-ioc']");
  if (button) {
    button.disabled = true;
    button.textContent = tt("event.ioc", "Принять доступное");
  }
  card.availableQuote = null;
  if (!me) { preview.textContent = typeof OPEN_IN_TG !== "undefined" ? OPEN_IN_TG : tt("err.openInTg", "Откройте BetTON через Telegram"); return; }
  try {
    const terms = p2pTerms(card);
    const money = Number(terms.money);
    if (!money || money <= 0) {
      preview.textContent = tt("event.previewHint", "Введите сумму и коэффициент — покажем, что исполнится сразу, а что останется заявкой.");
      return;
    }
    if (Number(me.balance) < money) {
      preview.textContent = tt("err.fundsAvail", "Недостаточно средств. Доступно {amt}.", {amt: fmtP2P(me.balance)});
      return;
    }
    const payload = {outcome: terms.outcome, money: terms.money, odds: terms.odds};
    const data = await api("/markets/"+card.dataset.id+"/orders/quote", {method:"POST", body:JSON.stringify(payload)});
    if (version !== card.quoteVersion || !me || authBlocked) return;
    const available = data.available;
    preview.classList.remove("preview-error");
    preview.innerHTML = p2pPreviewHtml(data, terms, me.balance);
    if (available && available.matched && executableLiquidity(card.orderbookData, terms.outcome)) {
      card.availableQuote = {terms: JSON.stringify(payload),
                             odds: Math.min(10000, Math.floor(available.worst_odds*1e6)/1e6)};
      if (button) {
        button.disabled = false;
        button.textContent = tt("event.iocLive", "Принять {amt} · не ниже {odds}", {amt: fmtP2P(available.matched), odds: card.availableQuote.odds.toFixed(4)});
      }
    }
  } catch(e) {
    if (version === card.quoteVersion) preview.textContent = (typeof friendlyError === "function" ? friendlyError(e.message) : e.message);
  }
}

async function p2pPlace(card, kind) {
  requireLogin();
  const terms = p2pTerms(card);
  const payload = {outcome: Number(terms.outcome), money: terms.money, odds: Number(terms.odds)};
  if (Number(me.balance) < Number(terms.money)) {
    throw new Error(tt("err.fundsAvail", "Недостаточно средств. Доступно {amt}.", {amt: fmtP2P(me.balance)}));
  }
  if (kind === "ioc") {
    const quoted = card.availableQuote && JSON.parse(card.availableQuote.terms);
    const same = quoted && Number(quoted.outcome) === payload.outcome && String(quoted.money) === String(payload.money) && Number(quoted.odds) === payload.odds;
    if (!same) throw new Error("Обновите предложение");
    payload.odds = card.availableQuote.odds;
  }
  const fingerprint = JSON.stringify({...payload, kind});
  if (card.orderFingerprint !== fingerprint) {
    card.orderFingerprint = fingerprint;
    card.orderRequestId = crypto.randomUUID();
  }
  const result = await api("/markets/"+card.dataset.id+"/orders", {method:"POST",
    body:JSON.stringify({...payload, kind, request_id:card.orderRequestId})});
  card.orderRequestId = null;
  card.orderFingerprint = null;
  toast(p2pPlaceToast(result));
}

function orderStatusText(o) {
  if (o.status === "open" && Number(o.filled) > 0 && Number(o.remaining) > 0) return tt("order.partial", "Частично исполнена");
  if (o.status === "open") return tt("order.wait", "Ждёт исполнения");
  if (o.status === "filled") return tt("order.filled", "Исполнена");
  if (o.status === "cancelled") return tt("order.cancelled", "Отменена");
  if (o.status === "expired") return tt("order.expired", "Приём завершён");
  return o.status;
}

function orderStatusKey(o) {
  if (o.status === "open" && Number(o.filled) > 0 && Number(o.remaining) > 0) return "open";
  if (o.status === "open") return "wait";
  if (o.status === "filled") return "resolved";
  if (o.status === "cancelled") return "cancelled";
  if (o.status === "expired") return "closed";
  return "closed";
}

function groupOrdersByEvent(orders) {
  const groups = [];
  const index = {};
  (orders || []).forEach(order => {
    const id = order.market_id;
    if (index[id] == null) {
      index[id] = groups.length;
      groups.push({
        market_id: id,
        question: order.question || tt("order.event", "Событие #{id}", {id: id}),
        orders: []
      });
    }
    groups[index[id]].orders.push(order);
  });
  return groups;
}

function orderCard(o) {
  const open = o.status === "open";
  const filled = Number(o.filled || 0);
  const amount = Number(o.amount || 0);
  const partial = open && filled > 0 && Number(o.remaining) > 0;
  return `<div class="card order-card" data-open-market="${o.market_id}">
    <p class="order-outcome">${escapeHtml(tt("order.atOdds", "{name} по {odds}", {name: o.outcome_name || tt("order.outcome", "исход {n}", {n: Number(o.outcome) + 1}), odds: Number(o.odds).toFixed(2)}))}</p>
    <p><b>${fmtP2P(o.amount)}</b></p>
    <span class="status-pill status-${orderStatusKey(o)}">${escapeHtml(orderStatusText(o))}</span>
    ${partial ? `<p class="muted">${escapeHtml(tt("order.filledOf", "Исполнено {filled} / {total}", {filled: fmtP2P(filled), total: fmtP2P(amount)}))}</p>` : ""}
    ${open ? `<button class="ghost" data-cancel-order="${o.id}">${escapeHtml(tt("order.cancelRest", "Отменить остаток"))}</button>` : ""}
  </div>`;
}

function renderMineOrders(orders) {
  if (!orders || !orders.length) {
    return '<div class="empty-state"><strong>' + escapeHtml(tt("empty.ordersTitle", "Нет активных заявок")) + "</strong>" +
      escapeHtml(tt("empty.ordersBody", "Когда вы разместите свою цену, заявка появится здесь.")) +
      '<div><button type="button" class="gold" data-go-feed="1">' + escapeHtml(tt("empty.findMarket", "Найти рынок")) + "</button></div></div>";
  }
  return groupOrdersByEvent(orders).map(group =>
    `<section class="mine-group">
      <h3 class="mine-group-title">${escapeHtml(group.question)}</h3>
      ${group.orders.map(orderCard).join("")}
    </section>`
  ).join("");
}

function p2pPositionParts(pos) {
  const market = pos.market || {};
  const names = (typeof marketOutcomes === "function") ? marketOutcomes(market) : (market.outcomes || ["Да", "Нет"]);
  const shares = pos.shares && pos.shares.length ? pos.shares : [pos.shares_yes || 0, pos.shares_no || 0];
  const costs = pos.costs && pos.costs.length ? pos.costs : [pos.cost_yes || 0, pos.cost_no || 0];
  const parts = [];
  for (let i = 0; i < names.length; i++) {
    const staked = Number(costs[i] || 0);
    if (staked <= 0) continue;
    const payout = Number(shares[i] || 0);
    parts.push({
      outcome: names[i],
      staked,
      avgOdds: payout / staked,
      payout
    });
  }
  return parts;
}

function p2pPositionHtml(pos) {
  const parts = p2pPositionParts(pos);
  if (!parts.length) return '<p class="muted">' + escapeHtml(tt("pos.none", "Исполненных ставок по этому событию нет.")) + "</p>";
  return parts.map(part =>
    `<div class="pos-line">
      <div class="pos-outcome">${escapeHtml(part.outcome)} · ${fmtP2P(part.staked)}</div>
      <p class="muted">${escapeHtml(tt("pos.avgOdds", "Средний коэффициент"))} ${Number(part.avgOdds).toFixed(2)}</p>
    </div>`
  ).join("");
}

async function loadModeration() {
  requireLogin();
  if (!me.is_admin) throw new Error(tt("err.forbidden", "Недостаточно прав"));
  const markets = await api("/moderation/markets");
  requireLogin();
  if (!me.is_admin) return;
  moderationMarkets = markets;
  paintModeration();
}

function paintModeration() {
  const root = document.getElementById("moderation-markets");
  if (!root) return;
  const markets = (typeof moderationMarkets !== "undefined" && moderationMarkets) ? moderationMarkets : [];
  root.innerHTML = markets.length ? markets.map(marketCard).join("") : '<div class="empty-state">' + escapeHtml(tt("mod.empty", "Нет событий на проверке.")) + "</div>";
}
