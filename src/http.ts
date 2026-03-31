import type { z } from "zod/v4";
import type { BancolombiaConfig, DirectConfig, ApiConfig } from "./schemas/config";
import { BANCOLOMBIA_BASE_URL } from "./constants";

export class BancolombiaError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isSessionExpired: boolean = false,
  ) {
    super(message);
    this.name = "BancolombiaError";
  }
}

function parseErrorBody(body: string): string {
  try {
    const json = JSON.parse(body);
    // Bancolombia error format: { errors: [{ message: "{\"title\":...,\"description\":...}" }] }
    if (json.errors?.[0]?.message) {
      try {
        const inner = JSON.parse(json.errors[0].message);
        if (inner.description) return inner.description;
        if (inner.title) return inner.title;
      } catch {
        return json.errors[0].reason || json.errors[0].message;
      }
    }
    // Proxy API error format: { error: "...", message: "..." }
    if (json.message) return json.message;
    if (json.error) return json.error;
  } catch {}
  return body.substring(0, 200);
}

function isExpiredError(body: string): boolean {
  const lower = body.toLowerCase();
  return (
    lower.includes("token inv") ||
    lower.includes("sesión") ||
    lower.includes("session expired") ||
    lower.includes("sin actividad") ||
    lower.includes("unauthorized")
  );
}

function handleErrorResponse(method: string, path: string, status: number, body: string): never {
  const message = parseErrorBody(body);
  const expired = status === 401 || isExpiredError(body);
  const hint = expired ? " Run 'bancolombia login' to reconnect." : "";
  throw new BancolombiaError(`${message}${hint}`, status, expired);
}

function bancolombiaHeaders(config: DirectConfig): Record<string, string> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}:${String(now.getMilliseconds()).padStart(3, "0")}`;

  return {
    Authorization: `Bearer ${config.accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    "message-id": crypto.randomUUID(),
    "platform-type": "web",
    "request-timestamp": ts,
    "app-version": "4.2.5",
    "device-id": config.deviceId,
    channel: "SVP",
    ip: config.ip,
    "session-tracker": config.sessionTracker,
    "device-info": '{"device":"Apple","os":"Mac OS","browser":"Chrome"}',
    Cookie: config.cookies,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };
}

function apiHeaders(config: ApiConfig): Record<string, string> {
  return {
    "content-type": "application/json",
    accept: "application/json",
    "x-bank-token": config.token,
  };
}

function resolveUrl(path: string, config: BancolombiaConfig): string {
  if (config.mode === "direct") return `${BANCOLOMBIA_BASE_URL}${path}`;
  return `${config.apiUrl}/banks/bancolombia${path}`;
}

function resolveHeaders(config: BancolombiaConfig): Record<string, string> {
  if (config.mode === "direct") return bancolombiaHeaders(config);
  return apiHeaders(config);
}

export async function get<T>(path: string, config: BancolombiaConfig, schema?: z.ZodType<T>): Promise<T> {
  const res = await fetch(resolveUrl(path, config), {
    headers: resolveHeaders(config),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    handleErrorResponse("GET", path, res.status, body);
  }
  const data = await res.json();
  if (schema) return schema.parse(data);
  return data as T;
}

export async function post<T>(
  path: string,
  body: unknown,
  config: BancolombiaConfig,
  schema?: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(resolveUrl(path, config), {
    method: "POST",
    headers: resolveHeaders(config),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    handleErrorResponse("POST", path, res.status, errorBody);
  }
  const data = await res.json();
  if (schema) return schema.parse(data);
  return data as T;
}
