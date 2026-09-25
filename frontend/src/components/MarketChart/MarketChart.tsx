import { useState, type PointerEvent } from 'react'
import { formatOdds, formatTon } from '../../lib/format'
import type { ChartPoint } from '../../types/market'
import styles from './MarketChart.module.css'

export type MarketChartProps = {
  series: ChartPoint[]
  currentOdds: number
  outcomeLabel?: string
  volumeTon?: number
  title?: string
  demo?: boolean
}

const WIDTH = 358
const DEFAULT_PLOT_HEIGHT = 108
const DEFAULT_VOLUME_HEIGHT = 22
const SINGLE_PLOT_HEIGHT = 44
const SINGLE_VOLUME_HEIGHT = 12
const PAD_LEFT = 4
const PAD_RIGHT = 12
const PAD_TOP = 8
const PAD_BOTTOM = 4

function stepLine(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length; index += 1) {
    path += ` H ${points[index].x} V ${points[index].y}`
  }
  return path
}

function pointTimeLabel(value: number, index: number): string {
  if (!Number.isFinite(value) || value < 100000000000) return `Сделка ${index + 1}`
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return `Сделка ${index + 1}`
  }
}

export function MarketChart({
  series,
  currentOdds,
  outcomeLabel,
  volumeTon,
  title,
  demo = false,
}: MarketChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  if (series.length === 0) return null

  const singlePoint = series.length === 1
  const plotHeight = singlePoint ? SINGLE_PLOT_HEIGHT : DEFAULT_PLOT_HEIGHT
  const volumeHeight = singlePoint ? SINGLE_VOLUME_HEIGHT : DEFAULT_VOLUME_HEIGHT
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotBottom = PAD_TOP + plotHeight
  const minOdds = Math.min(...series.map((point) => point.odds), currentOdds)
  const maxOdds = Math.max(...series.map((point) => point.odds), currentOdds)
  const oddsSpan = Math.max(maxOdds - minOdds, 0.2)
  const maxVolume = Math.max(...series.map((point) => point.volume), 1)

  const mapped = series.map((point, index) => {
    const x = singlePoint
      ? PAD_LEFT + plotWidth / 2
      : PAD_LEFT + (index / (series.length - 1)) * plotWidth
    const y = PAD_TOP + ((maxOdds - point.odds) / oddsSpan) * plotHeight
    return { x, y, volume: point.volume }
  })

  const line = stepLine(mapped)
  const fill = `${line} V ${plotBottom} H ${mapped[0]?.x ?? PAD_LEFT} Z`
  const lastX = mapped[mapped.length - 1]?.x ?? PAD_LEFT
  const lastY = mapped[mapped.length - 1]?.y ?? PAD_TOP
  const barWidth = singlePoint
    ? Math.min(92, plotWidth * 0.28)
    : Math.max(plotWidth / Math.max(series.length, 1) - 6, 4)
  const heading = title ?? (outcomeLabel ? `Цена · ${outcomeLabel}` : 'Цена')
  const active = activeIndex == null ? null : series[activeIndex]
  const activeMapped = activeIndex == null ? null : mapped[activeIndex]

  const selectFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (singlePoint) {
      setActiveIndex(0)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return
    const viewX = ((event.clientX - rect.left) / rect.width) * WIDTH
    const ratio = Math.min(1, Math.max(0, (viewX - PAD_LEFT) / plotWidth))
    setActiveIndex(Math.round(ratio * (series.length - 1)))
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span>{heading}</span>
          <b>{formatOdds(active?.odds ?? currentOdds)}×</b>
        </div>
        <div className={styles.metaRow}>
          {volumeTon != null ? (
            <span className={styles.volumeLabel}>Объём {formatTon(volumeTon)}</span>
          ) : <span />}
          {demo ? <span className={styles.demoBadge}>ДЕМО</span> : null}
        </div>
      </div>

      <div className={styles.chartWrap}>
        {active && activeMapped ? (
          <div
            className={styles.tooltip}
            style={{ left: `${Math.min(88, Math.max(12, (activeMapped.x / WIDTH) * 100))}%` }}
          >
            <strong>{formatOdds(active.odds)}×</strong>
            <span>{formatTon(active.volume)}</span>
            <small>{pointTimeLabel(active.t, activeIndex ?? 0)}</small>
          </div>
        ) : null}

        <svg
          className={styles.svg}
          viewBox={`0 0 ${WIDTH} ${plotBottom + volumeHeight + PAD_BOTTOM}`}
          role="img"
          aria-label={`${heading} ${formatOdds(currentOdds)}`}
          onPointerMove={selectFromPointer}
          onPointerDown={selectFromPointer}
          onPointerLeave={() => setActiveIndex(null)}
        >
          {(singlePoint ? [0.5] : [0, 0.5, 1]).map((ratio) => {
            const y = PAD_TOP + ratio * plotHeight
            return (
              <line
                key={ratio}
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y}
                y2={y}
                className={styles.grid}
              />
            )
          })}
          {!singlePoint && mapped.length > 0 ? <path d={fill} className={styles.fill} /> : null}
          {!singlePoint && mapped.length > 0 ? <path d={line} className={styles.line} /> : null}

          {activeMapped ? (
            <>
              <line
                x1={activeMapped.x}
                x2={activeMapped.x}
                y1={PAD_TOP}
                y2={plotBottom + volumeHeight}
                className={styles.guide}
              />
              <circle cx={activeMapped.x} cy={activeMapped.y} r="5" className={styles.activeDotRing} />
              <circle cx={activeMapped.x} cy={activeMapped.y} r="2.6" className={styles.activeDot} />
            </>
          ) : (
            <>
              <circle cx={lastX} cy={lastY} r="4" className={styles.dotRing} />
              <circle cx={lastX} cy={lastY} r="2.25" className={styles.dot} />
            </>
          )}

          {mapped.map((point, index) => {
            const height = Math.max((point.volume / maxVolume) * (volumeHeight - 2), 2)
            return (
              <rect
                key={`${series[index].t}-${index}`}
                x={point.x - barWidth / 2}
                y={plotBottom + volumeHeight - height}
                width={barWidth}
                height={height}
                className={index === activeIndex || (activeIndex == null && index === mapped.length - 1) ? styles.volumeNow : styles.volume}
                rx="1"
              />
            )
          })}
        </svg>
      </div>
      <p className={styles.interactionHint}>Наведите или проведите по графику — покажем коэффициент, объём и время сделки.</p>
    </div>
  )
}
