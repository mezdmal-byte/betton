import type { Copy } from './copy'
import { Chrome, Example, useJourney } from './journey'
import s from './onboarding.module.css'
export function InteractiveEducation({c}:{c:Copy}){const state=useJourney();return <Chrome c={c} state={state} variant="education"><main className={s.educationBody}><div className={s.lessonTitle}><span aria-hidden="true">{state.step+1}</span><h1>{c.titles[state.step]}</h1></div><p className={s.description}>{c.descriptions[state.step]}</p><Example key={state.step} c={c} state={state} variant="education"/><p className={s.exampleLabel}>{c.example}</p></main></Chrome>}
