import { useState, useEffect } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { DiscordSDK as DiscordSDKType } from "@discord/embedded-app-sdk";

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string;

// Check if running inside Discord's iframe
const isDiscordEmbedded = new URLSearchParams(window.location.search).has("frame_id");

interface Auth {
  accessToken: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    global_name: string | null;
  };
}

interface UseDiscordSdkResult {
  sdk: DiscordSDKType | null;
  auth: Auth | null;
  error: string | null;
}

export function useDiscordSdk(): UseDiscordSdkResult {
  const [sdk, setSdk] = useState<DiscordSDKType | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Mock mode for browser development
      if (!isDiscordEmbedded) {
        if (cancelled) return;
        setAuth({
          accessToken: "mock-token",
          user: {
            id: "mock-user-1",
            username: "DevUser",
            avatar: null,
            global_name: "Developer",
          },
        });
        // Create a minimal mock SDK
        setSdk({ channelId: "mock-room" } as DiscordSDKType);
        return;
      }

      try {
        const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();

        const { code } = await discordSdk.commands.authorize({
          client_id: DISCORD_CLIENT_ID,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify"],
        });

        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) throw new Error("Token exchange failed");

        const { access_token } = await response.json();

        const authResult = await discordSdk.commands.authenticate({
          access_token,
        });

        if (cancelled) return;

        setSdk(discordSdk);
        setAuth({
          accessToken: access_token,
          user: authResult.user,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "SDK initialization failed");
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return { sdk, auth, error };
}
