import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Guarantor } from "../api/guarantors";
import {
  validateEventStep,
  type CreationStep,
  type DraftErrors,
  type EventDraft,
  type EventType,
} from "../api/eventsV3";
import { GuarantorDetails } from "../app/GuarantorReputation";
import { Button } from "../components/Button/Button";
import { TextField } from "../components/TextField/TextField";
import { syncTelegramBackButton } from "../telegram/webapp";
import { useI18n } from "../i18n";
import { eventCopy } from "../api/eventsV3Copy";
import { EventTypeInfo } from "./EventTypeInfo";
import styles from "./CreateEventWizard.module.css";
import { creationDraftKey, readCreationDraft, saveCreationDraft } from './creationDrafts';
import { useVisualV1 } from '../visualV1/VisualV1Context';
import { CreateV1Wizard, type CreateV1WizardProps } from '../visualV1/CreateV1Wizard';
export { creationDraftKey } from './creationDrafts';

const TYPES: { id: EventType; title: string; description: string }[] = [
  {
    id: "public",
    title: "Публичное событие",
    description: "Доступно всем после проверки модерацией",
  },
  {
    id: "private",
    title: "Частное по ссылке",
    description: "Результат определяет создатель события",
  },
  {
    id: "guarantor",
    title: "Частное с гарантом",
    description: "Выбранный гарант принимает окончательное решение",
  },
];
const NAMES = {
  public: "Публичное событие",
  private: "Частное без гаранта",
  guarantor: "Частное с гарантом",
};
const TITLES: Record<CreationStep, string> = {
  type: "Создать событие",
  question: "Вопрос и исходы",
  conditions: "Условия и сроки",
  review: "Проверка события",
  guarantor: "Выберите гаранта",
};
const STEPS: CreationStep[] = [
  "type",
  "question",
  "conditions",
  "review",
  "guarantor",
];
export const CREATE_EVENT_FIGMA_FRAMES = {
  type: "328:19",
  public: { question: "375:17002", conditions: "375:17030", review: "332:344" },
  private: {
    question: "375:17068",
    conditions: "375:17096",
    review: "332:367",
  },
  guarantor: { question: "328:47", conditions: "328:76", review: "328:106" },
  directory: "328:133",
} as const;
type TextKey = Exclude<
  keyof EventDraft,
  "eventType" | "category" | "guarantorId"
>;
export function CreateEventWizard(props: CreateV1WizardProps) {
  const visualV1 = useVisualV1();
  return visualV1 ? <CreateV1Wizard {...props} /> : <LegacyCreateEventWizard {...props} />;
}
function LegacyCreateEventWizard({
  userId,
  onBack,
  onSubmit,
  submitting = false,
  disabled = false,
  errorMessage,
  guarantors = [],
  guarantorsLoading = false,
  guarantorsError = false,
  onRetryGuarantors,
}: {
  userId?: number;
  onBack: () => void;
  onSubmit: (draft: EventDraft) => void;
  submitting?: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
  guarantors?: Guarantor[];
  guarantorsLoading?: boolean;
  guarantorsError?: boolean;
  onRetryGuarantors?: () => void;
}) {
  const { locale } = useI18n();
  const c = (source: string | undefined) => eventCopy(locale, source);
  const key = creationDraftKey(userId);
  const [initial] = useState(() => readCreationDraft(userId));
  const [draft, setDraft] = useState(initial.draft);
  const [step, setStep] = useState<CreationStep>(initial.step);
  const [info, setInfo] = useState<EventType | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const body = useRef<HTMLElement>(null);
  const isPublic = draft.eventType === "public";
  const selected = guarantors.find((g) => g.user_id === draft.guarantorId);
  const profile = guarantors.find((g) => g.user_id === profileId);

  useEffect(() => {
    try {
      saveCreationDraft(userId, draft, step);
    } catch {
      /* Draft persistence is optional when browser storage is blocked. */
    }
  }, [draft, step, key]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [step, info, profileId]);

  const back = () => {
    if (submitting) return;
    if (info) {
      setInfo(null);
      return;
    }
    if (profileId) {
      setProfileId(null);
      return;
    }
    setErrors({});
    if (step === "type") onBack();
    else setStep(STEPS[STEPS.indexOf(step) - 1]!);
  };
  useEffect(
    () => syncTelegramBackButton(true, back),
    [step, info, profileId, submitting, onBack],
  );

  const change = <K extends keyof EventDraft>(
    name: K,
    value: EventDraft[K],
  ) => {
    if (name === 'eventType' && value !== draft.eventType) {
      const restored = readCreationDraft(userId, value as EventType);
      setDraft(restored.draft);
      setErrors({});
      return;
    }
    const next = { ...draft, [name]: value };
    setDraft(next);
    if (errors[name])
      setErrors((old) => ({
        ...old,
        [name]: validateEventStep(next, step)[name],
      }));
  };
  const check = (which: CreationStep) => {
    const next = validateEventStep(draft, which);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        body.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return false;
    }
    return true;
  };
  const submit = () => {
    for (const which of [
      "type",
      "question",
      "conditions",
      ...(draft.eventType === "guarantor" ? ["guarantor"] : []),
    ] as CreationStep[]) {
      if (!check(which)) {
        setStep(which);
        return;
      }
    }
    if (draft.eventType === "guarantor" && (!selected || !selected.available)) {
      setErrors({ guarantorId: "Гарант сейчас недоступен. Выберите другого" });
      return;
    }
    if (!submitting && !disabled) onSubmit(draft);
  };
  const next = () => {
    if (step === "review") {
      if (draft.eventType === "guarantor") setStep("guarantor");
      else submit();
      return;
    }
    if (step === "guarantor") {
      submit();
      return;
    }
    if (check(step)) setStep(STEPS[STEPS.indexOf(step) + 1]!);
  };
  const field = (
    name: TextKey,
    label: string,
    multiline = false,
    type = "text",
    optional = false,
  ) => (
    <div className={styles.field} key={name}>
      <TextField
        id={`event-${name}`}
        label={c(label)}
        value={draft[name]}
        onChange={(value) => change(name, value)}
        multiline={multiline}
        type={type}
        required={!optional}
        maxLength={
          type === "datetime-local"
            ? undefined
            : name === "question"
              ? 512
              : name.startsWith("outcome")
                ? 128
                : 4000
        }
        disabled={submitting}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `event-${name}-error` : undefined}
        onBlur={() =>
          setErrors((old) => ({
            ...old,
            [name]: validateEventStep(draft, step)[name],
          }))
        }
      />
      {errors[name] ? (
        <p className={styles.error} id={`event-${name}-error`} role="alert">
          {c(errors[name])}
        </p>
      ) : null}
    </div>
  );
  const review = (title: string, target: CreationStep, children: ReactNode) => (
    <section className={styles.reviewSection}>
      <button
        type="button"
        className={styles.textLink}
        onClick={() => {
          setErrors({});
          setStep(target);
        }}
        disabled={submitting}
      >
        {c(title)} · {c("Изменить")} →
      </button>
      {children}
    </section>
  );

  if (info) return <EventTypeInfo kind={info} onClose={() => setInfo(null)} />;
  const progress =
    step === "type"
      ? "1 из 3 · Тип события"
      : step === "question"
        ? "2 из 3"
        : step === "conditions"
          ? "3 из 3"
          : "";
  const cta =
    step === "type"
      ? "Продолжить"
      : step === "question"
        ? "Далее"
        : step === "conditions"
          ? "Проверить событие"
          : step === "guarantor"
            ? "Пригласить гаранта"
            : draft.eventType === "public"
              ? "Отправить на модерацию"
              : draft.eventType === "private"
                ? "Создать событие по ссылке"
                : "Выбрать гаранта";

  return (
    <div
      className={styles.screen}
      data-creation-step={step}
      data-figma-frame={
        step === "type"
          ? CREATE_EVENT_FIGMA_FRAMES.type
          : step === "guarantor"
            ? CREATE_EVENT_FIGMA_FRAMES.directory
            : CREATE_EVENT_FIGMA_FRAMES[draft.eventType ?? "public"][step]
      }
    >
      <header className={styles.header}>
        <div className={styles.topbar}>
          <button type="button" onClick={back} disabled={submitting}>
            {step === "type" ? c("← События") : c("← Назад")}
          </button>
          <button type="button" onClick={onBack} disabled={submitting}>
            {c('Сохранить и выйти')}
          </button>
        </div>
        <h1>{profile ? c("Профиль гаранта") : c(TITLES[step])}</h1>
        <p>
          {profile
            ? c("Рейтинг, отзывы и история проверок")
            : step === "type"
              ? c(progress)
              : [c(progress), draft.eventType && c(NAMES[draft.eventType])]
                  .filter(Boolean)
                  .join(" · ")}
        </p>
      </header>
      <main className={styles.body} ref={body}>
        {!userId ? (
          <p className={styles.notice}>
            {c(
              "Чтобы создать событие, откройте BetTON через Telegram и войдите в профиль.",
            )}
          </p>
        ) : null}
        {step === "type" ? (
          <div
            className={styles.types}
            role="radiogroup"
            aria-label={c("Тип события")}
          >
            {TYPES.map((type) => (
              <article
                key={type.id}
                className={
                  draft.eventType === type.id
                    ? styles.selectedType
                    : styles.typeCard
                }
              >
                <button
                  className={styles.typePick}
                  type="button"
                  role="radio"
                  aria-checked={draft.eventType === type.id}
                  onClick={() => change("eventType", type.id)}
                >
                  <strong>{c(type.title)}</strong>
                  <span>{c(type.description)}</span>
                </button>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => setInfo(type.id)}
                >
                  {c("Подробнее →")}
                </button>
              </article>
            ))}
            {errors.eventType ? (
              <p className={styles.error} role="alert">
                {c(errors.eventType)}
              </p>
            ) : null}
          </div>
        ) : null}
        {step === "question" ? (
          <>
            {field("question", c("Название события"), true)}
            {field("outcomeA", c("Первый исход"))}
            {field("outcomeB", c("Второй исход"))}
            {isPublic ? (
              <label className={styles.selectLabel}>
                {c("Категория")}
                <select
                  value={draft.category}
                  onChange={(e) =>
                    change("category", e.target.value as EventDraft["category"])
                  }
                  disabled={submitting}
                >
                  <option value="sport">{c("Спорт")}</option>
                  <option value="esports">{c("Киберспорт")}</option>
                  <option value="politics">{c("Политика")}</option>
                  <option value="crypto">{c("Крипто")}</option>
                  <option value="unique">{c("Другое")}</option>
                </select>
              </label>
            ) : null}
            {field(
              "description",
              c("Описание · необязательно"),
              true,
              "text",
              true,
            )}
          </>
        ) : null}
        {step === "conditions" ? (
          <>
            {isPublic ? <h2>{c("Правила и критерии")}</h2> : null}
            {field(
              "rules",
              isPublic ? c("Подробные условия") : c("Правила события"),
              true,
            )}
            {isPublic ? (
              <>
                {field("criterionA", c("Когда наступает первый исход"), true)}
                {field("criterionB", c("Когда наступает второй исход"), true)}
              </>
            ) : null}
            {field(
              "method",
              draft.eventType === "private"
                ? c("Как создатель определит победителя")
                : c("Как будет определён результат"),
              true,
            )}
            {isPublic ? (
              <>
                {field(
                  "unverifiable",
                  c("Если результат нельзя определить"),
                  true,
                )}
                <h2>{c("Источники проверки")}</h2>
                {field("sourceName", c("Основной источник · название"))}
                {field(
                  "sourceUrl",
                  c("Основной источник · ссылка"),
                  false,
                  "url",
                )}
                {field(
                  "backupName",
                  c("Резервный источник · название · необязательно"),
                  false,
                  "text",
                  true,
                )}
                {field(
                  "backupUrl",
                  c("Резервный источник · ссылка · необязательно"),
                  false,
                  "url",
                  true,
                )}
                <p className={styles.note}>
                  {c(
                    "Резервный источник используется, если основной недоступен или не даёт нужных сведений по правилам события.",
                  )}
                </p>
              </>
            ) : (
              field(
                "proof",
                c("Материалы для проверки · необязательно"),
                true,
                "text",
                true,
              )
            )}
            <h2>{c("Сроки · UTC")}</h2>
            {field("closeAt", c("Приём ставок до"), false, "datetime-local")}
            {field(
              "endsAt",
              c("Предполагаемое окончание события"),
              false,
              "datetime-local",
            )}
            <p className={styles.note}>
              {draft.eventType === "guarantor"
                ? c(
                    "Гарант принимает решение в течение 24 часов после окончания события.",
                  )
                : draft.eventType === "private"
                  ? c("Результат определяет создатель по условиям события.")
                  : c("Событие появится в ленте после одобрения модерацией.")}
            </p>
          </>
        ) : null}
        {step === "review" ? (
          <>
            {review(
              c("Вопрос и исходы"),
              "question",
              <>
                <p>{draft.question}</p>
                <p>
                  {draft.outcomeA} / {draft.outcomeB}
                </p>
                {draft.description ? <p>{draft.description}</p> : null}
                {isPublic ? (
                  <p>
                    {c("Категория")}:{" "}
                    {
                      {
                        sport: c("Спорт"),
                        esports: c("Киберспорт"),
                        politics: c("Политика"),
                        crypto: c("Крипто"),
                        unique: c("Другое"),
                      }[draft.category]
                    }
                  </p>
                ) : null}
              </>,
            )}
            {review(
              c("Правила и результат"),
              "conditions",
              <>
                <p>{draft.rules}</p>
                {isPublic ? (
                  <>
                    <p>
                      {c("Первый исход")}: {draft.criterionA}
                    </p>
                    <p>
                      {c("Второй исход")}: {draft.criterionB}
                    </p>
                  </>
                ) : null}
                <p>{draft.method}</p>
                {draft.unverifiable && isPublic ? (
                  <p>
                    {c("Если результат нельзя определить")}:{" "}
                    {draft.unverifiable}
                  </p>
                ) : null}
                {draft.proof && !isPublic ? (
                  <p>
                    {c("Материалы")}: {draft.proof}
                  </p>
                ) : null}
              </>,
            )}
            {isPublic
              ? review(
                  c("Источники"),
                  "conditions",
                  <>
                    <p>
                      {draft.sourceName}
                      <br />
                      {draft.sourceUrl}
                    </p>
                    {draft.backupUrl ? (
                      <p>
                        {c("Резервный")}: {draft.backupName}
                        <br />
                        {draft.backupUrl}
                      </p>
                    ) : null}
                  </>,
                )
              : null}
            {review(
              c("Сроки · UTC"),
              "conditions",
              <>
                <p>
                  {c("Приём ставок до")} {draft.closeAt.replace("T", ", ")}.
                </p>
                <p>
                  {c("Окончание события")}: {draft.endsAt.replace("T", ", ")}.
                </p>
              </>,
            )}
            {draft.eventType === "guarantor" ? (
              <section className={styles.reviewSection}>
                <h2>{c("Решение гаранта")}</h2>
                <p>
                  {c(
                    "Гарант будет выбран далее. Срок решения — 24 часа после окончания события. При отсутствии своевременного решения — отмена события и возврат ставок.",
                  )}
                </p>
              </section>
            ) : null}
            <p className={styles.note}>
              {c("После начала приёма ставок изменить условия события нельзя.")}
            </p>
          </>
        ) : null}
        {step === "guarantor" && profile ? (
          <GuarantorDetails
            guarantor={profile}
            onBack={() => setProfileId(null)}
            onChoose={() => {
              change("guarantorId", profile.user_id);
              setProfileId(null);
            }}
          />
        ) : null}
        {step === "guarantor" && !profile ? (
          <>
            <p className={styles.note}>
              {c(
                "Сначала можно посмотреть профиль. Условия и вознаграждение обсуждаются в чате после приглашения.",
              )}
            </p>
            {guarantorsLoading ? (
              <p role="status">{c("Загружаем гарантов…")}</p>
            ) : guarantorsError ? (
              <div className={styles.notice}>
                <p>{c("Не удалось загрузить список гарантов.")}</p>
                <Button variant="secondary" onClick={onRetryGuarantors}>
                  {c("Повторить")}
                </Button>
              </div>
            ) : guarantors.length === 0 ? (
              <p className={styles.notice}>
                {c(
                  "Гарантов пока нет. Черновик сохранён — можно вернуться позже.",
                )}
              </p>
            ) : (
              guarantors.map((g) => (
                <article
                  key={g.user_id}
                  className={
                    draft.guarantorId === g.user_id
                      ? styles.selectedGuarantor
                      : styles.guarantor
                  }
                >
                  <div className={styles.guarantorTop}>
                    <button
                      type="button"
                      className={styles.chooseName}
                      disabled={!g.available}
                      onClick={() => change("guarantorId", g.user_id)}
                      aria-pressed={draft.guarantorId === g.user_id}
                    >
                      <strong>{g.name}</strong>
                      <span
                        className={g.available ? styles.available : styles.note}
                      >
                        {g.available
                          ? c("Принимает события")
                          : c("Сейчас недоступен")}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => setProfileId(g.user_id)}
                    >
                      {c("Профиль →")}
                    </button>
                  </div>
                  <p>{g.topics || c("Специализация не указана")}</p>
                  <p>
                    {g.rating == null
                      ? c("Пока без оценок")
                      : `${g.rating.toFixed(1).replace(".", ",")} ${c("из 5")}`}
                    {" · "}
                    {g.completed} {c("проверок")}
                  </p>
                </article>
              ))
            )}
            {errors.guarantorId ? (
              <p className={styles.error} role="alert">
                {c(errors.guarantorId)}
              </p>
            ) : null}
            {selected ? (
              <p className={styles.note}>
                {c("Выбран гарант")}: {selected.name}.{" "}
                {c("Ставки откроются после согласования условий.")}
              </p>
            ) : null}
          </>
        ) : null}
        {errorMessage ? (
          <div className={styles.requestError} role="alert">
            {errorMessage}
            <p>
              {c(
                "Данные сохранены. Проверьте подключение и повторите отправку.",
              )}
            </p>
          </div>
        ) : null}
      </main>
      {!profile ? (
        <footer className={styles.footer}>
          <Button
            fullWidth
            onClick={next}
            loading={submitting}
            disabled={
              disabled ||
              (step === "type" && !draft.eventType) ||
              (step === "guarantor" &&
                (!selected?.available || guarantorsLoading || guarantorsError))
            }
          >
            {c(cta)}
          </Button>
        </footer>
      ) : null}
    </div>
  );
}
