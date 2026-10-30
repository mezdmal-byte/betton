import { BellDot } from "lucide-react";
import { useState } from "react";
import type { NavId } from "../components/BottomNavigation/BottomNavigation";
import { BottomNavigation } from "../components/BottomNavigation/BottomNavigation";
import { StatusMessage } from "../components/StatusMessage/StatusMessage";
import { Tabs } from "../components/Tabs/Tabs";
import { Button } from "../components/Button/Button";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";
import { useT } from "../i18n";
import styles from "./NotificationsScreen.module.css";
import { useVisualV1 } from "../visualV1/VisualV1Context";
import { NotificationsV1 } from "../visualV1/NotificationsV1";

export type NotificationKind =
  | "partial-fill"
  | "full-fill"
  | "order-cancelled"
  | "refund"
  | "market-closing"
  | "market-closed"
  | "market-resolved"
  | "payout"
  | "created-market-approved"
  | "created-market-rejected"
  | "admin-moderation"
  | "generic";

export type NotificationItem = {
  id: string;
  kind?: NotificationKind;
  title: string;
  metadata: string;
  unread?: boolean;
  detailTitle?: string;
  context?: string;
  headline?: string;
  headlineMeta?: string;
  relatedTitle?: string;
  relatedMeta?: string;
  eventText?: string;
  eventMeta?: string;
  actionLabel?: string;
};

export type NotificationsScreenProps = {
  onBack?: () => void;
  items?: NotificationItem[];
  initialSelectedId?: string;
  onOpen?: (item: NotificationItem) => void;
  onAction?: (item: NotificationItem) => void;
  onNavChange?: (id: NavId) => void;
  onRead?: (item: NotificationItem) => void;
  listState?: "ready" | "loading" | "error" | "unauthenticated";
  onRetry?: () => void;
  errorMessage?: string | null;
};

export const notificationPreviewItems: NotificationItem[] = [
  {
    id: "partial-fill",
    kind: "partial-fill",
    title: "Предложение частично исполнен",
    metadata: "Предложение • 13,40 TON • 2 мин",
    unread: true,
    detailTitle: "Частичное исполнение",
    context: "Предложение • ДА @ 1.76",
    headline: "Исполнено 13,40 TON",
    headlineMeta: "Остаток 18,20 TON • 2 мин",
    relatedTitle: "Предложение • ДА @ 1.76",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть предложение",
  },
  {
    id: "awaiting-resolution",
    kind: "market-closed",
    title: "Событие ожидает решения",
    metadata: "Событие • 18 мин",
    unread: true,
    detailTitle: "Событие закрыт",
    context: "Событие • ETH выше $8k?",
    headline: "Торги завершены",
    headlineMeta: "Результат ожидает подтверждения",
    relatedTitle: "Событие • ETH выше $8k?",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть рынок",
  },
  {
    id: "full-fill",
    kind: "full-fill",
    title: "Предложение исполнен",
    metadata: "Позиция • сейчас",
    detailTitle: "Предложение исполнен",
    context: "Позиция • BTC выше $150k?",
    headline: "Исполнено 31,60 TON",
    headlineMeta: "Средняя цена 1.76 • сейчас",
    relatedTitle: "Позиция • BTC выше $150k?",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть позицию",
  },
  {
    id: "order-cancelled",
    kind: "order-cancelled",
    title: "Остаток предложения отменён",
    metadata: "Предложение • вчера",
    detailTitle: "Предложение отменён",
    context: "Предложение • НЕТ @ 2.14",
    headline: "Остаток предложения отменён",
    headlineMeta: "12,00 TON возвращены в баланс",
    relatedTitle: "Предложение • НЕТ @ 2.14",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть предложение",
  },
  {
    id: "refund",
    kind: "refund",
    title: "Возврат",
    metadata: "Позиция • вчера",
    detailTitle: "Возврат",
    context: "Позиция • Матч состоится?",
    headline: "Возврат 24,00 TON",
    headlineMeta: "Событие аннулирован • средства доступны",
    relatedTitle: "Позиция • Матч состоится?",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть позицию",
  },
  {
    id: "market-closing",
    kind: "market-closing",
    title: "Событие скоро закроется",
    metadata: "Событие • 30 мин",
    detailTitle: "Событие скоро закроется",
    context: "Событие • ETH выше $8k?",
    headline: "До закрытия 30 минут",
    headlineMeta: "Открытые предложения останутся до закрытия",
    relatedTitle: "Событие • ETH выше $8k?",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть рынок",
  },
  {
    id: "market-resolved",
    kind: "market-resolved",
    title: "Результат подтверждён",
    metadata: "Позиция • вчера",
    detailTitle: "Событие рассчитан",
    context: "Событие • ETH выше $8k?",
    headline: "Результат: ДА",
    headlineMeta: "Источник и решение доступны в событии",
    relatedTitle: "Событие • ETH выше $8k?",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть рынок",
  },
  {
    id: "payout",
    kind: "payout",
    title: "Выплата",
    metadata: "Позиция • сегодня",
    detailTitle: "Выплата",
    context: "Позиция • ETH выше $8k?",
    headline: "+46,80 TON начислено",
    headlineMeta: "Расчёт по выигрышной позиции",
    relatedTitle: "Позиция • ETH выше $8k?",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть позицию",
  },
  {
    id: "created-approved",
    kind: "created-market-approved",
    title: "Событие одобрен",
    metadata: "Моё событие • сегодня",
    detailTitle: "Событие одобрен",
    context: "Моё событие • TON выше $12?",
    headline: "Событие опубликован",
    headlineMeta: "Теперь он доступен участникам",
    relatedTitle: "Моё событие • TON выше $12?",
    relatedMeta: "Связанный объект",
    actionLabel: "Управлять рынком",
  },
  {
    id: "created-rejected",
    kind: "created-market-rejected",
    title: "Событие отклонён",
    metadata: "Моё событие • сегодня",
    detailTitle: "Событие отклонён",
    context: "Моё событие • Погода в Москве",
    headline: "Нужно исправить формулировку",
    headlineMeta: "Комментарий модератора внутри",
    relatedTitle: "Моё событие • Погода в Москве",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть мой рынок",
  },
  {
    id: "admin-moderation",
    kind: "admin-moderation",
    title: "Новая модерация",
    metadata: "Модерация • очередь событий",
    unread: true,
    detailTitle: "Новая модерация",
    context: "Модерация • очередь событий",
    headline: "3 рынка ждут проверки",
    headlineMeta: "Административный контекст",
    relatedTitle: "Модерация • очередь событий",
    relatedMeta: "Связанный объект",
    actionLabel: "Открыть модерацию",
  },
];

export function NotificationsScreen({
  onBack,
  items = [],
  initialSelectedId,
  onOpen,
  onAction,
  onNavChange,
  onRead,
  listState = "ready",
  onRetry,
  errorMessage,
}: NotificationsScreenProps) {
  const visualV1 = useVisualV1();
  const t = useT();
  const [selected, setSelected] = useState<NotificationItem | null>(
    () => items.find((item) => item.id === initialSelectedId) ?? null,
  );
  const [filter, setFilter] = useState("all");
  const visibleItems =
    filter === "unread" ? items.filter((item) => item.unread) : items;
  const unreadCount = items.filter((item) => item.unread).length;

  if (visualV1) return <NotificationsV1 items={items} initialSelectedId={initialSelectedId} onBack={onBack} onOpen={onOpen} onAction={onAction} onNavChange={onNavChange} onRead={onRead} listState={listState} onRetry={onRetry} errorMessage={errorMessage} />;

  if (selected) {
    return (
      <div className={styles.screen}>
        <header className={styles.detailHeader}>
          <div className={styles.detailTitleRow}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={t("back")}
            >
              ←
            </button>
            <h1>{selected.detailTitle ?? "Детали уведомления"}</h1>
          </div>
          <p>{selected.context ?? selected.metadata}</p>
        </header>

        <main className={styles.body}>
          {errorMessage ? (
            <StatusMessage tone="error" title="Не удалось обновить уведомление">
              {errorMessage}
            </StatusMessage>
          ) : null}
          <section className={styles.eventSummary}>
            <strong>{selected.headline ?? selected.title}</strong>
            <span>{selected.headlineMeta ?? selected.metadata}</span>
          </section>

          {selected.relatedTitle || selected.context ? (
            <button
              type="button"
              className={styles.detailRow}
              disabled={!onOpen}
              onClick={() => onOpen?.(selected)}
            >
              <span className={styles.detailCopy}>
                <strong>
                  {selected.relatedTitle ?? selected.context ?? selected.title}
                </strong>
                <small>{selected.relatedMeta ?? "Связанный объект"}</small>
              </span>
              <b aria-hidden="true">›</b>
            </button>
          ) : null}

          {selected.eventText || selected.eventMeta ? (
            <div className={styles.detailRowStatic}>
              <span className={styles.detailCopy}>
                <strong>{selected.eventText}</strong>
                <small>{selected.eventMeta}</small>
              </span>
            </div>
          ) : null}

          {selected.actionLabel ? (
            <Button
              fullWidth
              disabled={!onAction}
              onClick={() => onAction?.(selected)}
            >
              {selected.actionLabel}
            </Button>
          ) : null}
        </main>

        <BottomNavigation active="notifications" onChange={onNavChange} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t("nav.notifications")}</h1>
          <ThemeToggle />
        </div>
        <p>
          {items.length === 0
            ? "Все события"
            : unreadCount > 0
              ? unreadCount + " непрочитанных"
              : "Прочитанные"}
        </p>
      </header>

      <main className={styles.body}>
        <Tabs
          items={[
            { id: "all", label: "Все" },
            { id: "unread", label: "Непрочитанные" },
          ]}
          value={filter}
          onChange={setFilter}
          ariaLabel="Уведомления"
        />
        {errorMessage ? (
          <StatusMessage tone="error" title="Не удалось обновить уведомление">
            {errorMessage}
          </StatusMessage>
        ) : null}
        {listState === "loading" ? (
          <StatusMessage tone="loading" title={t("loading")}>
            {t("loading.body")}
          </StatusMessage>
        ) : null}
        {listState === "error" ? (
          <>
            <StatusMessage tone="error" title={t("err.request")}>
              {t("err.requestBody")}
            </StatusMessage>
            {onRetry ? (
              <Button variant="secondary" onClick={onRetry}>
                {t("retry")}
              </Button>
            ) : null}
          </>
        ) : null}
        {listState === "unauthenticated" ? (
          <StatusMessage tone="warning" title={t("err.openInTg")}>
            {t("err.openInTgBody")}
          </StatusMessage>
        ) : null}
        {listState === "ready" && visibleItems.length > 0 ? (
          <>
            <p className={styles.dateGroup}>ПОСЛЕДНИЕ УВЕДОМЛЕНИЯ</p>
            <div className={styles.list}>
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.row}
                  onClick={() => {
                    setSelected(item);
                    if (item.unread) onRead?.(item);
                  }}
                >
                  {item.unread ? (
                    <span className={styles.unread} aria-hidden="true" />
                  ) : null}
                  <span className={styles.copy}>
                    <strong
                      className={item.unread ? styles.unreadTitle : undefined}
                    >
                      {item.title}
                    </strong>
                    <small>{item.metadata}</small>
                  </span>
                  <span className={styles.disclosure} aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : listState === "ready" ? (
          <section className={styles.empty}>
            <BellDot size={48} strokeWidth={1.6} aria-hidden="true" />
            <h2>{filter === "unread" ? "Всё прочитано" : "Пока тихо"}</h2>
            <p>
              Здесь появятся уведомления о событиях, предложениях и результатах
              ставок.
            </p>
          </section>
        ) : null}
      </main>

      <BottomNavigation active="notifications" onChange={onNavChange} />
    </div>
  );
}
