import type { Copy } from './copy'
import { Chrome, Example, useJourney } from './journey'
import s from './onboarding.module.css'
export function MotionExperience({c}:{c:Copy}){const state=useJourney();return <Chrome c={c} state={state} variant="motion"><main className={s.motionBody}><h1>{c.titles[state.step]}</h1><div className={s.scene}><Example key={state.step} c={c} state={state} variant="motion"/></div><p className={s.description}>{c.descriptions[state.step]}</p><p className={s.exampleLabel}>{c.example}</p></main></Chrome>}
