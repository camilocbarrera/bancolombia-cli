import { z } from "zod/v4";

export const DirectConfigSchema = z.object({
  mode: z.literal("direct"),
  accessToken: z.string(),
  cookies: z.string(),
  ip: z.string(),
  deviceId: z.string(),
  sessionTracker: z.string(),
  expiresAt: z.string(),
});

export const ApiConfigSchema = z.object({
  mode: z.literal("api"),
  token: z.string(),
  apiUrl: z.string(),
  expiresAt: z.string(),
});

export const BancolombiaConfigSchema = z.union([DirectConfigSchema, ApiConfigSchema]);

export type DirectConfig = z.infer<typeof DirectConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type BancolombiaConfig = z.infer<typeof BancolombiaConfigSchema>;
