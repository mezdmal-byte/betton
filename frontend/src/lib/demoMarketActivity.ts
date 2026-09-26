import type { ChartPoint, MarketFixture, RecentTrade } from '../types/market'

export type DemoMarketActivity = {
  seriesA: ChartPoint[]
  seriesB: ChartPoint[]
  recentA: RecentTrade[]
  recentB: RecentTrade[]
  volumeTon: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function seeded(seed: number): () => number {
  let state = (seed >>> 0) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function baseProbability(market: MarketFixture): number {
  const fromA = market.outcomeA.odds && market.outcomeA.odds > 1 ? 1 / market.outcomeA.odds : null
  const fromB = market.outcomeB.odds && market.outcomeB.odds > 1 ? 1 - 1 / market.outcomeB.odds : null
  if (fromA != null && fromB != null) return clamp((fromA + fromB) / 2, 0.2, 0.8)
  if (fromA != null) return clamp(fromA, 0.2, 0.8)
  if (fromB != null) return clamp(fromB, 0.2, 0.8)
  return 0.55
}

function relativeLabel(timestamp: number, end: number): string {
  const minutes = Math.max(1, Math.round((end - timestamp) / 60000))
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.round(minutes / 60)
  return `${hours} ч`
}

function recentFromSeries(series: ChartPoint[], end: number): RecentTrade[] {
  return [...series]
    .reverse()
    .slice(0, 8)
    .map((point, index) => ({
      id: index + 1,
      odds: point.odds,
      amountTon: point.volume,
      timeAgo: relativeLabel(point.t, end),
      createdAt: new Date(point.t).toISOString(),
    }))
}

export function buildDemoMarketActivity(
  marketId: number,
  market: MarketFixture,
  end: number = Date.now(),
): DemoMarketActivity {
  const random = seeded(marketId * 2654435761)
  const count = 20
  const intervalMs = 20 * 60 * 1000
  const start = end - (count - 1) * intervalMs
  let probability = baseProbability(market)
  const seriesA: ChartPoint[] = []
  const seriesB: ChartPoint[] = []

  for (let index = 0; index < count; index += 1) {
    const impulse =
      index === 6
        ? (random() > 0.5 ? 1 : -1) * (0.035 + random() * 0.025)
        : index === 13
          ? (random() > 0.5 ? 1 : -1) * (0.045 + random() * 0.03)
          : 0

    probability = clamp(probability + (random() - 0.5) * 0.032 + impulse, 0.16, 0.84)

    const oddsA = round2(1 / probability)
    const oddsB = round2(1 / (1 - probability))
    const payout = 24 + random() * 86
    const time = start + index * intervalMs

    seriesA.push({
      t: time,
      odds: oddsA,
      volume: round2(payout / oddsA),
    })
    seriesB.push({
      t: time,
      odds: oddsB,
      volume: round2(payout / oddsB),
    })
  }

  const volumeTon = round2(
    seriesA.reduce((sum, point) => sum + point.volume, 0) +
      seriesB.reduce((sum, point) => sum + point.volume, 0),
  )

  return {
    seriesA,
    seriesB,
    recentA: recentFromSeries(seriesA, end),
    recentB: recentFromSeries(seriesB, end),
    volumeTon,
  }
}
