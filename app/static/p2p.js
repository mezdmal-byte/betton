function fmtP2P(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const rounded = Math.round(n * 10000) / 10000;
  const digits = Math.abs(rounded * 100 - Math.round(rounded * 100)) < 1e-9 ? 2 : 4;
  return rounded.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: digits}) + ' TON';
}

function moderationActions(m) {
  if (!me?.is_admin || m.status !== 'pending') return '';
  return `<p class="muted">${m.mechanism === 'p2p' ? 'Залог для P2P не нужен.' : 'Залог: ' + fmtP2P(m.lock_ton || 0)}</p>
    <textarea class="reject-reason" maxlength="1000" placeholder="Причина отклонения"></textarea>
    <div class="row"><button data-act="approve" class="yes">Одобрить</button>
    <button data-act="reject" class="no">Отклонить</button></div>`;
}

const P2P_CANCEL_WARNING = 'Все ставки по событию будут возвращены. Сервисный сбор не удерживается';

function p2pCancelPayload(reason) {
  const text = String(reason || '').trim();
  if (!text) throw new Error('Укажите причину отмены');
  if (text.length > 1000) throw new Error('Причина отмены слишком длинная');
  return { reason: text, warning: P2P_CANCEL_WARNING };
}

function p2pCancelConfirmText(reason) {
  const payload = p2pCancelPayload(reason);
  return 'Причина: ' + payload.reason + '\n\n' + payload.warning;
}

function p2pCancelControls(m) {
  if (!me?.is_admin || (m.status !== 'open' && m.status !== 'closed')) return '';
  return `<textarea class="cancel-reason" maxlength="1000" placeholder="Причина отмены"></textarea>
    <button class="no" data-act="p2p-cancel">Отменить событие</button>`;
}

function p2pStatusLabel(m) {
  if (m.status === 'cancelled') return 'Отменено';
  if (typeof feedStatus === 'function') return feedStatus(m).text;
  if (m.status === 'open') return 'Активно';
  return statusLabel(m.status);
}

function p2pCard(m) {
  const names = marketOutcomes(m);
  const accepting = !!m.accepting_bets && m.status !== 'cancelled';
  const admin = me?.is_admin;
  const cancelled = m.status === 'cancelled';
  const st = typeof feedStatus === 'function' ? feedStatus(m) : {key: cancelled ? 'cancelled' : m.status, text: p2pStatusLabel(m)};
  const canResolve = admin && m.status === 'closed';
  const yes = names[0] || 'Да';
  const no = names[1] || 'Нет';
  const close = (typeof formatCloseAt === 'function')
    ? formatCloseAt(m.close_at)
    : String(m.close_at || '').replace('T', ' ').slice(0, 16);
  return `<div class="card event-card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p">
    <span class="status-pill status-${st.key}">${escapeHtml(st.text)}</span>
    <div class="question">${escapeHtml(m.question)}</div>
    ${close ? `<p class="muted event-deadline">Приём заявок до ${escapeHtml(close)}</p>` : ''}
    <div class="outcome-pair">
      <span class="out yes-acc">${escapeHtml(yes)}</span>
      <span class="out-vs">или</span>
      <span class="out no-acc">${escapeHtml(no)}</span>
    </div>
    ${m.status === 'pending' ? '<p class="muted">На проверке. Рынок появится в ленте после одобрения. Залог не нужен.</p>' : ''}
    ${m.status === 'rejected' ? `<p class="muted">Отклонено: ${escapeHtml(m.rejection_reason || '')}</p>` : ''}
    ${cancelled ? `<p class="muted">Отменено: ${escapeHtml(m.cancellation_reason || '')}. Исполненные ставки и незакрытый остаток заявок возвращены без сервисного сбора.</p>` : ''}
    ${!cancelled && m.winning_outcome ? `<p>Исход: ${escapeHtml(m.winning_outcome)} · выплаты зачислены</p>` : ''}
    ${accepting ? `<div class="event-offers">
      <div class="event-offers-head">
        <span>Текущие предложения</span>
        <button type="button" class="ghost compact" data-act="p2p-refresh">Обновить</button>
      </div>
      <p class="muted offer-caption">Лучшее предложение рынка. Нажмите коэффициент, чтобы подставить его в заявку.</p>
      <div class="p2p-book muted">Загружаем предложения…</div>
    </div>
      <div class="p2p-form event-bet">
      <p class="event-bet-title">Ваша заявка</p>
      <label>Исход</label>
      <div class="side-picks">
        <button type="button" class="side-pick on-yes" data-outcome="0">${escapeHtml(yes)}</button>
        <button type="button" class="side-pick" data-outcome="1">${escapeHtml(no)}</button>
      </div>
      <select class="p2p-side">${names.map((n,i)=>`<option value="${i}">${escapeHtml(n)}</option>`).join('')}</select>
      <label>Сумма, TON</label><input class="p2p-money" type="number" min="0.01" step="0.01" value="10" inputmode="decimal">
      <label>Коэффициент не ниже</label><input class="p2p-odds" type="number" min="1.00001" step="0.01" value="2" inputmode="decimal">
      <div class="p2p-preview muted">Введите сумму и коэффициент — покажем, что исполнится сразу, а что останется заявкой.</div>
      <div class="row"><button class="gold" data-act="p2p-limit">Оставить заявку</button></div>
      <div class="row"><button class="ghost" data-act="p2p-ioc" disabled>Принять доступное</button></div>
      <p class="muted">Неисполненная сумма резервируется. Остаток можно вернуть отменой заявки в «Мои».</p>
      <p class="muted">0% за создание события и размещение заявки. Сервисный сбор — 1% только с чистой прибыли победителя.</p>
      <p class="muted">Если событие отменят, исполненные ставки и незакрытый остаток заявки вернутся без сервисного сбора.</p>
      </div>
      <details class="p2p-depth"><summary>Все предложения</summary>
        <p class="muted">Публичный стакан рынка. Свою заявку принять нельзя — кнопка «Принять доступное» учитывает только чужие предложения.</p>
        <div class="p2p-book-full"></div>
      </details>` : ''}
    ${moderationActions(m)}
    ${admin && m.status === 'open' ? '<button class="ghost" data-act="close">Стоп ставки</button>' : ''}
    ${canResolve ? names.map((n,i)=>`<button class="ghost" data-act="resolve" data-outcome="${i}" data-label="${escapeHtml(n)}">Рассчитать: ${escapeHtml(n)}</button>`).join('') : ''}
    ${p2pCancelControls(m)}
  </div>`;
}

function p2pPreviewModel(data, terms, balance) {
  const requested = data.requested || {};
  const money = Number(terms.money);
  const odds = Number(terms.odds);
  const name = terms.outcomeName || '';
  const matched = Number(requested.matched || 0);
  const remaining = Number(requested.remaining || (matched > 0 ? 0 : money));
  const rows = [];
  rows.push({label: 'Ваша сумма', value: fmtP2P(money), key: 'sum'});
  rows.push({label: 'Коэффициент', value: 'не ниже ' + Number(odds).toFixed(2) + (name ? (' · «' + name + '»') : ''), key: 'odds'});
  rows.push({label: 'Исполнится сейчас', value: fmtP2P(matched), key: 'now'});
  rows.push({label: 'Останется заявкой', value: fmtP2P(remaining), key: 'rest'});
  let note = '';
  if (matched <= 0) {
    note = 'Сейчас встречного предложения нет. Заявка будет ждать другого пользователя.';
  } else if (remaining > 0) {
    note = 'Сумма разделится на две части: исполненная — сразу, остаток будет ждать другого пользователя.';
    if (requested.payout) {
      rows.push({label: 'Возможная выплата', value: fmtP2P(requested.payout) + ' по исполненной части', key: 'payout'});
    }
  } else if (requested.payout) {
    rows.push({label: 'Возможная выплата', value: fmtP2P(requested.payout), key: 'payout'});
  }
  if (remaining > 0 && odds > 1 && matched > 0) {
    note += ' Выплата по ещё неисполненной части появится только если найдётся контрагент — это не гарантия.';
  }
  return {rows, note, matched, remaining, balance};
}

function p2pPreviewLines(data, terms, balance) {
  const model = p2pPreviewModel(data, terms, balance);
  const lines = model.rows.map(row => row.label + ': ' + row.value);
  if (model.note) lines.push(model.note);
  return lines;
}

function p2pPreviewHtml(data, terms, balance) {
  const model = p2pPreviewModel(data, terms, balance);
  const rows = model.rows.map(row =>
    '<div class="preview-row preview-' + row.key + '"><span>' + escapeHtml(row.label) + '</span><b>' + escapeHtml(row.value) + '</b></div>'
  ).join('');
  const note = model.note ? '<p class="preview-note">' + escapeHtml(model.note) + '</p>' : '';
  return rows + note;
}

function p2pPlaceToast(result) {
  const filled = Number(result.filled || 0);
  const remaining = Number(result.remaining || 0);
  const refunded = Number(result.refunded || 0);
  if (filled > 0 && remaining > 0) {
    return 'Заявка частично исполнена: ' + fmtP2P(filled) + '. Остаток ' + fmtP2P(remaining) + ' ждёт контрагента.';
  }
  if (filled > 0) return 'Заявка полностью исполнена: ' + fmtP2P(filled) + '.';
  if (remaining > 0) return 'Заявка создана и ожидает контрагента: ' + fmtP2P(remaining) + '.';
  if (refunded > 0) return 'Исполнить сразу не удалось. Возвращено ' + fmtP2P(refunded) + '.';
  return 'Заявка создана.';
}

function p2pOfferLine(name, best) {
  if (!best) return '<b>' + escapeHtml(name) + '</b>: нет предложений';
  return '<b>' + escapeHtml(name) + '</b>: до ' + fmtP2P(best.available) + ' · ' + Number(best.odds).toFixed(2);
}

function sameOffer(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Number(a.odds) === Number(b.odds) && Number(a.available) === Number(b.available);
}

function bestOfferCell(name, best, mineBest, outcome, authenticated) {
  const empty = !best;
  const cls = outcome === 0 ? 'yes-acc' : 'no-acc';
  const odds = empty ? '—' : Number(best.odds).toFixed(2);
  const vol = empty ? 'Нет предложений' : (fmtP2P(best.available) + ' доступно');
  let mine = '';
  if (authenticated) {
    if (!mineBest) {
      mine = '<span class="best-you">Доступно вам сейчас: нет предложений</span>';
    } else if (!sameOffer(best, mineBest)) {
      mine = '<span class="best-you">Доступно вам сейчас: ' + Number(mineBest.odds).toFixed(2) +
        ' · ' + fmtP2P(mineBest.available) + '</span>';
    }
  }
  const attrs = empty ? '' : ' data-prefill-outcome="' + outcome + '" data-prefill-odds="' + Number(best.odds) + '"';
  const tag = empty ? 'div' : 'button type="button"';
  const close = empty ? 'div' : 'button';
  return '<' + tag + ' class="best-cell ' + cls + '"' + attrs + '>' +
    '<span class="best-name">' + escapeHtml(name) + '</span>' +
    '<span class="best-odds">' + odds + '</span>' +
    '<span class="best-vol">' + escapeHtml(vol) + '</span>' +
    mine + '</' + close + '>';
}

function bookDepthTable(name, levels) {
  if (!levels || !levels.length) {
    return '<div class="depth-block"><div class="depth-name">' + escapeHtml(name) +
      '</div><p class="muted">нет заявок</p></div>';
  }
  const rows = levels.map(x =>
    '<tr><td class="num">' + Number(x.odds).toFixed(2) + '</td><td class="num">' + fmtP2P(x.available) + '</td></tr>'
  ).join('');
  return '<div class="depth-block"><div class="depth-name">' + escapeHtml(name) +
    '</div><table class="book-table"><thead><tr><th>Коэф.</th><th>Доступно</th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
}

function applyBestOddsPrefill(card, outcome, odds) {
  const idx = Number(outcome);
  const select = card.querySelector('.p2p-side');
  if (select) select.value = String(idx);
  card.querySelectorAll('.side-pick').forEach(btn => {
    const i = Number(btn.dataset.outcome);
    btn.classList.toggle('on-yes', i === idx && i === 0);
    btn.classList.toggle('on-no', i === idx && i === 1);
  });
  if (odds != null && odds !== '') {
    const oddsInput = card.querySelector('.p2p-odds');
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
  return true;
}

async function hydrateP2P(card) {
  const root = card.querySelector('.p2p-book');
  if (!root) return;
  const data = await api('/markets/' + card.dataset.id + '/orderbook');
  card.orderbookData = data;
  const names = [...card.querySelector('.p2p-side').options].map(o=>o.textContent);
  const authenticated = Array.isArray(data.available_to_me);
  const compact = '<div class="best-board">' + names.map((name, i) => {
    const best = data.sides[i] && data.sides[i][0];
    const mine = authenticated ? (data.available_to_me[i] && data.available_to_me[i][0]) : undefined;
    return bestOfferCell(name, best, mine, i, authenticated);
  }).join('') + '</div>';
  const head = data.forming
    ? '<p>Сделок ещё нет — рынок собирается из заявок игроков.</p>'
    : (data.last_prices
      ? '<p>Последняя сделка: ' + data.last_prices.map((p,i)=>escapeHtml(names[i])+' · '+(1/p).toFixed(2)).join(' · ')+'</p>'
      : '');
  root.classList.remove('muted');
  root.innerHTML = head + compact;
  const depth = card.querySelector('.p2p-book-full');
  if (depth) {
    depth.innerHTML = names.map((name,i)=>bookDepthTable(name, data.sides[i] || [])).join('');
  }
  if (me) await p2pQuote(card);
}

function p2pTerms(card) {
  const select = card.querySelector('.p2p-side');
  const option = select && select.options[select.selectedIndex];
  return {outcome: Number(select.value),
          money: card.querySelector('.p2p-money').value,
          odds: card.querySelector('.p2p-odds').value,
          outcomeName: option ? option.textContent : ''};
}

async function p2pQuote(card) {
  const preview = card.querySelector('.p2p-preview');
  if (!preview) return;
  const version = (card.quoteVersion || 0) + 1;
  card.quoteVersion = version;
  const button = card.querySelector('[data-act="p2p-ioc"]');
  if (button) {
    button.disabled = true;
    button.textContent = 'Принять доступное';
  }
  card.availableQuote = null;
  if (!me) { preview.textContent = OPEN_IN_TG; return; }
  try {
    const terms = p2pTerms(card);
    const money = Number(terms.money);
    if (!money || money <= 0) {
      preview.textContent = 'Введите сумму и коэффициент — покажем, что исполнится сразу, а что останется заявкой.';
      return;
    }
    if (Number(me.balance) < money) {
      preview.textContent = 'Недостаточно средств. Доступно ' + fmtP2P(me.balance) + '.';
      return;
    }
    const payload = {outcome: terms.outcome, money: terms.money, odds: terms.odds};
    const data = await api('/markets/'+card.dataset.id+'/orders/quote', {method:'POST', body:JSON.stringify(payload)});
    if (version !== card.quoteVersion || !me || authBlocked) return;
    const available = data.available;
    preview.classList.remove('preview-error');
    preview.innerHTML = p2pPreviewHtml(data, terms, me.balance);
    if (available && available.matched && executableLiquidity(card.orderbookData, terms.outcome)) {
      card.availableQuote = {terms: JSON.stringify(payload),
                             odds: Math.min(10000, Math.floor(available.worst_odds*1e6)/1e6)};
      if (button) {
        button.disabled = false;
        button.textContent = 'Принять '+fmtP2P(available.matched)+' · не ниже '+card.availableQuote.odds.toFixed(4);
      }
    }
  } catch(e) {
    if (version === card.quoteVersion) preview.textContent = (typeof friendlyError === 'function' ? friendlyError(e.message) : e.message);
  }
}

async function p2pPlace(card, kind) {
  requireLogin();
  const terms = p2pTerms(card);
  const payload = {outcome: terms.outcome, money: terms.money, odds: terms.odds};
  if (Number(me.balance) < Number(terms.money)) {
    throw new Error('Недостаточно средств. Доступно ' + fmtP2P(me.balance) + '.');
  }
  if (kind === 'ioc') {
    if (!card.availableQuote || card.availableQuote.terms !== JSON.stringify(payload)) throw new Error('Обновите предложение');
    payload.odds = card.availableQuote.odds;
  }
  const fingerprint = JSON.stringify({...payload, kind});
  // Preserve the key across a network retry; changed terms require a new key.
  if (card.orderFingerprint !== fingerprint) {
    card.orderFingerprint = fingerprint;
    card.orderRequestId = crypto.randomUUID();
  }
  const result = await api('/markets/'+card.dataset.id+'/orders', {method:'POST',
    body:JSON.stringify({...payload, kind, request_id:card.orderRequestId})});
  card.orderRequestId = null;
  card.orderFingerprint = null;
  toast(p2pPlaceToast(result));
}

function orderStatusText(o) {
  if (o.status === 'open' && Number(o.filled) > 0 && Number(o.remaining) > 0) return 'Частично исполнена';
  if (o.status === 'open') return 'Ожидает контрагента';
  if (o.status === 'filled') return 'Исполнена';
  if (o.status === 'cancelled') return 'Отменена';
  if (o.status === 'expired') return 'Приём завершён';
  return o.status;
}

function orderStatusKey(o) {
  const text = orderStatusText(o);
  if (text === 'Ожидает контрагента') return 'wait';
  if (text === 'Частично исполнена') return 'open';
  if (text === 'Исполнена') return 'resolved';
  if (text === 'Отменена') return 'cancelled';
  if (text === 'Приём завершён') return 'closed';
  return 'closed';
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
        question: order.question || ('Событие #' + id),
        orders: []
      });
    }
    groups[index[id]].orders.push(order);
  });
  return groups;
}

function orderCard(o) {
  const open = o.status === 'open';
  return `<div class="card order-card" data-open-market="${o.market_id}">
    <div class="kind-tag">Заявка</div>
    <p class="order-outcome">${escapeHtml(o.outcome_name || ('исход ' + (Number(o.outcome) + 1)))} · коэффициент ${Number(o.odds).toFixed(2)}</p>
    <dl class="money-list">
      <dt>Исходная сумма</dt><dd>${fmtP2P(o.amount)}</dd>
      <dt class="lead">Исполнено</dt><dd class="lead">${fmtP2P(o.filled)}</dd>
      <dt class="lead">В резерве</dt><dd class="lead">${fmtP2P(o.remaining)}</dd>
      <dt class="lead">Возвращено</dt><dd class="lead">${fmtP2P(o.refunded)}</dd>
    </dl>
    <span class="status-pill status-${orderStatusKey(o)}">${escapeHtml(orderStatusText(o))}</span>
    ${open ? `<button class="ghost" data-cancel-order="${o.id}">Отменить остаток</button>
    <p class="muted cancel-hint">Остаток вернётся на доступный баланс.</p>` : ''}
  </div>`;
}

function renderMineOrders(orders) {
  if (!orders || !orders.length) return '<div class="empty-state">Активных заявок пока нет.</div>';
  return groupOrdersByEvent(orders).map(group =>
    `<section class="mine-group">
      <h3 class="mine-group-title">${escapeHtml(group.question)}</h3>
      ${group.orders.map(orderCard).join('')}
    </section>`
  ).join('');
}

function p2pPositionParts(pos) {
  const market = pos.market || {};
  const names = (typeof marketOutcomes === 'function') ? marketOutcomes(market) : (market.outcomes || ['Да', 'Нет']);
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
  if (!parts.length) return '<p class="muted">Исполненных ставок по этому событию нет.</p>';
  return parts.map(part =>
    `<div class="pos-line">
      <div class="pos-outcome">${escapeHtml(part.outcome)}</div>
      <dl class="money-list">
        <dt>Поставлено</dt><dd>${fmtP2P(part.staked)}</dd>
        <dt>Средний коэффициент</dt><dd>${Number(part.avgOdds).toFixed(2)}</dd>
        <dt>Возможная выплата</dt><dd>${fmtP2P(part.payout)}</dd>
      </dl>
    </div>`
  ).join('');
}

async function loadModeration() {
  requireLogin();
  if (!me.is_admin) throw new Error('Недостаточно прав');
  const markets = await api('/moderation/markets');
  requireLogin();
  if (!me.is_admin) return;
  document.getElementById('moderation-markets').innerHTML = markets.length ? markets.map(marketCard).join('') : '<div class="empty-state">Нет событий на проверке.</div>';
}
