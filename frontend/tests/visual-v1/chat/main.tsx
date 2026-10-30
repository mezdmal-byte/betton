/** Isolated Figma fixtures. Never imported by the application. */
import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {I18nProvider} from '../../../src/i18n'
import {VisualV1Provider} from '../../../src/visualV1/VisualV1Context'
import {ChatScreen} from '../../../src/screens/ChatScreen'
import type {ChatMessageOut} from '../../../src/api/types'
import v1 from '../../../src/visualV1/VisualV1.module.css'
import '../../../src/styles/tokens.css'
import '../../../src/styles/reset.css'
import '../../../src/styles/global.css'
const stamp=(h:number,m:number)=>{const d=new Date();d.setHours(h,m,0,0);return d.toISOString()}
const initial:ChatMessageOut[]=[{id:1,author:{id:1,display_name:'GameAnalyst'},text:'Похоже, Spirit сегодня в хорошей форме.',created_at:stamp(12,20)},{id:2,author:{id:2,display_name:'ton_master'},text:'Жду интересной борьбы на первой карте.',created_at:stamp(12,18)},{id:3,author:{id:3,display_name:'csfan'},text:'Кто как думает, возьмут ли Liquid карту?',created_at:stamp(12,15)}]
function Fixture(){const p=new URLSearchParams(location.search),lobby=p.get('mode')==='lobby',failure=p.has('fail'),legacy=p.get('ui')==='legacy';const [messages,setMessages]=useState(p.has('empty')?[]:initial),[sending,setSending]=useState(false),[error,setError]=useState(''),[calls,setCalls]=useState(0),[last,setLast]=useState('');const send=async(input:{text:string;replyToId?:number;attachedMarketId?:number})=>{setSending(true);setError('');setCalls(n=>n+1);setLast(JSON.stringify(input));try{await new Promise(resolve=>setTimeout(resolve,80));if(failure)throw new Error('Не удалось отправить сообщение. Текст сохранён.');setMessages(old=>[...old,{id:Math.max(0,...old.map(m=>m.id))+1,author:{id:5,display_name:'Автор QA'},text:input.text,reply_to:input.replyToId?{id:input.replyToId,author_name:old.find(m=>m.id===input.replyToId)?.author.display_name??'',text:old.find(m=>m.id===input.replyToId)?.text??''}:null,attached_market:input.attachedMarketId?{id:7,question:'TON выше $12?',status:'open'}:null,created_at:stamp(12,21)}])}catch(e){setError((e as Error).message);throw e}finally{setSending(false)}};
return <I18nProvider><VisualV1Provider enabled={!legacy}><div className={legacy?'':v1.root} style={{height:'100dvh'}} data-chat-send-count={calls} data-chat-last={last}><ChatScreen title={lobby?'Лобби BetTON':'Обсуждение'} subtitle={lobby?'Общий чат':'Team Spirit — Team Liquid'} messages={messages} currentUserId={p.has('guest')?undefined:5} isAdmin={p.has('admin')} lobby={lobby} marketId={lobby?undefined:42} showInternalBack onBack={()=>setLast('back')} onSend={input=>{void send(input).catch(()=>{})}} onSendConfirmed={send} sending={sending} sendError={error||undefined} onDelete={id=>setMessages(old=>old.map(m=>m.id===id?{...m,deleted:true,text:'Сообщение удалено'}:m))} onOpenMarket={id=>setLast('market:'+id)} onShare={lobby?undefined:async()=>true} shareValue="https://example.test/v2/?share=fixture" attachableMarkets={[{id:7,question:'TON выше $12?'}]}/></div></VisualV1Provider></I18nProvider>}
createRoot(document.getElementById('root')!).render(<Fixture/> )
