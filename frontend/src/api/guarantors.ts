import { apiRequest } from "./client";
import { shareTokenFor } from "./share";
export type Guarantor = {
  user_id: number;
  name: string;
  bio: string;
  topics: string;
  status: string;
  available: boolean;
  available_until: string | null;
  completed: number;
  rating: number | null;
  review_count: number;
  reviews: { rating: number; text: string }[];
};
export type GuarantorCase = {
  market_id: number;
  question: string;
  state: string;
  revision: number;
  creator_id: number;
  guarantor_id: number;
  guarantor_name: string;
  creator_confirmed: number;
  criteria: string;
  source: string;
  description: string;
  outcomes: string[];
  close_at: string;
  result_due_at: string;
  deadline: string | null;
  extension_by: number | null;
  proposed_outcome: number | null;
  decision_reason: string | null;
  consent: boolean;
  participant: boolean;
  messages: {
    id: number;
    user_id: number;
    kind: string;
    text: string;
    revision: number;
    created_at: string;
  }[];
};
export type CaseSummary = Pick<
  GuarantorCase,
  | "market_id"
  | "question"
  | "state"
  | "deadline"
  | "guarantor_id"
  | "creator_id"
>;
export type Notice = {
  id: number;
  market_id: number | null;
  text: string;
  read: boolean;
  created_at: string;
};
export const guarantors = () =>
  apiRequest<Guarantor[]>("/guarantors").then((r) => r.data);
export const getCase = (id: number) =>
  apiRequest<GuarantorCase | null>(`/markets/${id}/guarantor`, {
    shareToken: shareTokenFor(id),
  }).then((r) => r.data);
export const caseAction = (id: number, body: Record<string, unknown>) =>
  apiRequest<GuarantorCase>(`/markets/${id}/guarantor`, {
    method: "POST",
    jsonBody: body,
    shareToken: shareTokenFor(id),
  }).then((r) => r.data);
export const caseLabels: Record<string, string> = {
  invited: "Ждём отклика гаранта",
  review: "Согласование условий",
  needs_guarantor: "Выберите гаранта заново",
  active: "Гарант принял пари",
  proposed: "Результат на проверке",
  disputed: "Рассматривает администратор",
  settled: "Пари рассчитано",
  cancelled: "Пари отменено",
};
export const displayTime = (value: string) =>
  new Date(
    /Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + "Z",
  ).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

export function remainingSeconds(value: string, now: number): number {
  const deadline = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + "Z").getTime();
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function deadlineLabel(value: string, now: number): string {
  const left = remainingSeconds(value, now);
  return left ? `Осталось ${Math.floor(left / 60)} мин ${left % 60} с` : "Время истекло — обновляем статус";
}
