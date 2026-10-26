import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomNavigation } from "../components/BottomNavigation/BottomNavigation";
import { NotificationBadgeContext } from "../components/BottomNavigation/NotificationBadgeContext";
import { NotificationsScreen } from "./NotificationsScreen";
import { PortfolioScreen } from "./PortfolioScreen";

describe("account UX boundaries", () => {
  it("shows the three agreed bet sections with actual empty data, not example holdings", () => {
    const html = renderToStaticMarkup(
      <PortfolioScreen
        positions={[]}
        orders={[]}
        history={[]}
        settlements={[]}
      />,
    );
    expect(html).toContain("Активные");
    expect(html).toContain("Мои предложения");
    expect(html).toContain("Завершённые");
    expect(html).not.toContain("BTC выше");
    expect(html).toContain("Портфель");
  });
  it("displays a navigation unread indicator only when a real count is supplied", () => {
    const empty = renderToStaticMarkup(<BottomNavigation active="markets" />);
    expect(empty).not.toContain("data-unread-count");
    const unread = renderToStaticMarkup(
      <NotificationBadgeContext.Provider value={3}>
        <BottomNavigation active="profile" />
      </NotificationBadgeContext.Provider>,
    );
    expect(unread).toContain('data-unread-count="3"');
    expect(unread).toContain("Уведомления · 3");
  });
  it("does not present an API failure as an empty notification inbox", () => {
    const html = renderToStaticMarkup(
      <NotificationsScreen items={[]} listState="error" />,
    );
    expect(html).not.toContain("Пока тихо");
    expect(html).not.toContain("Предложение частично");
  });
  it("does not invent a related-object action for a plain system notice", () => {
    const html = renderToStaticMarkup(
      <NotificationsScreen
        items={[
          {
            id: "notice",
            title: "Системное уведомление",
            metadata: "23 октября",
          },
        ]}
        initialSelectedId="notice"
      />,
    );
    expect(html).toContain("Системное уведомление");
    expect(html).not.toContain("Связанный объект");
    expect(html).not.toContain("Открыть событие");
  });
});
