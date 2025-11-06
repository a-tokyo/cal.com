"use client";

import { useMemo } from "react";

import { useBookingLocation } from "@calcom/features/bookings/hooks";
import type { BookingStatus } from "@calcom/prisma/enums";
import { bookingMetadataSchema } from "@calcom/prisma/zod-utils";
import classNames from "@calcom/ui/classNames";
import { Button } from "@calcom/ui/components/button";

interface JoinMeetingButtonProps {
  location: string | null;
  metadata?: unknown;
  bookingStatus: BookingStatus;
  t: (key: string, options?: Record<string, unknown>) => string;
  size?: "sm" | "base" | "lg";
  color?: "primary" | "secondary" | "minimal" | "destructive";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function JoinMeetingButton({
  location,
  metadata,
  bookingStatus,
  t,
  size = "sm",
  color = "secondary",
  className,
  onClick,
}: JoinMeetingButtonProps) {
  const bookingMetadata = useMemo(() => {
    const parsedMetadata = bookingMetadataSchema.safeParse(metadata ?? null);
    return parsedMetadata.success ? parsedMetadata.data : null;
  }, [metadata]);

  const { locationToDisplay, provider, isLocationURL } = useBookingLocation({
    location,
    videoCallUrl: bookingMetadata?.videoCallUrl,
    t,
    bookingStatus,
  });

  if (!isLocationURL || !locationToDisplay) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <Button
      color={color}
      size={size}
      href={locationToDisplay}
      target="_blank"
      className={classNames("flex items-center gap-2", className)}
      onClick={handleClick}>
      {provider?.iconUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={provider.iconUrl}
          className="h-4 w-4 flex-shrink-0 rounded-sm"
          alt={`${provider.label} logo`}
        />
      )}
      {provider?.label ? t("join_event_location", { eventLocationType: provider.label }) : t("join_meeting")}
    </Button>
  );
}
