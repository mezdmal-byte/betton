import { MarketsScreen } from './MarketsScreen'
import { QuickTradeSheet } from '../components/QuickTradeSheet/QuickTradeSheet'
import type { QuickTradeState } from '../components/QuickTradeSheet/QuickTradeSheet'
import { marketPartialLiquidity, marketYesNo } from '../fixtures/markets'
import type { MarketFixture, OutcomeSide } from '../types/market'
import styles from './QuickTradeScreen.module.css'

export type QuickTradeScreenProps = {
  market?: MarketFixture
  selectedSide?: OutcomeSide
  amount?: number
  state?: QuickTradeState
  previewMatchedTon?: number | null
  previewRestTon?: number | null
  previewPayoutTon?: number | null
  previewAverageOdds?: number | null
  previewWorstOdds?: number | null
}

export function QuickTradeScreen({
  market = marketYesNo,
  selectedSide = 'a',
  amount = 0,
  state = 'normal',
  previewMatchedTon,
  previewRestTon,
  previewPayoutTon,
  previewAverageOdds,
  previewWorstOdds,
}: QuickTradeScreenProps) {
  const sheetMarket = state === 'partial' ? marketPartialLiquidity : market

  return (
    <div className={styles.root}>
      <MarketsScreen />
      <div className={styles.overlay}>
        <QuickTradeSheet
          market={sheetMarket}
          selectedSide={selectedSide}
          amount={amount}
          state={state}
          previewMatchedTon={previewMatchedTon}
          previewRestTon={previewRestTon}
          previewPayoutTon={previewPayoutTon}
          previewAverageOdds={previewAverageOdds}
          previewWorstOdds={previewWorstOdds}
        />
      </div>
    </div>
  )
}
