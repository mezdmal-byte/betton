import { useContext } from "react";
import { useT, useI18n } from "../../i18n";
import { LayoutList, BriefcaseBusiness, Bell, CircleUserRound } from "lucide-react";
import { cx } from "../../lib/cx";
import { NotificationBadgeContext } from "./NotificationBadgeContext";
import styles from "./BottomNavigation.module.css";

export type NavId =
  | "markets"
  | "portfolio"
  | "create"
  | "notifications"
  | "profile";
export type BottomNavigationProps = {
  active: NavId;
  onChange?: (id: NavId) => void;
};

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  const t = useT();
  const {locale} = useI18n();
  const portfolioLabel = {ru:"Портфель",en:"Portfolio",zh:"投资组合"}[locale];
  const unreadCount = Math.max(0, useContext(NotificationBadgeContext));
  const items = [
    { id: "markets" as const, label: t("nav.feed"), icon: LayoutList },
    { id: "portfolio" as const, label: portfolioLabel, icon: BriefcaseBusiness },
    { id: "create" as const, label: t("nav.create"), icon: null },
    {
      id: "notifications" as const,
      label: t("nav.notifications"),
      icon: Bell,
    },
    { id: "profile" as const, label: t("nav.profile"), icon: CircleUserRound },
  ];
  return (
    <nav className={styles.root} aria-label={t("nav.main")}>
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={cx(
            styles.item,
            active === id && styles.active,
            id === "create" && styles.create,
          )}
          aria-current={active === id ? "page" : undefined}
          aria-label={
            id === "notifications" && unreadCount > 0
              ? `${label} · ${unreadCount}`
              : undefined
          }
          onClick={() => onChange?.(id)}
        >
          {id === "create" ? (
            <span className={styles.createIcon} aria-hidden="true">
              <span className={styles.plusHorizontal} />
              <span className={styles.plusVertical} />
            </span>
          ) : (
            <span className={styles.iconSlot} aria-hidden="true">
              {Icon ? <Icon size={22} strokeWidth={1.8}/> : null}
              {id === "notifications" && unreadCount > 0 ? (
                <span
                  className={styles.unread}
                  data-unread-count={unreadCount}
                />
              ) : null}
            </span>
          )}
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
