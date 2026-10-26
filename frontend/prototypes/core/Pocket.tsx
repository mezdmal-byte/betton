import { useLayoutEffect, useRef } from 'react'
import { ArrowRight, ChevronRight, Clock3, X } from 'lucide-react'
import { useCoreJourney } from './model'
import type { Journey } from './model'
import { Back, Nav, OutcomePicker, Portfolio, Result, Review, SearchField, Ticket, Utility } from './shared'
import s from './core.module.css'

function EventContent({j}:{j:Journey}) {
  return <><Back j={j}/><div className={s.detailMeta}>{j.market.topic} · {j.market.close}</div>
    <h1>{j.market.title}</h1>
    <section className={s.conditions}><h2>Условия понятны заранее</h2><p>{j.market.description}</p></section>
    <div className={s.sectionTitle}><h2>Встречные предложения</h2><span>{j.market.liquidity} TON</span></div>
    <OutcomePicker j={j}/><p className={s.explain}>Коэффициент — выплата до сборов на 1 TON. Он зависит от предложений участников.</p>
    <p className={s.detailMeta}>{j.market.creator} · Синтетический источник</p></>
}
function TradePanel({j}:{j:Journey}) {
  const panel=useRef<HTMLElement>(null)
  useLayoutEffect(()=>{panel.current?.querySelector<HTMLElement>('h2')?.focus()},[])
  return <div className={s.tradeScrim}><section ref={panel} className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="pocket-trade-title"
    onKeyDown={e=>{if(e.key==='Escape'){j.back();return}if(e.key!=='Tab')return
      const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]')??[])
      const first=controls[0],last=controls.at(-1)
      if(e.shiftKey&&(document.activeElement===first||document.activeElement?.tagName==='H2')){e.preventDefault();last?.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    }}>
    <header className={s.sheetHeader}><div><h2 id="pocket-trade-title" tabIndex={-1}>Ваша ставка</h2><p>{j.market.title}</p></div>
      <button aria-label="Закрыть торговую панель" onClick={j.back}><X size={20}/></button></header>
    <Ticket j={j}/>
  </section></div>
}
export function Pocket() {
  const j=useCoreJourney(),trading=j.screen==='trade'
  return <article className={`${s.app} ${s.pocket}`} data-direction="pocket">
    <header className={s.brand} inert={trading}><strong>BetTON<span className={s.brandDot}>.</span></strong>
      <button onClick={()=>j.setScreen('portfolio')}>{j.available} TON<ChevronRight size={16}/></button></header>
    <main key={trading?'detail':j.screen} inert={trading}>
      {j.screen==='feed'?<><h1>Есть мнение?</h1><p className={s.intro}>Найдите вопрос, в котором разбираетесь.</p><SearchField j={j}/>
        <div className={s.categories} aria-label="Категории">{['Все','Город','Спорт','Культура'].map(cat=><button key={cat} aria-pressed={j.category===cat} onClick={()=>j.setCategory(cat)}>{cat}</button>)}</div>
        <div className={s.sectionTitle}><h2>Открыты к сделке</h2><span>{j.shown.length}</span></div>
        {j.shown.map(m=><button className={s.pocketMarket} key={m.id} onClick={()=>j.open(m)}>
          <span className={s.pocketCategory}>{m.topic}<span><Clock3 size={12}/>{m.close}</span></span><strong>{m.title}</strong>
          <span className={s.pocketQuotes}><span>Да <b>{m.yes?m.yes.toFixed(2)+'×':'—'}</b></span><span>Нет <b>{m.no?m.no.toFixed(2)+'×':'—'}</b></span></span>
          <span className={s.marketAvailability}>{m.liquidity?`${m.liquidity} TON встречных предложений`:'Пока без предложений · можно создать своё'}<ArrowRight size={17}/></span>
        </button>)}{!j.shown.length?<p>Событий не найдено. Попробуйте другой запрос.</p>:null}
      </>:j.screen==='detail'||trading?<EventContent j={j}/>:j.screen==='review'?<><Back j={j}/><Review j={j}/></>:j.screen==='result'?<Result j={j}/>:j.screen==='portfolio'?<Portfolio j={j}/>:<Utility j={j}/>}
    </main><div inert={trading}><Nav j={j}/></div>{trading?<TradePanel j={j}/>:null}
  </article>
}
