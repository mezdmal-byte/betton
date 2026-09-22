import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ClockFeed } from './variants/ClockFeed'
import { RailFeed } from './variants/RailFeed'
import { RuleFeed } from './variants/RuleFeed'
import './picker.css'
import styles from './Harness.module.css'

const VARIANTS: { name: string; node: ReactNode }[] = [
  { name: 'Rail', node: <RailFeed /> },
  { name: 'Clock', node: <ClockFeed /> },
  { name: 'Rule', node: <RuleFeed /> },
]

function initialIndex(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('v') ?? '1')
  if (!Number.isFinite(raw) || raw < 1 || raw > VARIANTS.length) return 0
  return raw - 1
}

export function Harness() {
  const [index, setIndex] = useState(initialIndex)
  const [mountId, setMountId] = useState(0)
  const [ready, setReady] = useState(false)
  const pickerRef = useRef<HTMLElement>(null)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  useLayoutEffect(() => {
    const button = itemRefs.current[index]
    const highlight = highlightRef.current
    if (!button || !highlight) return
    highlight.style.width = `${button.offsetWidth}px`
    highlight.style.transform = `translateX(${button.offsetLeft}px)`
  }, [index, ready])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setReady(true))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function onResize() {
      const button = itemRefs.current[index]
      const highlight = highlightRef.current
      if (!button || !highlight) return
      highlight.style.width = `${button.offsetWidth}px`
      highlight.style.transform = `translateX(${button.offsetLeft}px)`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [index])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const num = Number.parseInt(event.key, 10)
      if (num >= 1 && num <= VARIANTS.length) {
        activate(num - 1)
      } else if (event.key === 'ArrowRight') {
        activate((index + 1) % VARIANTS.length)
      } else if (event.key === 'ArrowLeft') {
        activate((index - 1 + VARIANTS.length) % VARIANTS.length)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index])

  function activate(next: number) {
    if (next < 0 || next >= VARIANTS.length) return
    setIndex(next)
    setMountId((value) => value + 1)
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(next + 1))
    window.history.replaceState(null, '', url)
  }

  return (
    <div className={styles.page}>
      <main className={styles.phone} id="stage">
        <div key={mountId}>{VARIANTS[index].node}</div>
      </main>
      <nav
        ref={pickerRef}
        className="proto-picker"
        aria-label="Prototype variants"
        data-position="top"
        data-ready={ready ? '' : undefined}
      >
        <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((variant, variantIndex) => (
          <button
            key={variant.name}
            ref={(node) => {
              itemRefs.current[variantIndex] = node
            }}
            type="button"
            className="proto-picker-item"
            data-active={variantIndex === index ? '' : undefined}
            aria-current={variantIndex === index ? 'true' : undefined}
            onClick={() => activate(variantIndex)}
          >
            {variant.name}
          </button>
        ))}
      </nav>
    </div>
  )
}
