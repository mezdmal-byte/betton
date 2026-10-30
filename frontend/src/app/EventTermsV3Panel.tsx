import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventTerms, eventV3Action } from '../api/eventGovernanceV3'
import { errorDetail } from '../api/errors'
import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { displayTime } from '../api/guarantors'
import s from './GovernanceV3.module.css'
import { useVisualV1 } from '../visualV1/VisualV1Context'
import { CreatorDecisionV1 } from '../visualV1/CreatorDecisionV1'

export function EventTermsV3Panel({marketId,userId,status}: {marketId:number;userId?:number;status?:string}) {
  const qc=useQueryClient()
  const visualV1=useVisualV1()
  const query=useQuery({queryKey:['event-terms-v3',marketId,userId],queryFn:()=>getEventTerms(marketId)})
  const [decision,setDecision]=useState(false),[outcome,setOutcome]=useState('0'),[reason,setReason]=useState('')
  const mutation=useMutation({mutationFn:({path,body}:{path:string;body:unknown})=>eventV3Action(marketId,path,body),onSuccess:()=>{if(!visualV1)setDecision(false);void qc.invalidateQueries()}})
  if(query.isPending)return <p className={s.note}>Загружаем условия…</p>
  if(query.isError)return <div role="alert"><p>{errorDetail(query.error)}</p><Button onClick={()=>void query.refetch()}>Повторить</Button></div>
  const event=query.data
  if(!event)return null
  const owner=userId===event.creator_id
  const decisionAvailableAt=event.timing_version==='start-v1'&&event.event_type==='private'?event.close_at:event.ends_at
  const ended=Boolean(decisionAvailableAt&&new Date(decisionAvailableAt).getTime()<=Date.now())
  return <section className={s.summary}>
    <details><summary>Правила и сроки события</summary>
      <p>{event.rules}</p><p>{event.resolution_method}</p>
      {event.criteria?.map((criterion,i)=><p key={i}>{event.outcomes[i]}: {criterion}</p>)}
      {event.unverifiable?<p>Если результат нельзя определить: {event.unverifiable}</p>:null}
      {event.primary_source?<p>Основной источник: <a href={event.primary_source.url} target="_blank" rel="noreferrer">{event.primary_source.name}</a></p>:null}
      {event.backup_source?<p>Резервный источник: <a href={event.backup_source.url} target="_blank" rel="noreferrer">{event.backup_source.name}</a></p>:null}
      <p>{event.timing_version==='start-v1'?'Начало события · приём ставок закрывается':'Приём ставок до'} {displayTime(event.close_at)}</p>
      {event.ends_at?<p>Предполагаемое завершение: {displayTime(event.ends_at)}</p>:event.event_type==='private'?<p>После начала события создатель определяет результат, когда примет решение. Срок расчёта заранее не задан.</p>:null}
      <p>Редакция {event.revision}</p>
    </details>
    {event.event_type==='private'?<>
      <p>Результат определяет создатель события по этим правилам.</p>
      {!event.consent&&userId?<Button fullWidth disabled={mutation.isPending} onClick={()=>mutation.mutate({path:'consent',body:{revision:event.revision}})}>Принимаю условия и решение создателя</Button>:null}
      {owner&&ended&&status!=='resolved'&&status!=='cancelled'?<Button variant="secondary" onClick={()=>setDecision(true)}>Определить результат</Button>:null}
      {decision&&visualV1?<CreatorDecisionV1 event={event} pending={mutation.isPending} error={mutation.isError?errorDetail(mutation.error):undefined} onClose={()=>setDecision(false)} onSubmit={(body,cancel)=>mutation.mutateAsync({path:cancel?'creator-cancel':'creator-decision',body})}/>:decision?<div className={s.overlay} role="dialog" aria-modal="true" aria-label="Подтверждение результата">
        <header><button onClick={()=>setDecision(false)}>← Назад</button><h2>Результат события</h2></header>
        <main><p>{event.question}</p><label className={s.field}>Победивший исход<select value={outcome} onChange={e=>setOutcome(e.target.value)}>{event.outcomes.map((name,i)=><option key={i} value={i}>{name}</option>)}</select></label><TextField label="Основание решения" multiline value={reason} onChange={setReason}/><p>Проверьте результат: подтверждение запустит расчёт ставок.</p>
          {mutation.isError?<p role="alert">{errorDetail(mutation.error)}</p>:null}
          <Button fullWidth disabled={!reason.trim()||mutation.isPending} onClick={()=>mutation.mutate({path:'creator-decision',body:{outcome:Number(outcome),reason}})}>Подтвердить результат</Button>
          <Button variant="secondary" fullWidth disabled={!reason.trim()||mutation.isPending} onClick={()=>{if(window.confirm('Отменить событие с возвратом ставок по указанному основанию?'))mutation.mutate({path:'creator-cancel',body:{reason}})}}>Результат нельзя определить — отменить</Button>
        </main></div>:null}
    </>:null}
    {mutation.isError&&!decision?<p role="alert">{errorDetail(mutation.error)}</p>:null}
  </section>
}
