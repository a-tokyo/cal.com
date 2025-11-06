import { createColumnHelper } from "@tanstack/react-table";

import dayjs from "@calcom/dayjs";
import { isSeparatorRow } from "@calcom/features/data-table/lib/separator";
import { getPlaceholderAvatar } from "@calcom/lib/defaultAvatarImage";
import { AvatarGroup } from "@calcom/ui/components/avatar";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";

import type { RowData } from "../types";

interface PendingActionHandlers {
  onAccept: (bookingId: number, recurringEventId?: string | null) => void;
  onReject: (bookingId: number, recurringEventId?: string | null) => void;
  isLoading?: boolean;
}

interface BuildListDisplayColumnsParams {
  t: (key: string) => string;
  user?: {
    timeZone?: string;
    timeFormat?: number | null;
  } | null;
  onOpenDetails: (bookingId: number) => void;
  pendingActionHandlers?: PendingActionHandlers;
}

export function buildListDisplayColumns({
  t,
  user,
  onOpenDetails,
  pendingActionHandlers,
}: BuildListDisplayColumnsParams) {
  const columnHelper = createColumnHelper<RowData>();

  return [
    columnHelper.display({
      id: "date",
      header: () => <span className="text-subtle text-sm font-medium">{t("date")}</span>,
      cell: (props) => {
        const row = props.row.original;
        if (isSeparatorRow(row)) return null;

        return (
          <div className="text-default text-sm font-medium">
            {dayjs(row.booking.startTime).tz(user?.timeZone).format("ddd, DD MMM")}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "time",
      header: () => <span className="text-subtle text-sm font-medium">{t("time")}</span>,
      cell: (props) => {
        const row = props.row.original;
        if (isSeparatorRow(row)) return null;

        const startTime = dayjs(row.booking.startTime).tz(user?.timeZone);
        const endTime = dayjs(row.booking.endTime).tz(user?.timeZone);
        return (
          <div className="text-default text-sm font-medium">
            {startTime.format(user?.timeFormat === 12 ? "h:mma" : "HH:mm")} -{" "}
            {endTime.format(user?.timeFormat === 12 ? "h:mma" : "HH:mm")}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "event",
      header: () => <span className="text-subtle text-sm font-medium">{t("event")}</span>,
      cell: (props) => {
        const row = props.row.original;
        if (isSeparatorRow(row)) return null;

        return <div className="text-emphasis flex-1 truncate text-sm font-medium">{row.booking.title}</div>;
      },
    }),
    columnHelper.display({
      id: "who",
      header: () => <span className="text-subtle text-sm font-medium">{t("who")}</span>,
      cell: (props) => {
        const row = props.row.original;
        if (isSeparatorRow(row)) return null;

        const items = row.booking.attendees.map((attendee) => ({
          image: getPlaceholderAvatar(null, attendee.name),
          alt: attendee.name,
          title: attendee.name,
          href: null,
        }));

        return <AvatarGroup size="sm" truncateAfter={4} items={items} />;
      },
    }),
    columnHelper.display({
      id: "team",
      header: () => <span className="text-subtle text-sm font-medium">{t("team")}</span>,
      cell: (props) => {
        const row = props.row.original;
        if (isSeparatorRow(row)) return null;

        if (row.booking.eventType.team) {
          return (
            <Badge variant="gray" size="sm">
              {row.booking.eventType.team.name}
            </Badge>
          );
        }
        return null;
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: (props) => {
        const row = props.row.original;
        if (isSeparatorRow(row)) return null;

        const booking = row.booking;
        const isPending = booking.status === "PENDING";
        const isUpcoming = new Date(booking.endTime) >= new Date();
        const isCancelled = booking.status === "CANCELLED";

        // Determine if we should show pending actions
        const shouldShowPendingActions = isPending && isUpcoming && !isCancelled;

        // Determine which buttons to show based on payment status
        const hasPayment = booking.payment.length > 0;
        const isPaid = booking.paid;
        const shouldShowAccept = shouldShowPendingActions && (!hasPayment || isPaid);
        const shouldShowReject = shouldShowPendingActions;

        // Determine if this is a recurring booking for the label
        const isRecurring = booking.recurringEventId !== null;
        const isTabRecurring = row.type === "data" && row.recurringInfo !== undefined;
        const isTabUnconfirmed = booking.status === "PENDING";
        const showAllLabel = (isTabRecurring || isTabUnconfirmed) && isRecurring;

        return (
          <div className="flex w-full items-center justify-end gap-2">
            {shouldShowReject && pendingActionHandlers && (
              <Button
                color="minimal"
                size="sm"
                StartIcon="ban"
                disabled={pendingActionHandlers.isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  const recurringEventId = showAllLabel ? booking.recurringEventId : null;
                  pendingActionHandlers.onReject(booking.id, recurringEventId);
                }}>
                {showAllLabel ? t("reject_all") : t("reject")}
              </Button>
            )}
            {shouldShowAccept && pendingActionHandlers && (
              <Button
                color="secondary"
                size="sm"
                StartIcon="check"
                disabled={pendingActionHandlers.isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  const recurringEventId = showAllLabel ? booking.recurringEventId : null;
                  pendingActionHandlers.onAccept(booking.id, recurringEventId);
                }}>
                {showAllLabel ? t("confirm_all") : t("confirm")}
              </Button>
            )}
            <Button
              variant="icon"
              size="sm"
              color="secondary"
              StartIcon="ellipsis"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(row.booking.id);
              }}
            />
          </div>
        );
      },
    }),
  ];
}
