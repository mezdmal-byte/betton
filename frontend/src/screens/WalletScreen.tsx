import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useT } from '../i18n'
import type { AccountFixture } from '../types/account'
import { Button } from '../components/Button/Button'
import { Chip } from '../components/Chip/Chip'
import { IconButton } from '../components/IconButton/IconButton'
import { Tabs } from '../components/Tabs/Tabs'
import { TextField } from '../components/TextField/TextField'
import { formatTonFull } from '../lib/format'
import styles from './WalletScreen.module.css'

export type WalletTab = 'deposit' | 'withdraw'
export type WalletNetwork = 'ton' | 'solana'

export type WalletScreenProps = {
  account?: AccountFixture | null
  tab?: WalletTab
  network?: WalletNetwork
  chainConnected?: boolean
  onBack?: () => void
  onTabChange?: (tab: WalletTab) => void
  onNetworkChange?: (network: WalletNetwork) => void
}

export function WalletScreen({
  account,
  tab = 'deposit',
  network = 'ton',
  chainConnected = false,
  onBack,
  onTabChange,
  onNetworkChange,
}: WalletScreenProps) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<WalletTab>(tab)
  const [activeNetwork, setActiveNetwork] = useState<WalletNetwork>(network)
  const currentTab = onTabChange ? tab : activeTab
  const currentNetwork = onNetworkChange ? network : activeNetwork
  const asset = currentNetwork === 'ton' ? 'TON' : 'SOL'

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('wallet.title')}</strong>
      </header>

      <div className={styles.body}>
        <section className={styles.hero}>
          <span>{t('account.available')}</span>
          <strong>{account ? formatTonFull(account.availableTon) : '—'}</strong>
        </section>

        <section className={styles.networkBar}>
          <div>
            <span className={styles.label}>{t('wallet.network')}</span>
            <strong className={styles.asset}>{asset}</strong>
          </div>
          <div className={styles.pills} role="group" aria-label={t('wallet.network')}>
            <Chip compact selected={currentNetwork === 'ton'} onClick={() => (onNetworkChange ?? setActiveNetwork)('ton')}>
              TON
            </Chip>
            <Chip compact selected={currentNetwork === 'solana'} onClick={() => (onNetworkChange ?? setActiveNetwork)('solana')}>
              Solana
            </Chip>
          </div>
        </section>

        <Tabs
          items={[
            { id: 'deposit', label: t('wallet.deposit') },
            { id: 'withdraw', label: t('wallet.withdraw') },
          ]}
          value={currentTab}
          onChange={(id) => (onTabChange ?? setActiveTab)(id as WalletTab)}
          ariaLabel={t('wallet.title')}
        />

        {currentTab === 'deposit' ? (
          <section className={styles.transferCard}>
            <div className={styles.transferHeading}>
              <strong>{t('wallet.depositAddress')}</strong>
              <span>{asset}</span>
            </div>
            <p>{t('wallet.addressPending')}</p>
            <div className={styles.placeholder}>
              <span>{t('wallet.qrHint')}</span>
            </div>
            <Button fullWidth disabled title={t('wallet.unavailable')}>
              {t('wallet.getAddress')}
            </Button>
            <small>{t('wallet.depositNote')}</small>
          </section>
        ) : (
          <section className={styles.transferCard}>
            <div className={styles.transferHeading}>
              <strong>{t('wallet.withdraw')}</strong>
              <span>{asset}</span>
            </div>
            <TextField
              id="wallet-recipient"
              label={t('wallet.recipient')}
              placeholder={t('wallet.recipientPh')}
              value=""
              onChange={() => undefined}
              disabled
            />
            <TextField
              id="wallet-amount"
              label={t('wallet.amount')}
              hint={`${t('wallet.available')}${account ? formatTonFull(account.availableTon) : '—'}`}
              value=""
              onChange={() => undefined}
              disabled
            />
            <p className={styles.note}>{t('wallet.fee')}</p>
            <Button fullWidth disabled title={t('wallet.unavailable')}>
              {t('wallet.withdrawCta')}
            </Button>
            <small>{t('wallet.withdrawNote')}</small>
          </section>
        )}

        {!chainConnected ? <p className={styles.disabledHint}>{t('wallet.unavailable')}</p> : null}
      </div>
    </div>
  )
}
