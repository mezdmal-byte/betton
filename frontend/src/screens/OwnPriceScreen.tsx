import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { IconButton } from '../components/IconButton/IconButton'
import { OwnPricePanel } from '../components/OwnPricePanel/OwnPricePanel'
import { marketYesNo, orderBookA, orderBookB, recentTrades } from '../fixtures/markets'
import type { MarketFixture, OutcomeSide } from '../types/market'
import styles from './OwnPriceScreen.module.css'

export type OwnPriceScreenProps = {
  market?: MarketFixture
}

export function OwnPriceScreen({ market = marketYesNo }: OwnPriceScreenProps) {
  const [side, setSide] = useState<OutcomeSide>('a')
  const [odds, setOdds] = useState(market.outcomeA.odds ?? 1.82)
  const [amount, setAmount] = useState(100)
  const book = side === 'a' ? orderBookA : orderBookB

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md">
          <ChevronLeft size={22} />
        </IconButton>
        <strong>Своя цена</strong>
      </header>
      <div className={styles.body}>
        <OwnPricePanel
          question={market.question}
          outcomeALabel={market.outcomeA.label}
          outcomeBLabel={market.outcomeB.label}
          selectedSide={side}
          odds={odds}
          amount={amount}
          book={book}
          trades={recentTrades}
          onSelectSide={(next) => {
            setSide(next)
            setOdds((next === 'a' ? market.outcomeA.odds : market.outcomeB.odds) ?? odds)
          }}
          onOddsChange={setOdds}
          onAmountChange={setAmount}
        />
      </div>
    </div>
  )
}
