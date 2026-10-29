import { useContext, type CSSProperties } from "react";
import { useT } from "../../i18n";
import { cx } from "../../lib/cx";
import eventsIcon from "../../assets/navigation-events.svg";
import ticketsIcon from "../../assets/navigation-tickets.svg";
import bellIcon from "../../assets/navigation-bell.svg";
import profileIcon from "../../assets/navigation-profile.svg";
import { NotificationBadgeContext } from "./NotificationBadgeContext";
import styles from "./BottomNavigation.module.css";
import { useVisualV1 } from '../../visualV1/VisualV1Context';
import { NavigationV1 } from '../../visualV1/NavigationV1';

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
  return useVisualV1() ? <NavigationV1 active={active} onChange={onChange}/> : <LegacyBottomNavigation active={active} onChange={onChange}/>;
}
function LegacyBottomNavigation({ active, onChange }: BottomNavigationProps) {
  const t = useT();
  const unreadCount = Math.max(0, useContext(NotificationBadgeContext));
  const items = [
    { id: "markets" as const, label: t("nav.feed"), icon: eventsIcon },
    { id: "portfolio" as const, label: t("nav.mine"), icon: ticketsIcon },
    { id: "create" as const, label: t("nav.create"), icon: null },
    {
      id: "notifications" as const,
      label: t("nav.notifications"),
      icon: bellIcon,
    },
    { id: "profile" as const, label: t("nav.profile"), icon: profileIcon },
  ];
  return (
    <nav className={styles.root} aria-label={t("nav.main")}>
      {items.map(({ id, label, icon }) => (
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
              <span
                className={styles.icon}
                style={{ "--nav-icon": `url("${icon}")` } as CSSProperties}
              />
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
