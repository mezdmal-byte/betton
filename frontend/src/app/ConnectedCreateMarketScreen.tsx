import { pendingEventIntent, submitEventIntent } from "../api/eventCreationIntent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { buildEventBody, type EventDraft } from "../api/eventsV3";
import { errorDetail } from "../api/errors";
import { guarantors } from "../api/guarantors";
import { rememberShareToken } from "../api/share";
import type { MarketOut } from "../api/types";
import type { NavId } from "../components/BottomNavigation/BottomNavigation";
import {
  CreateEventWizard,
  creationDraftKey,
} from "../screens/CreateEventWizard";
import { hapticNotification } from "../telegram/webapp";

export type ConnectedCreateMarketScreenProps = {
  onBack: () => void;
  onCreated: (market: MarketOut) => void;
  userId?: number;
  isAdmin?: boolean;
  enabled: boolean;
  onNavChange?: (id: NavId) => void;
};

export function ConnectedCreateMarketScreen({
  onBack,
  onCreated,
  userId,
  enabled,
}: ConnectedCreateMarketScreenProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const directory = useQuery({
    queryKey: ["guarantors"],
    queryFn: guarantors,
    enabled,
    refetchInterval: 15_000,
  });
  const mutation = useMutation({
    mutationFn: (draft: EventDraft | undefined) => {
      if (!userId) throw new Error("Откройте приложение через Telegram.");
      return submitEventIntent(userId, draft ? buildEventBody(draft) : undefined);
    },
    retry: false,
    onSuccess: (market) => {
      if (market.share_token) rememberShareToken(market.id, market.share_token);
      try {
        sessionStorage.removeItem(creationDraftKey(userId));
      } catch {
        /* Optional browser storage. */
      }
      void queryClient.invalidateQueries({
        queryKey: ["users", userId, "markets"],
      });
      void queryClient.invalidateQueries({ queryKey: ["markets"] });
      hapticNotification("success");
      onCreated(market);
    },
    onError: (error) => {
      setErrorMessage(errorDetail(error));
      hapticNotification("error");
    },
  });

  let pending = false;
  try { pending = !!userId && !!pendingEventIntent(userId); } catch { pending = true; }

  return (
    <>
    {pending ? <div role="status">Результат предыдущего создания события неизвестен. <button disabled={mutation.isPending} onClick={() => mutation.mutate(undefined)}>Проверить результат</button></div> : null}
    <CreateEventWizard
      key={userId ?? "guest"}
      userId={userId}
      onBack={onBack}
      onSubmit={(draft) => {
        if (!mutation.isPending) {
          setErrorMessage(null);
          mutation.mutate(draft);
        }
      }}
      submitting={mutation.isPending}
      disabled={!enabled}
      errorMessage={errorMessage}
      guarantors={(directory.data ?? []).filter((g) => g.user_id !== userId)}
      guarantorsLoading={enabled && directory.isPending}
      guarantorsError={directory.isError}
      onRetryGuarantors={() => {
        void directory.refetch();
      }}
    />
    </>
  );
}
