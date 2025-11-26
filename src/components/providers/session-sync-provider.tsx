"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { setGlobalAuthToken } from "@/lib/api";

/**
 * This component synchronizes the NextAuth session token with the global API token.
 * It ensures that API calls always have access to the current authentication token.
 */
export function SessionSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      // Extract token from session
      const token = (session as any)?.token || (session as any)?.accessToken;

      if (token) {
        setGlobalAuthToken(token);

        if (process.env.NODE_ENV === "development") {
          console.log("[SessionSyncProvider] Token synchronized:", {
            hasToken: !!token,
            tokenPrefix: token.substring(0, 20) + "...",
            status,
          });
        }
      } else if (process.env.NODE_ENV === "development") {
        console.warn("[SessionSyncProvider] Session is authenticated but no token found!");
      }
    } else if (status === "unauthenticated") {
      // Clear token when logged out
      setGlobalAuthToken(null);

      if (process.env.NODE_ENV === "development") {
        console.log("[SessionSyncProvider] Token cleared - user logged out");
      }
    }
  }, [session, status]);

  return <>{children}</>;
}
