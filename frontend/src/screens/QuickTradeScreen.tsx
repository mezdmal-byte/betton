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
}

export function QuickTradeScreen({
  market = marketYesNo,
  selectedSide = 'a',
  amount = 100,
  state = 'normal',
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
        />
      </div>
    </div>
  )
}
