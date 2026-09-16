import { PhoneShell } from './layouts/PhoneShell'
import { MarketsScreen } from './screens/MarketsScreen'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.preview}>
      <PhoneShell>
        <MarketsScreen />
      </PhoneShell>
    </div>
  )
}
