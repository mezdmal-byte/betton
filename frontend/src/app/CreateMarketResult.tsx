import { useI18n } from "../i18n";
import { eventCopy } from "../api/eventsV3Copy";
import { useState } from "react";
import { copyShareLink, shareExternally } from "../api/share";
import type { MarketOut } from "../api/types";
import { Button } from "../components/Button/Button";
import type { NavId } from "../components/BottomNavigation/BottomNavigation";
import styles from "./CreateMarketResult.module.css";
import { useVisualV1 } from "../visualV1/VisualV1Context";
import { CreateResultV1 } from "../visualV1/CreateResultV1";

export type CreateMarketResultProps = {
  market: MarketOut;
  shareLink: string;
  onOpen: () => void;
  onBack: () => void;
  onToFeed: () => void;
  onNavChange?: (id: NavId) => void;
};
export function CreateMarketResult(props: CreateMarketResultProps) {
  const visualV1 = useVisualV1();
  return visualV1 ? <CreateResultV1 {...props} /> : <LegacyCreateMarketResult {...props} />;
}
function LegacyCreateMarketResult({
  market,
  shareLink,
  onOpen,
  onBack,
  onToFeed,
}: CreateMarketResultProps) {
  const { locale } = useI18n();
  const c = (source: string | undefined) => eventCopy(locale, source);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const unlisted = market.visibility === "unlisted";
  const waiting = unlisted && market.status === "closed";
  const pending = market.status === "pending";
  const title = sharing
    ? "Приглашение по ссылке"
    : pending
      ? "Ожидает модерации"
      : waiting
        ? "Приглашение отправлено"
        : market.status === "open"
          ? "Событие создано"
          : market.status === "rejected"
            ? "Событие отклонено"
            : "Состояние события";
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.topbar}>
          <button
            type="button"
            onClick={() => (sharing ? setSharing(false) : onBack())}
          >
            {c("← Назад")}
          </button>
          <span>BetTON</span>
        </div>
        <h1>{c(title)}</h1>
        <p>
          {pending
            ? c("Публичное событие")
            : waiting
              ? c("Частное с гарантом")
              : unlisted
                ? c("Частное по ссылке · Без гаранта")
                : c("Публичное событие")}
        </p>
      </header>
      <main className={styles.body}>
        {sharing ? (
          <>
            <section className={styles.section}>
              <h2>{c("Приглашение по ссылке")}</h2>
              <p>{market.question}</p>
              <label className={styles.linkLabel}>
                {c("Ссылка на событие")}
                <input
                  readOnly
                  value={shareLink}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            </section>
            <p>
              {c(
                "Событие доступно тем, у кого есть ссылка. Перед первой ставкой участники увидят правила и имя создателя.",
              )}
            </p>
            {copied ? (
              <p role="status" className={styles.success}>
                {c("Ссылка скопирована")}
              </p>
            ) : null}
            {shareError ? (
              <p role="alert" className={styles.error}>
                {c(shareError)}
              </p>
            ) : null}
            <Button
              variant="secondary"
              fullWidth
              disabled={!shareLink}
              onClick={() => {
                setShareError(null);
                void copyShareLink(shareLink).then((ok) => {
                  setCopied(ok);
                  if (!ok)
                    setShareError(
                      c(
                        "Не удалось скопировать. Выделите ссылку и скопируйте вручную.",
                      ),
                    );
                });
              }}
            >
              {c("Копировать ссылку")}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={!shareLink}
              onClick={() => {
                if (!shareExternally(shareLink))
                  setShareError(
                    c("Меню отправки недоступно. Скопируйте ссылку вручную."),
                  );
              }}
            >
              {c("Поделиться")}
            </Button>
          </>
        ) : pending ? (
          <>
            <section className={styles.card}>
              <h2>{c("Событие отправлено на проверку")}</h2>
              <p>
                {c(
                  "Модерация проверит условия и возможность установить результат.",
                )}
              </p>
            </section>
            <p>{c("Ставки откроются после одобрения.")}</p>
          </>
        ) : waiting ? (
          <>
            <section className={styles.card}>
              <h2>{c("Ждём ответа гаранта")}</h2>
              <p>
                {c(
                  "Откройте событие, чтобы обсудить и согласовать условия в чате.",
                )}
              </p>
            </section>
            <p>{c("Приём ставок пока закрыт.")}</p>
          </>
        ) : market.status === "open" ? (
          <>
            <section className={styles.section}>
              <h2>{c("Событие")}</h2>
              <p>{market.question}</p>
              <p>{market.outcomes?.join(" / ")}</p>
            </section>
            <section className={styles.section}>
              <h2>{c("Результат")}</h2>
              <p>
                {unlisted
                  ? c("Определяет создатель по опубликованным условиям.")
                  : c(
                      "Подтверждается в соответствии с утверждёнными правилами события.",
                    )}
              </p>
            </section>
          </>
        ) : (
          <section className={styles.card}>
            <h2>
              {market.status === "rejected"
                ? c("Причина отклонения")
                : c("Текущий статус")}
            </h2>
            <p>{market.rejection_reason || market.status}</p>
          </section>
        )}
      </main>
      <footer className={styles.footer}>
        {sharing ? (
          <Button fullWidth onClick={onOpen}>
            {c("Открыть событие")}
          </Button>
        ) : pending ? (
          <Button fullWidth onClick={onOpen}>
            {c("К моим событиям")}
          </Button>
        ) : waiting ? (
          <Button fullWidth onClick={onOpen}>
            {c("К согласованию условий")}
          </Button>
        ) : unlisted && market.status === "open" ? (
          <Button
            fullWidth
            disabled={!shareLink}
            onClick={() => setSharing(true)}
          >
            {c("Пригласить участников")}
          </Button>
        ) : (
          <Button fullWidth onClick={onOpen}>
            {c("Открыть событие")}
          </Button>
        )}
        {!pending && !sharing ? (
          <button type="button" className={styles.textLink} onClick={onToFeed}>
            {c("К событиям")}
          </button>
        ) : null}
      </footer>
    </div>
  );
}
