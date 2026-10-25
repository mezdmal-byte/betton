const labels = {creator:'Создатель',participant:'Участник',guarantor:'Гарант',moderator:'Модератор'}
const status = document.querySelector('#status')
const roles = document.querySelector('#roles')
const eventSelect = document.querySelector('#event')
const sessions = {}
async function session(actor) {
  const response = await fetch('/sandbox/session?actor='+actor)
  if (!response.ok) throw new Error('Не удалось получить тестовую роль')
  return sessions[actor] = await response.json()
}
async function api(actor,path,method='GET',body) {
  const context = await session(actor)
  const response = await fetch(path,{method,headers:{Authorization:'tma '+context.init_data,'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body)})
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data.detail==='string'?data.detail:JSON.stringify(data.detail))
  return data
}
function link(text,url) {
  const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener';return a
}
async function refresh() {
  const context=await session('creator')
  const markets=await api('creator','/users/'+context.sandbox.users.creator+'/markets')
  const choices=markets.filter(m=>m.visibility==='unlisted').sort((a,b)=>b.id-a.id)
  eventSelect.replaceChildren()
  for (const market of choices) {
    const option=document.createElement('option');option.value=market.id;option.textContent='#'+market.id+' · '+market.question
    eventSelect.append(option)
  }
}
async function main() {
  const context=await session('creator')
  for (const [actor,label] of Object.entries(labels)) roles.append(link(label,'/sandbox/?actor='+actor))
  for (const [key,fixture] of Object.entries(context.sandbox.scenarios)) {
    const item=document.createElement('li')
    const query=fixture.share_token?'&share='+encodeURIComponent(fixture.share_token):''
    item.append(document.createTextNode('#'+fixture.id+' · '+key+' · '),link(fixture.question,'/sandbox/?actor=creator'+query))
    if (!fixture.share_token) item.append(document.createTextNode(' — найдите это название в ленте; завершённые — в «Мои события»'))
    document.querySelector('#scenarios').append(item)
  }
  await refresh()
}
document.querySelector('#refresh').onclick=()=>refresh().catch(error=>status.textContent=error.message)
document.querySelector('#enable').onclick=async()=>{
  const button=document.querySelector('#enable');button.disabled=true
  try {
    await api('moderator','/demo/guarantors/events/'+eventSelect.value,'PUT',{scenario:document.querySelector('#scenario').value,enabled:true})
    status.textContent='Сценарий включён для пари #'+eventSelect.value+'. Откройте его от создателя и согласуйте правила и тариф.'
  } catch(error) {status.textContent=error.message} finally {button.disabled=false}
}
main().catch(error=>status.textContent=error.message)
