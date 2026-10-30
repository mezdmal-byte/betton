import { useEffect, useState } from "react";
import type { NavId } from "../BottomNavigation/BottomNavigation";
import { BottomNavigation } from "../BottomNavigation/BottomNavigation";
import { AmountInput } from "../AmountInput/AmountInput";
import { Button } from "../Button/Button";
import { OutcomeQuote } from "../OutcomeQuote/OutcomeQuote";
import { MarketChart } from "../MarketChart/MarketChart";
import { cx } from "../../lib/cx";
import { formatOdds, formatTon, formatTonFull } from "../../lib/format";
import { useT } from "../../i18n";
import { outcomeIsExecutable } from "../../lib/quote";
import {
  amountInputValue,
  presetExceedsBalance,
  quickTradeCtaDisabled,
} from "../../lib/quickTrade";
import type {
  ChartPoint,
  MarketFixture,
  OutcomeSide,
} from "../../types/market";
import styles from "./QuickTradeSheet.module.css";
import type { GuarantorTradeCosts as GuarantorCosts } from "../../api/types";
import { GuarantorTradeCosts } from "../GuarantorTradeCosts/GuarantorTradeCosts";
import { useVisualV1 } from '../../visualV1/VisualV1Context';
import { QuickTradeV1 } from '../../visualV1/QuickTradeV1';

export type QuickTradeState =
  | "normal"
  | "partial"
  | "no-liquidity"
  | "processing"
  | "stale-quote"
  | "insufficient-balance"
  | "success"
  | "error";

export type QuickTradeFillLeg = {
  odds: number;
  matchedTon: number;
};

export type QuickTradeSheetProps = {
  market: MarketFixture;
  selectedSide: OutcomeSide;
  amount: number;
  state?: QuickTradeState;
  onSelectSide?: (side: OutcomeSide) => void;
  onAmountChange?: (amount: number) => void;
  onClose?: () => void;
  onOwnPrice?: () => void;
  onRefreshQuote?: () => void;
  onPlace?: () => void;
  onNavChange?: (id: NavId) => void;
  demoMode?: boolean;
  quotesLoading?: boolean;
  availableTon?: number | null;
  totalAvailableTon?: number | null;
  previewMatchedTon?: number | null;
  previewRestTon?: number | null;
  previewPayoutTon?: number | null;
  guarantorCosts?: GuarantorCosts | null;
  previewAverageOdds?: number | null;
  previewWorstOdds?: number | null;
  previewFills?: QuickTradeFillLeg[] | null;
  historySeries?: ChartPoint[];
  historyLoading?: boolean;
  historyError?: boolean;
  historyDemo?: boolean;
  errorMessage?: string | null;
  placeResult?: {
    kind: "empty" | "partial" | "full";
    filledTon: number;
    refundedTon: number;
    requestedTon?: number;
    status?: string;
  } | null;
};

function outcomeOf(market: MarketFixture, side: OutcomeSide) {
  return side === "a" ? market.outcomeA : market.outcomeB;
}

function quoteValue(value: number | null | undefined, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(2) + suffix;
}

export function QuickTradeSheet(props: QuickTradeSheetProps) {
  return useVisualV1() ? <QuickTradeV1 {...props}/> : <LegacyQuickTradeSheet {...props}/>;
}

function LegacyQuickTradeSheet({
  market,
  selectedSide,
  amount,
  state = "normal",
  onSelectSide,
  onAmountChange,
  onClose,
  onOwnPrice,
  onRefreshQuote,
  onPlace,
  onNavChange,
  demoMode = false,
  quotesLoading = false,
  availableTon = null,
  totalAvailableTon = null,
  previewMatchedTon = null,
  previewRestTon = null,
  previewPayoutTon = null,
  guarantorCosts = null,
  previewAverageOdds = null,
  previewWorstOdds = null,
  previewFills = null,
  historySeries = [],
  historyLoading = false,
  historyError = false,
  historyDemo = false,
  errorMessage = null,
  placeResult = null,
}: QuickTradeSheetProps) {
  const t = useT();
  const [amountDraft, setAmountDraft] = useState(() =>
    amountInputValue(amount),
  );
  const [confirming, setConfirming] = useState(false);
  const [editingAfterInsufficient, setEditingAfterInsufficient] =
    useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setAmountDraft(amountInputValue(amount));
    setConfirming(false);
  }, [amount, selectedSide]);

  useEffect(() => {
    if (state !== "normal" && state !== "partial") setConfirming(false);
    if (state !== "insufficient-balance") setEditingAfterInsufficient(false);
  }, [state]);

  const selected = outcomeOf(market, selectedSide);
  const executable = !quotesLoading && outcomeIsExecutable(selected);
  const terminalState =
    state === "success" || state === "processing" || state === "error";
  const noLiquidity =
    !quotesLoading &&
    !terminalState &&
    (state === "no-liquidity" || !executable);
  const stale = state === "stale-quote";
  const insufficient =
    state === "insufficient-balance" ||
    (amount > 0 && presetExceedsBalance(amount, availableTon));
  const amountEntered = amount > 0;
  const matched = previewMatchedTon;
  const rest = previewRestTon;
  const hasBackendPreview = matched != null && rest != null;
  const showPreview =
    amountEntered &&
    executable &&
    !stale &&
    hasBackendPreview &&
    (matched ?? 0) > 0;
  const canPlace = guarantorCosts?.can_place !== false && !quickTradeCtaDisabled({
    amount,
    executable,
    quotesLoading,
    insufficient,
    matchedTon: previewMatchedTon,
    demoMode,
    state,
  });
  const primaryIsOwnPrice = noLiquidity && !stale;
  const primaryIsRefresh = stale || state === "error";
  const partialFill = state === "success" && placeResult?.kind === "partial";
  const primaryDisabled =
    demoMode ||
    state === "success" ||
    (primaryIsRefresh || primaryIsOwnPrice ? false : !canPlace);

  const primaryLabel = demoMode
    ? t("demo.unavailable")
    : state === "processing"
      ? t("market.processing")
      : partialFill
        ? t("market.partialFilled")
        : state === "success"
          ? t("market.filled")
          : primaryIsRefresh
            ? t("market.refreshQuote")
            : primaryIsOwnPrice
              ? "Свой коэффициент"
              : confirming
                ? "Подтвердить ставку"
                : "Проверить ставку";

  const totalNow = totalAvailableTon ?? selected.liquidityTon;
  const historyVolumeTon = historySeries.reduce(
    (sum, point) => sum + point.volume,
    0,
  );
  const historyCurrentOdds =
    historySeries[historySeries.length - 1]?.odds ?? selected.odds ?? 0;
  const specialState =
    state === "processing" ||
    state === "stale-quote" ||
    state === "no-liquidity" ||
    state === "insufficient-balance" ||
    state === "success" ||
    state === "error";
  const showSpecialState =
    specialState &&
    !(state === "insufficient-balance" && editingAfterInsufficient);

  if (showSpecialState) {
    const resultPartial =
      state === "success" && placeResult?.kind === "partial";
    const resultFull = state === "success" && placeResult?.kind === "full";
    const requestedTon = placeResult?.requestedTon ?? amount;

    let title = "Сделать ставку";
    let metric = formatTonFull(amount);
    let metricCaption = "";
    let tone: "success" | "warning" | "danger" | "default" = "default";
    let rows: string[] = [];
    let primaryLabel = "К событию";
    let primaryAction: (() => void) | undefined = onClose;
    let loading = false;

    if (state === "processing") {
      title = "Ставка обрабатывается";
      metric = formatTonFull(amount);
      metricCaption = "исполняем по доступным коэффициентам";
      rows = [
        "Проверяем предложения",
        "Сопоставляем встречные ставки",
        "Дождитесь подтверждения сервера",
      ];
      primaryLabel = "Обработка…";
      primaryAction = undefined;
      loading = true;
    } else if (state === "stale-quote") {
      title = "Коэффициенты изменились";
      metric =
        previewAverageOdds != null
          ? formatOdds(previewAverageOdds) + "×"
          : "Котировка";
      metricCaption = "проверьте новые условия исполнения";
      tone = "warning";
      rows = [
        "Сумма · " + formatTonFull(amount),
        previewPayoutTon != null
          ? "Выплата по новой ставке до сборов · " + formatTonFull(previewPayoutTon)
          : "Котировка требует обновления",
        errorMessage || "Проверьте обновлённую котировку",
      ];
      primaryLabel = "Обновить предложения";
      primaryAction = onRefreshQuote;
    } else if (state === "no-liquidity") {
      title = "Нет встречных предложений";
      metric = "0.00 TON";
      metricCaption = "сейчас нельзя исполнить";
      rows = [
        "Встречных предложений нет",
        "Баланс не изменён",
        "Попробуйте позже или задайте свой коэффициент",
      ];
      primaryLabel = "Задать свой коэффициент";
      primaryAction = onOwnPrice;
    } else if (state === "insufficient-balance") {
      title = "Недостаточно TON";
      metric = formatTonFull(availableTon ?? 0);
      metricCaption = "доступно · требуется " + formatTonFull(amount);
      tone = "danger";
      rows = [
        "Не хватает · " +
          formatTonFull(Math.max(0, amount - (availableTon ?? 0))),
        "Сумма ставки · " + formatTonFull(amount),
        "Измените сумму и повторите",
      ];
      primaryLabel = "Изменить сумму";
      primaryAction = () => setEditingAfterInsufficient(true);
    } else if (
      state === "success" &&
      (resultPartial || resultFull) &&
      placeResult
    ) {
      title = resultPartial ? "Исполнено частично" : "Ставка исполнена";
      metric = formatTonFull(placeResult.filledTon);
      metricCaption = resultPartial
        ? "исполнено из " + formatTonFull(requestedTon)
        : "исполнено полностью";
      tone = "success";
      rows = [
        "Исполнено · " + formatTonFull(placeResult.filledTon),
        ...(placeResult.refundedTon > 0
          ? ["Возвращено · " + formatTonFull(placeResult.refundedTon)]
          : []),
        resultPartial
          ? "Остаток не стал предложением"
          : "Неисполненного остатка нет",
      ];
      primaryLabel = resultPartial ? "Готово" : "К моим ставкам";
      primaryAction = onNavChange ? () => onNavChange("portfolio") : onClose;
    } else if (state === "error") {
      title = "Ставка не выполнена";
      metric = "Не исполнено";
      metricCaption = "операция не подтверждена";
      tone = "danger";
      rows = [
        errorMessage || "Не удалось подтвердить исполнение",
        "Повторите с новой котировкой",
      ];
      primaryLabel = "Повторить";
      primaryAction = onRefreshQuote;
    }

    return (
      <section className={styles.screen} aria-label={t("market.quickTrade")}>
        <header className={styles.header}>
          <strong className={styles.marketQuestion}>{market.question}</strong>
          <div className={styles.titleRow}>
            <button
              type="button"
              className={styles.backButton}
              onClick={onClose}
              aria-label={t("back")}
            >
              ←
            </button>
            <h1>{title}</h1>
          </div>
        </header>
        <main className={styles.body}>
          <section
            className={cx(
              styles.stateMetric,
              tone === "success" && styles.stateMetricSuccess,
              tone === "warning" && styles.stateMetricWarning,
              tone === "danger" && styles.stateMetricDanger,
            )}
          >
            <strong>{metric}</strong>
            <span>{metricCaption}</span>
          </section>

          <div className={styles.stateRows}>
            {rows.map((row, index) => (
              <div key={String(index) + row}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{row}</p>
              </div>
            ))}
          </div>

          {resultPartial ? (
            <section className={styles.stateNotice}>
              <strong>ВАЖНО</strong>
              <p>Неисполненная часть уже доступна на балансе.</p>
            </section>
          ) : null}

          <Button
            fullWidth
            loading={loading}
            disabled={loading || !primaryAction}
            onClick={primaryAction}
          >
            {primaryLabel}
          </Button>

          {state !== "processing" && state !== "success" ? (
            <Button variant="secondary" fullWidth onClick={onClose}>
              К событию
            </Button>
          ) : null}
        </main>
        <BottomNavigation active="markets" onChange={onNavChange} />
      </section>
    );
  }

  if (state === "partial" && showPreview && !confirming) {
    return (
      <section className={styles.screen} aria-label={t("market.quickTrade")}>
        <header className={styles.header}>
          <strong className={styles.marketQuestion}>{market.question}</strong>
          <div className={styles.titleRow}>
            <button
              type="button"
              className={styles.backButton}
              onClick={onClose}
              aria-label={t("back")}
            >
              ←
            </button>
            <h1>Частичное исполнение</h1>
          </div>
        </header>
        <main className={styles.body}>
          <section className={styles.stateMetric}>
            <strong>{formatTonFull(matched ?? 0)}</strong>
            <span>исполнится из {formatTonFull(amount)}</span>
          </section>

          <div className={styles.stateRows}>
            {(previewFills ?? []).map((leg, index) => (
              <div key={String(leg.odds) + "-" + index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>
                  {formatTonFull(leg.matchedTon)} @ {formatOdds(leg.odds)}×
                </p>
              </div>
            ))}
            <div>
              <span>
                {String((previewFills?.length ?? 0) + 1).padStart(2, "0")}
              </span>
              <p>Не исполнится · {formatTonFull(rest ?? 0)}</p>
            </div>
            <div>
              <span>
                {String((previewFills?.length ?? 0) + 2).padStart(2, "0")}
              </span>
              <p>Возврат остатка · {formatTonFull(rest ?? 0)}</p>
            </div>
          </div>

          <section className={styles.stateNotice}>
            <strong>ВАЖНО</strong>
            <p>
              Неисполненный остаток вернётся на баланс и не будет ожидать
              встречной ставки.
            </p>
          </section>

          {guarantorCosts ? <GuarantorTradeCosts costs={guarantorCosts} /> : null}

          <Button fullWidth disabled={!canPlace} onClick={onPlace}>
            Подтвердить ставку
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            К событию
          </Button>
        </main>
        <BottomNavigation active="markets" onChange={onNavChange} />
      </section>
    );
  }

  return (
    <section className={styles.screen} aria-label={t("market.quickTrade")}>
      <header className={styles.header}>
        <strong className={styles.marketQuestion}>{market.question}</strong>
        <div className={styles.titleRow}>
          <h1>Сделать ставку</h1>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.outcomes}>
          <OutcomeQuote
            label={market.outcomeA.label}
            odds={market.outcomeA.odds}
            liquidity={market.outcomeA.liquidityTon}
            side="a"
            density="compact"
            showLiquidity={false}
            state={
              quotesLoading
                ? "loading"
                : selectedSide === "a"
                  ? "selected"
                  : "default"
            }
            onClick={() => onSelectSide?.("a")}
          />
          <OutcomeQuote
            label={market.outcomeB.label}
            odds={market.outcomeB.odds}
            liquidity={market.outcomeB.liquidityTon}
            side="b"
            density="compact"
            showLiquidity={false}
            state={
              quotesLoading
                ? "loading"
                : selectedSide === "b"
                  ? "selected"
                  : "default"
            }
            onClick={() => onSelectSide?.("b")}
          />
        </div>

        <AmountInput
          className={styles.amountInput}
          value={amountDraft}
          placeholder="0"
          label={
            availableTon == null
              ? "Сумма ставки"
              : "Сумма ставки · баланс " + formatTonFull(availableTon)
          }
          onChange={(value) => {
            let normalized = value.replace(",", ".");
            if (normalized.startsWith(".")) normalized = "0" + normalized;
            if (!/^\d*(?:\.\d{0,9})?$/.test(normalized)) return;
            setAmountDraft(normalized);
            setConfirming(false);
            onAmountChange?.(Number(normalized) || 0);
          }}
          error={
            insufficient
              ? t("err.fundsAvail", { amt: formatTonFull(availableTon) })
              : undefined
          }
        />

        <div className={styles.quote}>
          <QuoteRow
            label="Лучший коэффициент"
            value={quotesLoading ? "…" : formatOdds(selected.odds) + "×"}
          />
          <QuoteRow
            label="Доступно по лучшему"
            value={quotesLoading ? "…" : formatTon(selected.liquidityTon)}
          />
          <QuoteRow
            label="Всего доступно сейчас"
            value={quotesLoading ? "…" : formatTon(totalNow)}
          />

          <QuoteRow
            label="Средний коэффициент исполнения"
            value={showPreview ? quoteValue(previewAverageOdds) + "×" : "—"}
          />
          <QuoteRow
            label="Худший коэффициент исполнения"
            value={showPreview ? formatOdds(previewWorstOdds) + "×" : "—"}
          />
          <QuoteRow
            label="Исполнится сейчас"
            value={showPreview ? formatTon(matched) : "—"}
          />
          {!guarantorCosts ? <QuoteRow
            label="Выплата до сервисного сбора"
            value={showPreview ? formatTon(previewPayoutTon) : "—"}
          /> : null}
          {showPreview && rest != null && rest > 0 ? (
            <QuoteRow label="Вернётся на баланс" value={formatTon(rest)} />
          ) : null}
        </div>

        {guarantorCosts ? <GuarantorTradeCosts costs={guarantorCosts} /> : null}

        <button
          type="button"
          className={styles.historyToggle}
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((open) => !open)}
        >
          <span>
            История коэффициента
            <small>Фактические сделки · {selected.label}</small>
          </span>
          <strong>{historyOpen ? "Скрыть ↑" : "Показать ›"}</strong>
        </button>

        {historyOpen ? (
          <div className={styles.historyPanel}>
            {historyLoading ? (
              <div className={styles.historyEmpty}>
                Загружаем историю сделок…
              </div>
            ) : historyError ? (
              <div className={styles.historyEmpty}>
                Не удалось загрузить историю сделок.
              </div>
            ) : historySeries.length > 0 ? (
              <MarketChart
                series={historySeries}
                currentOdds={historyCurrentOdds}
                outcomeLabel={selected.label}
                volumeTon={historyVolumeTon}
                title={"История коэффициента · " + selected.label}
                demo={historyDemo}
              />
            ) : (
              <div className={styles.historyEmpty}>
                Сделок по этому исходу пока нет.
              </div>
            )}
          </div>
        ) : null}

        {previewFills && previewFills.length > 1 ? (
          <div className={styles.fillBreakdown}>
            {previewFills.map((leg, index) => (
              <span key={String(leg.odds) + "-" + index}>
                {formatTon(leg.matchedTon)} по {formatOdds(leg.odds)}×
              </span>
            ))}
          </div>
        ) : null}

        <p className={styles.note}>
          Доступная часть исполнится сразу. Неисполненный остаток вернётся на
          баланс. Сервисный сбор — 1% только с чистой прибыли победителя.
        </p>

        {confirming && showPreview ? (
          <div className={styles.confirmation}>
            <strong>Проверьте ставку</strong>
            <span>
              {selected.label} · {formatTon(amount)} · средний коэффициент{" "}
              {quoteValue(previewAverageOdds)}×
            </span>
          </div>
        ) : null}

        <Button
          fullWidth
          disabled={primaryDisabled}
          onClick={
            demoMode
              ? undefined
              : primaryIsOwnPrice
                ? onOwnPrice
                : confirming
                  ? onPlace
                  : () => setConfirming(true)
          }
        >
          {primaryLabel}
        </Button>

        <div className={styles.destinations}>
          <Button
            variant="secondary"
            fullWidth
            disabled={demoMode}
            onClick={demoMode ? undefined : onOwnPrice}
          >
            Свой коэффициент
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            К событию
          </Button>
        </div>
      </main>

      <BottomNavigation active="markets" onChange={onNavChange} />
    </section>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.quoteRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
