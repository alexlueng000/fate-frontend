"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { trackEvent } from "@/app/lib/analytics/track";

type PrimaryCtaProps = {
  entry: "hero" | "final_cta";
  href?: string;
  children: ReactNode;
  className?: string;
};

/** Primary CTA with click tracking. Static label decided by page (guest-first). */
export function PrimaryCta({ entry, href = "/analysis/start", children, className }: PrimaryCtaProps) {
  return (
    <Link
      href={href}
      className={className ?? "btn btn-primary group"}
      onClick={() =>
        trackEvent("home_primary_cta_click", {
          payload: { entry, target: href },
        })
      }
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

type SecondaryCtaProps = {
  entry: "hero" | "final_cta";
  event: string;
  href: string;
  children: ReactNode;
  className?: string;
};

/** Secondary CTA with click tracking. */
export function SecondaryCta({ entry, event, href, children, className }: SecondaryCtaProps) {
  return (
    <Link
      href={href}
      className={className ?? "btn btn-ghost group"}
      onClick={() =>
        trackEvent(event, {
          payload: { entry, target: href === "/demo" ? "demo" : href },
        })
      }
    >
      {children}
      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
