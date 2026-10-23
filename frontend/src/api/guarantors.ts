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
  disputes: number;
  missed_deadlines?: number;
  is_moderator: boolean;
  high_reputation: boolean;
  rating: number | null;
  review_count: number;
  rating_distribution: Record<string, number>;
  reviews: { rating: number; text: string }[];
};
export type GuarantorRewardMode = 'fixed' | 'percent' | 'combined' | 'percent_minimum';
export type GuarantorReward = {
  mode: GuarantorRewardMode;
  fixed_ton: string;
  percent: string;
  accepted_by: number[];
  proposed_by?: number;
};
export type GuarantorFunding = {
  secured: boolean;
  outcomes: {
    outcome: number;
    secured: boolean;
    profit_nano: string | null;
    reward_nano: string | null;
    service_fee_nano: string | null;
    viewer_net_profit_nano?: string | null;
    reason?: string | null;
  }[];
  minimum_keep_bps: number;
  preliminary: boolean;
};
export type GuarantorCase = {
  protocol_version?: number;
  ends_at?: string | null;
  reward?: GuarantorReward | null;
  reward_payments_supported?: boolean;
  funding?: GuarantorFunding | null;
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
export function normalizeGuarantorCase(event: GuarantorCase | null): GuarantorCase | null {
  // Existing v3 records use {} for an unnegotiated reward, rather than null.
  if (!event || !event.reward || Object.keys(event.reward).length) return event;
  return { ...event, reward: null };
}
export const getCase = (id: number) =>
  apiRequest<GuarantorCase | null>(`/markets/${id}/guarantor`, {
    shareToken: shareTokenFor(id),
  }).then((r) => normalizeGuarantorCase(r.data));
export const caseAction = (id: number, body: Record<string, unknown>) =>
  apiRequest<GuarantorCase>(`/markets/${id}/guarantor`, {
    method: "POST",
    jsonBody: body,
    shareToken: shareTokenFor(id),
  }).then((r) => r.data);
export const caseLabels: Record<string, string> = {
  invited: "Ждём отклика гаранта",
  review: "Согласование условий",
  collecting: "Ожидаем достаточного объёма заключённых ставок",
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
