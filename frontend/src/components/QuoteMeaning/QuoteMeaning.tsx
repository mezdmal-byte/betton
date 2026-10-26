import { useI18n } from '../../i18n'
import styles from './QuoteMeaning.module.css'

const copy = {
  ru: ['Как читать цену', 'Коэффициент — выплата до сборов на 1 TON. Например, 2.00× означает 2 TON при выигрыше, а подразумеваемая вероятность — около 50%. Это представление цены, не прогноз платформы. Исполнимая цена зависит от встречных предложений; перед подтверждением сервер рассчитает доступную сумму и предел исполнения.'],
  en: ['Reading the price', 'Odds are the payout before fees per 1 TON. For example, 2.00× means 2 TON on a win and implies about 50%. This is a price representation, not a platform forecast. Execution depends on opposing offers; the server calculates the available amount and execution bound before confirmation.'],
  zh: ['如何理解价格', '赔率表示每投入1 TON、获胜时扣费前的回报。例如，2.00×表示2 TON，对应约50%的隐含概率。这是价格表达，不是平台预测。实际成交取决于对手方报价；确认前，服务器会计算可成交金额与成交边界。'],
}

export function QuoteMeaning() {
  const { locale } = useI18n()
  const [label, text] = copy[locale]
  return <details className={styles.root}><summary>{label}</summary><p>{text}</p></details>
}
