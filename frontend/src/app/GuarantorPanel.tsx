import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  caseAction,
  caseLabels,
  displayTime,
  deadlineLabel,
  remainingSeconds,
  getCase,
  guarantors,
} from "../api/guarantors";
import { queryKeys } from "../api/query";
import { errorDetail } from "../api/errors";
import { Button } from "../components/Button/Button";
import s from "./Guarantors.module.css";
import { useClock } from './useClock';

export function GuarantorPanel({
  marketId,
  userId,
  isAdmin = false,
}: {
  marketId: number;
  userId: number;
  isAdmin?: boolean;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["guarantor-case", marketId],
    queryFn: () => getCase(marketId),
    refetchInterval: 10_000,
  });
  const directory = useQuery({
    queryKey: ["guarantors"],
    queryFn: guarantors,
    enabled: query.data?.state === "needs_guarantor",
  });
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState("");
  const [outcomes, setOutcomes] = useState(["", ""]);
  const [closeAt, setCloseAt] = useState("");
  const [resultDueAt, setResultDueAt] = useState("");
  const [criteria, setCriteria] = useState("");
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState("");
  const [outcome, setOutcome] = useState("0");
  const [rating, setRating] = useState("5");
  const [confirmResult, setConfirmResult] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => caseAction(marketId, body),
    onSuccess: () => {
      setText("");
      setEditing(false);
      setConfirmResult(false);
      void qc.invalidateQueries();
    },
  });
  const c = query.data;
  const clock = useClock(c?.state === 'invited' || c?.state === 'review');
  useEffect(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.market(marketId) });
  }, [c?.state, c?.revision, marketId, qc]);
  if (query.isPending)
    return (
      <section className={s.panel} aria-busy="true">
        Загружаем условия пари…
      </section>
    );
  if (query.isError)
    return (
      <section className={s.panel}>
        <p role="alert">{errorDetail(query.error)}</p>
        <Button onClick={() => void query.refetch()}>Повторить</Button>
      </section>
    );
  if (!c) return null;
  const creator = c.creator_id === userId;
  const guarantor = c.guarantor_id === userId;
  const discussing = ["invited", "review"].includes(c.state);
  const timedOut = discussing && !!c.deadline && remainingSeconds(c.deadline, clock) === 0;
  const action = (name: string, extra: Record<string, unknown> = {}) =>
    mutation.mutate({ action: name, revision: c.revision, text, ...extra });
  const button = (
    name: string,
    label: string,
    extra: Record<string, unknown> = {},
  ) => (
    <Button
      variant={['accept', 'confirm', 'consent', 'propose', 'acknowledge'].includes(name) ? 'primary' : 'secondary'}
      disabled={mutation.isPending || (timedOut && ['accept', 'confirm', 'acknowledge', 'edit', 'extend'].includes(name)) || (name === 'accept' && c.creator_confirmed !== c.revision) || (name === 'confirm' && c.creator_confirmed === c.revision)}
      onClick={() => action(name, extra)}
    >
      {label}
    </Button>
  );
  return (
    <section className={s.panel} aria-label="Условия частного пари">
      <h2>{caseLabels[c.state] ?? c.state}</h2>
      <p>
        Гарант: <strong>{c.guarantor_name}</strong>. Он проверяет результат.
        BetTON хранит условия и начисляет выплаты.
      </p>
      <small>
        Версия условий {c.revision}.{" "}
        {c.deadline
          ? `Срок: ${displayTime(c.deadline)}`
          : `Проверка до ${displayTime(c.result_due_at)}`}
      </small>
      {discussing && c.deadline ? <strong>{deadlineLabel(c.deadline, clock)}</strong> : null}
      {c.state === 'review' ? <small>Создатель: {c.creator_confirmed === c.revision ? 'версия подтверждена' : 'ждём подтверждения'}. Гарант: ещё не принял эту версию.</small> : null}
      {['active', 'proposed', 'disputed', 'settled'].includes(c.state) ? <small>Создатель и гарант подтвердили версию {c.revision}.</small> : null}
      <details open={discussing || !c.consent}>
        <summary>Условия и подтверждение результата</summary>
        <div className={s.panel}>
          <p>{c.criteria}</p>
          <p>{c.source}</p>
          <small>
            После открытия ставок условия зафиксированы. Переписка служит
            доказательством и не меняет их автоматически.
          </small>
        </div>
      </details>
      {mutation.isError ? (
        <p className={s.error} role="alert">
          {errorDetail(mutation.error)}
        </p>
      ) : null}
      {c.state === "invited" && guarantor ? (
        <div className={s.actions}>
          {button("acknowledge", "Рассмотреть пари")}
          {button("decline", "Отклонить")}
        </div>
      ) : null}
      {c.state === "needs_guarantor" && creator ? (
        <>
          <label className={s.field}>
            Новый гарант
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Выберите гаранта</option>
              {directory.data
                ?.filter((g) => g.available && g.user_id !== userId)
                .map((g) => (
                  <option key={g.user_id} value={g.user_id}>
                    {g.name} · {g.topics}
                  </option>
                ))}
            </select>
          </label>
          <Button
            disabled={!selected || mutation.isPending}
            onClick={() => action("invite", { guarantor_id: Number(selected) })}
          >
            Пригласить
          </Button>
        </>
      ) : null}
      {c.state === "review" && (creator || guarantor) ? (
        <>
          {creator ? (
            <Button
              variant="secondary"
              onClick={() => {
                setCriteria(c.criteria);
                setSource(c.source);
                setQuestion(c.question);
                setOutcomes(c.outcomes);
                setCloseAt(localTime(c.close_at));
                setResultDueAt(localTime(c.result_due_at));
                setEditing(!editing);
              }}
            >
              Уточнить условия
            </Button>
          ) : null}
          {editing ? (
            <>
              <label className={s.field}>
                Вопрос
                <input
                  value={question}
                  maxLength={512}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </label>
              {outcomes.map((o, i) => (
                <label className={s.field} key={i}>
                  Исход {i + 1}
                  <input
                    value={o}
                    maxLength={128}
                    onChange={(e) =>
                      setOutcomes(
                        outcomes.map((v, j) => (i === j ? e.target.value : v)),
                      )
                    }
                  />
                </label>
              ))}
              <label className={s.field}>
                Конец приёма ставок
                <input
                  type="datetime-local"
                  value={closeAt}
                  onChange={(e) => setCloseAt(e.target.value)}
                />
              </label>
              <label className={s.field}>
                Срок проверки
                <input
                  type="datetime-local"
                  value={resultDueAt}
                  onChange={(e) => setResultDueAt(e.target.value)}
                />
              </label>
              <label className={s.field}>
                Условия
                <textarea
                  maxLength={4000}
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                />
              </label>
              <label className={s.field}>
                Чем подтверждается результат
                <textarea
                  maxLength={2000}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </label>
              {button("edit", "Сохранить новую версию", {
                question,
                outcomes,
                criteria,
                source,
                close_at: closeAt ? new Date(closeAt).toISOString() : undefined,
                result_due_at: resultDueAt
                  ? new Date(resultDueAt).toISOString()
                  : undefined,
              })}
            </>
          ) : null}
          <div className={s.actions}>
            {creator
              ? button(
                  "confirm",
                  c.creator_confirmed === c.revision
                    ? "Моя версия подтверждена"
                    : "Подтвердить условия",
                )
              : button("accept", c.creator_confirmed === c.revision ? "Принять условия и открыть пари" : "Ждём подтверждения создателя")}
            {button(
              "extend",
              c.extension_by && c.extension_by !== userId
                ? "Подтвердить ещё 5 минут"
                : c.extension_by
                  ? "Продление запрошено"
                  : "Попросить ещё 5 минут",
            )}
            {guarantor ? button("decline", "Отказаться") : null}
          </div>
        </>
      ) : null}
      {c.state === "active" && !guarantor && !c.consent ? (
        <>
          <p>
            Это частное пари. Оцените условия и выбранного гаранта: его решение
            может быть ошибочным. До выплаты вы сможете подать возражение.
          </p>
          {button("consent", "Условия прочитал, гаранту доверяю")}
        </>
      ) : null}
      {c.decision_reason ? (
        <p>
          <strong>
            Решение:{" "}
            {c.proposed_outcome == null ? "" : c.outcomes[c.proposed_outcome]}
          </strong>
          <br />
          {c.decision_reason}
        </p>
      ) : null}
      {c.state === "proposed" ? (
        <p>
          Выплата ожидает окончания срока возражений. Если результат неверен,
          объясните причину ниже.
        </p>
      ) : null}
      {(["active"].includes(c.state) && guarantor) ||
      (c.state === "disputed" && isAdmin) ? (
        <label className={s.field}>
          Результат
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {c.outcomes.map((o, i) => (
              <option key={i} value={i}>
                {o}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {!(c.state === "settled" || c.state === "cancelled") &&
      (creator || guarantor || c.participant || isAdmin) ? (
        <>
          <label className={s.field}>
            Сообщение или обоснование
            <textarea
              maxLength={4000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Опишите, что нужно уточнить, или добавьте ссылку на подтверждение"
            />
          </label>
          <div className={s.actions}>
            {button("message", "Отправить сообщение")}
            {c.state === "active" && guarantor ? (
              <Button
                disabled={!text.trim() || mutation.isPending}
                onClick={() => setConfirmResult(true)}
              >
                Предложить результат
              </Button>
            ) : null}
            {c.state === "active" && guarantor
              ? button("escalate", "Не могу определить результат")
              : null}
            {c.state === "proposed" && c.participant
              ? button("dispute", "Оспорить результат")
              : null}
          </div>
        </>
      ) : null}
      {confirmResult ? (
        <div className={s.panel}>
          <p>
            Подтвердить исход «{c.outcomes[Number(outcome)]}»? У участников
            будет 24 часа на возражение.
          </p>
          {button("propose", "Подтвердить результат", {
            outcome: Number(outcome),
          })}
          <Button variant="secondary" onClick={() => setConfirmResult(false)}>
            Вернуться
          </Button>
        </div>
      ) : null}
      {c.state === "disputed" && isAdmin ? (
        <div className={s.actions}>
          {button("admin_resolve", "Завершить спор и выплатить", {
            outcome: Number(outcome),
          })}
          {button("admin_cancel", "Отменить пари и вернуть ставки")}
        </div>
      ) : null}
      {c.state === "settled" && c.participant ? (
        <details>
          <summary>Оценить гаранта</summary>
          <div className={s.panel}>
            <label className={s.field}>
              Оценка
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className={s.field}>
              Отзыв
              <textarea
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            {button("review", "Оставить отзыв", { rating: Number(rating) })}
          </div>
        </details>
      ) : null}
      <details>
        <summary>
          История согласования и доказательства · {c.messages.length}
        </summary>
        {c.messages.map((m) => (
          <div className={s.message} key={m.id}>
            <small>
              {m.user_id === c.guarantor_id
                ? "Гарант"
                : m.user_id === c.creator_id
                  ? "Создатель"
                  : "Участник"}{" "}
              · {displayTime(m.created_at)} · версия {m.revision}
            </small>
            <p>
              {m.kind === "terms" ? "Зафиксирована версия условий" : m.text}
            </p>
            {m.kind === "terms" ? (
              <details>
                <summary>Посмотреть сохранённые условия</summary>
                <p>{m.text}</p>
              </details>
            ) : null}
          </div>
        ))}
      </details>
    </section>
  );
}

function localTime(value: string) {
  const d = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + "Z");
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
