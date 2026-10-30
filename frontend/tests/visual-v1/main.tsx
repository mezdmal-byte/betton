/** Isolated QA fixtures. This entry is never imported by the application. */
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { I18nProvider } from '../../src/i18n'
import { VisualV1ActionsProvider, VisualV1Provider } from '../../src/visualV1/VisualV1Context'
import { CreatorDecisionV1 } from '../../src/visualV1/CreatorDecisionV1'
import { CreateV1Wizard } from '../../src/visualV1/CreateV1Wizard'
import { PortfolioV1, ActivityV1 } from '../../src/visualV1/PortfolioV1'
import { HelpScreen } from '../../src/screens/HelpScreen'
import { SystemStateScreen } from '../../src/screens/SystemStateScreen'
import { PublicProfileScreen } from '../../src/screens/PublicProfileScreen'
import { AuthExpiredScreen } from '../../src/screens/AuthExpiredScreen'
import { OnboardingScreen } from '../../src/screens/OnboardingScreen'
import { accountUser, portfolioOrders, portfolioPositions, portfolioHistory } from '../../src/fixtures/account'
import type { EventTermsV3 } from '../../src/api/eventGovernanceV3'
import type { EventDraft } from '../../src/api/eventsV3'
import rootStyles from '../../src/visualV1/VisualV1.module.css'
import '../../src/styles/tokens.css'
import '../../src/styles/reset.css'
import '../../src/styles/global.css'
const event:EventTermsV3={event_type:'private',question:'Кто выиграет матч в настольный теннис?',outcomes:['Дмитрий','Артём'],description:'Один матч до трёх выигранных партий.',rules:'Победитель по итоговому счёту партий',criteria:['Дмитрий выиграл три партии','Артём выиграл три партии'],resolution_method:'Итоговый счёт партий',close_at:'2026-10-28T10:00:00Z',ends_at:null,timing_version:'start-v1',revision:1,creator_id:1,consent:true,moderator_edited:false,reward_payments_supported:true}
function Fixture(){const params=new URLSearchParams(location.search),screen=params.get('screen')??'onboarding';const [calls,setCalls]=useState(0),[last,setLast]=useState(''),[cancelled,setCancelled]=useState<string[]>([]);const action=(value:string)=>setLast(value);return <I18nProvider><VisualV1Provider enabled={params.get('ui')!=='legacy'}><VisualV1ActionsProvider value={{onOpenMyEvents:()=>action('events'),onOpenNotifications:()=>action('notes')}}><div className={params.get('ui')==='legacy'?'':rootStyles.root} style={{height:'100dvh'}} data-qa-calls={calls} data-qa-last={last}>
 {screen==='help'?<HelpScreen onBack={()=>action('back')} onReplayOnboarding={()=>action('onboarding')}/>:screen==='public-profile'?<PublicProfileScreen profile={{displayName:'Дмитрий',handle:'northstar',initials:'Д',marketsCreated:18,activeMarkets:6,completedMarkets:12,volumeTon:24840,fills:1284,participants:8406}} onBack={()=>action('back')} markets={[]} onOpenMarket={()=>action('market')}/>:screen==='network'||screen==='auth'?<SystemStateScreen kind={screen} onRetry={()=>action('retry')} onCancel={()=>action('cancel')}/>:screen==='expired'?<AuthExpiredScreen onClose={()=>action('close')}/>:screen==='creator'?<CreatorDecisionV1 event={event} pending={false} onClose={()=>action('close')} onSubmit={async(body,cancel)=>{setCalls(n=>n+1);action(JSON.stringify({body,cancel}));if(params.get('fail'))throw new Error('Explicit QA failure')}}/>:screen==='create'?<CreateV1Wizard userId={90001} onBack={()=>action('back')} onSubmit={(draft:EventDraft)=>action(JSON.stringify(draft))}/>:screen==='portfolio'?<PortfolioV1 account={accountUser} positions={portfolioPositions} orders={portfolioOrders.filter(o=>!cancelled.includes(o.id))} history={portfolioHistory} onCancelOrder={o=>{setCalls(n=>n+1);setCancelled(old=>[...old,o.id])}} onSelectMarket={id=>action('market:'+id)} onNavChange={action}/>:screen==='history'?<ActivityV1 history={portfolioHistory} onBack={()=>action('back')}/>:<OnboardingScreen initialStep={Number(params.get('step')??0)} onContinue={()=>action('continue')} onSkip={()=>action('skip')}/>}
 </div></VisualV1ActionsProvider></VisualV1Provider></I18nProvider>}
createRoot(document.getElementById('root')!).render(<Fixture/> )
