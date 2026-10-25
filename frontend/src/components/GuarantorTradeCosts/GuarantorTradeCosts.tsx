import type { GuarantorTradeCosts as Costs } from '../../api/types'
import styles from './GuarantorTradeCosts.module.css'

// Format the server's integer nanoTON amount without converting it to a float.
export function formatNanoTon(value: string | null): string {
  if (value == null || !/^\d+$/.test(value)) return '—'
  const digits = value.replace(/^0+(?=\d)/, '').padStart(10, '0')
  const whole = digits.slice(0, -9)
  const fraction = digits.slice(-9).replace(/0+$/, '')
  return `${whole}${fraction ? '.' + fraction : ''} TON`
}

export function GuarantorTradeCosts({ costs }: { costs: Costs }) {
  return (
    <section className={styles.root} aria-label="Расходы на гаранта">
      <strong className={styles.heading}>Расчёт с гарантом · предварительно</strong>
      <dl className={styles.rows}>
        <div><dt>Выплата по новой ставке до сборов</dt><dd>{formatNanoTon(costs.gross_new_payout_nano)}</dd></div>
        <div><dt>Сервисный сбор по вашим ставкам в событии</dt><dd>{formatNanoTon(costs.service_fee_nano)}</dd></div>
        <div><dt>Ваша доля вознаграждения гаранта по событию</dt><dd>{formatNanoTon(costs.guarantor_reward_nano)}</dd></div>
        <div className={styles.total}><dt>Ваша общая выплата по событию после сборов</dt><dd>{formatNanoTon(costs.event_payout_after_fees_nano)}</dd></div>
      </dl>
      <p>При победе выбранного исхода. Учитываются уже заключённые ставки и исполняемая часть нового предложения. Неисполненный остаток не включён. Итог может измениться при новых сделках.</p>
      {!costs.secured_for_both_outcomes ? <p role="status">Ожидаем достаточного объёма заключённых ставок. {costs.reason}</p> : null}
      {costs.can_place === false ? <p role="alert">Размещение недоступно: условия вознаграждения не обеспечены.</p> : null}
      <p>Вознаграждение гаранта удерживается только из прибыли победителей. При проигрыше или отмене дополнительная плата не взимается.</p>
    </section>
  )
}
