import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEventBody,
  buildVisualV1EventBody,
  validateVisualV1EventStep,
  createEvent,
  EMPTY_EVENT_DRAFT,
  isHttpSource,
  validateEventStep,
  type EventDraft,
} from "./eventsV3";

const now = Date.parse("2030-01-01T00:00:00Z");
const validPrivate = (): EventDraft => ({
  ...EMPTY_EVENT_DRAFT,
  eventType: "private",
  question: "Кто победит в матче?",
  outcomeA: "Алексей",
  outcomeB: "Мария",
  rules: "Один завершённый матч.",
  method: "По итоговому счёту.",
  closeAt: "2030-01-02T18:00",
  endsAt: "2030-01-02T20:00",
});
const validPublic = (): EventDraft => ({
  ...validPrivate(),
  eventType: "public",
  category: "sport",
  criterionA: "Победит Алексей",
  criterionB: "Победит Мария",
  unverifiable: "Отмена события",
  sourceName: "Официальный протокол",
  sourceUrl: "https://example.org/result",
});
afterEach(() => vi.unstubAllGlobals());

describe("UX v3 event form validation", () => {
  it("requires a type and validates question and both distinct outcomes at the relevant step", () => {
    expect(
      validateEventStep(EMPTY_EVENT_DRAFT, "type", now).eventType,
    ).toBeTruthy();
    const bad = {
      ...validPrivate(),
      question: "short",
      outcomeA: "Мария",
      outcomeB: " мария ",
    };
    expect(validateEventStep(bad, "question", now)).toMatchObject({
      question: expect.any(String),
      outcomeB: expect.any(String),
    });
    expect(validateEventStep(validPrivate(), "question", now)).toEqual({});
  });
  it("accepts private events without public category or mandatory source", () => {
    expect(validateEventStep(validPrivate(), "conditions", now)).toEqual({});
    const body = buildEventBody(validPrivate());
    expect(body).not.toHaveProperty("category");
    expect(body).not.toHaveProperty("primary_source");
    expect(body).not.toHaveProperty("guarantor_id");
  });
  it("requires public criteria and main source, but does not require a reserve source", () => {
    expect(
      validateEventStep(
        { ...validPrivate(), eventType: "public" },
        "conditions",
        now,
      ),
    ).toMatchObject({
      criterionA: expect.any(String),
      criterionB: expect.any(String),
      sourceName: expect.any(String),
      sourceUrl: expect.any(String),
      unverifiable: expect.any(String),
    });
    expect(validateEventStep(validPublic(), "conditions", now)).toEqual({});
    expect(buildEventBody(validPublic()).backup_source).toBeNull();
  });
  it("validates both parts of an optional reserve source only when present", () => {
    expect(
      validateEventStep(
        { ...validPublic(), backupName: "Резерв" },
        "conditions",
        now,
      ).backupUrl,
    ).toBeUndefined();
    expect(
      validateEventStep(
        { ...validPublic(), backupUrl: "https://example.org/backup" },
        "conditions",
        now,
      ).backupName,
    ).toBeTruthy();
    expect(
      validateEventStep(
        {
          ...validPublic(),
          backupName: "Резерв",
          backupUrl: "https://example.org/backup",
        },
        "conditions",
        now,
      ),
    ).toEqual({});
    expect(isHttpSource("javascript:alert(1)")).toBe(false);
    expect(isHttpSource("not a URL")).toBe(false);
  });
  it("checks both dates before review and serializes UTC without local-time reinterpretation", () => {
    expect(
      validateEventStep(
        { ...validPrivate(), closeAt: "2020-01-01T12:00" },
        "conditions",
        now,
      ).closeAt,
    ).toBeTruthy();
    expect(
      validateEventStep(
        { ...validPrivate(), endsAt: "2030-01-02T17:00" },
        "conditions",
        now,
      ).endsAt,
    ).toBeTruthy();
    const body = buildEventBody(validPrivate());
    expect(body.close_at).toBe("2030-01-02T18:00:00.000Z");
    expect(body.ends_at).toBe("2030-01-02T20:00:00.000Z");
  });
  it("requires selected guarantor and never sends a manually configurable decision deadline", () => {
    const draft = { ...validPrivate(), eventType: "guarantor" as const };
    expect(validateEventStep(draft, "guarantor", now).guarantorId).toBeTruthy();
    const body = buildEventBody({ ...draft, guarantorId: 42 });
    expect(body.guarantor_id).toBe(42);
    expect(body).not.toHaveProperty("result_due_at");
    expect(body).not.toHaveProperty("deadline");
  });
  it("does not include hidden private proof in public description and bounds combined private context", () => {
    expect(
      buildEventBody({ ...validPublic(), proof: "old private proof" })
        .description,
    ).toBe("");
    expect(
      validateEventStep(
        {
          ...validPrivate(),
          description: "x".repeat(3000),
          proof: "y".repeat(2000),
        },
        "conditions",
        now,
      ).proof,
    ).toBeTruthy();
  });
});

it("creates through the real UX v3 endpoint and propagates backend failure", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 12, status: "pending" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Основной источник недоступен" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );
  vi.stubGlobal("fetch", fetch);
  expect((await createEvent(buildEventBody(validPublic()))).id).toBe(12);
  expect(fetch.mock.calls[0][0]).toContain("/ux-v3/events");
  expect(fetch.mock.calls[0][1].method).toBe("POST");
  await expect(createEvent(buildEventBody(validPublic()))).rejects.toThrow(
    "Основной источник недоступен",
  );
});

describe("approved start/cutoff protocol", () => {
  it("sends no end time for private events and retains the legacy builder", () => {
    const draft = { ...validPrivate(), criterionA: "Победил Алексей", criterionB: "Победила Мария", endsAt: "" };
    expect(validateVisualV1EventStep(draft, "conditions", now)).toEqual({});
    expect(buildVisualV1EventBody(draft)).toMatchObject({ timing_version: "start-v1", close_at: "2030-01-02T18:00:00.000Z", ends_at: null });
    expect(buildEventBody(validPrivate()).ends_at).toBe("2030-01-02T20:00:00.000Z");
    expect(validateEventStep(draft, "conditions", now).endsAt).toBeTruthy();
  });
  it("keeps estimated end required only for guarantor events", () => {
    const draft = { ...validPublic(), eventType: "guarantor" as const, guarantorId: 42 };
    expect(validateVisualV1EventStep({ ...draft, endsAt: "" }, "conditions", now).endsAt).toBeTruthy();
    expect(validateVisualV1EventStep({ ...draft, endsAt: "2030-01-02T17:00" }, "conditions", now).endsAt).toBeTruthy();
    expect(buildVisualV1EventBody(draft)).toMatchObject({ timing_version: "start-v1", ends_at: "2030-01-02T20:00:00.000Z", guarantor_id: 42 });
    expect(buildVisualV1EventBody({ ...validPublic(), endsAt: "" }).ends_at).toBeNull();
  });
});
