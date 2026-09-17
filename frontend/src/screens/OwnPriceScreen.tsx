import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { IconButton } from '../components/IconButton/IconButton'
import { OwnPricePanel } from '../components/OwnPricePanel/OwnPricePanel'
import { marketYesNo, orderBookA, orderBookB, recentTrades } from '../fixtures/markets'
import { useT } from '../i18n'
import type { MarketFixture, OrderBookLevel, OutcomeSide, RecentTrade } from '../types/market'
import styles from './OwnPriceScreen.module.css'

export type OwnPriceScreenProps = {
  market?: MarketFixture
  onBack?: () => void
  selectedSide?: OutcomeSide
  odds?: number
  amount?: number
  book?: OrderBookLevel[]
  trades?: RecentTrade[]
  onSelectSide?: (side: OutcomeSide) => void
  onOddsChange?: (odds: number) => void
  onAmountChange?: (amount: number) => void
  onSubmit?: () => void
  matchedTon?: number | null
  restTon?: number | null
  previewMode?: 'local' | 'backend'
  submitting?: boolean
  disabled?: boolean
  errorMessage?: string | null
  availableTon?: number | null
  success?: boolean
}

export function OwnPriceScreen({
  market = marketYesNo,
  onBack,
  selectedSide,
  odds,
  amount,
  book,
  trades = recentTrades,
  onSelectSide,
  onOddsChange,
  onAmountChange,
  onSubmit,
  matchedTon = null,
  restTon = null,
  previewMode = 'local',
  submitting = false,
  disabled = false,
  errorMessage = null,
  availableTon = null,
  success = false,
}: OwnPriceScreenProps) {
  const t = useT()
  const [side, setSide] = useState<OutcomeSide>(selectedSide ?? 'a')
  const [localOdds, setLocalOdds] = useState(odds ?? market.outcomeA.odds ?? 1.82)
  const [localAmount, setLocalAmount] = useState(amount ?? 100)
  const activeSide = onSelectSide ? (selectedSide ?? side) : side
  const activeOdds = onOddsChange ? (odds ?? localOdds) : localOdds
  const activeAmount = onAmountChange ? (amount ?? localAmount) : localAmount
  const activeBook = book ?? (activeSide === 'a' ? orderBookA : orderBookB)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('advanced.title')}</strong>
      </header>
      <div className={styles.body}>
        <OwnPricePanel
          question={market.question}
          outcomeALabel={market.outcomeA.label}
          outcomeBLabel={market.outcomeB.label}
          selectedSide={activeSide}
          odds={activeOdds}
          amount={activeAmount}
          book={activeBook}
          trades={trades}
          matchedTon={matchedTon}
          restTon={restTon}
          previewMode={previewMode}
          submitting={submitting}
          disabled={disabled}
          errorMessage={errorMessage}
          availableTon={availableTon}
          success={success}
          onSelectSide={(next) => {
            if (onSelectSide) onSelectSide(next)
            else {
              setSide(next)
              setLocalOdds((next === 'a' ? market.outcomeA.odds : market.outcomeB.odds) ?? localOdds)
            }
          }}
          onOddsChange={onOddsChange ?? setLocalOdds}
          onAmountChange={onAmountChange ?? setLocalAmount}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
