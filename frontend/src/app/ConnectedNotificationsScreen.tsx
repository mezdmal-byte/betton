import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/client";
import { errorDetail } from "../api/errors";
import { displayTime, type Notice } from "../api/guarantors";
import type { NavId } from "../components/BottomNavigation/BottomNavigation";
import {
  NotificationsScreen,
  type NotificationItem,
} from "../screens/NotificationsScreen";

export function ConnectedNotificationsScreen({
  userId,
  onOpen,
  onNavChange,
}: {
  userId?: number;
  onOpen: (marketId: number) => void;
  onNavChange?: (id: NavId) => void;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () =>
      apiRequest<Notice[]>("/notifications").then((result) => result.data),
    enabled: Boolean(userId),
    refetchInterval: 5000,
  });
  const read = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
      });
    },
  });
  const source = query.data ?? [];
  const items: NotificationItem[] = source.map((notice) => ({
    id: String(notice.id),
    kind: "generic",
    title: notice.text,
    metadata: displayTime(notice.created_at),
    unread: !notice.read,
    detailTitle: "Детали уведомления",
    headline: notice.text,
    headlineMeta: displayTime(notice.created_at),
    relatedTitle:
      notice.market_id != null ? `Событие #${notice.market_id}` : undefined,
    actionLabel: notice.market_id != null ? "Открыть событие" : undefined,
  }));
  const open = (item: NotificationItem) => {
    const notice = source.find((row) => String(row.id) === item.id);
    if (notice?.market_id != null) onOpen(notice.market_id);
  };
  return (
    <NotificationsScreen
      items={items}
      listState={
        !userId
          ? "unauthenticated"
          : query.isPending
            ? "loading"
            : query.isError
              ? "error"
              : "ready"
      }
      onRetry={() => {
        void query.refetch();
      }}
      onNavChange={onNavChange}
      onRead={(item) => read.mutate(item.id)}
      onOpen={(item) => open(item)}
      onAction={(item) => open(item)}
      errorMessage={read.isError ? errorDetail(read.error) : null}
    />
  );
}
