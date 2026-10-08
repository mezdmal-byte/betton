import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ShieldCheck } from "lucide-react";
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
import { GuarantorCard, GuarantorDetails } from "./GuarantorReputation";
import s from "./Guarantors.module.css";
import { useClock } from "./useClock";

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
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const list = useQuery({
    queryKey: ["guarantors"],
    queryFn: guarantors,
    enabled: !!userId,
    refetchInterval: 15_000,
  });
  const mine = useQuery({
    queryKey: ["guarantor-profile", userId],
    queryFn: () => apiRequest<Guarantor | null>("/guarantors/me").then((r) => r.data),
    enabled: !!userId,
  });
  const cases = useQuery({
    queryKey: ["guarantor-cases", userId],
    queryFn: () => apiRequest<CaseSummary[]>("/guarantor-cases").then((r) => r.data),
    enabled: !!userId,
    refetchInterval: 10_000,
  });
  const applications = useQuery({
    queryKey: ["guarantor-applications"],
    queryFn: () => apiRequest<Guarantor[]>("/guarantors/applications").then((r) => r.data),
    enabled: !!userId && isAdmin,
  });
  const mutation = useMutation({
    mutationFn: ({ path, body, method = "POST" }: {
      path: string;
      body: object;
      method?: string;
    }) => apiRequest(path, { method, jsonBody: body }),
    onSuccess: () => {
      setEditing(false);
      setAcceptedRules(false);
      void qc.invalidateQueries();
    },
  });
  const submit = (path: string, body: object, method = "POST") =>
    mutation.mutate({ path, body, method });

  const selected = list.data?.find((g) => g.user_id === selectedId)
    ?? applications.data?.find((g) => g.user_id === selectedId)
    ?? (mine.data?.user_id === selectedId ? mine.data : null);

  if (selected) {
    return (
      <div className={s.page}>
        <main className={s.content}>
          <GuarantorDetails guarantor={selected}
            onBack={() => setSelectedId(null)}
            onCreate={() => onNavChange("create")} />
        </main>
        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    );
  }

  return (
    <div className={s.page}>
      <main className={s.content}>
        <button type="button" className={s.textBack} onClick={onBack}>← Назад в профиль</button>
        <h1 className={s.pageTitle}>Гаранты</h1>
        <p className={s.pageLead}>
          Независимые участники проверяют результаты частных пари.
          Рейтинг строится по завершённым проверкам и отзывам реальных участников.
        </p>

        {!userId ? (
          <p>Откройте BetTON через Telegram.</p>
        ) : (
          <>
            {[mine, list, cases, applications]
              .filter((query) => query.isError)
              .map((query, index) => (
                <p key={index} role="alert" className={s.error}>
                  {errorDetail(query.error)}{" "}
                  <button type="button" onClick={() => void query.refetch()}>Повторить</button>
                </p>
              ))}
            {mutation.isError ? <p className={s.error} role="alert">{errorDetail(mutation.error)}</p> : null}

            <section className={s.panel}>
              <h2>Мой профиль гаранта</h2>
              {mine.isPending ? <p>Загружаем профиль…</p> : mine.data?.status === "approved" ? (
                <>
                  <p>Вы зарегистрированы как гарант. Рейтинг создаётся автоматически после завершённых пари.</p>
                  <button type="button" className={s.directoryCard}
                    onClick={() => setSelectedId(mine.data!.user_id)}>
                    <strong>{mine.data.name}</strong>
                    <small>Завершено {mine.data.completed} · отзывов {mine.data.review_count}
                      {mine.data.is_moderator ? " · Модератор BetTON" : ""}
                    </small>
                    <span className={s.openCard}>Открыть мою карточку →</span>
                  </button>
                  <Button disabled={mutation.isPending}
                    onClick={() => submit("/guarantors/me/availability", {
                      available: !mine.data!.available,
                    })}>
                    {mine.data.available
                      ? "Не принимать новые пари"
                      : "Принимать новые пари · 1 час"}
                  </Button>
                  <small>Чтобы получать приглашения, оставьте приложение открытым. Уже принятые пари останутся за вами.</small>
                  <Button variant="secondary" onClick={() => {
                    setBio(mine.data!.bio);
                    setTopics(mine.data!.topics);
                    setEditing(!editing);
                  }}>Редактировать описание</Button>
                </>
              ) : mine.data?.status === "rejected" ? (
                <p>Работа гарантом приостановлена администрацией BetTON. Для выяснения причин обратитесь к модератору.</p>
              ) : (
                <div className={s.joinPanel}>
                  <h2>Стать гарантом</h2>
                  <p>Каждый пользователь может начать без ручного одобрения.
                    Первое время у вас будет статус «Без оценок».</p>
                  <ul className={s.ruleList}>
                    <li>Принимайте только те пари, исход которых сможете объективно проверить.</li>
                    <li>До согласования условий укажите источники и критерии проверки.</li>
                    <li>Соблюдайте сроки, объясняйте решения и сохраняйте доказательства.</li>
                    <li>Нельзя гарантировать собственное пари. Жалобы рассматривает администрация.</li>
                  </ul>
                  <label className={s.acceptRules}>
                    <input type="checkbox" checked={acceptedRules}
                      onChange={(event) => setAcceptedRules(event.target.checked)} />
                    <span>Я ознакомился с правилами и принимаю обязанности гаранта.</span>
                  </label>
                  <Button disabled={!acceptedRules || mutation.isPending} onClick={() =>
                    submit("/guarantors/me", { bio, topics, accept_rules: true }, "PUT")
                  }>Стать гарантом</Button>
                </div>
              )}
              {editing ? (
                <>
                  <label className={s.field}>
                    О себе (необязательно)
                    <textarea value={bio} maxLength={1000}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Чем интересуетесь и как проверяете исходы событий" />
                  </label>
                  <label className={s.field}>
                    Категории и специализация (необязательно)
                    <input value={topics} maxLength={300}
                      onChange={(event) => setTopics(event.target.value)}
                      placeholder="Спорт, киберспорт, события" />
                  </label>
                  <Button disabled={mutation.isPending} onClick={() =>
                    submit("/guarantors/me", { bio, topics }, "PUT")
                  }>Сохранить описание</Button>
                </>
              ) : null}
            </section>

            <section className={s.panel}>
              <h2>{isAdmin ? "Пари и споры" : "Мои пари с гарантом"}</h2>
              {cases.isPending ? <p>Загружаем пари…</p> : !cases.data?.length ? (
                <p className={s.muted}>Запросов пока нет.</p>
              ) : cases.data.map((c) => (
                <button type="button" className={s.notice} key={c.market_id}
                  onClick={() => onOpen(c.market_id)}>
                  <strong>{c.question}</strong>
                  <br />
                  <small>{caseLabels[c.state] ?? c.state}
                    {c.deadline ? ` · до ${displayTime(c.deadline)}` : ""}
                    {c.deadline && ["invited", "review"].includes(c.state)
                      ? ` · ${deadlineLabel(c.deadline, clock)}` : ""}
                  </small>
                </button>
              ))}
            </section>

            <section className={s.panel}>
              <h2>Каталог гарантов</h2>
              <p className={s.muted}>Сначала ознакомьтесь с рейтингом, статистикой и отзывами.</p>
              {list.isPending ? <p>Загружаем список…</p> : !list.data?.length ? (
                <p className={s.muted}>Гарантов пока нет. Станьте первым.</p>
              ) : (
                <div className={s.cardList}>
                  {[...list.data].sort((a, b) =>
                    Number(b.available) - Number(a.available)
                    || Number(b.high_reputation) - Number(a.high_reputation)
                    || b.completed - a.completed
                  ).map((g) => (
                    <GuarantorCard key={g.user_id} guarantor={g}
                      onOpen={() => setSelectedId(g.user_id)} />
                  ))}
                </div>
              )}
            </section>

            {isAdmin ? (
              <section className={s.panel}>
                <h2><ShieldCheck size={19} /> Контроль гарантов</h2>
                <p className={s.muted}>Регистрация открыта всем. Вы можете временно отстранить гаранта при нарушении правил.</p>
                {applications.isPending ? <p>Загружаем пользователей…</p> : applications.data?.map((g) => (
                  <div key={g.user_id} className={s.message}>
                    <strong>{g.name}</strong>
                    <p><small>{g.status === "approved" ? "Активен" :
                      g.status === "pending" ? "Старая заявка — ожидает активации" : "Приостановлен"}
                      {" · "}пари {g.completed} · споров {g.disputes}</small></p>
                    <div className={s.actions}>
                      <Button variant="secondary" disabled={mutation.isPending}
                        onClick={() => setSelectedId(g.user_id)}>Карточка</Button>
                      {g.status === "approved" ? (
                        <Button variant="secondary" disabled={mutation.isPending}
                          onClick={() => submit(`/guarantors/${g.user_id}/approval`, { approved: false })}>
                          Приостановить
                        </Button>
                      ) : g.status === "rejected" ? (
                        <Button variant="secondary" disabled={mutation.isPending}
                          onClick={() => submit(`/guarantors/${g.user_id}/approval`, { approved: true })}>
                          Восстановить
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        )}
      </main>
      <BottomNavigation active="profile" onChange={onNavChange} />
    </div>
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
    mutationFn: (id: number) => apiRequest(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const unread = query.data?.filter((n) => !n.read).length ?? 0;
  return (
    <div className={s.page}>
      <main className={s.content}>
        <div className={s.notificationHeader}>
          <h1>Уведомления</h1>
          {unread > 0 ? <span className={s.notificationCount}>{unread} новых</span> : null}
        </div>
        {!userId ? (
          <p className={s.pageLead}>Откройте BetTON через Telegram.</p>
        ) : query.isPending ? (
          <p className={s.pageLead}>Загружаем уведомления…</p>
        ) : query.isError ? (
          <>
            <p role="alert" className={s.error}>{errorDetail(query.error)}</p>
            <Button onClick={() => void query.refetch()}>Повторить</Button>
          </>
        ) : !query.data?.length ? (
          <div className={s.notificationEmpty}>
            <Bell size={42} strokeWidth={1.4} aria-hidden="true" />
            <h2>Пока тихо</h2>
            <p>Здесь появятся приглашения от участников, решения гарантов и сообщения по вашим пари.</p>
          </div>
        ) : (
          <div className={s.noticeList}>
            {query.data.map((n) => (
              <button key={n.id} type="button"
                className={[s.notificationItem, n.read ? s.notificationItemRead : ""].join(" ")}
                onClick={() => {
                  if (!n.read) mutation.mutate(n.id);
                  if (n.market_id != null) onOpen(n.market_id);
                }}>
                <span className={[s.unreadDot, n.read ? s.readDot : ""].join(" ")} aria-hidden="true" />
                <span>
                  <strong>{n.text}</strong>
                  <small>{displayTime(n.created_at)}
                    {n.market_id != null ? " · Открыть пари ›" : ""}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNavigation active="notifications" onChange={onNavChange} />
    </div>
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
  const item = notices.data?.find((notice) => !notice.read && notice.market_id != null) ?? null;
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
