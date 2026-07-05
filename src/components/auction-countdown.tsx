"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function getRemaining(auctionDate: Date) {
  const diffMs = auctionDate.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

/** Static event timer only — no in-platform bidding, per PRD Non-Goals. */
export function AuctionCountdown({ auctionDate }: { auctionDate: string }) {
  const t = useTranslations("listing");
  const [remaining, setRemaining] = useState(() => getRemaining(new Date(auctionDate)));

  useEffect(() => {
    const target = new Date(auctionDate);
    const interval = setInterval(() => setRemaining(getRemaining(target)), 1000 * 30);
    return () => clearInterval(interval);
  }, [auctionDate]);

  if (!remaining) {
    return <p className="font-bold text-foreground">{t("auctionPassed")}</p>;
  }

  return (
    <div className="flex items-baseline gap-4 font-bold text-cat-auction">
      <span>{remaining.days}d</span>
      <span>{remaining.hours}h</span>
      <span>{remaining.minutes}m</span>
      <span className="font-normal text-muted">{t("untilAuction")}</span>
    </div>
  );
}
