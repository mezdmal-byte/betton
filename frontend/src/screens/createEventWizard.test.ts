import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_EVENT_DRAFT, type EventDraft } from "../api/eventsV3";
import { CreateEventWizard } from "./CreateEventWizard";
import { CreateMarketResult } from "../app/CreateMarketResult";
import { I18nProvider } from "../i18n";
import { eventCopy } from "../api/eventsV3Copy";

afterEach(() => vi.unstubAllGlobals());
const noop = () => undefined;
function renderConditions(eventType: EventDraft["eventType"]) {
  vi.stubGlobal("sessionStorage", {
    getItem: () =>
      JSON.stringify({
        draft: { ...EMPTY_EVENT_DRAFT, eventType },
        step: "conditions",
      }),
    setItem: noop,
  });
  return renderToStaticMarkup(
    createElement(CreateEventWizard, {
      userId: 12,
      onBack: noop,
      onSubmit: noop,
    }),
  );
}

describe("creation branch field visibility", () => {
  it("renders public rules, two criteria, main source, optional reserve source and two distinct dates", () => {
    const html = renderConditions("public");
    for (const label of [
      "Когда наступает первый исход",
      "Когда наступает второй исход",
      "Основной источник · название",
      "Основной источник · ссылка",
      "Резервный источник · ссылка · необязательно",
      "Приём ставок до",
      "Предполагаемое окончание события",
    ])
      expect(html).toContain(label);
    expect(html).not.toContain("PandaScore");
    expect(html).not.toContain("Загрузить матчи");
  });
  it("keeps private form short, names creator as decision maker and does not require public sources", () => {
    const html = renderConditions("private");
    expect(html).toContain("Как создатель определит победителя");
    expect(html).toContain("Материалы для проверки · необязательно");
    expect(html).not.toContain("Основной источник");
    expect(html).not.toContain("Когда наступает первый исход");
  });
  it("shows the automatic guarantor rule without a user-editable decision-deadline field", () => {
    const html = renderConditions("guarantor");
    expect(html).toContain("24 часов после окончания события");
    expect(html).not.toContain("До какого времени проверить");
    expect(html).not.toContain("event-result_due_at");
  });
});

it("renders creation labels in English and Chinese while preserving user-entered text", () => {
  vi.stubGlobal("sessionStorage", {
    getItem: () =>
      JSON.stringify({
        draft: {
          ...EMPTY_EVENT_DRAFT,
          eventType: "private",
          question: "Название от пользователя",
        },
        step: "question",
      }),
    setItem: noop,
  });
  const element = createElement(CreateEventWizard, {
    userId: 12,
    onBack: noop,
    onSubmit: noop,
  });
  const english = renderToStaticMarkup(
    createElement(I18nProvider, { initialLocale: "en", children: element }),
  );
  expect(english).toContain("Question and outcomes");
  expect(english).toContain("Event title");
  expect(english).toContain("Название от пользователя");
  const chinese = renderToStaticMarkup(
    createElement(I18nProvider, { initialLocale: "zh", children: element }),
  );
  expect(chinese).toContain("问题与结果");
  expect(chinese).toContain("事件名称");
  expect(chinese).toContain("Название от пользователя");
  expect(eventCopy("en", "Неизвестная ошибка сервера")).toBe(
    "Неизвестная ошибка сервера",
  );
});

it("uses server status to show moderation or guarantor waiting rather than publication success", () => {
  const props = {
    market: {
      id: 1,
      question: "Проверяемое событие",
      creator_id: 12,
      description: "",
      category: "unique" as const,
      outcomes: ["Первый", "Второй"],
      status: "pending" as const,
      visibility: "public" as const,
    },
    shareLink: "",
    onOpen: noop,
    onBack: noop,
    onToFeed: noop,
  };
  const pending = renderToStaticMarkup(
    createElement(CreateMarketResult, props),
  );
  expect(pending).toContain("Ожидает модерации");
  expect(pending).toContain("Ставки откроются после одобрения");
  const waiting = renderToStaticMarkup(
    createElement(CreateMarketResult, {
      ...props,
      market: { ...props.market, status: "closed", visibility: "unlisted" },
    }),
  );
  expect(waiting).toContain("Ждём ответа гаранта");
  expect(waiting).toContain("Приём ставок пока закрыт");
});
