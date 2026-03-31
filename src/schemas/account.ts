import { z } from "zod/v4";

export const AccountSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  number: z.string(),
  name: z.string(),
  type: z.enum(["savings", "checking", "credit_card"]),
  balance: z.number(),
  currency: z.string(),
});

export type Account = z.infer<typeof AccountSchema>;
