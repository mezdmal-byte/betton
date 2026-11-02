import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { chartRows, EventChartV1, nearestTrade } from './EventChartV1'
import { marketYesNo } from '../fixtures/markets'
const now=Date.now()
describe('event trade history regression',()=>{
 it('excludes invalid/future data and honors the selected period without changing input',()=>{
  const rows=[{t:now+1000,odds:2,volume:1},{t:now-7200000,odds:2,volume:1},{t:now-1000,odds:1.8,volume:1},{t:NaN,odds:2,volume:1}]
  expect(chartRows(rows,1,now).map(p=>p.odds)).toEqual([1.8])
  expect(chartRows(rows,0,now)).toHaveLength(2)
  expect(rows).toHaveLength(4)
 })
 it('retains a visible marker for a single executed trade',()=>{
  const html=renderToStaticMarkup(<EventChartV1 a={[{t:now-1000,odds:1.8,volume:5}]} b={[]} market={marketYesNo}/>)
  expect(html).toContain('<circle')
  expect(html).toContain('Коэффициенты исполненных сделок')
  expect(html).not.toContain('Infinity')
 })
 it('compares the nearest actual trade in each outcome, including an empty side',()=>{
  expect(nearestTrade([{t:100,odds:2,volume:1},{t:400,odds:3,volume:5}],350)?.odds).toBe(3)
  expect(nearestTrade([],350)).toBeNull()
 })
 it('does not invent a plot when no execution exists',()=>{
  const html=renderToStaticMarkup(<EventChartV1 a={[]} b={[]} market={marketYesNo}/>)
  expect(html).toContain('Исполненных сделок за этот период нет')
  expect(html).not.toContain('<svg')
 })
})
