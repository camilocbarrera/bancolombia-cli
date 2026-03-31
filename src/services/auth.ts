import { SessionSchema, type Session } from "../schemas/session";
import type { BancolombiaConfig } from "../schemas/config";
import { BancolombiaError } from "../http";
import { PROXY_API_URL } from "../constants";

export async function connectViaApi(
  username: string,
  password: string,
  apiUrl: string = PROXY_API_URL
): Promise<Session> {
  const res = await fetch(`${apiUrl}/banks/bancolombia/connect`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new BancolombiaError(`Login failed: ${res.status} ${body.substring(0, 200)}`, res.status);
  }
  const data = await res.json();
  return SessionSchema.parse(data);
}

export async function disconnectViaApi(config: BancolombiaConfig): Promise<void> {
  if (config.mode !== "api") return;
  await fetch(`${config.apiUrl}/banks/bancolombia/disconnect`, {
    method: "POST",
    headers: { "x-bank-token": config.token, accept: "application/json" },
  });
}
