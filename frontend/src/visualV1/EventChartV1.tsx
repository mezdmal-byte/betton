import { useState } from 'react'
import type { ChartPoint, MarketFixture } from '../types/market'
import { formatOdds, formatTonFull } from '../lib/format'
import s from './EventV1.module.css'

export function chartRows(rows: ChartPoint[], hours: number, now: number) {
  return rows.filter(p => Number.isFinite(p.t) && p.t >= 1e11 && Number.isFinite(p.odds) && p.odds > 0 && p.t <= now && (!hours || p.t >= now - hours * 3600000)).sort((a,b) => a.t-b.t)
}
export function nearestTrade(rows: ChartPoint[], time: number) {
  return rows.reduce<ChartPoint | null>((best, row) => !best || Math.abs(row.t-time) < Math.abs(best.t-time) ? row : best, null)
}
const timeLabel = (t: number) => new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(t)
export function EventChartV1({a,b,market}: {a:ChartPoint[];b:ChartPoint[];market:MarketFixture}) {
  const [period,setPeriod]=useState(24),[volume,setVolume]=useState(false),[point,setPoint]=useState<number|null>(null)
  const now=Date.now(),aa=chartRows(a,period,now),bb=chartRows(b,period,now),all=[...aa,...bb]
  const min=Math.min(...all.map(p=>p.odds)),max=Math.max(...all.map(p=>p.odds)),span=Math.max(max-min,.1)
  let from=period?now-period*3600000:Math.min(...all.map(p=>p.t)),to=period?now:Math.max(...all.map(p=>p.t))
  if(to===from){from-=1800000;to+=1800000}
  const x=(p:ChartPoint)=>32+(p.t-from)/Math.max(1,to-from)*286
  const y=(p:ChartPoint)=>18+(max-p.odds)/span*138
  const line=(rows:ChartPoint[])=>rows.map((p,i)=>`${i?'L':'M'}${x(p)},${y(p)}`).join(' ')
  const selected=point==null?[]:[nearestTrade(aa,point),nearestTrade(bb,point)]
  return <>
    <div className={s.legend}><span><i/>{market.outcomeA.label}<b>{formatOdds(aa.at(-1)?.odds??market.outcomeA.odds)}</b></span><span><i/>{market.outcomeB.label}<b>{formatOdds(bb.at(-1)?.odds??market.outcomeB.odds)}</b></span></div>
    <div className={s.ranges} aria-label="Период графика">{[[1,'1 ч'],[24,'24 ч'],[0,'Всё время']].map(([value,label])=><button key={value} type="button" aria-pressed={period===value} onClick={()=>{setPeriod(Number(value));setPoint(null)}}>{label}</button>)}</div>
    {all.length?<div className={s.plot}>
      {point!=null?<div className={s.chartReadout} role="status"><b>Ближайшие сделки к {timeLabel(point)} UTC</b>{selected.map((p,i)=><span key={i}>{i===0?market.outcomeA.label:market.outcomeB.label}: {p?`${formatOdds(p.odds)} · ${formatTonFull(p.volume)} · ${timeLabel(p.t)} UTC`:'нет сделок за период'}</span>)}</div>:null}
      <svg viewBox="0 0 334 192" role="img" aria-label="Коэффициенты исполненных сделок" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setPoint(from+Math.max(0,Math.min(1,(e.clientX-r.left-r.width*32/334)/(r.width*286/334)))*(to-from))}} onPointerLeave={()=>setPoint(null)}>
        {[0,1,2,3].map(i=><g key={i}><line x1="32" x2="318" y1={18+i*46} y2={18+i*46} stroke="#e4e9f0" strokeDasharray="2 3"/><text x="0" y={22+i*46} fill="#637089" fontSize="9">{(max-i*span/3).toFixed(2)}</text></g>)}
        {volume?all.map((p,i)=><rect key={i} x={x(p)-2} y={175-15*Math.max(0,p.volume)/Math.max(1,...all.map(v=>v.volume))} width="4" height={15*Math.max(0,p.volume)/Math.max(1,...all.map(v=>v.volume))} fill="#8294ac" opacity=".35"/>):null}
        {[aa,bb].map((rows,i)=><g key={i} stroke={i===0?'#ff6b00':'#2878ff'}><path d={line(rows)} fill="none" strokeWidth="1.7"/>{rows.length===1?rows.map((p,j)=><circle key={j} cx={x(p)} cy={y(p)} r="3.5" fill={i===0?'#ff6b00':'#2878ff'}/>):null}</g>)}
        {point!=null?<line x1={x({t:point,odds:0,volume:0})} x2={x({t:point,odds:0,volume:0})} y1="12" y2="175" stroke="#8b9ab0" strokeDasharray="3 3"/>:null}
        {[from,(from+to)/2,to].map((t,i)=><text key={i} x={32+i*143} y="190" textAnchor={i===0?'start':i===2?'end':'middle'} fill="#637089" fontSize="9">{timeLabel(t)}</text>)}
      </svg><p className={s.chartHint}>UTC · коснитесь графика, чтобы сравнить оба исхода</p>
    </div>:<p className={s.note}>Исполненных сделок за этот период нет</p>}
    <label className={s.volumeSwitch}>Показать суммы сделок<input type="checkbox" checked={volume} onChange={e=>setVolume(e.target.checked)}/></label>
  </>
}
