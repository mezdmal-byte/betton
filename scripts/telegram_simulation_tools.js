const webapp=window.Telegram?.WebApp
webapp?.ready();webapp?.expand()
const status=document.querySelector('#status')
let user
async function api(path,method='GET',body) {
  if(!webapp?.initData)throw new Error('Откройте эту страницу через персональную кнопку BetTON SIM в @SobakaPesBot.')
  const response=await fetch(path,{method,headers:{Authorization:'tma '+webapp.initData,'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body)})
  const data=await response.json()
  if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:JSON.stringify(data.detail))
  return data
}
async function refresh() {
  if(!user)user=await api('/auth/telegram','POST')
  const markets=await api('/users/'+user.id+'/markets')
  const select=document.querySelector('#event');select.replaceChildren()
  for(const market of markets.filter(m=>m.visibility==='unlisted').sort((a,b)=>b.id-a.id)) {
    const option=document.createElement('option');option.value=market.id;option.textContent='#'+market.id+' · '+market.question;select.append(option)
  }
}
async function main() {
  user=await api('/auth/telegram','POST')
  const manifest=await api('/simulation/manifest')
  for(const [key,fixture] of Object.entries(manifest.scenarios)) {
    const item=document.createElement('li');item.textContent='#'+fixture.id+' · '+key+' · '+fixture.question+' '
    if(fixture.share_token) {
      const link=document.createElement('a');link.href='/v2/?share='+encodeURIComponent(fixture.share_token);link.textContent='Открыть частное событие';item.append(link)
    }
    document.querySelector('#scenarios').append(item)
  }
  await refresh()
  status.textContent='Вход подтверждён. Баланс этого тестового аккаунта: '+user.balance+' синтетических TON.'
}
document.querySelector('#refresh').onclick=()=>refresh().catch(error=>status.textContent=error.message)
document.querySelector('#enable').onclick=async()=>{
  const button=document.querySelector('#enable');button.disabled=true
  try {
    const id=document.querySelector('#event').value
    if(!id)throw new Error('Сначала создайте своё частное событие с тестовым гарантом.')
    await api('/demo/guarantors/events/'+id,'PUT',{scenario:document.querySelector('#scenario').value,enabled:true})
    status.textContent='Сценарий включён для пари #'+id+'. Вернитесь в приложение для переговоров и подтверждений.'
  } catch(error) {status.textContent=error.message} finally {button.disabled=false}
}
main().catch(error=>status.textContent=error.message)
