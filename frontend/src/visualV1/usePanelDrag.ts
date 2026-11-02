import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

/** Drag only after axis intent is clear; leave perpendicular native scrolling alone. */
export function usePanelDrag(axis: 'x' | 'y', direction: -1 | 1, onCommit?: () => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const callback = useRef(onCommit)
  callback.current = onCommit
  const suppressClick = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  useEffect(() => () => clearTimeout(timer.current), [])
  const reset = () => { start.current = null; setDragging(false); setOffset(0) }
  return {
    style: { transform: `translate${axis.toUpperCase()}(${offset}px)`, transition: dragging ? 'none' : 'transform var(--panel-drag-duration, 180ms) ease-out' } as CSSProperties,
    handlers: {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        suppressClick.current = false
        if (!callback.current || e.pointerType === 'mouse' || e.isPrimary === false) return
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const p = start.current
        if (!p || e.pointerId !== p.id) return
        const along = axis === 'x' ? e.clientX - p.x : e.clientY - p.y
        const across = axis === 'x' ? e.clientY - p.y : e.clientX - p.x
        if (!dragging && Math.abs(across) > 12 && Math.abs(across) > Math.abs(along)) { reset(); return }
        if (along * direction < 8 || Math.abs(along) < Math.abs(across) * 1.3) return
        e.preventDefault()
        try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* Synthetic pointer is not an active device pointer. */ }
        suppressClick.current = true
        setDragging(true)
        setOffset(direction * Math.min(320, Math.max(0, along * direction)))
      },
      onPointerUp(e: PointerEvent<HTMLElement>) {
        const p = start.current
        if (!p) return
        const along = axis === 'x' ? e.clientX - p.x : e.clientY - p.y
        const across = axis === 'x' ? e.clientY - p.y : e.clientX - p.x
        if (along * direction > 65 && Math.abs(along) > Math.abs(across) * 1.5) {
          e.preventDefault(); suppressClick.current = true; start.current = null; setDragging(false)
          setOffset(direction * (axis === 'x' ? 380 : 180))
          timer.current = setTimeout(() => { setOffset(0); callback.current?.() }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180)
        } else reset()
      },
      onPointerCancel: reset,
      onClickCapture(e: { detail?: number; preventDefault: () => void; stopPropagation: () => void }) {
        if (suppressClick.current && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false }
      },
    },
  }
}
