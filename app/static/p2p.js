function fmtP2P(value) {
  return Number(value).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 9}) + ' TON';
}

function moderationActions(m) {
  if (!me?.is_admin || m.status !== 'pending') return '';
  return `<p class="muted">Залог: ${fmtP2P(m.lock_ton || 0)}</p>
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

function p2pCard(m) {
  const names = marketOutcomes(m);
  const accepting = !!m.accepting_bets && m.status !== 'cancelled';
  const admin = me?.is_admin;
  const cancelled = m.status === 'cancelled';
  const label = cancelled ? 'Отменено' : (m.status === 'open' ? 'P2P' : statusLabel(m.status));
  const canResolve = admin && m.status === 'closed';
  return `<div class="card" data-id="${m.id}" data-status="${m.status}" data-mechanism="p2p">
    <div class="question">${escapeHtml(m.question)}</div>
    <div class="meta"><span class="pill">${label}</span>
      <span class="pill">${escapeHtml(CAT_LABEL[m.category] || m.category)}</span>
      <span class="pill">Банк сделок ${fmtP2P(m.pot)}</span></div>
    <p class="muted">До ${escapeHtml(String(m.close_at || '').replace('T',' ').slice(0,16))} UTC</p>
    ${m.status === 'pending' ? '<p class="muted">На модерации. Залог для P2P не нужен.</p>' : ''}
    ${m.status === 'rejected' ? `<p class="muted">Отклонено: ${escapeHtml(m.rejection_reason || '')}</p>` : ''}
    ${cancelled ? `<p class="muted">Отменено: ${escapeHtml(m.cancellation_reason || '')}</p>` : ''}
    ${!cancelled && m.winning_outcome ? `<p>Победитель: ${escapeHtml(m.winning_outcome)} · выплаты зачислены</p>` : ''}
    ${accepting ? `<div class="p2p-book muted">Загружаем предложения…</div><button class="ghost" data-act="p2p-refresh">Обновить предложения</button>
      <label>Исход</label><select class="p2p-side">${names.map((n,i)=>`<option value="${i}">${escapeHtml(n)}</option>`).join('')}</select>
      <label>Сумма TON</label><input class="p2p-money" type="number" min="0.01" step="0.01" value="100" inputmode="decimal">
      <label>Хочу коэффициент не ниже</label><input class="p2p-odds" type="number" min="1.00001" step="0.01" value="2" inputmode="decimal">
      <p class="p2p-preview muted">Введите условия — покажем доступный объём.</p>
      <button class="gold" data-act="p2p-limit">Оставить заявку</button>
      <button class="ghost" data-act="p2p-ioc" disabled>Принять доступное</button>
      <p class="muted">Неисполненная сумма заявки резервируется. Её можно вернуть отменой в «Мои».</p>` : ''}
    ${moderationActions(m)}
    ${admin && m.status === 'open' ? '<button class="ghost" data-act="close">Стоп ставки</button>' : ''}
    ${canResolve ? names.map((n,i)=>`<button class="ghost" data-act="resolve" data-outcome="${i}" data-label="${escapeHtml(n)}">Рассчитать: ${escapeHtml(n)}</button>`).join('') : ''}
    ${p2pCancelControls(m)}
  </div>`;
}

async function hydrateP2P(card) {
  const root = card.querySelector('.p2p-book');
  if (!root) return;
  const data = await api('/markets/' + card.dataset.id + '/orderbook');
  const names = [...card.querySelector('.p2p-side').options].map(o=>o.textContent);
  root.innerHTML = (data.forming ? '<p>Рынок формируется · сделок ещё нет</p>' :
    '<p>Последняя сделка: ' + data.last_prices.map((p,i)=>escapeHtml(names[i])+' @'+(1/p).toFixed(2)).join(' · ')+'</p>') +
    '<p>Общие предложения. Свои заявки принять нельзя.</p>' + names.map((name,i)=>{
      const best = data.sides[i][0];
      return `<p><b>${escapeHtml(name)}</b>: ${best ? 'доступно до '+fmtP2P(best.available)+' @'+best.odds.toFixed(2) : 'встречных предложений пока нет'}<br>Заявок на исход: ${fmtP2P(data.queued[i])}</p>`;
    }).join('') + '<details><summary>Рынок · все предложения</summary>' +
    names.map((name,i)=>'<p>'+escapeHtml(name)+': '+(data.sides[i].map(x=>'@'+x.odds.toFixed(2)+' — '+fmtP2P(x.available)).join('<br>') || 'нет заявок')+'</p>').join('')+'</details>';
  if (me) await p2pQuote(card);
}

function p2pTerms(card) {
  return {outcome: Number(card.querySelector('.p2p-side').value),
          money: card.querySelector('.p2p-money').value,
          odds: card.querySelector('.p2p-odds').value};
}

async function p2pQuote(card) {
  const preview = card.querySelector('.p2p-preview');
  if (!preview) return;
  const version = (card.quoteVersion || 0) + 1;
  card.quoteVersion = version;
  const button = card.querySelector('[data-act="p2p-ioc"]');
  button.disabled = true;
  card.availableQuote = null;
  if (!me) { preview.textContent = OPEN_IN_TG; return; }
  try {
    const terms = p2pTerms(card);
    const data = await api('/markets/'+card.dataset.id+'/orders/quote', {method:'POST', body:JSON.stringify(terms)});
    if (version !== card.quoteVersion || !me || authBlocked) return;
    const requested = data.requested, available = data.available;
    preview.textContent = 'По вашим условиям сейчас: '+fmtP2P(requested.matched)+
      (requested.average_odds ? ' · средний кэф '+requested.average_odds.toFixed(2) : '')+
      '. Будет ждать: '+fmtP2P(requested.remaining)+'. '+
      (available.matched ? 'Лучшее доступное: '+fmtP2P(available.matched)+' · средний кэф '+available.average_odds.toFixed(2)+'.' : 'Пока нет встречной заявки.');
    if (available.matched) {
      card.availableQuote = {terms: JSON.stringify(terms), odds: Math.min(10000, Math.floor(available.worst_odds*1e6)/1e6)};
      button.disabled = false;
      button.textContent = 'Принять '+fmtP2P(available.matched)+' · не ниже '+card.availableQuote.odds.toFixed(4);
    }
  } catch(e) { if (version === card.quoteVersion) preview.textContent = e.message; }
}

async function p2pPlace(card, kind) {
  requireLogin();
  const terms = p2pTerms(card);
  if (kind === 'ioc') {
    if (!card.availableQuote || card.availableQuote.terms !== JSON.stringify(terms)) throw new Error('Обновите предложение');
    terms.odds = card.availableQuote.odds;
  }
  const fingerprint = JSON.stringify({...terms, kind});
  // Preserve the key across a network retry; changed terms require a new key.
  if (card.orderFingerprint !== fingerprint) {
    card.orderFingerprint = fingerprint;
    card.orderRequestId = crypto.randomUUID();
  }
  const result = await api('/markets/'+card.dataset.id+'/orders', {method:'POST',
    body:JSON.stringify({...terms, kind, request_id:card.orderRequestId})});
  card.orderRequestId = null;
  card.orderFingerprint = null;
  toast('Исполнено '+fmtP2P(result.filled)+' · ожидает '+fmtP2P(result.remaining)+' · возвращено '+fmtP2P(result.refunded));
}

function orderCard(o) {
  return `<div class="card"><b>${escapeHtml(o.question || ("Событие #"+o.market_id))} · ${escapeHtml(o.outcome_name || ("исход "+(o.outcome+1)))} @${o.odds.toFixed(2)}</b>
    <p>Исполнено ${fmtP2P(o.filled)} · в резерве ${fmtP2P(o.remaining)} · возвращено ${fmtP2P(o.refunded)}</p>
    <p class="muted">${(o.filled > 0 && o.filled < o.amount && o.status === 'open' ? 'Частично исполнена; остаток ожидает' : ({open:'Ожидает исполнения',filled:'Исполнена',cancelled:'Отменена',expired:'Приём завершён'})[o.status]) || escapeHtml(o.status)}</p>
    ${o.status === 'open' ? `<button class="ghost" data-cancel-order="${o.id}">Отменить остаток</button>` : ''}</div>`;
}

async function loadModeration() {
  requireLogin();
  if (!me.is_admin) throw new Error('Недостаточно прав');
  const markets = await api('/moderation/markets');
  requireLogin();
  if (!me.is_admin) return;
  document.getElementById('moderation-markets').innerHTML = markets.length ? markets.map(marketCard).join('') : '<p class="muted">Нет событий на проверке.</p>';
}
