"use client";

import { useQueryState } from "nuqs";
import { useEffect } from "react";

import useMediaQuery from "@calcom/lib/hooks/useMediaQuery";
import { ToggleGroup } from "@calcom/ui/components/form";
import { Icon } from "@calcom/ui/components/icon";

import { viewParser, type BookingView } from "~/bookings/lib/viewParser";

export function ViewToggleButton() {
  const [view, setView] = useQueryState(
    "view",
    viewParser.withDefault("list").withOptions({ clearOnDefault: true })
  );
  const isMobile = !useMediaQuery("(min-width: 640px)");

  useEffect(() => {
    // Force list view on mobile
    if (isMobile && view !== "list") {
      setView("list");
    }
  }, [isMobile, view, setView]);

  return (
    <div className="hidden sm:block">
      <ToggleGroup
        value={view}
        onValueChange={(value) => {
          if (!value) return;
          setView(value as BookingView);
        }}
        options={[
          {
            value: "list",
            label: "",
            iconLeft: <Icon name="menu" className="h-4 w-4" />,
          },
          {
            value: "calendar",
            label: "",
            iconLeft: <Icon name="calendar" className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  );
}
