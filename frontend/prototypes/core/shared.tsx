import { ArrowLeft, ArrowRight, Check, CircleUserRound, LayoutList, Plus, Bell, BriefcaseBusiness, Search, ChevronRight } from 'lucide-react'
import type { Journey, Screen } from './model'
import s from './core.module.css'
export function Nav({j}:{j:Journey}){
  const tabs:[Screen,string,typeof LayoutList][]=[['feed','Рынки',LayoutList],['portfolio','Портфель',BriefcaseBusiness],['create','Создать',Plus],['notices','Входящие',Bell],['profile','Профиль',CircleUserRound]]
  return <nav className={s.navigation} aria-label="Основная навигация">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>j.setScreen(id)} aria-current={j.screen===id?'page':undefined}><Icon size={21}/><span>{label}</span></button>)}</nav>
}
export function SearchField({j}:{j:Journey}){return <label className={s.search}><Search size={18}/><span className={s.sr}>Найти событие</span><input placeholder="Найти событие" value={j.query} onChange={e=>j.setQuery(e.target.value)}/></label>}
export function Back({j}:{j:Journey}){return <button className={s.back} onClick={j.back}><ArrowLeft size={18}/>Назад</button>}
export function OutcomePicker({j}:{j:Journey}){return <div className={s.outcomes}>{(['yes','no'] as const).map(side=><button key={side} data-demo-outcome={side} onClick={()=>j.trade(side)}><span>{side==='yes'?'Да':'Нет'}</span><strong>{j.market[side]?`${j.market[side]?.toFixed(2)}×`:'Нет предложений'}</strong></button>)}</div>}
export function Ticket({j}:{j:Journey}){return <><div className={s.ticketScroll}>
  <div className={s.segment} aria-label="Тип заявки"><button aria-pressed={j.kind==='ioc'} onClick={()=>j.setKind('ioc')}>Сейчас · IOC</button><button aria-pressed={j.kind==='limit'} onClick={()=>j.setKind('limit')}>Своя цена</button></div>
  <div className={s.segment} aria-label="Исход"><button aria-pressed={j.side==='yes'} onClick={()=>j.setSide('yes')}>Да</button><button aria-pressed={j.side==='no'} onClick={()=>j.setSide('no')}>Нет</button></div>
  <label className={s.amount}>Сумма, TON<input autoComplete="off" inputMode="decimal" type="number" min="0.01" step="0.01" value={j.amount} onChange={e=>j.setAmount(e.target.value)}/></label>
  <div className={s.presets}>{[5,10,25,50].map(n=><button key={n} onClick={()=>j.setAmount(String(n))}>{n} TON</button>)}</div>
  {j.kind==='limit'?<label className={s.field}>Ваш коэффициент<input type="number" inputMode="decimal" min="1.01" step="0.01" value={j.odds} onChange={e=>j.setOdds(e.target.value)}/></label>:null}
  <p className={s.explain}>{j.kind==='ioc'?`Доступно ${j.market.liquidity} TON встречных предложений. Неисполненная часть сразу вернётся.`:'Неисполненная часть останется в заявке. Средства будут зарезервированы до отмены или исполнения.'}</p>
  <p className={s.explain}>Коэффициент {j.kind==='limit'?j.odds:j.market[j.side]??'—'}× — выплата до сборов на 1 TON. {j.market[j.side]?`Около ${Math.round(100/j.market[j.side]!)}% — подразумеваемая вероятность, не прогноз платформы.`:'Без предложения нет исполнимой цены.'}</p>
  {!j.valid?<p role="alert" className={s.error}>{j.kind==='ioc'&&!j.market.liquidity?'Встречных предложений нет. Выберите «Своя цена».':`Введите сумму от 0.01 до ${j.available} TON и коэффициент выше 1.`}</p>:null}
  </div><div className={s.ticketAction}><button className={s.primary} disabled={!j.valid} onClick={j.prepareReview}>Проверить заявку<ArrowRight size={19}/></button>
  <p className={s.fine}>Доступно {j.available} TON · синтетические данные</p></div></>}
export function Review({j}:{j:Journey}){
 const r=j.review;if(!r)return null
 return <><h1>Проверка заявки</h1><p className={s.question}>{r.market.title}</p><dl className={s.receipt}>
 <div><dt>Ваш исход</dt><dd>{r.side==='yes'?'Да':'Нет'}</dd></div><div><dt>Тип</dt><dd>{r.kind==='ioc'?'Quick Trade · IOC':'Лимитная заявка'}</dd></div>
 <div><dt>{r.kind==='ioc'?'Не хуже коэффициента':'Ваш коэффициент'}</dt><dd>{r.odds.toFixed(2)}×</dd></div>
 <div><dt>Демо-котировка</dt><dd>{r.quotedAt}</dd></div><div><dt>Сумма</dt><dd>{r.amount} TON</dd></div>
 <div><dt>Ожидаемое исполнение</dt><dd>{r.filled} TON</dd></div><div><dt>{r.kind==='ioc'?'Вернётся':'Останется в заявке'}</dt><dd>{r.refunded+r.remaining} TON</dd></div></dl>
 <p className={s.explain}>Сбор 1% только с чистой прибыли победителя. Цена исполнения определяется встречными предложениями. Это учебная котировка; реальное приложение получает все суммы и пределы от сервера.</p>
 <button className={s.primary} onClick={j.confirm}>Подтвердить демо-заявку<Check size={19}/></button><button className={s.secondary} onClick={()=>j.setScreen('trade')}>Изменить сумму</button></>
}
export function Result({j}:{j:Journey}){
 const r=j.receipts.at(-1);if(!r)return null
 return <section className={s.result} role="status"><Check size={42}/><h1>{r.filled===0?'Заявка размещена':r.filled<r.amount?'Частичное исполнение':'Заявка исполнена'}</h1><p>Синтетический результат. Реальные средства не использованы.</p><dl className={s.receipt}><div><dt>Исполнено</dt><dd>{r.filled} TON</dd></div><div><dt>{r.kind==='ioc'?'Возвращено':'В активной заявке'}</dt><dd>{r.refunded+r.remaining} TON</dd></div></dl><button className={s.primary} onClick={()=>j.setScreen('portfolio')}>Открыть портфель<ArrowRight size={19}/></button><button className={s.secondary} onClick={()=>j.open(r.market)}>Вернуться к событию</button></section>
}
export function Portfolio({j}:{j:Journey}){
 const positions=j.receipts.filter(r=>r.filled>0),orders=j.receipts.filter(r=>r.remaining>0)
 return <><h1>Портфель</h1><div className={s.balance}><span>Доступно</span><strong data-testid="demo-available">{j.available} <small>TON</small></strong><p>В позициях · {positions.reduce((sum,r)=>sum+r.filled,0)} TON</p></div>
 <div className={s.sectionTitle}><h2>Открытые позиции</h2><span data-testid="demo-position-count">{positions.length}</span></div>
 {positions.length?positions.map((r,i)=><button key={i} className={s.position} onClick={()=>j.open(r.market)}><div><strong>{r.market.title}</strong><span>{r.side==='yes'?'Да':'Нет'} · {r.filled} TON</span></div><ChevronRight size={20}/></button>):<p className={s.explain}>Пока нет позиций. Изучите условия события и встречные предложения.</p>}
 <div className={s.sectionTitle}><h2>Активные заявки</h2><span data-testid="demo-order-count">{orders.length}</span></div>
 {orders.map((r,i)=><button key={i} className={s.position} onClick={()=>j.open(r.market)}><div><strong>{r.market.title}</strong><span>{r.remaining} TON в резерве · {r.odds.toFixed(2)}×</span></div><ChevronRight size={20}/></button>)}
 <p className={s.explain}>Позиция — исполненная сделка. Заявка — предложение, которое ещё ждёт участника.</p><button className={s.secondary} onClick={()=>j.setScreen('feed')}>Найти событие<ArrowRight size={18}/></button></>
}
export function Utility({j}:{j:Journey}){return <><h1>{j.screen==='create'?'Новое событие':j.screen==='notices'?'Входящие':'Ваш профиль'}</h1><p className={s.explain}>Синтетический прототип основного пути. Этот раздел доступен в интегрированном приложении; создание и отправка здесь не имитируются.</p><button className={s.primary} onClick={()=>j.setScreen('feed')}>Вернуться к рынкам</button></>}

/** Folio tests a reading-led, amount-first page, rather than the shared ticket. */
export function FolioTicket({j}:{j:Journey}) {
 return <section className={s.folioTicket}>
  <p className={s.question}>Ваш выбор — «{j.side==='yes'?'Да':'Нет'}»</p>
  <label className={s.amount}>Сумма, TON<input type="number" inputMode="decimal" min="0.01" step="0.01" value={j.amount} onChange={e=>j.setAmount(e.target.value)}/></label>
  <p className={s.explain}>{j.market.liquidity?`${j.market.liquidity} TON доступны во встречных предложениях.`:'Встречных предложений нет. Оставьте свою заявку, чтобы появился первый коэффициент.'}</p>
  <h2>Как исполнить</h2>
  <div className={s.folioModes}><button aria-pressed={j.kind==='ioc'} onClick={()=>j.setKind('ioc')}>Сейчас · IOC</button><button aria-pressed={j.kind==='limit'} onClick={()=>j.setKind('limit')}>Своя цена</button></div>
  {j.kind==='limit'?<label className={s.field}>Ваш коэффициент<input type="number" inputMode="decimal" min="1.00001" max="10000" step="0.01" value={j.odds} onChange={e=>j.setOdds(e.target.value)}/></label>:null}
  <p className={s.explain}>{j.kind==='ioc'?'Исполнится только доступная часть. Остаток сразу вернётся.':'Неисполненная часть будет ждать в книге предложений. Её можно отменить.'}</p>
  {!j.valid?<p className={s.error} role="alert">Проверьте сумму и коэффициент. Доступно {j.available} TON.</p>:null}
  <button className={s.primary} disabled={!j.valid} onClick={j.prepareReview}>Проверить заявку<ArrowRight size={19}/></button>
  <p className={s.fine}>Следующая страница повторит все условия перед подтверждением. Данные синтетические.</p>
 </section>
}
