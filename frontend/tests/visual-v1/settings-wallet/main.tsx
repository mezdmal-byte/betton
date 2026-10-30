/** Isolated fixtures only. Wallet account amounts must never render as on-chain funds. */
import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {I18nProvider} from '../../../src/i18n'
import {ThemeProvider} from '../../../src/theme/ThemeProvider'
import {VisualV1ActionsProvider,VisualV1Provider} from '../../../src/visualV1/VisualV1Context'
import {ProfileScreen} from '../../../src/screens/ProfileScreen'
import {WalletScreen,type WalletNetwork} from '../../../src/screens/WalletScreen'
import {accountUser} from '../../../src/fixtures/account'
import v1 from '../../../src/visualV1/VisualV1.module.css'
import '../../../src/styles/tokens.css'
import '../../../src/styles/reset.css'
import '../../../src/styles/global.css'
function Fixture(){const params=new URLSearchParams(location.search),mode=params.get('mode')??'settings',legacy=params.get('ui')==='legacy';const[network,setNetwork]=useState<WalletNetwork>('ton'),[action,setAction]=useState('');return <I18nProvider><ThemeProvider><VisualV1Provider enabled={!legacy}><VisualV1ActionsProvider value={{onOpenNotifications:()=>setAction('notifications'),onOpenHelp:()=>setAction('help')}}><div className={legacy?'':v1.root} style={{height:'100dvh'}} data-qa-action={action}>{mode==='settings'?<ProfileScreen view="settings" account={accountUser} onBack={()=>setAction('back')} onNavChange={setAction} onMenu={setAction}/>:<WalletScreen account={{...accountUser,availableTon:98765.4321}} tab={mode==='deposit'?'deposit':mode==='withdraw'?'withdraw':undefined} network={network} onBack={()=>setAction('back')} onTabChange={tab=>setAction('tab:'+tab)} onNetworkChange={next=>{setNetwork(next);setAction('network:'+next)}}/>}</div></VisualV1ActionsProvider></VisualV1Provider></ThemeProvider></I18nProvider>}
createRoot(document.getElementById('root')!).render(<Fixture/> )
