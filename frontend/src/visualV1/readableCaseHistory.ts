const labels:Record<string,string>={question:'Событие',outcomes:'Исходы',description:'Описание',criteria:'Критерии результата',source:'Источник',resolution_method:'Проверка результата',close_at:'Начало события',ends_at:'Предполагаемое завершение',result_due_at:'Срок решения гаранта',mode:'Тип тарифа',percent:'Процент',fixed_ton:'Фиксированная часть, TON'}
const modes:Record<string,string>={fixed:'Фиксированный',percent:'Процент от прибыли',combined:'Процент и фиксированная часть',percent_minimum:'Процент с минимумом'}
export function readableCaseHistory(text:string):string{
 let data:unknown
 try{data=JSON.parse(text.replace(/&quot;|&#34;/g,'"').replace(/&amp;/g,'&'))}catch{return text}
 if(!data||typeof data!=='object'||Array.isArray(data))return text
 const lines:string[]=[]
 for(const [key,value] of Object.entries(data)){
  if(!labels[key]||value==null||value==='')continue
  let rendered=Array.isArray(value)?value.filter(v=>typeof v==='string').join(' / '):typeof value==='string'||typeof value==='number'?String(value):''
  if(key==='mode')rendered=modes[rendered]??rendered
  if(key.endsWith('_at')&&typeof value==='string'){const d=new Date(/Z$|[+-]\d\d:\d\d$/.test(value)?value:value+'Z');if(Number.isFinite(d.getTime()))rendered=new Intl.DateTimeFormat('ru-RU',{dateStyle:'short',timeStyle:'short',timeZone:'UTC'}).format(d)+' UTC'}
  if(rendered)lines.push(labels[key]+': '+rendered)
 }
 return lines.length?lines.join('\n'):'Изменены параметры события. Откройте вкладку «Условия», чтобы проверить действующую редакцию.'
}
