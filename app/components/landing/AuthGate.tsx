"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, getAuthToken, useUser } from "@/app/lib/auth";
import { trackEvent } from "@/app/lib/analytics/track";
import { LOCAL_PREVIEW } from "@/app/lib/local-preview/config";

/**
 * Client-side auth gate for the landing page.
 * Runs invisibly: redirects logged-in users to /dashboard and
 * fires the home_view analytics event for visitors.
 * Static landing content stays server-rendered for SEO.
 */
export default function AuthGate() {
  const router = useRouter();
  const { user, setUser } = useUser();

  useEffect(() => {
    // Let the demo account inspect the public homepage without being redirected.
    if (LOCAL_PREVIEW) return;
    let alive = true;

    async function run() {
      if (user) {
        router.replace("/dashboard");
        return;
      }

      if (!getAuthToken()) {
        trackEvent("home_view", { payload: { entry: "landing" } });
        return;
      }

      const currentUser = await fetchMe();
      if (!alive) return;

      if (currentUser) {
        setUser(currentUser);
        router.replace("/dashboard");
        return;
      }

      trackEvent("home_view", { payload: { entry: "landing" } });
    }

    void run();

    return () => {
      alive = false;
    };
  }, [router, setUser, user]);

  return null;
}
