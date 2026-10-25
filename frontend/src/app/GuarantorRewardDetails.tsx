import type { GuarantorFunding, GuarantorReward, GuarantorRewardMode } from '../api/guarantors'
import s from './GovernanceV3.module.css'
import detailsStyles from './GuarantorRewardDetails.module.css'

export const REWARD_MODE_LABELS: Record<GuarantorRewardMode, string> = {
  fixed: 'Фиксированная сумма',
  percent: 'Только процент',
  combined: 'Процент + фиксированная сумма',
  percent_minimum: 'Процент, но не меньше минимума',
}

export const REWARD_MODE_HELP: Record<GuarantorRewardMode, string> = {
  fixed: 'Одна фиксированная награда за событие, а не за каждую ставку.',
  percent: 'Процент от общей прибыли победителей до удержания сборов.',
  combined: 'Фиксированная сумма прибавляется к проценту от общей прибыли победителей.',
  percent_minimum: 'Большее из двух значений: процент от общей прибыли победителей или указанный минимум. Минимум не прибавляется.',
}

export function GuarantorRewardModeField({ mode, onChange }: { mode: GuarantorRewardMode; onChange: (mode: GuarantorRewardMode) => void }) {
  return <><label className={s.field}>Тариф<select value={mode} onChange={event => onChange(event.target.value as GuarantorRewardMode)}>{Object.entries(REWARD_MODE_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className={s.note}>{REWARD_MODE_HELP[mode]}</p></>
}

export function rewardTariffText(reward: GuarantorReward): string {
  const fixed = reward.fixed_ton.replace('.', ',')
  const percent = reward.percent.replace('.', ',')
  switch (reward.mode) {
    case 'fixed': return `${fixed} TON за событие`
    case 'percent': return `${percent}% от прибыли победителей`
    case 'combined': return `${percent}% от прибыли победителей + ${fixed} TON`
    case 'percent_minimum': return `${percent}% от прибыли победителей, но минимум ${fixed} TON`
  }
}

/** Presentation of exact server nanoTON strings, not a payout/fee calculation. */
export function formatServerNanoTon(value: string | null | undefined): string {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return '—'
  const digits = value.replace(/^0+(?=\d)/, '').padStart(10, '0')
  const integer = digits.slice(0, -9).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const fraction = digits.slice(-9).replace(/0+$/, '')
  return `${integer}${fraction ? ',' + fraction : ''} TON`
}

export function GuarantorRewardDetails({ reward }: { reward?: GuarantorReward | null }) {
  return <section className={detailsStyles.section} aria-label="Вознаграждение гаранта">
    <h3>Вознаграждение гаранта</h3>
    {reward ? <><p><strong>{REWARD_MODE_LABELS[reward.mode]}</strong></p><p>{rewardTariffText(reward)}</p><p className={s.note}>{REWARD_MODE_HELP[reward.mode]}</p></> : <p>Тариф пока не согласован.</p>}
    <p>Вознаграждение гаранта удерживается только из прибыли победителей. При проигрыше или отмене дополнительная плата не взимается.</p>
  </section>
}

export function GuarantorFundingDetails({ funding, outcomes, collecting, state }: { funding?: GuarantorFunding | null; outcomes: string[]; collecting: boolean; state?: string }) {
  if (state === 'cancelled') return <p>Событие отменено. Вознаграждение гаранту не начисляется.</p>
  if (!funding) return collecting ? <p role="status">Ожидаем достаточного объёма заключённых ставок. Сервер ещё не предоставил расчёт обеспечения.</p> : null
  return <section className={detailsStyles.section} aria-label="Обеспечение вознаграждения">
    <h3>Обеспечение вознаграждения</h3>
    <p role="status">{!funding.preliminary ? 'Сервер завершил расчёт по победившему исходу.' : funding.secured ? 'По данным сервера вознаграждение обеспечено при обоих исходах.' : 'Ожидаем достаточного объёма заключённых ставок.'}</p>
    <p className={s.note}>Учитываются только исполненные ставки. Предложения, ожидающие встречного участника, не обеспечивают награду.</p>
    <p className={s.note}>Минимальная доля прибыли, которая должна остаться победителям после всех удержаний: {funding.minimum_keep_bps / 100}%.</p>
    {funding.outcomes.map(row => <details key={row.outcome}>
      <summary>{outcomes[row.outcome] ?? `Исход ${row.outcome + 1}`} · {row.secured ? 'обеспечено' : 'недостаточно'}</summary>
      <p>Совокупная прибыль победителей до сборов: {formatServerNanoTon(row.profit_nano)}</p>
      <p>Награда гаранта за событие: {formatServerNanoTon(row.reward_nano)}</p>
      <p>Сервисный сбор: {formatServerNanoTon(row.service_fee_nano)}</p>
      {row.viewer_net_profit_nano != null ? <p>Ваша прибыль после удержаний по уже исполненным ставкам: {formatServerNanoTon(row.viewer_net_profit_nano)}</p> : null}
      {row.reason ? <p className={s.note}>{row.reason}</p> : null}
    </details>)}
    <p className={s.note}>{funding.preliminary ? 'Предварительная оценка по текущим сделкам. После новых исполнений сервер пересчитает значения. Это не гарантированная выплата по неисполненному предложению.' : 'Итоговые суммы по подтверждённому расчёту сервера.'}</p>
  </section>
}
