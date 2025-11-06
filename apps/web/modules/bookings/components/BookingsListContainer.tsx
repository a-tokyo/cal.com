"use client";

import { useReactTable, getCoreRowModel, getSortedRowModel } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import { Dialog } from "@calcom/features/components/controlled-dialog";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import useMeQuery from "@calcom/trpc/react/hooks/useMeQuery";
import { Button } from "@calcom/ui/components/button";
import { DialogContent, DialogFooter, DialogClose } from "@calcom/ui/components/dialog";
import { TextAreaField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";

import { useFacetedUniqueValues } from "~/bookings/hooks/useFacetedUniqueValues";

import { buildFilterColumns, getFilterColumnVisibility } from "../columns/filterColumns";
import { buildListDisplayColumns } from "../columns/listColumns";
import type { RowData, BookingListingStatus } from "../types";
import { BookingsList } from "./BookingsList";

interface BookingsListContainerProps {
  status: BookingListingStatus;
  permissions: {
    canReadOthersBookings: boolean;
  };
  data: RowData[];
  isPending: boolean;
  totalRowCount?: number;
  onOpenDetails: (bookingId: number) => void;
}

export function BookingsListContainer({
  status,
  permissions,
  data,
  isPending,
  totalRowCount,
  onOpenDetails,
}: BookingsListContainerProps) {
  const { t } = useLocale();
  const user = useMeQuery().data;
  const utils = trpc.useUtils();

  const [rejectionDialogIsOpen, setRejectionDialogIsOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [pendingRejection, setPendingRejection] = useState<{
    bookingId: number;
    recurringEventId?: string | null;
  } | null>(null);

  const confirmMutation = trpc.viewer.bookings.confirm.useMutation({
    onSuccess: (data) => {
      if (data?.status === "REJECTED") {
        setRejectionDialogIsOpen(false);
        setRejectionReason("");
        setPendingRejection(null);
        showToast(t("booking_rejection_success"), "success");
      } else {
        showToast(t("booking_confirmation_success"), "success");
      }
      utils.viewer.bookings.invalidate();
      utils.viewer.me.bookingUnconfirmedCount.invalidate();
    },
    onError: () => {
      showToast(t("booking_confirmation_failed"), "error");
      utils.viewer.bookings.invalidate();
    },
  });

  const handleAccept = useCallback(
    (bookingId: number, recurringEventId?: string | null) => {
      confirmMutation.mutate({
        bookingId,
        confirmed: true,
        reason: "",
        ...(recurringEventId && { recurringEventId }),
      });
    },
    [confirmMutation]
  );

  const handleReject = useCallback((bookingId: number, recurringEventId?: string | null) => {
    setPendingRejection({ bookingId, recurringEventId });
    setRejectionDialogIsOpen(true);
  }, []);

  const handleConfirmRejection = useCallback(() => {
    if (!pendingRejection) return;

    confirmMutation.mutate({
      bookingId: pendingRejection.bookingId,
      confirmed: false,
      reason: rejectionReason,
      ...(pendingRejection.recurringEventId && { recurringEventId: pendingRejection.recurringEventId }),
    });
  }, [pendingRejection, rejectionReason, confirmMutation]);

  const columns = useMemo(() => {
    const filterCols = buildFilterColumns({ t, permissions, status });
    const listCols = buildListDisplayColumns({
      t,
      user,
      onOpenDetails,
      pendingActionHandlers: {
        onAccept: handleAccept,
        onReject: handleReject,
        isLoading: confirmMutation.isPending,
      },
    });
    return [...filterCols, ...listCols];
  }, [t, permissions, status, user, onOpenDetails, handleAccept, handleReject, confirmMutation.isPending]);

  const getFacetedUniqueValues = useFacetedUniqueValues();

  const table = useReactTable<RowData>({
    data,
    columns,
    initialState: {
      columnVisibility: getFilterColumnVisibility(),
      columnPinning: {
        right: ["actions"],
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues,
  });

  return (
    <>
      <Dialog open={rejectionDialogIsOpen} onOpenChange={setRejectionDialogIsOpen}>
        <DialogContent title={t("rejection_reason_title")} description={t("rejection_reason_description")}>
          <div>
            <TextAreaField
              name="rejectionReason"
              label={
                <>
                  {t("rejection_reason")}
                  <span className="text-subtle font-normal"> (Optional)</span>
                </>
              }
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose />
            <Button
              disabled={confirmMutation.isPending}
              data-testid="rejection-confirm"
              onClick={handleConfirmRejection}>
              {t("rejection_confirmation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BookingsList
        status={status}
        table={table}
        isPending={isPending}
        totalRowCount={totalRowCount}
        onOpenDetails={onOpenDetails}
      />
    </>
  );
}
