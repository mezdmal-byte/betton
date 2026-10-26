import { useLayoutEffect, useRef, useState } from 'react'
export type Direction = 'exchange'|'folio'|'pocket'
export type Screen = 'feed'|'detail'|'trade'|'review'|'result'|'portfolio'|'create'|'notices'|'profile'
export const markets = [
  {id:1,title:'Поезд прибудет вовремя?',topic:'Город',close:'Завтра, 18:00',yes:1.67,no:2.4,liquidity:120,description:'Время прибытия по официальному табло. «Да», если задержка не превышает 5 минут. При отмене — возврат.',creator:'Демо · Марк'},
  {id:2,title:'Команда Альфа выиграет финал?',topic:'Спорт',close:'Сегодня, 21:00',yes:2.1,no:1.8,liquidity:75,description:'Победитель финального матча по итоговому протоколу, включая дополнительное время.',creator:'Демо · Ирина'},
  {id:3,title:'Новая выставка откроется в ноябре?',topic:'Культура',close:'30 окт., 12:00',yes:null,no:null,liquidity:0,description:'Дата открытия на официальной странице музея. Нет встречных предложений: можно создать собственную заявку.',creator:'Демо · Ли'},
]
export type Market = typeof markets[number]
// This model is fixture-only. Production controllers must use server receipts.
export type DemoReceipt = {market:Market;side:'yes'|'no';amount:number;kind:'ioc'|'limit';odds:number;filled:number;refunded:number;remaining:number;quotedAt:string}
export function useCoreJourney(){
  const [screen,setScreen] = useState<Screen>('feed'),[market,setMarket]=useState(markets[0])
  const [side,setSide]=useState<'yes'|'no'>('yes'),[amount,setAmount]=useState('10'),[kind,setKind]=useState<'ioc'|'limit'>('ioc'),[odds,setOdds]=useState('1.80')
  const [query,setQuery]=useState(''),[category,setCategory]=useState('Все')
  const [receipts,setReceipts]=useState<DemoReceipt[]>([]),[review,setReview]=useState<DemoReceipt|null>(null)
  const priorScreen=useRef<Screen>('feed'),launchControl=useRef<HTMLElement|null>(null)
  const available=1000-receipts.reduce((sum,r)=>sum+r.filled+r.remaining,0)
  const n=Number(amount),valid=Number.isFinite(n)&&n>=0.01&&n<=available&&(kind==='ioc'?market[side]!=null:Number(odds)>=1.00001&&Number(odds)<=10000)
  const shown=markets.filter(m=>(category==='Все'||m.topic===category)&&m.title.toLowerCase().includes(query.toLowerCase()))
  const open=(m:Market)=>{setMarket(m);setScreen('detail')}
  const trade=(choice:'yes'|'no')=>{launchControl.current=document.activeElement as HTMLElement;setSide(choice);setKind(market.liquidity?'ioc':'limit');setScreen('trade')}
  const back=()=>setScreen(screen==='trade'?'detail':screen==='review'?'trade':'feed')
  useLayoutEffect(()=>{
    const previous=priorScreen.current;priorScreen.current=screen
    const main=document.querySelector<HTMLElement>('[data-direction] main')
    if(main)main.scrollTop=0
    if(previous==='trade'&&screen==='detail'){
      const trigger=launchControl.current?.isConnected?launchControl.current:main?.querySelector<HTMLElement>(`[data-demo-outcome=${side}]`)
      if(trigger){trigger.focus({preventScroll:true});return}
    }
    const heading=document.querySelector<HTMLElement>('[role=dialog] h2')??main?.querySelector<HTMLElement>('h1')
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
  },[screen,side])
  const prepareReview=()=>{
    if(!valid)return
    const filled=Math.min(n,market.liquidity)
    setReview({market:{...market},side,amount:n,kind,odds:kind==='limit'?Number(odds):market[side]!,filled,
      refunded:kind==='ioc'?n-filled:0,remaining:kind==='limit'?n-filled:0,quotedAt:new Date().toLocaleTimeString('ru-RU')})
    setScreen('review')
  }
  return {screen,setScreen,market,side,setSide,amount,setAmount,kind,setKind,odds,setOdds,query,setQuery,category,setCategory,shown,valid,open,trade,back,receipts,review,available,prepareReview,
    confirm:()=>{if(review){setReceipts(previous=>[...previous,review]);setScreen('result')}},n:Number.isFinite(n)?n:0}
}
export type Journey = ReturnType<typeof useCoreJourney>
