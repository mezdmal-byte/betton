import { useState } from "react";
import { useT } from "../../i18n";
import type { OrderBookLevel, OutcomeSide } from "../../types/market";
import { formatOdds, formatTon } from "../../lib/format";
import { OrderBookRow } from "../OrderBookRow/OrderBookRow";
import { StatusMessage } from "../StatusMessage/StatusMessage";
import styles from "./OrderBookPanel.module.css";

export type OrderBookPanelProps = {
  outcomeALabel: string;
  outcomeBLabel: string;
  sideA: OrderBookLevel[];
  sideB: OrderBookLevel[];
  state?: "ready" | "loading" | "error" | "empty";
  hint?: string;
  onRetry?: () => void;
  selectedSide?: OutcomeSide;
};

export function OrderBookPanel({
  outcomeALabel,
  outcomeBLabel,
  sideA,
  sideB,
  state = "ready",
  hint,
  onRetry,
  selectedSide,
}: OrderBookPanelProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const canExpand =
    (selectedSide === "b"
      ? sideB.length
      : selectedSide === "a"
        ? sideA.length
        : Math.max(sideA.length, sideB.length)) > 5;
  if (state === "loading") {
    return (
      <StatusMessage tone="loading" title={t("book.loading")}>
        {t("loading.body")}
      </StatusMessage>
    );
  }
  if (state === "error") {
    return (
      <div className={styles.errorBlock}>
        <StatusMessage tone="error" title={t("book.error")} />
        {onRetry ? (
          <button type="button" className={styles.retry} onClick={onRetry}>
            {t("retry")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section className={styles.root} aria-label="Предложения участников">
      {selectedSide !== "b" ? (
        <OutcomeBook label={outcomeALabel} levels={sideA} expanded={expanded} />
      ) : null}
      {selectedSide !== "a" ? (
        <OutcomeBook label={outcomeBLabel} levels={sideB} expanded={expanded} />
      ) : null}
      <p className={styles.hint}>
        {hint ||
          "В каждой строке — сумма, доступная по этому коэффициенту для выбранного исхода."}
      </p>
      {canExpand ? (
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Свернуть предложения ↑" : "Все предложения ↓"}
        </button>
      ) : null}
    </section>
  );
}

function OutcomeBook({
  label,
  levels,
  expanded,
}: {
  label: string;
  levels: OrderBookLevel[];
  expanded: boolean;
}) {
  const t = useT();
  const sortedLevels = [...levels].sort((a, b) => b.odds - a.odds);
  const visibleLevels = expanded ? sortedLevels : sortedLevels.slice(0, 5);
  const maxAvailable = Math.max(
    ...sortedLevels.map((level) => level.availableTon),
    1,
  );
  return (
    <div className={styles.side}>
      <strong className={styles.sideTitle}>
        {sortedLevels[0]
          ? `Лучший доступный: ${label} · ${formatOdds(sortedLevels[0].odds)}× · ${formatTon(sortedLevels[0].availableTon)}`
          : label}
      </strong>
      <div className={styles.head}>
        <span>{t("book.coef")}</span>
        <span>{t("book.availCol")}</span>
      </div>
      {sortedLevels.length === 0 ? (
        <p className={styles.empty}>{t("book.noOrders")}</p>
      ) : (
        visibleLevels.map((level, index) => (
          <OrderBookRow
            key={`${level.odds}-${index}`}
            level={level}
            maxAvailable={maxAvailable}
            active={index === 0}
          />
        ))
      )}
      {sortedLevels.length > 0 ? (
        <div className={styles.total}>
          <span>Всего доступно сейчас</span>
          <strong>
            {formatTon(
              sortedLevels.reduce((sum, level) => sum + level.availableTon, 0),
            )}
          </strong>
        </div>
      ) : null}
    </div>
  );
}
