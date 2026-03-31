import { z } from "zod/v4";

export const SessionSchema = z.object({
  bankId: z.string(),
  token: z.string(),
  expiresAt: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;
