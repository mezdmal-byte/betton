import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventTerms, eventV3Action } from '../api/eventGovernanceV3'
import { errorDetail } from '../api/errors'
import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { displayTime } from '../api/guarantors'
import s from './GovernanceV3.module.css'

export function EventTermsV3Panel({marketId,userId,status}: {marketId:number;userId?:number;status?:string}) {
  const qc=useQueryClient()
  const query=useQuery({queryKey:['event-terms-v3',marketId,userId],queryFn:()=>getEventTerms(marketId)})
  const [decision,setDecision]=useState(false),[outcome,setOutcome]=useState('0'),[reason,setReason]=useState('')
  const mutation=useMutation({mutationFn:({path,body}:{path:string;body:unknown})=>eventV3Action(marketId,path,body),onSuccess:()=>{setDecision(false);void qc.invalidateQueries()}})
  if(query.isPending)return <p className={s.note}>Загружаем условия…</p>
  if(query.isError)return <div role="alert"><p>{errorDetail(query.error)}</p><Button onClick={()=>void query.refetch()}>Повторить</Button></div>
  const event=query.data
  if(!event)return null
  const owner=userId===event.creator_id,ended=new Date(event.ends_at).getTime()<=Date.now()
  return <section className={s.summary}>
    <details><summary>Правила и сроки события</summary>
      <p>{event.rules}</p><p>{event.resolution_method}</p>
      {event.criteria?.map((criterion,i)=><p key={i}>{event.outcomes[i]}: {criterion}</p>)}
      {event.unverifiable?<p>Если результат нельзя определить: {event.unverifiable}</p>:null}
      {event.primary_source?<p>Основной источник: <a href={event.primary_source.url} target="_blank" rel="noreferrer">{event.primary_source.name}</a></p>:null}
      {event.backup_source?<p>Резервный источник: <a href={event.backup_source.url} target="_blank" rel="noreferrer">{event.backup_source.name}</a></p>:null}
      <p>Приём ставок до {displayTime(event.close_at)}</p><p>Окончание события: {displayTime(event.ends_at)}</p>
      <p>Редакция {event.revision}</p>
    </details>
    {event.event_type==='private'?<>
      <p>Результат определяет создатель события по этим правилам.</p>
      {!event.consent&&userId?<Button fullWidth disabled={mutation.isPending} onClick={()=>mutation.mutate({path:'consent',body:{revision:event.revision}})}>Принимаю условия и решение создателя</Button>:null}
      {owner&&ended&&status!=='resolved'&&status!=='cancelled'?<Button variant="secondary" onClick={()=>setDecision(true)}>Определить результат</Button>:null}
      {decision?<div className={s.overlay} role="dialog" aria-modal="true" aria-label="Подтверждение результата">
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
