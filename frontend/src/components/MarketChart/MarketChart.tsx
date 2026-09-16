import { formatOdds, formatTon } from '../../lib/format'
import type { ChartPoint } from '../../types/market'
import styles from './MarketChart.module.css'

export type MarketChartProps = {
  series: ChartPoint[]
  currentOdds: number
  outcomeLabel?: string
  volumeTon?: number
  title?: string
}

const WIDTH = 358
const PLOT_HEIGHT = 108
const VOLUME_HEIGHT = 22
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

export function MarketChart({ series, currentOdds, outcomeLabel, volumeTon, title }: MarketChartProps) {
  if (series.length === 0) return null
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotBottom = PAD_TOP + PLOT_HEIGHT
  const minOdds = Math.min(...series.map((point) => point.odds), currentOdds)
  const maxOdds = Math.max(...series.map((point) => point.odds), currentOdds)
  const oddsSpan = Math.max(maxOdds - minOdds, 0.2)
  const maxVolume = Math.max(...series.map((point) => point.volume), 1)

  const mapped = series.map((point, index) => {
    const x =
      PAD_LEFT + (series.length === 1 ? plotWidth : (index / (series.length - 1)) * plotWidth)
    const y = PAD_TOP + ((maxOdds - point.odds) / oddsSpan) * PLOT_HEIGHT
    return { x, y, volume: point.volume }
  })

  const line = stepLine(mapped)
  const fill = `${line} V ${plotBottom} H ${mapped[0]?.x ?? PAD_LEFT} Z`
  const lastX = mapped[mapped.length - 1]?.x ?? PAD_LEFT
  const lastY = mapped[mapped.length - 1]?.y ?? PAD_TOP
  const barWidth = Math.max(plotWidth / Math.max(series.length, 1) - 6, 4)
  const heading = title ?? (outcomeLabel ? `Цена · ${outcomeLabel}` : 'Цена')

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span>{heading}</span>
          <b>{formatOdds(currentOdds)}</b>
        </div>
        {volumeTon != null ? (
          <span className={styles.volumeLabel}>Объём {formatTon(volumeTon)}</span>
        ) : null}
      </div>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${plotBottom + VOLUME_HEIGHT + PAD_BOTTOM}`}
        role="img"
        aria-label={`${heading} ${formatOdds(currentOdds)}`}
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD_TOP + ratio * PLOT_HEIGHT
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
        {mapped.length > 0 ? <path d={fill} className={styles.fill} /> : null}
        {mapped.length > 0 ? <path d={line} className={styles.line} /> : null}
        <circle cx={lastX} cy={lastY} r="4" className={styles.dotRing} />
        <circle cx={lastX} cy={lastY} r="2.25" className={styles.dot} />
        {mapped.map((point, index) => {
          const height = Math.max((point.volume / maxVolume) * (VOLUME_HEIGHT - 2), 2)
          return (
            <rect
              key={series[index].t}
              x={point.x - barWidth / 2}
              y={plotBottom + VOLUME_HEIGHT - height}
              width={barWidth}
              height={height}
              className={index === mapped.length - 1 ? styles.volumeNow : styles.volume}
              rx="1"
            />
          )
        })}
      </svg>
    </div>
  )
}
