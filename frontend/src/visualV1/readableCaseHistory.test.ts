import {describe,it,expect} from 'vitest'
import {readableCaseHistory} from './readableCaseHistory'
describe('guarantor history',()=>{
 it('renders escaped snapshots without implementation keys',()=>{const raw=JSON.stringify({question:'Пари?',criteria:['Да по протоколу','Нет по протоколу'],close_at:'2026-11-03T10:00:00',guarantor_id:123});const result=readableCaseHistory(raw.replaceAll('"','&quot;'));expect(result).toContain('Событие: Пари?');expect(result).toContain('Критерии результата: Да по протоколу / Нет по протоколу');expect(result).toContain('UTC');expect(result).not.toContain('guarantor_id')})
 it('keeps ordinary messages intact',()=>expect(readableCaseHistory('Условия обновлены')).toBe('Условия обновлены'))
 it('does not expose unknown structured payloads',()=>expect(readableCaseHistory('{"private_id":123}')).not.toContain('123'))
 it('explains tariff types',()=>expect(readableCaseHistory('{"mode":"combined","percent":"5","fixed_ton":"2"}')).toContain('Тип тарифа: Процент и фиксированная часть'))
})
