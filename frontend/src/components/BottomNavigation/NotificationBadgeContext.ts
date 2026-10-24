import { createContext } from "react";

/** The app supplies the count from authenticated GET /notifications, never demo data. */
export const NotificationBadgeContext = createContext(0);
