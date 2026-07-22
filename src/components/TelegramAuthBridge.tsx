"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TelegramWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  colorScheme: "light" | "dark";
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/**
 * Runs only when the app is opened inside Telegram as a Mini App.
 * Exchanges Telegram's initData for our own session cookie, then
 * refreshes the page so server components see the logged-in user.
 */
export function TelegramAuthBridge() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.initData) return;

    webApp.ready();
    webApp.expand();

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: webApp.initData }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("auth failed");
        router.refresh();
      })
      .catch(() => setHasError(true));
  }, [router]);

  if (hasError) {
    return (
      <div className="bg-red-50 text-red-700 text-sm px-4 py-2 text-center">
        Не удалось авторизоваться через Telegram. Попробуйте перезапустить
        мини-приложение.
      </div>
    );
  }

  return null;
}
