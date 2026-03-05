interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  global_name: string | null;
}

export async function exchangeToken(code: string): Promise<string> {
  const { DISCORD_CLIENT_ID: clientId, DISCORD_CLIENT_SECRET: clientSecret } = process.env;
  if (!clientId || !clientSecret) throw new Error("Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET");

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

export async function getDiscordUser(token: string): Promise<DiscordUser> {
  if (process.env.NODE_ENV !== "production" && token.startsWith("mock-token:")) {
    const userId = token.slice("mock-token:".length);
    const suffix = userId.slice(-4);
    return {
      id: userId,
      username: `Dev-${suffix}`,
      avatar: null,
      discriminator: "0",
      global_name: `Dev-${suffix}`,
    };
  }

  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.status}`);
  }

  return response.json();
}

export function avatarUrl(userId: string, avatar: string | null): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`;
  }
  const index = parseInt(userId, 10) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${Number.isNaN(index) ? 0 : index}.png`;
}
