import { apiRequest, isApiError } from './client'
import { shareTokenFor } from './share'
import type { CreateEventBody } from './eventsV3'

export type EventTermsV3 = CreateEventBody & { revision:number; creator_id:number; guarantor_due_at?:string|null; consent:boolean; moderator_edited:boolean; reward_payments_supported:boolean }
export type EventRevisionV3 = {id:number;revision:number;actor_id:number|null;kind:string;snapshot:CreateEventBody&{creator_id:number};created_at:string}
export async function getEventTerms(mid:number):Promise<EventTermsV3|null>{
  try { return (await apiRequest<EventTermsV3>(`/ux-v3/events/${mid}/terms`,{shareToken:shareTokenFor(mid)})).data }
  catch(error){if(isApiError(error)&&error.status===404)return null;throw error}
}
export const eventV3Action=(mid:number,path:string,body:unknown,method='POST')=>apiRequest(`/ux-v3/events/${mid}/${path}`,{method,jsonBody:body,shareToken:shareTokenFor(mid)}).then(r=>r.data)
export const getEventRevisions=(mid:number)=>apiRequest<EventRevisionV3[]>(`/ux-v3/events/${mid}/revisions`).then(r=>r.data)
