import type {GuarantorCase} from '../api/guarantors'
import {parseDate} from './time'

/** UI availability only. The server remains the authority for every transition. */
export function guarantorWorkflowPolicy(event:GuarantorCase,userId:number,now:number){
 const creator=event.creator_id===userId,guarantor=event.guarantor_id===userId,party=creator||guarantor
 const deadline=event.deadline?parseDate(event.deadline)?.getTime():undefined
 const start=parseDate(event.close_at)?.getTime(),end=event.ends_at?parseDate(event.ends_at)?.getTime():undefined,due=parseDate(event.result_due_at)?.getTime()
 const timedOut=['invited','review'].includes(event.state)&&deadline!=null&&deadline<=now
 const beforeStart=start!=null&&start>now
 const review=event.state==='review'&&!timedOut&&beforeStart
 const paid=Number(event.reward?.fixed_ton??0)>0||Number(event.reward?.percent??0)>0
 const hasRewardProposal=event.reward?.proposed_by!=null||Boolean(event.reward?.accepted_by.length)
 const creatorSignedReward=Boolean(event.reward?.accepted_by.includes(event.creator_id))
 const decisionAvailable=event.state==='active'&&end!=null&&end<=now&&due!=null&&due>now
 return {creator,guarantor,party,timedOut,review,paid,
  canAcknowledge:guarantor&&event.state==='invited'&&!timedOut&&beforeStart,
  canDecline:guarantor&&event.state==='invited'&&!timedOut,
  canConfirm:creator&&review&&event.creator_confirmed!==event.revision,
  canAccept:guarantor&&review&&event.creator_confirmed===event.revision&&(!hasRewardProposal||creatorSignedReward)&&(!paid||event.reward_payments_supported===true),
  canEditTerms:creator&&review,
  canNegotiateReward:party&&review,
  canMessage:party&&!timedOut&&!['settled','cancelled','needs_guarantor'].includes(event.state),
  canConsent:!guarantor&&!event.consent&&['collecting','active'].includes(event.state),
  canDecide:guarantor&&decisionAvailable,
  canReview:event.participant&&!guarantor&&['settled','cancelled'].includes(event.state),
  canInvite:creator&&event.state==='needs_guarantor',
 }
}
export function remainingWindowLabel(value:string,now:number){const end=parseDate(value)?.getTime();if(end==null)return '—';const minutes=Math.max(0,Math.ceil((end-now)/60000));return minutes===0?'Срок истёк':minutes>=60?`${Math.floor(minutes/60)} ч ${minutes%60} мин`:`${minutes} мин`}
export function isReviewedRevision(current:number,reviewed:number|null){return reviewed!=null&&current===reviewed}
