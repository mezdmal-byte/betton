import { formatOdds, formatTon } from "../../lib/format";
import type { OrderBookLevel } from "../../types/market";
import styles from "./OrderBookRow.module.css";

export type OrderBookRowProps = {
  level: OrderBookLevel;
  maxAvailable: number;
  active?: boolean;
};

export function OrderBookRow({ level, active = false }: OrderBookRowProps) {
  return (
    <div className={active ? `${styles.row} ${styles.active}` : styles.row}>
      <span className={styles.odds}>{formatOdds(level.odds)}×</span>
      <span className={styles.available}>{formatTon(level.availableTon)}</span>
    </div>
  );
}
