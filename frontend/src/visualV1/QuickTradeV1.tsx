import { useEffect, useState } from 'react'
import type { QuickTradeSheetProps } from '../components/QuickTradeSheet/QuickTradeSheet'
import { Button } from '../components/Button/Button'
import { GuarantorTradeCosts } from '../components/GuarantorTradeCosts/GuarantorTradeCosts'
import { outcomeIsExecutable } from '../lib/quote'
import { presetExceedsBalance, quickTradeCtaDisabled } from '../lib/quickTrade'
import { formatOdds, formatTonFull } from '../lib/format'
import { TradeShellV1, SelectedOutcomeV1, TradeRowV1, NumericTradeFieldV1 } from './TradeV1Shared'
import { TradeResultV1 } from './TradeResultV1'
import s from './TradeV1.module.css'

export function QuickTradeV1(p:QuickTradeSheetProps){
 const {market,selectedSide:side,amount,state='normal',quotesLoading=false,availableTon,previewMatchedTon:matched,previewRestTon:rest,previewPayoutTon:payout,guarantorCosts:costs,onClose,onOwnPrice,onPlace,onRefreshQuote,onNavChange}=p
 const [confirming,setConfirming]=useState(false),[editFunds,setEditFunds]=useState(false)
 useEffect(()=>{setConfirming(false);setEditFunds(false)},[amount,side])
 useEffect(()=>{if(!['normal','partial'].includes(state))setConfirming(false)},[state])
 const selected=side==='a'?market.outcomeA:market.outcomeB
 const insufficient=presetExceedsBalance(amount,availableTon)||(state==='insufficient-balance'&&!editFunds)
 const executable=outcomeIsExecutable(selected)
 const previewReady=!quotesLoading&&matched!=null&&rest!=null
 const canPlace=Boolean(onPlace)&&costs?.can_place!==false&&!quickTradeCtaDisabled({amount,executable,quotesLoading,insufficient,matchedTon:matched,demoMode:p.demoMode,state})&&previewReady
 const special=['processing','stale-quote','no-liquidity','success','error'].includes(state)||(state==='insufficient-balance'&&!editFunds)
 const successful=state==='success',processing=state==='processing'
 const title=processing?'Ставка обрабатывается':state==='stale-quote'?'Коэффициенты изменились':state==='no-liquidity'?'Нет встречных предложений':state==='insufficient-balance'?'Недостаточно TON':successful?(p.placeResult?.kind==='partial'?'Исполнено частично':'Ставка исполнена'):'Не удалось подтвердить ставку'
 const change=()=>{setConfirming(false);onRefreshQuote?.()}
 const resultAction=successful?()=>onNavChange?onNavChange('portfolio'):onClose?.():state==='no-liquidity'?onOwnPrice:state==='insufficient-balance'?()=>setEditFunds(true):change
 if(successful&&p.placeResult&&p.placeResult.filledTon>0)return <TradeResultV1 title="Ставка размещена" frame="835:15456" onBack={onClose} success actions={<><Button fullWidth onClick={onClose}>К событию</Button><Button variant="secondary" fullWidth onClick={()=>onNavChange?onNavChange('portfolio'):onClose?.()}>Мои ставки</Button></>}><h2>{p.placeResult.kind==='partial'?'Ставка исполнена частично':'Ставка подтверждена'}</h2><p className={s.note}>Исполненные части доступны в «Моих ставках».</p><TradeRowV1 label="Исполнено" value={formatTonFull(p.placeResult.filledTon)}/>{p.placeResult.refundedTon>0?<><TradeRowV1 label="Возвращено на баланс" value={formatTonFull(p.placeResult.refundedTon)}/><p className={s.note}>Неисполненный остаток не становится предложением.</p></>:null}</TradeResultV1>
 const footer=special?<><Button className={s.cta} fullWidth loading={processing} disabled={processing||!resultAction} onClick={resultAction}>{successful?'К моим ставкам':processing?'Обработка…':state==='no-liquidity'?'Свой коэффициент':state==='insufficient-balance'?'Изменить сумму':'Обновить предложения'}</Button>{!processing?<button type="button" className={s.close} onClick={onClose}>К событию</button>:null}</>:<Button className={s.cta} fullWidth disabled={!canPlace} onClick={()=>confirming?onPlace?.():setConfirming(true)}>{p.demoMode?'Недоступно в демо':quotesLoading?'Обновляем расчёт…':confirming?'Подтвердить ставку':'Заключить ставку'}</Button>
 return <TradeShellV1 market={market} side={side} onClose={processing?undefined:onClose} onOtherMode={processing?undefined:onOwnPrice} footer={footer} state={special||confirming}>
 {special?<><h1 className={s.stateTitle}>{title}</h1>{successful&&p.placeResult?<><strong className={s.stateMetric}>{formatTonFull(p.placeResult.filledTon)}</strong><TradeRowV1 label="Запрошено" value={formatTonFull(p.placeResult.requestedTon??amount)}/><TradeRowV1 label="Исполнено" value={formatTonFull(p.placeResult.filledTon)}/><TradeRowV1 label="Возвращено на баланс" value={formatTonFull(p.placeResult.refundedTon)}/><p className={s.note}>Неисполненный остаток не становится предложением.</p></>:state==='insufficient-balance'?<><strong className={s.stateMetric}>{formatTonFull(availableTon)}</strong><p className={s.note}>Доступно на балансе. Сумма ставки: {formatTonFull(amount)}.</p></>:state==='no-liquidity'?<p className={s.note}>Попробуйте позже или разместите предложение со своим коэффициентом.</p>:processing?<p className={s.note}>Дождитесь ответа сервера. Повторно отправлять ставку не нужно.</p>:<p className={s.note}>{p.errorMessage||'Обновите расчёт и проверьте условия перед подтверждением.'}</p>}</>:<>
 <SelectedOutcomeV1 market={market} side={side} odds={confirming?p.previewAverageOdds:selected.odds} onSelect={confirming?undefined:p.onSelectSide}/>
 {!confirming?<NumericTradeFieldV1 label="Сумма, TON" value={amount} onChange={p.onAmountChange} disabled={processing}/>:<><h1 className={s.stateTitle}>Проверьте ставку</h1><TradeRowV1 label="Сумма ставки" value={formatTonFull(amount)}/></>}
 <TradeRowV1 label="Доступно сейчас" value={quotesLoading?'…':formatTonFull(p.totalAvailableTon??selected.liquidityTon)}/>
 {confirming&&matched!=null?<><TradeRowV1 label="Исполнится сейчас" value={formatTonFull(matched)}/><TradeRowV1 label="Средний коэффициент" value={formatOdds(p.previewAverageOdds)}/><TradeRowV1 label="Худший коэффициент" value={formatOdds(p.previewWorstOdds)}/></>:null}
 {confirming&&(p.previewFills?.length??0)>1?<dl className={s.steps}>{p.previewFills?.map((fill,i)=><div key={i}><dt>{formatOdds(fill.odds)}</dt><dd>{formatTonFull(fill.matchedTon)}</dd></div>)}</dl>:null}
 {(rest??0)>0?<div className={s.warning} role="status"><strong>Исполнится частично</strong><p>Сейчас: {formatTonFull(matched)}. Неисполненный остаток {formatTonFull(rest)} вернётся на баланс.</p></div>:null}
 {costs?<GuarantorTradeCosts costs={costs}/>:<section className={s.summary}><h2>Предварительный расчёт</h2><TradeRowV1 label="Выплата до сбора" value={previewReady?formatTonFull(payout):'—'}/><p className={s.note}>Сервисный сбор — 1% только с чистой прибыли победителя. Итоговая выплата определяется при расчёте события.</p></section>}
 {insufficient?<p className={s.error} role="alert">Недостаточно TON. Доступно {formatTonFull(availableTon)}.</p>:null}
 {p.errorMessage?<p className={s.error} role="alert">{p.errorMessage}</p>:null}
 {confirming?<><p className={s.note}>Доступная часть исполнится сразу. Условия могут измениться до ответа сервера.</p><Button variant="secondary" className={s.secondary} fullWidth onClick={()=>setConfirming(false)}>Изменить сумму</Button></>:null}
 </>}
 </TradeShellV1>
}
