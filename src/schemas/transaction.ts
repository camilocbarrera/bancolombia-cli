import { z } from "zod/v4";

export const TransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  bankId: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.enum(["credit", "debit"]),
  balance: z.number().optional(),
  category: z.string().optional(),
  reference: z.string().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
