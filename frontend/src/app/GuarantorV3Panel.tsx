import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { caseAction, displayTime, guarantors, remainingSeconds, type GuarantorCase, type GuarantorRewardMode } from '../api/guarantors'
import { eventV3Action, getEventTerms } from '../api/eventGovernanceV3'
import { errorDetail } from '../api/errors'
import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { GuarantorDetails } from './GuarantorReputation'
import { syncTelegramBackButton } from '../telegram/webapp'
import { IntegrationUnavailableScreen } from './IntegrationUnavailableScreen'
import { GuarantorFundingDetails, GuarantorRewardDetails, GuarantorRewardModeField, rewardTariffText } from './GuarantorRewardDetails'
import { GuarantorCancellationForm } from './GuarantorCancellationForm'
import s from './GovernanceV3.module.css'

export function GuarantorV3Panel({event,userId}: {event:GuarantorCase;userId:number}) {
  const qc=useQueryClient(),mid=event.market_id
  const [view,setView]=useState<'summary'|'chat'|'reward'|'edit'|'decision'|'profile'|'cancel'|'cancel-confirm'>('summary')
  const [unavailable,setUnavailable]=useState(false)
  const [text,setText]=useState(''),[outcome,setOutcome]=useState('0'),[rating,setRating]=useState('5')
  const [fixed,setFixed]=useState('0'),[percent,setPercent]=useState('0'),[mode,setMode]=useState<GuarantorRewardMode>('fixed')
  const [rules,setRules]=useState(''),[method,setMethod]=useState('')
  const [now,setNow]=useState(Date.now)
  const terms=useQuery({queryKey:['event-terms-v3',mid,userId],queryFn:()=>getEventTerms(mid)})
  const directory=useQuery({queryKey:['guarantors'],queryFn:guarantors,enabled:view==='profile'||event.state==='needs_guarantor'})
  const creator=event.creator_id===userId,gua=event.guarantor_id===userId,party=creator||gua,review=event.state==='review'
  useEffect(()=>{if(!gua||event.state!=='active')return;const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[gua,event.state])
  const refresh=()=>{setText('');void qc.invalidateQueries()}
  const mutation=useMutation({mutationFn:({action,extra={}}:{action:string;extra?:Record<string,unknown>})=>caseAction(mid,{action,revision:event.revision,text,...extra}),onSuccess:(_data,variables)=>{refresh();if(['propose','cancel','accept'].includes(variables.action))setView('summary')}})
  const update=useMutation({mutationFn:({path,body,method}:{path:string;body:unknown;method?:string})=>eventV3Action(mid,path,body,method),onSuccess:()=>{refresh();setView(current=>current==='reward'||current==='edit'?'chat':current)}})
  const backFromOverlay=()=>setView(view==='cancel-confirm'?'cancel':'summary')
  useEffect(()=>{if(view==='summary')return;return syncTelegramBackButton(true,backFromOverlay)},[view])
  const act=(action:string,extra:Record<string,unknown>={})=>mutation.mutate({action,extra})
  const disabled=mutation.isPending||update.isPending
  const profile=directory.data?.find(g=>g.user_id===event.guarantor_id)
  const paid=Number(event.reward?.fixed_ton||0)>0||Number(event.reward?.percent||0)>0
  const paymentsSupported=event.reward_payments_supported===true
  const decisionAvailable=Boolean(event.ends_at&&remainingSeconds(event.ends_at,now)===0&&remainingSeconds(event.result_due_at,now)>0)
  const openReward=()=>{setFixed(event.reward?.fixed_ton??'0');setPercent(event.reward?.percent??'0');setMode(event.reward?.mode??'fixed');setView('reward')}
  const labels:Record<string,string>={invited:'Приглашение отправлено',review:'Согласование условий',collecting:'Формирование фонда',active:'Событие активно',needs_guarantor:'Нужно выбрать другого гаранта',settled:'Результат подтверждён',cancelled:'Событие отменено'}
  if(unavailable&&!paymentsSupported)return <IntegrationUnavailableScreen kind="guarantor" onBack={()=>{setUnavailable(false);setView('chat')}}/>
  const body=<>
    <p>Гарант: <strong>{event.guarantor_name}</strong> <button onClick={()=>setView('profile')}>Профиль</button></p>
    <p className={s.note}>Окончание события: {event.ends_at?displayTime(event.ends_at):'Нет данных'}. Решение гаранта — до {displayTime(event.result_due_at)}.</p>
    {event.deadline&&['invited','review'].includes(event.state)?<p className={s.note}>Ответить до {displayTime(event.deadline)}</p>:null}
    <details open={view==='summary'}><summary>Правила события · редакция {event.revision}</summary><p>{event.criteria}</p><p>{event.source}</p></details>
    <GuarantorRewardDetails reward={event.reward}/>
    <GuarantorFundingDetails funding={event.funding} outcomes={event.outcomes} collecting={event.state==='collecting'} state={event.state}/>
    {gua&&event.state==='invited'?<div className={s.actions}><Button disabled={disabled} onClick={()=>act('acknowledge')}>Перейти к согласованию</Button><Button variant="secondary" disabled={disabled} onClick={()=>act('decline')}>Отклонить приглашение</Button></div>:null}
    {event.state==='needs_guarantor'&&creator?<><p>Предыдущее приглашение завершено. Выберите доступного гаранта.</p>{directory.data?.filter(g=>g.available&&g.user_id!==userId).map(g=><Button key={g.user_id} variant="secondary" disabled={disabled} onClick={()=>act('invite',{guarantor_id:g.user_id})}>Пригласить {g.name}</Button>)}</>:null}
    {party&&['review','collecting','active'].includes(event.state)&&view==='summary'?<Button onClick={()=>setView('chat')}>Открыть чат с {creator?'гарантом':'создателем'}</Button>:null}
    {review&&party?<>
      <div className={s.actions}><Button variant="secondary" onClick={openReward}>Вознаграждение</Button>{creator?<Button variant="secondary" onClick={()=>{setRules(event.criteria);setMethod(event.source);setView('edit')}}>Изменить условия</Button>:null}</div>
      <p className={s.note}>Создатель: {event.creator_confirmed===event.revision?'редакция подтверждена':'ожидается подтверждение'}</p>
      {paid&&!paymentsSupported?<><p className={s.warning}>Платные события пока нельзя открыть: расчёт и выплата вознаграждения гаранту не подключены. Предложение сохранено для согласования.</p><Button variant="secondary" onClick={()=>setUnavailable(true)}>Почему событие нельзя открыть</Button></>:null}
      {creator?<Button disabled={disabled||event.creator_confirmed===event.revision} onClick={()=>act('confirm')}>Подтвердить условия</Button>:null}
      {gua?<Button disabled={disabled||(paid&&!paymentsSupported)||event.creator_confirmed!==event.revision} onClick={()=>act('accept')}>{paymentsSupported?'Подтвердить и начать сбор ставок':'Подтвердить и открыть событие'}</Button>:null}
    </>:null}
    {['collecting','active'].includes(event.state)&&!event.consent&&!gua?<Button disabled={disabled} onClick={()=>act('consent')}>Принимаю условия и решение гаранта</Button>:null}
    {event.state==='active'&&gua?<><Button disabled={!decisionAvailable} onClick={()=>setView('decision')}>Определить результат</Button>{!decisionAvailable?<p className={s.note}>Решение доступно после окончания события и до истечения 24 часов. Окончательный срок указан выше.</p>:null}</>:null}
    {event.state==='settled'?<p>Окончательный результат: {event.outcomes[event.proposed_outcome??0]}. {event.decision_reason}</p>:null}
    {event.state==='cancelled'?<p>Событие отменено. Средства возвращаются существующим механизмом возврата ставок; проверьте историю.</p>:null}
    {['settled','cancelled'].includes(event.state)&&event.participant&&!gua?<><label className={s.field}>Оценка гаранта<select value={rating} onChange={e=>setRating(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label><TextField label="Отзыв" value={text} onChange={setText} multiline/><Button disabled={disabled} onClick={()=>act('review',{rating:Number(rating)})}>Оставить отзыв</Button></>:null}
  </>
  return <section className={s.summary}><h2>{labels[event.state]||event.state}</h2>{body}
    {mutation.isError?<p className={s.error} role="alert">{errorDetail(mutation.error)}</p>:null}
    {view!=='summary'?<div className={s.overlay} role="dialog" aria-modal="true" aria-label="Согласование с гарантом"><header><button onClick={backFromOverlay}>← {view==='cancel-confirm'?'К основанию отмены':'К событию'}</button><h2>{({chat:'Чат согласования',reward:'Вознаграждение гаранта',edit:'Изменить условия',decision:'Результат события',profile:'Профиль гаранта',cancel:'Отменить событие','cancel-confirm':'Подтверждение отмены'} as const)[view]}</h2></header><main>
      {view==='chat'?<><div className={s.messages}>{event.messages.map(m=><div className={`${s.bubble} ${m.user_id===userId?s.mine:''}`} key={m.id}><small>{m.user_id===event.creator_id?'Создатель':'Гарант'} · {displayTime(m.created_at)}</small>{m.kind==='terms'?`Условия события · редакция ${m.revision}`:m.text}</div>)}</div>{party?<><TextField label="Сообщение" multiline value={text} maxLength={4000} onChange={setText}/><Button disabled={disabled||!text.trim()} onClick={()=>act('message')}>Отправить</Button>{body}</>:null}</>:null}
      {view==='reward'?<><p>Вознаграждение гаранта согласовывается отдельно от сервисного сбора BetTON.</p>{!paymentsSupported?<p className={s.warning}>Выплаты пока не подключены. Предложение можно сохранить для согласования.</p>:null}<GuarantorRewardModeField mode={mode} onChange={setMode}/>{mode!=='percent'?<TextField label={mode==='percent_minimum'?'Минимальное вознаграждение TON':'Фиксированная сумма TON'} value={fixed} onChange={setFixed} inputMode="decimal"/>:null}{mode!=='fixed'?<TextField label="Процент от прибыли победителей до сборов" value={percent} onChange={setPercent} inputMode="decimal"/>:null}<Button disabled={disabled} onClick={()=>update.mutate({path:'reward',body:{expected_revision:event.revision,mode,fixed_ton:mode==='percent'?'0':fixed,percent:mode==='fixed'?'0':percent}})}>Предложить условия</Button>{event.reward?<><p>Последнее предложение: {rewardTariffText(event.reward)}.</p><Button disabled={disabled||event.reward.accepted_by.includes(userId)} onClick={()=>update.mutate({path:'reward',body:{action:'accept',expected_revision:event.revision}})}>Принять предложение</Button></>:null}</>:null}
      {view==='edit'?<><TextField label="Правила события" multiline value={rules} onChange={setRules}/><TextField label="Как будет определён результат" multiline value={method} onChange={setMethod}/><p className={s.note}>Редактирование доступно только до открытия ставок. Изменённую редакцию нужно подтвердить заново.</p><Button disabled={disabled||!rules.trim()||!method.trim()||!terms.data} onClick={()=>{if(terms.data)update.mutate({path:'terms',method:'PUT',body:{expected_revision:event.revision,event:{...terms.data,rules,resolution_method:method}}})}}>Сохранить новую редакцию</Button></>:null}
      {view==='decision'?<><p>Своевременное решение окончательное. На решение отводится 24 часа после окончания события.</p><label className={s.field}>Победивший исход<select value={outcome} onChange={e=>setOutcome(e.target.value)}>{event.outcomes.map((name,i)=><option key={i} value={i}>{name}</option>)}</select></label><TextField label="Основание результата" multiline value={text} onChange={setText}/><Button disabled={disabled||!text.trim()||!decisionAvailable} onClick={()=>{if(window.confirm('Подтвердить окончательный результат? Это запустит расчёт ставок.'))act('propose',{outcome:Number(outcome)})}}>Подтвердить результат</Button><Button variant="secondary" disabled={disabled||!decisionAvailable} onClick={()=>{setText('');setView('cancel')}}>Результат нельзя определить — отменить</Button></>:null}
      {view==='cancel'||view==='cancel-confirm'?<GuarantorCancellationForm reason={text} confirming={view==='cancel-confirm'} pending={disabled} available={decisionAvailable} onReasonChange={setText} onReview={()=>setView('cancel-confirm')} onConfirm={()=>{if(decisionAvailable)act('cancel')}} onEdit={()=>setView('cancel')}/>:null}
      {view==='profile'?(profile?<GuarantorDetails guarantor={profile} onBack={()=>setView('summary')}/>:<p>Профиль загружается или сейчас недоступен.</p>):null}
      {mutation.isError||update.isError?<p className={s.error} role="alert">{errorDetail(mutation.error||update.error)}</p>:null}
    </main></div>:null}
  </section>
}
