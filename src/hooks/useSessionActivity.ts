"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Options {
  idleTimeout?: number; // ms, default 15 menit
  checkInterval?: number; // ms, default 1 menit
}

export const useSessionActivity = ({
  idleTimeout = 15 * 60 * 1000,
  checkInterval = 60 * 1000,
}: Options = {}) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const lastActivity = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  // Track aktivitas user
  useEffect(() => {
    if (status !== "authenticated") return;

    const updateActivity = () => {
      lastActivity.current = Date.now();
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, updateActivity));

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, [status]);

  // Cek interval — extend atau logout
  useEffect(() => {
    if (status !== "authenticated") return;

    intervalRef.current = setInterval(async () => {
      const idle = Date.now() - lastActivity.current;

      if (idle >= idleTimeout) {
        // User idle terlalu lama → logout
        console.log("⏰ Session expired due to inactivity");
        clearInterval(intervalRef.current);
        await signOut({ redirect: false });
        router.push("/auth/login");
      } else {
        // User masih aktif → extend session
        console.log("✅ User active, extending session...");
        await update(); // trigger NextAuth untuk refresh JWT
      }
    }, checkInterval);

    return () => clearInterval(intervalRef.current);
  }, [status, idleTimeout, checkInterval, update, router]);
};
