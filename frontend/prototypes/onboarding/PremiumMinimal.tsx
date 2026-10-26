import type { Copy } from './copy'
import { Chrome, Example, useJourney } from './journey'
import s from './onboarding.module.css'
export function PremiumMinimal({c}:{c:Copy}){const state=useJourney();return <Chrome c={c} state={state} variant="premium"><main className={s.premiumBody}><h1>{c.titles[state.step]}</h1><p className={s.description}>{c.descriptions[state.step]}</p><div className={s.rule}/><Example key={state.step} c={c} state={state} variant="premium"/><p className={s.exampleLabel}>{c.example}</p></main></Chrome>}
