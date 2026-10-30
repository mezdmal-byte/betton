import { useEffect, useState } from 'react'
import type { OwnPriceScreenProps } from '../screens/OwnPriceScreen'
import { marketYesNo } from '../fixtures/markets'
import { Button } from '../components/Button/Button'
import { GuarantorTradeCosts } from '../components/GuarantorTradeCosts/GuarantorTradeCosts'
import { formatTonFull } from '../lib/format'
import { TradeShellV1, SelectedOutcomeV1, TradeRowV1, NumericTradeFieldV1 } from './TradeV1Shared'
import { TradeResultV1 } from './TradeResultV1'
import s from './TradeV1.module.css'

export function OwnPriceV1(p:OwnPriceScreenProps){
 const {market=marketYesNo,selectedSide='a',odds=0,amount=0,viewState='ready',onBack,onSubmit,placedOrder:order,submitting=false}=p
 const [confirming,setConfirming]=useState(false),[cancel,setCancel]=useState(false)
 useEffect(()=>setConfirming(false),[selectedSide,odds,amount])
 const selected=selectedSide==='a'?market.outcomeA:market.outcomeB
 const ready=p.previewMode!=='backend'||(p.matchedTon!=null&&p.restTon!=null)
 const valid=Number.isFinite(amount)&&amount>0&&(p.availableTon==null||amount<=p.availableTon)&&Number.isFinite(odds)&&odds>1&&odds<=10000&&ready&&!p.disabled&&!submitting&&p.guarantorCosts?.can_place!==false
 const hasRemainder=order?.status==='open'&&order.remainingTon>0
 const close=()=>{if(submitting||p.cancellingOrder)return;if(cancel){setCancel(false);return}if(confirming){setConfirming(false);return}onBack?.()}
 const context=<p className={s.context}>{selected.label} · {market.question}{market.creator.handle==='betton_preview'?' · Демо':''}</p>
 const myBets=()=>p.onNavChange?p.onNavChange('portfolio'):onBack?.()
 if(order&&cancel&&hasRemainder)return <TradeResultV1 title="Отменить предложение?" frame="835:15480" onBack={()=>setCancel(false)} actions={<><Button fullWidth loading={p.cancellingOrder} disabled={p.cancellingOrder||!p.onCancelRemainder} onClick={p.onCancelRemainder}>Отменить {formatTonFull(order.remainingTon)}</Button><Button variant="secondary" fullWidth disabled={p.cancellingOrder} onClick={()=>setCancel(false)}>Оставить предложение</Button></>}><strong>{formatTonFull(order.remainingTon)}</strong><p>Будет отменена только неисполненная часть. Эти средства освободятся на балансе.</p>{p.errorMessage?<p className={s.error} role="alert">{p.errorMessage}</p>:null}</TradeResultV1>
 if(order?.status==='cancelled')return <TradeResultV1 title="Предложение отменено" frame="835:15501" onBack={onBack} success actions={<><Button fullWidth onClick={myBets}>Мои ставки</Button><Button variant="secondary" fullWidth onClick={onBack}>К событию</Button></>}><h2>Неисполненный остаток освобождён</h2></TradeResultV1>
 if(order&&!hasRemainder)return <TradeResultV1 title="Ставка размещена" frame="835:15456" onBack={onBack} success actions={<><Button fullWidth onClick={onBack}>К событию</Button><Button variant="secondary" fullWidth onClick={myBets}>Мои ставки</Button></>}><h2>Ставка подтверждена</h2><p className={s.note}>Исполненная часть доступна в «Моих ставках».</p><TradeRowV1 label="Исполнено" value={formatTonFull(order.filledTon)}/></TradeResultV1>
 if(order&&hasRemainder)return <TradeShellV1 market={market} side={selectedSide} own onClose={onBack} state frame={order.filledTon>0?'819:54110':'819:52950'} footer={<><Button className={s.cta} fullWidth onClick={onBack}>Вернуться к событию</Button><button type="button" className={s.cancelLink} onClick={()=>setCancel(true)}>Отменить предложение</button></>}>
  {context}<SelectedOutcomeV1 market={market} side={selectedSide} odds={order.odds} own/>
  <div className={s.execution}>{order.filledTon>0?<><TradeRowV1 label="Статус" value={<span style={{display:'inline-block',width:125}}>Частично исполнена</span>}/><TradeRowV1 label="Исполнено" value={formatTonFull(order.filledTon)}/></>:null}<TradeRowV1 label={order.filledTon>0?'Неисполненный остаток':'В предложении'} value={formatTonFull(order.remainingTon)}/></div>
  <p className={s.note}>{order.filledTon>0?`Исполнено ${formatTonFull(order.filledTon)}. Остаток ${formatTonFull(order.remainingTon)} ожидает встречное предложение и остаётся в резерве.`:'Предложение ожидает встречную ставку. До исполнения его можно отменить.'}</p>{p.errorMessage?<p className={s.error} role="alert">{p.errorMessage}</p>:null}
 </TradeShellV1>
 if(confirming)return <TradeShellV1 market={market} side={selectedSide} own onClose={close} state title="Подтверждение своей заявки" frame="819:51728" footer={<Button className={s.cta} fullWidth loading={submitting} disabled={!valid||!onSubmit} onClick={onSubmit}>Создать заявку</Button>}>
  {context}<SelectedOutcomeV1 market={market} side={selectedSide} odds={odds} own/><div className={s.execution}><TradeRowV1 label="Сумма / резерв" value={formatTonFull(amount)}/></div>
  <p className={s.note}>Предложение может ждать встречную ставку. Расчёт выплаты — только для исполненной части.</p>
  {(p.matchedTon??0)>0?<><TradeRowV1 label="Исполнится сейчас" value={formatTonFull(p.matchedTon)}/><TradeRowV1 label="Будет ждать" value={formatTonFull(p.restTon)}/>{p.guarantorCosts?<GuarantorTradeCosts costs={p.guarantorCosts}/>:<TradeRowV1 label="Выплата исполняемой части до сбора" value={formatTonFull(p.previewPayoutTon)}/>}</>:null}
  {p.errorMessage?<p className={s.error} role="alert">{p.errorMessage}</p>:null}
 </TradeShellV1>
 const failed=viewState!=='ready'
 return <TradeShellV1 market={market} side={selectedSide} own onClose={close} onOtherMode={p.onQuickTrade?()=>p.onQuickTrade?.(selectedSide):undefined} state={failed} backdrop={!failed} footer={failed?<><Button className={s.cta} fullWidth disabled={viewState==='loading'||!p.onRetry} onClick={p.onRetry}>{viewState==='loading'?'Загружаем…':'Повторить'}</Button><button type="button" className={s.close} onClick={onBack}>К событию</button></>:<Button className={s.cta} fullWidth disabled={!valid} onClick={()=>setConfirming(true)}>Проверить заявку</Button>}>
 {failed?<><h1 className={s.stateTitle}>{viewState==='loading'?'Загружаем событие…':viewState==='forbidden'?'Недостаточно прав':'Не удалось загрузить событие'}</h1><p className={s.note}>{viewState==='forbidden'?'Проверьте ссылку и учётную запись.':'Повторите загрузку события.'}</p></>:<>
 {context}<SelectedOutcomeV1 market={market} side={selectedSide} odds={odds} own onSelect={p.onSelectSide}/>
 <div className={s.fields}><NumericTradeFieldV1 label="Ваш коэффициент" value={odds} onChange={p.onOddsChange} disabled={submitting} odds/><NumericTradeFieldV1 label="Сумма, TON" value={amount} onChange={p.onAmountChange} disabled={submitting}/></div>
 <div className={s.execution}><TradeRowV1 label="Будет зарезервировано" value={formatTonFull(amount)}/></div>
 <p className={s.note}>Предложение может ждать встречную ставку. Расчёт выплаты — только для исполненной части.</p>
 {p.availableTon!=null&&amount>p.availableTon?<p className={s.error} role="alert">Недостаточно TON. Доступно {formatTonFull(p.availableTon)}.</p>:null}{p.noticeMessage?<p className={s.warning} role="status">{p.noticeMessage}</p>:null}{p.errorMessage?<p className={s.error} role="alert">{p.errorMessage}</p>:null}
 </>}
 </TradeShellV1>
}
