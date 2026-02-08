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
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
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
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`;
}
