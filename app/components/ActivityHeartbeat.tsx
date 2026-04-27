"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ActivityHeartbeat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let stopped = false;
    const query = searchParams.toString();
    const path = `${pathname}${query ? `?${query}` : ""}`;

    async function beat() {
      if (stopped) return;
      try {
        await fetch("/api/activity/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        });
      } catch {
        // Activity tracking must never block the interface.
      }
    }

    beat();
    const id = window.setInterval(beat, 30000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [pathname, searchParams]);

  return null;
}
