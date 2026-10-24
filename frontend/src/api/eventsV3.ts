import { newRequestId } from "./idempotency";
import { apiRequest } from "./client";
import type { MarketOut } from "./types";

export type EventType = "public" | "private" | "guarantor";
export type EventCategory =
  | "sport"
  | "esports"
  | "politics"
  | "crypto"
  | "unique";
export type EventSource = { name: string; url: string };
export type CreateEventBody = {
  event_type: EventType;
  question: string;
  outcomes: [string, string];
  category?: EventCategory;
  description: string;
  rules: string;
  criteria?: [string, string];
  resolution_method: string;
  unverifiable?: string;
  primary_source?: EventSource | null;
  backup_source?: EventSource | null;
  close_at: string;
  ends_at: string;
  guarantor_id?: number | null;
};

export type EventDraft = {
  eventType: EventType | null;
  question: string;
  outcomeA: string;
  outcomeB: string;
  category: EventCategory;
  description: string;
  rules: string;
  criterionA: string;
  criterionB: string;
  method: string;
  unverifiable: string;
  sourceName: string;
  sourceUrl: string;
  backupName: string;
  backupUrl: string;
  proof: string;
  closeAt: string;
  endsAt: string;
  guarantorId: number | null;
};

export type CreationStep =
  | "type"
  | "question"
  | "conditions"
  | "review"
  | "guarantor";
export type DraftErrors = Partial<Record<keyof EventDraft, string>>;
export const EMPTY_EVENT_DRAFT: EventDraft = {
  eventType: null,
  question: "",
  outcomeA: "",
  outcomeB: "",
  category: "unique",
  description: "",
  rules: "",
  criterionA: "",
  criterionB: "",
  method: "",
  unverifiable: "",
  sourceName: "",
  sourceUrl: "",
  backupName: "",
  backupUrl: "",
  proof: "",
  closeAt: "",
  endsAt: "",
  guarantorId: null,
};

export function isHttpSource(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateEventStep(
  draft: EventDraft,
  step: CreationStep,
  now = Date.now(),
): DraftErrors {
  const errors: DraftErrors = {};
  if (step === "type") {
    if (!draft.eventType) errors.eventType = "Выберите тип события";
    return errors;
  }
  if (step === "question") {
    const length = draft.question.trim().length;
    if (length < 8 || length > 512) errors.question = "От 8 до 512 символов";
    if (!draft.outcomeA.trim()) errors.outcomeA = "Укажите первый исход";
    if (!draft.outcomeB.trim()) errors.outcomeB = "Укажите второй исход";
    if (
      draft.outcomeA.trim() &&
      draft.outcomeA.trim().toLocaleLowerCase() ===
        draft.outcomeB.trim().toLocaleLowerCase()
    )
      errors.outcomeB = "Исходы должны различаться";
    if (draft.outcomeA.length > 128) errors.outcomeA = "Не более 128 символов";
    if (draft.outcomeB.length > 128) errors.outcomeB = "Не более 128 символов";
    if (draft.description.length > 4000)
      errors.description = "Не более 4000 символов";
    return errors;
  }
  if (step === "guarantor") {
    if (!draft.guarantorId) errors.guarantorId = "Выберите гаранта";
    return errors;
  }
  if (!draft.rules.trim()) errors.rules = "Опишите правила события";
  if (!draft.method.trim())
    errors.method = "Укажите, как будет определён результат";
  for (const key of [
    "rules",
    "method",
    "criterionA",
    "criterionB",
    "unverifiable",
    "proof",
  ] as const) {
    if (draft[key].length > 4000) errors[key] = "Не более 4000 символов";
  }
  if (
    draft.eventType !== "public" &&
    [
      draft.description.trim(),
      draft.proof.trim() ? "Материалы для проверки: " + draft.proof.trim() : "",
    ]
      .filter(Boolean)
      .join("\n\n").length > 4000
  )
    errors.proof =
      "Описание и материалы вместе должны содержать не более 4000 символов";
  const close = Date.parse(draft.closeAt + "Z"),
    end = Date.parse(draft.endsAt + "Z");
  if (!draft.closeAt || !Number.isFinite(close))
    errors.closeAt = "Укажите дату и время окончания приёма ставок";
  else if (close <= now) errors.closeAt = "Выберите время в будущем";
  if (!draft.endsAt || !Number.isFinite(end))
    errors.endsAt = "Укажите предполагаемое окончание события";
  else if (Number.isFinite(close) && end < close)
    errors.endsAt =
      "Окончание события не может быть раньше окончания приёма ставок";
  if (draft.eventType === "public") {
    if (!draft.criterionA.trim())
      errors.criterionA = "Укажите критерий первого исхода";
    if (!draft.criterionB.trim())
      errors.criterionB = "Укажите критерий второго исхода";
    if (!draft.unverifiable.trim())
      errors.unverifiable =
        "Укажите порядок действий, если результат нельзя определить";
    if (!draft.sourceName.trim())
      errors.sourceName = "Укажите название основного источника";
    else if (draft.sourceName.trim().length > 200)
      errors.sourceName = "Не более 200 символов";
    if (!draft.sourceUrl.trim())
      errors.sourceUrl = "Укажите ссылку на основной источник";
    else if (!isHttpSource(draft.sourceUrl))
      errors.sourceUrl = "Введите ссылку, начинающуюся с https:// или http://";
    if (draft.backupName.trim() || draft.backupUrl.trim()) {
      if (!draft.backupName.trim())
        errors.backupName = "Укажите название резервного источника";
      else if (draft.backupName.trim().length > 200)
        errors.backupName = "Не более 200 символов";
      if (!isHttpSource(draft.backupUrl))
        errors.backupUrl = "Укажите корректную ссылку резервного источника";
    }
  }
  return errors;
}

export function buildEventBody(draft: EventDraft): CreateEventBody {
  if (!draft.eventType) throw new Error("Выберите тип события");
  return {
    event_type: draft.eventType,
    question: draft.question.trim(),
    outcomes: [draft.outcomeA.trim(), draft.outcomeB.trim()],
    description: [
      draft.description.trim(),
      draft.eventType !== "public" && draft.proof.trim()
        ? "Материалы для проверки: " + draft.proof.trim()
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    rules: draft.rules.trim(),
    resolution_method: draft.method.trim(),
    close_at: new Date(draft.closeAt + "Z").toISOString(),
    ends_at: new Date(draft.endsAt + "Z").toISOString(),
    ...(draft.eventType === "public"
      ? {
          category: draft.category,
          criteria: [draft.criterionA.trim(), draft.criterionB.trim()] as [
            string,
            string,
          ],
          unverifiable: draft.unverifiable.trim(),
          primary_source: {
            name: draft.sourceName.trim(),
            url: draft.sourceUrl.trim(),
          },
          backup_source: draft.backupUrl.trim()
            ? { name: draft.backupName.trim(), url: draft.backupUrl.trim() }
            : null,
        }
      : {}),
    ...(draft.eventType === "guarantor"
      ? { guarantor_id: draft.guarantorId }
      : {}),
  };
}

export async function createEvent(body: CreateEventBody, requestId = newRequestId()): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>("/ux-v3/events", {
    method: "POST",
    jsonBody: { ...body, request_id: requestId },
  });
  return data;
}
