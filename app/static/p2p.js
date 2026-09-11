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

const P2P_CANCEL_WARNING = 'Все ставки по событию будут возвращены. Чаевые не удерживаются';

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
  const label = p2pStatusLabel(m);
  const canResolve = admin && m.status === 'closed';
  const yes = names[0] || 'Да';
  const no = names[1] || 'Нет';
  return `<div class="card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p">
    <div class="question">${escapeHtml(m.question)}</div>
    <div class="meta"><span class="status-pill status-${cancelled ? 'cancelled' : (m.status === 'open' && m.accepting_bets ? 'open' : 'closed')}">${escapeHtml(label)}</span>
      <span class="pill">${escapeHtml(CAT_LABEL[m.category] || m.category)}</span>
      ${(m.pot || 0) > 0 ? `<span class="pill">Сделки ${fmtP2P(m.pot)}</span>` : '<span class="pill">Сделок пока нет</span>'}</div>
    <p class="muted">Приём заявок до ${escapeHtml(String(m.close_at || '').replace('T',' ').slice(0,16))} UTC</p>
    ${m.status === 'pending' ? '<p class="muted">На модерации. Рынок появится в ленте после проверки. Залог не нужен.</p>' : ''}
    ${m.status === 'rejected' ? `<p class="muted">Отклонено: ${escapeHtml(m.rejection_reason || '')}</p>` : ''}
    ${cancelled ? `<p class="muted">Отменено: ${escapeHtml(m.cancellation_reason || '')}. Исполненные ставки и незакрытый остаток заявок возвращены без чаевых.</p>` : ''}
    ${!cancelled && m.winning_outcome ? `<p>Исход: ${escapeHtml(m.winning_outcome)} · выплаты зачислены</p>` : ''}
    ${accepting ? `<div class="p2p-book muted">Загружаем предложения…</div><button class="ghost" data-act="p2p-refresh">Обновить предложения</button>
      <div class="p2p-form">
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
      <p class="muted">Если событие отменят, исполненные ставки и незакрытый остаток заявки вернутся без чаевых.</p>
      </div>` : ''}
    ${moderationActions(m)}
    ${admin && m.status === 'open' ? '<button class="ghost" data-act="close">Стоп ставки</button>' : ''}
    ${canResolve ? names.map((n,i)=>`<button class="ghost" data-act="resolve" data-outcome="${i}" data-label="${escapeHtml(n)}">Рассчитать: ${escapeHtml(n)}</button>`).join('') : ''}
    ${p2pCancelControls(m)}
  </div>`;
}

function p2pPreviewLines(data, terms, balance) {
  const requested = data.requested || {};
  const available = data.available || {};
  const money = Number(terms.money);
  const odds = Number(terms.odds);
  const name = terms.outcomeName || '';
  const matched = Number(requested.matched || 0);
  const remaining = Number(requested.remaining || 0);
  const lines = [];
  lines.push((name ? ('Исход «' + name + '». ') : '') + 'Сумма ' + fmtP2P(money) + ', коэффициент не ниже ' + Number(odds).toFixed(2) + '.');
  if (balance != null && Number.isFinite(Number(balance))) lines.push('Доступно: ' + fmtP2P(balance) + '.');
  if (Number(available.matched) > 0) {
    lines.push('Встречный объём сейчас: ' + fmtP2P(available.matched) +
      (available.average_odds ? ' · средний коэффициент ' + Number(available.average_odds).toFixed(2) : '') + '.');
  } else {
    lines.push('Встречного объёма по этому коэффициенту сейчас нет.');
  }
  if (matched > 0 && remaining > 0) {
    lines.push('Сразу может исполниться ' + fmtP2P(matched) +
      (requested.payout ? ('. При победе по этой части выплата ' + fmtP2P(requested.payout)) : '') + '.');
    lines.push('Сейчас доступно ' + fmtP2P(matched) + '. Остаток ' + fmtP2P(remaining) +
      ' будет размещён как заявка и будет ждать встречного предложения.');
  } else if (matched > 0) {
    lines.push('Вся сумма может исполниться сразу' +
      (requested.average_odds ? (' по среднему коэффициенту ' + Number(requested.average_odds).toFixed(2)) : '') +
      (requested.payout ? ('. При победе выплата ' + fmtP2P(requested.payout)) : '') + '.');
  } else {
    lines.push('Заявка не исполнится сразу: вся сумма ' + fmtP2P(remaining || money) +
      ' будет ждать встречного предложения.');
  }
  if (remaining > 0 && odds > 1) {
    lines.push('Если остаток исполнят по вашему коэффициенту, при победе выплата по нему составит около ' +
      fmtP2P(remaining * odds) + '. Это не обещание сделки: контрагент ещё может не найтись.');
  }
  return lines;
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

async function hydrateP2P(card) {
  const root = card.querySelector('.p2p-book');
  if (!root) return;
  const data = await api('/markets/' + card.dataset.id + '/orderbook');
  const names = [...card.querySelector('.p2p-side').options].map(o=>o.textContent);
  root.innerHTML = (data.forming ? '<p>Рынок формируется из заявок игроков · сделок ещё нет</p>' :
    '<p>Последняя сделка: ' + data.last_prices.map((p,i)=>escapeHtml(names[i])+' @'+(1/p).toFixed(2)).join(' · ')+'</p>') +
    '<p>Предложения других игроков. Свою заявку принять нельзя.</p>' + names.map((name,i)=>{
      const best = data.sides[i][0];
      return `<p><b>${escapeHtml(name)}</b>: ${best ? 'доступно до '+fmtP2P(best.available)+' @'+best.odds.toFixed(2) : 'встречных предложений пока нет'}<br>Заявок на исход: ${fmtP2P(data.queued[i])}</p>`;
    }).join('') + '<details><summary>Все предложения</summary>' +
    names.map((name,i)=>'<p>'+escapeHtml(name)+': '+(data.sides[i].map(x=>'@'+x.odds.toFixed(2)+' — '+fmtP2P(x.available)).join('<br>') || 'нет заявок')+'</p>').join('')+'</details>';
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
    const requested = data.requested, available = data.available;
    preview.innerHTML = p2pPreviewLines(data, terms, me.balance).map(line => '<p>'+escapeHtml(line)+'</p>').join('');
    if (available && available.matched) {
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
  if (o.status === 'open' && o.filled > 0 && o.remaining > 0) return 'Частично исполнена; остаток ожидает';
  if (o.status === 'open') return 'Ожидает контрагента';
  if (o.status === 'filled') return 'Полностью исполнена';
  if (o.status === 'cancelled') return 'Отменена';
  if (o.status === 'expired') return 'Приём заявок завершён';
  return o.status;
}

function orderCard(o) {
  return `<div class="card" data-open-market="${o.market_id}"><b>${escapeHtml(o.question || ("Событие #"+o.market_id))} · ${escapeHtml(o.outcome_name || ("исход "+(o.outcome+1)))} @${o.odds.toFixed(2)}</b>
    <p>Исполнено ${fmtP2P(o.filled)} · в резерве ${fmtP2P(o.remaining)} · возвращено ${fmtP2P(o.refunded)}</p>
    <p class="muted">${escapeHtml(orderStatusText(o))}</p>
    ${o.status === 'open' ? `<button class="ghost" data-cancel-order="${o.id}">Отменить остаток</button>` : ''}</div>`;
}

async function loadModeration() {
  requireLogin();
  if (!me.is_admin) throw new Error('Недостаточно прав');
  const markets = await api('/moderation/markets');
  requireLogin();
  if (!me.is_admin) return;
  document.getElementById('moderation-markets').innerHTML = markets.length ? markets.map(marketCard).join('') : '<div class="empty-state">Нет событий на проверке.</div>';
}
