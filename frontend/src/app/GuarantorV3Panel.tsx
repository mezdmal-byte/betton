import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { caseAction, displayTime, guarantors, type GuarantorCase } from '../api/guarantors'
import { eventV3Action, getEventTerms } from '../api/eventGovernanceV3'
import { errorDetail } from '../api/errors'
import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { GuarantorDetails } from './GuarantorReputation'
import { syncTelegramBackButton } from '../telegram/webapp'
import { IntegrationUnavailableScreen } from './IntegrationUnavailableScreen'
import s from './GovernanceV3.module.css'

export function GuarantorV3Panel({event,userId}: {event:GuarantorCase;userId:number}) {
  const qc=useQueryClient(),mid=event.market_id
  const [view,setView]=useState<'summary'|'chat'|'reward'|'edit'|'decision'|'profile'>('summary')
  const [unavailable,setUnavailable]=useState(false)
  const [text,setText]=useState(''),[outcome,setOutcome]=useState('0'),[rating,setRating]=useState('5')
  const [fixed,setFixed]=useState('0'),[percent,setPercent]=useState('0'),[mode,setMode]=useState('fixed')
  const [rules,setRules]=useState(''),[method,setMethod]=useState('')
  const terms=useQuery({queryKey:['event-terms-v3',mid,userId],queryFn:()=>getEventTerms(mid)})
  const directory=useQuery({queryKey:['guarantors'],queryFn:guarantors,enabled:view==='profile'||event.state==='needs_guarantor'})
  const creator=event.creator_id===userId,gua=event.guarantor_id===userId,party=creator||gua,review=event.state==='review'
  const refresh=()=>{setText('');void qc.invalidateQueries()}
  const mutation=useMutation({mutationFn:({action,extra={}}:{action:string;extra?:Record<string,unknown>})=>caseAction(mid,{action,revision:event.revision,text,...extra}),onSuccess:refresh})
  const update=useMutation({mutationFn:({path,body,method}:{path:string;body:unknown;method?:string})=>eventV3Action(mid,path,body,method),onSuccess:()=>{refresh();setView('chat')}})
  useEffect(()=>{if(view==='summary')return;return syncTelegramBackButton(true,()=>setView('summary'))},[view])
  const act=(action:string,extra:Record<string,unknown>={})=>mutation.mutate({action,extra})
  const disabled=mutation.isPending||update.isPending
  const profile=directory.data?.find(g=>g.user_id===event.guarantor_id)
  const paid=Number(event.reward?.fixed_ton||0)>0||Number(event.reward?.percent||0)>0
  const labels:Record<string,string>={invited:'Приглашение отправлено',review:'Согласование условий',active:'Условия согласованы',needs_guarantor:'Нужно выбрать другого гаранта',settled:'Результат подтверждён',cancelled:'Событие отменено'}
  if(unavailable)return <IntegrationUnavailableScreen kind="guarantor" onBack={()=>{setUnavailable(false);setView('chat')}}/>
  const body=<>
    <p>Гарант: <strong>{event.guarantor_name}</strong> <button onClick={()=>setView('profile')}>Профиль</button></p>
    <p className={s.note}>Окончание события: {event.ends_at?displayTime(event.ends_at):'Нет данных'}. Решение гаранта — до {displayTime(event.result_due_at)}.</p>
    {event.deadline&&['invited','review'].includes(event.state)?<p className={s.note}>Ответить до {displayTime(event.deadline)}</p>:null}
    <details open={view==='summary'}><summary>Согласованные правила · редакция {event.revision}</summary><p>{event.criteria}</p><p>{event.source}</p></details>
    {gua&&event.state==='invited'?<div className={s.actions}><Button disabled={disabled} onClick={()=>act('acknowledge')}>Перейти к согласованию</Button><Button variant="secondary" disabled={disabled} onClick={()=>act('decline')}>Отклонить приглашение</Button></div>:null}
    {event.state==='needs_guarantor'&&creator?<><p>Предыдущее приглашение завершено. Выберите доступного гаранта.</p>{directory.data?.filter(g=>g.available&&g.user_id!==userId).map(g=><Button key={g.user_id} variant="secondary" disabled={disabled} onClick={()=>act('invite',{guarantor_id:g.user_id})}>Пригласить {g.name}</Button>)}</>:null}
    {party&&['review','active'].includes(event.state)&&view==='summary'?<Button onClick={()=>setView('chat')}>Открыть чат с {creator?'гарантом':'создателем'}</Button>:null}
    {review&&party?<>
      <div className={s.actions}><Button variant="secondary" onClick={()=>setView('reward')}>Вознаграждение</Button>{creator?<Button variant="secondary" onClick={()=>{setRules(event.criteria);setMethod(event.source);setView('edit')}}>Изменить условия</Button>:null}</div>
      <p className={s.note}>Создатель: {event.creator_confirmed===event.revision?'редакция подтверждена':'ожидается подтверждение'}</p>
      {paid?<><p className={s.warning}>Платные события пока нельзя открыть: резервирование и выплата вознаграждения гаранту не подключены. Предложение сохранено для согласования.</p><Button variant="secondary" onClick={()=>setUnavailable(true)}>Почему событие нельзя открыть</Button></>:null}
      {creator?<Button disabled={disabled||event.creator_confirmed===event.revision} onClick={()=>act('confirm')}>Подтвердить условия</Button>:null}
      {gua?<Button disabled={disabled||paid||event.creator_confirmed!==event.revision} onClick={()=>act('accept')}>Подтвердить и открыть событие</Button>:null}
    </>:null}
    {event.state==='active'&&!event.consent&&!gua?<Button disabled={disabled} onClick={()=>act('consent')}>Принимаю условия и решение гаранта</Button>:null}
    {event.state==='active'&&gua?<Button onClick={()=>setView('decision')}>Определить результат</Button>:null}
    {event.state==='settled'?<p>Окончательный результат: {event.outcomes[event.proposed_outcome??0]}. {event.decision_reason}</p>:null}
    {event.state==='cancelled'?<p>Событие отменено. Средства возвращаются существующим механизмом возврата ставок; проверьте историю.</p>:null}
    {['settled','cancelled'].includes(event.state)&&event.participant&&!gua?<><label className={s.field}>Оценка гаранта<select value={rating} onChange={e=>setRating(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label><TextField label="Отзыв" value={text} onChange={setText} multiline/><Button disabled={disabled} onClick={()=>act('review',{rating:Number(rating)})}>Оставить отзыв</Button></>:null}
  </>
  return <section className={s.summary}><h2>{labels[event.state]||event.state}</h2>{body}
    {mutation.isError?<p className={s.error} role="alert">{errorDetail(mutation.error)}</p>:null}
    {view!=='summary'?<div className={s.overlay} role="dialog" aria-modal="true" aria-label="Согласование с гарантом"><header><button onClick={()=>setView('summary')}>← К событию</button><h2>{({chat:'Чат согласования',reward:'Вознаграждение гаранта',edit:'Изменить условия',decision:'Результат события',profile:'Профиль гаранта'} as const)[view]}</h2></header><main>
      {view==='chat'?<><div className={s.messages}>{event.messages.map(m=><div className={`${s.bubble} ${m.user_id===userId?s.mine:''}`} key={m.id}><small>{m.user_id===event.creator_id?'Создатель':'Гарант'} · {displayTime(m.created_at)}</small>{m.kind==='terms'?`Условия события · редакция ${m.revision}`:m.text}</div>)}</div>{party?<><TextField label="Сообщение" multiline value={text} maxLength={4000} onChange={setText}/><Button disabled={disabled||!text.trim()} onClick={()=>act('message')}>Отправить</Button>{body}</>:null}</>:null}
      {view==='reward'?<><p>Условия вознаграждения согласовываются отдельно от сервисного сбора. Выплаты пока не подключены.</p><label className={s.field}>Способ<select value={mode} onChange={e=>setMode(e.target.value)}><option value="fixed">Сумма TON</option><option value="percent">Процент от чистой прибыли</option><option value="combined">Сумма и процент</option></select></label>{mode!=='percent'?<TextField label="Фиксированная сумма TON" value={fixed} onChange={setFixed} inputMode="decimal"/>:null}{mode!=='fixed'?<TextField label="Процент от чистой прибыли победителя" value={percent} onChange={setPercent} inputMode="decimal"/>:null}<Button disabled={disabled} onClick={()=>update.mutate({path:'reward',body:{expected_revision:event.revision,mode,fixed_ton:fixed,percent}})}>Предложить условия</Button>{event.reward?<><p>Последнее предложение: {event.reward.fixed_ton} TON + {event.reward.percent}% от чистой прибыли.</p><Button disabled={disabled||event.reward.accepted_by.includes(userId)} onClick={()=>update.mutate({path:'reward',body:{action:'accept',expected_revision:event.revision}})}>Принять предложение</Button></>:null}</>:null}
      {view==='edit'?<><TextField label="Правила события" multiline value={rules} onChange={setRules}/><TextField label="Как будет определён результат" multiline value={method} onChange={setMethod}/><p className={s.note}>Редактирование доступно только до открытия ставок. Изменённую редакцию нужно подтвердить заново.</p><Button disabled={disabled||!rules.trim()||!method.trim()||!terms.data} onClick={()=>{if(terms.data)update.mutate({path:'terms',method:'PUT',body:{expected_revision:event.revision,event:{...terms.data,rules,resolution_method:method}}})}}>Сохранить новую редакцию</Button></>:null}
      {view==='decision'?<><p>Своевременное решение окончательное. На решение отводится 24 часа после окончания события.</p><label className={s.field}>Победивший исход<select value={outcome} onChange={e=>setOutcome(e.target.value)}>{event.outcomes.map((name,i)=><option key={i} value={i}>{name}</option>)}</select></label><TextField label="Основание результата" multiline value={text} onChange={setText}/><Button disabled={disabled||!text.trim()} onClick={()=>{if(window.confirm('Подтвердить окончательный результат? Это запустит расчёт ставок.'))act('propose',{outcome:Number(outcome)})}}>Подтвердить результат</Button></>:null}
      {view==='profile'?(profile?<GuarantorDetails guarantor={profile} onBack={()=>setView('summary')}/>:<p>Профиль загружается или сейчас недоступен.</p>):null}
      {mutation.isError||update.isError?<p className={s.error} role="alert">{errorDetail(mutation.error||update.error)}</p>:null}
    </main></div>:null}
  </section>
}
