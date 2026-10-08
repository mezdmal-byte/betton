import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import {
  guarantors,
  caseLabels,
  displayTime,
  deadlineLabel,
  type Guarantor,
  type CaseSummary,
  type Notice,
} from "../api/guarantors";
import { errorDetail } from "../api/errors";
import { Button } from "../components/Button/Button";
import {
  BottomNavigation,
  type NavId,
} from "../components/BottomNavigation/BottomNavigation";
import s from "./Guarantors.module.css";
import { useClock } from './useClock';

export function ConnectedGuarantors({
  userId,
  isAdmin,
  onBack,
  onOpen,
  onNavChange,
}: {
  userId?: number;
  isAdmin: boolean;
  onBack: () => void;
  onOpen: (id: number) => void;
  onNavChange: (id: NavId) => void;
}) {
  const qc = useQueryClient();
  const clock = useClock(!!userId);
  const [bio, setBio] = useState("");
  const [topics, setTopics] = useState("");
  const [editing, setEditing] = useState(false);
  const list = useQuery({
    queryKey: ["guarantors"],
    queryFn: guarantors,
    enabled: !!userId,
    refetchInterval: 15_000,
  });
  const mine = useQuery({
    queryKey: ["guarantor-profile", userId],
    queryFn: () =>
      apiRequest<Guarantor | null>("/guarantors/me").then((r) => r.data),
    enabled: !!userId,
  });
  const cases = useQuery({
    queryKey: ["guarantor-cases", userId],
    queryFn: () =>
      apiRequest<CaseSummary[]>("/guarantor-cases").then((r) => r.data),
    enabled: !!userId,
    refetchInterval: 10_000,
  });
  const applications = useQuery({
    queryKey: ["guarantor-applications"],
    queryFn: () =>
      apiRequest<Guarantor[]>("/guarantors/applications").then((r) => r.data),
    enabled: !!userId && isAdmin,
  });
  const mutation = useMutation({
    mutationFn: ({
      path,
      body,
      method = "POST",
    }: {
      path: string;
      body: object;
      method?: string;
    }) => apiRequest(path, { method, jsonBody: body }),
    onSuccess: () => {
      setEditing(false);
      void qc.invalidateQueries();
    },
  });
  const submit = (path: string, body: object, method = "POST") =>
    mutation.mutate({ path, body, method });
  return (
    <main className={s.page}>
      <Button variant="secondary" onClick={onBack}>
        Назад
      </Button>
      <h1>Гаранты</h1>
      {!userId ? (
        <p>Откройте BetTON через Telegram.</p>
      ) : (
        <>
          {[mine, list, cases, applications]
            .filter((q) => q.isError)
            .map((q, i) => (
              <p key={i} role="alert" className={s.error}>
                {errorDetail(q.error)}{" "}
                <button onClick={() => void q.refetch()}>Повторить</button>
              </p>
            ))}
          {mutation.isError ? (
            <p role="alert" className={s.error}>
              {errorDetail(mutation.error)}
            </p>
          ) : null}
          <section className={s.panel}>
            <h2>Мой профиль гаранта</h2>
            {mine.isPending ? (
              <p>Загружаем профиль…</p>
            ) : (
              <>
                {mine.data ? (
                  <>
                    <p>{mine.data.bio}</p>
                    <small>
                      {mine.data.status === "approved"
                        ? "Профиль одобрен"
                        : mine.data.status === "pending"
                          ? "Заявка на рассмотрении"
                          : "Приём пари приостановлен"}
                    </small>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setBio(mine.data!.bio);
                        setTopics(mine.data!.topics);
                        setEditing(!editing);
                      }}
                    >
                      Редактировать профиль
                    </Button>
                  </>
                ) : (
                  <p>
                    Расскажите, какие события вы готовы проверять. Администратор
                    рассмотрит заявку.
                  </p>
                )}
                {!mine.data || editing ? (
                  <>
                    <label className={s.field}>
                      О себе
                      <textarea
                        value={bio}
                        maxLength={1000}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </label>
                    <label className={s.field}>
                      Какие пари готовы проверять
                      <input
                        value={topics}
                        maxLength={300}
                        onChange={(e) => setTopics(e.target.value)}
                      />
                    </label>
                    <Button
                      disabled={
                        bio.trim().length < 10 ||
                        topics.trim().length < 2 ||
                        mutation.isPending
                      }
                      onClick={() =>
                        submit("/guarantors/me", { bio, topics }, "PUT")
                      }
                    >
                      Сохранить профиль
                    </Button>
                  </>
                ) : null}
                {mine.data?.status === "approved" ? (
                  <>
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        submit("/guarantors/me/availability", {
                          available: !mine.data!.available,
                        })
                      }
                    >
                      {mine.data.available
                        ? "Не принимать новые пари"
                        : "Принимать новые пари · 1 час"}
                    </Button>
                    <small>
                      Оставайтесь в приложении, чтобы получать запросы. При
                      выходе вы исчезнете из доступных гарантов. Уже принятые
                      пари остаются за вами.
                    </small>
                  </>
                ) : null}
              </>
            )}
          </section>
          <section className={s.panel}>
            <h2>{isAdmin ? "Пари и споры" : "Мои пари с гарантом"}</h2>
            {cases.isPending ? (
              <p>Загружаем пари…</p>
            ) : !cases.data?.length ? (
              <p>Запросов пока нет.</p>
            ) : (
              cases.data.map((c) => (
                <button
                  className={s.notice}
                  key={c.market_id}
                  onClick={() => onOpen(c.market_id)}
                >
                  <strong>{c.question}</strong>
                  <br />
                  <small>
                    {caseLabels[c.state]}
                    {c.deadline ? ` · до ${displayTime(c.deadline)}` : ""}
                    {c.deadline && ['invited', 'review'].includes(c.state) ? ` · ${deadlineLabel(c.deadline, clock)}` : ''}
                  </small>
                </button>
              ))
            )}
          </section>
          <section className={s.panel}>
            <h2>Выбрать гаранта</h2>
            <p>Гарант отдельно ознакомится с пари и подтвердит условия.</p>
            {list.isPending ? (
              <p>Загружаем список…</p>
            ) : !list.data?.length ? (
              <p>Одобренных гарантов пока нет.</p>
            ) : (
              list.data.map((g) => (
                <article className={s.panel} key={g.user_id}>
                  <h3>{g.name}</h3>
                  <small>
                    {g.available ? "Принимает новые пари" : "Сейчас недоступен"}{" "}
                    · завершено {g.completed} ·{" "}
                    {g.rating == null
                      ? "Нет оценок"
                      : `${g.rating}/5 · отзывов ${g.review_count}`}
                  </small>
                  <p>{g.bio}</p>
                  <p>{g.topics}</p>
                  {g.reviews.length ? (
                    <details>
                      <summary>Отзывы участников</summary>
                      {g.reviews.map((r, i) => (
                        <p key={i}>
                          {r.rating}/5 · {r.text}
                        </p>
                      ))}
                    </details>
                  ) : null}
                </article>
              ))
            )}
          </section>
          {isAdmin ? (
            <section className={s.panel}>
              <h2>Допуск гарантов</h2>
              {applications.data?.map((g) => (
                <article className={s.panel} key={g.user_id}>
                  <h3>{g.name}</h3>
                  <p>{g.bio}</p>
                  <p>{g.topics}</p>
                  <small>
                    {g.status === "approved"
                      ? "Одобрен"
                      : g.status === "pending"
                        ? "Ожидает проверки"
                        : "Приостановлен"}
                  </small>
                  <div className={s.actions}>
                    <Button
                      disabled={mutation.isPending || g.status === "approved"}
                      onClick={() =>
                        submit(`/guarantors/${g.user_id}/approval`, {
                          approved: true,
                        })
                      }
                    >
                      Одобрить
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={mutation.isPending || g.status === "rejected"}
                      onClick={() =>
                        submit(`/guarantors/${g.user_id}/approval`, {
                          approved: false,
                        })
                      }
                    >
                      Приостановить
                    </Button>
                  </div>
                </article>
              ))}
            </section>
          ) : null}
        </>
      )}
      <BottomNavigation active="profile" onChange={onNavChange} />
    </main>
  );
}

export function ConnectedNotifications({
  userId,
  onOpen,
  onNavChange,
}: {
  userId?: number;
  onOpen: (id: number) => void;
  onNavChange: (id: NavId) => void;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => apiRequest<Notice[]>("/notifications").then((r) => r.data),
    enabled: !!userId,
    refetchInterval: 10_000,
  });
  const mutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <main className={s.page}>
      <h1>Уведомления</h1>
      {!userId ? (
        <p>Откройте BetTON через Telegram.</p>
      ) : query.isPending ? (
        <p>Загружаем уведомления…</p>
      ) : query.isError ? (
        <>
          <p role="alert">{errorDetail(query.error)}</p>
          <Button onClick={() => void query.refetch()}>Повторить</Button>
        </>
      ) : !query.data?.length ? (
        <p>
          Новых уведомлений пока нет. Здесь появятся приглашения и решения по
          вашим пари.
        </p>
      ) : (
        query.data.map((n) => (
          <button
            className={s.notice}
            key={n.id}
            onClick={() => {
              mutation.mutate(n.id);
              if (n.market_id) onOpen(n.market_id);
            }}
          >
            {n.read ? n.text : <strong>{n.text}</strong>}
            <br />
            <small>{displayTime(n.created_at)}</small>
          </button>
        ))
      )}
      <BottomNavigation active="notifications" onChange={onNavChange} />
    </main>
  );
}

export function GuarantorAlerts({
  userId,
  onOpen,
}: {
  userId?: number;
  onOpen: (id: number) => void;
}) {
  const qc = useQueryClient();
  const notices = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => apiRequest<Notice[]>("/notifications").then((r) => r.data),
    enabled: !!userId,
    refetchInterval: 10_000,
  });
  const mark = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  useEffect(() => {
    if (!userId) return;
    const beat = () => {
      if (document.visibilityState === "visible")
        void apiRequest("/guarantors/me/heartbeat", { method: "POST" }).catch(
          () => undefined,
        );
    };
    beat();
    const timer = window.setInterval(beat, 30_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [userId]);
  const newest = notices.data?.[0];
  const item = newest && !newest.read && newest.market_id ? newest : null;
  if (!userId || !item) return null;
  return (
    <aside className={s.alert} aria-live="polite">
      <p>{item.text}</p>
      <div className={s.actions}>
        <Button
          disabled={mark.isPending}
          onClick={() => {
            mark.mutate(item.id);
            onOpen(item.market_id!);
          }}
        >
          Открыть пари
        </Button>
        <Button
          variant="secondary"
          disabled={mark.isPending}
          onClick={() => mark.mutate(item.id)}
        >
          Скрыть
        </Button>
      </div>
    </aside>
  );
}
